import * as THREE from 'three';
import { BaseCar } from './BaseCar.js';
import { VehicleGeometryFactory } from '../../utils/GeometryUtils.js';
import { CapsuleGeometry, CylinderGeometry } from 'three';
import { ProjectileSystem } from '../../physics/ProjectileSystem.js';

export class Scorpion extends BaseCar {
    constructor(world, scene, game, options = {}) {
        const defaultOptions = {
            width: 1.1,
            height: 0.35,  // Very low profile
            length: 2.6,   // Long and sleek
            mass: 400,     // Light and agile
            color: 0xFF0000,  // Bright red
            wheelRadius: 0.35,
            wheelWidth: 0.3,
            wheelFriction: 4,
            suspensionRestLength: 0.4,  // Increased for better wheel visibility
            wheelBaseZ: 1.8,
            wheelTrackX: 1.2,  // Increased track width for more wheel visibility
            chassisOffsetY: 0.4,  // Raised slightly
            suspensionStiffness: 45,
            dampingRelaxation: 2.8,
            dampingCompression: 4.5,
            maxSuspensionForce: 100000,
            maxSuspensionTravel: 0.4,
            // Weapon system properties
            weaponDamage: 20,
            weaponFireRate: 150, // ms between shots (faster than Muscle Car)
            weaponSpread: 0.015,
            weaponRange: 1000,
            weaponProjectileSpeed: 250, // Faster projectiles
            type: 'scorpion'  // Ensure type is set
        };
        
        super(world, scene, { ...defaultOptions, ...options });

        this.game = game;
        this.inputManager = game.inputManager; // Store input manager reference

        // Initialize projectile system
        if (game && game.cameraManager && game.cameraManager.camera) {
            this.projectileSystem = new ProjectileSystem(world, scene, game.cameraManager.camera, {
                projectileSize: 0.15,  // Slightly larger than Muscle Car
                projectileColor: 0x00FFFF,  // Cyan energy projectiles
                projectileLifetime: 2000,  // 2 seconds
                projectileTrail: true,  // Add energy trail
                trailColor: 0x00FFFF,
                trailLength: 0.5
            });
        } else {
            console.warn('Projectile system not initialized: missing game or camera');
        }

        // Initialize weapon system
        this.lastFireTime = 0;
        this.isFiring = false;
        this.weaponMeshes = [];

        // Create detailed sports car body
        this._createDetailedChassis();
        
        // Add sports car specific features
        this._addSportsCarFeatures();
        
        // Add weapon system
        this._createWeaponSystem();
        
        // Enhance wheels
        this._enhanceWheels();

        // Setup controls
        this._setupControls();
    }

