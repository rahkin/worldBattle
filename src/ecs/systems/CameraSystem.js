import { System } from '../core/System.js';

export class CameraSystem extends System {
    constructor(cameraManager) {
        super();
        this.cameraManager = cameraManager;
    }

    init() {
        if (!this.cameraManager) {
            console.error('CameraSystem: No camera manager provided');
            return;
        }
        console.log('CameraSystem initialized');
    }

    getActiveCamera() {
        return this.cameraManager.getCamera();
    }

    setTarget(target) {
        this.cameraManager.setTarget(target);
    }

    setRearView(enabled) {
        this.cameraManager.setRearView(enabled);
    }

    toggleMode() {
        this.cameraManager.toggleMode();
    }

    update(deltaTime) {
        if (this.cameraManager) {
            this.cameraManager.update(deltaTime);
        }
    }

    cleanup() {
        if (this.cameraManager) {
            this.cameraManager.cleanup();
        }
    }
} 