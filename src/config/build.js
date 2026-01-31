// Build mode configuration
export const BUILD_CONFIG = {
    gridSize: 1.0,
    totemInfluenceRadius: 15.0,
    
    // Buildable items configuration
    buildItems: {
        'cat-den': {
            id: 'cat-den',
            name: 'Cat Den',
            woodCost: 3,
            staminaCost: 1,
            icon: '', // No icon
            size: 1.5 // Collision radius
        },
        'tower': {
            id: 'tower',
            name: 'Tower',
            woodCost: 5,
            staminaCost: 1,
            icon: '', // No icon
            size: 1.5 // Collision radius
        }
    }
};
