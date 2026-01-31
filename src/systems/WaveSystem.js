import { WAVE_CONFIG } from '../config/waves.js';

export class WaveSystem {
    constructor() {
        this.currentWave = 0;
        this.isWaveActive = false;
        this.enemiesSpawned = 0;
        this.enemiesToSpawn = 0;
        this.enemiesKilled = 0;
        this.waveConfig = null;
    }

    startWave(waveNumber, miceAlert = 0) {
        this.currentWave = waveNumber;
        this.isWaveActive = true;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.waveConfig = this.getWaveConfig(waveNumber, miceAlert);
        this.enemiesToSpawn = this.waveConfig.enemyCount;
    }

    getWaveConfig(waveNumber, miceAlert = 0) {
        const baseConfigs = WAVE_CONFIG.baseWaves;
        const config = { ...baseConfigs[waveNumber] };

        // Apply miceAlert scaling (only for waves 1-4)
        if (waveNumber < 5 && miceAlert > 0) {
            // Extra enemies
            const extraEnemies = Math.min(Math.floor(miceAlert), WAVE_CONFIG.miceAlert.maxExtraEnemies);
            config.enemyCount += extraEnemies;
            
            // Spawn rate multiplier (faster spawning)
            const spawnRateMultiplier = 1 + (miceAlert * WAVE_CONFIG.miceAlert.scalingMultiplier);
            config.spawnInterval = config.spawnInterval / spawnRateMultiplier;
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
