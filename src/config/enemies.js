// Enemy configuration
export const ENEMY_CONFIG = {
    // Base Mouse stats
    mouse: {
        speed: 4.8,
        baseHP: 6,
        damageAmount: 6, // Damage dealt to totem
        playerDamage: 2,
        attackCooldown: 1.0, // seconds
        totemAttackCooldown: 1.0, // seconds
        yOffset: 0.5
    },
    
    // FastMouse stats
    fastMouse: {
        speed: 7.2
    },
    
    // StrongMouse stats
    strongMouse: {
        speed: 1.4,
        visualScale: 3.0,
        defaultHpMultiplier: 9.0,
        damageAmount: 10
    },
    
    // Shared enemy properties
    shared: {
        waypointReachDistance: 0.5,
        pathUpdateInterval: 1.0, // Recalculate path max once per second
        playerCollisionRadius: 0.8,
        totemAttackRange: 1.5 // Distance to start attacking totem
    }
};
