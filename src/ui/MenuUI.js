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
            background: rgba(0, 0, 0, 0.65);
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
            <p style="font-size: 20px; margin-bottom: 40px; text-align: center; color: #aaa; max-width: 720px; line-height: 1.5;">
                Lead your cat tribe to defend the forest totem from the mice.
                To raise defenses, you must fell trees—the more you cut, the safer the tribe, but the weaker the rainforest.
                Every victory asks a question: how much of the forest will you spend to save it?
            </p>
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
        this.hideControlsScreen();
        
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
        
        // Use a shorter, player-friendly controls list
        const groupedControls = this.getBriefControls();
        
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
        for (const { category, items } of groupedControls) {
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
            
            for (const { label, keys } of items) {
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
                description.textContent = label;
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

        // Back to top button + tooltip
        const backToTopButton = document.createElement('button');
        backToTopButton.textContent = 'Top';
        backToTopButton.title = 'Back to top';
        backToTopButton.style.cssText = `
            position: fixed;
            right: 24px;
            bottom: 24px;
            padding: 10px 16px;
            font-size: 14px;
            font-weight: bold;
            background: rgba(74, 124, 89, 0.9);
            color: white;
            border: 2px solid #228b22;
            border-radius: 999px;
            cursor: pointer;
            z-index: 2200;
            transition: all 0.2s;
        `;
        const backToTopTooltip = document.createElement('div');
        backToTopTooltip.textContent = 'Back to top';
        backToTopTooltip.style.cssText = `
            position: fixed;
            right: 24px;
            bottom: 66px;
            padding: 6px 10px;
            font-size: 12px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 6px;
            opacity: 0;
            transform: translateY(4px);
            pointer-events: none;
            transition: all 0.2s;
            z-index: 2200;
        `;
        backToTopButton.addEventListener('mouseenter', () => {
            backToTopButton.style.background = '#5a8c69';
            backToTopButton.style.transform = 'translateY(-2px)';
            backToTopTooltip.style.opacity = '1';
            backToTopTooltip.style.transform = 'translateY(0)';
        });
        backToTopButton.addEventListener('mouseleave', () => {
            backToTopButton.style.background = 'rgba(74, 124, 89, 0.9)';
            backToTopButton.style.transform = 'translateY(0)';
            backToTopTooltip.style.opacity = '0';
            backToTopTooltip.style.transform = 'translateY(4px)';
        });
        backToTopButton.addEventListener('click', () => {
            if (typeof controlsScreen.scrollTo === 'function') {
                controlsScreen.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                controlsScreen.scrollTop = 0;
            }
        });
        
        controlsScreen.appendChild(contentContainer);
        controlsScreen.appendChild(backButton);
        controlsScreen.appendChild(backToTopTooltip);
        controlsScreen.appendChild(backToTopButton);
        document.body.appendChild(controlsScreen);
        
        this.controlsScreen = controlsScreen;
        this.controlsBackHandler = onBack;
        this.controlsKeyHandler = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                if (this.controlsBackHandler) {
                    this.controlsBackHandler();
                }
            }
        };
        window.addEventListener('keydown', this.controlsKeyHandler);
    }
    
    hideControlsScreen() {
        const controlsScreen = document.getElementById('controls-screen');
        if (controlsScreen) {
            controlsScreen.remove();
        }
        this.controlsScreen = null;
        if (this.controlsKeyHandler) {
            window.removeEventListener('keydown', this.controlsKeyHandler);
            this.controlsKeyHandler = null;
        }
        this.controlsBackHandler = null;
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
            'RightClick': 'Right Click',
            'WASD': 'WASD',
            'Arrows': 'Arrows',
            '1-9': '1-9'
        };
        
        if (keyMap[key]) {
            return keyMap[key];
        }
        
        return key.charAt(0).toUpperCase() + key.slice(1);
    }

    getBriefControls() {
        return [
            {
                category: 'Movement',
                items: [
                    { label: 'Move', keys: ['WASD', 'Arrows'] }
                ]
            },
            {
                category: 'Actions',
                items: [
                    { label: 'Interact / Use', keys: ['Space'] },
                    { label: 'Attack (Night)', keys: ['F', 'Space'] }
                ]
            },
            {
                category: 'Build & Placement',
                items: [
                    { label: 'Build Menu', keys: ['B'] },
                    { label: 'Confirm / Place', keys: ['Enter', 'Space'] },
                    { label: 'Cancel / Back', keys: ['Escape', 'RightClick'] },
                    { label: 'Quick Select', keys: ['1-9'] }
                ]
            },
            {
                category: 'Menus',
                items: [
                    { label: 'Pause / Back', keys: ['Escape'] }
                ]
            }
        ];
    }
    
}
