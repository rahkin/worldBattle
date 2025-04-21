import { System } from '../../System.js';
import Pbf from 'pbf';
import * as turf from '@turf/turf';
import { geographicToWorld } from '../../../utils/geographicToWorld.js';

export class TileFetcherSystem extends System {
    constructor(world) {
        super(world);
        this.tileCache = new Map();
        this.pendingRequests = new Map();
        this.tileSize = 4096; // Standard Mapbox tile size
        this.minZoom = 14; // Minimum zoom level for building details
        this.maxZoom = 15; // Maximum zoom level for building details
        this.radiusKm = 5; // Radius in kilometers
        this.origin = [120.9822, 14.5086]; // NAIA coordinates
        
        // Validate Mapbox token
        this.mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
        if (!this.mapboxToken) {
            console.error('Mapbox token is not set in environment variables. Please add VITE_MAPBOX_TOKEN to your .env file');
        }
    }

    async initialize() {
        console.log('Initializing TileFetcherSystem...');
        // No additional initialization needed
        return Promise.resolve();
    }

    _safeReadVarint(pbf) {
        try {
            let bytesRead = 0;
            let result = 0;
            let shift = 0;
            
            while (bytesRead < 10) { // Maximum 10 bytes for varint
                const byte = pbf.readVarint();
                if (byte === undefined) break;
                
                result |= (byte & 0x7f) << shift;
                if ((byte & 0x80) === 0) {
                    return result;
                }
                shift += 7;
                bytesRead++;
            }
            
            // If we get here, we either hit the max bytes or got undefined
            console.warn('Varint parsing reached maximum bytes or undefined value');
            return 0; // Return 0 instead of throwing
        } catch (error) {
            console.warn('Failed to read varint:', error.message);
            return 0; // Return 0 instead of throwing
        }
    }

    _safeReadString(pbf) {
        try {
            return pbf.readString();
        } catch (e) {
            console.warn('Failed to read string:', e);
            // Skip to next valid position
            pbf.pos = Math.min(pbf.pos + 1, pbf.length);
            return '';
        }
    }

    _safeReadSVarint(pbf) {
        try {
            let bytesRead = 0;
            let result = 0;
            let shift = 0;
            
            while (bytesRead < 10) { // Maximum 10 bytes for varint
                const byte = pbf.readVarint();
                if (byte === undefined) break;
                
                result |= (byte & 0x7f) << shift;
                if ((byte & 0x80) === 0) {
                    // Convert to signed
                    return (result >> 1) ^ -(result & 1);
                }
                shift += 7;
                bytesRead++;
            }
            
            console.warn('Signed varint parsing reached maximum bytes or undefined value');
            return 0;
        } catch (error) {
            console.warn('Failed to read signed varint:', error.message);
            return 0;
        }
    }

    _validateLength(pbf, length, maxLength, context) {
        if (length <= 0) {
            console.warn(`Invalid ${context} length: ${length} (must be positive)`);
            return false;
        }
        
        // Calculate remaining buffer size
        const remainingBuffer = pbf.length - pbf.pos;
        if (remainingBuffer <= 0) {
            return false;
        }
        
        // Use more lenient maximums based on context
        let effectiveMaxLength = remainingBuffer;
        if (context === 'geometry') {
            effectiveMaxLength = Math.min(100000, remainingBuffer); // Much more lenient for geometry
        } else if (context === 'tags') {
            effectiveMaxLength = Math.min(10000, remainingBuffer); // More lenient for tags
        } else if (context === 'layer') {
            effectiveMaxLength = Math.min(1000000, remainingBuffer); // Very lenient for layers
        }
        
        if (length > effectiveMaxLength) {
            console.warn(`Large ${context} length: ${length}, truncating to ${effectiveMaxLength}`);
            return effectiveMaxLength;
        }
        
        return length;
    }

