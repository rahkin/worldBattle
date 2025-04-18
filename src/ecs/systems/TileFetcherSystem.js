import { System } from '../System.js';
import VectorTile from '@mapbox/vector-tile';
import Pbf from 'pbf';
import * as turf from '@turf/turf';

export class TileFetcherSystem extends System {
    constructor(world) {
        super(world);
        this.tileCache = new Map();
        this.pendingRequests = new Map();
        this.tileSize = 4096; // Standard Mapbox tile size
        this.maxZoom = 14; // Maximum zoom level for building details
    }

    async fetchTile(x, y, z) {
        const cacheKey = `${x}/${y}/${z}`;
        
        // Return cached tile if available
        if (this.tileCache.has(cacheKey)) {
            return this.tileCache.get(cacheKey);
        }

        // Return pending promise if request is in progress
        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }

        // Create new request
        const request = this._fetchTileData(x, y, z)
            .then(data => {
                const tile = new VectorTile(new Pbf(data));
                this.tileCache.set(cacheKey, tile);
                this.pendingRequests.delete(cacheKey);
                return tile;
            })
            .catch(error => {
                console.error(`Failed to fetch tile ${cacheKey}:`, error);
                this.pendingRequests.delete(cacheKey);
                throw error;
            });

        this.pendingRequests.set(cacheKey, request);
        return request;
    }

    async _fetchTileData(x, y, z) {
        const mapboxToken = process.env.VITE_MAPBOX_TOKEN;
        const styleId = 'mapbox.mapbox-streets-v8';
        const url = `https://api.mapbox.com/v4/${styleId}/${z}/${x}/${y}.mvt?access_token=${mapboxToken}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.arrayBuffer();
    }

    getTilesInRadius(centerLngLat, radiusKm) {
        const bbox = turf.bbox(turf.buffer(
            turf.point(centerLngLat),
            radiusKm,
            { units: 'kilometers' }
        ));

        const tiles = [];
        const minZoom = 10; // Minimum zoom level for world generation
        
        for (let z = minZoom; z <= this.maxZoom; z++) {
            const topLeft = this._lngLatToTile(bbox[0], bbox[3], z);
            const bottomRight = this._lngLatToTile(bbox[2], bbox[1], z);
            
            for (let x = topLeft.x; x <= bottomRight.x; x++) {
                for (let y = topLeft.y; y <= bottomRight.y; y++) {
                    tiles.push({ x, y, z });
                }
            }
        }

        return tiles;
    }

    _lngLatToTile(lng, lat, zoom) {
        const n = Math.pow(2, zoom);
        const x = Math.floor((lng + 180) / 360 * n);
        const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
        return { x, y };
    }

    update(deltaTime) {
        // Clean up old cache entries if needed
        if (this.tileCache.size > 1000) {
            const entriesToRemove = Array.from(this.tileCache.entries())
                .slice(0, 200);
            entriesToRemove.forEach(([key]) => this.tileCache.delete(key));
        }
    }
} 