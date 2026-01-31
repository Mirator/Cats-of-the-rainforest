import { SceneManager } from './SceneManager.js';
import { InputManager } from './InputManager.js';
import { MapSystem } from '../systems/MapSystem.js';
import { ResourceSystem } from '../systems/ResourceSystem.js';
import { DaySystem, DayState } from '../systems/DaySystem.js';
import { PathfindingSystem } from '../systems/PathfindingSystem.js';
import { EnemySystem } from '../systems/EnemySystem.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { BuildModeSystem, BuildModeState } from '../systems/BuildModeSystem.js';
import { TutorialSystem } from '../systems/TutorialSystem.js';
import { Player } from '../entities/Player.js';
import { Tree } from '../entities/Tree.js';
import { ForestTotem } from '../entities/ForestTotem.js';
import { CatDen } from '../entities/CatDen.js';
import { Cat } from '../entities/Cat.js';
import { Tower } from '../entities/Tower.js';
import { ConstructionSite } from '../entities/ConstructionSite.js';
import { GhostPreview } from '../entities/GhostPreview.js';
import { PlacementCursor } from '../entities/PlacementCursor.js';
import { UIManager } from '../ui/UIManager.js';
import { MAP_CONFIG } from '../config/map.js';
import { WAVE_CONFIG } from '../config/waves.js';
import { BUILD_CONFIG } from '../config/build.js';
import { CONTROLS } from '../config/controls.js';
import * as THREE from 'three';

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
        this.buildModeSystem = null;
        this.tutorialSystem = null;
        
        // First building tracking for discounts
        this.firstCatDenBuilt = false;
        this.firstTowerBuilt = false;
        
        // Tutorial tracking
        this.treesCutCount = 0;
        this.catsSpawnedCount = 0;
        this.catsAssignedToTowerCount = 0;
        
        this.player = null;
        this.trees = [];
        this.forestTotem = null;
        this.buildings = []; // Track all buildings
        this.constructionSites = []; // Track construction sites
        this.cats = []; // Track all cats
        this.towers = []; // Track all towers
        this.treesChanged = false; // Track if trees changed for pathfinding update
        
        // Build mode entities
        this.ghostPreview = null;
        this.placementCursor = null;
        this.totemInfluenceVisualization = null;
        this.usingKeyboardPlacement = false;
        this.buildModeTogglePressed = false;
        
        this.lastTime = 0;
        this.isRunning = false;
        this.lastSpawnTime = 0;
        this.gameTime = 0; // Total game time in seconds
        this.hasWon = false;
        
        // Game state: 'menu', 'playing', 'paused'
        this.gameState = 'menu';
        this.pauseMenuTogglePressed = false;
        
        this.init();
    }
    
    init() {
        // Initialize core systems
        this.sceneManager = new SceneManager(this.container);
        this.inputManager = new InputManager();
        this.mapSystem = new MapSystem(this.sceneManager.scene);
        this.resourceSystem = new ResourceSystem();
        this.daySystem = new DaySystem();
        this.buildModeSystem = new BuildModeSystem();
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
        
        // Initialize tutorial system
        this.tutorialSystem = new TutorialSystem();
        this.setupTutorialSystem();
        
        // Setup enemy system callbacks for wave tracking
        this.enemySystem.setOnEnemySpawned(() => {
            this.waveSystem.onEnemySpawned();
        });
        this.enemySystem.setOnEnemyKilled(() => {
            this.waveSystem.onEnemyKilled();
        });
        
        // Setup UI callbacks
        this.setupUICallbacks();
        
        // Setup build mode callbacks
        this.setupBuildModeCallbacks();
        
        // Setup resource system listeners
        this.resourceSystem.onResourceChange((resources) => {
            this.uiManager.updateResources(resources.food, resources.wood);
        });
        
        // Setup day system listeners
        this.daySystem.onStateChange((dayInfo) => {
            this.uiManager.updateDayInfo(dayInfo.day, dayInfo.state);
            this.uiManager.setEndDayEnabled(dayInfo.state === DayState.DAY);
            this.uiManager.setBuildButtonEnabled(dayInfo.state === DayState.DAY);
            // Update visual environment based on day/night state
            this.sceneManager.updateDayNightVisuals(dayInfo.state);
            
            // Update stamina display when day changes (stamina refreshes on new day)
            this.uiManager.updateStamina(this.daySystem.getStamina(), this.daySystem.getMaxStamina());
            
            // Start wave when night starts
            if (dayInfo.state === DayState.NIGHT) {
                // Exit build mode when night starts
                if (this.buildModeSystem.isActive()) {
                    this.exitBuildMode();
                }
                this.startWave();
                
                // Tutorial step 5 completion is checked in updateTutorialUI
            }
        });
        
        // Set initial day visuals
        this.sceneManager.updateDayNightVisuals(DayState.DAY);
        
        // Initial UI update
        this.uiManager.updateResources(0, 0);
        this.uiManager.updateDayInfo(1, DayState.DAY);
        this.uiManager.setEndDayEnabled(true);
        this.uiManager.setBuildButtonEnabled(true);
        this.uiManager.updateWaveInfo(0, 0, 0); // No wave during day
        this.uiManager.updateStamina(this.daySystem.getStamina(), this.daySystem.getMaxStamina());
    }
    
    setupTutorialSystem() {
        // Set up completion checks for each tutorial step
        this.tutorialSystem.setStepCompletionCheck(0, () => {
            // Step 1: Cut down trees
            return this.treesCutCount > 0;
        });
        
        this.tutorialSystem.setStepCompletionCheck(1, () => {
            // Step 2: Build a cat den
            return this.firstCatDenBuilt;
        });
        
        this.tutorialSystem.setStepCompletionCheck(2, () => {
            // Step 3: Spawn a cat
            return this.catsSpawnedCount > 0;
        });
        
        this.tutorialSystem.setStepCompletionCheck(3, () => {
            // Step 4: Assign cat to tower
            return this.catsAssignedToTowerCount > 0;
        });
        
        this.tutorialSystem.setStepCompletionCheck(4, () => {
            // Step 5: Go to night
            return this.daySystem.isNight() && this.daySystem.getCurrentDay() === 1;
        });
        
        this.tutorialSystem.setStepCompletionCheck(5, () => {
            // Step 6: Survive the first night
            return this.waveSystem.getCurrentWave() === 1 && this.waveSystem.isWaveComplete();
        });
    }
    
    startWave() {
        const currentDay = this.daySystem.getCurrentDay();
        const waveNumber = currentDay; // Each day = 1 wave
        
        // Calculate miceAlert from trees cut today
        const treesCutToday = this.daySystem.getTreesCutToday();
        const miceAlert = Math.min(treesCutToday * 0.5, WAVE_CONFIG.miceAlert.maxExtraEnemies);
        
        // Start the wave
        this.waveSystem.startWave(waveNumber, miceAlert);
        const waveConfig = this.waveSystem.waveConfig;
        
        // Update UI
        this.uiManager.updateWaveInfo(waveNumber, 0, waveConfig.enemyCount);
        
        // Set lastSpawnTime so first enemy spawns after initial delay
        // For wave 5 (spawnInterval = 0), spawn immediately on first update tick
        if (waveNumber === 5) {
            this.lastSpawnTime = this.gameTime;
        } else {
            // For other waves, set lastSpawnTime so first spawn happens after initial delay
            // timeSinceLastSpawn = gameTime - (gameTime - (spawnInterval - delay)) = spawnInterval - delay
            // After delay: timeSinceLastSpawn = spawnInterval, triggering spawn
            this.lastSpawnTime = this.gameTime - (waveConfig.spawnInterval - WAVE_CONFIG.initialSpawnDelay);
        }
    }
    
    generateTrees() {
        const mapSize = this.mapSystem.getMapSize();
        const boundary = this.mapSystem.getBoundary();
        const treeCount = MAP_CONFIG.treeCount;
        
        // Avoid center area for totem (scaled proportionally)
        const centerRadius = MAP_CONFIG.centerRadius;
        
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
    
    setupBuildModeCallbacks() {
        // Build button callback
        this.uiManager.setBuildButtonCallback(() => {
            this.toggleBuildMode();
        });
    }
    
    toggleBuildMode() {
        // Can only enter build mode during day
        if (!this.daySystem.isDay() && !this.buildModeSystem.isActive()) {
            return;
        }
        
        const wasActive = this.buildModeSystem.isActive();
        this.buildModeSystem.toggleBuildMode();
        
        if (this.buildModeSystem.isActive()) {
            this.enterBuildMode();
        } else {
            this.exitBuildMode();
        }
    }
    
    enterBuildMode() {
        // Show build menu
        const buildItems = this.buildModeSystem.getBuildItems();
        this.uiManager.showBuildMenu(
            buildItems,
            (itemId) => {
                const discountInfo = this.getDiscountInfo(itemId);
                return this.buildModeSystem.canAffordBuildItem(itemId, this.daySystem, this.resourceSystem, discountInfo);
            },
            (itemId) => this.selectBuildItem(itemId),
            (itemId) => this.getDiscountInfo(itemId)
        );
        
        // Set build mode active visuals
        this.uiManager.setBuildModeActive(true);
        
        // Show build instructions
        this.uiManager.showBuildInstructions(this.buildModeSystem.isInMenu());
        
        // Initialize placement cursor at player position
        const playerPos = this.player.getPosition();
        this.buildModeSystem.initializePlacementCursor(playerPos);
    }
    
    exitBuildMode() {
        // Hide build menu
        this.uiManager.hideBuildMenu();
        
        // Hide build instructions
        this.uiManager.hideBuildInstructions();
        
        // Remove build mode visuals
        this.uiManager.setBuildModeActive(false);
        
        // Remove ghost preview and placement cursor
        if (this.ghostPreview) {
            this.sceneManager.remove(this.ghostPreview.getMesh());
            this.ghostPreview.remove();
            this.ghostPreview = null;
        }
        
        if (this.placementCursor) {
            this.sceneManager.remove(this.placementCursor.getMesh());
            this.placementCursor.remove();
            this.placementCursor = null;
        }
        
        // Hide totem influence visualization
        this.hideTotemInfluenceVisualization();
        
        // Exit build mode system
        this.buildModeSystem.exitBuildMode();
        this.usingKeyboardPlacement = false;
    }
    
    selectBuildItem(itemId) {
        if (this.buildModeSystem.selectBuildItem(itemId)) {
            // Hide build menu
            this.uiManager.hideBuildMenu();
            
            // Update instructions for placement mode
            this.uiManager.showBuildInstructions(false);
            
            // Create ghost preview
            const buildItem = this.buildModeSystem.getSelectedBuildItem();
            if (buildItem) {
                this.ghostPreview = new GhostPreview(buildItem);
                this.sceneManager.add(this.ghostPreview.getMesh());
                
                // Show totem influence radius
                this.showTotemInfluenceVisualization();
            }
        }
    }
    
    showTotemInfluenceVisualization() {
        if (this.totemInfluenceVisualization) {
            this.hideTotemInfluenceVisualization();
        }
        
        const totemPos = this.forestTotem.getPosition();
        const radius = this.buildModeSystem.getTotemInfluenceRadius();
        
        // Create a ring geometry to show influence radius
        const ringGeometry = new THREE.RingGeometry(radius - 0.1, radius, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(totemPos.x, 0.01, totemPos.z);
        
        // Add a semi-transparent circle
        const circleGeometry = new THREE.CircleGeometry(radius, 64);
        const circleMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.rotation.x = -Math.PI / 2;
        circle.position.set(totemPos.x, 0.01, totemPos.z);
        
        const group = new THREE.Group();
        group.add(ring);
        group.add(circle);
        
        this.totemInfluenceVisualization = group;
        this.sceneManager.add(group);
    }
    
    hideTotemInfluenceVisualization() {
        if (this.totemInfluenceVisualization) {
            this.sceneManager.remove(this.totemInfluenceVisualization);
            this.totemInfluenceVisualization = null;
        }
    }
    
    // Helper method to clean up placement visuals (reduces code duplication)
    cancelPlacementVisuals() {
        if (this.ghostPreview) {
            this.sceneManager.remove(this.ghostPreview.getMesh());
            this.ghostPreview.remove();
            this.ghostPreview = null;
        }
        this.hideTotemInfluenceVisualization();
    }
    
    update(deltaTime) {
        // Don't update if game is over
        if (!this.isRunning || this.forestTotem.isDestroyed()) {
            return;
        }
        
        // Don't update game logic when in menu state
        if (this.gameState === 'menu') {
            // Still update input for any menu interactions
            this.inputManager.update();
            return;
        }
        
        // Update input (needed for ESC key detection even when paused)
        this.inputManager.update();
        
        // Handle pause menu toggle (ESC key, but not in build mode)
        if (this.gameState === 'paused') {
            // ESC closes pause menu when paused
            if (this.inputManager.isAnyKeyPressed(CONTROLS.exitBuildMode)) {
                if (!this.pauseMenuTogglePressed) {
                    this.resumeGame();
                    this.pauseMenuTogglePressed = true;
                }
            } else {
                this.pauseMenuTogglePressed = false;
            }
            // Don't update game logic when paused
            return;
        }
        
        // Handle pause menu toggle when playing
        if (this.gameState === 'playing') {
            if (this.inputManager.isAnyKeyPressed(CONTROLS.exitBuildMode)) {
                // Only open pause menu if not in build mode
                if (!this.buildModeSystem.isActive()) {
                    if (!this.pauseMenuTogglePressed) {
                        this.pauseGame();
                        this.pauseMenuTogglePressed = true;
                    }
                }
            } else {
                this.pauseMenuTogglePressed = false;
            }
        }
        
        // Update game time
        this.gameTime += deltaTime;
        
        // Update day/night visual transitions
        this.sceneManager.updateDayNightTransition(deltaTime);
        
        // Update visual effects
        this.sceneManager.update(deltaTime);
        
        // Handle build mode
        this.handleBuildMode(deltaTime);
        
        // Update player (disable movement when in build mode placement)
        if (!this.buildModeSystem.isInPlacement()) {
            this.player.update(deltaTime, this.inputManager, this.mapSystem);
            
            // Handle player combat
            if (this.daySystem.isNight()) {
                const attackInput = this.inputManager.mouse.clicked && this.inputManager.mouse.button === 0 ||
                                   this.inputManager.isAnyKeyPressed(CONTROLS.attack);
                if (attackInput) {
                    const enemies = this.enemySystem.getEnemies();
                    this.player.attack(deltaTime, enemies);
                }
            }
        }
        
        // Update camera to follow player (pass mapSystem for boundary slowdown)
        this.sceneManager.updateCamera(this.player.getPosition(), this.mapSystem);
        
        // Handle tree cutting (continuous hold interaction)
        this.handleTreeCutting(deltaTime);
        
        // Update tree progress bars
        const camera = this.sceneManager.camera;
        this.uiManager.updateTreeProgressBars(this.trees, camera);
        
        // Update tree tooltips
        this.updateTreeTooltips(camera);
        
        // Handle Cat Den interactions
        this.handleCatDenInteractions(deltaTime);
        
        // Update Cat Den progress bars
        this.uiManager.updateCatDenProgressBars(this.buildings, camera);
        
        // Handle Tower interactions
        this.handleTowerInteractions(deltaTime);
        
        // Update Cat Den tooltips
        this.updateCatDenTooltips(camera);
        
        // Update Tower tooltips
        this.updateTowerTooltips(camera);
        
        // Update cats
        for (const cat of this.cats) {
            cat.update(deltaTime);
        }
        
        // Update towers
        const enemies = this.enemySystem.getEnemies();
        const totemPos = this.forestTotem.getPosition();
        for (const tower of this.towers) {
            tower.update(deltaTime, enemies, totemPos);
        }
        
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
                // Track for tutorial
                this.treesCutCount++;
                // Mark resources as given to prevent duplicate rewards
                tree.resourcesGiven = true;
                // Visual effect for tree cut
                this.sceneManager.createParticleEffect(tree.getPosition(), 'treeCut');
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
        this.enemySystem.update(deltaTime, this.pathfindingSystem, this.forestTotem, this.trees, this.player);
        
        // Update totem health bar
        this.uiManager.updateTotemHealth(
            this.forestTotem.getHealth(),
            this.forestTotem.getMaxHealth()
        );
        
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
                    
                    // For wave 5 (boss), spawn immediately on the first tick, then done
                    if (this.waveSystem.getCurrentWave() === 5) {
                        if (this.waveSystem.enemiesSpawned === 0) {
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
        
        // Update construction sites
        for (const site of this.constructionSites) {
            site.update(deltaTime);
            
            if (site.isConstructionComplete()) {
                // Create final building based on build item type
                const sitePos = site.getPosition();
                const buildItem = site.buildItem;
                let building = null;
                
                if (buildItem.id === 'cat-den') {
                    building = new CatDen(sitePos.x, sitePos.z);
                    // Track first cat den for tutorial and discount
                    if (!this.firstCatDenBuilt) {
                        this.firstCatDenBuilt = true;
                    }
                } else if (buildItem.id === 'tower') {
                    building = new Tower(sitePos.x, sitePos.z);
                    this.towers.push(building);
                    // Track first tower for tutorial and discount
                    if (!this.firstTowerBuilt) {
                        this.firstTowerBuilt = true;
                    }
                }
                
                if (building) {
                    building.build();
                    this.buildings.push(building);
                    this.sceneManager.add(building.getMesh());
                    building.init();
                    
                    // Visual effect for building completion
                    this.sceneManager.createParticleEffect(sitePos, 'buildingComplete');
                }
                
                // Remove construction site
                site.remove();
                this.sceneManager.remove(site.getMesh());
            }
        }
        
        // Remove completed construction sites
        this.constructionSites = this.constructionSites.filter(site => !site.isConstructionComplete());
        
        // Check for game over (totem destroyed)
        if (this.forestTotem.isDestroyed()) {
            this.handleGameOver();
        }
        
        // Exit build mode if stamina reaches zero
        if (this.buildModeSystem.isActive() && !this.daySystem.hasStamina()) {
            this.exitBuildMode();
        }
        
        // Update tutorial UI
        if (this.tutorialSystem && this.tutorialSystem.isActive && !this.tutorialSystem.isTutorialComplete()) {
            this.updateTutorialUI();
        }
    }
    
    handleBuildMode(deltaTime) {
        // Handle build mode toggle (allow entering even when inactive)
        if (this.inputManager.isAnyKeyPressed(CONTROLS.toggleBuildMode)) {
            // Use a flag to prevent multiple toggles in one frame
            if (!this.buildModeTogglePressed) {
                this.toggleBuildMode();
                this.buildModeTogglePressed = true;
            }
        } else {
            this.buildModeTogglePressed = false;
        }

        if (!this.buildModeSystem.isActive()) {
            return;
        }
        
        // Handle exit build mode
        if (this.inputManager.isAnyKeyPressed(CONTROLS.exitBuildMode)) {
            if (this.buildModeSystem.isActive()) {
                // If in placement, cancel placement first
                if (this.buildModeSystem.isInPlacement()) {
                    this.cancelPlacementVisuals();
                }
                // Exit build mode completely
                this.exitBuildMode();
            }
        }
        
        // Handle build mode menu state
        if (this.buildModeSystem.isInMenu()) {
            this.handleBuildMenuInput();
        }
        
        // Handle placement state
        if (this.buildModeSystem.isInPlacement()) {
            this.handlePlacementMode(deltaTime);
        }
    }
    
    handleBuildMenuInput() {
        const buildItems = this.buildModeSystem.getBuildItems();
        const itemIds = Object.keys(buildItems);
        
        // Number key selection (1-9)
        const numberKeys = [
            CONTROLS.selectItem1, CONTROLS.selectItem2, CONTROLS.selectItem3,
            CONTROLS.selectItem4, CONTROLS.selectItem5, CONTROLS.selectItem6,
            CONTROLS.selectItem7, CONTROLS.selectItem8, CONTROLS.selectItem9
        ];
        for (let i = 0; i < Math.min(itemIds.length, 9); i++) {
            if (this.inputManager.isAnyKeyPressed(numberKeys[i])) {
                const itemId = itemIds[i];
                if (this.buildModeSystem.canAffordBuildItem(itemId, this.daySystem, this.resourceSystem)) {
                    this.selectBuildItem(itemId);
                }
                return;
            }
        }
        
        // Arrow key navigation (only in menu mode, not placement)
        let menuIndex = this.uiManager.selectedBuildItemIndex;
        if (menuIndex < 0) {
            menuIndex = 0;
            this.uiManager.selectBuildMenuItem(0);
        }
        
        if (this.inputManager.isAnyKeyPressed(CONTROLS.menuUp)) {
            const newIndex = Math.max(0, menuIndex - 1);
            this.uiManager.selectBuildMenuItem(newIndex);
        } else if (this.inputManager.isAnyKeyPressed(CONTROLS.menuDown)) {
            const newIndex = Math.min(itemIds.length - 1, menuIndex + 1);
            this.uiManager.selectBuildMenuItem(newIndex);
        } else if (this.inputManager.isAnyKeyPressed(CONTROLS.menuConfirm)) {
            const currentIndex = this.uiManager.selectedBuildItemIndex;
            if (currentIndex >= 0 && currentIndex < itemIds.length) {
                const itemId = itemIds[currentIndex];
                if (this.buildModeSystem.canAffordBuildItem(itemId, this.daySystem, this.resourceSystem)) {
                    this.selectBuildItem(itemId);
                }
            }
        }
    }
    
    handlePlacementMode(deltaTime) {
        // Update placement cursor for keyboard input
        this.buildModeSystem.updatePlacementCursor(this.inputManager);
        
        // Determine placement position (mouse or keyboard)
        let placementX, placementZ;
        let usingKeyboard = false;
        
        // Check if keyboard movement keys are pressed (indicates keyboard-only mode)
        usingKeyboard = this.inputManager.isMovementKeyPressed();
        
        if (usingKeyboard) {
            this.usingKeyboardPlacement = true;
        }
        
        if (this.usingKeyboardPlacement || usingKeyboard) {
            // Use placement cursor position
            const cursorPos = this.buildModeSystem.getPlacementCursorPosition();
            placementX = cursorPos.x;
            placementZ = cursorPos.z;
            
            // Show placement cursor
            if (!this.placementCursor) {
                this.placementCursor = new PlacementCursor();
                this.sceneManager.add(this.placementCursor.getMesh());
            }
            this.placementCursor.setPosition(placementX, placementZ);
            this.placementCursor.setVisible(true);
        } else {
            // Use mouse position (raycast to ground)
            const raycaster = this.sceneManager.getRaycaster();
            const intersects = raycaster.intersectObjects([this.mapSystem.ground]);
            
            if (intersects.length > 0) {
                const point = intersects[0].point;
                placementX = point.x;
                placementZ = point.z;
                const pos = { x: placementX, z: placementZ };
                this.buildModeSystem.snapToGrid(pos);
                placementX = pos.x;
                placementZ = pos.z;
            } else {
                return; // Can't place if mouse isn't over ground
            }
            
            // Hide placement cursor when using mouse
            if (this.placementCursor) {
                this.placementCursor.setVisible(false);
            }
        }
        
        // Update ghost preview position
        if (this.ghostPreview) {
            this.ghostPreview.setPosition(placementX, placementZ);
            
            // Get discount info for validation
            const buildItem = this.buildModeSystem.getSelectedBuildItem();
            const discountInfo = buildItem ? this.getDiscountInfo(buildItem.id) : null;
            
            // Validate placement
            const validation = this.buildModeSystem.validatePlacement(
                placementX, placementZ,
                this.daySystem, this.resourceSystem,
                this.trees, this.buildings, this.forestTotem, this.mapSystem,
                discountInfo
            );
            
            this.ghostPreview.updateValidity(validation.valid);
        }
        
        // Handle placement confirmation
        if (this.inputManager.isAnyKeyPressed(CONTROLS.confirmBuild) || 
            (this.inputManager.mouse.clicked && this.inputManager.mouse.button === 0)) {
            this.confirmPlacement(placementX, placementZ);
        }
        
        // Handle placement cancellation (right click returns to menu, Esc exits completely)
        if (this.inputManager.isAnyKeyPressed(CONTROLS.cancelBuild)) {
            this.buildModeSystem.cancelPlacement();
            this.cancelPlacementVisuals();
            // Return to menu (Esc key exits completely, handled in handleBuildMode)
            this.enterBuildMode();
        }
    }
    
    confirmPlacement(x, z) {
        const buildItem = this.buildModeSystem.getSelectedBuildItem();
        if (!buildItem) return;
        
        // Get discount info
        const discountInfo = this.getDiscountInfo(buildItem.id);
        
        // Validate placement again (also validated in handlePlacementMode for visual feedback)
        // This ensures resources haven't changed and placement is still valid at confirmation time
        const validation = this.buildModeSystem.validatePlacement(
            x, z,
            this.daySystem, this.resourceSystem,
            this.trees, this.buildings, this.forestTotem, this.mapSystem,
            discountInfo
        );
        
        if (!validation.valid) {
            return; // Can't place here
        }
        
        // Calculate costs with discount
        const costs = this.buildModeSystem.getBuildCosts(buildItem.id, discountInfo);
        
        // Deduct resources
        this.resourceSystem.spendWood(costs.wood);
        this.daySystem.consumeStamina(costs.stamina);
        this.uiManager.updateStamina(this.daySystem.getStamina(), this.daySystem.getMaxStamina());
        
        // Create construction site
        const constructionSite = new ConstructionSite(x, z, buildItem);
        this.constructionSites.push(constructionSite);
        this.sceneManager.add(constructionSite.getMesh());
        
        // Remove placement visuals
        this.cancelPlacementVisuals();
        
        // Exit build mode after placing building
        this.exitBuildMode();
    }
    
    updateTreeTooltips(camera) {
        if (!this.daySystem.isDay()) {
            // Hide all tooltips at night
            for (const tree of this.trees) {
                this.uiManager.hideTooltip(tree);
            }
            return;
        }
        
        const tooltipTargets = [];
        
        for (const tree of this.trees) {
            // Check if tree is eligible for tooltip
            const isEligible = !tree.isCut && 
                              !tree.isFalling && 
                              !tree.isInteracting &&
                              this.player.canInteractWith(tree);
            
            if (isEligible) {
                // Check if player has enough stamina
                const hasStamina = this.daySystem.hasStamina();
                
                tooltipTargets.push({
                    target: tree,
                    config: {
                        title: 'Cut Tree',
                        cost: { type: 'stamina', amount: 1 },
                        hasResources: hasStamina,
                        worldOffset: { x: 0, y: 4.5, z: 0 }
                    },
                    shouldShow: true
                });
            } else {
                // Hide tooltip for this tree
                this.uiManager.hideTooltip(tree);
            }
        }
        
        // Update tooltips for eligible trees
        for (const target of tooltipTargets) {
            this.uiManager.showTooltip(target.target, target.config, camera);
        }
    }
    
    handleTreeCutting(deltaTime) {
        if (!this.daySystem.isDay()) {
            return; // Can't cut trees at night
        }
        
        // Check if interact key is being held
        const spaceHeld = this.inputManager.isAnyKeyHeld(CONTROLS.interact);
        
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
                    // Start falling animation and consume stamina
                    if (this.daySystem.consumeStamina(1)) {
                        nearestTree.startFalling(this.player.getPosition());
                        // Update UI with new stamina value
                        this.uiManager.updateStamina(this.daySystem.getStamina(), this.daySystem.getMaxStamina());
                    } else {
                        // No stamina - stop interaction
                        nearestTree.stopInteraction();
                    }
                } else if (!nearestTree.isInteracting && nearestTree.interactionProgress < 1.0) {
                    // Start interaction only if stamina is available AND not already interacting AND progress hasn't reached 1.0
                    if (this.daySystem.hasStamina()) {
                        nearestTree.startInteraction();
                    }
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
    
    handleCatDenInteractions(deltaTime) {
        if (!this.daySystem.isDay()) {
            return; // Can only interact during day
        }
        
        // Check if space is being held (same as tree cutting)
        const spaceHeld = this.inputManager.isKeyHeld(' ');
        
        // Find nearest Cat Den within range
        let nearestCatDen = null;
        let nearestDistance = Infinity;
        
        for (const building of this.buildings) {
            if (building instanceof CatDen && building.getIsBuilt()) {
                if (building.canInteract(this.player.getPosition(), this.daySystem)) {
                    const distance = this.player.getPosition().distanceTo(building.getPosition());
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestCatDen = building;
                    }
                }
            }
        }
        
        // Stop interactions for Cat Dens that are no longer in range
        for (const building of this.buildings) {
            if (building instanceof CatDen && building.isInteracting && building !== nearestCatDen) {
                building.stopInteraction();
            }
        }
        
        if (nearestCatDen) {
            if (spaceHeld) {
                // Check if interaction is complete (progress reached 1.0) BEFORE starting new interaction
                if (nearestCatDen.interactionProgress >= 1.0) {
                    // Spawn cat and consume resources
                    const spawnCost = nearestCatDen.getSpawnCost();
                    if (this.resourceSystem.canAffordFood(spawnCost.food) && 
                        this.daySystem.hasStamina() && 
                        this.daySystem.getStamina() >= spawnCost.stamina) {
                        // Deduct resources
                        this.resourceSystem.spendFood(spawnCost.food);
                        this.daySystem.consumeStamina(spawnCost.stamina);
                        this.uiManager.updateStamina(this.daySystem.getStamina(), this.daySystem.getMaxStamina());
                        
                        // Spawn cat
                        this.spawnCatFromDen(nearestCatDen);
                        
                        // Reset interaction progress
                        nearestCatDen.stopInteraction();
                    } else {
                        // No resources - stop interaction
                        nearestCatDen.stopInteraction();
                    }
                } else if (!nearestCatDen.isInteracting && nearestCatDen.interactionProgress < 1.0) {
                    // Start interaction only if resources are available AND not already interacting AND progress hasn't reached 1.0
                    const spawnCost = nearestCatDen.getSpawnCost();
                    if (this.resourceSystem.canAffordFood(spawnCost.food) && 
                        this.daySystem.hasStamina() && 
                        this.daySystem.getStamina() >= spawnCost.stamina) {
                        nearestCatDen.startInteraction();
                    }
                }
            } else {
                // Space not held - stop interaction
                if (nearestCatDen.isInteracting) {
                    nearestCatDen.stopInteraction();
                }
            }
        } else {
            // No Cat Den in range - stop all interactions
            for (const building of this.buildings) {
                if (building instanceof CatDen && building.isInteracting) {
                    building.stopInteraction();
                }
            }
        }
        
        // Update interaction progress for interacting Cat Dens
        for (const building of this.buildings) {
            if (building instanceof CatDen && building.isInteracting) {
                building.updateInteraction(deltaTime);
            }
        }
    }
    
    spawnCatFromDen(catDen) {
        // Create cat at Cat Den position with player's mask color
        const denPos = catDen.getPosition();
        const playerMaskColor = this.player.getMaskColor();
        const cat = new Cat(denPos.x, denPos.z, playerMaskColor);
        
        // Calculate idle position near Forest Totem
        const totemPos = this.forestTotem.getPosition();
        const angle = Math.random() * Math.PI * 2;
        const radius = MAP_CONFIG.catSpawnRadius.min + Math.random() * (MAP_CONFIG.catSpawnRadius.max - MAP_CONFIG.catSpawnRadius.min);
        const idleX = totemPos.x + Math.cos(angle) * radius;
        const idleZ = totemPos.z + Math.sin(angle) * radius;
        const idlePosition = new THREE.Vector3(idleX, 0, idleZ);
        
        cat.setIdlePosition(idlePosition);
        this.cats.push(cat);
        this.sceneManager.add(cat.getMesh());
        cat.init();
        
        // Track for tutorial
        this.catsSpawnedCount++;
        
        // Visual effect for cat spawn
        this.sceneManager.createParticleEffect(denPos, 'catSpawn');
    }
    
    updateCatDenTooltips(camera) {
        if (!this.daySystem.isDay()) {
            // Hide all tooltips at night
            for (const building of this.buildings) {
                if (building instanceof CatDen) {
                    this.uiManager.hideTooltip(building);
                }
            }
            return;
        }
        
        const tooltipTargets = [];
        
        for (const building of this.buildings) {
            if (building instanceof CatDen && building.getIsBuilt()) {
                const canInteract = building.canInteract(this.player.getPosition(), this.daySystem);
                
                if (canInteract) {
                    const spawnCost = building.getSpawnCost();
                    const hasFood = this.resourceSystem.canAffordFood(spawnCost.food);
                    const hasStamina = this.daySystem.hasStamina() && 
                                      this.daySystem.getStamina() >= spawnCost.stamina;
                    const hasResources = hasFood && hasStamina;
                    
                    tooltipTargets.push({
                        target: building,
                        config: {
                            title: 'Spawn Cat',
                            cost: { type: 'food', amount: spawnCost.food },
                            secondaryCost: { type: 'stamina', amount: spawnCost.stamina },
                            hasResources: hasResources,
                            worldOffset: { x: 0, y: 4.5, z: 0 }
                        },
                        shouldShow: true
                    });
                } else {
                    this.uiManager.hideTooltip(building);
                }
            }
        }
        
        // Update tooltips for eligible Cat Dens
        for (const target of tooltipTargets) {
            this.uiManager.showTooltip(target.target, target.config, camera);
        }
    }
    
    handleTowerInteractions(deltaTime) {
        if (!this.daySystem.isDay()) {
            return; // Can only interact during day
        }
        
        // Check if space is pressed
        const spacePressed = this.inputManager.isKeyPressed(' ');
        
        if (!spacePressed) {
            return;
        }
        
        // Find nearest Tower within range
        let nearestTower = null;
        let nearestDistance = Infinity;
        
        for (const tower of this.towers) {
            if (tower.getIsBuilt() && tower.canInteract(this.player.getPosition(), this.daySystem)) {
                const distance = this.player.getPosition().distanceTo(tower.getPosition());
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestTower = tower;
                }
            }
        }
        
        if (nearestTower) {
            this.assignCatToTower(nearestTower);
        }
    }
    
    assignCatToTower(tower) {
        // If tower already has a cat, unassign it first
        if (tower.assignedCat) {
            tower.unassignCat();
            return;
        }
        
        // Find nearest available cat
        let nearestCat = null;
        let nearestDistance = Infinity;
        
        for (const cat of this.cats) {
            if (cat.isAvailable()) {
                const distance = cat.getPosition().distanceTo(tower.getPosition());
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestCat = cat;
                }
            }
        }
        
        if (nearestCat) {
            tower.assignCat(nearestCat);
            // Track for tutorial
            this.catsAssignedToTowerCount++;
        }
    }
    
    updateTowerTooltips(camera) {
        if (!this.daySystem.isDay()) {
            // Hide all tooltips at night
            for (const tower of this.towers) {
                this.uiManager.hideTooltip(tower);
            }
            return;
        }
        
        const tooltipTargets = [];
        
        for (const tower of this.towers) {
            if (tower.getIsBuilt()) {
                const canInteract = tower.canInteract(this.player.getPosition(), this.daySystem);
                
                if (canInteract) {
                    const hasAvailableCat = this.cats.some(cat => cat.isAvailable());
                    const hasAssignedCat = tower.assignedCat !== null;
                    
                    let title = 'Assign Cat';
                    if (hasAssignedCat) {
                        title = 'Unassign Cat';
                    } else if (!hasAvailableCat) {
                        title = 'No Cats Available';
                    }
                    
                    tooltipTargets.push({
                        target: tower,
                        config: {
                            title: title,
                            hasResources: hasAvailableCat || hasAssignedCat,
                            worldOffset: { x: 0, y: 4.5, z: 0 }
                        },
                        shouldShow: true
                    });
                } else {
                    this.uiManager.hideTooltip(tower);
                }
            }
        }
        
        // Update tooltips for eligible Towers
        for (const target of tooltipTargets) {
            this.uiManager.showTooltip(target.target, target.config, camera);
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
        
        // Hide all UI elements
        this.uiManager.hideAllUI();
        
        // Frame map and capture screenshot
        this.sceneManager.frameMapForScreenshot(this.mapSystem, () => {
            // Capture screenshot after camera transition
            const screenshotDataURL = this.sceneManager.captureScreenshot();
            
            // Show win screen with screenshot
            this.uiManager.showWinScreen(screenshotDataURL);
        });
    }
    
    handleGameOver() {
        this.isRunning = false;
        
        // Freeze all entities - stop all updates
        // The update loop will stop because isRunning is false
        
        // Show game over screen
        this.uiManager.showGameOverScreen();
    }
    
    render() {
        this.sceneManager.render();
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        // Always render (so pause menu is visible), but only update when not paused
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    start() {
        // Show main menu instead of starting game immediately
        this.gameState = 'menu';
        this.isRunning = true;
        this.lastTime = performance.now();
        this.uiManager.showMainMenu(() => {
            this.startGame();
        });
        // Start game loop for rendering (updates are skipped when in menu state)
        this.gameLoop(this.lastTime);
    }
    
    startGame() {
        this.gameState = 'playing';
        this.uiManager.hideMainMenu();
        
        // Show tutorial prompt
        this.uiManager.showTutorialPrompt(
            () => {
                // Yes - start tutorial
                this.tutorialSystem.start();
                this.uiManager.showTutorial();
                this.updateTutorialUI();
            },
            () => {
                // No - skip tutorial
                this.tutorialSystem.stop();
            }
        );
    }
    
    updateTutorialUI() {
        if (this.tutorialSystem.isActive && !this.tutorialSystem.isTutorialComplete()) {
            const currentStep = this.tutorialSystem.getCurrentStep();
            const progress = this.tutorialSystem.getProgress();
            
            if (currentStep) {
                this.uiManager.updateTutorialStep(currentStep, progress);
                
                // Check if current step is complete
                if (this.tutorialSystem.checkStepCompletion()) {
                    this.tutorialSystem.advanceStep();
                    
                    if (this.tutorialSystem.isTutorialComplete()) {
                        this.uiManager.hideTutorial();
                    } else {
                        this.updateTutorialUI();
                    }
                }
            }
        }
    }
    
    getDiscountInfo(itemId) {
        if (itemId === 'cat-den' && !this.firstCatDenBuilt) {
            return {
                hasDiscount: true,
                discount: BUILD_CONFIG.firstWaveDiscounts['cat-den']
            };
        } else if (itemId === 'tower' && !this.firstTowerBuilt) {
            return {
                hasDiscount: true,
                discount: BUILD_CONFIG.firstWaveDiscounts['tower']
            };
        }
        return { hasDiscount: false, discount: { wood: 0, stamina: 0 } };
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.uiManager.showPauseMenu(
                () => this.resumeGame(),
                () => this.restartGame()
            );
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.uiManager.hidePauseMenu();
        }
    }
    
    restartGame() {
        window.location.reload();
    }
    
    stop() {
        this.isRunning = false;
    }
}
