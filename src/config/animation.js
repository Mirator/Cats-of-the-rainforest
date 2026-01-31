// Animation configuration
export const ANIMATION_CONFIG = {
    // Player/Cat animation speeds
    playerCat: {
        legSpeed: 2.8,
        legAmplitude: 25 * (Math.PI / 180), // 25 degrees
        headSpeed: 1.5,
        headAmplitude: 2.5 * (Math.PI / 180), // 2.5 degrees
        headBobAmplitude: 0.03,
        tailSpeed: 1.0,
        idleAmplitude: 3 * (Math.PI / 180), // 3 degrees
        runningAmplitude: 6 * (Math.PI / 180) // 6 degrees
    },
    
    // Mouse animation speeds
    mouse: {
        legSpeed: 3.0, // Slightly faster than cat for scurrying
        legAmplitude: 20 * (Math.PI / 180) // 20 degrees
    },
    
    // Animation damping
    dampingFactor: 0.9,
    minRotationThreshold: 0.01
};
