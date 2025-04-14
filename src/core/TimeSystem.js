import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

export class TimeSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentTime = new Date(); // This will automatically use local time
        this.timeScale = 1.0; // Real-time by default
        this.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Get local timezone
        this.isPaused = false;
        this.isTestMode = false;
        this.testTime = null;
        
        // Lighting setup
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.moonLight = new THREE.DirectionalLight(0x7f7fff, 0.3);
        
        // Configure lights
        this.sunLight.castShadow = true;
        this.moonLight.castShadow = true;
        
        // Add lights to scene
        this.scene.add(this.ambientLight);
        this.scene.add(this.sunLight);
        this.scene.add(this.moonLight);
        
        // Initialize sky
        this.initSky();
        
        // Create star field
        this.createStarField();
    }

    initSky() {
        // Create Sky instance
        this.sky = new Sky();
        this.sky.scale.setScalar(1125000);  // Increased proportionally for 5000 unit radius (675000 * 5000/3000)
        this.scene.add(this.sky);

        // Sky shader uniforms for more realistic atmospheric scattering
        const uniforms = this.sky.material.uniforms;
        this.skyUniforms = uniforms;
        
        // Default sky parameters
        this.skyParams = {
            turbidity: 10,
            rayleigh: 2,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.8,
            elevation: 2,
            azimuth: 180
        };
        
        // Apply initial parameters
        uniforms.turbidity.value = this.skyParams.turbidity;
        uniforms.rayleigh.value = this.skyParams.rayleigh;
        uniforms.mieCoefficient.value = this.skyParams.mieCoefficient;
        uniforms.mieDirectionalG.value = this.skyParams.mieDirectionalG;

        // Initial sun position
        this.sunPosition = new THREE.Vector3();
    }

    createStarField() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 5000;
        const starPositions = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);
        const starSizes = new Float32Array(starCount);
        
        // Define major constellations with accurate star patterns
        const constellations = [
            {
                name: 'Big Dipper',
                stars: [
                    { x: 0.0, y: 0.8, z: 0.0, size: 400, color: [1.0, 0.98, 0.9] }, // Dubhe
                    { x: 0.2, y: 0.75, z: 0.0, size: 380, color: [1.0, 0.95, 0.85] }, // Merak
                    { x: 0.4, y: 0.6, z: 0.0, size: 420, color: [0.95, 0.95, 1.0] },  // Phecda
                    { x: 0.6, y: 0.5, z: 0.0, size: 390, color: [1.0, 1.0, 0.95] },  // Megrez
                    { x: 0.8, y: 0.45, z: 0.0, size: 410, color: [1.0, 0.98, 0.9] }, // Alioth
                    { x: 1.0, y: 0.3, z: 0.0, size: 400, color: [0.98, 0.98, 1.0] }, // Mizar
                    { x: 1.2, y: 0.25, z: 0.0, size: 350, color: [1.0, 1.0, 0.95] }  // Alkaid
                ]
            },
            {
                name: 'Orion',
                stars: [
                    { x: -0.5, y: 0.6, z: 0.0, size: 140, color: [1.0, 0.8, 0.6] }, // Betelgeuse
                    { x: 0.5, y: 0.6, z: 0.0, size: 130, color: [0.8, 0.9, 1.0] },  // Rigel
                    { x: -0.2, y: 0.4, z: 0.0, size: 110, color: [1.0, 1.0, 0.9] }, // Bellatrix
                    { x: 0.2, y: 0.4, z: 0.0, size: 110, color: [0.9, 0.9, 1.0] },  // Saiph
                    { x: 0.0, y: 0.3, z: 0.0, size: 120, color: [0.9, 0.95, 1.0] }, // Alnilam
                    { x: -0.1, y: 0.3, z: 0.0, size: 115, color: [1.0, 0.95, 0.9] }, // Alnitak
                    { x: 0.1, y: 0.3, z: 0.0, size: 115, color: [0.95, 0.95, 1.0] }, // Mintaka
                    { x: 0.0, y: 0.0, z: 0.0, size: 100, color: [1.0, 1.0, 0.9] },  // Center
                    { x: 0.0, y: 0.15, z: 0.0, size: 105, color: [0.9, 0.9, 1.0] }  // Sword
                ]
            },
            {
                name: 'Cassiopeia',
                stars: [
                    { x: 0.0, y: 0.8, z: 0.0, size: 120, color: [1.0, 0.9, 0.7] },  // Schedar
                    { x: 0.2, y: 0.9, z: 0.0, size: 115, color: [0.9, 0.9, 1.0] },  // Caph
                    { x: -0.2, y: 0.7, z: 0.0, size: 110, color: [1.0, 0.95, 0.8] }, // Gamma Cas
                    { x: -0.4, y: 0.6, z: 0.0, size: 105, color: [1.0, 1.0, 0.9] }, // Delta Cas
                    { x: -0.6, y: 0.7, z: 0.0, size: 110, color: [0.95, 0.95, 1.0] } // Epsilon Cas
                ]
            },
            {
                name: 'Scorpius',
                stars: [
                    { x: 0.0, y: 0.4, z: 0.0, size: 135, color: [1.0, 0.8, 0.7] },  // Antares
                    { x: 0.2, y: 0.5, z: 0.0, size: 110, color: [0.9, 0.9, 1.0] },  // Graffias
                    { x: -0.2, y: 0.3, z: 0.0, size: 115, color: [1.0, 0.95, 0.8] }, // Dschubba
                    { x: -0.3, y: 0.2, z: 0.0, size: 105, color: [1.0, 1.0, 0.9] }, // Pi Sco
                    { x: -0.4, y: 0.1, z: 0.0, size: 110, color: [0.95, 0.95, 1.0] }, // Rho Sco
                    { x: -0.5, y: 0.0, z: 0.0, size: 108, color: [1.0, 0.9, 0.8] },  // Shaula
                    { x: -0.45, y: -0.1, z: 0.0, size: 106, color: [0.9, 0.95, 1.0] } // Lesath
                ]
            },
            {
                name: 'Cygnus',
                stars: [
                    { x: 0.0, y: 0.6, z: 0.0, size: 125, color: [1.0, 0.95, 0.8] }, // Deneb
                    { x: -0.2, y: 0.4, z: 0.0, size: 115, color: [0.9, 0.9, 1.0] }, // Sadr
                    { x: -0.4, y: 0.2, z: 0.0, size: 110, color: [1.0, 1.0, 0.9] }, // Left wing
                    { x: 0.4, y: 0.2, z: 0.0, size: 110, color: [1.0, 0.9, 0.8] },  // Right wing
                    { x: 0.0, y: 0.0, z: 0.0, size: 120, color: [0.95, 0.95, 1.0] }  // Albireo
                ]
            }
        ];
        
        let currentStar = 0;
        
        // Create constellation stars
        constellations.forEach(constellation => {
            constellation.stars.forEach(star => {
                const i3 = currentStar * 3;
                const radius = 5000;
                
                starPositions[i3] = star.x * radius;
                starPositions[i3 + 1] = (star.y + 0.2) * radius;
                starPositions[i3 + 2] = star.z * radius;
                
                starColors[i3] = star.color[0];
                starColors[i3 + 1] = star.color[1];
                starColors[i3 + 2] = star.color[2];
                
                starSizes[currentStar] = star.size;
                currentStar++;
            });
        });
        
        // Fill remaining stars
        for (let i = currentStar; i < starCount; i++) {
            const i3 = i * 3;
            const radius = 5000;
            
            // Create more clustered star distribution
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.pow(Math.random(), 0.5)); // Clustered towards zenith
            
            starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            starPositions[i3 + 1] = radius * Math.cos(phi);
            starPositions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            
            // Simplified color palette for clearer stars
            if (Math.random() < 0.7) {
                // White/blue-white stars (majority)
                const temp = 0.95 + Math.random() * 0.05;
                starColors[i3] = temp;
                starColors[i3 + 1] = temp;
                starColors[i3 + 2] = 1.0;
            } else if (Math.random() < 0.85) {
                // Yellow stars
                starColors[i3] = 1.0;
                starColors[i3 + 1] = 0.95;
                starColors[i3 + 2] = 0.8;
            } else {
                // Red stars
                starColors[i3] = 1.0;
                starColors[i3 + 1] = 0.8;
                starColors[i3 + 2] = 0.8;
            }
            
            // More varied star sizes
            starSizes[i] = 120 + Math.pow(Math.random(), 2) * 100;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
        
        const starMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                opacity: { value: 1.0 }
            },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                varying float vDistance;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vDistance = -mvPosition.z;
                    float twinkle = sin(time * 1.5 + position.x * 0.5) * 0.5 + 0.5;
                    gl_PointSize = size * (1000.0 / -mvPosition.z) * (0.98 + twinkle * 0.04);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vDistance;
                uniform float opacity;
                
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    
                    // Multi-layer star rendering
                    float intensity = 0.0;
                    
                    // Sharp core
                    intensity += pow(1.0 - dist * 1.2, 20.0);
                    
                    // Bright center
                    intensity += pow(1.0 - dist, 40.0) * 0.5;
                    
                    // Outer glow
                    intensity += pow(1.0 - dist * 1.8, 4.0) * 0.2;
                    
                    // Distance-based intensity adjustment
                    float distanceFactor = clamp(vDistance / 5000.0, 0.0, 1.0);
                    intensity *= mix(0.5, 1.0, distanceFactor);
                    
                    gl_FragColor = vec4(vColor, opacity * intensity);
                }
            `,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false
        });
        
        this.starField = new THREE.Points(starGeometry, starMaterial);
        this.starField.renderOrder = 999;
        this.scene.add(this.starField);
        
        // Initialize shooting stars
        this.shootingStars = [];
        this.lastShootingStarTime = 0;
        
        // Start the star animation loop
        this.animateStars();
    }
    
    animateStars() {
        const animate = () => {
            if (!this.starField) return;
            
            // Update star twinkle
            const time = Date.now() * 0.001;
            this.starField.material.uniforms.time.value = time;
            
            // Create shooting stars randomly
            if (time - this.lastShootingStarTime > 2.0 && Math.random() < 0.1) {
                this.createShootingStar();
                this.lastShootingStarTime = time;
            }
            
            // Update shooting stars
            this.shootingStars = this.shootingStars.filter(star => {
                const elapsed = (time - star.startTime) / star.duration;
                if (elapsed >= 1) {
                    this.scene.remove(star.mesh);
                    return false;
                }
                
                // Update shooting star position
                const t = elapsed * elapsed; // Quadratic easing
                star.mesh.position.copy(star.startPos).lerp(star.endPos, t);
                star.mesh.material.opacity = Math.sin(elapsed * Math.PI);
                return true;
            });
            
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    createShootingStar() {
        // Create random start and end positions in the sky dome
        const startTheta = Math.random() * Math.PI * 2;
        const startPhi = Math.random() * Math.PI * 0.3;
        const endTheta = startTheta + (Math.random() * 0.5 - 0.25);
        const endPhi = startPhi + Math.random() * 0.2;
        
        const radius = 5000;  // Updated from 3000 to 5000
        const startPos = new THREE.Vector3(
            radius * Math.sin(startPhi) * Math.cos(startTheta),
            radius * Math.cos(startPhi),
            radius * Math.sin(startPhi) * Math.sin(startTheta)
        );
        const endPos = new THREE.Vector3(
            radius * Math.sin(endPhi) * Math.cos(endTheta),
            radius * Math.cos(endPhi),
            radius * Math.sin(endPhi) * Math.sin(endTheta)
        );
        
        // Create the shooting star trail with enhanced visibility
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
            linewidth: 2 // Note: This may not work on all systems due to WebGL limitations
        });
        
        const points = [startPos, endPos];
        geometry.setFromPoints(points);
        
        const mesh = new THREE.Line(geometry, material);
        mesh.renderOrder = 999; // Ensure shooting stars render last
        this.scene.add(mesh);
        
        this.shootingStars.push({
            mesh,
            startPos,
            endPos,
            startTime: Date.now() * 0.001,
            duration: 1.0 + Math.random() * 0.5
        });
    }

    setTimeZone(timeZone) {
        this.timeZone = timeZone;
        this.updateTime();
    }

    setTimeScale(scale) {
        this.timeScale = scale;
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    updateTime() {
        if (this.isPaused) return;

        // Update time
        if (this.isTestMode && this.testTime) {
            this.currentTime = new Date(this.testTime);
        } else {
            const deltaMs = (1000 / 60) * this.timeScale;
            this.currentTime = new Date(this.currentTime.getTime() + deltaMs);
        }

        // Get time of day (0-24)
        const timeOfDay = this.getTimeOfDay();

        // Update sky parameters based on time of day
        if (timeOfDay >= 5 && timeOfDay < 7) {
            // Dawn
            const progress = (timeOfDay - 5) / 2;
            this.skyParams.turbidity = 8 + progress * 2;
            this.skyParams.rayleigh = 2 + progress * 1.5;
            this.skyParams.mieCoefficient = 0.002 + progress * 0.008;
            this.skyParams.elevation = -20 + (progress * 32);
        } else if (timeOfDay >= 7 && timeOfDay < 17) {
            // Day
            const noonProgress = Math.sin((timeOfDay - 7) / 10 * Math.PI);
            this.skyParams.turbidity = 10;
            this.skyParams.rayleigh = 3.5;
            this.skyParams.mieCoefficient = 0.01;
            this.skyParams.elevation = 12 + noonProgress * 20;
        } else if (timeOfDay >= 17 && timeOfDay < 19) {
            // Dusk
            const progress = (timeOfDay - 17) / 2;
            this.skyParams.turbidity = 10 - progress * 2;
            this.skyParams.rayleigh = 3.5 - progress * 1.5;
            this.skyParams.mieCoefficient = 0.01 + progress * 0.01;
            this.skyParams.elevation = 12 - (progress * 32);
        } else {
            // Night (19:00 - 5:00)
            this.skyParams.turbidity = 8;
            this.skyParams.rayleigh = 2;
            this.skyParams.mieCoefficient = 0.002;
            this.skyParams.elevation = -20;
        }

        // Apply updated parameters
        this.skyUniforms.turbidity.value = this.skyParams.turbidity;
        this.skyUniforms.rayleigh.value = this.skyParams.rayleigh;
        this.skyUniforms.mieCoefficient.value = this.skyParams.mieCoefficient;
        this.skyUniforms.mieDirectionalG.value = this.skyParams.mieDirectionalG;
        this.skyUniforms.sunPosition.value.copy(this.sunPosition);
    }

    toggleTestMode() {
        this.isTestMode = !this.isTestMode;
        if (this.isTestMode) {
            // Force night time (e.g., 1 AM)
            this.testTime = new Date();
            this.testTime.setHours(1, 0, 0, 0);
        } else {
            this.testTime = null;
        }
        console.log(`Test mode ${this.isTestMode ? 'enabled' : 'disabled'}, current time: ${this.getCurrentTimeString()}`);
    }

    getCurrentTime() {
        return new Date(this.currentTime);
    }

    getTimeOfDay() {
        const hours = this.currentTime.getHours();
        const minutes = this.currentTime.getMinutes();
        return hours + minutes / 60;
    }

    getCurrentTimeString() {
        return this.currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: this.timeZone
        });
    }

    // For future Mapbox integration
    setLocation(latitude, longitude) {
        // This will be implemented when Mapbox integration is added
        console.log('Location set:', { latitude, longitude });
    }
} 