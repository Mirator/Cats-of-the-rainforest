// Wave system configuration
export const WAVE_CONFIG = {
    // Base wave configurations
    baseWaves: {
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
    },
    
    // MiceAlert scaling (only for waves 1-4)
    miceAlert: {
        scalingMultiplier: 0.015,
        maxExtraEnemies: 10
    },
    
    // Wave spawn delay
    initialSpawnDelay: 2.0 // seconds before first enemy spawns
};
