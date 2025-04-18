import * as THREE from 'three';
import { World } from '../ecs/World';
import { EventBus } from './EventBus';

export class Game {
    constructor(options = {}) {
        this.isTest = options.isTest || false;
        this.world = options.world || new World();
        this.eventBus = options.eventBus || new EventBus();
        this.isRunning = false;
        this.lastTime = 0;
        this.scene = null;
        this.camera = null;
        this.renderer = null;

        // Initialize test environment or real components
        if (this.isTest) {
            this.initTestEnvironment();
        } else {
            this.initRealEnvironment();
        }
    }

    initTestEnvironment() {
        this.scene = new THREE.Scene();
        this.camera = {
            position: new THREE.Vector3(),
            lookAt: () => {},
            aspect: 1,
            updateProjectionMatrix: () => {}
        };
        this.renderer = {
            setSize: () => {},
            render: () => {},
            domElement: {},
            dispose: () => {}
        };
    }

    initRealEnvironment() {
        // Check for window existence
        if (typeof window === 'undefined') {
            this.initTestEnvironment();
            return;
        }
        
        this.initRenderer();
        this.initScene();
        this.initCamera();
        this.initEventListeners();
    }

    initRenderer() {
        // Initialize WebGL renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    }

    initScene() {
        this.scene = new THREE.Scene();
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
    }

    initEventListeners() {
        window.addEventListener('resize', this.resize.bind(this));
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.update();
        }
    }

    stop() {
        this.isRunning = false;
    }

    update() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update world and systems
        this.world.update(deltaTime);

        // Only render in non-test mode
        if (!this.isTest && this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }

        // Request next frame if not in test mode
        if (this.isRunning && !this.isTest) {
            requestAnimationFrame(this.update.bind(this));
        }
    }

    resize() {
        if (this.isTest || !this.camera || !this.renderer) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    cleanup() {
        this.stop();
        this.world.cleanup();
        this.eventBus.clear();

        if (!this.isTest && typeof window !== 'undefined') {
            window.removeEventListener('resize', this.resize.bind(this));
            if (this.renderer) {
                this.renderer.dispose();
            }
        }
    }
} 