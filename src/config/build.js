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
            woodCost: 6,
            staminaCost: 1,
            icon: '', // No icon
            size: 1.5 // Collision radius
        }
    },
    
    // First wave discounts (applies to first building of each type)
    firstWaveDiscounts: {
        'cat-den': { wood: 1, stamina: 0 },  // Reduces from 3 to 2 wood
        'tower': { wood: 3, stamina: 0 }    // Reduces from 6 to 3 wood
    }
};
