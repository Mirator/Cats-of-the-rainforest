import { AUDIO_CONFIG } from '../config/audio.js';

export class AudioManager {
    constructor(config = AUDIO_CONFIG) {
        this.config = config;
        this.masterVolume = this.normalizeVolume(config?.volumes?.master, 1);
        this.musicVolume = this.normalizeVolume(config?.volumes?.music, 0.6);
        this.sfxVolume = this.normalizeVolume(config?.volumes?.sfx, 0.8);

        this.music = null;
        this.currentMusicKey = null;
        this.musicTrackVolume = 1;
        this.fadeRequestId = null;
        this.fadeToken = 0;
        this.musicRequestId = 0;

        this.pendingMusicKey = null;
        this.pendingMusicOptions = null;
        this.pendingSfx = [];

        this.isUnlocked = false;
        this.boundUnlockHandler = () => this.handleUnlock();

        this.ensureUnlockListener();
    }

    normalizeVolume(value, fallback) {
        const volume = typeof value === 'number' ? value : fallback;
        return Math.min(1, Math.max(0, volume));
    }

    getBaseUrl() {
        const pathname = window.location.pathname;
        let baseUrl = '/';
        if (pathname.includes('/Cats-of-the-rainforest/')) {
            baseUrl = '/Cats-of-the-rainforest/';
        } else if (pathname.startsWith('/Cats-of-the-rainforest')) {
            baseUrl = '/Cats-of-the-rainforest/';
        }
        return baseUrl;
    }

    resolvePath(path) {
        if (!path) return null;
        const baseUrl = this.getBaseUrl();
        const trimmedPath = path.startsWith('/') ? path.slice(1) : path;
        return `${baseUrl}${trimmedPath}`;
    }

    resolveMusicUrl(key) {
        const path = this.config?.music?.[key];
        return path ? this.resolvePath(path) : null;
    }

    resolveSfxUrl(key) {
        const path = this.config?.sfx?.[key];
        return path ? this.resolvePath(path) : null;
    }

    ensureUnlockListener() {
        if (this.isUnlocked) return;
        window.addEventListener('pointerdown', this.boundUnlockHandler, { once: true });
        window.addEventListener('keydown', this.boundUnlockHandler, { once: true });
    }

    handleUnlock() {
        if (this.isUnlocked) return;
        this.isUnlocked = true;
        window.removeEventListener('pointerdown', this.boundUnlockHandler);
        window.removeEventListener('keydown', this.boundUnlockHandler);
        this.resumePendingPlayback();
    }

    resumePendingPlayback() {
        if (this.pendingMusicKey) {
            const key = this.pendingMusicKey;
            const options = this.pendingMusicOptions || {};
            this.pendingMusicKey = null;
            this.pendingMusicOptions = null;
            this.playMusic(key, options);
        }

        if (this.pendingSfx.length > 0) {
            const pending = [...this.pendingSfx];
            this.pendingSfx.length = 0;
            pending.forEach(({ key, options }) => this.playSfx(key, options));
        }
    }

    applyMusicVolume() {
        if (!this.music) return;
        const volume = this.normalizeVolume(
            this.musicTrackVolume * this.musicVolume * this.masterVolume,
            1
        );
        this.music.volume = volume;
    }

    applySfxVolume(audio, volume) {
        const resolvedVolume = this.normalizeVolume(
            volume * this.sfxVolume * this.masterVolume,
            1
        );
        audio.volume = resolvedVolume;
    }

