import { Component } from '../core/Component.js';
import * as THREE from 'three';

export class VehicleComponent extends Component {
    constructor(config = {}) {
        super();
        this.type = 'VehicleComponent';
        
        // Vehicle properties
        this.maxSpeed = config.maxSpeed || 100;
        this.acceleration = config.acceleration || 50;
        this.turnSpeed = config.turnSpeed || 2;
        this.brakeForce = config.brakeForce || 100;
        
        // Current state
        this.speed = 0;
        this.steering = 0;
        this.isBraking = false;
        this.isReversing = false;
        
        // Vehicle type and configuration
        this.vehicleType = config.type || 'default';
        this.config = config;
        
        // Physics properties
        this.mass = config.mass || 1000;
        this.wheelRadius = config.wheelRadius || 0.5;
        this.wheelWidth = config.wheelWidth || 0.3;
        this.wheelFriction = config.wheelFriction || 0.3;
        
        // Vehicle state
        this.health = config.maxHealth || 100;
        this.maxHealth = config.maxHealth || 100;
        this.armor = config.armor || 0;
        
        // Weapon mount points
        this.weaponMounts = config.weaponMounts || [];
        
        // Power-up effects
        this.powerUps = {
            speedBoost: 1.0,
            damageBoost: 1.0,
            defenseBoost: 1.0
        };
    }

    init(entity) {
        super.init(entity);
        this.entity = entity;
        this.world = entity.world;
        console.log(`Initialized VehicleComponent for entity ${entity.id}`);
    }
    
    takeDamage(amount) {
        const effectiveDamage = Math.max(0, amount - this.armor);
        this.health = Math.max(0, this.health - effectiveDamage);
        return this.health > 0;
    }
    
    applyPowerUp(type, duration) {
        switch(type) {
            case 'speed':
                this.powerUps.speedBoost = 1.5;
                break;
            case 'damage':
                this.powerUps.damageBoost = 2.0;
                break;
            case 'defense':
                this.powerUps.defenseBoost = 2.0;
                break;
        }
        
        setTimeout(() => {
            this.powerUps[type + 'Boost'] = 1.0;
        }, duration);
    }
    
    reset() {
        this.speed = 0;
        this.steering = 0;
        this.isBraking = false;
        this.isReversing = false;
        this.health = this.maxHealth;
        this.powerUps = {
            speedBoost: 1.0,
            damageBoost: 1.0,
            defenseBoost: 1.0
        };
    }

    cleanup() {
        super.cleanup();
        this.reset();
    }
} 