import { Mouse } from './Mouse.js';
import { MouseModel } from './MouseModel.js';
import * as THREE from 'three';

export class StrongMouse extends Mouse {
    constructor(x, z, hpMultiplier = 5.0) {
        // We need to override the model creation to apply scale
        // So we'll manually create the position and other properties first
        this.position = new THREE.Vector3(x, 0, z);
        this.speed = 0.5; // Much slower than regular mouse (4.5)
        this.visualScale = 3.0; // 3x bigger visually
        this.modelLoaded = false;
        this.yOffset = 0.5;
        this.isDestroyed = false;
        this.damageAmount = 5;
        
        // HP system
        this.baseHP = 1;
        this.hpMultiplier = hpMultiplier;
        this.currentHP = this.baseHP * this.hpMultiplier;
        this.maxHP = this.currentHP;
        
        // Pathfinding state
        this.currentPath = null;
        this.currentWaypointIndex = 0;
        this.waypointReachDistance = 0.5;
        this.lastPathUpdateTime = 0;
        this.pathUpdateInterval = 1.0;

        // Create model with wrapped callback to apply scale
        this.model = new MouseModel(this.position, {
            onModelLoaded: ({ mesh, yOffset }) => {
                this.mesh = mesh;
                this.yOffset = yOffset;
                this.modelLoaded = true;
                // Apply 3x scale
                if (this.mesh) {
                    this.mesh.scale.multiplyScalar(this.visualScale);
                }
            },
            modelPath: 'mouse.glb',
            placeholderColor: 0x8b7355,
            scale: 0.5
        });

        this.mesh = this.model.getMesh();
        // Apply scale to placeholder too
        if (this.mesh) {
            this.mesh.scale.multiplyScalar(this.visualScale);
        }
        this.model.init();
    }
}
