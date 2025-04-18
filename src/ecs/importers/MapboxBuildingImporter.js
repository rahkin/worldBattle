import { BuildingSystem } from '../systems/BuildingSystem.js';
import * as THREE from 'three';

export class MapboxBuildingImporter {
    constructor({ accessToken, world }) {
        if (!accessToken) {
            throw new Error('Mapbox access token is required');
        }
        if (!world) {
            throw new Error('World instance is required');
        }

        this.accessToken = accessToken;
        this.world = world;
        this.buildingSystem = world.getSystem(BuildingSystem);
        if (!this.buildingSystem) {
            throw new Error('BuildingSystem not found in world');
        }

        this.tileCache = new Map();
        this.importedBuildings = new Set();
    }

    getTileCoordinates(lat, lon, zoom) {
        const n = Math.pow(2, zoom);
        const xtile = Math.floor((lon + 180) / 360 * n);
        const ytile = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
        return { x: xtile, y: ytile, z: zoom };
    }

    getSurroundingTiles(centerTile, radius = 1) {
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
        const cacheKey = `${tile.x},${tile.y},${tile.z}`;
        if (this.tileCache.has(cacheKey)) {
            return this.tileCache.get(cacheKey);
        }

        const url = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/${tile.z}/${tile.x}/${tile.y}.json?access_token=${this.accessToken}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch tile: ${response.status}`);
        }

        const data = await response.json();
        const buildings = data.features.map(feature => {
            const building = {
                id: feature.id || `${tile.x}-${tile.y}-${feature.properties.height}`,
                position: this.calculateBuildingPosition(feature.geometry.coordinates),
                height: feature.properties.height || 10,
                levels: feature.properties['building:levels'] || 1,
                material: feature.properties['building:material'] || 'default',
                footprint: feature.geometry.coordinates[0]
            };
            
            if (!this.importedBuildings.has(building.id)) {
                this.createBuilding(building);
                this.importedBuildings.add(building.id);
            }
            
            return building;
        });

        this.tileCache.set(cacheKey, buildings);
        return buildings;
    }

    calculateBuildingPosition(coordinates) {
        // Calculate center point of the building footprint
        const points = coordinates[0];
        const center = points.reduce((acc, point) => {
            acc.x += point[0];
            acc.y += point[1];
            return acc;
        }, { x: 0, y: 0 });

        return new THREE.Vector3(
            center.x / points.length,
            0,
            center.y / points.length
        );
    }

    createBuilding(buildingData) {
        const entity = this.world.createEntity();
        this.buildingSystem.createBuilding(entity, {
            position: buildingData.position,
            height: buildingData.height,
            footprint: buildingData.footprint,
            type: 'imported',
            properties: {
                levels: buildingData.levels,
                material: buildingData.material
            }
        });
    }

    cleanup() {
        this.tileCache.clear();
        this.importedBuildings.clear();
    }
} 