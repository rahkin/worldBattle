import { Entity } from './Entity.js';

export class World {
    constructor() {
        this.entities = new Map();
        this.systems = new Map();
        this.nextEntityId = 1;
        this.entitiesToRemove = new Set();
    }

    createEntity() {
        const entity = new Entity(this.nextEntityId++, this);
        this.entities.set(entity.id, entity);
        return entity;
    }

    addEntity(entity) {
        if (!entity.id) {
            entity.id = this.nextEntityId++;
        }
        this.entities.set(entity.id, entity);
        return entity;
    }

    removeEntity(entity) {
        this.entitiesToRemove.add(entity.id);
    }

    getEntity(id) {
        return this.entities.get(id);
    }

    async addSystem(system) {
        // Get the system's class name
        const systemName = system.constructor.name;
        console.log(`Adding system: ${systemName}`);

        // Store the system with its name as the key
        this.systems.set(systemName, system);
        
        // Set the world reference
        system.world = this;
        
        // Initialize the system if it has an init method
        if (system.init) {
            await system.init();
        }
    }

    getSystem(systemName) {
        const system = this.systems.get(systemName);
        if (!system) {
            console.warn(`System not found: ${systemName}`);
        }
        return system;
    }

    removeSystem(systemName) {
        const system = this.systems.get(systemName);
        if (system && system.cleanup) {
            system.cleanup();
        }
        this.systems.delete(systemName);
    }

    getEntitiesWithComponents(componentTypes) {
        return Array.from(this.entities.values()).filter(entity => {
            return componentTypes.every(type => entity.hasComponent(type));
        });
    }

    update(deltaTime) {
        // Update all systems
        for (const system of this.systems.values()) {
            if (system.update) {
                system.update(deltaTime);
            }
        }

        // Remove marked entities
        for (const entityId of this.entitiesToRemove) {
            const entity = this.entities.get(entityId);
            if (entity) {
                // Call cleanup on all components
                for (const component of entity.components.values()) {
                    if (component.cleanup) {
                        component.cleanup();
                    }
                }
                this.entities.delete(entityId);
            }
        }
        this.entitiesToRemove.clear();
    }

    cleanup() {
        // Clean up all systems
        for (const system of this.systems.values()) {
            if (system.cleanup) {
                system.cleanup();
            }
        }
        this.systems.clear();

        // Clean up all entities
        for (const entity of this.entities.values()) {
            for (const component of entity.components.values()) {
                if (component.cleanup) {
                    component.cleanup();
                }
            }
        }
        this.entities.clear();
        this.entitiesToRemove.clear();
    }
} 