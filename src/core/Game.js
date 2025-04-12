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
import { TestTarget } from '../physics/TestTarget.js';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

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

        // Respawn state
        this.isRespawning = false;
        this.respawnCountdown = 0;

        this.keys = {
            recovery: false
        };

        this.testTarget = null;
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

            console.log('Initializing camera...');
            this.cameraManager.init(this.sceneManager.scene);

            console.log('Creating vehicle factory...');
            this.vehicleFactory = new VehicleFactory(this.physicsWorld.world, this.sceneManager.scene, this);
            
            // Create player vehicle (Ironclad)
            console.log('Creating player vehicle...');
            this.playerVehicle = this.vehicleFactory.createVehicle('ironclad');
            this.playerVehicle.inputManager = this.inputManager; // Pass input manager for turret control

            // Set initial vehicle position and rotation
            if (this.playerVehicle.vehicle && this.playerVehicle.vehicle.chassisBody) {
                this.playerVehicle.vehicle.chassisBody.position.set(0, 1.2, 0);
                this.playerVehicle.vehicle.chassisBody.quaternion.setFromAxisAngle(
                    new CANNON.Vec3(0, 1, 0),
                    Math.PI // Rotate 180 degrees to face forward
                );
            }

            // Set camera target and offset after vehicle is created
            console.log('Setting up camera target...');
            this.cameraManager.setTarget(this.playerVehicle);
            
            // Create test target wall after camera is initialized
            console.log('Creating test target...');
            this.testTarget = new TestTarget(
                this.physicsWorld.world,
                this.sceneManager.scene,
                this.cameraManager.camera,
                new CANNON.Vec3(0, 4, -20) // Position the wall in front of the vehicle
            );

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

        // Update player vehicle and handle respawn
        if (this.playerVehicle) {
            this.playerVehicle.update(deltaTime);

            // Update health display
            if (this.healthDisplay && this.playerVehicle.damageSystem) {
                const currentHealth = this.playerVehicle.damageSystem.currentHealth || 100;
                const maxHealth = this.playerVehicle.damageSystem.options?.maxHealth || 100;
                this.healthDisplay.update(currentHealth, maxHealth);

                // Check for vehicle destruction
                if (this.playerVehicle.damageSystem.isDestroyed && !this.isRespawning) {
                    console.log('Vehicle destroyed, starting respawn countdown');
                    this.isRespawning = true;
                    this.respawnCountdown = 10.0; // 10 seconds respawn time
                    if (this.healthDisplay) {
                        console.log('Showing respawn counter');
                        this.healthDisplay.showRespawnCounter(this.respawnCountdown);
                    }
                }
            }

            // Update respawn countdown
            if (this.isRespawning) {
                this.respawnCountdown = Math.max(0, this.respawnCountdown - deltaTime);
                console.log('Respawn countdown:', this.respawnCountdown.toFixed(1));
                
                if (this.healthDisplay) {
                    this.healthDisplay.updateRespawnCounter(this.respawnCountdown);
                }
                
                if (this.respawnCountdown <= 0) {
                    console.log('Respawn countdown complete, respawning vehicle');
                    this._respawnVehicle();
                }
            }
        }

        // Update test target
        if (this.testTarget) {
            this.testTarget.update();
        }

        // Render scene
        this.sceneManager.render(this.cameraManager.camera);
    }

    handleInput(deltaTime) {
        if (!this.playerVehicle || !this.playerVehicle._vehicle) {
            console.log('No vehicle available for input:', {
                hasPlayer: !!this.playerVehicle,
                hasVehicle: !!(this.playerVehicle && this.playerVehicle._vehicle)
            });
            return;
        }

        const vehicle = this.playerVehicle._vehicle;
        const maxSteerVal = 0.5;
        const normalForce = 1800;
        const boostForce = 2200;
        const reverseForce = 800;
        const brakeForce = 100;

        // Handle weapon firing first
        if (this.inputManager.isMouseButtonPressed(0)) { // Left mouse button
            if (this.playerVehicle.fireCannon) {
                console.log('Attempting to fire cannon');  // Debug log
                this.playerVehicle.fireCannon();
            }
        }

        // Handle recovery key (T)
        if (this.inputManager.isKeyPressed('KeyT')) {
            console.log('Recovery key pressed, checking status:', {
                canRecover: this.playerVehicle.canRecover,
                cooldown: this.playerVehicle.recoveryCooldown
            });
            this._handleRecovery();
        }

        // Handle movement controls
        const forwardKey = this.inputManager.isKeyPressed('KeyW');
        const backwardKey = this.inputManager.isKeyPressed('KeyS');
        const leftKey = this.inputManager.isKeyPressed('KeyA');
        const rightKey = this.inputManager.isKeyPressed('KeyD');
        const brakeKey = this.inputManager.isKeyPressed('Space');
        const boostKey = this.inputManager.isKeyPressed('ShiftLeft') || this.inputManager.isKeyPressed('ShiftRight');
        const rearViewKey = this.inputManager.isKeyPressed('KeyR');

        // Reset brakes and force
        for (let i = 0; i < vehicle.wheelInfos.length; i++) {
            vehicle.setBrake(0, i);
            vehicle.applyEngineForce(0, i);
        }

        // Steering
        if (leftKey) {
            vehicle.setSteeringValue(maxSteerVal, 0);
            vehicle.setSteeringValue(maxSteerVal, 1);
        } else if (rightKey) {
            vehicle.setSteeringValue(-maxSteerVal, 0);
            vehicle.setSteeringValue(-maxSteerVal, 1);
        } else {
            vehicle.setSteeringValue(0, 0);
            vehicle.setSteeringValue(0, 1);
        }

        // Forward/Reverse
        if (forwardKey) {
            vehicle.applyEngineForce(normalForce, 2);
            vehicle.applyEngineForce(normalForce, 3);
        } else if (backwardKey) {
            vehicle.applyEngineForce(-reverseForce, 2);
            vehicle.applyEngineForce(-reverseForce, 3);
        }

        // Braking
        if (brakeKey) {
            for (let i = 0; i < vehicle.wheelInfos.length; i++) {
                vehicle.setBrake(brakeForce, i);
            }
        }

        // Handle boost
        if (boostKey && this.playerVehicle.boost) {
            this.playerVehicle.boost();
        }

        // Handle rear view
        if (this.cameraManager.controller) {
            this.cameraManager.controller.setRearView(rearViewKey);
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

    _respawnVehicle() {
        if (!this.playerVehicle) return;

        console.log('Starting vehicle respawn...');
        
        // Store current vehicle type - use the actual vehicle type ID
        const vehicleType = this.playerVehicle.options.type || 'muscle';
        console.log('Respawning vehicle type:', vehicleType);
        
        // Remove old vehicle and create new one of same type
        this.selectVehicle(vehicleType);
        
        // Reset damage system
        if (this.playerVehicle.damageSystem) {
            console.log('Resetting damage system');
            this.playerVehicle.damageSystem.reset();
        }

        // Reset health display
        if (this.healthDisplay) {
            console.log('Updating health display');
            this.healthDisplay.setVisible(true);
            this.healthDisplay.update(100, 100);
            this.healthDisplay.hideRespawnCounter();
        }

        // Reset respawn state
        this.respawnCountdown = 0;
        this.isRespawning = false;

        console.log('Vehicle respawn complete');
    }

    // Remove duplicate respawnVehicle method
    respawnVehicle() {
        this._respawnVehicle();
    }

    _handleRecovery() {
        console.log('Handling recovery request:', {
            hasPlayer: !!this.playerVehicle,
            hasVehicle: !!(this.playerVehicle && this.playerVehicle._vehicle),
            canRecover: !!(this.playerVehicle && this.playerVehicle.canRecover),
            cooldown: this.playerVehicle?.recoveryCooldown
        });

        if (this.playerVehicle && this.playerVehicle._vehicle && this.playerVehicle.canRecover) {
            const currentPosition = this.playerVehicle._vehicle.chassisBody.position.clone();
            const safePosition = this.playerVehicle._findSafePosition(currentPosition);

            if (safePosition) {
                console.log('Found safe position, attempting teleport:', safePosition.toArray());
                this.playerVehicle.forceTeleport(safePosition);
                this.playerVehicle.damageSystem.applyDamage(15);
                this.playerVehicle.recoveryCooldown = this.playerVehicle.recoveryCooldownTime;
                this.playerVehicle.canRecover = false;
                console.log('Vehicle reset complete');
            } else {
                console.warn('Could not find safe recovery position');
            }
        } else {
            console.log('Recovery not available:', {
                reason: !this.playerVehicle ? 'no player vehicle' :
                        !this.playerVehicle._vehicle ? 'no physics vehicle' :
                        !this.playerVehicle.canRecover ? 'on cooldown' : 'unknown'
            });
        }
    }
} 