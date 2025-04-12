import { SceneManager } from '../rendering/SceneManager.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';
import { VehicleFactory } from '../physics/VehicleFactory.js';
import { InputManager } from './InputManager.js';
import { CameraManager } from '../rendering/CameraManager.js';
import { GameLoop } from './GameLoop.js';
import { DebugManager } from './DebugManager.js';
import { VehicleSelector } from '../rendering/VehicleSelector.js';
import { JumpRamp } from '../physics/objects/JumpRamp.js';

export class Game {
    constructor() {
        this.sceneManager = new SceneManager();
        this.physicsWorld = new PhysicsWorld();
        this.inputManager = new InputManager();
        this.cameraManager = new CameraManager();
        this.gameLoop = new GameLoop();
        this.debugManager = null;
        
        this.vehicleFactory = null;
        this.playerVehicle = null;
        this.jumpRamp = null;
        
        // Force and boost tracking
        this.currentEngineForce = 0; // Smooth force application
        this.boostTimer = 0;
        this.boostCooldown = 0;

        // Vehicle selection
        this.vehicleSelector = null;
    }

    async init() {
        try {
            console.log('Starting game initialization...');

            // Initialize systems
            console.log('Initializing scene manager...');
            this.sceneManager.init();

            console.log('Initializing physics world...');
            this.physicsWorld.init();

            console.log('Initializing debug manager...');
            this.debugManager = new DebugManager(this.sceneManager.scene, this.physicsWorld.world);
            this.debugManager.init();

            console.log('Creating vehicle factory...');
            this.vehicleFactory = new VehicleFactory(this.physicsWorld.world, this.sceneManager.scene);
            
            // Create initial vehicle
            console.log('Creating player vehicle...');
            this.playerVehicle = this.vehicleFactory.createVehicle('muscle');

            // Create jump ramp
            console.log('Creating jump ramp...');
            this.jumpRamp = new JumpRamp(this.physicsWorld.world, this.sceneManager.scene, {
                width: 4,
                height: 2,
                length: 6,
                position: { x: 0, y: 0, z: 15 }  // Place the ramp 15 units ahead
            });

            console.log('Initializing camera...');
            this.cameraManager.init(this.sceneManager.scene);
            if (this.playerVehicle) {
                this.cameraManager.setTarget(this.playerVehicle);
            }
            
            // Start game loop
            console.log('Starting game loop...');
            this.gameLoop.start(this.update.bind(this));

            // Hide loading screen
            console.log('Initialization complete, hiding loading screen...');
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
            console.log('Game ready!');

            // Initialize vehicle selector
            this.vehicleSelector = new VehicleSelector(this);
            this.vehicleSelector.show();
        } catch (error) {
            console.error('Failed to initialize game:', error);
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                const loadingText = loadingScreen.querySelector('.loading-text');
                if (loadingText) {
                    loadingText.textContent = 'Failed to load game. Please refresh the page.';
                }
            }
        }
    }

    update(deltaTime) {
        // Update physics
        this.physicsWorld.update(deltaTime);
        
        // Update vehicle visuals
        this.vehicleFactory.update();
        
        // Update camera
        this.cameraManager.update(deltaTime);
        
        // Handle input
        this.handleInput(deltaTime);

        // Update debug visualization
        if (this.debugManager) {
            this.debugManager.update();
        }
        
        // Update jump ramp if needed
        if (this.jumpRamp) {
            this.jumpRamp.update();
        }
        
        // Render scene
        this.sceneManager.render(this.cameraManager.camera);
    }

    handleInput(deltaTime) {
        if (!this.playerVehicle || !this.playerVehicle.vehicle) return;

        const vehicle = this.playerVehicle.vehicle; // Easier access
        const maxSteerVal = 0.5;
        const normalForce = 1800;
        const boostForce = 2200;
        const reverseForce = 800;
        const brakeForce = 100;

        const forwardKey = this.inputManager.isKeyPressed('KeyW');
        const backwardKey = this.inputManager.isKeyPressed('KeyS');
        const leftKey = this.inputManager.isKeyPressed('KeyA');
        const rightKey = this.inputManager.isKeyPressed('KeyD');
        const brakeKey = this.inputManager.isKeyPressed('Space');
        const boostKey = this.inputManager.isKeyPressed('ShiftLeft') || this.inputManager.isKeyPressed('ShiftRight');

        const BOOST_DURATION = 2;
        const COOLDOWN_DURATION = 5;

        const canBoost = this.boostCooldown <= 0 && this.boostTimer <= 0;

        if (boostKey && canBoost) {
            this.boostTimer = BOOST_DURATION;
            this.boostCooldown = COOLDOWN_DURATION;
            if (this.cameraManager.controller?.triggerKickback) {
                this.cameraManager.controller.triggerKickback(10);
            }
        }

        if (this.boostTimer > 0) this.boostTimer -= deltaTime;
        if (this.boostCooldown > 0) this.boostCooldown -= deltaTime;

        const isBoosting = this.boostTimer > 0;
        const targetForce = isBoosting ? boostForce : normalForce;
        this.currentEngineForce += (targetForce - this.currentEngineForce) * 5 * deltaTime;

        // Reset brakes and force
        for (let i = 0; i < 4; i++) {
            vehicle.setBrake(0, i);
            vehicle.applyEngineForce(0, i);
        }

        // Steering
        if (leftKey) {
            vehicle.setSteeringValue(maxSteerVal, 0); // front left
            vehicle.setSteeringValue(maxSteerVal, 1); // front right
        } else if (rightKey) {
            vehicle.setSteeringValue(-maxSteerVal, 0);
            vehicle.setSteeringValue(-maxSteerVal, 1);
        } else {
            vehicle.setSteeringValue(0, 0);
            vehicle.setSteeringValue(0, 1);
        }

        // Forward / reverse
        const isForward = forwardKey;
        const isBackward = backwardKey;

        // Apply engine force to rear wheels
        if (isForward) {
            vehicle.applyEngineForce(normalForce, 0); // Rear left
            vehicle.applyEngineForce(normalForce, 1); // Rear right
        } else if (isBackward) {
            vehicle.applyEngineForce(-normalForce, 0); // Rear left
            vehicle.applyEngineForce(-normalForce, 1); // Rear right
        } else {
            vehicle.applyEngineForce(0, 0);
            vehicle.applyEngineForce(0, 1);
        }

        // Braking
        if (brakeKey) {
            for (let i = 0; i < 4; i++) {
                vehicle.setBrake(brakeForce, i);
            }
            if (this.cameraManager.controller?.triggerShake) {
                this.cameraManager.controller.triggerShake(0.2, 0.08);
            }
        }
    }

    selectVehicle(vehicleId) {
        if (this.playerVehicle) {
            // Remove existing vehicle from scene
            if (this.playerVehicle.chassisMesh) {
                this.sceneManager.scene.remove(this.playerVehicle.chassisMesh);
            }
            if (this.playerVehicle.wheelMeshes) {
                this.playerVehicle.wheelMeshes.forEach(wheel => {
                    this.sceneManager.scene.remove(wheel);
                });
            }
            // Remove physics body
            if (this.playerVehicle.vehicle) {
                this.physicsWorld.world.removeBody(this.playerVehicle.vehicle.chassisBody);
            }
            this.vehicleFactory.removeVehicle(this.playerVehicle);
        }

        // Create new vehicle
        this.playerVehicle = this.vehicleFactory.createVehicle(vehicleId);
        
        // Reset camera to follow new vehicle
        if (this.playerVehicle) {
            this.cameraManager.setTarget(this.playerVehicle);
        }
    }
} 