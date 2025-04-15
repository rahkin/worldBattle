import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Mine {
    constructor(world, scene, position, options = {}) {
        this.world = world;
        this.scene = scene;
        this.position = position;
        this.options = {
            damage: 75,
            radius: 3,
            color: 0xff0000,
            deployerVehicleId: null,
            armingDelay: 2000,
            explosionDuration: 800,
            explosionRadius: 4,
            explosionColor: 0xff3300,
            initialVelocity: null,
            chainReactionRadius: 3, // Radius for triggering other mines
            ...options
        };

        this.id = null;
        this.isExploded = false;
        this.isArmed = false;
        this.deployTime = Date.now();
        this.body = null;
        this.mesh = null;
        this.triggerRadius = 1.5;
        this.isExploding = false; // New flag to prevent multiple explosion triggers

        this._createMine();
    }

    _createMine() {
        // Create physics body
        const shape = new CANNON.Sphere(0.5);
        this.body = new CANNON.Body({
            mass: 1, // Give it mass so it can fall
            position: this.position,
            shape: shape,
            material: new CANNON.Material('mineMaterial'),
            collisionFilterGroup: 4, // Mine group
            collisionFilterMask: 1 | 2, // Collide with vehicles and ground
            type: CANNON.Body.DYNAMIC, // Make it dynamic so it can fall
            isTrigger: false // Changed to false to ensure physical collisions
        });

        // Apply initial velocity if specified
        if (this.options.initialVelocity) {
            this.body.velocity.copy(this.options.initialVelocity);
        }

        // Set up collision detection properties
        this.body.addEventListener('collide', (event) => {
            if (!event || !event.contact) {
                console.log('Invalid collision event:', event);
                return;
            }

            if (this.isArmed && !this.isExploded) {
                // Safely get the other body
                const otherBody = event.contact.bi === this.body ? event.contact.bj : event.contact.bi;
                
                if (!otherBody) {
                    console.log('No other body in collision');
                    return;
                }

                if (otherBody.vehicleId) {
                    console.log('Direct collision detected with vehicle:', {
                        vehicleId: otherBody.vehicleId,
                        mineId: this.id,
                        isArmed: this.isArmed,
                        position: this.body.position
                    });
                    
                    // Calculate explosion force
                    const explosionForce = new CANNON.Vec3();
                    explosionForce.copy(otherBody.position);
                    explosionForce.vsub(this.body.position, explosionForce);
                    explosionForce.normalize();
                    explosionForce.scale(1000, explosionForce);

                    // Emit explosion event
                    const customEvent = new CustomEvent('mineExplosion', {
                        detail: {
                            minePosition: this.body.position.clone(),
                            vehicleId: otherBody.vehicleId,
                            damage: this.options.damage,
                            explosionForce: explosionForce.clone()
                        }
                    });
                    window.dispatchEvent(customEvent);

                    // Trigger explosion
                    requestAnimationFrame(() => this.explode());
                }
            }
        });

        this.body.isMine = true;
        this.body.mineId = this.id;
        this.world.addBody(this.body);

        // Create visual mesh - make it more visible
        const geometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
        const material = new THREE.MeshPhongMaterial({
            color: this.options.color,
            emissive: this.options.color,
            emissiveIntensity: 0.5,
            shininess: 30
        });

        this.mesh = new THREE.Group();
        const mainBody = new THREE.Mesh(geometry, material);
        this.mesh.add(mainBody);

        // Add spikes or prongs on top
        const spikeGeometry = new THREE.ConeGeometry(0.1, 0.2, 4);
        const spikeMaterial = new THREE.MeshPhongMaterial({
            color: 0x888888,
            shininess: 50
        });

        // Add 4 spikes in a cross pattern
        for (let i = 0; i < 4; i++) {
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            spike.position.y = 0.1;
            spike.position.x = Math.cos(i * Math.PI / 2) * 0.2;
            spike.position.z = Math.sin(i * Math.PI / 2) * 0.2;
            this.mesh.add(spike);
        }

        // Add glow effect
        const glowGeometry = new THREE.CircleGeometry(0.8, 32);
        glowGeometry.rotateX(-Math.PI / 2);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.options.color,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = -0.15;
        this.mesh.add(glow);

        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    update() {
        if (this.isExploded) return;

        // Update mesh position and rotation to match physics body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        // Handle arming state
        const timeSinceDeployment = Date.now() - this.deployTime;
        if (!this.isArmed && timeSinceDeployment >= this.options.armingDelay) {
            this.isArmed = true;
            this.mesh.visible = true;
            
            // Make it more visible when armed
            if (this.mesh.children[0]) {
                this.mesh.children[0].material.emissiveIntensity = 2.0;
                // Add pulsing effect
                const pulseIntensity = 1.5 + Math.sin(Date.now() * 0.005) * 0.5;
                this.mesh.children[0].material.emissiveIntensity = pulseIntensity;
            }
        } else if (!this.isArmed) {
            // Blinking effect during arming
            const blinkRate = this.options.armingDelay / 20;
            const visible = Math.floor(timeSinceDeployment / blinkRate) % 2 === 0;
            this.mesh.visible = visible;
            if (this.mesh.children[0]) {
                this.mesh.children[0].material.emissiveIntensity = visible ? 3.0 : 0.0;
            }
        }
    }

    explode() {
        if (this.isExploded || this.isExploding) return;
        this.isExploding = true;

        // Create explosion effect
        const explosionGeometry = new THREE.SphereGeometry(this.options.explosionRadius, 32, 32);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: this.options.explosionColor,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(this.position);
        this.scene.add(explosion);

        // Add shockwave effect
        const shockwaveGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
        const shockwaveMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
        shockwave.rotation.x = -Math.PI / 2;
        shockwave.position.copy(this.position);
        this.scene.add(shockwave);

        // Animate explosion
        const startTime = Date.now();
        const duration = this.options.explosionDuration;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            explosion.scale.set(1 + progress * 3, 1 + progress * 3, 1 + progress * 3);
            explosion.material.opacity = 0.9 * (1 - progress);

            const shockwaveScale = 1 + progress * 8;
            shockwave.scale.set(shockwaveScale, shockwaveScale, 1);
            shockwave.material.opacity = 0.7 * (1 - progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(explosion);
                this.scene.remove(shockwave);
                explosion.geometry.dispose();
                explosion.material.dispose();
                shockwave.geometry.dispose();
                shockwave.material.dispose();
                this.isExploded = true;
            }
        };

        animate();

        // Clean up physics and visual components
        this.world.removeBody(this.body);
        this.scene.remove(this.mesh);
        this.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });
    }
}

