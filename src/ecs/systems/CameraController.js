import { System } from '../core/System.js';
import * as THREE from 'three';

export class CameraController {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target;
        
        // Camera configuration
        this.distance = 10;    // Default distance
        this.height = 4;      // Default height
        this.lookAheadDistance = 5;  // Look ahead distance
        this.damping = 0.05;  // Default damping
        this.rotationDamping = 0.1;  // Default rotation damping
        
        // Current camera state
        this.currentPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3();
        this.targetLookAt = new THREE.Vector3();
        this.lastTargetPosition = new THREE.Vector3();
        this.lastForward = new THREE.Vector3(0, 0, 1);
        
        // Debug mode
        this.debugEnabled = false;
        this.frameCounter = 0;
        this.logInterval = 60; // Log every 60 frames
        
        // Initialize camera position
        if (this.camera && this.target) {
            this.updateTargetPositions();
            this.currentPosition.copy(this.camera.position);
            this.currentLookAt.copy(this.targetLookAt);
            this.lastTargetPosition.copy(this.target.position);
            this.camera.lookAt(this.currentLookAt);
            
            if (this.debugEnabled) {
                console.log('Camera initialized:', {
                    position: this.camera.position.toArray(),
                    lookAt: this.currentLookAt.toArray(),
                    target: this.target.position.toArray()
                });
            }
        }
    }

    updateTargetPositions() {
        if (!this.target || !this.target.position || !this.target.quaternion) {
            console.warn('Invalid target for camera controller');
            return false;
        }

        // Get target's position and rotation
        const targetPos = this.target.position.clone();
        const targetQuat = this.target.quaternion.clone();

        // Calculate forward direction
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(targetQuat);
        
        // Smooth the forward vector to prevent sudden changes
        this.lastForward.lerp(forward, 0.1);
        this.lastForward.normalize();

        // Calculate camera offset (behind and above the vehicle)
        const offset = this.lastForward.clone().multiplyScalar(-this.distance);
        offset.y = this.height;

        // Calculate new target position
        this.targetPosition.copy(targetPos).add(offset);
        
        // Calculate look-at position (ahead of the vehicle)
        const lookAheadOffset = this.lastForward.clone().multiplyScalar(this.lookAheadDistance);
        this.targetLookAt.copy(targetPos).add(lookAheadOffset);

        // Store last position for next frame
        this.lastTargetPosition.copy(targetPos);

        // Validate positions
        if (!this.isValidPosition(this.targetPosition) || !this.isValidPosition(this.targetLookAt)) {
            console.warn('Invalid camera target positions calculated:', {
                targetPosition: this.targetPosition.toArray(),
                targetLookAt: this.targetLookAt.toArray(),
                vehiclePosition: targetPos.toArray()
            });
            return false;
        }

        // Debug logging with actual values, but only every N frames
        if (this.debugEnabled && this.frameCounter % this.logInterval === 0) {
            console.log('Camera targets updated:', {
                targetPosition: {
                    x: this.targetPosition.x.toFixed(2),
                    y: this.targetPosition.y.toFixed(2),
                    z: this.targetPosition.z.toFixed(2)
                },
                targetLookAt: {
                    x: this.targetLookAt.x.toFixed(2),
                    y: this.targetLookAt.y.toFixed(2),
                    z: this.targetLookAt.z.toFixed(2)
                },
                vehiclePosition: {
                    x: targetPos.x.toFixed(2),
                    y: targetPos.y.toFixed(2),
                    z: targetPos.z.toFixed(2)
                },
                forward: {
                    x: this.lastForward.x.toFixed(2),
                    y: this.lastForward.y.toFixed(2),
                    z: this.lastForward.z.toFixed(2)
                }
            });
        }
        
        return true;
    }

    isValidPosition(position) {
        return position && 
               !isNaN(position.x) && 
               !isNaN(position.y) && 
               !isNaN(position.z) &&
               isFinite(position.x) && 
               isFinite(position.y) && 
               isFinite(position.z) &&
               Math.abs(position.x) < 1000 &&  // Sanity check for reasonable bounds
               Math.abs(position.y) < 1000 &&
               Math.abs(position.z) < 1000;
    }

    update(deltaTime) {
        if (!this.camera || !this.target) return;
        
        this.frameCounter++;

        try {
            // Update target positions
            if (!this.updateTargetPositions()) {
                return; // Skip update if positions are invalid
            }

            // Smoothly interpolate camera position with variable damping
            const positionDelta = this.targetPosition.distanceTo(this.currentPosition);
            const lookAtDelta = this.targetLookAt.distanceTo(this.currentLookAt);
            
            // Adjust damping based on distance
            const posDamping = Math.min(this.damping * (1 + positionDelta * 0.1), 1);
            const rotDamping = Math.min(this.rotationDamping * (1 + lookAtDelta * 0.1), 1);

            // Update positions with adjusted damping
            this.currentPosition.lerp(this.targetPosition, posDamping);
            this.currentLookAt.lerp(this.targetLookAt, rotDamping);

            // Update camera if positions are valid
            if (this.isValidPosition(this.currentPosition) && this.isValidPosition(this.currentLookAt)) {
                this.camera.position.copy(this.currentPosition);
                this.camera.lookAt(this.currentLookAt);
            }

            // Occasional debug logging of actual camera state
            if (this.debugEnabled && this.frameCounter % this.logInterval === 0) {
                console.log('Camera state:', {
                    position: {
                        x: this.camera.position.x.toFixed(2),
                        y: this.camera.position.y.toFixed(2),
                        z: this.camera.position.z.toFixed(2)
                    },
                    lookAt: {
                        x: this.currentLookAt.x.toFixed(2),
                        y: this.currentLookAt.y.toFixed(2),
                        z: this.currentLookAt.z.toFixed(2)
                    },
                    damping: {
                        position: posDamping.toFixed(3),
                        rotation: rotDamping.toFixed(3)
                    }
                });
            }
        } catch (error) {
            console.error('Error updating camera:', error);
        }
    }

    setDistance(distance) {
        if (isFinite(distance) && distance > 0) {
            this.distance = distance;
        }
    }

    setHeight(height) {
        if (isFinite(height)) {
            this.height = height;
        }
    }

    setDamping(damping) {
        if (isFinite(damping) && damping > 0 && damping <= 1) {
            this.damping = damping;
        }
    }

    setRotationDamping(damping) {
        if (isFinite(damping) && damping > 0 && damping <= 1) {
            this.rotationDamping = damping;
        }
    }

    enableDebug(enabled = true) {
        this.debugEnabled = enabled;
        if (enabled) {
            console.log('Camera debug enabled with current settings:', {
                distance: this.distance,
                height: this.height,
                lookAheadDistance: this.lookAheadDistance,
                damping: this.damping,
                rotationDamping: this.rotationDamping
            });
        }
    }

    cleanup() {
        if (this.debugEnabled) {
            console.log('Cleaning up camera controller');
        }
        this.camera = null;
        this.target = null;
    }
} 