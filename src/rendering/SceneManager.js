import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance"
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
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Add ground
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Add simple skybox
        const skyColor = new THREE.Color(0x87ceeb);
        this.scene.background = skyColor;

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
        this.renderer.render(this.scene, camera);
    }
} 