import * as THREE from 'three';

export class CameraController {
    constructor(camera, targetBody) {
        this.camera = camera;
        this.targetBody = targetBody;
        this.mode = 'third';
        this.isRearView = false;

        // Camera offsets
        this.offsetThirdPerson = new THREE.Vector3(0, 3, 6);
        this.offsetThirdPersonRear = new THREE.Vector3(0, 3, -6);  // New rear offset for third person
        this.offsetFirstPerson = new THREE.Vector3(0, 1.2, 0.2);
        this.tempVec = new THREE.Vector3();
        this.tempQuat = new THREE.Quaternion();

        // FOV settings
        this.baseFov = camera.fov;
        this.boostFov = this.baseFov + 15;
        this.fovLerpSpeed = 5;

        // Screen shake
        this.shakeTime = 0;
        this.shakeStrength = 0.1;

        // Kickback
        this.kickFov = 0;

        // Rearview settings
        this.rearViewRotationSpeed = 15;
        this.currentHeadRotation = 0;
        this.targetHeadRotation = 0;
        this.cameraTransitionSpeed = 8;  // Speed for third person camera movement
    }

    toggleMode() {
        this.mode = this.mode === 'third' ? 'first' : 'third';
        this.isRearView = false;
        this.currentHeadRotation = 0;
        this.targetHeadRotation = 0;
    }

    setRearView(active) {
        this.isRearView = active;
        if (this.mode === 'first') {
            this.targetHeadRotation = active ? Math.PI : 0;
        }
    }

    triggerShake(duration = 0.3, strength = 0.1) {
        this.shakeTime = duration;
        this.shakeStrength = strength;
    }

    triggerKickback(amount = 10) {
        this.kickFov = amount;
    }

    update(deltaTime) {
        const chassisPos = this.targetBody.position;
        const chassisQuat = this.targetBody.quaternion;

        // Get the appropriate offset based on camera mode and rearview state
        let offset;
        if (this.mode === 'third') {
            offset = this.isRearView ? this.offsetThirdPersonRear : this.offsetThirdPerson;
        } else {
            offset = this.offsetFirstPerson;
        }

        // Convert chassis quaternion to THREE.Quaternion
        this.tempQuat.set(chassisQuat.x, chassisQuat.y, chassisQuat.z, chassisQuat.w);

        // Calculate camera position
        const worldOffset = offset.clone().applyQuaternion(this.tempQuat);
        const desiredPos = new THREE.Vector3(
            chassisPos.x + worldOffset.x,
            chassisPos.y + worldOffset.y,
            chassisPos.z + worldOffset.z
        );

        // Smooth camera position transition in third person
        if (this.mode === 'third') {
            this.camera.position.lerp(desiredPos, this.cameraTransitionSpeed * deltaTime);
        } else {
            this.camera.position.copy(desiredPos);
        }

        // Smoothly interpolate head rotation for first person rearview
        if (this.mode === 'first') {
            const rotationDiff = this.targetHeadRotation - this.currentHeadRotation;
            if (Math.abs(rotationDiff) > 0.001) {
                this.currentHeadRotation += rotationDiff * this.rearViewRotationSpeed * deltaTime;
            }
        }

        // Handle look target based on mode and rearview state
        if (this.mode === 'first') {
            // First person look target with head rotation
            const lookDirection = new THREE.Vector3(0, 0.5, -2);
            const headRotation = new THREE.Quaternion();
            headRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.currentHeadRotation);
            lookDirection.applyQuaternion(headRotation);
            lookDirection.applyQuaternion(this.tempQuat);
            
            const lookTarget = new THREE.Vector3(
                chassisPos.x + lookDirection.x,
                chassisPos.y + lookDirection.y,
                chassisPos.z + lookDirection.z
            );
            this.camera.lookAt(lookTarget);
        } else {
            // Third person look target
            const lookTarget = new THREE.Vector3(
                chassisPos.x,
                chassisPos.y + 1,
                chassisPos.z
            );
            this.camera.lookAt(lookTarget);
        }

        // Handle FOV changes
        const speed = this.targetBody.velocity.length();
        const speedRatio = Math.min(speed / 30, 1);
        const baseTargetFov = this.mode === 'first'
            ? this.baseFov + speedRatio * (this.boostFov - this.baseFov)
            : this.baseFov;

        if (this.kickFov > 0) {
            this.camera.fov += this.kickFov;
            this.kickFov = 0;
        }

        this.camera.fov += (baseTargetFov - this.camera.fov) * this.fovLerpSpeed * deltaTime;
        this.camera.updateProjectionMatrix();

        // Apply screen shake if active
        if (this.shakeTime > 0) {
            this.shakeTime -= deltaTime;
            const shakeOffset = new THREE.Vector3(
                (Math.random() - 0.5) * this.shakeStrength,
                (Math.random() - 0.5) * this.shakeStrength,
                (Math.random() - 0.5) * this.shakeStrength
            );
            this.camera.position.add(shakeOffset);
        }
    }
} 