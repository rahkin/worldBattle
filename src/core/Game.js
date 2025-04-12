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
        const maxForce = 1800;
        const brakeForce = 1000000;

        // Steering
        if (this.inputManager.isKeyPressed('KeyA')) {
            this.playerVehicle.setSteeringValue(maxSteerVal, 0);
            this.playerVehicle.setSteeringValue(maxSteerVal, 1);
        } else if (this.inputManager.isKeyPressed('KeyD')) {
            this.playerVehicle.setSteeringValue(-maxSteerVal, 0);
            this.playerVehicle.setSteeringValue(-maxSteerVal, 1);
        } else {
            this.playerVehicle.setSteeringValue(0, 0);
            this.playerVehicle.setSteeringValue(0, 1);
        }

        // Acceleration
        if (this.inputManager.isKeyPressed('KeyW')) {
            this.playerVehicle.applyEngineForce(-maxForce, 2);
            this.playerVehicle.applyEngineForce(-maxForce, 3);
        } else if (this.inputManager.isKeyPressed('KeyS')) {
            this.playerVehicle.applyEngineForce(maxForce, 2);
            this.playerVehicle.applyEngineForce(maxForce, 3);
        } else {
            this.playerVehicle.applyEngineForce(0, 2);
            this.playerVehicle.applyEngineForce(0, 3);
        }

        // Braking
        if (this.inputManager.isKeyPressed('Space')) {
            this.playerVehicle.setBrake(brakeForce, 0);
            this.playerVehicle.setBrake(brakeForce, 1);
            this.playerVehicle.setBrake(brakeForce, 2);
            this.playerVehicle.setBrake(brakeForce, 3);
        } else {
            this.playerVehicle.setBrake(0, 0);
            this.playerVehicle.setBrake(0, 1);
            this.playerVehicle.setBrake(0, 2);
            this.playerVehicle.setBrake(0, 3);
        }
    }
} 