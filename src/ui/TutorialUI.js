// Tutorial UI - Step-by-step tutorial panel
export class TutorialUI {
    constructor(container) {
        this.container = container;
        this.tutorialPanel = null;
        this.tutorialPrompt = null;
        this.focusOverlay = null;
        this.focusOverlayHideTimer = null;
        this.createFocusOverlay();
        this.createTutorialPanel();
    }

    createFocusOverlay() {
        this.focusOverlay = document.createElement('div');
        this.focusOverlay.id = 'tutorial-focus-overlay';
        this.focusOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            pointer-events: none;
            opacity: 0;
            display: none;
            transition: opacity 0.2s;
        `;

        if (this.container.firstChild) {
            this.container.insertBefore(this.focusOverlay, this.container.firstChild);
        } else {
            this.container.appendChild(this.focusOverlay);
        }
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
            <div id="tutorial-progress" style="font-size: 14px; color: #aaa; margin-bottom: 8px;">Step 1/7</div>
            <div id="tutorial-step-name" style="font-size: 18px; font-weight: bold; color: #ffd700; margin-bottom: 12px;">Forest Totem</div>
            <div id="tutorial-instructions" style="font-size: 14px; color: #ddd; margin-bottom: 8px; line-height: 1.4;">This is the Forest Totem. Defend it from enemies. Buildings must be built around it.</div>
            <div id="tutorial-controls" style="font-size: 12px; color: #aaa; font-style: italic;">WASD or Arrow Keys to look around</div>
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

    showFocusOverlay() {
        if (!this.focusOverlay) return;
        if (this.focusOverlayHideTimer) {
            clearTimeout(this.focusOverlayHideTimer);
            this.focusOverlayHideTimer = null;
        }
        this.focusOverlay.style.display = 'block';
        requestAnimationFrame(() => {
            if (this.focusOverlay) {
                this.focusOverlay.style.opacity = '1';
            }
        });
    }

    hideFocusOverlay() {
        if (!this.focusOverlay) return;
        this.focusOverlay.style.opacity = '0';
        if (this.focusOverlayHideTimer) {
            clearTimeout(this.focusOverlayHideTimer);
        }
        this.focusOverlayHideTimer = setTimeout(() => {
            if (this.focusOverlay) {
                this.focusOverlay.style.display = 'none';
                this.focusOverlay.style.background = 'rgba(0, 0, 0, 0.6)';
            }
            this.focusOverlayHideTimer = null;
        }, 200);
    }

    updateFocusOverlay(points = [], options = {}) {
        if (!this.focusOverlay) return;

        const baseOpacity = typeof options.baseOpacity === 'number' ? options.baseOpacity : 0.4;
        const baseColor = `rgba(0, 0, 0, ${baseOpacity})`;
        if (!points.length) {
            this.focusOverlay.style.background = baseColor;
            return;
        }

        const gradients = points.map((point) => {
            const radius = Math.max(60, point.radius || 140);
            const inner = Math.round(radius * 0.55);
            const x = Math.round(point.x);
            const y = Math.round(point.y);
            return `radial-gradient(circle ${radius}px at ${x}px ${y}px, rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0) ${inner}px, ${baseColor} ${radius}px)`;
        });

        this.focusOverlay.style.background = `${gradients.join(', ')}, ${baseColor}`;
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
