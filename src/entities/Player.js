import * as THREE from 'three';
import { PlayerModel } from './PlayerModel.js';
import { PLAYER_CONFIG } from '../config/player.js';

export class Player {
    constructor(x, z) {
        this.position = new THREE.Vector3(x, 0, z);
        this.mesh = null;
        this.speed = PLAYER_CONFIG.speed;
        this.interactionRange = PLAYER_CONFIG.interactionRange;
        this.modelLoaded = false;
        this.yOffset = PLAYER_CONFIG.yOffset;
        
        // Combat properties
        this.attackRange = PLAYER_CONFIG.attackRange;
        this.attackDamage = PLAYER_CONFIG.attackDamage;
        this.attackCooldown = PLAYER_CONFIG.attackCooldown;
        this.lastAttackTime = 0;
        this.attackArc = PLAYER_CONFIG.attackArc;
        
        // Health properties
        this.maxHealth = PLAYER_CONFIG.maxHealth;
        this.currentHealth = PLAYER_CONFIG.initialHealth;

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
    
    canAttack() {
        const currentTime = Date.now() / 1000;
        const timeSinceLastAttack = currentTime - this.lastAttackTime;
        return timeSinceLastAttack >= this.attackCooldown;
    }
    
    getEnemiesInRange(enemies) {
        if (!enemies || enemies.length === 0) return [];
        
        const hitEnemies = [];
        const playerPos = this.position;
        
        for (const enemy of enemies) {
            if (enemy.isDestroyed) continue;
            
            const enemyPos = enemy.getPosition();
            const distance = playerPos.distanceTo(enemyPos);
            
            // Check if enemy is within attack range
            if (distance > this.attackRange) continue;
            
            // Check if enemy is within attack arc (in front of player)
            if (this.mesh) {
                const playerForward = new THREE.Vector3(
                    Math.sin(this.mesh.rotation.y),
                    0,
                    Math.cos(this.mesh.rotation.y)
                );
                
                const toEnemy = new THREE.Vector3(
                    enemyPos.x - playerPos.x,
                    0,
                    enemyPos.z - playerPos.z
                ).normalize();
                
                const dot = playerForward.dot(toEnemy);
                const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
                
                // Check if within attack arc (half arc on each side)
                if (angle <= this.attackArc / 2) {
                    hitEnemies.push(enemy);
                }
            }
        }
        
        return hitEnemies;
    }
    
    attack(deltaTime, enemies) {
        if (!this.canAttack()) {
            return false;
        }
        
        const hitEnemies = this.getEnemiesInRange(enemies);
        
        if (hitEnemies.length > 0) {
            // Deal damage to all hit enemies
            for (const enemy of hitEnemies) {
                enemy.takeDamage(this.attackDamage);
            }
            
            // Reset cooldown
            this.lastAttackTime = Date.now() / 1000;
            return true;
        }
        
        return false;
    }
    
    takeDamage(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        return this.isDead();
    }
    
    isDead() {
        return this.currentHealth <= 0;
    }
    
    getHealth() {
        return this.currentHealth;
    }
    
    getMaxHealth() {
        return this.maxHealth;
    }
    
    getMaskColor() {
        return this.model ? this.model.getMaskColor() : null;
    }
}
