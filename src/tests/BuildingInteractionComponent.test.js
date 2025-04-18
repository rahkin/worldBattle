import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { BuildingInteractionComponent } from '../ecs/components/BuildingInteractionComponent.js';
import * as THREE from 'three';

describe('BuildingInteractionComponent', () => {
    let component;

    beforeEach(() => {
        component = new BuildingInteractionComponent();
    });

    describe('initialization', () => {
        test('should initialize with default values', () => {
            expect(component.interactionPoints.size).toBe(0);
            expect(component.events.size).toBe(0);
            expect(component.cooldowns.size).toBe(0);
            expect(component.isHighlighted).toBe(false);
            expect(component.isSelected).toBe(false);
            expect(component.interactionDelay).toBe(0.5);
        });

        test('should initialize with provided values', () => {
            const mockEntity = {};
            const properties = {
                interactionDelay: 0.1,
                isHighlighted: true,
                isSelected: true
            };
            component.init(mockEntity, properties);
            expect(component.interactionDelay).toBe(0.1);
            expect(component.isHighlighted).toBe(true);
            expect(component.isSelected).toBe(true);
        });
    });

    describe('interaction points', () => {
        test('should add interaction point', () => {
            const position = new THREE.Vector3(1, 2, 3);
            component.addInteractionPoint('test', position);
            expect(component.interactionPoints.has('test')).toBe(true);
            expect(component.interactionPoints.get('test')).toEqual(position);
        });

        test('should remove interaction point', () => {
            const position = new THREE.Vector3(1, 2, 3);
            component.addInteractionPoint('test', position);
            component.removeInteractionPoint('test');
            expect(component.interactionPoints.has('test')).toBe(false);
        });

        test('should get nearest interaction point', () => {
            const position1 = new THREE.Vector3(0, 0, 0);
            const position2 = new THREE.Vector3(1, 1, 1);
            const queryPosition = new THREE.Vector3(0.1, 0.1, 0.1);

            component.addInteractionPoint('point1', position1);
            component.addInteractionPoint('point2', position2);

            expect(component.getNearestInteractionPoint(queryPosition)).toBe('point1');
        });
    });

    describe('event handling', () => {
        test('should add and remove event', () => {
            const handler = jest.fn();
            component.addEvent('test', handler);
            expect(component.events.get('test')).toEqual(new Set([handler]));
            component.removeEvent('test', handler);
            expect(component.events.has('test')).toBe(false);
        });

        test('should trigger event', () => {
            const handler = jest.fn();
            component.addEvent('test', handler);
            component.triggerEvent('test', { data: 'test' });
            expect(handler).toHaveBeenCalledWith({ data: 'test' });
        });

        test('should handle cooldowns', () => {
            const handler = jest.fn();
            component.addEvent('test', handler);
            component.setCooldown('test', 1000);
            component.triggerEvent('test', {});
            component.triggerEvent('test', {});
            expect(handler).toHaveBeenCalledTimes(2);
        });
    });

    describe('user interactions', () => {
        test('should handle click', () => {
            const position = new THREE.Vector3(1, 2, 3);
            const handler = jest.fn();
            component.addInteractionPoint('test', position);
            component.addEvent('click', handler);
            component.triggerEvent('click', { position });
            expect(handler).toHaveBeenCalledWith({ position });
        });

        test('should handle hover', () => {
            const position = new THREE.Vector3(1, 2, 3);
            const handler = jest.fn();
            component.addInteractionPoint('test', position);
            component.addEvent('hover', handler);
            component.triggerEvent('hover', { position });
            expect(handler).toHaveBeenCalledWith({ position });
        });

        test('should handle drag', () => {
            const position = new THREE.Vector3(1, 2, 3);
            const handler = jest.fn();
            component.addInteractionPoint('test', position);
            component.addEvent('drag', handler);
            component.triggerEvent('drag', { position });
            expect(handler).toHaveBeenCalledWith({ position });
        });
    });

    describe('update', () => {
        test('should remove expired cooldowns', () => {
            const handler = jest.fn();
            component.addEvent('test', handler);
            component.setCooldown('test', 100);
            component.update(0.2);
            component.triggerEvent('test', {});
            expect(handler).toHaveBeenCalledTimes(1);
        });
    });

    describe('cleanup', () => {
        test('should dispose of resources', () => {
            const position = new THREE.Vector3(1, 2, 3);
            const handler = jest.fn();
            component.addInteractionPoint('test', position);
            component.addEvent('test', handler);
            component.cleanup();
            expect(component.interactionPoints.size).toBe(0);
            expect(component.events.size).toBe(0);
            expect(component.cooldowns.size).toBe(0);
            expect(component.isHighlighted).toBe(false);
            expect(component.isSelected).toBe(false);
        });
    });
}); 