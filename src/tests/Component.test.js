import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { Component } from '../ecs/core/Component.js';

describe('Component', () => {
    let component;
    let mockEntity;

    beforeEach(() => {
        mockEntity = {
            id: 'test-entity',
            addComponent: jest.fn(),
            getComponent: jest.fn(),
            removeComponent: jest.fn(),
            hasComponent: jest.fn()
        };

        component = new Component();
    });

    describe('initialization', () => {
        test('should initialize with default values', () => {
            expect(component.entity).toBeNull();
            expect(component.type).toBe('Component');
        });

        test('should initialize with provided entity', () => {
            component.init(mockEntity);
            expect(component.entity).toBe(mockEntity);
        });

        test('should allow reinitialization with new entity', () => {
            component.init(mockEntity);
            const newEntity = { ...mockEntity, id: 'new-entity' };
            component.init(newEntity);
            expect(component.entity).toBe(newEntity);
        });
    });

    describe('lifecycle methods', () => {
        beforeEach(() => {
            component.init(mockEntity);
        });

        test('should call update method', () => {
            const deltaTime = 0.1;
            const spy = jest.spyOn(component, 'update');
            component.update(deltaTime);
            expect(spy).toHaveBeenCalledWith(deltaTime);
        });

        test('should cleanup properly', () => {
            component.cleanup();
            expect(component.entity).toBeNull();
        });
    });

    describe('entity interaction', () => {
        beforeEach(() => {
            component.init(mockEntity);
        });

        test('should get entity', () => {
            expect(component.entity).toBe(mockEntity);
        });

        test('should check if has entity', () => {
            expect(component.entity).toBeTruthy();
            component.entity = null;
            expect(component.entity).toBeFalsy();
        });
    });

    describe('type management', () => {
        test('should get component type', () => {
            expect(component.type).toBe('Component');
        });

        test('should set component type', () => {
            component.type = 'TestComponent';
            expect(component.type).toBe('TestComponent');
        });
    });

    describe('error handling', () => {
        test('should handle missing entity in init', () => {
            expect(() => component.init()).not.toThrow();
            expect(component.entity).toBeNull();
        });

        test('should handle invalid entity in init', () => {
            expect(() => component.init(null)).not.toThrow();
            expect(() => component.init(undefined)).not.toThrow();
            expect(component.entity).toBeNull();
        });
    });
}); 