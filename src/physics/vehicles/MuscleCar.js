import { BaseCar } from './BaseCar';

export class MuscleCar extends BaseCar {
    constructor(world, scene) {
        super(world, scene, {
            width: 1.2,
            height: 0.6,
            length: 2.4,
            mass: 800,
            color: 0x00ff00,
            wheelRadius: 0.4,
            wheelWidth: 0.35,
            wheelFriction: 10,
            wheelBaseZ: 2.2,
            wheelTrackX: 1.2,
            chassisOffsetY: 0.4,
            suspensionStiffness: 35,
            suspensionRestLength: 0.3,
            dampingRelaxation: 2.5,
            dampingCompression: 4.4,
            maxSuspensionForce: 100000,
            maxSuspensionTravel: 0.3
        });

        // Muscle car specific properties
        this.boostForce = 2200;
        this.normalForce = 1800;
        this.brakeForce = 100;
        this.maxSteerVal = 0.5;

        // Add debug logging for muscle car
        console.log('MuscleCar created with suspension settings:', {
            stiffness: this.options.suspensionStiffness,
            restLength: this.options.suspensionRestLength,
            maxForce: this.options.maxSuspensionForce,
            maxTravel: this.options.maxSuspensionTravel
        });
    }

    // Optional: Override methods for muscle car specific behavior
    updateVisuals() {
        super.updateVisuals();
        // Add any muscle car specific visual updates
    }
} 