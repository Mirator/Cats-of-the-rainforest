// Building configuration
export const BUILDING_CONFIG = {
    tower: {
        size: 1.5, // Collision radius
        attackRange: 8.0,
        attackDamage: 2,
        attackCooldown: 1.5, // seconds
        interactionRange: 2.5,
        interactionDuration: 1.5 // seconds to assign/unassign a cat
    },
    
    catDen: {
        size: 1.5, // Collision radius
        interactionRange: 2.5,
        interactionDuration: 1.5, // seconds to spawn cat
        spawnCost: {
            food: 1,
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
