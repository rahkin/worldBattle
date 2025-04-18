import { Component } from '../core/Component.js';
import * as THREE from 'three';

export class Visual extends Component {
    constructor(config = {}) {
        super();
        this.mesh = config.mesh || null;
        this.material = config.material || new THREE.MeshStandardMaterial({ color: 0xffffff });
        this.castShadow = config.castShadow !== undefined ? config.castShadow : true;
        this.receiveShadow = config.receiveShadow !== undefined ? config.receiveShadow : true;
        this.visible = config.visible !== undefined ? config.visible : true;
        this.layers = config.layers || new THREE.Layers();
        this.userData = config.userData || {};
        
        // Animation properties
        this.animations = config.animations || [];
        this.mixer = null;
        this.currentAnimation = null;
        this.animationSpeed = config.animationSpeed || 1.0;
        
        // Particle system properties
        this.particleSystem = config.particleSystem || null;
        this.particleCount = config.particleCount || 100;
        this.particleSize = config.particleSize || 0.1;
        this.particleColor = config.particleColor || 0xffffff;
        
        // Post-processing effects
        this.postProcessing = {
            bloom: config.bloom || false,
            blur: config.blur || false,
            outline: config.outline || false
        };
    }

    setMesh(mesh) {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(material => material.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
        }
        this.mesh = mesh;
        this.updateMeshProperties();
    }

    setMaterial(material) {
        if (this.mesh) {
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(m => m.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
            this.mesh.material = material;
        }
        this.material = material;
    }

    updateMeshProperties() {
        if (this.mesh) {
            this.mesh.castShadow = this.castShadow;
            this.mesh.receiveShadow = this.receiveShadow;
            this.mesh.visible = this.visible;
            this.mesh.layers.copy(this.layers);
            this.mesh.userData = this.userData;
        }
    }

    playAnimation(name, options = {}) {
        if (!this.mixer || !this.animations.length) return;
        
        const clip = this.animations.find(anim => anim.name === name);
        if (!clip) return;
        
        if (this.currentAnimation) {
            this.currentAnimation.stop();
        }
        
        const action = this.mixer.clipAction(clip);
        action.setLoop(options.loop || THREE.LoopOnce);
        action.clampWhenFinished = options.clampWhenFinished || false;
        action.timeScale = options.speed || this.animationSpeed;
        action.play();
        
        this.currentAnimation = action;
        return action;
    }

    stopAnimation() {
        if (this.currentAnimation) {
            this.currentAnimation.stop();
            this.currentAnimation = null;
        }
    }

    createParticleSystem(config = {}) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);
        
        for (let i = 0; i < this.particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
            
            colors[i * 3] = (this.particleColor >> 16 & 255) / 255;
            colors[i * 3 + 1] = (this.particleColor >> 8 & 255) / 255;
            colors[i * 3 + 2] = (this.particleColor & 255) / 255;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: this.particleSize,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        this.particleSystem = new THREE.Points(geometry, material);
        return this.particleSystem;
    }

    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
        
        if (this.particleSystem) {
            // Update particle positions, colors, etc.
            const positions = this.particleSystem.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += (Math.random() - 0.5) * 0.1;
                positions[i + 1] += (Math.random() - 0.5) * 0.1;
                positions[i + 2] += (Math.random() - 0.5) * 0.1;
            }
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }
    }

    cleanup() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(material => material.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
        }
        
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.mesh);
        }
        
        if (this.particleSystem) {
            this.particleSystem.geometry.dispose();
            this.particleSystem.material.dispose();
        }
    }
} 