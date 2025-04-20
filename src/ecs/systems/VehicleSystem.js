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
        this.requiredComponents = [VehicleComponent, PhysicsBody, MeshComponent, VehicleControlsComponent];
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.vehicles = new Map();
        
        // Basic vehicle physics constants
        this.maxSteerVal = 0.5;
        this.normalForce = 4000;
        this.boostForce = 6000;
        this.reverseForce = 2000;
        this.brakeForce = 100;
        this.rollingResistance = 50;
        this.turnSpeed = 2.0;
        this.maxSpeed = 100;
    }

    init(world) {
        super.init(world);
        if (!this.world) {
            throw new Error('World not initialized in VehicleSystem');
        }
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
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: new CANNON.Material('vehicleMaterial'),
            linearDamping: 0.1,
            angularDamping: 0.1
        });

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
            suspensionStiffness: 30,
            suspensionRestLength: 0.2,
            frictionSlip: 2.0,
            dampingRelaxation: 2.3,
            dampingCompression: 4.4,
            maxSuspensionForce: 100000,
            rollInfluence: 0.01,
            axleLocal: new CANNON.Vec3(1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1, 0, 1),
            maxSuspensionTravel: 0.2,
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true
        };

        // Add wheels at proper positions
        const FRONT_AXLE = -1.0;
        const REAR_AXLE = 1.0;
        const WHEEL_Y = 0.0;
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

        // Add vehicle controls
        const vehicleControls = new VehicleControlsComponent();
        entity.addComponent(vehicleControls);

        // Add input component
        const inputComponent = new InputComponent();
        entity.addComponent(inputComponent);

        // Store vehicle reference
        this.vehicles.set(entity.id, entity);

        console.log('Vehicle created successfully:', {
            type,
            position: body.position,
            mass: body.mass,
            components: {
                vehicle: !!vehicleComponent,
                mesh: !!meshComponent,
                physics: !!physicsBody,
                controls: !!vehicleControls,
                input: !!inputComponent
            },
            wheels: vehicle.wheelInfos.length
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
            ironclad: 1200,
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
            const input = entity.getComponent(InputComponent);
            const physicsBody = entity.getComponent(PhysicsBody);
            const vehicleControls = entity.getComponent(VehicleControlsComponent);
            const meshComponent = entity.getComponent(MeshComponent);

            if (!input || !physicsBody || !vehicleControls || !meshComponent) continue;

            const hasSettled = Math.abs(physicsBody.body.velocity.y) < 0.5;
            
            // Reset forces first
            for (let i = 0; i < physicsBody.vehicle.wheelInfos.length; i++) {
                physicsBody.vehicle.setBrake(0, i);
                physicsBody.vehicle.applyEngineForce(0, i);
            }

            const REAR_WHEELS = [2, 3];
            let forcesApplied = false;
            let currentForce = 0;

            if (hasSettled) {
                if (input.forward) {
                    const force = input.boost ? this.boostForce : this.normalForce;
                    currentForce = -force;  // Negative force for forward (reversed)
                    forcesApplied = true;
                    REAR_WHEELS.forEach(wheelIndex => {
                        physicsBody.vehicle.applyEngineForce(-force, wheelIndex);
                    });
                } else if (input.backward) {
                    currentForce = this.reverseForce;  // Positive force for reverse (reversed)
                    forcesApplied = true;
                    REAR_WHEELS.forEach(wheelIndex => {
                        physicsBody.vehicle.applyEngineForce(this.reverseForce, wheelIndex);
                    });
                } else {
                    // Apply rolling resistance when no input
                    const speed = physicsBody.body.velocity.length();
                    if (speed > 0.1) {
                        const resistance = Math.min(this.rollingResistance, speed * 100);
                        for (let i = 0; i < physicsBody.vehicle.wheelInfos.length; i++) {
                            physicsBody.vehicle.setBrake(resistance, i);
                        }
                    }
                }

                // Log detailed vehicle state when forces are applied
                if (forcesApplied) {
                    console.log('Vehicle physics state:', {
                        force: currentForce,
                        position: {
                            x: physicsBody.position.x.toFixed(2),
                            y: physicsBody.position.y.toFixed(2),
                            z: physicsBody.position.z.toFixed(2)
                        },
                        rotation: {
                            x: physicsBody.quaternion.x.toFixed(2),
                            y: physicsBody.quaternion.y.toFixed(2),
                            z: physicsBody.quaternion.z.toFixed(2),
                            w: physicsBody.quaternion.w.toFixed(2)
                        },
                        velocity: {
                            x: physicsBody.velocity.x.toFixed(2),
                            y: physicsBody.velocity.y.toFixed(2),
                            z: physicsBody.velocity.z.toFixed(2)
                        },
                        wheelsInContact: physicsBody.vehicle.wheelInfos.filter(w => w.isInContact).length,
                        speed: physicsBody.velocity.length().toFixed(2)
                    });
                }

                // Apply steering based on input
                let steering = 0;
                if (input.left) {
                    steering = this.maxSteerVal;
                    physicsBody.vehicle.setSteeringValue(this.maxSteerVal, 0);
                    physicsBody.vehicle.setSteeringValue(this.maxSteerVal, 1);
                } else if (input.right) {
                    steering = -this.maxSteerVal;
                    physicsBody.vehicle.setSteeringValue(-this.maxSteerVal, 0);
                    physicsBody.vehicle.setSteeringValue(-this.maxSteerVal, 1);
                } else {
                    physicsBody.vehicle.setSteeringValue(0, 0);
                    physicsBody.vehicle.setSteeringValue(0, 1);
                }
            }

            // Update mesh position and rotation from physics body
            if (physicsBody.body) {
                meshComponent.mesh.position.copy(physicsBody.body.position);
                meshComponent.mesh.quaternion.copy(physicsBody.body.quaternion);
            }
        }
        this.debugFrameCount++;
    }

    handleCollision(entity, otherEntity, event) {
        const impactForce = event.contact.getImpactVelocityAlongNormal();
        if (Math.abs(impactForce) > 5) {
            // Play impact sound
            this.world.getSystem(AudioSystem)?.playSound('impact', {
                volume: Math.min(Math.abs(impactForce) / 10, 1)
            });

            // Apply damage based on impact force
            const vehicleComponent = entity.getComponent(VehicleComponent);
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