import * as THREE from 'three';

export class PathfindingSystem {
    constructor(mapSystem, totemPosition, trees = []) {
        this.mapSystem = mapSystem;
        this.totemPosition = totemPosition;
        this.trees = trees;
        
        // Grid settings - smaller cells for better precision
        // Mouse radius: ~0.3-0.5 units, Tree collision: ~0.8-1.0 units
        this.cellSize = 0.75; // Balance between precision and performance
        this.mapSize = mapSystem.getMapSize();
        this.boundary = mapSystem.getBoundary();
        
        // Collision detection constants
        this.mouseRadius = 0.3; // Estimated mouse collision radius
        this.treeTrunkRadius = 0.4 / 2; // Half of trunk width (0.4 units)
        this.treeFoliageRadius = 1.2 / 2; // Half of largest foliage (1.2 units)
        // Effective collision radius: max(trunk, foliage) + mouse radius
        this.treeCollisionRadius = Math.max(this.treeTrunkRadius, this.treeFoliageRadius) + this.mouseRadius; // ~0.9 units
        
        // Grid dimensions
        this.gridWidth = Math.ceil(this.mapSize / this.cellSize);
        this.gridHeight = Math.ceil(this.mapSize / this.cellSize);
        
        // Grid data: blocked cells
        this.blockedCells = new Set(); // Set of blocked cell keys "x,z"
        
        // Path cache: store paths per mouse position (with tolerance)
        this.pathCache = new Map(); // key: "x,z" -> path array
        
        // Initialize blocked cells
        this.updateBlockedCells();
    }
    
    worldToGrid(x, z) {
        // Convert world coordinates to grid coordinates
        const gridX = Math.floor((x + this.boundary) / this.cellSize);
        const gridZ = Math.floor((z + this.boundary) / this.cellSize);
        return {
            x: Math.max(0, Math.min(this.gridWidth - 1, gridX)),
            z: Math.max(0, Math.min(this.gridHeight - 1, gridZ))
        };
    }
    
    gridToWorld(gridX, gridZ) {
        // Convert grid coordinates to world coordinates (center of cell)
        const x = (gridX * this.cellSize) - this.boundary + (this.cellSize / 2);
        const z = (gridZ * this.cellSize) - this.boundary + (this.cellSize / 2);
        return { x, z };
    }
    
    getCellKey(x, z) {
        // Get string key for a grid cell
        return `${x},${z}`;
    }
    
    isCellBlocked(gridX, gridZ) {
        // Check if a cell is blocked
        return this.blockedCells.has(this.getCellKey(gridX, gridZ));
    }
    
