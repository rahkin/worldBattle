import * as THREE from 'three';

export class CameraManager {
    constructor() {
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near plane
            1000 // Far plane
        );
        this.target = null;
        
        // Camera modes and offsets
        this.mode = 'third'; // 'first' or 'third'
        this.isRearView = false;
        this.offsetThirdPerson = new THREE.Vector3(0, 3, 6);
        this.offsetThirdPersonRear = new THREE.Vector3(0, 3, -6);
        this.offsetFirstPerson = new THREE.Vector3(0, 1.2, 0.2);
        
        // Smoothing parameters
        this.positionLerpFactor = 0.1;
        this.rotationLerpFactor = 0.05;
        this.currentRotation = new THREE.Quaternion();
        this.targetRotation = new THREE.Quaternion();
        
        // FOV settings
        this.baseFov = this.camera.fov;
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
        
        // Debug
        this.debug = true;
        console.log('CameraManager initialized');
    }

    init(scene) {
        console.log('CameraManager init started');
        this.scene = scene;
        this.setupCamera();
        this.setupResizeHandler();
        console.log('CameraManager init complete');
    }

    setupCamera() {
        console.log('Setting up camera');
        // Set initial camera position and orientation
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);
        console.log('Camera position set to:', this.camera.position);
    }

    setupResizeHandler() {
        const handleResize = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        };

        window.addEventListener('resize', handleResize);
        this.cleanupResizeHandler = () => {
            window.removeEventListener('resize', handleResize);
        };
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

    setTarget(target) {
        this.target = target;
        
        // Initialize rotations
        if (target.quaternion) {
            this.currentRotation.copy(target.quaternion);
            this.targetRotation.copy(target.quaternion);
        }
    }

    update(deltaTime) {
        if (!this.camera) {
            console.warn('Camera not initialized during update');
            return;
        }

        if (!this.target) {
            // If no target, maintain default position
            return;
        }

        // Get target position and rotation
        const targetPosition = new THREE.Vector3();
        if (this.target.getWorldPosition) {
            this.target.getWorldPosition(targetPosition);
        } else if (this.target.position) {
            targetPosition.copy(this.target.position);
        } else {
            console.warn('Target has no position information');
            return;
        }

        // Update target rotation if available
        if (this.target.quaternion) {
            this.targetRotation.copy(this.target.quaternion);
        }

        // Smoothly interpolate rotation
        this.currentRotation.slerp(this.targetRotation, this.rotationLerpFactor);

        // Get the appropriate offset based on camera mode and rearview state
        let offset;
        if (this.mode === 'third') {
            offset = this.isRearView ? this.offsetThirdPersonRear : this.offsetThirdPerson;
        } else {
            offset = this.offsetFirstPerson;
        }

        // Calculate desired camera position based on current rotation
        const worldOffset = offset.clone().applyQuaternion(this.currentRotation);
        let desiredPosition = targetPosition.clone().add(worldOffset);

        // Apply screen shake if active
        if (this.shakeTime > 0) {
            this.shakeTime -= deltaTime;
            const shakeOffset = new THREE.Vector3(
                (Math.random() - 0.5) * this.shakeStrength,
                (Math.random() - 0.5) * this.shakeStrength,
                (Math.random() - 0.5) * this.shakeStrength
            );
            desiredPosition.add(shakeOffset);
        }

        // Smoothly move camera
        this.camera.position.lerp(desiredPosition, this.positionLerpFactor);

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
            lookTarget = targetPosition.clone().add(lookDirection);
        } else {
            // Third person look target
            lookTarget = targetPosition.clone().add(new THREE.Vector3(0, 1, 0));
        }

        // Update camera lookAt
        this.camera.lookAt(lookTarget);

        // Handle FOV changes
        const speed = this.target.velocity ? this.target.velocity.length() : 0;
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

        // Debug output
        if (this.debug) {
            console.log('Camera State:', {
                position: this.camera.position.toArray(),
                target: lookTarget.toArray(),
                rotation: this.currentRotation.toArray(),
                fov: this.camera.fov,
                speed: speed,
                mode: this.mode,
                isRearView: this.isRearView
            });
        }
    }

    getCamera() {
        if (!this.camera) {
            console.warn('Camera not initialized');
            return null;
        }
        return this.camera;
    }

    cleanup() {
        if (this.cleanupResizeHandler) {
            this.cleanupResizeHandler();
        }
        if (this.scene && this.camera) {
            this.scene.remove(this.camera);
        }
    }
} 