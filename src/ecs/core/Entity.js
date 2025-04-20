export class Entity {
    constructor(id) {
        this.id = id;
        this.components = new Map();
        this.world = null;
        this.enabled = true;
    }

    addComponent(component) {
        const componentName = component.constructor.name;
        this.components.set(componentName, component);
        component.setEntity(this);
        return component;
    }

    removeComponent(componentType) {
        const component = this.components.get(componentType);
        if (component) {
            if (component.cleanup) {
                component.cleanup();
            }
            this.components.delete(componentType);
        }
    }

    getComponent(componentType) {
        return this.components.get(componentType);
    }

    hasComponent(componentType) {
        return this.components.has(componentType);
    }

    update(deltaTime) {
        if (!this.enabled) return;
        
        for (const component of this.components.values()) {
            if (component.enabled && component.update) {
                component.update(deltaTime);
            }
        }
    }

    cleanup() {
        for (const component of this.components.values()) {
            if (component.cleanup) {
                component.cleanup();
            }
        }
        this.components.clear();
        this.world = null;
    }
} 