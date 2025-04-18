import { Component } from '../core/Component.js';
import * as THREE from 'three';

export class ProjectileComponent extends Component {
    constructor(config = {}) {
        super();
        this.type = config.type || 'bullet';
        this.damage = config.damage || 10;
        this.speed = config.speed || 50;
        this.range = config.range || 100;
        this.lifetime = config.lifetime || 2.0;
        this.owner = config.owner || null;
        this.mesh = null;
        this.trail = null;
        this.impactSound = null;
        this.hasHit = false;
        this.distanceTraveled = 0;
    }

    update(deltaTime) {
        if (this.hasHit) return;

        const transform = this.entity.getComponent('Transform');
        if (!transform) return;

        // Move projectile
        const distance = this.speed * deltaTime;
        transform.position.add(transform.forward.clone().multiplyScalar(distance));
        this.distanceTraveled += distance;

        // Update trail
        if (this.trail) {
            this.trail.update(deltaTime);
        }

        // Check if projectile has exceeded its range or lifetime
        if (this.distanceTraveled >= this.range || this.lifetime <= 0) {
            this.destroy();
        }

        this.lifetime -= deltaTime;
    }

    onHit(target) {
        if (this.hasHit) return;
        this.hasHit = true;

        // Play impact sound
        if (this.impactSound) {
            this.impactSound.play();
        }

        // Create explosion effect
        this.createExplosion();

        // Apply damage to target
        const health = target.getComponent('HealthComponent');
        if (health) {
            health.takeDamage(this.damage);
        }

        this.destroy();
    }

    createExplosion() {
        const transform = this.entity.getComponent('Transform');
        if (!transform) return;

        const explosionEntity = this.world.createEntity();
        const explosion = new ExplosionComponent({
            position: transform.position.clone(),
            scale: 2.0,
            duration: 0.5
        });

        explosionEntity.addComponent(explosion);
        explosionEntity.addComponent('Transform', {
            position: transform.position.clone()
        });
    }

    destroy() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(material => material.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
        }

        if (this.trail) {
            this.trail.dispose();
        }

        if (this.impactSound) {
            this.impactSound.stop();
        }

        this.world.removeEntity(this.entity);
    }

    cleanup() {
        this.destroy();
    }
} 