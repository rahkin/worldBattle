import * as THREE from 'three';
import { World } from '../ecs/World.js';

export class Scene extends THREE.Scene {
    constructor(game) {
        super();
        this.game = game;
        this.name = 'Scene';
        this.world = new World();
        this.initialized = false;

        // Create or use existing camera
        this.camera = game.camera || new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        if (!game.camera) {
            game.camera = this.camera;
        }

        // Use existing renderer or wait for initialization
        this.renderer = game.renderer;
        
        console.log(`Scene ${this.name} constructed`);
    }

    async initialize() {
        console.log(`=== Initializing Scene: ${this.name} ===`);
        if (this.initialized) {
            console.log('Scene already initialized');
            return;
        }

        // Create renderer if it doesn't exist
        if (!this.renderer) {
            console.log('Creating new renderer');
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            document.body.appendChild(this.renderer.domElement);
            this.game.renderer = this.renderer;
        }

        try {
            console.log('Initializing world systems');
            await this.world.initialize?.();
            this.initialized = true;
            console.log(`=== Scene ${this.name} Initialized ===`);
        } catch (error) {
            console.error('Failed to initialize scene:', error);
            throw error;
        }
    }

    update(deltaTime) {
        if (!this.initialized) return;
        this.world.update(deltaTime);
    }

    render() {
        if (!this.initialized) return;
        if (this.renderer && this.camera) {
            this.renderer.render(this, this.camera);
        }
    }

    cleanup() {
        this.initialized = false;
        // Clean up THREE.js objects
        this.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                if (object.material.dispose) {
                    object.material.dispose();
                }
            }
        });
        // Clean up ECS world
        this.world.cleanup();
    }

    resize(width, height) {
        if (this.camera instanceof THREE.PerspectiveCamera) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
        if (this.renderer) {
            this.renderer.setSize(width, height);
        }
    }
} 