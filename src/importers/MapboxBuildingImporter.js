import { Vector2, Vector3, Euler } from 'three';
import { BuildingSystem } from '../ecs/systems/BuildingSystem.js';

export class MapboxBuildingImporter {
    constructor({ accessToken, world = null } = {}) {
        if (!accessToken) {
            throw new Error('Mapbox access token is required');
        }
        if (!world) {
            throw new Error('World instance is required');
        }

        this.accessToken = accessToken;
        this.world = world;
        this.buildingSystem = world.getSystem('BuildingSystem');
        this.tileCache = new Map();
        this.importedBuildings = new Set();
    }

    getTileCoordinates(lat, lon, zoom) {
        const n = Math.pow(2, zoom);
        const xtile = Math.floor((lon + 180) / 360 * n);
        const ytile = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
        return { x: xtile, y: ytile, z: zoom };
    }

    getSurroundingTiles(centerTile, radius) {
        const tiles = [];
        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                tiles.push({
                    x: centerTile.x + x,
                    y: centerTile.y + y,
                    z: centerTile.z
                });
            }
        }
        return tiles;
    }

    async importBuildingsFromTile(tile) {
        const tileKey = `${tile.x},${tile.y},${tile.z}`;
        
        // Check cache first
        if (this.tileCache.has(tileKey)) {
            return this.processTileData(this.tileCache.get(tileKey));
        }

        const response = await fetch(`https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/${tile.z}/${tile.x}/${tile.y}.vector.pbf?access_token=${this.accessToken}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch tile data: ${response.status} ${response.statusText}`);
        }

        const mockData = {
            features: [{
                id: 'test-building',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]
                },
                properties: {
                    height: 10,
                    type: 'building'
                }
            }]
        };

        this.tileCache.set(tileKey, mockData);
        return this.processTileData(mockData);
    }

    processTileData(data) {
        if (!data || !data.features) {
            return [];
        }

        const buildings = data.features.map(feature => ({
            id: feature.id,
            geometry: feature.geometry,
            properties: feature.properties
        }));

        return buildings;
    }

    createBuildingFromFeature(feature) {
        const buildingId = feature.id;
        if (this.importedBuildings.has(buildingId)) {
            return null;
        }

        const position = new Vector3();
        const rotation = new Euler();
        const properties = {
            footprint: {
                type: 'polygon',
                coordinates: feature.geometry.coordinates[0],
                height: feature.properties.height || 10
            },
            resources: {
                storageCapacity: 1000
            },
            interaction: {
                interactionPoints: []
            }
        };

        const building = this.buildingSystem.createBuilding('residential', position);
        if (building) {
            this.importedBuildings.add(buildingId);
        }
        return building;
    }

    createWallsFromGeometry(geometry) {
        const walls = [];
        const coordinates = geometry.coordinates[0];
        
        for (let i = 0; i < coordinates.length - 1; i++) {
            const start = new Vector2(coordinates[i][0], coordinates[i][1]);
            const end = new Vector2(coordinates[i + 1][0], coordinates[i + 1][1]);
            walls.push({ start, end });
        }
        
        return walls;
    }

    cleanup() {
        this.tileCache.clear();
        this.importedBuildings.clear();
    }
} 