import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { BaseCar } from './BaseCar.js';
import { VehicleGeometryFactory } from '../../utils/GeometryUtils.js';
import { ProjectileSystem } from '../ProjectileSystem.js';

export class Ironclad extends BaseCar {
    constructor(world, scene, game) {
        const options = {
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
            maxSteerAngle: 0.5  // Reduced for stability
        };
        super(world, scene, options);

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

        // Turret properties
        this.turret = {
            base: null,
            rotation: null,  // Will be created in _createTurret()
            barrel: null,
            targetRotation: 0,
            rotationSpeed: Math.PI, // Radians per second
            currentRotation: 0,
            elevation: 0,        // Current elevation angle
            maxElevation: Math.PI / 4,  // 45 degrees up
            minElevation: -Math.PI / 6  // -30 degrees down
        };

        // Create vehicle components in the correct order
        this._createDetailedChassis();
        this._addArmorPlating();
        this._enhanceWheels();
        this._createTurret();

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

    _createTurret() {
        // Clear any existing turret components
        if (this.turret.base) {
            this.chassisMesh.remove(this.turret.base);
            this.turret.base = null;
        }
        if (this.turret.rotation) {
            this.chassisMesh.remove(this.turret.rotation);
            this.turret.rotation = null;
        }

        const turretMaterial = new THREE.MeshPhongMaterial({
            color: this.options.color,
            metalness: 0.8,
            roughness: 0.3
        });

        const darkMetal = new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.2
        });

        // Create turret base
        const baseGeometry = new THREE.CylinderGeometry(0.6, 0.7, 0.3, 8);
        this.turret.base = new THREE.Mesh(baseGeometry, turretMaterial);
        this.turret.base.position.set(0, this.options.height * 1.2, 0);

        // Create turret rotation group
        this.turret.rotation = new THREE.Group();
        this.turret.rotation.position.copy(this.turret.base.position);

        // Create main turret body
        const turretGeometry = new THREE.BoxGeometry(1.2, 0.4, 1.4);
        const turretBody = new THREE.Mesh(turretGeometry, turretMaterial);
        turretBody.position.set(0, 0.2, 0);
        this.turret.rotation.add(turretBody);

        // Create gun barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.1, 0.12, 2.0, 8);
        barrelGeometry.rotateZ(Math.PI / 2);
        this.turret.barrel = new THREE.Mesh(barrelGeometry, darkMetal);
        this.turret.barrel.position.set(0, 0.2, -1.0);
        this.turret.rotation.add(this.turret.barrel);

        // Add muzzle brake
        const muzzleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
        muzzleGeometry.rotateZ(Math.PI / 2);
        const muzzle = new THREE.Mesh(muzzleGeometry, darkMetal);
        muzzle.position.set(0, 0.2, -2.0);
        this.turret.rotation.add(muzzle);

        // Add turret details
        this._addTurretDetails();

        // Add to chassis
        this.chassisMesh.add(this.turret.base);
        this.chassisMesh.add(this.turret.rotation);

