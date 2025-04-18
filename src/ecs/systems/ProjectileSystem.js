import { System } from './System.js';
import { ProjectileComponent } from '../components/ProjectileComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import * as THREE from 'three';

export class ProjectileSystem extends System {
    constructor() {
        super();
        this.requiredComponents = [ProjectileComponent];
        this.maxProjectiles = 100;
    }

    update(deltaTime) {
        const entities = this.getEntities();
        for (const entity of entities) {
            const projectile = entity.getComponent(ProjectileComponent);
            const transform = entity.getComponent('Transform');
            const collision = entity.getComponent(CollisionComponent);

            if (projectile && transform && collision) {
                // Update projectile
                projectile.update(deltaTime);

                // Check for collisions
                const collidingEntities = this.world.getSystem('CollisionSystem').getCollisions(entity);
                for (const target of collidingEntities) {
                    // Don't collide with owner
                    if (target === projectile.owner) continue;

                    // Handle collision
                    projectile.onHit(target);
                    break;
                }
            }
        }
    }

    createProjectile(config) {
        if (this.getEntities().length >= this.maxProjectiles) {
            console.warn('Maximum number of projectiles reached');
            return null;
        }

        const entity = this.world.createEntity();
        
        // Create projectile component
        const projectile = new ProjectileComponent(config);
        
        // Create visual representation
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        projectile.mesh = mesh;
        
        // Create collision component
        const collision = new CollisionComponent({
            shape: 'sphere',
            radius: 0.2,
            isTrigger: true
        });
        
        // Add components to entity
        entity.addComponent(projectile);
        entity.addComponent('Transform', {
            position: config.position.clone(),
            rotation: config.rotation.clone()
        });
        entity.addComponent(collision);
        entity.addComponent('Visual', { mesh });
        
        return entity;
    }

    fireProjectile(owner, position, direction, config = {}) {
        const rotation = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            direction.normalize()
        );

        const projectileConfig = {
            ...config,
            owner,
            position: position.clone(),
            rotation: rotation.clone()
        };

        return this.createProjectile(projectileConfig);
    }

    cleanup() {
        const entities = this.getEntities();
        for (const entity of entities) {
            this.world.removeEntity(entity);
        }
    }
} 