import * as THREE from 'three';
import { BaseModel } from './BaseModel.js';
import { BUILDING_CONFIG } from '../config/buildings.js';
import { VISUAL_CONFIG } from '../config/visual.js';

export class Tower extends BaseModel {
    constructor(x, z) {
        const position = new THREE.Vector3(x, 0, z);
        super(position, {
            placeholderColor: VISUAL_CONFIG.towerPlaceholderColor,
            scale: VISUAL_CONFIG.catScale
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
        this.lastAttackTime = 0;
        this.targetEnemy = null;
    }
    
    onModelLoadedInternal() {
        // Tower specific setup after model loads
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
    
    attack(target) {
        if (!target || target.isDestroyed) return false;
        
        const killed = target.takeDamage(this.attackDamage);
        return killed;
    }
    
    update(deltaTime, enemies, totemPosition) {
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
                // Attack target
                const killed = this.attack(target);
                this.lastAttackTime = currentTime;
                
                // If enemy was killed, clear target
                if (killed) {
                    this.targetEnemy = null;
                }
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
