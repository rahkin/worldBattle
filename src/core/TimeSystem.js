import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

export class TimeSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentTime = new Date();
        this.timeScale = 1.0; // Real-time by default
        this.timeZone = 'UTC'; // Default timezone
        this.isPaused = false;
        
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
        
        // Headlights setup
        this.headlights = new Map(); // Will store vehicle headlights
    }

    initSky() {
        // Create Sky instance
        this.sky = new Sky();
        this.sky.scale.setScalar(450000);
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
        // Create main star field
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
                    { x: 0.0, y: 0.8, z: 0.0, size: 120, color: [1.0, 0.95, 0.8] }, // Dubhe
                    { x: 0.2, y: 0.75, z: 0.0, size: 110, color: [1.0, 0.9, 0.7] }, // Merak
                    { x: 0.4, y: 0.6, z: 0.0, size: 130, color: [0.9, 0.9, 1.0] },  // Phecda
                    { x: 0.6, y: 0.5, z: 0.0, size: 115, color: [1.0, 1.0, 0.9] },  // Megrez
                    { x: 0.8, y: 0.45, z: 0.0, size: 125, color: [1.0, 0.95, 0.8] }, // Alioth
                    { x: 1.0, y: 0.3, z: 0.0, size: 120, color: [0.95, 0.95, 1.0] }, // Mizar
                    { x: 1.2, y: 0.25, z: 0.0, size: 100, color: [1.0, 1.0, 0.9] }  // Alkaid
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
        
        // Create constellation stars with accurate patterns
        constellations.forEach(constellation => {
            constellation.stars.forEach(star => {
                const i3 = currentStar * 3;
                
                // Position stars in a dome pattern
                const baseRadius = 8000;
                starPositions[i3] = star.x * baseRadius;
                starPositions[i3 + 1] = (star.y + 0.2) * baseRadius; // Lift slightly higher in sky
                starPositions[i3 + 2] = star.z * baseRadius;
                
                // Apply star colors
                starColors[i3] = star.color[0];
                starColors[i3 + 1] = star.color[1];
                starColors[i3 + 2] = star.color[2];
                
                // Set star size
                starSizes[currentStar] = star.size;
                
                currentStar++;
            });
        });
        
        // Fill the rest with random stars
        for (let i = currentStar; i < starCount; i++) {
            const i3 = i * 3;
            
            // Create stars in a dome shape above the scene
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.5;
            const radius = 8000;
            
            starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            starPositions[i3 + 1] = radius * Math.cos(phi);
            starPositions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            
            // Vary star colors with more variety
            const colorChoice = Math.random();
            if (colorChoice < 0.2) {
                // Bluish-white stars
                starColors[i3] = 0.8;
                starColors[i3 + 1] = 0.9;
                starColors[i3 + 2] = 1.0;
            } else if (colorChoice < 0.4) {
                // Pure white stars
                starColors[i3] = 1.0;
                starColors[i3 + 1] = 1.0;
                starColors[i3 + 2] = 1.0;
            } else if (colorChoice < 0.6) {
                // Yellow stars
                starColors[i3] = 1.0;
                starColors[i3 + 1] = 0.9;
                starColors[i3 + 2] = 0.7;
            } else if (colorChoice < 0.8) {
                // Red stars
                starColors[i3] = 1.0;
                starColors[i3 + 1] = 0.8;
                starColors[i3 + 2] = 0.8;
            } else {
                // Blue stars
                starColors[i3] = 0.8;
                starColors[i3 + 1] = 0.8;
                starColors[i3 + 2] = 1.0;
            }
            
            // Smaller sizes for background stars
            starSizes[i] = 40.0 + Math.random() * 20.0;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
        
        // Create custom shader material for stars with enhanced visibility
        const starMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                opacity: { value: 1.0 } // Start with full opacity
            },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    float twinkle = sin(time * 2.0 + position.x * 0.5) * 0.5 + 0.5;
                    gl_PointSize = size * (300.0 / -mvPosition.z) * (0.8 + twinkle * 0.4);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                uniform float opacity;
                
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    float intensity = pow(1.0 - dist * 2.0, 2.0);
                    gl_FragColor = vec4(vColor, opacity * intensity);
                }
            `,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,  // Important: Ensures stars are visible in front of sky
            depthTest: false    // Important: Ensures stars are always rendered on top
        });
        
        this.starField = new THREE.Points(starGeometry, starMaterial);
        this.starField.renderOrder = 999; // Ensure stars render last
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
        
        const radius = 7500; // Adjusted distance
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
        if (!this.isPaused) {
            const now = new Date();
            const timeDiff = now - this.currentTime;
            this.currentTime = new Date(this.currentTime.getTime() + timeDiff * this.timeScale);
        }
        this.updateLighting();
    }

    updateLighting() {
        const hours = this.currentTime.getHours();
        const minutes = this.currentTime.getMinutes();
        const timeOfDay = hours + minutes / 60;
        
        // Calculate sun position with more realistic parameters
        const phi = THREE.MathUtils.degToRad(90 - ((timeOfDay / 24) * 360));
        const theta = THREE.MathUtils.degToRad(180);
        
        this.sunPosition.setFromSphericalCoords(1000, phi, theta);
        
        // Update sky parameters based on time of day
        if (timeOfDay >= 5 && timeOfDay < 7) {
            // Dawn
            const progress = (timeOfDay - 5) / 2;
            this.skyParams.turbidity = 6 + progress * 4; // Clearer at dawn
            this.skyParams.rayleigh = 2 + progress * 1.5; // More blue light scatter
            this.skyParams.mieCoefficient = 0.005 + progress * 0.005; // More sun glow
            this.skyParams.elevation = 2 + progress * 10; // Sun rising
        } else if (timeOfDay >= 7 && timeOfDay < 17) {
            // Day
            const noonProgress = Math.sin((timeOfDay - 7) / 10 * Math.PI);
            this.skyParams.turbidity = 10;
            this.skyParams.rayleigh = 3.5;
            this.skyParams.mieCoefficient = 0.01;
            this.skyParams.elevation = 12 + noonProgress * 20; // Max elevation at noon
        } else if (timeOfDay >= 17 && timeOfDay < 19) {
            // Dusk
            const progress = (timeOfDay - 17) / 2;
            this.skyParams.turbidity = 10 - progress * 2; // More particles at dusk
            this.skyParams.rayleigh = 3.5 - progress * 1.5; // More red light scatter
            this.skyParams.mieCoefficient = 0.01 + progress * 0.01; // More sun glow
            this.skyParams.elevation = 12 - progress * 10; // Sun setting
        } else {
            // Night
            this.skyParams.turbidity = 8;
            this.skyParams.rayleigh = 2;
            this.skyParams.mieCoefficient = 0.002;
            this.skyParams.elevation = 0;
        }

        // Apply updated parameters
        this.skyUniforms.turbidity.value = this.skyParams.turbidity;
        this.skyUniforms.rayleigh.value = this.skyParams.rayleigh;
        this.skyUniforms.mieCoefficient.value = this.skyParams.mieCoefficient;
        this.skyUniforms.mieDirectionalG.value = this.skyParams.mieDirectionalG;
        this.skyUniforms.sunPosition.value.copy(this.sunPosition);
        
        // Update directional lights with more realistic colors
        const sunColor = new THREE.Color();
        if (timeOfDay >= 5 && timeOfDay < 7) {
            // Dawn - warm orange
            sunColor.setHSL(0.07, 1, 0.5 + (timeOfDay - 5) / 4);
        } else if (timeOfDay >= 7 && timeOfDay < 17) {
            // Day - bright white
            sunColor.setHSL(0.12, 0.2, 0.8);
        } else if (timeOfDay >= 17 && timeOfDay < 19) {
            // Dusk - deep orange
            sunColor.setHSL(0.07, 1, 0.5 - (timeOfDay - 17) / 4);
        } else {
            // Night - slight blue tint
            sunColor.setHSL(0.6, 0.2, 0.1);
        }

        this.sunLight.color.copy(sunColor);
        this.moonLight.color.setHSL(0.6, 0.2, 0.2); // Subtle blue moonlight
        
        // Calculate intensities based on sun height
        const sunHeight = Math.sin(phi);
        const dayIntensity = Math.max(0, sunHeight);
        const nightIntensity = Math.max(0, -sunHeight);
        
        // Update light intensities with smoother transitions
        this.sunLight.intensity = dayIntensity * 1.2;
        this.moonLight.intensity = nightIntensity * 0.3;
        this.ambientLight.intensity = 0.2 + (dayIntensity * 0.4);
        
        // Update star visibility with smoother fade
        const starOpacity = Math.max(0, Math.min(1, 
            timeOfDay >= 19 ? (timeOfDay - 19) / 1 :
            timeOfDay < 5 ? 1 :
            timeOfDay < 7 ? 1 - ((timeOfDay - 5) / 2) : 0
        ));
        this.starField.material.uniforms.opacity.value = starOpacity;
        
        // Update headlights
        this.updateHeadlights(timeOfDay);
    }

    addHeadlight(vehicleId, headlight) {
        this.headlights.set(vehicleId, headlight);
    }

    removeHeadlight(vehicleId) {
        this.headlights.delete(vehicleId);
    }

    updateHeadlights(timeOfDay) {
        const isNight = timeOfDay >= 19 || timeOfDay < 5;
        const isDawnDusk = (timeOfDay >= 5 && timeOfDay < 7) || (timeOfDay >= 17 && timeOfDay < 19);
        
        for (const [vehicleId, headlight] of this.headlights) {
            if (isNight) {
                headlight.intensity = 1.0;
            } else if (isDawnDusk) {
                headlight.intensity = 0.5;
            } else {
                headlight.intensity = 0.0;
            }
        }
    }

    getCurrentTime() {
        return new Date(this.currentTime);
    }

    getTimeOfDay() {
        const hours = this.currentTime.getHours();
        const minutes = this.currentTime.getMinutes();
        return hours + minutes / 60;
    }

    // For future Mapbox integration
    setLocation(latitude, longitude) {
        // This will be implemented when Mapbox integration is added
        console.log('Location set:', { latitude, longitude });
    }
} 