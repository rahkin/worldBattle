import { System } from '../core/System.js';
import * as THREE from 'three';
import { BuildingSystem } from './BuildingSystem.js';
import { mapboxConfig } from '../config/mapboxConfig.js';
import { VectorTile } from '@mapbox/vector-tile';
import Protobuf from 'pbf';

export class MapboxBuildingImporter extends System {
    constructor() {
        super();
        this.buildingSystem = null;
        this.config = mapboxConfig;
        this.mapCenter = new THREE.Vector2();
        this.importQueue = [];
        this.isImporting = false;
        this.retryCount = 0;
    }

    init(properties = {}) {
        super.init();
        
        // Override config with any provided properties
        if (properties.mapboxToken) {
            this.config.api.token = properties.mapboxToken;
        }
        if (properties.center) {
            this.config.api.center = properties.center;
        }
        if (properties.zoom) {
            this.config.api.zoom = properties.zoom;
        }

        this.mapCenter.set(
            this.config.api.center?.longitude || 0,
            this.config.api.center?.latitude || 0
        );
    }

    onWorldSet() {
        // Get reference to BuildingSystem
        this.buildingSystem = this.world?.getSystem(BuildingSystem);
        if (!this.buildingSystem) {
            console.error('BuildingSystem not found in world');
            return;
        }
    }

    async importBuildings(bbox) {
        if (!this.config.api.token) {
            console.error('Mapbox token not set');
            return;
        }

        try {
            // Convert bbox to tile coordinates
            const tiles = this._bboxToTiles(bbox);
            
            // Fetch vector tiles for each tile coordinate
            const tilePromises = tiles.map(tile => this._fetchVectorTile(tile));
            const tileData = await Promise.all(tilePromises);
            
            // Process all buildings from the tiles
            await this._processVectorTiles(tileData);
            this.retryCount = 0; // Reset retry count on success
        } catch (error) {
            console.error('Error importing buildings from Mapbox:', error);
            if (this.retryCount < this.config.import.maxRetries) {
                this.retryCount++;
                setTimeout(() => this.importBuildings(bbox), this.config.import.retryDelay);
            }
        }
    }

    _bboxToTiles(bbox) {
        const [minLon, minLat, maxLon, maxLat] = bbox;
        const zoom = this.config.api.zoom;
        
        // Convert coordinates to tile coordinates
        const minTile = this._latLonToTile(minLat, minLon, zoom);
        const maxTile = this._latLonToTile(maxLat, maxLon, zoom);
        
        // Generate all tile coordinates in the bounding box
        const tiles = [];
        for (let x = minTile.x; x <= maxTile.x; x++) {
            for (let y = minTile.y; y <= maxTile.y; y++) {
                tiles.push({ x, y, z: zoom });
            }
        }
        return tiles;
    }

    _latLonToTile(lat, lon, zoom) {
        const n = Math.pow(2, zoom);
        const x = Math.floor((lon + 180) / 360 * n);
        const latRad = lat * Math.PI / 180;
        const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
        return { x, y, z: zoom };
    }

    async _fetchVectorTile(tile) {
        const { x, y, z } = tile;
        const url = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/${z}/${x}/${y}.mvt?access_token=${this.config.api.token}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const buffer = await response.arrayBuffer();
        return { tile, buffer };
    }

    async _processVectorTiles(tileData) {
        for (const { tile, buffer } of tileData) {
            const vectorTile = new VectorTile(new Protobuf(buffer));
            
            // Process buildings layer
            const buildingsLayer = vectorTile.layers['building'];
            if (!buildingsLayer) continue;

            // Process buildings in batches
            for (let i = 0; i < buildingsLayer.length; i += this.config.import.batchSize) {
                const batch = Array.from(buildingsLayer.features).slice(i, i + this.config.import.batchSize);
                await Promise.all(batch.map(feature => this._processBuildingFeature(feature, tile)));
            }
        }
    }

