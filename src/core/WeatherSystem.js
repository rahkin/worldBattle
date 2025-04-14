import * as THREE from 'three';
import { RainSystem } from './RainSystem.js';
import { GroundEffectsSystem } from './GroundEffectsSystem.js';

export class WeatherSystem {
    constructor(scene, timeSystem) {
        this.scene = scene;
        this.timeSystem = timeSystem;
        
        // Weather state
        this.currentWeather = 'clear';
        this.weatherTransitionTime = 0;
        this.weatherIntensity = 0;
        
        // Cloud system
        this.clouds = new Map();
        this.cloudCount = 50;
        this.cloudLayer = new THREE.Group();
        this.scene.add(this.cloudLayer);
        
        // Rain system
        this.rainSystem = new RainSystem(scene, scene.camera);
        
        // Ground effects system
        // Note: We'll initialize this after the ground is created
        this.groundEffects = null;
        
        // Weather effects
        this.fogSystem = null;
        
        // Initialize systems
        this.initializeClouds();
        this.initializeFog();
    }
    
    initializeClouds() {
        // Create cloud instances with varied shapes
        for (let i = 0; i < this.cloudCount; i++) {
            const cloud = this.createCloud();
            
            // More spread out distribution
            cloud.position.set(
                (Math.random() - 0.5) * 2000,  // Increased from 1000 to 2000 for wider spread
                200 + Math.random() * 100,     // Keep same height
                (Math.random() - 0.5) * 2000   // Increased from 1000 to 2000 for wider spread
            );
            
            // Random rotation
            cloud.rotation.y = Math.random() * Math.PI * 2;
            
            this.cloudLayer.add(cloud);
            this.clouds.set(i, {
                mesh: cloud,
                speed: 0.05 + Math.random() * 0.1,
                direction: new THREE.Vector3(
                    Math.random() - 0.5,
                    0,
                    Math.random() - 0.5
                ).normalize()
            });
        }
    }
    
