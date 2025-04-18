export class System {
    constructor(world) {
        this.world = world;
        this.type = 'System';
        this.enabled = true;
    }

    init() {
        // Override in derived classes if needed
    }

    update(deltaTime) {
        // Override in derived classes
    }

    cleanup() {
        // Override in derived classes if needed
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

    getWorld() {
        return this.world;
    }
} 