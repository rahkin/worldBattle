import { System } from '../../core/System.js';
import * as THREE from 'three';
import * as turf from '@turf/turf';

export class FeatureParserSystem extends System {
    constructor(world) {
        super(world);
        this.worldManager = world.getSystem('WorldManager');
        this.featureStats = {
            building: 0,
            road: 0,
            landuse: 0,
            water: 0
        };
        this.featureCache = new Map();
    }

    async initialize() {
        console.log('Initializing FeatureParserSystem...');
        // No additional initialization needed
        return Promise.resolve();
    }

    async parseFeatures(features, layerName, tile) {
        const parsedFeatures = [];
        let successCount = 0;
        let errorCount = 0;
        
        for (const feature of features) {
            try {
                const parsedFeature = await this.parseFeature(feature, layerName, tile);
                if (parsedFeature) {
                    parsedFeatures.push(parsedFeature);
                    successCount++;
                }
            } catch (error) {
                errorCount++;
                // Only log errors for buildings and roads
                if (['building', 'road'].includes(layerName)) {
                    console.warn(`Failed to parse ${layerName} feature:`, error.message);
                }
            }
        }
        
        if (errorCount > 0) {
            console.warn(`Parsed ${successCount}/${features.length} ${layerName} features (${errorCount} errors)`);
        } else {
            console.log(`✓ Parsed ${successCount}/${features.length} ${layerName} features`);
        }
        
        return parsedFeatures;
    }

    async parseFeature(feature, layerName, tile) {
        if (!feature.geometry || feature.geometry.length === 0) {
            return null;
        }

        // Convert tile coordinates to world coordinates
        const coordinates = this._tileToWorld(feature.geometry, tile, feature.extent);
        
        try {
            switch (layerName) {
                case 'building':
                    const geoJSON = this._createPolygon(coordinates);
                    return {
                        type: 'building',
                        geometry: geoJSON,
                        height: feature.properties.height || 10,
                        properties: feature.properties
                    };
                
                case 'road':
                    const roadGeoJSON = this._createLineString(coordinates);
                    return {
                        type: 'road',
                        geometry: roadGeoJSON,
                        width: this._getRoadWidth(feature.properties),
                        properties: feature.properties
                    };
                
                case 'landuse':
                    const landuseGeoJSON = this._createPolygon(coordinates);
                    return {
                        type: 'landuse',
                        geometry: landuseGeoJSON,
                        properties: feature.properties
                    };
                
                case 'water':
                    const waterGeoJSON = this._createPolygon(coordinates);
                    return {
                        type: 'water',
                        geometry: waterGeoJSON,
                        properties: feature.properties
                    };
                
                default:
                    return null;
            }
        } catch (error) {
            throw new Error(`Failed to create GeoJSON for ${layerName}: ${error.message}`);
        }
    }

    _parseBuilding(feature, tile) {
        console.log('Parsing building feature:', feature);
        
        if (!feature.geometry || !feature.properties) {
            console.warn('Building feature missing geometry or properties');
            return null;
        }

        const height = feature.properties.height || 10; // Default height if not specified
        console.log(`Building height: ${height}`);

        const mesh = this.createBuildingMesh(feature, height);
        if (!mesh) {
            console.warn('Failed to create building mesh');
            return null;
        }

        return {
            type: 'building',
            geometry: feature.geometry,
            properties: feature.properties,
            mesh: mesh
        };
    }

    _parseRoad(feature, tile) {
        // Implementation for parsing road feature
        // This method should return the parsed feature
        return null; // Placeholder return, actual implementation needed
    }

    _parseLanduse(feature, tile) {
        // Implementation for parsing landuse feature
        // This method should return the parsed feature
        return null; // Placeholder return, actual implementation needed
    }

    _parseWater(feature, tile) {
        // Implementation for parsing water feature
        // This method should return the parsed feature
        return null; // Placeholder return, actual implementation needed
    }

    _tileToWorld(geometry, tile, extent) {
        const size = extent || this.tileSize;
        const scale = size / extent;
        
        return geometry.map(point => {
            const [x, y] = point;
            const lng = tile.x + (x * scale / size);
            const lat = tile.y + (y * scale / size);
            return [lng, lat];
        });
    }

