// Movement and pathfinding configuration
export const MOVEMENT_CONFIG = {
    // Pathfinding grid settings
    cellSize: 0.75, // Balance between precision and performance
    
    // Collision detection for pathfinding
    mouseRadius: 0.3, // Estimated mouse collision radius
    treeTrunkRadius: 0.4 / 2, // Half of trunk width (0.4 units)
    treeFoliageRadius: 1.2 / 2, // Half of largest foliage (1.2 units)
    // Effective collision radius: max(trunk, foliage) + mouse radius
    get treeCollisionRadius() {
        return Math.max(this.treeTrunkRadius, this.treeFoliageRadius) + this.mouseRadius; // ~0.9 units
    },
    
    // Pathfinding behavior
    waypointReachDistance: 0.5, // Distance to consider waypoint reached
    pathUpdateInterval: 1.0 // Recalculate path max once per second
};
