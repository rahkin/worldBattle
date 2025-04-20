import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { System } from '../ecs/core/System.js';

describe('System', () => {
    let system;
    let mockWorld;
    let mockEntity;

    beforeEach(() => {
        mockWorld = {
            getEntitiesWithComponents: jest.fn(),
            entities: new Set()
        };
        mockEntity = {
            id: 'test-entity',
            components: new Map(),
            hasComponent: jest.fn()
        };
        system = new System();
    });

    describe('initialization', () => {
        test('should initialize with default values', () => {
            expect(system.world).toBeNull();
            expect(system.entities.size).toBe(0);
            expect(system.type).toBe('System');
        });

        test('should initialize with provided world', () => {
            system.init(mockWorld);
            expect(system.world).toBe(mockWorld);
        });
    });

    describe('entity management', () => {
        beforeEach(() => {
            system.init(mockWorld);
        });

        test('should add entity', () => {
            system.addEntity(mockEntity);
            expect(system.entities.has(mockEntity)).toBe(true);
        });

        test('should remove entity', () => {
            system.addEntity(mockEntity);
            system.removeEntity(mockEntity);
            expect(system.entities.has(mockEntity)).toBe(false);
        });

        test('should handle removing non-existent entity', () => {
            expect(() => system.removeEntity(mockEntity)).not.toThrow();
        });
    });

    describe('lifecycle methods', () => {
        beforeEach(() => {
            system.init(mockWorld);
        });

        test('should call update method', () => {
            const deltaTime = 0.1;
            const spy = jest.spyOn(system, 'update');
            system.update(deltaTime);
            expect(spy).toHaveBeenCalledWith(deltaTime);
        });

        test('should cleanup properly', () => {
            system.addEntity(mockEntity);
            system.cleanup();
            expect(system.entities.size).toBe(0);
            expect(system.world).toBeNull();
        });
    });

    describe('error handling', () => {
        test('should handle missing world in init', () => {
            expect(() => system.init()).not.toThrow();
            expect(system.world).toBeNull();
        });

        test('should handle invalid world in init', () => {
            expect(() => system.init(null)).not.toThrow();
            expect(() => system.init(undefined)).not.toThrow();
            expect(system.world).toBeNull();
        });

        test('should handle invalid entity in add/remove', () => {
            expect(() => system.addEntity(null)).not.toThrow();
            expect(() => system.addEntity(undefined)).not.toThrow();
            expect(() => system.removeEntity(null)).not.toThrow();
            expect(() => system.removeEntity(undefined)).not.toThrow();
        });
    });
}); 