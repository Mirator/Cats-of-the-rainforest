import * as THREE from 'three';
import { BaseModel } from './BaseModel.js';
import { BUILDING_CONFIG } from '../config/buildings.js';
import { VISUAL_CONFIG } from '../config/visual.js';

export class CatDen extends BaseModel {
    constructor(x, z, y = 0) {
        const position = new THREE.Vector3(x, y, z);
        super(position, {
            modelPath: 'cat_den.glb',
            placeholderColor: VISUAL_CONFIG.catDenPlaceholderColor,
            scale: VISUAL_CONFIG.catDenScale
        });
        
        this.size = BUILDING_CONFIG.catDen.size;
        this.isBuilt = false;
        this.maxCats = BUILDING_CONFIG.catDen.maxCats;
        this.spawnedCats = 0;
        
        // Interaction state (similar to Tree)
        this.isInteracting = false;
        this.interactionProgress = 0.0; // 0.0 to 1.0
        this.interactionDuration = BUILDING_CONFIG.catDen.interactionDuration;

        // Vine animation
        this.vineMeshes = [];
        this.vineBaseRotations = [];
        this.vineAnimationTime = 0;
    }
    
    onModelLoadedInternal() {
        this.findVineMeshes();
        this.applyColors();
        this.applyFacing();
    }

    findVineMeshes() {
        this.vineMeshes = [];
        this.vineBaseRotations = [];

        if (!this.mesh) return;

        this.mesh.traverse((child) => {
            if (!child.isMesh) return;
            const name = child.name.toLowerCase();
            if (name.includes('vine')) {
                this.vineMeshes.push(child);
                this.vineBaseRotations.push(child.rotation.clone());
            }
        });
    }

    applyColors() {
        if (!this.mesh) return;

        const palette = {
            base: 0x6f4a2d,
            body: 0x8a5a36,
            roof: 0x6a3e24,
            ear: 0xb37a4a,
            vine: 0x6fbf5a
        };

        this.mesh.traverse((child) => {
            if (!child.isMesh || !child.material) return;
            const name = child.name.toLowerCase();

            let targetColor = null;
            if (name.includes('vine')) {
                targetColor = palette.vine;
            } else if (name.includes('ear')) {
                targetColor = palette.ear;
            } else if (name.includes('roof')) {
                targetColor = palette.roof;
            } else if (name.includes('body')) {
                targetColor = palette.body;
            } else if (name.includes('base')) {
                targetColor = palette.base;
            }

            if (targetColor === null) return;

            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((material, index) => {
                if (!material) return;
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
            });
        });
    }

    applyFacing() {
        if (!this.mesh) return;
        this.mesh.rotation.y = Math.PI;
    }
    
    getPosition() {
        return this.position;
    }
    
    getSize() {
        return this.size;
    }
    
    build() {
        this.isBuilt = true;
    }
    
    getIsBuilt() {
        return this.isBuilt;
    }
    
    canInteract(playerPosition, daySystem) {
        if (!this.isBuilt) return false;
        if (!daySystem || !daySystem.isDay()) return false;
        
        const distance = playerPosition.distanceTo(this.position);
        return distance <= BUILDING_CONFIG.catDen.interactionRange;
    }
    
    getSpawnCost() {
        return BUILDING_CONFIG.catDen.spawnCost;
    }

    getCatCount() {
        return this.spawnedCats;
    }

    getMaxCats() {
        return this.maxCats;
    }

    canSpawnCat() {
        return this.spawnedCats < this.maxCats;
    }

    registerSpawnedCat() {
        if (this.canSpawnCat()) {
            this.spawnedCats += 1;
        }
    }
    
    startInteraction() {
        if (!this.isBuilt) return;
        this.isInteracting = true;
        this.interactionProgress = 0.0;
    }
    
    updateInteraction(deltaTime) {
        if (!this.isInteracting || !this.isBuilt) return;
        
        this.interactionProgress += deltaTime / this.interactionDuration;
        
        if (this.interactionProgress >= 1.0) {
            this.interactionProgress = 1.0;
            this.isInteracting = false;
        }
    }
    
    stopInteraction() {
        this.isInteracting = false;
        this.interactionProgress = 0.0;
    }

    update(deltaTime, gameTime = null) {
        if (!this.modelLoaded || this.vineMeshes.length === 0) return;

        const time = gameTime !== null ? gameTime : (this.vineAnimationTime += deltaTime);
        const swaySpeed = 1.2;
        const swayAmplitude = 0.18;

        this.vineMeshes.forEach((vine, index) => {
            const baseRotation = this.vineBaseRotations[index];
            if (!baseRotation) return;

            const phase = time * swaySpeed + index * 0.9;
            const sway = Math.sin(phase) * swayAmplitude;
            const swaySecondary = Math.sin(phase * 1.35) * swayAmplitude * 0.45;

            vine.rotation.z = baseRotation.z + sway;
            vine.rotation.x = baseRotation.x + swaySecondary;
        });
    }
    
    // Override createPlaceholder to create a simple cube (50% larger)
    createPlaceholder() {
        const size = BUILDING_CONFIG.catDen.size * 2 * VISUAL_CONFIG.catDenScale;
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({ 
            color: this.placeholderColor,
            flatShading: true
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.position.y = size * 0.5; // Center the cube on the ground
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
    }
}
