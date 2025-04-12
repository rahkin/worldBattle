import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { VehicleGeometryFactory } from '../../utils/GeometryUtils.js';
import { VehicleDamageSystem } from '../VehicleDamageSystem.js';
import { DamageSystem } from '../DamageSystem.js';

export class BaseCar {
    constructor(world, scene, options = {}) {
        this.world = world;
        this.scene = scene;

        // Default parameters (can be overridden per car)
        this.options = Object.assign({
            width: 1.0,
            height: 0.5,
            length: 2.0,
            mass: 150,
            color: 0xff0000,
            wheelRadius: 0.4,
            wheelWidth: 0.3,
            wheelFriction: 5,
            suspensionRestLength: 0.3,
            wheelBaseZ: 2,
            wheelTrackX: 1,
            chassisOffsetY: 0.4,
            chassisOffsetZ: 0,
            debug: false,
            maxHealth: 100,
            damageResistance: 1.0
        }, options);

        this._vehicle = null;
        this.chassisMesh = null;
        this.wheelMeshes = [];
        this.damageSystem = new DamageSystem(this, {
            maxHealth: options.maxHealth || 100,
            damageResistance: options.damageResistance || 1.0,
            damageThreshold: options.damageThreshold || 10
        });

        this.recoveryCooldown = 0;
        this.recoveryCooldownTime = 3; // 3 seconds cooldown
        this.canRecover = true;

        this._createCar();
    }