    async fetchTile(x, y, z) {
        const tileKey = `${z}/${x}/${y}`;
        console.log(`\n=== Fetching Tile ${tileKey} ===`);

        try {
            // Check cache first
            if (this.tileCache.has(tileKey)) {
                console.log('Returning cached tile data');
                return this.tileCache.get(tileKey);
            }

            const data = await this._fetchTileData(x, y, z);
            if (!data) {
                console.warn('No data received for tile');
                return {};
            }

            console.log(`Processing tile ${tileKey} (${data.byteLength} bytes)`);

            const pbf = new Pbf(data);
            const layers = {};
            let featuresProcessed = 0;

            while (pbf.pos < pbf.length) {
                const val = this._safeReadVarint(pbf);
                const tag = val >> 3;

                if (tag === 3) { // Layer tag
                    const layer = this._readLayer(pbf);
                    if (layer && layer.name && layer.features.length > 0) {
                        // Map corrupted layer names to correct ones
                        let cleanName = layer.name.toLowerCase().replace(/[^\x20-\x7E]/g, '').trim();
                        if (cleanName.includes('uilding')) cleanName = 'building';
                        else if (cleanName.includes('ighway') || cleanName.includes('oad')) cleanName = 'road';
                        else if (cleanName.includes('anduse')) cleanName = 'landuse';
                        else if (cleanName.includes('ater')) cleanName = 'water';

                        // Only process layers we're interested in
                        if (['building', 'road', 'landuse', 'water'].includes(cleanName)) {
                            const validFeatures = layer.features.filter(f => f && f.geometry && f.geometry.length > 0);
                            if (validFeatures.length > 0) {
                                layers[cleanName] = validFeatures.map(feature => ({
                                    ...feature,
                                    type: cleanName,
                                    properties: feature.properties || {}
                                }));
                                featuresProcessed += validFeatures.length;
                                console.log(`Found ${validFeatures.length} valid features in ${cleanName} layer`);
                            }
                        }
                    }
                } else {
                    pbf.skip();
                }
            }

            if (featuresProcessed > 0) {
                console.log(`Successfully processed ${featuresProcessed} features from tile ${tileKey}`);
                this.tileCache.set(tileKey, layers);
                return layers;
            } else {
                console.warn(`No valid features found in tile ${tileKey}`);
                return {};
            }
        } catch (error) {
            console.error(`Failed to fetch/process tile ${tileKey}:`, error);
            return {};
        }
    }

