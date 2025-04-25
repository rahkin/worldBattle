export class EntityManager {
    constructor() {
        this.entities = new Map();
        this.components = new Map();
        this.nextEntityId = 1;
    }

    createEntity() {
        const entityId = this.nextEntityId++;
        this.entities.set(entityId, new Map());
        return entityId;
    }

    addComponent(entityId, componentType, component) {
        if (!this.entities.has(entityId)) {
            throw new Error(`Entity ${entityId} does not exist`);
        }

        const entityComponents = this.entities.get(entityId);
        entityComponents.set(componentType, component);

        // Track components by type for quick lookup
        if (!this.components.has(componentType)) {
            this.components.set(componentType, new Set());
        }
        this.components.get(componentType).add(entityId);
    }

    removeComponent(entityId, componentType) {
        if (!this.entities.has(entityId)) {
            return;
        }

        const entityComponents = this.entities.get(entityId);
        entityComponents.delete(componentType);

        // Remove from component type tracking
        const componentSet = this.components.get(componentType);
        if (componentSet) {
            componentSet.delete(entityId);
        }
    }

    getComponent(entityId, componentType) {
        if (!this.entities.has(entityId)) {
            return null;
        }

        const entityComponents = this.entities.get(entityId);
        return entityComponents.get(componentType) || null;
    }

    getEntitiesByComponent(componentType) {
        return Array.from(this.components.get(componentType) || []);
    }

    removeEntity(entityId) {
        if (!this.entities.has(entityId)) {
            return;
        }

        // Remove from component type tracking
        const entityComponents = this.entities.get(entityId);
        for (const [componentType] of entityComponents) {
            this.removeComponent(entityId, componentType);
        }

        // Remove entity
        this.entities.delete(entityId);
    }

    clear() {
        this.entities.clear();
        this.components.clear();
        this.nextEntityId = 1;
    }
} 