    tryPlay(audio, { onStarted, onBlocked } = {}) {
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.then === 'function') {
            playPromise
                .then(() => {
                    if (onStarted) onStarted();
                })
                .catch(() => {
                    if (onBlocked) onBlocked();
                    this.ensureUnlockListener();
                });
        } else if (onStarted) {
            onStarted();
        }
        return playPromise;
    }

    stopFade() {
        this.fadeToken += 1;
        if (this.fadeRequestId) {
            cancelAnimationFrame(this.fadeRequestId);
            this.fadeRequestId = null;
        }
    }

    crossfadeTo(oldAudio, newAudio, targetNewVolume, durationSeconds) {
        this.stopFade();
        const token = this.fadeToken + 1;
        this.fadeToken = token;
        const startTime = performance.now();
        const startOldVolume = oldAudio.volume;
        const durationMs = Math.max(0, durationSeconds) * 1000;

        const step = () => {
            if (token !== this.fadeToken) return;
            const elapsed = performance.now() - startTime;
            const t = durationMs > 0 ? Math.min(elapsed / durationMs, 1) : 1;
            oldAudio.volume = startOldVolume * (1 - t);
            newAudio.volume = targetNewVolume * t;
            if (t < 1) {
                this.fadeRequestId = requestAnimationFrame(step);
            } else {
                oldAudio.pause();
                this.fadeRequestId = null;
            }
        };

        this.fadeRequestId = requestAnimationFrame(step);
    }

    playMusic(key, { loop = true, volume = 1, restart = false, transition = true, fadeDuration = 1.5 } = {}) {
        if (!key) return;

        if (this.currentMusicKey === key && this.music) {
            this.music.loop = loop;
            this.musicTrackVolume = this.normalizeVolume(volume, 1);
            this.applyMusicVolume();
            if (restart) {
                this.music.currentTime = 0;
            }
            if (!this.music.paused) {
                return;
            }
            this.tryPlay(this.music, {
                onBlocked: () => {
                    this.pendingMusicKey = key;
                    this.pendingMusicOptions = { loop, volume, restart, transition, fadeDuration };
                }
            });
            return;
        }

        const url = this.resolveMusicUrl(key);
        if (!url) {
            console.warn(`AudioManager: missing music key "${key}"`);
            return;
        }

        const oldAudio = this.music;

        const audio = new Audio(url);
        audio.loop = loop;
        const targetVolume = this.normalizeVolume(volume, 1);
        audio.volume = 0;

        if (restart) {
            audio.currentTime = 0;
        }

        const requestId = ++this.musicRequestId;
        const playWithTransition = () => {
            if (requestId !== this.musicRequestId) {
                audio.pause();
                return;
            }
            if (oldAudio && transition) {
                const targetNewVolume = this.normalizeVolume(
                    targetVolume * this.musicVolume * this.masterVolume,
                    1
                );
                audio.volume = 0;
                this.music = audio;
                this.currentMusicKey = key;
                this.musicTrackVolume = targetVolume;
                this.crossfadeTo(oldAudio, audio, targetNewVolume, fadeDuration);
            } else {
                if (oldAudio) {
                    oldAudio.pause();
                }
                this.stopFade();
                this.music = audio;
                this.currentMusicKey = key;
                this.musicTrackVolume = targetVolume;
                this.applyMusicVolume();
            }
        };

        this.tryPlay(audio, {
            onStarted: playWithTransition,
            onBlocked: () => {
                if (requestId !== this.musicRequestId) {
                    return;
                }
                this.pendingMusicKey = key;
                this.pendingMusicOptions = { loop, volume, restart, transition, fadeDuration };
            }
        });
    }
    
    stopMusic(resetTime = true) {
        if (!this.music) return;
        this.stopFade();
        this.music.pause();
        if (resetTime) {
            this.music.currentTime = 0;
        }
        this.currentMusicKey = null;
        this.pendingMusicKey = null;
        this.pendingMusicOptions = null;
    }

    playSfx(key, { volume = 1 } = {}) {
        const url = this.resolveSfxUrl(key);
        if (!url) {
            console.warn(`AudioManager: missing sfx key "${key}"`);
            return;
        }

        const audio = new Audio(url);
        this.applySfxVolume(audio, this.normalizeVolume(volume, 1));
        this.tryPlay(audio, {
            onBlocked: () => {
                this.pendingSfx.push({ key, options: { volume } });
            }
        });

        audio.addEventListener('ended', () => {
            audio.src = '';
        });
    }

    stopAll() {
        this.stopMusic();
        this.pendingSfx.length = 0;
    }

    setMasterVolume(volume) {
        this.masterVolume = this.normalizeVolume(volume, this.masterVolume);
        this.applyMusicVolume();
    }

    setMusicVolume(volume) {
        this.musicVolume = this.normalizeVolume(volume, this.musicVolume);
        this.applyMusicVolume();
    }

    setSfxVolume(volume) {
        this.sfxVolume = this.normalizeVolume(volume, this.sfxVolume);
    }
}
