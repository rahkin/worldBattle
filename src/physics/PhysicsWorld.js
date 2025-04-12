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
        this.vehicleMaterial = null;

        // Track vehicles for collision handling
        this.vehicles = new Set();
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

    addVehicle(vehicle) {
        this.vehicles.add(vehicle);
    }

    removeVehicle(vehicle) {
        this.vehicles.delete(vehicle);
    }

    init() {
        // Set up materials first
        this.groundMaterial = new CANNON.Material('ground');
        this.wheelMaterial = new CANNON.Material('wheel');
        this.obstacleMaterial = new CANNON.Material('obstacle');
        this.vehicleMaterial = new CANNON.Material('vehicle');
        
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

        // Vehicle collision materials
        const vehicleVehicleContact = new CANNON.ContactMaterial(
            this.vehicleMaterial,
            this.vehicleMaterial,
            {
                friction: 0.3,
                restitution: 0.2,
                contactEquationStiffness: 1e7,
                contactEquationRelaxation: 3
            }
        );
        this.world.addContactMaterial(vehicleVehicleContact);

        const vehicleObstacleContact = new CANNON.ContactMaterial(
            this.vehicleMaterial,
            this.obstacleMaterial,
            {
                friction: 0.4,
                restitution: 0.3,
                contactEquationStiffness: 1e7,
                contactEquationRelaxation: 3
            }
        );
        this.world.addContactMaterial(vehicleObstacleContact);

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

        // Handle collisions
        this.world.addEventListener('collide', (event) => {
            const bodyA = event.bodyA;
            const bodyB = event.bodyB;
            const contact = event.contact;
            
            if (!contact || !bodyA || !bodyB) return;
            
            const impactVelocity = contact.getImpactVelocityAlongNormal();

            // Check if either body is a vehicle
            const vehicleA = Array.from(this.vehicles).find(v => v.vehicle.chassisBody === bodyA);
            const vehicleB = Array.from(this.vehicles).find(v => v.vehicle.chassisBody === bodyB);

            if (vehicleA && vehicleB) {
                // Vehicle-vehicle collision
                const damage = Math.abs(impactVelocity) * 10;
                const contactPoint = contact.bi ? contact.bi.position : bodyA.position;
                vehicleA.applyDamage(damage, contactPoint, impactVelocity);
                vehicleB.applyDamage(damage, contactPoint, impactVelocity);
            } else if (vehicleA || vehicleB) {
                // Vehicle-obstacle collision
                const vehicle = vehicleA || vehicleB;
                const damage = Math.abs(impactVelocity) * 5;
                const contactPoint = contact.bi ? contact.bi.position : bodyA.position;
                vehicle.applyDamage(damage, contactPoint, impactVelocity);
            }

            // Debug output
            console.debug('Collision:', {
                bodyA: bodyA.id,
                bodyB: bodyB.id,
                velocity: impactVelocity,
                contact: contact
            });
        });
    }

    update(deltaTime) {
        this.world.step(deltaTime);
    }
} 