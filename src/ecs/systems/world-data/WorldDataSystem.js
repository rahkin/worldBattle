import * as Cesium from '@cesium/engine';
import { CoordinateConverter } from '../../utils/world-data/CoordinateConverter.js';
import { TerrainComponent } from '../../components/world-data/TerrainComponent.js';
import { BuildingComponent } from '../../components/world-data/BuildingComponent.js';
import { RoadComponent } from '../../components/world-data/RoadComponent.js';
import { LoadingIndicator } from '../../../ui/LoadingIndicator.js';

export class WorldDataSystem {
    constructor(entityManager, systemManager, loadingIndicator) {
        this.entityManager = entityManager;
        this.systemManager = systemManager;
        this.coordinateConverter = new CoordinateConverter();
        this.loadingIndicator = loadingIndicator;
        
        // Debug logging
        console.log('Initializing WorldDataSystem with token:', import.meta.env.VITE_CESIUM_ACCESS_TOKEN);
        
        // Configure Cesium with environment variables
        Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ACCESS_TOKEN;
    }

    async initializeProviders() {
        try {
            console.log('Starting provider initialization...');
            
            // Initialize terrain provider using Cesium World Terrain
            console.log('Creating terrain resource...');
            const terrainResource = await Cesium.IonResource.fromAssetId(1);
            console.log('Terrain resource created, initializing terrain provider...');
            this.terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(terrainResource);
            console.log('Terrain provider initialized');
            
            // Initialize imagery provider using Cesium World Imagery
            console.log('Initializing imagery provider...');
            this.imageryProvider = new Cesium.TileMapServiceImageryProvider({
                url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
            });
            console.log('Imagery provider initialized');
            
            // Initialize building and road data source
            console.log('Creating OSM buildings tileset...');
            this.osmBuildingsTilesetUrl = await Cesium.IonResource.fromAssetId(96188);
            console.log('OSM buildings tileset created');
            this.osmDataSource = new Cesium.GeoJsonDataSource();
            console.log('GeoJSON data source created');
            
            console.log('All Cesium providers initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing Cesium providers:', error);
            console.error('Error stack:', error.stack);
            console.error('Error details:', {
                message: error.message,
                name: error.name,
                code: error.code
            });
            throw error;
        }
    }

    // Constants for location and area size
    static NAIA_COORDINATES = {
        latitude: 14.5086,  // NAIA center latitude
        longitude: 121.0194 // NAIA center longitude
    };

    // Resolution levels for progressive loading
    static RESOLUTION_LEVELS = {
        INITIAL: { width: 50, height: 50 },    // Fast initial load
        MEDIUM: { width: 75, height: 75 },     // Better detail
        HIGH: { width: 100, height: 100 }      // Full detail
    };

    // Utility function to calculate bounds for a given radius in kilometers
    calculateBoundsFromRadius(centerLat, centerLon, radiusKm, resolution = WorldDataSystem.RESOLUTION_LEVELS.INITIAL) {
        // Earth's radius in kilometers
        const EARTH_RADIUS = 6371;
        
        // Convert radius from kilometers to degrees
        // 1 degree of latitude is approximately 111 kilometers
        const latDelta = (radiusKm / 111);
        
        // 1 degree of longitude varies with latitude
        // cos(lat) accounts for the narrowing of longitude degrees as we move away from the equator
        const lonDelta = (radiusKm / (111 * Math.cos(centerLat * Math.PI / 180)));

        return {
            south: centerLat - latDelta,
            north: centerLat + latDelta,
            west: centerLon - lonDelta,
            east: centerLon + lonDelta,
            width: resolution.width,
            height: resolution.height
        };
    }

