import { Game } from './ecs/core/Game';
import { LoadingIndicator } from './ui/LoadingIndicator';
import { VehicleSelector } from './ui/VehicleSelector';

async function init() {
    // Create a single loading indicator instance
    const loadingIndicator = new LoadingIndicator();
    
    // Initialize game with the loading indicator
    const game = new Game({
        loadingIndicator: loadingIndicator
    });

    // Initialize game
    const initialized = await game.init();
    if (!initialized) {
        console.error('Failed to initialize game');
        return;
    }

    // Hide loading indicator after initialization
    await loadingIndicator.hide();

    // Initialize vehicle selector with the same loading indicator
    const vehicleSelector = new VehicleSelector(game, loadingIndicator);
    vehicleSelector.show();
}

// Start initialization when the page loads
window.addEventListener('load', init);

// Add refresh handler
window.addEventListener('keydown', (event) => {
    if (event.key === 'F5' || (event.key === 'r' && event.ctrlKey)) {
        event.preventDefault();
        init().catch(error => {
            console.error('Unhandled refresh error:', error);
            if (loadingIndicator) {
                loadingIndicator.updateProgress(100, 'Error', `Refresh error: ${error.message}`);
            }
        });
    }
});

// Add error handler for unhandled errors
window.addEventListener('error', async (event) => {
    console.error('Unhandled error:', event.error);
    if (loadingIndicator) {
        loadingIndicator.updateProgress(100, 'Error', `Unhandled error: ${event.error.message}`);
    }
    if (game) {
        try {
            await game.cleanup();
        } catch (cleanupError) {
            console.error('Failed to cleanup after unhandled error:', cleanupError);
        }
        game = null;
    }
}); 