export class MineSystem {
    constructor(world, scene) {
        this.world = world;
        this.scene = scene;
        this.mines = new Map();
        this.maxMines = 5;
        this.currentMines = this.maxMines;
        this.nextMineId = 1;

        // Set up contact material for better collision handling
        this.mineMaterial = new CANNON.Material('mineMaterial');
        this.vehicleMaterial = new CANNON.Material('vehicleMaterial');
        
        const contactMaterial = new CANNON.ContactMaterial(
            this.mineMaterial,
            this.vehicleMaterial,
            {
                friction: 0.0,
                restitution: 0.0,
                contactEquationStiffness: 1e8,
                contactEquationRelaxation: 3,
                contactEquationRegularizationTime: 3
            }
        );
        
        this.world.addContactMaterial(contactMaterial);

        // Set up collision event listener
        this.world.addEventListener('postStep', () => {
            for (const contact of this.world.contacts) {
                if (!contact || !contact.bi || !contact.bj) continue;

                // Check if either body is a mine
                const mineBody = contact.bi.isMine ? contact.bi : (contact.bj.isMine ? contact.bj : null);
                if (!mineBody) continue;

                // Get the other body (should be a vehicle)
                const otherBody = mineBody === contact.bi ? contact.bj : contact.bi;
                if (!otherBody || !otherBody.vehicleId) continue;

                // Get the mine instance
                const mine = this.mines.get(mineBody.mineId);
                if (!mine || mine.isExploded || mine.isExploding) continue;

                // Check if bodies are actually in contact
                if (contact.getImpactVelocityAlongNormal() > 0) {
                    console.log('Mine collision confirmed:', {
                        mineId: mine.id,
                        vehicleId: otherBody.vehicleId,
                        velocity: contact.getImpactVelocityAlongNormal()
                    });

                    // Calculate explosion force
                    const explosionForce = new CANNON.Vec3();
                    explosionForce.copy(otherBody.position);
                    explosionForce.vsub(mine.body.position, explosionForce);
                    explosionForce.normalize();
                    explosionForce.scale(1000, explosionForce);

                    // Trigger explosion
                    mine.explode();
                    this.mines.delete(mine.id);

                    // Emit explosion event
                    const customEvent = new CustomEvent('mineExplosion', {
                        detail: {
                            minePosition: mine.body.position.clone(),
                            vehicleId: otherBody.vehicleId,
                            damage: mine.options.damage,
                            explosionForce: explosionForce.clone()
                        }
                    });
                    window.dispatchEvent(customEvent);
                }
            }
        });
    }