    createCloud() {
        // Create a group for the cloud parts
        const cloudGroup = new THREE.Group();
        
        // Cloud material with soft edges
        const cloudMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            flatShading: true
        });
        
        // Create multiple spheres for one cloud with smaller sizes
        const sphereCount = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < sphereCount; i++) {
            const size = 20 + Math.random() * 30;  // Reduced from 40-100 to 20-50
            const geometry = new THREE.SphereGeometry(size, 8, 8);
            const cloudPart = new THREE.Mesh(geometry, cloudMaterial);
            
            // Position each sphere slightly offset
            cloudPart.position.set(
                (Math.random() - 0.5) * 40,   // Reduced from 80 to 40
                (Math.random() - 0.5) * 20,   // Reduced from 40 to 20
                (Math.random() - 0.5) * 40    // Reduced from 80 to 40
            );
            
            cloudGroup.add(cloudPart);
        }
        
        return cloudGroup;
    }
    
    initializeFog() {
        // Add fog to the scene
        this.scene.fog = new THREE.Fog(0xcfcfcf, 100, 1000);
        this.scene.fog.density = 0;
    }
    
    initializeGroundEffects(ground) {
        this.groundEffects = new GroundEffectsSystem(this.scene, ground);
    }
    
    setWeather(type, transitionDuration = 5) {
        this.currentWeather = type;
        this.weatherTransitionTime = transitionDuration;
        this.weatherIntensity = 0;
        
        console.log(`Weather changing to ${type} over ${transitionDuration} seconds`);
        
        // Clear any existing additional clouds
        this.clearAdditionalClouds();
        
        switch (type) {
            case 'clear':
                this.updateFog(0);
                this.updateCloudOpacity(0.6);
                this.updateCloudScale(1.0);
                this.setCloudCount(50);
                if (this.rainSystem) this.rainSystem.disable();
                break;
                
            case 'cloudy':
                this.updateFog(0.2);
                this.updateCloudOpacity(1);
                this.updateCloudScale(1.5);
                this.setCloudCount(100);
                this.generateAdditionalClouds(50, {
                    heightRange: [200, 400],
                    scaleMultiplier: 1.5
                });
                if (this.rainSystem) this.rainSystem.disable();
                break;
                
            case 'foggy':
                this.updateFog(0.8);
                this.updateCloudOpacity(0.8);
                this.updateCloudScale(2.0);
                this.setCloudCount(75);
                this.generateAdditionalClouds(25, {
                    heightRange: [100, 250],
                    scaleMultiplier: 2.0,
                    spread: 0.7
                });
                if (this.rainSystem) this.rainSystem.disable();
                break;
                
            case 'storm':
                this.updateFog(0.4);
                this.updateCloudOpacity(1);
                this.updateCloudScale(1.8);
                this.setCloudCount(120);
                this.generateAdditionalClouds(70, {
                    heightRange: [300, 500],
                    scaleMultiplier: 1.8,
                    color: 0x666666
                });
                this.darkendClouds();
                if (this.rainSystem) {
                    this.rainSystem.enable();
                    this.rainSystem.setIntensity(1.0);
                    this.rainSystem.setWind(5, Math.random() * Math.PI * 2);
                }
                break;
        }
    }
    
    clearAdditionalClouds() {
        // Remove all additional clouds from the scene
        this.clouds.forEach((cloud, index) => {
            if (index >= 50) {  // Keep the first 50 base clouds
                this.cloudLayer.remove(cloud.mesh);
                this.clouds.delete(index);
            }
        });
    }
    
    updateCloudScale(scale) {
        this.clouds.forEach(cloud => {
            cloud.mesh.scale.set(scale, scale, scale);
        });
    }
    
    setCloudCount(count) {
        // Adjust the base cloud count (will be used for new weather transitions)
        this.cloudCount = count;
    }
    
    generateAdditionalClouds(count = 20, options = {}) {
        const {
            heightRange = [200, 400],
            scaleMultiplier = 1.0,
            spread = 1.0,
            color = 0xffffff
        } = options;

        const startIndex = this.clouds.size;
        for (let i = 0; i < count; i++) {
            const cloud = this.createCloud(color);
            
            // Position with custom height range and spread
            cloud.position.set(
                (Math.random() - 0.5) * 2000 * spread,
                heightRange[0] + Math.random() * (heightRange[1] - heightRange[0]),
                (Math.random() - 0.5) * 2000 * spread
            );
            
            // Apply scale
            cloud.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);
            
            // Random rotation
            cloud.rotation.y = Math.random() * Math.PI * 2;
            
            this.cloudLayer.add(cloud);
            this.clouds.set(startIndex + i, {
                mesh: cloud,
                speed: 0.05 + Math.random() * 0.1,
                direction: new THREE.Vector3(
                    Math.random() - 0.5,
                    0,
                    Math.random() - 0.5
                ).normalize()
            });
        }
    }
    
    createCloud(color = 0xffffff) {
        // Create a group for the cloud parts
        const cloudGroup = new THREE.Group();
        
        // Cloud material with soft edges
        const cloudMaterial = new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            flatShading: true
        });
        
        // Create multiple spheres for one cloud with varied sizes
        const sphereCount = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < sphereCount; i++) {
            const size = 20 + Math.random() * 30;
            const geometry = new THREE.SphereGeometry(size, 8, 8);
            const cloudPart = new THREE.Mesh(geometry, cloudMaterial);
            
            // Position each sphere slightly offset
            cloudPart.position.set(
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 40
            );
            
            cloudGroup.add(cloudPart);
        }
        
        return cloudGroup;
    }
    
    darkendClouds() {
        this.clouds.forEach(cloud => {
            cloud.mesh.traverse(child => {
                if (child.material) {
                    child.material.color.setHex(0x666666);
                }
            });
        });
    }
    
    updateFog(intensity) {
        if (this.scene.fog) {
            this.scene.fog.density = intensity;
            this.scene.fog.near = 100 + intensity * 400;
            this.scene.fog.far = 1000 - intensity * 500;
        }
    }
    
    updateCloudOpacity(targetOpacity) {
        this.clouds.forEach(cloud => {
            cloud.mesh.traverse(child => {
                if (child.material) {
                    child.material.opacity = targetOpacity;
                }
            });
        });
    }
    
    update(deltaTime) {
        // Update cloud positions
        this.clouds.forEach(cloud => {
            cloud.mesh.position.add(
                cloud.direction.clone().multiplyScalar(cloud.speed * deltaTime)
            );
            
            // Wrap clouds around when they go too far
            const maxDistance = 1500;
            if (cloud.mesh.position.length() > maxDistance) {
                const normalized = cloud.mesh.position.clone().normalize();
                cloud.mesh.position.copy(
                    normalized.multiplyScalar(-maxDistance)
                );
            }
        });
        
        // Update rain system
        let rainIntensity = 0;
        if (this.rainSystem && this.rainSystem.enabled) {
            this.rainSystem.update(deltaTime);
            rainIntensity = this.weatherIntensity;
        }
        
        // Update ground effects
        if (this.groundEffects) {
            this.groundEffects.update(deltaTime, rainIntensity);
        }
        
        // Update weather transition
        if (this.weatherTransitionTime > 0) {
            this.weatherIntensity = Math.min(
                1,
                this.weatherIntensity + (deltaTime / this.weatherTransitionTime)
            );
            
            // Update weather effects based on intensity
            switch (this.currentWeather) {
                case 'clear':
                    this.updateFog(0);
                    this.updateCloudOpacity(0.6 * this.weatherIntensity);
                    break;
                    
                case 'cloudy':
                    this.updateFog(0.2 * this.weatherIntensity);
                    this.updateCloudOpacity(this.weatherIntensity);
                    break;
                    
                case 'foggy':
                    this.updateFog(0.8 * this.weatherIntensity);
                    this.updateCloudOpacity(0.8 * this.weatherIntensity);
                    break;
                    
                case 'storm':
                    this.updateFog(0.4 * this.weatherIntensity);
                    this.updateCloudOpacity(this.weatherIntensity);
                    if (this.rainSystem) {
                        this.rainSystem.setIntensity(this.weatherIntensity);
                    }
                    break;
            }
        }
        
        // Update cloud appearance based on time of day
        const timeOfDay = this.timeSystem.getTimeOfDay();
        const isDaytime = timeOfDay > 6 && timeOfDay < 18;
        const isSunset = timeOfDay >= 18 && timeOfDay < 20;
        
        this.clouds.forEach(cloud => {
            cloud.mesh.traverse(child => {
                if (child.material) {
                    if (isDaytime) {
                        child.material.emissive.setHex(0x000000);
                    } else if (isSunset) {
                        child.material.emissive.setHex(0x331100);
                    } else {
                        child.material.emissive.setHex(0x111111);
                    }
                }
            });
        });
    }

    getFrictionModifier() {
        return this.groundEffects ? this.groundEffects.getFrictionModifier() : 1.0;
    }
} 