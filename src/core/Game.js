import { SceneManager } from './SceneManager.js';
import { InputManager } from './InputManager.js';
import { MapSystem } from '../systems/MapSystem.js';
import { ResourceSystem } from '../systems/ResourceSystem.js';
import { DaySystem, DayState } from '../systems/DaySystem.js';
import { PathfindingSystem } from '../systems/PathfindingSystem.js';
import { EnemySystem } from '../systems/EnemySystem.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { Player } from '../entities/Player.js';
import { Tree } from '../entities/Tree.js';
import { ForestTotem } from '../entities/ForestTotem.js';
import { UIManager } from '../ui/UIManager.js';

export class Game {
    constructor(container) {
        this.container = container;
        this.sceneManager = null;
        this.inputManager = null;
        this.mapSystem = null;
        this.resourceSystem = null;
        this.daySystem = null;
        this.uiManager = null;
        this.pathfindingSystem = null;
        this.enemySystem = null;
        this.waveSystem = null;
        
        this.player = null;
        this.trees = [];
        this.forestTotem = null;
        this.treesChanged = false; // Track if trees changed for pathfinding update
        
        this.lastTime = 0;
        this.isRunning = false;
        this.lastSpawnTime = 0;
        this.gameTime = 0; // Total game time in seconds
        this.hasWon = false;
        
        this.init();
    }
    
    init() {
        // Initialize core systems
        this.sceneManager = new SceneManager(this.container);
        this.inputManager = new InputManager();
        this.mapSystem = new MapSystem(this.sceneManager.scene);
        this.resourceSystem = new ResourceSystem();
        this.daySystem = new DaySystem();
        this.uiManager = new UIManager();
        
        // Initialize player at starting position
        const startPos = { x: -5, z: -5 };
        this.player = new Player(startPos.x, startPos.z);
        this.sceneManager.add(this.player.getMesh());
        
        // Set up callback for when model loads
        this.player.onModelLoaded = () => {
            // Model has replaced placeholder, ensure it's in the scene
            if (this.player.getMesh() && !this.player.getMesh().parent) {
                this.sceneManager.add(this.player.getMesh());
            }
        };
        
        // Create Forest Totem at center
        const center = this.mapSystem.getCenter();
        this.forestTotem = new ForestTotem(center.x, center.z);
        this.sceneManager.add(this.forestTotem.getMesh());
        
        // Generate trees
        this.generateTrees();
        
        // Initialize pathfinding system (after trees are generated)
        const totemPos = this.forestTotem.getPosition();
        this.pathfindingSystem = new PathfindingSystem(
            this.mapSystem,
            totemPos,
            this.trees
        );
        
        // Initialize enemy system
        this.enemySystem = new EnemySystem(this.mapSystem, this.sceneManager);
        
        // Initialize wave system
        this.waveSystem = new WaveSystem();
        
        // Setup enemy system callbacks for wave tracking
        this.enemySystem.setOnEnemySpawned(() => {
            this.waveSystem.onEnemySpawned();
        });
        this.enemySystem.setOnEnemyKilled(() => {
            this.waveSystem.onEnemyKilled();
        });
        
        // Setup UI callbacks
        this.setupUICallbacks();
        
        // Setup resource system listeners
        this.resourceSystem.onResourceChange((resources) => {
            this.uiManager.updateResources(resources.food, resources.wood);
        });
        
        // Setup day system listeners
        this.daySystem.onStateChange((dayInfo) => {
            this.uiManager.updateDayInfo(dayInfo.day, dayInfo.state);
            this.uiManager.setEndDayEnabled(dayInfo.state === DayState.DAY);
            // Update visual environment based on day/night state
            this.sceneManager.updateDayNightVisuals(dayInfo.state);
            
            // Start wave when night starts
            if (dayInfo.state === DayState.NIGHT) {
                this.startWave();
            }
        });
        
        // Set initial day visuals
        this.sceneManager.updateDayNightVisuals(DayState.DAY);
        
        // Initial UI update
        this.uiManager.updateResources(0, 0);
        this.uiManager.updateDayInfo(1, DayState.DAY);
        this.uiManager.setEndDayEnabled(true);
        this.uiManager.updateWaveInfo(0, 0, 0); // No wave during day
    }
    
