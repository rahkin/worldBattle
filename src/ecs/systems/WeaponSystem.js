import { System } from '../core/System.js';
import { WeaponComponent } from '../components/WeaponComponent.js';
import { ProjectileComponent } from '../components/ProjectileComponent.js';
import { Transform } from '../components/Transform.js';
import { PhysicsBody } from '../components/PhysicsBody.js';
import * as THREE from 'three';

export class WeaponSystem extends System {
    constructor() {
        super();
        this.requiredComponents = [WeaponComponent];
    }

    init() {
        console.log('WeaponSystem initialized');
    }

    update(deltaTime) {
        const entities = this.getEntities();
        for (const entity of entities) {
            const weapon = entity.getComponent(WeaponComponent);
            if (weapon) {
                weapon.update(deltaTime);
            }
        }
    }

    fireWeapon(vehicle) {
        // Get the weapon component from the vehicle
        const weapon = vehicle.getComponent(WeaponComponent);
        if (!weapon) {
            console.error('No weapon component found on vehicle');
            return;
        }

        if (!weapon.canFire()) {
            console.log('Weapon cannot fire (reloading or out of ammo)');
            return;
        }

        const transform = vehicle.getComponent(Transform);
        const physics = vehicle.getComponent(PhysicsBody);
        
        if (!transform || !physics) {
            console.error('Vehicle missing required components for firing');
            return;
        }

        // Calculate projectile start position and direction
        const weaponOffset = new THREE.Vector3().copy(weapon.offset);
        weaponOffset.applyQuaternion(transform.rotation);
        
        const startPosition = transform.position.clone().add(weaponOffset);
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(transform.rotation);

        // Create projectile entity
        const projectileEntity = this.world.createEntity();
        
        // Create projectile component
        const projectile = new ProjectileComponent({
            type: weapon.projectileType,
            damage: weapon.damage,
            speed: weapon.projectileSpeed,
            range: weapon.range,
            owner: vehicle
        });

        // Add components to projectile entity
        projectileEntity.addComponent(projectile);
        projectileEntity.addComponent(new Transform({
            position: startPosition,
            rotation: transform.rotation.clone()
        }));

        // Get the ProjectileSystem to handle the rest
        const projectileSystem = this.world.getSystem('ProjectileSystem');
        if (projectileSystem) {
            projectileSystem.initializeProjectile(projectileEntity);
        }

        // Fire weapon
        weapon.fire();
        console.log('Weapon fired, remaining ammo:', weapon.ammo);
    }

    cleanup() {
        const entities = this.getEntities();
        for (const entity of entities) {
            const weapon = entity.getComponent(WeaponComponent);
            if (weapon) {
                weapon.cleanup();
            }
        }
    }
} 