import * as CANNON from 'cannon-es';

export class PhysicsComponent {
    constructor(options = {}) {
        this.body = null;
        this.mass = options.mass || 1;
        this.shape = options.shape || null;
        this.material = options.material || null;
        this.velocity = new CANNON.Vec3();
        this.angularVelocity = new CANNON.Vec3();
        this.force = new CANNON.Vec3();
        this.torque = new CANNON.Vec3();
        this.collisionFilterGroup = options.collisionFilterGroup || 1;
        this.collisionFilterMask = options.collisionFilterMask || -1;
    }

    setBody(body) {
        this.body = body;
        if (this.body) {
            this.body.mass = this.mass;
            this.body.collisionFilterGroup = this.collisionFilterGroup;
            this.body.collisionFilterMask = this.collisionFilterMask;
        }
    }

    applyForce(force, point) {
        if (this.body) {
            this.body.applyForce(force, point);
        }
    }

    applyImpulse(impulse, point) {
        if (this.body) {
            this.body.applyImpulse(impulse, point);
        }
    }

    setVelocity(velocity) {
        if (this.body) {
            this.body.velocity.copy(velocity);
        }
    }

    setAngularVelocity(angularVelocity) {
        if (this.body) {
            this.body.angularVelocity.copy(angularVelocity);
        }
    }
} 