export class System {
    constructor() {
        this.world = null;
        this.enabled = true;
        this.requiredComponents = [];
    }

    getEntities() {
        if (!this.world) return [];
        return this.world.getEntitiesWithComponents(this.requiredComponents);
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
} 