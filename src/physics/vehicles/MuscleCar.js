import * as THREE from 'three';
import { BaseCar } from './BaseCar.js';
import { VehicleGeometryFactory } from '../../utils/GeometryUtils.js';
import { CapsuleGeometry } from 'three';
import { CylinderGeometry } from 'three';
import { ProjectileSystem } from '../../physics/ProjectileSystem.js';

export class MuscleCar extends BaseCar {
    constructor(world, scene, game, options = {}) {
        const defaultOptions = {
            width: 1.2,
            height: 0.5,
            length: 2.4,
            mass: 800,
            color: 0xFF4400,  // Bright orange
            wheelRadius: 0.4,
            wheelWidth: 0.35,
            wheelFriction: 10,
            wheelBaseZ: 2.2,
            wheelTrackX: 1.2,
            chassisOffsetY: 0.4,
            suspensionStiffness: 35,
            suspensionRestLength: 0.3,
            dampingRelaxation: 2.5,
            dampingCompression: 4.4,
            maxSuspensionForce: 100000,
            maxSuspensionTravel: 0.3,
            // Weapon system properties
            weaponDamage: 15,
            weaponFireRate: 100, // ms between shots
            weaponSpread: 0.02,
            weaponRange: 800,
            weaponProjectileSpeed: 200,
            type: 'muscle'  // Ensure type is set
        };
        
        super(world, scene, { ...defaultOptions, ...options });

        this.game = game;

        // Initialize projectile system if game is available
        if (game && game.cameraManager && game.cameraManager.camera) {
            this.projectileSystem = new ProjectileSystem(world, scene, game.cameraManager.camera, {
                projectileSize: 0.1,  // Small bullets
                projectileColor: 0xFF0000  // Red tracer rounds
            });
        } else {
            console.warn('Game or camera not available, weapon system will be disabled');
            this.projectileSystem = null;
        }

        // Initialize weapon system
        this.lastFireTime = 0;
        this.isFiring = false;
        this.weaponMeshes = [];

        // Override chassis mesh with detailed muscle car body
        this._createDetailedChassis();
        
        // Add muscle car specific features
        this._addMuscleCarFeatures();
        
        // Add weapon system
        this._createWeaponSystem();
        
        // Enhance wheels after everything else is set up
        this._enhanceWheels();
    }

