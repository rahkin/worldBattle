import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { World } from '../ecs/core/World.js';

describe('World', () => {
    let world;
    let mockSystem;
    let mockEntity;

    beforeEach(() => {
        world = new World();
        mockSystem = {
            constructor: { name: 'MockSystem' },
            init: jest.fn(),
            update: jest.fn(),
            cleanup: jest.fn()
        };
        mockEntity = {
            id: 1,
            components: new Map(),
            hasComponent: jest.fn(),
            cleanup: jest.fn()
        };
    });

    describe('initialization', () => {
        test('should initialize with empty maps', () => {
            expect(world.entities.size).toBe(0);
            expect(world.systems.size).toBe(0);
            expect(world.nextEntityId).toBe(1);
        });
    });

    describe('entity management', () => {
        test('should create entity with incremented ID', () => {
            const entity1 = world.createEntity();
            const entity2 = world.createEntity();
            expect(entity2.id).toBe(entity1.id + 1);
        });

        test('should get entity by ID', () => {
            world.entities.set(1, mockEntity);
            expect(world.getEntity(1)).toBe(mockEntity);
        });

        test('should mark entity for removal', () => {
            world.entities.set(1, mockEntity);
            world.removeEntity(mockEntity);
            expect(world.entitiesToRemove.has(mockEntity.id)).toBe(true);
        });
    });

    describe('system management', () => {
        test('should add system and initialize it', async () => {
            await world.addSystem(mockSystem);
            expect(world.systems.get('MockSystem')).toBe(mockSystem);
            expect(mockSystem.init).toHaveBeenCalled();
            expect(mockSystem.world).toBe(world);
        });

        test('should get system by name', async () => {
            await world.addSystem(mockSystem);
            expect(world.getSystem('MockSystem')).toBe(mockSystem);
        });

        test('should remove system and clean it up', async () => {
            await world.addSystem(mockSystem);
            world.removeSystem('MockSystem');
            expect(mockSystem.cleanup).toHaveBeenCalled();
            expect(world.systems.has('MockSystem')).toBe(false);
        });
    });

    describe('querying', () => {
        test('should get entities with components', () => {
            const mockComponentType = 'TestComponent';
            mockEntity.hasComponent.mockReturnValue(true);
            world.entities.set(1, mockEntity);
            
            const entities = world.getEntitiesWithComponents([mockComponentType]);
            expect(entities).toContain(mockEntity);
            expect(mockEntity.hasComponent).toHaveBeenCalledWith(mockComponentType);
        });
    });

    describe('updates', () => {
        test('should update all systems', async () => {
            await world.addSystem(mockSystem);
            world.update(1/60);
            expect(mockSystem.update).toHaveBeenCalledWith(1/60);
        });

        test('should remove marked entities during update', () => {
            world.entities.set(1, mockEntity);
            world.removeEntity(mockEntity);
            world.update(1/60);
            expect(world.entities.has(1)).toBe(false);
            expect(world.entitiesToRemove.size).toBe(0);
        });
    });

    describe('cleanup', () => {
        test('should clean up all systems and entities', async () => {
            await world.addSystem(mockSystem);
            world.entities.set(1, mockEntity);
            
            world.cleanup();
            
            expect(mockSystem.cleanup).toHaveBeenCalled();
            expect(world.systems.size).toBe(0);
            expect(world.entities.size).toBe(0);
            expect(world.entitiesToRemove.size).toBe(0);
        });
    });
}); 