    _createDetailedChassis() {
        if (this.chassisMesh) {
            this.scene.remove(this.chassisMesh);
        }

        this.chassisMesh = new THREE.Group();

        // Main body - low and wide
        const mainBodyGeo = VehicleGeometryFactory.createSmoothChassis(
            this.options.width * 2,
            this.options.height * 2,
            this.options.length * 2,
            0.2  // More rounded edges
        );

        // Materials
        const bodyMaterial = VehicleGeometryFactory.createCarPaintMaterial(this.options.color);
        const blackMaterial = VehicleGeometryFactory.createMatteMetalMaterial(0x111111);
        const glassMaterial = VehicleGeometryFactory.createGlassMaterial();
        const carbonMaterial = VehicleGeometryFactory.createMatteMetalMaterial(0x222222);

        // Main body
        const mainBody = new THREE.Mesh(mainBodyGeo, bodyMaterial);
        this.chassisMesh.add(mainBody);

        // Aerodynamic nose with sharp angles
        const noseGeo = VehicleGeometryFactory.createAerodynamicNose(
            this.options.width * 1.6,
            this.options.height * 1.2,
            this.options.length * 0.4
        );
        const nose = new THREE.Mesh(noseGeo, bodyMaterial);
        nose.position.set(0, this.options.height * 0.5, -this.options.length * 0.8);
        this.chassisMesh.add(nose);

        // Sleek cabin with aggressive rake
        const cabinGeo = VehicleGeometryFactory.createSmoothCabin(
            this.options.width * 1.6,
            this.options.height * 0.8,
            this.options.length * 1.0,
            0.1
        );
        const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
        cabin.position.set(0, this.options.height * 0.8, 0);
        cabin.rotation.x = -0.1; // Slight rake angle
        this.chassisMesh.add(cabin);

        // Front splitter
        const splitterGeo = new THREE.BoxGeometry(this.options.width * 2.2, 0.05, 0.3);
        const splitter = new THREE.Mesh(splitterGeo, carbonMaterial);
        splitter.position.set(0, this.options.height * 0.2, -this.options.length * 0.9);
        this.chassisMesh.add(splitter);

        // Rear wing
        const wingGeo = new THREE.BoxGeometry(this.options.width * 1.8, 0.05, 0.3);
        const wing = new THREE.Mesh(wingGeo, carbonMaterial);
        wing.position.set(0, this.options.height * 1.4, this.options.length * 0.8);
        this.chassisMesh.add(wing);

        // Wing supports
        const supportGeo = new THREE.BoxGeometry(0.05, 0.3, 0.2);
        const leftSupport = new THREE.Mesh(supportGeo, carbonMaterial);
        leftSupport.position.set(-this.options.width * 0.8, this.options.height * 1.25, this.options.length * 0.8);
        this.chassisMesh.add(leftSupport);

        const rightSupport = new THREE.Mesh(supportGeo, carbonMaterial);
        rightSupport.position.set(this.options.width * 0.8, this.options.height * 1.25, this.options.length * 0.8);
        this.chassisMesh.add(rightSupport);

        this.scene.add(this.chassisMesh);
    }

    _addSportsCarFeatures() {
        const carbonMaterial = VehicleGeometryFactory.createMatteMetalMaterial(0x222222);
        const chromeMaterial = VehicleGeometryFactory.createMetalMaterial(0xCCCCCC);

        // Side skirts - moved inward and shortened
        const skirtGeo = new THREE.BoxGeometry(0.1, 0.15, this.options.length * 1.2);
        const leftSkirt = new THREE.Mesh(skirtGeo, carbonMaterial);
        leftSkirt.position.set(-this.options.width * 0.85, this.options.height * 0.3, 0);
        this.chassisMesh.add(leftSkirt);

        const rightSkirt = new THREE.Mesh(skirtGeo.clone(), carbonMaterial);
        rightSkirt.position.set(this.options.width * 0.85, this.options.height * 0.3, 0);
        this.chassisMesh.add(rightSkirt);

        // Rear diffuser
        const diffuserGeo = new THREE.BoxGeometry(this.options.width * 1.8, 0.15, 0.4);
        const diffuser = new THREE.Mesh(diffuserGeo, carbonMaterial);
        diffuser.position.set(0, this.options.height * 0.2, this.options.length * 0.9);
        diffuser.rotation.x = Math.PI / 12; // Angle upward
        this.chassisMesh.add(diffuser);

        // Quad exhaust system
        const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.1, 16);
        exhaustGeo.rotateX(Math.PI / 2);

        // Left exhausts
        const leftExhaust1 = new THREE.Mesh(exhaustGeo, chromeMaterial);
        leftExhaust1.position.set(-0.3, this.options.height * 0.3, this.options.length * 0.95);
        this.chassisMesh.add(leftExhaust1);

        const leftExhaust2 = new THREE.Mesh(exhaustGeo.clone(), chromeMaterial);
        leftExhaust2.position.set(-0.15, this.options.height * 0.3, this.options.length * 0.95);
        this.chassisMesh.add(leftExhaust2);

        // Right exhausts
        const rightExhaust1 = new THREE.Mesh(exhaustGeo.clone(), chromeMaterial);
        rightExhaust1.position.set(0.15, this.options.height * 0.3, this.options.length * 0.95);
        this.chassisMesh.add(rightExhaust1);

