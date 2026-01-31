import * as THREE from 'three';
import { BaseModel } from './BaseModel.js';

// Shared wind properties for all trees (synchronized direction)
const WIND_DIRECTION = Math.PI / 4; // 45 degrees - same for all trees
const WIND_SPEED = 0.8; // Wind animation speed
const TREE_SWAY_AMPLITUDE = 3 * (Math.PI / 180); // 3 degrees in radians

// Tree color palettes
const TRUNK_COLORS = [
    0x8b4513, // Saddle brown
    0xa0522d, // Sienna
    0x654321, // Dark brown
    0x6b4423, // Brown
    0x7b3f00, // Chocolate
    0x8b4513, // Saddle brown
    0x9c5a2a, // Light brown
    0x5d4037  // Dark brown
];

const CANOPY_COLORS = [
    0x228b22, // Forest green
    0x32cd32, // Lime green
    0x2e8b57, // Sea green
    0x3cb371, // Medium sea green
    0x228b22, // Forest green
    0x2d5016, // Dark green
    0x4a7c59, // Medium green
    0x5a8a5a  // Light forest green
];

export class Tree extends BaseModel {
    constructor(x, z) {
        const position = new THREE.Vector3(x, 0, z);
        super(position, {
            modelPath: 'tree.glb',
            placeholderColor: 0x228b22, // Green placeholder
            scale: 0.5
        });
        
        this.isCut = false;
        this.interactionRange = 2.5;
        
        // Model parts for color application
        this.trunkMesh = null;
        this.canopyMainMesh = null;
        this.canopySecondaryMesh = null;
        
        // Tree colors (randomized per tree)
        this.trunkColor = TRUNK_COLORS[Math.floor(Math.random() * TRUNK_COLORS.length)];
        this.canopyColor = CANOPY_COLORS[Math.floor(Math.random() * CANOPY_COLORS.length)];
    }
    
    onModelLoadedInternal() {
        // Find model parts: trunk, canopy_main, canopy_secondary
        if (!this.mesh) return;
        
        this.mesh.traverse((child) => {
            if (child.isMesh) {
                const name = child.name.toLowerCase();
                
                // Check for exact matches first, then partial matches
                if (name === 'trunk' || name.includes('trunk')) {
                    if (!this.trunkMesh) {
                        this.trunkMesh = child;
                    }
                } else if (name === 'canopy_main' || name === 'canopy-main' || 
                          name.includes('canopy_main') || name.includes('canopy-main')) {
                    if (!this.canopyMainMesh) {
                        this.canopyMainMesh = child;
                    }
                } else if (name === 'canopy_secondary' || name === 'canopy-secondary' || 
                          name.includes('canopy_secondary') || name.includes('canopy-secondary')) {
                    if (!this.canopySecondaryMesh) {
                        this.canopySecondaryMesh = child;
                    }
                }
            }
        });
        
        // Apply colors after finding parts
        this.applyColors();
    }
    
    applyColors() {
        if (!this.mesh) return;
        
        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                const name = child.name.toLowerCase();
                
                // Determine which part this is
                const isTrunk = this.trunkMesh && (
                    child === this.trunkMesh ||
                    name.includes('trunk')
                );
                
                const isCanopy = (this.canopyMainMesh && child === this.canopyMainMesh) ||
                                (this.canopySecondaryMesh && child === this.canopySecondaryMesh) ||
                                name.includes('canopy');
                
                let targetColor = null;
                if (isTrunk) {
                    targetColor = this.trunkColor;
                } else if (isCanopy) {
                    targetColor = this.canopyColor;
                }
                
                if (targetColor !== null) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    
                    materials.forEach((material, index) => {
                        if (material) {
                            let materialToUse = material;
                            
                            if (!material.userData.isCloned) {
                                const clonedMaterial = material.clone();
                                clonedMaterial.userData.isCloned = true;
                                materialToUse = clonedMaterial;
                                
                                if (Array.isArray(child.material)) {
                                    child.material[index] = clonedMaterial;
                                } else {
                                    child.material = clonedMaterial;
                                }
                            }
                            
                            if (materialToUse.color) {
                                materialToUse.color.setHex(targetColor);
                            }
                        }
                    });
                }
            }
        });
    }
    
    update(deltaTime, gameTime) {
        if (!this.modelLoaded || !this.mesh) return;
        
        // Use game time for synchronized wind (all trees sway in same direction)
        const windTime = gameTime * WIND_SPEED;
        
        // Rotate entire tree around its base (trunk base) in the wind direction
        // The tree rotates as a whole, pivoting at the base
        const swayX = Math.sin(windTime) * TREE_SWAY_AMPLITUDE * Math.sin(WIND_DIRECTION);
        const swayZ = Math.sin(windTime) * TREE_SWAY_AMPLITUDE * Math.cos(WIND_DIRECTION);
        
        // Apply rotation to the entire mesh (rotates around Y axis at base)
        // We rotate around X and Z axes to create the sway effect
        this.mesh.rotation.x = swayX;
        this.mesh.rotation.z = swayZ;
    }
    
    getPosition() {
        return this.position;
    }
    
    isWithinRange(playerPosition) {
        const distance = this.position.distanceTo(playerPosition);
        return distance <= this.interactionRange;
    }
    
    cut() {
        if (!this.isCut) {
            this.isCut = true;
            return true;
        }
        return false;
    }
    
    remove() {
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
    }
}
