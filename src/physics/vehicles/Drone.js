import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { BaseCar } from './BaseCar.js';

export class Drone extends BaseCar {
    constructor(world, scene) {
        const options = {
            width: 0.8,
            height: 0.3,
            length: 1.6,
            mass: 300,  // Very light but not unrealistic
            color: 0x00BFFF,  // Deep sky blue
            wheelRadius: 0.3,
            wheelWidth: 0.25,
            wheelFriction: 3,
            suspensionRestLength: 0.2,
            wheelBaseZ: 1.5,
            wheelTrackX: 0.8,
            chassisOffsetY: 0.25,
            chassisOffsetZ: 0,
            debug: false
        };
        super(world, scene, options);

        // Add drone features
        this._addDroneFeatures();
    }

    _addDroneFeatures() {
        // Hover engine
        const engineGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 32);
        const engineMat = new THREE.MeshPhongMaterial({
            color: 0x00BFFF,
            emissive: 0x00BFFF,
            emissiveIntensity: 0.5,
            metalness: 0.9,
            roughness: 0.1
        });
        
        // Front engines
        this.frontLeftEngine = new THREE.Mesh(engineGeo, engineMat);
        this.frontLeftEngine.position.set(-0.6, 0.2, -0.8);
        this.chassisMesh.add(this.frontLeftEngine);

        this.frontRightEngine = new THREE.Mesh(engineGeo, engineMat);
        this.frontRightEngine.position.set(0.6, 0.2, -0.8);
        this.chassisMesh.add(this.frontRightEngine);

        // Rear engines
        this.rearLeftEngine = new THREE.Mesh(engineGeo, engineMat);
        this.rearLeftEngine.position.set(-0.6, 0.2, 0.8);
        this.chassisMesh.add(this.rearLeftEngine);

        this.rearRightEngine = new THREE.Mesh(engineGeo, engineMat);
        this.rearRightEngine.position.set(0.6, 0.2, 0.8);
        this.chassisMesh.add(this.rearRightEngine);

        // Energy core
        const coreGeo = new THREE.SphereGeometry(0.15, 32, 32);
        const coreMat = new THREE.MeshPhongMaterial({
            color: 0x00BFFF,
            emissive: 0x00BFFF,
            emissiveIntensity: 1.0,
            metalness: 0.9,
            roughness: 0.1
        });
        this.energyCore = new THREE.Mesh(coreGeo, coreMat);
        this.energyCore.position.set(0, 0.2, 0);
        this.chassisMesh.add(this.energyCore);
    }

    updateVisuals() {
        super.updateVisuals();
        // Update drone features positions relative to chassis
        if (this.frontLeftEngine && this.frontRightEngine && 
            this.rearLeftEngine && this.rearRightEngine && 
            this.energyCore) {
            this.frontLeftEngine.position.set(-0.6, 0.2, -0.8);
            this.frontRightEngine.position.set(0.6, 0.2, -0.8);
            this.rearLeftEngine.position.set(-0.6, 0.2, 0.8);
            this.rearRightEngine.position.set(0.6, 0.2, 0.8);
            this.energyCore.position.set(0, 0.2, 0);
        }
    }
} 