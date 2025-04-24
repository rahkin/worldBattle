import * as THREE from 'three';
import { World } from './World.js';
import { EventBus } from '../../core/EventBus.js';
import { SceneManager } from '../systems/SceneManager.js';
import { VehicleSystem } from '../systems/VehicleSystem.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { InputSystem } from '../systems/InputSystem.js';
import { CameraSystem } from '../systems/CameraSystem.js';
import { ResourceSystem } from '../systems/ResourceSystem.js';
import * as CANNON from 'cannon-es';
import { VehicleSelection } from '../../ui/VehicleSelection.js';

export class Game {
    constructor(options = {}) {
        // Store options
        this.options = {
            isTest: options.isTest || false,
            world: options.world || new World(),
            eventBus: options.eventBus || new EventBus()
        };

        // Initialize state
        this.isTest = this.options.isTest;
        this.world = this.options.world;
        this.eventBus = this.options.eventBus;
        this.isRunning = false;
        this.lastTime = 0;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.animationFrameId = null;
        this.sceneManager = null;
        this.physicsWorld = null;
        this.cameraSystem = null;
        this.playerVehicle = null;
        this.vehicleSelection = null;
        this.inputSystem = null;
        
        // Scene management
        this.scenes = new Map();
        this.activeScene = null;
    }

    // Add a scene to the game
    addScene(name, scene) {
        console.log(`Adding scene: ${name}`);
        if (this.scenes.has(name)) {
            console.warn(`Scene ${name} already exists, overwriting...`);
        }
        this.scenes.set(name, scene);
        return scene;
    }

    // Set the active scene
    setActiveScene(name) {
        console.log(`Setting active scene to: ${name}`);
        if (!this.scenes.has(name)) {
            throw new Error(`Scene ${name} does not exist`);
        }
        const scene = this.scenes.get(name);
        this.activeScene = scene;
        this.scene = scene;
        return scene;
    }

    // Get a scene by name
    getScene(name) {
        return this.scenes.get(name);
    }

    // Get the active scene
    getActiveScene() {
        return this.activeScene;
    }

