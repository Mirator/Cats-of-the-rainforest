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
import { AudioManager } from './AudioManager.js';
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
import { BUILDING_CONFIG } from '../config/buildings.js';
import { CONTROLS } from '../config/controls.js';
import { COMBAT_CONFIG } from '../config/combat.js';
import * as THREE from 'three';

export class Game {
    constructor(container) {
        this.container = container;
        this.sceneManager = null;
        this.inputManager = null;
        this.audioManager = null;
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

        // Tutorial highlight tracking
        this.tutorialHighlightGroup = null;
        this.tutorialHighlightMeshes = [];
        this.tutorialHighlightPulseTime = 0;
        this.lastTutorialStepIndex = -1;
        this.tutorialStepStartTime = 0;
        this.tutorialFocusTargets = [];
        this.tutorialFocusRadii = [];
        this.tutorialFocusActive = false;
        this.tutorialFocusOpacity = 0.6;
        
        this.player = null;
        this.trees = [];
        this.forestTotem = null;
        this.buildings = []; // Track all buildings
        this.constructionSites = []; // Track construction sites
        this.cats = []; // Track all cats
        this.towers = []; // Track all towers
        this.treesChanged = false; // Track if trees changed for pathfinding update

        // Totem interaction (hold to start night)
        this.isTotemInteracting = false;
        this.totemInteractionProgress = 0.0;
        this.towerInteractionHoldLock = false;
        this.catDenInteractionHoldLock = false;
        
        // Build mode entities
        this.ghostPreview = null;
        this.placementCursor = null;
        this.totemInfluenceVisualization = null;
        this.usingKeyboardPlacement = false;
        this.buildModeTogglePressed = false;
        this.awaitingPlacementConfirmRelease = false;
        
        this.lastTime = 0;
        this.isRunning = false;
        this.lastSpawnTime = 0;
        this.gameTime = 0; // Total game time in seconds
        this.hasWon = false;
        
        // Game state: 'menu', 'playing', 'paused'
        this.gameState = 'menu';
        this.pauseMenuTogglePressed = false;

        // Menu showcase (totem + cats)
        this.menuCats = [];
        this.menuSceneActive = false;
        this.menuCameraAngle = 0;
        this.menuCameraRadius = 14;
        this.menuCameraHeight = 9;
        this.menuCameraSpeed = 0.12;
        this.menuCameraLerpSpeed = 0.06;
        this.menuCameraBaseQuaternion = null;
        this.menuCameraPosition = new THREE.Vector3();
        this.menuCameraTarget = new THREE.Vector3();
        
        this.init();
    }
    
