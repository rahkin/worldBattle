import * as THREE from 'three';
import { RainSystem } from './RainSystem.js';
import { GroundEffectsSystem } from './GroundEffectsSystem.js';
import { OpenWeatherMapService } from './OpenWeatherMapService.js';

export class WeatherSystem {
    constructor(scene, timeSystem, openWeatherMapApiKey) {
        console.log('Initializing WeatherSystem with OpenWeatherMap integration...');
        this.scene = scene;
        this.timeSystem = timeSystem;
        
        // Weather state
        this.currentWeather = 'clear';
        this.weatherTransitionTime = 0;
        this.weatherIntensity = 0;
        
        // OpenWeatherMap integration
        this.weatherService = new OpenWeatherMapService(openWeatherMapApiKey);
        this.lastWeatherCheck = 0;
        this.weatherCheckInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        // User location
        this.userLocation = null;
        this.locationError = null;
        
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
        this.initializeLocation();
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
            const timeOfDay = this.timeSystem.getTimeOfDay();
            
            // Adjust fog based on time of day
            if (timeOfDay >= 4.5 && timeOfDay < 6.0) {
                // During dawn, reduce fog to allow stars to be visible
                this.scene.fog.density = intensity * 0.5;
            } else {
                this.scene.fog.density = intensity;
            }
        }
    }
    
    updateCloudOpacity(targetOpacity) {
        const timeOfDay = this.timeSystem.getTimeOfDay();
        
        // Adjust cloud opacity based on time of day
        if (timeOfDay >= 4.5 && timeOfDay < 6.0) {
            // During dawn, make clouds more transparent to allow stars to be visible
            targetOpacity *= 0.5;
        }
        
        this.clouds.forEach(cloud => {
            cloud.mesh.traverse(child => {
                if (child.material) {
                    child.material.opacity = targetOpacity;
                    child.material.needsUpdate = true;
                }
            });
        });
    }
    
    async initializeLocation() {
        console.log('Requesting user location for weather data...');
        try {
            if ("geolocation" in navigator) {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    });
                });

                this.userLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };

                console.log('User location obtained:', this.userLocation);
                
                // Fetch initial weather data
                await this.updateWeatherFromAPI(
                    this.userLocation.latitude,
                    this.userLocation.longitude
                );
            } else {
                console.error('Geolocation is not supported by this browser');
                this.locationError = 'Geolocation not supported';
                this.setWeather('clear'); // Default to clear weather
            }
        } catch (error) {
            console.error('Error getting location:', error);
            this.locationError = error.message;
            this.setWeather('clear'); // Default to clear weather
        }
    }

    async updateWeatherFromAPI(latitude, longitude) {
        console.log('Fetching weather data for location:', { latitude, longitude });
        const weatherData = await this.weatherService.getWeather(latitude, longitude);
        if (weatherData) {
            console.log('Weather data received:', {
                type: weatherData.type,
                temperature: weatherData.temperature,
                humidity: weatherData.humidity,
                windSpeed: weatherData.windSpeed,
                windDirection: weatherData.windDirection,
                description: weatherData.description
            });
            
            this.setWeather(weatherData.type, 5);
            
            // Update rain system with real wind data if available
            if (this.rainSystem && weatherData.windSpeed) {
                console.log('Updating rain system with wind data:', {
                    speed: weatherData.windSpeed,
                    direction: weatherData.windDirection
                });
                this.rainSystem.setWind(
                    weatherData.windSpeed,
                    THREE.MathUtils.degToRad(weatherData.windDirection)
                );
            }
            
            // Update ground effects with real temperature and humidity
            if (this.groundEffects) {
                console.log('Updating ground effects with conditions:', {
                    temperature: weatherData.temperature,
                    humidity: weatherData.humidity
                });
                this.groundEffects.updateConditions(
                    weatherData.temperature,
                    weatherData.humidity
                );
            }
        } else {
            console.warn('No weather data received from API');
            this.setWeather('clear'); // Default to clear weather
        }
    }

    update(deltaTime) {
        // Check for weather updates every 5 minutes if we have user location
        const now = Date.now();
        if (this.userLocation && now - this.lastWeatherCheck >= this.weatherCheckInterval) {
            console.log('Checking for weather updates...');
            this.lastWeatherCheck = now;
            this.updateWeatherFromAPI(
                this.userLocation.latitude,
                this.userLocation.longitude
            );
        }

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