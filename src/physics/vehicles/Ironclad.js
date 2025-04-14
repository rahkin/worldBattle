import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { BaseCar } from './BaseCar.js';
import { VehicleGeometryFactory } from '../../utils/GeometryUtils.js';
import { ProjectileSystem } from '../ProjectileSystem.js';

export class Ironclad extends BaseCar {
    constructor(world, scene, game, options = {}) {
        const defaultOptions = {
            width: 1.4,
            height: 0.7,
            length: 2.8,
            mass: 2000,     // Heaviest non-tank vehicle
            color: 0x2F4F4F,  // Dark slate gray
            wheelRadius: 0.5,
            wheelWidth: 0.45,
            wheelFriction: 18,    // High friction for the heavy weight
            suspensionRestLength: 0.5,
            wheelBaseZ: 2.4,
            wheelTrackX: 1.5,     // Wide stance for stability
            chassisOffsetY: 0.6,
            suspensionStiffness: 65,  // Very stiff suspension
            dampingRelaxation: 4.0,   // Heavy damping
            dampingCompression: 5.0,   // Strong compression
            maxSuspensionForce: 250000,  // Very high force for the armor
            maxSuspensionTravel: 0.4,
            engineForce: 8000,  // Extremely powerful engine
            brakeForce: 200,    // Strong brakes
            maxSteerAngle: 0.5,  // Reduced for stability
            type: 'ironclad'  // Ensure type is set
        };
        
        super(world, scene, { ...defaultOptions, ...options });

        this.game = game;  // Store game reference

        // Initialize projectile system with camera from game
        this.projectileSystem = new ProjectileSystem(world, scene, game.cameraManager.camera);
        
        // Weapon properties (based on M1 Bradley's 25mm Bushmaster chain gun)
        this.weapon = {
            fireRate: 300,      // 300ms between shots (200 rounds/minute)
            lastShot: 0,
            projectileSpeed: 200, // High velocity for long range
            projectileDamage: 25, // Increased damage
            range: 2000,        // Effective range in meters
            spread: 0.001       // Minimal spread for accuracy
        };

        // Fixed gun properties
        this.gun = {
            mesh: null,
            barrel: null
        };

        // Create vehicle components in the correct order
        this._createDetailedChassis();
        this._addArmorPlating();
        this._enhanceWheels();
        this._createFixedGun();

        // Adjust physics body properties after vehicle is created
        if (this.vehicle) {
            this.vehicle.chassisBody.angularDamping = 0.3;   // Stable turning
            this.vehicle.chassisBody.linearDamping = 0.05;

            // Adjust wheel properties for better traction
            this.vehicle.wheelInfos.forEach(wheel => {
                wheel.frictionSlip = 5.0;        // Maximum grip
                wheel.rollInfluence = 0.01;      // Minimal body roll
                wheel.suspensionStiffness = 65;  // Match chassis stiffness
                wheel.customSlidingRotationalSpeed = -60;  // Quick wheel response
                wheel.useCustomSlidingRotationalSpeed = true;
            });
        }
    }

