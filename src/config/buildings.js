// Building configuration
export const BUILDING_CONFIG = {
    tower: {
        size: 1.5, // Collision radius
        attackRange: 7.0,
        attackDamage: 1.8,
        attackCooldown: 0.7, // seconds
        projectileSpeed: 10.0, // units per second
        projectileRadius: 0.12,
        projectileHitRadius: 0.35,
        interactionRange: 2.5,
        interactionDuration: 1.5 // seconds to assign/unassign a cat
    },
    
    catDen: {
        size: 1.5, // Collision radius
        interactionRange: 2.5,
        interactionDuration: 1.5, // seconds to spawn cat
        maxCats: 3,
        spawnCost: {
            food: 2,
            stamina: 1
        }
    },
    
    forestTotem: {
        health: 100,
        maxHealth: 100,
        influenceRadius: 15.0,
        interactionRange: 2.5,
        interactionDuration: 3.0 // seconds to start night
    }
};
