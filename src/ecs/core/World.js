import { Entity } from './Entity.js';

export class World {
    constructor() {
        this.entities = new Map();
        this.systems = new Map();
        this.entityCount = 0;
    }

    createEntity() {
        const id = `entity_${this.entityCount++}`;
        const entity = new Entity(id);
        this.entities.set(id, entity);
        return entity;
    }

    removeEntity(entity) {
        this.entities.delete(entity.id);
    }

    addSystem(system) {
        this.systems.set(system.constructor.name, system);
        system.world = this;
        return this;
    }

    removeSystem(systemType) {
        const system = this.systems.get(systemType.name);
        if (system) {
            system.world = null;
            this.systems.delete(systemType.name);
        }
    }

    getSystem(systemType) {
        return this.systems.get(systemType.name);
    }

    update(deltaTime) {
        for (const system of this.systems.values()) {
            if (system.enabled) {
                system.update(deltaTime);
            }
        }
    }

    getEntitiesWithComponents(componentTypes) {
        const entities = [];
        for (const entity of this.entities.values()) {
            if (entity.hasComponents(componentTypes)) {
                entities.push(entity);
            }
        }
        return entities;
    }
} 