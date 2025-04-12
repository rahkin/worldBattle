import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { BaseCar } from './BaseCar.js';
import { VehicleGeometryFactory } from '../../utils/GeometryUtils.js';
import { ProjectileSystem } from '../../physics/ProjectileSystem.js';

export class Drone extends BaseCar {
    constructor(world, scene, game) {
        const options = {
            width: 0.8,
            height: 0.25,  // Very low profile
            length: 1.8,
            mass: 300,     // Light for agility
            color: 0x00BFFF,  // Deep sky blue
            wheelRadius: 0.3,
            wheelWidth: 0.25,
            wheelFriction: 3,
            suspensionRestLength: 0.35,
            wheelBaseZ: 1.5,
            wheelTrackX: 1.1,  // Wider stance
            chassisOffsetY: 0.35,
            suspensionStiffness: 35,
            dampingRelaxation: 2.3,
            dampingCompression: 4.2,
            maxSuspensionForce: 80000,  // Lower force for lighter vehicle
            maxSuspensionTravel: 0.4,
            // Weapon system properties
            weaponDamage: 25,
            weaponFireRate: 200, // ms between shots
            weaponSpread: 0.01,
            weaponRange: 1200,
            weaponProjectileSpeed: 300 // Very fast projectiles
        };
        super(world, scene, options);

        this.game = game;
        this.inputManager = game.inputManager;

        // Initialize projectile system
        if (game && game.cameraManager && game.cameraManager.camera) {
            this.projectileSystem = new ProjectileSystem(world, scene, game.cameraManager.camera, {
                projectileSize: 0.2,  // Increased size for better visibility
                projectileColor: 0x00BFFF,  // Matching drone color
                projectileLifetime: 1500,  // 1.5 seconds
                projectileTrail: true,  // Add energy trail
                trailColor: 0x00BFFF,
                trailLength: 1.2,  // Longer trails for better visibility
                trailWidth: 0.1,  // Added trail width
                trailOpacity: 0.8  // Added trail opacity
            });
        }

        // Initialize weapon system
        this.lastFireTime = 0;
        this.isFiring = false;
        this.weaponMeshes = [];

        this._createDetailedChassis();
        this._addDroneFeatures();
        this._createWeaponSystem();
        this._enhanceWheels();

        // Setup controls
        this._setupControls();
    }

    _createDetailedChassis() {
        if (this.chassisMesh) {
            this.scene.remove(this.chassisMesh);
        }

        this.chassisMesh = new THREE.Group();

        // Materials
        const bodyMaterial = VehicleGeometryFactory.createCarPaintMaterial(this.options.color);
        bodyMaterial.metalness = 0.9;
        bodyMaterial.roughness = 0.1;
        const glassMaterial = VehicleGeometryFactory.createGlassMaterial();
        glassMaterial.opacity = 0.3;
        const accentMaterial = VehicleGeometryFactory.createMetalMaterial(0x36454F); // Charcoal grey

        // Main body - sleek and angular
        const mainBodyGeo = VehicleGeometryFactory.createSmoothChassis(
            this.options.width * 2,
            this.options.height * 2,
            this.options.length * 2,
            0.1  // Sharp edges
        );
        const mainBody = new THREE.Mesh(mainBodyGeo, bodyMaterial);
        this.chassisMesh.add(mainBody);

        // Canopy
        const canopyGeo = VehicleGeometryFactory.createSmoothCabin(
            this.options.width * 1.4,
            this.options.height * 0.8,
            this.options.length * 0.8,
            0.05
        );
        const canopy = new THREE.Mesh(canopyGeo, glassMaterial);
        canopy.position.set(0, this.options.height * 0.6, -this.options.length * 0.1);
        canopy.rotation.x = -0.1;
        this.chassisMesh.add(canopy);

        // Front fins
        const finGeo = new THREE.BoxGeometry(0.05, 0.15, 0.4);
        const leftFin = new THREE.Mesh(finGeo, accentMaterial);
        leftFin.position.set(-this.options.width * 0.9, this.options.height * 0.5, -this.options.length * 0.7);
        leftFin.rotation.y = Math.PI / 12;
        this.chassisMesh.add(leftFin);

        const rightFin = new THREE.Mesh(finGeo, accentMaterial);
        rightFin.position.set(this.options.width * 0.9, this.options.height * 0.5, -this.options.length * 0.7);
        rightFin.rotation.y = -Math.PI / 12;
        this.chassisMesh.add(rightFin);

        this.scene.add(this.chassisMesh);
    }

