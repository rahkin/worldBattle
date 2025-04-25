import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class GeometrySystem {
    constructor(entityManager, systemManager) {
        this.entityManager = entityManager;
        this.systemManager = systemManager;
        // Get the shared CoordinateConverter instance from WorldDataSystem
        const worldDataSystem = this.systemManager.getSystem('WorldDataSystem');
        if (!worldDataSystem) {
            throw new Error('WorldDataSystem must be initialized before GeometrySystem');
        }
        this.coordinateConverter = worldDataSystem.coordinateConverter;
        this.materials = this.createMaterials();
        this.debugHelpers = new Map();
    }

    createMaterials() {
        return {
            terrain: new THREE.MeshPhongMaterial({
                color: 0x3c8f5e,  // A natural greenish color
                emissive: 0x000000,
                specular: 0x555555,
                shininess: 30,
                wireframe: false,
                flatShading: true,  // This will make elevation changes more visible
                side: THREE.DoubleSide
            })
        };
    }

    createDebugHelpers(mesh, color = 0xff0000) {
        // Create bounding box helper
        const bbox = new THREE.Box3().setFromObject(mesh);
        const bboxHelper = new THREE.Box3Helper(bbox, new THREE.Color(color));
        
        // Create axes helper at mesh position
        const axesHelper = new THREE.AxesHelper(5);
        axesHelper.position.copy(mesh.position);
        
        // Create position marker (small sphere)
        const markerGeometry = new THREE.SphereGeometry(0.5);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: color });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.copy(mesh.position);
        
        return { bbox: bboxHelper, axes: axesHelper, marker };
    }

    async initialize() {
        try {
            console.log('Initializing GeometrySystem...');
            
            // Process terrain entities only
            const terrainEntities = this.entityManager.getEntitiesByComponent('terrain');
            if (!terrainEntities.length) {
                throw new Error('No terrain entities found');
            }
            
            for (const entity of terrainEntities) {
                await this.generateTerrainGeometry(entity);
            }

            // Print details about terrain
            const terrainEntity = terrainEntities[0];
            const terrainComponent = this.entityManager.getComponent(terrainEntity, 'terrain');
            if (terrainComponent && terrainComponent.mesh) {
                console.log('Terrain mesh created with position:', terrainComponent.mesh.position.toArray(), 
                            'and rotation:', terrainComponent.mesh.rotation.toArray());
                
                // Get bounding box to determine terrain dimensions
                const boundingBox = new THREE.Box3().setFromObject(terrainComponent.mesh);
                console.log('Terrain bounding box:', {
                    min: boundingBox.min.toArray(),
                    max: boundingBox.max.toArray(),
                    size: boundingBox.getSize(new THREE.Vector3()).toArray()
                });
            }

            return true;
        } catch (error) {
            console.error('Failed to initialize GeometrySystem:', error);
            throw error;
        }
    }

    async generateTerrainGeometry(entity) {
        const terrainComponent = this.entityManager.getComponent(entity, 'terrain');
        const { heightData, resolution, bounds } = terrainComponent;

        if (!heightData || !resolution || !bounds) {
            throw new Error('Missing required terrain data');
        }

        // Calculate terrain dimensions in real-world meters
        const terrainWidth = this.coordinateConverter.getDistance(bounds.south, bounds.west, bounds.south, bounds.east);
        const terrainLength = this.coordinateConverter.getDistance(bounds.south, bounds.west, bounds.north, bounds.west);

        // Get terrain center in local coordinates
        const centerLocal = this.coordinateConverter.geoToLocal(
            (bounds.north + bounds.south) / 2,
            (bounds.east + bounds.west) / 2
        );

        // Create base geometry
        const geometry = new THREE.PlaneGeometry(
            terrainWidth,
            terrainLength,
            resolution.x - 1,
            resolution.y - 1
        );

        // Rotate the geometry to be horizontal (facing up)
        geometry.rotateX(-Math.PI / 2);

        // Update vertices based on height data
        const vertices = geometry.attributes.position.array;
        const heightScale = 10; // Increased scale to make elevation changes more visible
        
        // Track actual min/max heights
        let actualMinHeight = Infinity;
        let actualMaxHeight = -Infinity;
        
        // Create a height map for debugging
        const heightMap = [];
        
        // First find min/max heights
        for (let i = 0; i < heightData.length; i++) {
            const height = heightData[i] * heightScale;
            actualMinHeight = Math.min(actualMinHeight, height);
            actualMaxHeight = Math.max(actualMaxHeight, height);
        }

        console.log('Height range:', {
            min: actualMinHeight,
            max: actualMaxHeight,
            delta: actualMaxHeight - actualMinHeight,
            heightScale: heightScale,
            sampleHeights: heightData.slice(0, 10),
            totalPoints: heightData.length
        });

        // Create color attribute for vertex coloring based on height
        const colors = new Float32Array(vertices.length);
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Update vertices with height data and normalize to ground level
        for (let i = 0; i < resolution.y; i++) {
            const row = [];
            for (let j = 0; j < resolution.x; j++) {
                const vertexIndex = (i * resolution.x + j) * 3;
                const heightIndex = i * resolution.x + j;

                if (heightIndex >= heightData.length) {
                    console.error('Height index out of bounds:', heightIndex, 'max:', heightData.length);
                    continue;
                }

                // Set height directly from the scaled height data without negating
                const height = heightData[heightIndex] * heightScale;
                vertices[vertexIndex + 1] = height; // Y is up after rotation
                row.push(height); // Store the actual height for physics

                // Calculate color based on height (green to brown gradient)
                const heightFactor = (height - actualMinHeight) / (actualMaxHeight - actualMinHeight);
                colors[vertexIndex] = 0.24 + heightFactor * 0.1;     // R: slight red variation
                colors[vertexIndex + 1] = 0.56 - heightFactor * 0.3; // G: decrease green with height
                colors[vertexIndex + 2] = 0.37 - heightFactor * 0.2; // B: decrease blue with height
            }
            heightMap.push(row);
        }

        geometry.computeVertexNormals();
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;

        // Create mesh with proper material
        const mesh = new THREE.Mesh(geometry, this.materials.terrain);
        
        // Position the mesh at the center
        mesh.position.set(
            centerLocal.x,
            0, // Place at ground level
            centerLocal.z
        );
        
        terrainComponent.mesh = mesh;

        // Create physics body
        const heightfieldShape = new CANNON.Heightfield(heightMap, {
            elementSize: terrainWidth / (resolution.x - 1),
            minValue: 0,
            maxValue: actualMaxHeight - actualMinHeight
        });

        const body = new CANNON.Body({ 
            mass: 0,
            material: new CANNON.Material({ friction: 0.5, restitution: 0.3 })
        });
        body.addShape(heightfieldShape);
        
        // Position the physics body to match the mesh
        body.position.set(
            mesh.position.x,
            -(actualMaxHeight - actualMinHeight) / 2, // Offset to align with visual mesh
            mesh.position.z
        );
        
        // Rotate to align with the visual mesh
        body.quaternion.setFromEuler(Math.PI / 2, 0, 0);
        
        terrainComponent.physicsBody = body;

        // Add debug visualization
        const debugHelpers = this.createDebugHelpers(mesh, 0x00ff00);
        this.debugHelpers.set('terrain', debugHelpers);
        
        // Add debug helpers to mesh
        mesh.add(debugHelpers.bbox);
        mesh.add(debugHelpers.axes);
        mesh.add(debugHelpers.marker);

        console.log('Terrain generation details:', {
            dimensions: {
                width: terrainWidth,
                length: terrainLength,
                heightRange: {
                    min: actualMinHeight,
                    max: actualMaxHeight,
                    delta: actualMaxHeight - actualMinHeight
                }
            },
            center: {
                geo: {
                    lat: (bounds.north + bounds.south) / 2,
                    lon: (bounds.east + bounds.west) / 2
                },
                local: centerLocal
            },
            mesh: {
                position: mesh.position.toArray(),
                scale: mesh.scale.toArray()
            },
            physics: {
                position: body.position.toArray(),
                quaternion: body.quaternion.toArray()
            },
            heightMapSample: heightMap.slice(0, 3).map(row => row.slice(0, 3)),
            vertexCount: geometry.attributes.position.count
        });
    }

    update(deltaTime) {
        // Handle any dynamic terrain updates if needed
    }

    cleanup() {
        // Clean up debug helpers
        this.debugHelpers.forEach(helpers => {
            helpers.bbox.dispose();
            helpers.axes.dispose();
            helpers.marker.geometry.dispose();
            helpers.marker.material.dispose();
        });
        this.debugHelpers.clear();
    }
} 