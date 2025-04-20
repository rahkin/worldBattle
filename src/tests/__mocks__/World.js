const mockWorld = {
    entities: new Map(),
    systems: new Map(),
    createEntity: jest.fn().mockImplementation(() => {
        const entity = {
            id: Math.random().toString(36).substr(2, 9),
            components: new Map(),
            world: null,
            addComponent: jest.fn().mockImplementation(function(component) {
                this.components.set(component.constructor.name, component);
                component.entity = this;
                component.world = this.world;  // Set the world reference on the component
                if (component.init) {
                    component.init(this);
                }
            }),
            getComponent: jest.fn().mockImplementation(function(componentType) {
                return this.components.get(componentType.name);
            }),
            hasComponent: jest.fn().mockImplementation(function(componentType) {
                return this.components.has(componentType.name);
            }),
            removeComponent: jest.fn().mockImplementation(function(componentType) {
                const component = this.components.get(componentType.name);
                if (component && component.cleanup) {
                    component.cleanup();
                }
                this.components.delete(componentType.name);
            })
        };
        entity.world = mockWorld;
        mockWorld.entities.set(entity.id, entity);
        return entity;
    }),
    addSystem: jest.fn().mockImplementation(function(system) {
        this.systems.set(system.constructor.name, system);
        system.world = this;  // Set the world reference on the system
        if (system.init) {
            system.init(this);
        }
    }),
    removeSystem: jest.fn().mockImplementation(function(systemName) {
        const system = this.systems.get(systemName);
        if (system && system.cleanup) {
            system.cleanup();
        }
        system.world = null;  // Clear the world reference
        this.systems.delete(systemName);
    }),
    getSystem: jest.fn().mockImplementation(function(systemName) {
        return this.systems.get(systemName);
    }),
    update: jest.fn(),
    cleanup: jest.fn().mockImplementation(function() {
        this.entities.forEach(entity => {
            entity.components.forEach(component => {
                if (component.cleanup) {
                    component.cleanup();
                }
                component.world = null;  // Clear world reference during cleanup
            });
        });
        this.systems.forEach(system => {
            if (system.cleanup) {
                system.cleanup();
            }
            system.world = null;  // Clear world reference during cleanup
        });
        this.entities.clear();
        this.systems.clear();
    })
};

module.exports = {
    World: jest.fn().mockImplementation(() => mockWorld)
}; 