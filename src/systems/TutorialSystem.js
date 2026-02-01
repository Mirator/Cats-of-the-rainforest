// Tutorial system for first wave guidance
export class TutorialSystem {
    constructor() {
        this.isActive = false;
        this.isComplete = false;
        this.currentStepIndex = 0;
        
        // Define tutorial steps
        this.steps = [
            {
                name: "Forest Totem",
                instructions: "This is the Forest Totem. Defend it from enemies. Buildings must be built around it.",
                controls: "WASD or Arrow Keys to look around",
                completionCheck: null // Will be set by game
            },
            {
                name: "Gather resources",
                instructions: "Trees provide Food and Wood. Hold Space near a tree to cut it down. Stamina refreshes every day.",
                controls: "Hold Space near a tree",
                completionCheck: null
            },
            {
                name: "Build a cat den",
                instructions: "Press B to open Build Menu, then select Cat Den and place it near the Totem",
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
                instructions: "Build a Tower, then stand near it and hold Space to assign a cat",
                controls: "Hold Space near Tower",
                completionCheck: null
            },
            {
                name: "Go to night",
                instructions: "Hold Space near the Totem or click the End Day button to start the night",
                controls: "Hold Space near Totem or click End Day",
                completionCheck: null
            },
            {
                name: "Survive the first night",
                instructions: "Defend the Forest Totem! Attack enemies with Space or F",
                controls: "Press Space or F to attack",
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
            return `0/${this.steps.length}`;
        }
        return `${this.currentStepIndex + 1}/${this.steps.length}`;
    }

    getCurrentStepIndex() {
        return this.currentStepIndex;
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
