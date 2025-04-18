export class System {
    constructor() {
        this.world = null;
        this.entities = new Set();
        this.type = this.constructor.name;
        this.requiredComponents = [];
    }

    init(world) {
        this.world = world || null;
    }

    update(deltaTime) {
        // Override this method in derived systems for per-frame updates
    }

    addEntity(entity) {
        if (entity && !this.entities.has(entity)) {
            this.entities.add(entity);
        }
    }

    removeEntity(entity) {
        if (entity) {
            this.entities.delete(entity);
        }
    }

    cleanup() {
        this.entities.clear();
        this.world = null;
    }

    getEntities() {
        return this.world ? this.world.getEntitiesWithComponents(this.requiredComponents) : [];
    }
} 