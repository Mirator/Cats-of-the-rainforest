import * as THREE from 'three';
import { MouseModel } from './MouseModel.js';

export class Mouse {
    constructor(x, z, hpMultiplier = 1.0) {
        this.position = new THREE.Vector3(x, 0, z);
        this.mesh = null;
        this.speed = 4.5; // Slower than player
        this.modelLoaded = false;
        this.yOffset = 0.5;
        this.isDestroyed = false;
        this.damageAmount = 5; // Damage dealt to totem on collision
        
        // HP system
        this.baseHP = 1;
        this.hpMultiplier = hpMultiplier;
        this.currentHP = this.baseHP * this.hpMultiplier;
        this.maxHP = this.currentHP;
        
        // Pathfinding state
        this.currentPath = null;
        this.currentWaypointIndex = 0;
        this.waypointReachDistance = 0.5; // Distance to consider waypoint reached
        this.lastPathUpdateTime = 0;
        this.pathUpdateInterval = 1.0; // Recalculate path max once per second
        
        // Player blocking state
        this.targetPlayer = false;
        this.playerCollisionRadius = 0.8;
        this.attackCooldown = 1.0; // seconds
        this.lastAttackTime = 0;
        this.playerDamage = 1;
        this.stopMovement = false;
        
        // Totem attack state
        this.attackingTotem = false;
        this.totemAttackCooldown = 1.0; // seconds
        this.lastTotemAttackTime = 0;

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

    update(deltaTime, pathfindingSystem, totemPosition, trees = [], player = null) {
        if (this.isDestroyed) return false;

        const currentTime = Date.now() / 1000; // Convert to seconds
        
        // Check if attacking totem (continuous attacks)
        const distanceToTotem = this.position.distanceTo(totemPosition);
        if (distanceToTotem < 1.5) {
            this.attackingTotem = true;
            this.stopMovement = true;
            
            // Attack totem at intervals
            const timeSinceLastAttack = currentTime - this.lastTotemAttackTime;
            if (timeSinceLastAttack >= this.totemAttackCooldown) {
                this.lastTotemAttackTime = currentTime;
                return true; // Return true to indicate totem attack
            }
            return false; // Still attacking, but not this frame
        } else {
            this.attackingTotem = false;
        }
        
        // Handle player blocking - attack player if in range
        if (this.targetPlayer && player) {
            const playerPos = player.getPosition();
            const distanceToPlayer = this.position.distanceTo(playerPos);
            const attackRange = this.playerCollisionRadius + 0.8; // Player radius
            
            if (distanceToPlayer < attackRange) {
                // Attack player
                this.stopMovement = true;
                const timeSinceLastAttack = currentTime - this.lastAttackTime;
                if (timeSinceLastAttack >= this.attackCooldown) {
                    player.takeDamage(this.playerDamage);
                    this.lastAttackTime = currentTime;
                }
                
                // Face player
                if (this.mesh) {
                    const dx = playerPos.x - this.position.x;
                    const dz = playerPos.z - this.position.z;
                    const angle = Math.atan2(dx, dz) + Math.PI;
                    this.mesh.rotation.y = angle;
                }
                
                // Update mesh position
                if (this.mesh) {
                    this.mesh.position.x = this.position.x;
                    this.mesh.position.y = this.position.y + this.yOffset;
                    this.mesh.position.z = this.position.z;
                    
                    // Update animation (idle when attacking)
                    if (this.model && this.model.updateAnimation) {
                        this.model.updateAnimation(deltaTime, false);
                    }
                }
                
                return false; // Don't move toward totem while attacking player
            } else {
                // Player moved away, resume movement
                this.targetPlayer = false;
                this.stopMovement = false;
            }
        }
        
        // Don't move if stopped
        if (this.stopMovement) {
            // Update mesh position
            if (this.mesh) {
                this.mesh.position.x = this.position.x;
                this.mesh.position.y = this.position.y + this.yOffset;
                this.mesh.position.z = this.position.z;
                
                // Update animation (idle)
                if (this.model && this.model.updateAnimation) {
                    this.model.updateAnimation(deltaTime, false);
                }
            }
            return false;
        }
        
        // Get or update path
        if (!this.currentPath || 
            this.currentWaypointIndex >= this.currentPath.length ||
            (currentTime - this.lastPathUpdateTime) > this.pathUpdateInterval) {
            // Calculate new path
            this.currentPath = pathfindingSystem.getPath(this.position.x, this.position.z);
            this.currentWaypointIndex = 0;
            this.lastPathUpdateTime = currentTime;
        }
        
        // If no path or path is empty, use direct movement as fallback
        if (!this.currentPath || this.currentPath.length === 0) {
            const dx = totemPosition.x - this.position.x;
            const dz = totemPosition.z - this.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance > 0.001) {
                const direction = new THREE.Vector2(dx / distance, dz / distance);
                const moveSpeed = this.speed * deltaTime;
                this.position.x += direction.x * moveSpeed;
                this.position.z += direction.y * moveSpeed;
                
                // Update rotation
                if (this.mesh) {
                    const angle = Math.atan2(direction.x, direction.y) + Math.PI;
                    this.mesh.rotation.y = angle;
                }
            }
        } else {
            // Follow path waypoints
            if (this.currentWaypointIndex < this.currentPath.length) {
                const waypoint = this.currentPath[this.currentWaypointIndex];
                const dx = waypoint.x - this.position.x;
                const dz = waypoint.z - this.position.z;
                const distanceToWaypoint = Math.sqrt(dx * dx + dz * dz);
                
                if (distanceToWaypoint < this.waypointReachDistance) {
                    // Reached waypoint, move to next
                    this.currentWaypointIndex++;
                } else {
                    // Move toward current waypoint
                    const direction = new THREE.Vector2(
                        dx / distanceToWaypoint,
                        dz / distanceToWaypoint
                    );
                    
                    const moveSpeed = this.speed * deltaTime;
                    const moveDistance = Math.min(moveSpeed, distanceToWaypoint);
                    
                    this.position.x += direction.x * moveDistance;
                    this.position.z += direction.y * moveDistance;
                    
                    // Update rotation to face movement direction
                    if (this.mesh) {
                        const angle = Math.atan2(direction.x, direction.y) + Math.PI;
                        this.mesh.rotation.y = angle;
                    }
                }
            }
        }

        // Update mesh position
        if (this.mesh) {
            this.mesh.position.x = this.position.x;
            this.mesh.position.y = this.position.y + this.yOffset;
            this.mesh.position.z = this.position.z;
            
            // Update animation
            if (this.model && this.model.updateAnimation) {
                this.model.updateAnimation(deltaTime, true); // Moving
            }
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

    getHP() {
        return this.currentHP;
    }

    getMaxHP() {
        return this.maxHP;
    }

    takeDamage(amount) {
        this.currentHP = Math.max(0, this.currentHP - amount);
        if (this.currentHP <= 0) {
            this.isDestroyed = true;
            return true;
        }
        return false;
    }
}
