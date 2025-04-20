import { Component } from '../core/Component.js';
import * as CANNON from 'cannon-es';

export class PhysicsBody extends Component {
    constructor(body, vehicle = null) {
        super();
        this.body = body;
        this.vehicle = vehicle;
        this.position = body.position;
        this.quaternion = body.quaternion;
        this.velocity = body.velocity;
        this.angularVelocity = body.angularVelocity;
    }

    init(entity) {
        super.init(entity);
        this.entity = entity;
        this.world = entity.world;
        
        // Add body to physics world
        const physicsSystem = this.world.getSystem('PhysicsSystem');
        if (!physicsSystem) {
            console.error('PhysicsSystem not found in world');
            return;
        }

        console.log('Adding body to physics world:', {
            mass: this.body.mass,
            position: this.body.position,
            quaternion: this.body.quaternion
        });

        try {
            physicsSystem.physicsWorld.addBody(this.body);
            console.log('Successfully added body to physics world');

            if (this.vehicle) {
                console.log('Initializing vehicle:', {
                    wheelCount: this.vehicle.wheelInfos.length,
                    chassisBody: {
                        mass: this.vehicle.chassisBody.mass,
                        position: this.vehicle.chassisBody.position,
                        quaternion: this.vehicle.chassisBody.quaternion
                    }
                });

                try {
                    this.vehicle.addToWorld(physicsSystem.physicsWorld);
                    console.log('Successfully added vehicle to physics world');

                    // Initialize wheel transforms
                    for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
                        this.vehicle.updateWheelTransform(i);
                        const wheel = this.vehicle.wheelInfos[i];
                        console.log(`Initialized wheel ${i}:`, {
                            radius: wheel.radius,
                            suspensionLength: wheel.suspensionLength,
                            position: wheel.worldTransform.position,
                            quaternion: wheel.worldTransform.quaternion
                        });
                    }
                } catch (error) {
                    console.error('Failed to initialize vehicle:', error);
                }
            }
        } catch (error) {
            console.error('Failed to add body to physics world:', error);
        }
        
        console.log(`Initialized PhysicsBody for entity ${entity.id}`);
    }

    applyForce(force, worldPoint = new CANNON.Vec3()) {
        this.body.applyForce(force, worldPoint);
    }

    applyImpulse(impulse, worldPoint = new CANNON.Vec3()) {
        this.body.applyImpulse(impulse, worldPoint);
    }

    applyLocalForce(force, localPoint = new CANNON.Vec3()) {
        this.body.applyLocalForce(force, localPoint);
    }

    applyLocalImpulse(impulse, localPoint = new CANNON.Vec3()) {
        this.body.applyLocalImpulse(impulse, localPoint);
    }

    setPosition(x, y, z) {
        this.body.position.set(x, y, z);
        if (this.vehicle) {
            this.vehicle.chassisBody.position.copy(this.body.position);
        }
    }

    setQuaternion(x, y, z, w) {
        this.body.quaternion.set(x, y, z, w);
        if (this.vehicle) {
            this.vehicle.chassisBody.quaternion.copy(this.body.quaternion);
        }
    }

    setVelocity(x, y, z) {
        this.body.velocity.set(x, y, z);
        if (this.vehicle) {
            this.vehicle.chassisBody.velocity.copy(this.body.velocity);
        }
    }

    setAngularVelocity(x, y, z) {
        this.body.angularVelocity.set(x, y, z);
        if (this.vehicle) {
            this.vehicle.chassisBody.angularVelocity.copy(this.body.angularVelocity);
        }
    }

    getPosition() {
        return this.body.position;
    }

    getQuaternion() {
        return this.body.quaternion;
    }

    getVelocity() {
        return this.body.velocity;
    }

    getAngularVelocity() {
        return this.body.angularVelocity;
    }

    getSpeed() {
        return this.body.velocity.length();
    }

    reset() {
        this.body.position.setZero();
        this.body.quaternion.set(0, 0, 0, 1);
        this.body.velocity.setZero();
        this.body.angularVelocity.setZero();
        this.body.force.setZero();
        this.body.torque.setZero();

        if (this.vehicle) {
            this.vehicle.chassisBody.position.copy(this.body.position);
            this.vehicle.chassisBody.quaternion.copy(this.body.quaternion);
            this.vehicle.chassisBody.velocity.copy(this.body.velocity);
            this.vehicle.chassisBody.angularVelocity.copy(this.body.angularVelocity);
        }
    }

    cleanup() {
        // Nothing to clean up for now
        // The physics world will handle body removal
    }
} 