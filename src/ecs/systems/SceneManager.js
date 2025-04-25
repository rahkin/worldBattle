import { System } from '../core/System.js';
import * as THREE from 'three';

export class SceneManager extends System {
    constructor({ scene, camera, renderer }) {
        super();
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.debugEnabled = true;
        this.debugObjects = new Map();
    }

    async init() {
        console.log('Initializing SceneManager');
        
        try {
                // Setup ground
                this.setupGround();

                // Add debug visualization
                if (this.debugEnabled) {
                    this.setupDebugVisualization();
            }

            // Handle window resize
            window.addEventListener('resize', this.handleResize.bind(this));

            // Log final state
            console.log('SceneManager initialized:', {
                scene: {
                    children: this.scene.children.length,
                    background: this.scene.background ? 'set' : 'none',
                    fog: this.scene.fog ? 'set' : 'none'
                },
                camera: {
                    position: this.camera.position.toArray(),
                    aspect: this.camera.aspect
                },
                renderer: {
                    size: this.renderer.getSize(new THREE.Vector2()),
                    domElement: this.renderer.domElement ? 'created' : 'missing',
                    isInDOM: !!this.renderer.domElement.parentNode
                }
            });

            return true;
        } catch (error) {
            console.error('Error initializing SceneManager:', error);
            return false;
        }
    }

    setupGround() {
        // Create a larger ground plane to match the terrain size (10km x 10km)
        const groundGeometry = new THREE.PlaneGeometry(10000, 10000);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.8,
            metalness: 0.2,
            transparent: true,
            opacity: 0.5 // Make it semi-transparent to see if terrain aligns
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        ground.name = 'ground';
        
        // Add ground to scene
        this.scene.add(ground);
        console.log('Ground plane created:', {
            dimensions: groundGeometry.parameters,
            position: ground.position.toArray(),
            rotation: ground.rotation.toArray()
        });

        // Add grid helper at exactly ground level
        const gridHelper = new THREE.GridHelper(10000, 100, 0x444444, 0x888888);
        gridHelper.position.y = 0; // Exactly at ground level
        this.scene.add(gridHelper);
        console.log('Grid helper added');
    }

    setupDebugVisualization() {
        // Add axes helper
        const axesHelper = new THREE.AxesHelper(10); // Increased size
        this.scene.add(axesHelper);
        this.debugObjects.set('axes', axesHelper);

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

    cleanup() {
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize.bind(this));

        // Remove debug objects
        this.debugObjects.forEach(object => {
            if (object.parent) {
                object.parent.remove(object);
                }
            });
        this.debugObjects.clear();

        console.log('SceneManager cleaned up');
    }
} 