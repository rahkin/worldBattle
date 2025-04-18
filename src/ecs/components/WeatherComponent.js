import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { Component } from '../core/Component.js';

export class WeatherComponent extends Component {
    constructor(config = {}) {
        super();
        this.type = config.type || 'clear';
        this.intensity = config.intensity || 1.0;
        this.windSpeed = config.windSpeed || 0;
        this.windDirection = config.windDirection || 0;
        this.temperature = config.temperature || 20;
        this.humidity = config.humidity || 50;
        this.precipitation = config.precipitation || 0;
        this.scene = null;
        this.particles = [];
        this.particleSystem = null;
        this.currentWeather = 'clear';
        this.weatherIntensity = 1.0;
        this.transitionTime = 0;
        this.targetWeather = 'clear';
        this.targetIntensity = 1.0;
        this.weatherEffects = {
            rain: false,
            snow: false,
            fog: false,
            storm: false
        };
        this.weatherTransitionTime = 0;
        this.lastWeatherCheck = 0;
        this.weatherCheckInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        // User location
        this.userLocation = null;
        this.locationError = null;

        // Cloud materials for different times of day
        this.cloudMaterials = this.initCloudMaterials();
        
        // Cloud system
        this.clouds = new Map();
        this.cloudCount = 50;
        this.cloudLayer = new THREE.Group();
    }

