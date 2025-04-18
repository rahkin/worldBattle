import { Component } from '../core/Component.js';
import * as THREE from 'three';

export class WeaponComponent extends Component {
    constructor(config = {}) {
        super();
        this.type = config.type || 'machineGun';
        this.damage = config.damage || 10;
        this.fireRate = config.fireRate || 0.1; // seconds between shots
        this.range = config.range || 100;
        this.ammo = config.ammo || 100;
        this.maxAmmo = config.maxAmmo || 100;
        this.reloadTime = config.reloadTime || 2.0; // seconds
        this.isReloading = false;
        this.lastFireTime = 0;
        this.mesh = null;
        this.muzzleFlash = null;
        this.offset = config.offset || new THREE.Vector3(0, 0, 0);
    }

    createMesh() {
        const geometry = new THREE.BoxGeometry(0.2, 0.1, 0.5);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.2
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        return this.mesh;
    }

    createMuzzleFlash() {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff6600,
            transparent: true,
            opacity: 0.8
        });
        this.muzzleFlash = new THREE.Mesh(geometry, material);
        this.muzzleFlash.visible = false;
        return this.muzzleFlash;
    }

    canFire() {
        return !this.isReloading && 
               this.ammo > 0 && 
               (Date.now() - this.lastFireTime) / 1000 >= this.fireRate;
    }

    fire() {
        if (!this.canFire()) return false;
        
        this.ammo--;
        this.lastFireTime = Date.now();
        
        // Show muzzle flash
        if (this.muzzleFlash) {
            this.muzzleFlash.visible = true;
            setTimeout(() => {
                if (this.muzzleFlash) this.muzzleFlash.visible = false;
            }, 50);
        }
        
        return true;
    }

    reload() {
        if (this.isReloading || this.ammo === this.maxAmmo) return false;
        
        this.isReloading = true;
        setTimeout(() => {
            this.ammo = this.maxAmmo;
            this.isReloading = false;
        }, this.reloadTime * 1000);
        
        return true;
    }
} 