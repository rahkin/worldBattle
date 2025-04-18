import { Component } from '../Component.js';
import * as THREE from 'three';

export class TerrainComponent extends Component {
    constructor() {
        super();
        this.heightMap = new Map();
        this.textureMap = new Map();
        this.materialMap = new Map();
        this.objects = [];
        this.gridSize = 1;
        this.maxHeight = 100;
        this.minHeight = 0;
    }

    init(properties) {
        if (properties) {
            this.gridSize = properties.gridSize || this.gridSize;
            this.maxHeight = properties.maxHeight || this.maxHeight;
            this.minHeight = properties.minHeight || this.minHeight;
        }
    }

    setHeightAt(position, height) {
        const key = `${position.x},${position.y}`;
        this.heightMap.set(key, Math.max(this.minHeight, Math.min(this.maxHeight, height)));
    }

    getHeightAt(position) {
        const key = `${position.x},${position.y}`;
        return this.heightMap.get(key) || 0;
    }

    setTextureAt(position, texture) {
        const key = `${position.x},${position.y}`;
        this.textureMap.set(key, texture);
    }

    getTextureAt(position) {
        const key = `${position.x},${position.y}`;
        return this.textureMap.get(key);
    }

    setMaterialAt(position, material) {
        const key = `${position.x},${position.y}`;
        this.materialMap.set(key, material);
    }

    getMaterialAt(position) {
        const key = `${position.x},${position.y}`;
        return this.materialMap.get(key);
    }

    addObject(object) {
        this.objects.push(object);
    }

    removeObject(object) {
        const index = this.objects.indexOf(object);
        if (index !== -1) {
            this.objects.splice(index, 1);
        }
    }

    isPointOnTerrain(position) {
        return this.getHeightAt(position) > 0;
    }

    getSlopeAt(position) {
        const center = this.getHeightAt(position);
        const right = this.getHeightAt(new THREE.Vector2(position.x + this.gridSize, position.y));
        const left = this.getHeightAt(new THREE.Vector2(position.x - this.gridSize, position.y));
        const top = this.getHeightAt(new THREE.Vector2(position.x, position.y + this.gridSize));
        const bottom = this.getHeightAt(new THREE.Vector2(position.x, position.y - this.gridSize));

        const slopeX = (right - left) / (2 * this.gridSize);
        const slopeY = (top - bottom) / (2 * this.gridSize);

        return Math.sqrt(slopeX * slopeX + slopeY * slopeY);
    }

    getNormalAt(position) {
        const center = this.getHeightAt(position);
        const right = this.getHeightAt(new THREE.Vector2(position.x + this.gridSize, position.y));
        const left = this.getHeightAt(new THREE.Vector2(position.x - this.gridSize, position.y));
        const top = this.getHeightAt(new THREE.Vector2(position.x, position.y + this.gridSize));
        const bottom = this.getHeightAt(new THREE.Vector2(position.x, position.y - this.gridSize));

        const slopeX = (right - left) / (2 * this.gridSize);
        const slopeY = (top - bottom) / (2 * this.gridSize);

        return new THREE.Vector3(-slopeX, 1, -slopeY).normalize();
    }

    dispose() {
        this.heightMap.clear();
        this.textureMap.clear();
        this.materialMap.clear();
        this.objects = [];
    }
} 