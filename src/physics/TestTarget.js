import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class TestTarget {
    constructor(world, scene, camera, position = new CANNON.Vec3(0, 2, 10)) {
        this.world = world;
        this.scene = scene;
        this.camera = camera;
        this.health = 100;
        this.maxHealth = 100;
        
        // Regeneration properties
        this.isRegenerating = false;
        this.regenerationDelay = 10000; // 10 seconds
        this.regenerationTimer = null;
        
        // Create physics body - make it wider and taller for a wall
        const size = new CANNON.Vec3(3, 4, 0.5); // Width: 6m, Height: 8m, Thickness: 1m
        const shape = new CANNON.Box(size);
        this.body = new CANNON.Body({
            mass: 0, // Static body
            shape: shape,
            position: position,
            material: world.defaultMaterial
        });
        
        // Set userData for collision detection
        this.body.userData = {
            isTestTarget: true,
            target: this
        };
        
        // Create visual mesh
        const geometry = new THREE.BoxGeometry(size.x * 2, size.y * 2, size.z * 2);
        this.material = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8,
            metalness: 0.5,
            roughness: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, this.material);
        
        // Add wall details
        this.addWallDetails();
        
        // Add to world and scene
        this.world.addBody(this.body);
        this.scene.add(this.mesh);
        
        // Create health display
        this.createHealthDisplay();
    }
    
    addWallDetails() {
        // Add reinforcement lines
        const lineGeometry = new THREE.BoxGeometry(6.2, 0.2, 0.1);
        const lineMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        // Add horizontal reinforcement lines
        for (let i = -3; i <= 3; i += 1.5) {
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.y = i;
            line.position.z = 0.5;
            this.mesh.add(line);
        }

        // Add vertical reinforcement lines
        const vertLineGeometry = new THREE.BoxGeometry(0.2, 8.2, 0.1);
        for (let i = -3; i <= 3; i += 1.5) {
            const line = new THREE.Mesh(vertLineGeometry, lineMaterial);
            line.position.x = i;
            line.position.z = 0.5;
            this.mesh.add(line);
        }
    }
    
    createHealthDisplay() {
        // Create container for health bar
        this.healthBarContainer = document.createElement('div');
        this.healthBarContainer.style.position = 'absolute';
        this.healthBarContainer.style.width = '100px';
        this.healthBarContainer.style.height = '10px';
        this.healthBarContainer.style.backgroundColor = '#333';
        this.healthBarContainer.style.border = '1px solid #000';
        
        // Create the actual health bar
        this.healthBar = document.createElement('div');
        this.healthBar.style.width = '100%';
        this.healthBar.style.height = '100%';
        this.healthBar.style.backgroundColor = '#00ff00';
        this.healthBar.style.transition = 'width 0.3s, background-color 0.3s';
        
        this.healthBarContainer.appendChild(this.healthBar);
        document.body.appendChild(this.healthBarContainer);
    }
    
    updateHealthDisplay() {
        const percentage = (this.health / this.maxHealth) * 100;
        this.healthBar.style.width = `${percentage}%`;
        
        // Update color based on health
        if (percentage > 70) {
            this.healthBar.style.backgroundColor = '#00ff00'; // Green
            this.material.color.setHex(0x00ff00);
        } else if (percentage > 30) {
            this.healthBar.style.backgroundColor = '#ffff00'; // Yellow
            this.material.color.setHex(0xffff00);
        } else {
            this.healthBar.style.backgroundColor = '#ff0000'; // Red
            this.material.color.setHex(0xff0000);
        }
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.updateHealthDisplay();
        
        // Add damage effects
        this.addDamageEffect(amount);

        // Reset regeneration timer
        if (this.regenerationTimer) {
            clearTimeout(this.regenerationTimer);
        }

        // Start regeneration timer
        this.regenerationTimer = setTimeout(() => {
            this.regenerateHealth();
        }, this.regenerationDelay);
    }
    
    addDamageEffect(amount) {
        // Create impact particles
        const particleCount = Math.min(10, Math.floor(amount));
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            particlePositions[i * 3] = (Math.random() - 0.5) * 0.5;
            particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
            particlePositions[i * 3 + 2] = 0.1;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xcccccc,
            size: 0.1,
            sizeAttenuation: true
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.mesh.add(particles);
        
        // Remove particles after animation
        setTimeout(() => {
            this.mesh.remove(particles);
        }, 1000);
    }
    
    regenerateHealth() {
        // Visual effect for regeneration
        const healEffect = new THREE.Points(
            new THREE.BufferGeometry().setAttribute('position', 
                new THREE.Float32BufferAttribute([0, 0, 0], 3)
            ),
            new THREE.PointsMaterial({
                color: 0x00ff00,
                size: 1,
                sizeAttenuation: true
            })
        );
        this.mesh.add(healEffect);

        // Animate healing effect
        const startTime = Date.now();
        const duration = 1000; // 1 second animation
        const animate = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < duration) {
                healEffect.scale.setScalar(elapsed / duration * 3);
                healEffect.material.opacity = 1 - (elapsed / duration);
                requestAnimationFrame(animate);
            } else {
                this.mesh.remove(healEffect);
            }
        };
        animate();

        // Restore health
        this.health = this.maxHealth;
        this.updateHealthDisplay();
    }
    
    update() {
        // Update visual position
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
        
        // Update health bar position
        const screenPosition = this.mesh.position.clone();
        screenPosition.y += 5; // Position above the target
        screenPosition.project(this.camera);
        
        const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-screenPosition.y * 0.5 + 0.5) * window.innerHeight;
        
        this.healthBarContainer.style.transform = `translate(${x - 50}px, ${y - 30}px)`;
        
        // Hide health bar if target is behind camera
        this.healthBarContainer.style.display = screenPosition.z > 1 ? 'none' : 'block';
    }
    
    destroy() {
        if (this.regenerationTimer) {
            clearTimeout(this.regenerationTimer);
        }
        this.world.removeBody(this.body);
        this.scene.remove(this.mesh);
        document.body.removeChild(this.healthBarContainer);
    }
} 