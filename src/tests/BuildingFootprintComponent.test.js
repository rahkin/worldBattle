import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { BuildingFootprintComponent } from '../ecs/components/BuildingFootprintComponent.js';
import * as THREE from 'three';

describe('BuildingFootprintComponent', () => {
    let component;
    let mockEntity;

    beforeEach(() => {
        mockEntity = {
            id: 'test-entity',
            addComponent: jest.fn(),
            getComponent: jest.fn(),
            hasComponent: jest.fn(),
            removeComponent: jest.fn()
        };
        component = new BuildingFootprintComponent();
        component.init(mockEntity);
    });

    describe('initialization', () => {
        test('should initialize with default values', () => {
            expect(component.entity).toBe(mockEntity);
            expect(component.type).toBe('BuildingFootprintComponent');
            expect(component.walls).toEqual([]);
            expect(component.windows).toEqual([]);
            expect(component.doors).toEqual([]);
            expect(component.parts).toEqual([]);
            expect(component.height).toBe(0);
            expect(component.roofType).toBe('flat');
            expect(component.roofHeight).toBe(0);
            expect(component.roofAngle).toBe(0);
            expect(component.isComplex).toBe(false);
        });

        test('should initialize with provided values', () => {
            const properties = {
                height: 10,
                roofType: 'gabled',
                roofHeight: 5,
                roofAngle: 45,
                isComplex: true,
                walls: [{
                    start: new THREE.Vector2(0, 0),
                    end: new THREE.Vector2(10, 0)
                }],
                windows: [],
                doors: [],
                parts: []
            };
            component.init(mockEntity, properties);
            expect(component.height).toBe(10);
            expect(component.roofType).toBe('gabled');
            expect(component.roofHeight).toBe(5);
            expect(component.roofAngle).toBe(45);
            expect(component.isComplex).toBe(true);
            expect(component.walls).toEqual(properties.walls);
            expect(component.windows).toEqual(properties.windows);
            expect(component.doors).toEqual(properties.doors);
            expect(component.parts).toEqual(properties.parts);
        });
    });

    describe('geometry methods', () => {
        test('should calculate bounding box', () => {
            component.walls = [
                { start: new THREE.Vector2(0, 0), end: new THREE.Vector2(10, 0) },
                { start: new THREE.Vector2(10, 0), end: new THREE.Vector2(10, 10) },
                { start: new THREE.Vector2(10, 10), end: new THREE.Vector2(0, 10) },
                { start: new THREE.Vector2(0, 10), end: new THREE.Vector2(0, 0) }
            ];
            const bbox = component.getBoundingBox();
            expect(bbox).toBeInstanceOf(THREE.Box3);
            expect(bbox.min).toEqual(new THREE.Vector3(0, 0, 0));
            expect(bbox.max).toEqual(new THREE.Vector3(10, 10, 0));
        });

        test('should calculate center', () => {
            component.walls = [
                { start: new THREE.Vector2(0, 0), end: new THREE.Vector2(10, 0) },
                { start: new THREE.Vector2(10, 0), end: new THREE.Vector2(10, 10) },
                { start: new THREE.Vector2(10, 10), end: new THREE.Vector2(0, 10) },
                { start: new THREE.Vector2(0, 10), end: new THREE.Vector2(0, 0) }
            ];
            const center = component.getCenter();
            expect(center).toBeInstanceOf(THREE.Vector3);
            expect(center.x).toBe(5);
            expect(center.z).toBe(5);
        });

        test('should calculate area', () => {
            component.walls = [
                { start: new THREE.Vector2(0, 0), end: new THREE.Vector2(10, 0) },
                { start: new THREE.Vector2(10, 0), end: new THREE.Vector2(10, 10) },
                { start: new THREE.Vector2(10, 10), end: new THREE.Vector2(0, 10) },
                { start: new THREE.Vector2(0, 10), end: new THREE.Vector2(0, 0) }
            ];
            expect(component.getArea()).toBe(100);
        });

        test('should calculate perimeter', () => {
            component.walls = [
                { start: new THREE.Vector2(0, 0), end: new THREE.Vector2(10, 0) },
                { start: new THREE.Vector2(10, 0), end: new THREE.Vector2(10, 10) },
                { start: new THREE.Vector2(10, 10), end: new THREE.Vector2(0, 10) },
                { start: new THREE.Vector2(0, 10), end: new THREE.Vector2(0, 0) }
            ];
            expect(component.getPerimeter()).toBe(40);
        });
    });

    describe('building features', () => {
        test('should add wall', () => {
            const start = new THREE.Vector2(0, 0);
            const end = new THREE.Vector2(10, 0);
            component.addWall(start, end);
            expect(component.walls).toHaveLength(1);
            expect(component.walls[0].start).toEqual(start);
            expect(component.walls[0].end).toEqual(end);
        });

        test('should add window', () => {
            const position = new THREE.Vector2(5, 0);
            const size = new THREE.Vector2(2, 1);
            component.addWindow(position, size);
            expect(component.windows).toHaveLength(1);
            expect(component.windows[0].position).toEqual(position);
            expect(component.windows[0].size).toEqual(size);
        });

        test('should add door', () => {
            const position = new THREE.Vector2(5, 0);
            const size = new THREE.Vector2(2, 2);
            component.addDoor(position, size);
            expect(component.doors).toHaveLength(1);
            expect(component.doors[0].position).toEqual(position);
            expect(component.doors[0].size).toEqual(size);
        });

        test('should add part', () => {
            const part = {
                type: 'extension',
                walls: [
                    { start: new THREE.Vector2(0, 0), end: new THREE.Vector2(5, 0) }
                ]
            };
            component.addPart(part);
            expect(component.parts).toHaveLength(1);
            expect(component.parts[0]).toEqual(part);
        });
    });

    describe('cleanup', () => {
        test('should dispose correctly', () => {
            component.walls = [
                { start: new THREE.Vector2(0, 0), end: new THREE.Vector2(10, 0) }
            ];
            component.windows = [
                { position: new THREE.Vector2(5, 0), size: new THREE.Vector2(2, 1) }
            ];
            component.doors = [
                { position: new THREE.Vector2(5, 0), size: new THREE.Vector2(2, 2) }
            ];
            component.parts = [
                { type: 'extension', walls: [] }
            ];
            component.height = 10;

            component.cleanup();

            expect(component.walls).toEqual([]);
            expect(component.windows).toEqual([]);
            expect(component.doors).toEqual([]);
            expect(component.parts).toEqual([]);
            expect(component.height).toBe(0);
            expect(component.roofType).toBe('flat');
            expect(component.roofHeight).toBe(0);
            expect(component.roofAngle).toBe(0);
            expect(component.isComplex).toBe(false);
        });
    });
}); 