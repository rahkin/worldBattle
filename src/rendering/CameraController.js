import * as THREE from 'three';

export class CameraController {
    constructor(camera, targetBody) {
        this.camera = camera;
        this.targetBody = targetBody;
        this.mode = 'third';

        // Offsets
        this.offsetThirdPerson = new THREE.Vector3(0, 3, -6);
        this.offsetFirstPerson = new THREE.Vector3(0, 1.2, 0.2);
        this.tempVec = new THREE.Vector3();
        this.tempQuat = new THREE.Quaternion();

        // Spring camera state
        this.currentPosition = new THREE.Vector3();
        this.velocity = new THREE.Vector3();

        // FOV settings
        this.baseFov = camera.fov;
        this.boostFov = this.baseFov + 15;
        this.fovLerpSpeed = 5;

        // 🔄 Camera tilt
        this.currentTilt = 0;
        this.maxTilt = 0.1;

        // 💥 Screen shake
        this.shakeTime = 0;
        this.shakeStrength = 0.1;

        // 🔫 Kickback
        this.kickFov = 0;
    }

    toggleMode() {
        this.mode = this.mode === 'third' ? 'first' : 'third';
    }

    // 💥 Trigger screen shake externally
    triggerShake(duration = 0.3, strength = 0.1) {
        this.shakeTime = duration;
        this.shakeStrength = strength;
    }

    // 🔫 Trigger FOV kickback
    triggerKickback(amount = 10) {
        this.kickFov = amount;
    }

    update(deltaTime) {
        const chassisPos = this.targetBody.position;
        const chassisQuat = this.targetBody.quaternion;

        const offset = this.mode === 'third'
            ? this.offsetThirdPerson
            : this.offsetFirstPerson;

        this.tempQuat.set(chassisQuat.x, chassisQuat.y, chassisQuat.z, chassisQuat.w);
        const worldOffset = offset.clone().applyQuaternion(this.tempQuat);

        const desiredPos = new THREE.Vector3(
            chassisPos.x + worldOffset.x,
            chassisPos.y + worldOffset.y,
            chassisPos.z + worldOffset.z
        );

        if (this.mode === 'third') {
            // 🌀 Spring lag: smooth follow with dampening
            const stiffness = 120;
            const damping = 10;
            const displacement = desiredPos.clone().sub(this.currentPosition);
            const springForce = displacement.multiplyScalar(stiffness);
            const dampingForce = this.velocity.clone().multiplyScalar(-damping);

            const acceleration = springForce.add(dampingForce);
            this.velocity.add(acceleration.multiplyScalar(deltaTime));
            this.currentPosition.add(this.velocity.clone().multiplyScalar(deltaTime));

            this.camera.position.copy(this.currentPosition);

            // 🎥 Subtle tilt based on turn direction
            const angularVelY = this.targetBody.angularVelocity.y || 0;
            const targetTilt = THREE.MathUtils.clamp(angularVelY * 0.05, -this.maxTilt, this.maxTilt);
            this.currentTilt += (targetTilt - this.currentTilt) * 5 * deltaTime;

            // Apply tilt
            this.camera.rotation.z = this.currentTilt;
        } else {
            this.camera.position.copy(desiredPos);
            this.camera.rotation.z = 0;
        }

        // 🎯 Camera look at
        const lookTarget = this.mode === 'third'
            ? new THREE.Vector3(chassisPos.x, chassisPos.y + 1, chassisPos.z)
            : new THREE.Vector3().copy(chassisPos).add(
                new THREE.Vector3(0, 0.5, 2).applyQuaternion(this.tempQuat)
            );
        this.camera.lookAt(lookTarget);

        // 🚀 Dynamic FOV based on speed
        const speed = this.targetBody.velocity.length();
        const speedRatio = Math.min(speed / 30, 1);
        const baseTargetFov = this.mode === 'first'
            ? this.baseFov + speedRatio * (this.boostFov - this.baseFov)
            : this.baseFov;

        // 🔫 Add kickback
        if (this.kickFov > 0) {
            this.camera.fov += this.kickFov;
            this.kickFov = 0;
        }

        this.camera.fov += (baseTargetFov - this.camera.fov) * this.fovLerpSpeed * deltaTime;
        this.camera.updateProjectionMatrix();

        // 💥 Apply screen shake
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