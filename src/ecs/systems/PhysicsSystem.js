import * as CANNON from 'cannon-es';
import { System } from '../System.js';
import { PhysicsBody } from '../components/PhysicsBody.js';

export class PhysicsSystem extends System {
    constructor() {
        super();
        this.requiredComponents = [PhysicsBody];
        
        // Initialize CANNON.js physics world
        this.physicsWorld = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });
        
        this.physicsWorld.defaultContactMaterial.friction = 0.7;
        this.physicsWorld.defaultContactMaterial.restitution = 0.3;

        // Create ground material
        this.groundMaterial = new CANNON.Material('ground');
        this.vehicleMaterial = new CANNON.Material('vehicle');

        // Create contact material between ground and vehicle
        const groundVehicleContactMaterial = new CANNON.ContactMaterial(
            this.groundMaterial,
            this.vehicleMaterial,
            {
                friction: 0.3,
                restitution: 0.3,
                contactEquationStiffness: 1e6,
                contactEquationRelaxation: 3,
                frictionEquationStiffness: 1e6,
                frictionEquationRelaxation: 3
            }
        );

        this.physicsWorld.addContactMaterial(groundVehicleContactMaterial);

        // Set up broadphase
        this.physicsWorld.broadphase = new CANNON.SAPBroadphase(this.physicsWorld);
        this.physicsWorld.solver.iterations = 10;

        // Debug properties
        this.debugEnabled = false;
        this.collisionEvents = [];
    }

    init() {
        console.log('PhysicsSystem initializing...');
        // Create ground plane
        const groundBody = this.createGroundBody();
        this.physicsWorld.addBody(groundBody);
        console.log('PhysicsSystem initialization complete');
    }

    update(deltaTime) {
        // Clear collision events from previous frame
        this.collisionEvents = [];

        // Step the physics world
        this.physicsWorld.step(1/60, deltaTime, 3);

        // Update all physics bodies
        const entities = this.world.getEntitiesWithComponents(this.requiredComponents);
        for (const entity of entities) {
            const physicsBody = entity.getComponent(PhysicsBody);
            if (physicsBody && physicsBody.body) {
                // Update component state from physics body
                physicsBody.position.copy(physicsBody.body.position);
                physicsBody.quaternion.copy(physicsBody.body.quaternion);
                physicsBody.velocity.copy(physicsBody.body.velocity);
                physicsBody.angularVelocity.copy(physicsBody.body.angularVelocity);

                // Update vehicle wheels if present
                if (physicsBody.vehicle) {
                    for (let i = 0; i < physicsBody.vehicle.wheelInfos.length; i++) {
                        physicsBody.vehicle.updateWheelTransform(i);
                    }
                }
            }
        }

        // Debug logging if enabled
        if (this.debugEnabled) {
            this.logDebugInfo();
        }
    }

    createGroundBody() {
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0,
            material: this.groundMaterial,
            shape: groundShape
        });
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        return groundBody;
    }

    createVehicleBody(options = {}) {
        const defaults = {
            mass: 1500,
            width: 2.5,
            height: 1,
            length: 4,
            wheelRadius: 0.5,
            wheelMass: 30,
            suspensionStiffness: 30,
            suspensionRestLength: 0.3,
            frictionSlip: 5,
            dampingRelaxation: 2.3,
            dampingCompression: 4.4,
            maxSuspensionForce: 100000,
            rollInfluence: 0.01,
            maxSuspensionTravel: 0.3,
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true
        };

        const config = { ...defaults, ...options };

        // Create main vehicle body
        const chassisShape = new CANNON.Box(new CANNON.Vec3(
            config.width * 0.5,
            config.height * 0.5,
            config.length * 0.5
        ));

        const chassisBody = new CANNON.Body({
            mass: config.mass,
            material: this.vehicleMaterial,
            shape: chassisShape
        });

        // Create vehicle
        const vehicle = new CANNON.RaycastVehicle({
            chassisBody,
            indexRightAxis: 0,
            indexUpAxis: 1,
            indexForwardAxis: 2
        });

        // Set up wheels
        const wheelOptions = {
            radius: config.wheelRadius,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: config.suspensionStiffness,
            suspensionRestLength: config.suspensionRestLength,
            frictionSlip: config.frictionSlip,
            dampingRelaxation: config.dampingRelaxation,
            dampingCompression: config.dampingCompression,
            maxSuspensionForce: config.maxSuspensionForce,
            rollInfluence: config.rollInfluence,
            maxSuspensionTravel: config.maxSuspensionTravel,
            customSlidingRotationalSpeed: config.customSlidingRotationalSpeed,
            useCustomSlidingRotationalSpeed: config.useCustomSlidingRotationalSpeed,
            axleLocal: new CANNON.Vec3(1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1, 0, 1),
            isFrontWheel: true
        };

        // Add wheels
        const width = config.width * 0.5;
        const front = config.length * 0.3;
        const height = config.suspensionRestLength;

        wheelOptions.chassisConnectionPointLocal.set(-width, height, front);
        vehicle.addWheel(wheelOptions);

        wheelOptions.chassisConnectionPointLocal.set(width, height, front);
        vehicle.addWheel(wheelOptions);

        wheelOptions.chassisConnectionPointLocal.set(-width, height, -front);
        wheelOptions.isFrontWheel = false;
        vehicle.addWheel(wheelOptions);

        wheelOptions.chassisConnectionPointLocal.set(width, height, -front);
        vehicle.addWheel(wheelOptions);

        vehicle.addToWorld(this.physicsWorld);

        // Add collision event listeners
        chassisBody.addEventListener('collide', (event) => {
            this.collisionEvents.push({
                bodyA: event.bodyA,
                bodyB: event.bodyB,
                contact: event.contact
            });
        });

        return vehicle;
    }

    addBody(body) {
        this.physicsWorld.addBody(body);
    }

    removeBody(body) {
        this.physicsWorld.removeBody(body);
    }

    setDebugEnabled(enabled) {
        this.debugEnabled = enabled;
    }

    logDebugInfo() {
        console.log('Physics Debug Info:', {
            bodies: this.physicsWorld.bodies.length,
            contacts: this.physicsWorld.contacts.length,
            collisions: this.collisionEvents.length,
            constraints: this.physicsWorld.constraints.length
        });
    }

    cleanup() {
        // Remove all bodies from the physics world
        while(this.physicsWorld.bodies.length > 0) {
            this.physicsWorld.removeBody(this.physicsWorld.bodies[0]);
        }
        this.collisionEvents = [];
    }
} 