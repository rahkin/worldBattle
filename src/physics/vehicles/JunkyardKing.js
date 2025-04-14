import * as THREE from 'three';
import { BaseCar } from './BaseCar.js';
import { VehicleGeometryFactory } from '../../utils/GeometryUtils.js';
import { ProjectileSystem } from '../ProjectileSystem.js';

export class JunkyardKing extends BaseCar {
    constructor(world, scene, game) {
        const options = {
            width: 1.3,
            height: 0.7,
            length: 2.6,
            mass: 1200,     // Heavy due to all the scrap metal
            color: 0x8B4513,  // Rusty brown base color
            wheelRadius: 0.45,
            wheelWidth: 0.4,
            wheelFriction: 15,    // Increased friction for better grip
            suspensionRestLength: 0.5,
            wheelBaseZ: 2.4,
            wheelTrackX: 1.4,  // Wide stance for stability
            chassisOffsetY: 0.5,
            suspensionStiffness: 55,  // Stiffer suspension for better control
            dampingRelaxation: 3.5,   // Increased damping for stability
            dampingCompression: 4.8,   // Increased compression damping
            maxSuspensionForce: 200000,  // Increased force to handle the weight
            maxSuspensionTravel: 0.4,
            engineForce: 6000,  // Massively increased engine power
            brakeForce: 150,    // Stronger brakes to match power
            maxSteerAngle: 0.6  // Slightly increased for better turning
        };
        super(world, scene, options);

        this.game = game;  // Store game reference

        // Initialize weapon system
        this.weapon = {
            projectileSpeed: 150,     // Increased by 25% for more range (120 * 1.25)
            projectileDamage: 75,     // Less damage than tank shells
            fireRate: 800,           // Faster fire rate than tank
            spread: 0.03,            // Reduced spread for denser pattern
            lastShot: 0,
            projectileCount: 5,      // Number of projectiles per shot
            projectileLifetime: 25000 // Increased lifetime to match new range
        };

        // Initialize projectile system with camera from game
        this.projectileSystem = new ProjectileSystem(world, scene, game.cameraManager.camera);

        // Adjust physics body properties
        this.vehicle.chassisBody.angularDamping = 0.25;   // Reduced for better rotation
        this.vehicle.chassisBody.linearDamping = 0.05;    // Reduced air resistance further

        // Adjust wheel properties for better traction
        this.vehicle.wheelInfos.forEach(wheel => {
            wheel.frictionSlip = 4.0;        // Much more tire grip
            wheel.rollInfluence = 0.01;      // Reduced body roll in corners
            wheel.suspensionStiffness = 55;  // Match the chassis stiffness
            wheel.customSlidingRotationalSpeed = -50;  // Better wheel response
            wheel.useCustomSlidingRotationalSpeed = true;
        });

        this._createDetailedChassis();
        this._addJunkyardFeatures();
        this._createScrapLauncher();
        this._enhanceWheels();
    }

    _createDetailedChassis() {
        if (this.chassisMesh) {
            this.scene.remove(this.chassisMesh);
        }

        this.chassisMesh = new THREE.Group();

        // Materials
        const rustyMaterial = new THREE.MeshPhongMaterial({
            color: this.options.color,
            metalness: 0.6,
            roughness: 0.8,
            flatShading: true
        });

        const metalMaterial = new THREE.MeshPhongMaterial({
            color: 0x505050,
            metalness: 0.7,
            roughness: 0.6,
            flatShading: true
        });

        // Main body - rough and angular
        const mainBodyGeo = VehicleGeometryFactory.createSmoothChassis(
            this.options.width * 2,
            this.options.height * 2,
            this.options.length * 2,
            0.2
        );
        const mainBody = new THREE.Mesh(mainBodyGeo, rustyMaterial);
        this.chassisMesh.add(mainBody);

        // Add random dents and plates
        for (let i = 0; i < 6; i++) {
            const plateGeo = new THREE.BoxGeometry(
                0.3 + Math.random() * 0.3,
                0.2 + Math.random() * 0.2,
                0.05
            );
            const plate = new THREE.Mesh(plateGeo, metalMaterial);
            plate.position.set(
                (Math.random() - 0.5) * this.options.width,
                (Math.random() - 0.5) * this.options.height,
                (Math.random() - 0.5) * this.options.length * 1.8
            );
            plate.rotation.set(
                Math.random() * 0.3,
                Math.random() * Math.PI * 2,
                Math.random() * 0.3
            );
            this.chassisMesh.add(plate);
        }

        this.scene.add(this.chassisMesh);
    }

