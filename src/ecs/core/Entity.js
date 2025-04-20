export class Entity {
    constructor(id) {
        this.id = id;
        this.components = new Map();
        this.world = null;
        this.enabled = true;
    }

    addComponent(component) {
        const componentType = component.type || component.constructor.name;
        console.log(`Adding component of type: ${componentType} to entity ${this.id}`);
        this.components.set(componentType, component);
        component.setEntity(this);
        return component;
    }

    removeComponent(componentType) {
        const type = typeof componentType === 'string' ? 
            componentType : 
            (componentType.type || componentType.name);
            
        const component = this.components.get(type);
        if (component) {
            if (component.cleanup) {
                component.cleanup();
            }
            this.components.delete(type);
        }
    }

    getComponent(componentType) {
        const type = typeof componentType === 'string' ? 
            componentType : 
            (componentType.type || componentType.name);
        
        const component = this.components.get(type);
        if (!component) {
            console.warn(`Component ${type} not found on entity ${this.id}`);
        }
        return component;
    }

    hasComponent(componentType) {
        const type = typeof componentType === 'string' ? 
            componentType : 
            (componentType.type || componentType.name);
        return this.components.has(type);
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