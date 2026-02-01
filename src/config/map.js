// Map and world configuration
export const MAP_CONFIG = {
    mapSize: 90,
    get boundary() {
        return this.mapSize / 2; // 45
    },
    
    // Tree generation
    treeCount: 300,
    centerRadius: 3, // Avoid center area for totem
    
    // Cat spawn position (relative to totem)
    catSpawnRadius: {
        min: 2.25,
        max: 3.75
    },
    
    // Boundary markers
    boundaryHeight: 1.5
};