    _addJunkyardFeatures() {
        // Materials
        const rustyMaterial = new THREE.MeshPhongMaterial({
            color: 0x8B4513,
            metalness: 0.6,
            roughness: 0.8,
            flatShading: true
        });

        const darkMetalMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            metalness: 0.7,
            roughness: 0.6,
            flatShading: true
        });

        // Roof rack with random junk
        const rackGeo = new THREE.BoxGeometry(1.4, 0.1, 1.8);
        this.roofRack = new THREE.Mesh(rackGeo, darkMetalMaterial);
        this.roofRack.position.set(0, this.options.height * 1.1, 0);
        this.chassisMesh.add(this.roofRack);

        // Add random items to the roof rack
        const junkItems = [
            { geo: new THREE.BoxGeometry(0.3, 0.2, 0.4), pos: [-0.4, 0.15, -0.5] },
            { geo: new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8), pos: [0.3, 0.2, 0.4] },
            { geo: new THREE.BoxGeometry(0.4, 0.15, 0.3), pos: [-0.2, 0.1, 0.3] }
        ];

        junkItems.forEach(item => {
            const junk = new THREE.Mesh(item.geo, rustyMaterial);
            junk.position.set(...item.pos);
            junk.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
            this.roofRack.add(junk);
        });

        // Improvised armor plates
        const armorPositions = [
            { size: [1.5, 0.4, 0.1], pos: [0, -0.2, -1.2], rot: [0.2, 0, 0] },  // Front
            { size: [0.1, 0.5, 2.0], pos: [-1.2, 0, 0], rot: [0, 0, -0.1] },    // Left
            { size: [0.1, 0.5, 2.0], pos: [1.2, 0, 0], rot: [0, 0, 0.1] }       // Right
        ];

        armorPositions.forEach(armor => {
            const armorGeo = new THREE.BoxGeometry(...armor.size);
            const armorPlate = new THREE.Mesh(armorGeo, darkMetalMaterial);
            armorPlate.position.set(...armor.pos);
            armorPlate.rotation.set(...armor.rot);
            this.chassisMesh.add(armorPlate);
        });

        // Exhaust stacks
        const stackGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.8, 8);
        const leftStack = new THREE.Mesh(stackGeo, darkMetalMaterial);
        leftStack.position.set(-0.4, this.options.height * 0.8, this.options.length * 0.7);
        leftStack.rotation.x = -Math.PI * 0.1;
        this.chassisMesh.add(leftStack);

        const rightStack = new THREE.Mesh(stackGeo.clone(), darkMetalMaterial);
        rightStack.position.set(0.4, this.options.height * 0.8, this.options.length * 0.7);
        rightStack.rotation.x = -Math.PI * 0.1;
        this.chassisMesh.add(rightStack);

        // Add some chains hanging from the sides
        this._addChains();
    }

    _addChains() {
        const chainMaterial = new THREE.MeshPhongMaterial({
            color: 0x505050,
            metalness: 0.7,
            roughness: 0.6
        });

        const createChainLink = () => {
            const linkGeo = new THREE.TorusGeometry(0.04, 0.01, 8, 8);
            return new THREE.Mesh(linkGeo, chainMaterial);
        };

        // Create two chains on each side
        const chainPositions = [
            { x: -1.2, z: -0.6 },
            { x: -1.2, z: 0.6 },
            { x: 1.2, z: -0.6 },
            { x: 1.2, z: 0.6 }
        ];

        chainPositions.forEach(pos => {
            const chainGroup = new THREE.Group();
            const linkCount = 5 + Math.floor(Math.random() * 3);
            
            for (let i = 0; i < linkCount; i++) {
                const link = createChainLink();
                link.position.y = -i * 0.06;
                link.rotation.set(
                    Math.random() * 0.2,
                    Math.random() * 0.2,
                    Math.random() * 0.2
                );
                chainGroup.add(link);
            }
            
            chainGroup.position.set(pos.x, this.options.height * 0.3, pos.z);
            this.chassisMesh.add(chainGroup);
        });
    }

    _createScrapLauncher() {
        // Create a group for the scrap launcher
        this.launcher = {
            base: new THREE.Group(),
            barrel: null
        };

        const metalMaterial = new THREE.MeshPhongMaterial({
            color: 0x505050,
            metalness: 0.7,
            roughness: 0.6,
            flatShading: true
        });

        // Create launcher base (rotating platform)
        const baseGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.3, 8);
        this.launcher.base = new THREE.Mesh(baseGeometry, metalMaterial);
        this.launcher.base.position.set(0, this.options.height * 1.8, 0);
        this.chassisMesh.add(this.launcher.base);

        // Create the main launcher body
        const launcherGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.2);
        const launcherBody = new THREE.Mesh(launcherGeometry, metalMaterial);
        launcherBody.position.set(0, 0.2, 0);
        this.launcher.base.add(launcherBody);

        // Create the barrel (a wide tube for launching scrap)
        const barrelGeometry = new THREE.CylinderGeometry(0.25, 0.3, 2.0, 8);
        this.launcher.barrel = new THREE.Mesh(barrelGeometry, metalMaterial);
        this.launcher.barrel.rotation.x = Math.PI / 2;
        this.launcher.barrel.position.set(0, 0.3, -1.0);
        this.launcher.base.add(this.launcher.barrel);

        // Add some scrap details around the launcher
        const scrapDetails = [
            { size: [0.3, 0.1, 0.4], pos: [0.3, 0.4, 0], rot: [0, 0.2, 0] },
            { size: [0.4, 0.15, 0.2], pos: [-0.3, 0.3, 0.2], rot: [0.1, -0.3, 0] },
            { size: [0.2, 0.2, 0.3], pos: [0, 0.5, 0.4], rot: [0.2, 0, 0.1] }
        ];

        scrapDetails.forEach(detail => {
            const scrapGeo = new THREE.BoxGeometry(...detail.size);
            const scrap = new THREE.Mesh(scrapGeo, metalMaterial);
            scrap.position.set(...detail.pos);
            scrap.rotation.set(...detail.rot);
            this.launcher.base.add(scrap);
        });

        // Force initial matrix updates
        this.chassisMesh.updateMatrixWorld(true);
        this.launcher.base.updateMatrixWorld(true);
        this.launcher.barrel.updateMatrixWorld(true);
    }

    fireScrapLauncher() {
        if (!this.projectileSystem || !this.launcher?.barrel) {
            console.log("Cannot fire: missing projectile system or launcher");
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

        // Get the barrel's world position
        const barrelTip = new THREE.Vector3();
        this.launcher.barrel.getWorldPosition(barrelTip);
        
        // Calculate forward direction in launcher's local space
        const forward = new THREE.Vector3(0, 0, -1);
        
        // Transform direction to world space using chassis orientation
        const baseDirection = forward.clone();
        baseDirection.applyQuaternion(this.chassisMesh.quaternion);
        
        // Fire multiple projectiles in a dense spread pattern
        for (let i = 0; i < this.weapon.projectileCount; i++) {
            // Calculate spread for this projectile using a more controlled pattern
            const direction = baseDirection.clone();
            
            // Create a more controlled spread pattern
            const angle = (i / this.weapon.projectileCount) * Math.PI * 2;
            const radius = this.weapon.spread;
            
            // Add spread in a circular pattern
            direction.x += Math.cos(angle) * radius;
            direction.y += Math.sin(angle) * radius;
            direction.z += (Math.random() - 0.5) * this.weapon.spread * 0.2; // Minimal vertical spread
            direction.normalize();

            // Calculate projectile position with minimal offset
            const projectilePos = barrelTip.clone();
            projectilePos.add(direction.multiplyScalar(2.0));
            projectilePos.x += (Math.random() - 0.5) * 0.1; // Reduced random offset
            projectilePos.y += (Math.random() - 0.5) * 0.1; // Reduced random offset

            console.log(`Firing projectile ${i + 1}:`, {
                velocity: this.weapon.projectileSpeed + " m/s",
                position: projectilePos.toArray(),
                direction: direction.toArray()
            });

            // Create projectile with increased lifetime
            this.projectileSystem.createProjectile(
                projectilePos,
                direction,
                this.weapon.projectileSpeed,
                this.weapon.projectileDamage
            );
        }

        this.weapon.lastShot = now;
        this.createMuzzleFlash();
    }

    createMuzzleFlash() {
        // Get the barrel's world position
        const barrelTip = new THREE.Vector3();
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.chassisMesh.quaternion);
        this.launcher.barrel.getWorldPosition(barrelTip);
        barrelTip.add(direction.multiplyScalar(2.0));

        // Create a point light for the muzzle flash
        const light = new THREE.PointLight(0xff6600, 2, 3);
        light.position.copy(barrelTip);
        this.chassisMesh.add(light);

        // Create a simple flash effect
        const flashGeometry = new THREE.CircleGeometry(0.4, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(barrelTip);
        flash.lookAt(barrelTip.clone().add(direction));
        this.chassisMesh.add(flash);

        // Animate the muzzle flash
        const animate = () => {
            light.intensity *= 0.8;
            flashMaterial.opacity *= 0.8;

            if (light.intensity > 0.1) {
                requestAnimationFrame(animate);
            } else {
                this.chassisMesh.remove(light);
                this.chassisMesh.remove(flash);
            }
        };
        animate();
    }

    _enhanceWheels() {
        const rimMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            metalness: 0.7,
            roughness: 0.6,
            flatShading: true
        });

        const tireMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            metalness: 0.4,
            roughness: 0.9,
            flatShading: true
        });

        this.wheelMeshes.forEach((wheelMesh, index) => {
            wheelMesh.clear();

            // Create chunky tire with aggressive tread
            const tireGeometry = new THREE.CylinderGeometry(
                this.options.wheelRadius,
                this.options.wheelRadius,
                this.options.wheelWidth,
                24
            );
            tireGeometry.rotateZ(Math.PI / 2);
            const tire = new THREE.Mesh(tireGeometry, tireMaterial);
            wheelMesh.add(tire);

            // Create industrial-looking rim
            const rimGeometry = new THREE.CylinderGeometry(
                this.options.wheelRadius * 0.6,
                this.options.wheelRadius * 0.6,
                this.options.wheelWidth * 0.9,
                8,
                1,
                true
            );
            rimGeometry.rotateZ(Math.PI / 2);
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            wheelMesh.add(rim);

            // Add rugged spokes
            for (let i = 0; i < 8; i++) {
                const spokeGeometry = new THREE.BoxGeometry(
                    this.options.wheelWidth * 0.8,
                    this.options.wheelRadius * 0.15,
                    this.options.wheelRadius * 0.8
                );
                const spoke = new THREE.Mesh(spokeGeometry, rimMaterial);
                spoke.rotation.x = (i * Math.PI) / 4;
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
        if (!this.vehicle) return;  // Skip if vehicle not ready
        
        super.update(deltaTime);
        
        // Update projectile system
        if (this.projectileSystem) {
            this.projectileSystem.update(deltaTime);
        }

        // Handle firing input with mouse
        if (this.inputManager && this.inputManager.isMouseButtonPressed(0)) { // Left mouse button
            this.fireScrapLauncher();
        }
    }

    _setupControls() {
        // Add firing control to input manager
        if (this.inputManager) {
            this.inputManager.addMouseButtonListener(0, () => { // Left mouse button
                this.fireScrapLauncher();
            });
        }
    }

    updateVisuals() {
        super.updateVisuals();
    }
} 