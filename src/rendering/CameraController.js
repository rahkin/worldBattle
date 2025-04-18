import * as THREE from 'three';

export class CameraController {
    constructor(camera, targetBody) {
        this.camera = camera;
        this.targetBody = targetBody;
        this.mode = 'third';
        this.isRearView = false;

        // Camera offsets
        this.offsetThirdPerson = new THREE.Vector3(0, 3, 6);
        this.offsetThirdPersonRear = new THREE.Vector3(0, 3, -6);
        this.offsetFirstPerson = new THREE.Vector3(0, 1.2, 0.2);
        this.tempVec = new THREE.Vector3();
        this.tempQuat = new THREE.Quaternion();
        
        // Smoothing
        this.currentRotation = new THREE.Quaternion();
        this.targetRotation = new THREE.Quaternion();
        this.rotationSpeed = 5;
        
        // Spring-damper system
        this.springStrength = 25;
        this.damperStrength = 5;
        this.velocity = new THREE.Vector3();
        
        // Collision detection
        this.raycaster = new THREE.Raycaster();
        this.minDistance = 1;
        this.maxDistance = 6;
        this.collisionLayers = ['terrain', 'obstacles'];

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
        this.cameraTransitionSpeed = 8;

        // Debug
        this.debug = false;
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

    handleCollisions(desiredPos, targetPos) {
        const direction = new THREE.Vector3().subVectors(desiredPos, targetPos).normalize();
        const distance = targetPos.distanceTo(desiredPos);
        
        this.raycaster.set(targetPos, direction);
        const intersects = this.raycaster.intersectObjects(this.getCollidableObjects());
        
        if (intersects.length > 0) {
            const hit = intersects[0];
            const adjustedDistance = Math.max(this.minDistance, Math.min(hit.distance, distance));
            return targetPos.clone().add(direction.multiplyScalar(adjustedDistance));
        }
        
        return desiredPos;
    }
    
    getCollidableObjects() {
        // This should be implemented to return the actual collidable objects from your scene
        return []; // Placeholder - integrate with your scene management
    }
    
    applySpringDamper(currentPos, targetPos, deltaTime) {
        const displacement = new THREE.Vector3().subVectors(targetPos, currentPos);
        const force = displacement.multiplyScalar(this.springStrength);
        force.sub(this.velocity.multiplyScalar(this.damperStrength));
        
        this.velocity.add(force.multiplyScalar(deltaTime));
        return currentPos.clone().add(this.velocity.multiplyScalar(deltaTime));
    }

    update(deltaTime) {
        if (!this.targetBody) {
            console.warn('CameraController: No target body set');
            return;
        }

        // Get current target position and rotation
        const targetPos = new THREE.Vector3(
            this.targetBody.position.x,
            this.targetBody.position.y,
            this.targetBody.position.z
        );

        // Update target rotation
        this.targetRotation.set(
            this.targetBody.quaternion.x,
            this.targetBody.quaternion.y,
            this.targetBody.quaternion.z,
            this.targetBody.quaternion.w
        );

        // Smoothly interpolate current rotation towards target
        this.currentRotation.slerp(this.targetRotation, this.rotationSpeed * deltaTime);

        // Get the appropriate offset based on camera mode and rearview state
        let offset;
        if (this.mode === 'third') {
            offset = this.isRearView ? this.offsetThirdPersonRear : this.offsetThirdPerson;
        } else {
            offset = this.offsetFirstPerson;
        }

        // Calculate desired camera position
        const worldOffset = offset.clone().applyQuaternion(this.currentRotation);
        let desiredPos = targetPos.clone().add(worldOffset);

        // Apply collision detection in third person mode
        if (this.mode === 'third') {
            desiredPos = this.handleCollisions(desiredPos, targetPos);
            // Apply spring-damper system for smooth following
            this.camera.position.copy(this.applySpringDamper(this.camera.position, desiredPos, deltaTime));
        } else {
            this.camera.position.copy(desiredPos);
        }

        // Calculate look target
        let lookTarget;
        if (this.mode === 'first') {
            // Handle first person head rotation
            const rotationDiff = this.targetHeadRotation - this.currentHeadRotation;
            if (Math.abs(rotationDiff) > 0.001) {
                this.currentHeadRotation += rotationDiff * this.rearViewRotationSpeed * deltaTime;
            }
            
            const lookDirection = new THREE.Vector3(0, 0.5, -2);
            const headRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.currentHeadRotation);
            lookDirection.applyQuaternion(headRotation).applyQuaternion(this.currentRotation);
            lookTarget = targetPos.clone().add(lookDirection);
        } else {
            // Third person look target
            lookTarget = targetPos.clone().add(new THREE.Vector3(0, 1, 0));
        }

        // Update camera lookAt
        this.camera.lookAt(lookTarget);

        // Handle FOV changes
        const speed = this.targetBody.velocity ? this.targetBody.velocity.length() : 0;
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

        // Debug output
        if (this.debug) {
            console.log('Camera State:', {
                position: this.camera.position.toArray(),
                target: lookTarget.toArray(),
                rotation: this.currentRotation.toArray(),
                fov: this.camera.fov,
                speed: speed
            });
        }
    }
} 