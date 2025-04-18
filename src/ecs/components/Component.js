export class Component {
    constructor() {
        this.entity = null;
        this.enabled = true;
        this.type = 'Component';
    }

    init(entity) {
        if (!entity) {
            this.entity = null;
            return this;
        }
        this.entity = entity;
        return this;
    }

    update(deltaTime) {
        // Base update method - override in subclasses
    }

    cleanup() {
        this.entity = null;
        this.enabled = true;
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    getEntity() {
        return this.entity;
    }
}

export default Component;