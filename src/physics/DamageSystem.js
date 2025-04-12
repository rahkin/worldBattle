import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class DamageSystem {
    constructor(vehicle, options = {}) {
        this.vehicle = vehicle;
        this.options = {
            maxHealth: options.maxHealth || 100,
            damageResistance: options.damageResistance || 1.0,
            damageThreshold: options.damageThreshold || 10
        };
        this.currentHealth = this.options.maxHealth;
        this.damageLevel = 0; // 0: no damage, 1: light, 2: medium, 3: heavy, 4: critical
        this.isDestroyed = false;
        this.explosionParticles = [];
    }

    applyDamage(amount, position, force) {
        if (this.isDestroyed) return;

        const actualDamage = amount * this.options.damageResistance;
        this.currentHealth = Math.max(0, this.currentHealth - actualDamage);
        
        // Update damage level based on health percentage
        const healthPercent = (this.currentHealth / this.options.maxHealth) * 100;
        if (healthPercent >= 75) {
            this.damageLevel = 0;
        } else if (healthPercent >= 50) {
            this.damageLevel = 1;
        } else if (healthPercent >= 25) {
            this.damageLevel = 2;
        } else if (healthPercent > 0) {
            this.damageLevel = 3;
        } else {
            this.damageLevel = 4;
            this.destroyVehicle();
        }

        // Apply visual damage effects
        this.updateVisualDamage();
    }

    updateVisualDamage() {
        // Check if vehicle and chassis mesh exist
        if (!this.vehicle || !this.vehicle.chassisMesh) {
            console.warn('Cannot update visual damage: vehicle or chassis mesh not found');
            return;
        }

        // Ensure material exists
        if (!this.vehicle.chassisMesh.material) {
            console.warn('Cannot update visual damage: chassis mesh material not found');
            return;
        }

        const material = this.vehicle.chassisMesh.material;
        
        // Ensure material has required properties
        if (!material.color || !material.emissive) {
            console.warn('Cannot update visual damage: material missing required properties');
            return;
        }
        
        switch(this.damageLevel) {
            case 0: // No damage
                material.color.setHex(0xffffff);
                material.emissive.setHex(0x000000);
                break;
            case 1: // Light damage
                material.color.setHex(0xffcc99);
                material.emissive.setHex(0x331100);
                break;
            case 2: // Medium damage
                material.color.setHex(0xff9966);
                material.emissive.setHex(0x662200);
                break;
            case 3: // Heavy damage
                material.color.setHex(0xff6633);
                material.emissive.setHex(0x993300);
                break;
            case 4: // Critical damage
                material.color.setHex(0xff3300);
                material.emissive.setHex(0xff0000);
                break;
        }
    }

    destroyVehicle() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;

        // Create explosion effect
        this.createExplosion();

        // Disable vehicle controls
        if (this.vehicle.vehicle) {
            this.vehicle.vehicle.chassisBody.mass = 0;
            this.vehicle.vehicle.chassisBody.type = CANNON.Body.STATIC;
        }

        // Break vehicle into parts
        this.breakVehicle();
    }

    createExplosion() {
        if (!this.vehicle || !this.vehicle.scene) {
            console.warn('Cannot create explosion: vehicle or scene not found');
            return;
        }

        const explosionGeometry = new THREE.SphereGeometry(1, 8, 8);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.8
        });

        // Create explosion particles
        for (let i = 0; i < 50; i++) {
            const particle = new THREE.Mesh(explosionGeometry, explosionMaterial);
            particle.scale.set(0.2, 0.2, 0.2);
            
            // Random position around vehicle
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2;
            particle.position.copy(this.vehicle.chassisMesh.position);
            particle.position.x += Math.cos(angle) * radius;
            particle.position.z += Math.sin(angle) * radius;
            particle.position.y += Math.random() * 2;

            // Random velocity
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 10,
                (Math.random() - 0.5) * 10
            );

            this.explosionParticles.push({
                mesh: particle,
                velocity: velocity,
                lifetime: 1.0,
                currentTime: 0
            });

            this.vehicle.scene.add(particle);
        }
    }

    breakVehicle() {
        if (!this.vehicle || !this.vehicle.chassisMesh || !this.vehicle.scene) {
            console.warn('Cannot break vehicle: required components not found');
            return;
        }

        // Create debris pieces
        const debrisGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const debrisMaterial = new THREE.MeshPhongMaterial({
            color: 0x888888,
            shininess: 30
        });

        for (let i = 0; i < 20; i++) {
            const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
            debris.position.copy(this.vehicle.chassisMesh.position);
            debris.position.x += (Math.random() - 0.5) * 2;
            debris.position.y += (Math.random() - 0.5) * 2;
            debris.position.z += (Math.random() - 0.5) * 2;
            
            debris.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 15,
                Math.random() * 10,
                (Math.random() - 0.5) * 15
            );

            this.explosionParticles.push({
                mesh: debris,
                velocity: velocity,
                lifetime: 3.0,
                currentTime: 0
            });

            this.vehicle.scene.add(debris);
        }

        // Remove original vehicle mesh
        this.vehicle.scene.remove(this.vehicle.chassisMesh);
        this.vehicle.wheelMeshes.forEach(wheel => {
            this.vehicle.scene.remove(wheel);
        });
    }

    update(deltaTime) {
        // Update explosion particles
        for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
            const particle = this.explosionParticles[i];
            particle.currentTime += deltaTime;
            
            if (particle.currentTime >= particle.lifetime) {
                if (this.vehicle && this.vehicle.scene) {
                    this.vehicle.scene.remove(particle.mesh);
                }
                this.explosionParticles.splice(i, 1);
            } else {
                // Update position
                particle.mesh.position.x += particle.velocity.x * deltaTime;
                particle.mesh.position.y += particle.velocity.y * deltaTime;
                particle.mesh.position.z += particle.velocity.z * deltaTime;
                
                // Apply gravity
                particle.velocity.y -= 9.8 * deltaTime;
                
                // Fade out
                const alpha = 1 - (particle.currentTime / particle.lifetime);
                particle.mesh.material.opacity = alpha;
            }
        }
    }

    reset() {
        this.currentHealth = this.options.maxHealth;
        this.damageLevel = 0;
        this.isDestroyed = false;
        this.explosionParticles = [];
        this.updateVisualDamage();
    }
} 