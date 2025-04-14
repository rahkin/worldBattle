import * as THREE from 'three';
import { BaseCar } from './BaseCar.js';
import { VehicleGeometryFactory } from '../../utils/GeometryUtils.js';
import { ProjectileSystem } from '../ProjectileSystem.js';

export class Tank extends BaseCar {
    constructor(world, scene, game, options = {}) {
        const defaultOptions = {
            width: 1.3,
            height: 0.6,
            length: 2.6,
            mass: 2500,     // Heavier than Ironclad (2000) as it's a tank
            color: 0x4F5246,  // Military olive drab
            wheelRadius: 0.4,
            wheelWidth: 0.5,  // Wide tracks
            wheelFriction: 20, // Highest friction for tank tracks
            suspensionRestLength: 0.5,
            wheelBaseZ: 2.2,
            wheelTrackX: 1.4,
            chassisOffsetY: 0.5,
            suspensionStiffness: 70,  // Stiffest suspension for tank
            dampingRelaxation: 4.0,   // Heavy damping for stability
            dampingCompression: 5.0,   // Strong compression for heavy weight
            maxSuspensionForce: 300000, // Highest force for heaviest vehicle
            maxSuspensionTravel: 0.4,
            engineForce: 10000,  // Most powerful engine
            brakeForce: 200,    // Strong brakes
            maxSteerAngle: 0.5,  // Limited turning for realism
            type: 'tank'  // Ensure type is set
        };
        
        super(world, scene, { ...defaultOptions, ...options });

        this.game = game;
        
        // Initialize projectile system with larger projectile size
        this.projectileSystem = new ProjectileSystem(world, scene, game.cameraManager.camera, {
            projectileSize: 0.5,  // Largest projectile size
            projectileColor: 0xffaa00  // Bright orange for visibility
        });
        
        // Tank weapon properties
        this.weapon = {
            fireRate: 8000,      // 8 seconds between shots
            lastShot: 0,
            projectileSpeed: 175, // High velocity
            projectileDamage: 100, // Highest single-shot damage
            range: 1600,         // Long range
            spread: 0.0005       // Most accurate
        };

        // Simplified turret properties
        this.turret = {
            base: null,
            barrel: null
        };

        // Adjust physics body properties for tank
        this.vehicle.chassisBody.angularDamping = 0.3;  // More resistance to rotation
        this.vehicle.chassisBody.linearDamping = 0.05;  // Slight resistance to movement

        // Adjust wheel properties for tank tracks
        this.vehicle.wheelInfos.forEach(wheel => {
            wheel.frictionSlip = 8.0;  // High friction for tracks
            wheel.rollInfluence = 0.01; // Low roll for stability
            wheel.suspensionStiffness = 70;
            wheel.customSlidingRotationalSpeed = -30;
            wheel.useCustomSlidingRotationalSpeed = true;
        });

        this._createDetailedChassis();
        this._addTankFeatures();
        this._enhanceWheels();
        this._createTurret();

        // Cache objects for visual updates
        this._turretRotationQuat = new THREE.Quaternion();
        this._barrelOffset = new THREE.Vector3(0, 0, 2);
        this._tempVector = new THREE.Vector3();
    }

