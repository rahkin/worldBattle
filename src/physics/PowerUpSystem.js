import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export const POWER_UP_TYPES = {
    HEALTH: {
        id: 'health',
        name: 'Health',
        color: 0x00ff00,
        emissiveColor: 0x00ff00,
        apply: (vehicle) => {
            if (vehicle.damageSystem) {
                vehicle.damageSystem.heal(50);
                return true;
            }
            return false;
        }
    },
    SPEED: {
        id: 'speed',
        name: 'Speed Boost',
        color: 0x0000ff,
        emissiveColor: 0x0000ff,
        duration: 5000,
        apply: (vehicle) => {
            if (vehicle.boost) {
                vehicle.boost(true);
                return true;
            }
            return false;
        },
        revert: (vehicle) => {
            if (vehicle.boost) {
                vehicle.boost(false);
            }
        }
    },
    AMMO_SMALL: {
        id: 'ammo_small',
        name: 'Ammo Pack',
        color: 0xffff00,
        emissiveColor: 0xffff00,
        apply: (vehicle) => {
            if (vehicle.addAmmo) {
                const addedAmmo = vehicle.addAmmo(20); // Add 20 rounds
                return addedAmmo > 0;
            }
            return false;
        }
    },
    AMMO_LARGE: {
        id: 'ammo_large',
        name: 'Large Ammo Pack',
        color: 0xffcc00,
        emissiveColor: 0xffcc00,
        apply: (vehicle) => {
            if (vehicle.addAmmo) {
                const addedAmmo = vehicle.addAmmo(50); // Add 50 rounds
                console.log('AMMO_LARGE: Added ammo', { addedAmmo });
                return true; // Always return true if vehicle has addAmmo method
            }
            console.log('AMMO_LARGE: Failed to add ammo - no addAmmo method');
            return false;
        }
    },
    MINES_SMALL: {
        id: 'mines_small',
        name: 'Mine Pack',
        color: 0xff6600,
        emissiveColor: 0xff3300,
        apply: (vehicle, game) => {
            if (game && game.mineSystem) {
                const addedMines = game.mineSystem.instantResupply(2);
                return addedMines > 0;
            }
            return false;
        }
    },
    MINES_LARGE: {
        id: 'mines_large',
        name: 'Large Mine Pack',
        color: 0xff3300,
        emissiveColor: 0xff0000,
        apply: (vehicle, game) => {
            if (game && game.mineSystem) {
                const addedMines = game.mineSystem.instantResupply(4);
                return addedMines > 0;
            }
            return false;
        }
    },
    MINES_FULL: {
        id: 'mines_full',
        name: 'Full Mine Resupply',
        color: 0xff0000,
        emissiveColor: 0xff0000,
        apply: (vehicle, game) => {
            if (game && game.mineSystem) {
                const addedMines = game.mineSystem.fullResupply();
                return addedMines > 0;
            }
            return false;
        }
    },
    OVERCHARGE: {
        id: 'overcharge',
        name: 'Weapon Overcharge',
        color: 0x0000ff,
        emissiveColor: 0x0000ff,
        duration: 5000,
        apply: (vehicle) => {
            if (vehicle._weaponSystem) {
                // Store original values
                vehicle._weaponSystem._originalDamage = vehicle._weaponSystem.projectileDamage;
                vehicle._weaponSystem._originalFireRate = vehicle._weaponSystem.fireRate;
                
                // Apply overcharge
                vehicle._weaponSystem.projectileDamage *= 1.5;
                vehicle._weaponSystem.fireRate *= 0.7;
                
                console.log('Applied overcharge:', {
                    originalDamage: vehicle._weaponSystem._originalDamage,
                    newDamage: vehicle._weaponSystem.projectileDamage,
                    originalFireRate: vehicle._weaponSystem._originalFireRate,
                    newFireRate: vehicle._weaponSystem.fireRate
                });
                return true;
            }
            return false;
        },
        revert: (vehicle) => {
            if (vehicle._weaponSystem && vehicle._weaponSystem._originalDamage) {
                vehicle._weaponSystem.projectileDamage = vehicle._weaponSystem._originalDamage;
                vehicle._weaponSystem.fireRate = vehicle._weaponSystem._originalFireRate;
                delete vehicle._weaponSystem._originalDamage;
                delete vehicle._weaponSystem._originalFireRate;
            }
        }
    },
    SHIELD: {
        id: 'shield',
        name: 'Shield',
        color: 0xffff00,
        emissiveColor: 0xffff00,
        duration: 5000,
        apply: (vehicle) => {
            if (vehicle.shield) {
                vehicle.shield(true);
                return true;
            }
            return false;
        },
        revert: (vehicle) => {
            if (vehicle.shield) {
                vehicle.shield(false);
            }
        }
    }
};

