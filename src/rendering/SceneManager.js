import * as THREE from 'three';

export class SceneManager {
    constructor(options = {}) {
        this.isTest = options.isTest || false;
        this.obstacles = [];
        
        // Debug state tracking
        this.lastCameraPosition = new THREE.Vector3();
        this.lastChildCount = 0;
        this.frameCount = 0;
        
        // Always create a scene, either real or mock
        this.scene = this.isTest ? this.createMockScene() : new THREE.Scene();
        
        // Initialize environment based on mode
        if (this.isTest) {
            this.initTestEnvironment();
        } else if (typeof window !== 'undefined') {
            this.initGameEnvironment();
        } else {
            throw new Error('Cannot initialize SceneManager: window is undefined and not in test mode');
        }
        
        console.log('SceneManager initialized in', this.isTest ? 'test' : 'game', 'mode');
    }

    createMockScene() {
        return {
            add: () => {},
            remove: () => {},
            traverse: () => {},
            children: [],
            background: null,
            fog: null,
            overrideMaterial: null,
            autoUpdate: true,
            matrixAutoUpdate: true,
            matrixWorldNeedsUpdate: false
        };
    }

    initTestEnvironment() {
        // Mock WebGL context and renderer
        const mockCanvas = {
            getContext: () => ({
                getExtension: () => null,
                getParameter: () => 0,
                getShaderPrecisionFormat: () => ({ rangeMin: 0, rangeMax: 0, precision: 0 }),
                getSupportedExtensions: () => [],
                isContextLost: () => false
            }),
            style: {},
            width: 800,
            height: 600
        };

        this.renderer = {
            setSize: () => {},
            render: () => {},
            dispose: () => {},
            domElement: mockCanvas,
            capabilities: {
                isWebGL2: false,
                getMaxAnisotropy: () => 1,
                getMaxPrecision: () => 'highp',
                precision: 'highp',
                logarithmicDepthBuffer: false,
                maxTextures: 8,
                maxVertexTextures: 0,
                maxTextureSize: 2048,
                maxCubemapSize: 2048,
                maxAttributes: 8,
                maxVertexUniforms: 128,
                maxVaryings: 8,
                floatFragmentTextures: false,
                floatVertexTextures: false
            },
            shadowMap: {
                enabled: false,
                type: THREE.PCFSoftShadowMap
            },
            setClearColor: () => {},
            setPixelRatio: () => {},
            outputColorSpace: THREE.SRGBColorSpace,
            toneMapping: THREE.ACESFilmicToneMapping,
            info: {
                memory: { geometries: 0, textures: 0 },
                render: { calls: 0, triangles: 0, points: 0 }
            }
        };

        // Mock lights
        this.ambientLight = { type: 'AmbientLight', intensity: 1.0 };
        this.sunLight = { type: 'DirectionalLight', intensity: 1.5, position: { x: 50, y: 100, z: 25 } };
    }

