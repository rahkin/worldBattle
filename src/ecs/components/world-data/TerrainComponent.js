import { Component } from '../../core/Component.js';

export class TerrainComponent extends Component {
    constructor() {
        super();
        this.heightData = null;
        this.resolution = { x: 0, y: 0 };
        this.bounds = {
            north: 0,
            south: 0,
            east: 0,
            west: 0,
            width: 0,
            height: 0
        };
        this.mesh = null;
        this.physicsBody = null;
    }
} 