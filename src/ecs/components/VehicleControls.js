import { Component } from '../core/Component.js';
import * as CANNON from 'cannon-es';

export class VehicleControls extends Component {
    constructor(options = {}) {
        super();
        
        // Vehicle physics constants
        this.maxForwardForce = options.maxForwardForce || 2000;
        this.maxReverseForce = options.maxReverseForce || 1000;
        this.maxSteeringAngle = options.maxSteeringAngle || 0.5;
        this.maxBrakeForce = options.maxBrakeForce || 100;
        this.boostMultiplier = options.boostMultiplier || 1.5;
        
        // Vehicle state
        this.engineForce = 0;
        this.brakeForce = 0;
        this.steeringAngle = 0;
        this.isBoosting = false;
        
        // Vehicle characteristics based on type
        this.vehicleType = options.type || 'muscle';
        this.setupVehicleCharacteristics();
    }

    setupVehicleCharacteristics() {
        // Define characteristics for each vehicle type
        const characteristics = {
            muscle: {
                maxForwardForce: 2200,
                maxReverseForce: 1100,
                maxSteeringAngle: 0.45,
                boostMultiplier: 1.6
            },
            ironclad: {
                maxForwardForce: 1800,
                maxReverseForce: 900,
                maxSteeringAngle: 0.4,
                boostMultiplier: 1.3
            },
            scorpion: {
                maxForwardForce: 2000,
                maxReverseForce: 1000,
                maxSteeringAngle: 0.55,
                boostMultiplier: 1.4
            },
            tank: {
                maxForwardForce: 1500,
                maxReverseForce: 800,
                maxSteeringAngle: 0.35,
                boostMultiplier: 1.2
            },
            drone: {
                maxForwardForce: 2400,
                maxReverseForce: 1200,
                maxSteeringAngle: 0.5,
                boostMultiplier: 1.8
            }
        };

        // Apply characteristics based on vehicle type
        const vehicleStats = characteristics[this.vehicleType] || characteristics.muscle;
        Object.assign(this, vehicleStats);
    }

    update(input, physicsBody) {
        if (!input || !physicsBody || !physicsBody.vehicle) return;

        const vehicle = physicsBody.vehicle;

        // Handle acceleration/braking
        if (input.engineForce > 0) {
            // Forward
            this.engineForce = input.engineForce * this.maxForwardForce;
            this.brakeForce = 0;
        } else if (input.engineForce < 0) {
            // Reverse
            this.engineForce = input.engineForce * this.maxReverseForce;
            this.brakeForce = 0;
        } else {
            // No input - apply slight brake force for better control
            this.engineForce = 0;
            this.brakeForce = 20;
        }

        // Apply boost if active
        if (input.boost) {
            this.engineForce *= this.boostMultiplier;
            this.isBoosting = true;
        } else {
            this.isBoosting = false;
        }

        // Handle steering
        this.steeringAngle = input.steeringForce * this.maxSteeringAngle;

        // Apply brake force if brake is pressed
        if (input.brakeForce > 0) {
            this.brakeForce = input.brakeForce * this.maxBrakeForce;
            this.engineForce *= 0.3; // Reduce engine force while braking
        }

        // Apply forces to wheels
        for (let i = 0; i < vehicle.wheelInfos.length; i++) {
            // Apply engine force to back wheels
            if (i >= 2) { // Back wheels
                vehicle.applyEngineForce(this.engineForce, i);
            }

            // Apply steering to front wheels
            if (i < 2) { // Front wheels
                vehicle.setSteeringValue(this.steeringAngle, i);
            }

            // Apply brakes to all wheels
            vehicle.setBrake(this.brakeForce, i);
        }

        // Apply downforce for better stability
        const speed = physicsBody.getSpeed();
        const downforce = Math.min(speed * speed * 0.0005, 500);
        physicsBody.applyLocalForce(
            new CANNON.Vec3(0, -downforce, 0),
            new CANNON.Vec3(0, 0, 0)
        );
    }

    getState() {
        return {
            engineForce: this.engineForce,
            brakeForce: this.brakeForce,
            steeringAngle: this.steeringAngle,
            isBoosting: this.isBoosting
        };
    }

    cleanup() {
        // Reset all forces
        this.engineForce = 0;
        this.brakeForce = 0;
        this.steeringAngle = 0;
        this.isBoosting = false;
    }
} 