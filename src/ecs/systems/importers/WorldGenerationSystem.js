import { System } from '../../System.js';
import { TerrainComponent } from '../../components/TerrainComponent.js';
import { DebugPanelComponent } from '../../components/DebugPanelComponent.js';
import { geographicToWorld } from '../../../utils/geographicToWorld.js';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { PositionComponent } from '../../components/PositionComponent.js';
import { MeshComponent } from '../../components/MeshComponent.js';
import { PhysicsBody } from '../../components/PhysicsBody.js';
import { GeoFeatureComponent } from '../../components/GeoFeatureComponent.js';

export class WorldGenerationSystem extends System {
    constructor(world, scene) {
        super(world);
        
        // Validate scene
        if (!scene) {
            console.error('Scene is required for WorldGenerationSystem');
            throw new Error('Scene is required for WorldGenerationSystem');
        }
        console.log('Initializing WorldGenerationSystem with scene:', scene);
        
        this.scene = scene;
        this.tileFetcher = null;
        this.featureParser = null;
        this.generationRadius = 5000; // 5km in meters
        this.loadedTiles = new Set();
        this.generationQueue = [];
        this.isGenerating = false;
        this.worldManager = world.getSystem('WorldManager');
        this.generatedEntities = new Set();
        this.terrainEntity = null;
        this.terrainSize = 1000; // Size of terrain in meters
        this.terrainResolution = 100; // Number of vertices per side
        this.terrainHeight = 0; // Default height
        this.tileSize = 4096; // Standard tile size
        
        // NAIA Terminal 1 coordinates
        this.originLat = 14.5086; // NAIA latitude
        this.originLon = 121.0194; // NAIA longitude
        
        console.log('Origin set to NAIA:', { lat: this.originLat, lon: this.originLon });
        
        // Create debug panel entity
        this.debugPanelEntity = this.world.createEntity();
        this.debugPanelEntity.addComponent('DebugPanelComponent', new DebugPanelComponent());

        // Materials
        this.materials = {
            building: new THREE.MeshPhongMaterial({
                color: 0xcccccc,
                shininess: 30,
                side: THREE.DoubleSide,
                emissive: 0x111111
            }),
            road: new THREE.MeshPhongMaterial({
                color: 0x666666,
                shininess: 10,
                emissive: 0x111111
            }),
            landuse: new THREE.MeshPhongMaterial({
                color: 0x88aa88,
                shininess: 5,
                emissive: 0x111111
            }),
            water: new THREE.MeshPhongMaterial({
                color: 0x4444ff,
                transparent: true,
                opacity: 0.7,
                shininess: 90,
                emissive: 0x111111
            })
        };

        // Validate scene after setup
        this._validateScene();
    }

    _validateScene() {
        if (!this.scene) {
            console.error('Scene is not initialized');
            return false;
        }

        console.log('Scene validation:', {
            type: this.scene.type,
            children: this.scene.children.length,
            isVisible: this.scene.visible,
            materials: Object.keys(this.materials)
        });

        return true;
    }

    _addToScene(mesh, type) {
        if (!this.scene) {
            console.error('Cannot add mesh to scene - scene is not initialized');
            return false;
        }

        try {
            this.scene.add(mesh);
            console.log(`Added ${type} mesh to scene:`, {
                position: mesh.position,
                rotation: mesh.rotation,
                scale: mesh.scale,
                visible: mesh.visible,
                material: mesh.material.type,
                geometry: mesh.geometry.type
            });
            return true;
        } catch (error) {
            console.error(`Failed to add ${type} mesh to scene:`, error);
            return false;
        }
    }

    async initializeTerrain() {
        try {
            // Create terrain entity if it doesn't exist
            if (!this.terrainEntity) {
                this.terrainEntity = this.world.createEntity();
                this.terrainEntity.addComponent('TerrainComponent', new TerrainComponent());
            }

            // Initialize flat terrain
            const terrainComponent = this.terrainEntity.getComponent('TerrainComponent');
            terrainComponent.init({
                gridSize: this.terrainSize / this.terrainResolution,
                maxHeight: this.terrainHeight,
                minHeight: 0
            });
            
            console.log('Terrain initialized successfully');
        } catch (error) {
            console.error('Failed to initialize terrain:', error);
            throw error;
        }
    }

