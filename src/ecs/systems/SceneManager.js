import { System } from '../core/System.js';
import * as THREE from 'three';

export class SceneManager extends System {
    constructor(options = {}) {
        super();
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.debugEnabled = true; // Enable debug by default
        this.debugObjects = new Map();
    }

    init() {
        console.log('Initializing SceneManager');
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            logarithmicDepthBuffer: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Setup camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 15);
        this.camera.lookAt(0, 0, 0);

        // Setup scene
        const skyColor = new THREE.Color(0x87ceeb);
        this.scene.background = skyColor;
        this.scene.fog = new THREE.Fog(skyColor, 50, 150);

        // Setup lighting
        this.setupLighting();

        // Setup ground
        this.setupGround();

        // Add debug visualization
        if (this.debugEnabled) {
            this.setupDebugVisualization();
        }

        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));

        console.log('SceneManager initialized:', {
            scene: !!this.scene,
            camera: !!this.camera,
            renderer: !!this.renderer,
            children: this.scene.children.length
        });

        return Promise.resolve();
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Main directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(50, 50, 0);
        directionalLight.castShadow = true;
        
        // Improve shadow quality
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        
        this.scene.add(directionalLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-50, 30, 0);
        this.scene.add(fillLight);
    }

    setupGround() {
        // Create ground plane
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        ground.name = 'ground';
        
        this.scene.add(ground);

        // Add grid helper
        const gridHelper = new THREE.GridHelper(200, 200, 0x444444, 0x888888);
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);
    }

    setupDebugVisualization() {
        // Add axes helper
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
        this.debugObjects.set('axes', axesHelper);

        // Add coordinate sphere at origin
        const sphereGeometry = new THREE.SphereGeometry(0.2, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const originSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.scene.add(originSphere);
        this.debugObjects.set('origin', originSphere);

        console.log('Debug visualization enabled');
    }

    handleResize() {
        if (this.camera && this.renderer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    update(deltaTime) {
        // Update debug visualization
        if (this.debugEnabled && this.debugObjects.get('origin')) {
            const originSphere = this.debugObjects.get('origin');
            originSphere.position.y = Math.sin(performance.now() * 0.001) * 0.1;
        }
    }

    render(camera = this.camera) {
        if (!this.renderer || !this.scene || !camera) {
            console.warn('Cannot render: missing renderer, scene, or camera');
            return;
        }

        // Log scene state occasionally
        if (this.debugEnabled && Math.random() < 0.01) {
            console.log('Scene state:', {
                children: this.scene.children.length,
                camera: camera.position.toArray(),
                meshes: this.scene.children.filter(child => child instanceof THREE.Mesh).length
            });
        }

        this.renderer.render(this.scene, camera);
    }

    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }

    getRenderer() {
        return this.renderer;
    }

    cleanup() {
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);

        // Dispose of debug objects
        this.debugObjects.forEach((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
            this.scene.remove(object);
        });
        this.debugObjects.clear();

        // Clean up scene
        while(this.scene.children.length > 0) { 
            const object = this.scene.children[0];
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
            this.scene.remove(object);
        }

        // Clean up renderer
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }

        console.log('SceneManager cleaned up');
    }
} 