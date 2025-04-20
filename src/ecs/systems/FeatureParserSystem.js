import { System } from '../core/System.js';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class FeatureParserSystem extends System {
    constructor(world) {
        super(world);
        this.featureTypes = {
            'building': this._parseBuilding.bind(this),
            'water': this._parseWater.bind(this),
            'landuse': this._parseLanduse.bind(this),
            'road': this._parseRoad.bind(this)
        };
    }

    parseFeatures(tile, tileX, tileY, zoom) {
        const entities = [];
        
        for (const [layerName, layer] of Object.entries(tile.layers)) {
            const parser = this.featureTypes[layerName];
            if (!parser) continue;

            for (let i = 0; i < layer.length; i++) {
                const feature = layer.feature(i);
                const entity = parser(feature, tileX, tileY, zoom);
                if (entity) entities.push(entity);
            }
        }

        return entities;
    }

    _parseBuilding(feature, tileX, tileY, zoom) {
        const properties = feature.properties;
        const geometry = feature.loadGeometry();
        
        // Skip if no height information
        if (!properties.height) return null;

        // Create building mesh
        const shape = this._createShapeFromGeometry(geometry);
        const height = properties.height || 10; // Default height if not specified
        const geometry3d = new THREE.ExtrudeGeometry(shape, {
            depth: height,
            bevelEnabled: false
        });

        const material = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.8
        });

        const mesh = new THREE.Mesh(geometry3d, material);

        // Create physics body
        const body = new CANNON.Body({
            mass: 0, // Static body
            shape: new CANNON.Box(new CANNON.Vec3(
                shape.boundingBox.max.x - shape.boundingBox.min.x,
                height / 2,
                shape.boundingBox.max.y - shape.boundingBox.min.y
            ))
        });

        return this.world.createEntity()
            .addComponent('Mesh', { mesh })
            .addComponent('PhysicsBody', { body })
            .addComponent('Building', {
                properties,
                tileX,
                tileY,
                zoom
            });
    }

    _parseWater(feature, tileX, tileY, zoom) {
        const geometry = feature.loadGeometry();
        const shape = this._createShapeFromGeometry(geometry);
        
        const geometry3d = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshStandardMaterial({
            color: 0x0077be,
            transparent: true,
            opacity: 0.8
        });

        const mesh = new THREE.Mesh(geometry3d, material);

        return this.world.createEntity()
            .addComponent('Mesh', { mesh })
            .addComponent('Water', {
                tileX,
                tileY,
                zoom
            });
    }

    _parseLanduse(feature, tileX, tileY, zoom) {
        const properties = feature.properties;
        const geometry = feature.loadGeometry();
        const shape = this._createShapeFromGeometry(geometry);

        const geometry3d = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshStandardMaterial({
            color: this._getLanduseColor(properties.landuse),
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry3d, material);

        return this.world.createEntity()
            .addComponent('Mesh', { mesh })
            .addComponent('Landuse', {
                properties,
                tileX,
                tileY,
                zoom
            });
    }

    _parseRoad(feature, tileX, tileY, zoom) {
        const properties = feature.properties;
        const geometry = feature.loadGeometry();
        
        // Create road mesh
        const points = geometry.map(ring => 
            ring.map(point => new THREE.Vector2(point.x, point.y))
        );
        
        const material = new THREE.LineBasicMaterial({
            color: 0x333333,
            linewidth: properties.width || 1
        });

        const lines = points.map(ring => {
            const geometry = new THREE.BufferGeometry().setFromPoints(ring);
            return new THREE.Line(geometry, material);
        });

        return this.world.createEntity()
            .addComponent('Mesh', { mesh: lines })
            .addComponent('Road', {
                properties,
                tileX,
                tileY,
                zoom
            });
    }

    _createShapeFromGeometry(geometry) {
        const shape = new THREE.Shape();
        
        geometry.forEach((ring, i) => {
            if (i === 0) {
                shape.moveTo(ring[0].x, ring[0].y);
                for (let j = 1; j < ring.length; j++) {
                    shape.lineTo(ring[j].x, ring[j].y);
                }
            } else {
                const hole = new THREE.Path();
                hole.moveTo(ring[0].x, ring[0].y);
                for (let j = 1; j < ring.length; j++) {
                    hole.lineTo(ring[j].x, ring[j].y);
                }
                shape.holes.push(hole);
            }
        });

        return shape;
    }

    _getLanduseColor(type) {
        const colors = {
            'park': 0x4CAF50,
            'grass': 0x8BC34A,
            'forest': 0x2E7D32,
            'residential': 0x9E9E9E,
            'commercial': 0x607D8B,
            'industrial': 0x455A64
        };
        return colors[type] || 0x9E9E9E;
    }
} 