        const rightExhaust2 = new THREE.Mesh(exhaustGeo.clone(), chromeMaterial);
        rightExhaust2.position.set(0.3, this.options.height * 0.3, this.options.length * 0.95);
        this.chassisMesh.add(rightExhaust2);
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
            tireGeometry.rotateZ(Math.PI / 2);  // Align with vehicle's forward direction
            const tire = new THREE.Mesh(tireGeometry, tireMaterial);
            wheelMesh.add(tire);

            // Create rim
            const rimGeometry = new THREE.CylinderGeometry(
                this.options.wheelRadius * 0.7,  // Rim slightly smaller than tire
                this.options.wheelRadius * 0.7,
                this.options.wheelWidth * 0.9,
                16  // Segments
            );
            rimGeometry.rotateZ(Math.PI / 2);  // Align with vehicle's forward direction
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            wheelMesh.add(rim);

            // Add spokes (Y-shaped design for sports car look)
            for (let i = 0; i < 10; i++) {
                const spokeGeometry = new THREE.BoxGeometry(
                    this.options.wheelRadius * 0.08,  // Thinner spokes
                    this.options.wheelWidth * 0.8,
                    this.options.wheelRadius * 1.2
                );
                const spoke = new THREE.Mesh(spokeGeometry, rimMaterial);
                spoke.rotation.z = (i * Math.PI * 2) / 10;  // 10 spokes evenly distributed
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
                wheelMesh.position.x = -(this.options.wheelTrackX / 2 + 0.05);
            } else {  // Right wheels
                wheelMesh.position.x = (this.options.wheelTrackX / 2 + 0.05);
            }

