import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { BaseCar } from './BaseCar.js';

export class Tank extends BaseCar {
    constructor(world, scene) {
        const options = {
            width: 1.5,
            height: 0.8,
            length: 3.0,
            mass: 2000,  // Increased mass to be heaviest vehicle
            color: 0x556B2F,  // Dark olive green
            wheelRadius: 0.7,
            wheelWidth: 0.6,
            wheelFriction: 10,
            suspensionRestLength: 0.6,
            wheelBaseZ: 2.8,
            wheelTrackX: 1.4,
            chassisOffsetY: 0.7,
            chassisOffsetZ: 0,
            debug: false
        };
        super(world, scene, options);

        // Add tank features
        this._addTankFeatures();
    }

    _addTankFeatures() {
        // Turret
        const turretGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 32);
        const turretMat = new THREE.MeshPhongMaterial({
            color: 0x556B2F,
            metalness: 0.7,
            roughness: 0.4
        });
        this.turret = new THREE.Mesh(turretGeo, turretMat);
        this.turret.position.set(0, 0.8, 0);
        this.chassisMesh.add(this.turret);

        // Gun barrel
        const barrelGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.0, 32);
        barrelGeo.rotateX(Math.PI / 2);
        const barrelMat = new THREE.MeshPhongMaterial({
            color: 0x696969,
            metalness: 0.9,
            roughness: 0.2
        });
        this.barrel = new THREE.Mesh(barrelGeo, barrelMat);
        this.barrel.position.set(0, 0.8, -1.2);
        this.chassisMesh.add(this.barrel);

        // Tracks
        const trackGeo = new THREE.BoxGeometry(0.2, 0.4, 3.0);
        const trackMat = new THREE.MeshPhongMaterial({
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.3
        });
        
        this.leftTrack = new THREE.Mesh(trackGeo, trackMat);
        this.leftTrack.position.set(-1.3, 0.2, 0);
        this.chassisMesh.add(this.leftTrack);

        this.rightTrack = new THREE.Mesh(trackGeo, trackMat);
        this.rightTrack.position.set(1.3, 0.2, 0);
        this.chassisMesh.add(this.rightTrack);
    }

    updateVisuals() {
        super.updateVisuals();
        // Update tank features positions relative to chassis
        if (this.turret && this.barrel && this.leftTrack && this.rightTrack) {
            this.turret.position.set(0, 0.8, 0);
            this.barrel.position.set(0, 0.8, -1.2);
            this.leftTrack.position.set(-1.3, 0.2, 0);
            this.rightTrack.position.set(1.3, 0.2, 0);
        }
    }
} 