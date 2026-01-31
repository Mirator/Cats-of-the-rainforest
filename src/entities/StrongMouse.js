import { Mouse } from './Mouse.js';
import { MouseModel } from './MouseModel.js';
import * as THREE from 'three';
import { ENEMY_CONFIG } from '../config/enemies.js';
import { VISUAL_CONFIG } from '../config/visual.js';

export class StrongMouse extends Mouse {
    constructor(x, z, hpMultiplier = ENEMY_CONFIG.strongMouse.defaultHpMultiplier) {
        // We need to override the model creation to apply scale
        // So we'll manually create the position and other properties first
        this.position = new THREE.Vector3(x, 0, z);
        this.speed = ENEMY_CONFIG.strongMouse.speed;
        this.visualScale = ENEMY_CONFIG.strongMouse.visualScale;
        this.modelLoaded = false;
        this.yOffset = ENEMY_CONFIG.mouse.yOffset;
        this.isDestroyed = false;
        this.damageAmount = ENEMY_CONFIG.strongMouse.damageAmount;
        
        // HP system
        this.baseHP = ENEMY_CONFIG.mouse.baseHP;
        this.hpMultiplier = hpMultiplier;
        this.currentHP = this.baseHP * this.hpMultiplier;
        this.maxHP = this.currentHP;
        
        // Pathfinding state
        this.currentPath = null;
        this.currentWaypointIndex = 0;
        this.waypointReachDistance = ENEMY_CONFIG.shared.waypointReachDistance;
        this.lastPathUpdateTime = 0;
        this.pathUpdateInterval = ENEMY_CONFIG.shared.pathUpdateInterval;
        
        // Player blocking state
        this.targetPlayer = false;
        this.playerCollisionRadius = ENEMY_CONFIG.shared.playerCollisionRadius;
        this.attackCooldown = ENEMY_CONFIG.mouse.attackCooldown;
        this.lastAttackTime = 0;
        this.playerDamage = ENEMY_CONFIG.mouse.playerDamage;
        this.stopMovement = false;
        
        // Totem attack state
        this.attackingTotem = false;
        this.totemAttackCooldown = ENEMY_CONFIG.mouse.totemAttackCooldown;
        this.lastTotemAttackTime = 0;

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
