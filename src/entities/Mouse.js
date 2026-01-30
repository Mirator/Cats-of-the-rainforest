import * as THREE from 'three';
import { MouseModel } from './MouseModel.js';

export class Mouse {
    constructor(x, z) {
        this.position = new THREE.Vector3(x, 0, z);
        this.mesh = null;
        this.speed = 4.5; // Slower than player
        this.modelLoaded = false;
        this.yOffset = 0.5;
        this.isDestroyed = false;
        this.damageAmount = 5; // Damage dealt to totem on collision

        this.model = new MouseModel(this.position, {
            onModelLoaded: ({ mesh, yOffset }) => {
                this.mesh = mesh;
                this.yOffset = yOffset;
                this.modelLoaded = true;
            }
        });

        this.mesh = this.model.getMesh();
        this.model.init();
    }

    getMesh() {
        return this.mesh;
    }

    getPosition() {
        return this.position;
    }

    update(deltaTime, pathfindingSystem, totemPosition) {
        if (this.isDestroyed) return;

        // Get direction from pathfinding system
        const direction = pathfindingSystem.getDirection(this.position.x, this.position.z);
        
        // Move toward totem (direction.y is the z-component in 3D space)
        const moveSpeed = this.speed * deltaTime;
        const newX = this.position.x + direction.x * moveSpeed;
        const newZ = this.position.z + direction.y * moveSpeed;

        this.position.x = newX;
        this.position.z = newZ;

        // Update mesh position
        if (this.mesh) {
            this.mesh.position.x = this.position.x;
            this.mesh.position.y = this.position.y + this.yOffset;
            this.mesh.position.z = this.position.z;

            // Rotate mesh to face movement direction
            // direction.y is actually the z-component in 3D space
            // Match Player rotation calculation: Math.atan2(x, z) + Math.PI
            if (direction.x !== 0 || direction.y !== 0) {
                const angle = Math.atan2(direction.x, direction.y) + Math.PI;
                this.mesh.rotation.y = angle;
            }
            
            // Update animation
            if (this.model && this.model.updateAnimation) {
                this.model.updateAnimation(deltaTime, true); // Always moving when updating
            }
        }

        // Check collision with totem
        const distanceToTotem = this.position.distanceTo(totemPosition);
        if (distanceToTotem < 1.5) {
            // Reached totem - mark for destruction
            this.isDestroyed = true;
            return true; // Return true to indicate collision
        }

        return false;
    }

    destroy() {
        this.isDestroyed = true;
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
    }

    getDamageAmount() {
        return this.damageAmount;
    }
}