    _createCar() {
        const o = this.options;

        // Chassis
        const chassisShape = new CANNON.Box(new CANNON.Vec3(o.width, o.height, o.length));
        const chassisBody = new CANNON.Body({ mass: o.mass });
        chassisBody.addShape(chassisShape);
        const spawnPos = o.spawnPosition || new CANNON.Vec3(0, 1.2, 0);
        chassisBody.position.copy(spawnPos);
        chassisBody.angularDamping = 0.5;  // Reduced from 0.7
        chassisBody.linearDamping = 0.1;   // Reduced from 0.2
        chassisBody.shapeOffsets[0].set(0, -0.1, 0); // Slightly lower center of mass
        chassisBody.updateMassProperties();

        // Raycast Vehicle
        this._vehicle = new CANNON.RaycastVehicle({
            chassisBody,
            indexRightAxis: 0,   // X → right
            indexUpAxis: 1,      // Y → up
            indexForwardAxis: 2  // Z → forward
        });

        // Wheel Options
        const wheelOptions = {
            radius: o.wheelRadius,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: 50,  // Increased from 30
            suspensionRestLength: 0.4, // Increased from 0.3
            frictionSlip: 5,  // Reduced from 30
            dampingRelaxation: 2.3,
            dampingCompression: 4.4,
            maxSuspensionForce: 100000,
            rollInfluence: 0.01,
            axleLocal: new CANNON.Vec3(-1, 0, 0),  // Reversed axle direction
            maxSuspensionTravel: 0.3,
            customSlidingRotationalSpeed: 30,  // Changed to positive
            useCustomSlidingRotationalSpeed: true
        };

        // Wheel Positions - adjusted height
        const wheelPositions = [
            new CANNON.Vec3(-o.wheelTrackX, 0, -o.wheelBaseZ),   // FL
            new CANNON.Vec3(o.wheelTrackX, 0, -o.wheelBaseZ),    // FR
            new CANNON.Vec3(-o.wheelTrackX, 0, o.wheelBaseZ),    // RL
            new CANNON.Vec3(o.wheelTrackX, 0, o.wheelBaseZ)      // RR
        ];

        // Add wheels
        wheelPositions.forEach((pos, i) => {
            const wheel = { ...wheelOptions };
            wheel.chassisConnectionPointLocal = pos;
            wheel.isFrontWheel = i < 2;
            this._vehicle.addWheel(wheel);
        });

        this._vehicle.addToWorld(this.world);

        // Set up wheel bodies with proper materials
        this._vehicle.wheelInfos.forEach((wheel, i) => {
            wheel.material = this.world.wheelMaterial;
            wheel.useCustomSlidingRotationalSpeed = true;
            wheel.customSlidingRotationalSpeed = 30;  // Changed to positive

            // Additional wheel setup
            const wheelBody = wheel.raycastResult.body;
            if (wheelBody) {
                wheelBody.material = this.world.wheelMaterial;
            }
        });

        // Debug output
        console.log('Vehicle setup:', {
            mass: chassisBody.mass,
            position: chassisBody.position.y,
            wheelPositions: wheelPositions.map(p => p.y),
            suspensionLength: wheelOptions.suspensionRestLength
        });

        // Chassis mesh
        const chassisGeo = new THREE.BoxGeometry(o.width * 2, o.height * 2, o.length * 2);
        const chassisMat = new THREE.MeshPhongMaterial({ color: o.color });
        this.chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
        this.chassisMesh.castShadow = true;
        this.scene.add(this.chassisMesh);

        // Wheel mesh setup with enhanced visuals
        this.wheelMeshes = [];
        const wheelGeo = VehicleGeometryFactory.createSmoothWheel(
            this.options.wheelRadius,
            this.options.wheelWidth,
            32  // Higher segment count for smoother wheels
        );
        
        // Create materials for different wheel parts
        const rimMaterial = VehicleGeometryFactory.createMetalMaterial(0x888888);  // Metallic rims
        const tireMaterial = VehicleGeometryFactory.createMatteMetalMaterial(0x222222);  // Dark tires

        this._vehicle.wheelInfos.forEach(() => {
            const wheelGroup = new THREE.Group();
            
            // Create tire
            const tire = new THREE.Mesh(wheelGeo, tireMaterial);
            wheelGroup.add(tire);

            // Create rim
            const rimGeometry = new THREE.CylinderGeometry(
                this.options.wheelRadius * 0.7,  // Rim slightly smaller than tire
                this.options.wheelRadius * 0.7,
                this.options.wheelWidth * 0.9,
                16  // Segments for rim
            );
            rimGeometry.rotateX(Math.PI / 2);
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            wheelGroup.add(rim);

            // Add spokes
            for (let i = 0; i < 5; i++) {
                const spokeGeo = new THREE.BoxGeometry(
                    this.options.wheelRadius * 0.1,
                    this.options.wheelWidth * 0.8,
                    this.options.wheelRadius * 1.2
                );
                const spoke = new THREE.Mesh(spokeGeo, rimMaterial);
                spoke.rotation.z = (i * Math.PI * 2) / 5;
                rim.add(spoke);
            }

            wheelGroup.castShadow = true;
            this.scene.add(wheelGroup);
            this.wheelMeshes.push(wheelGroup);
        });

        // Debug wheel contact after physics settles
        setTimeout(() => {
            this._vehicle.wheelInfos.forEach((wheel, i) => {
                console.log(`Wheel ${i} is touching ground:`, wheel.isInContact);
            });
        }, 2000);
    }

    updateVisuals() {
        if (!this._vehicle || !this.chassisMesh) return;

        // Update chassis
        this.chassisMesh.position.copy(this._vehicle.chassisBody.position);
        this.chassisMesh.quaternion.copy(this._vehicle.chassisBody.quaternion);

        // Update wheels
        if (this.wheelMeshes && this._vehicle.wheelInfos) {
            for (let i = 0; i < this.wheelMeshes.length; i++) {
                const mesh = this.wheelMeshes[i];
                const wheelInfo = this._vehicle.wheelInfos[i];
                
                if (mesh && wheelInfo && wheelInfo.worldTransform) {
                    mesh.position.copy(wheelInfo.worldTransform.position);
                    mesh.quaternion.copy(wheelInfo.worldTransform.quaternion);
                }
            }
        }
    }

    getVehicle() {
        return this._vehicle;
    }

    get vehicle() {
        return this._vehicle;
    }

    applyDamage(amount, position, force) {
        this.damageSystem.applyDamage(amount, position, force);
    }

