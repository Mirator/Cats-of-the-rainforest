// Wave system configuration
export const WAVE_CONFIG = {
    // Base wave configurations
    baseWaves: {
        1: {
            enemyCount: 5,
            hpMultiplier: 1.0,
            spawnInterval: 2.4,
            enemyTypes: [
                { type: 'regular', probability: 0.9 },
                { type: 'fast', probability: 0.1 }
            ]
        },
        2: {
            enemyCount: 9,
            hpMultiplier: 1.2,
            spawnInterval: 2.3,
            enemyTypes: [
                { type: 'regular', probability: 0.75 },
                { type: 'fast', probability: 0.25 }
            ]
        },
        3: {
            enemyCount: 12,
            hpMultiplier: 1.4,
            spawnInterval: 2.2,
            enemyTypes: [
                { type: 'regular', probability: 0.6 },
                { type: 'fast', probability: 0.35 },
                { type: 'strong', probability: 0.05 }
            ]
        },
        4: {
            enemyCount: 15,
            hpMultiplier: 1.7,
            spawnInterval: 2.1,
            enemyTypes: [
                { type: 'regular', probability: 0.45 },
                { type: 'fast', probability: 0.45 },
                { type: 'strong', probability: 0.1 }
            ]
        },
        5: {
            enemyCount: 1,
            hpMultiplier: 12.0,
            spawnInterval: 0.0, // Instant spawn for boss
            enemyTypes: [
                { type: 'strong', probability: 1.0 }
            ]
        }
    },
    
    // Wave spawn delay
    initialSpawnDelay: 1.5 // seconds before first enemy spawns
};
