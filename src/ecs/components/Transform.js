import { Component } from '../core/Component.js';
import * as THREE from 'three';

export class Transform extends Component {
    constructor() {
        super();
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Quaternion();
        this.scale = new THREE.Vector3(1, 1, 1);
        this.matrix = new THREE.Matrix4();
        this.matrixWorld = new THREE.Matrix4();
        this.matrixAutoUpdate = true;
        this.matrixWorldNeedsUpdate = false;
        this.parent = null;
        this.children = [];
    }

    updateMatrix() {
        this.matrix.compose(this.position, this.rotation, this.scale);
        this.matrixWorldNeedsUpdate = true;
    }

    updateMatrixWorld(force = false) {
        if (this.matrixAutoUpdate) this.updateMatrix();
        if (this.matrixWorldNeedsUpdate || force) {
            if (this.parent === null) {
                this.matrixWorld.copy(this.matrix);
            } else {
                this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
            }
            this.matrixWorldNeedsUpdate = false;
            force = true;
        }

        // Update children
        for (let i = 0, l = this.children.length; i < l; i++) {
            this.children[i].updateMatrixWorld(force);
        }
    }

    add(child) {
        if (child.parent !== null) {
            child.parent.remove(child);
        }
        child.parent = this;
        this.children.push(child);
        return this;
    }

    remove(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            child.parent = null;
            this.children.splice(index, 1);
        }
        return this;
    }

    getWorldPosition(target) {
        this.updateMatrixWorld(true);
        return target.setFromMatrixPosition(this.matrixWorld);
    }

    getWorldQuaternion(target) {
        this.updateMatrixWorld(true);
        return target.setFromRotationMatrix(this.matrixWorld);
    }

    getWorldScale(target) {
        this.updateMatrixWorld(true);
        return target.setFromMatrixScale(this.matrixWorld);
    }

    lookAt(target) {
        const m1 = new THREE.Matrix4();
        m1.lookAt(this.position, target, new THREE.Vector3(0, 1, 0));
        this.rotation.setFromRotationMatrix(m1);
    }

    copy(source) {
        this.position.copy(source.position);
        this.rotation.copy(source.rotation);
        this.scale.copy(source.scale);
        this.matrix.copy(source.matrix);
        this.matrixWorld.copy(source.matrixWorld);
        this.matrixAutoUpdate = source.matrixAutoUpdate;
        this.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;
        return this;
    }

    clone() {
        return new Transform().copy(this);
    }
} 