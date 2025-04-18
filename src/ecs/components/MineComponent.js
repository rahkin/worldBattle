export class MineComponent {
    constructor(options = {}) {
        this.damage = options.damage || 50;
        this.explosionRadius = options.explosionRadius || 5;
        this.explosionForce = options.explosionForce || 1000;
        this.armTime = options.armTime || 2;
        this.armed = false;
        this.exploded = false;
        this.ownerId = options.ownerId || null;
    }

    arm() {
        this.armed = true;
    }

    explode() {
        this.exploded = true;
    }

    update(deltaTime) {
        if (!this.armed && !this.exploded) {
            this.armTime -= deltaTime;
            if (this.armTime <= 0) {
                this.arm();
            }
        }
    }
} 