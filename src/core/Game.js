import { SceneManager } from '../rendering/SceneManager.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';
import { VehicleFactory } from '../physics/VehicleFactory.js';
import { InputManager } from './InputManager.js';
import { CameraManager } from '../rendering/CameraManager.js';
import { GameLoop } from './GameLoop.js';
import { DebugManager } from './DebugManager.js';

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
        
        // Force and boost tracking
        this.currentEngineForce = 0; // Smooth force application
        this.boostTimer = 0;
        this.boostCooldown = 0;
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
            
            // Create player vehicle
            console.log('Creating player vehicle...');
            this.playerVehicle = await this.vehicleFactory.createMuscleCar({ x: 0, y: 2, z: 0 });

            console.log('Initializing camera...');
            this.cameraManager.init(this.sceneManager.scene, this.playerVehicle);
            
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
        
        // Render scene
        this.sceneManager.render(this.cameraManager.camera);
    }

    handleInput(deltaTime) {
        if (!this.playerVehicle) return;

        const maxSteerVal = 0.5;
        const normalForce = 1800;
        const boostForce = 2200; // Lowered from 2800 to reduce spin
        const reverseForce = 400;
        const brakeForce = 100;

        const forwardKey = this.inputManager.isKeyPressed('KeyW');
        const backwardKey = this.inputManager.isKeyPressed('KeyS');
        const leftKey = this.inputManager.isKeyPressed('KeyA');
        const rightKey = this.inputManager.isKeyPressed('KeyD');
        const brakeKey = this.inputManager.isKeyPressed('Space');
        const boostKey = this.inputManager.isKeyPressed('ShiftLeft') || this.inputManager.isKeyPressed('ShiftRight');

        // 🔥 BOOST SYSTEM
        const BOOST_DURATION = 2;    // seconds
        const COOLDOWN_DURATION = 5; // seconds

        const canBoost = this.boostCooldown <= 0 && this.boostTimer <= 0;

        if (boostKey && canBoost) {
            this.boostTimer = BOOST_DURATION;
            this.boostCooldown = COOLDOWN_DURATION;

            // Optional camera FX
            if (this.cameraManager.controller?.triggerKickback) {
                this.cameraManager.controller.triggerKickback(10);
            }
        }

        // Tick timers
        if (this.boostTimer > 0) this.boostTimer -= deltaTime;
        if (this.boostCooldown > 0) this.boostCooldown -= deltaTime;

        const isBoosting = this.boostTimer > 0;

        // 🧭 Reset brakes
        for (let i = 0; i < 4; i++) {
            this.playerVehicle.setBrake(0, i);
        }

        // 🔁 Steering
        if (leftKey) {
            this.playerVehicle.setSteeringValue(maxSteerVal, 0);
            this.playerVehicle.setSteeringValue(maxSteerVal, 1);
        } else if (rightKey) {
            this.playerVehicle.setSteeringValue(-maxSteerVal, 0);
            this.playerVehicle.setSteeringValue(-maxSteerVal, 1);
        } else {
            this.playerVehicle.setSteeringValue(0, 0);
            this.playerVehicle.setSteeringValue(0, 1);
        }

        // 🎯 Smooth engine force
        const targetForce = isBoosting ? -boostForce : -normalForce;
        this.currentEngineForce += (targetForce - this.currentEngineForce) * 5 * deltaTime;

        if (forwardKey) {
            this.playerVehicle.applyEngineForce(this.currentEngineForce, 2);
            this.playerVehicle.applyEngineForce(this.currentEngineForce, 3);
        } else if (backwardKey) {
            this.playerVehicle.applyEngineForce(reverseForce, 2);
            this.playerVehicle.applyEngineForce(reverseForce, 3);
        } else {
            this.playerVehicle.applyEngineForce(0, 2);
            this.playerVehicle.applyEngineForce(0, 3);
        }

        // 🛑 Braking
        if (brakeKey) {
            this.playerVehicle.applyEngineForce(reverseForce, 2);
            this.playerVehicle.applyEngineForce(reverseForce, 3);
            if (this.cameraManager.controller?.triggerShake) {
                this.cameraManager.controller.triggerShake(0.2, 0.08);
            }
        }
    }
} 