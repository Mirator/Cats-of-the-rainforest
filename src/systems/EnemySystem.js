import { Mouse } from '../entities/Mouse.js';
import { FastMouse } from '../entities/FastMouse.js';
import { StrongMouse } from '../entities/StrongMouse.js';
import { COMBAT_CONFIG } from '../config/combat.js';

export class EnemySystem {
    constructor(mapSystem, sceneManager) {
        this.mapSystem = mapSystem;
        this.sceneManager = sceneManager;
        this.enemies = [];
        this.boundary = mapSystem.getBoundary();
        this.onEnemySpawnedCallback = null;
        this.onEnemyKilledCallback = null;
    }
    
    setOnEnemySpawned(callback) {
        this.onEnemySpawnedCallback = callback;
    }
    
    setOnEnemyKilled(callback) {
        this.onEnemyKilledCallback = callback;
    }

    spawnMouse(side, trees = [], enemyType = 'regular', hpMultiplier = 1.0) {
        // Spawn a mouse from specified side: 'north', 'south', 'east', 'west'
        let x, z;
        const spawnRadius = COMBAT_CONFIG.spawnRadius;
        const maxAttempts = COMBAT_CONFIG.maxSpawnAttempts;

        // Try to find a clear spawn position
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Generate random position along the border
            switch (side) {
                case 'north':
                    x = (Math.random() - 0.5) * (this.boundary * 2 - 2);
                    z = -this.boundary;
                    break;
                case 'south':
                    x = (Math.random() - 0.5) * (this.boundary * 2 - 2);
                    z = this.boundary;
                    break;
                case 'east':
                    x = this.boundary;
                    z = (Math.random() - 0.5) * (this.boundary * 2 - 2);
                    break;
                case 'west':
                    x = -this.boundary;
                    z = (Math.random() - 0.5) * (this.boundary * 2 - 2);
                    break;
                default:
                    console.warn(`Unknown spawn side: ${side}`);
                    return null;
            }

            // Clamp to boundaries
            x = Math.max(-this.boundary + 1, Math.min(this.boundary - 1, x));
            z = Math.max(-this.boundary + 1, Math.min(this.boundary - 1, z));

            // Check if spawn position is clear
            if (this.isSpawnPositionClear(x, z, trees, spawnRadius)) {
                const mouse = this.createEnemyByType(enemyType, x, z, hpMultiplier);
                if (mouse) {
                    this.enemies.push(mouse);
                    this.sceneManager.add(mouse.getMesh());
                    if (this.onEnemySpawnedCallback) {
                        this.onEnemySpawnedCallback();
                    }
                    return mouse;
                }
            }
        }

        // If no clear position found after maxAttempts, spawn anyway (at last attempted position)
        const mouse = this.createEnemyByType(enemyType, x, z, hpMultiplier);
        if (mouse) {
            this.enemies.push(mouse);
            this.sceneManager.add(mouse.getMesh());
            if (this.onEnemySpawnedCallback) {
                this.onEnemySpawnedCallback();
            }
            return mouse;
        }
        return null;
    }
    
    createEnemyByType(enemyType, x, z, hpMultiplier) {
        switch (enemyType) {
            case 'fast':
                return new FastMouse(x, z, hpMultiplier);
            case 'strong':
                return new StrongMouse(x, z, hpMultiplier);
            case 'regular':
            default:
                return new Mouse(x, z, hpMultiplier);
        }
    }
    
    spawnWaveEnemy(waveConfig, trees = []) {
        // Select enemy type based on wave config probabilities
        const enemyType = this.selectEnemyType(waveConfig.enemyTypes);
        const side = this.getRandomSide();
        return this.spawnMouse(side, trees, enemyType, waveConfig.hpMultiplier);
    }
    
    selectEnemyType(enemyTypes) {
        const rand = Math.random();
        let cumulative = 0;
        for (const typeConfig of enemyTypes) {
            cumulative += typeConfig.probability;
            if (rand <= cumulative) {
                return typeConfig.type;
            }
        }
        // Fallback to first type
        return enemyTypes[0].type;
    }
    
    getRandomSide() {
        const sides = ['north', 'south', 'east', 'west'];
        return sides[Math.floor(Math.random() * sides.length)];
    }

    spawnFromAllSides(trees = []) {
        // Spawn one mouse from each border side
        const sides = ['north', 'south', 'east', 'west'];
        const spawned = [];

        for (const side of sides) {
            const mouse = this.spawnMouse(side, trees);
            if (mouse) {
                spawned.push(mouse);
            }
        }

        return spawned;
    }

    spawnFromRandomSide(trees = []) {
        // Spawn one mouse from a random border side
        const sides = ['north', 'south', 'east', 'west'];
        const randomSide = sides[Math.floor(Math.random() * sides.length)];
        return this.spawnMouse(randomSide, trees);
    }

    isSpawnPositionClear(x, z, trees, minDistance = 2.5) {
        // Check if spawn position is clear of trees
        for (const tree of trees) {
            if (tree.isCut) continue;

            const dx = x - tree.position.x;
            const dz = z - tree.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < minDistance) {
                return false;
            }
        }
        return true;
    }

    update(deltaTime, pathfindingSystem, totem, trees, player) {
        // Update all enemies
        const destroyedIndices = [];

        for (let i = 0; i < this.enemies.length; i++) {
            const mouse = this.enemies[i];

            if (mouse.isDestroyed) {
                destroyedIndices.push(i);
                continue;
            }

            // Check for player collision (blocking)
            if (player && !mouse.targetPlayer) {
                const playerPos = player.getPosition();
                const mousePos = mouse.getPosition();
                const distance = playerPos.distanceTo(mousePos);
                const collisionRadius = mouse.playerCollisionRadius + COMBAT_CONFIG.playerRadius;
                
                if (distance < collisionRadius) {
                    // Enemy collides with player - stop and target player
                    mouse.targetPlayer = true;
                    mouse.stopMovement = true;
                }
            }

            // Update mouse (pass player for collision checks)
            const attackedTotem = mouse.update(deltaTime, pathfindingSystem, totem.getPosition(), trees, player);

            if (attackedTotem) {
                // Mouse is attacking totem - deal damage continuously
                const totemDestroyed = totem.takeDamage(mouse.getDamageAmount());
                // Don't destroy enemy immediately - let it attack continuously
                // Enemy will be destroyed when totem is destroyed or enemy is killed
                if (totemDestroyed) {
                    // Totem destroyed - mark all enemies for cleanup
                    // Game over will be handled in Game.js
                }
            }
        }

        // Remove destroyed enemies (in reverse order to maintain indices)
        for (let i = destroyedIndices.length - 1; i >= 0; i--) {
            const index = destroyedIndices[i];
            const mouse = this.enemies[index];
            const mousePosition = mouse.getPosition ? mouse.getPosition() : mouse.position;
            
            // Create death effect before destroying
            if (this.sceneManager && mousePosition) {
                this.sceneManager.createParticleEffect(mousePosition, 'enemyDeath');
            }
            
            mouse.destroy();
            this.enemies.splice(index, 1);
            // Notify wave system that enemy was killed
            if (this.onEnemyKilledCallback) {
                this.onEnemyKilledCallback();
            }
        }
    }

    getEnemies() {
        return this.enemies;
    }

    clearAll() {
        // Remove all enemies
        for (const enemy of this.enemies) {
            enemy.destroy();
        }
        this.enemies = [];
    }
}
