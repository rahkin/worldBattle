import * as THREE from 'three';
import { World } from './World.js';
import { EventBus } from '../../core/EventBus.js';
import { SceneManager } from '../systems/SceneManager.js';
import { VehicleSystem } from '../systems/VehicleSystem.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { InputSystem } from '../systems/InputSystem.js';
import { CameraSystem } from '../systems/CameraSystem.js';
import { TerrainSystem } from '../systems/TerrainSystem.js';
import { ResourceSystem } from '../systems/ResourceSystem.js';
import * as CANNON from 'cannon-es';
import { TerrainComponent } from '../components/TerrainComponent.js';
import { VehicleSelection } from '../../ui/VehicleSelection.js';
import { WorldManager } from '../systems/WorldManager.js';
import { WorldGenerationSystem } from '../systems/WorldGenerationSystem.js';
import { TileFetcherSystem } from '../systems/TileFetcherSystem.js';
import { NetworkSystem } from '../systems/NetworkSystem.js';

export class Game {
    constructor(options = {}) {
        this.options = {
            testing: false,
            debug: false,
            ...options
        };
        
        this.world = null;
        this.eventBus = null;
        this.systems = new Map();
        this.initialized = false;
        
        // System references for quick access
        this.sceneManager = null;
        this.physicsSystem = null;
        this.cameraSystem = null;
        this.terrainSystem = null;
        this.vehicleSystem = null;
        this.inputSystem = null;
    }

    async init() {
        try {
            console.log('Game init - Starting initialization');
            
            // Initialize core systems first
            await this.world.addSystem('SceneManager', new SceneManager(this.world));
            await this.world.addSystem('CameraSystem', new CameraSystem(this.world));
            
            // Initialize the camera system explicitly
            const cameraSystem = this.world.getSystem('CameraSystem');
            if (!cameraSystem) {
                throw new Error('Failed to get CameraSystem after adding it');
            }
            
            const cameraInitialized = await cameraSystem.init();
            if (!cameraInitialized) {
                throw new Error('Failed to initialize CameraSystem');
            }
            
            console.log('Core systems initialized');

            // Add remaining systems
            await this.world.addSystem('PhysicsSystem', new PhysicsSystem(this.world));
            await this.world.addSystem('VehicleSystem', new VehicleSystem(this.world));
            await this.world.addSystem('WorldManager', new WorldManager(this.world));
            await this.world.addSystem('WorldGenerationSystem', new WorldGenerationSystem(this.world));
            await this.world.addSystem('TileFetcherSystem', new TileFetcherSystem(this.world));
            await this.world.addSystem('InputSystem', new InputSystem(this.world));
            await this.world.addSystem('NetworkSystem', new NetworkSystem(this.world));
            
            console.log('All systems initialized');

            // Create initial player vehicle
            const vehicleSystem = this.world.getSystem('VehicleSystem');
            if (!vehicleSystem) {
                throw new Error('VehicleSystem not found after initialization');
            }

            this.playerVehicle = vehicleSystem.createVehicle('muscle', { 
                position: { x: 0, y: 5, z: 0 }
            });
            
            if (!this.playerVehicle) {
                throw new Error('Failed to create player vehicle');
            }

            // Set camera target after vehicle creation
            if (!cameraSystem.setTarget(this.playerVehicle)) {
                throw new Error('Failed to set camera target to player vehicle');
            }

            console.log('Game initialization complete:', {
                hasPlayerVehicle: !!this.playerVehicle,
                vehicleId: this.playerVehicle ? this.playerVehicle.id : null,
                systemsInitialized: Array.from(this.world.systems.keys())
            });

            return true;
        } catch (error) {
            console.error('Game initialization failed:', error);
            throw error; // Re-throw to be handled by caller
        }
    }

    async selectVehicle(vehicleType) {
        console.log('Selecting vehicle:', {
            type: vehicleType,
            cameraSystem: {
                exists: !!this.cameraSystem,
                initialized: this.cameraSystem?.initialized || false,
                hasCamera: !!this.cameraSystem?.camera
            }
        });

        try {
            // Verify camera system is initialized
            if (!this.cameraSystem?.initialized) {
                console.log('Camera system not initialized, initializing...');
                await this.cameraSystem.init();
            }

            // Create spawn position slightly above ground
            const spawnPosition = new THREE.Vector3(0, 5, 0);
            
            // Spawn the vehicle
            const vehicle = await this.vehicleSystem.createVehicle(vehicleType, spawnPosition);
            if (!vehicle) {
                throw new Error('Failed to create vehicle');
            }

            // Log vehicle creation
            console.log('Vehicle created:', {
                id: vehicle.id,
                type: vehicleType,
                components: Array.from(vehicle.components.keys()),
                position: spawnPosition
            });

            // Get mesh component for logging
            const meshComponent = vehicle.getComponent('MeshComponent');
            console.log('Setting camera target to vehicle mesh:', {
                meshPosition: meshComponent?.mesh?.position.toArray(),
                meshQuaternion: meshComponent?.mesh?.quaternion.toArray()
            });

            // Set camera target and verify
            const targetSet = this.cameraSystem.setTarget(vehicle);
            if (!targetSet) {
                throw new Error('Failed to set camera target');
            }

            // Enable input for the vehicle
            this.inputSystem.setTarget(vehicle);

            console.log('Vehicle setup complete:', {
                type: vehicleType,
                entityId: vehicle.id,
                cameraTargetSet: targetSet,
                systems: Array.from(this.world.systems.keys())
            });

            // Start game loop if not running
            if (!this.isRunning) {
                this.start();
            }

            return vehicle;
        } catch (error) {
            console.error('Error selecting vehicle:', error);
            throw error;
        }
    }

    update(deltaTime) {
        if (!this.isRunning) return;

        try {
            // Update world systems
            this.world.update(deltaTime);

            // Ensure we have all required components for rendering
            if (!this.sceneManager || !this.sceneManager.getScene() || !this.sceneManager.getCamera()) {
                console.error('Missing required components for rendering:', {
                    hasSceneManager: !!this.sceneManager,
                    hasScene: this.sceneManager ? !!this.sceneManager.getScene() : false,
                    hasCamera: this.sceneManager ? !!this.sceneManager.getCamera() : false
                });
                return;
            }

            // Render scene
            this.sceneManager.render();

            // Schedule next frame
            this.animationFrameId = requestAnimationFrame(() => this.update());
        } catch (error) {
            console.error('Error in game loop:', error);
            this.stop();
        }
    }

    start() {
        console.log('Starting game loop...');
        this.isRunning = true;
        this.lastTime = performance.now();
        this.update();
    }

    stop() {
        console.log('Stopping game loop');
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    cleanup() {
        this.stop();
        
        // Clean up all systems
        if (this.world) {
            this.world.cleanup();
        }

        if (this.eventBus) {
            this.eventBus.clear();
        }

        if (this.vehicleSelection) {
            this.vehicleSelection.cleanup();
        }

        // Clear references
        this.world = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sceneManager = null;
        this.physicsWorld = null;
        this.playerVehicle = null;
        this.vehicleSelection = null;
        this.inputSystem = null;
        this.cameraSystem = null;
        this.scenes.clear();
        this.activeScene = null;
    }
} 