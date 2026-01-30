import * as THREE from 'three';

export class PathfindingSystem {
    constructor(mapSystem, totemPosition, trees = []) {
        this.mapSystem = mapSystem;
        this.totemPosition = totemPosition;
        this.trees = trees;
        
        // Grid settings
        this.cellSize = 2.0; // 2 units per cell
        this.mapSize = mapSystem.getMapSize();
        this.boundary = mapSystem.getBoundary();
        
        // Grid dimensions
        this.gridWidth = Math.ceil(this.mapSize / this.cellSize);
        this.gridHeight = Math.ceil(this.mapSize / this.cellSize);
        
        // Grid data: cost field and flow field
        this.costField = []; // Cost for each cell (higher = harder to traverse)
        this.flowField = []; // Direction vectors for each cell
        this.distanceField = []; // Distance to target for each cell
        
        // Initialize grids
        this.initializeGrids();
        this.generateFlowField();
    }
    
    initializeGrids() {
        // Initialize cost and flow field arrays
        this.costField = [];
        this.flowField = [];
        this.distanceField = [];
        
        for (let y = 0; y < this.gridHeight; y++) {
            this.costField[y] = [];
            this.flowField[y] = [];
            this.distanceField[y] = [];
            
            for (let x = 0; x < this.gridWidth; x++) {
                this.costField[y][x] = 1.0; // Base cost
                this.flowField[y][x] = new THREE.Vector2(0, 0);
                this.distanceField[y][x] = Infinity;
            }
        }
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
    
    calculateCostField() {
        // Calculate cost for each cell based on trees and boundaries
        for (let z = 0; z < this.gridHeight; z++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const worldPos = this.gridToWorld(x, z);
                let cost = 1.0; // Base cost
                
                // Check distance to nearest tree
                let minTreeDistance = Infinity;
                for (const tree of this.trees) {
                    if (tree.isCut) continue; // Ignore cut trees
                    
                    const dx = worldPos.x - tree.position.x;
                    const dz = worldPos.z - tree.position.z;
                    const distance = Math.sqrt(dx * dx + dz * dz);
                    
                    if (distance < minTreeDistance) {
                        minTreeDistance = distance;
                    }
                }
                
                // Add cost based on proximity to trees
                if (minTreeDistance < 1.5) {
                    // Very close to tree - high cost
                    cost += 50.0;
                } else if (minTreeDistance < 3.0) {
                    // Close to tree - medium cost
                    cost += 20.0;
                } else if (minTreeDistance < 5.0) {
                    // Near tree - low cost
                    cost += 5.0;
                }
                
                // Add cost based on distance to boundaries
                const distToBoundary = Math.min(
                    this.boundary - Math.abs(worldPos.x),
                    this.boundary - Math.abs(worldPos.z)
                );
                
                if (distToBoundary < 5.0) {
                    // Near boundary - add cost
                    cost += 10.0 * (1.0 - distToBoundary / 5.0);
                }
                
                this.costField[z][x] = cost;
            }
        }
    }
    
    generateFlowField() {
        // First, calculate cost field
        this.calculateCostField();
        
        // Get target grid position
        const targetGrid = this.worldToGrid(this.totemPosition.x, this.totemPosition.z);
        
        // Initialize distance field with Dijkstra's algorithm
        this.distanceField = [];
        for (let z = 0; z < this.gridHeight; z++) {
            this.distanceField[z] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.distanceField[z][x] = Infinity;
            }
        }
        
        // Priority queue for Dijkstra (simple array-based)
        const queue = [{ x: targetGrid.x, z: targetGrid.z, distance: 0 }];
        this.distanceField[targetGrid.z][targetGrid.x] = 0;
        
        // Neighbor offsets (4-directional)
        const neighbors = [
            { dx: 0, dz: -1 }, // North
            { dx: 1, dz: 0 },  // East
            { dx: 0, dz: 1 },   // South
            { dx: -1, dz: 0 }  // West
        ];
        
        // Dijkstra's algorithm
        while (queue.length > 0) {
            // Sort queue by distance (simple implementation)
            queue.sort((a, b) => a.distance - b.distance);
            const current = queue.shift();
            
            // Check neighbors
            for (const neighbor of neighbors) {
                const nx = current.x + neighbor.dx;
                const nz = current.z + neighbor.dz;
                
                if (nx < 0 || nx >= this.gridWidth || nz < 0 || nz >= this.gridHeight) {
                    continue;
                }
                
                const newDistance = current.distance + this.costField[nz][nx];
                
                if (newDistance < this.distanceField[nz][nx]) {
                    this.distanceField[nz][nx] = newDistance;
                    queue.push({ x: nx, z: nz, distance: newDistance });
                }
            }
        }
        
