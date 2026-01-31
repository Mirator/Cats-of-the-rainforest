import * as THREE from 'three';

export const BuildModeState = {
    INACTIVE: 'inactive',
    MENU: 'menu',
    PLACEMENT: 'placement'
};

// Constants for collision detection
const TREE_COLLISION_RADIUS = 1.0;
const TOTEM_COLLISION_RADIUS = 0.5;

export class BuildModeSystem {
    constructor() {
        this.state = BuildModeState.INACTIVE;
        this.selectedBuildItem = null;
        this.placementCursorPosition = new THREE.Vector3(0, 0, 0);
        this.gridSize = 1.0;
        this.totemInfluenceRadius = 15.0;
        
        // Buildable items configuration
        this.buildItems = {
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
        };
    }
    
    toggleBuildMode() {
        if (this.state === BuildModeState.INACTIVE) {
            this.state = BuildModeState.MENU;
            return true; // Entered build mode
        } else {
            this.exitBuildMode();
            return false; // Exited build mode
        }
    }
    
    exitBuildMode() {
        this.state = BuildModeState.INACTIVE;
        this.selectedBuildItem = null;
        this.placementCursorPosition.set(0, 0, 0);
    }
    
    isActive() {
        return this.state !== BuildModeState.INACTIVE;
    }
    
    isInMenu() {
        return this.state === BuildModeState.MENU;
    }
    
    isInPlacement() {
        return this.state === BuildModeState.PLACEMENT;
    }
    
    selectBuildItem(itemId) {
        if (!this.buildItems[itemId]) {
            return false;
        }
        
        this.selectedBuildItem = this.buildItems[itemId];
        this.state = BuildModeState.PLACEMENT;
        return true;
    }
    
    cancelPlacement() {
        if (this.state === BuildModeState.PLACEMENT) {
            this.state = BuildModeState.MENU;
            this.selectedBuildItem = null;
            this.placementCursorPosition.set(0, 0, 0);
            return true;
        }
        return false;
    }
    
    initializePlacementCursor(playerPosition) {
        if (playerPosition) {
            this.placementCursorPosition.copy(playerPosition);
            this.placementCursorPosition.y = 0;
            this.snapToGrid(this.placementCursorPosition);
        }
    }
    
    updatePlacementCursor(inputManager) {
        if (this.state !== BuildModeState.PLACEMENT) {
            return;
        }
        
        const move = { x: 0, z: 0 };
        const moveSpeed = this.gridSize;
        
        // WASD or Arrow keys
        if (inputManager.isKeyPressed('w') || inputManager.isKeyPressed('ArrowUp')) {
            move.z -= moveSpeed;
        }
        if (inputManager.isKeyPressed('s') || inputManager.isKeyPressed('ArrowDown')) {
            move.z += moveSpeed;
        }
        if (inputManager.isKeyPressed('a') || inputManager.isKeyPressed('ArrowLeft')) {
            move.x -= moveSpeed;
        }
        if (inputManager.isKeyPressed('d') || inputManager.isKeyPressed('ArrowRight')) {
            move.x += moveSpeed;
        }
        
        if (move.x !== 0 || move.z !== 0) {
            this.placementCursorPosition.x += move.x;
            this.placementCursorPosition.z += move.z;
            this.snapToGrid(this.placementCursorPosition);
        }
    }
    
    snapToGrid(position) {
        position.x = Math.round(position.x / this.gridSize) * this.gridSize;
        position.z = Math.round(position.z / this.gridSize) * this.gridSize;
    }
    
    getPlacementCursorPosition() {
        return this.placementCursorPosition.clone();
    }
    
    getSelectedBuildItem() {
        return this.selectedBuildItem;
    }
    
    getBuildItems() {
        return this.buildItems;
    }
    
    isWithinTotemInfluence(x, z, totemPosition) {
        if (!totemPosition) return false;
        
        const dx = x - totemPosition.x;
        const dz = z - totemPosition.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        return distance <= this.totemInfluenceRadius;
    }
    
    validatePlacement(x, z, daySystem, resourceSystem, trees, buildings, totem, mapSystem) {
        // Check if build mode is active
        if (!this.isActive()) {
            return { valid: false, reason: 'Build mode not active' };
        }
        
        // Check if current phase is Day
        if (!daySystem || !daySystem.isDay()) {
            return { valid: false, reason: 'Can only build during day' };
        }
        
        if (!this.selectedBuildItem) {
            return { valid: false, reason: 'No build item selected' };
        }
        
        // Check resources
        if (!resourceSystem.canAffordWood(this.selectedBuildItem.woodCost)) {
            return { valid: false, reason: 'Insufficient wood' };
        }
        
        if (!daySystem.hasStamina() || daySystem.getStamina() < this.selectedBuildItem.staminaCost) {
            return { valid: false, reason: 'Insufficient stamina' };
        }
        
        // Check if within map boundaries
        if (mapSystem && !mapSystem.isWithinBounds(x, z)) {
            return { valid: false, reason: 'Outside map boundaries' };
        }
        
        // Check if within totem influence radius
        const totemPos = totem ? totem.getPosition() : null;
        if (!this.isWithinTotemInfluence(x, z, totemPos)) {
            return { valid: false, reason: 'Outside totem influence radius' };
        }
        
        // Check collision with trees
        const buildRadius = this.selectedBuildItem.size || 1.5;
        for (const tree of trees) {
            if (tree.isCut) continue;
            
            const treePos = tree.getPosition();
            const dx = x - treePos.x;
            const dz = z - treePos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Tree collision radius
            if (distance < buildRadius + TREE_COLLISION_RADIUS) {
                return { valid: false, reason: 'Overlaps with tree' };
            }
        }
        
        // Check collision with existing buildings
        for (const building of buildings) {
            const buildingPos = building.getPosition();
            const dx = x - buildingPos.x;
            const dz = z - buildingPos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            const buildingRadius = building.getSize ? building.getSize() : 1.5;
            if (distance < buildRadius + buildingRadius) {
                return { valid: false, reason: 'Overlaps with building' };
            }
        }
        
        // Check collision with Forest Totem
        if (totem) {
            const totemPos = totem.getPosition();
            const dx = x - totemPos.x;
            const dz = z - totemPos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < buildRadius + TOTEM_COLLISION_RADIUS) {
                return { valid: false, reason: 'Overlaps with Forest Totem' };
            }
        }
        
        return { valid: true, reason: '' };
    }
    
    canAffordBuildItem(itemId, daySystem, resourceSystem) {
        const item = this.buildItems[itemId];
        if (!item) return false;
        
        const hasWood = resourceSystem.canAffordWood(item.woodCost);
        const hasStamina = daySystem.hasStamina() && daySystem.getStamina() >= item.staminaCost;
        
        return hasWood && hasStamina;
    }
    
    getTotemInfluenceRadius() {
        return this.totemInfluenceRadius;
    }
}
