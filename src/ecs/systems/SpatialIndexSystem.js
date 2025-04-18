import { System } from '../System.js';
import * as THREE from 'three';

export class SpatialIndexSystem extends System {
    constructor(world) {
        super(world);
        this.quadTree = null;
        this.tileEntities = new Map();
        this.visibleTiles = new Set();
        this.viewDistance = 5000; // 5km view distance
    }

    init() {
        // Initialize quadtree with world bounds
        const worldSize = 10000; // 10km world size
        this.quadTree = {
            bounds: new THREE.Box2(
                new THREE.Vector2(-worldSize/2, -worldSize/2),
                new THREE.Vector2(worldSize/2, worldSize/2)
            ),
            entities: [],
            children: null
        };
    }

    addEntity(entity, tileKey) {
        if (!entity.hasComponent('Mesh')) return;

        const mesh = entity.getComponent('Mesh').mesh;
        const bounds = this._getEntityBounds(mesh);

        // Add to spatial index
        this._insertIntoQuadTree(entity, bounds);

        // Track tile association
        if (!this.tileEntities.has(tileKey)) {
            this.tileEntities.set(tileKey, new Set());
        }
        this.tileEntities.get(tileKey).add(entity);
    }

    removeEntity(entity, tileKey) {
        if (!entity.hasComponent('Mesh')) return;

        const mesh = entity.getComponent('Mesh').mesh;
        const bounds = this._getEntityBounds(mesh);

        // Remove from spatial index
        this._removeFromQuadTree(entity, bounds);

        // Remove tile association
        if (this.tileEntities.has(tileKey)) {
            this.tileEntities.get(tileKey).delete(entity);
            if (this.tileEntities.get(tileKey).size === 0) {
                this.tileEntities.delete(tileKey);
            }
        }
    }

    getVisibleEntities(camera) {
        const frustum = new THREE.Frustum();
        frustum.setFromProjectionMatrix(
            new THREE.Matrix4().multiplyMatrices(
                camera.projectionMatrix,
                camera.matrixWorldInverse
            )
        );

        const visibleEntities = new Set();
        this._queryQuadTree(this.quadTree, frustum, visibleEntities);
        return Array.from(visibleEntities);
    }

    getEntitiesInRadius(position, radius) {
        const bounds = new THREE.Box2(
            new THREE.Vector2(position.x - radius, position.z - radius),
            new THREE.Vector2(position.x + radius, position.z + radius)
        );

        const entities = new Set();
        this._queryQuadTreeRadius(this.quadTree, bounds, position, radius, entities);
        return Array.from(entities);
    }

    _insertIntoQuadTree(entity, bounds) {
        if (!this.quadTree.children) {
            if (this.quadTree.entities.length < 4) {
                this.quadTree.entities.push({ entity, bounds });
                return;
            }
            this._subdivideQuadTree();
        }

        for (const child of this.quadTree.children) {
            if (this._boundsIntersect(bounds, child.bounds)) {
                this._insertIntoQuadTree(entity, bounds);
            }
        }
    }

    _removeFromQuadTree(entity, bounds) {
        if (!this.quadTree.children) {
            this.quadTree.entities = this.quadTree.entities.filter(
                e => e.entity !== entity
            );
            return;
        }

        for (const child of this.quadTree.children) {
            if (this._boundsIntersect(bounds, child.bounds)) {
                this._removeFromQuadTree(entity, bounds);
            }
        }
    }

    _queryQuadTree(node, frustum, results) {
        if (!this._boundsIntersectFrustum(node.bounds, frustum)) {
            return;
        }

        for (const { entity, bounds } of node.entities) {
            if (this._boundsIntersectFrustum(bounds, frustum)) {
                results.add(entity);
            }
        }

        if (node.children) {
            for (const child of node.children) {
                this._queryQuadTree(child, frustum, results);
            }
        }
    }

    _queryQuadTreeRadius(node, bounds, position, radius, results) {
        if (!this._boundsIntersect(bounds, node.bounds)) {
            return;
        }

        for (const { entity, bounds } of node.entities) {
            const center = new THREE.Vector2(
                (bounds.min.x + bounds.max.x) / 2,
                (bounds.min.y + bounds.max.y) / 2
            );
            const distance = center.distanceTo(
                new THREE.Vector2(position.x, position.z)
            );
            if (distance <= radius) {
                results.add(entity);
            }
        }

        if (node.children) {
            for (const child of node.children) {
                this._queryQuadTreeRadius(child, bounds, position, radius, results);
            }
        }
    }

    _subdivideQuadTree() {
        const { min, max } = this.quadTree.bounds;
        const center = new THREE.Vector2(
            (min.x + max.x) / 2,
            (min.y + max.y) / 2
        );

        this.quadTree.children = [
            {
                bounds: new THREE.Box2(min, center),
                entities: [],
                children: null
            },
            {
                bounds: new THREE.Box2(
                    new THREE.Vector2(center.x, min.y),
                    new THREE.Vector2(max.x, center.y)
                ),
                entities: [],
                children: null
            },
            {
                bounds: new THREE.Box2(
                    new THREE.Vector2(min.x, center.y),
                    new THREE.Vector2(center.x, max.y)
                ),
                entities: [],
                children: null
            },
            {
                bounds: new THREE.Box2(center, max),
                entities: [],
                children: null
            }
        ];

        // Redistribute entities
        for (const { entity, bounds } of this.quadTree.entities) {
            for (const child of this.quadTree.children) {
                if (this._boundsIntersect(bounds, child.bounds)) {
                    child.entities.push({ entity, bounds });
                }
            }
        }

        this.quadTree.entities = [];
    }

    _getEntityBounds(mesh) {
        const box = new THREE.Box3().setFromObject(mesh);
        return new THREE.Box2(
            new THREE.Vector2(box.min.x, box.min.z),
            new THREE.Vector2(box.max.x, box.max.z)
        );
    }

    _boundsIntersect(bounds1, bounds2) {
        return !(
            bounds1.max.x < bounds2.min.x ||
            bounds1.min.x > bounds2.max.x ||
            bounds1.max.y < bounds2.min.y ||
            bounds1.min.y > bounds2.max.y
        );
    }

    _boundsIntersectFrustum(bounds, frustum) {
        const corners = [
            new THREE.Vector3(bounds.min.x, 0, bounds.min.y),
            new THREE.Vector3(bounds.max.x, 0, bounds.min.y),
            new THREE.Vector3(bounds.max.x, 0, bounds.max.y),
            new THREE.Vector3(bounds.min.x, 0, bounds.max.y)
        ];

        return corners.some(corner => frustum.containsPoint(corner));
    }
} 