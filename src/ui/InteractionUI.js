// Interaction UI - Tooltips, progress bars, edge indicators
export class InteractionUI {
    constructor(container) {
        this.container = container;
        this.tooltips = new Map();
        this.treeProgressBars = new Map();
        this.catDenProgressBars = new Map();
        this.towerProgressBars = new Map();
        this.enemyHealthBars = new Map();
        this.totemProgressBar = null;
        this.edgeIndicators = {
            north: null,
            south: null,
            east: null,
            west: null
        };
        this.createEdgeIndicators();
    }
    
    createEdgeIndicators() {
        const edgeWidth = 8;
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
            Object.values(this.edgeIndicators).forEach(indicator => {
                if (indicator) indicator.style.opacity = '0';
            });
            return;
        }
        
        const activeDirections = {
            north: false,
            south: false,
            east: false,
            west: false
        };
        
        enemies.forEach(enemy => {
            if (enemy.isDestroyed || !enemy.position) return;
            
            const enemyWorldPos = enemy.position.clone();
            enemyWorldPos.project(camera);
            
            const margin = 0.1;
            const isOffScreen = 
                enemyWorldPos.x < -1 - margin || enemyWorldPos.x > 1 + margin ||
                enemyWorldPos.y < -1 - margin || enemyWorldPos.y > 1 + margin ||
                enemyWorldPos.z < -1 || enemyWorldPos.z > 1;
            
            if (isOffScreen) {
                const dx = enemy.position.x - playerPosition.x;
                const dz = enemy.position.z - playerPosition.z;
                
                const absDx = Math.abs(dx);
                const absDz = Math.abs(dz);
                
                if (absDz > absDx * 0.7) {
                    if (dz < 0) {
                        activeDirections.north = true;
                    } else {
                        activeDirections.south = true;
                    }
                }
                
                if (absDx > absDz * 0.7) {
                    if (dx > 0) {
                        activeDirections.east = true;
                    } else {
                        activeDirections.west = true;
                    }
                }
            }
        });
        
