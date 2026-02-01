import { WAVE_CONFIG } from '../config/waves.js';

export class WaveSystem {
    constructor() {
        this.currentWave = 0;
        this.isWaveActive = false;
        this.enemiesSpawned = 0;
        this.enemiesToSpawn = 0;
        this.enemiesKilled = 0;
        this.waveConfig = null;
        this.previousNightTotemHP = null; // HP percentage from previous night (0.0 to 1.0)
        this.previousWaveDifficultyMultiplier = null; // Difficulty multiplier from previous wave
        this.gameMode = 'normal'; // 'normal' or 'endless'
    }

    setGameMode(gameMode) {
        this.gameMode = gameMode;
    }

    startWave(waveNumber) {
        this.currentWave = waveNumber;
        this.isWaveActive = true;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;

        // Calculate difficulty multiplier based on previous night's totem HP
        let difficultyMultiplier = 1.0;
        if (this.previousNightTotemHP !== null && waveNumber > 1) {
            // If previous wave had easier difficulty, force next wave to be normal
            if (this.previousWaveDifficultyMultiplier !== null && this.previousWaveDifficultyMultiplier < 1.0) {
                difficultyMultiplier = 1.0; // Normal difficulty
            } else {
                // Formula: difficultyMultiplier = 1.0 + (hpPercentage - 0.5) * 0.4
                // At 100% HP: 1.2 (+20%), At 50% HP: 1.0 (base), At 0% HP: 0.8 (-20%)
                difficultyMultiplier = 1.0 + (this.previousNightTotemHP - 0.5) * 0.4;
            }
        }

        this.waveConfig = this.getWaveConfig(waveNumber, difficultyMultiplier);
        this.enemiesToSpawn = this.waveConfig.enemyCount;

        // Store this wave's difficulty multiplier for next wave calculation
        this.previousWaveDifficultyMultiplier = difficultyMultiplier;
    }

    setPreviousNightTotemHP(hpPercentage) {
        // Clamp HP percentage between 0 and 1
        this.previousNightTotemHP = Math.max(0, Math.min(1, hpPercentage));
    }

    getWaveConfig(waveNumber, difficultyMultiplier = 1.0) {
        const baseConfigs = WAVE_CONFIG.baseWaves;

        // For endless mode waves > 5, use wave 2 as base
        let baseConfig;
        if (this.gameMode === 'endless' && waveNumber > 5) {
            // Use wave 4 (hardest normal wave) as base for endless scaling
            baseConfig = baseConfigs[4];
            if (!baseConfig) {
                return null;
            }
        } else {
            baseConfig = baseConfigs[waveNumber];
            if (!baseConfig) {
                return null;
            }
        }

        // Create a copy of the base config
        const config = { ...baseConfig };

        // For endless mode waves > 5, apply progressive scaling based on wave 2
        if (this.gameMode === 'endless' && waveNumber > 5) {
            // Progressive scaling: 15% increase per wave after wave 5
            const endlessMultiplier = 1.0 + (waveNumber - 5) * 0.15;

            // Scale enemy count: baseCount * (1 + (wave - 5) * 0.2)
            const enemyCountScale = 1 + (waveNumber - 5) * 0.2;
            config.enemyCount = Math.max(1, Math.round(baseConfig.enemyCount * enemyCountScale * difficultyMultiplier));

            // Scale HP multiplier: baseHP * (1 + (wave - 5) * 0.15)
            const hpScale = 1 + (waveNumber - 5) * 0.15;
            config.hpMultiplier = baseConfig.hpMultiplier * hpScale * difficultyMultiplier;

            // Scale spawn interval: baseInterval / (1 + (wave - 5) * 0.1) (faster spawns)
            const spawnIntervalScale = 1 + (waveNumber - 5) * 0.1;
            config.spawnInterval = baseConfig.spawnInterval / spawnIntervalScale / difficultyMultiplier;
        } else {
            // Normal mode: apply difficulty multiplier only
            // Apply difficulty multiplier to enemy count
            config.enemyCount = Math.max(1, Math.round(baseConfig.enemyCount * difficultyMultiplier));

            // Apply difficulty multiplier to HP multiplier
            config.hpMultiplier = baseConfig.hpMultiplier * difficultyMultiplier;

            // Apply inverse multiplier to spawn interval (harder = faster spawns, easier = slower spawns)
            config.spawnInterval = baseConfig.spawnInterval / difficultyMultiplier;
        }

        // Optionally adjust enemy types probabilities based on difficulty
        if (difficultyMultiplier !== 1.0 && config.enemyTypes) {
            // Count harder enemy types (fast and strong)
            const harderTypes = config.enemyTypes.filter(type => type.type === 'fast' || type.type === 'strong');
            const harderTypeCount = harderTypes.length;

            if (difficultyMultiplier > 1.0 && harderTypeCount > 0) {
                // Shift probabilities toward harder types when difficulty increases
                const shiftAmount = (difficultyMultiplier - 1.0) * 0.3; // Max 6% shift at +20% difficulty
                const shiftPerHarderType = shiftAmount / harderTypeCount;

                config.enemyTypes = config.enemyTypes.map(type => {
                    const newProb = { ...type };
                    if (type.type === 'regular') {
                        newProb.probability = Math.max(0, type.probability - shiftAmount);
                    } else if (type.type === 'fast' || type.type === 'strong') {
                        newProb.probability = type.probability + shiftPerHarderType;
                    }
                    return newProb;
                });
            } else if (difficultyMultiplier < 1.0 && harderTypeCount > 0) {
                // Shift probabilities toward easier types when difficulty decreases
                const shiftAmount = (1.0 - difficultyMultiplier) * 0.3; // Max 6% shift at -20% difficulty
                const shiftPerHarderType = shiftAmount / harderTypeCount;

                config.enemyTypes = config.enemyTypes.map(type => {
                    const newProb = { ...type };
                    if (type.type === 'regular') {
                        newProb.probability = Math.min(1, type.probability + shiftAmount);
                    } else if (type.type === 'fast' || type.type === 'strong') {
                        newProb.probability = Math.max(0, type.probability - shiftPerHarderType);
                    }
                    return newProb;
                });
            }

            // Normalize probabilities to sum to 1.0
            const totalProb = config.enemyTypes.reduce((sum, type) => sum + type.probability, 0);
            if (totalProb > 0) {
                config.enemyTypes = config.enemyTypes.map(type => ({
                    ...type,
                    probability: type.probability / totalProb
                }));
            }
        }

        return config;
    }

    onEnemySpawned() {
        this.enemiesSpawned++;
    }

    onEnemyKilled() {
        this.enemiesKilled++;
    }

    isWaveComplete() {
        return this.isWaveActive &&
            this.enemiesSpawned >= this.enemiesToSpawn &&
            this.enemiesKilled >= this.enemiesToSpawn;
    }

    getCurrentWave() {
        return this.currentWave;
    }

    hasWon() {
        // In endless mode, never win
        if (this.gameMode === 'endless') {
            return false;
        }
        return this.currentWave >= 5 && this.isWaveComplete();
    }

    getEnemiesRemaining() {
        return Math.max(0, this.enemiesToSpawn - this.enemiesKilled);
    }

    getWaveProgress() {
        if (!this.isWaveActive || this.enemiesToSpawn === 0) {
            return { spawned: 0, killed: 0, total: 0 };
        }
        return {
            spawned: this.enemiesSpawned,
            killed: this.enemiesKilled,
            total: this.enemiesToSpawn
        };
    }
}
