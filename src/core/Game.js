import { SceneManager } from './SceneManager.js';
import { InputManager } from './InputManager.js';
import { MapSystem } from '../systems/MapSystem.js';
import { ResourceSystem } from '../systems/ResourceSystem.js';
import { DaySystem, DayState } from '../systems/DaySystem.js';
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
        
        this.player = null;
        this.trees = [];
        this.forestTotem = null;
        
        this.lastTime = 0;
        this.isRunning = false;
        
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
        });
        
        // Set initial day visuals
        this.sceneManager.updateDayNightVisuals(DayState.DAY);
        
        // Initial UI update
        this.uiManager.updateResources(0, 0);
        this.uiManager.updateDayInfo(1, DayState.DAY);
        this.uiManager.setEndDayEnabled(true);
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
        // Update input
        this.inputManager.update();
        
        // Update player
        this.player.update(deltaTime, this.inputManager, this.mapSystem);
        
        // Handle tree cutting
        if (this.inputManager.isActionPressed()) {
            this.handleTreeCutting();
        }
        
        // Remove cut trees
        this.trees = this.trees.filter(tree => {
            if (tree.isCut) {
                tree.remove();
                this.sceneManager.remove(tree.getMesh());
                return false;
            }
            return true;
        });
    }
    
    handleTreeCutting() {
        if (!this.daySystem.isDay()) {
            return; // Can't cut trees at night
        }
        
        // Find nearest tree within range
        let nearestTree = null;
        let nearestDistance = Infinity;
        
        for (const tree of this.trees) {
            if (!tree.isCut && this.player.canInteractWith(tree)) {
                const distance = this.player.getPosition().distanceTo(tree.getPosition());
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestTree = tree;
                }
            }
        }
        
        if (nearestTree) {
            if (nearestTree.cut()) {
                // Add wood resource
                this.resourceSystem.addWood(1);
            }
        }
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