    update(deltaTime) {
        if (!this._vehicle) return;

        // Update vehicle physics
        for (let i = 0; i < this._vehicle.wheelInfos.length; i++) {
            this._vehicle.updateWheelTransform(i);
        }

        // Update visual meshes
        if (this.chassisMesh) {
            this.chassisMesh.position.copy(this._vehicle.chassisBody.position);
            this.chassisMesh.quaternion.copy(this._vehicle.chassisBody.quaternion);
        }

        // Update wheel meshes
        this.wheelMeshes.forEach((wheelMesh, i) => {
            const wheel = this._vehicle.wheelInfos[i];
            const transform = wheel.worldTransform;
            
            // Update wheel position and rotation
            wheelMesh.position.copy(transform.position);
            wheelMesh.quaternion.copy(transform.quaternion);
            
            // Apply wheel rotation based on vehicle movement
            if (wheel.isInContact) {
                const rotationSpeed = this._vehicle.wheelInfos[i].rotation;
                wheelMesh.rotateX(rotationSpeed * deltaTime);
            }
        });

        // Update damage system
        this.damageSystem.update(deltaTime);

        // Update recovery cooldown
        if (this.recoveryCooldown > 0) {
            this.recoveryCooldown -= deltaTime;
            if (this.recoveryCooldown <= 0) {
                this.canRecover = true;
            }
        }
    }

    recover() {
        if (!this.canRecover || this.recoveryCooldown > 0) {
            console.log('Recovery on cooldown:', this.recoveryCooldown.toFixed(1) + 's remaining');
            return false;
        }

        this.recoveryCooldown = this.recoveryCooldownTime;
        this.canRecover = false;

        this.damageSystem.applyDamage(15);

        const currentPosition = this._vehicle.chassisBody.position.clone();
        const safePosition = this._findSafePosition(currentPosition);

        if (!safePosition) {
            console.warn('Could not find safe recovery position');
            return false;
        }

        // ✅ Recreate vehicle from scratch
        this.recreateVehicleAt(safePosition);

        console.log('Vehicle reset to:', safePosition.toArray());

        return true;
    }

    _findSafePosition(currentPosition) {
        const maxAttempts = 12; // Increased number of positions to check
        const radius = 8; // Increased search radius
        const height = 10;
        const minClearance = 2;
        const vehicleSize = 2; // Approximate size of the vehicle

        // Try positions in a spiral pattern around current position
        for (let i = 0; i < maxAttempts; i++) {
            // Spiral pattern for more even distribution
            const angle = (i / maxAttempts) * Math.PI * 2;
            const spiralRadius = radius * (i / maxAttempts); // Gradually increase radius
            const x = currentPosition.x + Math.cos(angle) * spiralRadius;
            const z = currentPosition.z + Math.sin(angle) * spiralRadius;

            // Check if position is clear using multiple rays
            const rays = [
                new CANNON.Vec3(x, currentPosition.y + height, z),
                new CANNON.Vec3(x + vehicleSize, currentPosition.y + height, z),
                new CANNON.Vec3(x - vehicleSize, currentPosition.y + height, z),
                new CANNON.Vec3(x, currentPosition.y + height, z + vehicleSize),
                new CANNON.Vec3(x, currentPosition.y + height, z - vehicleSize)
            ];

            let isPositionClear = true;
            let groundHeight = null;

            for (const rayStart of rays) {
                const ray = new CANNON.Ray(rayStart, new CANNON.Vec3(0, -1, 0));
                const result = new CANNON.RaycastResult();
                ray.intersectWorld(this.world, result);

                if (!result.hasHit) {
                    isPositionClear = false;
                    break;
                }

                const hitPoint = result.hitPointWorld;
                const clearance = currentPosition.y + height - hitPoint.y;
                
                if (clearance < minClearance) {
                    isPositionClear = false;
                    break;
                }

                // Store the ground height
                if (groundHeight === null) {
                    groundHeight = hitPoint.y;
                } else if (Math.abs(hitPoint.y - groundHeight) > 0.5) {
                    // Check if ground is too uneven
                    isPositionClear = false;
                    break;
                }
            }

            if (isPositionClear && groundHeight !== null) {
                // Found a safe position
                return new CANNON.Vec3(x, groundHeight + 1, z);
            }
        }

        // If no safe position found in spiral pattern, try random positions
        for (let i = 0; i < 5; i++) {
            const randomAngle = Math.random() * Math.PI * 2;
            const randomRadius = radius * Math.random();
            const x = currentPosition.x + Math.cos(randomAngle) * randomRadius;
            const z = currentPosition.z + Math.sin(randomAngle) * randomRadius;

            const ray = new CANNON.Ray(
                new CANNON.Vec3(x, currentPosition.y + height, z),
                new CANNON.Vec3(0, -1, 0)
            );
            
            const result = new CANNON.RaycastResult();
            ray.intersectWorld(this.world, result);

            if (result.hasHit) {
                const hitPoint = result.hitPointWorld;
                const clearance = currentPosition.y + height - hitPoint.y;
                
                if (clearance >= minClearance) {
                    return new CANNON.Vec3(x, hitPoint.y + 1, z);
                }
            }
        }

        // If still no safe position found, try a position far away
        const farPosition = new CANNON.Vec3(
            currentPosition.x + (Math.random() - 0.5) * 20,
            currentPosition.y + height,
            currentPosition.z + (Math.random() - 0.5) * 20
        );

        const ray = new CANNON.Ray(farPosition, new CANNON.Vec3(0, -1, 0));
        const result = new CANNON.RaycastResult();
        ray.intersectWorld(this.world, result);

        if (result.hasHit) {
            return new CANNON.Vec3(
                farPosition.x,
                result.hitPointWorld.y + 1,
                farPosition.z
            );
        }

        return null;
    }

