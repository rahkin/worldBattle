import { System } from '../../System.js';
import { geographicToWorld } from '../../../utils/geographicToWorld.js';
import { LoadingComponent } from '../../components/LoadingComponent.js';
import { TerrainComponent } from '../../components/TerrainComponent.js';
import * as THREE from 'three';

export class WorldManager extends System {
    constructor(world) {
        super(world);
        
        // Get references to required systems
        this.tileFetcher = null;
        this.featureParser = null;
        this.worldGenerator = null;
        
        this.currentOrigin = [120.9822, 14.5086]; // NAIA coordinates
        this.loadedTiles = new Set();
        this.generatedEntities = new Set();
        
        // Create loading entity
        this.loadingEntity = world.createEntity();
        this.loadingEntity.addComponent('LoadingComponent', new LoadingComponent());
        
        // Track loading state
        this.isWorldLoaded = false;
        this.loadingStages = {
            tiles: { completed: false, message: 'Fetching map tiles...' },
            terrain: { completed: false, message: 'Generating terrain...' },
            buildings: { completed: false, message: 'Constructing buildings...' },
            roads: { completed: false, message: 'Building roads...' },
            landuse: { completed: false, message: 'Generating land features...' },
            water: { completed: false, message: 'Generating water bodies...' }
        };
    }

    async startWorldGeneration() {
        try {
            await this.generateWorld(this.currentOrigin);
        } catch (error) {
            console.error('Failed to start world generation:', error);
            throw error;
        }
    }

    async initialize() {
        // Get system references
        this.tileFetcher = this.world.getSystem('TileFetcherSystem');
        this.featureParser = this.world.getSystem('FeatureParserSystem');
        this.worldGenerator = this.world.getSystem('WorldGenerationSystem');
        
        if (!this.tileFetcher || !this.featureParser || !this.worldGenerator) {
            throw new Error('Required systems not found. Make sure all systems are registered before initializing WorldManager');
        }

        // Get or create terrain entity
        this.terrainEntity = this.getTerrainEntity();
        if (!this.terrainEntity) {
            this.terrainEntity = this.world.createEntity();
            const terrainComponent = new TerrainComponent();
            this.terrainEntity.addComponent('TerrainComponent', terrainComponent);
            
            // Initialize terrain with flat ground
            for (let x = -50; x <= 50; x++) {
                for (let z = -50; z <= 50; z++) {
                    terrainComponent.setHeightAt(new THREE.Vector2(x, z), 0);
                }
            }
        }

        await this.generateWorld(this.currentOrigin);
    }

    getTerrainEntity() {
        const entities = Array.from(this.world.entities.values());
        return entities.find(entity => entity.hasComponent('TerrainComponent'));
    }

    async teleportTo(lngLat) {
        // Clean up existing entities
        this.cleanupWorld();
        
        // Update origin and regenerate world
        this.currentOrigin = lngLat;
        await this.generateWorld(lngLat);
    }

    async generateWorld(origin) {
        console.log('\n=== Starting World Generation ===');
        console.log('Origin:', origin);
        
        try {
            // Initialize systems if needed
            if (!this.tileFetcher || !this.worldGenerator) {
                console.log('Initializing required systems...');
                await this.initialize();
            }

            // Reset loading stages
            this.loadingStages = {};

            // Get tiles in radius
            const tiles = this.tileFetcher.getTilesInRadius(origin);
            console.log(`Found ${tiles.length} tiles to process`);

            let totalEntities = 0;
            for (const tile of tiles) {
                console.log(`\nProcessing tile ${tile.z}/${tile.x}/${tile.y}`);
                try {
                    const layers = await this.tileFetcher.fetchTile(tile.x, tile.y, tile.z);
                    if (layers && Object.keys(layers).length > 0) {
                        const entities = await this.processLayers(tile, layers);
                        totalEntities += entities.length;
                        console.log(`✓ Generated ${entities.length} entities for tile`);
                    } else {
                        console.warn('No layers found in tile');
                    }
                } catch (error) {
                    console.error(`Failed to process tile ${tile.z}/${tile.x}/${tile.y}:`, error);
                }
            }

            console.log('\n=== World Generation Complete ===');
            console.log(`✓ Generated ${totalEntities} total entities`);
            
            return true;
        } catch (error) {
            console.error('Failed to generate world:', error);
            return false;
        }
    }

