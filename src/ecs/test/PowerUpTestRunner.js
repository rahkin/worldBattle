import * as THREE from 'three';
import { PowerUpTest } from './PowerUpTest.js';

class PowerUpTestRunner {
    constructor() {
        console.log('Initializing PowerUpTestRunner...');
        
        // Setup renderer
        this.canvas = document.createElement('canvas');
        document.body.appendChild(this.canvas);
        
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x1a1a1a); // Darker gray background
        this.renderer.shadowMap.enabled = true;
        
        // Setup camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(15, 15, 15); // Position camera at an angle
        this.camera.lookAt(0, 0, 0);
        
        console.log('Creating PowerUpTest instance...');
        this.test = new PowerUpTest();
        this.scene = this.test.scene;
        
        // Enhanced lighting setup
        console.log('Setting up enhanced lighting...');
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        this.scene.add(ambientLight);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 2);
        mainLight.position.set(10, 10, 10);
        mainLight.castShadow = true;
        this.scene.add(mainLight);
        
        const fillLight = new THREE.DirectionalLight(0x404040, 1);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);

        // Add a ground plane for better depth perception
        const groundGeometry = new THREE.PlaneGeometry(30, 30);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        this.clock = new THREE.Clock();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        console.log('Starting tests...');
        this.runTests();
    }

    async runTests() {
        console.log('Starting power-up system tests...');
        
        // Test 1: Spawn power-ups with more spacing
        console.log('Test 1: Spawning power-ups');
        this.test.spawnPowerUp('speed', new THREE.Vector3(-8, 2, 0));
        this.test.spawnPowerUp('shield', new THREE.Vector3(0, 2, 0));
        this.test.spawnPowerUp('weapon', new THREE.Vector3(8, 2, 0));
        
        // Test 2: Verify initial count
        console.log('Test 2: Verifying initial power-up count');
        if (!this.test.verifyPowerUpCount(3)) {
            console.error('Test 2 failed: Incorrect initial power-up count');
        }
        
        // Test 3: Simulate power-up collection
        console.log('Test 3: Simulating power-up collection');
        this.test.powerUps[0].isActive = false; // Simulate collection
        if (!this.test.verifyPowerUpCount(2)) {
            console.error('Test 3 failed: Incorrect power-up count after collection');
        }
        
        console.log('All tests completed. Scene should be visible with power-ups.');
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        this.test.update(deltaTime);
        
        // Slowly rotate camera around the scene
        const time = this.clock.getElapsedTime();
        const radius = 20;
        this.camera.position.x = Math.cos(time * 0.2) * radius;
        this.camera.position.z = Math.sin(time * 0.2) * radius;
        this.camera.position.y = 15;
        this.camera.lookAt(0, 0, 0);
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the test runner
console.log('Creating PowerUpTestRunner instance...');
const testRunner = new PowerUpTestRunner();
testRunner.animate(); 