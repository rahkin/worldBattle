export class Entity {
    constructor(id) {
        this.id = id;
        this.components = new Map();
        this.active = true;
        this.world = null;
    }

    addComponent(component) {
        const componentName = component.constructor.name;
        this.components.set(componentName, component);
        component.init(this);
        return component;
    }

    getComponent(componentName) {
        return this.components.get(componentName);
    }

    hasComponent(componentName) {
        return this.components.has(componentName);
    }

    removeComponent(componentName) {
        const component = this.components.get(componentName);
        if (component) {
            if (component.dispose) {
                component.dispose();
            }
            this.components.delete(componentName);
        }
    }

    update(deltaTime) {
        if (!this.active) return;

        this.components.forEach(component => {
            if (component.update) {
                component.update(deltaTime);
            }
        });
    }

    cleanup() {
        this.components.forEach(component => {
            if (component.dispose) {
                component.dispose();
            }
        });
        this.components.clear();
        this.active = false;
    }

    addToWorld(world) {
        if (!world) {
            throw new Error('Cannot add entity to null world');
        }
        this.world = world;
        world.addEntity(this);
        return this;
    }
} 