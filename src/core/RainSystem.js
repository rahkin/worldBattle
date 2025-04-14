import * as THREE from 'three';

export class RainSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // Rain parameters
        this.rainCount = 15000;
        this.rainGeometry = null;
        this.rainMaterial = null;
        this.rainPoints = null;
        
        // Rain area
        this.areaWidth = 2000;
        this.areaHeight = 1000;
        this.areaDepth = 2000;
        
        // Rain properties
        this.velocity = new THREE.Vector3(0, -10, 0); // Base velocity
        this.windEffect = new THREE.Vector3(0, 0, 0);
        this.enabled = false;
        
        this.initRain();
    }
    
    initRain() {
        // Create rain drop geometry
        this.rainGeometry = new THREE.BufferGeometry();
        
        // Create positions for rain drops
        const positions = new Float32Array(this.rainCount * 3);
        const velocities = new Float32Array(this.rainCount * 3);
        const sizes = new Float32Array(this.rainCount);
        
        for (let i = 0; i < this.rainCount; i++) {
            // Random position within the area
            positions[i * 3] = (Math.random() - 0.5) * this.areaWidth;     // x
            positions[i * 3 + 1] = Math.random() * this.areaHeight;        // y
            positions[i * 3 + 2] = (Math.random() - 0.5) * this.areaDepth; // z
            
            // Velocity variation for each drop
            velocities[i * 3] = this.velocity.x + (Math.random() - 0.5) * 2;
            velocities[i * 3 + 1] = this.velocity.y + (Math.random() - 0.5) * 5;
            velocities[i * 3 + 2] = this.velocity.z + (Math.random() - 0.5) * 2;
            
            // Random sizes for variation
            sizes[i] = 2 + Math.random() * 3;
        }
        
        // Add attributes to geometry
        this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.rainGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        this.rainGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create rain material with custom shader
        this.rainMaterial = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
                pointTexture: { value: this.createRainDropTexture() },
                fogColor: { value: new THREE.Color(0xcfcfcf) },
                fogNear: { value: 1.0 },
                fogFar: { value: 2000.0 },
                time: { value: 0 },
                windEffect: { value: this.windEffect }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 velocity;
                uniform float time;
                uniform vec3 windEffect;
                
                varying float vAlpha;
                
                void main() {
                    // Apply velocity and wind
                    vec3 pos = position + (velocity + windEffect) * time;
                    
                    // Reset position if drop goes below ground
                    if (pos.y < -10.0) {
                        pos.y = ${this.areaHeight}.0;
                        pos.x = position.x;
                        pos.z = position.z;
                    }
                    
                    // Calculate alpha based on y position for fade in/out
                    float topFade = smoothstep(${this.areaHeight - 100}.0, ${this.areaHeight}.0, pos.y);
                    float bottomFade = smoothstep(-10.0, 100.0, pos.y);
                    vAlpha = (1.0 - topFade) * bottomFade;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    // Size attenuation
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                uniform vec3 fogColor;
                uniform float fogNear;
                uniform float fogFar;
                
                varying float vAlpha;
                
                void main() {
                    // Sample raindrop texture
                    vec4 tex = texture2D(pointTexture, gl_PointCoord);
                    
                    // Apply fog
                    float depth = gl_FragCoord.z / gl_FragCoord.w;
                    float fogFactor = smoothstep(fogNear, fogFar, depth);
                    
                    // Final color with fog and alpha
                    gl_FragColor = vec4(mix(vec3(0.7, 0.7, 0.8), fogColor, fogFactor), tex.a * vAlpha * 0.6);
                }
            `
        });
        
        // Create the particle system
        this.rainPoints = new THREE.Points(this.rainGeometry, this.rainMaterial);
        this.rainPoints.frustumCulled = false; // Prevent culling issues
        this.rainPoints.visible = false;
        
        // Add to scene
        this.scene.add(this.rainPoints);
    }
    
    createRainDropTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Create a radial gradient for the raindrop
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        // Draw the gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        
        // Create texture
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    setIntensity(intensity) {
        // Adjust rain parameters based on intensity (0-1)
        this.rainPoints.material.opacity = intensity * 0.6;
        this.velocity.y = -10 - intensity * 10; // Faster rain when more intense
        
        // Update velocities in geometry
        const velocities = this.rainGeometry.attributes.velocity.array;
        for (let i = 0; i < this.rainCount; i++) {
            velocities[i * 3 + 1] = this.velocity.y + (Math.random() - 0.5) * 5;
        }
        this.rainGeometry.attributes.velocity.needsUpdate = true;
    }
    
    setWind(windSpeed, windDirection) {
        // Update wind effect based on speed and direction
        this.windEffect.x = Math.sin(windDirection) * windSpeed;
        this.windEffect.z = Math.cos(windDirection) * windSpeed;
        
        if (this.rainPoints) {
            this.rainPoints.material.uniforms.windEffect.value = this.windEffect;
        }
    }
    
    enable() {
        if (this.rainPoints) {
            this.rainPoints.visible = true;
            this.enabled = true;
        }
    }
    
    disable() {
        if (this.rainPoints) {
            this.rainPoints.visible = false;
            this.enabled = false;
        }
    }
    
    update(deltaTime) {
        if (!this.enabled || !this.rainPoints) return;
        
        // Update time uniform for animation
        this.rainPoints.material.uniforms.time.value += deltaTime;
        
        // Reset time if it gets too large to prevent floating point issues
        if (this.rainPoints.material.uniforms.time.value > 1000) {
            this.rainPoints.material.uniforms.time.value = 0;
            
            // Reset positions
            const positions = this.rainGeometry.attributes.position.array;
            for (let i = 0; i < this.rainCount; i++) {
                positions[i * 3] = (Math.random() - 0.5) * this.areaWidth;
                positions[i * 3 + 1] = Math.random() * this.areaHeight;
                positions[i * 3 + 2] = (Math.random() - 0.5) * this.areaDepth;
            }
            this.rainGeometry.attributes.position.needsUpdate = true;
        }
    }
} 