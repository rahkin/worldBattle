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
        this.explosionParticles = null;
    }

    applyDamage(amount, position, force) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this._updateDamageState();
        this._createImpactEffect(position, force);
        
        if (this.currentHealth <= 0) {
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
            metalness: 0.1
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
    }

    _addSevereDamage() {
        // Add more severe damage like broken parts
        const brokenMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            roughness: 0.8,
            metalness: 0.3
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
    }

    _addCriticalDamage() {
        // Add critical damage effects like smoke and fire
        this._createSmokeEffect();
        this._createFireEffect();
    }

    _createImpactEffect(position, force) {
        // Create impact particles
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            particlePositions[i3] = position.x;
            particlePositions[i3 + 1] = position.y;
            particlePositions[i3 + 2] = position.z;
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

    _createSmokeEffect() {
        // Create smoke particles
        const smokeGeometry = new THREE.BufferGeometry();
        const smokeMaterial = new THREE.PointsMaterial({
            color: 0x333333,
            size: 0.2,
            transparent: true,
            opacity: 0.6
        });

        const smoke = new THREE.Points(smokeGeometry, smokeMaterial);
        this.vehicle.chassisMesh.add(smoke);
        this.damageEffects.set('smoke', smoke);
    }

    _createFireEffect() {
        // Create fire particles
        const fireGeometry = new THREE.BufferGeometry();
        const fireMaterial = new THREE.PointsMaterial({
            color: 0xff6600,
            size: 0.3,
            transparent: true,
            opacity: 0.8
        });

        const fire = new THREE.Points(fireGeometry, fireMaterial);
        this.vehicle.chassisMesh.add(fire);
        this.damageEffects.set('fire', fire);
    }

    _triggerExplosion() {
        // Create explosion effect
        const explosionGeometry = new THREE.SphereGeometry(1, 32, 32);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.8
        });

        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(this.vehicle.chassisMesh.position);
        this.scene.add(explosion);
        this.damageEffects.set('explosion', explosion);

        // Add explosion force to physics
        const explosionForce = 1000;
        const explosionRadius = 5;
        this.vehicle.vehicle.chassisBody.applyImpulse(
            new CANNON.Vec3(
                (Math.random() - 0.5) * explosionForce,
                explosionForce,
                (Math.random() - 0.5) * explosionForce
            ),
            new CANNON.Vec3()
        );

        // Remove explosion after a short time
        setTimeout(() => {
            this.scene.remove(explosion);
            this.damageEffects.delete('explosion');
        }, 1000);
    }

    update(deltaTime) {
        // Update damage effects
        this.damageEffects.forEach((effect, key) => {
            if (key === 'smoke' || key === 'fire') {
                // Update particle positions for smoke and fire
                const positions = effect.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i] += (Math.random() - 0.5) * 0.1;
                    positions[i + 1] += Math.random() * 0.2;
                    positions[i + 2] += (Math.random() - 0.5) * 0.1;
                }
                effect.geometry.attributes.position.needsUpdate = true;
            }
        });
    }
} 