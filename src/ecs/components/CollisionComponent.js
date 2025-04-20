import { Component } from '../core/Component.js';
import * as CANNON from 'cannon-es';

export class CollisionComponent extends Component {
    constructor(options = {}) {
        super();
        this.shape = options.shape || null;
        this.body = options.body || null;
        this.collisionGroup = options.collisionGroup || 1;
        this.collisionMask = options.collisionMask || -1;
        this.isTrigger = options.isTrigger || false;
        this.onCollide = options.onCollide || null;
        this.onCollideEnd = options.onCollideEnd || null;
        this.collidingEntities = new Set();
        this.lastCollisionTime = 0;
        this.collisionCooldown = options.collisionCooldown || 0;
    }

    init(entity) {
        super.init(entity);
        this.entity = entity;
        this.world = entity.world;
        console.log(`Initialized CollisionComponent for entity ${entity.id}`);
    }

    setCollisionGroup(group) {
        this.collisionGroup = group;
        if (this.body) {
            this.body.collisionFilterGroup = group;
        }
    }

    setCollisionMask(mask) {
        this.collisionMask = mask;
        if (this.body) {
            this.body.collisionFilterMask = mask;
        }
    }

    setTrigger(isTrigger) {
        this.isTrigger = isTrigger;
        if (this.body) {
            this.body.isTrigger = isTrigger;
        }
    }

    setOnCollide(callback) {
        this.onCollide = callback;
    }

    setOnCollideEnd(callback) {
        this.onCollideEnd = callback;
    }

    canCollide() {
        return Date.now() - this.lastCollisionTime >= this.collisionCooldown;
    }

    updateCollisionTime() {
        this.lastCollisionTime = Date.now();
    }

    addCollidingEntity(entityId) {
        this.collidingEntities.add(entityId);
    }

    removeCollidingEntity(entityId) {
        this.collidingEntities.delete(entityId);
    }

    isCollidingWith(entityId) {
        return this.collidingEntities.has(entityId);
    }

    cleanup() {
        if (this.body) {
            this.body.removeEventListener('collide', this.onCollide);
            this.body.removeEventListener('collideEnd', this.onCollideEnd);
        }
        this.collidingEntities.clear();
        super.cleanup();
    }
} 