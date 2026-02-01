import * as THREE from 'three';
import { PlayerModel } from './PlayerModel.js';
import { PLAYER_CONFIG } from '../config/player.js';
import { COMBAT_CONFIG } from '../config/combat.js';

export class Player {
    constructor(x, z, y = 0) {
        this.position = new THREE.Vector3(x, y, z);
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
        this.lastFacingDirection = new THREE.Vector3(0, 0, 1); // Default forward direction (+Z, matches rotation.y=π)
        
        // Health properties
        this.maxHealth = PLAYER_CONFIG.maxHealth;
        this.currentHealth = PLAYER_CONFIG.initialHealth;
        this.collisionRadius = COMBAT_CONFIG.playerRadius;

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

    update(deltaTime, inputManager, mapSystem, collisionTargets = {}) {
        const move = inputManager.getMovementVector();
        const isMoving = move.x !== 0 || move.z !== 0;

        this.updateAnimation(deltaTime, isMoving);

        if (isMoving) {
            const moveSpeed = this.speed * deltaTime;
            const newX = this.position.x + move.x * moveSpeed;
            const newZ = this.position.z + move.z * moveSpeed;

            const clamped = mapSystem.clampPosition(newX, newZ);
            const obstacles = this.getCollisionObstacles(collisionTargets);
            const resolved = this.resolveCollisions(
                new THREE.Vector3(clamped.x, 0, clamped.z),
                obstacles,
                mapSystem
            );

            this.position.x = resolved.x;
            this.position.z = resolved.z;
            this.position.y = mapSystem ? mapSystem.getHeightAt(resolved.x, resolved.z) : this.position.y;

            this.mesh.position.x = this.position.x;
            this.mesh.position.y = this.position.y + this.yOffset;
            this.mesh.position.z = this.position.z;

            const angle = Math.atan2(move.x, move.z) + Math.PI;
            this.mesh.rotation.y = angle;
            
            // Store facing direction for attack calculations
            // In Three.js: rotation.y=0 faces -Z, rotation.y=π/2 faces -X, rotation.y=π faces +Z, rotation.y=3π/2 faces +X
            // So forward = (-sin(rotationY), 0, -cos(rotationY))
            this.lastFacingDirection.set(
                -Math.sin(angle),
                0,
                -Math.cos(angle)
            ).normalize();
        } else if (mapSystem) {
            this.position.y = mapSystem.getHeightAt(this.position.x, this.position.z);
            if (this.mesh) {
                this.mesh.position.y = this.position.y + this.yOffset;
            }
        }
    }

    getCollisionObstacles({ trees = [], buildings = [], totem = null, enemies = [], constructionSites = [] } = {}) {
        const obstacles = [];

        for (const tree of trees) {
            if (!tree || tree.isCut) continue;
            const pos = tree.getPosition ? tree.getPosition() : tree.position;
            if (!pos) continue;
            obstacles.push({
                x: pos.x,
                z: pos.z,
                radius: COMBAT_CONFIG.treeCollisionRadius
            });
        }

        if (totem) {
            const pos = totem.getPosition ? totem.getPosition() : totem.position;
            if (pos) {
                obstacles.push({
                    x: pos.x,
                    z: pos.z,
                    radius: COMBAT_CONFIG.totemCollisionRadius
                });
            }
        }

        for (const building of buildings) {
            if (!building) continue;
            if (typeof building.getIsBuilt === 'function' && !building.getIsBuilt()) continue;
            const pos = building.getPosition ? building.getPosition() : building.position;
            if (!pos) continue;
            const radius = typeof building.getSize === 'function' ? building.getSize() : building.size;
            if (!radius) continue;
            obstacles.push({ x: pos.x, z: pos.z, radius });
        }

        for (const enemy of enemies) {
            if (!enemy || enemy.isDestroyed) continue;
            const pos = enemy.getPosition ? enemy.getPosition() : enemy.position;
            if (!pos) continue;
            const radius = enemy.playerCollisionRadius || 0;
            if (!radius) continue;
            obstacles.push({ x: pos.x, z: pos.z, radius });
        }

        for (const site of constructionSites) {
            if (!site) continue;
            const pos = site.getPosition ? site.getPosition() : site.position;
            if (!pos) continue;
            const radius = site.buildItem && site.buildItem.size ? site.buildItem.size : 1.5;
            obstacles.push({ x: pos.x, z: pos.z, radius });
        }

        return obstacles;
    }

    resolveCollisions(position, obstacles, mapSystem) {
        let resolved = position.clone();
        const minDistance = 0.0001;

        for (let iteration = 0; iteration < 3; iteration++) {
            let moved = false;

            for (const obstacle of obstacles) {
                const dx = resolved.x - obstacle.x;
                const dz = resolved.z - obstacle.z;
                const distance = Math.hypot(dx, dz);
                const targetDistance = this.collisionRadius + obstacle.radius;

                if (distance < targetDistance) {
                    if (distance > minDistance) {
                        const push = targetDistance - distance;
                        resolved.x += (dx / distance) * push;
                        resolved.z += (dz / distance) * push;
                    } else {
                        resolved.x += targetDistance;
                    }
                    moved = true;
                }
            }

            const clamped = mapSystem ? mapSystem.clampPosition(resolved.x, resolved.z) : null;
            if (clamped && (clamped.x !== resolved.x || clamped.z !== resolved.z)) {
                resolved.x = clamped.x;
                resolved.z = clamped.z;
                moved = true;
            }

            if (!moved) break;
        }

        return resolved;
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
        
        // Calculate forward direction from rotation angle
        // Use stored direction if mesh rotation might be stale (when not moving)
        let playerForward;
        if (this.mesh && this.mesh.rotation.y !== undefined) {
            const rotationY = this.mesh.rotation.y;
            // Calculate forward direction directly from rotation
            // In Three.js: rotation.y=0 faces -Z, rotation.y=π/2 faces -X, rotation.y=π faces +Z, rotation.y=3π/2 faces +X
            // So forward = (-sin(rotationY), 0, -cos(rotationY))
            playerForward = new THREE.Vector3(
                -Math.sin(rotationY),
                0,
                -Math.cos(rotationY)
            ).normalize();
            // Update stored direction
            this.lastFacingDirection.copy(playerForward);
        } else {
            // Use stored direction if mesh not available or rotation is stale
            playerForward = this.lastFacingDirection.clone();
        }
        
        for (const enemy of enemies) {
            if (enemy.isDestroyed) continue;
            
            const enemyPos = enemy.getPosition();
            const distance = playerPos.distanceTo(enemyPos);
            
            // Check if enemy is within attack range
            if (distance > this.attackRange) continue;
            
            // Check if enemy is within attack arc (in front of player)
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
        
        return hitEnemies;
    }

    getClosestEnemyInRange(enemies) {
        if (!enemies || enemies.length === 0) return null;

        let closest = null;
        let closestDistance = Infinity;
        const playerPos = this.position;

        for (const enemy of enemies) {
            if (enemy.isDestroyed) continue;
            const enemyPos = enemy.getPosition();
            const distance = playerPos.distanceTo(enemyPos);
            if (distance > this.attackRange) continue;
            if (distance < closestDistance) {
                closestDistance = distance;
                closest = enemy;
            }
        }

        return closest;
    }

    facePosition(targetPosition) {
        if (!this.mesh || !targetPosition) return;
        const dx = targetPosition.x - this.position.x;
        const dz = targetPosition.z - this.position.z;
        const angle = Math.atan2(dx, dz) + Math.PI;
        this.mesh.rotation.y = angle;
    }
    
    attack(deltaTime, enemies) {
        if (!this.canAttack()) {
            return { attacked: false, hitCount: 0 };
        }

        // Check hit detection BEFORE facing enemy to prevent timing issues
        const hitEnemies = this.getEnemiesInRange(enemies);
        
        // Face the closest enemy if we hit something (for visual feedback)
        if (hitEnemies.length > 0) {
            const closestEnemy = this.getClosestEnemyInRange(enemies);
            if (closestEnemy) {
                this.facePosition(closestEnemy.getPosition());
            }
        }
        
        // Deal damage to all hit enemies
        for (const enemy of hitEnemies) {
            enemy.takeDamage(this.attackDamage);
        }
        
        // Reset cooldown
        this.lastAttackTime = Date.now() / 1000;
        return { attacked: true, hitCount: hitEnemies.length };
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

    getFacingRotationY() {
        return this.mesh ? this.mesh.rotation.y : 0;
    }

    getAttackForward() {
        if (this.lastFacingDirection && this.lastFacingDirection.lengthSq() > 0.0001) {
            return this.lastFacingDirection.clone();
        }
        if (this.mesh && this.mesh.rotation.y !== undefined) {
            const rotationY = this.mesh.rotation.y;
            return new THREE.Vector3(
                -Math.sin(rotationY),
                0,
                -Math.cos(rotationY)
            ).normalize();
        }
        return new THREE.Vector3(0, 0, -1);
    }
}
