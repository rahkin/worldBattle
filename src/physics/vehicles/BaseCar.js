import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { VehicleGeometryFactory } from '../../utils/GeometryUtils.js';
import { VehicleDamageSystem } from '../VehicleDamageSystem.js';

export class BaseCar {
    constructor(world, scene, options = {}) {
        console.log('Initializing BaseCar with options:', {
            type: options.type,
            maxHealth: options.maxHealth,
            damageResistance: options.damageResistance
        });

        this.world = world;
        this.scene = scene;
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
        this.recoveryCooldown = 0;
        this.recoveryCooldownTime = 3; // 3 seconds cooldown
        this.canRecover = true;

        // Add power-up collision material
        this.powerUpMaterial = new CANNON.Material('vehicleMaterial');
        this.powerUpContactMaterial = new CANNON.ContactMaterial(
            this.powerUpMaterial,
            new CANNON.Material('powerUpMaterial'),
            {
                friction: 0.0,
                restitution: 0.0
            }
        );
        world.addContactMaterial(this.powerUpContactMaterial);

        // Mine system
        this.mines = new Set();
        this.mineDeployTimer = 0;
        this.mineDeployCooldown = 2000; // 2 seconds between mines
        this.maxMines = 5; // Maximum number of active mines per vehicle
        this.isLookingBack = false;

        // Create the car first
        this._createCar();

        // Initialize damage system after car is created
        this._initDamageSystem();

        this.id = options.id || Math.random().toString(36).substr(2, 9);
        this.type = options.type || 'base';
        this.health = this.options.maxHealth;
        this.maxHealth = this.options.maxHealth;
        
        // Initialize ammo based on vehicle type
        this.isHeavyVehicle = ['tank', 'ironclad', 'junkyardking'].includes(this.type.toLowerCase());
        this.ammo = this.isHeavyVehicle ? 200 : 500;
        
        // Initialize stats with durability
        this.stats = {
            speed: options.stats?.speed || 5,
            handling: options.stats?.handling || 5,
            durability: options.stats?.durability || 5
        };
        
        console.log('BaseCar initialization complete:', {
            id: this.id,
            type: this.type,
            health: this.health,
            maxHealth: this.maxHealth,
            stats: this.stats,
            hasDamageSystem: !!this.damageSystem,
            damageSystemHealth: this.damageSystem?.currentHealth
        });

        // Create or update health bar
        this.updateHealthBar(1.0);

        this.originalEngineForce = 1800;
        this.originalDamageResistance = options.damageResistance || 1.0;
    }

    _createCar() {
        const o = this.options;

        // Chassis
        const chassisShape = new CANNON.Box(new CANNON.Vec3(o.width, o.height, o.length));
        const chassisBody = new CANNON.Body({ 
            mass: o.mass,
            material: this.powerUpMaterial,
            collisionFilterGroup: 1,  // Vehicle group
            collisionFilterMask: -1   // Collide with everything
        });
        chassisBody.addShape(chassisShape);
        
        // Find a safe spawn position
        let spawnPos;
        if (o.spawnPosition) {
            spawnPos = o.spawnPosition;
        } else {
            spawnPos = this._findInitialSpawnPosition();
        }
        
        chassisBody.position.copy(spawnPos);
        chassisBody.angularDamping = 0.5;
        chassisBody.linearDamping = 0.1;
        chassisBody.shapeOffsets[0].set(0, -0.1, 0);
        chassisBody.updateMassProperties();

        // Store reference to this vehicle instance in the chassis body's userData
        chassisBody.userData = { vehicle: this };
        // Add vehicle ID to the chassis body
        chassisBody.vehicleId = this.id || 'vehicle_' + Math.random().toString(36).substr(2, 9);

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
            suspensionStiffness: 45,  // Reduced for smoother ride
            suspensionRestLength: 0.4,
            frictionSlip: 8.0,  // Increased for better traction
            dampingRelaxation: 3.5,  // Increased for better stability
            dampingCompression: 4.8,  // Increased for better bump handling
            maxSuspensionForce: 150000,  // Increased for better ground contact
            rollInfluence: 0.05,  // Increased for better cornering
            axleLocal: new CANNON.Vec3(-1, 0, 0),
            maxSuspensionTravel: 0.3,
            customSlidingRotationalSpeed: -45,  // Adjusted for better wheel response
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
            wheel.customSlidingRotationalSpeed = -45;  // Match the wheel options

            // Additional wheel setup
            const wheelBody = wheel.raycastResult.body;
            if (wheelBody) {
                wheelBody.material = this.world.wheelMaterial;
                wheelBody.angularDamping = 0.4;  // Add angular damping for stability
                wheelBody.linearDamping = 0.2;   // Add linear damping
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

        // Add rear lights
        const lightStripGeo = new THREE.BoxGeometry(o.width * 3.2, 0.3, 0.01);
        const lightMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 2.5,
            transparent: true,
            opacity: 1.0
        });
        const rearLightStrip = new THREE.Mesh(lightStripGeo, lightMaterial);
        rearLightStrip.position.set(0, o.height * 0.3, o.length - 0.001);
        this.chassisMesh.add(rearLightStrip);

