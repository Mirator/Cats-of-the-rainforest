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
}
