import { System } from '../core/System.js';
import { PhysicsBody } from '../components/PhysicsBody.js';
import * as CANNON from 'cannon-es';

export class PhysicsSystem extends System {
    constructor(physicsWorld, entityManager) {
        super();
        this.requiredComponents = [PhysicsBody];
        this.entityManager = entityManager;
        
        // Use provided physics world or create new one
        this.physicsWorld = physicsWorld || new CANNON.World({
            gravity: new CANNON.Vec3(0, -20, 0)  // Increased gravity
        });
        
        // Set higher friction for better vehicle control
        this.physicsWorld.defaultContactMaterial.friction = 0.8;
        this.physicsWorld.defaultContactMaterial.restitution = 0.1;

        // Create ground material with higher friction
        this.groundMaterial = new CANNON.Material('ground');
        this.groundMaterial.friction = 0.8;
        this.groundMaterial.restitution = 0.1;
        
        this.vehicleMaterial = new CANNON.Material('vehicle');
        this.vehicleMaterial.friction = 0.8;
        this.vehicleMaterial.restitution = 0.1;

        // Create contact material between ground and vehicle with better traction
        const groundVehicleContactMaterial = new CANNON.ContactMaterial(
            this.groundMaterial,
            this.vehicleMaterial,
            {
                friction: 0.8,  // Higher friction for better traction
                restitution: 0.1,  // Slight bounce
                contactEquationStiffness: 1e6,  // Reduced for more stable contact
                contactEquationRelaxation: 3,
                frictionEquationStiffness: 1e6,  // Reduced for more stable friction
                frictionEquationRelaxation: 3
            }
        );

        this.physicsWorld.addContactMaterial(groundVehicleContactMaterial);

        // Set up broadphase and solver with better stability
        this.physicsWorld.broadphase = new CANNON.SAPBroadphase(this.physicsWorld);
        this.physicsWorld.solver.iterations = 20;  // Reduced iterations for better performance
        this.physicsWorld.solver.tolerance = 0.001;  // Increased tolerance for stability
        this.physicsWorld.allowSleep = true;  // Enable sleeping for better performance
        this.physicsWorld.solver.frictionIterations = 5;  // Increased friction iterations

        // Enable debug mode
        this.debugEnabled = true;
        this.collisionEvents = [];
        this.debugFrameCount = 0;

        console.log('PhysicsSystem constructed with:', {
            gravity: this.physicsWorld.gravity,
            friction: this.physicsWorld.defaultContactMaterial.friction,
            restitution: this.physicsWorld.defaultContactMaterial.restitution,
            solverIterations: this.physicsWorld.solver.iterations
        });
    }

    init() {
        if (!this.enabled) {
            console.warn('PhysicsSystem is disabled, skipping initialization');
            return Promise.resolve();
        }

        console.log('PhysicsSystem initializing...');
        
        // Log all existing bodies before adding ground
        console.log('Existing bodies before ground creation:', 
            this.physicsWorld.bodies.map(body => ({
                id: body.id,
                type: body.type,
                position: body.position,
                mass: body.mass,
                material: body.material ? body.material.name : 'none'
            }))
        );

        // Create ground plane
        const groundBody = this.createGroundBody();
        this.physicsWorld.addBody(groundBody);

        // Log all bodies after adding ground
        console.log('All physics bodies after initialization:', 
            this.physicsWorld.bodies.map(body => ({
                id: body.id,
                type: body.type,
                position: body.position,
                mass: body.mass,
                material: body.material ? body.material.name : 'none'
            }))
        );

        console.log('PhysicsSystem initialization complete');
        return Promise.resolve();
    }

