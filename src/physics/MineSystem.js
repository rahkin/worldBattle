import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Mine {
    constructor(world, scene, position, options = {}) {
        this.world = world;
        this.scene = scene;
        this.position = position;
        this.options = Object.assign({
            damage: 50,
            radius: 3,
            color: 0xff0000
        }, options);

        this.isExploded = false;
        this.isActive = false;

        this._createMine();
    }

    _createMine() {
        // Create physics body as a box
        const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.15, 0.25)); // half-dimensions
        this.body = new CANNON.Body({
            mass: 0,
            position: this.position,
            shape: shape,
            material: new CANNON.Material('mineMaterial')
        });
        
        this.body.collisionResponse = false;
        this.world.addBody(this.body);

        // Create visual mesh - simple red box
        const geometry = new THREE.BoxGeometry(1, 0.3, 0.5); // full dimensions
        const material = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5,
            shininess: 30
        });
        
        this.mesh = new THREE.Group();
        const mainBody = new THREE.Mesh(geometry, material);
        this.mesh.add(mainBody);

        // Add red glow effect underneath
        const glowGeometry = new THREE.CircleGeometry(0.8, 32);
        glowGeometry.rotateX(-Math.PI / 2);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = -0.15; // Position just below the box
        this.mesh.add(glow);

        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        this.isActive = true;
    }

    update() {
        if (this.isExploded) return;
        // No rotation or pulsing effects - mines stay static
    }

    explode() {
        if (this.isExploded) return;
        this.isExploded = true;

        // Create explosion effect
        const explosionGeometry = new THREE.SphereGeometry(this.options.radius * 2, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(this.position);
        this.scene.add(explosion);

        // Animate explosion
        const startTime = Date.now();
        const duration = 500; // 0.5 seconds

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            explosion.scale.set(1 + progress * 2, 1 + progress * 2, 1 + progress * 2);
            explosion.material.opacity = 1 - progress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(explosion);
            }
        };

        animate();

        // Remove physics body and mesh
        this.world.removeBody(this.body);
        this.scene.remove(this.mesh);
    }

    cleanup() {
        if (!this.isExploded) {
            this.explode();
        }
    }
}

export class MineSystem {
    constructor(world, scene) {
        this.world = world;
        this.scene = scene;
        this.mines = new Map(); // Change to Map to track mine IDs
        this.maxMines = 5;
        this.currentMines = this.maxMines; // Start with max mines available
        this.nextMineId = 1;
    }

    createMine(position, options = {}) {
        if (this.currentMines <= 0) {
            console.log('No mines available');
            return null;
        }

        const mineId = this.nextMineId++;
        const mine = new Mine(this.world, this.scene, position, options);
        this.mines.set(mineId, mine);
        this.currentMines--; // Decrease available mines when deploying
        
        return mineId;
    }

    explodeMine(mineId) {
        const mine = this.mines.get(mineId);
        if (mine) {
            mine.explode();
            this.mines.delete(mineId);
        }
    }

    instantResupply(amount) {
        if (this.currentMines >= this.maxMines) {
            return 0;  // Already at max, don't add or subtract
        }
        const spaceLeft = this.maxMines - this.currentMines;
        const minesToAdd = Math.min(amount, spaceLeft);
        this.currentMines += minesToAdd;
        return minesToAdd;
    }

    fullResupply() {
        const oldCount = this.currentMines;
        this.currentMines = this.maxMines;
        return this.maxMines - oldCount;
    }

    update() {
        for (const [mineId, mine] of this.mines.entries()) {
            mine.update();
            if (mine.isExploded) {
                this.mines.delete(mineId);
            }
        }
    }

    cleanup() {
        for (const mine of this.mines.values()) {
            mine.cleanup();
        }
        this.mines.clear();
        this.currentMines = this.maxMines; // Reset to max mines after cleanup
    }
} 