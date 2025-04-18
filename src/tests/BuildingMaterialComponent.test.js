import { describe, test, expect, beforeEach, beforeAll } from '@jest/globals';
import { BuildingMaterialComponent } from '../ecs/components/BuildingMaterialComponent.js';
import * as THREE from 'three';

describe('BuildingMaterialComponent', () => {
    let component;

    beforeEach(() => {
        component = new BuildingMaterialComponent();
    });

    describe('initialization', () => {
        test('should initialize with default values', () => {
            expect(component.materials).toEqual(new Map());
            expect(component.textures).toEqual(new Map());
            expect(component.wallMaterials).toEqual(new Map());
            expect(component.roofMaterials).toEqual(new Map());
            expect(component.windowMaterials).toEqual(new Map());
            expect(component.doorMaterials).toEqual(new Map());
            expect(component.decals).toEqual([]);
            expect(component.weathering).toBe(0);
            expect(component.damage).toBe(0);
            expect(component.illumination).toBe(0);
        });

        test('should initialize with provided values', () => {
            const properties = {
                weathering: 0.3,
                damage: 0.2,
                illumination: 0.8,
                materials: {
                    'brick': { color: 0xcccccc, roughness: 0.7, metalness: 0.1 }
                },
                textures: {
                    'brick': { url: 'textures/brick.jpg', repeat: { x: 2, y: 2 } }
                },
                wallMaterials: {
                    'brick': { color: 0xcccccc, roughness: 0.7, metalness: 0.1 }
                },
                roofMaterials: {
                    'tile': { color: 0x333333, roughness: 0.8, metalness: 0.2 }
                },
                windowMaterials: {
                    'glass': { color: 0x88ccff, roughness: 0.1, metalness: 0.8, transparent: true }
                },
                doorMaterials: {
                    'wood': { color: 0x8B4513, roughness: 0.6, metalness: 0.1 }
                },
                decals: [{
                    position: { x: 0, y: 0, z: 0 },
                    size: { width: 1, height: 1 },
                    texture: 'crack',
                    rotation: 0
                }]
            };

            component.init(properties);

            expect(component.weathering).toBe(0.3);
            expect(component.damage).toBe(0.2);
            expect(component.illumination).toBe(0.8);
            expect(component.materials.size).toBe(1);
            expect(component.textures.size).toBe(1);
            expect(component.wallMaterials.size).toBe(1);
            expect(component.roofMaterials.size).toBe(1);
            expect(component.windowMaterials.size).toBe(1);
            expect(component.doorMaterials.size).toBe(1);
            expect(component.decals).toHaveLength(1);
        });
    });

    describe('material management', () => {
        test('should add material correctly', () => {
            const materialProps = {
                color: 0xffffff,
                roughness: 0.5,
                metalness: 0.3
            };

            component.addMaterial('test', materialProps);
            const material = component.materials.get('test');

            expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
            expect(material.color.getHex()).toBe(0xffffff);
            expect(material.roughness).toBe(0.5);
            expect(material.metalness).toBe(0.3);
        });

        test('should add texture correctly', () => {
            const textureProps = {
                url: 'textures/test.jpg',
                repeat: { x: 2, y: 2 },
                wrapS: THREE.RepeatWrapping,
                wrapT: THREE.RepeatWrapping
            };

            component.addTexture('test', textureProps);
            const texture = component.textures.get('test');

            expect(texture).toBeInstanceOf(THREE.Texture);
            expect(texture.repeat.x).toBe(2);
            expect(texture.repeat.y).toBe(2);
            expect(texture.wrapS).toBe(THREE.RepeatWrapping);
            expect(texture.wrapT).toBe(THREE.RepeatWrapping);
        });
    });

    describe('visual effects', () => {
        beforeEach(() => {
            component.init({
                materials: {
                    'test': { color: 0xffffff, roughness: 0.5, metalness: 0.3 }
                }
            });
        });

        test('should apply weathering correctly', () => {
            component.applyWeathering(0.3);
            expect(component.weathering).toBe(0.3);
            
            const material = component.materials.get('test');
            expect(material.roughness).toBeGreaterThan(0.5);
            expect(material.color.r).toBeLessThan(1);
            expect(material.color.g).toBeLessThan(1);
            expect(material.color.b).toBeLessThan(1);
        });

        test('should apply damage correctly', () => {
            component.applyDamage(0.2);
            expect(component.damage).toBe(0.2);
            
            const material = component.materials.get('test');
            expect(material.roughness).toBeGreaterThan(0.5);
            expect(material.metalness).toBeLessThan(0.3);
        });

        test('should update illumination correctly', () => {
            component.setIllumination(0.8);
            expect(component.illumination).toBe(0.8);
            
            const material = component.materials.get('test');
            expect(material.emissiveIntensity).toBe(0.8);
        });
    });

    describe('cleanup', () => {
        test('should dispose resources correctly', () => {
            component.init({
                materials: {
                    'test': { color: 0xffffff }
                },
                textures: {
                    'test': { url: 'textures/test.jpg' }
                }
            });

            component.dispose();

            expect(component.materials.size).toBe(0);
            expect(component.textures.size).toBe(0);
            expect(component.wallMaterials.size).toBe(0);
            expect(component.roofMaterials.size).toBe(0);
            expect(component.windowMaterials.size).toBe(0);
            expect(component.doorMaterials.size).toBe(0);
            expect(component.decals).toEqual([]);
        });
    });
}); 