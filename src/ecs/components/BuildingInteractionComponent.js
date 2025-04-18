import { Component } from './Component.js';
import * as THREE from 'three';

export class BuildingInteractionComponent extends Component {
    constructor() {
        super();
        this.type = 'BuildingInteractionComponent';
        this.interactionPoints = new Map();
        this.events = new Map();
        this.cooldowns = new Map();
        this.interactionDelay = 0.5;
        this.isHighlighted = false;
        this.isSelected = false;
    }

    init(entity, properties = {}) {
        super.init(entity);
        
        if (properties.interactionDelay !== undefined) {
            this.interactionDelay = properties.interactionDelay;
        }
        
        if (properties.isHighlighted !== undefined) {
            this.isHighlighted = properties.isHighlighted;
        }
        
        if (properties.isSelected !== undefined) {
            this.isSelected = properties.isSelected;
        }
    }

    addInteractionPoint(id, position) {
        if (!(position instanceof THREE.Vector3)) {
            throw new Error('Position must be a Vector3');
        }
        this.interactionPoints.set(id, position.clone());
        return this;
    }

    removeInteractionPoint(id) {
        return this.interactionPoints.delete(id);
    }

    getNearestInteractionPoint(position) {
        if (!(position instanceof THREE.Vector3)) {
            throw new Error('Position must be a Vector3');
        }

        let nearestId = null;
        let nearestDistance = Infinity;

        this.interactionPoints.forEach((point, id) => {
            const distance = position.distanceTo(point);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestId = id;
            }
        });

        return nearestId;
    }

    addEvent(eventName, handler) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, new Set());
        }
        this.events.get(eventName).add(handler);
        return this;
    }

    removeEvent(eventName, handler) {
        if (this.events.has(eventName)) {
            this.events.get(eventName).delete(handler);
            if (this.events.get(eventName).size === 0) {
                this.events.delete(eventName);
            }
        }
        return this;
    }

    triggerEvent(eventName, data) {
        if (this.events.has(eventName)) {
            this.events.get(eventName).forEach(handler => {
                handler(data);
            });
        }
    }

    setCooldown(eventName, duration) {
        this.cooldowns.set(eventName, {
            startTime: Date.now(),
            duration: duration
        });
    }

    isOnCooldown(eventName) {
        const cooldown = this.cooldowns.get(eventName);
        if (!cooldown) return false;

        const elapsed = Date.now() - cooldown.startTime;
        return elapsed < cooldown.duration;
    }

    update(deltaTime) {
        // Remove expired cooldowns
        for (const [eventName, cooldown] of this.cooldowns.entries()) {
            const elapsed = Date.now() - cooldown.startTime;
            if (elapsed >= cooldown.duration) {
                this.cooldowns.delete(eventName);
            }
        }
    }

    cleanup() {
        this.interactionPoints.clear();
        this.events.clear();
        this.cooldowns.clear();
        this.interactionDelay = 0.5;
        this.isHighlighted = false;
        this.isSelected = false;
        super.cleanup();
    }
} 