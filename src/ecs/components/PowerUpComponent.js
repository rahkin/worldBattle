import { Component } from '../core/Component.js';
import * as THREE from 'three';

export class PowerUpComponent extends Component {
    constructor(config = {}) {
        super();
        this.type = config.type || 'speedBoost';
        this.duration = config.duration || 5.0;
        this.effect = config.effect || 1.5;
        this.isActive = false;
        this.remainingTime = 0;
        this.mesh = null;
        this.particleSystem = null;
        this.collectSound = null;
        this.activationSound = null;
    }

    activate() {
        if (this.isActive) return false;
        this.isActive = true;
        this.remainingTime = this.duration;
        return true;
    }

    deactivate() {
        this.isActive = false;
        this.remainingTime = 0;
    }

    update(deltaTime) {
        if (!this.isActive) return;

        this.remainingTime -= deltaTime;
        if (this.remainingTime <= 0) {
            this.deactivate();
        }

        // Update visual effects
        if (this.mesh) {
            this.mesh.rotation.y += deltaTime;
        }

        if (this.particleSystem) {
            this.particleSystem.update(deltaTime);
        }
    }

    cleanup() {
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

        if (this.particleSystem) {
            this.particleSystem.dispose();
        }

        if (this.collectSound) {
            this.collectSound.stop();
        }

        if (this.activationSound) {
            this.activationSound.stop();
        }
    }
} 