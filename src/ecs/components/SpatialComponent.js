import { Component } from '../core/Component.js';
import * as THREE from 'three';

export class SpatialComponent extends Component {
    constructor() {
        super();
        this.bounds = null;
        this.quadrant = null;
        this.isVisible = false;
        this.lastUpdate = 0;
        this.lodLevel = 0;
        this.maxLodLevel = 3;
        this.updateInterval = 1000; // Update every second
    }

    init(bounds) {
        this.bounds = bounds;
        this.quadrant = null;
        this.isVisible = false;
        this.lastUpdate = Date.now();
        this.lodLevel = 0;
    }

    update(deltaTime) {
        const now = Date.now();
        if (now - this.lastUpdate >= this.updateInterval) {
            this._updateVisibility();
            this._updateLod();
            this.lastUpdate = now;
        }
    }

    _updateVisibility() {
        const entity = this.getEntity();
        if (!entity.hasComponent('Mesh')) return;

        const mesh = entity.getComponent('Mesh').mesh;
        const camera = this.world.getSystem('CameraSystem').camera;
        const viewDistance = this.world.getSystem('SpatialIndexSystem').viewDistance;

        // Check if mesh is in view frustum
        const frustum = new THREE.Frustum();
        frustum.setFromProjectionMatrix(
            new THREE.Matrix4().multiplyMatrices(
                camera.projectionMatrix,
                camera.matrixWorldInverse
            )
        );

        const box = new THREE.Box3().setFromObject(mesh);
        this.isVisible = frustum.intersectsBox(box);

        // Check distance from camera
        const distance = mesh.position.distanceTo(camera.position);
        this.isVisible = this.isVisible && distance <= viewDistance;
    }

    _updateLod() {
        if (!this.isVisible) {
            this.lodLevel = 0;
            return;
        }

        const entity = this.getEntity();
        if (!entity.hasComponent('Mesh')) return;

        const mesh = entity.getComponent('Mesh').mesh;
        const camera = this.world.getSystem('CameraSystem').camera;
        const distance = mesh.position.distanceTo(camera.position);

        // Calculate LOD level based on distance
        const viewDistance = this.world.getSystem('SpatialIndexSystem').viewDistance;
        const distanceRatio = distance / viewDistance;
        
        this.lodLevel = Math.floor(distanceRatio * this.maxLodLevel);
        this.lodLevel = Math.min(this.maxLodLevel, Math.max(0, this.lodLevel));

        // Apply LOD to mesh
        this._applyLodToMesh(mesh);
    }

    _applyLodToMesh(mesh) {
        // This is a placeholder for LOD implementation
        // You would typically switch between different levels of detail
        // or adjust mesh complexity based on the LOD level
        switch (this.lodLevel) {
            case 0: // Highest detail
                mesh.visible = true;
                if (mesh.geometry) {
                    mesh.geometry.computeVertexNormals();
                }
                break;
            case 1: // Medium detail
                mesh.visible = true;
                if (mesh.geometry) {
                    mesh.geometry.computeVertexNormals();
                }
                break;
            case 2: // Low detail
                mesh.visible = true;
                if (mesh.geometry) {
                    mesh.geometry.computeVertexNormals();
                }
                break;
            case 3: // Lowest detail or invisible
                mesh.visible = false;
                break;
        }
    }

    getQuadrant() {
        return this.quadrant;
    }

    setQuadrant(quadrant) {
        this.quadrant = quadrant;
    }

    isInRadius(position, radius) {
        if (!this.bounds) return false;

        const center = new THREE.Vector2(
            (this.bounds.min.x + this.bounds.max.x) / 2,
            (this.bounds.min.y + this.bounds.max.y) / 2
        );

        const distance = Math.sqrt(
            Math.pow(position.x - center.x, 2) +
            Math.pow(position.z - center.y, 2)
        );

        return distance <= radius;
    }

    intersects(otherBounds) {
        if (!this.bounds || !otherBounds) return false;

        return !(
            this.bounds.max.x < otherBounds.min.x ||
            this.bounds.min.x > otherBounds.max.x ||
            this.bounds.max.y < otherBounds.min.y ||
            this.bounds.min.y > otherBounds.max.y
        );
    }

    dispose() {
        this.bounds = null;
        this.quadrant = null;
        this.isVisible = false;
        this.lodLevel = 0;
    }
} 