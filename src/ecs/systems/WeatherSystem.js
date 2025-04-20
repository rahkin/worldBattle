import { System } from '../core/System.js';
import * as THREE from 'three';

export class WeatherSystem extends System {
    constructor() {
        super();
        this.particles = [];
        this.weatherType = 'clear';
        this.intensity = 0;
        this.particleSystem = null;
        this.weatherEffects = new Map();
    }

    init() {
        this.setupWeatherEffects();
        return Promise.resolve();
    }

    setupWeatherEffects() {
        // Rain effect
        const rainGeometry = new THREE.BufferGeometry();
        const rainMaterial = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 0.1,
            transparent: true,
            opacity: 0.6
        });

        // Snow effect
        const snowGeometry = new THREE.BufferGeometry();
        const snowMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.2,
            transparent: true,
            opacity: 0.8
        });

        this.weatherEffects.set('rain', { geometry: rainGeometry, material: rainMaterial });
        this.weatherEffects.set('snow', { geometry: snowGeometry, material: snowMaterial });
    }

    setWeather(type, intensity = 1.0) {
        this.weatherType = type;
        this.intensity = Math.max(0, Math.min(1, intensity));
        this.updateParticles();
    }

    updateParticles() {
        const effect = this.weatherEffects.get(this.weatherType);
        if (!effect) return;

        const particleCount = Math.floor(1000 * this.intensity);
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;     // x
            positions[i * 3 + 1] = Math.random() * 50;          // y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100; // z
        }

        effect.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        if (this.particleSystem) {
            this.getSystem('SceneManager').scene.remove(this.particleSystem);
        }

        this.particleSystem = new THREE.Points(effect.geometry, effect.material);
        this.getSystem('SceneManager').scene.add(this.particleSystem);
    }

    update(deltaTime) {
        if (!this.particleSystem || this.weatherType === 'clear') return;

        const positions = this.particleSystem.geometry.attributes.position.array;
        const fallSpeed = this.weatherType === 'rain' ? 10 : 2; // Rain falls faster than snow

        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] -= fallSpeed * deltaTime; // Update Y position

            // Reset particles that fall below ground
            if (positions[i + 1] < 0) {
                positions[i + 1] = 50; // Reset to top
                positions[i] = (Math.random() - 0.5) * 100;     // Randomize X
                positions[i + 2] = (Math.random() - 0.5) * 100; // Randomize Z
            }
        }

        this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    cleanup() {
        if (this.particleSystem) {
            this.getSystem('SceneManager').scene.remove(this.particleSystem);
        }

        this.weatherEffects.forEach(effect => {
            effect.geometry.dispose();
            effect.material.dispose();
        });

        this.weatherEffects.clear();
        this.particleSystem = null;
    }
} 