import * as THREE from 'three';
import { BaseModel } from './BaseModel.js';
import { CAT_CONFIG } from '../config/cat.js';
import { VISUAL_CONFIG } from '../config/visual.js';
import { ANIMATION_CONFIG } from '../config/animation.js';
import { COMBAT_CONFIG } from '../config/combat.js';

export class Cat extends BaseModel {
    constructor(x, z, playerMaskColor = null, y = 0) {
        const position = new THREE.Vector3(x, y, z);
        super(position, {
            modelPath: 'cat6.glb',
            placeholderColor: VISUAL_CONFIG.catPlaceholderColor,
            scale: VISUAL_CONFIG.catScale
        });
        
        this.speed = CAT_CONFIG.speed;
        this.collisionRadius = CAT_CONFIG.collisionRadius;
        this.state = 'idle'; // 'available' | 'assigned' | 'idle'
        this.assignedTower = null;
        this.idlePosition = null;
        this.targetPosition = null;
        this.reachedTarget = false;
        this.lastDayState = null;
        this.wanderTimer = 0;
        this.guardCooldownTimer = 0;
        this.onGuardAttack = null;
        
        // Animation properties (similar to PlayerModel)
        this.animationTime = 0;
        this.legMeshes = [];
        this.headMesh = null;
        this.maskMesh = null;
        this.tailMesh = null;
        this.headOriginalPosition = null;
        this.tailOriginalRotation = null;
        
        // Color properties
        this.bodyColor = null;
        this.legColor = null;
        this.headColor = null;
        this.maskColor = null;
        this.playerMaskColor = playerMaskColor; // Store player's mask color
        
        // Body color palette (same as PlayerModel)
        this.bodyColorPalette = CAT_CONFIG.bodyColorPalette;
        
        // Mask color palette
        this.maskColorPalette = CAT_CONFIG.maskColorPalette;
    }
    
    onModelLoadedInternal() {
        this.findModelParts();
        this.selectRandomColors();
        this.applyColors();
    }
    
    findModelParts() {
        this.legMeshes = [];
        this.headMesh = null;
        this.maskMesh = null;
        this.tailMesh = null;
        
        if (!this.mesh) return;
        
        this.mesh.traverse((child) => {
            const name = child.name.toLowerCase();
            
            if (name.includes('leg') || name.includes('foot') || name.includes('paw')) {
                if (child.isMesh || child.isGroup) {
                    this.legMeshes.push(child);
                }
            }
            
            if (name.includes('head') && !name.includes('mask')) {
                if (child.isMesh || child.isGroup) {
                    if (!this.headMesh) {
                        this.headMesh = child;
                        this.headOriginalPosition = child.position.clone();
                    }
                }
            }
            
            if (name.includes('mask')) {
                if (child.isMesh || child.isGroup) {
                    this.maskMesh = child;
                }
            }
            
            if (name.includes('tail')) {
                if (child.isMesh || child.isGroup) {
                    if (!this.tailMesh) {
                        this.tailMesh = child;
                        this.tailOriginalRotation = {
                            y: child.rotation.y,
                            z: child.rotation.z
                        };
                    }
                }
            }
        });
    }
    
    createColorVariation(baseColor, variationAmount = 0.15) {
        const r = (baseColor >> 16) & 0xff;
        const g = (baseColor >> 8) & 0xff;
        const b = baseColor & 0xff;
        
        const variation = (Math.random() - 0.5) * 2 * variationAmount;
        const newR = Math.max(0, Math.min(255, Math.round(r * (1 + variation))));
        const newG = Math.max(0, Math.min(255, Math.round(g * (1 + variation))));
        const newB = Math.max(0, Math.min(255, Math.round(b * (1 + variation))));
        
        return (newR << 16) | (newG << 8) | newB;
    }
    
