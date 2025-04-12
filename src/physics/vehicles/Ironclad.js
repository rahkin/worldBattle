import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { BaseCar } from './BaseCar.js';

export class Ironclad extends BaseCar {
    constructor(world, scene) {
        const options = {
            width: 1.2,
            height: 0.6,
            length: 2.4,
            mass: 1500,  // Heavy armored vehicle, second heaviest after tank
            color: 0x8B4513,  // Brown color
            wheelRadius: 0.5,
            wheelWidth: 0.4,
            wheelFriction: 8,
            suspensionRestLength: 0.4,
            wheelBaseZ: 2.2,
            wheelTrackX: 1.2,
            chassisOffsetY: 0.5,
            chassisOffsetZ: 0,
            debug: false
        };
        super(world, scene, options);

        // Add armor plating visual
        this._addArmorPlating();
    }

    _addArmorPlating() {
        // Front armor
        const frontArmorGeo = new THREE.BoxGeometry(1.4, 0.3, 0.2);
        const frontArmorMat = new THREE.MeshPhongMaterial({
            color: 0x696969,
            metalness: 0.8,
            roughness: 0.3
        });
        this.frontArmor = new THREE.Mesh(frontArmorGeo, frontArmorMat);
        this.frontArmor.position.set(0, 0.3, -1.2);
        this.chassisMesh.add(this.frontArmor);

        // Side armor
        const sideArmorGeo = new THREE.BoxGeometry(0.2, 0.4, 2.2);
        const sideArmorMat = new THREE.MeshPhongMaterial({
            color: 0x696969,
            metalness: 0.8,
            roughness: 0.3
        });
        
        this.leftArmor = new THREE.Mesh(sideArmorGeo, sideArmorMat);
        this.leftArmor.position.set(-1.1, 0.2, 0);
        this.chassisMesh.add(this.leftArmor);

        this.rightArmor = new THREE.Mesh(sideArmorGeo, sideArmorMat);
        this.rightArmor.position.set(1.1, 0.2, 0);
        this.chassisMesh.add(this.rightArmor);
    }

    updateVisuals() {
        super.updateVisuals();
        // Update armor positions relative to chassis
        if (this.frontArmor && this.leftArmor && this.rightArmor) {
            this.frontArmor.position.set(0, 0.3, -1.2);
            this.leftArmor.position.set(-1.1, 0.2, 0);
            this.rightArmor.position.set(1.1, 0.2, 0);
        }
    }
} 