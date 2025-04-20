import { jest } from '@jest/globals';
import { BuildingMaterialComponent } from '../ecs/components/BuildingMaterialComponent.js';
import * as THREE from 'three';

// Mock the three.js modules
jest.mock('three', () => {
    const mockTexture = {
        wrapS: 'RepeatWrapping',
        wrapT: 'RepeatWrapping',
        repeat: { x: 1, y: 1 }
    };

    const mockTextureLoader = jest.fn(() => ({
        load: jest.fn().mockReturnValue(mockTexture)
    }));

    const mockMeshStandardMaterial = jest.fn((params) => ({
        ...params,
        dispose: jest.fn(),
        color: { r: 1, g: 1, b: 1 },
        roughness: 0.5,
        metalness: 0.0,
        emissiveIntensity: 0
    }));

    return {
        RepeatWrapping: 'RepeatWrapping',
        TextureLoader: mockTextureLoader,
        MeshStandardMaterial: mockMeshStandardMaterial
    };
});

describe('BuildingMaterialComponent', () => {
    let component;

    beforeEach(() => {
        component = new BuildingMaterialComponent();
    });

    test('should initialize with empty collections', () => {
        expect(component.materials).toBeInstanceOf(Map);
        expect(component.textures).toBeInstanceOf(Map);
        expect(component.wallMaterials).toBeInstanceOf(Map);
        expect(component.roofMaterials).toBeInstanceOf(Map);
        expect(component.windowMaterials).toBeInstanceOf(Map);
        expect(component.doorMaterials).toBeInstanceOf(Map);
        expect(Array.isArray(component.decals)).toBe(true);
        expect(component.decals.length).toBe(0);
    });

    test('should initialize with default properties', () => {
        expect(component.weathering).toBe(0);
        expect(component.damage).toBe(0);
        expect(component.illumination).toBe(0);
    });

    test('should add and update materials', () => {
        const materialDef = {
            color: 0xff0000,
            roughness: 0.7,
            metalness: 0.3
        };
        component.addMaterial('test', materialDef);
        expect(component.materials.has('test')).toBe(true);
        
        // Test material updates
        component.applyWeathering(0.5);
        component.applyDamage(0.3);
        component.setIllumination(0.8);
        
        const material = component.materials.get('test');
        expect(material).toBeDefined();
        expect(material.roughness).toBeGreaterThan(0.7); // Should increase with weathering and damage
        expect(material.metalness).toBeLessThan(0.3); // Should decrease with damage
        expect(material.emissiveIntensity).toBe(0.8); // Should match illumination
    });

    test('should add and configure textures', () => {
        const textureDef = {
            url: 'test.jpg',
            repeat: { x: 2, y: 2 },
            wrapS: THREE.RepeatWrapping,
            wrapT: THREE.RepeatWrapping
        };
        component.addTexture('test', textureDef);
        expect(component.textures.has('test')).toBe(true);
    });

    test('should add decals', () => {
        const decalParams = {
            position: { x: 0, y: 0, z: 0 },
            size: { x: 1, y: 1, z: 1 },
            texture: 'decal.jpg',
            rotation: 45
        };
        component.addDecal(
            decalParams.position,
            decalParams.size,
            decalParams.texture,
            decalParams.rotation
        );
        expect(component.decals.length).toBe(1);
        expect(component.decals[0]).toEqual(decalParams);
    });

    test('should initialize with properties', () => {
        const properties = {
            weathering: 0.5,
            damage: 0.3,
            illumination: 0.8,
            materials: {
                test: { color: 0xff0000 }
            },
            textures: {
                test: 'test.jpg'
            },
            wallMaterials: {
                test: { color: 0x00ff00 }
            },
            roofMaterials: {
                test: { color: 0x0000ff }
            },
            decals: [{
                position: { x: 0, y: 0, z: 0 },
                size: { x: 1, y: 1, z: 1 },
                texture: 'decal.jpg',
                rotation: 45
            }]
        };
        
        component.init(properties);
        
        expect(component.weathering).toBe(0.5);
        expect(component.damage).toBe(0.3);
        expect(component.illumination).toBe(0.8);
        expect(component.materials.has('test')).toBe(true);
        expect(component.textures.has('test')).toBe(true);
        expect(component.wallMaterials.has('test')).toBe(true);
        expect(component.roofMaterials.has('test')).toBe(true);
        expect(component.decals.length).toBe(1);
    });
}); 