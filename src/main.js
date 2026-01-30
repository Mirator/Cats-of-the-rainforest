import { Game } from './core/Game.js';

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('game-container');
    if (!container) {
        console.error('Game initialization failed: #game-container element not found.');
        return;
    }
    const game = new Game(container);
    game.start();
});
