import * as THREE from 'three';
import { World } from './World.js';
import { EventBus } from '../../core/EventBus.js';
import { SceneManager } from '../systems/SceneManager.js';
import { VehicleSystem } from '../systems/VehicleSystem.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { InputSystem } from '../systems/InputSystem.js';
import { CameraSystem } from '../systems/CameraSystem.js';
import { ResourceSystem } from '../systems/ResourceSystem.js';
import { RendererSystem } from '../systems/RendererSystem.js';
import * as CANNON from 'cannon-es';
import { EntityManager } from '../core/EntityManager.js';
import { SystemManager } from '../core/SystemManager.js';
import { WorldDataSystem } from '../systems/world-data/WorldDataSystem.js';
import { GeometrySystem } from '../systems/world-data/GeometrySystem.js';

export class Game {
    constructor(options = {}) {
        // Store options
        this.options = {
            isTest: options.isTest || false,
            world: options.world || new World(),
            eventBus: options.eventBus || new EventBus(),
            loadingIndicator: options.loadingIndicator
        };

        // Initialize state
        this.isTest = this.options.isTest;
        this.world = this.options.world;
        this.eventBus = this.options.eventBus;
        this.loadingIndicator = this.options.loadingIndicator;
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
        this.inputSystem = null;
        this.vehicleSystem = null;
        
        // Scene management
        this.scenes = new Map();
        this.activeScene = null;

        this.entityManager = new EntityManager();
        this.systemManager = new SystemManager();
        this.isInitialized = false;
    }

    async init() {
        try {
            if (!this.checkWebGLSupport()) {
                throw new Error('WebGL not supported');
            }

            // Set the world in the SystemManager
            this.systemManager.setWorld(this.world);

            // Update loading status
            if (this.loadingIndicator) {
                await this.loadingIndicator.show();
                await this.loadingIndicator.updateProgress(10, 'Initializing physics...', 'Setting up systems');
            }
            
            // Initialize physics first so it's available for the world data systems
            this.physicsWorld = new CANNON.World();
            this.physicsWorld.gravity.set(0, -9.82, 0);
            this.physicsWorld.broadphase = new CANNON.SAPBroadphase(this.physicsWorld);
            this.physicsWorld.solver.iterations = 10;
            this.physicsWorld.defaultContactMaterial.friction = 0.8;
            this.physicsWorld.defaultContactMaterial.restitution = 0.1;

            // Create and add world data systems
            this.worldDataSystem = new WorldDataSystem(this.entityManager, this.systemManager, this.loadingIndicator);
            await this.systemManager.addSystem(this.worldDataSystem);

            // Initialize world data systems
            if (this.loadingIndicator) {
                await this.loadingIndicator.updateProgress(20, 'Initializing world data...', 'Loading terrain and buildings');
            }

            const worldDataInitialized = await this.worldDataSystem.initialize();
            if (!worldDataInitialized) {
                throw new Error('Failed to initialize world data system');
            }

            // Create and add geometry system after world data system is initialized
            this.geometrySystem = new GeometrySystem(this.entityManager, this.systemManager);
            await this.systemManager.addSystem(this.geometrySystem);

            if (this.loadingIndicator) {
                await this.loadingIndicator.updateProgress(30, 'Initializing geometry...', 'Processing world data');
            }

            const geometryInitialized = await this.geometrySystem.initialize();
            if (!geometryInitialized) {
                throw new Error('Failed to initialize geometry system');
            }

            // Create and add render system
            this.renderSystem = new RendererSystem();
            await this.systemManager.addSystem(this.renderSystem);

            if (this.loadingIndicator) {
                await this.loadingIndicator.updateProgress(50, 'Setting up scene...', 'Creating environment');
            }

            // Initialize scene and renderer
            if (this.isTest) {
                this.initTestEnvironment();
            } else {
                await this.initRealEnvironment();
            }

            // Initialize remaining systems
            this.inputSystem = new InputSystem();
            this.cameraSystem = new CameraSystem(this.camera);
            this.vehicleSystem = new VehicleSystem(this.scene, this.physicsWorld);
            this.physicsSystem = new PhysicsSystem(this.physicsWorld, this.entityManager);

            // Add remaining systems to manager
            await this.systemManager.addSystem(this.inputSystem);
            await this.systemManager.addSystem(this.cameraSystem);
            await this.systemManager.addSystem(this.vehicleSystem);
            await this.systemManager.addSystem(this.physicsSystem);
            await this.systemManager.addSystem(new ResourceSystem());

            // Initialize vehicle system explicitly
            await this.vehicleSystem.init(this.world);

            // Initialize event listeners
            this.initEventListeners();

            if (this.loadingIndicator) {
                await this.loadingIndicator.updateProgress(100, 'Ready', 'Game initialized');
            }

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize game:', error);
            if (this.loadingIndicator) {
                await this.loadingIndicator.updateProgress(100, 'Error', `Failed to initialize: ${error.message}`);
            }
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
            // Create main scene first
            const mainScene = new THREE.Scene();
            mainScene.background = new THREE.Color(0x87ceeb); // Sky blue
            this.addScene('main', mainScene);
            this.setActiveScene('main');
            
            // Create camera
            this.camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            this.camera.position.set(0, 5, 10);
            this.camera.lookAt(0, 0, 0);
            
            // Initialize renderer system and get renderer
            await this.renderSystem.init();
            this.renderer = this.renderSystem.getRenderer();
            
            // Initialize SceneManager with the main scene
            this.sceneManager = new SceneManager({
                scene: mainScene,
                camera: this.camera,
                renderer: this.renderer
            });
            
            // Initialize SceneManager (this will add ground plane, etc.)
            await this.sceneManager.init();

            // Add lights to the main scene
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            mainScene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(100, 100, 50);
            directionalLight.castShadow = true;
            mainScene.add(directionalLight);
                
            // Configure shadow properties
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 500;

            // Enable shadow rendering
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // Add terrain, buildings, and roads from EntityManager to the scene
            this.addWorldDataToScene(mainScene);

            console.log('Real environment initialized with scene contents:', {
                children: mainScene.children.length,
                hasGround: !!mainScene.getObjectByName('ground'),
                hasLights: mainScene.children.some(child => child instanceof THREE.Light),
                camera: {
                    position: this.camera.position.toArray(),
                    rotation: this.camera.rotation.toArray()
                }
            });
        } catch (error) {
            console.error('Failed to initialize real environment:', error);
            throw error;
        }
    }

