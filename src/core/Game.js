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
import { PowerUpSystem, POWER_UP_TYPES } from '../physics/PowerUpSystem.js';
import { PowerUpDisplay } from '../rendering/PowerUpDisplay.js';
import { AmmoDisplay } from '../rendering/AmmoDisplay.js';
import { MineSystem } from '../physics/MineSystem';
import { MineDisplay } from '../rendering/MineDisplay.js';
import { TimeSystem } from './TimeSystem.js';
import { WeatherSystem } from './WeatherSystem.js';

export class Game {
    constructor() {
        console.log('Initializing Game...');
        
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

        // Power-up spawn timer (in seconds)
        this.powerUpSpawnTimer = 0;
        this.powerUpSpawnInterval = 5; // 5 seconds for testing
        console.log('Power-up spawn settings initialized:', {
            interval: this.powerUpSpawnInterval,
            timer: this.powerUpSpawnTimer
        });
        
        // Initialize these as null for now
        this.powerUpSystem = null;
        this.powerUpDisplay = null;

        // Initialize ammo display
        try {
            this.ammoDisplay = new AmmoDisplay();
            console.log('Ammo display initialized');
        } catch (error) {
            console.error('Failed to initialize ammo display:', error);
        }

        // Initialize mine system
        this.mineSystem = new MineSystem(this.physicsWorld.world, this.sceneManager.scene);
        console.log('Mine system initialized');

        // Initialize mine display
        try {
            this.mineDisplay = new MineDisplay();
            console.log('Mine display initialized');
        } catch (error) {
            console.error('Failed to initialize mine display:', error);
        }

        // Initialize input state
        this.inputState = {
            lookingBack: false,
            deployMine: false
        };

        // Bind additional input handlers
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);

        // Prevent context menu on right click
        window.addEventListener('contextmenu', (e) => e.preventDefault());

        // Add collision event listener for power-ups
        this.physicsWorld.world.addEventListener('beginContact', this.handleCollision.bind(this));

        // Initialize time system
        this.timeSystem = new TimeSystem(this.sceneManager.scene);