    async _fetchTileData(x, y, z) {
        if (!this.mapboxToken) {
            throw new Error('Mapbox token is not set. Please add VITE_MAPBOX_TOKEN to your .env file');
        }

        const url = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/${z}/${x}/${y}.vector.pbf?access_token=${this.mapboxToken}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.arrayBuffer();
        } catch (error) {
            console.error(`Failed to fetch tile data: ${error.message}`);
            return null;
        }
    }

    _readLayer(pbf) {
        const layerLength = this._safeReadVarint(pbf);
        if (!this._validateLength(pbf, layerLength, pbf.length, 'layer')) {
            return null;
        }

        const endPos = pbf.pos + layerLength;
        const layer = {
            name: '',
            features: [],
            keys: [],
            values: [],
            extent: 4096
        };

        while (pbf.pos < endPos) {
            const val = this._safeReadVarint(pbf);
            const tag = val >> 3;

            switch (tag) {
                case 1: // name
                    layer.name = this._safeReadString(pbf);
                    break;
                case 2: // features
                    const feature = this._readFeature(pbf, layer);
                    if (feature) {
                        layer.features.push(feature);
                    }
                    break;
                case 3: // keys
                    const key = this._safeReadString(pbf);
                    if (key) {
                        layer.keys.push(key);
                    }
                    break;
                case 4: // values
                    layer.values.push(this._readValue(pbf));
                    break;
                case 5: // extent
                    layer.extent = this._safeReadVarint(pbf);
                    break;
                default:
                    pbf.skip();
            }
        }

        return layer;
    }

    _readFeature(pbf, layer) {
        try {
            const feature = {
                type: 'unknown',
                geometry: [],
                properties: {}
            };

            const featureLength = this._safeReadVarint(pbf);
            const validLength = this._validateLength(pbf, featureLength, pbf.length, 'feature');
            if (!validLength) {
                return null;
            }

            const endPos = pbf.pos + validLength;
            while (pbf.pos < endPos) {
                const val = this._safeReadVarint(pbf);
                const tag = val >> 3;

                switch (tag) {
                    case 1: // id
                        feature.id = this._safeReadVarint(pbf);
                        break;
                    case 2: // tags
                        const tagLength = this._safeReadVarint(pbf);
                        const validTagLength = this._validateLength(pbf, tagLength, endPos - pbf.pos, 'tags');
                        if (!validTagLength) {
                            pbf.pos = endPos;
                            break;
                        }
                        const tags = [];
                        const tagEnd = pbf.pos + validTagLength;
                        while (pbf.pos < tagEnd) {
                            const keyIndex = this._safeReadVarint(pbf);
                            const valueIndex = this._safeReadVarint(pbf);
                            if (keyIndex !== undefined && valueIndex !== undefined &&
                                layer.keys[keyIndex] && layer.values[valueIndex] !== undefined) {
                                const key = layer.keys[keyIndex];
                                const value = layer.values[valueIndex];
                                feature.properties[key] = value;
                            }
                        }
                        break;
                    case 3: // type
                        const typeId = this._safeReadVarint(pbf);
                        switch (typeId) {
                            case 1:
                                feature.type = 'point';
                                break;
                            case 2:
                                feature.type = 'linestring';
                                break;
                            case 3:
                                feature.type = 'polygon';
                                break;
                            default:
                                feature.type = 'unknown';
                        }
                        break;
                    case 4: // geometry
                        const geomLength = this._safeReadVarint(pbf);
                        const validGeomLength = this._validateLength(pbf, geomLength, endPos - pbf.pos, 'geometry');
                        if (!validGeomLength) {
                            pbf.pos = endPos;
                            break;
                        }
                        const geomEnd = pbf.pos + validGeomLength;
                        const commands = [];
                        let x = 0, y = 0;

                        while (pbf.pos < geomEnd) {
                            try {
                                const cmd = this._safeReadVarint(pbf);
                                const cmdId = cmd & 0x7;
                                const cmdCount = cmd >> 3;

                                if ((cmdId === 1 || cmdId === 2) && cmdCount > 0 && cmdCount < 100000) { // MoveTo or LineTo with reasonable count
                                    for (let i = 0; i < cmdCount && pbf.pos < geomEnd; i++) {
                                        const dx = this._safeReadSVarint(pbf);
                                        const dy = this._safeReadSVarint(pbf);
                                        if (dx !== undefined && dy !== undefined) {
                                            x += dx;
                                            y += dy;
                                            commands.push([x, y]);
                                        }
                                    }
                                } else if (cmdId === 7) { // ClosePath
                                    if (commands.length > 0) {
                                        commands.push([commands[0][0], commands[0][1]]);
                                    }
                                }
                            } catch (error) {
                                console.warn('Error processing geometry command:', error);
                                break;
                            }
                        }
                        if (commands.length > 0) {
                            feature.geometry.push(commands);
                        }
                        break;
                    default:
                        pbf.skip();
                }
            }

            // Only return features with valid geometry
            if (feature.geometry.length > 0 && feature.geometry[0].length >= 3) {
                // Determine feature type from properties if it's a polygon
                if (feature.type === 'polygon') {
                    if (feature.properties.building) {
                        feature.type = 'building';
                    } else if (feature.properties.landuse) {
                        feature.type = 'landuse';
                    } else if (feature.properties.natural) {
                        feature.type = 'natural';
                    } else if (feature.properties.water) {
                        feature.type = 'water';
                    }
                } else if (feature.type === 'linestring' && feature.properties.highway) {
                    feature.type = 'road';
                }
                return feature;
            }
            return null;
        } catch (error) {
            console.warn('Error reading feature:', error);
            return null;
        }
    }

    _readValue(pbf) {
        try {
            const val = this._safeReadVarint(pbf);
            const tag = val >> 3;

            switch (tag) {
                case 1: return this._safeReadString(pbf);
                case 2: return pbf.readFloat();
                case 3: return pbf.readDouble();
                case 4: return pbf.readVarint64();
                case 5: return this._safeReadVarint(pbf);
                case 6: return this._safeReadSVarint(pbf);
                case 7: return pbf.readBoolean();
                default: return null;
            }
        } catch (e) {
            console.warn('Failed to parse value:', e);
            return null;
        }
    }

    getTilesInRadius(centerLngLat = this.origin) {
        const bbox = turf.bbox(turf.buffer(
            turf.point(centerLngLat),
            this.radiusKm,
            { units: 'kilometers' }
        ));

        const tiles = [];
        // For 5km radius, we need zoom levels 15-16 to get building data
        for (let z = this.minZoom; z <= this.maxZoom; z++) {
            console.log(`\nCalculating tiles for zoom level ${z}...`);
            const topLeft = this._lngLatToTile(bbox[0], bbox[3], z);
            const bottomRight = this._lngLatToTile(bbox[2], bbox[1], z);
            
            // Add a small buffer to ensure we get all tiles at the edges
            const buffer = 1;
            let tileCount = 0;
            for (let x = topLeft.x - buffer; x <= bottomRight.x + buffer; x++) {
                for (let y = topLeft.y - buffer; y <= bottomRight.y + buffer; y++) {
                    // Only add tiles that are within the radius
                    const tileCenter = this._tileToLngLat(x + 0.5, y + 0.5, z);
                    const distance = this._calculateDistance(centerLngLat, tileCenter);
                    if (distance <= this.radiusKm * 1000) { // Convert km to meters
                    tiles.push({ x, y, z });
                        tileCount++;
                    }
                }
            }
            console.log(`Found ${tileCount} tiles at zoom level ${z}`);
        }

        console.log(`Total tiles to fetch: ${tiles.length}`);
        return tiles;
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

    _lngLatToTile(lng, lat, zoom) {
        const n = Math.pow(2, zoom);
        const x = Math.floor((lng + 180) / 360 * n);
        const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
        return { x, y };
    }

    _tileToLngLat(x, y, z) {
        const n = Math.pow(2, z);
        const lng = x / n * 360 - 180;
        const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
        return [lng, lat];
    }

    update(deltaTime) {
        // Clean up old cache entries if needed
        if (this.tileCache.size > 1000) {
            const entriesToRemove = Array.from(this.tileCache.entries())
                .slice(0, 200);
            entriesToRemove.forEach(([key]) => this.tileCache.delete(key));
        }
    }

    async request(tile) {
        try {
            const response = await fetch(this._getTileUrl(tile));
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.arrayBuffer();
            if (!(data instanceof ArrayBuffer)) {
                throw new Error('Invalid data received');
            }
            
            const pbf = new Pbf(data);
            const tileData = pbf.readFields(this._readTile, {});
            
            if (!tileData || typeof tileData !== 'object') {
                throw new Error('Invalid tile data structure');
            }
            
            return tileData;
        } catch (error) {
            console.error(`Failed to fetch tile ${tile.z}/${tile.x}/${tile.y}:`, error.message);
            return null;
        }
    }

    _readTile(tag, tile, pbf) {
        if (tag === 3) { // layer
            const layer = {
                version: 0,
                name: '',
                features: [],
                keys: [],
                values: [],
                extent: 4096
            };

            const layerLength = this._safeReadVarint(pbf);
            if (!this._validateLength(pbf, layerLength, pbf.length, 'layer')) {
                return;
            }

            const endPos = pbf.pos + layerLength;
            pbf.readFields(this._readLayer, layer, tag);
            
            // Validate layer data
            if (!layer.name || !Array.isArray(layer.features)) {
                console.warn(`Invalid layer data for tile ${tile.z}/${tile.x}/${tile.y}`);
                return;
            }

            // Validate feature lengths
            const validFeatures = [];
            for (const feature of layer.features) {
                if (feature && typeof feature === 'object' && 
                    Array.isArray(feature.geometry) && 
                    feature.geometry.length > 0) {
                    validFeatures.push(feature);
                } else {
                    console.warn(`Invalid feature length for tile ${tile.z}/${tile.x}/${tile.y}`);
                }
            }
            layer.features = validFeatures;

            if (!tile.layers) {
                tile.layers = {};
            }
            tile.layers[layer.name] = layer;
        }
    }
} 