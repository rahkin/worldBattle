import { System } from '../core/System.js';
import { MineComponent } from '../components/MineComponent.js';
import { VehicleComponent } from '../components/VehicleComponent.js';
import { PhysicsBody } from '../components/PhysicsBody.js';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class MineSystem extends System {
    constructor(scene, physicsWorld) {
        super();
        this.requiredComponents = [MineComponent];
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.mines = new Map();
        this.maxMines = 5;
        this.setupMineMesh();
    }

    setupMineMesh() {
        const geometry = new THREE.SphereGeometry(0.5, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        this.mineMesh = new THREE.Mesh(geometry, material);
    }

    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents([MineComponent]);
        for (const entity of entities) {
            const mine = entity.getComponent(MineComponent);
            mine.update(deltaTime);

            // Update visual effects
            if (!mine.exploded) {
                const mesh = this.mines.get(entity.id)?.mesh;
                if (mesh) {
                    mesh.rotation.y += deltaTime;
                    if (mine.armed) {
                        mesh.material.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
                    }
                }
            }
        }
    }

    deployMine(position, ownerId) {
        // Check if owner has reached max mines
        const ownerMines = Array.from(this.mines.values()).filter(
            mine => mine.entity.getComponent(MineComponent).ownerId === ownerId
        );
        
        if (ownerMines.length >= this.maxMines) {
            // Remove oldest mine
            const oldestMine = ownerMines[0];
            this.removeMine(oldestMine.entity.id);
        }

        // Create mine entity
        const entity = this.world.createEntity();
        const mine = new MineComponent({ ownerId });
        entity.addComponent(mine);

        // Create physics body
        const shape = new CANNON.Sphere(0.5);
        const body = new CANNON.Body({
            mass: 1,
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: new CANNON.Material('mineMaterial')
        });
        body.collisionFilterGroup = 4; // Mine group
        body.collisionFilterMask = 1; // Collide with vehicles
        entity.addComponent(new PhysicsBody(body));
        this.physicsWorld.addBody(body);

        // Create visual representation
        const mesh = this.mineMesh.clone();
        mesh.position.copy(position);
        this.scene.add(mesh);

        // Store reference
        this.mines.set(entity.id, { entity, mesh, body });

        return entity.id;
    }

    handleCollision(entityId, otherEntity) {
        const mineData = this.mines.get(entityId);
        if (!mineData) return;

        const mine = mineData.entity.getComponent(MineComponent);
        const vehicle = otherEntity.getComponent(VehicleComponent);

        if (mine && vehicle && mine.armed && !mine.exploded) {
            this.explodeMine(entityId, otherEntity);
        }
    }

    explodeMine(mineId, vehicleEntity) {
        const mineData = this.mines.get(mineId);
        if (!mineData) return;

        const mine = mineData.entity.getComponent(MineComponent);
        const vehicle = vehicleEntity.getComponent(VehicleComponent);
        const vehiclePhysics = vehicleEntity.getComponent(PhysicsBody);

        if (mine && vehicle && vehiclePhysics) {
            // Apply damage to vehicle
            vehicle.takeDamage(mine.damage);

            // Apply explosion force
            const direction = new CANNON.Vec3();
            direction.copy(vehiclePhysics.position);
            direction.vsub(mineData.body.position, direction);
            direction.normalize();
            direction.scale(mine.explosionForce, direction);
            vehiclePhysics.applyImpulse(direction, new CANNON.Vec3(0, 0, 0));

            // Create explosion effect
            this.createExplosionEffect(mineData.mesh.position);

            // Remove mine
            this.removeMine(mineId);
        }
    }

    createExplosionEffect(position) {
        // Create explosion particle system
        const geometry = new THREE.BufferGeometry();
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2;
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;

            velocities[i * 3] = Math.cos(angle) * radius;
            velocities[i * 3 + 1] = Math.random() * 2;
            velocities[i * 3 + 2] = Math.sin(angle) * radius;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

        const material = new THREE.PointsMaterial({
            color: 0xff6600,
            size: 0.2,
            transparent: true,
            opacity: 1
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        // Animate and remove particles
        const animate = () => {
            const positions = particles.geometry.attributes.position.array;
            const velocities = particles.geometry.attributes.velocity.array;

            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i] * 0.1;
                positions[i + 1] += velocities[i + 1] * 0.1;
                positions[i + 2] += velocities[i + 2] * 0.1;
            }

            particles.geometry.attributes.position.needsUpdate = true;
            material.opacity -= 0.02;

            if (material.opacity <= 0) {
                this.scene.remove(particles);
                particles.geometry.dispose();
                particles.material.dispose();
            } else {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    removeMine(mineId) {
        const mineData = this.mines.get(mineId);
        if (!mineData) return;

        // Remove from physics world
        this.physicsWorld.removeBody(mineData.body);

        // Remove from scene
        this.scene.remove(mineData.mesh);
        mineData.mesh.geometry.dispose();
        mineData.mesh.material.dispose();

        // Remove entity
        this.world.removeEntity(mineData.entity);

        // Remove from mines map
        this.mines.delete(mineId);
    }

    cleanup() {
        // Remove all mines
        for (const mineId of this.mines.keys()) {
            this.removeMine(mineId);
        }
    }
} 