    selectRandomColors() {
        const bodyIndex = Math.floor(Math.random() * this.bodyColorPalette.length);
        this.bodyColor = this.bodyColorPalette[bodyIndex];
        
        this.legColor = this.createColorVariation(this.bodyColor, 0.12);
        this.headColor = this.createColorVariation(this.bodyColor, 0.12);
        
        let attempts = 0;
        while (this.headColor === this.legColor && attempts < 5) {
            this.headColor = this.createColorVariation(this.bodyColor, 0.12);
            attempts++;
        }
        
        // Use player's mask color if provided, otherwise select random
        if (this.playerMaskColor !== null) {
            this.maskColor = this.playerMaskColor;
        } else {
            let maskIndex;
            attempts = 0;
            do {
                maskIndex = Math.floor(Math.random() * this.maskColorPalette.length);
                this.maskColor = this.maskColorPalette[maskIndex];
                attempts++;
            } while (this.maskColor === this.bodyColor && attempts < 10);
        }
    }
    
    applyColors() {
        if (!this.mesh) return;
        
        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                const isMask = this.maskMesh && (
                    child === this.maskMesh ||
                    (this.maskMesh.isGroup && this.maskMesh.children.includes(child)) ||
                    child.name.toLowerCase().includes('mask')
                );
                
                const isLeg = this.legMeshes.some(leg =>
                    child === leg ||
                    (leg.isGroup && leg.children.includes(child)) ||
                    child.name.toLowerCase().includes('leg') ||
                    child.name.toLowerCase().includes('foot') ||
                    child.name.toLowerCase().includes('paw')
                );
                
                const isHead = this.headMesh && (
                    child === this.headMesh ||
                    (this.headMesh.isGroup && this.headMesh.children.includes(child)) ||
                    (child.name.toLowerCase().includes('head') && !child.name.toLowerCase().includes('mask'))
                );
                
                let targetColor = this.bodyColor;
                if (isMask) {
                    targetColor = this.maskColor;
                } else if (isLeg) {
                    targetColor = this.legColor;
                } else if (isHead) {
                    targetColor = this.headColor;
                }
                
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                
                materials.forEach((material, index) => {
                    if (material) {
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
                    }
                });
            }
        });
    }
    
    updateAnimation(deltaTime, isMoving) {
        if (!this.modelLoaded || !this.mesh) return;
        
        this.animationTime += deltaTime;
        
        if (isMoving && this.legMeshes.length >= 2) {
            const legSpeed = CAT_CONFIG.legSpeed;
            const legAmplitude = CAT_CONFIG.legAmplitude;
            
            for (let i = 0; i < this.legMeshes.length; i++) {
                const leg = this.legMeshes[i];
                const phase = i % 2 === 0 ? 0 : Math.PI;
                const rotation = Math.sin(this.animationTime * legSpeed * 2 * Math.PI + phase) * legAmplitude;
                
                leg.rotation.x = rotation;
            }
        } else {
            this.legMeshes.forEach(leg => {
                leg.rotation.x *= ANIMATION_CONFIG.dampingFactor;
                if (Math.abs(leg.rotation.x) < ANIMATION_CONFIG.minRotationThreshold) {
                    leg.rotation.x = 0;
                }
            });
        }
        
        if (this.headMesh && this.headOriginalPosition) {
            const headSpeed = CAT_CONFIG.headSpeed;
            const headAmplitude = CAT_CONFIG.headAmplitude;
            
            this.headMesh.rotation.x = Math.sin(this.animationTime * headSpeed * 2 * Math.PI) * headAmplitude;
            
            const bobAmplitude = CAT_CONFIG.headBobAmplitude;
            const bobOffset = Math.sin(this.animationTime * headSpeed * 2 * Math.PI) * bobAmplitude;
            this.headMesh.position.y = this.headOriginalPosition.y + bobOffset;
        }
        
        if (this.tailMesh && this.tailOriginalRotation) {
            const tailSpeed = CAT_CONFIG.tailSpeed;
            const idleAmplitude = CAT_CONFIG.idleAmplitude;
            const runningAmplitude = CAT_CONFIG.runningAmplitude;
            const tailAmplitude = isMoving ? runningAmplitude : idleAmplitude;
            
            const tailPhase = Math.sin(this.animationTime * tailSpeed * 2 * Math.PI) * tailAmplitude;
            this.tailMesh.rotation.y = this.tailOriginalRotation.y + tailPhase;
            
            const zRotation = Math.sin(this.animationTime * tailSpeed * 2 * Math.PI + Math.PI / 4) * tailAmplitude * 0.5;
            this.tailMesh.rotation.z = this.tailOriginalRotation.z + zRotation;
        }
    }
    
    getPosition() {
        return this.position;
    }
    
    setIdlePosition(position) {
        this.idlePosition = position.clone();
        this.targetPosition = position.clone();
        this.reachedTarget = false;
        this.state = 'idle';
    }
    
    assignToTower(tower) {
        this.assignedTower = tower;
        this.state = 'assigned';
        if (tower) {
            const towerPos = tower.getPosition();
            this.targetPosition = towerPos.clone();
            this.reachedTarget = false;
        }
    }
    
    unassignFromTower() {
        this.assignedTower = null;
        this.state = 'available';
        if (this.idlePosition) {
            this.targetPosition = this.idlePosition.clone();
            this.reachedTarget = false;
        }
    }
    
    isAvailable() {
        return this.state !== 'assigned';
    }

    getNextWanderInterval() {
        const { min, max } = CAT_CONFIG.wanderInterval;
        return min + Math.random() * (max - min);
    }

    setTargetPosition(position) {
        if (!position) return;
        this.targetPosition = position.clone();
        this.reachedTarget = false;
    }

    pickRandomPointInMap(mapSystem) {
        const boundary = mapSystem ? mapSystem.getBoundary() : 45;
        const x = (Math.random() * 2 - 1) * boundary;
        const z = (Math.random() * 2 - 1) * boundary;
        return new THREE.Vector3(x, 0, z);
    }

    pickPointAroundTotem(totemPos, radiusRange) {
        if (!totemPos) return null;
        const radius = radiusRange.min + Math.random() * (radiusRange.max - radiusRange.min);
        const angle = Math.random() * Math.PI * 2;
        const x = totemPos.x + Math.cos(angle) * radius;
        const z = totemPos.z + Math.sin(angle) * radius;
        return new THREE.Vector3(x, 0, z);
    }

    chooseDayTarget(totemPos, mapSystem) {
        const useTotemBias = totemPos && Math.random() < CAT_CONFIG.dayTotemBiasChance;
        if (useTotemBias) {
            const target = this.pickPointAroundTotem(totemPos, CAT_CONFIG.dayTotemBiasRadius);
            if (target) return target;
        }
        return this.pickRandomPointInMap(mapSystem);
    }

    chooseNightTarget(totemPos) {
        return this.pickPointAroundTotem(totemPos, CAT_CONFIG.nightTotemRadius);
    }

    getCollisionObstacles({ trees = [], buildings = [], totem = null } = {}) {
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

        for (const building of buildings) {
            if (!building) continue;
            if (typeof building.getIsBuilt === 'function' && !building.getIsBuilt()) continue;
            const pos = building.getPosition ? building.getPosition() : building.position;
            if (!pos) continue;
            const radius = typeof building.getSize === 'function' ? building.getSize() : building.size;
            if (!radius) continue;
            obstacles.push({ x: pos.x, z: pos.z, radius });
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

    update(deltaTime, {
        daySystem = null,
        totem = null,
        mapSystem = null,
        trees = [],
        buildings = [],
        enemies = []
    } = {}) {
        if (!this.mesh) return;
        
        let isMoving = false;
        const totemPos = totem ? (totem.getPosition ? totem.getPosition() : totem.position) : null;

        if (this.state === 'assigned' && this.assignedTower) {
            const towerPos = this.assignedTower.getPosition();
            if (!this.targetPosition || this.targetPosition.distanceTo(towerPos) > 0.2) {
                this.setTargetPosition(towerPos);
            }
        } else if (daySystem) {
            const currentState = daySystem.getState ? daySystem.getState() : daySystem.state;
            if (currentState !== this.lastDayState) {
                this.lastDayState = currentState;
                this.wanderTimer = 0;
                if (currentState === 'night') {
                    const nightTarget = this.chooseNightTarget(totemPos);
                    if (nightTarget) {
                        this.setTargetPosition(nightTarget);
                    }
                }
            }

            if (currentState === 'night') {
                if (totemPos) {
                    const distanceToTotem = this.position.distanceTo(totemPos);
                    const maxDistance = CAT_CONFIG.nightTotemRadius.max * 1.2;
                    if (!this.targetPosition || this.reachedTarget || distanceToTotem > maxDistance) {
                        const nightTarget = this.chooseNightTarget(totemPos);
                        if (nightTarget) {
                            this.setTargetPosition(nightTarget);
                        }
                    }
                }
            } else {
                this.wanderTimer -= deltaTime;
                if (!this.targetPosition || this.reachedTarget || this.wanderTimer <= 0) {
                    const dayTarget = this.chooseDayTarget(totemPos, mapSystem);
                    if (dayTarget) {
                        this.setTargetPosition(dayTarget);
                        this.wanderTimer = this.getNextWanderInterval();
                    }
                }
            }
        }
        
        // Move toward target position
        if (this.targetPosition && !this.reachedTarget) {
            const dx = this.targetPosition.x - this.position.x;
            const dz = this.targetPosition.z - this.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance > 0.1) {
                isMoving = true;
                const direction = new THREE.Vector2(dx / distance, dz / distance);
                const moveSpeed = this.speed * deltaTime;
                const moveDistance = Math.min(moveSpeed, distance);
                const newX = this.position.x + direction.x * moveDistance;
                const newZ = this.position.z + direction.y * moveDistance;
                const clamped = mapSystem ? mapSystem.clampPosition(newX, newZ) : { x: newX, z: newZ };
                const obstacles = this.getCollisionObstacles({ trees, buildings, totem });
                const resolved = this.resolveCollisions(
                    new THREE.Vector3(clamped.x, 0, clamped.z),
                    obstacles,
                    mapSystem
                );
                
                this.position.x = resolved.x;
                this.position.z = resolved.z;
                
                // Update rotation to face movement direction
                const angle = Math.atan2(direction.x, direction.y) + Math.PI;
                this.mesh.rotation.y = angle;
            } else {
                this.reachedTarget = true;
                if (this.state === 'idle') {
                    this.state = 'available';
                }
            }
        }
        
        if (mapSystem && typeof mapSystem.getHeightAt === 'function') {
            this.position.y = mapSystem.getHeightAt(this.position.x, this.position.z);
        }
        
        // Update mesh position
        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y + this.yOffset;
        this.mesh.position.z = this.position.z;

        // Passive guard: unassigned cats help during night near enemies
        if (daySystem && typeof daySystem.isNight === 'function' && daySystem.isNight()) {
            this.guardCooldownTimer = Math.max(0, this.guardCooldownTimer - deltaTime);
            if (this.state !== 'assigned' && enemies && enemies.length > 0 && this.guardCooldownTimer <= 0) {
                let closestEnemy = null;
                let closestDistance = Infinity;
                for (const enemy of enemies) {
                    if (!enemy || enemy.isDestroyed) continue;
                    const enemyPos = enemy.getPosition ? enemy.getPosition() : enemy.position;
                    if (!enemyPos) continue;
                    const distance = this.position.distanceTo(enemyPos);
                    if (distance <= CAT_CONFIG.guardRange && distance < closestDistance) {
                        closestDistance = distance;
                        closestEnemy = enemy;
                    }
                }
                
                if (closestEnemy && typeof closestEnemy.takeDamage === 'function') {
                    if (this.onGuardAttack) {
                        this.onGuardAttack(this, closestEnemy);
                    }
                    closestEnemy.takeDamage(CAT_CONFIG.guardDamage);
                    this.guardCooldownTimer = CAT_CONFIG.guardCooldown;
                }
            }
        }
        
        // Update animation
        this.updateAnimation(deltaTime, isMoving);
    }
    
    destroy() {
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        if (this.assignedTower) {
            this.assignedTower.unassignCat();
        }
    }
}
