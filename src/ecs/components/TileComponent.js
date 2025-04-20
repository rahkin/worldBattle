import { Component } from '../core/Component.js';

export class TileComponent extends Component {
    constructor() {
        super();
        this.tileX = 0;
        this.tileY = 0;
        this.zoom = 0;
        this.features = new Map(); // Map of feature IDs to their data
        this.bounds = null; // Tile bounds in game space
        this.isLoaded = false;
        this.isVisible = false;
        this.lastUpdate = 0;
    }

    init(tileX, tileY, zoom) {
        this.tileX = tileX;
        this.tileY = tileY;
        this.zoom = zoom;
        this.isLoaded = false;
        this.isVisible = false;
        this.lastUpdate = Date.now();
    }

    addFeature(featureId, featureData) {
        this.features.set(featureId, featureData);
    }

    removeFeature(featureId) {
        this.features.delete(featureId);
    }

    getFeature(featureId) {
        return this.features.get(featureId);
    }

    setBounds(minX, minY, maxX, maxY) {
        this.bounds = {
            min: { x: minX, y: minY },
            max: { x: maxX, y: maxY }
        };
    }

    isInView(camera, viewDistance) {
        if (!this.bounds) return false;

        // Simple distance check from camera to tile center
        const centerX = (this.bounds.min.x + this.bounds.max.x) / 2;
        const centerY = (this.bounds.min.y + this.bounds.max.y) / 2;
        const distance = Math.sqrt(
            Math.pow(camera.position.x - centerX, 2) +
            Math.pow(camera.position.z - centerY, 2)
        );

        return distance <= viewDistance;
    }

    update() {
        this.lastUpdate = Date.now();
    }

    dispose() {
        this.features.clear();
        this.bounds = null;
        this.isLoaded = false;
        this.isVisible = false;
    }
} 