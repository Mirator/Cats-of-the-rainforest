export const DayState = {
    DAY: 'day',
    NIGHT: 'night'
};

export class DaySystem {
    constructor() {
        this.state = DayState.DAY;
        this.currentDay = 1;
        this.listeners = [];
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
            // For milestone 1, we'll just transition back to day after a moment
            // In future milestones, this will trigger the night phase
            setTimeout(() => {
                this.startNextDay();
            }, 1000);
        }
    }
    
    startNextDay() {
        this.state = DayState.DAY;
        this.currentDay++;
        this.notifyListeners();
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
