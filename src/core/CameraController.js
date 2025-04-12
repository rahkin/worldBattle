import * as THREE from 'three';

export class CameraController {
    constructor(camera, targetBody) {
        this.camera = camera;
        this.targetBody = targetBody;
        this.mode = 'third'; // 'first' or 'third'
        this.offsetThirdPerson = new THREE.Vector3(0, 3, -6);
        this.offsetFirstPerson = new THREE.Vector3(0, 1.2, 0.2);
        this.tempVec = new THREE.Vector3();
        this.tempQuat = new THREE.Quaternion();
    }

    toggleMode() {
        this.mode = this.mode === 'third' ? 'first' : 'third';
    }

    update(deltaTime) {
        const chassisPos = this.targetBody.position;
        const chassisQuat = this.targetBody.quaternion;

        const offset = this.mode === 'third'
            ? this.offsetThirdPerson
            : this.offsetFirstPerson;

        // Convert chassis quaternion to THREE.Quaternion
        this.tempQuat.set(
            chassisQuat.x,
            chassisQuat.y,
            chassisQuat.z,
            chassisQuat.w
        );

        // Apply offset relative to chassis orientation
        const worldOffset = offset.clone().applyQuaternion(this.tempQuat);

        // Target camera position
        const desiredPos = new THREE.Vector3(
            chassisPos.x + worldOffset.x,
            chassisPos.y + worldOffset.y,
            chassisPos.z + worldOffset.z
        );

        // Smooth position (skip lerp if in first-person for tighter sync)
        if (this.mode === 'third') {
            this.camera.position.lerp(desiredPos, 5 * deltaTime);
        } else {
            this.camera.position.copy(desiredPos);
        }

        // Look at car or forward depending on mode
        const lookTarget = this.mode === 'third'
            ? new THREE.Vector3(chassisPos.x, chassisPos.y + 1, chassisPos.z)
            : new THREE.Vector3().copy(chassisPos).add(
                new THREE.Vector3(0, 0.5, 2).applyQuaternion(this.tempQuat)
            );

        this.camera.lookAt(lookTarget);
    }
} 