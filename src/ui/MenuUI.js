import { CONTROLS } from '../config/controls.js';

// Menu UI - Main menu, pause menu, controls screen
export class MenuUI {
    constructor() {
        this.mainMenu = null;
        this.pauseMenu = null;
        this.controlsScreen = null;
    }
    
    showMainMenu(onStartGame, onShowControls) {
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
            if (onShowControls) {
                onShowControls(() => {
                    this.hideControlsScreen();
                    this.showMainMenu(onStartGame, onShowControls);
                });
            }
        });
        
        mainMenu.innerHTML = `
            <h1 style="font-size: 64px; margin-bottom: 20px; color: #ffd700; text-align: center;">Cats of the Rainforest</h1>
            <p style="font-size: 24px; margin-bottom: 40px; text-align: center; color: #aaa;">Protect the forest from the masked mice</p>
        `;
        mainMenu.appendChild(startButton);
        mainMenu.appendChild(controlsButton);
        document.body.appendChild(mainMenu);
        
        this.mainMenu = mainMenu;
    }
    
    hideMainMenu() {
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu) {
            mainMenu.remove();
        }
        this.mainMenu = null;
    }
    
    showPauseMenu(onResume, onRestart, onShowControls) {
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
            if (onShowControls) {
                onShowControls(() => {
                    this.hideControlsScreen();
                    this.showPauseMenu(onResume, onRestart, onShowControls);
                });
            }
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
        
        this.pauseMenu = pauseMenu;
    }
    
    hidePauseMenu() {
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
            pauseMenu.remove();
        }
        this.pauseMenu = null;
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
        
        this.controlsScreen = controlsScreen;
    }
    
    hideControlsScreen() {
        const controlsScreen = document.getElementById('controls-screen');
        if (controlsScreen) {
            controlsScreen.remove();
        }
        this.controlsScreen = null;
    }
    
    formatKeyName(key) {
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
        
        return key.charAt(0).toUpperCase() + key.slice(1);
    }
    
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
        
        for (const [category, keys] of Object.entries(categories)) {
            grouped[category] = [];
            for (const key of keys) {
                if (controls[key]) {
                    grouped[category].push({ key, keys: controls[key] });
                    usedKeys.add(key);
                }
            }
        }
        
        for (const [key, keys] of Object.entries(controls)) {
            if (!usedKeys.has(key)) {
                if (!grouped['Other']) {
                    grouped['Other'] = [];
                }
                grouped['Other'].push({ key, keys });
            }
        }
        
        for (const category of Object.keys(grouped)) {
            if (grouped[category].length === 0) {
                delete grouped[category];
            }
        }
        
        return grouped;
    }
}
