export class ResourceSystem {
    constructor() {
        this.food = 0;
        this.wood = 0;
        this.listeners = [];
    }
    
    addFood(amount) {
        this.food += amount;
        this.notifyListeners();
    }
    
    addWood(amount) {
        this.wood += amount;
        this.notifyListeners();
    }
    
    getFood() {
        return this.food;
    }
    
    getWood() {
        return this.wood;
    }
    
    setFood(amount) {
        this.food = amount;
        this.notifyListeners();
    }
    
    setWood(amount) {
        this.wood = amount;
        this.notifyListeners();
    }
    
    canAffordFood(amount) {
        return this.food >= amount;
    }
    
    canAffordWood(amount) {
        return this.wood >= amount;
    }
    
    spendFood(amount) {
        if (this.canAffordFood(amount)) {
            this.food -= amount;
            this.notifyListeners();
            return true;
        }
        return false;
    }
    
    spendWood(amount) {
        if (this.canAffordWood(amount)) {
            this.wood -= amount;
            this.notifyListeners();
            return true;
        }
        return false;
    }
    
    onResourceChange(callback) {
        this.listeners.push(callback);
    }
    
    notifyListeners() {
        this.listeners.forEach(callback => {
            callback({
                food: this.food,
                wood: this.wood
            });
        });
    }
}