    init() {
        // Initialize core systems
        this.sceneManager = new SceneManager(this.container);
        this.inputManager = new InputManager();
        this.audioManager = new AudioManager();
        this.mapSystem = new MapSystem(this.sceneManager.scene);
        this.resourceSystem = new ResourceSystem();
        this.daySystem = new DaySystem();
        this.buildModeSystem = new BuildModeSystem();
        this.uiManager = new UIManager();
        
        // Initialize player at starting position
        const startPos = { x: -5, z: -5 };
        const startY = this.mapSystem.getHeightAt(startPos.x, startPos.z);
        this.player = new Player(startPos.x, startPos.z, startY);
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
        const centerY = this.mapSystem.getHeightAt(center.x, center.z);
        this.forestTotem = new ForestTotem(center.x, center.z, centerY);
        this.sceneManager.add(this.forestTotem.getMesh());
        this.forestTotem.init();
        this.forestTotem.setFacingAngle(Math.PI);
        
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
            this.playSfx('enemy_spawn');
        });
        this.enemySystem.setOnEnemyKilled(() => {
            this.waveSystem.onEnemyKilled();
            this.playSfx('enemy_death');
        });
        this.enemySystem.setOnTotemDamaged(() => {
            this.playSfx('totem_hit');
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

            // Regenerate totem when night ends (new day starts)
            if (dayInfo.state === DayState.DAY) {
                this.regenerateTotemHealth();
            }

            if (dayInfo.state === DayState.DAY) {
                this.playSfx('day_start');
            } else if (dayInfo.state === DayState.NIGHT) {
                this.playSfx('night_start');
            }

            this.updateAudioState();
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
            // Step 1: Forest Totem
            const totemPos = this.forestTotem.getPosition();
            const distance = this.player.getPosition().distanceTo(totemPos);
            const closeEnough = distance <= (COMBAT_CONFIG.totemCollisionRadius * 3);
            return closeEnough || this.getTutorialStepElapsedMs() >= 8000;
        });
        
        this.tutorialSystem.setStepCompletionCheck(1, () => {
            // Step 2: Gather resources
            return this.treesCutCount > 0;
        });
        
        this.tutorialSystem.setStepCompletionCheck(2, () => {
            // Step 3: Build a cat den
            return this.firstCatDenBuilt;
        });
        
        this.tutorialSystem.setStepCompletionCheck(3, () => {
            // Step 4: Spawn a cat
            return this.catsSpawnedCount > 0;
        });
        
        this.tutorialSystem.setStepCompletionCheck(4, () => {
            // Step 5: Assign cat to tower
            return this.catsAssignedToTowerCount > 0;
        });
        
        this.tutorialSystem.setStepCompletionCheck(5, () => {
            // Step 6: Go to night
            return this.daySystem.isNight() && this.daySystem.getCurrentDay() === 1;
        });

        this.tutorialSystem.setStepCompletionCheck(6, () => {
            // Step 7: Survive the first night
            return this.waveSystem.getCurrentWave() === 1 && this.waveSystem.isWaveComplete();
        });
    }
    
    startWave() {
        const currentDay = this.daySystem.getCurrentDay();
        const waveNumber = currentDay; // Each day = 1 wave

        // Start the wave
        this.waveSystem.startWave(waveNumber);
        const waveConfig = this.waveSystem.waveConfig;

        this.playSfx('wave_start');
        
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
        const minTreeDistance = COMBAT_CONFIG.treeCollisionRadius * 2;
        const maxAttemptsPerTree = 200;
        
        // Avoid center area for totem (scaled proportionally)
        const centerRadius = MAP_CONFIG.centerRadius;
        
        for (let i = 0; i < treeCount; i++) {
            let x, z;
            let placed = false;

            for (let attempts = 0; attempts < maxAttemptsPerTree; attempts++) {
                x = (Math.random() - 0.5) * (mapSize - 2);
                z = (Math.random() - 0.5) * (mapSize - 2);

                // Clamp to boundaries
                x = Math.max(-boundary + 1, Math.min(boundary - 1, x));
                z = Math.max(-boundary + 1, Math.min(boundary - 1, z));

                const inCenter = (x * x + z * z) < (centerRadius * centerRadius);
                if (inCenter) continue;

                if (this.isTreeSpawnPositionClear(x, z, minTreeDistance)) {
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                console.warn(`Failed to place tree ${i + 1}/${treeCount} without collisions.`);
                continue;
            }
            
            const y = this.mapSystem.getHeightAt(x, z);
            const tree = new Tree(x, z, y);
            this.trees.push(tree);
            this.sceneManager.add(tree.getMesh());
            // Initialize model loading
            tree.init();
        }
    }

    isTreeSpawnPositionClear(x, z, minDistance) {
        for (const tree of this.trees) {
            if (tree.isCut) continue;

            const dx = x - tree.position.x;
            const dz = z - tree.position.z;
            const distanceSq = (dx * dx) + (dz * dz);

            if (distanceSq < (minDistance * minDistance)) {
                return false;
            }
        }
        return true;
    }
    
    setupUICallbacks() {
        this.uiManager.setEndDayCallback(() => {
            if (this.daySystem.isDay()) {
                this.playSfx('totem_activate');
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
            this.playSfx('build_error');
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
        this.playSfx('build_open');
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
        this.playSfx('build_close');
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
        this.awaitingPlacementConfirmRelease = false;
    }
    
    selectBuildItem(itemId) {
        if (this.buildModeSystem.selectBuildItem(itemId)) {
            this.playSfx('build_select');
            this.awaitingPlacementConfirmRelease = true;
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
            this.uiManager.hideTooltip(this.ghostPreview);
            this.sceneManager.remove(this.ghostPreview.getMesh());
            this.ghostPreview.remove();
            this.ghostPreview = null;
        }
        this.hideTotemInfluenceVisualization();
    }

    resetTutorialStepTracking() {
        this.lastTutorialStepIndex = -1;
        this.tutorialStepStartTime = performance.now();
        this.tutorialHighlightPulseTime = 0;
        this.clearTutorialFocusOverlay();
    }

    getTutorialStepElapsedMs() {
        return performance.now() - this.tutorialStepStartTime;
    }

    clearTutorialHighlights() {
        if (this.tutorialHighlightGroup) {
            this.sceneManager.remove(this.tutorialHighlightGroup);
            this.tutorialHighlightGroup.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach((material) => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
        }
        this.tutorialHighlightGroup = null;
        this.tutorialHighlightMeshes = [];
    }

    clearTutorialFocusOverlay() {
        this.tutorialFocusTargets = [];
        this.tutorialFocusRadii = [];
        this.tutorialFocusActive = false;
        this.tutorialFocusOpacity = 0.6;
        if (this.uiManager) {
            this.uiManager.hideTutorialFocusOverlay();
        }
    }

    createTutorialRing(position, innerRadius, outerRadius, color, opacity = 0.6) {
        const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 48);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity,
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(position.x, position.y + 0.03, position.z);
        ring.renderOrder = 20;
        ring.userData = {
            baseOpacity: opacity,
            baseScale: 1,
            pulseAmplitude: 0.12,
            pulseSpeed: 2.2,
            phase: Math.random() * Math.PI * 2
        };
        this.tutorialHighlightMeshes.push(ring);
        return ring;
    }

    setTutorialHighlightsForStep(stepIndex) {
        this.clearTutorialHighlights();
        this.clearTutorialFocusOverlay();

        if (!this.sceneManager) {
            return;
        }

        if (stepIndex === 0) {
            const totemPos = this.forestTotem.getPosition();
            const group = new THREE.Group();

            const smallRing = this.createTutorialRing(totemPos, 0.55, 0.85, 0xffd36a, 0.7);
            smallRing.userData.pulseAmplitude = 0.08;

            const auraRing = this.createTutorialRing(totemPos, 0.9, 1.25, 0xffd36a, 0.45);
            auraRing.userData.pulseSpeed = 1.4;

            group.add(smallRing);
            group.add(auraRing);

            const totemLight = new THREE.PointLight(0xffe2a1, 1.4, 8, 2);
            totemLight.position.set(totemPos.x, totemPos.y + 1.7, totemPos.z);
            group.add(totemLight);

            const buildRadius = this.buildModeSystem.getTotemInfluenceRadius();
            if (buildRadius) {
                const buildRing = this.createTutorialRing(
                    totemPos,
                    Math.max(0.2, buildRadius - 0.25),
                    buildRadius,
                    0x5cff9a,
                    0.22
                );
                buildRing.userData.pulseSpeed = 0.8;
                buildRing.userData.pulseAmplitude = 0.04;
                group.add(buildRing);
            }

            this.tutorialHighlightGroup = group;
            this.sceneManager.add(group);
            const totemTop = totemPos.clone();
            totemTop.y += 2.4;
            this.tutorialFocusTargets = [totemPos, totemTop];
            this.tutorialFocusRadii = [260, 230];
            this.tutorialFocusActive = true;
            this.tutorialFocusOpacity = 0.35;
        } else if (stepIndex === 1) {
            const group = new THREE.Group();
            const treeCandidates = this.trees.filter((tree) => !tree.isCut && !tree.isFalling);
            const playerPos = this.player.getPosition();

            treeCandidates.sort((a, b) => {
                const dxA = a.position.x - playerPos.x;
                const dzA = a.position.z - playerPos.z;
                const distA = (dxA * dxA) + (dzA * dzA);
                const dxB = b.position.x - playerPos.x;
                const dzB = b.position.z - playerPos.z;
                const distB = (dxB * dxB) + (dzB * dzB);
                return distA - distB;
            });

            const highlightCount = Math.min(3, treeCandidates.length);
            const focusTargets = [];
            const focusRadii = [];
            for (let i = 0; i < highlightCount; i++) {
                const tree = treeCandidates[i];
                const coreRing = this.createTutorialRing(tree.position, 0.45, 0.95, 0x9bff7a, 0.8);
                coreRing.userData.pulseSpeed = 2.6 + (i * 0.3);
                coreRing.userData.pulseAmplitude = 0.16;
                group.add(coreRing);

                const outerRing = this.createTutorialRing(tree.position, 0.95, 1.45, 0x9bff7a, 0.45);
                outerRing.userData.pulseSpeed = 1.6 + (i * 0.2);
                outerRing.userData.pulseAmplitude = 0.08;
                group.add(outerRing);

                const treeBottomLight = new THREE.PointLight(0xffe2a1, 1.6, 10, 2);
                treeBottomLight.position.set(tree.position.x, tree.position.y + 0.4, tree.position.z);
                group.add(treeBottomLight);

                const treeTopLight = new THREE.PointLight(0xffe2a1, 2.0, 12, 2);
                treeTopLight.position.set(tree.position.x, tree.position.y + 2.8, tree.position.z);
                group.add(treeTopLight);
                focusTargets.push(tree.position);
                focusRadii.push(260);
            }

            if (highlightCount > 0) {
                this.tutorialHighlightGroup = group;
                this.sceneManager.add(group);
                this.tutorialFocusTargets = focusTargets;
                this.tutorialFocusRadii = focusRadii;
                this.tutorialFocusActive = true;
                this.tutorialFocusOpacity = 0.25;
            } else {
                this.clearTutorialHighlights();
            }
        }
    }

    updateTutorialFocusOverlay() {
        if (!this.tutorialFocusActive || !this.sceneManager || !this.uiManager) {
            return;
        }

        const camera = this.sceneManager.camera;
        const renderer = this.sceneManager.renderer;
        if (!camera || !renderer) {
            return;
        }

        const rect = renderer.domElement.getBoundingClientRect();
        const points = [];

        for (let i = 0; i < this.tutorialFocusTargets.length; i++) {
            const target = this.tutorialFocusTargets[i];
            if (!target) continue;
            const projected = target.clone().project(camera);

            if (projected.z < -1 || projected.z > 1) continue;

            const x = (projected.x * 0.5 + 0.5) * rect.width;
            const y = (-projected.y * 0.5 + 0.5) * rect.height;
            if (x < -200 || x > rect.width + 200 || y < -200 || y > rect.height + 200) {
                continue;
            }

            points.push({
                x,
                y,
                radius: this.tutorialFocusRadii[i] || 160
            });
        }

        if (points.length > 0) {
            this.uiManager.showTutorialFocusOverlay();
            this.uiManager.updateTutorialFocusOverlay(points, { baseOpacity: this.tutorialFocusOpacity });
        } else {
            this.uiManager.hideTutorialFocusOverlay();
        }
    }

    updateTutorialHighlights(deltaTime) {
        if (!this.tutorialHighlightGroup || this.tutorialHighlightMeshes.length === 0) {
            if (this.tutorialFocusActive) {
                this.updateTutorialFocusOverlay();
            }
            return;
        }

        this.tutorialHighlightPulseTime += deltaTime;

        this.tutorialHighlightMeshes.forEach((ring) => {
            if (!ring.material) return;
            const { baseOpacity, baseScale, pulseAmplitude, pulseSpeed, phase } = ring.userData;
            const pulse = (Math.sin(this.tutorialHighlightPulseTime * pulseSpeed + phase) + 1) * 0.5;
            const scale = baseScale + (pulseAmplitude * pulse);
            ring.scale.set(scale, scale, scale);
            ring.material.opacity = baseOpacity * (0.65 + (0.35 * pulse));
        });

        this.updateTutorialFocusOverlay();
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
            this.updateMenuScene(deltaTime);
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
        this.sceneManager.updateDayNightTransition(deltaTime, this.mapSystem);
        
        // Update visual effects
        this.sceneManager.update(deltaTime);

        // Update totem animation (glow/flicker)
        this.forestTotem.update(deltaTime);
        
        // Handle build mode
        this.handleBuildMode(deltaTime);
        
        const enemies = this.enemySystem ? this.enemySystem.getEnemies() : [];

        // Update player (disable movement when in build mode placement)
        if (!this.buildModeSystem.isInPlacement()) {
            this.player.update(deltaTime, this.inputManager, this.mapSystem, {
                trees: this.trees,
                buildings: this.buildings,
                totem: this.forestTotem,
                enemies,
                constructionSites: this.constructionSites
            });
            
            // Handle player combat
            if (this.daySystem.isNight()) {
                const mouseAttack = (this.inputManager.mouse.clicked || this.inputManager.mouse.down) &&
                    this.inputManager.mouse.button === 0;
                const attackInput = mouseAttack ||
                                   this.inputManager.isAnyKeyPressed(CONTROLS.attack);
                if (attackInput) {
                    const result = this.player.attack(deltaTime, enemies);
                    const attackForward = typeof this.player.getAttackForward === 'function'
                        ? this.player.getAttackForward()
                        : this.player.lastFacingDirection;
                    // Always show visual feedback when attack is attempted (even if on cooldown)
                    if (result.attacked) {
                        this.sceneManager.createSlashEffect(
                            this.player.getPosition(),
                            attackForward,
                            this.player.attackRange,
                            this.player.attackArc
                        );
                        this.playSfx('player_attack');
                    }
                    
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
        this.uiManager.updateEnemyHealthBars(enemies, camera);
        
        // Update tree tooltips
        this.updateTreeTooltips(camera);
        
        // Handle Cat Den interactions
        this.handleCatDenInteractions(deltaTime);
        
        // Update Cat Den progress bars
        this.uiManager.updateCatDenProgressBars(this.buildings, camera);

        // Handle Totem interaction (hold to start night)
        this.handleTotemInteractions(deltaTime);
        this.uiManager.updateTotemProgressBar(
            this.forestTotem,
            this.totemInteractionProgress,
            camera,
            this.isTotemInteracting
        );
        
        // Handle Tower interactions
        this.handleTowerInteractions(deltaTime);

        // Update Tower progress bars
        this.uiManager.updateTowerProgressBars(this.towers, camera);
        
        // Update Cat Den tooltips
        this.updateCatDenTooltips(camera);
        
        // Update Totem tooltip
        this.updateTotemTooltips(camera);
        
        // Update Tower tooltips
        this.updateTowerTooltips(camera);
        
        // Update cats
        for (const cat of this.cats) {
            cat.update(deltaTime, {
                daySystem: this.daySystem,
                totem: this.forestTotem,
                mapSystem: this.mapSystem,
                trees: this.trees,
                buildings: this.buildings,
                enemies: this.enemySystem ? this.enemySystem.getEnemies() : []
            });
        }

        // Update Cat Den animations (vines)
        for (const building of this.buildings) {
            if (building instanceof CatDen) {
                building.update(deltaTime, this.gameTime);
            }
        }
        
        // Update towers
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
                this.playSfx('resource_gain');
                // Track tree cut for stats
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
                    building = new CatDen(sitePos.x, sitePos.z, sitePos.y);
                    // Track first cat den for tutorial and discount
                    if (!this.firstCatDenBuilt) {
                        this.firstCatDenBuilt = true;
                    }
                } else if (buildItem.id === 'tower') {
                    building = new Tower(sitePos.x, sitePos.z, sitePos.y);
                    building.setFacingAngle(Math.PI);
                    building.onFire = () => this.playSfx('tower_fire');
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
                    this.playSfx('build_complete');
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
            this.updateTutorialHighlights(deltaTime);
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
                const discountInfo = this.getDiscountInfo(itemId);
                if (this.buildModeSystem.canAffordBuildItem(itemId, this.daySystem, this.resourceSystem, discountInfo)) {
                    this.selectBuildItem(itemId);
                } else {
                    this.playSfx('build_error');
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
            this.playSfx('ui_navigate');
        } else if (this.inputManager.isAnyKeyPressed(CONTROLS.menuDown)) {
            const newIndex = Math.min(itemIds.length - 1, menuIndex + 1);
            this.uiManager.selectBuildMenuItem(newIndex);
            this.playSfx('ui_navigate');
        } else if (this.inputManager.isAnyKeyPressed(CONTROLS.menuConfirm)) {
            const currentIndex = this.uiManager.selectedBuildItemIndex;
            if (currentIndex >= 0 && currentIndex < itemIds.length) {
                const itemId = itemIds[currentIndex];
                const discountInfo = this.getDiscountInfo(itemId);
                if (this.buildModeSystem.canAffordBuildItem(itemId, this.daySystem, this.resourceSystem, discountInfo)) {
                    this.selectBuildItem(itemId);
                } else {
                    this.playSfx('build_error');
                }
            }
        }
    }
    
    handlePlacementMode(deltaTime) {
        // Update placement cursor for keyboard input
        this.buildModeSystem.updatePlacementCursor(this.inputManager);
        
        // Determine placement position (mouse or keyboard)
        let placementX, placementZ;
        let placementY = 0;
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
            placementY = this.mapSystem.getHeightAt(placementX, placementZ);
            
            // Show placement cursor
            if (!this.placementCursor) {
                this.placementCursor = new PlacementCursor();
                this.sceneManager.add(this.placementCursor.getMesh());
            }
            this.placementCursor.setPosition(placementX, placementZ, placementY);
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
                placementY = this.mapSystem.getHeightAt(placementX, placementZ);
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
            this.ghostPreview.setPosition(placementX, placementZ, placementY);
            
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
            const camera = this.sceneManager.camera;
            if (!validation.valid && validation.reason === 'Outside totem influence radius') {
                this.uiManager.showTooltip(this.ghostPreview, {
                    title: 'Build closer to the Forest Totem',
                    worldOffset: { x: 0, y: 4.5, z: 0 }
                }, camera);
            } else {
                this.uiManager.hideTooltip(this.ghostPreview);
            }
        }

        // Require confirm input to be released after entering placement
        if (this.awaitingPlacementConfirmRelease) {
            const confirmHeld = this.inputManager.isAnyKeyPressed(CONTROLS.confirmBuild) ||
                this.inputManager.mouse.down;
            if (!confirmHeld) {
                this.awaitingPlacementConfirmRelease = false;
            }
        }
        
        // Handle placement confirmation
        if (!this.awaitingPlacementConfirmRelease && (this.inputManager.isAnyKeyPressed(CONTROLS.confirmBuild) || 
            (this.inputManager.mouse.clicked && this.inputManager.mouse.button === 0))) {
            this.confirmPlacement(placementX, placementZ, placementY);
        }
        
        // Handle placement cancellation (right click returns to menu, Esc exits completely)
        if (this.inputManager.isAnyKeyPressed(CONTROLS.cancelBuild)) {
            this.buildModeSystem.cancelPlacement();
            this.cancelPlacementVisuals();
            this.playSfx('ui_cancel');
            // Return to menu (Esc key exits completely, handled in handleBuildMode)
            this.enterBuildMode();
        }
    }
    
    confirmPlacement(x, z, y = 0) {
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
            this.playSfx('build_error');
            return; // Can't place here
        }
        
        // Calculate costs with discount
        const costs = this.buildModeSystem.getBuildCosts(buildItem.id, discountInfo);
        
        // Deduct resources
        this.resourceSystem.spendWood(costs.wood);
        this.daySystem.consumeStamina(costs.stamina);
        this.uiManager.updateStamina(this.daySystem.getStamina(), this.daySystem.getMaxStamina());
        
        // Create construction site
        const constructionSite = new ConstructionSite(x, z, buildItem, y);
        this.constructionSites.push(constructionSite);
        this.sceneManager.add(constructionSite.getMesh());

        this.playSfx('build_place');
        
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
                        this.playSfx('tree_fall');
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
                        this.playSfx('tree_chop');
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
        if (!spaceHeld) {
            this.catDenInteractionHoldLock = false;
        }
        
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
            const canSpawnCat = typeof nearestCatDen.canSpawnCat !== 'function' || nearestCatDen.canSpawnCat();

            if (!canSpawnCat && nearestCatDen.isInteracting) {
                nearestCatDen.stopInteraction();
            }

            if (spaceHeld && !this.catDenInteractionHoldLock) {
                // Check if interaction is complete (progress reached 1.0) BEFORE starting new interaction
                if (nearestCatDen.interactionProgress >= 1.0) {
                    // Spawn cat and consume resources
                    const spawnCost = nearestCatDen.getSpawnCost();
                    if (this.resourceSystem.canAffordFood(spawnCost.food) && 
                        this.daySystem.hasStamina() && 
                        this.daySystem.getStamina() >= spawnCost.stamina &&
                        canSpawnCat) {
                        // Deduct resources
                        this.resourceSystem.spendFood(spawnCost.food);
                        this.daySystem.consumeStamina(spawnCost.stamina);
                        this.uiManager.updateStamina(this.daySystem.getStamina(), this.daySystem.getMaxStamina());
                        
                        // Spawn cat
                        this.spawnCatFromDen(nearestCatDen);
                        this.catDenInteractionHoldLock = true;
                        
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
                        this.daySystem.getStamina() >= spawnCost.stamina &&
                        canSpawnCat) {
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

    handleTotemInteractions(deltaTime) {
        if (!this.daySystem.isDay()) {
            this.stopTotemInteraction();
            return;
        }

        const spaceHeld = this.inputManager.isAnyKeyHeld(CONTROLS.interact);
        const totemPos = this.forestTotem.getPosition();
        const distance = this.player.getPosition().distanceTo(totemPos);
        const inRange = distance <= BUILDING_CONFIG.forestTotem.interactionRange;

        if (!spaceHeld || !inRange) {
            this.stopTotemInteraction();
            return;
        }

        if (!this.isTotemInteracting) {
            this.isTotemInteracting = true;
            this.totemInteractionProgress = 0.0;
            this.playSfx('totem_charge');
        }

        this.totemInteractionProgress += deltaTime / BUILDING_CONFIG.forestTotem.interactionDuration;

        if (this.totemInteractionProgress >= 1.0) {
            this.totemInteractionProgress = 1.0;
            this.isTotemInteracting = false;
            this.playSfx('totem_activate');
            this.daySystem.endDay();
        }
    }

    stopTotemInteraction() {
        if (this.isTotemInteracting || this.totemInteractionProgress > 0) {
            this.isTotemInteracting = false;
            this.totemInteractionProgress = 0.0;
        }
    }
    
    spawnCatFromDen(catDen) {
        if (catDen && typeof catDen.canSpawnCat === 'function' && !catDen.canSpawnCat()) {
            return;
        }
        // Create cat at Cat Den position with player's mask color
        const denPos = catDen.getPosition();
        const playerMaskColor = this.player.getMaskColor();
        const cat = new Cat(denPos.x, denPos.z, playerMaskColor, denPos.y);
        cat.onGuardAttack = () => this.playSfx('cat_attack');
        
        // Calculate idle position near Forest Totem
        const totemPos = this.forestTotem.getPosition();
        const angle = Math.random() * Math.PI * 2;
        const radius = MAP_CONFIG.catSpawnRadius.min + Math.random() * (MAP_CONFIG.catSpawnRadius.max - MAP_CONFIG.catSpawnRadius.min);
        const idleX = totemPos.x + Math.cos(angle) * radius;
        const idleZ = totemPos.z + Math.sin(angle) * radius;
        const idleY = this.mapSystem.getHeightAt(idleX, idleZ);
        const idlePosition = new THREE.Vector3(idleX, idleY, idleZ);
        
        cat.setIdlePosition(idlePosition);
        this.cats.push(cat);
        this.sceneManager.add(cat.getMesh());
        cat.init();
        
        // Track for tutorial
        this.catsSpawnedCount++;

        if (catDen && typeof catDen.registerSpawnedCat === 'function') {
            catDen.registerSpawnedCat();
        }
        
        // Visual effect for cat spawn
        this.sceneManager.createParticleEffect(denPos, 'catSpawn');
        this.playSfx('cat_spawn');
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
                    const hasCapacity = typeof building.canSpawnCat !== 'function' || building.canSpawnCat();
                    const hasResources = hasFood && hasStamina && hasCapacity;
                    const catCount = typeof building.getCatCount === 'function' ? building.getCatCount() : null;
                    const maxCats = typeof building.getMaxCats === 'function' ? building.getMaxCats() : null;
                    const countText = catCount !== null && maxCats !== null ? ` (${catCount}/${maxCats})` : '';
                    const title = hasCapacity ? `Spawn Cat${countText}` : `Den Full${countText}`;
                    
                    tooltipTargets.push({
                        target: building,
                        config: {
                            title,
                            ...(hasCapacity ? {
                                cost: { type: 'food', amount: spawnCost.food },
                                secondaryCost: { type: 'stamina', amount: spawnCost.stamina }
                            } : {}),
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
            // Stop interactions when night begins
            for (const tower of this.towers) {
                if (tower.isInteracting) {
                    tower.stopInteraction();
                }
            }
            return; // Can only interact during day
        }

        const spaceHeld = this.inputManager.isAnyKeyHeld(CONTROLS.interact);
        if (!spaceHeld) {
            this.towerInteractionHoldLock = false;
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

        // Stop interactions for towers that are no longer in range
        for (const tower of this.towers) {
            if (tower.isInteracting && tower !== nearestTower) {
                tower.stopInteraction();
            }
        }

        if (nearestTower) {
            const hasAssignedCat = nearestTower.assignedCat !== null;
            const hasAvailableCat = this.cats.some(cat => cat.isAvailable());
            const canInteractAction = hasAssignedCat || hasAvailableCat;

            if (spaceHeld && !this.towerInteractionHoldLock) {
                if (nearestTower.interactionProgress >= 1.0) {
                    if (canInteractAction) {
                        this.assignCatToTower(nearestTower);
                        this.towerInteractionHoldLock = true;
                    }
                    nearestTower.stopInteraction();
                } else if (!nearestTower.isInteracting && nearestTower.interactionProgress < 1.0) {
                    if (canInteractAction) {
                        nearestTower.startInteraction();
                    }
                }
            } else if (nearestTower.isInteracting) {
                nearestTower.stopInteraction();
            }
        } else {
            // No tower in range - stop all interactions
            for (const tower of this.towers) {
                if (tower.isInteracting) {
                    tower.stopInteraction();
                }
            }
        }

        // Update interaction progress for interacting towers
        for (const tower of this.towers) {
            if (tower.isInteracting) {
                tower.updateInteraction(deltaTime);
            }
        }
    }
    
    assignCatToTower(tower) {
        // If tower already has a cat, unassign it first
        if (tower.assignedCat) {
            tower.unassignCat();
            this.playSfx('tower_unassign');
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
            this.playSfx('tower_assign');
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

    updateTotemTooltips(camera) {
        if (!this.daySystem.isDay()) {
            this.uiManager.hideTooltip(this.forestTotem);
            return;
        }

        const totemPos = this.forestTotem.getPosition();
        const distance = this.player.getPosition().distanceTo(totemPos);
        const inRange = distance <= BUILDING_CONFIG.forestTotem.interactionRange;

        if (inRange) {
            this.uiManager.showTooltip(this.forestTotem, {
                title: 'Start Night',
                hasResources: true,
                worldOffset: { x: 0, y: 5, z: 0 }
            }, camera);
        } else {
            this.uiManager.hideTooltip(this.forestTotem);
        }
    }
    
    completeWave() {
        const waveNumber = this.waveSystem.getCurrentWave();
        
        // Check for win condition
        if (this.waveSystem.hasWon()) {
            this.playSfx('game_win');
            this.handleWin();
            return;
        }

        this.playSfx('wave_complete');
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
            this.uiManager.showWinScreen(screenshotDataURL, this.treesCutCount);
        });
    }
    
    handleGameOver() {
        this.isRunning = false;
        this.playSfx('game_over');
        
        // Freeze all entities - stop all updates
        // The update loop will stop because isRunning is false
        
        // Show game over screen
        this.uiManager.showGameOverScreen(this.treesCutCount);
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
        this.setupMenuScene();
        this.uiManager.hideAllUI();
        this.uiManager.showMainMenu(() => {
            this.startGame();
        });
        this.updateAudioState();
        // Start game loop for rendering (updates are skipped when in menu state)
        this.gameLoop(this.lastTime);
    }
    
    startGame() {
        this.gameState = 'playing';
        this.cleanupMenuScene();
        this.uiManager.hideMainMenu();
        this.uiManager.showAllUI();
        
        // Show tutorial prompt
        this.uiManager.showTutorialPrompt(
            () => {
                // Yes - start tutorial
                this.clearTutorialHighlights();
                this.resetTutorialStepTracking();
                this.tutorialSystem.start();
                this.uiManager.showTutorial();
                this.updateTutorialUI();
                this.updateAudioState();
            },
            () => {
                // No - skip tutorial
                this.tutorialSystem.stop();
                this.clearTutorialHighlights();
                this.resetTutorialStepTracking();
                this.updateAudioState();
            }
        );
    }
    
    updateTutorialUI() {
        if (this.tutorialSystem.isActive && !this.tutorialSystem.isTutorialComplete()) {
            const currentStep = this.tutorialSystem.getCurrentStep();
            const progress = this.tutorialSystem.getProgress();
            const stepIndex = this.tutorialSystem.getCurrentStepIndex();
            
            if (currentStep) {
                if (stepIndex !== this.lastTutorialStepIndex) {
                    this.lastTutorialStepIndex = stepIndex;
                    this.tutorialStepStartTime = performance.now();
                    this.tutorialHighlightPulseTime = 0;
                    this.setTutorialHighlightsForStep(stepIndex);
                }

                this.uiManager.updateTutorialStep(currentStep, progress);
                
                // Check if current step is complete
                if (this.tutorialSystem.checkStepCompletion()) {
                    this.tutorialSystem.advanceStep();
                    
                    if (this.tutorialSystem.isTutorialComplete()) {
                        this.uiManager.hideTutorial();
                        this.clearTutorialHighlights();
                        this.resetTutorialStepTracking();
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

    regenerateTotemHealth() {
        if (!this.forestTotem || this.forestTotem.isDestroyed()) {
            return;
        }

        const maxHealth = this.forestTotem.getMaxHealth();
        const currentHealth = this.forestTotem.getHealth();
        const missingHealth = maxHealth - currentHealth;

        if (missingHealth > 0) {
            this.forestTotem.heal(missingHealth);
        }

        this.uiManager.updateTotemHealth(this.forestTotem.getHealth(), maxHealth);
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.updateAudioState();
            this.playSfx('pause_open');
            this.uiManager.showPauseMenu(
                () => this.resumeGame(),
                () => this.restartGame()
            );
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.updateAudioState();
            this.playSfx('pause_close');
            this.uiManager.hidePauseMenu();
        }
    }
    
    restartGame() {
        this.stop();
        window.location.reload();
    }
    
    stop() {
        this.isRunning = false;
        if (this.audioManager) {
            this.audioManager.stopAll();
        }
        if (this.inputManager) {
            this.inputManager.destroy();
        }
        if (this.sceneManager) {
            this.sceneManager.destroy();
        }
    }

    setupMenuScene() {
        if (this.menuSceneActive) return;
        this.menuSceneActive = true;
        this.menuCameraAngle = Math.random() * Math.PI * 2;
        this.menuCameraBaseQuaternion = this.sceneManager.camera.quaternion.clone();
        this.spawnMenuCats(13);
        this.updateMenuCamera(0, true);
    }

    cleanupMenuScene() {
        if (!this.menuSceneActive) return;
        this.menuSceneActive = false;
        this.menuCats.forEach((cat) => {
            if (cat && typeof cat.destroy === 'function') {
                cat.destroy();
            }
        });
        this.menuCats.length = 0;
        if (this.menuCameraBaseQuaternion) {
            this.sceneManager.camera.quaternion.copy(this.menuCameraBaseQuaternion);
            this.menuCameraBaseQuaternion = null;
        }
        if (this.player && this.sceneManager) {
            const playerPos = this.player.getPosition();
            this.menuCameraPosition.copy(playerPos).add(this.sceneManager.cameraOffset);
            this.sceneManager.camera.position.copy(this.menuCameraPosition);
        }
    }

    spawnMenuCats(count) {
        this.menuCats.forEach((cat) => {
            if (cat && typeof cat.destroy === 'function') {
                cat.destroy();
            }
        });
        this.menuCats.length = 0;

        if (!this.forestTotem || !this.mapSystem) return;
        const totemPos = this.forestTotem.getPosition();
        const radiusMin = MAP_CONFIG.catSpawnRadius.min + 0.6;
        const radiusMax = MAP_CONFIG.catSpawnRadius.max + 1.4;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
            const radius = radiusMin + Math.random() * (radiusMax - radiusMin);
            const x = totemPos.x + Math.cos(angle) * radius;
            const z = totemPos.z + Math.sin(angle) * radius;
            const y = this.mapSystem.getHeightAt(x, z);
            const cat = new Cat(x, z, null, y);
            cat.setIdlePosition(new THREE.Vector3(x, y, z));
            const initialTarget = this.getMenuCatTarget();
            if (initialTarget) {
                cat.setTargetPosition(initialTarget);
            }
            cat.menuWanderTimer = this.getMenuWanderInterval();
            this.menuCats.push(cat);
            this.sceneManager.add(cat.getMesh());
            cat.init();
        }
    }

    updateMenuScene(deltaTime) {
        if (!this.menuSceneActive) return;

        this.updateMenuCamera(deltaTime);

        if (this.forestTotem) {
            this.forestTotem.update(deltaTime);
        }

        if (this.menuCats.length > 0) {
            for (const cat of this.menuCats) {
                if (!cat) continue;
                cat.menuWanderTimer = (cat.menuWanderTimer ?? 0) - deltaTime;
                if (!cat.targetPosition || cat.reachedTarget || cat.menuWanderTimer <= 0) {
                    const nextTarget = this.getMenuCatTarget();
                    if (nextTarget) {
                        cat.setTargetPosition(nextTarget);
                    }
                    cat.menuWanderTimer = this.getMenuWanderInterval();
                }
                cat.update(deltaTime, {
                    mapSystem: this.mapSystem,
                    totem: this.forestTotem
                });
            }
        }

        this.sceneManager.update(deltaTime);
    }

    updateMenuCamera(deltaTime, snap = false) {
        if (!this.forestTotem || !this.sceneManager) return;
        this.menuCameraAngle += deltaTime * this.menuCameraSpeed;
        const totemPos = this.forestTotem.getPosition();
        const x = totemPos.x + Math.cos(this.menuCameraAngle) * this.menuCameraRadius;
        const z = totemPos.z + Math.sin(this.menuCameraAngle) * this.menuCameraRadius;
        const y = this.menuCameraHeight;

        this.menuCameraPosition.set(x, y, z);
        if (snap) {
            this.sceneManager.camera.position.copy(this.menuCameraPosition);
        } else {
            this.sceneManager.camera.position.lerp(this.menuCameraPosition, this.menuCameraLerpSpeed);
        }
        this.menuCameraTarget.set(totemPos.x, totemPos.y + 1.2, totemPos.z);
        this.sceneManager.camera.lookAt(this.menuCameraTarget);
    }

    getMenuCatTarget() {
        if (!this.forestTotem || !this.mapSystem) return null;
        const totemPos = this.forestTotem.getPosition();
        const radiusMin = MAP_CONFIG.catSpawnRadius.min + 0.8;
        const radiusMax = MAP_CONFIG.catSpawnRadius.max + 4.8;
        const angle = Math.random() * Math.PI * 2;
        const radius = radiusMin + Math.random() * (radiusMax - radiusMin);
        const x = totemPos.x + Math.cos(angle) * radius;
        const z = totemPos.z + Math.sin(angle) * radius;
        const clamped = this.mapSystem.clampPosition(x, z);
        const y = this.mapSystem.getHeightAt(clamped.x, clamped.z);
        return new THREE.Vector3(clamped.x, y, clamped.z);
    }

    getMenuWanderInterval() {
        return 1.6 + Math.random() * 3.2;
    }

    playSfx(key, options) {
        if (!this.audioManager) return;
        this.audioManager.playSfx(key, options);
    }

    updateAudioState() {
        if (!this.audioManager) return;
        const isMenu = this.gameState === 'menu';
        const isDay = this.daySystem?.getState() === DayState.DAY;

        if (isMenu) {
            this.audioManager.stopMusic();
            return;
        }

        if (isDay) {
            this.audioManager.playMusic('day', { loop: true, volume: 1, transition: true, fadeDuration: 2 });
        } else {
            this.audioManager.playMusic('night', { loop: true, volume: 1, transition: true, fadeDuration: 2 });
        }
    }
}
