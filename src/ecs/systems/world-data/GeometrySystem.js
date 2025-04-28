import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createNoise2D } from 'simplex-noise';

export class GeometrySystem {
    constructor(entityManager, systemManager, worldSize = 1000, resolution = 128, maxHeight = 100) {
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
        this.worldSize = worldSize;
        this.resolution = resolution;
        this.maxHeight = maxHeight;
        this.noise2D = createNoise2D();

        // Initialize permutation table for Perlin noise
        this.p = new Array(512);
        for (let i = 0; i < 256; i++) {
            this.p[i] = Math.floor(Math.random() * 256);
        }
        for (let i = 0; i < 256; i++) {
            this.p[i + 256] = this.p[i];
        }
    }

    createMaterials() {
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.8,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        // Load textures and normal maps
        const textureLoader = new THREE.TextureLoader();
        const grassTexture = textureLoader.load('/textures/grass.jpg');
        const grassNormal = textureLoader.load('/textures/grass_normal.jpg');

        grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(50, 50);
        grassNormal.wrapS = grassNormal.wrapT = THREE.RepeatWrapping;
        grassNormal.repeat.set(50, 50);

        material.map = grassTexture;
        material.normalMap = grassNormal;
        material.normalScale.set(1, 1);

        return { material };
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

        // Create base geometry with higher resolution
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
        
        // Adjusted scale for more dramatic terrain
        const heightScale = 5;  // Increased from 3 to 5
        
        // Track actual min/max heights
        let actualMinHeight = Infinity;
        let actualMaxHeight = -Infinity;
        
        // Flatten height data and add noise for more natural variation
        const heightValues = [];
        for (let y = 0; y < resolution.y; y++) {
            for (let x = 0; x < resolution.x; x++) {
                // Get base height from data
                let height = heightData[y][x];
                
                // Add perlin noise for small terrain variations
                const noiseScale = 0.1;
                const noise = this.perlinNoise(x * noiseScale, y * noiseScale);
                height += noise * (height * 0.1); // Noise amplitude increases with height
                
                // Add erosion-like effects
                if (height > 0) {
                    // Steeper slopes have more erosion
                    const slope = this.calculateSlope(heightData, x, y);
                    const erosion = Math.pow(slope, 1.5) * 0.1;
                    height -= erosion;
                }
                
                heightValues.push(height);
                actualMinHeight = Math.min(actualMinHeight, height);
                actualMaxHeight = Math.max(actualMaxHeight, height);
            }
        }

        // Normalize heights and apply smoothing
        const normalizedHeights = this.smoothHeights(
            heightValues.map(h => (h - actualMinHeight) * heightScale),
            resolution
        );
        terrainComponent.normalizedHeights = normalizedHeights;

        // Calculate average height for centering mesh
        const averageHeight = normalizedHeights.reduce((a, b) => a + b, 0) / normalizedHeights.length;
        terrainComponent.averageHeight = averageHeight;

        // Create color attribute for vertex coloring based on height
        const colors = new Float32Array(vertices.length);
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Build heightMap for physics
        const heightMap = [];
        for (let i = 0; i < resolution.y; i++) {
            const row = [];
            for (let j = 0; j < resolution.x; j++) {
                const heightIndex = i * resolution.x + j;
                const height = normalizedHeights[heightIndex];
                row.push(height);
            }
            heightMap.push(row);
        }

        // Update vertices with normalized height data and calculate colors
        for (let i = 0; i < resolution.y; i++) {
            for (let j = 0; j < resolution.x; j++) {
                const vertexIndex = (i * resolution.x + j) * 3;
                const heightIndex = i * resolution.x + j;
                const height = normalizedHeights[heightIndex];
                vertices[vertexIndex + 1] = height;
                
                // Get terrain color based on height and biome
                const color = this.getTerrainColor(height, Math.max(...normalizedHeights));
                colors[vertexIndex] = color.r;
                colors[vertexIndex + 1] = color.g;
                colors[vertexIndex + 2] = color.b;
            }
        }

        geometry.computeVertexNormals();
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;

        // Create mesh with proper material
        const mesh = new THREE.Mesh(geometry, this.materials.material);
        
        // Position the mesh at the center and offset by -averageHeight
        mesh.position.set(
            centerLocal.x,
            -averageHeight, // Center mesh vertically
            centerLocal.z
        );
        terrainComponent.mesh = mesh;

        // Debug: log mesh position and bounding box
        const meshBoundingBox = new THREE.Box3().setFromObject(mesh);
        console.log('Terrain mesh position:', mesh.position);
        console.log('Terrain mesh bounding box:', {
            min: meshBoundingBox.min,
            max: meshBoundingBox.max
        });

        // Create physics body with adjusted parameters
        const heightfieldShape = new CANNON.Heightfield(heightMap, {
            elementSize: terrainWidth / (resolution.x - 1),
            minValue: 0,
            maxValue: Math.max(...normalizedHeights)
        });

        const body = new CANNON.Body({ 
            mass: 0,
            material: new CANNON.Material({ 
                friction: 0.8,     // Increased friction for better vehicle control
                restitution: 0.2   // Reduced bounciness
            })
        });
        body.addShape(heightfieldShape);
        
        // Position the physics body to match the mesh exactly
        body.position.set(
            centerLocal.x,
            -averageHeight, // Match mesh y
            centerLocal.z
        );
        // Rotate to align with the visual mesh
        body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        terrainComponent.physicsBody = body;

        // Debug: log heightfield body position and orientation
        console.log('Terrain heightfield body position:', body.position);
        console.log('Terrain heightfield body quaternion:', body.quaternion);

        // Add debug visualization
        const debugHelpers = this.createDebugHelpers(mesh, 0x00ff00);
        this.debugHelpers.set('terrain', debugHelpers);
        // Add debug helpers to mesh
        mesh.add(debugHelpers.bbox);
        mesh.add(debugHelpers.axes);
        mesh.add(debugHelpers.marker);

        // Add a temporary visual marker at the mesh y=0 and car spawn y for debugging
        const markerGeometry = new THREE.SphereGeometry(2, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const meshMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        meshMarker.position.set(mesh.position.x, 0, mesh.position.z);
        mesh.add(meshMarker);
        // Car marker will be added in Game.js at spawn

        // Debug: Add a visual marker at y=0 (ground level)
        const groundMarkerGeometry = new THREE.SphereGeometry(5, 16, 16);
        const groundMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true });
        const groundMarker = new THREE.Mesh(groundMarkerGeometry, groundMarkerMaterial);
        groundMarker.position.set(mesh.position.x, 0, mesh.position.z);
        mesh.add(groundMarker);

