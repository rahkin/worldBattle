export class World {
    constructor() {
        this.entities = new Map();
        this.systems = new Map();
        this.nextEntityId = 1;
    }

    createEntity() {
        const entity = new Entity(this.nextEntityId++);
        this.entities.set(entity.id, entity);
        return entity;
    }

    removeEntity(entity) {
        if (entity.mesh && entity.mesh.parent) {
            entity.mesh.parent.remove(entity.mesh);
        }
        this.entities.delete(entity.id);
    }

    getEntity(id) {
        return this.entities.get(id);
    }

    addSystem(name, system) {
        console.log(`Adding system ${name} to world:`, {
            hasSystem: !!system,
            systemType: system ? system.constructor.name : null,
            existingSystems: Array.from(this.systems.keys())
        });

        if (!system) {
            console.error(`Cannot add null system with name: ${name}`);
            return;
        }

        // Set world reference if not already set
        if (!system.world) {
            system.world = this;
            console.log(`Set world reference for system: ${name}`);
        }

        this.systems.set(name, system);
        console.log(`System ${name} added successfully`);
    }

    getSystem(name) {
        const system = this.systems.get(name);
        if (!system) {
            console.warn(`System not found: ${name}`, {
                availableSystems: Array.from(this.systems.keys())
            });
        }
        return system;
    }

    update(deltaTime) {
        for (const [name, system] of this.systems.entries()) {
            if (system.isEnabled()) {
                try {
                    system.update(deltaTime);
                } catch (error) {
                    console.error(`Error updating system ${name}:`, error);
                }
            }
        }
    }

    cleanup() {
        // Clean up all entities
        for (const entity of this.entities.values()) {
            this.removeEntity(entity);
        }
        this.entities.clear();
        
        // Clean up all systems
        for (const [name, system] of this.systems.entries()) {
            try {
                if (system.cleanup) {
                    system.cleanup();
                }
            } catch (error) {
                console.error(`Error cleaning up system ${name}:`, error);
            }
        }
        this.systems.clear();
        this.nextEntityId = 1;
    }

    getEntitiesWithComponents(componentNames) {
        const requestedComponents = Array.isArray(componentNames) ? componentNames : [componentNames];
        const matchingEntities = [];

        for (const entity of this.entities.values()) {
            if (requestedComponents.every(name => entity.hasComponent(name))) {
                matchingEntities.push(entity);
            }
        }

        return matchingEntities;
    }
}

export class Entity {
    constructor(id) {
        this.id = id;
        this.components = new Map();
        this.mesh = null;
    }

    addComponent(name, component) {
        this.components.set(name, component);
        return this;
    }

    removeComponent(name) {
        this.components.delete(name);
        return this;
    }

    getComponent(name) {
        return this.components.get(name);
    }

    hasComponent(name) {
        return this.components.has(name);
    }
} 