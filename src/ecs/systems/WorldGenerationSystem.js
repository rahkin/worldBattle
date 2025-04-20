import { System } from '../core/System.js';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class WorldGenerationSystem extends System {
    constructor(world) {
        super(world);
        this.tileFetcher = null;
        this.featureParser = null;
        this.generationRadius = 5000; // 5km in meters
        this.loadedTiles = new Set();
        this.generationQueue = [];
        this.isGenerating = false;
    }

    init() {
        this.tileFetcher = this.world.getSystem('TileFetcherSystem');
        this.featureParser = this.world.getSystem('FeatureParserSystem');
    }

    setPlayerPosition(lngLat) {
        this.playerPosition = lngLat;
        this._scheduleWorldGeneration();
    }

    _scheduleWorldGeneration() {
        if (!this.playerPosition) return;

        const tiles = this.tileFetcher.getTilesInRadius(
            this.playerPosition,
            this.generationRadius / 1000 // Convert to kilometers
        );

        // Add new tiles to generation queue
        tiles.forEach(tile => {
            const tileKey = `${tile.x}/${tile.y}/${tile.z}`;
            if (!this.loadedTiles.has(tileKey)) {
                this.generationQueue.push(tile);
                this.loadedTiles.add(tileKey);
            }
        });

        // Start generation if not already running
        if (!this.isGenerating) {
            this._processGenerationQueue();
        }
    }

    async _processGenerationQueue() {
        this.isGenerating = true;

        while (this.generationQueue.length > 0) {
            const tile = this.generationQueue.shift();
            
            try {
                const vectorTile = await this.tileFetcher.fetchTile(tile.x, tile.y, tile.z);
                const entities = this.featureParser.parseFeatures(
                    vectorTile,
                    tile.x,
                    tile.y,
                    tile.z
                );

                // Add entities to world
                entities.forEach(entity => {
                    this.world.addEntity(entity);
                });

                // Process a few tiles per frame to avoid freezing
                await new Promise(resolve => setTimeout(resolve, 0));
            } catch (error) {
                console.error(`Failed to generate tile ${tile.x}/${tile.y}/${tile.z}:`, error);
            }
        }

        this.isGenerating = false;
    }

    update(deltaTime) {
        // Check if player has moved significantly
        if (this.playerPosition && this.lastPlayerPosition) {
            const distance = this._calculateDistance(
                this.playerPosition,
                this.lastPlayerPosition
            );

            if (distance > 100) { // Regenerate if moved more than 100 meters
                this._scheduleWorldGeneration();
            }
        }

        this.lastPlayerPosition = this.playerPosition;
    }

    _calculateDistance(pos1, pos2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = pos1[1] * Math.PI / 180;
        const φ2 = pos2[1] * Math.PI / 180;
        const Δφ = (pos2[1] - pos1[1]) * Math.PI / 180;
        const Δλ = (pos2[0] - pos1[0]) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    _projectToGameSpace(lngLat) {
        // Convert longitude/latitude to local game space coordinates
        // This is a simplified projection - you might want to use a proper
        // map projection library for more accurate results
        const R = 6371e3; // Earth's radius in meters
        const x = R * Math.cos(lngLat[1] * Math.PI / 180) * Math.sin(lngLat[0] * Math.PI / 180);
        const z = R * Math.sin(lngLat[1] * Math.PI / 180);
        return new THREE.Vector3(x, 0, z);
    }
} 