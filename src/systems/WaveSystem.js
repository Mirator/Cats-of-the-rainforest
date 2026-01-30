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
        // Base wave configurations
        const baseConfigs = {
            1: {
                enemyCount: 8,
                hpMultiplier: 1.0,
                spawnInterval: 5.0,
                enemyTypes: [
                    { type: 'regular', probability: 1.0 }
                ]
            },
            2: {
                enemyCount: 18,
                hpMultiplier: 1.2,
                spawnInterval: 8.0,
                enemyTypes: [
                    { type: 'regular', probability: 1.0 }
                ]
            },
            3: {
                enemyCount: 25,
                hpMultiplier: 1.4,
                spawnInterval: 6.0,
                enemyTypes: [
                    { type: 'regular', probability: 0.7 },
                    { type: 'fast', probability: 0.3 }
                ]
            },
            4: {
                enemyCount: 35,
                hpMultiplier: 1.6,
                spawnInterval: 5.0,
                enemyTypes: [
                    { type: 'regular', probability: 0.6 },
                    { type: 'fast', probability: 0.4 }
                ]
            },
            5: {
                enemyCount: 1,
                hpMultiplier: 5.0,
                spawnInterval: 0.0, // Instant spawn for boss
                enemyTypes: [
                    { type: 'strong', probability: 1.0 }
                ]
            }
        };

        const config = { ...baseConfigs[waveNumber] };

        // Apply miceAlert scaling (only for waves 1-4)
        if (waveNumber < 5 && miceAlert > 0) {
            // Extra enemies
            config.enemyCount += Math.floor(miceAlert);
            
            // Spawn rate multiplier (faster spawning)
            const spawnRateMultiplier = 1 + (miceAlert * 0.015);
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
