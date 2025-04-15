import { POWER_UP_TYPES } from '../../physics/PowerUpSystem.js';

export class PowerUpComponent {
    constructor(type = POWER_UP_TYPES.HEALTH, duration = 10, value = 1) {
        this.type = type;
        this.duration = duration;
        this.value = value;
        this.active = false;
        this.timeRemaining = 0;
        this.collected = false;
    }

    activate() {
        this.active = true;
        this.timeRemaining = this.duration;
        this.collected = true;
    }

    deactivate() {
        this.active = false;
        this.timeRemaining = 0;
    }

    update(deltaTime) {
        if (this.active) {
            this.timeRemaining -= deltaTime;
            if (this.timeRemaining <= 0) {
                this.deactivate();
            }
        }
    }
} 