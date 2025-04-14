import * as THREE from 'three';

export class GroundEffectsSystem {
    constructor(scene, ground) {
        this.scene = scene;
        this.ground = ground;
        
        // Puddle system
        this.puddles = new Map();
        this.maxPuddles = 50;
        this.puddleAccumulation = 0;
        this.lastPuddleTime = 0;
        
        // Ground material states
        this.originalGroundMaterial = ground.material.clone();
        this.wetGroundMaterial = this.createWetGroundMaterial();
        
        // Initialize puddle textures
        this.puddleTexture = this.createPuddleTexture();
        
        // Slick surface physics parameters
        this.frictionModifier = 1.0;
    }
    
    createWetGroundMaterial() {
        // Create a material that looks wet
        const wetMaterial = this.originalGroundMaterial.clone();
        wetMaterial.roughness = 0.1;  // Make it more reflective
        wetMaterial.metalness = 0.3;  // Slight metallic look for water sheen
        
        // Add water ripple effect
        const rippleTexture = new THREE.TextureLoader().load('/assets/textures/water_normal.jpg');
        rippleTexture.wrapS = rippleTexture.wrapT = THREE.RepeatWrapping;
        wetMaterial.normalMap = rippleTexture;
        wetMaterial.normalScale.set(0.2, 0.2);
        
        return wetMaterial;
    }
    
    createPuddleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Create a radial gradient for the puddle
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(20, 20, 30, 0.6)');
        gradient.addColorStop(0.7, 'rgba(20, 20, 30, 0.3)');
        gradient.addColorStop(1, 'rgba(20, 20, 30, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createPuddle(position) {
        // Create puddle mesh
        const size = 20 + Math.random() * 30;
        const geometry = new THREE.PlaneGeometry(size, size);
        
        const material = new THREE.MeshPhongMaterial({
            map: this.puddleTexture,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const puddle = new THREE.Mesh(geometry, material);
        puddle.rotation.x = -Math.PI / 2;
        puddle.position.copy(position);
        puddle.position.y += 0.1; // Slightly above ground to prevent z-fighting
        
        this.scene.add(puddle);
        return {
            mesh: puddle,
            size: size,
            accumulation: 0,
            maxAccumulation: Math.random() * 0.3 + 0.7, // Random max opacity
            dryingRate: Math.random() * 0.1 + 0.05 // Random drying speed
        };
    }
    
    update(deltaTime, rainIntensity) {
        // Update ground wetness
        this.updateGroundWetness(rainIntensity);
        
        // Update existing puddles
        this.updatePuddles(deltaTime, rainIntensity);
        
        // Create new puddles based on rain intensity
        if (rainIntensity > 0) {
            this.puddleAccumulation += deltaTime * rainIntensity;
            
            if (this.puddleAccumulation > 1 && this.puddles.size < this.maxPuddles) {
                this.createRandomPuddle();
                this.puddleAccumulation = 0;
            }
        }
        
        // Update friction modifier for physics
        this.updateFriction(rainIntensity);
    }
    
    updateGroundWetness(rainIntensity) {
        // Blend between dry and wet materials based on rain intensity
        const wetness = Math.min(rainIntensity * 2, 1);
        this.ground.material.roughness = THREE.MathUtils.lerp(
            this.originalGroundMaterial.roughness,
            this.wetGroundMaterial.roughness,
            wetness
        );
        this.ground.material.metalness = THREE.MathUtils.lerp(
            this.originalGroundMaterial.metalness,
            this.wetGroundMaterial.metalness,
            wetness
        );
        
        // Update normal map intensity
        if (this.ground.material.normalMap) {
            this.ground.material.normalScale.setScalar(wetness * 0.2);
        }
    }
    
    updatePuddles(deltaTime, rainIntensity) {
        this.puddles.forEach((puddle, id) => {
            // Update puddle accumulation
            if (rainIntensity > 0) {
                puddle.accumulation = Math.min(
                    puddle.accumulation + deltaTime * rainIntensity * 0.5,
                    puddle.maxAccumulation
                );
            } else {
                puddle.accumulation = Math.max(
                    puddle.accumulation - deltaTime * puddle.dryingRate,
                    0
                );
            }
            
            // Update puddle visibility
            puddle.mesh.material.opacity = puddle.accumulation;
            
            // Remove dried puddles
            if (puddle.accumulation <= 0) {
                this.scene.remove(puddle.mesh);
                this.puddles.delete(id);
            }
        });
    }
    
    createRandomPuddle() {
        // Find a random position on the ground
        const groundSize = 2000; // Adjust based on your ground size
        const position = new THREE.Vector3(
            (Math.random() - 0.5) * groundSize,
            0,
            (Math.random() - 0.5) * groundSize
        );
        
        const puddle = this.createPuddle(position);
        this.puddles.set(this.puddles.size, puddle);
    }
    
    updateFriction(rainIntensity) {
        // Reduce friction as rain intensity increases
        this.frictionModifier = Math.max(0.3, 1 - rainIntensity * 0.5);
    }
    
    getFrictionModifier() {
        return this.frictionModifier;
    }
    
    cleanup() {
        // Remove all puddles
        this.puddles.forEach(puddle => {
            this.scene.remove(puddle.mesh);
        });
        this.puddles.clear();
        
        // Reset ground material
        this.ground.material.copy(this.originalGroundMaterial);
    }
} 