    _createDetailedChassis() {
        if (this.chassisMesh) {
            this.scene.remove(this.chassisMesh);
        }

        // Create a group for all chassis parts
        this.chassisMesh = new THREE.Group();

        // Main body
        const mainBodyGeo = new THREE.BoxGeometry(this.options.width * 2, this.options.height * 2, this.options.length * 2);
        const tankMaterial = new THREE.MeshPhongMaterial({ 
            color: this.options.color,
            roughness: 0.7,
            metalness: 0.3
        });
        const mainBody = new THREE.Mesh(mainBodyGeo, tankMaterial);
        this.chassisMesh.add(mainBody);

        // Add enhanced rear lights - military style
        const lightStripGeo = new THREE.BoxGeometry(this.options.width * 0.8, 0.4, 0.05);
        const lightMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 3.0,
            transparent: true,
            opacity: 1.0
        });

        // Create two separate light strips for a more military look
        const leftLight = new THREE.Mesh(lightStripGeo, lightMaterial);
        leftLight.position.set(-this.options.width * 0.4, this.options.height * 0.3, this.options.length - 0.001);
        leftLight.scale.set(0.4, 1, 1);
        this.chassisMesh.add(leftLight);

        const rightLight = new THREE.Mesh(lightStripGeo, lightMaterial);
        rightLight.position.set(this.options.width * 0.4, this.options.height * 0.3, this.options.length - 0.001);
        rightLight.scale.set(0.4, 1, 1);
        this.chassisMesh.add(rightLight);

        // Add enhanced glow effects
        const glowGeo = new THREE.PlaneGeometry(this.options.width * 0.4, 0.5);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const leftGlow = new THREE.Mesh(glowGeo, glowMaterial);
        leftGlow.position.set(-this.options.width * 0.4, this.options.height * 0.3, this.options.length + 0.01);
        leftGlow.rotation.y = Math.PI;
        this.chassisMesh.add(leftGlow);

        const rightGlow = new THREE.Mesh(glowGeo, glowMaterial);
        rightGlow.position.set(this.options.width * 0.4, this.options.height * 0.3, this.options.length + 0.01);
        rightGlow.rotation.y = Math.PI;
        this.chassisMesh.add(rightGlow);

        // Add second layer of glow for more intensity
        const leftGlow2 = new THREE.Mesh(glowGeo.clone(), glowMaterial.clone());
        leftGlow2.material.opacity = 0.5;
        leftGlow2.position.set(-this.options.width * 0.4, this.options.height * 0.3, this.options.length + 0.02);
        leftGlow2.rotation.y = Math.PI;
        leftGlow2.scale.set(1.3, 1.3, 1.3);
        this.chassisMesh.add(leftGlow2);

        const rightGlow2 = new THREE.Mesh(glowGeo.clone(), glowMaterial.clone());
        rightGlow2.material.opacity = 0.5;
        rightGlow2.position.set(this.options.width * 0.4, this.options.height * 0.3, this.options.length + 0.02);
        rightGlow2.rotation.y = Math.PI;
        rightGlow2.scale.set(1.3, 1.3, 1.3);
        this.chassisMesh.add(rightGlow2);

        this.scene.add(this.chassisMesh);
        
        // Create the turret after adding the chassis
        this._createTurret();
    }

    _addTankFeatures() {
        const tankMaterial = new THREE.MeshPhongMaterial({
            color: this.options.color,
            metalness: 0.7,
            roughness: 0.5
        });

        const darkMetal = new THREE.MeshPhongMaterial({
            color: 0x2a2a2a,
            metalness: 0.8,
            roughness: 0.4
        });

        // Add track covers (fenders)
        const fenderGeo = new THREE.BoxGeometry(0.2, 0.1, this.options.length * 1.6);
        const leftFender = new THREE.Mesh(fenderGeo, tankMaterial);
        leftFender.position.set(-this.options.width * 0.9, this.options.height * 0.3, 0);
        this.chassisMesh.add(leftFender);

        const rightFender = new THREE.Mesh(fenderGeo.clone(), tankMaterial);
        rightFender.position.set(this.options.width * 0.9, this.options.height * 0.3, 0);
        this.chassisMesh.add(rightFender);

        // Add some equipment boxes
        this._addEquipmentBoxes();
    }

    _addEquipmentBoxes() {
        const boxMaterial = new THREE.MeshPhongMaterial({
            color: 0x2F2F2F,
            metalness: 0.6,
            roughness: 0.7
        });

        const boxPositions = [
            { size: [0.3, 0.2, 0.4], pos: [-0.5, 0.4, 0.8] },
            { size: [0.3, 0.2, 0.3], pos: [0.5, 0.4, 0.8] }
        ];

        boxPositions.forEach(box => {
            const boxGeo = new THREE.BoxGeometry(...box.size);
            const boxMesh = new THREE.Mesh(boxGeo, boxMaterial);
            boxMesh.position.set(...box.pos);
            this.chassisMesh.add(boxMesh);
        });
    }

    _enhanceWheels() {
        const trackMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            metalness: 0.6,
            roughness: 0.8
        });

        this.wheelMeshes.forEach((wheelMesh, index) => {
            wheelMesh.clear();

            // Create track wheel
            const wheelGeometry = new THREE.CylinderGeometry(
                this.options.wheelRadius,
                this.options.wheelRadius,
                this.options.wheelWidth,
                16
            );
            wheelGeometry.rotateZ(Math.PI / 2);
            const wheel = new THREE.Mesh(wheelGeometry, trackMaterial);
            wheelMesh.add(wheel);

            // Add track details
            for (let i = 0; i < 8; i++) {
                const trackPadGeo = new THREE.BoxGeometry(
                    this.options.wheelWidth,
                    this.options.wheelRadius * 0.3,
                    this.options.wheelRadius * 0.4
                );
                const trackPad = new THREE.Mesh(trackPadGeo, trackMaterial);
                trackPad.rotation.x = (i * Math.PI) / 4;
                trackPad.position.y = this.options.wheelRadius * 0.7;
                wheel.add(trackPad);
            }

            // Position wheels
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

    _createTurret() {
        // Clear any existing turret components
        if (this.turret?.base) {
            this.chassisMesh.remove(this.turret.base);
        }
        if (this.turret?.barrel) {
            this.chassisMesh.remove(this.turret.barrel);
        }

        this.turret = {};

        // Create turret base
        const baseGeometry = new THREE.CylinderGeometry(0.8, 0.9, 0.4, 8);
        this.turret.base = new THREE.Mesh(baseGeometry, new THREE.MeshPhongMaterial({
            color: this.options.color,
            metalness: 0.8,
            roughness: 0.3
        }));
        this.turret.base.position.y = this.options.height * 1.5;
        this.chassisMesh.add(this.turret.base);

        // Create main turret body
        const turretGeometry = new THREE.BoxGeometry(1.4, 0.5, 1.6);
        const turretBody = new THREE.Mesh(turretGeometry, new THREE.MeshPhongMaterial({
            color: this.options.color,
            metalness: 0.8,
            roughness: 0.3
        }));
        turretBody.position.set(0, this.options.height * 1.5 + 0.3, 0);
        this.chassisMesh.add(turretBody);

        // Create gun mantlet (thicker armor around barrel)
        const mantletGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
        const mantlet = new THREE.Mesh(mantletGeometry, new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.2
        }));
        mantlet.rotation.x = Math.PI / 2;
        mantlet.position.set(0, this.options.height * 1.5 + 0.3, -0.7);
        this.chassisMesh.add(mantlet);

        // Create main gun barrel (longer and more prominent)
        const barrelLength = 4.0;
        const barrelGeometry = new THREE.CylinderGeometry(0.15, 0.15, barrelLength, 16);
        this.turret.barrel = new THREE.Mesh(barrelGeometry, new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.2,
            side: THREE.DoubleSide
        }));
        this.turret.barrel.rotation.x = Math.PI / 2;
        this.turret.barrel.position.set(0, this.options.height * 1.5 + 0.3, -(barrelLength/2 + 0.7));
        this.chassisMesh.add(this.turret.barrel);

        // Add barrel reinforcement (thermal sleeve)
        const sleeveGeometry = new THREE.CylinderGeometry(0.17, 0.17, barrelLength * 0.7, 16);
        const sleeve = new THREE.Mesh(sleeveGeometry, new THREE.MeshPhongMaterial({
            color: 0x2a2a2a,
            metalness: 0.8,
            roughness: 0.4,
            side: THREE.DoubleSide
        }));
        sleeve.rotation.x = Math.PI / 2;
        sleeve.position.set(0, this.options.height * 1.5 + 0.3, -(barrelLength * 0.35 + 0.7));
        this.chassisMesh.add(sleeve);

        // Add muzzle brake
        const muzzleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16);
        const muzzle = new THREE.Mesh(muzzleGeometry, new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.2,
            side: THREE.DoubleSide
        }));
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, this.options.height * 1.5 + 0.3, -(barrelLength + 0.7));
        this.chassisMesh.add(muzzle);

        // Add muzzle brake vents
        const ventGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.1);
        [-0.15, 0, 0.15].forEach(y => {
            const vent = new THREE.Mesh(ventGeometry, new THREE.MeshPhongMaterial({
                color: 0x0a0a0a,
                metalness: 0.9,
                roughness: 0.2
            }));
            vent.position.set(0, this.options.height * 1.5 + 0.3 + y, -(barrelLength + 0.7));
            this.chassisMesh.add(vent);
        });

        // Force initial matrix updates
        this.chassisMesh.updateMatrixWorld(true);
        this.turret.base.updateMatrixWorld(true);
        this.turret.barrel.updateMatrixWorld(true);

        console.log("Static turret created:", {
            base: this.turret.base.position.toArray(),
            barrel: this.turret.barrel.position.toArray(),
            barrelWorld: this.turret.barrel.getWorldPosition(new THREE.Vector3()).toArray()
        });
    }

    fireCannon() {
        if (!this.projectileSystem || !this.turret?.barrel) {
            console.log("Cannot fire: missing projectile system or barrel");
            return;
        }

        const now = Date.now();
        const timeSinceLastShot = now - this.weapon.lastShot;
        
        if (timeSinceLastShot < this.weapon.fireRate) {
            const remainingCooldown = ((this.weapon.fireRate - timeSinceLastShot) / 1000).toFixed(1);
            console.log(`Cannot fire: weapon on cooldown (${remainingCooldown}s remaining)`);
            return;
        }

        // Check ammo before firing
        if (!this.useAmmo(1)) {
            console.log("Cannot fire: no ammo remaining");
            return;
        }

        // Get the barrel's world matrix
        const barrelMatrix = new THREE.Matrix4();
        barrelMatrix.copy(this.turret.barrel.matrixWorld);

        // Calculate the barrel tip position in world space
        const barrelTip = new THREE.Vector3();
        barrelTip.setFromMatrixPosition(barrelMatrix);
        
        // Calculate forward direction in barrel's local space
        const forward = new THREE.Vector3(0, 0, -1);
        
        // Transform direction to world space using chassis orientation
        const direction = forward.clone();
        direction.applyQuaternion(this.chassisMesh.quaternion);
        
        // Move the firing position to the barrel tip
        barrelTip.add(direction.multiplyScalar(4.0));
        
        // Reset direction and add minimal spread (high accuracy)
        direction.set(0, 0, -1);
        direction.applyQuaternion(this.chassisMesh.quaternion);
        direction.x += (Math.random() - 0.5) * this.weapon.spread;
        direction.y += (Math.random() - 0.5) * this.weapon.spread;
        direction.normalize();

        console.log("Firing main gun:", {
            velocity: this.weapon.projectileSpeed + " m/s",
            cooldown: (this.weapon.fireRate / 1000) + "s",
            accuracy: "±" + (this.weapon.spread * 100).toFixed(3) + "%",
            position: barrelTip.toArray(),
            direction: direction.toArray()
        });

        // Create projectile
        this.projectileSystem.createProjectile(
            barrelTip,
            direction,
            this.weapon.projectileSpeed,
            this.weapon.projectileDamage
        );

        this.weapon.lastShot = now;
        this.createMuzzleFlash();
    }

    createMuzzleFlash() {
        // Get the barrel's world position and direction
        const barrelTip = new THREE.Vector3();
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.chassisMesh.quaternion);
        this.turret.barrel.getWorldPosition(barrelTip);
        barrelTip.add(direction.multiplyScalar(4.0));

        // Create a point light for the muzzle flash
        const light = new THREE.PointLight(0xffaa00, 3, 4);
        light.position.copy(barrelTip);
        this.chassisMesh.add(light);

        // Create a simple flash geometry instead of using a texture
        const flashGeometry = new THREE.CircleGeometry(0.5, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(barrelTip);
        flash.rotation.y = Math.PI / 2;
        this.chassisMesh.add(flash);

        // Animate and remove
        let scale = 1;
        const animate = () => {
            scale *= 0.8;
            flash.scale.set(scale, scale, scale);
            flashMaterial.opacity = scale;
            
            if (scale > 0.1) {
                requestAnimationFrame(animate);
            } else {
                this.chassisMesh.remove(light);
                this.chassisMesh.remove(flash);
                light.dispose();
                flashMaterial.dispose();
                flashGeometry.dispose();
            }
        };
        requestAnimationFrame(animate);
    }

    update(deltaTime) {
        if (!this.vehicle) return;
        
        super.update(deltaTime);
        
        // Update projectile system
        if (this.projectileSystem) {
            this.projectileSystem.update(deltaTime);
        }
    }

    updateVisuals() {
        super.updateVisuals();
        
        if (this.turretMesh && this.chassisBody) {
            const chassisWorldPos = this.chassisBody.position;
            const chassisWorldQuat = this.chassisBody.quaternion;
            
            this.turretMesh.position.copy(chassisWorldPos);
            this.turretMesh.position.y += this.options.height + 0.2;
            
            // Apply chassis rotation to turret base
            this.turretMesh.quaternion.copy(chassisWorldQuat);
            
            // Apply additional turret rotation based on aim
            if (this.turretRotation) {
                this._turretRotationQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.turretRotation);
                this.turretMesh.quaternion.multiply(this._turretRotationQuat);
            }
            
            // Update muzzle flash position
            if (this.muzzleFlash) {
                this.muzzleFlash.position.copy(this.turretMesh.position);
                this.muzzleFlash.position.y = this.turretMesh.position.y;
                this.muzzleFlash.quaternion.copy(this.turretMesh.quaternion);
                
                // Offset muzzle flash to barrel end using cached vector
                this._tempVector.copy(this._barrelOffset).applyQuaternion(this.turretMesh.quaternion);
                this.muzzleFlash.position.add(this._tempVector);
            }
        }
    }

    destroy() {
        // Clean up cached objects
        this._turretRotationQuat = null;
        this._barrelOffset = null;
        this._tempVector = null;
        super.destroy();
    }
} 