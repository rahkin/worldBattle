import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class VehicleDamageSystem {
    constructor(vehicle, scene) {
        this.vehicle = vehicle;
        this.scene = scene;
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

    applyDamage(amount, position = null, force = null) {
        if (this.isDestroyed || this.isRespawning) return; // Don't apply damage if destroyed or respawning
        
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        console.log('Health after damage:', this.currentHealth);
        
        this._updateDamageState();
        
        // Use vehicle position if no impact position provided
        const impactPosition = position || (this.vehicle._vehicle ? 
            this.vehicle._vehicle.chassisBody.position.clone() : 
            new CANNON.Vec3(0, 0, 0));
            
        this._createImpactEffect(impactPosition, force || 1);
        
        if (this.currentHealth <= 0 && !this.isDestroyed) {
            console.log('Vehicle destroyed, triggering explosion');
            this.isDestroyed = true;
            this._triggerExplosion();
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
        console.log('Triggering explosion effect');
        
        // Create explosion effect
        const explosionGeometry = new THREE.SphereGeometry(2, 32, 32);
        const explosionMaterial = new THREE.MeshPhongMaterial({
            color: 0xff5500,
            transparent: true,
            opacity: 0.8
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(this.vehicle.chassisMesh.position);
        this.scene.add(explosion);
        
        // Animate explosion
        let scale = 0;
        const animate = () => {
            scale += 0.1;
            explosion.scale.set(scale, scale, scale);
            explosion.material.opacity = Math.max(0, 0.8 - scale * 0.2);
            
            if (scale < 4) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(explosion);
            }
        };
        animate();
        
        // Hide vehicle mesh
        if (this.vehicle.chassisMesh) {
            this.vehicle.chassisMesh.visible = false;
        }
        
        // Hide wheel meshes
        this.vehicle.wheelMeshes.forEach(wheel => {
            if (wheel) wheel.visible = false;
        });
        
        console.log('Explosion effect complete');
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
} 