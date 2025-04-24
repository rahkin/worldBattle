import { System } from '../core/System.js';
import { VehicleComponent } from '../components/VehicleComponent.js';
import { MeshComponent } from '../components/MeshComponent.js';
import { PhysicsBody } from '../components/PhysicsBody.js';
import { InputComponent } from '../components/InputComponent.js';
import { VehicleControls } from '../components/VehicleControls.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { WeaponComponent } from '../components/WeaponComponent.js';
import { AudioSystem } from './AudioSystem.js';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class VehicleSystem extends System {
    constructor(scene, physicsWorld) {
        super();
        if (!scene || !physicsWorld) {
            throw new Error('VehicleSystem requires scene and physicsWorld parameters');
        }
        
        this.requiredComponents = ['VehicleComponent', 'PhysicsBody', 'MeshComponent', 'InputComponent'];
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.vehicles = new Map();
        
        // Basic vehicle physics constants
        this.maxSteerVal = 0.5;
        this.normalForce = 3000;    // Increased for better acceleration
        this.boostForce = 4500;     // Increased for more noticeable boost
        this.reverseForce = 1500;   // Increased for better reverse
        this.brakeForce = 100;      // Increased for better stopping power
        this.rollingResistance = 15; // Reduced for less drag
        this.turnSpeed = 2.5;       // Increased for more responsive turning
        this.maxSpeed = 100;        // Increased max speed
        
        console.log('VehicleSystem constructed with:', {
            hasScene: !!this.scene,
            hasPhysicsWorld: !!this.physicsWorld,
            maxSteerVal: this.maxSteerVal,
            normalForce: this.normalForce
        });
    }

    async init(world) {
        if (!world) {
            throw new Error('World not provided to VehicleSystem init');
        }
        
        this.world = world;
        
        // Create vehicle physics material
        this.vehicleMaterial = new CANNON.Material('vehicleMaterial');
        const groundMaterial = new CANNON.Material('groundMaterial');
        
        // Create contact material between vehicle and ground
        const vehicleGroundContact = new CANNON.ContactMaterial(
            this.vehicleMaterial,
            groundMaterial,
            {
                friction: 0.3,
                restitution: 0.3,
                contactEquationStiffness: 1e6,
                contactEquationRelaxation: 3
            }
        );
        
        // Add contact material to world
        this.physicsWorld.addContactMaterial(vehicleGroundContact);
        
        console.log('VehicleSystem initialized with world:', {
            hasWorld: !!this.world,
            hasScene: !!this.scene,
            hasPhysicsWorld: !!this.physicsWorld,
            hasVehicleMaterial: !!this.vehicleMaterial
        });
        
        return Promise.resolve();
    }

    createVehicle(type, position = new THREE.Vector3()) {
        console.log('Creating vehicle:', { type, position });
        
        if (!this.world) {
            throw new Error('World not initialized in VehicleSystem');
        }
        
        if (!this.scene) {
            throw new Error('Scene not available in VehicleSystem');
        }
        
        if (!this.physicsWorld) {
            throw new Error('PhysicsWorld not available in VehicleSystem');
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
            this.scene.add(vehicleGroup);
            console.log('Added vehicle mesh to scene:', {
                type,
                position: vehicleGroup.position,
                meshChildren: vehicleGroup.children.length
            });

        // Create vehicle shape
        const shape = this.createVehicleShape(type);
        
        // Create physics body
        const body = new CANNON.Body({
            mass: this.getVehicleMass(type),
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y + 0.5, position.z),
            material: this.vehicleMaterial,
            linearDamping: 0.1,
            angularDamping: 0.3,
            allowSleep: false
        });

        // Create vehicle
        const vehicle = new CANNON.RaycastVehicle({
            chassisBody: body,
            indexRightAxis: 0,  // x
            indexUpAxis: 1,     // y
            indexForwardAxis: 2 // z
        });

        // Set up wheels
        const wheelOptions = {
            radius: 0.5,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: 30,
            suspensionRestLength: 0.3,
            frictionSlip: 5,
            dampingRelaxation: 2.3,
            dampingCompression: 4.4,
            maxSuspensionForce: 100000,
            rollInfluence: 0.01,
            axleLocal: new CANNON.Vec3(1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1, 0, 1),
            maxSuspensionTravel: 0.3,
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true
        };

        // Add wheels
        const width = shape.halfExtents.x * 0.9; // Bring wheels slightly closer
        const height = -shape.halfExtents.y;
        const front = shape.halfExtents.z * 0.6;

        // Front left (Now using -front for Z)
        wheelOptions.chassisConnectionPointLocal.set(-width, height, -front);
        wheelOptions.isFrontWheel = true;
        vehicle.addWheel(wheelOptions);

        // Front right (Now using -front for Z)
        wheelOptions.chassisConnectionPointLocal.set(width, height, -front);
        wheelOptions.isFrontWheel = true;
        vehicle.addWheel(wheelOptions);

        // Rear left (Now using front for Z)
        wheelOptions.chassisConnectionPointLocal.set(-width, height, front);
        wheelOptions.isFrontWheel = false;
        vehicle.addWheel(wheelOptions);

        // Rear right (Now using front for Z)
        wheelOptions.chassisConnectionPointLocal.set(width, height, front);
        wheelOptions.isFrontWheel = false;
        vehicle.addWheel(wheelOptions);

        // Add vehicle to world
        vehicle.addToWorld(this.physicsWorld);

        // Create physics body component with vehicle
        const physicsBody = new PhysicsBody(body, vehicle);
        entity.addComponent(physicsBody);

        // Add input component
        const inputComponent = new InputComponent();
        entity.addComponent(inputComponent);

        // Store vehicle reference
        this.vehicles.set(entity.id, entity);
        
        console.log('Vehicle created successfully:', {
            entityId: entity.id,
            type,
            position,
            components: {
            hasVehicleComponent: entity.hasComponent('VehicleComponent'),
            hasPhysicsBody: entity.hasComponent('PhysicsBody'),
            hasMeshComponent: entity.hasComponent('MeshComponent'),
                hasInputComponent: entity.hasComponent('InputComponent')
            }
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

        // Base dimensions for the chassis
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

        // Wheel positions relative to body (Swapped front/rear Z positions, tighter X)
        const visualWidth = dim.width/2 * 0.9; // Match tighter physics setup
        const wheelPositions = [
            { x: -visualWidth, y: -dim.height/2, z: -dim.length/3 },    // Front Left
            { x: visualWidth, y: -dim.height/2, z: -dim.length/3 },     // Front Right
            { x: -visualWidth, y: -dim.height/2, z: dim.length/3 },   // Rear Left
            { x: visualWidth, y: -dim.height/2, z: dim.length/3 }     // Rear Right
        ];

        wheelPositions.forEach((pos, index) => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos.x, pos.y, pos.z);
            
            // Set initial wheel orientation - rotate to make wheels vertical
            wheel.rotation.z = Math.PI / 2; // This makes the wheel vertical (standing up)
            
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

        return group;
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

    update(deltaTime) {
        for (const entity of this.vehicles.values()) {
            const input = entity.getComponent('InputComponent');
            const physicsBody = entity.getComponent('PhysicsBody');
            const vehicleComponent = entity.getComponent('VehicleComponent');
            const meshComponent = entity.getComponent('MeshComponent');

            if (!input || !physicsBody || !vehicleComponent || !meshComponent) {
                console.warn('Missing required components for vehicle update');
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
                steeringForce = this.maxSteerVal / Math.max(1, Math.log10(massMultiplier));
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
            if (physicsBody.body && physicsBody.vehicle) {
                meshComponent.mesh.position.copy(physicsBody.body.position);
                meshComponent.mesh.quaternion.copy(physicsBody.body.quaternion);

                // Update wheel positions and rotations
                const wheels = meshComponent.mesh.children.filter(child => child.name.startsWith('wheel_'));
                
                for (let i = 0; i < Math.min(wheels.length, physicsBody.vehicle.wheelInfos.length); i++) {
                    const wheelInfo = physicsBody.vehicle.wheelInfos[i];
                    if (wheelInfo) {
                        physicsBody.vehicle.updateWheelTransform(i);
                        
                        const wheelMesh = wheels[i];
                        const transform = wheelInfo.worldTransform;
                        
                        // Convert wheel transform to local space relative to vehicle
                        const worldPos = new THREE.Vector3(
                            transform.position.x, 
                            transform.position.y, 
                            transform.position.z
                        );
                        
                        const vehicleWorldPos = new THREE.Vector3();
                        meshComponent.mesh.getWorldPosition(vehicleWorldPos);
                        worldPos.sub(vehicleWorldPos);
                        worldPos.applyQuaternion(meshComponent.mesh.quaternion.clone().invert());
                        
                        // Apply position
                        wheelMesh.position.copy(worldPos);
                        
                        // --- Rotation Logic --- 
                        // 1. Reset to initial vertical orientation (Z rotation)
                        wheelMesh.rotation.set(0, 0, Math.PI / 2);
                        
                        // 2. Apply steering rotation (around local X axis - vertical axis after Z rotation)
                        if (i < 2) { // Front wheels only
                           // Use rotateX for steering around the new vertical axis
                           wheelMesh.rotateX(wheelInfo.steering * 0.9); 
                        }
                        
                        // 3. Add wheel rolling rotation (around local Y axis - axle axis after Z rotation)
                        const speed = physicsBody.body.velocity.length();
                        // Determine direction based on wheel index (e.g., left vs right)
                        const rollDirection = (i % 2 === 0) ? 1 : -1; 
                        // Use rotateY for rolling around the axle
                        wheelMesh.rotateY(speed * deltaTime * 2 * rollDirection);
                    }
                }
            }
        }
    }

    cleanup() {
        for (const entity of this.vehicles.values()) {
            this.removeVehicle(entity);
        }
        this.vehicles.clear();
    }

    removeVehicle(entity) {
        const vehicle = this.vehicles.get(entity.id);
        if (!vehicle) return;

        const physicsBody = vehicle.getComponent('PhysicsBody');
        const meshComponent = vehicle.getComponent('MeshComponent');

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
}