    _createDetailedChassis() {
        // Remove existing chassis mesh
        if (this.chassisMesh) {
            this.scene.remove(this.chassisMesh);
        }

        // Create a group for all chassis parts
        this.chassisMesh = new THREE.Group();

        // Main body - using RoundedBoxGeometry
        const mainBodyGeo = VehicleGeometryFactory.createSmoothChassis(
            this.options.width * 2,
            this.options.height * 2,
            this.options.length * 2,
            0.15  // More pronounced rounding
        );

        // Create materials
        const bodyMaterial = VehicleGeometryFactory.createCarPaintMaterial(this.options.color);
        const chromeMaterial = VehicleGeometryFactory.createMetalMaterial(0xCCCCCC);
        const blackMaterial = VehicleGeometryFactory.createMatteMetalMaterial(0x111111);
        const glassMaterial = VehicleGeometryFactory.createGlassMaterial();

        // Main body mesh
        const mainBody = new THREE.Mesh(mainBodyGeo, bodyMaterial);
        this.chassisMesh.add(mainBody);

        // Hood scoop
        const hoodScoopGeo = VehicleGeometryFactory.createEngineScoop(0.3, 0.4);
        const hoodScoop = new THREE.Mesh(hoodScoopGeo, blackMaterial);
        hoodScoop.position.set(0, this.options.height * 1.2, -this.options.length * 0.5);
        this.chassisMesh.add(hoodScoop);

        // Front and rear bumpers using CapsuleGeometry
        const bumperGeo = new THREE.CapsuleGeometry(0.15, this.options.width * 1.6, 8, 16);
        bumperGeo.rotateZ(Math.PI / 2);

        const frontBumper = new THREE.Mesh(bumperGeo, chromeMaterial);
        frontBumper.position.set(0, this.options.height * 0.5, -this.options.length);
        this.chassisMesh.add(frontBumper);

        const rearBumper = new THREE.Mesh(bumperGeo.clone(), chromeMaterial);
        rearBumper.position.set(0, this.options.height * 0.5, this.options.length);
        this.chassisMesh.add(rearBumper);

        // Add rear lights - embedded look
        const lightStripGeo = new THREE.BoxGeometry(this.options.width * 1.6, 0.3, 0.01);  // Increased height
        const lightMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 2.5,  // Increased intensity
            transparent: true,
            opacity: 1.0
        });
        const rearLightStrip = new THREE.Mesh(lightStripGeo, lightMaterial);
        rearLightStrip.position.set(0, this.options.height * 0.3, this.options.length - 0.001);
        this.chassisMesh.add(rearLightStrip);

        // Add enhanced light glow effect
        const glowGeo = new THREE.PlaneGeometry(this.options.width * 1.8, 0.4);  // Increased height
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8,  // Increased opacity
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeo, glowMaterial);
        glow.position.set(0, this.options.height * 0.3, this.options.length);
        glow.rotation.y = Math.PI;
        this.chassisMesh.add(glow);

        // Add second glow layer for more intensity
        const glow2 = new THREE.Mesh(glowGeo.clone(), glowMaterial.clone());
        glow2.material.opacity = 0.5;  // Increased opacity
        glow2.position.set(0, this.options.height * 0.3, this.options.length + 0.01);
        glow2.rotation.y = Math.PI;
        glow2.scale.set(1.3, 1.3, 1.3);  // Increased scale
        this.chassisMesh.add(glow2);

        // Cabin/Greenhouse
        const cabinGeo = VehicleGeometryFactory.createSmoothCabin(
            this.options.width * 1.8,
            this.options.height * 1.2,
            this.options.length * 0.8,
            0.1
        );
        const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
        cabin.position.y = this.options.height * 0.6;
        this.chassisMesh.add(cabin);

        // Add to scene
        this.scene.add(this.chassisMesh);
    }

    _enhanceWheels() {
        // Create materials for different wheel parts
        const rimMaterial = VehicleGeometryFactory.createMetalMaterial(0xCCCCCC);  // Chrome rims
        const tireMaterial = VehicleGeometryFactory.createMatteMetalMaterial(0x111111);  // Black tires
        const brakeMaterial = VehicleGeometryFactory.createMetalMaterial(0xFF0000);  // Red brake calipers

        this.wheelMeshes.forEach((wheelMesh, index) => {
            // Remove existing wheel mesh
            wheelMesh.clear();
            
            // Create tire
            const tireGeometry = new THREE.CylinderGeometry(
                this.options.wheelRadius,
                this.options.wheelRadius,
                this.options.wheelWidth,
                32  // Higher segment count for smoother wheels
            );
            tireGeometry.rotateZ(Math.PI / 2);  // Changed to Z rotation to align with forward direction
            const tire = new THREE.Mesh(tireGeometry, tireMaterial);
            wheelMesh.add(tire);

            // Create rim
            const rimGeometry = new THREE.CylinderGeometry(
                this.options.wheelRadius * 0.7,  // Rim slightly smaller than tire
                this.options.wheelRadius * 0.7,
                this.options.wheelWidth * 0.9,
                16  // Segments
            );
            rimGeometry.rotateZ(Math.PI / 2);  // Changed to Z rotation to match tire
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            wheelMesh.add(rim);

            // Add spokes
            for (let i = 0; i < 5; i++) {
                const spokeGeometry = new THREE.BoxGeometry(
                    this.options.wheelRadius * 0.1,  // Reordered dimensions
                    this.options.wheelWidth * 0.8,
                    this.options.wheelRadius * 1.2
                );
                const spoke = new THREE.Mesh(spokeGeometry, rimMaterial);
                spoke.rotation.z = (i * Math.PI * 2) / 5;  // Changed to Z rotation
                rim.add(spoke);
            }

            // Add brake calipers on both sides
            const brakeGeometry = new THREE.BoxGeometry(
                this.options.wheelRadius * 0.2,
                this.options.wheelWidth * 0.6,  // Slightly shorter than wheel width
                this.options.wheelRadius * 0.3
            );

            // Left side brake caliper
            const leftBrake = new THREE.Mesh(brakeGeometry, brakeMaterial);
            leftBrake.position.set(-this.options.wheelRadius * 0.6, 0, 0);
            wheelMesh.add(leftBrake);

            // Right side brake caliper
            const rightBrake = new THREE.Mesh(brakeGeometry, brakeMaterial);
            rightBrake.position.set(this.options.wheelRadius * 0.6, 0, 0);
            wheelMesh.add(rightBrake);

            // Position wheels
            if (index === 0 || index === 1) {  // Front wheels
                wheelMesh.position.z = -this.options.wheelBaseZ / 2;
            } else {  // Rear wheels
                wheelMesh.position.z = this.options.wheelBaseZ / 2;
            }
            
            if (index === 0 || index === 2) {  // Left wheels
                wheelMesh.position.x = -(this.options.wheelTrackX / 2 + 0.05);  // Slight outward offset
            } else {  // Right wheels
                wheelMesh.position.x = (this.options.wheelTrackX / 2 + 0.05);   // Slight outward offset
            }

            wheelMesh.position.y = this.options.wheelRadius;
        });
    }

    _addMuscleCarFeatures() {
        const chromeMaterial = VehicleGeometryFactory.createMetalMaterial(0xCCCCCC);
        
        // Create exhaust system
        // Main exhaust pipes (angled from under the car to the rear)
        const mainExhaustGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 16);
        mainExhaustGeo.rotateX(Math.PI / 6); // Angle upwards slightly

        // Left exhaust system
        const leftMainExhaust = new THREE.Mesh(mainExhaustGeo, chromeMaterial);
        leftMainExhaust.position.set(-0.4, this.options.height * 0.25, this.options.length * 0.7);
        this.chassisMesh.add(leftMainExhaust);

        // Right exhaust system
        const rightMainExhaust = new THREE.Mesh(mainExhaustGeo.clone(), chromeMaterial);
        rightMainExhaust.position.set(0.4, this.options.height * 0.25, this.options.length * 0.7);
        this.chassisMesh.add(rightMainExhaust);

        // Exhaust tips (larger diameter, chrome finish)
        const tipGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.15, 16);
        tipGeo.rotateX(Math.PI / 6); // Match main pipe angle

        // Left tip
        const leftTip = new THREE.Mesh(tipGeo, chromeMaterial);
        leftTip.position.set(-0.4, this.options.height * 0.35, this.options.length * 0.95);
        this.chassisMesh.add(leftTip);

        // Right tip
        const rightTip = new THREE.Mesh(tipGeo.clone(), chromeMaterial);
        rightTip.position.set(0.4, this.options.height * 0.35, this.options.length * 0.95);
        this.chassisMesh.add(rightTip);

        // Add decorative rear diffuser between exhaust pipes
        const diffuserGeo = new THREE.BoxGeometry(0.9, 0.1, 0.3);
        const diffuserMat = VehicleGeometryFactory.createMatteMetalMaterial(0x111111);
        const diffuser = new THREE.Mesh(diffuserGeo, diffuserMat);
        diffuser.position.set(0, this.options.height * 0.25, this.options.length * 0.85);
        this.chassisMesh.add(diffuser);
    }

    _createWeaponSystem() {
        const chromeMaterial = VehicleGeometryFactory.createMetalMaterial(0xCCCCCC);
        const blackMaterial = VehicleGeometryFactory.createMatteMetalMaterial(0x111111);

        // Create weapon group
        this.weaponGroup = new THREE.Group();
        
        // Left machine gun
        const leftGun = this._createMachineGun(chromeMaterial, blackMaterial);
        leftGun.position.set(-0.3, this.options.height * 0.5, -this.options.length * 0.9);
        this.weaponGroup.add(leftGun);
        this.weaponMeshes.push(leftGun);

        // Right machine gun
        const rightGun = this._createMachineGun(chromeMaterial, blackMaterial);
        rightGun.position.set(0.3, this.options.height * 0.5, -this.options.length * 0.9);
        this.weaponGroup.add(rightGun);
        this.weaponMeshes.push(rightGun);

        // Add weapon group to chassis before adding to scene
        this.chassisMesh.add(this.weaponGroup);
    }

    _createMachineGun(chromeMaterial, blackMaterial) {
        const gunGroup = new THREE.Group();

        // Main barrel (25% longer)
        const barrelGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.25, 16);
        barrelGeo.rotateX(Math.PI / 2); // Rotate barrel to point forward
        const barrel = new THREE.Mesh(barrelGeo, chromeMaterial);
        barrel.position.z = -0.625; // Move barrel forward half its length
        gunGroup.add(barrel);

        // Gun body (larger and more visible)
        const bodyGeo = new THREE.BoxGeometry(0.15, 0.15, 0.3);
        const body = new THREE.Mesh(bodyGeo, blackMaterial);
        gunGroup.add(body);

        // Ammo drum (larger and more visible)
        const drumGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.2, 16);
        drumGeo.rotateZ(Math.PI / 2); // Rotate drum to be horizontal
        const drum = new THREE.Mesh(drumGeo, chromeMaterial);
        drum.position.z = 0.2; // Position behind the body
        gunGroup.add(drum);

        return gunGroup;
    }

    fireWeapon() {
        if (!this.projectileSystem) {
            console.warn('Cannot fire: projectile system not initialized');
            return;
        }

        const currentTime = Date.now();
        if (currentTime - this.lastFireTime < this.options.weaponFireRate) {
            return;
        }

        // Check ammo before firing
        if (!this.useAmmo(1)) {
            console.log("Cannot fire: no ammo remaining");
            return;
        }

        this.lastFireTime = currentTime;

        // Calculate firing positions for both guns
        this.weaponMeshes.forEach((gunMesh, index) => {
            // Get the barrel tip position (front of the gun)
            const barrelTip = new THREE.Vector3(0, 0, -1.25); // Full barrel length forward
            
            // Transform to world space
            const worldPosition = barrelTip.clone();
            worldPosition.applyMatrix4(gunMesh.matrixWorld);

            // Calculate firing direction
            const direction = new THREE.Vector3(0, 0, -1); // Forward direction
            direction.applyQuaternion(this.chassisMesh.quaternion);
            
            // Add spread based on vehicle speed
            const speedFactor = Math.min(this._vehicle.chassisBody.velocity.length() / 20, 1);
            const spread = this.options.weaponSpread * (1 + speedFactor);
            
            direction.x += (Math.random() - 0.5) * spread;
            direction.y += (Math.random() - 0.5) * spread;
            direction.normalize();

            // Debug visualization of barrel tip
            console.log('Firing from barrel:', {
                gunIndex: index,
                position: worldPosition.toArray(),
                direction: direction.toArray(),
                spread: spread
            });

            // Create projectile using ProjectileSystem
            this.projectileSystem.createProjectile(
                worldPosition,
                direction,
                this.options.weaponProjectileSpeed,
                this.options.weaponDamage
            );

            // Create muzzle flash at barrel tip
            this._createMuzzleFlash(worldPosition, direction);
        });
    }

    _createMuzzleFlash(position, direction) {
        const flashGroup = new THREE.Group();
        this.scene.add(flashGroup);

        // Main flash
        const flashGeo = new THREE.CylinderGeometry(0.1, 0.2, 0.3, 8);
        flashGeo.rotateX(Math.PI / 2);
        const flashMat = new THREE.MeshBasicMaterial({
            color: 0xFF6600,
            transparent: true,
            opacity: 0.8
        });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flashGroup.add(flash);

        // Position and orient flash
        flashGroup.position.copy(position);
        flashGroup.lookAt(position.clone().add(direction));

        // Animate and remove flash
        const duration = 100; // ms
        const startTime = Date.now();
        
        const animateFlash = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                this.scene.remove(flashGroup);
                return;
            }

            flash.scale.set(1 - progress, 1 - progress, 1 - progress);
            flashMat.opacity = 0.8 * (1 - progress);
            
            requestAnimationFrame(animateFlash);
        };

        animateFlash();
    }

    update(deltaTime) {
        if (!this.vehicle) return;  // Skip if vehicle not ready
        
        super.update(deltaTime);
        
        // Update projectile system
        if (this.projectileSystem) {
            this.projectileSystem.update(deltaTime);
        }

        // Handle firing input with mouse
        if (this.inputManager && this.inputManager.isMouseButtonPressed(0)) { // Left mouse button
            this.fireWeapon();
        }
    }

    _setupControls() {
        // Add firing control to input manager
        if (this.inputManager) {
            this.inputManager.addMouseButtonListener(0, () => { // Left mouse button
                this.fireWeapon();
            });
        }
    }

    updateVisuals() {
        super.updateVisuals();
        // The chassis group will automatically update all child meshes
    }
} 