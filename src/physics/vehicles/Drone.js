import * as THREE from 'three';
import { BaseCar } from './BaseCar.js';
import { VehicleGeometryFactory } from '../../utils/GeometryUtils.js';

export class Drone extends BaseCar {
    constructor(world, scene) {
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
            maxSuspensionTravel: 0.4
        };
        super(world, scene, options);

        this._createDetailedChassis();
        this._addDroneFeatures();
        this._enhanceWheels();
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

    updateVisuals() {
        super.updateVisuals();
        
        // Add hover effect animation
        if (this.energyCore) {
            this.energyCore.rotation.y += 0.02;
            this.energyCore.position.y = this.options.height * 0.5 + Math.sin(Date.now() * 0.003) * 0.02;
        }
    }
} 