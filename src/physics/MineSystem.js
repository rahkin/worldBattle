import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Mine {
    constructor(world, scene, position, options = {}) {
        this.world = world;
        this.scene = scene;
        this.position = position;
        this.options = Object.assign({
            damage: 75,
            radius: 3,
            color: 0xff0000,
            deployerVehicleId: null, // ID of the vehicle that deployed this mine
            armingDelay: 2000, // Increased to 2 seconds for better visibility
            explosionDuration: 800, // Increased from 500 to 800ms for longer visual feedback
            explosionRadius: 4, // Added explicit explosion radius
            explosionColor: 0xff3300 // Brighter orange-red for explosion
        }, options);

        this.isExploded = false;
        this.isActive = false;
        this.triggerRadius = 1.5; // Radius for triggering explosion
        this.deployTime = Date.now();
        this.isArmed = false;
        this.id = null; // Added for id property

        this._createMine();
        this._setupCollisionEvents();
    }

    _createMine() {
        console.log('Creating mine with options:', this.options);
        // Create physics body as a sphere for better collision detection
        const shape = new CANNON.Sphere(0.5); // radius of 0.5 units
        this.body = new CANNON.Body({
            mass: 0,
            position: this.position,
            shape: shape,
            material: new CANNON.Material('mineMaterial'),
            isTrigger: true // Makes it a trigger volume
        });
        
        this.body.collisionResponse = true; // Enable collision response
        this.body.isMine = true; // Mark as mine for collision detection
        this.body.mineId = this.id; // Store mine ID for reference
        this.world.addBody(this.body);

        // Create visual mesh - simple red box
        const geometry = new THREE.BoxGeometry(1, 0.3, 0.5);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5,
            shininess: 30
        });
        
        this.mesh = new THREE.Group();
        const mainBody = new THREE.Mesh(geometry, material);
        this.mesh.add(mainBody);

        // Add red glow effect underneath
        const glowGeometry = new THREE.CircleGeometry(0.8, 32);
        glowGeometry.rotateX(-Math.PI / 2);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = -0.15;
        this.mesh.add(glow);

        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        this.isActive = true;
        console.log('Mine created and added to scene:', {
            position: this.position,
            isActive: this.isActive,
            isArmed: this.isArmed
        });
    }

    _setupCollisionEvents() {
        // Store the callback so we can remove it later
        this.beginContactCallback = (event) => {
            const bodyA = event.bodyA;
            const bodyB = event.bodyB;
            
            // Check if either body is our mine and the other is a vehicle
            if ((bodyA === this.body && bodyB.vehicleId) || 
                (bodyB === this.body && bodyA.vehicleId)) {
                // Get the vehicle that hit the mine
                const vehicleBody = bodyA.vehicleId ? bodyA : bodyB;
                
                // Only trigger if mine is armed
                if (this.isArmed) {
                    if (!this.isExploded) {
                        console.log('Mine triggered by vehicle:', vehicleBody.vehicleId);
                        this.explode();
                        
                        // Emit an event for damage handling
                        const customEvent = new CustomEvent('mineExplosion', {
                            detail: {
                                minePosition: this.body.position,  // Use the actual physics body position
                                vehicleId: vehicleBody.vehicleId,
                                damage: this.options.damage
                            }
                        });
                        window.dispatchEvent(customEvent);
                    }
                }
            }
        };

        // Add the collision event listener
        this.world.addEventListener('beginContact', this.beginContactCallback);
    }

    update() {
        if (this.isExploded) return;
        
        // Update mesh position to match physics body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        // Check arming state
        const timeSinceDeployment = Date.now() - this.deployTime;
        if (!this.isArmed && timeSinceDeployment >= this.options.armingDelay) {
            this.isArmed = true;
            this.mesh.visible = true;
            // Change material color to indicate armed state
            if (this.mesh.children[0]) {
                this.mesh.children[0].material.emissiveIntensity = 2.0;
                this.mesh.children[0].material.emissive.setHex(0xff0000);
            }
            console.log('Mine armed:', {
                mineId: this.id,
                position: this.position,
                timeSinceDeployment
            });
        } else if (!this.isArmed) {
            // Blinking effect synchronized with arming delay
            const blinkRate = this.options.armingDelay / 20; // 20 blinks during arming
            const visible = Math.floor(timeSinceDeployment / blinkRate) % 2 === 0;
            this.mesh.visible = visible;
            if (this.mesh.children[0]) {
                // Alternate between high and zero intensity for more dramatic effect
                this.mesh.children[0].material.emissiveIntensity = visible ? 3.0 : 0.0;
                this.mesh.children[0].material.emissive.setHex(0xff0000);
            }
        }
    }

    explode() {
        if (this.isExploded) return;
        this.isExploded = true;

        // Create more dramatic explosion effect
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
        shockwave.rotation.x = -Math.PI / 2; // Align with ground
        shockwave.position.copy(this.position);
        this.scene.add(shockwave);

        // Animate explosion and shockwave
        const startTime = Date.now();
        const duration = this.options.explosionDuration;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Explosion animation
            explosion.scale.set(1 + progress * 3, 1 + progress * 3, 1 + progress * 3);
            explosion.material.opacity = 0.9 * (1 - progress);

            // Shockwave animation
            const shockwaveScale = 1 + progress * 8;
            shockwave.scale.set(shockwaveScale, shockwaveScale, 1);
            shockwave.material.opacity = 0.7 * (1 - progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Cleanup
                this.scene.remove(explosion);
                this.scene.remove(shockwave);
                explosion.geometry.dispose();
                explosion.material.dispose();
                shockwave.geometry.dispose();
                shockwave.material.dispose();
            }
        };

        animate();

        // Remove collision event listener
        if (this.beginContactCallback) {
            this.world.removeEventListener('beginContact', this.beginContactCallback);
        }

        // Remove physics body and mesh
        this.world.removeBody(this.body);
        this.scene.remove(this.mesh);
        
        // Dispose of geometries and materials
        this.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });
    }

    cleanup() {
        if (!this.isExploded) {
            // Remove collision event listener
            if (this.beginContactCallback) {
                this.world.removeEventListener('beginContact', this.beginContactCallback);
            }
            this.explode();
        }
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

        // Set up contact materials
        this.mineMaterial = new CANNON.Material('mineMaterial');
        this.vehicleMaterial = new CANNON.Material('vehicleMaterial');
        
        const contactMaterial = new CANNON.ContactMaterial(
            this.mineMaterial,
            this.vehicleMaterial,
            {
                friction: 0.0,
                restitution: 0.0,
                contactEquationStiffness: 1e8,
                contactEquationRelaxation: 3
            }
        );
        
        this.world.addContactMaterial(contactMaterial);
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
        mine.id = mineId; // Set mine ID
        this.mines.set(mineId, mine);
        this.currentMines--;
        
        return mineId;
    }

    explodeMine(mineId) {
        const mine = this.mines.get(mineId);
        if (mine) {
            mine.explode();
            this.mines.delete(mineId);
        }
    }

    instantResupply(amount) {
        if (this.currentMines >= this.maxMines) {
            return 0;  // Already at max, don't add or subtract
        }
        const spaceLeft = this.maxMines - this.currentMines;
        const minesToAdd = Math.min(amount, spaceLeft);
        this.currentMines += minesToAdd;
        return minesToAdd;
    }

    fullResupply() {
        const oldCount = this.currentMines;
        this.currentMines = this.maxMines;
        return this.maxMines - oldCount;
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
        for (const mine of this.mines.values()) {
            mine.cleanup();
        }
        this.mines.clear();
        this.currentMines = this.maxMines; // Reset to max mines after cleanup
    }

    handleCollision(event) {
        const { bodyA, bodyB } = event;
        if (!bodyA || !bodyB) return;

        // Find which body is the mine
        const mineBody = bodyA.isMine ? bodyA : (bodyB.isMine ? bodyB : null);
        if (!mineBody) return;

        // Get the mine instance
        const mine = this.mines.get(mineBody.mineId);
        if (!mine || mine.isExploded) return;

        // Get the other body (vehicle or environment)
        const otherBody = bodyA === mineBody ? bodyB : bodyA;
        
        // Only trigger for vehicles and if mine is armed
        if (otherBody.vehicleId && mine.isArmed) {
            console.log('Mine collision detected:', {
                mineId: mine.id,
                vehicleId: otherBody.vehicleId,
                isArmed: mine.isArmed,
                deployerVehicleId: mine.deployerVehicleId,
                damage: mine.damage
            });

            // Trigger explosion for any vehicle after arming
            console.log('Triggering mine explosion');
            // Trigger explosion
            const explosionEvent = new CustomEvent('mineExplosion', {
                detail: {
                    vehicleId: otherBody.vehicleId,
                    damage: mine.damage,
                    minePosition: mineBody.position
                }
            });
            window.dispatchEvent(explosionEvent);

            // Mark mine as exploded
            mine.explode();
        }
    }
} 