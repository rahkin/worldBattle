import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { BaseCar } from './BaseCar.js';
import { VehicleGeometryFactory } from '../../utils/GeometryUtils.js';

export class TestVehicle extends BaseCar {
    constructor(world, scene) {
        const options = {
            width: 1.2,
            height: 0.5,
            length: 2.0,
            mass: 1000,     // Heavy for testing collisions
            color: 0x00ff00,  // Bright green for visibility
            wheelRadius: 0.3,
            wheelWidth: 0.2,
            wheelFriction: 2.0,
            suspensionRestLength: 0.3,
            wheelBaseZ: 1.5,
            wheelTrackX: 1.0,
            chassisOffset: { x: 0, y: 0.5, z: 0 },
            maxHealth: 200,  // Higher health for testing
            damageResistance: 0.5,  // Lower resistance to see damage effects
            debug: false
        };
        super(world, scene, options);
        
        // Add test-specific features
        this._addTestFeatures();
    }

    _createDetailedChassis() {
        if (this.chassisMesh) {
            this.scene.remove(this.chassisMesh);
        }

        this.chassisMesh = new THREE.Group();

        // Main body
        const mainBodyGeo = VehicleGeometryFactory.createSmoothChassis(
            this.options.width * 2,
            this.options.height * 2,
            this.options.length * 2,
            0.1
        );
        const mainBody = new THREE.Mesh(mainBodyGeo, new THREE.MeshPhongMaterial({
            color: this.options.color,
            metalness: 0.5,
            roughness: 0.5
        }));
        this.chassisMesh.add(mainBody);

        // Add test markers for collision points
        this._addTestMarkers();

        this.scene.add(this.chassisMesh);
    }

    _addTestMarkers() {
        // Add visible markers at common collision points
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const markerGeometry = new THREE.SphereGeometry(0.1, 8, 8);

        // Front, back, left, right markers
        const positions = [
            [0, 0, this.options.length],  // Front
            [0, 0, -this.options.length], // Back
            [-this.options.width, 0, 0],  // Left
            [this.options.width, 0, 0]    // Right
        ];

        positions.forEach(pos => {
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(...pos);
            this.chassisMesh.add(marker);
        });
    }

    _addTestFeatures() {
        // Add collision markers for testing
        this._addCollisionMarkers();
    }

    _addCollisionMarkers() {
        // Create markers for front, back, left, and right collision points
        const markerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        
        // Front marker
        const frontMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        frontMarker.position.set(0, 0, this.options.length / 2);
        this.chassisMesh.add(frontMarker);
        
        // Back marker
        const backMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        backMarker.position.set(0, 0, -this.options.length / 2);
        this.chassisMesh.add(backMarker);
        
        // Left marker
        const leftMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        leftMarker.position.set(-this.options.width / 2, 0, 0);
        this.chassisMesh.add(leftMarker);
        
        // Right marker
        const rightMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        rightMarker.position.set(this.options.width / 2, 0, 0);
        this.chassisMesh.add(rightMarker);
    }

    update(deltaTime) {
        super.update(deltaTime);
        // Add any test-specific update logic here
    }
} 