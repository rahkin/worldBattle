import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

export class TimeSystem {
    constructor(scene) {
        this.scene = scene;
        this.time = 6; // Start at sunrise (6 AM)
        this.timeScale = 1.0;
        this.latitude = 0;
        this.longitude = 0;
        this.currentTime = new Date(); // This will automatically use local time
        this.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Get local timezone
        this.isPaused = false;
        this.isTestMode = false;
        this.testTime = null;
        
        // Lighting setup with enhanced parameters
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Increased ambient intensity
        this.sunLight = new THREE.DirectionalLight(0xffffff, 2.0); // Increased sun intensity
        this.moonLight = new THREE.DirectionalLight(0x7f7fff, 0.8); // Increased moon intensity
        
        // Configure lights with enhanced shadow parameters
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.1;
        this.sunLight.shadow.camera.far = 2000; // Increased far plane
        this.sunLight.shadow.camera.left = -1000;
        this.sunLight.shadow.camera.right = 1000;
        this.sunLight.shadow.camera.top = 1000;
        this.sunLight.shadow.camera.bottom = -1000;
        this.sunLight.shadow.bias = -0.001;
        
        this.moonLight.castShadow = true;
        this.moonLight.shadow.mapSize.width = 1024;
        this.moonLight.shadow.mapSize.height = 1024;
        this.moonLight.shadow.camera.near = 0.1;
        this.moonLight.shadow.camera.far = 2000; // Increased far plane
        this.moonLight.shadow.camera.left = -1000;
        this.moonLight.shadow.camera.right = 1000;
        this.moonLight.shadow.camera.top = 1000;
        this.moonLight.shadow.camera.bottom = -1000;
        this.moonLight.shadow.bias = -0.001;

        // Add hemisphere light for better ambient illumination
        this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0); // Increased hemisphere intensity
        this.scene.add(this.hemisphereLight);
        
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
        // Create sky instance
        this.sky = new Sky();
        this.sky.scale.setScalar(450000);
        this.scene.add(this.sky);

