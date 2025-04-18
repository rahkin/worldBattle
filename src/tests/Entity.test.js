import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { Entity } from '../ecs/Entity.js';
import { Component } from '../ecs/Component.js';

describe('Entity', () => {
    let entity;
    let mockComponent;

    beforeEach(() => {
        entity = new Entity(1);
        mockComponent = {
            init: jest.fn(),
            update: jest.fn(),
            dispose: jest.fn(),
            constructor: { name: 'TestComponent' }
        };
    });

    test('should initialize with provided id', () => {
        expect(entity.id).toBe(1);
        expect(entity.active).toBe(true);
        expect(entity.components.size).toBe(0);
    });

    describe('component management', () => {
        test('should add component', () => {
            entity.addComponent(mockComponent);
            expect(entity.components.get('TestComponent')).toBe(mockComponent);
            expect(mockComponent.init).toHaveBeenCalled();
        });

        test('should get component', () => {
            entity.addComponent(mockComponent);
            expect(entity.getComponent('TestComponent')).toBe(mockComponent);
        });

        test('should check if has component', () => {
            expect(entity.hasComponent('TestComponent')).toBe(false);
            entity.addComponent(mockComponent);
            expect(entity.hasComponent('TestComponent')).toBe(true);
        });

        test('should remove component', () => {
            entity.addComponent(mockComponent);
            entity.removeComponent('TestComponent');
            expect(entity.hasComponent('TestComponent')).toBe(false);
            expect(mockComponent.dispose).toHaveBeenCalled();
        });
    });

    describe('state management', () => {
        test('should update components when active', () => {
            entity.addComponent(mockComponent);
            entity.update();
            expect(mockComponent.update).toHaveBeenCalled();
        });

        test('should not update components when inactive', () => {
            entity.addComponent(mockComponent);
            entity.active = false;
            entity.update();
            expect(mockComponent.update).not.toHaveBeenCalled();
        });
    });

    describe('cleanup', () => {
        test('should dispose all components and reset state', () => {
            entity.addComponent(mockComponent);
            entity.cleanup();
            expect(mockComponent.dispose).toHaveBeenCalled();
            expect(entity.components.size).toBe(0);
            expect(entity.active).toBe(false);
        });
    });
}); 