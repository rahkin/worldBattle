import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { CapsuleGeometry, CylinderGeometry, MeshPhysicalMaterial } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export class VehicleGeometryFactory {
    // Post-processing setup helpers
    static setupPostProcessing(renderer, scene, camera) {
        const composer = new EffectComposer(renderer);
        
        // Standard render pass
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        // SSAO for better depth perception and ambient shadows
        const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
        ssaoPass.kernelRadius = 16;
        ssaoPass.minDistance = 0.005;
        ssaoPass.maxDistance = 0.1;
        composer.addPass(ssaoPass);

        // Bloom effect for glowing parts and better lighting
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.5,    // bloom strength
            0.4,    // radius
            0.85    // threshold
        );
        composer.addPass(bloomPass);

        // Final output pass
        const outputPass = new OutputPass();
        composer.addPass(outputPass);

        return composer;
    }

    // Material creation helpers
    static createCarPaintMaterial(color) {
        return new MeshPhysicalMaterial({
            color: color,
            metalness: 0.9,
            roughness: 0.2,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            reflectivity: 1.0
        });
    }

    static createGlassMaterial() {
        return new MeshPhysicalMaterial({
            color: 0x111111,
            metalness: 0.0,
            roughness: 0.0,
            transmission: 0.9,
            transparent: true,
            opacity: 0.3,
            envMapIntensity: 1.0
        });
    }

    static createMetalMaterial(color = 0x888888) {
        return new MeshPhysicalMaterial({
            color: color,
            metalness: 1.0,
            roughness: 0.4,
            envMapIntensity: 1.0
        });
    }

    static createMatteMetalMaterial(color = 0x444444) {
        return new MeshPhysicalMaterial({
            color: color,
            metalness: 0.8,
            roughness: 0.7
        });
    }

    static createSmoothChassis(width, height, length, radius = 0.1, segments = 2) {
        return new RoundedBoxGeometry(width, height, length, segments, radius);
    }

    static createSmoothCabin(width, height, length, radius = 0.1, segments = 2) {
        const cabinGeo = new RoundedBoxGeometry(width, height, length, segments, radius);
        cabinGeo.translate(0, height / 2, 0);  // Move cabin to sit on top of chassis
        return cabinGeo;
    }

    static createSmoothWheel(radius, width, segments = 32) {
        const wheelGeo = new CylinderGeometry(radius, radius, width, segments);
        wheelGeo.rotateZ(Math.PI / 2);  // Align for proper orientation
        return wheelGeo;
    }

    static createAerodynamicNose(width, height, length) {
        // Use CapsuleGeometry for a smoother nose
        const noseGeo = new CapsuleGeometry(height / 2, length, 8, 16);
        noseGeo.rotateZ(Math.PI / 2);  // Align horizontally
        return noseGeo;
    }

    static createSpoiler(width, height, length) {
        // Create a rounded spoiler
        return new RoundedBoxGeometry(width, height, length, 2, 0.02);
    }

    static createEngineScoop(radius, height) {
        const scoopGeo = new CylinderGeometry(radius, radius * 0.6, height, 32, 2, false);
        scoopGeo.rotateX(Math.PI / 2);  // Align horizontally
        return scoopGeo;
    }

    static createSmoothTurret(radius, height, segments = 32) {
        const turretGeo = new CylinderGeometry(radius, radius * 1.2, height, segments, 2);
        turretGeo.computeVertexNormals();
        return turretGeo;
    }

    static createSmoothBarrel(radius, length) {
        // Use CapsuleGeometry for a smoother barrel
        const barrelGeo = new CapsuleGeometry(radius, length, 8, 16);
        barrelGeo.rotateZ(Math.PI / 2);
        return barrelGeo;
    }

    static createHoverPad(width, height, length) {
        // Create a rounded hover pad
        return new RoundedBoxGeometry(width, height, length, 2, 0.05);
    }
} 