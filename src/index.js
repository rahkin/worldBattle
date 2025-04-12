import { Game } from './core/Game.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const game = new Game();
        await game.init();
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            const loadingText = loadingScreen.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = 'Failed to load game. Please refresh the page.';
            }
        }
    }
}); 