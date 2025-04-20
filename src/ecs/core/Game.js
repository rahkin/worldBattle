import * as THREE from 'three';
import { World } from './World.js';
import { EventBus } from '../../core/EventBus.js';
import { SceneManager } from '../systems/SceneManager.js';
import { VehicleSystem } from '../systems/VehicleSystem.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { InputSystem } from '../systems/InputSystem.js';
import { CameraController } from '../systems/CameraController.js';
import { TerrainSystem } from '../systems/TerrainSystem.js';
import { ResourceSystem } from '../systems/ResourceSystem.js';
import * as CANNON from 'cannon-es';
import { TerrainComponent } from '../components/TerrainComponent.js';
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
        this.cameraController = null;
        this.playerVehicle = null;
        this.vehicleSelection = null;
        this.inputSystem = null;
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
            renderer.domElement.style.position = 'absolute';
            renderer.domElement.style.top = '0';
            renderer.domElement.style.left = '0';
            document.body.appendChild(renderer.domElement);

            // Initialize physics system
            this.physicsSystem = new PhysicsSystem();
            await this.physicsSystem.init();

            // Create terrain system
            this.terrainSystem = new TerrainSystem(
                this.sceneManager.getScene(),
                this.physicsSystem.physicsWorld
            );

            // Create vehicle system
            this.vehicleSystem = new VehicleSystem(
                this.sceneManager.getScene(),
                this.physicsSystem.physicsWorld
            );

            // Create input system
            this.inputSystem = new InputSystem();

            // Add systems to world
            this.world.addSystem(this.sceneManager);
            this.world.addSystem(this.physicsSystem);
            this.world.addSystem(this.terrainSystem);
            this.world.addSystem(this.vehicleSystem);
            this.world.addSystem(this.inputSystem);

            // Initialize systems that need world reference
            await this.terrainSystem.init(this.world);
            await this.vehicleSystem.init(this.world);

            // Initialize camera controller with a temporary target
            const tempTarget = new THREE.Object3D();
            tempTarget.position.set(0, 2, 0);
            tempTarget.quaternion.setFromEuler(new THREE.Euler(0, 0, 0));
            
            this.cameraController = new CameraController(
                this.sceneManager.getCamera(),
                tempTarget,
                { distance: 10, height: 5 }
            );

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

            // Create terrain entity
            const terrainEntity = this.world.createEntity();
            const terrainComponent = new TerrainComponent();
            terrainEntity.addComponent(terrainComponent);
            
            // Initialize terrain with flat ground
            for (let x = -50; x <= 50; x++) {
                for (let z = -50; z <= 50; z++) {
                    terrainComponent.setHeightAt(new THREE.Vector2(x, z), 0.1);
                }
            }
            
            this.initEventListeners();
            
            // Add to DOM
            document.body.appendChild(this.renderer.domElement);
        } catch (error) {
            throw new Error('Failed to initialize WebGL renderer: ' + error.message);
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
            // Debug log scene state
            if (this.sceneManager) {
                const scene = this.sceneManager.getScene();
                const camera = this.sceneManager.getCamera();
                console.log('Game update - Scene state:', {
                    hasScene: !!scene,
                    hasCamera: !!camera,
                    cameraPosition: camera ? camera.position.toArray() : null,
                    sceneChildren: scene ? scene.children.length : 0
                });
            }

            // Update world systems
            this.world.update(deltaTime);

            // Update camera if we have a player vehicle
            if (this.playerVehicle && this.playerVehicle.mesh && this.cameraController) {
                this.cameraController.update(deltaTime);
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
            this.sceneManager.render();

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
            await this.world.cleanup();
        } catch (error) {
            console.error('Error cleaning up world:', error);
        }

        try {
            await this.eventBus.clear();
        } catch (error) {
            console.error('Error cleaning up event bus:', error);
        }

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
    }

    async selectVehicle(vehicleType) {
        console.log('Selecting vehicle:', vehicleType);
        try {
            // Create spawn position slightly above ground
            const spawnPosition = new THREE.Vector3(0, 2, 0);
            
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

            // Update camera target to the vehicle's mesh
            this.cameraController.setTarget(meshComponent.mesh);
            
            // Start the game loop
            this.start();

            console.log('Vehicle spawned successfully:', {
                type: vehicleType,
                position: spawnPosition,
                entityId: vehicle.id
            });

            return vehicle;
        } catch (error) {
            console.error('Error selecting vehicle:', error);
            return null;
        }
    }
} 