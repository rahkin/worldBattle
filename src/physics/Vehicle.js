import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class Vehicle {
    constructor(chassisBody, wheels = []) {
        this.chassisBody = chassisBody;
        this.wheels = wheels;
        this.engineForce = 0;
        this.brakeForce = 0;
        this.steeringValue = 0;
        this.maxSteerVal = 0.5;
        this.maxForce = 1000;
        this.maxBrakeForce = 1000000;
    }

    addWheel(wheel) {
        this.wheels.push(wheel);
    }

    setSteeringValue(value) {
        const steerValue = Math.max(-this.maxSteerVal, Math.min(this.maxSteerVal, value));
        this.steeringValue = steerValue;
        for (const wheel of this.wheels) {
            if (wheel.steering) {
                wheel.axle.setRotationFromQuaternion(
                    new THREE.Quaternion().setFromAxisAngle(
                        new THREE.Vector3(0, 1, 0),
                        steerValue
                    )
                );
            }
        }
    }

    setBrakeForce(force) {
        this.brakeForce = Math.max(0, Math.min(this.maxBrakeForce, force));
        for (const wheel of this.wheels) {
            wheel.brake = this.brakeForce;
        }
    }

    applyEngineForce(force) {
        this.engineForce = Math.max(-this.maxForce, Math.min(this.maxForce, force));
        for (const wheel of this.wheels) {
            if (wheel.drive) {
                wheel.engineForce = this.engineForce;
            }
        }
    }

    update(deltaTime) {
        for (const wheel of this.wheels) {
            wheel.updatePhysics(deltaTime);
            wheel.updateVisual();
        }
    }
} 