import { SceneManager } from '../rendering/SceneManager.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';
import { VehicleFactory } from '../physics/VehicleFactory.js';
import { InputManager } from './InputManager.js';
import { CameraManager } from '../rendering/CameraManager.js';
import { GameLoop } from './GameLoop.js';
import { DebugManager } from './DebugManager.js';
import { VehicleSelector } from '../ui/VehicleSelector.js';
import { HealthBar } from '../ui/HealthBar.js';
import { BaseCar } from '../physics/vehicles/BaseCar.js';
import { TestTarget } from '../physics/TestTarget.js';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { PowerUpSystem, POWER_UP_TYPES } from '../physics/PowerUpSystem.js';
import { PowerUpDisplay } from '../ui/PowerUpDisplay.js';
import { AmmoDisplay } from '../ui/AmmoDisplay.js';
import { MineSystem } from '../physics/MineSystem.js';
import { MineDisplay } from '../ui/MineDisplay.js';
import { TimeSystem } from './TimeSystem.js';
import { WeatherSystem } from './WeatherSystem.js';
import { CollisionSystem, COLLISION_GROUPS, COLLISION_MASKS } from '../physics/CollisionSystem.js';

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

        // Initialize UI components as null
        this.healthDisplay = null;
        this.ammoDisplay = null;
        this.mineDisplay = null;
        this.powerUpDisplay = null;

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
        
        // Initialize power-up system
        this.powerUpSystem = new PowerUpSystem(this.physicsWorld.world, this.sceneManager.scene, this.powerUpDisplay);
        this.powerUpSystem.game = this; // Set the game instance
        
        // Initialize mine system
        this.mineSystem = new MineSystem(this.physicsWorld.world, this.sceneManager.scene);
        console.log('Mine system initialized');

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

        // Initialize collision system
        this.collisionSystem = new CollisionSystem(this.physicsWorld.world);
        
        // Register collision handlers
        this.collisionSystem.registerHandler('vehicle-powerup', this.handlePowerUpCollision.bind(this));
        this.collisionSystem.registerHandler('vehicle-mine', this.handleMineCollision.bind(this));

        // Add collision event listener for mines
        this.physicsWorld.world.addEventListener('beginContact', (event) => {
            this.mineSystem.handleCollision(event);
        });
    }

    async init() {
        try {
            console.log('Starting game initialization...');

            // Initialize core systems first
            console.log('Initializing scene manager...');
            this.sceneManager.init();

            console.log('Initializing time system...');
            this.timeSystem = new TimeSystem(this.sceneManager.scene);
            this.sceneManager.scene.timeSystem = this.timeSystem;

            console.log('Initializing physics world...');
            this.physicsWorld.init();

            console.log('Initializing camera...');
            this.cameraManager.init(this.sceneManager.scene);

            // Initialize UI components
            console.log('Initializing UI components...');
            this.healthDisplay = new HealthBar();
            this.ammoDisplay = new AmmoDisplay();
            this.mineDisplay = new MineDisplay();
            this.powerUpDisplay = new PowerUpDisplay(this.sceneManager.scene, this.cameraManager.camera);

            // Initialize gameplay systems
            console.log('Initializing gameplay systems...');
            this.vehicleFactory = new VehicleFactory(this.physicsWorld.world, this.sceneManager.scene, this);
            this.powerUpSystem = new PowerUpSystem(this.physicsWorld.world, this.sceneManager.scene, this.powerUpDisplay);
            this.powerUpSystem.game = this;

            // Initialize debug manager last
            console.log('Initializing debug manager...');
            this.debugManager = new DebugManager(this.sceneManager.scene, this.physicsWorld.world);
            this.debugManager.init();

            // Initialize vehicle selector and show it
            console.log('Initializing vehicle selector...');
            this.vehicleSelector = new VehicleSelector(this);
            this.vehicleSelector.show();

            // Create test target wall
            console.log('Creating test target...');
            this.testTarget = new TestTarget(
                this.physicsWorld.world,
                this.sceneManager.scene,
                this.cameraManager.camera,
                new CANNON.Vec3(0, 4, -20) // Position the wall in front of the vehicle
            );

            // Set up controls and weather
            this._setupControls();
            this.weatherSystem.setWeather('clear');
            this.setupWeatherCycle();

            // Start game loop
            console.log('Starting game loop...');
            this.gameLoop.start(this.update.bind(this));

            // Start collision system
            this.collisionSystem.start();

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
        this.inputManager.update();
        
        // Update physics
        this.physicsWorld.world.step(1/60, deltaTime, 3);
        
        // Update core systems
        this.cameraManager.update(deltaTime);
        this.vehicleFactory.update(deltaTime);
        this.timeSystem.updateTime();
        this.weatherSystem.update(deltaTime);
        
        // Update debug visualization
        if (this.debugManager) {
            this.debugManager.update();
        }

        // Update player vehicle and related systems
        if (this.playerVehicle) {
            this.playerVehicle.update(deltaTime);

            // Update UI displays
            if (this.ammoDisplay) {
                const currentAmmo = this.playerVehicle.getAmmo() || 0;
                this.ammoDisplay.updateAmmo(currentAmmo);
                this.ammoDisplay.setVisible(true);
            }

            if (this.healthDisplay && this.playerVehicle.damageSystem) {
                const currentHealth = this.playerVehicle.damageSystem.currentHealth || 100;
                const maxHealth = this.playerVehicle.damageSystem.options?.maxHealth || 100;
                this.healthDisplay.update(currentHealth, maxHealth);
            }

            // Update respawn countdown
            if (this.isRespawning) {
                this.respawnCountdown -= deltaTime;
                this._updateRespawnUI(this.respawnCountdown);
                
                if (this.respawnCountdown <= 0) {
                    console.log('Respawn countdown complete, initiating respawn...');
                    this._respawnVehicle();
                }
            }
        } else if (this.ammoDisplay) {
            this.ammoDisplay.setVisible(false);
        }

        // Update power-up system and check collisions
        if (this.powerUpSystem) {
            this.powerUpSystem.update(deltaTime);
            
            // Update power-up spawn timer
            this.powerUpSpawnTimer += deltaTime;
            if (this.powerUpSpawnTimer >= this.powerUpSpawnInterval) {
                this.spawnRandomPowerUp();
                this.powerUpSpawnTimer = 0;
            }
        }

        // Update power-up display
        if (this.powerUpDisplay) {
            this.powerUpDisplay.update(deltaTime);
        }

        // Update mine system
        if (this.mineSystem) {
            this.mineSystem.update(deltaTime);
            
            // Handle mine deployment
            if (this.inputState.deployMine && this.playerVehicle && this.mineSystem) {
                console.log('Attempting to deploy mine');
                
                // Get vehicle position and orientation
                const vehiclePosition = this.playerVehicle._vehicle.chassisBody.position;
                const vehicleQuaternion = this.playerVehicle._vehicle.chassisBody.quaternion;
                
                // Calculate backward direction vector
                const backward = new THREE.Vector3(0, 0, 1);
                backward.applyQuaternion(new THREE.Quaternion(
                    vehicleQuaternion.x,
                    vehicleQuaternion.y,
                    vehicleQuaternion.z,
                    vehicleQuaternion.w
                ));

                // Get vehicle height - use bounding box if available, otherwise use default
                let vehicleHeight = 2; // Default height
                if (this.playerVehicle.chassisMesh) {
                    // Force bounding box update
                    this.playerVehicle.chassisMesh.updateMatrixWorld(true);
                    const boundingBox = new THREE.Box3().setFromObject(this.playerVehicle.chassisMesh);
                    vehicleHeight = boundingBox.max.y - boundingBox.min.y;
                }
                
                // Calculate mine position:
                // - 2 units behind vehicle
                // - Above the vehicle's top (vehicle position + half height + extra clearance)
                // - Apply a small downward velocity when deploying
                const deployHeight = vehiclePosition.y + (vehicleHeight / 2) + 1;
                const minePosition = new CANNON.Vec3(
                    vehiclePosition.x - backward.x * 2,
                    deployHeight,
                    vehiclePosition.z - backward.z * 2
                );

                console.log('Creating mine at position:', {
                    x: minePosition.x,
                    y: minePosition.y,
                    z: minePosition.z,
                    vehicleY: vehiclePosition.y,
                    deployHeight: deployHeight,
                    vehicleHeight: vehicleHeight
                });

                const mineId = this.mineSystem.createMine(
                    minePosition,
                    {
                        initialVelocity: new CANNON.Vec3(
                            -backward.x * 2, // Add backward momentum
                            -3,             // Stronger downward velocity
                            -backward.z * 2
                        ),
                        deployHeight: deployHeight
                    },
                    this.playerVehicle._vehicle.chassisBody.vehicleId
                );
                
                if (mineId !== null) {
                    console.log('Mine deployed successfully:', mineId);
                    this.mineDisplay.updateCount(this.mineSystem.currentMines, this.mineSystem.maxMines);
                } else {
                    console.log('Failed to deploy mine - no mines available');
                }
                
                this.inputState.deployMine = false;
            }

            // Update mine display
            if (this.mineDisplay && this.mineSystem) {
                this.mineDisplay.updateCount(this.mineSystem.currentMines, this.mineSystem.maxMines);
            }
        }

        // Update test target
        if (this.testTarget) {
            this.testTarget.update();
        }

        // Render scene
        this.sceneManager.render(this.cameraManager.camera);
    }

    _updateRespawnUI(countdown) {
        // Create or update respawn counter element
        let respawnElement = document.getElementById('respawn-counter');
        if (!respawnElement) {
            respawnElement = document.createElement('div');
            respawnElement.id = 'respawn-counter';
            respawnElement.style.position = 'absolute';
            respawnElement.style.top = '50%';
            respawnElement.style.left = '50%';
            respawnElement.style.transform = 'translate(-50%, -50%)';
            respawnElement.style.fontSize = '48px';
            respawnElement.style.color = 'white';
            respawnElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
            respawnElement.style.zIndex = '1000';
            document.body.appendChild(respawnElement);
        }

        if (countdown > 0) {
            respawnElement.textContent = `Respawning in ${Math.ceil(countdown)}`;
            respawnElement.style.display = 'block';
        } else {
            respawnElement.style.display = 'none';
        }
    }

    _respawnVehicle() {
        if (!this.playerVehicle) return;

        console.log('Starting vehicle respawn...');
        
        // Get the vehicle type from the correct property
        const vehicleType = this.playerVehicle.type || 'base';
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
        }

        // Reset ammo
        if (this.playerVehicle) {
            this.playerVehicle.ammo = this.playerVehicle.isHeavyVehicle ? 200 : 500;
            if (this.ammoDisplay) {
                this.ammoDisplay.updateAmmo(this.playerVehicle.ammo);
            }
        }

        // Reset mines
        if (this.mineSystem) {
            this.mineSystem.resetMines();
            if (this.mineDisplay) {
                this.mineDisplay.updateCount(0, this.mineSystem.maxMines);
            }
        }

        // Reset power-ups
        if (this.powerUpSystem) {
            this.powerUpSystem.clearActiveEffects();
            if (this.powerUpDisplay) {
                this.powerUpDisplay.clear();
            }
        }

        // Reset respawn state
        this.respawnCountdown = 0;
        this.isRespawning = false;

        // Hide respawn counter
        const respawnElement = document.getElementById('respawn-counter');
        if (respawnElement) {
            respawnElement.style.display = 'none';
        }

        console.log('Vehicle respawn complete with full reset');
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

        // Add mine explosion event listener
        window.addEventListener('mineExplosion', (event) => {
            const { vehicleId, damage, minePosition, explosionForce } = event.detail;
            console.log('Mine explosion event received:', { vehicleId, damage, minePosition });
            
            // Find the vehicle that hit the mine
            if (this.playerVehicle && 
                this.playerVehicle._vehicle && 
                this.playerVehicle._vehicle.chassisBody.vehicleId === vehicleId) {
                
                // Schedule damage application for next frame to avoid physics step conflicts
                requestAnimationFrame(() => {
                    // Double check vehicle still exists and isn't already destroyed
                    if (this.playerVehicle && 
                        this.playerVehicle._vehicle && 
                        this.playerVehicle.takeDamage &&
                        !this.isRespawning) {
                        
                        console.log('Applying mine damage to vehicle:', damage);
                        this.playerVehicle.takeDamage(damage);
                        
                        // Apply explosion force to the vehicle if it still exists
                        if (this.playerVehicle._vehicle && this.playerVehicle._vehicle.chassisBody) {
                            const chassisBody = this.playerVehicle._vehicle.chassisBody;
                            chassisBody.applyImpulse(explosionForce, new CANNON.Vec3(0, 0, 0));
                            
                            // Add some angular velocity for spin effect
                            chassisBody.angularVelocity.set(
                                (Math.random() - 0.5) * 5,
                                (Math.random() - 0.5) * 5,
                                (Math.random() - 0.5) * 5
                            );
                        }
                    }
                });
            }
        });

        // Add vehicle destroyed event listener
        window.addEventListener('vehicleDestroyed', (event) => {
            const { vehicleId } = event.detail;
            if (this.playerVehicle && this.playerVehicle.id === vehicleId) {
                console.log('Starting respawn process for vehicle:', vehicleId);
                
                // Hide the vehicle meshes
                if (this.playerVehicle.chassisMesh) {
                    this.playerVehicle.chassisMesh.visible = false;
                }
                if (this.playerVehicle.wheelMeshes) {
                    this.playerVehicle.wheelMeshes.forEach(wheel => {
                        if (wheel) wheel.visible = false;
                    });
                }

                // Disable vehicle controls by removing physics vehicle reference
                if (this.playerVehicle._vehicle) {
                    // Store the vehicle type for respawn
                    const vehicleType = this.playerVehicle.options.type;
                    // Clear the vehicle reference
                    this.playerVehicle._vehicle = null;
                    // Store the type for respawn
                    this.playerVehicle.options.type = vehicleType;
                }

                // Start respawn countdown
                this.isRespawning = true;
                this.respawnCountdown = 10.0;
            }
        });
    }

    handleInput(deltaTime) {
        // Early return if no player vehicle, physics vehicle, or during respawn
        if (!this.playerVehicle || !this.playerVehicle._vehicle || this.isRespawning) {
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
        if (this.playerVehicle.setBraking) {
            this.playerVehicle.setBraking(brakeKey);
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

        // Handle mine deployment
        if (this.inputState.deployMine && this.playerVehicle && this.mineSystem) {
            console.log('Attempting to deploy mine');
            
            // Get vehicle position and orientation
            const vehiclePosition = this.playerVehicle._vehicle.chassisBody.position;
            const vehicleQuaternion = this.playerVehicle._vehicle.chassisBody.quaternion;
            
            // Calculate backward direction vector
            const backward = new THREE.Vector3(0, 0, 1);
            backward.applyQuaternion(new THREE.Quaternion(
                vehicleQuaternion.x,
                vehicleQuaternion.y,
                vehicleQuaternion.z,
                vehicleQuaternion.w
            ));

            // Get vehicle height - use bounding box if available, otherwise use default
            let vehicleHeight = 2; // Default height
            if (this.playerVehicle.chassisMesh) {
                // Force bounding box update
                this.playerVehicle.chassisMesh.updateMatrixWorld(true);
                const boundingBox = new THREE.Box3().setFromObject(this.playerVehicle.chassisMesh);
                vehicleHeight = boundingBox.max.y - boundingBox.min.y;
            }
            
            // Calculate mine position:
            // - 2 units behind vehicle
            // - Above the vehicle's top (vehicle position + half height + extra clearance)
            // - Apply a small downward velocity when deploying
            const deployHeight = vehiclePosition.y + (vehicleHeight / 2) + 1;
            const minePosition = new CANNON.Vec3(
                vehiclePosition.x - backward.x * 2,
                deployHeight,
                vehiclePosition.z - backward.z * 2
            );

            console.log('Creating mine at position:', {
                x: minePosition.x,
                y: minePosition.y,
                z: minePosition.z,
                vehicleY: vehiclePosition.y,
                deployHeight: deployHeight,
                vehicleHeight: vehicleHeight
            });

            const mineId = this.mineSystem.createMine(
                minePosition,
                {
                    initialVelocity: new CANNON.Vec3(
                        -backward.x * 2, // Add backward momentum
                        -3,             // Stronger downward velocity
                        -backward.z * 2
                    ),
                    deployHeight: deployHeight
                },
                this.playerVehicle._vehicle.chassisBody.vehicleId
            );
            
            if (mineId !== null) {
                console.log('Mine deployed successfully:', mineId);
                this.mineDisplay.updateCount(this.mineSystem.currentMines, this.mineSystem.maxMines);
            } else {
                console.log('Failed to deploy mine - no mines available');
            }
            
            this.inputState.deployMine = false;
        }
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
    
    handleCollision(event) {
        const bodyA = event.bodyA;
        const bodyB = event.bodyB;

        // First check for power-up collisions (group 2)
        let powerUpBody, vehicleBody;
        if (bodyA && bodyB) {
            if (bodyA.collisionFilterGroup === 2) {
                powerUpBody = bodyA;
                vehicleBody = bodyB;
            } else if (bodyB.collisionFilterGroup === 2) {
                powerUpBody = bodyB;
                vehicleBody = bodyA;
            }
        }

        // Handle power-up collisions first
        if (powerUpBody && vehicleBody && vehicleBody.userData?.vehicle === this.playerVehicle) {
            // Find the power-up ID
            let powerUpId = null;
            for (const [id, powerUp] of this.powerUpSystem.powerUps) {
                if (powerUp.body === powerUpBody && !powerUp.collected) {
                    powerUpId = id;
                    break;
                }
            }

            if (powerUpId !== null) {
                this.handlePowerUpCollision(powerUpId);
                return; // Exit early after handling power-up collision
            }
        }

        // Then check for mine collisions (group 4)
        if (bodyA && bodyB) {
            const mineBody = bodyA.collisionFilterGroup === 4 ? bodyA : (bodyB.collisionFilterGroup === 4 ? bodyB : null);
            const vehicleBody = mineBody === bodyA ? bodyB : bodyA;

            // Only proceed with mine collision if it's not a power-up collision
            if (mineBody && vehicleBody && vehicleBody.vehicleId && !powerUpBody) {
                const mine = this.mineSystem.mines.get(mineBody.mineId);
                if (mine && mine.isArmed && !mine.isExploded) {
                    console.log('Mine collision detected:', {
                        mineId: mine.id,
                        vehicleId: vehicleBody.vehicleId,
                        damage: mine.options.damage
                    });
                    mine.explode();
                }
            }
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
        
        // Pass the game instance for mine power-ups
        const success = this.powerUpSystem.applyPowerUp(this.playerVehicle, powerUpId);
        if (success) {
            console.log('Power-up applied successfully:', powerUp.type.id);
            // Remove the power-up
            this.powerUpSystem.removePowerUp(powerUpId);
        } else {
            console.log('Failed to apply power-up:', powerUp.type.id);
            // If application failed, unmark as collected so it can be collected again
            powerUp.collected = false;
        }
    }
    
    handleMineCollision(event) {
        const { bodyA, bodyB } = event;
        if (!bodyA || !bodyB) return;

        // Find which body is the mine
        const mineBody = bodyA.isMine ? bodyA : (bodyB.isMine ? bodyB : null);
        if (!mineBody) return;

        // Get the other body (should be a vehicle)
        const vehicleBody = mineBody === bodyA ? bodyB : bodyA;
        if (!vehicleBody.vehicleId) return;

        // Only handle collisions with the player's vehicle
        if (vehicleBody.vehicleId === this.playerVehicle.id) {
            const mine = this.mineSystem.mines.get(mineBody.mineId);
            if (mine && mine.isArmed && !mine.isExploded) {
                console.log('Player vehicle hit mine:', {
                    mineId: mine.id,
                    vehicleId: vehicleBody.vehicleId,
                    damage: mine.options.damage
                });

                // Calculate explosion force
                const explosionForce = new CANNON.Vec3();
                explosionForce.copy(vehicleBody.position);
                explosionForce.vsub(mine.body.position, explosionForce);
                explosionForce.normalize();
                explosionForce.scale(1000, explosionForce);

                // Apply damage to vehicle
                this.playerVehicle.takeDamage(mine.options.damage);

                // Apply explosion force
                vehicleBody.applyImpulse(explosionForce, new CANNON.Vec3(0, 0, 0));

                // Trigger mine explosion
                mine.explode();
                this.mineSystem.mines.delete(mine.id);
            }
        }
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

        // Stop collision system
        this.collisionSystem.stop();
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
            console.log('Right click detected for mine deployment');
            this.inputState.deployMine = true;
        }
    }

    handleMouseUp(event) {
        if (event.button === 2) {
            this.inputState.deployMine = false;
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