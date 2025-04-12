import { SceneManager } from '../rendering/SceneManager.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';
import { VehicleFactory } from '../physics/VehicleFactory.js';
import { InputManager } from './InputManager.js';
import { CameraManager } from '../rendering/CameraManager.js';
import { GameLoop } from './GameLoop.js';
import { DebugManager } from './DebugManager.js';
import { VehicleSelector } from '../rendering/VehicleSelector.js';
import { HealthDisplay } from '../rendering/HealthDisplay.js';
import { BaseCar } from '../physics/vehicles/BaseCar.js';
import * as CANNON from 'cannon-es';

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

        // Vehicle selection
        this.vehicleSelector = null;

        this.healthDisplay = null;

        this.keys = {
            recovery: false
        };
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

            // Create health display
            console.log('Initializing health display...');
            this.healthDisplay = new HealthDisplay();
            console.log('Health display initialized');
            
            console.log('Game ready!');

            // Initialize vehicle selector
            this.vehicleSelector = new VehicleSelector(this);
            this.vehicleSelector.show();

            this._setupControls();
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
        // Handle input first
        this.handleInput(deltaTime);
        
        // Then update input manager to clear the pressed keys
        this.inputManager.update();
        
        // Update physics
        this.physicsWorld.update(deltaTime);
        
        // Update vehicle visuals
        this.vehicleFactory.update();
        
        // Update camera
        this.cameraManager.update(deltaTime);

        // Update debug visualization
        if (this.debugManager) {
            this.debugManager.update();
        }
        
        // Update health display if player vehicle exists
        if (this.playerVehicle && this.healthDisplay) {
            const health = this.playerVehicle.damageSystem.currentHealth;
            const maxHealth = this.playerVehicle.damageSystem.options.maxHealth;
            this.healthDisplay.update(health, maxHealth);

            // Check if vehicle is destroyed
            if (this.playerVehicle.damageSystem.isDestroyed) {
                // Wait for explosion animation to complete
                setTimeout(() => {
                    this.respawnVehicle();
                }, 3000); // 3 seconds delay before respawn
            }
        }

        // Update vehicle
        if (this.playerVehicle) {
            this.playerVehicle.update(deltaTime);
        }

        // Render scene
        this.sceneManager.render(this.cameraManager.camera);
    }

    handleInput(deltaTime) {
        if (!this.playerVehicle || !this.playerVehicle._vehicle) {
            console.log('No player vehicle available');
            return;
        }

        const vehicle = this.playerVehicle._vehicle; // Use _vehicle instead of vehicle
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
        const rearViewKey = this.inputManager.isKeyPressed('KeyR');
        const recoveryKey = this.keys.recovery;

        // Test vehicle reset with T key
        if (this.inputManager.isKeyPressedOnce('KeyT')) {
            console.log('T key pressed - attempting teleport');
            const currentPos = this.playerVehicle._vehicle.chassisBody.position;
            console.log('Current position:', currentPos.toArray());
            
            // Move 5 units forward and 2 units up from current position
            const pos = new CANNON.Vec3(
                currentPos.x + 5,
                currentPos.y + 2,
                currentPos.z
            );
            
            // Apply damage before teleport
            this.playerVehicle.damageSystem.applyDamage(15);
            
            this.playerVehicle.forceTeleport(pos);
            console.log("Teleported to:", pos.toArray());
            console.log('New position:', this.playerVehicle._vehicle.chassisBody.position.toArray());
            
            // Update health display
            if (this.healthDisplay) {
                const health = this.playerVehicle.damageSystem.currentHealth;
                const maxHealth = this.playerVehicle.damageSystem.options.maxHealth;
                this.healthDisplay.update(health, maxHealth);
            }
        }

        // Handle rearview camera
        if (this.cameraManager.controller) {
            this.cameraManager.controller.setRearView(rearViewKey);
        }

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

        // Recovery system
        if (recoveryKey) {
            this._handleRecovery();
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

        // Update health display visibility
        if (this.healthDisplay) {
            console.log(`Setting health display visibility: ${this.playerVehicle !== null}`);
            this.healthDisplay.setVisible(this.playerVehicle !== null);
        }
    }

    _setupControls() {
        window.addEventListener('keydown', (e) => {
            // Add any additional controls here if needed
        });
    }

    respawnVehicle() {
        if (!this.playerVehicle) return;

        // Remove destroyed vehicle
        this.vehicleFactory.removeVehicle(this.playerVehicle);

        // Create new vehicle of the same type
        const vehicleType = this.playerVehicle.constructor.name.toLowerCase();
        this.playerVehicle = this.vehicleFactory.createVehicle(vehicleType);

        // Reset camera target
        if (this.playerVehicle) {
            this.cameraManager.setTarget(this.playerVehicle);
        }

        // Reset health display
        if (this.healthDisplay) {
            const health = this.playerVehicle.damageSystem.currentHealth;
            const maxHealth = this.playerVehicle.damageSystem.options.maxHealth;
            this.healthDisplay.update(health, maxHealth);
        }
    }

    _handleRecovery() {
        if (this.playerVehicle && this.playerVehicle.canRecover) {
            const currentPosition = this.playerVehicle.vehicle.chassisBody.position.clone();
            const safePosition = this.playerVehicle._findSafePosition(currentPosition);

            if (safePosition) {
                this.playerVehicle.forceTeleport(safePosition);
                this.playerVehicle.damageSystem.applyDamage(15);
                this.playerVehicle.recoveryCooldown = this.playerVehicle.recoveryCooldownTime;
                this.playerVehicle.canRecover = false;
                console.log('Player vehicle reset to:', safePosition.toArray());
            } else {
                console.warn('Could not find safe recovery position');
            }
        } else {
            console.log('Recovery not available yet');
        }
    }
} 