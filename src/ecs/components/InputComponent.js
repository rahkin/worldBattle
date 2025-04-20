import { Component } from '../core/Component.js';

export class InputComponent extends Component {
    constructor() {
        super();
        // Vehicle control states
        this.forward = false;
        this.backward = false;
        this.left = false;
        this.right = false;
        this.boost = false;
        this.brake = false;
        
        // Control values for vehicle physics
        this.engineForce = 0;
        this.steeringForce = 0;
        this.brakeForce = 0;
        
        // Force limits
        this.maxEngineForce = 2000;  // Default max engine force
        this.maxSteeringForce = 50;  // Default max steering force
        this.maxBrakeForce = 100;    // Default max brake force

        this._previousState = this.getState();
    }

    update(deltaTime) {
        // Calculate engine force based on forward/backward input
        this.engineForce = 0;
        if (this.forward) {
            this.engineForce = this.maxEngineForce * (this.boost ? 1.5 : 1);
        } else if (this.backward) {
            this.engineForce = -this.maxEngineForce * 0.5; // Reverse is half power
        }

        // Calculate steering force based on left/right input
        this.steeringForce = 0;
        if (this.left) {
            this.steeringForce = this.maxSteeringForce;
        } else if (this.right) {
            this.steeringForce = -this.maxSteeringForce;
        }

        // Calculate brake force
        this.brakeForce = this.brake ? this.maxBrakeForce : 0;
    }

    getState() {
        return {
            forward: this.forward,
            backward: this.backward,
            left: this.left,
            right: this.right,
            boost: this.boost,
            brake: this.brake,
            engineForce: this.engineForce,
            steeringForce: this.steeringForce,
            brakeForce: this.brakeForce
        };
    }

    hasChanged() {
        const currentState = this.getState();
        const hasChanged = JSON.stringify(currentState) !== JSON.stringify(this._previousState);
        this._previousState = currentState;
        return hasChanged;
    }
} 