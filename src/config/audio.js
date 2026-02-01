// Audio configuration for music and sound effects
export const AUDIO_CONFIG = {
    music: {
        day: 'assets/audio/day_music.wav',
        night: 'assets/audio/night_music.wav'
    },
    sfx: {
        ui_confirm: { type: 'tone', wave: 'triangle', freq: 720, freqEnd: 880, duration: 0.1, attack: 0.005, release: 0.08, volume: 0.5 },
        ui_cancel: { type: 'tone', wave: 'square', freq: 420, freqEnd: 260, duration: 0.1, attack: 0.005, release: 0.08, volume: 0.45 },
        ui_navigate: { type: 'tone', wave: 'sine', freq: 600, duration: 0.06, attack: 0.003, release: 0.05, volume: 0.35, cooldownMs: 60 },
        pause_open: { type: 'tone', wave: 'triangle', freq: 280, freqEnd: 220, duration: 0.12, attack: 0.01, release: 0.1, volume: 0.45 },
        pause_close: { type: 'tone', wave: 'triangle', freq: 220, freqEnd: 280, duration: 0.12, attack: 0.01, release: 0.1, volume: 0.45 },
        build_open: { type: 'tone', wave: 'triangle', freq: 240, freqEnd: 360, duration: 0.14, attack: 0.01, release: 0.12, volume: 0.5 },
        build_close: { type: 'tone', wave: 'triangle', freq: 360, freqEnd: 240, duration: 0.14, attack: 0.01, release: 0.12, volume: 0.5 },
        build_select: { type: 'tone', wave: 'sine', freq: 520, duration: 0.08, attack: 0.003, release: 0.06, volume: 0.45, cooldownMs: 60 },
        build_place: { type: 'noise', filter: { type: 'lowpass', frequency: 1200, Q: 0.7 }, duration: 0.14, attack: 0.005, release: 0.12, volume: 0.4 },
        build_error: { type: 'tone', wave: 'square', freq: 180, freqEnd: 140, duration: 0.16, attack: 0.005, release: 0.12, volume: 0.4 },
        build_complete: { type: 'tone', wave: 'triangle', freq: 380, freqEnd: 520, duration: 0.22, attack: 0.01, release: 0.16, volume: 0.5 },
        tree_chop: { type: 'noise', filter: { type: 'bandpass', frequency: 900, Q: 1.2 }, duration: 0.1, attack: 0.003, release: 0.08, volume: 0.35, cooldownMs: 140 },
        tree_fall: { type: 'noise', filter: { type: 'lowpass', frequency: 400, Q: 0.7 }, duration: 0.3, attack: 0.01, release: 0.22, volume: 0.35 },
        resource_gain: { type: 'tone', wave: 'sine', freq: 900, freqEnd: 1200, duration: 0.12, attack: 0.005, release: 0.08, volume: 0.45 },
        cat_spawn: { type: 'tone', wave: 'sine', freq: 700, freqEnd: 500, duration: 0.14, attack: 0.01, release: 0.1, volume: 0.4 },
        tower_assign: { type: 'tone', wave: 'triangle', freq: 500, freqEnd: 650, duration: 0.14, attack: 0.005, release: 0.1, volume: 0.45 },
        tower_unassign: { type: 'tone', wave: 'triangle', freq: 650, freqEnd: 420, duration: 0.14, attack: 0.005, release: 0.1, volume: 0.45 },
        totem_charge: { type: 'tone', wave: 'sawtooth', freq: 200, freqEnd: 300, duration: 0.22, attack: 0.02, release: 0.16, volume: 0.35, cooldownMs: 300 },
        totem_activate: { type: 'tone', wave: 'sawtooth', freq: 260, freqEnd: 520, duration: 0.3, attack: 0.02, release: 0.2, volume: 0.45 },
        day_start: { type: 'tone', wave: 'sine', freq: 520, freqEnd: 820, duration: 0.3, attack: 0.02, release: 0.2, volume: 0.5 },
        night_start: { type: 'tone', wave: 'sine', freq: 260, freqEnd: 180, duration: 0.3, attack: 0.02, release: 0.2, volume: 0.5 },
        wave_start: { type: 'tone', wave: 'square', freq: 220, freqEnd: 440, duration: 0.28, attack: 0.01, release: 0.2, volume: 0.5 },
        wave_complete: { type: 'tone', wave: 'triangle', freq: 600, freqEnd: 900, duration: 0.22, attack: 0.01, release: 0.16, volume: 0.5 },
        enemy_spawn: { type: 'noise', filter: { type: 'bandpass', frequency: 500, Q: 0.8 }, duration: 0.12, attack: 0.003, release: 0.1, volume: 0.3, cooldownMs: 120 },
        enemy_death: { type: 'noise', filter: { type: 'lowpass', frequency: 600, Q: 0.7 }, duration: 0.14, attack: 0.003, release: 0.1, volume: 0.35, cooldownMs: 100 },
        player_attack: { type: 'noise', filter: { type: 'bandpass', frequency: 1800, Q: 0.9 }, duration: 0.12, attack: 0.002, release: 0.09, volume: 0.38, cooldownMs: 90 },
        tower_fire: { type: 'tone', wave: 'triangle', freq: 520, freqEnd: 420, duration: 0.1, attack: 0.003, release: 0.08, volume: 0.35, cooldownMs: 120 },
        cat_attack: { type: 'noise', filter: { type: 'bandpass', frequency: 2200, Q: 1.1 }, duration: 0.1, attack: 0.002, release: 0.08, volume: 0.34, cooldownMs: 140 },
        totem_hit: { type: 'tone', wave: 'square', freq: 160, freqEnd: 120, duration: 0.12, attack: 0.004, release: 0.1, volume: 0.4, cooldownMs: 220 },
        game_win: { type: 'tone', wave: 'triangle', freq: 520, freqEnd: 1040, duration: 0.6, attack: 0.02, release: 0.3, volume: 0.5 },
        game_over: { type: 'noise', filter: { type: 'lowpass', frequency: 200, Q: 0.7 }, duration: 0.6, attack: 0.02, release: 0.4, volume: 0.45 }
    },
    volumes: {
        master: 1,
        music: 0.36,
        sfx: 0.8
    }
};
