// Enemy configuration
export const ENEMY_CONFIG = {
    // Base Mouse stats
    mouse: {
        speed: 4.5,
        baseHP: 5,
        damageAmount: 5, // Damage dealt to totem
        playerDamage: 1,
        attackCooldown: 1.0, // seconds
        totemAttackCooldown: 1.0, // seconds
        yOffset: 0.5
    },
    
    // FastMouse stats
    fastMouse: {
        speed: 6.5
    },
    
    // StrongMouse stats
    strongMouse: {
        speed: 0.5,
        visualScale: 3.0,
        defaultHpMultiplier: 5.0,
        damageAmount: 5
    },
    
    // Shared enemy properties
    shared: {
        waypointReachDistance: 0.5,
        pathUpdateInterval: 1.0, // Recalculate path max once per second
        playerCollisionRadius: 0.8,
        totemAttackRange: 1.5 // Distance to start attacking totem
    }
};