    _createFixedGun() {
        const darkMetal = new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.2
        });

        // Create gun mount
        const mountGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.6);
        this.gun.mesh = new THREE.Group();
        const mount = new THREE.Mesh(mountGeometry, darkMetal);
        mount.position.set(0, this.options.height * 1.2, -0.4);
        this.gun.mesh.add(mount);

        // Create gun barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.1, 0.12, 2.0, 8);
        barrelGeometry.rotateZ(Math.PI / 2);
        this.gun.barrel = new THREE.Mesh(barrelGeometry, darkMetal);
        this.gun.barrel.position.set(0, this.options.height * 1.2, -1.4);
        this.gun.mesh.add(this.gun.barrel);

        // Add muzzle brake
        const muzzleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
        muzzleGeometry.rotateZ(Math.PI / 2);
        const muzzle = new THREE.Mesh(muzzleGeometry, darkMetal);
        muzzle.position.set(0, this.options.height * 1.2, -2.4);
        this.gun.mesh.add(muzzle);

        // Add to chassis
        this.chassisMesh.add(this.gun.mesh);
    }

    update(deltaTime) {
        if (!this.vehicle) return;  // Skip if vehicle not ready
        
        super.update(deltaTime);
        
        // Update projectile system
        if (this.projectileSystem) {
            this.projectileSystem.update(deltaTime);
        }
        
        // Handle firing input
        if (this.inputManager && this.inputManager.isMouseButtonPressed(0)) {
            this.fireCannon();
        }
    }

    fireCannon() {
        if (!this.gun?.mesh || !this.projectileSystem) return;  // Skip if not ready
        
        const now = Date.now();
        if (now - this.weapon.lastShot < this.weapon.fireRate) return;
        
        // Check ammo before firing
        if (!this.useAmmo(1)) {
            console.log("Cannot fire: no ammo remaining");
            return;
        }
        
        // Get world position of the barrel tip
        const barrelTip = new THREE.Vector3(0, this.options.height * 1.2, -2.4);
        const worldMatrix = this.chassisMesh.matrixWorld.clone();
        barrelTip.applyMatrix4(worldMatrix);
        
        // Calculate firing direction based on vehicle's forward direction
        const direction = new THREE.Vector3(0, 0, -1);
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.extractRotation(worldMatrix);
        direction.applyMatrix4(rotationMatrix);
        direction.normalize();
        
        // Add spread
        direction.x += (Math.random() - 0.5) * this.weapon.spread;
        direction.y += (Math.random() - 0.5) * this.weapon.spread;
        direction.z += (Math.random() - 0.5) * this.weapon.spread;
        direction.normalize();
        
        // Create single projectile
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
        const flashGeometry = new THREE.BufferGeometry();
        const flashVertices = new Float32Array([
            0, 0, 0,    // center
            0.2, 0.2, -0.5,  // top right
            -0.2, 0.2, -0.5,  // top left
            0.2, -0.2, -0.5,  // bottom right
            -0.2, -0.2, -0.5   // bottom left
        ]);
        flashGeometry.setAttribute('position', new THREE.BufferAttribute(flashVertices, 3));
        flashGeometry.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1]);

        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.set(0, this.options.height * 1.2, -2.6); // Slightly in front of barrel
        this.gun.mesh.add(flash);

        // Animate the flash
        let scale = 1;
        const animate = () => {
            scale *= 0.8;
            flash.scale.set(scale, scale, scale);
            flash.material.opacity = scale;
            
            if (scale > 0.1) {
                requestAnimationFrame(animate);
            } else {
                this.gun.mesh.remove(flash);
            }
        };
        requestAnimationFrame(animate);
    }

    _createDetailedChassis() {
        if (this.chassisMesh) {
            this.scene.remove(this.chassisMesh);
        }

        this.chassisMesh = new THREE.Group();

        // Main body
        const mainBodyGeo = new THREE.BoxGeometry(this.options.width * 2, this.options.height * 2, this.options.length * 2);
        const armorMaterial = new THREE.MeshPhongMaterial({ 
            color: this.options.color,
            roughness: 0.8,
            metalness: 0.6 
        });
        const mainBody = new THREE.Mesh(mainBodyGeo, armorMaterial);
        this.chassisMesh.add(mainBody);

        // Add heavily armored rear lights
        const lightStripGeo = new THREE.BoxGeometry(this.options.width * 0.8, 0.5, 0.05);
        const lightMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 4.0,
            transparent: true,
            opacity: 1.0
        });

        // Create three light strips on each side for a more industrial look
        const lightPositions = [-1, 0, 1];
        lightPositions.forEach(xOffset => {
            // Left side lights
            const leftLight = new THREE.Mesh(lightStripGeo, lightMaterial);
            leftLight.position.set(
                -this.options.width * 0.4 + (xOffset * 0.2),
                this.options.height * 0.3,
                this.options.length - 0.001
            );
            this.chassisMesh.add(leftLight);

            // Right side lights
            const rightLight = new THREE.Mesh(lightStripGeo, lightMaterial);
            rightLight.position.set(
                this.options.width * 0.4 + (xOffset * 0.2),
                this.options.height * 0.3,
                this.options.length - 0.001
            );
            this.chassisMesh.add(rightLight);
        });

        // Add enhanced glow effects behind the armor
        const glowGeo = new THREE.PlaneGeometry(this.options.width * 0.4, 0.6);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        // Left side glow
        const leftGlow = new THREE.Mesh(glowGeo, glowMaterial);
        leftGlow.position.set(-this.options.width * 0.4, this.options.height * 0.3, this.options.length + 0.01);
        leftGlow.rotation.y = Math.PI;
        this.chassisMesh.add(leftGlow);

        // Right side glow
        const rightGlow = new THREE.Mesh(glowGeo, glowMaterial);
        rightGlow.position.set(this.options.width * 0.4, this.options.height * 0.3, this.options.length + 0.01);
        rightGlow.rotation.y = Math.PI;
        this.chassisMesh.add(rightGlow);

        // Add second layer of glow for more intensity
        const leftGlow2 = new THREE.Mesh(glowGeo.clone(), glowMaterial.clone());
        leftGlow2.material.opacity = 0.5;
        leftGlow2.position.set(-this.options.width * 0.4, this.options.height * 0.3, this.options.length + 0.02);
        leftGlow2.rotation.y = Math.PI;
        leftGlow2.scale.set(1.4, 1.4, 1.4);
        this.chassisMesh.add(leftGlow2);

        const rightGlow2 = new THREE.Mesh(glowGeo.clone(), glowMaterial.clone());
        rightGlow2.material.opacity = 0.5;
        rightGlow2.position.set(this.options.width * 0.4, this.options.height * 0.3, this.options.length + 0.02);
        rightGlow2.rotation.y = Math.PI;
        rightGlow2.scale.set(1.4, 1.4, 1.4);
        this.chassisMesh.add(rightGlow2);

        this.scene.add(this.chassisMesh);
        
        // Create the fixed gun after adding the chassis
        this._createFixedGun();
    }

    _addArmorPlating() {
        const armorMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            metalness: 0.8,
            roughness: 0.3
        });

        // Front heavy armor
        const frontArmorGeo = new THREE.BoxGeometry(1.6, 0.5, 0.3);
        this.frontArmor = new THREE.Mesh(frontArmorGeo, armorMaterial);
        this.frontArmor.position.set(0, 0.3, -this.options.length * 0.9);
        this.frontArmor.rotation.x = Math.PI * 0.1;
        this.chassisMesh.add(this.frontArmor);

        // Side armor plates (angled)
        const sideArmorGeo = new THREE.BoxGeometry(0.3, 0.6, this.options.length * 1.6);
        
        this.leftArmor = new THREE.Mesh(sideArmorGeo, armorMaterial);
        this.leftArmor.position.set(-this.options.width * 0.9, 0.2, 0);
        this.leftArmor.rotation.z = Math.PI * 0.05;  // Slight angle
        this.chassisMesh.add(this.leftArmor);

        this.rightArmor = new THREE.Mesh(sideArmorGeo.clone(), armorMaterial);
        this.rightArmor.position.set(this.options.width * 0.9, 0.2, 0);
        this.rightArmor.rotation.z = -Math.PI * 0.05;  // Slight angle
        this.chassisMesh.add(this.rightArmor);

        // Top armor plates
        const topArmorGeo = new THREE.BoxGeometry(this.options.width * 1.8, 0.15, this.options.length * 1.6);
        const topArmor = new THREE.Mesh(topArmorGeo, armorMaterial);
        topArmor.position.set(0, this.options.height * 0.8, 0);
        this.chassisMesh.add(topArmor);

        // Add armor ridges
        this._addArmorRidges();
    }

    _addArmorRidges() {
        const ridgeMaterial = new THREE.MeshPhongMaterial({
            color: 0x2a2a2a,
            metalness: 0.9,
            roughness: 0.4
        });

        // Add reinforcement ridges
        const ridgeGeo = new THREE.BoxGeometry(0.1, 0.1, this.options.length * 1.5);
        const ridgePositions = [
            { x: -this.options.width * 0.5, y: this.options.height * 0.9 },
            { x: 0, y: this.options.height * 0.9 },
            { x: this.options.width * 0.5, y: this.options.height * 0.9 }
        ];

        ridgePositions.forEach(pos => {
            const ridge = new THREE.Mesh(ridgeGeo, ridgeMaterial);
            ridge.position.set(pos.x, pos.y, 0);
            this.chassisMesh.add(ridge);
        });
    }

    _enhanceWheels() {
        const rimMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            metalness: 0.8,
            roughness: 0.4
        });

        const tireMaterial = new THREE.MeshPhongMaterial({
            color: 0x0a0a0a,
            metalness: 0.4,
            roughness: 0.9
        });

        this.wheelMeshes.forEach((wheelMesh, index) => {
            wheelMesh.clear();

            // Create armored tire
            const tireGeometry = new THREE.CylinderGeometry(
                this.options.wheelRadius,
                this.options.wheelRadius,
                this.options.wheelWidth,
                24
            );
            tireGeometry.rotateZ(Math.PI / 2);
            const tire = new THREE.Mesh(tireGeometry, tireMaterial);
            wheelMesh.add(tire);

            // Create reinforced rim
            const rimGeometry = new THREE.CylinderGeometry(
                this.options.wheelRadius * 0.65,
                this.options.wheelRadius * 0.65,
                this.options.wheelWidth * 0.9,
                8,
                1,
                true
            );
            rimGeometry.rotateZ(Math.PI / 2);
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            wheelMesh.add(rim);

            // Add heavy-duty spokes
            for (let i = 0; i < 6; i++) {
                const spokeGeometry = new THREE.BoxGeometry(
                    this.options.wheelWidth * 0.8,
                    this.options.wheelRadius * 0.2,
                    this.options.wheelRadius * 0.9
                );
                const spoke = new THREE.Mesh(spokeGeometry, rimMaterial);
                spoke.rotation.x = (i * Math.PI) / 3;
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
} 