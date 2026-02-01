import * as THREE from 'three';
import { BaseModel } from './BaseModel.js';
import { BUILDING_CONFIG } from '../config/buildings.js';
import { VISUAL_CONFIG } from '../config/visual.js';

export class Tower extends BaseModel {
    constructor(x, z, y = 0) {
        const position = new THREE.Vector3(x, y, z);
        super(position, {
            modelPath: 'tower.glb',
            placeholderColor: VISUAL_CONFIG.towerPlaceholderColor,
            scale: VISUAL_CONFIG.towerScale
        });
        
        this.size = BUILDING_CONFIG.tower.size;
        this.isBuilt = false;
        
        // Cat assignment
        this.assignedCat = null;
        this.isActiveFlag = false;

        // Interaction state (hold-to-assign)
        this.isInteracting = false;
        this.interactionProgress = 0.0; // 0.0 to 1.0
        this.interactionDuration = BUILDING_CONFIG.tower.interactionDuration;
        
        // Combat properties
        this.attackRange = BUILDING_CONFIG.tower.attackRange;
        this.attackDamage = BUILDING_CONFIG.tower.attackDamage;
        this.attackCooldown = BUILDING_CONFIG.tower.attackCooldown;
        this.projectileSpeed = BUILDING_CONFIG.tower.projectileSpeed || 10.0;
        this.projectileRadius = BUILDING_CONFIG.tower.projectileRadius || 0.12;
        this.projectileHitRadius = BUILDING_CONFIG.tower.projectileHitRadius || 0.35;
        this.lastAttackTime = 0;
        this.targetEnemy = null;
        this.projectiles = [];

        // Vine animation
        this.vineMeshes = [];
        this.vineTime = 0;

        // Facing adjustment (match totem orientation)
        this.facingOffset = 0;
        this.facingAngle = 0;
    }
    
    onModelLoadedInternal() {
        // Tower specific setup after model loads
        this.findVineMeshes();
        this.applyColors();
        this.applyFacing();
    }

    findVineMeshes() {
        this.vineMeshes = [];
        if (!this.mesh) return;

        this.mesh.traverse((child) => {
            if (!child.isMesh) return;
            const name = child.name.toLowerCase();
            if (name.startsWith('vine_')) {
                child.userData.baseRotation = child.rotation.clone();
                child.userData.basePosition = child.position.clone();
                this.vineMeshes.push(child);
            }
        });
    }