    async initialize() {
        try {
            console.log('Starting WorldDataSystem initialization...');
            if (this.loadingIndicator) {
                await this.loadingIndicator.show();
                await this.loadingIndicator.updateProgress(0, 'Initializing...', 'Setting up providers');
            }
            
            // Initialize providers first
            await this.initializeProviders();
            if (this.loadingIndicator) {
                await this.loadingIndicator.updateProgress(20, 'Initializing...', 'Providers ready');
            }
            
            // Initialize viewport
            this.initializeViewport();
            if (this.loadingIndicator) {
                await this.loadingIndicator.updateProgress(30, 'Initializing...', 'Viewport ready');
            }
            
            // Calculate bounds for 5km radius around NAIA
            const bounds = this.calculateBoundsFromRadius(
                WorldDataSystem.NAIA_COORDINATES.latitude,
                WorldDataSystem.NAIA_COORDINATES.longitude,
                5
            );

            // Load terrain data
            await this.loadTerrainData(bounds).catch(error => {
                console.warn('Failed to load terrain:', error);
            });
            if (this.loadingIndicator) {
                await this.loadingIndicator.updateProgress(50, 'Loading Data', 'Terrain loaded');
            }

            // Load essential buildings and roads together
            const dataLoaded = await this.loadEssentialData(bounds);
            if (!dataLoaded) {
                throw new Error('Failed to load essential data');
            }
            if (this.loadingIndicator) {
                await this.loadingIndicator.updateProgress(80, 'Finalizing', 'Essential data loaded');
            }

            // Store bounds for later background loading
            this.pendingBackgroundLoad = bounds;
            
            console.log('WorldDataSystem initialization completed');
            return true;
        } catch (error) {
            console.error('Failed to initialize WorldDataSystem:', error);
            if (this.loadingIndicator) {
                await this.loadingIndicator.updateProgress(100, 'Error', `Failed to initialize: ${error.message}`);
            }
            return false;
        }
    }

    initializeViewport() {
        // Set up the initial view of Manila
        const manila = Cesium.Cartesian3.fromDegrees(121.0194, 14.5086, 1000.0);
        
        // Create a scene to get the proper projection
        const scene = new Cesium.Scene({
            canvas: document.createElement('canvas'),  // Temporary canvas
            creditContainer: document.createElement('div')  // Temporary credit container
        });
        
        // Initialize the camera with proper configuration
        this.camera = new Cesium.Camera(scene);
        
        // Set the camera position and orientation
        this.camera.position = manila;
        this.camera.direction = Cesium.Cartesian3.negate(Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3());
        this.camera.up = Cesium.Cartesian3.UNIT_Y;
        
        // Clean up temporary scene
        scene.destroy();
    }

    async loadTerrainData(bounds) {
        try {
            console.log('Requesting terrain data for bounds:', bounds);

            // Create a rectangle for our area of interest
            const rectangle = new Cesium.Rectangle(
                Cesium.Math.toRadians(bounds.west),
                Cesium.Math.toRadians(bounds.south),
                Cesium.Math.toRadians(bounds.east),
                Cesium.Math.toRadians(bounds.north)
            );

            // Sample terrain heights
            const terrainSamplePositions = [];
            const width = bounds.width;
            const height = bounds.height;

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const longitude = Cesium.Math.lerp(bounds.west, bounds.east, x / (width - 1));
                    const latitude = Cesium.Math.lerp(bounds.south, bounds.north, y / (height - 1));
                    terrainSamplePositions.push(Cesium.Cartographic.fromDegrees(longitude, latitude));
                }
            }

            console.log(`Sampling ${terrainSamplePositions.length} terrain points...`);

            // Get the heights for all positions
            const terrainHeights = await Cesium.sampleTerrainMostDetailed(this.terrainProvider, terrainSamplePositions);

            if (!terrainHeights || terrainHeights.length === 0) {
                throw new Error('No terrain height data received');
            }

            // Convert the sampled heights into a height grid
            const heightData = new Float32Array(width * height);
            for (let i = 0; i < terrainHeights.length; i++) {
                heightData[i] = terrainHeights[i].height || 0;
            }

            console.log('Terrain heights sampled successfully');

            // Create terrain entity
            const terrainEntity = this.entityManager.createEntity();
            const terrainComponent = new TerrainComponent();
            
            terrainComponent.heightData = heightData; // Store the Float32Array directly
            terrainComponent.resolution = {
                x: width,
                y: height
            };
            terrainComponent.bounds = bounds;
            