    async initialize() {
        console.log('\n=== Initializing WorldGenerationSystem ===');
        this.tileFetcher = this.world.getSystem('TileFetcherSystem');
        this.featureParser = this.world.getSystem('FeatureParserSystem');
        
        if (!this.tileFetcher || !this.featureParser) {
            throw new Error('Required systems not found');
        }

        // Validate scene
        if (!this.scene) {
            console.error('Scene is not initialized during WorldGenerationSystem initialization');
            throw new Error('Scene is required for WorldGenerationSystem');
        }

        // Update camera position for better initial view
        if (this.scene.camera) {
            this.scene.camera.position.set(0, 300, 300);
            this.scene.camera.lookAt(0, 0, 0);
            console.log('Camera position updated:', this.scene.camera.position);
        }

        return Promise.resolve();
    }

    async generateEntities(features, layerName) {
        console.log(`\n=== Generating ${features.length} entities for layer: ${layerName} ===`);
        
        const entities = [];
        let successCount = 0;
        let errorCount = 0;
        let validationFailures = {
            noFeature: 0,
            noGeometry: 0,
            noTileCoords: 0,
            invalidCoords: 0,
            meshCreationFailed: 0,
            sceneAddFailed: 0
        };
        
        for (const feature of features) {
            try {
                // Validate feature data
                if (!feature) {
                    validationFailures.noFeature++;
                    continue;
                }
                
                if (!feature.geometry || !feature.geometry.length) {
                    validationFailures.noGeometry++;
                    continue;
                }
                
                if (!feature.tileCoords) {
                    validationFailures.noTileCoords++;
                    continue;
                }

                // Convert coordinates and validate
                const worldCoords = feature.geometry.flatMap((ring, ringIndex) => {
                    return ring.map((coords, pointIndex) => {
                        if (!Array.isArray(coords) || coords.length < 2) {
                            return null;
                        }
                        return this.convertToWorldCoords(coords[0], coords[1], feature.tileCoords);
                    }).filter(coord => coord !== null);
                });

                if (worldCoords.length === 0) {
                    validationFailures.invalidCoords++;
                    continue;
                }

                // Create entity
                const entity = this.world.createEntity();
                
                // Calculate and validate center position
                const center = worldCoords[0];
                if (!center || typeof center.x !== 'number' || typeof center.z !== 'number') {
                    continue;
                }

                // Add position component
                entity.addComponent('PositionComponent', new PositionComponent(center.x, center.y, center.z));
                successCount++;
                entities.push(entity);
            } catch (error) {
                console.error(`Error processing feature in layer ${layerName}:`, error);
                errorCount++;
            }
        }

        // Log summary at the end
        console.log(`\n=== Layer ${layerName} Generation Summary ===`);
        console.log(`✓ Successfully processed: ${successCount}`);
        console.log(`✗ Errors encountered: ${errorCount}`);
        if (Object.values(validationFailures).some(v => v > 0)) {
            console.log('Validation failures:', validationFailures);
        }
        
        return entities;
    }