        // Generate flow field vectors (point toward lower distance values)
        for (let z = 0; z < this.gridHeight; z++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const currentDist = this.distanceField[z][x];
                
                if (currentDist === Infinity) {
                    // Unreachable cell - point toward center
                    const worldPos = this.gridToWorld(x, z);
                    const dx = this.totemPosition.x - worldPos.x;
                    const dz = this.totemPosition.z - worldPos.z;
                    const length = Math.sqrt(dx * dx + dz * dz);
                    this.flowField[z][x] = new THREE.Vector2(
                        length > 0 ? dx / length : 0,
                        length > 0 ? dz / length : 0
                    );
                    continue;
                }
                
                // Find neighbor with lowest distance
                let bestNeighbor = null;
                let bestDistance = currentDist;
                
                for (const neighbor of neighbors) {
                    const nx = x + neighbor.dx;
                    const nz = z + neighbor.dz;
                    
                    if (nx < 0 || nx >= this.gridWidth || nz < 0 || nz >= this.gridHeight) {
                        continue;
                    }
                    
                    const neighborDist = this.distanceField[nz][nx];
                    if (neighborDist < bestDistance) {
                        bestDistance = neighborDist;
                        bestNeighbor = neighbor;
                    }
                }
                
                if (bestNeighbor) {
                    // Point toward best neighbor
                    const worldPos = this.gridToWorld(x, z);
                    const neighborWorld = this.gridToWorld(x + bestNeighbor.dx, z + bestNeighbor.dz);
                    const dx = neighborWorld.x - worldPos.x;
                    const dz = neighborWorld.z - worldPos.z;
                    const length = Math.sqrt(dx * dx + dz * dz);
                    this.flowField[z][x] = new THREE.Vector2(
                        length > 0 ? dx / length : 0,
                        length > 0 ? dz / length : 0
                    );
                } else {
                    // At target or no better neighbor - point toward target
                    const worldPos = this.gridToWorld(x, z);
                    const dx = this.totemPosition.x - worldPos.x;
                    const dz = this.totemPosition.z - worldPos.z;
                    const length = Math.sqrt(dx * dx + dz * dz);
                    this.flowField[z][x] = new THREE.Vector2(
                        length > 0 ? dx / length : 0,
                        length > 0 ? dz / length : 0
                    );
                }
            }
        }
    }
    
    getDirection(x, z) {
        // Get direction vector for a world position
        const grid = this.worldToGrid(x, z);
        const direction = this.flowField[grid.z][grid.x];
        
        // Interpolate with neighbors for smoother movement
        const worldPos = this.gridToWorld(grid.x, grid.z);
        const fx = (x - worldPos.x) / this.cellSize + 0.5; // Fraction within cell (0-1)
        const fz = (z - worldPos.z) / this.cellSize + 0.5;
        
        // Bilinear interpolation with 4 neighbors
        const x0 = Math.floor(fx);
        const x1 = Math.min(this.gridWidth - 1, x0 + 1);
        const z0 = Math.floor(fz);
        const z1 = Math.min(this.gridHeight - 1, z0 + 1);
        
        const wx = fx - x0;
        const wz = fz - z0;
        
        const d00 = this.flowField[z0][x0];
        const d10 = this.flowField[z0][x1];
        const d01 = this.flowField[z1][x0];
        const d11 = this.flowField[z1][x1];
        
        const dirX = (1 - wx) * (1 - wz) * d00.x +
                     wx * (1 - wz) * d10.x +
                     (1 - wx) * wz * d01.x +
                     wx * wz * d11.x;
        
        const dirZ = (1 - wx) * (1 - wz) * d00.y +
                     wx * (1 - wz) * d10.y +
                     (1 - wx) * wz * d01.y +
                     wx * wz * d11.y;
        
        const length = Math.sqrt(dirX * dirX + dirZ * dirZ);
        if (length > 0.001) {
            return new THREE.Vector2(dirX / length, dirZ / length);
        }
        
        return new THREE.Vector2(direction.x, direction.y);
    }
    
    update(trees, totemPosition) {
        // Update trees and totem position, then regenerate flow field
        this.trees = trees;
        this.totemPosition = totemPosition;
        this.generateFlowField();
    }
}
