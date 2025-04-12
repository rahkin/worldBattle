import * as CANNON from 'cannon-es';

export class PhysicsWorld {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.defaultContactMaterial.friction = 0.2;
        this.world.defaultContactMaterial.restitution = 0.2;
        
        // Initialize materials
        this.groundMaterial = null;
        this.wheelMaterial = null;
        this.obstacleMaterial = null;
    }

    createRampBody(position, rotation = 0) {
        // Create a box shape for the ramp
        const rampShape = new CANNON.Box(new CANNON.Vec3(2, 0.75, 3)); // Half-extents
        
        // Create the body
        const rampBody = new CANNON.Body({
            mass: 0,  // Static body
            material: this.obstacleMaterial,
            type: CANNON.Body.STATIC
        });
        rampBody.addShape(rampShape);
        rampBody.position.copy(position);
        
        // Set rotation
        const quaternion = new CANNON.Quaternion();
        quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 8); // 22.5 degrees slope
        const yRotation = new CANNON.Quaternion();
        yRotation.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotation);
        quaternion.mult(yRotation, quaternion);
        rampBody.quaternion.copy(quaternion);
        
        // Add to world
        this.world.addBody(rampBody);
        return rampBody;
    }

    createObstacle(position, size = { x: 1, y: 1, z: 1 }) {
        const shape = new CANNON.Box(new CANNON.Vec3(size.x/2, size.y/2, size.z/2));
        const body = new CANNON.Body({
            mass: 0,  // Static body
            material: this.obstacleMaterial,
            type: CANNON.Body.STATIC
        });
        body.addShape(shape);
        body.position.copy(position);
        this.world.addBody(body);
        return body;
    }

    init() {
        // Set up materials first
        this.groundMaterial = new CANNON.Material('ground');
        this.wheelMaterial = new CANNON.Material('wheel');
        this.obstacleMaterial = new CANNON.Material('obstacle');
        
        // Ground plane
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ 
            mass: 0,
            material: this.groundMaterial,
            type: CANNON.Body.STATIC
        });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(
            new CANNON.Vec3(1, 0, 0),
            -Math.PI / 2
        );
        groundBody.position.set(0, 0, 0);
        this.world.addBody(groundBody);

        // Contact material between wheel and ground
        const wheelGroundContact = new CANNON.ContactMaterial(
            this.wheelMaterial,
            this.groundMaterial,
            {
                friction: 0.8,
                restitution: 0.0,
                contactEquationStiffness: 1e8,
                contactEquationRelaxation: 3,
                frictionEquationStiffness: 1e8
            }
        );
        this.world.addContactMaterial(wheelGroundContact);

        // Create obstacle contact materials
        const obstacleGroundContact = new CANNON.ContactMaterial(
            this.obstacleMaterial,
            this.groundMaterial,
            {
                friction: 0.5,
                restitution: 0.1
            }
        );
        this.world.addContactMaterial(obstacleGroundContact);

        const obstacleWheelContact = new CANNON.ContactMaterial(
            this.obstacleMaterial,
            this.wheelMaterial,
            {
                friction: 0.5,
                restitution: 0.1
            }
        );
        this.world.addContactMaterial(obstacleWheelContact);

        // Create obstacles
        const obstacles = [
            { pos: new CANNON.Vec3(5, 0.5, 0), size: { x: 1, y: 1, z: 1 } },
            { pos: new CANNON.Vec3(-3, 0.5, 4), size: { x: 1, y: 1, z: 1 } },
            { pos: new CANNON.Vec3(2, 0.5, -5), size: { x: 1, y: 1, z: 1 } },
            { pos: new CANNON.Vec3(-4, 0.5, -3), size: { x: 1, y: 1, z: 1 } }
        ];

        obstacles.forEach(obs => this.createObstacle(obs.pos, obs.size));

        // Create ramps at strategic locations
        this.createRampBody(new CANNON.Vec3(10, 0, 0));  // Right side ramp
        this.createRampBody(new CANNON.Vec3(-10, 0, 0), Math.PI);  // Left side ramp
        this.createRampBody(new CANNON.Vec3(0, 0, 15), Math.PI / 2);  // Front ramp
        this.createRampBody(new CANNON.Vec3(0, 0, -15), -Math.PI / 2);  // Back ramp

        // Debug collision events
        this.world.addEventListener('collide', (event) => {
            console.debug('Collision:', {
                bodyA: event.bodyA.id,
                bodyB: event.bodyB.id,
                velocity: event.contact.getImpactVelocityAlongNormal(),
                contact: event.contact
            });
        });
    }

    update(deltaTime) {
        this.world.step(deltaTime);
    }
} 