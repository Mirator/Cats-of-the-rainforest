import { BuildModeUI } from './BuildModeUI.js';
import { MenuUI } from './MenuUI.js';
import { InteractionUI } from './InteractionUI.js';
import { TutorialUI } from './TutorialUI.js';

export class UIManager {
    constructor() {
        this.container = null;
        this.resourceDisplay = null;
        this.endDayButton = null;
        this.dayDisplay = null;
        this.staminaDisplay = null;
        this.buildButton = null;
        this.totemHealthBar = null;
        
        // UI modules
        this.buildModeUI = null;
        this.menuUI = null;
        this.interactionUI = null;
        this.tutorialUI = null;
        
        this.createUI();
        this.createTotemHealthBar();
        
        // Initialize UI modules
        this.buildModeUI = new BuildModeUI(this.container);
        this.menuUI = new MenuUI();
        this.interactionUI = new InteractionUI(this.container);
        this.tutorialUI = new TutorialUI(this.container);
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
    
    createTotemHealthBar() {
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
    
    // Core UI updates
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
    
    updateTotemHealth(current, max) {
        if (!this.totemHealthBar) return;
        
        const healthFill = this.totemHealthBar.querySelector('#totem-health-fill');
        const healthText = this.totemHealthBar.querySelector('#totem-health-text');
        
        if (healthFill) {
            const percentage = Math.max(0, Math.min(100, (current / max) * 100));
            healthFill.style.width = `${percentage}%`;
            
            if (percentage > 60) {
                healthFill.style.background = 'linear-gradient(90deg, #4a7c59, #5a8c69)';
            } else if (percentage > 30) {
                healthFill.style.background = 'linear-gradient(90deg, #ffa500, #ff8c00)';
            } else {
                healthFill.style.background = 'linear-gradient(90deg, #ff4444, #cc0000)';
            }
        }
        
        if (healthText) {
            healthText.textContent = `${Math.max(0, Math.round(current))}/${max}`;
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
    
    setBuildButtonCallback(callback) {
        if (this.buildButton) {
            this.buildButton.addEventListener('click', callback);
        }
    }
    
    // Delegate to BuildModeUI
    setBuildModeActive(active) {
        if (this.buildModeUI) {
            this.buildModeUI.setBuildModeActive(active);
        }
    }
    
    showBuildMenu(buildItems, canAffordCallback, onItemSelected, getDiscountInfo = null) {
        if (this.buildModeUI) {
            this.buildModeUI.showBuildMenu(buildItems, canAffordCallback, onItemSelected, getDiscountInfo);
        }
    }
    
    hideBuildMenu() {
        if (this.buildModeUI) {
            this.buildModeUI.hideBuildMenu();
        }
    }
    
    selectBuildMenuItem(index) {
        if (this.buildModeUI) {
            this.buildModeUI.selectBuildMenuItem(index);
        }
    }
    
    get selectedBuildItemIndex() {
        return this.buildModeUI ? this.buildModeUI.selectedBuildItemIndex : -1;
    }
    
    showBuildInstructions(inMenu) {
        if (this.buildModeUI) {
            this.buildModeUI.showBuildInstructions(inMenu);
        }
    }
    
    hideBuildInstructions() {
        if (this.buildModeUI) {
            this.buildModeUI.hideBuildInstructions();
        }
    }
    
    // Delegate to MenuUI
    showMainMenu(onStartGame) {
        if (this.menuUI) {
            this.menuUI.showMainMenu(onStartGame, (onBack) => {
                this.menuUI.showControlsScreen(onBack);
            });
        }
    }
    
    hideMainMenu() {
        if (this.menuUI) {
            this.menuUI.hideMainMenu();
        }
    }
    
    showPauseMenu(onResume, onRestart) {
        if (this.menuUI) {
            this.menuUI.showPauseMenu(onResume, onRestart, (onBack) => {
                this.menuUI.showControlsScreen(onBack);
            });
        }
    }
    
    hidePauseMenu() {
        if (this.menuUI) {
            this.menuUI.hidePauseMenu();
        }
    }
    
    // Delegate to InteractionUI
    updateEnemyDirectionIndicators(enemies, camera, playerPosition) {
        if (this.interactionUI) {
            this.interactionUI.updateEnemyDirectionIndicators(enemies, camera, playerPosition);
        }
    }
    
    updateTreeProgressBars(trees, camera) {
        if (this.interactionUI) {
            this.interactionUI.updateTreeProgressBars(trees, camera);
        }
    }

    updateEnemyHealthBars(enemies, camera) {
        if (this.interactionUI) {
            this.interactionUI.updateEnemyHealthBars(enemies, camera);
        }
    }
    
    hideTreeProgressBar(tree) {
        if (this.interactionUI) {
            this.interactionUI.hideTreeProgressBar(tree);
        }
    }
    
    updateCatDenProgressBars(buildings, camera) {
        if (this.interactionUI) {
            this.interactionUI.updateCatDenProgressBars(buildings, camera);
        }
    }

    updateTowerProgressBars(towers, camera) {
        if (this.interactionUI) {
            this.interactionUI.updateTowerProgressBars(towers, camera);
        }
    }

    updateTotemProgressBar(totem, progress, camera, isInteracting) {
        if (this.interactionUI) {
            this.interactionUI.updateTotemProgressBar(totem, progress, camera, isInteracting);
        }
    }
    
    showTooltip(target, config, camera) {
        if (this.interactionUI) {
            this.interactionUI.showTooltip(target, config, camera);
        }
    }
    
    hideTooltip(target) {
        if (this.interactionUI) {
            this.interactionUI.hideTooltip(target);
        }
    }
    
    updateTooltips(targets, camera) {
        if (this.interactionUI) {
            this.interactionUI.updateTooltips(targets, camera);
        }
    }
    
    // Delegate to TutorialUI
    showTutorial() {
        if (this.tutorialUI) {
            this.tutorialUI.show();
        }
    }
    
    hideTutorial() {
        if (this.tutorialUI) {
            this.tutorialUI.hide();
        }
    }
    
    updateTutorialStep(stepData, progress) {
        if (this.tutorialUI) {
            this.tutorialUI.updateStep(stepData, progress);
        }
    }
    
    showTutorialPrompt(onYes, onNo) {
        if (this.tutorialUI) {
            this.tutorialUI.showPrompt(onYes, onNo);
        }
    }
    
    // Win/Game Over screens
    showWinScreen(screenshotDataURL = null) {
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
        
        if (screenshotDataURL) {
            content += `
                <div style="margin: 20px 0; max-width: 90%; max-height: 60vh; border: 3px solid #ffd700; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);">
                    <img src="${screenshotDataURL}" style="width: 100%; height: auto; display: block;" alt="Final Map Screenshot" />
                </div>
                <p style="font-size: 14px; color: #aaa; text-align: center; margin-top: 10px; margin-bottom: 20px;">Your final rainforest masterpiece</p>
            `;
            
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
    
    hideAllUI() {
        if (this.container) {
            this.container.style.display = 'none';
        }
        
        if (this.buildModeUI) {
            this.buildModeUI.setBuildModeActive(false);
        }
        
        if (this.interactionUI) {
            this.interactionUI.hideAll();
        }
    }
}
