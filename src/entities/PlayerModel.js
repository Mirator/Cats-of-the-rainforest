import * as THREE from 'three';
import { BaseModel } from './BaseModel.js';
import { VISUAL_CONFIG } from '../config/visual.js';
import { CAT_CONFIG } from '../config/cat.js';
import { ANIMATION_CONFIG } from '../config/animation.js';

export class PlayerModel extends BaseModel {
    constructor(position, { onModelLoaded } = {}) {
        super(position, {
            onModelLoaded,
            modelPath: 'cat6.glb',
            placeholderColor: VISUAL_CONFIG.playerPlaceholderColor,
            scale: VISUAL_CONFIG.playerScale
        });

        // Animation properties
        this.animationTime = 0;
        this.legMeshes = [];
        this.headMesh = null;
        this.maskMesh = null;
        this.tailMesh = null;
        this.headOriginalPosition = null;
        this.tailOriginalRotation = null;

        // Color properties
        this.bodyColor = null;
        this.legColor = null;
        this.headColor = null;
        this.maskColor = null;

        // Body color palette (cat-friendly colors - avoiding dark colors, larger and more diverse)
        this.bodyColorPalette = CAT_CONFIG.bodyColorPalette;

        // Mask color palette (distinct from body, suitable for masks)
        // Avoiding dark colors - all colors are medium to bright
        this.maskColorPalette = CAT_CONFIG.maskColorPalette;

    }

    onModelLoadedInternal() {
        // Cat-specific setup after model loads
        this.findModelParts();
        this.selectRandomColors();
        this.applyColors();
    }

    findModelParts() {
        this.legMeshes = [];
        this.headMesh = null;
        this.maskMesh = null;
        this.tailMesh = null;

        if (!this.mesh) return;

        this.mesh.traverse((child) => {
            const name = child.name.toLowerCase();

            if (name.includes('leg') || name.includes('foot') || name.includes('paw')) {
                if (child.isMesh || child.isGroup) {
                    this.legMeshes.push(child);
                }
            }

            if (name.includes('head') && !name.includes('mask')) {
                if (child.isMesh || child.isGroup) {
                    if (!this.headMesh) {
                        this.headMesh = child;
                        this.headOriginalPosition = child.position.clone();
                    }
                }
            }

            if (name.includes('mask')) {
                if (child.isMesh || child.isGroup) {
                    this.maskMesh = child;
                }
            }

            if (name.includes('tail')) {
                if (child.isMesh || child.isGroup) {
                    if (!this.tailMesh) {
                        this.tailMesh = child;
                        this.tailOriginalRotation = {
                            y: child.rotation.y,
                            z: child.rotation.z
                        };
                    }
                }
            }
        });

        if (this.legMeshes.length === 0 && this.mesh.children) {
            const children = this.mesh.children;
            for (let i = 0; i < Math.min(children.length, 6); i++) {
                const child = children[i];
                if (child.isMesh || child.isGroup) {
                    if (i < 4) {
                        this.legMeshes.push(child);
                    }
                }
            }
        }

        if (!this.headMesh && this.mesh.children) {
            let highestChild = null;
            let highestY = -Infinity;

            for (const child of this.mesh.children) {
                if (child.isMesh || child.isGroup) {
                    const box = new THREE.Box3().setFromObject(child);
                    if (box.max.y > 0.2 && box.max.y > highestY) {
                        highestY = box.max.y;
                        highestChild = child;
                    }
                }
            }

            if (highestChild) {
                this.headMesh = highestChild;
                this.headOriginalPosition = highestChild.position.clone();
            }
        }

        if (!this.tailMesh && this.mesh.children) {
            let rearMostChild = null;
            let rearMostZ = Infinity;

            for (const child of this.mesh.children) {
                if (child.isMesh || child.isGroup) {
                    if (child === this.headMesh || child === this.maskMesh ||
                        this.legMeshes.includes(child)) {
                        continue;
                    }

                    const box = new THREE.Box3().setFromObject(child);
                    const centerZ = (box.min.z + box.max.z) / 2;
                    if (centerZ < rearMostZ) {
                        rearMostZ = centerZ;
                        rearMostChild = child;
                    }
                }
            }

            if (rearMostChild) {
                const bodyBox = new THREE.Box3().setFromObject(this.mesh);
                const bodyCenterZ = (bodyBox.min.z + bodyBox.max.z) / 2;
                if (rearMostZ < bodyCenterZ - 0.1) {
                    this.tailMesh = rearMostChild;
                    this.tailOriginalRotation = {
                        y: rearMostChild.rotation.y,
                        z: rearMostChild.rotation.z
                    };
                }
            }
        }
    }

