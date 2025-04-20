export class System {
    constructor() {
        this.world = null;
        this.enabled = true;
    }

    init() {
        // Override in subclasses
    }

    update(deltaTime) {
        // Override in subclasses
    }

    cleanup() {
        // Override in subclasses
    }

    getEntitiesWithComponents(componentTypes) {
        return this.world.getEntitiesWithComponents(componentTypes);
    }

    getSystem(systemName) {
        return this.world.getSystem(systemName);
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    // Optional cleanup method for systems that need it
    async cleanup() {
        try {
            // Override in derived classes if needed
            return true;
        } catch (error) {
            console.error(`Error in ${this.constructor.name} cleanup:`, error);
            return false;
        }
    }
} 