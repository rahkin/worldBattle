import * as THREE from 'three';
import { BaseCar } from './BaseCar.js';
import { VehicleGeometryFactory } from '../../utils/GeometryUtils.js';
import { CapsuleGeometry } from 'three';
import { CylinderGeometry } from 'three';

export class MuscleCar extends BaseCar {
    constructor(world, scene) {
        const options = {
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
            maxSuspensionTravel: 0.3
        };
        super(world, scene, options);

        // Override chassis mesh with detailed muscle car body
        this._createDetailedChassis();
        
        // Add muscle car specific features
        this._addMuscleCarFeatures();
        
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

    updateVisuals() {
        super.updateVisuals();
        // The chassis group will automatically update all child meshes
    }
} 