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

    startWave(waveNumber) {
        this.currentWave = waveNumber;
        this.isWaveActive = true;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.waveConfig = this.getWaveConfig(waveNumber);
        this.enemiesToSpawn = this.waveConfig.enemyCount;
    }

    getWaveConfig(waveNumber) {
        const baseConfigs = WAVE_CONFIG.baseWaves;
        return { ...baseConfigs[waveNumber] };
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
