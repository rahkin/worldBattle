import { System } from '../core/System.js';
import * as THREE from 'three';

export class CameraSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this.initialized = false;
        this.camera = null;
        this.target = null;
        this.targetPosition = new THREE.Vector3();
        this.targetLookAt = new THREE.Vector3();
        
        // Camera parameters
        this.distance = 15;
        this.height = 8;
        this.lookAheadDistance = 20;
        this.positionDamping = 0.1;
        this.rotationDamping = 0.05;
        
        // Debug settings
        this.debugEnabled = false;
        this.debugFrameCount = 0;
        this.debugInterval = 60;

        // Bind methods to ensure proper 'this' context
        this.init = this.init.bind(this);
        this.setTarget = this.setTarget.bind(this);
        this.update = this.update.bind(this);

        console.log('CameraSystem constructed:', {
            hasWorld: !!this.world,
            worldSystems: this.world ? Array.from(this.world.systems.keys()) : []
        });
    }

    async init() {
        console.log('CameraSystem init - Starting initialization');
        
        try {
            // First check if we're already initialized
            if (this.initialized && this.camera) {
                console.log('CameraSystem already initialized');
                return true;
            }

            // Get SceneManager from world
            const sceneManager = this.world.getSystem('SceneManager');
            if (!sceneManager) {
                throw new Error('SceneManager not found in world systems: ' + 
                    Array.from(this.world.systems.keys()).join(', '));
            }

            // Get camera from SceneManager
            this.camera = sceneManager.getCamera();
            if (!this.camera) {
                throw new Error('Camera not available from SceneManager');
            }

            // Set initial camera position and orientation
            this.camera.position.set(0, this.height, this.distance);
            this.camera.lookAt(0, 0, 0);
            
            // Initialize target positions with current camera position
            this.targetPosition.copy(this.camera.position);
            this.targetLookAt.set(0, 0, 0);
            
            this.initialized = true;
            
            console.log('CameraSystem initialized successfully:', {
                initialized: this.initialized,
                hasCamera: !!this.camera,
                position: this.camera.position.toArray(),
                lookAt: this.targetLookAt.toArray(),
                distance: this.distance,
                height: this.height,
                worldSystems: Array.from(this.world.systems.keys())
            });
            
            return true;
        } catch (error) {
            console.error('CameraSystem init failed with error:', error);
            this.initialized = false;
            this.camera = null;
            return false;
        }
    }

    setTarget(entity) {
        console.log('Setting camera target:', {
            initialized: this.initialized,
            hasCamera: !!this.camera,
            entityProvided: !!entity,
            entityId: entity?.id,
            worldSystems: Array.from(this.world.systems.keys())
        });

        if (!this.initialized || !this.camera) {
            console.error('Cannot set target: CameraSystem not properly initialized:', {
                initialized: this.initialized,
                hasCamera: !!this.camera
            });
            return false;
        }
        
        if (!entity) {
            console.warn('Null entity provided to setTarget');
            return false;
        }

        const physicsBody = entity.getComponent('PhysicsBody');
        if (!physicsBody) {
            console.warn('Target entity has no PhysicsBody component:', {
                entityId: entity.id,
                components: Array.from(entity.components.keys())
            });
            return false;
        }
        
        this.target = entity;
        
        // Initialize camera position relative to target
        this.updateTargetPositions();
        
        if (this.debugEnabled) {
            console.log('Camera target set successfully:', {
                entityId: entity.id,
                position: physicsBody.body.position,
                cameraPosition: this.camera.position.toArray(),
                targetPosition: this.targetPosition.toArray()
            });
        }
        
        return true;
    }

    updateTargetPositions() {
        if (!this.target) return;

        const physicsBody = this.target.getComponent('PhysicsBody');
        const input = this.target.getComponent('InputComponent');
        
        if (!physicsBody) {
            console.warn('Target has no physics body');
            return;
        }

        // Get current physics state
        const position = physicsBody.body.position;
        const quaternion = physicsBody.body.quaternion;
        const velocity = physicsBody.body.velocity;
        const speed = velocity.length();

        // Calculate forward vector from quaternion - using negative Z as forward
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(new THREE.Quaternion(
            quaternion.x, quaternion.y, quaternion.z, quaternion.w
        ));

        // Adjust for reverse movement
        const isReversing = input && input.backward;
        if (isReversing) {
            forward.multiplyScalar(-1);
        }

        // Calculate camera target position (behind and above vehicle)
        this.targetPosition.copy(position)
            .sub(forward.multiplyScalar(this.distance))
            .add(new THREE.Vector3(0, this.height, 0));

        // Calculate look-at position (ahead of vehicle)
        this.targetLookAt.copy(position)
            .add(forward.normalize().multiplyScalar(this.lookAheadDistance));

        // Debug logging
        if (this.debugEnabled && ++this.debugFrameCount % this.debugInterval === 0) {
            console.log('Camera update:', {
                targetPosition: this.targetPosition.toArray(),
                targetLookAt: this.targetLookAt.toArray(),
                vehiclePosition: position.toArray(),
                vehicleVelocity: velocity.toArray(),
                speed: speed,
                isReversing: isReversing,
                forward: forward.toArray()
            });
        }
    }

    update(deltaTime) {
        if (!this.initialized || !this.camera) return;

        // Update target positions based on physics
        this.updateTargetPositions();

        // Smoothly interpolate camera position
        this.camera.position.lerp(this.targetPosition, this.positionDamping);
        
        // Create a temporary vector for current look-at
        const currentLookAt = new THREE.Vector3();
        currentLookAt.copy(this.camera.position).add(this.camera.getWorldDirection(new THREE.Vector3()));

        // Smoothly interpolate look-at position
        currentLookAt.lerp(this.targetLookAt, this.rotationDamping);
        this.camera.lookAt(currentLookAt);

        // Update aspect ratio if window is resized
        if (window.innerWidth > 0 && window.innerHeight > 0) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }

        // Debug logging
        if (this.debugEnabled && ++this.debugFrameCount % this.debugInterval === 0) {
            console.log('Camera update:', {
                position: this.camera.position.toArray(),
                lookAt: currentLookAt.toArray(),
                targetPosition: this.targetPosition.toArray(),
                targetLookAt: this.targetLookAt.toArray()
            });
        }
    }

    setDistance(distance) {
        this.distance = distance;
    }

    setHeight(height) {
        this.height = height;
    }

    setDamping(damping) {
        this.positionDamping = damping;
    }

    setRotationDamping(damping) {
        this.rotationDamping = damping;
    }

    enableDebug(enabled = true) {
        this.debugEnabled = enabled;
    }

    cleanup() {
        this.initialized = false;
        this.camera = null;
        this.target = null;
        this.targetPosition.set(0, 0, 0);
        this.targetLookAt.set(0, 0, 0);
    }
} 