// Tutorial system for first wave guidance
export class TutorialSystem {
    constructor() {
        this.isActive = false;
        this.isComplete = false;
        this.currentStepIndex = 0;
        
        // Define tutorial steps
        this.steps = [
            {
                name: "Cut down trees",
                instructions: "Hold Space near a tree to cut it down and gather resources",
                controls: "Hold Space",
                completionCheck: null // Will be set by game
            },
            {
                name: "Build a cat den",
                instructions: "Press B to open Build Menu, then select Cat Den and place it near the totem",
                controls: "Press B, then select Cat Den",
                completionCheck: null
            },
            {
                name: "Spawn a cat",
                instructions: "Stand near the Cat Den and hold Space to spawn a cat",
                controls: "Hold Space near Cat Den",
                completionCheck: null
            },
            {
                name: "Assign cat to tower",
                instructions: "Build a Tower, then stand near it and press Space to assign a cat",
                controls: "Press Space near Tower",
                completionCheck: null
            },
            {
                name: "Go to night",
                instructions: "Click the End Day button to start the night and face the enemies",
                controls: "Click End Day button",
                completionCheck: null
            },
            {
                name: "Survive the first night",
                instructions: "Defend the Forest Totem! Attack enemies with Space or Left Click",
                controls: "Space or Left Click to attack",
                completionCheck: null
            }
        ];
    }
    
    start() {
        this.isActive = true;
        this.isComplete = false;
        this.currentStepIndex = 0;
    }
    
    stop() {
        this.isActive = false;
    }
    
    getCurrentStep() {
        if (!this.isActive || this.currentStepIndex >= this.steps.length) {
            return null;
        }
        return this.steps[this.currentStepIndex];
    }
    
    getProgress() {
        if (!this.isActive) {
            return "0/6";
        }
        return `${this.currentStepIndex + 1}/6`;
    }
    
    checkStepCompletion() {
        if (!this.isActive || this.isComplete) {
            return false;
        }
        
        const currentStep = this.getCurrentStep();
        if (!currentStep || !currentStep.completionCheck) {
            return false;
        }
        
        return currentStep.completionCheck();
    }
    
    advanceStep() {
        if (!this.isActive || this.isComplete) {
            return;
        }
        
        this.currentStepIndex++;
        
        if (this.currentStepIndex >= this.steps.length) {
            this.complete();
        }
    }
    
    complete() {
        this.isComplete = true;
        this.isActive = false;
    }
    
    isTutorialComplete() {
        return this.isComplete;
    }
    
    setStepCompletionCheck(stepIndex, checkFunction) {
        if (stepIndex >= 0 && stepIndex < this.steps.length) {
            this.steps[stepIndex].completionCheck = checkFunction;
        }
    }
}
