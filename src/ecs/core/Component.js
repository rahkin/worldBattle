export class Component {
    constructor() {
        this.entity = null;
        this.world = null;
    }

    init() {
        // Override this method in derived components for initialization
    }

    update(deltaTime) {
        // Override this method in derived components for per-frame updates
    }

    cleanup() {
        // Override this method in derived components to clean up resources
        this.entity = null;
        this.world = null;
    }
} 