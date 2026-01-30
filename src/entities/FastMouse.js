import { Mouse } from './Mouse.js';

export class FastMouse extends Mouse {
    constructor(x, z, hpMultiplier = 1.0) {
        super(x, z, hpMultiplier);
        this.speed = 6.5; // Faster than regular mouse (4.5)
    }
}