        // Reset turret rotation
        this.turret.currentRotation = 0;
        this.turret.rotation.rotation.y = 0;
    }

    _addTurretDetails() {
        const detailMaterial = new THREE.MeshPhongMaterial({
            color: 0x2a2a2a,
            metalness: 0.7,
            roughness: 0.4
        });

        // Add side armor plates
        const sideArmorGeo = new THREE.BoxGeometry(0.1, 0.3, 1.2);
        [-0.6, 0.6].forEach(x => {
            const sideArmor = new THREE.Mesh(sideArmorGeo, detailMaterial);
            sideArmor.position.set(x, 0.2, 0);
            this.turret.rotation.add(sideArmor);
        });

        // Add viewport slits
        const slitGeo = new THREE.BoxGeometry(0.3, 0.05, 0.02);
        [-0.2, 0, 0.2].forEach(x => {
            const slit = new THREE.Mesh(slitGeo, detailMaterial);
            slit.position.set(x, 0.3, -0.7);
            this.turret.rotation.add(slit);
        });
    }

    update(deltaTime) {
        if (!this.vehicle) return;  // Skip if vehicle not ready
        
        super.update(deltaTime);
        
        // Update projectile system
        if (this.projectileSystem) {
            this.projectileSystem.update(deltaTime);
        }
        
        // Update turret rotation based on mouse position
        if (this.turret?.rotation && this.inputManager) {
            const mousePos = this.inputManager.getMousePosition();
            if (!mousePos) return;  // Skip if no mouse position
            
            // Convert mouse position to world space angle
            const worldPos = this.vehicle.chassisBody.position;
            const targetAngle = Math.atan2(
                mousePos.x - worldPos.x,
                mousePos.z - worldPos.z
            );
            
            // Calculate shortest rotation path
            let deltaRotation = targetAngle - this.turret.currentRotation;
            if (deltaRotation > Math.PI) deltaRotation -= Math.PI * 2;
            if (deltaRotation < -Math.PI) deltaRotation += Math.PI * 2;
            
            // Apply rotation with speed limit
            const maxRotation = this.turret.rotationSpeed * deltaTime;
            const rotation = Math.max(-maxRotation, Math.min(maxRotation, deltaRotation));
            
            this.turret.currentRotation += rotation;
            this.turret.rotation.rotation.y = this.turret.currentRotation;
        }
    }

    updateVisuals() {
        super.updateVisuals();
    }

    fireCannon() {
        if (!this.turret?.rotation || !this.projectileSystem) return;  // Skip if not ready
        
        const now = Date.now();
        if (now - this.weapon.lastShot < this.weapon.fireRate) return;
        
        // Get world position and orientation of the barrel tip
        const barrelTip = new THREE.Vector3(0, 0.2, -2.0);
        const worldMatrix = this.turret.rotation.matrixWorld.clone();
        barrelTip.applyMatrix4(worldMatrix);
        
        // Calculate firing direction based on turret's forward direction
        const direction = new THREE.Vector3(0, 0, -1);
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.extractRotation(worldMatrix);
        direction.applyMatrix4(rotationMatrix);
        
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

        // Debug output
        console.log('Fired projectile:', {
            position: barrelTip.toArray(),
            direction: direction.toArray(),
            time: now
        });
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
        flash.position.set(0, 0.2, -2.2); // Slightly in front of barrel
        this.turret.rotation.add(flash);

        // Animate the flash
        let scale = 1;
        const animate = () => {
            scale *= 0.8;
            flash.scale.set(scale, scale, scale);
            flash.material.opacity = scale;
            
            if (scale > 0.1) {
                requestAnimationFrame(animate);
            } else {
                this.turret.rotation.remove(flash);
            }
        };
        requestAnimationFrame(animate);
    }

    _createDetailedChassis() {
        if (this.chassisMesh) {
            this.scene.remove(this.chassisMesh);
        }

        this.chassisMesh = new THREE.Group();

        // Materials
        const armorMaterial = new THREE.MeshPhongMaterial({
            color: this.options.color,
            metalness: 0.9,
            roughness: 0.4,
            flatShading: true
        });

        const darkMetal = new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            metalness: 0.8,
            roughness: 0.5
        });

        // Main armored body
        const mainBodyGeo = VehicleGeometryFactory.createSmoothChassis(
            this.options.width * 2,
            this.options.height * 2,
            this.options.length * 2,
            0.15  // Sharp edges for armored look
        );
        const mainBody = new THREE.Mesh(mainBodyGeo, armorMaterial);
        this.chassisMesh.add(mainBody);

        // Add reinforced corners
        const cornerSize = { x: 0.2, y: 0.2, z: 0.2 };
        const cornerPositions = [
            { x: -this.options.width, y: 0, z: -this.options.length },
            { x: this.options.width, y: 0, z: -this.options.length },
            { x: -this.options.width, y: 0, z: this.options.length },
            { x: this.options.width, y: 0, z: this.options.length }
        ];

        cornerPositions.forEach(pos => {
            const corner = new THREE.Mesh(
                new THREE.BoxGeometry(cornerSize.x, cornerSize.y, cornerSize.z),
                darkMetal
            );
            corner.position.set(pos.x, pos.y, pos.z);
            this.chassisMesh.add(corner);
        });

        this.scene.add(this.chassisMesh);
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

    updateTurret() {
        return; // No-op
    }
} 