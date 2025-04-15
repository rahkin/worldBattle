import { System } from '../core/System.js';
import { PhysicsComponent } from '../components/PhysicsComponent.js';

export class CollisionSystem extends System {
    constructor(world) {
        super();
        this.requiredComponents = [PhysicsComponent];
        this.world = world;
        this.collisionHandlers = new Map();
    }

    init() {
        this.world.addEventListener('beginContact', this.handleCollision.bind(this));
    }

    registerHandler(type, handler) {
        this.collisionHandlers.set(type, handler);
    }

    handleCollision(event) {
        const bodyA = event.bodyA;
        const bodyB = event.bodyB;

        // Find entities associated with these bodies
        const entityA = this.findEntityByBody(bodyA);
        const entityB = this.findEntityByBody(bodyB);

        if (entityA && entityB) {
            // Determine collision type based on entity components
            const type = this.determineCollisionType(entityA, entityB);
            
            // Call appropriate handler if registered
            const handler = this.collisionHandlers.get(type);
            if (handler) {
                handler(entityA, entityB, event);
            }
        }
    }

    findEntityByBody(body) {
        for (const entity of this.world.entities.values()) {
            const physics = entity.getComponent(PhysicsComponent);
            if (physics && physics.body === body) {
                return entity;
            }
        }
        return null;
    }

    determineCollisionType(entityA, entityB) {
        // This will be expanded based on your game's needs
        // For now, return a basic type
        return 'default';
    }
} 