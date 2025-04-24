import { Component } from '../../core/Component.js';

export class RoadComponent extends Component {
    constructor() {
        super();
        this.path = [];      // Array of {latitude, longitude} points
        this.width = 5;      // Default width in meters
        this.type = 'road';  // Type of road (highway, primary, secondary, etc.)
        this.properties = {}; // Additional properties from OSM
        this.mesh = null;    // THREE.js mesh
        this.physicsBody = null; // CANNON.js body
    }
} 