    _addDroneFeatures() {
        // Materials
        const engineMaterial = new THREE.MeshPhongMaterial({
            color: this.options.color,
            emissive: this.options.color,
            emissiveIntensity: 0.5,
            metalness: 0.9,
            roughness: 0.1
        });

        const coreMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            emissive: this.options.color,
            emissiveIntensity: 1.0,
            metalness: 0.9,
            roughness: 0.1
        });

        // Hover engines (more complex geometry)
        const engineGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.1, 8);
        const engineRimGeo = new THREE.TorusGeometry(0.18, 0.02, 8, 16);
        
        // Front engines
        const createEngine = (x, z) => {
            const engineGroup = new THREE.Group();
            
            const engine = new THREE.Mesh(engineGeo, engineMaterial);
            const engineRim = new THREE.Mesh(engineRimGeo, engineMaterial);
            engineRim.rotation.x = Math.PI / 2;
            
            engineGroup.add(engine);
            engineGroup.add(engineRim);
            engineGroup.position.set(x, this.options.height * 0.3, z);
            this.chassisMesh.add(engineGroup);
            
            // Add engine glow
            const glowGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.05, 8);
            const glowMaterial = new THREE.MeshPhongMaterial({
                color: this.options.color,
                emissive: this.options.color,
                emissiveIntensity: 1,
                transparent: true,
                opacity: 0.5
            });
            const glow = new THREE.Mesh(glowGeo, glowMaterial);
            glow.position.y = -0.05;
            engineGroup.add(glow);
        };

        // Create four hover engines
        createEngine(-this.options.width * 0.7, -this.options.length * 0.6);
        createEngine(this.options.width * 0.7, -this.options.length * 0.6);
        createEngine(-this.options.width * 0.7, this.options.length * 0.6);
        createEngine(this.options.width * 0.7, this.options.length * 0.6);

        // Energy core
        const coreGeo = new THREE.SphereGeometry(0.15, 16, 16);
        this.energyCore = new THREE.Mesh(coreGeo, coreMaterial);
        this.energyCore.position.set(0, this.options.height * 0.5, 0);
        this.chassisMesh.add(this.energyCore);

        // Energy conduits
        const conduitGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
        const conduitMaterial = new THREE.MeshPhongMaterial({
            color: this.options.color,
            emissive: this.options.color,
            emissiveIntensity: 0.3
        });

        for (let i = 0; i < 4; i++) {
            const conduit = new THREE.Mesh(conduitGeo, conduitMaterial);
            conduit.position.set(0, this.options.height * 0.5, 0);
            conduit.rotation.z = (i * Math.PI) / 2;
            this.energyCore.add(conduit);
        }
    }

    _createWeaponSystem() {
        const energyMaterial = new THREE.MeshStandardMaterial({
            color: 0x00BFFF,
            emissive: 0x00BFFF,
            emissiveIntensity: 0.7,
            metalness: 0.9,
            roughness: 0.1
        });
        
        const blackMaterial = VehicleGeometryFactory.createMatteMetalMaterial(0x111111);

        // Create weapon group
        this.weaponGroup = new THREE.Group();
        
        // Left energy beam emitter - moved further forward by 35%
        const leftEmitter = this._createEnergyEmitter(energyMaterial, blackMaterial);
        leftEmitter.position.set(-0.3, this.options.height * 0.8, -this.options.length * 1.25);
        this.weaponGroup.add(leftEmitter);
        this.weaponMeshes.push(leftEmitter);

        // Right energy beam emitter - moved further forward by 35%
        const rightEmitter = this._createEnergyEmitter(energyMaterial, blackMaterial);
        rightEmitter.position.set(0.3, this.options.height * 0.8, -this.options.length * 1.25);
        this.weaponGroup.add(rightEmitter);
        this.weaponMeshes.push(rightEmitter);

        // Add weapon group to chassis
        this.chassisMesh.add(this.weaponGroup);
    }

    _createEnergyEmitter(energyMaterial, blackMaterial) {
        const emitterGroup = new THREE.Group();

        // Main emitter body
        const bodyGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8);
        bodyGeo.rotateX(Math.PI / 2);
        const body = new THREE.Mesh(bodyGeo, blackMaterial);
        body.position.z = 0.15;
        emitterGroup.add(body);

        // Energy core
        const coreGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const core = new THREE.Mesh(coreGeo, energyMaterial);
        core.position.z = 0.15;
        emitterGroup.add(core);

        // Energy rings
        for (let i = 0; i < 3; i++) {
            const ringGeo = new THREE.TorusGeometry(0.08, 0.01, 4, 8);
            const ring = new THREE.Mesh(ringGeo, energyMaterial);
            ring.position.z = 0.15 - (i * 0.1);
            ring.rotation.y = Math.PI / 2;
            emitterGroup.add(ring);
        }

        // Front lens
        const lensGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8);
        lensGeo.rotateX(Math.PI / 2);
        const lens = new THREE.Mesh(lensGeo, energyMaterial);
        lens.position.z = 0.3;
        emitterGroup.add(lens);

        return emitterGroup;
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

        this.lastFireTime = currentTime;
        this.isFiring = true;

        // Get the Drone's current velocity
        const droneVelocity = this.vehicle ? this.vehicle.chassisBody.velocity : new CANNON.Vec3(0, 0, 0);

        // Calculate firing positions for both emitters
        this.weaponMeshes.forEach((emitterMesh, index) => {
            // Get the emitter tip position
            const emitterTip = new THREE.Vector3(0, 0, 0);
            emitterTip.applyMatrix4(emitterMesh.matrixWorld);

            // Calculate firing direction
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(this.chassisMesh.quaternion);
            
            // Add minimal spread for energy beams
            const spread = this.options.weaponSpread;
            direction.x += (Math.random() - 0.5) * spread;
            direction.y += (Math.random() - 0.5) * spread;
            direction.normalize();

            // Create projectile with base speed
            this.projectileSystem.createProjectile(
                emitterTip,
                direction,
                this.options.weaponProjectileSpeed,
                this.options.weaponDamage,
                droneVelocity // Pass the drone's velocity
            );

            // Create energy burst effect
            this._createEnergyBurst(emitterTip, direction);
        });
    }

    _createEnergyBurst(position, direction) {
        const burstGroup = new THREE.Group();
        this.scene.add(burstGroup);

        // Create energy burst effect
        const burstGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const burstMat = new THREE.MeshBasicMaterial({
            color: 0x00BFFF,
            transparent: true,
            opacity: 0.8
        });
        const burst = new THREE.Mesh(burstGeo, burstMat);
        burstGroup.add(burst);

        // Add energy particles
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const particleGeo = new THREE.SphereGeometry(0.03, 4, 4);
            const particle = new THREE.Mesh(particleGeo, burstMat);
            particle.position.set(
                (Math.random() - 0.5) * 0.15,
                (Math.random() - 0.5) * 0.15,
                (Math.random() - 0.5) * 0.15
            );
            burstGroup.add(particle);
        }

        // Position and orient burst
        burstGroup.position.copy(position);
        burstGroup.lookAt(position.clone().add(direction));

        // Animate and remove burst
        const duration = 100; // ms
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

    _enhanceWheels() {
        const rimMaterial = VehicleGeometryFactory.createMetalMaterial(0x36454F);
        const tireMaterial = VehicleGeometryFactory.createMatteMetalMaterial(0x111111);

        this.wheelMeshes.forEach((wheelMesh, index) => {
            wheelMesh.clear();
            
            // Create tire
            const tireGeometry = new THREE.CylinderGeometry(
                this.options.wheelRadius,
                this.options.wheelRadius,
                this.options.wheelWidth,
                32
            );
            tireGeometry.rotateZ(Math.PI / 2);
            const tire = new THREE.Mesh(tireGeometry, tireMaterial);
            wheelMesh.add(tire);

            // Create tech-looking rim
            const rimGeometry = new THREE.CylinderGeometry(
                this.options.wheelRadius * 0.7,
                this.options.wheelRadius * 0.7,
                this.options.wheelWidth * 0.9,
                8,
                1,
                true
            );
            rimGeometry.rotateZ(Math.PI / 2);
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            wheelMesh.add(rim);

            // Create spokes - more technical looking
            for (let i = 0; i < 4; i++) {
                const spokeGeometry = new THREE.BoxGeometry(
                    this.options.wheelWidth * 0.8,
                    this.options.wheelRadius * 0.15,
                    this.options.wheelRadius * 1.2
                );
                const spoke = new THREE.Mesh(spokeGeometry, rimMaterial);
                spoke.rotation.x = (i * Math.PI) / 2;
                rim.add(spoke);
            }

            // Position wheels with slight outward offset
            if (index === 0 || index === 1) {
                wheelMesh.position.z = -this.options.wheelBaseZ / 2;
            } else {
                wheelMesh.position.z = this.options.wheelBaseZ / 2;
            }
            
            if (index === 0 || index === 2) {
                wheelMesh.position.x = -(this.options.wheelTrackX / 2 + 0.05);
            } else {
                wheelMesh.position.x = (this.options.wheelTrackX / 2 + 0.05);
            }

            wheelMesh.position.y = this.options.wheelRadius;
        });
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

    _setupControls() {
        // No need to add listeners, we'll check the button state in update()
    }

    updateVisuals() {
        super.updateVisuals();
        
        // Add hover effect animation
        if (this.energyCore) {
            this.energyCore.rotation.y += 0.02;
            this.energyCore.position.y = this.options.height * 0.5 + Math.sin(Date.now() * 0.003) * 0.02;
        }
    }
} 