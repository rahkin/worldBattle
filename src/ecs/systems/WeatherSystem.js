import { System } from '../core/System.js';
import { WeatherComponent } from '../components/WeatherComponent.js';
import { TimeComponent } from '../components/TimeComponent.js';
import { OpenWeatherMapService } from '../../core/OpenWeatherMapService.js';
import * as THREE from 'three';

export class WeatherSystem extends System {
    constructor() {
        super();
        this.requiredComponents = [WeatherComponent];
        this.particleSystems = {
            rain: null,
            snow: null,
            fog: null
        };
        this.weatherTypes = ['clear', 'rain', 'snow', 'fog'];
        this.currentWeather = 'clear';
        this.weatherIntensity = 1.0;
        
        // Debug environment variables
        console.log('Environment variables:', import.meta.env);
        console.log('OpenWeather API Key:', import.meta.env.VITE_OPENWEATHER_API_KEY);
        
        // Get API key from environment variable
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
        if (!apiKey) {
            console.warn('OpenWeather API key not found in environment variables. Weather updates will be disabled.');
            this.weatherService = null;
        } else {
            console.log('OpenWeather API key found, initializing weather service...');
            this.weatherService = new OpenWeatherMapService(apiKey);
        }
    }

    async init() {
        // Create particle systems
        this.createRainSystem();
        this.createSnowSystem();
        this.createFogSystem();

        try {
            // Find or create weather entity
            const entities = this.getEntities();
            if (entities.length === 0) {
                console.log('Creating new weather entity');
                const weatherEntity = this.world.createEntity();
                const weatherComponent = new WeatherComponent();
                
                // Store the scene in the component before adding it
                weatherComponent.scene = this.world.getSystem('SceneSystem').getScene();
                
                // Add the component to the entity
                console.log('Adding weather component to entity');
                await weatherEntity.addComponent(weatherComponent);
                
                // Initialize the component with the scene
                console.log('Initializing weather component with scene:', !!this.world.getSystem('SceneSystem').getScene());
                await weatherComponent.init(this.world.getSystem('SceneSystem').getScene());
            } else {
                console.log('Found existing weather entities:', entities.length);
                // Initialize existing weather components
                for (const entity of entities) {
                    const weatherComponent = entity.getComponent(WeatherComponent);
                    if (weatherComponent && !weatherComponent.scene) {
                        console.log('Initializing existing weather component with scene');
                        await weatherComponent.init(this.world.getSystem('SceneSystem').getScene());
                    }
                }
            }

            console.log('WeatherSystem initialization complete');
        } catch (error) {
            console.error('Error during WeatherSystem initialization:', error);
            throw error;
        }
    }

    createRainSystem() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const velocity = [];

        for (let i = 0; i < 10000; i++) {
            const x = Math.random() * 2000 - 1000;
            const y = Math.random() * 2000 - 1000;
            const z = Math.random() * 2000 - 1000;
            vertices.push(x, y, z);
            velocity.push(0, -1, 0);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocity, 3));

        const material = new THREE.PointsMaterial({
            size: 0.1,
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.6
        });

        this.particleSystems.rain = new THREE.Points(geometry, material);
        this.particleSystems.rain.visible = false;
    }

    createSnowSystem() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const velocity = [];

        for (let i = 0; i < 10000; i++) {
            const x = Math.random() * 2000 - 1000;
            const y = Math.random() * 2000 - 1000;
            const z = Math.random() * 2000 - 1000;
            vertices.push(x, y, z);
            velocity.push(
                (Math.random() - 0.5) * 0.2,
                -Math.random() * 0.5,
                (Math.random() - 0.5) * 0.2
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocity, 3));

        const material = new THREE.PointsMaterial({
            size: 0.2,
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });

        this.particleSystems.snow = new THREE.Points(geometry, material);
        this.particleSystems.snow.visible = false;
    }

    createFogSystem() {
        const scene = this.world.getSystem('SceneSystem').getScene();
        scene.fog = new THREE.FogExp2(0xcccccc, 0.002);
        scene.fog.visible = false;
    }

    update(deltaTime) {
        const entities = this.getEntities();
        for (const entity of entities) {
            const weather = entity.getComponent(WeatherComponent);
            if (weather) {
                weather.update(deltaTime);
            }
        }

        // Update particle systems
        if (this.particleSystems.rain.visible) {
            this.updateRainParticles(deltaTime);
        }
        if (this.particleSystems.snow.visible) {
            this.updateSnowParticles(deltaTime);
        }
    }

    updateRainParticles(deltaTime) {
        const positions = this.particleSystems.rain.geometry.attributes.position.array;
        const velocity = this.particleSystems.rain.geometry.attributes.velocity.array;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocity[i] * deltaTime * this.weatherIntensity;
            positions[i + 1] += velocity[i + 1] * deltaTime * this.weatherIntensity;
            positions[i + 2] += velocity[i + 2] * deltaTime * this.weatherIntensity;

            if (positions[i + 1] < -1000) {
                positions[i + 1] = 1000;
            }
        }

        this.particleSystems.rain.geometry.attributes.position.needsUpdate = true;
    }

    updateSnowParticles(deltaTime) {
        const positions = this.particleSystems.snow.geometry.attributes.position.array;
        const velocity = this.particleSystems.snow.geometry.attributes.velocity.array;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocity[i] * deltaTime * this.weatherIntensity;
            positions[i + 1] += velocity[i + 1] * deltaTime * this.weatherIntensity;
            positions[i + 2] += velocity[i + 2] * deltaTime * this.weatherIntensity;

            if (positions[i + 1] < -1000) {
                positions[i + 1] = 1000;
                positions[i] = Math.random() * 2000 - 1000;
                positions[i + 2] = Math.random() * 2000 - 1000;
            }
        }

        this.particleSystems.snow.geometry.attributes.position.needsUpdate = true;
    }

    setWeather(type, intensity = 1.0) {
        if (!this.weatherTypes.includes(type)) return;

        this.currentWeather = type;
        this.weatherIntensity = intensity;

        // Update particle systems visibility
        this.particleSystems.rain.visible = type === 'rain';
        this.particleSystems.snow.visible = type === 'snow';
        
        const scene = this.world.getSystem('SceneSystem').getScene();
        if (scene.fog) {
            scene.fog.visible = type === 'fog';
            if (type === 'fog') {
                scene.fog.density = 0.002 * intensity;
            }
        }

        // Update entities
        const entities = this.getEntities();
        for (const entity of entities) {
            const weather = entity.getComponent(WeatherComponent);
            if (weather) {
                weather.setWeather(type, intensity);
            }
        }
    }

    async updateWeatherFromAPI(weatherComponent) {
        if (!weatherComponent.userLocation) return;

        const { latitude, longitude } = weatherComponent.userLocation;
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
            
            weatherComponent.setWeather(weatherData.type, 5);
        } else {
            console.warn('No weather data received from API');
            weatherComponent.setWeather('clear'); // Default to clear weather
        }
    }

    cleanup() {
        // Dispose of particle systems
        for (const system of Object.values(this.particleSystems)) {
            if (system) {
                system.geometry.dispose();
                system.material.dispose();
            }
        }

        // Remove fog from scene
        const scene = this.world.getSystem('SceneSystem').getScene();
        if (scene.fog) {
            scene.fog = null;
        }
    }
} 