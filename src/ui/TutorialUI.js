// Tutorial UI - Step-by-step tutorial panel
export class TutorialUI {
    constructor(container) {
        this.container = container;
        this.tutorialPanel = null;
        this.tutorialPrompt = null;
        this.createTutorialPanel();
    }
    
    createTutorialPanel() {
        // Tutorial panel in bottom left
        this.tutorialPanel = document.createElement('div');
        this.tutorialPanel.id = 'tutorial-panel';
        this.tutorialPanel.style.cssText = `
            position: absolute;
            bottom: 30px;
            left: 30px;
            background: rgba(0, 0, 0, 0.85);
            border: 2px solid #4a7c59;
            border-radius: 8px;
            padding: 20px;
            min-width: 300px;
            max-width: 400px;
            pointer-events: none;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
            display: none;
            font-family: Arial, sans-serif;
            color: white;
        `;
        
        this.tutorialPanel.innerHTML = `
            <div id="tutorial-progress" style="font-size: 14px; color: #aaa; margin-bottom: 8px;">Step 1/6</div>
            <div id="tutorial-step-name" style="font-size: 18px; font-weight: bold; color: #ffd700; margin-bottom: 12px;">Cut down trees</div>
            <div id="tutorial-instructions" style="font-size: 14px; color: #ddd; margin-bottom: 8px; line-height: 1.4;">Hold Space near a tree to cut it down and gather resources</div>
            <div id="tutorial-controls" style="font-size: 12px; color: #aaa; font-style: italic;">Hold Space</div>
        `;
        
        this.container.appendChild(this.tutorialPanel);
    }
    
    show() {
        if (this.tutorialPanel) {
            this.tutorialPanel.style.display = 'block';
            setTimeout(() => {
                this.tutorialPanel.style.opacity = '1';
            }, 10);
        }
    }
    
    hide() {
        if (this.tutorialPanel) {
            this.tutorialPanel.style.opacity = '0';
            setTimeout(() => {
                this.tutorialPanel.style.display = 'none';
            }, 300);
        }
    }
    
    updateStep(stepData, progress) {
        if (!this.tutorialPanel || !stepData) return;
        
        const progressEl = this.tutorialPanel.querySelector('#tutorial-progress');
        const nameEl = this.tutorialPanel.querySelector('#tutorial-step-name');
        const instructionsEl = this.tutorialPanel.querySelector('#tutorial-instructions');
        const controlsEl = this.tutorialPanel.querySelector('#tutorial-controls');
        
        if (progressEl) {
            progressEl.textContent = `Step ${progress}`;
        }
        
        if (nameEl) {
            nameEl.textContent = stepData.name;
        }
        
        if (instructionsEl) {
            instructionsEl.textContent = stepData.instructions;
        }
        
        if (controlsEl) {
            controlsEl.textContent = stepData.controls;
        }
    }
    
    showPrompt(onYes, onNo) {
        // Remove existing prompt if present
        const existingPrompt = document.getElementById('tutorial-prompt');
        if (existingPrompt) {
            existingPrompt.remove();
        }
        
        const prompt = document.createElement('div');
        prompt.id = 'tutorial-prompt';
        prompt.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 3000;
            color: white;
            font-family: Arial, sans-serif;
            pointer-events: auto;
        `;
        
        const yesButton = document.createElement('button');
        yesButton.textContent = 'Yes';
        yesButton.style.cssText = `
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
        yesButton.addEventListener('mouseenter', () => {
            yesButton.style.background = '#5a8c69';
            yesButton.style.transform = 'scale(1.05)';
        });
        yesButton.addEventListener('mouseleave', () => {
            yesButton.style.background = '#4a7c59';
            yesButton.style.transform = 'scale(1)';
        });
        yesButton.addEventListener('click', () => {
            prompt.remove();
            if (onYes) onYes();
        });
        
        const noButton = document.createElement('button');
        noButton.textContent = 'No';
        noButton.style.cssText = `
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
        noButton.addEventListener('mouseenter', () => {
            noButton.style.background = '#7a6a5a';
            noButton.style.transform = 'scale(1.05)';
        });
        noButton.addEventListener('mouseleave', () => {
            noButton.style.background = '#6a5a4a';
            noButton.style.transform = 'scale(1)';
        });
        noButton.addEventListener('click', () => {
            prompt.remove();
            if (onNo) onNo();
        });
        
        prompt.innerHTML = `
            <h1 style="font-size: 48px; margin-bottom: 20px; color: #ffd700; text-align: center;">Tutorial</h1>
            <p style="font-size: 24px; margin-bottom: 40px; text-align: center;">Would you like to play the tutorial?</p>
        `;
        prompt.appendChild(yesButton);
        prompt.appendChild(noButton);
        document.body.appendChild(prompt);
        
        this.tutorialPrompt = prompt;
    }
}