    // New method to add world data to the scene
    addWorldDataToScene(scene) {
        try {
            console.log('Adding world data to scene...');
            
            // Add terrain entities
            const terrainEntities = this.entityManager.getEntitiesByComponent('terrain');
            terrainEntities.forEach(entity => {
                const terrainComponent = this.entityManager.getComponent(entity, 'terrain');
                if (terrainComponent && terrainComponent.mesh) {
                    console.log('Adding terrain mesh to scene');
                    scene.add(terrainComponent.mesh);
                    
                    // Add terrain physics body to physics world if available
                    if (terrainComponent.physicsBody && this.physicsWorld) {
                        this.physicsWorld.addBody(terrainComponent.physicsBody);
                    }
                }
            });
            
            // Add building entities
            const buildingEntities = this.entityManager.getEntitiesByComponent('building');
            console.log(`Adding ${buildingEntities.length} buildings to scene`);
            buildingEntities.forEach(entity => {
                const buildingComponent = this.entityManager.getComponent(entity, 'building');
                if (buildingComponent && buildingComponent.mesh) {
                    scene.add(buildingComponent.mesh);
                    
                    // Add building physics body to physics world if available
                    if (buildingComponent.physicsBody && this.physicsWorld) {
                        this.physicsWorld.addBody(buildingComponent.physicsBody);
                    }
                }
            });
            
            // Add road entities
            const roadEntities = this.entityManager.getEntitiesByComponent('road');
            console.log(`Adding ${roadEntities.length} roads to scene`);
            roadEntities.forEach(entity => {
                const roadComponent = this.entityManager.getComponent(entity, 'road');
                if (roadComponent && roadComponent.mesh) {
                    scene.add(roadComponent.mesh);
                    
                    // Add road physics body to physics world if available
                    if (roadComponent.physicsBody && this.physicsWorld) {
                        this.physicsWorld.addBody(roadComponent.physicsBody);
                    }
                }
            });
            
            console.log('World data added to scene');
        } catch (error) {
            console.error('Error adding world data to scene:', error);
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

        if (!this.isInitialized || !this.playerVehicle) {
            console.warn('Cannot start game loop - game not initialized or no vehicle selected');
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
        if (!this.isRunning || !this.isInitialized) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        try {
            // Update all systems
            this.systemManager.update(deltaTime);
            
            // Render the scene
            this.render();

            // Request next frame
            this.animationFrameId = requestAnimationFrame(() => this.update());
        } catch (error) {
            console.error('Error in game loop:', error);
            this.stop();
        }
    }

    render() {
        if (!this.scene || !this.camera) {
            console.warn('Cannot render - missing scene or camera:', {
                hasScene: !!this.scene,
                hasCamera: !!this.camera
            });
            return;
        }
        
        // Use render system to render the scene
        const activeScene = this.getActiveScene();
        if (activeScene) {
            this.renderSystem.render(activeScene, this.camera);
        } else {
            this.renderSystem.render(this.scene, this.camera);
        }
    }

    resize() {
        if (this.camera) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }
        // Let render system handle resize
        this.renderSystem?.handleResize();
    }

    async cleanup() {
        console.log('Cleaning up game...');
        
        // Stop game loop
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Cleanup vehicle selector if exists
        if (this.vehicleSelector) {
            this.vehicleSelector.cleanup();
            this.vehicleSelector = null;
        }

        // Cleanup systems in reverse order
        if (this.systemManager) {
            await this.systemManager.cleanup();
        }

        // Cleanup specific systems
        if (this.vehicleSystem) {
            this.vehicleSystem.cleanup();
            this.vehicleSystem = null;
        }

        if (this.cameraSystem) {
            this.cameraSystem.cleanup();
            this.cameraSystem = null;
        }

        if (this.inputSystem) {
            this.inputSystem.cleanup();
            this.inputSystem = null;
        }

        if (this.physicsSystem) {
            this.physicsSystem.cleanup();
            this.physicsSystem = null;
        }

        // Cleanup render system
        if (this.renderSystem) {
            this.renderSystem.cleanup();
            this.renderSystem = null;
        }

        // Clear scenes
        this.scenes.forEach(scene => {
            this.disposeScene(scene);
        });
        this.scenes.clear();
        this.activeScene = null;

        // Clear physics world
        if (this.physicsWorld) {
            // Remove all bodies
            while(this.physicsWorld.bodies.length > 0) {
                this.physicsWorld.removeBody(this.physicsWorld.bodies[0]);
            }
            // Clear contact materials
            this.physicsWorld.contactmaterials.length = 0;
            this.physicsWorld = null;
        }

        // Clear references
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.playerVehicle = null;

        // Reset state
        this.isRunning = false;
        this.lastTime = 0;
        this.isInitialized = false;

        console.log('Game cleanup completed');
    }

    disposeScene(scene) {
        scene.traverse(object => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => this.disposeMaterial(material));
                } else {
                    this.disposeMaterial(object.material);
                }
            }
            
            if (object.dispose) {
                object.dispose();
            }
        });
    }

    disposeMaterial(material) {
        if (material.map) material.map.dispose();
        if (material.lightMap) material.lightMap.dispose();
        if (material.bumpMap) material.bumpMap.dispose();
        if (material.normalMap) material.normalMap.dispose();
        if (material.specularMap) material.specularMap.dispose();
        if (material.envMap) material.envMap.dispose();
        material.dispose();
    }

    async selectVehicle(vehicleType) {
        console.log('Selecting vehicle:', vehicleType);
        try {
            // Create spawn position slightly above ground
            const spawnPosition = new THREE.Vector3(0, 5, 0); // 5 meters above ground in real-world units
            
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
} 