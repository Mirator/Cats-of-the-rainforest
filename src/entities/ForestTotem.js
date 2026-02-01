import * as THREE from 'three';
import { BaseModel } from './BaseModel.js';
import { BUILDING_CONFIG } from '../config/buildings.js';
import { VISUAL_CONFIG } from '../config/visual.js';

export class ForestTotem extends BaseModel {
    constructor(x, z, y = 0) {
        const position = new THREE.Vector3(x, y, z);
        super(position, {
            modelPath: 'totem.glb',
            placeholderColor: VISUAL_CONFIG.totemPlaceholderColor,
            scale: VISUAL_CONFIG.totemScale
        });

        this.health = BUILDING_CONFIG.forestTotem.health;
        this.maxHealth = BUILDING_CONFIG.forestTotem.maxHealth;

        // Totem parts
        this.baseMesh = null;
        this.capMesh = null;
        this.earMeshes = [];
        this.markMesh = null;
        this.pillarMesh = null;

        // Flicker state
        this.flickerTime = 0;
        this.markMaterials = [];
        this.markBaseEmissive = new THREE.Color(0xa6d8e6);
        this.markBaseIntensity = 1.0;

        // Facing adjustment (tune if the front side is flipped)
        this.facingOffset = 0;
        this.facingAngle = 0;
    }

    getPosition() {
        return this.position;
    }

    onModelLoadedInternal() {
        this.findModelParts();
        this.applyColors();
        this.prepareFlickerMaterials();
        this.applyFacing();
    }

    findModelParts() {
        this.baseMesh = null;
        this.capMesh = null;
        this.earMeshes = [];
        this.markMesh = null;
        this.pillarMesh = null;

        if (!this.mesh) return;

        this.mesh.traverse((child) => {
            if (!child.isMesh) return;
            const name = child.name.toLowerCase();

            if (name === 'base' || name.includes('base')) {
                if (!this.baseMesh) this.baseMesh = child;
            } else if (name === 'cap' || name.includes('cap')) {
                if (!this.capMesh) this.capMesh = child;
            } else if (name.includes('ear')) {
                this.earMeshes.push(child);
            } else if (name === 'mark' || name.includes('mark')) {
                if (!this.markMesh) this.markMesh = child;
            } else if (name === 'pillar' || name.includes('pillar')) {
                if (!this.pillarMesh) this.pillarMesh = child;
            }
        });
    }

    applyColors() {
        if (!this.mesh) return;

        const palette = {
            base: 0x6b4a33,   // warm wood
            pillar: 0x8b5d3b, // lighter bark
            cap: 0x5a3a24,    // carved top
            ear: 0xc78a5b,    // accent wood
            mark: 0xa6d8e6    // softer rune
        };

        this.mesh.traverse((child) => {
            if (!child.isMesh || !child.material) return;
            const name = child.name.toLowerCase();

            const isBase = this.baseMesh && child === this.baseMesh;
            const isPillar = this.pillarMesh && child === this.pillarMesh;
            const isCap = this.capMesh && child === this.capMesh;
            const isEar = this.earMeshes.length > 0 && this.earMeshes.includes(child);
            const isMark = this.markMesh && child === this.markMesh;

            let targetColor = null;
            if (isMark) {
                targetColor = palette.mark;
            } else if (isCap) {
                targetColor = palette.cap;
            } else if (isEar) {
                targetColor = palette.ear;
            } else if (isBase) {
                targetColor = palette.base;
            } else if (isPillar) {
                targetColor = palette.pillar;
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

                if (isMark) {
                    materialToUse.emissive = this.markBaseEmissive.clone();
                    materialToUse.emissiveIntensity = this.markBaseIntensity;
                }
            });
        });
    }

    prepareFlickerMaterials() {
        this.markMaterials = [];
        if (!this.markMesh) return;

        const materials = Array.isArray(this.markMesh.material)
            ? this.markMesh.material
            : [this.markMesh.material];

        materials.forEach((material) => {
            if (material) {
                this.markMaterials.push(material);
            }
        });
    }

    applyFacing() {
        if (!this.mesh) return;
        this.mesh.rotation.y = this.facingAngle;
    }

    setFacingAngle(angle) {
        this.facingAngle = angle + this.facingOffset;
        this.applyFacing();
    }

    setFacingTo(targetPosition) {
        if (!targetPosition) return;
        const dx = targetPosition.x - this.position.x;
        const dz = targetPosition.z - this.position.z;
        this.facingAngle = Math.atan2(dx, dz) + this.facingOffset;
        this.applyFacing();
    }

    update(deltaTime) {
        if (!this.modelLoaded || this.markMaterials.length === 0) return;

        this.flickerTime += deltaTime;

        const pulse = Math.sin(this.flickerTime * 1.8) * 0.18 + 0.82;
        const shimmer = Math.sin(this.flickerTime * 6.0) * 0.06;
        const intensity = Math.max(0.2, this.markBaseIntensity * (pulse + shimmer));

        this.markMaterials.forEach((material) => {
            if (!material) return;
            material.emissiveIntensity = intensity;
        });
    }

    getHealth() {
        return this.health;
    }
    
    getMaxHealth() {
        return this.maxHealth;
    }
    
    getHealthPercentage() {
        return this.health / this.maxHealth;
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    isDestroyed() {
        return this.health <= 0;
    }
    
    getInfluenceRadius() {
        return BUILDING_CONFIG.forestTotem.influenceRadius;
    }
}
