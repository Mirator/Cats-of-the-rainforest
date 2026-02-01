import { Mouse } from './Mouse.js';
import { MouseModel } from './MouseModel.js';
import { ENEMY_CONFIG } from '../config/enemies.js';

export class StrongMouse extends Mouse {
    constructor(x, z, hpMultiplier = ENEMY_CONFIG.strongMouse.defaultHpMultiplier, y = 0) {
        super(x, z, hpMultiplier, y);

        // We need to override the model creation to apply scale
        this.speed = ENEMY_CONFIG.strongMouse.speed;
        this.visualScale = ENEMY_CONFIG.strongMouse.visualScale;
        this.damageAmount = ENEMY_CONFIG.strongMouse.damageAmount;

        // Create model with wrapped callback to apply scale
        this.model = new MouseModel(this.position, {
            onModelLoaded: ({ mesh, yOffset }) => {
                this.mesh = mesh;
                this.yOffset = yOffset;
                this.modelLoaded = true;
                // Apply scale to loaded mesh
                if (this.mesh) {
                    this.mesh.scale.multiplyScalar(this.visualScale);
                }
            },
            modelPath: 'mouse.glb',
            placeholderColor: 0x8b7355,
            scale: 0.5
        });

        this.mesh = this.model.getMesh();
        // Apply scale to placeholder too
        if (this.mesh) {
            this.mesh.scale.multiplyScalar(this.visualScale);
        }
        this.model.init();
    }
}
