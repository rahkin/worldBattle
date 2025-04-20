export class Component {
    constructor() {
        this.entity = null;
        this.enabled = true;
    }

    init(properties) {
        if (properties) {
            Object.assign(this, properties);
        }
    }

    update(deltaTime) {
        // Override in subclasses
    }

    cleanup() {
        // Override in subclasses
    }

    setEntity(entity) {
        this.entity = entity;
    }

    getEntity() {
        return this.entity;
    }

    getWorld() {
        return this.entity ? this.entity.world : null;
    }

    getSystem(systemName) {
        return this.getWorld()?.getSystem(systemName);
    }
} 