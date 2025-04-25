export class SystemManager {
    constructor() {
        this.systems = new Set();
        this.world = null;
    }

    setWorld(world) {
        this.world = world;
    }

    async addSystem(system) {
        this.systems.add(system);
        
        // Set the world reference if available
        if (this.world && !system.world) {
            system.world = this.world;
        }
        
        // Initialize the system if it has an init method
        if (system.init) {
            try {
                await system.init(this.world);
                console.log(`System ${system.constructor.name} initialized successfully`);
            } catch (error) {
                console.error(`Error initializing system ${system.constructor.name}:`, error);
                this.systems.delete(system);
                throw error;
            }
        }
    }

    getSystem(systemName) {
        for (const system of this.systems) {
            if (system.constructor.name === systemName) {
                return system;
            }
        }
        console.warn(`System not found: ${systemName}`);
        return null;
    }

    removeSystem(system) {
        this.systems.delete(system);
    }

    update(deltaTime) {
        for (const system of this.systems) {
            if (typeof system.update === 'function') {
                system.update(deltaTime);
            }
        }
    }

    dispose() {
        for (const system of this.systems) {
            if (typeof system.cleanup === 'function') {
                system.cleanup();
            }
        }
        this.systems.clear();
    }
} 