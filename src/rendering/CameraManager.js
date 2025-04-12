import * as THREE from 'three';

export class CameraManager {
    constructor() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        this.cameraOffset = new THREE.Vector3(0, 5, -10);
        this.lookAtOffset = new THREE.Vector3(0, 0, 4);
        this.currentPos = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        this.smoothFactor = 0.1;
    }

    init(scene, targetVehicle) {
        this.scene = scene;
        this.targetVehicle = targetVehicle;
        
        // Set initial position
        this.camera.position.set(0, 5, -10);
        this.camera.lookAt(0, 0, 0);
        
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        });
    }

    update(deltaTime) {
        if (!this.targetVehicle) return;

        const vehiclePos = this.targetVehicle.chassisBody.position;
        const vehicleQuat = this.targetVehicle.chassisBody.quaternion;

        // Create Three.js quaternion from CANNON quaternion
        const quaternion = new THREE.Quaternion(
            vehicleQuat.x,
            vehicleQuat.y,
            vehicleQuat.z,
            vehicleQuat.w
        );

        // Calculate desired camera position
        const offset = this.cameraOffset.clone();
        offset.applyQuaternion(quaternion);
        const targetPos = new THREE.Vector3(
            vehiclePos.x + offset.x,
            vehiclePos.y + offset.y,
            vehiclePos.z + offset.z
        );

        // Smooth camera position
        this.currentPos.lerp(targetPos, this.smoothFactor);
        this.camera.position.copy(this.currentPos);

        // Calculate look at point
        const lookAtOffset = this.lookAtOffset.clone();
        lookAtOffset.applyQuaternion(quaternion);
        const targetLookAt = new THREE.Vector3(
            vehiclePos.x + lookAtOffset.x,
            vehiclePos.y + lookAtOffset.y,
            vehiclePos.z + lookAtOffset.z
        );

        // Smooth look at
        this.currentLookAt.lerp(targetLookAt, this.smoothFactor);
        this.camera.lookAt(this.currentLookAt);
    }
} 