    createBuildingMesh(coordinates) {
        try {
            // Convert coordinates to Vector2 for shape
            const shape = new THREE.Shape();
            const firstPoint = coordinates[0];
            shape.moveTo(firstPoint.x, firstPoint.z);
            
            for (let i = 1; i < coordinates.length; i++) {
                shape.lineTo(coordinates[i].x, coordinates[i].z);
            }
            shape.closePath();
            
            // Building parameters
            const height = Math.random() * 20 + 10; // Random height between 10-30 meters
            const options = {
                depth: height,
                bevelEnabled: false // Disable bevel for simpler collision
            };
            
            // Create geometry
            const geometry = new THREE.ExtrudeGeometry(shape, options);
            
            // Create mesh with standard material
            const material = new THREE.MeshStandardMaterial({
                color: 0xcccccc,
                metalness: 0.2,
                roughness: 0.8,
                side: THREE.DoubleSide
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2; // Rotate to stand upright
            mesh.position.y = height / 2; // Place bottom at ground level
            
            // Add physics body
            const physicsBody = new CANNON.Body({
                mass: 0, // Static body
                type: CANNON.Body.STATIC,
                shape: new CANNON.Box(new CANNON.Vec3(10, height / 2, 10))
            });
            
            mesh.userData.physicsBody = physicsBody;
            
            console.log('Created building mesh:', {
                vertices: geometry.attributes.position.count,
                height: height,
                position: mesh.position.toArray(),
                rotation: mesh.rotation.toArray()
            });
            
            return mesh;
        } catch (error) {
            console.error('Failed to create building mesh:', error);
            return null;
        }
    }

    createRoadMesh(coordinates) {
        try {
            // Create curve from coordinates
            const points = coordinates.map(coord => new THREE.Vector3(coord[0], 0, coord[1]));
            const curve = new THREE.CatmullRomCurve3(points);
            
            // Road parameters
            const width = 10; // Road width in meters
            const segments = Math.max(coordinates.length * 4, 12); // Segments based on coordinate count
            
            // Create geometry
            const geometry = new THREE.TubeGeometry(
                curve,
                segments,
                width / 2, // Radius is half the width
                8, // radialSegments - number of segments around tube
                false // closed
            );
            
            // Create mesh
            const mesh = new THREE.Mesh(geometry, this.materials.road);
            mesh.position.y = 0.5; // Slightly above ground to prevent z-fighting
            
            console.log('Created road mesh:', {
                vertices: geometry.attributes.position.count,
                segments: segments,
                width: width,
                position: mesh.position.toArray()
            });
            
            return mesh;
        } catch (error) {
            console.error('Failed to create road mesh:', error);
            return null;
        }
    }

    createLanduseMesh(coordinates) {
        try {
            console.log('Creating landuse mesh with coordinates:', coordinates);
            
            if (!coordinates || coordinates.length < 3) {
                console.warn('Not enough coordinates for landuse mesh:', coordinates);
                return null;
            }

            // Create a shape from the coordinates
            const shape = new THREE.Shape();
            
            // Move to the first point
            shape.moveTo(coordinates[0].x, coordinates[0].z);
            
            // Add lines to each subsequent point
            for (let i = 1; i < coordinates.length; i++) {
                if (coordinates[i] && typeof coordinates[i].x === 'number' && typeof coordinates[i].z === 'number') {
                    shape.lineTo(coordinates[i].x, coordinates[i].z);
                } else {
                    console.warn(`Invalid coordinate at index ${i}:`, coordinates[i]);
                }
            }

            // Ensure the shape is closed
            if (coordinates.length >= 3) {
                shape.lineTo(coordinates[0].x, coordinates[0].z);
            }

            // Create geometry with explicit options
            const geometry = new THREE.ShapeGeometry(shape, {
                curveSegments: 12,
                steps: 1
            });
            
            // Rotate to lay flat on the ground
            geometry.rotateX(-Math.PI / 2);

            // Create mesh
            const mesh = new THREE.Mesh(geometry, this.materials.landuse);
            mesh.receiveShadow = true;

            // Add to scene
            if (this._addToScene(mesh, 'landuse')) {
                console.log('Successfully created and added landuse mesh to scene');
                return mesh;
            }

            return null;
        } catch (error) {
            console.error('Failed to create landuse mesh:', error);
            console.error('Coordinates:', JSON.stringify(coordinates, null, 2));
            return null;
        }
    }

    convertToWorldCoords(x, y, tileCoords) {
        try {
            // Validate inputs
            if (typeof x !== 'number' || typeof y !== 'number' || 
                !tileCoords || typeof tileCoords.x !== 'number' || 
                typeof tileCoords.y !== 'number' || typeof tileCoords.z !== 'number') {
                console.warn('Invalid coordinates or tile data:', { x, y, tileCoords });
                return { x: 0, y: 0, z: 0 };
            }

            // Convert tile coordinates to longitude/latitude
            const scale = Math.pow(2, tileCoords.z);
            const lon = (tileCoords.x + x / this.tileSize) / scale * 360 - 180;
            const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * (tileCoords.y + y / this.tileSize) / scale))) * 180 / Math.PI;

            // Calculate distance from NAIA in meters
            const R = 6371000; // Earth's radius in meters
            const dLat = (lat - this.originLat) * Math.PI / 180;
            const dLon = (lon - this.originLon) * Math.PI / 180;
            
            // Use equirectangular approximation for small distances
            const xDist = dLon * Math.cos(this.originLat * Math.PI / 180) * R;
            const zDist = dLat * R;

            // Scale down the distances to make them more manageable in the game world
            // Using a scale factor of 1:100 (1 meter in game = 100 meters in real world)
            const scaleFactor = 0.01;
            const gameX = xDist * scaleFactor;
            const gameZ = zDist * scaleFactor;

            // Only log every 100th conversion or if there's something unusual
            if (this.conversionCount % 100 === 0) {
                console.debug('Coordinate conversion sample:', {
                    geographic: { lat, lon },
                    gameWorld: { x: gameX.toFixed(2), z: gameZ.toFixed(2) }
                });
            }
            this.conversionCount = (this.conversionCount || 0) + 1;

            return { x: gameX, y: 0, z: gameZ };
        } catch (error) {
            console.error('Error converting coordinates:', error);
            return { x: 0, y: 0, z: 0 };
        }
    }

    createWaterMesh(coordinates) {
        try {
            console.log('Creating water mesh with coordinates:', coordinates);
            
            if (!coordinates || coordinates.length < 3) {
                console.warn('Not enough coordinates for water mesh:', coordinates);
                return null;
            }

            // Create a shape from the coordinates
            const shape = new THREE.Shape();
            
            // Move to the first point
            shape.moveTo(coordinates[0].x, coordinates[0].z);
            
            // Add lines to each subsequent point
            for (let i = 1; i < coordinates.length; i++) {
                if (coordinates[i] && typeof coordinates[i].x === 'number' && typeof coordinates[i].z === 'number') {
                    shape.lineTo(coordinates[i].x, coordinates[i].z);
                } else {
                    console.warn(`Invalid coordinate at index ${i}:`, coordinates[i]);
                }
            }

            // Ensure the shape is closed
            if (coordinates.length >= 3) {
                shape.lineTo(coordinates[0].x, coordinates[0].z);
            }

            // Create geometry with explicit options
            const geometry = new THREE.ShapeGeometry(shape, {
                curveSegments: 12,
                steps: 1
            });
            
            // Rotate to lay flat on the ground
            geometry.rotateX(-Math.PI / 2);

            // Create mesh with water material
            const mesh = new THREE.Mesh(geometry, this.materials.water);
            mesh.receiveShadow = true;
            mesh.position.y = -0.1; // Slightly below ground level

            // Add to scene
            if (this._addToScene(mesh, 'water')) {
                console.log('Successfully created and added water mesh to scene');
                return mesh;
            }

            return null;
        } catch (error) {
            console.error('Failed to create water mesh:', error);
            console.error('Coordinates:', JSON.stringify(coordinates, null, 2));
            return null;
        }
    }

    createEntityFromFeature(feature) {
        if (!feature || !feature.geometry || !feature.geometry.length || !feature.tileCoords) {
            console.warn('Invalid feature data:', JSON.stringify(feature, null, 2));
            return null;
        }

        try {
            console.log('Converting coordinates to world space...');
            // Convert feature coordinates to world coordinates
            const worldCoords = feature.geometry.map(coords => {
                if (!Array.isArray(coords) || coords.length < 2) {
                    console.warn('Invalid coordinate pair:', coords);
                    return null;
                }
                return this.convertToWorldCoords(coords[0], coords[1], feature.tileCoords);
            }).filter(coord => coord !== null);

            if (worldCoords.length === 0) {
                console.warn('No valid world coordinates generated');
                return null;
            }

            console.log('World coordinates:', worldCoords[0]);

            // Calculate center position (using first point for simplicity)
            const center = worldCoords[0] || { x: 0, y: 0, z: 0 };
            console.log('Center position:', center);

            // Create entity based on feature type
            const entity = this.world.createEntity();
            console.log('Created entity');
            
            // Add position component
            entity.addComponent(new PositionComponent(center.x, center.y, center.z));
            console.log('Added PositionComponent');

            // Create mesh based on feature type
            let mesh;
            console.log('Creating mesh for type:', feature.type);
            switch (feature.type) {
                case 'building':
                    mesh = this.createBuildingMesh(worldCoords);
                    break;
                case 'road':
                    mesh = this.createRoadMesh(worldCoords);
                    break;
                case 'landuse':
                    mesh = this.createLanduseMesh(worldCoords);
                    break;
                case 'water':
                    mesh = this.createWaterMesh(worldCoords);
                    break;
                default:
                    console.warn(`Unknown feature type: ${feature.type}`);
                    return null;
            }

            if (mesh) {
                console.log('Created mesh successfully');
                entity.addComponent(new MeshComponent(mesh));
                entity.addComponent(new PhysicsBody());
                entity.addComponent(new GeoFeatureComponent(feature.type, feature.properties || {}));
                console.log('Added all components');
                return entity;
            }

            console.warn('Failed to create mesh');
            return null;
        } catch (error) {
            console.error('Error creating entity from feature:', error);
            return null;
        }
    }

    _updateTerrainFromFeature(feature, isWater = false) {
        const terrainEntity = this.worldManager.getTerrainEntity();
        if (!terrainEntity) {
            console.warn('Terrain entity not found, skipping terrain update');
            return;
        }

        const terrain = terrainEntity.getComponent('TerrainComponent');
        if (!terrain) {
            console.warn('Terrain component not found, skipping terrain update');
            return;
        }

        if (!feature.geometry || !feature.geometry[0]) {
            console.warn('Invalid feature geometry, skipping terrain update');
            return;
        }

        const geometry = feature.geometry[0];
        const height = isWater ? -1 : (feature.properties.height || 0);

        try {
            // Convert geographic coordinates to world coordinates
            const worldPoints = geometry.map(point => {
                const worldPos = this.worldManager.getWorldPosition([point[0], point[1]]);
                return new THREE.Vector2(worldPos[0], worldPos[1]);
            });

            // Update terrain height for each point in the feature's area
            const bbox = this._calculateBoundingBox(worldPoints);
            for (let x = Math.floor(bbox.min.x); x <= Math.ceil(bbox.max.x); x++) {
                for (let y = Math.floor(bbox.min.y); y <= Math.ceil(bbox.max.y); y++) {
                    const point = new THREE.Vector2(x, y);
                    if (this._isPointInPolygon(point, worldPoints)) {
                        terrain.setHeightAt(point, height);
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to update terrain from feature:', error);
        }
    }

    _calculateBoundingBox(points) {
        if (!points || points.length === 0) {
            return { min: new THREE.Vector2(0, 0), max: new THREE.Vector2(0, 0) };
        }

        const bbox = {
            min: new THREE.Vector2(Infinity, Infinity),
            max: new THREE.Vector2(-Infinity, -Infinity)
        };

        points.forEach(point => {
            bbox.min.x = Math.min(bbox.min.x, point.x);
            bbox.min.y = Math.min(bbox.min.y, point.y);
            bbox.max.x = Math.max(bbox.max.x, point.x);
            bbox.max.y = Math.max(bbox.max.y, point.y);
        });

        return bbox;
    }

    _isPointInPolygon(point, polygon) {
        if (!polygon || polygon.length < 3) return false;

        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;

            const intersect = ((yi > point.y) !== (yj > point.y))
                && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    }

    _calculateCenter(geometry) {
        if (!geometry || !Array.isArray(geometry) || geometry.length === 0) {
            console.warn('Invalid geometry for center calculation');
            return new THREE.Vector3(0, 0, 0);
        }

        // For roads, use the first point of the first line
        if (geometry[0] && Array.isArray(geometry[0]) && geometry[0].length > 0) {
            const firstPoint = geometry[0][0];
            if (Array.isArray(firstPoint) && firstPoint.length >= 2) {
                const worldPos = this.worldManager.getWorldPosition([firstPoint[0], firstPoint[1]]);
                return new THREE.Vector3(worldPos[0], 0, worldPos[1]);
            }
        }

        console.warn('Could not calculate center from geometry');
        return new THREE.Vector3(0, 0, 0);
    }

    _createPhysicsBody(feature) {
        const body = new CANNON.Body({
            mass: 0, // Static body
            material: new CANNON.Material('featureMaterial')
        });

        switch (feature.type) {
            case 'building':
                this._addBuildingShape(body, feature);
                break;
            case 'road':
                this._addRoadShape(body, feature);
                break;
            case 'landuse':
            case 'natural':
            case 'park':
                this._addLanduseShape(body, feature);
                break;
        }

        return body;
    }

    _addBuildingShape(body, feature) {
        const height = feature.properties.height || 10;
        const shape = new CANNON.Box(new CANNON.Vec3(
            this._calculateWidth(feature.geometry) / 2,
            height / 2,
            this._calculateDepth(feature.geometry) / 2
        ));
        body.addShape(shape);
    }

    _addRoadShape(body, feature) {
        if (!feature.geometry || !Array.isArray(feature.geometry) || feature.geometry.length === 0) {
            console.warn('Invalid road geometry');
            return;
        }

        const points = feature.geometry[0];
        if (!Array.isArray(points) || points.length < 2) {
            console.warn('Invalid road points');
            return;
        }

        const width = feature.properties.width || 5;
        
        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];
            
            if (!Array.isArray(start) || !Array.isArray(end) || 
                start.length < 2 || end.length < 2) {
                console.warn('Invalid road segment points');
                continue;
            }

            const startPos = this.worldManager.getWorldPosition([start[0], start[1]]);
            const endPos = this.worldManager.getWorldPosition([end[0], end[1]]);
            
            const length = Math.sqrt(
                Math.pow(endPos[0] - startPos[0], 2) + 
                Math.pow(endPos[1] - startPos[1], 2)
            );
            
            const shape = new CANNON.Box(new CANNON.Vec3(
                length / 2,
                0.1,
                width / 2
            ));
            
            const angle = Math.atan2(endPos[1] - startPos[1], endPos[0] - startPos[0]);
            const quat = new CANNON.Quaternion();
            quat.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
            
            body.addShape(shape, new CANNON.Vec3(
                (startPos[0] + endPos[0]) / 2,
                0,
                (startPos[1] + endPos[1]) / 2
            ), quat);
        }
    }

    _addLanduseShape(body, feature) {
        const shape = new CANNON.Box(new CANNON.Vec3(
            this._calculateWidth(feature.geometry) / 2,
            0.1,
            this._calculateDepth(feature.geometry) / 2
        ));
        body.addShape(shape);
    }

    _calculateWidth(geometry) {
        const points = geometry[0];
        let minX = Infinity;
        let maxX = -Infinity;
        
        points.forEach(point => {
            minX = Math.min(minX, point[0]);
            maxX = Math.max(maxX, point[0]);
        });
        
        return maxX - minX;
    }

    _calculateDepth(geometry) {
        const points = geometry[0];
        let minZ = Infinity;
        let maxZ = -Infinity;
        
        points.forEach(point => {
            minZ = Math.min(minZ, point[1]);
            maxZ = Math.max(maxZ, point[1]);
        });
        
        return maxZ - minZ;
    }

    update(deltaTime) {
        // System update logic if needed
    }
} 