import * as THREE from 'three';
import { CameraController } from './CameraController.js';

export class CameraManager {
    constructor() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            25000
        );
        this.controller = null;
        // Position camera behind and slightly above the vehicle
        this.offset = new THREE.Vector3(0, 3, 8);
    }

    init(scene) {
        this.scene = scene;
        
        // Set initial position to be behind the spawn point
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        });

        // Add key listener for camera mode toggle
        document.addEventListener('keydown', (event) => {
            if (event.code === 'KeyC') { // 'C' for camera toggle
                this.controller?.toggleMode();
            }
        });
    }

    setTarget(targetVehicle) {
        if (targetVehicle && targetVehicle.vehicle) {
            this.targetVehicle = targetVehicle;
            this.controller = new CameraController(this.camera, targetVehicle.vehicle.chassisBody);
            // Set the offset in the controller
            if (this.controller) {
                this.controller.offsetThirdPerson.copy(this.offset);
            }
        } else {
            console.warn('Invalid target vehicle provided to camera manager');
        }
    }

    setOffset(offset) {
        this.offset.copy(offset);
        if (this.controller) {
            this.controller.offsetThirdPerson.copy(offset);
        }
    }

    update(deltaTime) {
        if (this.controller) {
            this.controller.update(deltaTime);
        }
    }
} 