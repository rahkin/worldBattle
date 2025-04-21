export class System {
    constructor(world) {
        this.world = world || null;
        this.enabled = true;
    }

    init(world) {
        // If world wasn't set in constructor, set it now
        if (!this.world && world) {
            this.world = world;
            console.log(`${this.constructor.name} world reference set during init`);
        }
        return Promise.resolve();
    }

    update(deltaTime) {
        // Override in derived classes
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    isEnabled() {
        return this.enabled;
    }

    getSystem(systemName) {
        if (!this.world) {
            console.warn(`${this.constructor.name}: Cannot get system '${systemName}' - no world reference`);
            return null;
        }
        return this.world.getSystem(systemName);
    }
} 