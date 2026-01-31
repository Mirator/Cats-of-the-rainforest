import { CONTROLS } from '../config/controls.js';

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
        
        // Progress bars for Cat Den interactions
        this.catDenProgressBars = new Map(); // Map<CatDen, HTMLElement>
        
        // Tooltips for interactable objects
        this.tooltips = new Map(); // Map<Object, HTMLElement>
        
        // Totem health bar
        this.totemHealthBar = null;
        
        // Build mode UI elements
        this.buildMenu = null;
        this.buildModeOverlay = null;
        this.buildModeIndicator = null;
        this.buildInstructions = null;
        this.buildButton = null;
        this.totemInfluenceVisualization = null;
        this.selectedBuildItemIndex = -1;
        this.buildMenuItems = [];
        
        // Menu elements
        this.mainMenu = null;
        this.pauseMenu = null;
        this.controlsScreen = null;
        
        this.createUI();
        this.createEdgeIndicators();
        this.createBuildModeUI();
        this.createTotemHealthBar();
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
    
    createTotemHealthBar() {
        // Create totem health bar display in UI corner
        this.totemHealthBar = document.createElement('div');
        this.totemHealthBar.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            padding: 15px 20px;
            border-radius: 8px;
            pointer-events: none;
            min-width: 200px;
        `;
        this.totemHealthBar.innerHTML = `
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px; text-align: center;">Forest Totem</div>
            <div style="width: 180px; height: 20px; background: rgba(255, 0, 0, 0.3); border: 2px solid rgba(255, 255, 255, 0.8); border-radius: 4px; margin: 0 auto;">
                <div id="totem-health-fill" style="width: 100%; height: 100%; background: linear-gradient(90deg, #4a7c59, #5a8c69); border-radius: 2px; transition: width 0.2s;"></div>
            </div>
            <div id="totem-health-text" style="margin-top: 5px; text-align: center; font-size: 14px;">100/100</div>
        `;
        this.container.appendChild(this.totemHealthBar);
    }
    
    updateTotemHealth(current, max) {
        if (!this.totemHealthBar) return;
        
        const healthFill = this.totemHealthBar.querySelector('#totem-health-fill');
        const healthText = this.totemHealthBar.querySelector('#totem-health-text');
        
        if (healthFill) {
            const percentage = Math.max(0, Math.min(100, (current / max) * 100));
            healthFill.style.width = `${percentage}%`;
            
            // Change color based on health percentage
            if (percentage > 60) {
                healthFill.style.background = 'linear-gradient(90deg, #4a7c59, #5a8c69)'; // Green
            } else if (percentage > 30) {
                healthFill.style.background = 'linear-gradient(90deg, #ffa500, #ff8c00)'; // Orange
            } else {
                healthFill.style.background = 'linear-gradient(90deg, #ff4444, #cc0000)'; // Red
            }
        }
        
        if (healthText) {
            healthText.textContent = `${Math.max(0, Math.round(current))}/${max}`;
        }
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
    
    setBuildButtonEnabled(enabled) {
        if (!this.buildButton) return;
        this.buildButton.disabled = !enabled;
        this.buildButton.style.opacity = enabled ? '1' : '0.5';
        this.buildButton.style.cursor = enabled ? 'pointer' : 'not-allowed';
        this.buildButton.style.background = enabled ? '#6a5a4a' : '#4a4a4a';
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
    
    showWinScreen(screenshotDataURL = null) {
        // Remove existing win screen if present
        const existingScreen = document.getElementById('win-screen');
        if (existingScreen) {
            existingScreen.remove();
        }
        
        const winScreen = document.createElement('div');
        winScreen.id = 'win-screen';
        winScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            color: white;
            font-family: Arial, sans-serif;
            overflow-y: auto;
            padding: 20px;
        `;
        
        let content = `
            <h1 style="font-size: 48px; margin-bottom: 20px; color: #ffd700; text-align: center;">Victory!</h1>
            <p style="font-size: 24px; margin-bottom: 40px; text-align: center;">You have protected the rainforest!</p>
        `;
        
        // Add screenshot if provided
        if (screenshotDataURL) {
            content += `
                <div style="margin: 20px 0; max-width: 90%; max-height: 60vh; border: 3px solid #ffd700; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);">
                    <img src="${screenshotDataURL}" style="width: 100%; height: auto; display: block;" alt="Final Map Screenshot" />
                </div>
                <p style="font-size: 14px; color: #aaa; text-align: center; margin-top: 10px; margin-bottom: 20px;">Your final rainforest masterpiece</p>
            `;
            
            // Add download button
            const downloadButton = document.createElement('button');
            downloadButton.textContent = 'Download Screenshot';
            downloadButton.style.cssText = `
                padding: 12px 30px;
                font-size: 16px;
                font-weight: bold;
                background: #4a7c59;
                color: white;
                border: 2px solid #228b22;
                border-radius: 8px;
                cursor: pointer;
                margin: 10px;
                transition: all 0.2s;
            `;
            downloadButton.addEventListener('mouseenter', () => {
                downloadButton.style.background = '#5a8c69';
                downloadButton.style.transform = 'scale(1.05)';
            });
            downloadButton.addEventListener('mouseleave', () => {
                downloadButton.style.background = '#4a7c59';
                downloadButton.style.transform = 'scale(1)';
            });
            downloadButton.addEventListener('click', () => {
                const link = document.createElement('a');
                link.download = `rainforest-victory-${Date.now()}.png`;
                link.href = screenshotDataURL;
                link.click();
            });
            
            winScreen.appendChild(document.createElement('div'));
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            winScreen.appendChild(tempDiv);
            winScreen.appendChild(downloadButton);
        } else {
            content += `<p style="font-size: 18px; color: #aaa; text-align: center;">The forest is safe from the masked mice.</p>`;
            winScreen.innerHTML = content;
        }
        
        document.body.appendChild(winScreen);
    }
    
    hideAllUI() {
        // Hide main UI container
        if (this.container) {
            this.container.style.display = 'none';
        }
        
        // Hide build mode overlay
        if (this.buildModeOverlay) {
            this.buildModeOverlay.style.display = 'none';
        }
        
        // Hide build mode indicator
        if (this.buildModeIndicator) {
            this.buildModeIndicator.style.display = 'none';
        }
        
        // Hide build instructions
        if (this.buildInstructions) {
            this.buildInstructions.style.display = 'none';
        }
        
        // Hide all tooltips
        for (const tooltip of this.tooltips.values()) {
            if (tooltip) {
                tooltip.style.display = 'none';
            }
        }
        
        // Hide all progress bars
        for (const progressBar of this.treeProgressBars.values()) {
            if (progressBar) {
                progressBar.style.display = 'none';
            }
        }
        for (const progressBar of this.catDenProgressBars.values()) {
            if (progressBar) {
                progressBar.style.display = 'none';
            }
        }
        
        // Hide edge indicators
        Object.values(this.edgeIndicators).forEach(indicator => {
            if (indicator) {
                indicator.style.display = 'none';
            }
        });
    }
    
    showGameOverScreen() {
        const gameOverScreen = document.createElement('div');
        gameOverScreen.id = 'game-over-screen';
        gameOverScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            color: white;
            font-family: Arial, sans-serif;
            pointer-events: auto;
        `;
        
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Restart';
        restartButton.style.cssText = `
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            background: #4a7c59;
            color: white;
            border: 2px solid #228b22;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 20px;
            transition: all 0.2s;
        `;
        restartButton.addEventListener('mouseenter', () => {
            restartButton.style.background = '#5a8c69';
            restartButton.style.transform = 'scale(1.05)';
        });
        restartButton.addEventListener('mouseleave', () => {
            restartButton.style.background = '#4a7c59';
            restartButton.style.transform = 'scale(1)';
        });
        restartButton.addEventListener('click', () => {
            window.location.reload();
        });
        
        gameOverScreen.innerHTML = `
            <h1 style="font-size: 48px; margin-bottom: 20px; color: #ff4444;">The Forest Has Fallen</h1>
            <p style="font-size: 24px; margin-bottom: 40px; text-align: center;">The Forest Totem has been destroyed!</p>
            <p style="font-size: 18px; color: #aaa; text-align: center; max-width: 600px; margin-bottom: 20px;">The masked mice have overwhelmed the forest. The totem crumbles, and darkness spreads across the land.</p>
        `;
        gameOverScreen.appendChild(restartButton);
        document.body.appendChild(gameOverScreen);
    }
    
    showMainMenu(onStartGame) {
        // Remove existing main menu if present
        const existingMenu = document.getElementById('main-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const mainMenu = document.createElement('div');
        mainMenu.id = 'main-menu';
        mainMenu.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            color: white;
            font-family: Arial, sans-serif;
            pointer-events: auto;
        `;
        
        const startButton = document.createElement('button');
        startButton.textContent = 'Start Game';
        startButton.style.cssText = `
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            background: #4a7c59;
            color: white;
            border: 2px solid #228b22;
            border-radius: 8px;
            cursor: pointer;
            margin: 10px;
            transition: all 0.2s;
        `;
        startButton.addEventListener('mouseenter', () => {
            startButton.style.background = '#5a8c69';
            startButton.style.transform = 'scale(1.05)';
        });
        startButton.addEventListener('mouseleave', () => {
            startButton.style.background = '#4a7c59';
            startButton.style.transform = 'scale(1)';
        });
        startButton.addEventListener('click', () => {
            if (onStartGame) {
                onStartGame();
            }
        });
        
        const controlsButton = document.createElement('button');
        controlsButton.textContent = 'Controls';
        controlsButton.style.cssText = `
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            background: #6a5a4a;
            color: white;
            border: 2px solid #8b7355;
            border-radius: 8px;
            cursor: pointer;
            margin: 10px;
            transition: all 0.2s;
        `;
        controlsButton.addEventListener('mouseenter', () => {
            controlsButton.style.background = '#7a6a5a';
            controlsButton.style.transform = 'scale(1.05)';
        });
        controlsButton.addEventListener('mouseleave', () => {
            controlsButton.style.background = '#6a5a4a';
            controlsButton.style.transform = 'scale(1)';
        });
        controlsButton.addEventListener('click', () => {
            this.hideMainMenu();
            this.showControlsScreen(() => {
                this.hideControlsScreen();
                this.showMainMenu(onStartGame);
            });
        });
        
        mainMenu.innerHTML = `
            <h1 style="font-size: 64px; margin-bottom: 20px; color: #ffd700; text-align: center;">Cats of the Rainforest</h1>
            <p style="font-size: 24px; margin-bottom: 40px; text-align: center; color: #aaa;">Protect the forest from the masked mice</p>
        `;
        mainMenu.appendChild(startButton);
        mainMenu.appendChild(controlsButton);
        document.body.appendChild(mainMenu);
        
        // Store reference
        this.mainMenu = mainMenu;
    }
    
    hideMainMenu() {
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu) {
            mainMenu.remove();
        }
        this.mainMenu = null;
    }
    
    showPauseMenu(onResume, onRestart) {
        // Remove existing pause menu if present
        const existingMenu = document.getElementById('pause-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const pauseMenu = document.createElement('div');
        pauseMenu.id = 'pause-menu';
        pauseMenu.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            color: white;
            font-family: Arial, sans-serif;
            pointer-events: auto;
        `;
        
        const resumeButton = document.createElement('button');
        resumeButton.textContent = 'Resume';
        resumeButton.style.cssText = `
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            background: #4a7c59;
            color: white;
            border: 2px solid #228b22;
            border-radius: 8px;
            cursor: pointer;
            margin: 10px;
            transition: all 0.2s;
        `;
        resumeButton.addEventListener('mouseenter', () => {
            resumeButton.style.background = '#5a8c69';
            resumeButton.style.transform = 'scale(1.05)';
        });
        resumeButton.addEventListener('mouseleave', () => {
            resumeButton.style.background = '#4a7c59';
            resumeButton.style.transform = 'scale(1)';
        });
        resumeButton.addEventListener('click', () => {
            if (onResume) {
                onResume();
            }
        });
        
        const controlsButton = document.createElement('button');
        controlsButton.textContent = 'Controls';
        controlsButton.style.cssText = `
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            background: #6a5a4a;
            color: white;
            border: 2px solid #8b7355;
            border-radius: 8px;
            cursor: pointer;
            margin: 10px;
            transition: all 0.2s;
        `;
        controlsButton.addEventListener('mouseenter', () => {
            controlsButton.style.background = '#7a6a5a';
            controlsButton.style.transform = 'scale(1.05)';
        });
        controlsButton.addEventListener('mouseleave', () => {
            controlsButton.style.background = '#6a5a4a';
            controlsButton.style.transform = 'scale(1)';
        });
        controlsButton.addEventListener('click', () => {
            this.hidePauseMenu();
            this.showControlsScreen(() => {
                this.hideControlsScreen();
                this.showPauseMenu(onResume, onRestart);
            });
        });
        
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Restart';
        restartButton.style.cssText = `
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            background: #6a5a4a;
            color: white;
            border: 2px solid #8b7355;
            border-radius: 8px;
            cursor: pointer;
            margin: 10px;
            transition: all 0.2s;
        `;
        restartButton.addEventListener('mouseenter', () => {
            restartButton.style.background = '#7a6a5a';
            restartButton.style.transform = 'scale(1.05)';
        });
        restartButton.addEventListener('mouseleave', () => {
            restartButton.style.background = '#6a5a4a';
            restartButton.style.transform = 'scale(1)';
        });
        restartButton.addEventListener('click', () => {
            if (onRestart) {
                onRestart();
            }
        });
        
        pauseMenu.innerHTML = `
            <h1 style="font-size: 48px; margin-bottom: 20px; color: #ffd700; text-align: center;">Paused</h1>
            <p style="font-size: 18px; color: #aaa; text-align: center; margin-bottom: 30px;">Press ESC to resume</p>
        `;
        pauseMenu.appendChild(resumeButton);
        pauseMenu.appendChild(controlsButton);
        pauseMenu.appendChild(restartButton);
        document.body.appendChild(pauseMenu);
        
        // Store reference
        this.pauseMenu = pauseMenu;
    }
    
    hidePauseMenu() {
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
            pauseMenu.remove();
        }
        this.pauseMenu = null;
    }
    
    // Helper function to format key names for display
    formatKeyName(key) {
        // Handle special keys
        const keyMap = {
            ' ': 'Space',
            'ArrowUp': '↑',
            'ArrowDown': '↓',
            'ArrowLeft': '←',
            'ArrowRight': '→',
            'Escape': 'ESC',
            'Enter': 'Enter',
            'RightClick': 'Right Click'
        };
        
        if (keyMap[key]) {
            return keyMap[key];
        }
        
        // Capitalize first letter for regular keys
        return key.charAt(0).toUpperCase() + key.slice(1);
    }
    
    // Helper function to get control descriptions
    getControlDescription(controlKey) {
        const descriptions = {
            moveUp: 'Move Up',
            moveDown: 'Move Down',
            moveLeft: 'Move Left',
            moveRight: 'Move Right',
            interact: 'Interact / Cut Trees / Spawn Cats',
            attack: 'Attack Enemies',
            toggleBuildMode: 'Toggle Build Mode',
            exitBuildMode: 'Exit Build Mode / Pause Menu',
            confirmBuild: 'Confirm Build Placement',
            cancelBuild: 'Cancel Build Placement',
            pauseMenu: 'Open Pause Menu',
            selectItem1: 'Select Build Item 1',
            selectItem2: 'Select Build Item 2',
            selectItem3: 'Select Build Item 3',
            selectItem4: 'Select Build Item 4',
            selectItem5: 'Select Build Item 5',
            selectItem6: 'Select Build Item 6',
            selectItem7: 'Select Build Item 7',
            selectItem8: 'Select Build Item 8',
            selectItem9: 'Select Build Item 9',
            menuUp: 'Menu Navigation Up',
            menuDown: 'Menu Navigation Down',
            menuConfirm: 'Menu Confirm Selection',
            placementUp: 'Placement Mode - Move Up',
            placementDown: 'Placement Mode - Move Down',
            placementLeft: 'Placement Mode - Move Left',
            placementRight: 'Placement Mode - Move Right'
        };
        
        return descriptions[controlKey] || controlKey;
    }
    
    // Helper function to group controls by category
    groupControlsByCategory(controls) {
        const categories = {
            'Movement': ['moveUp', 'moveDown', 'moveLeft', 'moveRight'],
            'Actions': ['interact', 'attack'],
            'Build Mode': ['toggleBuildMode', 'exitBuildMode', 'confirmBuild', 'cancelBuild'],
            'Build Menu Navigation': ['selectItem1', 'selectItem2', 'selectItem3', 'selectItem4', 'selectItem5', 'selectItem6', 'selectItem7', 'selectItem8', 'selectItem9', 'menuUp', 'menuDown', 'menuConfirm'],
            'Placement Mode': ['placementUp', 'placementDown', 'placementLeft', 'placementRight'],
            'Game Menu': ['pauseMenu']
        };
        
        const grouped = {};
        const usedKeys = new Set();
        
        // Add controls to their categories
        for (const [category, keys] of Object.entries(categories)) {
            grouped[category] = [];
            for (const key of keys) {
                if (controls[key]) {
                    grouped[category].push({ key, keys: controls[key] });
                    usedKeys.add(key);
                }
            }
        }
        
        // Add any remaining controls to "Other"
        for (const [key, keys] of Object.entries(controls)) {
            if (!usedKeys.has(key)) {
                if (!grouped['Other']) {
                    grouped['Other'] = [];
                }
                grouped['Other'].push({ key, keys });
            }
        }
        
        // Remove empty categories
        for (const category of Object.keys(grouped)) {
            if (grouped[category].length === 0) {
                delete grouped[category];
            }
        }
        
        return grouped;
    }
    
    showControlsScreen(onBack) {
        // Remove existing controls screen if present
        const existingScreen = document.getElementById('controls-screen');
        if (existingScreen) {
            existingScreen.remove();
        }
        
        const controlsScreen = document.createElement('div');
        controlsScreen.id = 'controls-screen';
        controlsScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            z-index: 2100;
            color: white;
            font-family: Arial, sans-serif;
            pointer-events: auto;
            overflow-y: auto;
            padding: 40px 20px;
        `;
        
        // Group controls by category
        const groupedControls = this.groupControlsByCategory(CONTROLS);
        
        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.style.cssText = `
            max-width: 800px;
            width: 100%;
        `;
        
        // Title
        const title = document.createElement('h1');
        title.textContent = 'Controls';
        title.style.cssText = `
            font-size: 48px;
            margin-bottom: 30px;
            color: #ffd700;
            text-align: center;
        `;
        contentContainer.appendChild(title);
        
        // Create controls list by category
        for (const [category, controls] of Object.entries(groupedControls)) {
            const categoryDiv = document.createElement('div');
            categoryDiv.style.cssText = `
                margin-bottom: 30px;
            `;
            
            const categoryTitle = document.createElement('h2');
            categoryTitle.textContent = category;
            categoryTitle.style.cssText = `
                font-size: 24px;
                margin-bottom: 15px;
                color: #4a7c59;
                border-bottom: 2px solid #4a7c59;
                padding-bottom: 5px;
            `;
            categoryDiv.appendChild(categoryTitle);
            
            const controlsList = document.createElement('div');
            controlsList.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            
            for (const { key, keys } of controls) {
                const controlItem = document.createElement('div');
                controlItem.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 15px;
                    background: rgba(50, 50, 50, 0.5);
                    border-radius: 6px;
                `;
                
                const description = document.createElement('span');
                description.textContent = this.getControlDescription(key);
                description.style.cssText = `
                    font-size: 16px;
                    flex: 1;
                `;
                
                const keysDisplay = document.createElement('div');
                keysDisplay.style.cssText = `
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                `;
                
                // Display all keys for this control (deduplicate by formatted name)
                const seenFormattedKeys = new Set();
                for (const keyName of keys) {
                    const formattedKey = this.formatKeyName(keyName);
                    // Skip if we've already shown this formatted key
                    if (seenFormattedKeys.has(formattedKey)) {
                        continue;
                    }
                    seenFormattedKeys.add(formattedKey);
                    
                    const keyBadge = document.createElement('span');
                    keyBadge.textContent = formattedKey;
                    keyBadge.style.cssText = `
                        padding: 5px 12px;
                        background: rgba(139, 115, 85, 0.6);
                        border: 1px solid #8b7355;
                        border-radius: 4px;
                        font-size: 14px;
                        font-weight: bold;
                        font-family: monospace;
                    `;
                    keysDisplay.appendChild(keyBadge);
                }
                
                controlItem.appendChild(description);
                controlItem.appendChild(keysDisplay);
                controlsList.appendChild(controlItem);
            }
            
            categoryDiv.appendChild(controlsList);
            contentContainer.appendChild(categoryDiv);
        }
        
        // Back button
        const backButton = document.createElement('button');
        backButton.textContent = 'Back';
        backButton.style.cssText = `
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            background: #6a5a4a;
            color: white;
            border: 2px solid #8b7355;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 30px;
            transition: all 0.2s;
        `;
        backButton.addEventListener('mouseenter', () => {
            backButton.style.background = '#7a6a5a';
            backButton.style.transform = 'scale(1.05)';
        });
        backButton.addEventListener('mouseleave', () => {
            backButton.style.background = '#6a5a4a';
            backButton.style.transform = 'scale(1)';
        });
        backButton.addEventListener('click', () => {
            if (onBack) {
                onBack();
            }
        });
        
        controlsScreen.appendChild(contentContainer);
        controlsScreen.appendChild(backButton);
        document.body.appendChild(controlsScreen);
        
        // Store reference
        this.controlsScreen = controlsScreen;
    }
    
    hideControlsScreen() {
        const controlsScreen = document.getElementById('controls-screen');
        if (controlsScreen) {
            controlsScreen.remove();
        }
        this.controlsScreen = null;
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
    
    showCatDenProgressBar(catDen, progress, camera) {
        if (!catDen || !camera || !catDen.mesh) return;
        
        // Calculate world position above Cat Den
        const worldPosition = catDen.getPosition().clone();
        worldPosition.y += 3; // Position bar 3 units above Cat Den base
        
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
            this.hideCatDenProgressBar(catDen);
            return;
        }
        
        // Get or create progress bar element
        let progressBar = this.catDenProgressBars.get(catDen);
        
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'cat-den-progress-bar';
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
            progressFill.className = 'cat-den-progress-fill';
            progressFill.style.cssText = `
                width: 0%;
                height: 100%;
                background: linear-gradient(90deg, #8b7355, #a0826d);
                border-radius: 2px;
                transition: width 0.1s linear;
            `;
            progressBar.appendChild(progressFill);
            
            document.body.appendChild(progressBar);
            this.catDenProgressBars.set(catDen, progressBar);
        }
        
        // Update position
        progressBar.style.left = `${x}px`;
        progressBar.style.top = `${y}px`;
        
        // Update progress
        const progressFill = progressBar.querySelector('.cat-den-progress-fill');
        if (progressFill) {
            const progressPercent = Math.min(100, Math.max(0, progress * 100));
            progressFill.style.width = `${progressPercent}%`;
        }
    }
    
    hideCatDenProgressBar(catDen) {
        const progressBar = this.catDenProgressBars.get(catDen);
        if (progressBar) {
            progressBar.remove();
            this.catDenProgressBars.delete(catDen);
        }
    }
    
    updateCatDenProgressBars(buildings, camera) {
        // Hide progress bars for Cat Dens that are no longer interacting
        const interactingCatDens = new Set();
        
        for (const building of buildings) {
            // Check if it's a CatDen by checking for CatDen-specific properties
            const isCatDen = building && typeof building.updateInteraction === 'function' && 
                           typeof building.startInteraction === 'function' &&
                           typeof building.getIsBuilt === 'function';
            
            if (isCatDen && building.getIsBuilt()) {
                if (building.isInteracting) {
                    interactingCatDens.add(building);
                    this.showCatDenProgressBar(building, building.interactionProgress, camera);
                } else {
                    this.hideCatDenProgressBar(building);
                }
            }
        }
        
        // Clean up any orphaned progress bars
        for (const [catDen, bar] of this.catDenProgressBars.entries()) {
            if (!interactingCatDens.has(catDen)) {
                this.hideCatDenProgressBar(catDen);
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
                let costsText = costText;
                if (config.secondaryCost) {
                    const secondaryCostText = this.formatCost(config.secondaryCost);
                    if (secondaryCostText) {
                        costsText += `, ${secondaryCostText}`;
                    }
                }
                content += `<div style="margin-top: 4px; font-size: 12px; color: #aaa; border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 4px;">${costsText}</div>`;
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
