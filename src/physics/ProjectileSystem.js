import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class ProjectileSystem {
    constructor(world, scene, camera) {
        this.world = world;
        this.scene = scene;
        this.camera = camera;  // Store camera reference
        this.projectiles = new Map(); // Map of projectile IDs to their bodies and meshes
        this.nextProjectileId = 0;
        
        // Create projectile material
        this.projectileMaterial = new CANNON.Material('projectile');
        this.projectileMaterial.friction = 0.0;
        this.projectileMaterial.restitution = 0.3; // Reduced restitution for better penetration
        
        // Create projectile contact material
        this.projectileContactMaterial = new CANNON.ContactMaterial(
            this.projectileMaterial,
            this.world.defaultMaterial,
            {
                friction: 0.0,
                restitution: 0.3,
                contactEquationStiffness: 1e8,
                contactEquationRelaxation: 3
            }
        );
        this.world.addContactMaterial(this.projectileContactMaterial);

        // Add collision event listener
        this.world.addEventListener('beginContact', this.handleCollision.bind(this));
    }

    handleCollision(event) {
        const { bodyA, bodyB } = event;
        if (!bodyA || !bodyB) return;
        
        // Check if either body is a projectile
        const projectile = this.findProjectileByBody(bodyA) || this.findProjectileByBody(bodyB);
        if (!projectile) return;

        // Get the other body (target or environment)
        const otherBody = bodyA === projectile.body ? bodyB : bodyA;

        // Create explosion effect at impact point
        const impactPoint = projectile.body.position;
        this.createExplosionEffect(impactPoint, projectile.damage);

        // Check if the other body is a test target
        if (otherBody.userData && otherBody.userData.isTestTarget) {
            const target = otherBody.userData.target;
            if (target) {
                target.takeDamage(projectile.damage);
            }
        }

        // Schedule projectile removal for the next frame
        requestAnimationFrame(() => {
            this.removeProjectile(projectile.id);
        });
    }

    createExplosionEffect(position, damage) {
        // Create explosion core
        const explosionGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const explosionMaterial = new THREE.MeshPhongMaterial({
            color: 0xff3300,
            emissive: 0xff3300,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.8
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.scene.add(explosion);

        // Create shockwave ring
        const ringGeometry = new THREE.RingGeometry(0.2, 0.3, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xff5500,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.lookAt(this.camera.position);
        this.scene.add(ring);

        // Create particles
        const particleCount = Math.min(20, Math.floor(damage));
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleVelocities = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.random() * Math.PI * 2);
            const speed = 2 + Math.random() * 3;
            particleVelocities.push({
                x: Math.cos(angle) * speed,
                y: Math.random() * speed * 2,
                z: Math.sin(angle) * speed
            });

            particlePositions[i * 3] = position.x;
            particlePositions[i * 3 + 1] = position.y;
            particlePositions[i * 3 + 2] = position.z;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xff4400,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);

        // Animate explosion
        let scale = 1;
        const animate = () => {
            scale += 0.2;
            
            // Animate core explosion
            explosion.scale.set(scale, scale, scale);
            explosion.material.opacity = Math.max(0, 0.8 - scale * 0.2);
            
            // Animate shockwave ring
            ring.scale.set(scale, scale, scale);
            ring.material.opacity = Math.max(0, 0.6 - scale * 0.15);
            
            // Animate particles
            const positions = particles.geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                positions[i3] += particleVelocities[i].x * 0.1;
                positions[i3 + 1] += particleVelocities[i].y * 0.1;
                positions[i3 + 2] += particleVelocities[i].z * 0.1;
                particleVelocities[i].y -= 0.1; // Gravity effect
            }
            particles.geometry.attributes.position.needsUpdate = true;
            particles.material.opacity = Math.max(0, 0.8 - scale * 0.2);
            
            if (scale < 5) {
                requestAnimationFrame(animate);
            } else {
                // Remove all explosion elements
                this.scene.remove(explosion);
                this.scene.remove(ring);
                this.scene.remove(particles);
            }
        };
        animate();
    }

    findProjectileByBody(body) {
        for (const [id, projectile] of this.projectiles.entries()) {
            if (projectile.body === body) {
                return { ...projectile, id };
            }
        }
        return null;
    }

    createProjectile(position, direction, speed = 200, damage = 25, inheritedVelocity = null) {
        const id = this.nextProjectileId++;
        
        // Convert position to CANNON.Vec3 if it's a THREE.Vector3
        const cannonPosition = position instanceof THREE.Vector3 
            ? new CANNON.Vec3(position.x, position.y, position.z)
            : position.clone();
        
        // Convert direction to CANNON.Vec3 and normalize
        const cannonDirection = direction instanceof THREE.Vector3
            ? new CANNON.Vec3(direction.x, direction.y, direction.z)
            : direction.clone();
        cannonDirection.normalize();
        
        // Create physics body - smaller and denser for better ballistics
        const radius = 0.1;
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({
            mass: 0.5,
            shape: shape,
            material: this.projectileMaterial,
            position: cannonPosition,
            linearDamping: 0.01,
            angularDamping: 0.0
        });
        
        // Set initial velocity
        const baseVelocity = cannonDirection.scale(speed);
        if (inheritedVelocity) {
            // Scale down the inherited velocity to 30% of its original strength
            const scaledInheritedVelocity = inheritedVelocity.scale(0.3);
            // Add scaled inherited velocity to base velocity
            body.velocity.copy(baseVelocity.vadd(scaledInheritedVelocity));
        } else {
            body.velocity.copy(baseVelocity);
        }
        
        // Create visual mesh
        const geometry = new THREE.CylinderGeometry(radius, radius, 0.6, 8);
        geometry.rotateX(Math.PI / 2);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff4400,
            emissive: 0xff4400,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        // Add to world and scene
        this.world.addBody(body);
        this.scene.add(mesh);
        
        // Store projectile data
        this.projectiles.set(id, {
            id,
            body,
            mesh,
            damage,
            createdAt: Date.now(),
            lifetime: 10000
        });
        
        return id;
    }

    update(deltaTime) {
        const now = Date.now();
        
        // Update all projectiles
        for (const [id, projectile] of this.projectiles.entries()) {
            // Update visual position
            projectile.mesh.position.copy(projectile.body.position);
            projectile.mesh.quaternion.copy(projectile.body.quaternion);
            
            // Check lifetime
            if (now - projectile.createdAt > projectile.lifetime) {
                this.removeProjectile(id);
            }
        }
    }

    removeProjectile(id) {
        const projectile = this.projectiles.get(id);
        if (projectile) {
            this.world.removeBody(projectile.body);
            this.scene.remove(projectile.mesh);
            this.projectiles.delete(id);
        }
    }

    getProjectile(id) {
        return this.projectiles.get(id);
    }
} 