import { System } from '../core/System.js';
import * as THREE from 'three';

export class CameraSystem extends System {
    constructor(camera) {
        super();
        this.camera = camera;
        this.initialized = false;
        this.target = null;
        this.targetPosition = new THREE.Vector3();
        this.targetLookAt = new THREE.Vector3();
        
        // Default camera parameters
        this.baseDistance = 20;
        this.baseHeight = 10;
        this.baseLookAheadDistance = 20;
        
        // Vehicle-specific adjustments
        this.vehicleTypeParams = {
            car: { distance: 20, height: 8, lookAhead: 24 },
            truck: { distance: 24, height: 12, lookAhead: 30 },
            bike: { distance: 16, height: 6, lookAhead: 20 },
            drone: { distance: 30, height: 20, lookAhead: 16 }
        };
        
        // Improved damping values
        this.positionDamping = 0.15;  // Increased for more responsive following
        this.rotationDamping = 0.08;  // Increased for smoother rotation
        
        // Speed-based adjustments
        this.maxSpeedAdjustment = 1.5;  // Maximum multiplier for speed-based distance
        this.speedAdjustmentThreshold = 20;  // Speed threshold for adjustments
        
        // Debug settings (disabled by default)
        this.debugEnabled = false;
        this.debugFrameCount = 0;
        this.debugInterval = 60;

        // Bind methods
        this.init = this.init.bind(this);
        this.setTarget = this.setTarget.bind(this);
        this.update = this.update.bind(this);

        console.log('CameraSystem constructed:', {
            hasCamera: !!this.camera,
            cameraPosition: this.camera ? this.camera.position.toArray() : null
        });
    }

    async init() {
        console.log('CameraSystem init - Starting initialization');

            if (!this.camera) {
            this.camera = new THREE.PerspectiveCamera(
                75, // Field of view
                window.innerWidth / window.innerHeight,
                0.1,
                10000 // Increased far plane to see more of the scene
            );
            }

        // Position camera higher and further back for better overview
        this.camera.position.set(0, 500, 1000);
            this.camera.lookAt(0, 0, 0);
        
        // Store initial values
        this.initialPosition = this.camera.position.clone();
        this.initialTarget = new THREE.Vector3(0, 0, 0);
        
        // Set default follow parameters
        this.followDistance = 20;
        this.followHeight = 10;
        this.followLerp = 0.1;
            
            this.initialized = true;
        
            console.log('CameraSystem initialized successfully:', {
                initialized: this.initialized,
                hasCamera: !!this.camera,
                position: this.camera.position.toArray(),
            lookAt: this.initialTarget.toArray(),
            distance: this.followDistance,
            height: this.followHeight
            });
        
            return true;
    }

    setTarget(entity) {
        if (!entity) {
            console.warn('Invalid target provided to CameraSystem');
            return false;
        }

        this.target = entity;
        console.log('Setting camera target:', {
            initialized: this.initialized,
            hasCamera: !!this.camera,
            entityProvided: !!entity,
            entityId: entity.id
        });
        
        return true;
    }

    update(deltaTime) {
        if (!this.initialized || !this.target) return;

        // Get target's mesh and physics components
        const meshComponent = this.target.getComponent('MeshComponent');
        const physicsComponent = this.target.getComponent('PhysicsBody');
        if (!meshComponent || !meshComponent.mesh) return;

        // Get target's current position, rotation and velocity
        const targetPos = meshComponent.mesh.position;
        const targetQuat = meshComponent.mesh.quaternion;
        const velocity = physicsComponent ? new THREE.Vector3(
            physicsComponent.velocity.x,
            physicsComponent.velocity.y,
            physicsComponent.velocity.z
        ) : new THREE.Vector3();
        const speed = velocity.length();

        // Get vehicle type-specific parameters
        const vehicleComponent = this.target.getComponent('VehicleComponent');
        const vehicleType = vehicleComponent ? vehicleComponent.type : 'car';
        const params = this.vehicleTypeParams[vehicleType] || this.vehicleTypeParams.car;
        
        // Calculate speed-based adjustments
        const speedRatio = Math.min(speed / this.speedAdjustmentThreshold, 1);
        const distanceMultiplier = 1 + (speedRatio * (this.maxSpeedAdjustment - 1));

        // Calculate adjusted camera parameters
        const adjustedDistance = params.distance * distanceMultiplier;
        const adjustedHeight = params.height * (1 + speedRatio * 0.2);
        const adjustedLookAhead = params.lookAhead * (1 + speedRatio * 0.5);
        
        // Create offset vectors in local space
        const positionOffset = new THREE.Vector3(0, adjustedHeight, adjustedDistance);
        const lookAtOffset = new THREE.Vector3(0, params.height * 0.5, -adjustedLookAhead);
        
        // Apply vehicle's rotation to the offset vectors
        positionOffset.applyQuaternion(targetQuat);
        lookAtOffset.applyQuaternion(targetQuat);
        
        // Calculate ideal position and look-at in world space
        const idealPosition = new THREE.Vector3().copy(targetPos).add(positionOffset);
        const lookAtTarget = new THREE.Vector3().copy(targetPos).add(lookAtOffset);
        
        // Add velocity-based offset for better following during acceleration
        if (speed > 1) {
            const velocityInfluence = Math.min(speed / 10, 1) * 2; // Scale with speed, max 2 units
            const velocityOffset = velocity.clone().normalize().multiplyScalar(-velocityInfluence);
            idealPosition.add(velocityOffset);
        }

        // Update target position with improved damping
        this.targetPosition.lerp(idealPosition, this.positionDamping * deltaTime * 60);
        this.targetLookAt.lerp(lookAtTarget, this.rotationDamping * deltaTime * 60);

        // Apply camera position and look-at
        this.camera.position.copy(this.targetPosition);
        this.camera.lookAt(this.targetLookAt);

        // Debug logging
        if (this.debugEnabled) {
            this.debugFrameCount++;
            if (this.debugFrameCount >= this.debugInterval) {
                console.log('Camera Debug:', {
                    vehicleType,
                    speed: speed.toFixed(2),
                    distance: adjustedDistance.toFixed(2),
                    height: adjustedHeight.toFixed(2),
                    lookAhead: adjustedLookAhead.toFixed(2),
                    position: this.camera.position.toArray().map(v => v.toFixed(2)),
                    targetRotation: [
                        meshComponent.mesh.rotation.x.toFixed(2),
                        meshComponent.mesh.rotation.y.toFixed(2),
                        meshComponent.mesh.rotation.z.toFixed(2)
                    ]
                });
                this.debugFrameCount = 0;
            }
        }
    }

    cleanup() {
        this.initialized = false;
        this.target = null;
    }
} 