    async init() {
        console.log('Initializing game...');
        
        try {
            // Initialize scene manager first
            this.sceneManager = new SceneManager();
            await this.sceneManager.init();
            
            // Add renderer to document and set up display
            const renderer = this.sceneManager.getRenderer();
            if (!renderer) {
                throw new Error('Failed to get renderer from SceneManager');
            }
            this.renderer = renderer;
            renderer.domElement.style.position = 'absolute';
            renderer.domElement.style.top = '0';
            renderer.domElement.style.left = '0';
            document.body.appendChild(renderer.domElement);

            // Initialize physics system
            this.physicsSystem = new PhysicsSystem();
            await this.physicsSystem.init();

            // Create vehicle system with scene reference
            this.vehicleSystem = new VehicleSystem(
                this.sceneManager.getScene(),
                this.physicsSystem.physicsWorld
            );

            // Create input system
            this.inputSystem = new InputSystem();

            // Add systems to world
            this.world.addSystem(this.sceneManager);
            this.world.addSystem(this.physicsSystem);
            this.world.addSystem(this.vehicleSystem);
            this.world.addSystem(this.inputSystem);

            // Initialize systems that need world reference
            await this.vehicleSystem.init(this.world);
            await this.inputSystem.init(this.world);

            // Initialize camera system
            this.cameraSystem = new CameraSystem(this.world);
            this.world.addSystem(this.cameraSystem);
            await this.cameraSystem.init();

            // Set up vehicle selection UI if not in test mode
            if (!this.isTest) {
                this.vehicleSelection = new VehicleSelection({ eventBus: this.eventBus });
                await this.vehicleSelection.init();
                
                // Listen for vehicle selection
                this.eventBus.on('vehicleSelected', async (data) => {
                    console.log('Vehicle selected:', data);
                    await this.selectVehicle(data.vehicleType);
                });
                
                // Show vehicle selection screen
                this.vehicleSelection.show();
            }

            console.log('Game initialization complete');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            throw error;
        }
    }

    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            const hasWebGL = !!(window.WebGLRenderingContext && context);
            const hasDepthTexture = context && context.getExtension('WEBGL_depth_texture');
            return hasWebGL && hasDepthTexture;
        } catch (e) {
            return false;
        }
    }

    initTestEnvironment() {
        // Initialize SceneManager in test mode
        this.sceneManager = new SceneManager({ isTest: true });
        this.scene = this.sceneManager.scene;
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Use renderer from SceneManager
        this.renderer = this.sceneManager.renderer;
        
        // Initialize environment
        this.sceneManager.init({ createEnvironment: true });
    }

    async initRealEnvironment() {
        try {
            // Initialize SceneManager first
            this.sceneManager = new SceneManager();
            await this.world.addSystem(this.sceneManager);
            
            // Get references after initialization
            this.scene = this.sceneManager.getScene();
            this.camera = this.sceneManager.getCamera();
            this.renderer = this.sceneManager.getRenderer();
            
            if (!this.scene || !this.camera || !this.renderer) {
                throw new Error('Failed to initialize scene, camera, or renderer');
            }
        } catch (error) {
            console.error('Failed to initialize real environment:', error);
            throw error;
        }
    }

    initEventListeners() {
        const resizeHandler = () => this.resize();
        window.addEventListener('resize', resizeHandler);
        this._resizeHandler = resizeHandler;
    }

    start() {
        if (this.isRunning) {
            console.warn('Game is already running');
            return;
        }

        console.log('Starting game loop');
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

    async update() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        try {
            // Update active scene if it exists
            if (this.activeScene) {
                this.activeScene.update(deltaTime);
            }

            // Update world systems
            this.world.update(deltaTime);

            // Update camera if we have a player vehicle
            if (this.playerVehicle && this.playerVehicle.mesh && this.cameraSystem) {
                this.cameraSystem.update(deltaTime);
            }

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
            if (this.activeScene) {
                this.activeScene.render();
            } else {
                this.sceneManager.render();
            }

            // Schedule next frame
            this.animationFrameId = requestAnimationFrame(() => this.update());
        } catch (error) {
            console.error('Error in game loop:', error);
            this.stop();
        }
    }

    render() {
        if (!this.sceneManager) {
            console.error('Cannot render: SceneManager is null');
            return;
        }

        try {
            this.sceneManager.render();
        } catch (error) {
            console.error('Error in render:', error);
        }
    }

    resize() {
        if (this.camera && this.renderer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    async cleanup() {
        this.stop();
        
        try {
            // Clean up active scene first
            if (this.activeScene) {
                await this.activeScene.cleanup();
                this.activeScene = null;
            }

            // Clean up all scenes
            for (const [name, scene] of this.scenes) {
                await scene.cleanup();
            }
            this.scenes.clear();

            // Clean up world
            await this.world.cleanup();

            // Clean up event bus
            await this.eventBus.clear();

            if (!this.isTest) {
                if (this._resizeHandler) {
                    window.removeEventListener('resize', this._resizeHandler);
                    this._resizeHandler = null;
                }
            }
            
            if (this.sceneManager) {
                await this.sceneManager.cleanup();
                this.sceneManager = null;
            }
            
            this.scene = null;
            this.camera = null;
            this.renderer = null;

            if (this.vehicleSelection) {
                this.vehicleSelection.cleanup();
                this.vehicleSelection = null;
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
            throw error;
        }
    }

    async selectVehicle(vehicleType) {
        console.log('Selecting vehicle:', vehicleType);
        try {
            // Create spawn position slightly above ground
            const spawnPosition = new THREE.Vector3(0, 5, 0); // Increased height to avoid terrain intersection
            
            // Spawn the vehicle
            const vehicle = await this.vehicleSystem.createVehicle(vehicleType, spawnPosition);
            if (!vehicle) {
                throw new Error('Failed to create vehicle');
            }

            // Store as player vehicle
            this.playerVehicle = vehicle;

            // Get the vehicle's mesh component
            const meshComponent = vehicle.getComponent('MeshComponent');
            if (!meshComponent || !meshComponent.mesh) {
                throw new Error('Vehicle has no mesh component');
            }

            // Set the vehicle as the camera target
            if (this.cameraSystem) {
                const success = this.cameraSystem.setTarget(vehicle);
                if (!success) {
                    console.warn('Failed to set camera target');
                }
            } else {
                console.warn('No camera system available');
            }

            // Start the game loop if not already running
            if (!this.isRunning) {
                this.start();
            }

            console.log('Vehicle spawned successfully:', {
                type: vehicleType,
                position: spawnPosition,
                entityId: vehicle.id,
                hasCameraSystem: !!this.cameraSystem,
                hasInputSystem: !!this.inputSystem
            });

            return vehicle;
        } catch (error) {
            console.error('Error selecting vehicle:', error);
            return null;
        }
    }
} 