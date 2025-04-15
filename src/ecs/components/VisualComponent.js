import * as THREE from 'three';

export class VisualComponent {
    constructor(mesh) {
        this.mesh = mesh;
        this.originalMaterial = mesh.material.clone();
        this.activeMaterial = null;
        this.visible = true;
    }

    setVisible(visible) {
        this.visible = visible;
        this.mesh.visible = visible;
    }

    setMaterial(material) {
        this.mesh.material = material;
    }

    resetMaterial() {
        this.mesh.material = this.originalMaterial;
    }

    setActiveMaterial(material) {
        this.activeMaterial = material;
        this.setMaterial(material);
    }

    updatePosition(position) {
        this.mesh.position.copy(position);
    }

    updateRotation(rotation) {
        this.mesh.quaternion.copy(rotation);
    }

    updateScale(scale) {
        this.mesh.scale.copy(scale);
    }
} 