        Object.keys(activeDirections).forEach(direction => {
            const indicator = this.edgeIndicators[direction];
            if (indicator) {
                indicator.style.opacity = activeDirections[direction] ? '1' : '0';
            }
        });
    }
    
    showTreeProgressBar(tree, progress, camera) {
        if (!tree || !camera || !tree.mesh) return;
        
        const worldPosition = tree.getPosition().clone();
        worldPosition.y += 3;
        
        const screenPosition = worldPosition.clone();
        screenPosition.project(camera);
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        const x = (screenPosition.x * 0.5 + 0.5) * width;
        const y = (-screenPosition.y * 0.5 + 0.5) * height;
        
        if (screenPosition.z > 1 || x < 0 || x > width || y < 0 || y > height) {
            this.hideTreeProgressBar(tree);
            return;
        }
        
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
        
        progressBar.style.left = `${x}px`;
        progressBar.style.top = `${y}px`;
        
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
        const interactingTrees = new Set();
        
        for (const tree of trees) {
            if (tree.isInteracting && !tree.isCut && !tree.isFalling) {
                interactingTrees.add(tree);
                this.showTreeProgressBar(tree, tree.interactionProgress, camera);
            } else {
                this.hideTreeProgressBar(tree);
            }
        }
        
        for (const [tree, bar] of this.treeProgressBars.entries()) {
            if (!interactingTrees.has(tree)) {
                this.hideTreeProgressBar(tree);
            }
        }
    }

    showEnemyHealthBar(enemy, currentHP, maxHP, camera) {
        if (!enemy || !camera || !enemy.getPosition) return;

        const worldPosition = enemy.getPosition().clone();
        const yOffset = enemy.yOffset !== undefined ? enemy.yOffset : 0.5;
        worldPosition.y += yOffset + 1.2;

        const screenPosition = worldPosition.clone();
        screenPosition.project(camera);

        const width = window.innerWidth;
        const height = window.innerHeight;
        const x = (screenPosition.x * 0.5 + 0.5) * width;
        const y = (-screenPosition.y * 0.5 + 0.5) * height;

        if (screenPosition.z > 1 || x < 0 || x > width || y < 0 || y > height) {
            this.hideEnemyHealthBar(enemy);
            return;
        }

        let healthBar = this.enemyHealthBars.get(enemy);

        if (!healthBar) {
            healthBar = document.createElement('div');
            healthBar.className = 'enemy-health-bar';
            healthBar.style.cssText = `
                position: fixed;
                width: 70px;
                height: 8px;
                background: rgba(0, 0, 0, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.7);
                border-radius: 4px;
                pointer-events: none;
                z-index: 1500;
                transform: translate(-50%, -50%);
            `;

            const healthFill = document.createElement('div');
            healthFill.className = 'enemy-health-fill';
            healthFill.style.cssText = `
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, #ff6b6b, #c0392b);
                border-radius: 3px;
                transition: width 0.08s linear;
            `;
            healthBar.appendChild(healthFill);

            document.body.appendChild(healthBar);
            this.enemyHealthBars.set(enemy, healthBar);
        }

        healthBar.style.left = `${x}px`;
        healthBar.style.top = `${y}px`;

        const healthFill = healthBar.querySelector('.enemy-health-fill');
        if (healthFill) {
            const percentage = Math.min(100, Math.max(0, (currentHP / maxHP) * 100));
            healthFill.style.width = `${percentage}%`;
        }
    }

    hideEnemyHealthBar(enemy) {
        const healthBar = this.enemyHealthBars.get(enemy);
        if (healthBar) {
            healthBar.remove();
            this.enemyHealthBars.delete(enemy);
        }
    }

    updateEnemyHealthBars(enemies, camera) {
        const activeEnemies = new Set();

        if (enemies && camera) {
            for (const enemy of enemies) {
                if (!enemy || enemy.isDestroyed) {
                    this.hideEnemyHealthBar(enemy);
                    continue;
                }

                const maxHP = enemy.getMaxHP ? enemy.getMaxHP() : 0;
                const currentHP = enemy.getHP ? enemy.getHP() : maxHP;
                if (maxHP <= 0) {
                    this.hideEnemyHealthBar(enemy);
                    continue;
                }

                if (currentHP < maxHP) {
                    activeEnemies.add(enemy);
                    this.showEnemyHealthBar(enemy, currentHP, maxHP, camera);
                } else {
                    this.hideEnemyHealthBar(enemy);
                }
            }
        }

        for (const [enemy, bar] of this.enemyHealthBars.entries()) {
            if (!activeEnemies.has(enemy)) {
                this.hideEnemyHealthBar(enemy);
            }
        }
    }
    
    showCatDenProgressBar(catDen, progress, camera) {
        if (!catDen || !camera || !catDen.mesh) return;
        
        const worldPosition = catDen.getPosition().clone();
        worldPosition.y += 3;
        
        const screenPosition = worldPosition.clone();
        screenPosition.project(camera);
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        const x = (screenPosition.x * 0.5 + 0.5) * width;
        const y = (-screenPosition.y * 0.5 + 0.5) * height;
        
        if (screenPosition.z > 1 || x < 0 || x > width || y < 0 || y > height) {
            this.hideCatDenProgressBar(catDen);
            return;
        }
        
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
        
        progressBar.style.left = `${x}px`;
        progressBar.style.top = `${y}px`;
        
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
        const interactingCatDens = new Set();
        
        for (const building of buildings) {
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
        
        for (const [catDen, bar] of this.catDenProgressBars.entries()) {
            if (!interactingCatDens.has(catDen)) {
                this.hideCatDenProgressBar(catDen);
            }
        }
    }

    showTowerProgressBar(tower, progress, camera) {
        if (!tower || !camera || !tower.mesh) return;

        const worldPosition = tower.getPosition().clone();
        worldPosition.y += 3;

        const screenPosition = worldPosition.clone();
        screenPosition.project(camera);

        const width = window.innerWidth;
        const height = window.innerHeight;
        const x = (screenPosition.x * 0.5 + 0.5) * width;
        const y = (-screenPosition.y * 0.5 + 0.5) * height;

        if (screenPosition.z > 1 || x < 0 || x > width || y < 0 || y > height) {
            this.hideTowerProgressBar(tower);
            return;
        }

        let progressBar = this.towerProgressBars.get(tower);

        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'tower-progress-bar';
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

            const progressFill = document.createElement('div');
            progressFill.className = 'tower-progress-fill';
            progressFill.style.cssText = `
                width: 0%;
                height: 100%;
                background: linear-gradient(90deg, #6a5a4a, #8b7355);
                border-radius: 2px;
                transition: width 0.1s linear;
            `;
            progressBar.appendChild(progressFill);

            document.body.appendChild(progressBar);
            this.towerProgressBars.set(tower, progressBar);
        }

        progressBar.style.left = `${x}px`;
        progressBar.style.top = `${y}px`;

        const progressFill = progressBar.querySelector('.tower-progress-fill');
        if (progressFill) {
            const progressPercent = Math.min(100, Math.max(0, progress * 100));
            progressFill.style.width = `${progressPercent}%`;
        }
    }

    hideTowerProgressBar(tower) {
        const progressBar = this.towerProgressBars.get(tower);
        if (progressBar) {
            progressBar.remove();
            this.towerProgressBars.delete(tower);
        }
    }

    updateTowerProgressBars(towers, camera) {
        const interactingTowers = new Set();

        for (const tower of towers) {
            if (tower.getIsBuilt && tower.getIsBuilt()) {
                if (tower.isInteracting) {
                    interactingTowers.add(tower);
                    this.showTowerProgressBar(tower, tower.interactionProgress, camera);
                } else {
                    this.hideTowerProgressBar(tower);
                }
            }
        }

        for (const [tower, bar] of this.towerProgressBars.entries()) {
            if (!interactingTowers.has(tower)) {
                this.hideTowerProgressBar(tower);
            }
        }
    }

    showTotemProgressBar(totem, progress, camera) {
        if (!totem || !camera || !totem.mesh) return;

        const worldPosition = totem.getPosition().clone();
        worldPosition.y += 4;

        const screenPosition = worldPosition.clone();
        screenPosition.project(camera);

        const width = window.innerWidth;
        const height = window.innerHeight;
        const x = (screenPosition.x * 0.5 + 0.5) * width;
        const y = (-screenPosition.y * 0.5 + 0.5) * height;

        if (screenPosition.z > 1 || x < 0 || x > width || y < 0 || y > height) {
            this.hideTotemProgressBar();
            return;
        }

        if (!this.totemProgressBar) {
            this.totemProgressBar = document.createElement('div');
            this.totemProgressBar.className = 'totem-progress-bar';
            this.totemProgressBar.style.cssText = `
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

            const progressFill = document.createElement('div');
            progressFill.className = 'totem-progress-fill';
            progressFill.style.cssText = `
                width: 0%;
                height: 100%;
                background: linear-gradient(90deg, #4a7c59, #5a8c69);
                border-radius: 2px;
                transition: width 0.1s linear;
            `;
            this.totemProgressBar.appendChild(progressFill);

            document.body.appendChild(this.totemProgressBar);
        }

        this.totemProgressBar.style.left = `${x}px`;
        this.totemProgressBar.style.top = `${y}px`;

        const progressFill = this.totemProgressBar.querySelector('.totem-progress-fill');
        if (progressFill) {
            const progressPercent = Math.min(100, Math.max(0, progress * 100));
            progressFill.style.width = `${progressPercent}%`;
        }
    }

    hideTotemProgressBar() {
        if (this.totemProgressBar) {
            this.totemProgressBar.remove();
            this.totemProgressBar = null;
        }
    }

    updateTotemProgressBar(totem, progress, camera, isInteracting) {
        if (isInteracting) {
            this.showTotemProgressBar(totem, progress, camera);
        } else {
            this.hideTotemProgressBar();
        }
    }
    
    showTooltip(target, config, camera) {
        if (!target || !camera || !target.getPosition) return;
        
        const worldPosition = target.getPosition().clone();
        const offset = config.worldOffset || { x: 0, y: 2.5, z: 0 };
        worldPosition.x += offset.x;
        worldPosition.y += offset.y;
        worldPosition.z += offset.z;
        
        const screenPosition = worldPosition.clone();
        screenPosition.project(camera);
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        const x = (screenPosition.x * 0.5 + 0.5) * width;
        const y = (-screenPosition.y * 0.5 + 0.5) * height;
        
        if (screenPosition.z > 1 || x < 0 || x > width || y < 0 || y > height) {
            this.hideTooltip(target);
            return;
        }
        
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
        
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        
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
        const eligibleTargets = new Set();
        
        for (const targetData of targets) {
            if (targetData && targetData.config && targetData.shouldShow) {
                eligibleTargets.add(targetData.target);
                this.showTooltip(targetData.target, targetData.config, camera);
            } else if (targetData && targetData.target) {
                this.hideTooltip(targetData.target);
            }
        }
        
        for (const [target, tooltip] of this.tooltips.entries()) {
            if (!eligibleTargets.has(target)) {
                this.hideTooltip(target);
            }
        }
    }
    
    hideAll() {
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
        for (const progressBar of this.towerProgressBars.values()) {
            if (progressBar) {
                progressBar.style.display = 'none';
            }
        }
        if (this.totemProgressBar) {
            this.totemProgressBar.style.display = 'none';
        }
        
        // Hide edge indicators
        Object.values(this.edgeIndicators).forEach(indicator => {
            if (indicator) {
                indicator.style.display = 'none';
            }
        });
    }
}
