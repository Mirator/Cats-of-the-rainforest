// Build Mode UI - Build menu, instructions, overlay
export class BuildModeUI {
    constructor(container) {
        this.container = container;
        this.buildMenu = null;
        this.buildModeOverlay = null;
        this.buildModeIndicator = null;
        this.buildInstructions = null;
        this.selectedBuildItemIndex = -1;
        this.buildMenuItems = [];
        this.createBuildModeUI();
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
    
    showBuildMenu(buildItems, canAffordCallback, onItemSelected, getDiscountInfo = null) {
        if (!this.buildMenu) return;
        
        const menuItemsContainer = this.buildMenu.querySelector('#build-menu-items');
        if (!menuItemsContainer) return;
        
        menuItemsContainer.innerHTML = '';
        this.buildMenuItems = [];
        
        let index = 0;
        for (const [itemId, item] of Object.entries(buildItems)) {
            const canAfford = canAffordCallback ? canAffordCallback(itemId) : true;
            
            // Get discount info if available
            let discountInfo = null;
            if (getDiscountInfo) {
                discountInfo = getDiscountInfo(itemId);
            }
            
            // Calculate costs
            let woodCost = item.woodCost;
            let staminaCost = item.staminaCost;
            let hasDiscount = false;
            
            if (discountInfo && discountInfo.hasDiscount) {
                woodCost = Math.max(0, item.woodCost - discountInfo.discount.wood);
                staminaCost = Math.max(0, item.staminaCost - discountInfo.discount.stamina);
                hasDiscount = true;
            }
            
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
            
            // Build cost display with discount if applicable
            let costDisplay = '';
            if (hasDiscount) {
                costDisplay = `
                    <div style="font-size: 12px; color: #aaa;">
                        <span style="text-decoration: line-through; color: #666;">Wood: ${item.woodCost}</span>
                        <span style="color: #4a7c59; font-weight: bold;"> Wood: ${woodCost}</span>
                        <span style="color: #aaa;"> | Stamina: ${staminaCost}</span>
                        <div style="font-size: 10px; color: #4a7c59; margin-top: 2px;">First wave discount</div>
                    </div>
                `;
            } else {
                costDisplay = `
                    <div style="font-size: 12px; color: #aaa;">
                        Wood: ${woodCost} | Stamina: ${staminaCost}
                    </div>
                `;
            }
            
            menuItem.innerHTML = `
                <div style="flex: 1;">
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">${item.name}</div>
                    ${costDisplay}
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
    
    showBuildInstructions(inMenu) {
        if (!this.buildInstructions) return;
        
        if (inMenu) {
            this.buildInstructions.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 8px; color: #ffd700;">How to Build:</div>
                <div>Press a number key or click to select a building</div>
                <div style="margin-top: 5px; font-size: 12px; color: #aaa;">Use Arrow Keys to navigate, Enter or Space to confirm</div>
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
