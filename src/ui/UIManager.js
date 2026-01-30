export class UIManager {
    constructor() {
        this.container = null;
        this.resourceDisplay = null;
        this.endDayButton = null;
        this.dayDisplay = null;
        
        this.createUI();
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
        
        document.body.appendChild(this.container);
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
}
