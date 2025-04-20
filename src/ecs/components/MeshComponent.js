import * as THREE from 'three';
import { Component } from '../core/Component.js';

export class MeshComponent extends Component {
    constructor(mesh) {
        super();
        this.mesh = mesh;
        this.visible = true;
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        this.scale = new THREE.Vector3(1, 1, 1);
    }

    init(entity) {
        super.init(entity);
        this.entity = entity;
        this.world = entity.world;
        console.log(`Initialized MeshComponent for entity ${entity.id}`);
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }

    setRotation(x, y, z) {
        this.rotation.set(x, y, z);
        if (this.mesh) {
            this.mesh.rotation.copy(this.rotation);
        }
    }

    setScale(x, y, z) {
        this.scale.set(x, y, z);
        if (this.mesh) {
            this.mesh.scale.copy(this.scale);
        }
    }

    setVisible(visible) {
        this.visible = visible;
        if (this.mesh) {
            this.mesh.visible = visible;
        }
    }

    updateTransform() {
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.copy(this.rotation);
            this.mesh.scale.copy(this.scale);
        }
    }

    cleanup() {
        super.cleanup();
        if (this.mesh) {
            if (this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            }
            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(m => m.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
        }
        this.mesh = null;
    }
} 