        // Add light glow effect
        const glowGeo = new THREE.PlaneGeometry(o.width * 3.6, 0.4);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeo, glowMaterial);
        glow.position.set(0, o.height * 0.3, o.length);
        glow.rotation.y = Math.PI;
        this.chassisMesh.add(glow);

        // Add second glow layer for more intensity
        const glow2 = new THREE.Mesh(glowGeo.clone(), glowMaterial.clone());
        glow2.material.opacity = 0.5;
        glow2.position.set(0, o.height * 0.3, o.length + 0.01);
        glow2.rotation.y = Math.PI;
        glow2.scale.set(1.3, 1.3, 1.3);
        this.chassisMesh.add(glow2);

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

        // Get current friction modifier from weather system
        const frictionModifier = this.game.weatherSystem.getFrictionModifier();
        
        // Apply friction modifier to wheels
        this._vehicle.wheelInfos.forEach(wheel => {
            wheel.frictionSlip = this.options.wheelFriction * frictionModifier;
        });

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

        // Update mines
        for (const mine of this.mines) {
            mine.update();
            if (mine.isExploded) {
                this.mines.delete(mine);
            }
        }

        // Update mine deploy timer
        if (this.mineDeployTimer > 0) {
            this.mineDeployTimer -= deltaTime;
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
        console.log('Finding safe position from:', currentPosition.toArray());
        
        const maxAttempts = 12;
        const radius = 8;
        const height = 5; // Reduced from 10 to 5
        const minClearance = 1; // Reduced from 2 to 1
        const vehicleSize = 2;

        // First try directly above current position
        const directUp = new CANNON.Ray(
            new CANNON.Vec3(currentPosition.x, currentPosition.y + height, currentPosition.z),
            new CANNON.Vec3(0, -1, 0)
        );
        const directResult = new CANNON.RaycastResult();
        directUp.intersectWorld(this.world, directResult);

        if (directResult.hasHit) {
            console.log('Found direct position above current location');
            return new CANNON.Vec3(
                currentPosition.x,
                directResult.hitPointWorld.y + 1,
                currentPosition.z
            );
        }

        // Try positions in a spiral pattern
        for (let i = 0; i < maxAttempts; i++) {
            const angle = (i / maxAttempts) * Math.PI * 2;
            const spiralRadius = radius * (i / maxAttempts);
            const x = currentPosition.x + Math.cos(angle) * spiralRadius;
            const z = currentPosition.z + Math.sin(angle) * spiralRadius;

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
                    console.log('Found safe position in spiral at:', [x, hitPoint.y + 1, z]);
                    return new CANNON.Vec3(x, hitPoint.y + 1, z);
                }
            }
        }

        // If no position found, try a position slightly above current position
        console.log('No safe position found, returning position above current');
        return new CANNON.Vec3(
            currentPosition.x,
            currentPosition.y + 2,
            currentPosition.z
        );
    }

    recreateVehicleAt(newPosition) {
        // Remove old vehicle from physics world
        if (this._vehicle) {
            this.world.removeBody(this._vehicle.chassisBody);
            this._vehicle.wheelInfos.forEach(wheel => {
                if (wheel.body) {
                    this.world.removeBody(wheel.body);
                }
            });
        }

        // Remove old meshes from scene
        if (this.chassisMesh) {
            this.scene.remove(this.chassisMesh);
        }
        this.wheelMeshes.forEach(mesh => {
            if (mesh) this.scene.remove(mesh);
        });

        // Reset vehicle state
        this._vehicle = null;
        this.chassisMesh = null;
        this.wheelMeshes = [];
        this.recoveryCooldown = 0;
        this.canRecover = true;

        // Create new vehicle at the specified position
        this.options.spawnPosition = newPosition;
        this._createCar();

        // Reset damage system
        this.damageSystem = new VehicleDamageSystem(this, this.scene, this.world);
    }

    forceTeleport(position, quaternion = new CANNON.Quaternion(0, 0, 0, 1)) {
        console.log('Force teleporting to:', position.toArray());
        
        if (!this._vehicle || !this._vehicle.chassisBody) {
            console.warn('Cannot teleport: vehicle or chassis not found');
            return;
        }

        const chassis = this._vehicle.chassisBody;

        // Clear velocities
        chassis.velocity.setZero();
        chassis.angularVelocity.setZero();
        chassis.force.setZero();
        chassis.torque.setZero();

        // Force position + orientation
        chassis.position.copy(position);
        chassis.quaternion.copy(quaternion);
        chassis.initPosition.copy(position);
        chassis.initQuaternion.copy(quaternion);

        // Force update wheels
        if (this._vehicle.wheelInfos && this._vehicle.wheelInfos.length > 0) {
            for (let i = 0; i < this._vehicle.wheelInfos.length; i++) {
                const wheel = this._vehicle.wheelInfos[i];
                if (wheel) {
                    wheel.suspensionLength = wheel.suspensionRestLength;
                    wheel.suspensionForce = 0;
                    wheel.deltaRotation = 0;
                    wheel.rotation = 0;
                    wheel.steering = 0;
                    wheel.brake = 0;
                    wheel.engineForce = 0;
                    
                    if (wheel.raycastResult) {
                        wheel.raycastResult.reset();
                    }
                }
            }

            // Update wheel transforms one by one
            for (let i = 0; i < this._vehicle.wheelInfos.length; i++) {
                this._vehicle.updateWheelTransform(i);
            }
        }

        // Update chassis physics
        chassis.wakeUp();
        chassis.updateMassProperties();
        chassis.updateAABB();

        // Immediate visual update
        this.updateVisuals();

        console.log('Teleport complete - New position:', chassis.position.toArray());
    }

    recreateVehicle() {
        // Remove old vehicle completely
        if (this._vehicle) {
            this.world.removeBody(this._vehicle.chassisBody);
            this._vehicle.wheelInfos.forEach(wheel => {
                if (wheel.body) {
                    this.world.removeBody(wheel.body);
                }
            });
        }

        // Remove old meshes
        if (this.chassisMesh) {
            this.scene.remove(this.chassisMesh);
        }
        this.wheelMeshes.forEach(wheel => {
            if (wheel) this.scene.remove(wheel);
        });

        // Reset arrays
        this.wheelMeshes = [];
        this._vehicle = null;
        this.chassisMesh = null;

        // Create new vehicle
        this._createCar();

        // Reset damage system
        if (this.damageSystem) {
            this.damageSystem.reset();
        }
    }

    // Add ammo management methods
    getAmmo() {
        return this.ammo;
    }

    useAmmo(amount = 1) {
        if (this.ammo >= amount) {
            this.ammo -= amount;
            return true;
        }
        return false;
    }

    addAmmo(amount) {
        this.ammo += amount;
        return amount;
    }

    getMaxAmmo() {
        return Infinity;
    }

    deployMine() {
        // Check cooldown, mine limit, and looking back state
        if (this.mineDeployTimer > 0) {
            console.log('Mine deployment on cooldown');
            return false;
        }
        
        if (this.mines.size >= this.maxMines) {
            console.log('Maximum mines deployed');
            return false;
        }
        
        if (!this.isLookingBack) {
            console.log('Cannot deploy mine: not looking back');
            return false;
        }

        // Calculate spawn position behind vehicle
        const direction = new THREE.Vector3();
        this._vehicle.chassisBody.quaternion.vmult(new CANNON.Vec3(0, 0, 1), direction);
        const spawnPosition = new CANNON.Vec3(
            this._vehicle.chassisBody.position.x - direction.x * 3,
            this._vehicle.chassisBody.position.y - 0.5, // Slightly below vehicle
            this._vehicle.chassisBody.position.z - direction.z * 3
        );

        // Create new mine
        const mine = new Mine(this.world, this.scene, spawnPosition, {
            damage: 75,
            radius: 5,
            lifetime: 30000 // 30 seconds
        });

        // Add to mines set and start cooldown
        this.mines.add(mine);
        this.mineDeployTimer = this.mineDeployCooldown;

        console.log('Mine deployed:', {
            position: spawnPosition,
            activeMines: this.mines.size,
            cooldown: this.mineDeployCooldown
        });

        return true;
    }

    setLookingBack(isLooking) {
        this.isLookingBack = isLooking;
    }

    cleanup() {
        // ... existing cleanup code ...

        // Cleanup mines
        for (const mine of this.mines) {
            mine.cleanup();
        }
        this.mines.clear();
    }

    updateHealthBar(healthPercent) {
        // Find the top health bar element
        const healthBar = document.querySelector('.health-bar-fill');
        if (healthBar) {
            const percentage = Math.max(0, Math.min(100, healthPercent * 100));
            healthBar.style.width = `${percentage}%`;
            
            // Color interpolation from red to yellow to green
            let color;
            if (percentage > 50) {
                // Interpolate from yellow to green
                const g = Math.floor(255);
                const r = Math.floor(255 * (1 - (percentage - 50) / 50));
                color = `rgb(${r}, ${g}, 0)`;
            } else {
                // Interpolate from red to yellow
                const r = Math.floor(255);
                const g = Math.floor(255 * (percentage / 50));
                color = `rgb(${r}, ${g}, 0)`;
            }
            healthBar.style.backgroundColor = color;
        }
    }

    takeDamage(amount) {
        if (this.damageSystem) {
            console.log('Taking damage:', {
                amount: amount,
                currentHealth: this.damageSystem.currentHealth,
                maxHealth: this.damageSystem.maxHealth
            });
            this.damageSystem.applyDamage(amount);
            this.updateHealthBar(this.damageSystem.currentHealth / this.damageSystem.maxHealth);
        } else {
            console.warn('No damage system available for vehicle:', this.id);
        }
    }

    setBraking(braking) {
        if (!this._vehicle) return;
        
        // Apply braking to all wheels
        for (let i = 0; i < this._vehicle.wheelInfos.length; i++) {
            this._vehicle.setBrake(braking ? 100 : 0, i);
        }
    }

    // Add boost functionality
    boost(active) {
        if (active) {
            // Store original engine force
            this._originalEngineForce = this.originalEngineForce;
            // Increase engine force by ~22%
            this.originalEngineForce = 2200;
        } else if (this._originalEngineForce) {
            // Restore original engine force
            this.originalEngineForce = this._originalEngineForce;
            delete this._originalEngineForce;
        }
        return true;
    }

    // Add shield functionality
    shield(active) {
        if (!this.damageSystem) return false;

        if (active) {
            // Store original damage resistance
            this._originalDamageResistance = this.originalDamageResistance;
            // Increase damage resistance by 75%
            this.originalDamageResistance = 0.25;
        } else if (this._originalDamageResistance !== undefined) {
            // Restore original damage resistance
            this.originalDamageResistance = this._originalDamageResistance;
            delete this._originalDamageResistance;
        }
        return true;
    }

    _initDamageSystem() {
        if (!this.damageSystem) {
            this.damageSystem = new VehicleDamageSystem(this, this.scene, this.world);
            this.hasDamageSystem = true;
            console.log('Damage system initialized');
        }
    }

    _findInitialSpawnPosition() {
        console.log('Finding safe initial spawn position...');
        
        const maxAttempts = 10;
        const spawnHeight = 10;
        const minClearance = 3;
        const searchRadius = 20;
        
        // Try positions in a spiral pattern
        for (let i = 0; i < maxAttempts; i++) {
            // Calculate position in spiral pattern
            const angle = (i / maxAttempts) * Math.PI * 2;
            const radius = (i / maxAttempts) * searchRadius;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Create raycast from above
            const from = new CANNON.Vec3(x, spawnHeight, z);
            const to = new CANNON.Vec3(x, -1, z);
            const ray = new CANNON.Ray(from, to);
            const result = new CANNON.RaycastResult();
            
            ray.intersectWorld(this.world, { mode: CANNON.Ray.CLOSEST, result });
            
            if (result.hasHit) {
                // Check if there's enough clearance above the hit point
                const hitY = result.hitPointWorld.y;
                
                // Additional safety check - cast a wider ray to check for objects
                const isClear = this._checkAreaClearance(
                    new CANNON.Vec3(x, hitY + minClearance, z),
                    this.options.width * 2
                );
                
                if (isClear) {
                    console.log('Found clear spawn position at:', [x, hitY + minClearance, z]);
                    return new CANNON.Vec3(x, hitY + minClearance, z);
                }
            }
        }
        
        // Fallback to a high position if no clear spot found
        console.warn('No clear spawn position found, using fallback position');
        return new CANNON.Vec3(0, spawnHeight, 0);
    }

    _checkAreaClearance(position, radius) {
        // Cast rays in a grid pattern to check for objects
        const checkPoints = [
            { x: -radius, z: -radius },
            { x: -radius, z: radius },
            { x: radius, z: -radius },
            { x: radius, z: radius },
            { x: 0, z: 0 }
        ];
        
        for (const point of checkPoints) {
            const from = new CANNON.Vec3(
                position.x + point.x,
                position.y + 2,
                position.z + point.z
            );
            const to = new CANNON.Vec3(
                position.x + point.x,
                position.y - 2,
                position.z + point.z
            );
            
            const ray = new CANNON.Ray(from, to);
            const result = new CANNON.RaycastResult();
            ray.intersectWorld(this.world, { mode: CANNON.Ray.ANY, result });
            
            if (result.hasHit) {
                return false; // Area is not clear
            }
        }
        
        return true; // Area is clear
    }
} 