import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { TerrainComponent } from '../ecs/components/TerrainComponent.js';
import * as THREE from 'three';

describe('TerrainComponent', () => {
    let terrain;
    let position;

    beforeEach(() => {
        terrain = new TerrainComponent();
        position = new THREE.Vector2(0, 0);
    });

    describe('initialization', () => {
        test('initializes with default values', () => {
            expect(terrain.gridSize).toBe(1);
            expect(terrain.maxHeight).toBe(100);
            expect(terrain.minHeight).toBe(0);
            expect(terrain.heightMap.size).toBe(0);
            expect(terrain.textureMap.size).toBe(0);
            expect(terrain.materialMap.size).toBe(0);
            expect(terrain.objects).toHaveLength(0);
        });

        test('initializes with provided values', () => {
            terrain.init({
                gridSize: 2,
                maxHeight: 200,
                minHeight: -50
            });
            expect(terrain.gridSize).toBe(2);
            expect(terrain.maxHeight).toBe(200);
            expect(terrain.minHeight).toBe(-50);
        });

        test('maintains default values when not provided', () => {
            terrain.init({});
            expect(terrain.gridSize).toBe(1);
            expect(terrain.maxHeight).toBe(100);
            expect(terrain.minHeight).toBe(0);
        });
    });

    describe('height management', () => {
        test('sets and gets height at position', () => {
            terrain.setHeightAt(position, 50);
            expect(terrain.getHeightAt(position)).toBe(50);
        });

        test('clamps height between min and max values', () => {
            terrain.setHeightAt(position, 150);
            expect(terrain.getHeightAt(position)).toBe(100);

            terrain.setHeightAt(position, -50);
            expect(terrain.getHeightAt(position)).toBe(0);
        });

        test('returns 0 for undefined height', () => {
            expect(terrain.getHeightAt(new THREE.Vector2(1, 1))).toBe(0);
        });
    });

    describe('texture management', () => {
        test('sets and gets texture at position', () => {
            const mockTexture = { id: 'grass' };
            terrain.setTextureAt(position, mockTexture);
            expect(terrain.getTextureAt(position)).toBe(mockTexture);
        });

        test('returns undefined for undefined texture', () => {
            expect(terrain.getTextureAt(new THREE.Vector2(1, 1))).toBeUndefined();
        });
    });

    describe('material management', () => {
        test('sets and gets material at position', () => {
            const mockMaterial = { id: 'dirt' };
            terrain.setMaterialAt(position, mockMaterial);
            expect(terrain.getMaterialAt(position)).toBe(mockMaterial);
        });

        test('returns undefined for undefined material', () => {
            expect(terrain.getMaterialAt(new THREE.Vector2(1, 1))).toBeUndefined();
        });
    });

    describe('object management', () => {
        test('adds and removes objects', () => {
            const mockObject = { id: 'tree' };
            terrain.addObject(mockObject);
            expect(terrain.objects).toContain(mockObject);

            terrain.removeObject(mockObject);
            expect(terrain.objects).not.toContain(mockObject);
        });

        test('handles removing non-existent object', () => {
            const mockObject = { id: 'tree' };
            terrain.removeObject(mockObject);
            expect(terrain.objects).toHaveLength(0);
        });
    });

    describe('terrain queries', () => {
        test('checks if point is on terrain', () => {
            terrain.setHeightAt(position, 10);
            expect(terrain.isPointOnTerrain(position)).toBe(true);

            terrain.setHeightAt(position, 0);
            expect(terrain.isPointOnTerrain(position)).toBe(false);
        });

        test('calculates slope at position', () => {
            const center = new THREE.Vector2(0, 0);
            terrain.setHeightAt(center, 10);
            terrain.setHeightAt(new THREE.Vector2(1, 0), 12);
            terrain.setHeightAt(new THREE.Vector2(-1, 0), 8);
            terrain.setHeightAt(new THREE.Vector2(0, 1), 11);
            terrain.setHeightAt(new THREE.Vector2(0, -1), 9);

            const slope = terrain.getSlopeAt(center);
            expect(slope).toBeCloseTo(Math.sqrt(4 + 1));
        });

        test('calculates normal at position', () => {
            const center = new THREE.Vector2(0, 0);
            terrain.setHeightAt(center, 10);
            terrain.setHeightAt(new THREE.Vector2(1, 0), 12);
            terrain.setHeightAt(new THREE.Vector2(-1, 0), 8);
            terrain.setHeightAt(new THREE.Vector2(0, 1), 11);
            terrain.setHeightAt(new THREE.Vector2(0, -1), 9);

            const normal = terrain.getNormalAt(center);
            expect(normal).toBeInstanceOf(THREE.Vector3);
            expect(normal.length()).toBeCloseTo(1);
            expect(normal.y).toBeGreaterThan(0);
        });
    });

    describe('cleanup', () => {
        test('disposes all resources', () => {
            terrain.setHeightAt(position, 10);
            terrain.setTextureAt(position, { id: 'grass' });
            terrain.setMaterialAt(position, { id: 'dirt' });
            terrain.addObject({ id: 'tree' });

            terrain.dispose();

            expect(terrain.heightMap.size).toBe(0);
            expect(terrain.textureMap.size).toBe(0);
            expect(terrain.materialMap.size).toBe(0);
            expect(terrain.objects).toHaveLength(0);
        });
    });
}); 