    startWave() {
        const currentDay = this.daySystem.getCurrentDay();
        const waveNumber = currentDay; // Each day = 1 wave
        
        // Calculate miceAlert from trees cut today
        const treesCutToday = this.daySystem.getTreesCutToday();
        const miceAlert = Math.min(treesCutToday * 0.5, 10); // Capped at 10
        
        // Start the wave
        this.waveSystem.startWave(waveNumber, miceAlert);
        const waveConfig = this.waveSystem.waveConfig;
        
        // Update UI
        this.uiManager.updateWaveInfo(waveNumber, 0, waveConfig.enemyCount);
        
        // Set lastSpawnTime so first enemy spawns after 2 seconds
        // For wave 5 (spawnInterval = 0), we'll handle it specially in the update loop
        if (waveNumber === 5) {
            // For wave 5, set to spawn after 2 seconds
            this.lastSpawnTime = this.gameTime - 2.0;
        } else {
            // For other waves, set lastSpawnTime so first spawn happens after 2 seconds
            // timeSinceLastSpawn = gameTime - (gameTime - (spawnInterval - 2)) = spawnInterval - 2
            // After 2 seconds: timeSinceLastSpawn = spawnInterval, triggering spawn
            this.lastSpawnTime = this.gameTime - (waveConfig.spawnInterval - 2.0);
        }
    }
    
    generateTrees() {
        const mapSize = this.mapSystem.getMapSize();
        const boundary = this.mapSystem.getBoundary();
        const treeCount = 80; // Increased from 20 to match 4x larger map
        
        // Avoid center area for totem (scaled proportionally)
        const centerRadius = 6;
        
        for (let i = 0; i < treeCount; i++) {
            let x, z;
            let attempts = 0;
            
            do {
                x = (Math.random() - 0.5) * (mapSize - 2);
                z = (Math.random() - 0.5) * (mapSize - 2);
                attempts++;
            } while (
                (x * x + z * z < centerRadius * centerRadius) && 
                attempts < 50
            );
            
            // Clamp to boundaries
            x = Math.max(-boundary + 1, Math.min(boundary - 1, x));
            z = Math.max(-boundary + 1, Math.min(boundary - 1, z));
            
            const tree = new Tree(x, z);
            this.trees.push(tree);
            this.sceneManager.add(tree.getMesh());
            // Initialize model loading
            tree.init();
        }
    }
    
    setupUICallbacks() {
        this.uiManager.setEndDayCallback(() => {
            if (this.daySystem.isDay()) {
                this.daySystem.endDay();
            }
        });
    }
    
    update(deltaTime) {
        // Update game time
        this.gameTime += deltaTime;
        
        // Update input
        this.inputManager.update();
        
        // Update player
        this.player.update(deltaTime, this.inputManager, this.mapSystem);
        
        // Update camera to follow player (pass mapSystem for boundary slowdown)
        this.sceneManager.updateCamera(this.player.getPosition(), this.mapSystem);
        
        // Handle tree cutting (continuous hold interaction)
        this.handleTreeCutting(deltaTime);
        
        // Update tree progress bars
        const camera = this.sceneManager.camera;
        this.uiManager.updateTreeProgressBars(this.trees, camera);
        
        // Update tree animations (wind and falling)
        for (const tree of this.trees) {
            // Update interaction progress for interacting trees
            if (tree.isInteracting) {
                tree.updateInteraction(deltaTime);
            }
            
            // Update tree animations (wind sway or falling)
            tree.update(deltaTime, this.gameTime);
            
            // Check if tree just finished falling and should give resources
            if (tree.isCut && !tree.isFalling && !tree.resourcesGiven && tree.interactionProgress >= 1.0) {
                // Tree has finished falling, give resources
                this.resourceSystem.addWood(1);
                this.resourceSystem.addFood(1);
                // Track tree cut for miceAlert calculation
                this.daySystem.incrementTreesCut();
                // Mark resources as given to prevent duplicate rewards
                tree.resourcesGiven = true;
            }
        }
        
        // Remove cut trees and mark trees as changed
        const treesBefore = this.trees.length;
        this.trees = this.trees.filter(tree => {
            if (tree.isCut) {
                // Clean up progress bar before removing tree
                this.uiManager.hideTreeProgressBar(tree);
                tree.remove();
                this.sceneManager.remove(tree.getMesh());
                return false;
            }
            return true;
        });
        
        // Update pathfinding if trees changed
        if (this.trees.length !== treesBefore || this.treesChanged) {
            const totemPos = this.forestTotem.getPosition();
            this.pathfindingSystem.update(this.trees, totemPos);
            this.treesChanged = false;
        }
        
        // Update enemy system
        this.enemySystem.update(deltaTime, this.pathfindingSystem, this.forestTotem, this.trees);
        
        // Update enemy direction indicators (red edges for off-screen enemies)
        if (this.daySystem.isNight()) {
            const enemies = this.enemySystem.getEnemies();
            const camera = this.sceneManager.camera;
            const playerPos = this.player.getPosition();
            this.uiManager.updateEnemyDirectionIndicators(enemies, camera, playerPos);
        } else {
            // Hide all indicators during day
            this.uiManager.updateEnemyDirectionIndicators([], null, null);
        }
        
        // Handle wave spawning and completion
        if (this.daySystem.isNight() && !this.hasWon) {
            const waveConfig = this.waveSystem.waveConfig;
            
            if (waveConfig) {
                // Spawn enemies based on wave config
                const enemiesRemaining = waveConfig.enemyCount - this.waveSystem.enemiesSpawned;
                
                if (enemiesRemaining > 0) {
                    // Check if it's time to spawn next enemy
                    const timeSinceLastSpawn = this.gameTime - this.lastSpawnTime;
                    
                    // For wave 5 (boss), spawn after 2 seconds, then done
                    if (this.waveSystem.getCurrentWave() === 5) {
                        if (timeSinceLastSpawn >= 2.0) {
                            this.enemySystem.spawnWaveEnemy(waveConfig, this.trees);
                            this.lastSpawnTime = this.gameTime; // Prevent multiple spawns
                        }
                    } else {
                        // For other waves, spawn based on interval (first spawn after 2 seconds)
                        if (timeSinceLastSpawn >= waveConfig.spawnInterval) {
                            this.enemySystem.spawnWaveEnemy(waveConfig, this.trees);
                            this.lastSpawnTime = this.gameTime;
                        }
                    }
                }
                
                // Update UI with wave progress
                const progress = this.waveSystem.getWaveProgress();
                this.uiManager.updateWaveInfo(
                    this.waveSystem.getCurrentWave(),
                    progress.killed,
                    progress.total
                );
                
                // Check wave completion (all spawned, all killed, and no active enemies)
                if (this.waveSystem.isWaveComplete() && 
                    this.enemySystem.getEnemies().length === 0) {
                    this.completeWave();
                }
            }
        }
        
        // Check for game over (totem destroyed)
        if (this.forestTotem.isDestroyed()) {
            this.handleGameOver();
        }
    }
    