    update(deltaTime) {
        if (!this.enabled) return;

        this.debugFrameCount++;
        
        // Step the physics world
        const fixedTimeStep = 1/60;
        const maxSubSteps = 10;
        try {
            this.physicsWorld.step(fixedTimeStep, deltaTime, maxSubSteps);
            
            // Log only meaningful contacts
            const significantContacts = this.physicsWorld.contacts.filter(c => 
                c.getImpactVelocityAlongNormal() > 1.0  // Increased threshold
            );
            
            if (significantContacts.length > 0) {
                console.log('Significant contacts:', significantContacts.map(contact => ({
                    bodyA: contact.bi ? { 
                        id: contact.bi.id, 
                        material: contact.bi.material?.name
                    } : 'unknown',
                    bodyB: contact.bj ? {
                        id: contact.bj.id,
                        material: contact.bj.material?.name
                    } : 'unknown',
                    force: contact.getImpactVelocityAlongNormal().toFixed(2)
                })));
            }
        } catch (error) {
            console.error('Physics step failed:', error);
            return;
        }

        // Update all physics bodies
        const entities = this.entityManager.getEntitiesByComponent('PhysicsBody');

        for (const entity of entities) {
            const physicsBody = entity.getComponent('PhysicsBody');
            if (!physicsBody || !physicsBody.body) continue;

            // Update component state from physics body
            physicsBody.position.copy(physicsBody.body.position);
            physicsBody.quaternion.copy(physicsBody.body.quaternion);
            physicsBody.velocity.copy(physicsBody.body.velocity);
            physicsBody.angularVelocity.copy(physicsBody.body.angularVelocity);

            // Debug logging for vehicle state only when significant movement or every 5 seconds
            if (physicsBody.vehicle && 
                (this.debugFrameCount % 300 === 0 || 
                Math.abs(physicsBody.velocity.length()) > 0.1)) {
                
                console.log('Vehicle state:', {
                    position: {
                        x: physicsBody.position.x.toFixed(2),
                        y: physicsBody.position.y.toFixed(2),
                        z: physicsBody.position.z.toFixed(2)
                    },
                    speed: physicsBody.velocity.length().toFixed(2),
                    wheelsInContact: physicsBody.vehicle.wheelInfos.filter(w => w.isInContact).length
                });
            }
        }
    }

    createGroundBody() {
        // Create a large ground plane for better vehicle movement
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0,  // Static body
            material: this.groundMaterial,
            shape: groundShape,
            collisionFilterGroup: 1,
            collisionFilterMask: -1
        });
        
        // Rotate and position the ground to match the visual plane
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        groundBody.position.set(0, -0.1, 0);  // Slightly lower to prevent z-fighting

        // Add a larger debug shape to visualize the ground plane collision
        const debugShape = new CANNON.Box(new CANNON.Vec3(100, 0.1, 100));  // Increased size
        const debugBody = new CANNON.Body({
            mass: 0,
            material: this.groundMaterial,
            shape: debugShape,
            collisionFilterGroup: 1,
            collisionFilterMask: -1
        });
        debugBody.position.set(0, -0.2, 0);  // Slightly below the ground plane
        this.physicsWorld.addBody(debugBody);

        console.log('Ground plane created:', {
            position: groundBody.position,
            quaternion: groundBody.quaternion,
            material: groundBody.material.name,
            friction: this.groundMaterial.friction
        });

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
        console.log('Cleaning up physics system...');
        console.log('Bodies before cleanup:', 
            this.physicsWorld.bodies.map(body => ({
                id: body.id,
                type: body.type,
                material: body.material?.name,
                position: body.position
            }))
        );

        // Remove all bodies from the physics world
        while(this.physicsWorld.bodies.length > 0) {
            const body = this.physicsWorld.bodies[0];
            console.log('Removing body:', {
                id: body.id,
                type: body.type,
                material: body.material?.name
            });
            this.physicsWorld.removeBody(body);
        }

        // Clear all contact materials
        this.physicsWorld.contactmaterials.length = 0;

        // Reset the ground plane
        const groundBody = this.createGroundBody();
        this.physicsWorld.addBody(groundBody);

        // Clear collision events
        this.collisionEvents = [];

        console.log('Physics cleanup complete. Remaining bodies:', 
            this.physicsWorld.bodies.map(body => ({
                id: body.id,
                type: body.type,
                material: body.material?.name
            }))
        );
    }
} 