import * as THREE from 'three';

export class MeshComponent {
    constructor(mesh) {
        this.mesh = mesh;
        this.visible = true;
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        this.scale = new THREE.Vector3(1, 1, 1);
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
} 