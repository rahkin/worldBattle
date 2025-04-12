import * as CANNON from 'cannon-es';

export class PhysicsWorld {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.defaultContactMaterial.friction = 0.2;
        this.world.defaultContactMaterial.restitution = 0.2;
    }

    init() {
        // Ground plane
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ 
            mass: 0,
            material: new CANNON.Material('ground')
        });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(
            new CANNON.Vec3(1, 0, 0),
            -Math.PI / 2
        );
        // Move ground slightly down to make it visible in debug mode
        groundBody.position.set(0, -0.01, 0);
        this.world.addBody(groundBody);

        // Set up materials
        const groundMaterial = new CANNON.Material('ground');
        const wheelMaterial = new CANNON.Material('wheel');
        const wheelGroundContact = new CANNON.ContactMaterial(
            wheelMaterial,
            groundMaterial,
            {
                friction: 0.3,
                restitution: 0,
                contactEquationStiffness: 1000
            }
        );
        this.world.addContactMaterial(wheelGroundContact);

        // Add collision event listeners for debugging
        this.world.addEventListener('collide', (event) => {
            console.debug('Collision between bodies:', 
                event.bodyA.id, 
                event.bodyB.id,
                'at velocity:', 
                event.contact.getImpactVelocityAlongNormal()
            );
        });
    }

    update(deltaTime) {
        this.world.step(1/60, deltaTime, 3);
    }
} 