    updateBlockedCells() {
        // Update blocked cells based on tree positions
        this.blockedCells.clear();
        
        for (let z = 0; z < this.gridHeight; z++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const worldPos = this.gridToWorld(x, z);
                
                // Check if cell is blocked by any tree
                for (const tree of this.trees) {
                    if (tree.isCut) continue;
                    
                    const dx = worldPos.x - tree.position.x;
                    const dz = worldPos.z - tree.position.z;
                    const distance = Math.sqrt(dx * dx + dz * dz);
                    
                    // Check if cell center or any corner is within collision radius
                    // For simplicity, check if cell center is within radius
                    // (cell size is small enough that this is accurate)
                    if (distance < this.treeCollisionRadius) {
                        this.blockedCells.add(this.getCellKey(x, z));
                        break;
                    }
                }
            }
        }
    }
    
    heuristic(gridX1, gridZ1, gridX2, gridZ2) {
        // Euclidean distance heuristic for A*
        const dx = gridX2 - gridX1;
        const dz = gridZ2 - gridZ1;
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    findPath(startX, startZ, targetX, targetZ) {
        // A* pathfinding algorithm
        const startGrid = this.worldToGrid(startX, startZ);
        const targetGrid = this.worldToGrid(targetX, targetZ);
        
        // Check cache first (with tolerance)
        const cacheKey = this.getCellKey(startGrid.x, startGrid.z);
        if (this.pathCache.has(cacheKey)) {
            const cachedPath = this.pathCache.get(cacheKey);
            // Verify cached path is still valid (target hasn't changed)
            if (cachedPath.length > 0) {
                const lastWaypoint = cachedPath[cachedPath.length - 1];
                const lastGrid = this.worldToGrid(lastWaypoint.x, lastWaypoint.z);
                if (lastGrid.x === targetGrid.x && lastGrid.z === targetGrid.z) {
                    return cachedPath;
                }
            }
        }
        
        // A* algorithm
        const openSet = new Set();
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        const startKey = this.getCellKey(startGrid.x, startGrid.z);
        const targetKey = this.getCellKey(targetGrid.x, targetGrid.z);
        
        // Initialize scores
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(startGrid.x, startGrid.z, targetGrid.x, targetGrid.z));
        openSet.add(startKey);
        
        // Neighbor offsets (8-directional for smoother paths)
        const neighbors = [
            { dx: 0, dz: -1, cost: 1.0 },   // North
            { dx: 1, dz: -1, cost: 1.414 }, // Northeast
            { dx: 1, dz: 0, cost: 1.0 },    // East
            { dx: 1, dz: 1, cost: 1.414 },  // Southeast
            { dx: 0, dz: 1, cost: 1.0 },    // South
            { dx: -1, dz: 1, cost: 1.414 }, // Southwest
            { dx: -1, dz: 0, cost: 1.0 },   // West
            { dx: -1, dz: -1, cost: 1.414 } // Northwest
        ];
        
        while (openSet.size > 0) {
            // Find node in openSet with lowest fScore
            let currentKey = null;
            let lowestF = Infinity;
            for (const key of openSet) {
                const f = fScore.get(key) || Infinity;
                if (f < lowestF) {
                    lowestF = f;
                    currentKey = key;
                }
            }
            
            if (currentKey === null) break;
            
            // If we reached the target, reconstruct path
            if (currentKey === targetKey) {
                const path = this.reconstructPath(cameFrom, currentKey, startGrid, targetGrid);
                // Cache the path
                this.pathCache.set(cacheKey, path);
                return path;
            }
            
            openSet.delete(currentKey);
            closedSet.add(currentKey);
            
            // Parse current position
            const [cx, cz] = currentKey.split(',').map(Number);
            
            // Check neighbors
            for (const neighbor of neighbors) {
                const nx = cx + neighbor.dx;
                const nz = cz + neighbor.dz;
                
                // Check bounds
                if (nx < 0 || nx >= this.gridWidth || nz < 0 || nz >= this.gridHeight) {
                    continue;
                }
                
                // Check if blocked
                if (this.isCellBlocked(nx, nz)) {
                    continue;
                }
                
                const neighborKey = this.getCellKey(nx, nz);
                
                // Skip if already evaluated
                if (closedSet.has(neighborKey)) {
                    continue;
                }
                
                // Calculate tentative gScore
                const currentG = gScore.get(currentKey) || Infinity;
                const tentativeG = currentG + neighbor.cost;
                
                if (!openSet.has(neighborKey)) {
                    openSet.add(neighborKey);
                } else if (tentativeG >= (gScore.get(neighborKey) || Infinity)) {
                    continue; // This is not a better path
                }
                
                // This is the best path so far
                cameFrom.set(neighborKey, currentKey);
                gScore.set(neighborKey, tentativeG);
                const h = this.heuristic(nx, nz, targetGrid.x, targetGrid.z);
                fScore.set(neighborKey, tentativeG + h);
            }
        }
        
        // No path found - return direct path as fallback
        const fallbackPath = [
            { x: startX, z: startZ },
            { x: targetX, z: targetZ }
        ];
        return fallbackPath;
    }
    
    reconstructPath(cameFrom, currentKey, startGrid, targetGrid) {
        // Reconstruct path from cameFrom map
        const path = [];
        let current = currentKey;
        
        // Build path backwards
        const waypoints = [];
        while (current) {
            const [x, z] = current.split(',').map(Number);
            const worldPos = this.gridToWorld(x, z);
            waypoints.push({ x: worldPos.x, z: worldPos.z });
            current = cameFrom.get(current);
        }
        
        // Reverse to get forward path
        waypoints.reverse();
        
        // Add start and end positions exactly
        if (waypoints.length > 0) {
            path.push({ x: this.gridToWorld(startGrid.x, startGrid.z).x, z: this.gridToWorld(startGrid.x, startGrid.z).z });
            // Add intermediate waypoints (skip first as it's the start)
            for (let i = 1; i < waypoints.length - 1; i++) {
                path.push(waypoints[i]);
            }
            path.push({ x: this.gridToWorld(targetGrid.x, targetGrid.z).x, z: this.gridToWorld(targetGrid.x, targetGrid.z).z });
        } else {
            // Fallback: direct path
            const startWorld = this.gridToWorld(startGrid.x, startGrid.z);
            const targetWorld = this.gridToWorld(targetGrid.x, targetGrid.z);
            path.push({ x: startWorld.x, z: startWorld.z });
            path.push({ x: targetWorld.x, z: targetWorld.z });
        }
        
        return path;
    }
    
    getPath(startX, startZ) {
        // Get path from start position to totem
        return this.findPath(startX, startZ, this.totemPosition.x, this.totemPosition.z);
    }
    
    clearPathCache() {
        // Clear path cache (call when trees change)
        this.pathCache.clear();
    }
    
    update(trees, totemPosition) {
        // Update trees and totem position, then recalculate blocked cells
        this.trees = trees;
        this.totemPosition = totemPosition;
        this.updateBlockedCells();
        this.clearPathCache(); // Clear cache when environment changes
    }
}