        console.log('Terrain generation complete:', {
            dimensions: {
                width: terrainWidth,
                length: terrainLength,
                heightRange: {
                    min: 0,
                    max: Math.max(...normalizedHeights),
                    delta: Math.max(...normalizedHeights)
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
            heightMapSample: heightMap.slice(0, 3).map(row => row.slice(0, 3))
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

    // Utility: Get world Y at (x, z) for terrain
    getTerrainWorldHeightAt(x, z) {
        // Find the first terrain entity
        const terrainEntities = this.entityManager.getEntitiesByComponent('terrain');
        if (!terrainEntities.length) return 0;
        const entity = terrainEntities[0];
        const terrainComponent = this.entityManager.getComponent(entity, 'terrain');
        if (!terrainComponent || !terrainComponent.mesh || !terrainComponent.normalizedHeights) return 0;
        const mesh = terrainComponent.mesh;
        const resolution = terrainComponent.resolution;
        const width = mesh.geometry.parameters.width;
        const length = mesh.geometry.parameters.height;
        // Convert (x, z) to grid coordinates
        const gridX = Math.round(((x - mesh.position.x) / width + 0.5) * (resolution.x - 1));
        const gridZ = Math.round(((z - mesh.position.z) / length + 0.5) * (resolution.y - 1));
        const index = gridZ * resolution.x + gridX;
        const sampledHeight = terrainComponent.normalizedHeights[index] || 0;
        // World y = mesh.position.y + sampledHeight
        return mesh.position.y + sampledHeight;
    }

    // Utility functions for terrain generation
    perlinNoise(x, y) {
        // Simple 2D Perlin noise implementation
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        const u = this.fade(x);
        const v = this.fade(y);
        
        const A = this.p[X] + Y;
        const B = this.p[X + 1] + Y;
        
        return this.lerp(v,
            this.lerp(u,
                this.grad(this.p[A], x, y),
                this.grad(this.p[B], x - 1, y)
            ),
            this.lerp(u,
                this.grad(this.p[A + 1], x, y - 1),
                this.grad(this.p[B + 1], x - 1, y - 1)
            )
        );
    }

    calculateSlope(heightData, x, y) {
        const h = heightData[y][x];
        const dz = (y > 0) ? Math.abs(h - heightData[y-1][x]) : 0;
        const dx = (x > 0) ? Math.abs(h - heightData[y][x-1]) : 0;
        return Math.sqrt(dx * dx + dz * dz);
    }

    smoothHeights(heights, resolution) {
        const smoothed = [...heights];
        const kernel = [0.1, 0.2, 0.4, 0.2, 0.1]; // Gaussian-like smoothing kernel
        
        // Smooth along X direction
        for (let y = 0; y < resolution.y; y++) {
            for (let x = 2; x < resolution.x - 2; x++) {
                let sum = 0;
                for (let k = -2; k <= 2; k++) {
                    sum += heights[y * resolution.x + (x + k)] * kernel[k + 2];
                }
                smoothed[y * resolution.x + x] = sum;
            }
        }
        
        // Smooth along Y direction
        const temp = [...smoothed];
        for (let x = 0; x < resolution.x; x++) {
            for (let y = 2; y < resolution.y - 2; y++) {
                let sum = 0;
                for (let k = -2; k <= 2; k++) {
                    sum += temp[(y + k) * resolution.x + x] * kernel[k + 2];
                }
                smoothed[y * resolution.x + x] = sum;
            }
        }
        
        return smoothed;
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    grad(hash, x, y) {
        const h = hash & 15;
        const grad = 1 + (h & 7);
        return ((h & 8) ? -grad : grad) * x + ((h & 4) ? -grad : grad) * y;
    }

    getTerrainColor(height, maxHeight) {
        // Define biome thresholds
        const snowLine = maxHeight * 0.8;
        const rockLine = maxHeight * 0.4;
        const grassLine = maxHeight * 0.2;
        
        // Base colors for different biomes
        const colors = {
            snow: new THREE.Color(0.95, 0.95, 0.95),
            rock: new THREE.Color(0.6, 0.6, 0.6),
            grass: new THREE.Color(0.4, 0.6, 0.3),
            dirt: new THREE.Color(0.3, 0.2, 0.1)
        };

        let finalColor;
        
        if (height >= snowLine) {
            // Snow biome with rock transition
            const t = THREE.MathUtils.smoothstep((height - snowLine) / (maxHeight - snowLine), 0, 1);
            finalColor = colors.rock.clone().lerp(colors.snow, t);
        } else if (height >= rockLine) {
            // Rocky biome with snow and grass transitions
            const t = THREE.MathUtils.smoothstep((height - rockLine) / (snowLine - rockLine), 0, 1);
            finalColor = colors.grass.clone().lerp(colors.rock, t);
        } else if (height >= grassLine) {
            // Grass biome with rock and dirt transitions
            const t = THREE.MathUtils.smoothstep((height - grassLine) / (rockLine - grassLine), 0, 1);
            finalColor = colors.dirt.clone().lerp(colors.grass, t);
        } else {
            // Dirt biome with grass transition
            const t = THREE.MathUtils.smoothstep(height / grassLine, 0, 1);
            finalColor = colors.dirt.clone().lerp(colors.grass, t);
        }

        return finalColor;
    }

    createGeometry() {
        const geometry = new THREE.PlaneGeometry(
            this.worldSize,
            this.worldSize,
            this.resolution - 1,
            this.resolution - 1
        );

        const vertices = geometry.attributes.position.array;
        const colors = [];

        // Scale factors for different noise frequencies
        const largeScale = 0.02;
        const mediumScale = 0.05;
        const smallScale = 0.1;

        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];

            // Generate multi-layered noise
            const largeNoise = this.noise2D(x * largeScale, z * largeScale);
            const mediumNoise = this.noise2D(x * mediumScale, z * mediumScale) * 0.5;
            const smallNoise = this.noise2D(x * smallScale, z * smallScale) * 0.25;

            // Combine noise layers
            const height = (largeNoise + mediumNoise + smallNoise) * this.maxHeight;

            // Apply height
            vertices[i + 1] = height;

            // Get color based on height
            const color = this.getTerrainColor(height, this.maxHeight);
            colors.push(color.r, color.g, color.b);
        }

        // Add colors to geometry
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        // Compute normals for proper lighting
        geometry.computeVertexNormals();

        return geometry;
    }
} 