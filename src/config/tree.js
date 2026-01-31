// Tree-specific configuration
export const TREE_CONFIG = {
    // Interaction and falling
    interactionDuration: 1.5, // 1.5 seconds to cut tree
    fallDuration: 0.8, // 0.8 seconds for fall animation
    fallAngle: Math.PI / 2, // 90 degrees fall angle
    interactionRange: 2.5,
    
    // Wind animation (shared across all trees)
    windDirection: Math.PI / 4, // 45 degrees
    windSpeed: 0.8,
    swayAmplitude: 3 * (Math.PI / 180), // 3 degrees in radians
    
    // Color palettes
    trunkColors: [
        0x8b4513, // Saddle brown
        0xa0522d, // Sienna
        0x654321, // Dark brown
        0x6b4423, // Brown
        0x7b3f00, // Chocolate
        0x8b4513, // Saddle brown
        0x9c5a2a, // Light brown
        0x5d4037  // Dark brown
    ],
    
    canopyColors: [
        0x228b22, // Forest green
        0x32cd32, // Lime green
        0x2e8b57, // Sea green
        0x3cb371, // Medium sea green
        0x228b22, // Forest green
        0x2d5016, // Dark green
        0x4a7c59, // Medium green
        0x5a8a5a  // Light forest green
    ]
};
