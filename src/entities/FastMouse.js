import { Mouse } from './Mouse.js';
import { ENEMY_CONFIG } from '../config/enemies.js';

export class FastMouse extends Mouse {
    constructor(x, z, hpMultiplier = 1.0) {
        super(x, z, hpMultiplier);
        this.speed = ENEMY_CONFIG.fastMouse.speed;
    }
}