            wheelMesh.position.y = this.options.wheelRadius;
        });
    }

    _createWeaponSystem() {
        const energyMaterial = new THREE.MeshStandardMaterial({
            color: 0x00FFFF,
            emissive: 0x00FFFF,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const blackMaterial = VehicleGeometryFactory.createMatteMetalMaterial(0x111111);

        // Create weapon group
        this.weaponGroup = new THREE.Group();
        
        // Left plasma cannon - moved higher and further forward
        const leftCannon = this._createPlasmaCannon(energyMaterial, blackMaterial);
        leftCannon.position.set(-0.4, this.options.height * 1.2, -this.options.length * 0.5); // Increased height and moved forward
        this.weaponGroup.add(leftCannon);
        this.weaponMeshes.push(leftCannon);

        // Right plasma cannon - moved higher and further forward
        const rightCannon = this._createPlasmaCannon(energyMaterial, blackMaterial);
        rightCannon.position.set(0.4, this.options.height * 1.2, -this.options.length * 0.5); // Increased height and moved forward
        this.weaponGroup.add(rightCannon);
        this.weaponMeshes.push(rightCannon);

        // Add weapon group to chassis
        this.chassisMesh.add(this.weaponGroup);
    }

    _createPlasmaCannon(energyMaterial, blackMaterial) {
        const cannonGroup = new THREE.Group();

        // Energy core (glowing cylinder) - made slightly larger
        const coreGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 16); // Increased size
        coreGeo.rotateX(Math.PI / 2);
        const core = new THREE.Mesh(coreGeo, energyMaterial);
        core.position.z = -0.2;
        cannonGroup.add(core);

        // Outer casing - made slightly larger
        const casingGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 16); // Increased size
        casingGeo.rotateX(Math.PI / 2);
        const casing = new THREE.Mesh(casingGeo, blackMaterial);
        casing.position.z = -0.2;
        cannonGroup.add(casing);

        // Front emitter (cone shape) - made slightly larger
        const emitterGeo = new THREE.ConeGeometry(0.15, 0.25, 16); // Increased size
        emitterGeo.rotateX(-Math.PI / 2);
        const emitter = new THREE.Mesh(emitterGeo, blackMaterial);
        emitter.position.z = 0;
        cannonGroup.add(emitter);

        // Energy rings - made slightly larger
        for (let i = 0; i < 3; i++) {
            const ringGeo = new THREE.TorusGeometry(0.15, 0.03, 8, 16); // Increased size
            const ring = new THREE.Mesh(ringGeo, energyMaterial);
            ring.position.z = -0.3 + (i * 0.15);
            ring.rotation.y = Math.PI / 2;
            cannonGroup.add(ring);
        }

        return cannonGroup;
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
        this.isFiring = true;

        // Calculate firing positions for both cannons
        this.weaponMeshes.forEach((cannonMesh, index) => {
            // Get the cannon tip position
            const cannonTip = new THREE.Vector3(0, 0, 0);
            cannonTip.applyMatrix4(cannonMesh.matrixWorld);

            // Calculate firing direction
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(this.chassisMesh.quaternion);
            
            // Add spread based on vehicle speed
            const speedFactor = Math.min(this._vehicle.chassisBody.velocity.length() / 30, 1);
            const spread = this.options.weaponSpread * (1 + speedFactor);
            
            direction.x += (Math.random() - 0.5) * spread;
            direction.y += (Math.random() - 0.5) * spread;
            direction.normalize();

            // Create projectile
            this.projectileSystem.createProjectile(
                cannonTip,
                direction,
                this.options.weaponProjectileSpeed,
                this.options.weaponDamage
            );

            // Create energy burst effect
            this._createEnergyBurst(cannonTip, direction);
        });
    }

    _createEnergyBurst(position, direction) {
        const burstGroup = new THREE.Group();
        this.scene.add(burstGroup);

        // Create energy burst effect
        const burstGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const burstMat = new THREE.MeshBasicMaterial({
            color: 0x00FFFF,
            transparent: true,
            opacity: 0.8
        });
        const burst = new THREE.Mesh(burstGeo, burstMat);
        burstGroup.add(burst);

        // Add energy particles
        const particleCount = 10;
        for (let i = 0; i < particleCount; i++) {
            const particleGeo = new THREE.SphereGeometry(0.05, 4, 4);
            const particle = new THREE.Mesh(particleGeo, burstMat);
            particle.position.set(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            burstGroup.add(particle);
        }

        // Position and orient burst
        burstGroup.position.copy(position);
        burstGroup.lookAt(position.clone().add(direction));

        // Animate and remove burst
        const duration = 150; // ms
        const startTime = Date.now();
        
        const animateBurst = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                this.scene.remove(burstGroup);
                return;
            }

            // Animate main burst
            burst.scale.set(1 - progress, 1 - progress, 1 + progress * 2);
            burstMat.opacity = 0.8 * (1 - progress);
            
            // Animate particles
            burstGroup.children.forEach((particle, index) => {
                if (particle !== burst) {
                    const particleProgress = progress + (index / particleCount) * 0.2;
                    if (particleProgress < 1) {
                        particle.scale.set(1 - particleProgress, 1 - particleProgress, 1 - particleProgress);
                        particle.position.multiplyScalar(1 + particleProgress * 2);
                        particle.material.opacity = 0.8 * (1 - particleProgress);
                    }
                }
            });
            
            requestAnimationFrame(animateBurst);
        };

        animateBurst();
    }

    _setupControls() {
        // No need to add listeners, we'll check the button state in update()
    }

    update(deltaTime) {
        if (!this.vehicle) return;
        
        super.update(deltaTime);
        
        // Update projectile system
        if (this.projectileSystem) {
            this.projectileSystem.update(deltaTime);
        }

        // Handle firing input with mouse
        if (this.inputManager && this.inputManager.isMouseButtonPressed(0)) {
            this.fireWeapon();
        }
    }

    updateVisuals() {
        super.updateVisuals();
        
        // Let BaseCar handle the wheel transforms
        // The wheel rotations will be handled by the physics engine
    }
} 