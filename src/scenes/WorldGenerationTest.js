import { Scene } from '../core/Scene.js';
import { WorldManager } from '../ecs/systems/importers/WorldManager.js';
import { TileFetcherSystem } from '../ecs/systems/importers/TileFetcherSystem.js';
import { FeatureParserSystem } from '../ecs/systems/importers/FeatureParserSystem.js';
import { WorldGenerationSystem } from '../ecs/systems/importers/WorldGenerationSystem.js';
import { TerrainComponent } from '../ecs/components/TerrainComponent.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class WorldGenerationTest extends Scene {
    constructor(game) {
        super(game);
        this.name = 'WorldGenerationTest';
        
        // Create and register world generation systems
        this.worldManager = new WorldManager(this.world);
        this.tileFetcher = new TileFetcherSystem(this.world);
        this.featureParser = new FeatureParserSystem(this.world);
        
        // Register systems in the correct order (except WorldGenerationSystem)
        this.world.addSystem('WorldManager', this.worldManager);
        this.world.addSystem('TileFetcherSystem', this.tileFetcher);
        this.world.addSystem('FeatureParserSystem', this.featureParser);
        
        console.log('=== World Generation Test Scene Constructed ===');
    }

    async initialize() {
        console.log('=== Initializing WorldGenerationTest Scene ===');
        
        try {
            // Initialize base scene first
            await super.initialize();
            
            // Setup camera
            this.camera.position.set(0, 2000, 2000); // Increased height and distance
            this.camera.lookAt(0, 0, 0);
            
            // Setup lights
            this.setupLights();
            
            // Setup controls
            this.setupControls();
            
            // Add a grid helper with larger size
            const gridHelper = new THREE.GridHelper(5000, 50); // Increased size, reduced divisions
            this.add(gridHelper);

            // Now that the scene is set up, create and initialize WorldGenerationSystem
            console.log('Creating WorldGenerationSystem with scene:', this);
            this.worldGenerator = new WorldGenerationSystem(this.world, this);
            this.world.addSystem('WorldGenerationSystem', this.worldGenerator);
            
            // Initialize systems in the correct order
            console.log('Initializing world generation systems...');
            await this.tileFetcher.initialize();
            await this.featureParser.initialize();
            await this.worldGenerator.initialize();
            await this.worldManager.initialize();
            
            // Start world generation
            await this.worldManager.startWorldGeneration();
            
            console.log('=== World Generation Complete ===');
        } catch (error) {
            console.error('Failed to initialize WorldGenerationTest:', error);
            throw error;
        }
    }

    setupCamera() {
        // Position camera high above NAIA for better overview
        this.camera.position.set(0, 1000, 1000);
        this.camera.lookAt(0, 0, 0);
        console.log('Camera setup complete:', this.camera.position);
    }

    setupLights() {
        // Add ambient light with increased intensity
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.add(ambientLight);

        // Add directional light with wider shadow camera
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1000, 1000, 1000);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 4096;
        directionalLight.shadow.mapSize.height = 4096;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 5000;
        directionalLight.shadow.camera.left = -2500;
        directionalLight.shadow.camera.right = 2500;
        directionalLight.shadow.camera.top = 2500;
        directionalLight.shadow.camera.bottom = -2500;
        this.add(directionalLight);

        // Add hemisphere light with increased intensity
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
        hemiLight.position.set(0, 500, 0);
        this.add(hemiLight);

        console.log('Lights setup complete');
    }

    setupControls() {
        if (this.game.renderer) {
            this.controls = new OrbitControls(this.camera, this.game.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05; // Fixed property name
            this.controls.enableZoom = true;
            this.controls.minDistance = 100;
            this.controls.maxDistance = 5000;
            this.controls.maxPolarAngle = Math.PI / 2;
            console.log('Controls setup complete');
        } else {
            console.warn('Renderer not available, controls setup delayed');
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (this.controls) {
            this.controls.update();
        }
    }

    render() {
        super.render();
    }
} 