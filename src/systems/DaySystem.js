import { RESOURCE_CONFIG } from '../config/resources.js';

export const DayState = {
    DAY: 'day',
    NIGHT: 'night'
};

export class DaySystem {
    constructor() {
        this.state = DayState.DAY;
        this.currentDay = 1;
        this.listeners = [];
        this.treesCutToday = 0;
        this.maxStamina = RESOURCE_CONFIG.maxStamina;
        this.stamina = RESOURCE_CONFIG.initialStamina;
    }
    
    getState() {
        return this.state;
    }
    
    getCurrentDay() {
        return this.currentDay;
    }
    
    isDay() {
        return this.state === DayState.DAY;
    }
    
    isNight() {
        return this.state === DayState.NIGHT;
    }
    
    endDay() {
        if (this.state === DayState.DAY) {
            this.state = DayState.NIGHT;
            this.notifyListeners();
        }
    }
    
    startNextDay() {
        this.state = DayState.DAY;
        this.currentDay++;
        this.resetTreesCutToday();
        this.refreshStamina();
        this.notifyListeners();
    }
    
    incrementTreesCut() {
        this.treesCutToday++;
    }
    
    getTreesCutToday() {
        return this.treesCutToday;
    }
    
    resetTreesCutToday() {
        this.treesCutToday = 0;
    }
    
    onStateChange(callback) {
        this.listeners.push(callback);
    }
    
    notifyListeners() {
        this.listeners.forEach(callback => {
            callback({
                state: this.state,
                day: this.currentDay
            });
        });
    }
    
    getStamina() {
        return this.stamina;
    }
    
    getMaxStamina() {
        return this.maxStamina;
    }
    
    hasStamina() {
        return this.stamina > 0;
    }
    
    consumeStamina(amount = 1) {
        if (this.stamina >= amount) {
            this.stamina -= amount;
            return true;
        }
        return false;
    }
    
    refreshStamina() {
        this.stamina = this.maxStamina;
    }
}
