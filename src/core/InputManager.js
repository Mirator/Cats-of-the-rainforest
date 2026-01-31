import { CONTROLS } from '../config/controls.js';

export class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            down: false,
            clicked: false,
            rightDown: false,
            rightClicked: false,
            button: 0 // 0 = left, 1 = middle, 2 = right
        };

        this.handleKeyDown = (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;
        };

        this.handleKeyUp = (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        };

        this.handleMouseMove = (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        };

        this.handleMouseDown = (e) => {
            this.mouse.button = e.button;
            if (e.button === 0) {
                this.mouse.down = true;
                this.mouse.clicked = true;
            } else if (e.button === 2) {
                this.mouse.rightDown = true;
                this.mouse.rightClicked = true;
            }
        };

        this.handleMouseUp = (e) => {
            if (e.button === 0) {
                this.mouse.down = false;
            } else if (e.button === 2) {
                this.mouse.rightDown = false;
            }
        };

        this.handleContextMenu = (e) => {
            e.preventDefault();
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        
        // Mouse events
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mouseup', this.handleMouseUp);
        
        // Prevent context menu on right click
        window.addEventListener('contextmenu', this.handleContextMenu);
    }

    destroy() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mousedown', this.handleMouseDown);
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('contextmenu', this.handleContextMenu);
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
        
        // Movement keys from config
        if (this.isAnyKeyPressed(CONTROLS.moveUp)) {
            move.z -= 1;
        }
        if (this.isAnyKeyPressed(CONTROLS.moveDown)) {
            move.z += 1;
        }
        if (this.isAnyKeyPressed(CONTROLS.moveLeft)) {
            move.x -= 1;
        }
        if (this.isAnyKeyPressed(CONTROLS.moveRight)) {
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
        return this.isAnyKeyPressed(CONTROLS.interact) || this.mouse.clicked;
    }
    
    // Helper function to check if any of the keys in an array are pressed
    isAnyKeyPressed(keys) {
        return keys.some(key => {
            if (key === 'RightClick') {
                return this.mouse.rightClicked;
            }
            return this.isKeyPressed(key);
        });
    }
    
    // Helper function to check if any of the keys in an array are held
    isAnyKeyHeld(keys) {
        return keys.some(key => {
            if (key === 'RightClick') {
                return this.mouse.rightDown;
            }
            return this.isKeyHeld(key);
        });
    }
    
    // Helper function to check if any movement key is pressed
    isMovementKeyPressed() {
        const movementKeys = [
            ...CONTROLS.moveUp,
            ...CONTROLS.moveDown,
            ...CONTROLS.moveLeft,
            ...CONTROLS.moveRight
        ];
        return movementKeys.some(key => this.isKeyPressed(key));
    }
    
    update() {
        // Reset clicked flags after one frame
        this.mouse.clicked = false;
        this.mouse.rightClicked = false;
    }
}
