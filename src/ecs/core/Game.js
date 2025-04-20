import * as THREE from 'three';
import { World } from './World.js';
import { EventBus } from '../../core/EventBus.js';
import { SceneManager } from '../systems/SceneManager.js';
import { VehicleSystem } from '../systems/VehicleSystem.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { CameraController } from '../systems/CameraController.js';
import { TerrainSystem } from '../systems/TerrainSystem.js';
import { ResourceSystem } from '../systems/ResourceSystem.js';
import * as CANNON from 'cannon-es';
import { TerrainComponent } from '../components/TerrainComponent.js';

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
    }

    async init() {
        console.log('Initializing game...');
        
        try {
            // Initialize scene manager first
            this.sceneManager = new SceneManager();
            await this.sceneManager.init();
            
            // Add renderer to document
            document.body.appendChild(this.sceneManager.getRenderer().domElement);

            // Initialize physics system
            this.physicsSystem = new PhysicsSystem();
            await this.physicsSystem.init();

            // Initialize other systems with scene and physics references
            this.vehicleSystem = new VehicleSystem(this.sceneManager.getScene(), this.physicsSystem.world);
            await this.vehicleSystem.init();

            this.terrainSystem = new TerrainSystem(this.sceneManager.getScene(), this.physicsSystem.world);
            await this.terrainSystem.init();

            // Add systems to world
            this.world.addSystem(this.sceneManager);
            this.world.addSystem(this.physicsSystem);
            this.world.addSystem(this.vehicleSystem);
            this.world.addSystem(this.terrainSystem);

            // Initialize camera controller
            this.cameraController = new CameraController(
                this.sceneManager.getCamera(),
                new THREE.Vector3(0, 2, 0),  // Initial target position
                { 
                    distance: 10,
                    height: 5,
                    damping: 0.1
                }
            );

            console.log('Game initialized successfully:', {
                systems: this.world.systems.length,
                scene: !!this.sceneManager.getScene(),
                physics: !!this.physicsSystem.world,
                camera: !!this.sceneManager.getCamera()
            });

            return true;
        } catch (error) {
            console.error('Failed to initialize game:', error);
            return false;
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
            // Update world systems
            this.world.update(deltaTime);

            // Update camera if we have a player vehicle
            if (this.playerVehicle && this.playerVehicle.mesh && this.cameraController) {
                this.cameraController.update(deltaTime);
            }

            // Render scene
            this.sceneManager.render(this.sceneManager.getCamera());

            // Schedule next frame
            this.animationFrameId = requestAnimationFrame(() => this.update());
        } catch (error) {
            console.error('Error in game loop:', error);
            this.stop();
        }
    }

    render() {
        if (this.renderer && this.scene && this.camera) {
            try {
                this.sceneManager.render(this.camera);
            } catch (error) {
                console.error('Error in render:', error);
            }
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
    }

    async spawnVehicle(type = 'muscle', position = new THREE.Vector3(0, 2, 0)) {
        console.log('Spawning vehicle:', { type, position });
        
        try {
            // Create vehicle
            this.playerVehicle = await this.vehicleSystem.createVehicle(type, position);
            
            if (!this.playerVehicle) {
                throw new Error('Failed to create vehicle');
            }

            // Update camera target
            if (this.cameraController) {
                this.cameraController.setTarget(this.playerVehicle.mesh);
                console.log('Camera target set to vehicle:', {
                    vehicleId: this.playerVehicle.id,
                    position: this.playerVehicle.mesh.position.toArray()
                });
            }

            return this.playerVehicle;
        } catch (error) {
            console.error('Failed to spawn vehicle:', error);
            return null;
        }
    }
} 