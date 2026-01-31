// Map and world configuration
export const MAP_CONFIG = {
    mapSize: 120,
    get boundary() {
        return this.mapSize / 2; // 60
    },
    
    // Tree generation
    treeCount: 80,
    centerRadius: 6, // Avoid center area for totem
    
    // Cat spawn position (relative to totem)
    catSpawnRadius: {
        min: 3,
        max: 5
    },
    
    // Boundary markers
    boundaryHeight: 2
};
