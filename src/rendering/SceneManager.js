import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        // Configure renderer with optimal settings for star field
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,  // Disable antialiasing for sharper points
            powerPreference: "high-performance",
            precision: "highp",
            alpha: false,
            stencil: false,
            depth: true,
            logarithmicDepthBuffer: true  // Better depth handling for large scale differences
        });
        
        this.obstacles = [];
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
        const rampMaterial = new THREE.MeshPhongMaterial({ 
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

    init() {
        // Setup renderer with optimal settings
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.autoClear = true;
        this.renderer.sortObjects = false;
        this.renderer.physicallyCorrectLights = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping; // Use ACES tone mapping for better HDR
        this.renderer.outputEncoding = THREE.sRGBEncoding; // Use sRGB encoding for better color
        
        // Remove the black clear color - let the sky handle the background
        this.renderer.setClearColor(0x000000, 0);
        
        document.body.appendChild(this.renderer.domElement);

        // Add ground with better visibility
        const groundGeometry = new THREE.PlaneGeometry(2000, 2000); // Increased size
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3a3a3a,  // Lighter ground color
            roughness: 0.8,    // Less rough for better light reflection
            metalness: 0.2,    // Slightly more metallic
            envMapIntensity: 1.0 // Better environment map response
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Remove simple skybox - TimeSystem will handle sky and stars
        // this.scene.background = new THREE.Color(0x87ceeb);

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

        // Handle window resize
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    render(camera) {
        // Ensure proper state before rendering
        this.renderer.clear(true, true, true);
        this.renderer.render(this.scene, camera);
    }
} 