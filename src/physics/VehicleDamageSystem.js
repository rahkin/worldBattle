import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class VehicleDamageSystem {
    constructor(vehicle, scene, world) {
        this.vehicle = vehicle;
        this.scene = scene;
        this.world = world;
        this.maxHealth = 100;
        this.currentHealth = this.maxHealth;
        this.damageThresholds = {
            minor: 75,    // 75-100% health
            moderate: 50, // 50-75% health
            severe: 25,   // 25-50% health
            critical: 0   // 0-25% health
        };
        this.damageEffects = new Map();
        this.isDestroyed = false;
        this.isRespawning = false;
        this.recoveryCooldown = 0;
    }

    applyDamage(amount) {
        if (this.isDestroyed) return;

        this.currentHealth = Math.max(0, this.currentHealth - amount);
        console.log('Vehicle damage applied:', {
            amount: amount,
            currentHealth: this.currentHealth,
            maxHealth: this.maxHealth
        });

        if (this.currentHealth <= 0 && !this.isDestroyed) {
            this.isDestroyed = true;
            console.log('Vehicle destroyed, triggering explosion');
            
            // Store position before any cleanup
            const explosionPosition = this.vehicle._vehicle ? 
                this.vehicle._vehicle.chassisBody.position.clone() : 
                this.vehicle.chassisMesh.position.clone();

            // Dispatch destroyed event first
            window.dispatchEvent(new CustomEvent('vehicleDestroyed', {
                detail: { vehicleId: this.vehicle.id }
            }));

            // Create explosion effect at stored position
            this._createExplosionEffect(explosionPosition);
        }
    }

    _updateDamageState() {
        // Remove old damage effects
        this.damageEffects.forEach(effect => {
            this.scene.remove(effect);
        });
        this.damageEffects.clear();

        // Add new damage effects based on health
        if (this.currentHealth < this.damageThresholds.moderate) {
            this._addModerateDamage();
        }
        if (this.currentHealth < this.damageThresholds.severe) {
            this._addSevereDamage();
        }
        if (this.currentHealth < this.damageThresholds.critical) {
            this._addCriticalDamage();
        }
    }

    _addModerateDamage() {
        // Add dents and scratches
        const damageMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            roughness: 0.9,
            metalness: 0.1,
            transparent: true,
            opacity: 0.8
        });

        // Create random dents
        for (let i = 0; i < 3; i++) {
            const dentSize = Math.random() * 0.2 + 0.1;
            const dentGeometry = new THREE.SphereGeometry(dentSize, 8, 8);
            const dent = new THREE.Mesh(dentGeometry, damageMaterial);
            
            // Random position on vehicle
            dent.position.set(
                (Math.random() - 0.5) * this.vehicle.options.width,
                (Math.random() - 0.5) * this.vehicle.options.height,
                (Math.random() - 0.5) * this.vehicle.options.length
            );
            
            this.vehicle.chassisMesh.add(dent);
            this.damageEffects.set(`dent_${i}`, dent);
        }

        // Add scratches to the chassis material
        if (this.vehicle.chassisMesh.material) {
            this.vehicle.chassisMesh.material.roughness = 0.8;
            this.vehicle.chassisMesh.material.metalness = 0.2;
        }

        // Add small smoke particles
        this._createSmokeEffect(20, 0.1, 0.3);
    }

    _addSevereDamage() {
        // Add more severe damage like broken parts
        const brokenMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            roughness: 0.8,
            metalness: 0.3,
            transparent: true,
            opacity: 0.7
        });

        // Create broken panels
        for (let i = 0; i < 2; i++) {
            const panelSize = Math.random() * 0.3 + 0.2;
            const panelGeometry = new THREE.BoxGeometry(panelSize, panelSize * 0.1, panelSize);
            const panel = new THREE.Mesh(panelGeometry, brokenMaterial);
            
            // Random position and rotation
            panel.position.set(
                (Math.random() - 0.5) * this.vehicle.options.width,
                (Math.random() - 0.5) * this.vehicle.options.height,
                (Math.random() - 0.5) * this.vehicle.options.length
            );
            panel.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            this.vehicle.chassisMesh.add(panel);
            this.damageEffects.set(`panel_${i}`, panel);
        }

        // Add more smoke
        this._createSmokeEffect(30, 0.2, 0.4);
    }

    _addCriticalDamage() {
        // Add critical damage effects like smoke and fire
        this._createSmokeEffect(50, 0.3, 0.5);
        this._createFireEffect();
    }

    _createImpactEffect(position, force) {
        // Create impact particles at the vehicle's position
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);

        // Convert CANNON.Vec3 to THREE.Vector3 if needed
        const impactPos = position instanceof CANNON.Vec3 ? 
            new THREE.Vector3(position.x, position.y, position.z) : 
            position;

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            particlePositions[i3] = impactPos.x + (Math.random() - 0.5) * 0.5;
            particlePositions[i3 + 1] = impactPos.y + (Math.random() - 0.5) * 0.5;
            particlePositions[i3 + 2] = impactPos.z + (Math.random() - 0.5) * 0.5;
            particleSizes[i] = Math.random() * 0.1 + 0.05;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0x888888,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
        this.damageEffects.set('impact_particles', particles);

        // Remove particles after a short time
        setTimeout(() => {
            this.scene.remove(particles);
            this.damageEffects.delete('impact_particles');
        }, 1000);
    }

    _createSmokeEffect(particleCount = 50, minSize = 0.1, maxSize = 0.2) {
        const smokeGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        // Initialize particle positions around the vehicle
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * this.vehicle.options.width;
            positions[i3 + 1] = (Math.random() - 0.5) * this.vehicle.options.height;
            positions[i3 + 2] = (Math.random() - 0.5) * this.vehicle.options.length;
            sizes[i] = Math.random() * (maxSize - minSize) + minSize;
        }

        smokeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        smokeGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const smokeMaterial = new THREE.PointsMaterial({
            color: 0x333333,
            size: 0.2,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending
        });

        const smoke = new THREE.Points(smokeGeometry, smokeMaterial);
        this.vehicle.chassisMesh.add(smoke);
        this.damageEffects.set('smoke', smoke);
    }

    _createFireEffect() {
        const particleCount = 30;
        const fireGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        // Initialize fire particle positions
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * this.vehicle.options.width;
            positions[i3 + 1] = (Math.random() - 0.5) * this.vehicle.options.height;
            positions[i3 + 2] = (Math.random() - 0.5) * this.vehicle.options.length;
            sizes[i] = Math.random() * 0.2 + 0.1;
        }

        fireGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        fireGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const fireMaterial = new THREE.PointsMaterial({
            color: 0xff6600,
            size: 0.3,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending
        });

        const fire = new THREE.Points(fireGeometry, fireMaterial);
        this.vehicle.chassisMesh.add(fire);
        this.damageEffects.set('fire', fire);
    }

    _triggerExplosion() {
        if (!this.vehicle._vehicle) return;
        
        console.log('Triggering explosion effect');
        
        // Store the vehicle's position before cleanup
        const explosionPosition = this.vehicle._vehicle.chassisBody.position.clone();
        
        // Hide vehicle meshes first
        if (this.vehicle.chassisMesh) {
            this.vehicle.chassisMesh.visible = false;
        }
        if (this.vehicle.wheelMeshes) {
            this.vehicle.wheelMeshes.forEach(wheel => {
                if (wheel) wheel.visible = false;
            });
        }

        // Remove vehicle physics before explosion effect
        if (this.vehicle._vehicle && this.world) {
            // Remove wheel constraints first
            if (this.vehicle._vehicle.wheelConstraints) {
                this.vehicle._vehicle.wheelConstraints.forEach(constraint => {
                    if (constraint && this.world.constraints.includes(constraint)) {
                        this.world.removeConstraint(constraint);
                    }
                });
            }

            // Remove wheel bodies
            if (this.vehicle._vehicle.wheels) {
                this.vehicle._vehicle.wheels.forEach(wheel => {
                    if (wheel.body && this.world.bodies.includes(wheel.body)) {
                        this.world.removeBody(wheel.body);
                    }
                });
            }

            // Remove chassis body last
            if (this.vehicle._vehicle.chassisBody && this.world.bodies.includes(this.vehicle._vehicle.chassisBody)) {
                this.world.removeBody(this.vehicle._vehicle.chassisBody);
            }
        }

        // Create explosion effect at stored position
        this._createExplosionEffect(explosionPosition);
    }

    _createExplosionEffect(position) {
        console.log('Creating explosion effect at position:', position);
        
        // Create explosion geometry
        const explosionGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            transparent: true,
            opacity: 1
        });
        
        this.explosionMesh = new THREE.Mesh(explosionGeometry, explosionMaterial);
        this.explosionMesh.position.copy(position);
        this.scene.add(this.explosionMesh);
        
        // Create shockwave effect
        const shockwaveGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
        const shockwaveMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        this.shockwaveMesh = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
        this.shockwaveMesh.position.copy(position);
        this.shockwaveMesh.rotation.x = -Math.PI / 2; // Align with ground
        this.scene.add(this.shockwaveMesh);
        
        // Animate explosion
        const startScale = 1;
        const endScale = 4;
        const duration = 800; // ms
        const startTime = Date.now();
        
        const animateExplosion = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Scale up explosion
            const currentScale = startScale + (endScale - startScale) * progress;
            this.explosionMesh.scale.set(currentScale, currentScale, currentScale);
            
            // Scale up shockwave
            const shockwaveScale = currentScale * 2;
            this.shockwaveMesh.scale.set(shockwaveScale, shockwaveScale, shockwaveScale);
            
            // Fade out
            const opacity = 1 - progress;
            this.explosionMesh.material.opacity = opacity;
            this.shockwaveMesh.material.opacity = opacity * 0.8;
            
            if (progress < 1) {
                requestAnimationFrame(animateExplosion);
            } else {
                // Cleanup after animation
                if (this.explosionMesh && this.explosionMesh.parent) {
                    this.scene.remove(this.explosionMesh);
                    this.explosionMesh.geometry.dispose();
                    this.explosionMesh.material.dispose();
                }
                if (this.shockwaveMesh && this.shockwaveMesh.parent) {
                    this.scene.remove(this.shockwaveMesh);
                    this.shockwaveMesh.geometry.dispose();
                    this.shockwaveMesh.material.dispose();
                }
                console.log('Explosion effect complete');
            }
        };
        
        requestAnimationFrame(animateExplosion);
    }

    cleanup() {
        console.log('Cleaning up damage system');
        
        // Remove explosion meshes if they exist
        if (this.explosionMesh && this.explosionMesh.parent) {
            this.scene.remove(this.explosionMesh);
            this.explosionMesh.geometry.dispose();
            this.explosionMesh.material.dispose();
        }
        if (this.shockwaveMesh && this.shockwaveMesh.parent) {
            this.scene.remove(this.shockwaveMesh);
            this.shockwaveMesh.geometry.dispose();
            this.shockwaveMesh.material.dispose();
        }
        
        // Clear references
        this.explosionMesh = null;
        this.shockwaveMesh = null;
    }

    update(deltaTime) {
        // Update damage effects
        this.damageEffects.forEach((effect, key) => {
            if (key === 'smoke' || key === 'fire') {
                // Update particle positions
                const positions = effect.geometry.attributes.position.array;
                const sizes = effect.geometry.attributes.size.array;
                
                for (let i = 0; i < positions.length; i += 3) {
                    // Move particles upward and slightly outward
                    positions[i] += (Math.random() - 0.5) * 0.1;
                    positions[i + 1] += Math.random() * 0.2;
                    positions[i + 2] += (Math.random() - 0.5) * 0.1;
                    
                    // Reset particles that have moved too far
                    if (positions[i + 1] > this.vehicle.options.height * 2) {
                        positions[i] = (Math.random() - 0.5) * this.vehicle.options.width;
                        positions[i + 1] = (Math.random() - 0.5) * this.vehicle.options.height;
                        positions[i + 2] = (Math.random() - 0.5) * this.vehicle.options.length;
                    }
                }
                
                effect.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    reset() {
        console.log('Resetting damage system');
        this.currentHealth = this.maxHealth;
        this.isDestroyed = false;
        this.isRespawning = false;
        this.recoveryCooldown = 0;
        
        // Show vehicle mesh
        if (this.vehicle.chassisMesh) {
            this.vehicle.chassisMesh.visible = true;
        }
        
        // Show wheel meshes
        this.vehicle.wheelMeshes.forEach(wheel => {
            if (wheel) wheel.visible = true;
        });
        
        this._clearDamageEffects();
        console.log('Damage system reset complete');
    }

    _clearDamageEffects() {
        // Clear all damage effects
        this.damageEffects.forEach(effect => {
            this.scene.remove(effect);
        });
        this.damageEffects.clear();

        // Reset vehicle visibility
        if (this.vehicle.chassisMesh) {
            this.vehicle.chassisMesh.visible = true;
        }
        this.vehicle.wheelMeshes.forEach(wheel => {
            if (wheel) wheel.visible = true;
        });

        // Reset vehicle material
        if (this.vehicle.chassisMesh.material) {
            this.vehicle.chassisMesh.material.roughness = 0.5;
            this.vehicle.chassisMesh.material.metalness = 0.5;
        }
    }

    heal(amount) {
        if (this.isDestroyed || this.isRespawning) return; // Don't heal if destroyed or respawning
        
        const oldHealth = this.currentHealth;
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
        
        console.log('Health after healing:', {
            oldHealth,
            healAmount: amount,
            newHealth: this.currentHealth
        });
        
        // Clear damage effects if health improved significantly
        if (this.currentHealth > oldHealth) {
            this._updateDamageState();
        }
        
        return this.currentHealth - oldHealth; // Return amount actually healed
    }
} 