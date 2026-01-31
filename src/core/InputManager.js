export class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            down: false,
            clicked: false
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });
        
        // Mouse events
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        window.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            this.mouse.clicked = true;
        });
        
        window.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });
    }
    
    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] || this.keys[key] || false;
    }
    
    isKeyHeld(key) {
        // Check if key is currently held down (continuous press)
        return this.keys[key.toLowerCase()] || this.keys[key] || false;
    }
    
    getMovementVector() {
        const move = { x: 0, z: 0 };
        
        // WASD or Arrow keys
        if (this.isKeyPressed('w') || this.isKeyPressed('ArrowUp')) {
            move.z -= 1;
        }
        if (this.isKeyPressed('s') || this.isKeyPressed('ArrowDown')) {
            move.z += 1;
        }
        if (this.isKeyPressed('a') || this.isKeyPressed('ArrowLeft')) {
            move.x -= 1;
        }
        if (this.isKeyPressed('d') || this.isKeyPressed('ArrowRight')) {
            move.x += 1;
        }
        
        // Normalize diagonal movement
        if (move.x !== 0 && move.z !== 0) {
            move.x *= 0.707;
            move.z *= 0.707;
        }
        
        return move;
    }
    
    isActionPressed() {
        return this.isKeyPressed(' ') || this.mouse.clicked;
    }
    
    update() {
        // Reset clicked flag after one frame
        this.mouse.clicked = false;
    }
}
