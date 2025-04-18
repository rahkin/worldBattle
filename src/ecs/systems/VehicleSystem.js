import { System } from '../System.js';
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
        this.requiredComponents = [VehicleComponent, PhysicsBody, MeshComponent, VehicleControls];
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.vehicles = new Map();
        
        // Vehicle physics constants
        this.maxSteerVal = 0.5;
        this.normalForce = 1800;
        this.boostForce = 2200;
        this.reverseForce = 800;
        this.brakeForce = 100;
        this.turnSpeed = 2.0;
        this.maxSpeed = 50;
    }

    init() {
        super.init();
        if (!this.world) {
            throw new Error('World not initialized in VehicleSystem');
        }
        return Promise.resolve();
    }

    createVehicle(type, position = new THREE.Vector3()) {
        if (!this.world) {
            throw new Error('World not initialized in VehicleSystem');
        }

        const entity = this.world.createEntity();
        
        // Create vehicle component
        const vehicleComponent = new VehicleComponent({
            type,
            maxHealth: 100,
            damageResistance: 1.0,
            isHeavyVehicle: type === 'tank',
            stats: this.getVehicleStats(type)
        });
        entity.addComponent(vehicleComponent);

        // Create physics body
        const shape = this.createVehicleShape(type);
        const body = new CANNON.Body({
            mass: this.getVehicleMass(type),
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y + 1, position.z), // Raise initial position
            material: new CANNON.Material('vehicleMaterial')
        });

        // Set up physics body properties
        body.linearDamping = 0.1;
        body.angularDamping = 0.1;
        body.allowSleep = false;
        
        // Create vehicle physics
        const vehicle = new CANNON.RaycastVehicle({
            chassisBody: body,
            indexRightAxis: 0,
            indexUpAxis: 1,
            indexForwardAxis: 2
        });

        // Add wheels based on vehicle type
        this.addWheels(vehicle, type);
        vehicle.addToWorld(this.physicsWorld);
        
        // Create physics body component
        const physicsBody = new PhysicsBody(body, vehicle);
        entity.addComponent(physicsBody);

        // Create vehicle controls
        const vehicleControls = new VehicleControls({ type });
        entity.addComponent(vehicleControls);

        // Create mesh
        const mesh = this.createVehicleMesh(type);
        entity.addComponent(new MeshComponent(mesh));
        this.scene.add(mesh);

        // Add input component
        const inputComponent = new InputComponent();
        entity.addComponent(inputComponent);

        // Add weapon component
        const weaponComponent = new WeaponComponent({
            type: 'machineGun',
            damage: 10,
            fireRate: 0.1,
            range: 100,
            ammo: 100,
            maxAmmo: 100,
            reloadTime: 2.0,
            offset: new THREE.Vector3(0, 0.5, -1.5) // Position relative to vehicle
        });
        entity.addComponent(weaponComponent);

        // Add collision component
        const collisionComponent = new CollisionComponent({
            collisionGroup: 2, // Vehicle group
            collisionMask: ~2, // Collide with everything except vehicles
            onCollide: (otherEntity, event) => this.handleCollision(entity, otherEntity, event)
        });
        entity.addComponent(collisionComponent);

        this.vehicles.set(entity.id, entity);
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
            muscle: 1500,
            ironclad: 2000,
            scorpion: 1200,
            tank: 3000,
            drone: 800
        };
        return masses[type] || 1500;
    }

    createVehicleShape(type) {
        const dimensions = {
            muscle: { width: 1.2, height: 0.6, length: 2.5 },    // Increased height
            ironclad: { width: 1.4, height: 0.7, length: 2.8 },  // Increased height
            scorpion: { width: 1.1, height: 0.5, length: 2.3 },  // Increased height
            tank: { width: 1.6, height: 0.8, length: 3.0 },      // Increased height
            drone: { width: 1.0, height: 0.4, length: 2.0 }      // Increased height
        };
        
        const dim = dimensions[type] || dimensions.muscle;
        return new CANNON.Box(new CANNON.Vec3(dim.width, dim.height, dim.length));
    }

    createVehicleMesh(type) {
        // Create a group to hold all the vehicle parts
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
        
        // Create main body
        const bodyGeometry = new THREE.BoxGeometry(dim.width, dim.height, dim.length);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: this.getVehicleColor(type),
            metalness: type === 'ironclad' ? 0.8 : 0.5,
            roughness: type === 'ironclad' ? 0.2 : 0.6
        });

        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        group.add(bodyMesh);

        // Add weapon mesh based on vehicle type
        const weaponMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333, 
            metalness: 0.8, 
            roughness: 0.2 
        });

        switch(type) {
            case 'muscle':
                // Add machine gun on top
                const gunGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
                const gun = new THREE.Mesh(gunGeometry, weaponMaterial);
                gun.position.set(0, dim.height/2 + 0.4, -dim.length/3);
                gun.rotation.set(Math.PI/2, 0, 0);
                group.add(gun);
                break;

            case 'ironclad':
                // Add dual machine guns on sides
                const dualGunGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.0, 8);
                [-1, 1].forEach(side => {
                    const gun = new THREE.Mesh(dualGunGeometry, weaponMaterial);
                    gun.position.set(side * (dim.width/2 + 0.1), dim.height/2 + 0.3, -dim.length/3);
                    gun.rotation.set(Math.PI/2, 0, 0);
                    group.add(gun);
                });
                break;

            case 'scorpion':
                // Add forward-facing cannon
                const cannonGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 8);
                const cannon = new THREE.Mesh(cannonGeometry, weaponMaterial);
                cannon.position.set(0, dim.height/2 + 0.2, -dim.length/2);
                cannon.rotation.set(0, 0, 0);
                group.add(cannon);
                break;

            case 'tank':
                // Add turret and main cannon
                const turretGeometry = new THREE.CylinderGeometry(
                    dim.width * 0.3, 
                    dim.width * 0.4, 
                    dim.height * 0.6, 
                    8
                );
                const turretMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x445544, 
                    metalness: 0.7, 
                    roughness: 0.3 
                });
                const turret = new THREE.Mesh(turretGeometry, turretMaterial);
                turret.position.set(0, dim.height/2, 0);
                group.add(turret);

                const mainCannonGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2.0, 8);
                const mainCannon = new THREE.Mesh(mainCannonGeometry, weaponMaterial);
                mainCannon.position.set(0, dim.height/2, -dim.length/2);
                mainCannon.rotation.set(0, 0, 0);
                group.add(mainCannon);
                break;

            case 'drone':
                // Add energy weapon pods
                const podGeometry = new THREE.SphereGeometry(0.2, 8, 8);
                const podMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x00ccff, 
                    metalness: 0.9, 
                    roughness: 0.1,
                    emissive: 0x00ccff,
                    emissiveIntensity: 0.5
                });
                [-1, 1].forEach(side => {
                    const pod = new THREE.Mesh(podGeometry, podMaterial);
                    pod.position.set(side * dim.width/3, dim.height/2 + 0.2, -dim.length/3);
                    group.add(pod);
                });
                break;
        }

        // Add vehicle-specific details
        switch(type) {
            case 'muscle':
                // Add hood scoop
                const scoopGeometry = new THREE.BoxGeometry(dim.width * 0.4, dim.height * 0.2, dim.length * 0.2);
                const scoopMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x000000, 
                    metalness: 0.5, 
                    roughness: 0.5 
                });
                const scoop = new THREE.Mesh(scoopGeometry, scoopMaterial);
                scoop.position.set(0, dim.height/2, -dim.length/4);
                group.add(scoop);

                // Add spoiler
                const spoilerGeometry = new THREE.BoxGeometry(dim.width * 0.8, dim.height * 0.2, dim.length * 0.1);
                const spoiler = new THREE.Mesh(spoilerGeometry, scoopMaterial);
                spoiler.position.set(0, dim.height/2, dim.length/2);
                group.add(spoiler);
                break;

            case 'ironclad':
                // Add armor plates
                const plateGeometry = new THREE.BoxGeometry(dim.width * 0.1, dim.height * 0.8, dim.length * 0.8);
                const plateMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x666666, 
                    metalness: 0.9, 
                    roughness: 0.1 
                });
                
                [-1, 1].forEach(side => {
                    const plate = new THREE.Mesh(plateGeometry, plateMaterial);
                    plate.position.set(side * (dim.width/2 + 0.05), 0, 0);
                    group.add(plate);
                });
                break;

            case 'scorpion':
                // Add aerodynamic fins
                const finGeometry = new THREE.ConeGeometry(dim.height * 0.4, dim.length * 0.3, 4);
                const finMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x00cc66, 
                    metalness: 0.6, 
                    roughness: 0.4 
                });
                
                [-1, 1].forEach(side => {
                    const fin = new THREE.Mesh(finGeometry, finMaterial);
                    fin.position.set(side * dim.width/2, dim.height/4, dim.length/3);
                    fin.rotation.set(Math.PI/2, 0, side * Math.PI/4);
                    group.add(fin);
                });
                break;

            case 'drone':
                // Add energy field
                const fieldGeometry = new THREE.SphereGeometry(dim.width * 0.6, 8, 8);
                const fieldMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x00ccff, 
                    metalness: 0.9, 
                    roughness: 0.1,
                    transparent: true,
                    opacity: 0.2
                });
                const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
                field.position.set(0, 0, 0);
                group.add(field);
                break;
        }

        // Add wheels
        const wheelRadius = dim.height * 0.4;
        const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, dim.width * 0.2, 32);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.5,
            roughness: 0.7
        });

        const wheelPositions = [
            { x: -dim.width/2, y: -dim.height/2, z: -dim.length/3 }, // Front left
            { x: dim.width/2, y: -dim.height/2, z: -dim.length/3 },  // Front right
            { x: -dim.width/2, y: -dim.height/2, z: dim.length/3 },  // Rear left
            { x: dim.width/2, y: -dim.height/2, z: dim.length/3 }    // Rear right
        ];

        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos.x, pos.y, pos.z);
            wheel.rotation.set(0, 0, Math.PI/2);
            wheel.castShadow = true;
            group.add(wheel);
        });

        // Rotate the entire group 180 degrees to fix orientation
        group.rotation.y = Math.PI;

        return group;
    }

    addWheels(vehicle, type) {
        const wheelConfigs = {
            muscle: {
                radius: 0.4,
                width: 0.3,
                suspensionStiffness: 30,        // Reduced stiffness
                suspensionRestLength: 0.4,      // Increased rest length
                frictionSlip: 2.5,              // Reduced for better initial traction
                dampingRelaxation: 2.5,
                dampingCompression: 4.4,
                maxSuspensionForce: 100000,
                rollInfluence: 0.01
            },
            ironclad: {
                radius: 0.45,
                width: 0.35,
                suspensionStiffness: 35,
                suspensionRestLength: 0.45,
                frictionSlip: 2.0,
                dampingRelaxation: 3.0,
                dampingCompression: 4.8,
                maxSuspensionForce: 120000,
                rollInfluence: 0.008
            },
            scorpion: {
                radius: 0.35,
                width: 0.25,
                suspensionStiffness: 25,
                suspensionRestLength: 0.35,
                frictionSlip: 3.0,
                dampingRelaxation: 2.3,
                dampingCompression: 4.2,
                maxSuspensionForce: 90000,
                rollInfluence: 0.012
            },
            tank: {
                radius: 0.5,
                width: 0.4,
                suspensionStiffness: 40,
                suspensionRestLength: 0.5,
                frictionSlip: 1.5,
                dampingRelaxation: 3.5,
                dampingCompression: 5.0,
                maxSuspensionForce: 150000,
                rollInfluence: 0.005
            },
            drone: {
                radius: 0.3,
                width: 0.2,
                suspensionStiffness: 20,
                suspensionRestLength: 0.3,
                frictionSlip: 3.5,
                dampingRelaxation: 2.0,
                dampingCompression: 4.0,
                maxSuspensionForce: 80000,
                rollInfluence: 0.015
            }
        };

        const config = wheelConfigs[type] || wheelConfigs.muscle;

        // Wheel connection points - Adjusted to match physics shape
        const wheelPositions = {
            muscle: { width: 1.1, height: 0, frontZ: 1.2, backZ: -1.2 },
            ironclad: { width: 1.3, height: 0, frontZ: 1.3, backZ: -1.3 },
            scorpion: { width: 1.0, height: 0, frontZ: 1.1, backZ: -1.1 },
            tank: { width: 1.5, height: 0, frontZ: 1.4, backZ: -1.4 },
            drone: { width: 0.9, height: 0, frontZ: 1.0, backZ: -1.0 }
        };

        const pos = wheelPositions[type] || wheelPositions.muscle;

        const wheelOptions = {
            radius: config.radius,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: config.suspensionStiffness,
            suspensionRestLength: config.suspensionRestLength,
            frictionSlip: config.frictionSlip,
            dampingRelaxation: config.dampingRelaxation,
            dampingCompression: config.dampingCompression,
            maxSuspensionForce: config.maxSuspensionForce,
            rollInfluence: config.rollInfluence,
            axleLocal: new CANNON.Vec3(1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1, 0, 1),
            maxSuspensionTravel: 0.4,          // Increased travel
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true
        };

        // Add front left wheel
        wheelOptions.chassisConnectionPointLocal.set(-pos.width, pos.height, pos.frontZ);
        vehicle.addWheel(wheelOptions);

        // Add front right wheel
        wheelOptions.chassisConnectionPointLocal.set(pos.width, pos.height, pos.frontZ);
        vehicle.addWheel(wheelOptions);

        // Add rear left wheel
        wheelOptions.chassisConnectionPointLocal.set(-pos.width, pos.height, pos.backZ);
        wheelOptions.isFrontWheel = false;
        vehicle.addWheel(wheelOptions);

        // Add rear right wheel
        wheelOptions.chassisConnectionPointLocal.set(pos.width, pos.height, pos.backZ);
        vehicle.addWheel(wheelOptions);

        // Apply vehicle-specific wheel adjustments
        vehicle.wheelInfos.forEach((wheel, index) => {
            if (type === 'tank') {
                // Tanks have better traction and can climb steeper terrain
                wheel.frictionSlip *= 1.5;
                wheel.maxSuspensionForce *= 1.3;
            } else if (type === 'scorpion') {
                // Scorpion has better handling
                wheel.rollInfluence *= 0.8;
                if (index < 2) wheel.steerValue *= 1.2; // Increase front wheel steering
            } else if (type === 'ironclad') {
                // Ironclad is more stable
                wheel.rollInfluence *= 0.7;
                wheel.maxSuspensionForce *= 1.2;
            }
        });
    }

    update(deltaTime) {
        for (const entity of this.vehicles.values()) {
            const input = entity.getComponent(InputComponent);
            const physicsBody = entity.getComponent(PhysicsBody);
            const vehicleControls = entity.getComponent(VehicleControls);
            const meshComponent = entity.getComponent(MeshComponent);

            if (!input || !physicsBody || !vehicleControls || !meshComponent) continue;

            // Update input state
            input.update();

            // Update vehicle controls
            vehicleControls.update(input, physicsBody);

            // Update mesh position and rotation
            if (physicsBody.body) {
                meshComponent.mesh.position.copy(physicsBody.body.position);
                meshComponent.mesh.quaternion.copy(physicsBody.body.quaternion);
            }
        }
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