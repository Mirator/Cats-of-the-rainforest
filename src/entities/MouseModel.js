import { BaseModel } from './BaseModel.js';
import { VISUAL_CONFIG } from '../config/visual.js';
import { ANIMATION_CONFIG } from '../config/animation.js';

export class MouseModel extends BaseModel {
    constructor(position, { onModelLoaded } = {}) {
        super(position, {
            onModelLoaded,
            modelPath: 'mouse.glb',
            placeholderColor: VISUAL_CONFIG.mousePlaceholderColor,
            scale: VISUAL_CONFIG.mouseScale
        });
        
        // Animation properties
        this.animationTime = 0;
        this.legMeshes = [];
    }

    onModelLoadedInternal() {
        // Find leg meshes for animation
        this.findLegMeshes();
    }
    
    findLegMeshes() {
        this.legMeshes = [];
        
        if (!this.mesh) return;
        
        this.mesh.traverse((child) => {
            const name = child.name.toLowerCase();
            
            if (name.includes('leg') || name.includes('foot') || name.includes('paw')) {
                if (child.isMesh || child.isGroup) {
                    this.legMeshes.push(child);
                }
            }
        });
        
        // Fallback: use first few children if no legs found
        if (this.legMeshes.length === 0 && this.mesh.children) {
            const children = this.mesh.children;
            for (let i = 0; i < Math.min(children.length, 4); i++) {
                const child = children[i];
                if (child.isMesh || child.isGroup) {
                    this.legMeshes.push(child);
                }
            }
        }
    }
    
    updateAnimation(deltaTime, isMoving) {
        if (!this.modelLoaded || !this.mesh) return;
        
        this.animationTime += deltaTime;
        
        if (isMoving && this.legMeshes.length >= 2) {
            const legSpeed = ANIMATION_CONFIG.mouse.legSpeed;
            const legAmplitude = ANIMATION_CONFIG.mouse.legAmplitude;
            
            for (let i = 0; i < this.legMeshes.length; i++) {
                const leg = this.legMeshes[i];
                const phase = i % 2 === 0 ? 0 : Math.PI;
                const rotation = Math.sin(this.animationTime * legSpeed * 2 * Math.PI + phase) * legAmplitude;
                
                leg.rotation.x = rotation;
            }
        } else {
            // Gradually stop animation
            this.legMeshes.forEach(leg => {
                leg.rotation.x *= ANIMATION_CONFIG.dampingFactor;
                if (Math.abs(leg.rotation.x) < ANIMATION_CONFIG.minRotationThreshold) {
                    leg.rotation.x = 0;
                }
            });
        }
    }
}
