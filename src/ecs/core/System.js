export class System {
    constructor(world = null) {
        Object.defineProperty(this, 'world', {
            value: world,
            writable: true,
            enumerable: true,
            configurable: true
        });
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
        if (!this.world) {
            console.warn(`${this.constructor.name}: No world reference available`);
            return [];
        }
        return this.world.getEntitiesWithComponents(componentTypes);
    }

    getSystem(systemName) {
        if (!this.world) {
            console.warn(`${this.constructor.name}: No world reference available`);
            return null;
        }
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