            this.entityManager.addComponent(terrainEntity, 'terrain', terrainComponent);
            console.log('Terrain entity created with dimensions:', width, 'x', height);

            return true;
        } catch (error) {
            console.error('Error loading terrain data:', error);
            throw error;
        }
    }

    // Utility function to split bounds into smaller chunks
    splitBounds(bounds, chunks) {
        const latStep = (bounds.north - bounds.south) / chunks;
        const lonStep = (bounds.east - bounds.west) / chunks;
        const result = [];

        for (let i = 0; i < chunks; i++) {
            for (let j = 0; j < chunks; j++) {
                const chunkBounds = {
                    south: bounds.south + (i * latStep),
                    west: bounds.west + (j * lonStep),
                    north: bounds.south + ((i + 1) * latStep),
                    east: bounds.west + ((j + 1) * lonStep)
                };
                
                // Further split each chunk if it's too large
                const CHUNK_SIZE_THRESHOLD = 0.01; // roughly 1km
                if (latStep > CHUNK_SIZE_THRESHOLD || lonStep > CHUNK_SIZE_THRESHOLD) {
                    const subChunks = this.splitBounds(chunkBounds, 2);
                    result.push(...subChunks);
                } else {
                    result.push(chunkBounds);
                }
            }
        }

        return result;
    }

    // Utility function for exponential backoff
    async exponentialBackoff(attempt) {
        const baseDelay = 2000; // Start with 2 seconds
        const maxDelay = 30000; // Max 30 seconds
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Utility function to retry failed requests with exponential backoff
    async retryRequest(fn, maxAttempts = 5) {
        let lastError;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                if (attempt > 0) {
                    console.log(`Attempt ${attempt + 1}/${maxAttempts}...`);
                }
                return await fn();
            } catch (error) {
                lastError = error;
                if (attempt < maxAttempts - 1) {
                    console.log(`Request failed, retrying with exponential backoff (attempt ${attempt + 1}/${maxAttempts})...`);
                    await this.exponentialBackoff(attempt);
                }
            }
        }
        
        throw lastError;
    }

    async fetchOSMDataWithFilter(bounds, type, filters = []) {
        // Construct query with additional filters
        const filterString = filters.length > 0 ? filters.join('') : '';
        const query = `[out:json][timeout:25];
            way["${type}"]${filterString}
            (${bounds.south},${bounds.west},${bounds.north},${bounds.east});
            out geom;`;
            
        const encodedQuery = encodeURIComponent(query);
        const url = `https://overpass-api.de/api/interpreter?data=${encodedQuery}`;
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
            
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'WorldBattle/1.0'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Rate limited');
                }
                throw new Error(`OpenStreetMap API error (${response.status})`);
            }

            const data = await response.json();
            return data.elements || [];
        } catch (error) {
            console.warn(`Failed to fetch ${type} data:`, error);
            return [];
        }
    }

    async loadEssentialData(bounds) {
        console.log('Starting essential data load...');
        const TOTAL_TIMEOUT = 60000; // Increase timeout to 60 seconds
        const CHUNK_TIMEOUT = 15000; // 15 seconds per chunk
        const MAX_RETRIES = 2; // Reduce max retries
        const RETRY_DELAY = 2000; // 2 seconds between retries
        
        try {
            const startTime = Date.now();

            // Split into just 4 chunks total
            const chunks = this.splitBounds(bounds, 2);
            console.log(`Split area into ${chunks.length} chunks`);
            
            let allBuildings = [];
            let allRoads = [];
            
            // Process chunks sequentially instead of parallel to avoid overwhelming the API
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                console.log(`Processing chunk ${i + 1}/${chunks.length}`);
                
                let retryCount = 0;
                let chunkData = null;
                
                while (retryCount < MAX_RETRIES && !chunkData) {
                    try {
                        // Create a timeout promise for this chunk
                        const timeoutPromise = new Promise((_, reject) => {
                            setTimeout(() => reject(new Error(`Chunk ${i + 1} timeout`)), CHUNK_TIMEOUT);
                        });

                        // Construct building query to include only essential building types
                        const buildingQuery = `[out:json][timeout:25];
                            way["building"~"commercial|industrial|school|hospital|office|retail"]["building"!="no"]["building"!="false"](${chunk.south},${chunk.west},${chunk.north},${chunk.east});
                            out geom;`;
                        
                        // Construct road query for only major roads
                        const roadQuery = `[out:json][timeout:25];
                            way["highway"~"motorway|trunk|primary"]["highway"!="no"]["highway"!="false"](${chunk.south},${chunk.west},${chunk.north},${chunk.east});
                            out geom;`;

                        // Race between timeout and data fetching
                        const [buildingResponse, roadResponse] = await Promise.race([
                            Promise.all([
                                fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(buildingQuery)}`, {
                                    headers: { 'User-Agent': 'WorldBattle/1.0' }
                                }),
                                fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(roadQuery)}`, {
                                    headers: { 'User-Agent': 'WorldBattle/1.0' }
                                })
                            ]),
                            timeoutPromise
                        ]);

                        // Check for rate limiting
                        if (buildingResponse.status === 429 || roadResponse.status === 429) {
                            console.log('Rate limited, waiting longer before retry...');
                            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * 2));
                            throw new Error('Rate limited');
                        }

                        if (!buildingResponse.ok || !roadResponse.ok) {
                            throw new Error(`API error: Buildings (${buildingResponse.status}), Roads (${roadResponse.status})`);
                        }

                        const buildingData = await buildingResponse.json();
                        const roadData = await roadResponse.json();

                        chunkData = {
                            buildings: buildingData.elements || [],
                            roads: roadData.elements || []
                        };

                        // Add the chunk data to our total
                        allBuildings = allBuildings.concat(chunkData.buildings);
                        allRoads = allRoads.concat(chunkData.roads);
                        
                        console.log(`Chunk ${i + 1} loaded successfully with ${chunkData.buildings.length} buildings and ${chunkData.roads.length} roads`);
                        
                        // Update loading progress
                        const progress = Math.floor(((i + 1) / chunks.length) * 100);
                        if (this.loadingIndicator) {
                            await this.loadingIndicator.updateProgress(progress, 'Loading Data', `Loaded chunk ${i + 1}/${chunks.length}`);
                        }
                        
                        // Add delay between chunks to avoid rate limiting
                        if (i < chunks.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                        
                    } catch (error) {
                        console.warn(`Attempt ${retryCount + 1} failed for chunk ${i + 1}:`, error);
                        retryCount++;
                        
                        if (retryCount < MAX_RETRIES) {
                            const waitTime = error.message.includes('Rate limited') ? RETRY_DELAY * 2 : RETRY_DELAY;
                            console.log(`Retrying chunk ${i + 1} in ${waitTime/1000} seconds...`);
                            await new Promise(resolve => setTimeout(resolve, waitTime));
                        }
                    }
                }
                
                if (!chunkData && retryCount === MAX_RETRIES) {
                    console.warn(`Failed to load chunk ${i + 1} after ${MAX_RETRIES} attempts, continuing with partial data...`);
                    continue;
                }
                
                // Check if we've exceeded total timeout
                if (Date.now() - startTime > TOTAL_TIMEOUT) {
                    console.warn('Total timeout reached, proceeding with partial data');
                    break;
                }
            }

            // Proceed even with partial data
            if (allBuildings.length === 0 && allRoads.length === 0) {
                console.warn('No data loaded from any chunk, using fallback data');
                // Create some basic buildings and roads as fallback
                allBuildings = this.createFallbackBuildings();
                allRoads = this.createFallbackRoads();
            }

            console.log(`Processing ${allBuildings.length} buildings and ${allRoads.length} roads...`);

            // Process buildings
            for (const element of allBuildings) {
                if (element.type === 'way' && element.geometry) {
                    const buildingEntity = this.entityManager.createEntity();
                    const buildingComponent = new BuildingComponent();
                    
                    buildingComponent.footprint = element.geometry.map(point => ({
                        latitude: point.lat,
                        longitude: point.lon
                    }));
                    buildingComponent.height = element.tags?.height || 
                                             element.tags?.['building:levels'] * 3 || 
                                             10;
                    buildingComponent.type = element.tags?.building || 'yes';
                    buildingComponent.properties = element.tags || {};
                    buildingComponent.position = this.calculateCenter(buildingComponent.footprint);

                    this.entityManager.addComponent(buildingEntity, 'building', buildingComponent);
                }
            }

            // Process roads
            for (const element of allRoads) {
                if (element.type === 'way' && element.geometry) {
                    const roadEntity = this.entityManager.createEntity();
                    const roadComponent = new RoadComponent();
                    
                    roadComponent.path = element.geometry.map(point => ({
                        latitude: point.lat,
                        longitude: point.lon
                    }));
                    roadComponent.type = element.tags?.highway || 'road';
                    roadComponent.width = this.getRoadWidth(roadComponent.type);
                    roadComponent.properties = element.tags || {};

                    this.entityManager.addComponent(roadEntity, 'road', roadComponent);
                }
            }

            const totalTime = Date.now() - startTime;
            console.log(`Essential data loaded in ${totalTime}ms`);
            return true;
        } catch (error) {
            console.error('Error loading essential data:', error);
            return false;
        }
    }

    createFallbackBuildings() {
        console.log('Creating fallback buildings');
        const buildings = [];
        
        // Create a grid of 20 buildings around the center
        for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
                // Skip the center for the vehicle spawn area
                if (i === 0 && j === 0) continue;
                
                const centerLat = WorldDataSystem.NAIA_COORDINATES.latitude;
                const centerLon = WorldDataSystem.NAIA_COORDINATES.longitude;
                
                // Offset each building in a grid pattern
                const latOffset = i * 0.001; // ~100m
                const lonOffset = j * 0.001; // ~100m
                
                // Create a building with random height
                const height = 10 + Math.random() * 30; // 10-40m
                const buildingType = ['commercial', 'residential', 'industrial', 'office'][Math.floor(Math.random() * 4)];
                
                // Create a simple rectangular footprint
                const footprintSize = 0.0002 + Math.random() * 0.0003; // Varies the building size
                const building = {
                    type: 'way',
                    geometry: [
                        { lat: centerLat + latOffset - footprintSize, lon: centerLon + lonOffset - footprintSize },
                        { lat: centerLat + latOffset + footprintSize, lon: centerLon + lonOffset - footprintSize },
                        { lat: centerLat + latOffset + footprintSize, lon: centerLon + lonOffset + footprintSize },
                        { lat: centerLat + latOffset - footprintSize, lon: centerLon + lonOffset + footprintSize },
                        { lat: centerLat + latOffset - footprintSize, lon: centerLon + lonOffset - footprintSize } // Close the loop
                    ],
                    tags: {
                        building: buildingType,
                        height: height,
                        'building:levels': Math.ceil(height / 3)
                    }
                };
                
                buildings.push(building);
            }
        }
        
        console.log(`Created ${buildings.length} fallback buildings`);
        return buildings;
    }

    createFallbackRoads() {
        console.log('Creating fallback roads');
        const roads = [];
        
        const centerLat = WorldDataSystem.NAIA_COORDINATES.latitude;
        const centerLon = WorldDataSystem.NAIA_COORDINATES.longitude;
        
        // Create a grid of roads
        // First, create east-west roads
        for (let i = -3; i <= 3; i++) {
            const latOffset = i * 0.001; // ~100m spacing
            const road = {
                type: 'way',
                geometry: [
                    { lat: centerLat + latOffset, lon: centerLon - 0.003 },
                    { lat: centerLat + latOffset, lon: centerLon + 0.003 }
                ],
                tags: {
                    highway: i === 0 ? 'primary' : (Math.abs(i) === 1 ? 'secondary' : 'residential')
                }
            };
            roads.push(road);
        }
        
        // Then, create north-south roads
        for (let j = -3; j <= 3; j++) {
            const lonOffset = j * 0.001; // ~100m spacing
            const road = {
                type: 'way',
                geometry: [
                    { lat: centerLat - 0.003, lon: centerLon + lonOffset },
                    { lat: centerLat + 0.003, lon: centerLon + lonOffset }
                ],
                tags: {
                    highway: j === 0 ? 'primary' : (Math.abs(j) === 1 ? 'secondary' : 'residential')
                }
            };
            roads.push(road);
        }
        
        console.log(`Created ${roads.length} fallback roads`);
        return roads;
    }

    async loadDetailsInBackground(bounds) {
        // Don't load additional details if initial load failed
        if (!this.entityManager.getEntitiesByComponent('building').length) {
            console.warn('No buildings loaded, skipping detail loading');
            return;
        }

        try {
            // Load medium resolution terrain first
            const mediumBounds = {
                ...bounds,
                width: WorldDataSystem.RESOLUTION_LEVELS.MEDIUM.width,
                height: WorldDataSystem.RESOLUTION_LEVELS.MEDIUM.height
            };
            await this.loadTerrainData(mediumBounds);

            // Then load high resolution
            const highBounds = {
                ...bounds,
                width: WorldDataSystem.RESOLUTION_LEVELS.HIGH.width,
                height: WorldDataSystem.RESOLUTION_LEVELS.HIGH.height
            };
            await this.loadTerrainData(highBounds);

            // Only start loading additional buildings/roads after terrain is done
            await this.loadBuildingData(bounds);
            await this.loadRoadData(bounds);

            console.log('Background loading completed');
        } catch (error) {
            console.warn('Error in background loading:', error);
        }
    }

    calculateCenter(points) {
        if (!points || points.length === 0) {
            return { latitude: 0, longitude: 0 };
        }

        const sum = points.reduce((acc, point) => ({
            latitude: acc.latitude + point.latitude,
            longitude: acc.longitude + point.longitude
        }), { latitude: 0, longitude: 0 });

        return {
            latitude: sum.latitude / points.length,
            longitude: sum.longitude / points.length
        };
    }

    async loadBuildingData(bounds) {
        try {
            console.log('Loading building data from OpenStreetMap...');
            
            // Split into smaller chunks and add building type filters
            const chunks = this.splitBounds(bounds, 6); // 6x6 grid = 36 chunks
            console.log(`Split area into ${chunks.length} chunks`);

            let allBuildings = [];
            let processedChunks = 0;
            
            // Process chunks in parallel with limited concurrency
            const CONCURRENT_REQUESTS = 3;
            for (let i = 0; i < chunks.length; i += CONCURRENT_REQUESTS) {
                const chunkPromises = chunks.slice(i, i + CONCURRENT_REQUESTS).map(async (chunk, index) => {
                    console.log(`Processing chunk ${i + index + 1}/${chunks.length}`);
                    try {
                        // Split building requests by type to reduce data size
                        const buildingTypes = [
                            '["building"="residential"]',
                            '["building"="commercial"]',
                            '["building"="industrial"]',
                            '["building"="yes"]'
                        ];

                        for (const filter of buildingTypes) {
                            const buildings = await this.retryRequest(
                                () => this.fetchOSMDataWithFilter(chunk, 'building', [filter])
                            );
                            allBuildings = allBuildings.concat(buildings);
                        }
                    } catch (error) {
                        console.warn(`Failed to load chunk ${i + index + 1}, continuing:`, error);
                    }
                });

                await Promise.all(chunkPromises);
                processedChunks += CONCURRENT_REQUESTS;
                console.log(`Processed ${processedChunks}/${chunks.length} chunks`);
            }

            console.log(`Processing ${allBuildings.length} buildings...`);

            // Process buildings (rest of the code remains the same)
            for (const element of allBuildings) {
                if (element.type === 'way' && element.geometry) {
                    const buildingEntity = this.entityManager.createEntity();
                    const buildingComponent = new BuildingComponent();

                    const footprint = element.geometry.map(point => ({
                        latitude: point.lat,
                        longitude: point.lon
                    }));

                    buildingComponent.footprint = footprint;
                    buildingComponent.height = element.tags?.height || 
                                             element.tags?.['building:levels'] * 3 || 
                                             10;
                    buildingComponent.type = element.tags?.building || 'yes';
                    buildingComponent.properties = element.tags || {};

                    const center = this.calculateCenter(footprint);
                    buildingComponent.position = center;

                    this.entityManager.addComponent(buildingEntity, 'building', buildingComponent);
                }
            }

            console.log('Building data processed successfully');
        } catch (error) {
            console.error('Error loading building data:', error);
            throw error;
        }
    }

    async loadRoadData(bounds) {
        try {
            console.log('Loading road data from OpenStreetMap...');
            
            // Split into smaller chunks and add road type filters
            const chunks = this.splitBounds(bounds, 6); // 6x6 grid = 36 chunks
            console.log(`Split area into ${chunks.length} chunks`);

            let allRoads = [];
            let processedChunks = 0;
            
            // Process chunks in parallel with limited concurrency
            const CONCURRENT_REQUESTS = 3;
            for (let i = 0; i < chunks.length; i += CONCURRENT_REQUESTS) {
                const chunkPromises = chunks.slice(i, i + CONCURRENT_REQUESTS).map(async (chunk, index) => {
                    console.log(`Processing chunk ${i + index + 1}/${chunks.length}`);
                    try {
                        // Split road requests by type to reduce data size
                        const roadTypes = [
                            'motorway',
                            'trunk',
                            'primary',
                            'secondary',
                            'tertiary',
                            'residential',
                            'service'
                        ];

                        for (const roadType of roadTypes) {
                            const roads = await this.retryRequest(
                                () => this.fetchOSMDataWithFilter(chunk, 'highway', [`[~"highway"~"${roadType}"]`])
                            );
                            allRoads = allRoads.concat(roads);
                        }
                    } catch (error) {
                        console.warn(`Failed to load chunk ${i + index + 1}, continuing:`, error);
                    }
                });

                await Promise.all(chunkPromises);
                processedChunks += CONCURRENT_REQUESTS;
                console.log(`Processed ${processedChunks}/${chunks.length} chunks`);
            }

            console.log(`Processing ${allRoads.length} roads...`);

            // Process roads
            for (const element of allRoads) {
                if (element.type === 'way' && element.geometry) {
                    const roadEntity = this.entityManager.createEntity();
                    const roadComponent = new RoadComponent();
                    
                    roadComponent.path = element.geometry.map(point => ({
                        latitude: point.lat,
                        longitude: point.lon
                    }));
                    roadComponent.type = element.tags?.highway || 'road';
                    roadComponent.width = this.getRoadWidth(roadComponent.type);
                    roadComponent.properties = element.tags || {};

                    this.entityManager.addComponent(roadEntity, 'road', roadComponent);
                }
            }

            console.log('Road data processed successfully');
        } catch (error) {
            console.error('Error loading road data:', error);
            throw error;
        }
    }

    getRoadWidth(roadType) {
        // Default road widths in meters
        const roadWidths = {
            motorway: 16,
            trunk: 14,
            primary: 12,
            secondary: 10,
            tertiary: 8,
            residential: 6,
            service: 4,
            default: 8
        };

        return roadWidths[roadType] || roadWidths.default;
    }

    update(deltaTime) {
        // Handle world data updates
        // This could include terrain streaming, data updates, etc.
    }

    cleanup() {
        // Clean up Cesium resources
        this.terrainProvider = undefined;
        this.imageryProvider = undefined;
    }

    startBackgroundLoading() {
        if (!this.pendingBackgroundLoad) {
            console.warn('No pending background load');
            return;
        }

        const bounds = this.pendingBackgroundLoad;
        this.pendingBackgroundLoad = null; // Clear it so we don't start multiple times

        // Start background loading in a non-blocking way
        setTimeout(() => {
            this.loadDetailsInBackground(bounds).catch(error => {
                console.warn('Background loading error:', error);
            });
        }, 2000); // Wait 2 seconds after game is running before starting background load
    }
}