    _createPolygon(coordinates) {
        if (coordinates.length < 3) {
            throw new Error('Not enough coordinates for polygon');
        }
        return turf.polygon([coordinates]);
    }

    _createLineString(coordinates) {
        if (coordinates.length < 2) {
            throw new Error('Not enough coordinates for linestring');
        }
        return turf.lineString(coordinates);
    }

    _getRoadWidth(properties) {
        // Default road widths based on type
        const roadWidths = {
            motorway: 20,
            trunk: 18,
            primary: 16,
            secondary: 14,
            tertiary: 12,
            residential: 10,
            service: 8,
            path: 4
        };

        // Get the road type from properties
        const type = properties.type || properties.class || 'residential';
        return roadWidths[type] || 10;
    }

    getStats() {
        return this.featureStats;
    }

    resetStats() {
        Object.keys(this.featureStats).forEach(key => {
            this.featureStats[key] = 0;
        });
    }

    createBuildingMesh(feature) {
        try {
            console.log('Creating building mesh with properties:', feature.properties);
            
            if (!feature.geometry || !feature.geometry[0]) {
                console.warn('Invalid building geometry');
                return null;
            }

            const height = feature.properties.height || 10;
            console.log(`Building height: ${height}`);

            // Create shape from geometry
            const shape = this._createShapeFromGeometry(feature.geometry[0]);
            if (!shape) {
                console.warn('Failed to create building shape');
                return null;
            }

            // Create 3D geometry
            const geometry3d = new THREE.ExtrudeGeometry(shape, {
                depth: height,
                bevelEnabled: false
            });

            // Create material
            const material = new THREE.MeshStandardMaterial({
                color: 0xcccccc,
                roughness: 0.8
            });

            // Create mesh
            const mesh = new THREE.Mesh(geometry3d, material);
            console.log('Building mesh created successfully');
            return mesh;
        } catch (error) {
            console.warn('Failed to create building mesh:', error);
            return null;
        }
    }

    _createShapeFromGeometry(geometry) {
        try {
            const shape = new THREE.Shape();
            
            if (!geometry || geometry.length === 0) {
                console.warn('Invalid geometry for shape creation');
                return null;
            }

            // Create main shape
            shape.moveTo(geometry[0][0], geometry[0][1]);
            for (let i = 1; i < geometry.length; i++) {
                shape.lineTo(geometry[i][0], geometry[i][1]);
            }

            // Close the shape
            shape.closePath();

            console.log('Shape created successfully');
            return shape;
        } catch (error) {
            console.warn('Failed to create shape:', error);
            return null;
        }
    }

    createRoadMesh(feature) {
        try {
            const width = feature.properties.width || 5;
            const geometry = new THREE.PlaneGeometry(1, width);
            const material = new THREE.MeshPhongMaterial({ color: 0x666666 });
            return new THREE.Mesh(geometry, material);
        } catch (error) {
            console.warn('Failed to create road mesh:', error);
            return null;
        }
    }

    createLanduseMesh(feature) {
        try {
            const geometry = new THREE.PlaneGeometry(1, 1);
            const color = this._getLanduseColor(feature.properties.type);
            const material = new THREE.MeshPhongMaterial({ color });
            return new THREE.Mesh(geometry, material);
        } catch (error) {
            console.warn('Failed to create landuse mesh:', error);
            return null;
        }
    }

    createWaterMesh(feature) {
        try {
            const geometry = new THREE.PlaneGeometry(1, 1);
            const material = new THREE.MeshPhongMaterial({
                color: 0x0077be,
                transparent: true,
                opacity: 0.8
            });
            return new THREE.Mesh(geometry, material);
        } catch (error) {
            console.warn('Failed to create water mesh:', error);
            return null;
        }
    }

    _getLanduseColor(type) {
        switch (type) {
            case 'park': return 0x228B22;
            case 'forest': return 0x228B22;
            case 'grass': return 0x90EE90;
            case 'residential': return 0xFAF0E6;
            case 'commercial': return 0xFFE4C4;
            case 'industrial': return 0xDEB887;
            default: return 0xDCDCDC;
        }
    }

    _tileToLngLat(x, y, z) {
        const n = Math.pow(2, z);
        const lng = (x / n) * 360 - 180;
        const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
        return [lng, lat];
    }

    update(deltaTime) {
        // System update logic if needed
    }
} 