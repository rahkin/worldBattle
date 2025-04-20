export class Component {
    constructor() {
        this.entity = null;
        this.enabled = true;
        this.type = this.constructor.name;
    }

    setEntity(entity) {
        this.entity = entity;
    }

    getEntity() {
        return this.entity;
    }

    update(deltaTime) {
        // Override in derived classes
    }

    cleanup() {
        // Override in derived classes
        this.entity = null;
    }
} 