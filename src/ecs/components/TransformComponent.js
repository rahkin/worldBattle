import * as THREE from 'three';

export class TransformComponent {
    constructor(position = new THREE.Vector3(), rotation = new THREE.Quaternion(), scale = new THREE.Vector3(1, 1, 1)) {
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
        this.matrix = new THREE.Matrix4();
        this.matrixWorld = new THREE.Matrix4();
        this.needsUpdate = true;
    }

    updateMatrix() {
        this.matrix.compose(this.position, this.rotation, this.scale);
        this.needsUpdate = false;
    }

    updateMatrixWorld(parentMatrixWorld) {
        if (this.needsUpdate) {
            this.updateMatrix();
        }
        
        if (parentMatrixWorld) {
            this.matrixWorld.multiplyMatrices(parentMatrixWorld, this.matrix);
        } else {
            this.matrixWorld.copy(this.matrix);
        }
    }
} 