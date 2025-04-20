import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { MapboxBuildingImporter } from '../importers/MapboxBuildingImporter.js';
import { BuildingSystem } from '../ecs/systems/BuildingSystem.js';
import * as THREE from 'three';

// Mock World class
class MockWorld {
    constructor() {
        this.entities = new Map();
        this.systems = new Map();
        this.nextEntityId = 1;
        this.entitiesToRemove = new Set();
        this.init = jest.fn().mockResolvedValue();
        this.update = jest.fn();
        this.cleanup = jest.fn();
        this.addSystem = jest.fn().mockImplementation(async (system) => {
            const systemName = system.constructor.name;
            this.systems.set(systemName, system);
            system.world = this; // Set the world reference on the system
            if (system.init) {
                await system.init();
            }
        });
        this.getSystem = jest.fn().mockImplementation((name) => this.systems.get(name));
        this.removeSystem = jest.fn();
        this.createEntity = jest.fn().mockImplementation(() => {
            const entity = { id: this.nextEntityId++, components: new Map() };
            this.entities.set(entity.id, entity);
            return entity;
        });
        this.removeEntity = jest.fn();
    }
}

describe('MapboxBuildingImporter', () => {
    let importer;
    let world;
    let buildingSystem;

    beforeEach(() => {
        world = new MockWorld();
        buildingSystem = new BuildingSystem({ world });
        world.addSystem(buildingSystem);
        importer = new MapboxBuildingImporter({
            accessToken: 'test-token',
            world: world
        });
    });

    describe('initialization', () => {
        test('should initialize with required properties', () => {
            expect(importer.accessToken).toBe('test-token');
            expect(importer.world).toBe(world);
            expect(importer.buildingSystem).toBe(buildingSystem);
            expect(importer.tileCache).toEqual(new Map());
            expect(importer.importedBuildings).toEqual(new Set());
        });

        test('should throw error if access token is missing', () => {
            expect(() => {
                new MapboxBuildingImporter({ world });
            }).toThrow('Mapbox access token is required');
        });

        test('should throw error if world is missing', () => {
            expect(() => {
                new MapboxBuildingImporter({ accessToken: 'test-token' });
            }).toThrow('World instance is required');
        });
    });

    describe('coordinate conversion', () => {
        test('should convert lat/lon to tile coordinates', () => {
            const lat = 40.7128;
            const lon = -74.0060;
            const zoom = 16;
            const tile = importer.getTileCoordinates(lat, lon, zoom);
            expect(tile).toEqual({
                x: expect.any(Number),
                y: expect.any(Number),
                z: zoom
            });
        });

        test('should get surrounding tiles', () => {
            const centerTile = { x: 10, y: 10, z: 16 };
            const radius = 1;
            const tiles = importer.getSurroundingTiles(centerTile, radius);
            expect(tiles).toHaveLength(9); // 3x3 grid
            expect(tiles).toContainEqual(centerTile);
        });
    });

    describe('building import', () => {
        const mockTileData = {
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
                    },
                    properties: {
                        height: 10,
                        'building:levels': 3,
                        'building:material': 'brick'
                    }
                }
            ]
        };

        beforeEach(() => {
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockTileData)
                })
            );
        });

        test('should import buildings from tile', async () => {
            const tile = { x: 10, y: 10, z: 16 };
            const buildings = await importer.importBuildingsFromTile(tile);
            expect(buildings).toHaveLength(1);
            expect(importer.tileCache.has(`${tile.x},${tile.y},${tile.z}`)).toBe(true);
        });

        test('should handle tile import errors', async () => {
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: false,
                    status: 404
                })
            );

            const tile = { x: 10, y: 10, z: 16 };
            await expect(importer.importBuildingsFromTile(tile)).rejects.toThrow();
        });

        test('should use cached tile data', async () => {
            const tile = { x: 10, y: 10, z: 16 };
            const tileKey = `${tile.x},${tile.y},${tile.z}`;
            importer.tileCache.set(tileKey, mockTileData);

            const buildings = await importer.importBuildingsFromTile(tile);
            expect(buildings).toHaveLength(1);
            expect(global.fetch).not.toHaveBeenCalled();
        });
    });

    describe('cleanup', () => {
        test('should clear cache and imported buildings', () => {
            importer.tileCache.set('test', {});
            importer.importedBuildings.add('test');
            importer.cleanup();
            expect(importer.tileCache.size).toBe(0);
            expect(importer.importedBuildings.size).toBe(0);
        });
    });
}); 