    handleTreeCutting(deltaTime) {
        if (!this.daySystem.isDay()) {
            return; // Can't cut trees at night
        }
        
        // Check if space is being held
        const spaceHeld = this.inputManager.isKeyHeld(' ');
        
        // Find nearest tree within range
        let nearestTree = null;
        let nearestDistance = Infinity;
        
        for (const tree of this.trees) {
            if (!tree.isCut && !tree.isFalling && this.player.canInteractWith(tree)) {
                const distance = this.player.getPosition().distanceTo(tree.getPosition());
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestTree = tree;
                }
            }
        }
        
        // Stop interactions for trees that are no longer in range
        for (const tree of this.trees) {
            if (tree.isInteracting && tree !== nearestTree) {
                tree.stopInteraction();
            }
        }
        
        if (nearestTree) {
            if (spaceHeld) {
                // Check if interaction is complete (progress reached 1.0) BEFORE starting new interaction
                if (nearestTree.interactionProgress >= 1.0 && !nearestTree.isFalling) {
                    // Start falling animation
                    nearestTree.startFalling(this.player.getPosition());
                } else if (!nearestTree.isInteracting && nearestTree.interactionProgress < 1.0) {
                    // Start interaction only if not already interacting AND progress hasn't reached 1.0
                    nearestTree.startInteraction();
                }
            } else {
                // Space not held - stop interaction
                if (nearestTree.isInteracting) {
                    nearestTree.stopInteraction();
                }
            }
        } else {
            // No tree in range - stop all interactions
            for (const tree of this.trees) {
                if (tree.isInteracting) {
                    tree.stopInteraction();
                }
            }
        }
    }
    
    completeWave() {
        const waveNumber = this.waveSystem.getCurrentWave();
        
        // Check for win condition
        if (this.waveSystem.hasWon()) {
            this.handleWin();
            return;
        }
        
        // Move to next day (which will start next wave)
        this.daySystem.startNextDay();
    }
    
    handleWin() {
        this.hasWon = true;
        this.uiManager.showWinScreen();
        // Stop enemy spawning
        // Hide UI and frame map (per design doc) - can be implemented later
    }
    
    handleGameOver() {
        this.isRunning = false;
        this.uiManager.showGameOverScreen();
    }
    
    render() {
        this.sceneManager.render();
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    stop() {
        this.isRunning = false;
    }
}
