import * as THREE from 'three';
import { BaseCar } from './BaseCar.js';
import { VehicleGeometryFactory } from '../../utils/GeometryUtils.js';
import { CapsuleGeometry, CylinderGeometry } from 'three';

export class Scorpion extends BaseCar {
    constructor(world, scene) {
        const options = {
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
            maxSuspensionTravel: 0.4
        };
        super(world, scene, options);

        // Create detailed sports car body
        this._createDetailedChassis();
        
        // Add sports car specific features
        this._addSportsCarFeatures();
        this._enhanceWheels();  // New method for wheel enhancement
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

    updateVisuals() {
        super.updateVisuals();
        
        // Let BaseCar handle the wheel transforms
        // The wheel rotations will be handled by the physics engine
    }
} 