    async _processBuildingFeature(feature, tile) {
        const properties = feature.properties;
        const geometry = feature.loadGeometry();

        const buildingType = this._getBuildingType(properties);
        if (!buildingType) return;

        const template = this.config.buildingTypes[buildingType];
        if (!template) {
            console.warn(`No template found for building type: ${buildingType}`);
            return;
        }

        const building = await this._createBuildingFromFeature(feature, template, tile);
        if (building) {
            this.buildingSystem.queueConstruction(building.template, building.position);
        }
    }

    _getBuildingType(properties) {
        const mapboxType = properties.building.toLowerCase();
        return this.config.featureMapping.buildingTypes[mapboxType] || 'residential';
    }

    async _createBuildingFromFeature(feature, template, tile) {
        const properties = feature.properties;
        const geometry = feature.loadGeometry();

        // Convert tile coordinates to game world coordinates
        const vertices = this._convertTileCoordinates(geometry[0], tile);
        
        // Calculate building area
        const area = this._calculateArea(vertices);
        if (area < this.config.import.minBuildingArea || area > this.config.import.maxBuildingArea) {
            return null;
        }

        // Create building footprint
        const footprint = {
            ...template.footprint,
            vertices: vertices,
            height: this._calculateBuildingHeight(properties, template)
        };

        // Create building material
        const material = {
            ...template.material,
            ...this._getBuildingMaterial(properties)
        };

        // Create building template
        const buildingTemplate = {
            footprint: footprint,
            material: material,
            properties: {
                ...template.properties,
                type: this._getBuildingType(properties),
                name: properties.name || `Building_${Date.now()}`,
                area: area
            }
        };

        // Calculate building position
        const position = this._calculateBuildingPosition(vertices);
        
        return { template: buildingTemplate, position };
    }

    _convertTileCoordinates(coordinates, tile) {
        const { x, y, z } = tile;
        const n = Math.pow(2, z);
        
        return coordinates.map(coord => {
            // Convert tile coordinates to lat/lon
            const lon = coord.x / 4096 + x;
            const lat = coord.y / 4096 + y;
            
            // Convert lat/lon to game world coordinates
            const worldX = (lon - this.mapCenter.x) * 111320 * Math.cos(this.mapCenter.y * Math.PI / 180);
            const worldY = (lat - this.mapCenter.y) * 111320;
            
            return {
                x: Number(worldX.toFixed(this.config.import.coordinatePrecision)),
                y: Number(worldY.toFixed(this.config.import.coordinatePrecision))
            };
        });
    }

    _calculateArea(vertices) {
        let area = 0;
        for (let i = 0; i < vertices.length; i++) {
            const j = (i + 1) % vertices.length;
            area += vertices[i].x * vertices[j].y;
            area -= vertices[j].x * vertices[i].y;
        }
        return Math.abs(area) / 2;
    }

    _calculateBuildingHeight(properties, template) {
        if (properties.height) {
            return Math.min(template.footprint.maxHeight, 
                          Math.max(template.footprint.minHeight, properties.height));
        }
        if (properties.levels) {
            const height = properties.levels * 3; // Approximate 3 meters per level
            return Math.min(template.footprint.maxHeight, 
                          Math.max(template.footprint.minHeight, height));
        }
        return template.footprint.defaultHeight;
    }

    _getBuildingMaterial(properties) {
        if (properties.material) {
            return this.config.featureMapping.materials[properties.material.toLowerCase()] || {};
        }
        return {};
    }

    _calculateBuildingPosition(vertices) {
        let centerX = 0;
        let centerY = 0;
        
        vertices.forEach(vertex => {
            centerX += vertex.x;
            centerY += vertex.y;
        });

        centerX /= vertices.length;
        centerY /= vertices.length;

        return new THREE.Vector3(centerX, 0, centerY);
    }

    update(deltaTime) {
        if (this.importQueue.length > 0 && !this.isImporting) {
            this.isImporting = true;
            const nextImport = this.importQueue.shift();
            this.importBuildings(nextImport.bbox)
                .finally(() => {
                    this.isImporting = false;
                });
        }
    }

    queueImport(bbox) {
        this.importQueue.push({ bbox });
    }

    dispose() {
        this.importQueue = [];
        this.retryCount = 0;
    }
} 