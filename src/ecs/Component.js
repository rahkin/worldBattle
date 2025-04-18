export class Component {
    constructor() {
        this.entity = null;
        this.type = this.constructor.name;
    }

    init(entity, properties = {}) {
        if (!entity) {
            this.entity = null;
            return this;
        }
        this.entity = entity;
        Object.assign(this, properties);
        return this;
    }

    update(deltaTime) {
        // Override this method in derived components for per-frame updates
    }

    dispose() {
        this.entity = null;
        // Override this method in derived components to clean up resources
    }

    cleanup() {
        this.dispose();
    }
} 