    createColorVariation(baseColor, variationAmount = 0.15) {
        const r = (baseColor >> 16) & 0xff;
        const g = (baseColor >> 8) & 0xff;
        const b = baseColor & 0xff;

        const variation = (Math.random() - 0.5) * 2 * variationAmount;
        const newR = Math.max(0, Math.min(255, Math.round(r * (1 + variation))));
        const newG = Math.max(0, Math.min(255, Math.round(g * (1 + variation))));
        const newB = Math.max(0, Math.min(255, Math.round(b * (1 + variation))));

        return (newR << 16) | (newG << 8) | newB;
    }

    selectRandomColors() {
        const bodyIndex = Math.floor(Math.random() * this.bodyColorPalette.length);
        this.bodyColor = this.bodyColorPalette[bodyIndex];

        this.legColor = this.createColorVariation(this.bodyColor, CAT_CONFIG.colorVariationAmount);

        this.headColor = this.createColorVariation(this.bodyColor, CAT_CONFIG.colorVariationAmount);
        let attempts = 0;
        while (this.headColor === this.legColor && attempts < 5) {
            this.headColor = this.createColorVariation(this.bodyColor, CAT_CONFIG.colorVariationAmount);
            attempts++;
        }

        let maskIndex;
        attempts = 0;
        do {
            maskIndex = Math.floor(Math.random() * this.maskColorPalette.length);
            this.maskColor = this.maskColorPalette[maskIndex];
            attempts++;
        } while (this.maskColor === this.bodyColor && attempts < 10);
    }

    applyColors() {
        if (!this.mesh) return;

        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                const isMask = this.maskMesh && (
                    child === this.maskMesh ||
                    (this.maskMesh.isGroup && this.maskMesh.children.includes(child)) ||
                    child.name.toLowerCase().includes('mask')
                );

                const isLeg = this.legMeshes.some(leg =>
                    child === leg ||
                    (leg.isGroup && leg.children.includes(child)) ||
                    child.name.toLowerCase().includes('leg') ||
                    child.name.toLowerCase().includes('foot') ||
                    child.name.toLowerCase().includes('paw')
                );

                const isHead = this.headMesh && (
                    child === this.headMesh ||
                    (this.headMesh.isGroup && this.headMesh.children.includes(child)) ||
                    (child.name.toLowerCase().includes('head') && !child.name.toLowerCase().includes('mask'))
                );

                let targetColor = this.bodyColor;
                if (isMask) {
                    targetColor = this.maskColor;
                } else if (isLeg) {
                    targetColor = this.legColor;
                } else if (isHead) {
                    targetColor = this.headColor;
                }

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
        });
    }

    updateAnimation(deltaTime, isMoving) {
        if (!this.modelLoaded || !this.mesh) return;

        this.animationTime += deltaTime;

        if (isMoving && this.legMeshes.length >= 2) {
            const legSpeed = CAT_CONFIG.legSpeed;
            const legAmplitude = CAT_CONFIG.legAmplitude;

            for (let i = 0; i < this.legMeshes.length; i++) {
                const leg = this.legMeshes[i];
                const phase = i % 2 === 0 ? 0 : Math.PI;
                const rotation = Math.sin(this.animationTime * legSpeed * 2 * Math.PI + phase) * legAmplitude;

                leg.rotation.x = rotation;
            }
        } else {
            this.legMeshes.forEach(leg => {
                leg.rotation.x *= ANIMATION_CONFIG.dampingFactor;
                if (Math.abs(leg.rotation.x) < ANIMATION_CONFIG.minRotationThreshold) {
                    leg.rotation.x = 0;
                }
            });
        }

        if (this.headMesh && this.headOriginalPosition) {
            const headSpeed = CAT_CONFIG.headSpeed;
            const headAmplitude = CAT_CONFIG.headAmplitude;

            this.headMesh.rotation.x = Math.sin(this.animationTime * headSpeed * 2 * Math.PI) * headAmplitude;

            const bobAmplitude = CAT_CONFIG.headBobAmplitude;
            const bobOffset = Math.sin(this.animationTime * headSpeed * 2 * Math.PI) * bobAmplitude;
            this.headMesh.position.y = this.headOriginalPosition.y + bobOffset;
        }

        if (this.tailMesh && this.tailOriginalRotation) {
            const tailSpeed = CAT_CONFIG.tailSpeed;

            const idleAmplitude = CAT_CONFIG.idleAmplitude;
            const runningAmplitude = CAT_CONFIG.runningAmplitude;
            const tailAmplitude = isMoving ? runningAmplitude : idleAmplitude;

            const tailPhase = Math.sin(this.animationTime * tailSpeed * 2 * Math.PI) * tailAmplitude;
            this.tailMesh.rotation.y = this.tailOriginalRotation.y + tailPhase;

            const zRotation = Math.sin(this.animationTime * tailSpeed * 2 * Math.PI + Math.PI / 4) * tailAmplitude * 0.5;
            this.tailMesh.rotation.z = this.tailOriginalRotation.z + zRotation;
        }
    }
    
    getMaskColor() {
        return this.maskColor;
    }
}
