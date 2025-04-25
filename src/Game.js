import LoadingIndicator from './ui/LoadingIndicator.js';

export default class Game {
    constructor(entityManager, systemManager) {
        this.entityManager = entityManager;
        this.systemManager = systemManager;
        this.running = false;
        this.lastTime = 0;
        
        // Get required systems
        this.worldDataSystem = this.systemManager.getSystem('WorldDataSystem');
        this.geometrySystem = this.systemManager.getSystem('GeometrySystem');
        this.renderSystem = this.systemManager.getSystem('RenderSystem');
        this.inputSystem = this.systemManager.getSystem('InputSystem');
        this.physicsSystem = this.systemManager.getSystem('PhysicsSystem');
    }

    async init() {
        const loadingIndicator = new LoadingIndicator();
        try {
            loadingIndicator.show();
            loadingIndicator.updateProgress(0, 'Initializing...', 'Starting game systems');
            
            // Initialize world data system first to load terrain data
            console.log('Initializing world data system...');
            if (!await this.worldDataSystem.initialize()) {
                throw new Error('Failed to initialize world data system');
            }
            loadingIndicator.updateProgress(40, 'Initializing...', 'World data loaded');

            // Initialize geometry system to generate terrain mesh
            console.log('Initializing geometry system...');
            if (!await this.geometrySystem.initialize()) {
                throw new Error('Failed to initialize geometry system');
            }
            loadingIndicator.updateProgress(60, 'Initializing...', 'Terrain geometry generated');
            
            // Initialize remaining systems
            console.log('Initializing remaining systems...');
            if (!await this.renderSystem.initialize()) {
                throw new Error('Failed to initialize render system');
            }
            loadingIndicator.updateProgress(80, 'Initializing...', 'Renderer ready');

            if (!await this.inputSystem.initialize()) {
                throw new Error('Failed to initialize input system');
            }
            loadingIndicator.updateProgress(90, 'Initializing...', 'Input system ready');

            if (!await this.physicsSystem.initialize()) {
                throw new Error('Failed to initialize physics system');
            }
            loadingIndicator.updateProgress(95, 'Initializing...', 'Physics system ready');
            
            // Start the game loop
            this.lastTime = performance.now();
            this.running = true;
            this.update();
            
            // Show ready message briefly before hiding
            loadingIndicator.updateProgress(100, 'Ready', 'Terrain initialized');
            setTimeout(() => {
                loadingIndicator.hide();
            }, 1000);
            
            console.log('Game initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize game:', error);
            loadingIndicator.updateProgress(100, 'Error', error.message || 'Failed to initialize game');
            setTimeout(() => loadingIndicator.hide(), 3000);
            return false;
        }
    }

    update() {
        if (!this.running) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update all systems
        this.worldDataSystem.update(deltaTime);
        this.geometrySystem.update(deltaTime);
        this.renderSystem.update(deltaTime);
        this.inputSystem.update(deltaTime);
        this.physicsSystem.update(deltaTime);

        // Schedule next frame
        requestAnimationFrame(() => this.update());
    }

    cleanup() {
        this.running = false;
        this.worldDataSystem.cleanup();
        this.geometrySystem.cleanup();
        this.renderSystem.cleanup();
        this.inputSystem.cleanup();
        this.physicsSystem.cleanup();
    }
} 