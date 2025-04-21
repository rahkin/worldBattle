import { Component } from './Component.js';

export class PositionComponent extends Component {
    constructor(x = 0, y = 0, z = 0) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
    }

    setPosition(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    getPosition() {
        return { x: this.x, y: this.y, z: this.z };
    }

    clone() {
        return new PositionComponent(this.x, this.y, this.z);
    }
} 