export class PowerUpSystem {
    constructor(world, scene, powerUpDisplay) {
        console.log('PowerUpSystem: Initializing with world and scene');
        this.world = world;
        this.scene = scene;
        this.powerUpDisplay = powerUpDisplay;
        this.powerUps = new Map();
        this.activeEffects = new Map();
        this.nextPowerUpId = 0;
        this.nextEffectId = 0;
        this.game = null; // Will be set by Game class
        this.markedForRemoval = new Set();
        this.lastSpawnTime = 0;
        this.spawnInterval = 5000; // 5 seconds between spawns
        this.maxPowerUps = 10; // Maximum number of power-ups allowed at once

        // Create contact material for power-ups
        const powerUpMaterial = new CANNON.Material('powerUpMaterial');
        const vehicleMaterial = new CANNON.Material('vehicleMaterial');
        const powerUpContact = new CANNON.ContactMaterial(powerUpMaterial, vehicleMaterial, {
            friction: 0.0,
            restitution: 0.0,
            contactEquationStiffness: 1e6,
            contactEquationRelaxation: 3
        });
        this.world.addContactMaterial(powerUpContact);
        this.powerUpMaterial = powerUpMaterial;

        console.log('PowerUpSystem: Initialization complete');
    }

    createPowerUp(position, type) {
        console.log('PowerUpSystem: Creating power-up', {
            position,
            type: type.id,
            currentPowerUpCount: this.powerUps.size
        });
        
        const id = this.nextPowerUpId++;
        
        try {
            let body, geometry, mesh;
            const isMineType = type.id.includes('mines');
            const isAmmoType = type.id.includes('ammo');

            if (isMineType) {
                // Create cylinder for mine power-ups
                const radius = 0.4;
                const height = 0.2;
                const shape = new CANNON.Cylinder(radius, radius, height, 16);
                body = new CANNON.Body({
                    mass: 0,
                    position: new CANNON.Vec3(position.x, position.y + height/2, position.z),
                    shape: shape,
                    material: this.powerUpMaterial,
                    collisionFilterGroup: 2, // Power-up group
                    collisionFilterMask: 1, // Only collide with vehicles
                    isTrigger: true // Make it a trigger volume
                });

                // Rotate cylinder to lay flat
                const quat = new CANNON.Quaternion();
                quat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
                body.quaternion.copy(quat);

                // Create visual mesh
                geometry = new THREE.CylinderGeometry(radius, radius, height, 16);
                geometry.rotateX(Math.PI / 2); // Rotate to match physics body
            } else if (isAmmoType) {
                // Create box for ammo power-ups
                const size = 0.6;
                const shape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
                body = new CANNON.Body({
                    mass: 0,
                    position: new CANNON.Vec3(position.x, position.y + size/2, position.z),
                    shape: shape,
                    material: this.powerUpMaterial,
                    collisionFilterGroup: 2,
                    collisionFilterMask: 1,
                    isTrigger: true
                });
                geometry = new THREE.BoxGeometry(size, size, size);
            } else {
                // Create sphere for other power-ups
                body = new CANNON.Body({
                    mass: 0,
                    position: new CANNON.Vec3(position.x, position.y, position.z),
                    shape: new CANNON.Sphere(0.5),
                    material: this.powerUpMaterial,
                    collisionFilterGroup: 2,
                    collisionFilterMask: 1,
                    isTrigger: true
                });
                geometry = new THREE.SphereGeometry(0.5, 32, 32);
            }

            const material = new THREE.MeshStandardMaterial({
                color: type.color,
                emissive: type.emissiveColor,
                emissiveIntensity: 0.5,
                metalness: 0.8,
                roughness: 0.2,
                transparent: true,
                opacity: 0.8
            });

            mesh = new THREE.Mesh(geometry, material);
            
            // Add glow effect
            const glowGeometry = isMineType ? 
                new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16) :
                isAmmoType ?
                new THREE.BoxGeometry(0.7, 0.7, 0.7) :
                new THREE.SphereGeometry(0.6, 32, 32);

            if (isMineType) {
                glowGeometry.rotateX(Math.PI / 2);
            }

            const glowMaterial = new THREE.MeshBasicMaterial({
                color: type.emissiveColor,
                transparent: true,
                opacity: 0.3,
                side: THREE.BackSide
            });
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            mesh.add(glowMesh);
            
            // Add to world and scene
            this.world.addBody(body);
            this.scene.add(mesh);
            
            // Store power-up data
            this.powerUps.set(id, {
                id,
                body,
                mesh,
                type,
                createdAt: Date.now(),
                glowMesh,
                isMineType,
                isAmmoType,
                collected: false // Initialize collected flag
            });
            
            console.log('PowerUpSystem: Power-up created successfully', {
                id,
                position: body.position,
                type: type.id,
                isMineType,
                isAmmoType
            });
            
            return id;
        } catch (error) {
            console.error('PowerUpSystem: Failed to create power-up', error);
            throw error;
        }
    }

    update(deltaTime) {
        // Handle power-up removal first
        for (const powerUpId of this.markedForRemoval) {
            const powerUp = this.powerUps.get(powerUpId);
            if (powerUp) {
                console.log('PowerUpSystem: Removing power-up components', {
                    id: powerUpId,
                    hasBody: !!powerUp.body,
                    hasMesh: !!powerUp.mesh,
                    hasGlowMesh: !!powerUp.glowMesh
                });

                // Remove physics body
                if (powerUp.body) {
                    this.world.removeBody(powerUp.body);
                }

                // Remove visual meshes
                if (powerUp.mesh) {
                    // Remove glow mesh first
                    if (powerUp.glowMesh) {
                        powerUp.mesh.remove(powerUp.glowMesh);
                        powerUp.glowMesh.geometry.dispose();
                        powerUp.glowMesh.material.dispose();
                    }
                    // Remove main mesh
                    this.scene.remove(powerUp.mesh);
                    powerUp.mesh.geometry.dispose();
                    powerUp.mesh.material.dispose();
                }

                // Remove from map
                this.powerUps.delete(powerUpId);
            }
        }
        this.markedForRemoval.clear();

        // Update active effects and check for expiration
        const now = Date.now();
        for (const [effectId, effect] of this.activeEffects) {
            if (effect.expiresAt <= now) {
                console.log('Power-up effect expired:', {
                    effectId,
                    type: effect.type.id,
                    vehicleId: effect.vehicleId
                });

                // Call revert function if it exists
                if (effect.type.revert) {
                    try {
                        const vehicle = this.findVehicleById(effect.vehicleId);
                        if (vehicle) {
                            effect.type.revert(vehicle);
                            console.log('Successfully reverted effect:', effect.type.id);
                        }
                    } catch (error) {
                        console.error('Failed to revert power-up effect:', error);
                    }
                }

                this.activeEffects.delete(effectId);
                
                // Update power-up display
                if (this.powerUpDisplay) {
                    this.powerUpDisplay.updateActiveEffects(this.activeEffects);
                }
            }
        }

        // Update remaining power-ups
        for (const [id, powerUp] of this.powerUps) {
            if (powerUp.mesh) {
                // Rotate power-up
                powerUp.mesh.rotation.y += deltaTime * 2;
                // Bob up and down slightly above ground
                powerUp.mesh.position.copy(powerUp.body.position);
                powerUp.mesh.position.y += Math.sin(Date.now() * 0.003) * 0.2;
            }
        }

        // Check for spawn
        if (this.powerUps.size < this.maxPowerUps && now - this.lastSpawnTime > this.spawnInterval) {
            this.spawnPowerUp();
            this.lastSpawnTime = now;
        }
    }

    spawnPowerUp() {
        // Don't spawn if we're at the limit
        if (this.powerUps.size >= this.maxPowerUps) {
            console.log('PowerUpSystem: Maximum power-ups reached, skipping spawn');
            return null;
        }

        // Get a random power-up type
        const types = Object.values(POWER_UP_TYPES);
        const randomType = types[Math.floor(Math.random() * types.length)];

        // Generate random position with better distribution
        const angle = Math.random() * Math.PI * 2;
        const radius = 10 + Math.random() * 20;
        const position = new CANNON.Vec3(
            Math.cos(angle) * radius,
            0.5, // Lower to ground level
            Math.sin(angle) * radius
        );

        // Check if position is too close to other power-ups
        const isTooClose = Array.from(this.powerUps.values()).some(powerUp => {
            if (!powerUp.body) return false;
            const dx = powerUp.body.position.x - position.x;
            const dz = powerUp.body.position.z - position.z;
            const distanceSquared = dx * dx + dz * dz;
            return distanceSquared < 25;
        });

        if (isTooClose) {
            // Try up to 5 times to find a valid position
            for (let attempts = 0; attempts < 5; attempts++) {
                const newAngle = Math.random() * Math.PI * 2;
                const newRadius = 10 + Math.random() * 20;
                position.x = Math.cos(newAngle) * newRadius;
                position.z = Math.sin(newAngle) * newRadius;
                // Keep Y position consistent
                position.y = 0.5;

                const stillTooClose = Array.from(this.powerUps.values()).some(powerUp => {
                    if (!powerUp.body) return false;
                    const dx = powerUp.body.position.x - position.x;
                    const dz = powerUp.body.position.z - position.z;
                    return (dx * dx + dz * dz) < 25;
                });

                if (!stillTooClose) break;
                if (attempts === 4) {
                    console.log('PowerUpSystem: Could not find valid spawn position');
                    return null;
                }
            }
        }

        try {
            const powerUpId = this.createPowerUp(position, randomType);
            console.log('PowerUpSystem: Spawned new power-up', {
                id: powerUpId,
                type: randomType.id,
                position: position.toArray(),
                totalPowerUps: this.powerUps.size,
                maxPowerUps: this.maxPowerUps
            });
            return powerUpId;
        } catch (error) {
            console.error('PowerUpSystem: Failed to spawn power-up', error);
            return null;
        }
    }

    applyPowerUp(vehicle, powerUpId) {
        const powerUp = this.powerUps.get(powerUpId);
        if (!powerUp || powerUp.collected) {
            console.log('Power-up already collected or not found', { powerUpId, collected: powerUp?.collected });
            return false;
        }

        console.log('Applying power-up:', {
            type: powerUp.type.id,
            vehicle: vehicle.type,
            hasGame: !!this.game
        });

        let success = false;
        try {
            // Pass the game instance for power-ups that need it
            success = powerUp.type.apply(vehicle, this.game);
            
            if (success) {
                console.log('Power-up applied successfully, removing...');
                
                // If the power-up has a duration, add it to active effects
                if (powerUp.type.duration) {
                    const effectId = this.nextEffectId++;
                    this.activeEffects.set(effectId, {
                        type: powerUp.type,
                        vehicleId: vehicle.id,
                        vehicle: vehicle,
                        expiresAt: Date.now() + powerUp.type.duration
                    });
                }

                // Mark as collected and remove the power-up
                powerUp.collected = true;
                this.removePowerUp(powerUpId);
                
                // Notify display
                if (this.powerUpDisplay) {
                    this.powerUpDisplay.showPowerUp(powerUp.type);
                }
            } else {
                console.log('Power-up application failed');
            }
        } catch (error) {
            console.error('Error applying power-up:', error);
        }

        return success;
    }

    removePowerUp(powerUpId) {
        console.log('PowerUpSystem: Removing power-up', { powerUpId, powerUpExists: this.powerUps.has(powerUpId) });
        
        // Mark for removal instead of immediate removal
        this.markedForRemoval.add(powerUpId);
        
        console.log('PowerUpSystem: Power-up marked for removal', {
            powerUpId,
            remainingPowerUps: this.powerUps.size,
            markedForRemoval: this.markedForRemoval.size
        });
        
        return true;
    }

    cleanup() {
        console.log('PowerUpSystem: Cleaning up', {
            powerUpCount: this.powerUps.size,
            activeEffectCount: this.activeEffects.size
        });
        
        // Remove all power-ups
        for (const powerUp of this.powerUps.values()) {
            this.world.removeBody(powerUp.body);
            this.scene.remove(powerUp.mesh);
        }
        this.powerUps.clear();
        
        // Revert all active effects
        for (const effects of this.activeEffects.values()) {
            for (const effect of effects.values()) {
                effect.type.revert(effect.vehicle);
            }
        }
        this.activeEffects.clear();
        
        console.log('PowerUpSystem: Cleanup complete', {
            powerUpCount: this.powerUps.size,
            activeEffectCount: this.activeEffects.size
        });
    }

    findVehicleById(vehicleId) {
        // Search through active effects to find the vehicle
        for (const effect of this.activeEffects.values()) {
            if (effect.vehicleId === vehicleId) {
                return effect.vehicle;
            }
        }
        return null;
    }
} 