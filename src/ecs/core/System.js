export class System {
    constructor() {
        this.world = null;
        this.enabled = true;
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