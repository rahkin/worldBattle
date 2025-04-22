export class Entity {
    constructor(id) {
        this.id = id;
        this.components = new Map();
        this.world = null;
        this.enabled = true;
    }

    addComponent(type, component) {
        // Handle both (type, component) and (component) signatures
        let componentInstance;
        let componentType;
        
        if (component) {
            // (type, component) signature
            componentInstance = component;
            componentType = type;
        } else {
            // (component) signature
            componentInstance = type;
            componentType = componentInstance.type || componentInstance.constructor.name;
        }

        console.log(`Adding component of type: ${componentType} to entity ${this.id}`);
        
        // Store the component
        this.components.set(componentType, componentInstance);
        
        // Call setEntity if it exists
        if (typeof componentInstance.setEntity === 'function') {
            componentInstance.setEntity(this);
        }
        
        return componentInstance;
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