    async processLayers(tile, layers) {
        console.log(`\n=== Processing Layers for Tile ${tile.z}/${tile.x}/${tile.y} ===`);
        const entities = [];
        const layerMapping = {
            'building': 'buildings',
            'road': 'roads',
            'landuse': 'landuse',
            'water': 'water'
        };

        try {
            for (const [layerName, features] of Object.entries(layers)) {
                console.log(`\nProcessing layer: ${layerName}`);
                console.log(`Found ${features.length} features`);

                // Map layer name to standard type
                const standardLayerName = layerMapping[layerName] || layerName;
                console.log(`Mapped layer name: ${standardLayerName}`);

                // Create loading stage if it doesn't exist
                if (!this.loadingStages[standardLayerName]) {
                    this.loadingStages[standardLayerName] = {
                        total: 0,
                        processed: 0,
                        failed: 0,
                        success: 0
                    };
                }

                // Update loading stage
                this.loadingStages[standardLayerName].total += features.length;

                // Filter and prepare features
                const validFeatures = features.filter(feature => {
                    if (!feature || !feature.geometry || !feature.geometry.length) {
                        console.warn('Skipping feature: No geometry');
                        this.loadingStages[standardLayerName].failed++;
                        return false;
                    }
                    return true;
                }).map(feature => ({
                    ...feature,
                    type: standardLayerName,
                    tileCoords: {
                        x: tile.x,
                        y: tile.y,
                        z: tile.z
                    }
                }));

                console.log(`Valid features for processing: ${validFeatures.length}`);

                if (validFeatures.length > 0) {
                    try {
                        console.log(`Generating entities for ${standardLayerName}...`);
                        const layerEntities = await this.worldGenerator.generateEntities(validFeatures, standardLayerName);
                        console.log(`Generated ${layerEntities.length} entities for ${standardLayerName}`);
                        
                        // Update success count
                        this.loadingStages[standardLayerName].success += layerEntities.length;
                        this.loadingStages[standardLayerName].processed += validFeatures.length;
                        
                        entities.push(...layerEntities);
                        
                        // Log entity details
                        layerEntities.forEach((entity, index) => {
                            const position = entity.getComponent('PositionComponent');
                            const mesh = entity.getComponent('MeshComponent');
                            console.log(`Entity ${index + 1}:`, {
                                id: entity.id,
                                type: standardLayerName,
                                hasPosition: !!position,
                                position: position ? { x: position.x, y: position.y, z: position.z } : null,
                                hasMesh: !!mesh,
                                isVisible: mesh ? mesh.mesh.visible : false
                            });
                        });
                    } catch (error) {
                        console.error(`Failed to generate entities for ${standardLayerName}:`, error);
                        this.loadingStages[standardLayerName].failed += validFeatures.length;
                        this.loadingStages[standardLayerName].processed += validFeatures.length;
                    }
                }
            }

            console.log('\n=== Layer Processing Summary ===');
            Object.entries(this.loadingStages).forEach(([layer, stats]) => {
                console.log(`${layer}:`, {
                    total: stats.total,
                    processed: stats.processed,
                    success: stats.success,
                    failed: stats.failed,
                    successRate: `${((stats.success / stats.total) * 100).toFixed(2)}%`
                });
            });

            return entities;
        } catch (error) {
            console.error('Error processing layers:', error);
            return [];
        }
    }

    cleanupWorld() {
        // Remove all generated entities except terrain
        for (const entity of this.generatedEntities) {
            if (entity !== this.terrainEntity) {
                this.world.removeEntity(entity);
            }
        }
        this.generatedEntities.clear();
        this.loadedTiles.clear();
        
        // Reset loading status
        const loadingComponent = this.loadingEntity.getComponent('LoadingComponent');
        loadingComponent.status = 'idle';
        loadingComponent.message = '';
    }

    getCurrentOrigin() {
        return this.currentOrigin;
    }

    getWorldPosition(lngLat) {
        return geographicToWorld(lngLat, this.currentOrigin);
    }

    getGeographicPosition(worldPos) {
        const [x, z] = worldPos;
        const scale = 111319.9;
        const lng = (x / scale) + this.currentOrigin[0];
        const lat = (-z / scale) + this.currentOrigin[1];
        return [lng, lat];
    }

    update(deltaTime) {
        // System update logic if needed
    }

    isWorldGenerationComplete() {
        return this.isWorldLoaded;
    }

    getLoadingStatus() {
        const loadingComponent = this.loadingEntity.getComponent('LoadingComponent');
        return {
            status: loadingComponent.status,
            message: loadingComponent.message,
            progress: loadingComponent.progress,
            stages: this.loadingStages
        };
    }
} 