import * as THREE from 'three';
import { BaseCar } from './BaseCar.js';
import { VehicleGeometryFactory } from '../../utils/GeometryUtils.js';

export class Tank extends BaseCar {
    constructor(world, scene) {
        const options = {
            width: 1.3,
            height: 0.6,
            length: 2.6,
            mass: 1200,     // Lighter for a light tank
            color: 0x4F5246,  // Military olive drab
            wheelRadius: 0.4,
            wheelWidth: 0.5,  // Wide tracks
            wheelFriction: 14,
            suspensionRestLength: 0.4,
            wheelBaseZ: 2.2,
            wheelTrackX: 1.4,
            chassisOffsetY: 0.5,
            suspensionStiffness: 55,
            dampingRelaxation: 3.0,
            dampingCompression: 4.0,
            maxSuspensionForce: 180000,
            maxSuspensionTravel: 0.5,
            engineForce: 8500,  // Increased power for better mobility
            brakeForce: 160,
            maxSteerAngle: 0.7  // Better turning for light tank
        };
        super(world, scene, options);

        // Adjust physics body properties
        this.vehicle.chassisBody.angularDamping = 0.2;  // Better rotation
        this.vehicle.chassisBody.linearDamping = 0.03;   // Less resistance

        // Adjust wheel properties for better traction and agility
        this.vehicle.wheelInfos.forEach(wheel => {
            wheel.frictionSlip = 5.0;
            wheel.rollInfluence = 0.01;
            wheel.suspensionStiffness = 55;
            wheel.customSlidingRotationalSpeed = -60;
            wheel.useCustomSlidingRotationalSpeed = true;
        });

        this._createDetailedChassis();
        this._addTankFeatures();
        this._enhanceWheels();
    }

    _createDetailedChassis() {
        if (this.chassisMesh) {
            this.scene.remove(this.chassisMesh);
        }

        this.chassisMesh = new THREE.Group();

        // Materials
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

        // Main hull - sleeker design
        const hullGeo = VehicleGeometryFactory.createSmoothChassis(
            this.options.width * 2,
            this.options.height * 2,
            this.options.length * 2,
            0.1  // Sharper edges
        );
        const hull = new THREE.Mesh(hullGeo, tankMaterial);
        hull.position.y = -0.1;  // Slightly lower
        this.chassisMesh.add(hull);

        // Sloped front armor
        const frontArmorGeo = new THREE.BoxGeometry(this.options.width * 1.8, this.options.height * 0.8, 0.3);
        const frontArmor = new THREE.Mesh(frontArmorGeo, darkMetal);
        frontArmor.position.set(0, this.options.height * 0.2, -this.options.length * 0.8);
        frontArmor.rotation.x = Math.PI * 0.15;  // Angled for deflection
        this.chassisMesh.add(frontArmor);

        this.scene.add(this.chassisMesh);
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

        // Larger, more prominent turret
        const turretGeo = new THREE.BoxGeometry(1.0, 0.4, 1.4);
        this.turret = new THREE.Mesh(turretGeo, tankMaterial);
        this.turret.position.set(0, this.options.height * 1.2, 0);  // Raised higher
        
        // Enhanced turret details
        const turretFrontGeo = new THREE.BoxGeometry(0.9, 0.35, 0.4);
        const turretFront = new THREE.Mesh(turretFrontGeo, darkMetal);
        turretFront.position.z = -0.7;
        turretFront.rotation.x = Math.PI * 0.1;
        this.turret.add(turretFront);

        // Add turret sides for better shape
        const turretSideGeo = new THREE.BoxGeometry(0.2, 0.3, 1.2);
        const leftTurretSide = new THREE.Mesh(turretSideGeo, darkMetal);
        leftTurretSide.position.set(-0.5, -0.05, 0);
        this.turret.add(leftTurretSide);

        const rightTurretSide = new THREE.Mesh(turretSideGeo.clone(), darkMetal);
        rightTurretSide.position.set(0.5, -0.05, 0);
        this.turret.add(rightTurretSide);

        // Longer, more prominent gun barrel
        const barrelGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 12);
        barrelGeo.rotateX(Math.PI / 2);  // Rotate to point forward
        this.barrel = new THREE.Mesh(barrelGeo, darkMetal);
        this.barrel.position.set(0, 0.1, -1.8);  // Positioned further forward
        this.turret.add(this.barrel);

        // Enhanced muzzle brake
        const muzzleGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 12);
        muzzleGeo.rotateX(Math.PI / 2);
        const muzzle = new THREE.Mesh(muzzleGeo, darkMetal);
        muzzle.position.set(0, 0.1, -2.8);
        this.turret.add(muzzle);

        // Add muzzle brake slots
        for (let i = 0; i < 3; i++) {
            const slotGeo = new THREE.BoxGeometry(0.2, 0.06, 0.1);
            const slot = new THREE.Mesh(slotGeo, darkMetal);
            slot.position.set(0, 0.1, -2.8);
            slot.rotation.y = (i * Math.PI * 2) / 3;
            this.turret.add(slot);
        }

        this.chassisMesh.add(this.turret);

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

    updateVisuals() {
        super.updateVisuals();
        
        // Add slight oscillation to the tank when moving
        if (this.vehicle.chassisBody.velocity.length() > 0.1) {
            this.chassisMesh.position.y += Math.sin(Date.now() * 0.01) * 0.002;
        }
    }
} 