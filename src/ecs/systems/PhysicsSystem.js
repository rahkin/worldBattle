import { System } from '../core/System.js';
import { TransformComponent } from '../components/TransformComponent.js';
import { PhysicsComponent } from '../components/PhysicsComponent.js';

export class PhysicsSystem extends System {
    constructor(world) {
        super();
        this.requiredComponents = [TransformComponent, PhysicsComponent];
        this.world = world;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Step the physics world
        this.world.step(deltaTime);
    }

    updateEntity(entity, deltaTime) {
        const transform = entity.getComponent(TransformComponent);
        const physics = entity.getComponent(PhysicsComponent);

        if (physics.body) {
            // Update transform from physics body
            transform.position.copy(physics.body.position);
            transform.rotation.copy(physics.body.quaternion);
            transform.needsUpdate = true;
        }
    }
} 