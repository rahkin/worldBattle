import { Component } from '../core/Component.js';

export class VehicleControlsComponent extends Component {
    constructor(config = {}) {
        super();
        this.type = config.type || 'muscle';
        
        // Control states
        this.accelerating = false;
        this.braking = false;
        this.reversing = false;
        this.turningLeft = false;
        this.turningRight = false;
        this.boosting = false;
        
        // Vehicle control parameters
        this.maxSteeringAngle = 0.5;
        this.steeringSpeed = 2.0;
        this.currentSteering = 0;
        
        // Forces
        this.engineForce = 0;
        this.brakeForce = 0;
        this.steeringForce = 0;
        
        // Vehicle type specific settings
        this.setupVehicleType(this.type);
    }

    setupVehicleType(type) {
        const settings = {
            muscle: {
                maxSteeringAngle: 0.5,
                steeringSpeed: 2.5
            },
            ironclad: {
                maxSteeringAngle: 0.4,
                steeringSpeed: 1.8
            },
            scorpion: {
                maxSteeringAngle: 0.6,
                steeringSpeed: 3.0
            },
            tank: {
                maxSteeringAngle: 0.3,
                steeringSpeed: 1.5
            },
            drone: {
                maxSteeringAngle: 0.7,
                steeringSpeed: 3.5
            }
        };

        const vehicleSettings = settings[type] || settings.muscle;
        this.maxSteeringAngle = vehicleSettings.maxSteeringAngle;
        this.steeringSpeed = vehicleSettings.steeringSpeed;
    }

    setAccelerating(value) {
        this.accelerating = value;
    }

    setBraking(value) {
        this.braking = value;
    }

    setReversing(value) {
        this.reversing = value;
    }

    setTurningLeft(value) {
        this.turningLeft = value;
        if (!value && !this.turningRight) {
            this.steeringForce = 0;
        }
    }

    setTurningRight(value) {
        this.turningRight = value;
        if (!value && !this.turningLeft) {
            this.steeringForce = 0;
        }
    }

    setBoosting(value) {
        this.boosting = value;
    }

    updateSteering(deltaTime) {
        const targetSteering = this.turningLeft ? this.maxSteeringAngle :
                             this.turningRight ? -this.maxSteeringAngle : 0;
        
        // Smoothly interpolate steering
        const steeringDelta = targetSteering - this.currentSteering;
        this.currentSteering += steeringDelta * this.steeringSpeed * deltaTime;
        
        // Update steering force
        this.steeringForce = this.currentSteering;
    }

    reset() {
        this.accelerating = false;
        this.braking = false;
        this.reversing = false;
        this.turningLeft = false;
        this.turningRight = false;
        this.boosting = false;
        this.currentSteering = 0;
        this.engineForce = 0;
        this.brakeForce = 0;
        this.steeringForce = 0;
    }

    cleanup() {
        this.reset();
    }
} 