        // Set initial sky parameters
        this.updateSkyParameters();
    }

    updateSkyParameters() {
        const timeOfDay = this.getTimeOfDay();
        const sunPosition = this.calculateSunPosition();
        
        // Update sun position
        this.sky.material.uniforms.sunPosition.value.copy(sunPosition);
        
        // Calculate star visibility based on time of day
        let starOpacity = 0;
        if (timeOfDay >= 19 || timeOfDay < 5) {
            // Full night - stars fully visible
            starOpacity = 1.0;
        } else if (timeOfDay >= 5 && timeOfDay < 7) {
            // Dawn - stars fade out
            starOpacity = 1.0 - ((timeOfDay - 5) / 2);
        } else if (timeOfDay >= 17 && timeOfDay < 19) {
            // Dusk - stars fade in
            starOpacity = (timeOfDay - 17) / 2;
        }
        // Day (7-17) - stars invisible (opacity remains 0)
        
        // Update star field opacity
        if (this.starField) {
            this.starField.material.uniforms.opacity.value = starOpacity;
        }
        
        // Set sky parameters based on time of day
        if (timeOfDay >= 5 && timeOfDay < 7) {
            // Dawn (5-7 AM)
            const progress = (timeOfDay - 5) / 2;
            this.sky.material.uniforms.turbidity.value = 5 + progress * 5;
            this.sky.material.uniforms.rayleigh.value = 1 + progress * 2;
            this.sky.material.uniforms.mieCoefficient.value = 0.001 + progress * 0.009;
            this.sky.material.uniforms.mieDirectionalG.value = 0.7 + progress * 0.2;
        } else if (timeOfDay >= 7 && timeOfDay < 17) {
            // Day (7 AM - 5 PM)
            this.sky.material.uniforms.turbidity.value = 2;
            this.sky.material.uniforms.rayleigh.value = 1;
            this.sky.material.uniforms.mieCoefficient.value = 0.005;
            this.sky.material.uniforms.mieDirectionalG.value = 0.8;
        } else if (timeOfDay >= 17 && timeOfDay < 19) {
            // Dusk (5-7 PM)
            const progress = (timeOfDay - 17) / 2;
            this.sky.material.uniforms.turbidity.value = 15 - progress * 5;
            this.sky.material.uniforms.rayleigh.value = 3 - progress * 2;
            this.sky.material.uniforms.mieCoefficient.value = 0.01 + progress * 0.01;
            this.sky.material.uniforms.mieDirectionalG.value = 0.7 + progress * 0.2;
        } else {
            // Night (7 PM - 5 AM)
            this.sky.material.uniforms.turbidity.value = 20;
            this.sky.material.uniforms.rayleigh.value = 4;
            this.sky.material.uniforms.mieCoefficient.value = 0.015;
            this.sky.material.uniforms.mieDirectionalG.value = 0.6;
        }

        // Update lighting
        this.updateLighting(sunPosition);
    }

    calculateSunPosition() {
        const phi = THREE.MathUtils.degToRad(90 - this.latitude);
        const theta = THREE.MathUtils.degToRad(this.longitude + (this.time - 12) * 15); // 15 degrees per hour
        
        const sunPosition = new THREE.Vector3();
        sunPosition.setFromSphericalCoords(1, phi, theta);
        
        return sunPosition;
    }

    updateLighting(sunPosition) {
        // Update sun light
        this.sunLight.position.copy(sunPosition).multiplyScalar(2000); // Moved further out
        const sunIntensity = this.getSunIntensity();
        this.sunLight.intensity = sunIntensity * 2.0; // Increased base intensity
        this.sunLight.color.setHSL(0.1, 1, 0.5 + Math.max(0, sunPosition.y) * 0.5);

        // Update moon light
        const moonPosition = sunPosition.clone().negate().multiplyScalar(2000);
        this.moonLight.position.copy(moonPosition);
        this.moonLight.intensity = this.getMoonIntensity() * 1.0; // Increased moon intensity

        // Update hemisphere light based on time of day
        const timeOfDay = this.getTimeOfDay();
        if (timeOfDay >= 5 && timeOfDay < 7) {
            // Dawn
            this.hemisphereLight.intensity = 0.6 + (timeOfDay - 5) / 2 * 0.4;
        } else if (timeOfDay >= 7 && timeOfDay < 17) {
            // Day
            this.hemisphereLight.intensity = 1.0;
        } else if (timeOfDay >= 17 && timeOfDay < 19) {
            // Dusk
            this.hemisphereLight.intensity = 1.0 - (timeOfDay - 17) / 2 * 0.4;
        } else {
            // Night
            this.hemisphereLight.intensity = 0.5;
        }
    }

    getSunIntensity() {
        const sunPosition = this.calculateSunPosition();
        return Math.max(0.3, sunPosition.y) * 2.5; // Increased minimum and maximum intensity
    }

    getMoonIntensity() {
        const sunPosition = this.calculateSunPosition();
        return Math.max(0.2, -sunPosition.y) * 1.0; // Increased minimum intensity for night
    }

    update() {
        this.time += this.timeScale * 0.0001;
        if (this.time >= 24) this.time -= 24;
        
        this.updateSkyParameters();
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
        // Only create shooting stars during night and twilight hours
        const timeOfDay = this.getTimeOfDay();
        if (timeOfDay >= 7 && timeOfDay < 17) {
            return; // Don't create shooting stars during full daylight
        }
        
        // Create random start and end positions in the sky dome
        const startTheta = Math.random() * Math.PI * 2;
        const startPhi = Math.random() * Math.PI * 0.3;
        const endTheta = startTheta + (Math.random() * 0.5 - 0.25);
        const endPhi = startPhi + Math.random() * 0.2;
        
        const radius = 5000;
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
            linewidth: 2
        });
        
        const points = [startPos, endPos];
        geometry.setFromPoints(points);
        
        const mesh = new THREE.Line(geometry, material);
        mesh.renderOrder = 999;
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

        // Update time to current system time
        if (this.isTestMode && this.testTime) {
            this.currentTime = new Date(this.testTime);
        } else {
            this.currentTime = new Date(); // Use actual system time
        }

        // Get time of day (0-24)
        const timeOfDay = this.getTimeOfDay();

        // Calculate sun position based on time of day
        const sunAngle = (timeOfDay / 24) * Math.PI * 2; // Convert time to angle (0 to 2π)
        const sunElevation = Math.sin(sunAngle) * Math.PI / 2; // Elevation angle (-π/2 to π/2)
        const sunAzimuth = Math.PI; // Fixed azimuth for now (sun moves in a straight line)

        // Calculate sun position in 3D space
        const radius = 1000; // Distance from scene center
        this.sunPosition = new THREE.Vector3(
            radius * Math.cos(sunElevation) * Math.cos(sunAzimuth),
            radius * Math.sin(sunElevation),
            radius * Math.cos(sunElevation) * Math.sin(sunAzimuth)
        );

        // Update sky parameters based on time of day
        if (timeOfDay >= 5 && timeOfDay < 7) {
            // Dawn
            const progress = (timeOfDay - 5) / 2;
            this.sky.material.uniforms.turbidity.value = 5 + progress * 5; // Start with clearer atmosphere
            this.sky.material.uniforms.rayleigh.value = 1 + progress * 2; // Gradually increase Rayleigh scattering
            this.sky.material.uniforms.mieCoefficient.value = 0.001 + progress * 0.009; // Start with minimal Mie scattering
            this.sky.material.uniforms.mieDirectionalG.value = 0.7 + progress * 0.2; // Increase forward scattering
        } else if (timeOfDay >= 7 && timeOfDay < 17) {
            // Day
            const noonProgress = Math.sin((timeOfDay - 7) / 10 * Math.PI);
            this.sky.material.uniforms.turbidity.value = 10; // Standard daytime turbidity
            this.sky.material.uniforms.rayleigh.value = 3.5; // Strong Rayleigh scattering for blue sky
            this.sky.material.uniforms.mieCoefficient.value = 0.01; // Moderate Mie scattering
            this.sky.material.uniforms.mieDirectionalG.value = 0.9; // Strong forward scattering
        } else if (timeOfDay >= 17 && timeOfDay < 19) {
            // Dusk
            const progress = (timeOfDay - 17) / 2;
            this.sky.material.uniforms.turbidity.value = 10 - progress * 5; // Clearer atmosphere as night approaches
            this.sky.material.uniforms.rayleigh.value = 3.5 - progress * 2.5; // Reduce Rayleigh scattering
            this.sky.material.uniforms.mieCoefficient.value = 0.01 + progress * 0.01; // Increase Mie scattering for sunset colors
            this.sky.material.uniforms.mieDirectionalG.value = 0.9 - progress * 0.2; // Reduce forward scattering
        } else {
            // Night (19:00 - 5:00)
            this.sky.material.uniforms.turbidity.value = 5; // Clear night sky
            this.sky.material.uniforms.rayleigh.value = 1; // Minimal Rayleigh scattering
            this.sky.material.uniforms.mieCoefficient.value = 0.001; // Minimal Mie scattering
            this.sky.material.uniforms.mieDirectionalG.value = 0.7; // Reduced forward scattering
        }

        // Update sun light intensity based on time of day
        const sunIntensity = Math.max(0, Math.min(1, (timeOfDay - 5) / 2));
        this.sunLight.intensity = sunIntensity;
        this.moonLight.intensity = 1 - sunIntensity;

        // Update sun and moon light positions
        this.sunLight.position.copy(this.sunPosition);
        this.moonLight.position.copy(this.sunPosition).multiplyScalar(-1); // Moon opposite to sun

        // Update light colors based on time of day
        if (timeOfDay >= 5 && timeOfDay < 7) {
            // Dawn colors
            const progress = (timeOfDay - 5) / 2;
            this.sunLight.color.setRGB(1, 0.7 + progress * 0.3, 0.5 + progress * 0.5);
            this.moonLight.color.setRGB(0.5, 0.5, 1);
        } else if (timeOfDay >= 17 && timeOfDay < 19) {
            // Dusk colors
            const progress = (timeOfDay - 17) / 2;
            this.sunLight.color.setRGB(1, 0.7 - progress * 0.2, 0.5 - progress * 0.3);
            this.moonLight.color.setRGB(0.5, 0.5, 1);
        } else if (timeOfDay >= 7 && timeOfDay < 17) {
            // Day colors
            this.sunLight.color.setRGB(1, 1, 1);
            this.moonLight.color.setRGB(0.5, 0.5, 1);
        } else {
            // Night colors
            this.sunLight.color.setRGB(0.5, 0.5, 1);
            this.moonLight.color.setRGB(0.5, 0.5, 1);
        }
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