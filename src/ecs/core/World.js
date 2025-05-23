import { Entity } from './Entity.js';
import { System } from './System.js';
import { EventBus } from '../../core/EventBus.js';

export class World {
    constructor() {
        this.entities = new Map();
        this.systems = new Map();
        this.nextEntityId = 1;
        this.entitiesToRemove = new Set();
    }

    async init() {
        console.log('Initializing World...');
        return Promise.resolve();
    }

    createEntity() {
        const entity = new Entity(this.nextEntityId++);
        entity.world = this;
        this.entities.set(entity.id, entity);
        return entity;
    }

    addEntity(entity) {
        if (!entity.id) {
            entity.id = this.nextEntityId++;
        }
        entity.world = this;
        this.entities.set(entity.id, entity);
        return entity;
    }

    removeEntity(entity) {
        this.entitiesToRemove.add(entity.id);
    }

    getEntity(id) {
        return this.entities.get(id);
    }

    async addSystem(nameOrSystem, systemInstance = null) {
        let system;
        let systemName;

        if (systemInstance) {
            // Called with (name, system)
            system = systemInstance;
            systemName = nameOrSystem;
        } else {
            // Called with (system)
            system = nameOrSystem;
            systemName = system.constructor.name;
        }

        console.log(`Adding system: ${systemName}`);

        // Ensure system has a world property
        if (!('world' in system)) {
            Object.defineProperty(system, 'world', {
                value: this,
                writable: true,
                enumerable: true,
                configurable: true
            });
        } else {
            system.world = this;
        }

        this.systems.set(systemName, system);
        
        if (system.init) {
            try {
                await system.init();
            } catch (error) {
                console.error(`Error initializing system ${systemName}:`, error);
                this.systems.delete(systemName);
                throw error;
            }
        }
    }

    getSystem(systemName) {
        const system = this.systems.get(systemName);
        if (!system) {
            console.warn(`System not found: ${systemName}`);
        }
        return system;
    }

    async removeSystem(systemName) {
        const system = this.systems.get(systemName);
        if (system && system.cleanup) {
            try {
                await system.cleanup();
            } catch (error) {
                console.error(`Error cleaning up system ${systemName}:`, error);
            }
        }
        this.systems.delete(systemName);
    }

    getEntitiesWithComponents(componentTypes) {
        const entities = Array.from(this.entities.values()).filter(entity => {
            return componentTypes.every(type => entity.hasComponent(type));
        });
        return entities;
    }

    async update(deltaTime) {
        // Update all systems
        for (const [systemName, system] of this.systems.entries()) {
            if (system.enabled && system.update) {
                try {
                    await system.update(deltaTime);
                } catch (error) {
                    console.error(`Error updating system ${systemName}:`, error);
                }
            }
        }

        // Update all entities
        for (const entity of this.entities.values()) {
            if (entity.enabled) {
                entity.update(deltaTime);
            }
        }

        // Remove marked entities
        for (const entityId of this.entitiesToRemove) {
            const entity = this.entities.get(entityId);
            if (entity) {
                entity.cleanup();
                this.entities.delete(entityId);
            }
        }
        this.entitiesToRemove.clear();
    }

    async cleanup() {
        // Clean up all systems
        for (const [systemName, system] of this.systems.entries()) {
            if (system.cleanup) {
                try {
                    await system.cleanup();
                } catch (error) {
                    console.error(`Error cleaning up system ${systemName}:`, error);
                }
            }
        }
        this.systems.clear();

        // Clean up all entities
        for (const entity of this.entities.values()) {
            entity.cleanup();
        }
        this.entities.clear();
        this.entitiesToRemove.clear();
    }
} 