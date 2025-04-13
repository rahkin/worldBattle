import * as THREE from 'three';

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
        
        // Weather effects
        this.rainSystem = null;
        this.fogSystem = null;
        
        // Initialize systems
        this.initializeClouds();
        this.initializeFog();
    }
    
    initializeClouds() {
        // Create cloud instances with varied shapes
        for (let i = 0; i < this.cloudCount; i++) {
            const cloud = this.createCloud();
            
            // Random position in sky
            cloud.position.set(
                (Math.random() - 0.5) * 2000,
                500 + Math.random() * 200,
                (Math.random() - 0.5) * 2000
            );
            
            // Random rotation
            cloud.rotation.y = Math.random() * Math.PI * 2;
            
            this.cloudLayer.add(cloud);
            this.clouds.set(i, {
                mesh: cloud,
                speed: 0.1 + Math.random() * 0.2,
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
        
        // Create multiple spheres for one cloud
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
    
    initializeFog() {
        // Add fog to the scene
        this.scene.fog = new THREE.Fog(0xcfcfcf, 100, 1000);
        this.scene.fog.density = 0;
    }
    
    setWeather(type, transitionDuration = 5) {
        this.currentWeather = type;
        this.weatherTransitionTime = transitionDuration;
        this.weatherIntensity = 0;
        
        console.log(`Weather changing to ${type} over ${transitionDuration} seconds`);
        
        switch (type) {
            case 'clear':
                this.updateFog(0);
                this.updateCloudOpacity(0.8);
                break;
                
            case 'cloudy':
                this.updateFog(0.2);
                this.updateCloudOpacity(1);
                this.generateAdditionalClouds();
                break;
                
            case 'foggy':
                this.updateFog(0.8);
                this.updateCloudOpacity(0.6);
                break;
                
            case 'storm':
                this.updateFog(0.4);
                this.updateCloudOpacity(1);
                this.generateAdditionalClouds();
                this.darkendClouds();
                break;
        }
    }
    
    generateAdditionalClouds() {
        // Add more clouds for cloudy/stormy weather
        const additionalClouds = 20;
        for (let i = 0; i < additionalClouds; i++) {
            const cloud = this.createCloud();
            
            // Position new clouds at the edges
            const angle = (i / additionalClouds) * Math.PI * 2;
            cloud.position.set(
                Math.cos(angle) * 1500,
                500 + Math.random() * 200,
                Math.sin(angle) * 1500
            );
            
            this.cloudLayer.add(cloud);
            this.clouds.set(this.clouds.size, {
                mesh: cloud,
                speed: 0.2 + Math.random() * 0.3,
                direction: new THREE.Vector3(
                    Math.random() - 0.5,
                    0,
                    Math.random() - 0.5
                ).normalize()
            });
        }
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
                    this.updateCloudOpacity(0.8 * this.weatherIntensity);
                    break;
                    
                case 'cloudy':
                    this.updateFog(0.2 * this.weatherIntensity);
                    this.updateCloudOpacity(this.weatherIntensity);
                    break;
                    
                case 'foggy':
                    this.updateFog(0.8 * this.weatherIntensity);
                    this.updateCloudOpacity(0.6 * this.weatherIntensity);
                    break;
                    
                case 'storm':
                    this.updateFog(0.4 * this.weatherIntensity);
                    this.updateCloudOpacity(this.weatherIntensity);
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
} 