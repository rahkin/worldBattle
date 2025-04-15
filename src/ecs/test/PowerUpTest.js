import * as THREE from 'three';
import { PowerUpSystem } from '../systems/PowerUpSystem.js';
import { World } from '../core/World.js';

export class PowerUpTest {
    constructor() {
        this.world = new World();
        this.powerUpSystem = new PowerUpSystem(this.world);
        this.scene = new THREE.Scene();
        this.powerUps = [];
        this.meshes = [];
        
        // Add a grid for visual reference
        const grid = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
        this.scene.add(grid);
    }

    spawnPowerUp(type, position) {
        const powerUp = this.powerUpSystem.createPowerUp(type, position);
        this.powerUps.push(powerUp);
        
        // Create visual representation with glow effect
        const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
        const sphereMaterial = new THREE.MeshStandardMaterial({ 
            color: this.getPowerUpColor(type),
            roughness: 0.2,
            metalness: 0.8,
            emissive: this.getPowerUpColor(type),
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.9
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(position);
        sphere.castShadow = true;
        this.scene.add(sphere);
        
        // Add outer glow sphere
        const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: this.getPowerUpColor(type),
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(position);
        this.scene.add(glow);
        
        // Store both meshes
        this.meshes.push({ sphere, glow });
        
        console.log(`Created ${type} power-up at position:`, position);
        return powerUp;
    }

    getPowerUpColor(type) {
        switch(type) {
            case 'speed':
                return 0x00ff88; // Bright cyan-green
            case 'shield':
                return 0x0088ff; // Bright blue
            case 'weapon':
                return 0xff4444; // Bright red
            default:
                return 0xffffff;
        }
    }

    update(deltaTime) {
        this.powerUpSystem.update(deltaTime);
        
        // Update visual representations
        this.powerUps.forEach((powerUp, index) => {
            if (powerUp.isActive && this.meshes[index]) {
                const { sphere, glow } = this.meshes[index];
                
                // Rotate both meshes
                sphere.rotation.y += deltaTime;
                glow.rotation.y -= deltaTime * 0.5;
                
                // Bob up and down
                const hoverHeight = Math.sin(Date.now() * 0.001) * 0.5;
                sphere.position.y = powerUp.position.y + hoverHeight;
                glow.position.y = powerUp.position.y + hoverHeight;
                
                // Pulse the glow
                const pulseScale = 1 + Math.sin(Date.now() * 0.002) * 0.1;
                glow.scale.set(pulseScale, pulseScale, pulseScale);
            }
        });
    }

    verifyPowerUpCount(expectedCount) {
        const actualCount = this.powerUps.filter(p => p.isActive).length;
        console.log(`Verifying power-up count: Expected ${expectedCount}, Actual ${actualCount}`);
        return actualCount === expectedCount;
    }

    cleanup() {
        this.powerUps.forEach((powerUp, index) => {
            this.powerUpSystem.removePowerUp(powerUp);
            if (this.meshes[index]) {
                const { sphere, glow } = this.meshes[index];
                this.scene.remove(sphere);
                this.scene.remove(glow);
            }
        });
        this.powerUps = [];
        this.meshes = [];
    }
} 