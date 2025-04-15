import { System } from '../core/System.js';
import * as THREE from 'three';

export class PowerUpSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this.powerUps = new Map();
    }

    createPowerUp(type, position) {
        const powerUp = {
            type,
            position: position.clone(),
            isActive: true
        };
        
        this.powerUps.set(this.powerUps.size, powerUp);
        return powerUp;
    }

    update(deltaTime) {
        // Update power-ups (animation, etc)
        for (const powerUp of this.powerUps.values()) {
            if (powerUp.isActive) {
                // Add any update logic here
            }
        }
    }

    removePowerUp(powerUp) {
        for (const [id, p] of this.powerUps.entries()) {
            if (p === powerUp) {
                this.powerUps.delete(id);
                break;
            }
        }
    }

    handlePowerUpCollection(entity, collector) {
        const powerUp = entity.getComponent(PowerUpComponent);
        if (!powerUp.collected) {
            powerUp.activate();
            // Here you would add logic to apply the power-up effect to the collector
        }
    }
} 