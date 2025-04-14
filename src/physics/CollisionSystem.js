import * as CANNON from 'cannon-es';

// Collision groups
export const COLLISION_GROUPS = {
    VEHICLE: 1,      // Vehicles
    POWER_UP: 2,     // Power-ups and ammo
    MINE: 4,         // Mines
    ENVIRONMENT: 8,  // Static environment objects
    PROJECTILE: 16   // Projectiles
};

// Collision masks - what each group can collide with
export const COLLISION_MASKS = {
    VEHICLE: COLLISION_GROUPS.POWER_UP | COLLISION_GROUPS.MINE | COLLISION_GROUPS.ENVIRONMENT | COLLISION_GROUPS.PROJECTILE,
    POWER_UP: COLLISION_GROUPS.VEHICLE,
    MINE: COLLISION_GROUPS.VEHICLE,
    ENVIRONMENT: COLLISION_GROUPS.VEHICLE | COLLISION_GROUPS.PROJECTILE,
    PROJECTILE: COLLISION_GROUPS.VEHICLE | COLLISION_GROUPS.ENVIRONMENT
};

export class CollisionSystem {
    constructor(world) {
        this.world = world;
        this.handlers = new Map();
        this.setupCollisionGroups();
        this.setupContactMaterials();
    }

    setupCollisionGroups() {
        // Create materials for each collision group
        this.materials = {
            vehicle: new CANNON.Material('vehicleMaterial'),
            powerUp: new CANNON.Material('powerUpMaterial'),
            mine: new CANNON.Material('mineMaterial'),
            environment: new CANNON.Material('environmentMaterial'),
            projectile: new CANNON.Material('projectileMaterial')
        };
    }

    setupContactMaterials() {
        // Vehicle - PowerUp contact
        const vehiclePowerUpContact = new CANNON.ContactMaterial(
            this.materials.vehicle,
            this.materials.powerUp,
            { friction: 0.0, restitution: 0.0 }
        );
        this.world.addContactMaterial(vehiclePowerUpContact);

        // Vehicle - Mine contact
        const vehicleMineContact = new CANNON.ContactMaterial(
            this.materials.vehicle,
            this.materials.mine,
            { friction: 0.0, restitution: 0.0 }
        );
        this.world.addContactMaterial(vehicleMineContact);

        // Vehicle - Environment contact
        const vehicleEnvironmentContact = new CANNON.ContactMaterial(
            this.materials.vehicle,
            this.materials.environment,
            { friction: 0.3, restitution: 0.2 }
        );
        this.world.addContactMaterial(vehicleEnvironmentContact);
    }

    registerHandler(type, handler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type).push(handler);
    }

    unregisterHandler(type, handler) {
        if (this.handlers.has(type)) {
            const handlers = this.handlers.get(type);
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }

    handleCollision(event) {
        const { bodyA, bodyB } = event;
        
        // Determine collision type based on collision groups
        const type = this.getCollisionType(bodyA, bodyB);
        if (!type) return;

        // Get handlers for this collision type
        const handlers = this.handlers.get(type);
        if (!handlers) return;

        // Call all registered handlers
        handlers.forEach(handler => {
            try {
                handler(event);
            } catch (error) {
                console.error(`Error in collision handler for type ${type}:`, error);
            }
        });
    }

    getCollisionType(bodyA, bodyB) {
        const groupA = bodyA.collisionFilterGroup;
        const groupB = bodyB.collisionFilterGroup;

        // Vehicle collisions
        if (groupA === COLLISION_GROUPS.VEHICLE || groupB === COLLISION_GROUPS.VEHICLE) {
            const otherGroup = groupA === COLLISION_GROUPS.VEHICLE ? groupB : groupA;
            
            switch (otherGroup) {
                case COLLISION_GROUPS.POWER_UP:
                    return 'vehicle-powerup';
                case COLLISION_GROUPS.MINE:
                    return 'vehicle-mine';
                case COLLISION_GROUPS.ENVIRONMENT:
                    return 'vehicle-environment';
                case COLLISION_GROUPS.PROJECTILE:
                    return 'vehicle-projectile';
            }
        }

        return null;
    }

    start() {
        this.world.addEventListener('beginContact', this.handleCollision.bind(this));
    }

    stop() {
        this.world.removeEventListener('beginContact', this.handleCollision.bind(this));
    }
} 