    initGameEnvironment() {
        if (typeof window === 'undefined') {
            throw new Error('Cannot initialize game environment: window is undefined');
        }
        
        try {
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                alpha: true
            });
            this.setupRenderer();
            this.setupLights();
        } catch (error) {
            console.error('Failed to initialize WebGL renderer:', error);
            // Fallback to test environment if WebGL initialization fails
            this.isTest = true;
            this.initTestEnvironment();
        }
    }

    setupRenderer() {
        // Set size before adding to DOM to avoid resize flicker
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.renderer.setSize(width, height, false); // false to avoid setting style
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x87ceeb, 1); // Set sky blue clear color
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // Add canvas to DOM
        document.body.appendChild(this.renderer.domElement);
        
        // Set canvas style after adding to DOM
        const canvas = this.renderer.domElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';

        // Debug renderer state
        console.log('Renderer initialized:', {
            size: { width, height },
            pixelRatio: window.devicePixelRatio,
            canvas: {
                width: canvas.width,
                height: canvas.height,
                clientWidth: canvas.clientWidth,
                clientHeight: canvas.clientHeight,
                style: {
                    width: canvas.style.width,
                    height: canvas.style.height
                }
            },
            capabilities: {
                isWebGL2: this.renderer.capabilities.isWebGL2,
                maxTextures: this.renderer.capabilities.maxTextures,
                maxAttributes: this.renderer.capabilities.maxAttributes,
                maxTextureSize: this.renderer.capabilities.maxTextureSize
            }
        });

        // Handle resize
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            // Update size and aspect ratio
            this.renderer.setSize(width, height, false);
            console.log('Renderer resized:', { width, height });
        });
        
        console.log('Renderer setup complete');
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 1.0); // Increased intensity
        this.scene.add(ambientLight);
        console.log('Added ambient light');

        // Directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.5); // Increased intensity
        sunLight.position.set(50, 100, 25); // Adjusted position
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        this.scene.add(sunLight);
        console.log('Added directional light at position:', sunLight.position.toArray());

        // Add a helper to visualize the light
        const helper = new THREE.DirectionalLightHelper(sunLight, 10);
        this.scene.add(helper);
    }

    setupEnvironment() {
        console.log('Setting up environment...');
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a472a,
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.scene.add(ground);
        console.log('Added ground plane');

        // Add axes helper for debugging
        const axesHelper = new THREE.AxesHelper(50);
        this.scene.add(axesHelper);
        console.log('Added axes helper');
    }

    createObstacle(position, size) {
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        return mesh;
    }

    createRamp(position, rotation = 0) {
        // Create ramp mesh
        const rampWidth = 4;  // Wide enough for vehicles
        const rampHeight = 1.5;  // Good height for jumps
        const rampLength = 6;  // Long enough for smooth transition
        
        const rampGeometry = new THREE.BoxGeometry(rampWidth, rampHeight, rampLength);
        const rampMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Create the ramp mesh
        const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
        
        // Position the ramp
        ramp.position.copy(position);
        
        // Rotate one end up to create the slope
        ramp.rotation.x = -Math.PI / 8;  // 22.5 degrees
        ramp.rotation.y = rotation;  // Allow different orientations
        
        // Enable shadows
        ramp.castShadow = true;
        ramp.receiveShadow = true;
        
        this.scene.add(ramp);
        return ramp;
    }

    init(options = { createEnvironment: false }) {
        console.log('SceneManager init started');
        
        if (options.createEnvironment) {
            // Add ramps at strategic locations
            this.createRamp(new THREE.Vector3(10, 0, 0));  // Right side ramp
            this.createRamp(new THREE.Vector3(-10, 0, 0), Math.PI);  // Left side ramp
            this.createRamp(new THREE.Vector3(0, 0, 15), Math.PI / 2);  // Front ramp
            this.createRamp(new THREE.Vector3(0, 0, -15), -Math.PI / 2);  // Back ramp

            // Create visual obstacles
            const obstacles = [
                { pos: new THREE.Vector3(5, 0.5, 0), size: new THREE.Vector3(1, 1, 1) },
                { pos: new THREE.Vector3(-3, 0.5, 4), size: new THREE.Vector3(1, 1, 1) },
                { pos: new THREE.Vector3(2, 0.5, -5), size: new THREE.Vector3(1, 1, 1) },
                { pos: new THREE.Vector3(-4, 0.5, -3), size: new THREE.Vector3(1, 1, 1) }
            ];

            obstacles.forEach(obs => this.createObstacle(obs.pos, obs.size));
            console.log('Environment objects created');
        }
        
        console.log('SceneManager init complete');
    }

    render(camera) {
        if (!camera) {
            console.error('No camera provided for rendering');
            return;
        }
        if (!this.renderer) {
            console.error('Renderer not initialized');
            return;
        }
        if (!this.scene) {
            console.error('Scene not initialized');
            return;
        }

        // Debug render state
        const renderInfo = this.renderer.info;
        console.log('Render info:', {
            memory: {
                geometries: renderInfo.memory.geometries,
                textures: renderInfo.memory.textures
            },
            render: {
                calls: renderInfo.render.calls,
                triangles: renderInfo.render.triangles,
                points: renderInfo.render.points
            },
            programs: renderInfo.programs?.length || 0
        });

        // Ensure camera matrices are up to date
        camera.updateMatrixWorld();
        camera.updateProjectionMatrix();
        
        this.renderer.render(this.scene, camera);
    }

    cleanup() {
        console.log('Cleaning up SceneManager...');
        
        // Remove all objects from the scene
        while(this.scene.children.length > 0) { 
            const object = this.scene.children[0];
            this.scene.remove(object);
            
            // Dispose of geometries and materials
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        }
        
        // Clear arrays
        this.obstacles = [];
        
        // Dispose of renderer
        if (this.renderer) {
            this.renderer.dispose();
            // Remove canvas from DOM
            const canvas = this.renderer.domElement;
            if (canvas && canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        }
        
        console.log('SceneManager cleanup complete');
    }

    clearScene() {
        console.log('Clearing scene...');
        
        // Remove all objects from the scene
        while(this.scene.children.length > 0) { 
            const object = this.scene.children[0];
            this.scene.remove(object);
            
            // Dispose of geometries and materials
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        }
        
        // Clear arrays
        this.obstacles = [];
        
        // Re-add essential lights
        this.setupLights();
        
        console.log('Scene cleared');
    }
} 