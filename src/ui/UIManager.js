export class UIManager {
    constructor() {
        this.container = null;
        this.resourceDisplay = null;
        this.endDayButton = null;
        this.dayDisplay = null;
        this.edgeIndicators = {
            north: null,
            south: null,
            east: null,
            west: null
        };
        
        // Progress bars for tree interactions
        this.treeProgressBars = new Map(); // Map<Tree, HTMLElement>
        
        // Tooltips for interactable objects
        this.tooltips = new Map(); // Map<Object, HTMLElement>
        
        // Build mode UI elements
        this.buildMenu = null;
        this.buildModeOverlay = null;
        this.buildModeIndicator = null;
        this.buildInstructions = null;
        this.buildButton = null;
        this.totemInfluenceVisualization = null;
        this.selectedBuildItemIndex = -1;
        this.buildMenuItems = [];
        
        this.createUI();
        this.createEdgeIndicators();
        this.createBuildModeUI();
    }
    
    createUI() {
        // Create UI container
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            font-family: Arial, sans-serif;
            color: white;
            z-index: 1000;
        `;
        
        // Resource display
        this.resourceDisplay = document.createElement('div');
        this.resourceDisplay.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            padding: 15px 20px;
            border-radius: 8px;
            pointer-events: none;
        `;
        this.resourceDisplay.innerHTML = `
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">Resources</div>
            <div id="food-display" style="margin: 5px 0;">Food: 0</div>
            <div id="wood-display" style="margin: 5px 0;">Wood: 0</div>
        `;
        this.container.appendChild(this.resourceDisplay);
        
        // Stamina display
        this.staminaDisplay = document.createElement('div');
        this.staminaDisplay.style.cssText = `
            position: absolute;
            top: 120px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            padding: 15px 20px;
            border-radius: 8px;
            pointer-events: none;
        `;
        this.staminaDisplay.innerHTML = `
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">Stamina</div>
            <div id="stamina-display" style="margin: 5px 0;">10/10</div>
        `;
        this.container.appendChild(this.staminaDisplay);
        
        // Day display
        this.dayDisplay = document.createElement('div');
        this.dayDisplay.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            padding: 15px 20px;
            border-radius: 8px;
            pointer-events: none;
        `;
        this.dayDisplay.innerHTML = `
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">Day <span id="day-number">1</span></div>
            <div id="day-state" style="margin: 5px 0;">State: Day</div>
            <div id="wave-info" style="margin: 5px 0; font-size: 14px; color: #ffd700;">Wave: <span id="wave-number">-</span>/5</div>
            <div id="wave-progress" style="margin: 5px 0; font-size: 12px; color: #aaa;">Enemies: <span id="enemies-killed">0</span>/<span id="enemies-total">0</span></div>
        `;
        this.container.appendChild(this.dayDisplay);
        
        // End Day button
        this.endDayButton = document.createElement('button');
        this.endDayButton.textContent = 'End Day';
        this.endDayButton.style.cssText = `
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            background: #4a7c59;
            color: white;
            border: 2px solid #228b22;
            border-radius: 8px;
            cursor: pointer;
            pointer-events: auto;
            transition: all 0.2s;
        `;
        this.endDayButton.addEventListener('mouseenter', () => {
            this.endDayButton.style.background = '#5a8c69';
            this.endDayButton.style.transform = 'translateX(-50%) scale(1.05)';
        });
        this.endDayButton.addEventListener('mouseleave', () => {
            this.endDayButton.style.background = '#4a7c59';
            this.endDayButton.style.transform = 'translateX(-50%) scale(1)';
        });
        this.container.appendChild(this.endDayButton);
        
        // Build button
        this.buildButton = document.createElement('button');
        this.buildButton.textContent = 'Build';
        this.buildButton.style.cssText = `
            position: absolute;
            bottom: 30px;
            right: 30px;
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            background: #6a5a4a;
            color: white;
            border: 2px solid #8b7355;
            border-radius: 8px;
            cursor: pointer;
            pointer-events: auto;
            transition: all 0.2s;
        `;
        this.buildButton.addEventListener('mouseenter', () => {
            this.buildButton.style.background = '#7a6a5a';
            this.buildButton.style.transform = 'scale(1.05)';
        });
        this.buildButton.addEventListener('mouseleave', () => {
            this.buildButton.style.background = '#6a5a4a';
            this.buildButton.style.transform = 'scale(1)';
        });
        this.container.appendChild(this.buildButton);
        
        document.body.appendChild(this.container);
    }
    
    createBuildModeUI() {
        // Build mode overlay (screen darkening)
        this.buildModeOverlay = document.createElement('div');
        this.buildModeOverlay.id = 'build-mode-overlay';
        this.buildModeOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            pointer-events: none;
            z-index: 900;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(this.buildModeOverlay);
        
        // Build mode indicator
        this.buildModeIndicator = document.createElement('div');
        this.buildModeIndicator.id = 'build-mode-indicator';
        this.buildModeIndicator.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            color: #ffd700;
            pointer-events: none;
            z-index: 1100;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        this.buildModeIndicator.textContent = 'BUILD MODE';
        this.container.appendChild(this.buildModeIndicator);
        
        // Build instructions
        this.buildInstructions = document.createElement('div');
        this.buildInstructions.id = 'build-instructions';
        this.buildInstructions.style.cssText = `
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 14px;
            color: white;
            pointer-events: none;
            z-index: 1100;
            opacity: 0;
            transition: opacity 0.3s;
            text-align: center;
            max-width: 600px;
        `;
        this.container.appendChild(this.buildInstructions);
        
        // Build menu
        this.buildMenu = document.createElement('div');
        this.buildMenu.id = 'build-menu';
        this.buildMenu.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 3px solid #8b7355;
            border-radius: 12px;
            padding: 20px;
            pointer-events: auto;
            z-index: 1200;
            opacity: 0;
            transition: opacity 0.3s;
            display: none;
        `;
        this.buildMenu.innerHTML = `
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 15px; text-align: center; color: #ffd700;">
                Build Menu
            </div>
            <div id="build-menu-items" style="display: flex; flex-direction: column; gap: 10px;">
            </div>
        `;
        this.container.appendChild(this.buildMenu);
    }
    
    createEdgeIndicators() {
        // Create red edge indicators for each direction
        const edgeWidth = 8; // Width of the red indicator in pixels
        const directions = ['north', 'south', 'east', 'west'];
        
        directions.forEach(direction => {
            const indicator = document.createElement('div');
            indicator.id = `edge-indicator-${direction}`;
            indicator.style.cssText = `
                position: fixed;
                background: rgba(255, 0, 0, 0.6);
                pointer-events: none;
                z-index: 1500;
                transition: opacity 0.2s;
                opacity: 0;
            `;
            
            switch (direction) {
                case 'north':
                    indicator.style.top = '0';
                    indicator.style.left = '0';
                    indicator.style.width = '100%';
                    indicator.style.height = `${edgeWidth}px`;
                    break;
                case 'south':
                    indicator.style.bottom = '0';
                    indicator.style.left = '0';
                    indicator.style.width = '100%';
                    indicator.style.height = `${edgeWidth}px`;
                    break;
                case 'east':
                    indicator.style.top = '0';
                    indicator.style.right = '0';
                    indicator.style.width = `${edgeWidth}px`;
                    indicator.style.height = '100%';
                    break;
                case 'west':
                    indicator.style.top = '0';
                    indicator.style.left = '0';
                    indicator.style.width = `${edgeWidth}px`;
                    indicator.style.height = '100%';
                    break;
            }
            
            this.edgeIndicators[direction] = indicator;
            document.body.appendChild(indicator);
        });
    }
    
    updateEnemyDirectionIndicators(enemies, camera, playerPosition) {
        if (!enemies || enemies.length === 0 || !camera || !playerPosition) {
            // Hide all indicators if no enemies or missing data
            Object.values(this.edgeIndicators).forEach(indicator => {
                if (indicator) indicator.style.opacity = '0';
            });
            return;
        }
        
        // Track which directions have off-screen enemies
        const activeDirections = {
            north: false,
            south: false,
            east: false,
            west: false
        };
        
        // Check each enemy
        enemies.forEach(enemy => {
            if (enemy.isDestroyed || !enemy.position) return;
            
            // Project enemy position to screen space
            const enemyWorldPos = enemy.position.clone();
            enemyWorldPos.project(camera);
            
            // Check if enemy is off-screen (outside viewport)
            const margin = 0.1; // Margin to account for edge cases
            const isOffScreen = 
                enemyWorldPos.x < -1 - margin || enemyWorldPos.x > 1 + margin ||
                enemyWorldPos.y < -1 - margin || enemyWorldPos.y > 1 + margin ||
                enemyWorldPos.z < -1 || enemyWorldPos.z > 1; // Behind camera or too far
            
            if (isOffScreen) {
                // Calculate direction from player to enemy in world space
                // Note: In 3D space, we need to consider the camera's view direction
                // For a top-down/isometric view, we can use world space coordinates
                const dx = enemy.position.x - playerPosition.x;
                const dz = enemy.position.z - playerPosition.z;
                
                // Determine which edge is closest based on the dominant direction
                const absDx = Math.abs(dx);
                const absDz = Math.abs(dz);
                
                // Use a threshold to determine primary direction
                if (absDz > absDx * 0.7) {
                    // North or South (Z-axis is primary)
                    if (dz < 0) {
                        activeDirections.north = true;
                    } else {
                        activeDirections.south = true;
                    }
                }
                
                if (absDx > absDz * 0.7) {
                    // East or West (X-axis is primary)
                    if (dx > 0) {
                        activeDirections.east = true;
                    } else {
                        activeDirections.west = true;
                    }
                }
            }
        });
        
        // Update indicator visibility
        Object.keys(activeDirections).forEach(direction => {
            const indicator = this.edgeIndicators[direction];
            if (indicator) {
                indicator.style.opacity = activeDirections[direction] ? '1' : '0';
            }
        });
    }
    
    updateResources(food, wood) {
        const foodDisplay = this.resourceDisplay.querySelector('#food-display');
        const woodDisplay = this.resourceDisplay.querySelector('#wood-display');
        
        if (foodDisplay) {
            foodDisplay.textContent = `Food: ${food}`;
        }
        if (woodDisplay) {
            woodDisplay.textContent = `Wood: ${wood}`;
        }
    }
    
    updateStamina(current, max) {
        const staminaDisplay = this.staminaDisplay.querySelector('#stamina-display');
        
        if (staminaDisplay) {
            staminaDisplay.textContent = `${current}/${max}`;
        }
    }
    
    updateDayInfo(day, state) {
        const dayNumber = this.dayDisplay.querySelector('#day-number');
        const dayState = this.dayDisplay.querySelector('#day-state');
        
        if (dayNumber) {
            dayNumber.textContent = day;
        }
        if (dayState) {
            dayState.textContent = `State: ${state.charAt(0).toUpperCase() + state.slice(1)}`;
        }
    }
    
    setEndDayCallback(callback) {
        this.endDayButton.addEventListener('click', callback);
    }
    
    setEndDayEnabled(enabled) {
        this.endDayButton.disabled = !enabled;
        this.endDayButton.style.opacity = enabled ? '1' : '0.5';
        this.endDayButton.style.cursor = enabled ? 'pointer' : 'not-allowed';
    }
    
    updateWaveInfo(waveNumber, enemiesKilled, enemiesTotal) {
        const waveNumberEl = this.dayDisplay.querySelector('#wave-number');
        const enemiesKilledEl = this.dayDisplay.querySelector('#enemies-killed');
        const enemiesTotalEl = this.dayDisplay.querySelector('#enemies-total');
        const waveInfoEl = this.dayDisplay.querySelector('#wave-info');
        const waveProgressEl = this.dayDisplay.querySelector('#wave-progress');
        
        if (waveNumberEl) {
            if (waveNumber > 0) {
                waveNumberEl.textContent = waveNumber;
                if (waveInfoEl) waveInfoEl.style.display = 'block';
                if (waveProgressEl) waveProgressEl.style.display = 'block';
            } else {
                if (waveInfoEl) waveInfoEl.style.display = 'none';
                if (waveProgressEl) waveProgressEl.style.display = 'none';
            }
        }
        
        if (enemiesKilledEl) {
            enemiesKilledEl.textContent = enemiesKilled;
        }
        if (enemiesTotalEl) {
            enemiesTotalEl.textContent = enemiesTotal;
        }
    }
    
    showWinScreen() {
        const winScreen = document.createElement('div');
        winScreen.id = 'win-screen';
        winScreen.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            color: white;
            font-family: Arial, sans-serif;
        `;
        winScreen.innerHTML = `
            <h1 style="font-size: 48px; margin-bottom: 20px; color: #ffd700;">Victory!</h1>
            <p style="font-size: 24px; margin-bottom: 40px;">You have protected the rainforest!</p>
            <p style="font-size: 18px; color: #aaa;">The forest is safe from the masked mice.</p>
        `;
        document.body.appendChild(winScreen);
    }
    
    showGameOverScreen() {
        const gameOverScreen = document.createElement('div');
        gameOverScreen.id = 'game-over-screen';
        gameOverScreen.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            color: white;
            font-family: Arial, sans-serif;
        `;
        gameOverScreen.innerHTML = `
            <h1 style="font-size: 48px; margin-bottom: 20px; color: #ff4444;">Game Over</h1>
            <p style="font-size: 24px; margin-bottom: 40px;">The Forest Totem has been destroyed!</p>
            <p style="font-size: 18px; color: #aaa;">Refresh the page to try again.</p>
        `;
        document.body.appendChild(gameOverScreen);
    }
    
    showTreeProgressBar(tree, progress, camera) {
        if (!tree || !camera || !tree.mesh) return;
        
        // Calculate world position above tree
        const worldPosition = tree.getPosition().clone();
        worldPosition.y += 3; // Position bar 3 units above tree base
        
        // Project to screen coordinates
        const screenPosition = worldPosition.clone();
        screenPosition.project(camera);
        
        // Convert to pixel coordinates
        const width = window.innerWidth;
        const height = window.innerHeight;
        const x = (screenPosition.x * 0.5 + 0.5) * width;
        const y = (-screenPosition.y * 0.5 + 0.5) * height;
        
        // Check if position is on screen
        if (screenPosition.z > 1 || x < 0 || x > width || y < 0 || y > height) {
            this.hideTreeProgressBar(tree);
            return;
        }
        
        // Get or create progress bar element
        let progressBar = this.treeProgressBars.get(tree);
        
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'tree-progress-bar';
            progressBar.style.cssText = `
                position: fixed;
                width: 120px;
                height: 20px;
                background: rgba(0, 0, 0, 0.7);
                border: 2px solid rgba(255, 255, 255, 0.8);
                border-radius: 4px;
                pointer-events: none;
                z-index: 1500;
                transform: translate(-50%, -50%);
            `;
            
            // Progress fill
            const progressFill = document.createElement('div');
            progressFill.className = 'tree-progress-fill';
            progressFill.style.cssText = `
                width: 0%;
                height: 100%;
                background: linear-gradient(90deg, #4a7c59, #5a8c69);
                border-radius: 2px;
                transition: width 0.1s linear;
            `;
            progressBar.appendChild(progressFill);
            
            document.body.appendChild(progressBar);
            this.treeProgressBars.set(tree, progressBar);
        }
        
        // Update position
        progressBar.style.left = `${x}px`;
        progressBar.style.top = `${y}px`;
        
        // Update progress
        const progressFill = progressBar.querySelector('.tree-progress-fill');
        if (progressFill) {
            const progressPercent = Math.min(100, Math.max(0, progress * 100));
            progressFill.style.width = `${progressPercent}%`;
        }
    }
    
    hideTreeProgressBar(tree) {
        const progressBar = this.treeProgressBars.get(tree);
        if (progressBar) {
            progressBar.remove();
            this.treeProgressBars.delete(tree);
        }
    }
    
    updateTreeProgressBars(trees, camera) {
        // Hide progress bars for trees that are no longer interacting
        const interactingTrees = new Set();
        
        for (const tree of trees) {
            if (tree.isInteracting && !tree.isCut && !tree.isFalling) {
                interactingTrees.add(tree);
                this.showTreeProgressBar(tree, tree.interactionProgress, camera);
            } else {
                this.hideTreeProgressBar(tree);
            }
        }
        
        // Clean up any orphaned progress bars
        for (const [tree, bar] of this.treeProgressBars.entries()) {
            if (!interactingTrees.has(tree)) {
                this.hideTreeProgressBar(tree);
            }
        }
    }
    
    showTooltip(target, config, camera) {
        if (!target || !camera || !target.getPosition) return;
        
        // Calculate world position above target
        const worldPosition = target.getPosition().clone();
        const offset = config.worldOffset || { x: 0, y: 2.5, z: 0 };
        worldPosition.x += offset.x;
        worldPosition.y += offset.y;
        worldPosition.z += offset.z;
        
        // Project to screen coordinates
        const screenPosition = worldPosition.clone();
        screenPosition.project(camera);
        
        // Convert to pixel coordinates
        const width = window.innerWidth;
        const height = window.innerHeight;
        const x = (screenPosition.x * 0.5 + 0.5) * width;
        const y = (-screenPosition.y * 0.5 + 0.5) * height;
        
        // Check if position is on screen
        if (screenPosition.z > 1 || x < 0 || x > width || y < 0 || y > height) {
            this.hideTooltip(target);
            return;
        }
        
        // Get or create tooltip element
        let tooltip = this.tooltips.get(target);
        
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'interaction-tooltip';
            tooltip.style.cssText = `
                position: fixed;
                background: rgba(0, 0, 0, 0.85);
                border: 2px solid rgba(255, 255, 255, 0.6);
                border-radius: 6px;
                padding: 8px 12px;
                pointer-events: none;
                z-index: 1400;
                transform: translate(-50%, -100%);
                white-space: nowrap;
                font-size: 14px;
                color: white;
                font-family: Arial, sans-serif;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
            `;
            
            document.body.appendChild(tooltip);
            this.tooltips.set(target, tooltip);
        }
        
        // Update position
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        
        // Build tooltip content
        let content = config.title || '';
        
        if (config.cost) {
            const costText = this.formatCost(config.cost);
            if (costText) {
                content += `<div style="margin-top: 4px; font-size: 12px; color: #aaa; border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 4px;">${costText}</div>`;
            }
        }
        
        // Apply styling if player lacks resources
        if (config.hasResources === false) {
            tooltip.style.opacity = '0.6';
            tooltip.style.color = '#999';
        } else {
            tooltip.style.opacity = '1';
            tooltip.style.color = 'white';
        }
        
        tooltip.innerHTML = content;
    }
    
    formatCost(cost) {
        if (!cost || !cost.type || cost.amount === undefined) return '';
        
        const costType = cost.type.charAt(0).toUpperCase() + cost.type.slice(1);
        return `${cost.amount} ${costType}`;
    }
    
    hideTooltip(target) {
        const tooltip = this.tooltips.get(target);
        if (tooltip) {
            tooltip.remove();
            this.tooltips.delete(target);
        }
    }
    
    updateTooltips(targets, camera) {
        // Update tooltips for provided targets
        // targets should be an array of { target, config, shouldShow } objects
        const eligibleTargets = new Set();
        
        for (const targetData of targets) {
            if (targetData && targetData.config && targetData.shouldShow) {
                eligibleTargets.add(targetData.target);
                this.showTooltip(targetData.target, targetData.config, camera);
            } else if (targetData && targetData.target) {
                this.hideTooltip(targetData.target);
            }
        }
        
        // Clean up any orphaned tooltips
        for (const [target, tooltip] of this.tooltips.entries()) {
            if (!eligibleTargets.has(target)) {
                this.hideTooltip(target);
            }
        }
    }
    
    // Build Mode UI Methods
    setBuildModeActive(active) {
        if (this.buildModeOverlay) {
            this.buildModeOverlay.style.opacity = active ? '1' : '0';
        }
        
        if (this.buildModeIndicator) {
            this.buildModeIndicator.style.opacity = active ? '1' : '0';
        }
        
        // Change cursor
        if (active) {
            document.body.style.cursor = 'crosshair';
        } else {
            document.body.style.cursor = 'default';
        }
    }
    
    showBuildMenu(buildItems, canAffordCallback, onItemSelected) {
        if (!this.buildMenu) return;
        
        const menuItemsContainer = this.buildMenu.querySelector('#build-menu-items');
        if (!menuItemsContainer) return;
        
        menuItemsContainer.innerHTML = '';
        this.buildMenuItems = [];
        
        let index = 0;
        for (const [itemId, item] of Object.entries(buildItems)) {
            const canAfford = canAffordCallback ? canAffordCallback(itemId) : true;
            
            const menuItem = document.createElement('div');
            menuItem.className = 'build-menu-item';
            menuItem.dataset.itemId = itemId;
            menuItem.dataset.index = index;
            menuItem.style.cssText = `
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 12px 15px;
                background: ${index === this.selectedBuildItemIndex ? 'rgba(139, 115, 85, 0.5)' : 'rgba(50, 50, 50, 0.7)'};
                border: 2px solid ${index === this.selectedBuildItemIndex ? '#ffd700' : 'rgba(139, 115, 85, 0.5)'};
                border-radius: 8px;
                cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                opacity: ${canAfford ? '1' : '0.5'};
                transition: all 0.2s;
                pointer-events: ${canAfford ? 'auto' : 'none'};
            `;
            
            menuItem.innerHTML = `
                <div style="flex: 1;">
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">${item.name}</div>
                    <div style="font-size: 12px; color: #aaa;">
                        Wood: ${item.woodCost} | Stamina: ${item.staminaCost}
                    </div>
                </div>
                <div style="font-size: 18px; color: #ffd700;">${index + 1}</div>
            `;
            
            if (canAfford) {
                menuItem.addEventListener('click', () => {
                    onItemSelected(itemId);
                });
                
                menuItem.addEventListener('mouseenter', () => {
                    if (index !== this.selectedBuildItemIndex) {
                        menuItem.style.background = 'rgba(139, 115, 85, 0.3)';
                    }
                });
                
                menuItem.addEventListener('mouseleave', () => {
                    if (index !== this.selectedBuildItemIndex) {
                        menuItem.style.background = 'rgba(50, 50, 50, 0.7)';
                    }
                });
            }
            
            menuItemsContainer.appendChild(menuItem);
            this.buildMenuItems.push(menuItem);
            index++;
        }
        
        this.buildMenu.style.display = 'block';
        setTimeout(() => {
            this.buildMenu.style.opacity = '1';
        }, 10);
    }
    
    hideBuildMenu() {
        if (this.buildMenu) {
            this.buildMenu.style.opacity = '0';
            setTimeout(() => {
                this.buildMenu.style.display = 'none';
            }, 300);
        }
        this.selectedBuildItemIndex = -1;
        this.buildMenuItems = [];
    }
    
    selectBuildMenuItem(index) {
        if (index < 0 || index >= this.buildMenuItems.length) return;
        
        // Deselect previous
        if (this.selectedBuildItemIndex >= 0 && this.selectedBuildItemIndex < this.buildMenuItems.length) {
            const prevItem = this.buildMenuItems[this.selectedBuildItemIndex];
            prevItem.style.background = 'rgba(50, 50, 50, 0.7)';
            prevItem.style.borderColor = 'rgba(139, 115, 85, 0.5)';
        }
        
        // Select new
        this.selectedBuildItemIndex = index;
        const item = this.buildMenuItems[index];
        if (item) {
            item.style.background = 'rgba(139, 115, 85, 0.5)';
            item.style.borderColor = '#ffd700';
        }
    }
    
    setBuildButtonCallback(callback) {
        if (this.buildButton) {
            this.buildButton.addEventListener('click', callback);
        }
    }
    
    showTotemInfluenceRadius(totemPosition, radius, camera) {
        // This will be handled in Game.js with 3D scene objects
        // Placeholder for UI coordination if needed
    }
    
    hideTotemInfluenceRadius() {
        // This will be handled in Game.js with 3D scene objects
        // Placeholder for UI coordination if needed
    }
    
    showBuildInstructions(inMenu) {
        if (!this.buildInstructions) return;
        
        if (inMenu) {
            this.buildInstructions.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 8px; color: #ffd700;">How to Build:</div>
                <div>Press <strong>1</strong> or click to select Cat Den</div>
                <div style="margin-top: 5px; font-size: 12px; color: #aaa;">Use Arrow Keys to navigate, Enter to confirm</div>
            `;
        } else {
            this.buildInstructions.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 8px; color: #ffd700;">Placement Mode:</div>
                <div>Move with <strong>WASD</strong> or <strong>Arrow Keys</strong> (or use mouse)</div>
                <div style="margin-top: 5px;">Press <strong>Enter</strong>, <strong>Space</strong>, or <strong>Left Click</strong> to build</div>
                <div style="margin-top: 5px; font-size: 12px; color: #aaa;">Press <strong>Escape</strong> or <strong>Right Click</strong> to cancel</div>
            `;
        }
        
        this.buildInstructions.style.opacity = '1';
    }
    
    hideBuildInstructions() {
        if (this.buildInstructions) {
            this.buildInstructions.style.opacity = '0';
        }
    }
}