    createMine(position, options = {}, deployerVehicleId = null) {
        if (this.currentMines <= 0) {
            console.log('No mines available');
            return null;
        }

        const mineId = this.nextMineId++;
        const mineOptions = {
            ...options,
            deployerVehicleId: deployerVehicleId
        };

        const mine = new Mine(this.world, this.scene, position, mineOptions);
        mine.id = mineId;
        this.mines.set(mineId, mine);
        this.currentMines--;

        return mineId;
    }

    handleCollision(event) {
        const { bodyA, bodyB } = event;
        if (!bodyA || !bodyB) return;

        // Find which body is the mine
        const mineBody = bodyA.isMine ? bodyA : (bodyB.isMine ? bodyB : null);
        if (!mineBody) return;

        // Get the mine instance
        const mine = this.mines.get(mineBody.mineId);
        if (!mine || mine.isExploded || mine.isExploding) return;

        // Get the other body (should be a vehicle)
        const otherBody = bodyA === mineBody ? bodyB : bodyA;
        if (!otherBody.vehicleId) return;

        console.log('Mine collision detected:', {
            mineId: mine.id,
            vehicleId: otherBody.vehicleId,
            isArmed: mine.isArmed,
            isExploded: mine.isExploded
        });

        // Only trigger if mine is armed
        if (mine.isArmed) {
            this.triggerMineExplosion(mine, otherBody);
        }
    }

    triggerMineExplosion(mine, vehicleBody) {
        if (mine.isExploded || mine.isExploding) return;

        // Calculate explosion force
        const explosionForce = new CANNON.Vec3();
        explosionForce.copy(vehicleBody.position);
        explosionForce.vsub(mine.body.position, explosionForce);
        explosionForce.normalize();
        explosionForce.scale(1000, explosionForce);

        // Emit explosion event first
        const customEvent = new CustomEvent('mineExplosion', {
            detail: {
                minePosition: mine.body.position.clone(),
                vehicleId: vehicleBody.vehicleId,
                damage: mine.options.damage,
                explosionForce: explosionForce.clone()
            }
        });
        window.dispatchEvent(customEvent);

        // Start explosion
        mine.explode();
        this.mines.delete(mine.id);

        // Check for chain reaction with nearby mines
        this.checkChainReaction(mine);
    }

    checkChainReaction(triggeringMine) {
        const chainReactionRadius = triggeringMine.options.chainReactionRadius;
        const triggerPos = triggeringMine.body.position;

        // Small delay for visual effect
        setTimeout(() => {
            for (const [id, mine] of this.mines.entries()) {
                if (mine.isArmed && !mine.isExploded && !mine.isExploding) {
                    const distance = triggerPos.distanceTo(mine.body.position);
                    if (distance <= chainReactionRadius) {
                        console.log('Chain reaction triggered for mine:', id);
                        this.triggerMineExplosion(mine, null);
                    }
                }
            }
        }, 100);
    }

    update() {
        for (const [mineId, mine] of this.mines.entries()) {
            mine.update();
            if (mine.isExploded) {
                this.mines.delete(mineId);
            }
        }
    }

    cleanup() {
        this.mines.forEach(mine => {
            if (mine.mesh) {
                this.scene.remove(mine.mesh);
            }
            if (mine.body) {
                this.world.removeBody(mine.body);
            }
        });
        this.mines.clear();
        this.currentMines = 0;
    }

    resetMines() {
        this.currentMines = this.maxMines;  // Reset to max mines
        this.mines.clear();  // Clear any existing mines
        
        // Update display if available
        if (this.game && this.game.mineDisplay) {
            this.game.mineDisplay.updateCount(this.maxMines, this.maxMines);
        }
    }

    instantResupply(amount) {
        if (this.currentMines >= this.maxMines) {
            return 0;  // Already at max, don't add or subtract
        }
        const spaceLeft = this.maxMines - this.currentMines;
        const minesToAdd = Math.min(amount, spaceLeft);
        this.currentMines += minesToAdd;
        
        // Update display if available
        if (this.game && this.game.mineDisplay) {
            this.game.mineDisplay.updateCount(this.currentMines, this.maxMines);
        }
        
        return minesToAdd;
    }

    fullResupply() {
        const oldCount = this.currentMines;
        this.currentMines = this.maxMines;
        
        // Update display if available
        if (this.game && this.game.mineDisplay) {
            this.game.mineDisplay.updateCount(this.maxMines, this.maxMines);
        }
        
        return this.maxMines - oldCount;
    }
} 