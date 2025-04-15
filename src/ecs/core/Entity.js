export class Entity {
    constructor(id) {
        this.id = id;
        this.components = new Map();
    }

    addComponent(component) {
        this.components.set(component.constructor.name, component);
        return this;
    }

    removeComponent(componentType) {
        this.components.delete(componentType.name);
    }

    getComponent(componentType) {
        return this.components.get(componentType.name);
    }

    hasComponents(componentTypes) {
        return componentTypes.every(type => this.components.has(type.name));
    }
} 