        // Initialize weather system
        this.weatherSystem = new WeatherSystem(this.sceneManager.scene, this.timeSystem);
    }

    async init() {
        try {
            console.log('Starting game initialization...');

            // Initialize systems
            console.log('Initializing scene manager...');
            this.sceneManager.init();

            // Initialize time system first
            console.log('Initializing time system...');
            this.timeSystem = new TimeSystem(this.sceneManager.scene);
            // Add time system to scene for vehicle access
            this.sceneManager.scene.timeSystem = this.timeSystem;

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

            // Initialize power-up display first
            console.log('Initializing power-up display...');
            try {
                this.powerUpDisplay = new PowerUpDisplay(this.sceneManager.scene, this.cameraManager.camera);
                console.log('Power-up display initialized:', {
                    hasDisplay: !!this.powerUpDisplay,
                    hasContainer: !!this.powerUpDisplay?.container,
                    hasScene: !!this.sceneManager.scene,
                    hasCamera: !!this.cameraManager.camera
                });
            } catch (error) {
                console.error('Failed to initialize power-up display:', error);
            }

            // Initialize power-up system with display
            console.log('Initializing power-up system...');
            console.log('Checking dependencies:', {
                hasPhysicsWorld: !!this.physicsWorld,
                hasScene: !!this.sceneManager.scene,
                hasPowerUpSystemClass: !!PowerUpSystem,
                hasPowerUpTypes: !!POWER_UP_TYPES,
                hasPowerUpDisplay: !!this.powerUpDisplay
            });
            
            try {
                this.powerUpSystem = new PowerUpSystem(
                    this.physicsWorld.world, 
                    this.sceneManager.scene,
                    this.powerUpDisplay
                );
                // Set the game instance in the power-up system
                this.powerUpSystem.game = this;
                console.log('Power-up system initialized:', {
                    hasWorld: !!this.physicsWorld.world,
                    hasScene: !!this.sceneManager.scene,
                    powerUpSystem: !!this.powerUpSystem,
                    powerUpTypes: Object.keys(POWER_UP_TYPES || {}),
                    hasDisplay: !!this.powerUpDisplay,
                    hasGame: !!this.powerUpSystem.game
                });
            } catch (error) {
                console.error('Failed to initialize power-up system:', error);
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

            // Start with clear weather
            this.weatherSystem.setWeather('clear');
            
            // Set up weather change interval
            this.setupWeatherCycle();

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

    setupWeatherCycle() {
        // Weather patterns cycle every 5-10 minutes
        const weatherTypes = ['clear', 'cloudy', 'foggy', 'storm'];
        let currentWeatherIndex = 0;

        setInterval(() => {
            currentWeatherIndex = (currentWeatherIndex + 1) % weatherTypes.length;
            this.weatherSystem.setWeather(weatherTypes[currentWeatherIndex]);
        }, 5 * 60 * 1000 + Math.random() * 5 * 60 * 1000); // Random time between 5-10 minutes
    }

    update(deltaTime) {
        // Handle input first
        this.handleInput(deltaTime);
        
        // Then update input manager to clear the pressed keys
        this.inputManager.update();
        
        // Update physics
        this.physicsWorld.world.step(1/60, deltaTime, 3);
        
        // Update camera
        this.cameraManager.update(deltaTime);
        
        // Update vehicle factory
        this.vehicleFactory.update(deltaTime);
        
        // Update ammo display if player vehicle exists
        if (this.playerVehicle && this.ammoDisplay) {
            this.ammoDisplay.updateAmmo(this.playerVehicle.getAmmo());
            this.ammoDisplay.setVisible(true);
        } else if (this.ammoDisplay) {
            this.ammoDisplay.setVisible(false);
        }
        
        // Update debug visualization
        if (this.debugManager) {
            this.debugManager.update();
        }

        // Update player vehicle and handle respawn
        if (this.playerVehicle) {
            this.playerVehicle.update(deltaTime);

            // Check for power-up collisions
            if (this.powerUpSystem && this.playerVehicle.vehicle) {
                const vehicleBody = this.playerVehicle.vehicle.chassisBody;
                for (const [powerUpId, powerUp] of this.powerUpSystem.powerUps) {
                    // Skip if power-up is already collected
                    if (powerUp.collected) continue;
                    
                    const distance = vehicleBody.position.distanceTo(powerUp.body.position);
                    if (distance < 3.0) { // Increased collision distance to match new size
                        console.log('Power-up collision detected:', {
                            powerUpId,
                            type: powerUp.type.id,
                            distance
                        });
                        this.handlePowerUpCollision(powerUpId);
                        break; // Exit loop after handling one collision
                    }
                }
            }

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

        // Update power-up system
        if (this.powerUpSystem) {
            this.powerUpSystem.update(deltaTime);
            
            // Update power-up spawn timer
            this.powerUpSpawnTimer += deltaTime;
            if (this.powerUpSpawnTimer >= this.powerUpSpawnInterval) {
                this.spawnRandomPowerUp();
                this.powerUpSpawnTimer = 0;
            }
            
            // Check for power-up collisions - use a single consistent distance check
            if (this.playerVehicle && this.playerVehicle.vehicle) {
                const playerPos = this.playerVehicle.vehicle.chassisBody.position;
                for (const [id, powerUp] of this.powerUpSystem.powerUps) {
                    const distance = playerPos.distanceTo(powerUp.body.position);
                    if (distance < 2.0 && !powerUp.collected) { // Add collected check
                        console.log('Power-up collision detected', {
                            powerUpId: id,
                            type: powerUp.type.id,
                            distance
                        });
                        this.handlePowerUpCollision(id);
                        // Mark power-up as collected to prevent multiple collections
                        powerUp.collected = true;
                    }
                }
            }
        }
        
        // Update power-up display
        if (this.powerUpDisplay) {
            this.powerUpDisplay.update();
        }

        // Handle mine deployment
        if (this.inputState.deployMine && this.inputState.lookingBack && this.playerVehicle && this.playerVehicle.vehicle) {
            const vehiclePosition = this.playerVehicle.vehicle.chassisBody.position;
            // Get vehicle's backward direction
            const direction = new THREE.Vector3();
            this.playerVehicle.vehicle.chassisBody.quaternion.vmult(new CANNON.Vec3(0, 0, -1), direction);
            
            // Place mine behind the vehicle
            const minePosition = new THREE.Vector3(
                vehiclePosition.x - direction.x * 2, // 2 units behind
                vehiclePosition.y - 0.5, // Slightly lower than vehicle
                vehiclePosition.z - direction.z * 2
            );
            
            // Try to deploy mine
            const mineId = this.mineSystem.createMine(minePosition);
            if (mineId !== null) {
                console.log('Mine deployed at position:', minePosition);
                
                // Update mine counter in HUD to show remaining mines
                if (this.mineDisplay) {
                    this.mineDisplay.updateCount(this.mineSystem.currentMines);
                }
            } else {
                console.log('No mines available to deploy');
            }
            
            this.inputState.deployMine = false; // Reset flag
        }
        
        // Update mine system
        this.mineSystem.update(deltaTime);
        
        // Update mine display when mines are resupplied
        if (this.mineDisplay && this.mineSystem) {
            this.mineDisplay.updateCount(this.mineSystem.currentMines);
        }
        
        // Check for collisions between vehicles and mines
        if (this.playerVehicle && this.playerVehicle.vehicle) {
            for (const [mineId, mine] of this.mineSystem.mines.entries()) {
                if (!mine.active) continue;
                
                const minePos = mine.body.position;
                const vehiclePos = this.playerVehicle.vehicle.chassisBody.position;
                const distance = minePos.distanceTo(vehiclePos);
                
                if (distance < 2.0) { // Collision threshold
                    console.log(`Vehicle hit mine ${mineId}`);
                    this.mineSystem.explodeMine(mineId);
                    // Apply damage using the damage system
                    if (this.playerVehicle.damageSystem) {
                        this.playerVehicle.damageSystem.applyDamage(50, minePos); // 50 damage per mine, pass mine position
                        console.log('Applied mine damage to vehicle');
                    }
                }
            }
        }

        // Visual feedback for looking back
        if (this.inputState.lookingBack) {
            console.log('Looking back - ready to deploy mine');
            // TODO: Add visual indicator for looking back
        }

        // Visual feedback for mine deployment
        if (this.inputState.deployMine && this.inputState.lookingBack) {
            console.log('Deploying mine...');
            // TODO: Add visual effect for mine deployment
            
            // Reset deploy flag
            this.inputState.deployMine = false;
        }

        // Update time system
        this.timeSystem.updateTime();

        // Update weather system
        this.weatherSystem.update(deltaTime);

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

        // Update brake lights
        this.playerVehicle.setBraking(brakeKey);

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
        
        // Set up input manager for vehicle control
        if (this.playerVehicle) {
            this.playerVehicle.inputManager = this.inputManager;
            this.cameraManager.setTarget(this.playerVehicle);
        }

        // Update health display visibility
        if (this.healthDisplay) {
            console.log(`Setting health display visibility: ${this.playerVehicle !== null}`);
            this.healthDisplay.setVisible(this.playerVehicle !== null);
        }
    }

    _setupControls() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mouseup', this.handleMouseUp);
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

    spawnRandomPowerUp() {
        console.log('Attempting to spawn power-up...');
        console.log('Current power-up system state:', {
            hasSystem: !!this.powerUpSystem,
            hasWorld: !!this.physicsWorld,
            hasScene: !!this.sceneManager.scene,
            powerUpCount: this.powerUpSystem?.powerUps?.size || 0
        });
        
        if (!this.powerUpSystem) {
            console.error('Power-up system not initialized');
            return;
        }
        
        // Get random position on the map
        const x = (Math.random() - 0.5) * 50; // Reduced range for testing
        const z = (Math.random() - 0.5) * 50;
        const position = new THREE.Vector3(x, 0.5, z);
        
        // Get random power-up type
        const types = Object.values(POWER_UP_TYPES);
        if (!types || types.length === 0) {
            console.error('No power-up types available:', {
                types: types,
                POWER_UP_TYPES: POWER_UP_TYPES
            });
            return;
        }
        
        const type = types[Math.floor(Math.random() * types.length)];
        
        console.log('Spawning power-up:', {
            type: type.id,
            position: { x, y: 0.5, z },
            availableTypes: types.map(t => t.id)
        });
        
        try {
            // Create power-up
            const powerUpId = this.powerUpSystem.createPowerUp(position, type);
            console.log('Power-up created successfully:', {
                id: powerUpId,
                type: type.id,
                position: position
            });
            
            // Verify power-up was added to the system
            console.log('Power-up system state after creation:', {
                powerUpCount: this.powerUpSystem.powerUps.size,
                hasPowerUp: this.powerUpSystem.powerUps.has(powerUpId)
            });
        } catch (error) {
            console.error('Failed to create power-up:', error);
        }
    }
    
    handlePowerUpCollision(powerUpId) {
        if (!this.powerUpSystem || !this.playerVehicle) {
            console.error('Cannot handle power-up collision: missing powerUpSystem or playerVehicle');
            return;
        }

        const powerUp = this.powerUpSystem.powerUps.get(powerUpId);
        if (!powerUp || powerUp.collected) return; // Skip if already collected

        // Mark as collected immediately to prevent multiple collections
        powerUp.collected = true;
        
        const success = this.powerUpSystem.applyPowerUp(this.playerVehicle, powerUpId);
        if (success) {
            console.log('Power-up applied successfully');
            // Remove the power-up
            this.powerUpSystem.removePowerUp(powerUpId);
        } else {
            // If application failed, unmark as collected so it can be collected again
            powerUp.collected = false;
        }
    }
    
    handleMineCollision(mine, vehicle) {
        console.log('Vehicle hit mine:', {
            vehicleId: vehicle.id,
            minePosition: mine.position,
            damage: mine.damage
        });

        vehicle.takeDamage(mine.damage);
        mine.explode();
    }
    
    cleanup() {
        // ... existing code ...
        
        // Cleanup power-up system
        this.powerUpSystem.cleanup();
        
        // Cleanup power-up display
        this.powerUpDisplay.cleanup();
        
        // Cleanup ammo display
        if (this.ammoDisplay) {
            this.ammoDisplay.cleanup();
        }
        
        // ... existing code ...

        // Remove mine-related event listeners
        window.removeEventListener('mousedown', this.handleMouseDown);
        window.removeEventListener('mouseup', this.handleMouseUp);

        // Cleanup mine system
        this.mineSystem.cleanup();
    }

    handleKeyDown(event) {
        if (event.key === 'r' || event.key === 'R') {
            this.inputState.lookingBack = true;
            if (this.playerVehicle) {
                this.playerVehicle.setLookingBack(true);
            }
        }
        
        // Add time test mode toggle
        if (event.key === 'y' || event.key === 'Y') {
            this.timeSystem.toggleTestMode();
        }
    }

    handleKeyUp(event) {
        if (event.key === 'r' || event.key === 'R') {
            this.inputState.lookingBack = false;
            if (this.playerVehicle) {
                this.playerVehicle.setLookingBack(false);
            }
        }
    }

    handleMouseDown(event) {
        // Right click for mine deployment
        if (event.button === 2) {
            event.preventDefault();
            this.inputState.deployMine = true;
        }
    }

    handleMouseUp(event) {
        if (event.button === 2) {
            this.inputState.deployMine = false;
        }
    }

    handleCollision(event) {
        const bodyA = event.bodyA;
        const bodyB = event.bodyB;

        // Check if either body is a power-up (collision group 2)
        let powerUpBody, vehicleBody;
        if (bodyA.collisionFilterGroup === 2) {
            powerUpBody = bodyA;
            vehicleBody = bodyB;
        } else if (bodyB.collisionFilterGroup === 2) {
            powerUpBody = bodyB;
            vehicleBody = bodyA;
        }

        // If we found a power-up collision
        if (powerUpBody && vehicleBody) {
            // Find the power-up ID
            let powerUpId = null;
            for (const [id, powerUp] of this.powerUpSystem.powerUps) {
                if (powerUp.body === powerUpBody) {
                    powerUpId = id;
                    break;
                }
            }

            if (powerUpId !== null) {
                console.log('Power-up collected:', powerUpId);
                // Apply the power-up effect
                this.powerUpSystem.applyPowerUp(this.playerVehicle, powerUpId);
            }
        }
    }

    // Add method to set time zone
    setTimeZone(timeZone) {
        this.timeSystem.setTimeZone(timeZone);
    }

    // Add method to set time scale
    setTimeScale(scale) {
        this.timeSystem.setTimeScale(scale);
    }

    // Add method to get current time
    getCurrentTime() {
        return this.timeSystem.getCurrentTime();
    }

    // Add method to get time of day
    getTimeOfDay() {
        return this.timeSystem.getTimeOfDay();
    }
} 