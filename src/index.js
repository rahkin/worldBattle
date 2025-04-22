import { Game } from './ecs/core/Game.js';

let game = null;

async function init() {
    try {
        // Cleanup existing game if it exists
        if (game) {
            await game.cleanup();
            game = null;
        }

        // Create and initialize new game
        game = new Game();
        await game.init();
        
        console.log('Game initialized successfully');
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to initialize game:', error);
        
        // Show error on loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            const loadingText = loadingScreen.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = 'Failed to load game. Please refresh the page.';
            }
        }

        // Cleanup on error
        if (game) {
            try {
                await game.cleanup();
            } catch (cleanupError) {
                console.error('Failed to cleanup after initialization error:', cleanupError);
            }
            game = null;
        }
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    init().catch(error => {
        console.error('Unhandled initialization error:', error);
    });
});

// Add refresh handler
window.addEventListener('keydown', (event) => {
    if (event.key === 'F5' || (event.key === 'r' && event.ctrlKey)) {
        event.preventDefault();
        init().catch(error => {
            console.error('Unhandled refresh error:', error);
        });
    }
});

// Add error handler for unhandled errors
window.addEventListener('error', async (event) => {
    console.error('Unhandled error:', event.error);
    if (game) {
        try {
            await game.cleanup();
        } catch (cleanupError) {
            console.error('Failed to cleanup after unhandled error:', cleanupError);
        }
        game = null;
    }
}); 