import * as THREE from 'three';
import { PlayerModel } from './PlayerModel.js';

export class Player {
    constructor(x, z) {
        this.position = new THREE.Vector3(x, 0, z);
        this.mesh = null;
        this.speed = 6.5;
        this.interactionRange = 2.5;
        this.modelLoaded = false;
        this.yOffset = 0.5;

        this.model = new PlayerModel(this.position, {
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

    updateAnimation(deltaTime, isMoving) {
        this.model.updateAnimation(deltaTime, isMoving);
    }

    update(deltaTime, inputManager, mapSystem) {
        const move = inputManager.getMovementVector();
        const isMoving = move.x !== 0 || move.z !== 0;

        this.updateAnimation(deltaTime, isMoving);

        if (isMoving) {
            const moveSpeed = this.speed * deltaTime;
            const newX = this.position.x + move.x * moveSpeed;
            const newZ = this.position.z + move.z * moveSpeed;

            const clamped = mapSystem.clampPosition(newX, newZ);
            this.position.x = clamped.x;
            this.position.z = clamped.z;

            this.mesh.position.x = this.position.x;
            this.mesh.position.y = this.position.y + this.yOffset;
            this.mesh.position.z = this.position.z;

            const angle = Math.atan2(move.x, move.z) + Math.PI;
            this.mesh.rotation.y = angle;
        }
    }

    canInteractWith(tree) {
        return tree && !tree.isCut && tree.isWithinRange(this.position);
    }
}