    initCloudMaterials() {
        return {
            day: new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8,
                flatShading: true,
                roughness: 0.8,
                metalness: 0.0
            }),
            dawn: new THREE.MeshStandardMaterial({
                color: 0xffb74d,
                transparent: true,
                opacity: 0.8,
                flatShading: true,
                emissive: 0x552211,
                emissiveIntensity: 0.2,
                roughness: 0.8,
                metalness: 0.0
            }),
            dusk: new THREE.MeshStandardMaterial({
                color: 0xff9800,
                transparent: true,
                opacity: 0.8,
                flatShading: true,
                emissive: 0x552211,
                emissiveIntensity: 0.2,
                roughness: 0.8,
                metalness: 0.0
            }),
            night: new THREE.MeshStandardMaterial({
                color: 0x555555,
                transparent: true,
                opacity: 0.6,
                flatShading: true,
                emissive: 0x222222,
                emissiveIntensity: 0.1,
                roughness: 0.8,
                metalness: 0.0
            })
        };
    }

    async init(scene) {
        // If no scene is provided but we have one stored, use that
        if (!scene && this.scene) {
            scene = this.scene;
        }
        
        if (!scene || !(scene instanceof THREE.Scene)) {
            throw new Error('Valid Three.js Scene must be provided to WeatherComponent.init()');
        }
        
        this.scene = scene;
        await this.setupParticleSystem();
        this.setWeather('clear', 1.0);
        
        return this;
    }

    setupParticleSystem() {
        if (!this.scene) return;

        const particleCount = 1000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = Math.random() * 50;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

            velocities[i * 3] = 0;
            velocities[i * 3 + 1] = -1;
            velocities[i * 3 + 2] = 0;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.6
        });

        this.particleSystem = new THREE.Points(particles, material);
        this.particleSystem.visible = false;
        this.scene.add(this.particleSystem);
    }

    setLocation(latitude, longitude) {
        this.userLocation = { latitude, longitude };
    }

    setWeather(type, intensity = 1.0) {
        this.type = type;
        this.intensity = intensity;
        
        // Update weather effects based on type
        switch (type) {
            case 'rain':
                this.precipitation = intensity;
                this.humidity = 100;
                this.temperature = Math.max(0, this.temperature - 5 * intensity);
                break;
            case 'snow':
                this.precipitation = intensity;
                this.humidity = 100;
                this.temperature = Math.min(0, this.temperature - 10 * intensity);
                break;
            case 'fog':
                this.humidity = 100;
                this.temperature = this.temperature - 2 * intensity;
                break;
            case 'clear':
                this.precipitation = 0;
                this.humidity = Math.max(30, this.humidity - 20 * intensity);
                break;
        }

        this.targetWeather = type;
        this.targetIntensity = intensity;
        this.transitionTime = 2.0; // 2 seconds transition time
    }

    getCloudMaterial(timeOfDay) {
        if (timeOfDay >= 5 && timeOfDay < 7) { // Dawn
            return this.cloudMaterials.dawn;
        } else if (timeOfDay >= 7 && timeOfDay < 17) { // Day
            return this.cloudMaterials.day;
        } else if (timeOfDay >= 17 && timeOfDay < 19) { // Dusk
            return this.cloudMaterials.dusk;
        } else { // Night
            return this.cloudMaterials.night;
        }
    }

    updateFog(intensity, timeOfDay) {
        if (this.scene.fog) {
            // Adjust fog based on time of day
            if (timeOfDay >= 4.5 && timeOfDay < 6.0) {
                // During dawn, reduce fog to allow stars to be visible
                this.scene.fog.density = intensity * 0.5;
            } else {
                this.scene.fog.density = intensity;
            }

            // Update fog color based on time of day
            if (timeOfDay >= 5 && timeOfDay < 7) { // Dawn
                this.scene.fog.color.setHex(0xffb74d);
            } else if (timeOfDay >= 7 && timeOfDay < 17) { // Day
                this.scene.fog.color.setHex(0xcfcfcf);
            } else if (timeOfDay >= 17 && timeOfDay < 19) { // Dusk
                this.scene.fog.color.setHex(0xff9800);
            } else { // Night
                this.scene.fog.color.setHex(0x222222);
            }
        }
    }

    updateCloudOpacity(targetOpacity, timeOfDay) {
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

    calculateSunPosition(timeOfDay, latitude) {
        // Convert time to angle (24 hours = 360 degrees)
        const timeAngle = ((timeOfDay - 6) * 15) % 360; // Offset by 6 hours so noon is at peak
        
        // Convert to radians
        const theta = THREE.MathUtils.degToRad(timeAngle);
        const phi = THREE.MathUtils.degToRad(90 - latitude);
        
        // Calculate sun position
        const sunPosition = new THREE.Vector3();
        sunPosition.setFromSphericalCoords(1, phi, theta);
        
        // Rotate based on latitude
        const latitudeRotation = new THREE.Matrix4();
        latitudeRotation.makeRotationX(THREE.MathUtils.degToRad(latitude));
        sunPosition.applyMatrix4(latitudeRotation);
        
        return sunPosition;
    }

    update(deltaTime) {
        if (this.transitionTime > 0) {
            this.transitionTime -= deltaTime;
            const progress = 1 - (this.transitionTime / 2.0);
            
            // Smoothly transition weather effects
            if (this.targetWeather === 'rain') {
                this.weatherEffects.rain = progress > 0.5;
            } else if (this.targetWeather === 'snow') {
                this.weatherEffects.snow = progress > 0.5;
            } else if (this.targetWeather === 'fog') {
                this.weatherEffects.fog = progress > 0.5;
            } else if (this.targetWeather === 'storm') {
                this.weatherEffects.storm = progress > 0.5;
            }

            // Update intensity
            this.weatherIntensity = this.targetIntensity * progress + 
                                  this.weatherIntensity * (1 - progress);

            if (this.transitionTime <= 0) {
                this.currentWeather = this.targetWeather;
                this.weatherIntensity = this.targetIntensity;
                this.transitionTime = 0;
            }
        }

        if (!this.particleSystem || !this.particleSystem.visible) return;

        const positions = this.particleSystem.geometry.attributes.position.array;
        const velocities = this.particleSystem.geometry.attributes.velocity.array;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i] * deltaTime;
            positions[i + 1] += velocities[i + 1] * deltaTime;
            positions[i + 2] += velocities[i + 2] * deltaTime;

            if (positions[i + 1] < 0) {
                positions[i] = (Math.random() - 0.5) * 100;
                positions[i + 1] = 50;
                positions[i + 2] = (Math.random() - 0.5) * 100;
            }
        }

        this.particleSystem.geometry.attributes.position.needsUpdate = true;

        // Update weather parameters over time
        if (this.type === 'rain' || this.type === 'snow') {
            this.precipitation = Math.max(0, this.precipitation - deltaTime * 0.1);
            if (this.precipitation <= 0) {
                this.setWeather('clear');
            }
        }
    }

    setWind(speed, direction) {
        this.windSpeed = speed;
        this.windDirection = direction;
    }

    setTemperature(temperature) {
        this.temperature = temperature;
    }

    setHumidity(humidity) {
        this.humidity = humidity;
    }

    cleanup() {
        if (this.particleSystem && this.scene) {
            this.scene.remove(this.particleSystem);
            this.particleSystem.geometry.dispose();
            this.particleSystem.material.dispose();
        }
        this.scene = null;
    }
} 