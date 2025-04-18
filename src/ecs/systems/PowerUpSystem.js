import { System } from '../core/System.js';
import { PowerUpComponent } from '../components/PowerUpComponent.js';
import { VehicleComponent } from '../components/VehicleComponent.js';
import { Transform } from '../components/Transform.js';
import { Visual } from '../components/Visual.js';
import * as THREE from 'three';

export class PowerUpSystem extends System {
    constructor() {
        super();
        this.requiredComponents = [PowerUpComponent];
        this.powerUpTypes = ['speedBoost', 'damageBoost', 'defenseBoost', 'ammoRegen'];
        this.spawnInterval = 30; // seconds
        this.lastSpawnTime = 0;
        this.maxPowerUps = 5;
        this.spawnRadius = 100;
    }

    init() {
        // Create initial power-ups
        this.spawnPowerUps(3);
    }

    update(deltaTime) {
        const currentTime = this.world.getSystem('TimeSystem')?.currentTime || 0;
        
        // Check if it's time to spawn new power-ups
        if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
            const entities = this.getEntities();
            if (entities.length < this.maxPowerUps) {
                this.spawnPowerUps(1);
            }
            this.lastSpawnTime = currentTime;
        }

        // Update existing power-ups
        const entities = this.getEntities();
        for (const entity of entities) {
            const powerUp = entity.getComponent(PowerUpComponent);
            const transform = entity.getComponent(Transform);
            
            if (!powerUp || !transform) continue;
            
            powerUp.update(deltaTime);
            
            // Check for vehicle collisions
            const vehicles = this.world.getEntitiesWithComponents([VehicleComponent]);
            for (const vehicle of vehicles) {
                const vehicleTransform = vehicle.getComponent(Transform);
                if (!vehicleTransform) continue;
                
                if (this.checkCollision(transform.position, vehicleTransform.position)) {
                    this.applyPowerUp(vehicle, powerUp);
                    this.world.removeEntity(entity);
                    break;
                }
            }
        }
    }

    spawnPowerUps(count) {
        for (let i = 0; i < count; i++) {
            const entity = this.world.createEntity();
            
            // Random position within spawn radius
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.spawnRadius;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Random power-up type
            const type = this.powerUpTypes[Math.floor(Math.random() * this.powerUpTypes.length)];
            
            // Create power-up component
            const powerUp = new PowerUpComponent({
                type,
                duration: 5.0,
                effect: this.getEffectValue(type)
            });
            
            // Create visual representation
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshStandardMaterial({
                color: this.getPowerUpColor(type),
                emissive: this.getPowerUpColor(type),
                emissiveIntensity: 0.5
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, 0.5, z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            powerUp.mesh = mesh;
            
            // Add components to entity
            entity.addComponent(powerUp);
            entity.addComponent(new Transform(new THREE.Vector3(x, 0.5, z)));
            entity.addComponent(new Visual(mesh));
        }
    }

    checkCollision(pos1, pos2, radius = 1.5) {
        return pos1.distanceTo(pos2) < radius;
    }

    applyPowerUp(vehicle, powerUp) {
        const vehicleComponent = vehicle.getComponent(VehicleComponent);
        if (!vehicleComponent) return;

        switch (powerUp.type) {
            case 'speedBoost':
                vehicleComponent.speedMultiplier = powerUp.effect;
                break;
            case 'damageBoost':
                vehicleComponent.damageMultiplier = powerUp.effect;
                break;
            case 'defenseBoost':
                vehicleComponent.defenseMultiplier = powerUp.effect;
                break;
            case 'ammoRegen':
                const weapon = vehicle.getComponent('WeaponComponent');
                if (weapon) {
                    weapon.ammoRegenRate = powerUp.effect;
                }
                break;
        }

        // Play collection sound
        if (powerUp.collectSound) {
            powerUp.collectSound.play();
        }
    }

    getEffectValue(type) {
        switch (type) {
            case 'speedBoost': return 1.5;
            case 'damageBoost': return 2.0;
            case 'defenseBoost': return 0.5;
            case 'ammoRegen': return 5;
            default: return 1.0;
        }
    }

    getPowerUpColor(type) {
        switch (type) {
            case 'speedBoost': return 0x00ff00;
            case 'damageBoost': return 0xff0000;
            case 'defenseBoost': return 0x0000ff;
            case 'ammoRegen': return 0xffff00;
            default: return 0xffffff;
        }
    }

    cleanup() {
        const entities = this.getEntities();
        for (const entity of entities) {
            this.world.removeEntity(entity);
        }
    }
} 