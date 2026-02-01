// Build mode configuration
export const BUILD_CONFIG = {
    gridSize: 1.0,
    
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
    },
    
    // First wave discounts (applies to first building of each type)
    firstWaveDiscounts: {
        'cat-den': { wood: 2, stamina: 0 },  // Reduces from 3 to 1 wood
        'tower': { wood: 4, stamina: 0 }    // Reduces from 5 to 1 wood
    }
};
