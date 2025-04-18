import { System } from '../core/System.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { PhysicsSystem } from './PhysicsSystem.js';

export class CollisionSystem extends System {
    constructor() {
        super();
        this.requiredComponents = [CollisionComponent];
        this.collisionPairs = new Map();
        this.physicsWorld = null;
    }

    init() {
        console.log('CollisionSystem initializing...');
        
        // Get the physics system from the world
        const physicsSystem = this.world.getSystem('PhysicsSystem');
        console.log('Found physics system:', physicsSystem);
        
        if (!physicsSystem) {
            throw new Error('CollisionSystem requires PhysicsSystem to be initialized first');
        }
        
        this.physicsWorld = physicsSystem.physicsWorld;
        if (!this.physicsWorld) {
            throw new Error('Physics world not initialized in PhysicsSystem');
        }
        
        console.log('CollisionSystem setting up event listeners...');

        // Set up collision event listener
        this.physicsWorld.addEventListener('beginContact', (event) => {
            this.handleCollision(event);
        });

        this.physicsWorld.addEventListener('endContact', (event) => {
            this.handleCollisionEnd(event);
        });

        console.log('CollisionSystem initialization complete');
    }

    handleCollision(event) {
        const bodyA = event.bodyA;
        const bodyB = event.bodyB;

        if (!bodyA || !bodyB) return;

        // Get the entities associated with these bodies
        const entityA = this.getEntityFromBody(bodyA);
        const entityB = this.getEntityFromBody(bodyB);

        if (!entityA || !entityB) return;

        // Get collision components
        const collisionA = entityA.getComponent(CollisionComponent);
        const collisionB = entityB.getComponent(CollisionComponent);

        if (!collisionA || !collisionB) return;

        // Create a unique key for this collision pair
        const pairKey = this.createCollisionPairKey(entityA.id, entityB.id);
        
        // Store the collision pair if it's new
        if (!this.collisionPairs.has(pairKey)) {
            this.collisionPairs.set(pairKey, {
                entityA,
                entityB,
                contact: event.contact
            });

            // Trigger collision handlers
            if (collisionA.onCollide) {
                collisionA.onCollide(entityB, event);
            }
            if (collisionB.onCollide) {
                collisionB.onCollide(entityA, event);
            }
        }
    }

    handleCollisionEnd(event) {
        const bodyA = event.bodyA;
        const bodyB = event.bodyB;

        if (!bodyA || !bodyB) return;

        const entityA = this.getEntityFromBody(bodyA);
        const entityB = this.getEntityFromBody(bodyB);

        if (!entityA || !entityB) return;

        // Remove the collision pair
        const pairKey = this.createCollisionPairKey(entityA.id, entityB.id);
        this.collisionPairs.delete(pairKey);

        // Get collision components
        const collisionA = entityA.getComponent(CollisionComponent);
        const collisionB = entityB.getComponent(CollisionComponent);

        // Trigger collision end handlers
        if (collisionA && collisionA.onCollisionEnd) {
            collisionA.onCollisionEnd(entityB, event);
        }
        if (collisionB && collisionB.onCollisionEnd) {
            collisionB.onCollisionEnd(entityA, event);
        }
    }

    getEntityFromBody(body) {
        // This assumes we store the entity ID in the body's userData
        return body.userData ? this.world.getEntity(body.userData.entityId) : null;
    }

    createCollisionPairKey(idA, idB) {
        // Create a consistent key regardless of order
        return idA < idB ? `${idA}-${idB}` : `${idB}-${idA}`;
    }

    update(deltaTime) {
        // Update active collisions
        for (const [key, pair] of this.collisionPairs) {
            const collisionA = pair.entityA.getComponent(CollisionComponent);
            const collisionB = pair.entityB.getComponent(CollisionComponent);

            // Update collision state
            if (collisionA && collisionA.onCollisionStay) {
                collisionA.onCollisionStay(pair.entityB, pair.contact);
            }
            if (collisionB && collisionB.onCollisionStay) {
                collisionB.onCollisionStay(pair.entityA, pair.contact);
            }
        }
    }

    cleanup() {
        this.collisionPairs.clear();
        if (this.physicsWorld) {
            // Remove event listeners if possible
            this.physicsWorld.removeEventListener('beginContact');
            this.physicsWorld.removeEventListener('endContact');
        }
    }
} 