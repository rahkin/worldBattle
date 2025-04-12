import * as THREE from 'three';
import { CameraController } from './CameraController.js';

export class CameraManager {
    constructor() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.controller = null;
    }

    init(scene, targetVehicle) {
        this.scene = scene;
        this.targetVehicle = targetVehicle;
        
        // Set initial position
        this.camera.position.set(0, 5, -10);
        this.camera.lookAt(0, 0, 0);
        
        // Initialize camera controller
        this.controller = new CameraController(this.camera, targetVehicle.chassisBody);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        });

        // Add key listener for camera mode toggle
        document.addEventListener('keydown', (event) => {
            if (event.code === 'KeyC') { // 'C' for camera toggle
                this.controller.toggleMode();
            }
        });
    }

    update(deltaTime) {
        if (this.controller) {
            this.controller.update(deltaTime);
        }
    }
} 