    recreateVehicleAt(newPosition) {
        // Save old visual meshes
        this.scene.remove(this.chassisMesh);
        this.wheelMeshes.forEach(mesh => this.scene.remove(mesh));
        this.wheelMeshes = [];

        // Remove old chassis
        this.world.removeBody(this._vehicle.chassisBody);

        // Recreate car at new position
        const oldOptions = this.options;
        oldOptions.spawnPosition = newPosition.clone(); // optionally pass this in options
        this.options = oldOptions;
        this._createCar(); // reuse your existing _createCar()
    }

    forceTeleport(position, quaternion = new CANNON.Quaternion(0, 0, 0, 1)) {
        if (!this._vehicle || !this._vehicle.chassisBody) {
            console.warn('Cannot teleport: vehicle or chassis not found');
            return;
        }

        const chassis = this._vehicle.chassisBody;

        // Clear velocities
        chassis.velocity.setZero();
        chassis.angularVelocity.setZero();

        // Force position + orientation
        chassis.position.copy(position);
        chassis.quaternion.copy(quaternion);

        // Force update wheels
        if (this._vehicle.wheelInfos && this._vehicle.wheelInfos.length > 0) {
            for (let i = 0; i < this._vehicle.wheelInfos.length; i++) {
                const wheel = this._vehicle.wheelInfos[i];
                if (wheel && wheel.worldTransform) {
                    wheel.worldTransform.position.copy(position);
                    wheel.worldTransform.quaternion.copy(quaternion);
                    wheel.suspensionLength = wheel.suspensionRestLength;
                    wheel.suspensionForce = 0;
                    wheel.deltaRotation = 0;
                    wheel.rotation = 0;
                    wheel.steering = 0;
                    wheel.brake = 0;
                    wheel.engineForce = 0;
                }
            }

            // Update wheel transforms one by one
            for (let i = 0; i < this._vehicle.wheelInfos.length; i++) {
                this._vehicle.updateWheelTransform(i);
            }
        }

        // Update chassis physics
        chassis.updateMassProperties();
        chassis.updateAABB();

        // Immediate visual update
        this.updateVisuals();

        console.log('Teleport complete - Position:', position.toArray());
    }
} 