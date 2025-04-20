import { System } from '../core/System.js';
import { VehicleComponent } from '../components/VehicleComponent.js';
import { MeshComponent } from '../components/MeshComponent.js';
import { PhysicsBody } from '../components/PhysicsBody.js';
import { InputComponent } from '../components/InputComponent.js';
import { VehicleControlsComponent } from '../components/VehicleControlsComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { WeaponComponent } from '../components/WeaponComponent.js';
import { AudioSystem } from './AudioSystem.js';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class VehicleSystem extends System {
    constructor(scene, physicsWorld) {
        super();
        this.requiredComponents = ['VehicleComponent', 'PhysicsBody', 'MeshComponent', 'InputComponent'];
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.vehicles = new Map();
        
        // Basic vehicle physics constants
        this.maxSteerVal = 0.5;
        this.normalForce = 2000;    // Reduced from 4000 for smoother acceleration
        this.boostForce = 3000;     // Reduced from 6000
        this.reverseForce = 1000;   // Reduced from 2000
        this.brakeForce = 50;       // Reduced from 100
        this.rollingResistance = 25; // Reduced from 50
        this.turnSpeed = 2.0;
        this.maxSpeed = 80;         // Reduced from 100
        
        // Debug counter
        this.debugFrameCount = 0;
    }

    async init(world) {
        if (!world) {
            console.warn('World not provided to VehicleSystem init');
            return Promise.resolve();
        }
        
        this.world = world;
        console.log('VehicleSystem initialized with world:', {
            hasWorld: !!this.world,
            scene: !!this.scene,
            physicsWorld: !!this.physicsWorld
        });
        
        return Promise.resolve();
    }

    createVehicle(type, position = new THREE.Vector3()) {
        console.log('Creating vehicle:', { type, position });
        
        if (!this.world) {
            throw new Error('World not initialized in VehicleSystem');
        }
        
        const entity = this.world.createEntity();
        
        // Create vehicle component with proper configuration
        const vehicleComponent = new VehicleComponent({
            type,
            maxHealth: 100,
            damageResistance: 1.0,
            isHeavyVehicle: type === 'tank',
            mass: this.getVehicleMass(type)
        });
        entity.addComponent(vehicleComponent);

        // Create mesh component with proper vehicle mesh
        const vehicleGroup = this.createVehicleMesh(type);
        const meshComponent = new MeshComponent(vehicleGroup);
        entity.addComponent(meshComponent);
        
        // Add mesh to scene
        if (this.scene) {
            this.scene.add(vehicleGroup);
            console.log('Added vehicle mesh to scene:', {
                type,
                position: vehicleGroup.position,
                meshChildren: vehicleGroup.children.length
            });
        } else {
            console.error('Scene not available for vehicle mesh');
        }

        // Create vehicle shape
        const shape = this.createVehicleShape(type);
        
        // Create physics body
        const body = new CANNON.Body({
            mass: this.getVehicleMass(type),
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y + 0.2, position.z), // Lower initial position
            material: new CANNON.Material('vehicleMaterial'),
            linearDamping: 0.2,
            angularDamping: 0.2
        });

        // Add body to physics world immediately
        this.physicsWorld.addBody(body);

        // Create vehicle with proper axis configuration
        const vehicle = new CANNON.RaycastVehicle({
            chassisBody: body,
            indexRightAxis: 0,    // X axis is right
            indexUpAxis: 1,       // Y axis is up
            indexForwardAxis: 2,  // Z axis is forward
        });

        // Add wheels with proper configuration
        const wheelOptions = {
            radius: 0.3,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: 25,  // Reduced from 30 for smoother ride
            suspensionRestLength: 0.3, // Increased from 0.2 to raise vehicle
            frictionSlip: 1.5,        // Reduced from 2.0 for less jerky movement
            dampingRelaxation: 2.5,   // Adjusted for smoother suspension
            dampingCompression: 2.5,  // Adjusted for smoother suspension
            maxSuspensionForce: 50000, // Reduced from 100000
            rollInfluence: 0.05,      // Increased from 0.01 for better stability
            axleLocal: new CANNON.Vec3(1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1, 0, 1),
            maxSuspensionTravel: 0.3, // Increased from 0.2
            customSlidingRotationalSpeed: -20, // Reduced from -30
            useCustomSlidingRotationalSpeed: true
        };

        // Add wheels at proper positions
        const FRONT_AXLE = -1.0;
        const REAR_AXLE = 1.0;
        const WHEEL_Y = -0.5;  // Lowered from -0.4 to -0.5 for better wheel positioning
        const WHEEL_X = 0.8;

        // Front left
        wheelOptions.chassisConnectionPointLocal.set(-WHEEL_X, WHEEL_Y, FRONT_AXLE);
        vehicle.addWheel(wheelOptions);

        // Front right
        wheelOptions.chassisConnectionPointLocal.set(WHEEL_X, WHEEL_Y, FRONT_AXLE);
        vehicle.addWheel(wheelOptions);

        // Rear left
        wheelOptions.chassisConnectionPointLocal.set(-WHEEL_X, WHEEL_Y, REAR_AXLE);
        vehicle.addWheel(wheelOptions);

        // Rear right
        wheelOptions.chassisConnectionPointLocal.set(WHEEL_X, WHEEL_Y, REAR_AXLE);
        vehicle.addWheel(wheelOptions);

        // Add vehicle to physics world
        vehicle.addToWorld(this.physicsWorld);

        // Create physics body component
        const physicsBody = new PhysicsBody(body, vehicle);
        entity.addComponent(physicsBody);

        // Add input component
        const inputComponent = new InputComponent();
        entity.addComponent(inputComponent);

        // Store vehicle reference and log debug info
        this.vehicles.set(entity.id, entity);
        
        console.log('Vehicle components status:', {
            hasVehicleComponent: entity.hasComponent('VehicleComponent'),
            hasPhysicsBody: entity.hasComponent('PhysicsBody'),
            hasMeshComponent: entity.hasComponent('MeshComponent'),
            hasInputComponent: entity.hasComponent('InputComponent'),
            entityId: entity.id,
            vehiclesMapSize: this.vehicles.size
        });

        return entity;
    }

    getVehicleStats(type) {
        const stats = {
            muscle: { speed: 8, handling: 6, durability: 5 },
            ironclad: { speed: 4, handling: 5, durability: 9 },
            scorpion: { speed: 6, handling: 9, durability: 4 },
            tank: { speed: 3, handling: 3, durability: 10 },
            drone: { speed: 10, handling: 8, durability: 2 }
        };
        return stats[type] || stats.muscle;
    }

    getVehicleMass(type) {
        const masses = {
            muscle: 1000,
            ironclad: 1500,
            scorpion: 800,
            tank: 2000,
            drone: 500
        };
        return masses[type] || 1000;
    }

    createVehicleShape(type) {
        const dimensions = {
            muscle: { width: 2.4, height: 1.0, length: 5.0 },
            ironclad: { width: 2.8, height: 1.2, length: 5.6 },
            scorpion: { width: 2.2, height: 0.8, length: 4.6 },
            tank: { width: 3.2, height: 1.4, length: 6.0 },
            drone: { width: 2.0, height: 0.6, length: 4.0 }
        };
        
        const dim = dimensions[type] || dimensions.muscle;
        
        // Create shape with half-dimensions for CANNON.js
        const shape = new CANNON.Box(new CANNON.Vec3(
            dim.width * 0.5,  // Half-width
            dim.height * 0.5, // Half-height
            dim.length * 0.5  // Half-length
        ));
        
        // Set collision groups
        shape.collisionFilterGroup = 2;  // Vehicle group
        shape.collisionFilterMask = -1;  // Collide with everything
        
        return shape;
    }

    createVehicleMesh(type) {
        // Create a group to hold all vehicle parts
        const group = new THREE.Group();

        // Base dimensions for the chassis (doubled to match physics body)
        const dimensions = {
            muscle: { width: 2.4, height: 1.0, length: 5.0 },
            ironclad: { width: 2.8, height: 1.2, length: 5.6 },
            scorpion: { width: 2.2, height: 0.8, length: 4.6 },
            tank: { width: 3.2, height: 1.4, length: 6.0 },
            drone: { width: 2.0, height: 0.6, length: 4.0 }
        };

        const dim = dimensions[type] || dimensions.muscle;

        // Create the main body geometry
        const bodyGeometry = new THREE.BoxGeometry(dim.width, dim.height, dim.length);
        
        // Create material with proper color and properties
        const bodyMaterial = new THREE.MeshPhysicalMaterial({
            color: this.getVehicleColor(type),
            metalness: 0.7,
            roughness: 0.3,
            clearcoat: 0.5,
            clearcoatRoughness: 0.3
        });

        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        group.add(bodyMesh);

        // Add wheels with proper dimensions
        const wheelRadius = 0.5;
        const wheelThickness = 0.3;
        const wheelSegments = 32;
        const wheelGeometry = new THREE.CylinderGeometry(
            wheelRadius,
            wheelRadius,
            wheelThickness,
            wheelSegments
        );

        const wheelMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x202020,
            metalness: 0.9,
            roughness: 0.4,
            clearcoat: 0.3
        });

        // Wheel positions relative to body
        const wheelPositions = [
            { x: -dim.width/2 + wheelThickness/2, y: -dim.height/2, z: dim.length/3 },    // Front Left
            { x: dim.width/2 - wheelThickness/2, y: -dim.height/2, z: dim.length/3 },     // Front Right
            { x: -dim.width/2 + wheelThickness/2, y: -dim.height/2, z: -dim.length/3 },   // Rear Left
            { x: dim.width/2 - wheelThickness/2, y: -dim.height/2, z: -dim.length/3 }     // Rear Right
        ];

        wheelPositions.forEach((pos, index) => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos.x, pos.y, pos.z);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            wheel.name = `wheel_${index}`;
            group.add(wheel);
        });

        // Add vehicle-specific details
        switch(type) {
            case 'muscle':
                // Add hood scoop
                const scoopGeometry = new THREE.BoxGeometry(dim.width * 0.4, dim.height * 0.3, dim.length * 0.2);
                const scoopMaterial = new THREE.MeshPhysicalMaterial({ 
                    color: 0x111111,
                    metalness: 0.8,
                    roughness: 0.2
                });
                const scoop = new THREE.Mesh(scoopGeometry, scoopMaterial);
                scoop.position.set(0, dim.height/2, dim.length/4);
                group.add(scoop);
                break;

            case 'tank':
                // Add turret
                const turretGeometry = new THREE.CylinderGeometry(dim.width * 0.3, dim.width * 0.35, dim.height, 8);
                const turretMaterial = new THREE.MeshPhysicalMaterial({ 
                    color: 0x3a5a3a,
                    metalness: 0.7,
                    roughness: 0.6
                });
                const turret = new THREE.Mesh(turretGeometry, turretMaterial);
                turret.position.set(0, dim.height/2 + dim.height * 0.3, 0);
                group.add(turret);

                // Add gun barrel
                const barrelGeometry = new THREE.CylinderGeometry(0.1, 0.1, dim.length * 0.7, 8);
                const barrel = new THREE.Mesh(barrelGeometry, turretMaterial);
                barrel.rotation.z = Math.PI / 2;
                barrel.position.set(0, dim.height/2 + dim.height * 0.3, dim.length * 0.3);
                group.add(barrel);
                break;

            case 'drone':
                // Add wings
                const wingGeometry = new THREE.BoxGeometry(dim.width * 2.5, dim.height * 0.1, dim.length * 0.3);
                const wingMaterial = new THREE.MeshPhysicalMaterial({ 
                    color: 0x0066cc,
                    metalness: 0.9,
                    roughness: 0.1
                });
                const wings = new THREE.Mesh(wingGeometry, wingMaterial);
                wings.position.set(0, 0, 0);
                group.add(wings);
                break;
        }

        // Add windshield for cars
        if (type !== 'tank' && type !== 'drone') {
            const windshieldGeometry = new THREE.BoxGeometry(
                dim.width * 0.7,
                dim.height * 0.4,
                dim.length * 0.3
            );
            const windshieldMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x111111,
                metalness: 0.9,
                roughness: 0.2,
                transparent: true,
                opacity: 0.7,
                transmission: 0.5
            });
            const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
            windshield.position.set(0, dim.height/2 + dim.height * 0.1, dim.length/6);
            group.add(windshield);
        }

        // Add headlights
        if (type !== 'drone') {
            const headlightGeometry = new THREE.CircleGeometry(0.15, 16);
            const headlightMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xffffee,
                emissive: 0xffffee,
                emissiveIntensity: 1,
                metalness: 0.9,
                roughness: 0.1
            });

            // Left headlight
            const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
            leftHeadlight.position.set(-dim.width/3, 0, dim.length/2 - 0.1);
            leftHeadlight.rotation.y = Math.PI;
            group.add(leftHeadlight);

            // Right headlight
            const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
            rightHeadlight.position.set(dim.width/3, 0, dim.length/2 - 0.1);
            rightHeadlight.rotation.y = Math.PI;
            group.add(rightHeadlight);
        }

        // Add debug axes helper in development
        if (process.env.NODE_ENV === 'development') {
            const axesHelper = new THREE.AxesHelper(2);
            group.add(axesHelper);
        }

        // Ensure the group is properly positioned
        group.position.copy(bodyMesh.position);
        
        return group;
    }

    update(deltaTime) {
        for (const entity of this.vehicles.values()) {
            // Log component presence for debugging
            console.log('Vehicle update - Entity components:', {
                entityId: entity.id,
                hasInput: entity.hasComponent('InputComponent'),
                hasPhysicsBody: entity.hasComponent('PhysicsBody'),
                hasVehicleComponent: entity.hasComponent('VehicleComponent'),
                hasMeshComponent: entity.hasComponent('MeshComponent')
            });

            const input = entity.getComponent('InputComponent');
            const physicsBody = entity.getComponent('PhysicsBody');
            const vehicleComponent = entity.getComponent('VehicleComponent');
            const meshComponent = entity.getComponent('MeshComponent');

            if (!input || !physicsBody || !vehicleComponent || !meshComponent) {
                console.warn('Missing required components for vehicle update:', {
                    hasInput: !!input,
                    hasPhysicsBody: !!physicsBody,
                    hasVehicleComponent: !!vehicleComponent,
                    hasMeshComponent: !!meshComponent,
                    entityId: entity.id
                });
                continue;
            }

            // Reset forces first
            for (let i = 0; i < physicsBody.vehicle.wheelInfos.length; i++) {
                physicsBody.vehicle.setBrake(0, i);
            }

            const REAR_WHEELS = [2, 3];
            const FRONT_WHEELS = [0, 1];

            // Calculate mass-adjusted forces
            const mass = physicsBody.body.mass;
            const massMultiplier = Math.sqrt(mass / 1000); // Square root scaling for better heavy vehicle handling

            // Calculate engine force based on input state with mass adjustment
            let engineForce = 0;
            if (input.forward) {
                engineForce = this.normalForce * massMultiplier * (input.boost ? 1.5 : 1.0);
            } else if (input.backward) {
                engineForce = -this.reverseForce * massMultiplier;
            }

            // Calculate steering force based on input state
            let steeringForce = 0;
            if (input.left) {
                steeringForce = this.maxSteerVal / Math.max(1, Math.log10(massMultiplier)); // Reduce steering for heavier vehicles
            } else if (input.right) {
                steeringForce = -this.maxSteerVal / Math.max(1, Math.log10(massMultiplier));
            }

            // Calculate brake force with mass adjustment
            let brakeForce = input.brake ? this.brakeForce * massMultiplier : 0;

            // Apply rolling resistance when no input, scaled with mass
            if (!input.forward && !input.backward) {
                brakeForce = this.rollingResistance * Math.sqrt(massMultiplier);
            }

            // Get current velocity for force adjustment
            const velocity = physicsBody.body.velocity.length();
            const maxVelocity = this.maxSpeed / massMultiplier;

            // Apply velocity-based force reduction
            if (velocity > maxVelocity * 0.75) {
                const reduction = 1 - (velocity - maxVelocity * 0.75) / (maxVelocity * 0.25);
                engineForce *= Math.max(0.1, reduction);
            }

            // Apply forces to wheels
            REAR_WHEELS.forEach(wheelIndex => {
                physicsBody.vehicle.applyEngineForce(engineForce, wheelIndex);
                physicsBody.vehicle.setBrake(brakeForce, wheelIndex);
            });

            FRONT_WHEELS.forEach(wheelIndex => {
                physicsBody.vehicle.setSteeringValue(steeringForce, wheelIndex);
                physicsBody.vehicle.setBrake(brakeForce, wheelIndex);
            });

            // Update mesh position and rotation from physics body
            if (physicsBody.body) {
                meshComponent.mesh.position.copy(physicsBody.body.position);
                meshComponent.mesh.quaternion.copy(physicsBody.body.quaternion);
            }

            // Debug logging for vehicle state
            if (input.hasChanged()) {
                console.log('Vehicle state:', {
                    type: vehicleComponent.type,
                    mass: mass,
                    massMultiplier: massMultiplier,
                    forward: input.forward,
                    backward: input.backward,
                    left: input.left,
                    right: input.right,
                    brake: input.brake,
                    boost: input.boost,
                    engineForce: engineForce,
                    steeringForce: steeringForce,
                    brakeForce: brakeForce,
                    velocity: velocity,
                    position: physicsBody.body.position.toArray(),
                    wheelsInContact: physicsBody.vehicle.wheelInfos.filter(w => w.isInContact).length
                });
            }
        }
        this.debugFrameCount++;
    }

    handleCollision(entity, otherEntity, event) {
        const impactForce = event.contact.getImpactVelocityAlongNormal();
        if (Math.abs(impactForce) > 5) {
            // Play impact sound
            const audioSystem = this.world.getSystem('AudioSystem');
            if (audioSystem) {
                audioSystem.playSound('impact', {
                    volume: Math.min(Math.abs(impactForce) / 10, 1)
                });
            }

            // Apply damage based on impact force
            const vehicleComponent = entity.getComponent('VehicleComponent');
            if (vehicleComponent) {
                const damage = Math.abs(impactForce) * (1 - vehicleComponent.damageResistance);
                vehicleComponent.health -= damage;

                if (vehicleComponent.health <= 0) {
                    this.destroyVehicle(entity);
                }
            }
        }
    }

    destroyVehicle(entity) {
        // TODO: Add explosion effect
        this.removeVehicle(entity);
    }

    removeVehicle(entity) {
        const vehicle = this.vehicles.get(entity.id);
        if (!vehicle) return;

        const physicsBody = vehicle.getComponent(PhysicsBody);
        const meshComponent = vehicle.getComponent(MeshComponent);

        if (physicsBody) {
            if (physicsBody.vehicle) {
                physicsBody.vehicle.removeFromWorld(this.physicsWorld);
            }
            this.physicsWorld.removeBody(physicsBody.body);
        }

        if (meshComponent && meshComponent.mesh) {
            this.scene.remove(meshComponent.mesh);
            meshComponent.mesh.geometry.dispose();
            meshComponent.mesh.material.dispose();
        }

        this.vehicles.delete(entity.id);
        this.world.removeEntity(entity);
    }

    cleanup() {
        for (const entity of this.vehicles.values()) {
            this.removeVehicle(entity);
        }
        this.vehicles.clear();
    }

    getVehicleColor(type) {
        const colors = {
            muscle: 0xff4400,    // Bright orange-red
            ironclad: 0x505050,  // Metallic gray
            scorpion: 0x00ff88,  // Neon green
            tank: 0x336633,      // Military green
            drone: 0x0088ff      // Electric blue
        };
        return colors[type] || colors.muscle;
    }
} 