    applyColors() {
        if (!this.mesh) return;

        const palette = {
            base: 0x6f4a2d,
            core: 0x8a5a36,
            platform: 0x6a3e24,
            ear: 0xb37a4a,
            vine: 0x6fbf5a
        };

        this.mesh.traverse((child) => {
            if (!child.isMesh || !child.material) return;
            const name = child.name.toLowerCase();

            let targetColor = null;
            if (name.startsWith('vine_') || name.includes('vine')) {
                targetColor = palette.vine;
            } else if (name.includes('ear')) {
                targetColor = palette.ear;
            } else if (name.includes('platform')) {
                targetColor = palette.platform;
            } else if (name.includes('core')) {
                targetColor = palette.core;
            } else if (name.includes('base')) {
                targetColor = palette.base;
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
            });
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

    updateVines(deltaTime) {
        if (!this.modelLoaded || this.vineMeshes.length === 0) return;
        this.vineTime += deltaTime;

        this.vineMeshes.forEach((vine, index) => {
            const phase = this.vineTime * 1.4 + index * 1.1;
            const sway = Math.sin(phase) * 0.12;
            const twist = Math.cos(phase * 0.7) * 0.06;
            const baseRotation = vine.userData.baseRotation || vine.rotation;
            vine.rotation.x = baseRotation.x + sway * 0.35;
            vine.rotation.y = baseRotation.y + twist;
            vine.rotation.z = baseRotation.z + sway;
        });
    }
    
    getPosition() {
        return this.position;
    }
    
    getSize() {
        return this.size;
    }
    
    build() {
        this.isBuilt = true;
    }
    
    getIsBuilt() {
        return this.isBuilt;
    }
    
    assignCat(cat) {
        if (this.assignedCat) {
            // Unassign previous cat
            this.assignedCat.unassignFromTower();
        }
        
        this.assignedCat = cat;
        if (cat) {
            cat.assignToTower(this);
            this.isActiveFlag = true;
        } else {
            this.isActiveFlag = false;
        }
    }
    
    unassignCat() {
        if (this.assignedCat) {
            this.assignedCat.unassignFromTower();
            this.assignedCat = null;
        }
        this.isActiveFlag = false;
    }
    
    isActive() {
        return this.isActiveFlag && this.assignedCat !== null;
    }
    
    canInteract(playerPosition, daySystem) {
        if (!this.isBuilt) return false;
        if (!daySystem || !daySystem.isDay()) return false;
        
        const distance = playerPosition.distanceTo(this.position);
        return distance <= BUILDING_CONFIG.tower.interactionRange;
    }

    startInteraction() {
        if (!this.isBuilt) return;
        this.isInteracting = true;
        this.interactionProgress = 0.0;
    }

    updateInteraction(deltaTime) {
        if (!this.isInteracting || !this.isBuilt) return;

        this.interactionProgress += deltaTime / this.interactionDuration;

        if (this.interactionProgress >= 1.0) {
            this.interactionProgress = 1.0;
            this.isInteracting = false;
        }
    }

    stopInteraction() {
        this.isInteracting = false;
        this.interactionProgress = 0.0;
    }
    
    findTarget(enemies, totemPosition) {
        if (!enemies || enemies.length === 0) {
            this.targetEnemy = null;
            return null;
        }
        
        let closestEnemy = null;
        let closestDistanceToTotem = Infinity;
        
        for (const enemy of enemies) {
            if (enemy.isDestroyed) continue;
            
            const enemyPos = enemy.getPosition();
            const distanceToTower = this.position.distanceTo(enemyPos);
            
            // Check if enemy is in range
            if (distanceToTower > this.attackRange) continue;
            
            // Find enemy closest to totem
            const distanceToTotem = totemPosition.distanceTo(enemyPos);
            if (distanceToTotem < closestDistanceToTotem) {
                closestDistanceToTotem = distanceToTotem;
                closestEnemy = enemy;
            }
        }
        
        this.targetEnemy = closestEnemy;
        return closestEnemy;
    }
    
    createProjectile(target) {
        if (!target || target.isDestroyed) return;

        const geometry = new THREE.SphereGeometry(this.projectileRadius, 8, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0xd9a441 });
        const projectile = new THREE.Mesh(geometry, material);

        const origin = this.getProjectileOrigin();
        projectile.position.copy(origin);

        const parentScene = this.mesh ? this.mesh.parent : null;
        if (parentScene) {
            parentScene.add(projectile);
        }

        this.projectiles.push({
            mesh: projectile,
            target,
            speed: this.projectileSpeed,
            damage: this.attackDamage
        });
    }

    getProjectileOrigin() {
        const origin = this.position.clone();
        origin.y += 2.3;
        return origin;
    }

    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const { mesh, target, speed, damage } = projectile;

            if (!mesh || !target || target.isDestroyed) {
                this.removeProjectile(i);
                continue;
            }

            const targetPos = target.getPosition().clone();
            targetPos.y += 0.6;

            const toTarget = new THREE.Vector3().subVectors(targetPos, mesh.position);
            const distance = toTarget.length();

            if (distance <= this.projectileHitRadius) {
                target.takeDamage(damage);
                this.removeProjectile(i);
                continue;
            }

            if (distance > 0.0001) {
                toTarget.normalize();
                mesh.position.add(toTarget.multiplyScalar(speed * deltaTime));
            }
        }
    }

    removeProjectile(index) {
        const projectile = this.projectiles[index];
        if (projectile && projectile.mesh) {
            if (projectile.mesh.parent) {
                projectile.mesh.parent.remove(projectile.mesh);
            }
            if (projectile.mesh.geometry) projectile.mesh.geometry.dispose();
            if (projectile.mesh.material) projectile.mesh.material.dispose();
        }
        this.projectiles.splice(index, 1);
    }
    
    update(deltaTime, enemies, totemPosition) {
        this.updateVines(deltaTime);
        this.updateProjectiles(deltaTime);

        if (!this.isActive()) {
            this.targetEnemy = null;
            return;
        }
        
        // Find target enemy
        const target = this.findTarget(enemies, totemPosition);
        
        if (target && !target.isDestroyed) {
            // Check if cooldown has expired
            const currentTime = Date.now() / 1000; // Convert to seconds
            const timeSinceLastAttack = currentTime - this.lastAttackTime;
            
            if (timeSinceLastAttack >= this.attackCooldown) {
                // Fire projectile at target
                this.createProjectile(target);
                this.lastAttackTime = currentTime;
            }
        } else {
            this.targetEnemy = null;
        }
    }
    
    // Override createPlaceholder to create a tower-like structure
    createPlaceholder() {
        const group = new THREE.Group();
        
        // Base
        const baseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: this.placeholderColor,
            flatShading: true
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.15;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // Tower body
        const bodyGeometry = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.placeholderColor,
            flatShading: true
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.3;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Top platform
        const topGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 8);
        const topMaterial = new THREE.MeshStandardMaterial({ 
            color: this.placeholderColor,
            flatShading: true
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 2.5;
        top.castShadow = true;
        top.receiveShadow = true;
        group.add(top);
        
        group.position.copy(this.position);
        this.mesh = group;
    }
}
