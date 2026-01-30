import { Game } from './core/Game.js';

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('game-container');
    const game = new Game(container);
    game.start();
});
