import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { BaseCar } from './BaseCar.js';

export class Scorpion extends BaseCar {
    constructor(world, scene) {
        const options = {
            width: 0.9,
            height: 0.4,
            length: 1.8,
            mass: 400,  // Light and agile vehicle
            color: 0xFF4500,  // Orange-red color
            wheelRadius: 0.35,
            wheelWidth: 0.3,
            wheelFriction: 4,
            suspensionRestLength: 0.25,
            wheelBaseZ: 1.8,
            wheelTrackX: 0.9,
            chassisOffsetY: 0.3,
            chassisOffsetZ: 0,
            debug: false
        };
        super(world, scene, options);

        // Add aerodynamic features
        this._addAerodynamicFeatures();
    }

    _addAerodynamicFeatures() {
        // Rear spoiler
        const spoilerGeo = new THREE.BoxGeometry(1.2, 0.1, 0.3);
        const spoilerMat = new THREE.MeshPhongMaterial({
            color: 0x333333,
            metalness: 0.9,
            roughness: 0.2
        });
        this.spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
        this.spoiler.position.set(0, 0.5, 1.2);
        this.chassisMesh.add(this.spoiler);

        // Side skirts
        const skirtGeo = new THREE.BoxGeometry(0.1, 0.2, 1.6);
        const skirtMat = new THREE.MeshPhongMaterial({
            color: 0x333333,
            metalness: 0.9,
            roughness: 0.2
        });
        
        this.leftSkirt = new THREE.Mesh(skirtGeo, skirtMat);
        this.leftSkirt.position.set(-0.8, 0.1, 0);
        this.chassisMesh.add(this.leftSkirt);

        this.rightSkirt = new THREE.Mesh(skirtGeo, skirtMat);
        this.rightSkirt.position.set(0.8, 0.1, 0);
        this.chassisMesh.add(this.rightSkirt);
    }

    updateVisuals() {
        super.updateVisuals();
        // Update aerodynamic features positions relative to chassis
        if (this.spoiler && this.leftSkirt && this.rightSkirt) {
            this.spoiler.position.set(0, 0.5, 1.2);
            this.leftSkirt.position.set(-0.8, 0.1, 0);
            this.rightSkirt.position.set(0.8, 0.1, 0);
        }
    }
} 