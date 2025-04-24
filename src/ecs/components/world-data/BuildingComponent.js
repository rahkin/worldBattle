import { Component } from '../../core/Component.js';

export class BuildingComponent extends Component {
    constructor() {
        super();
        this.footprint = []; // Array of {latitude, longitude} points
        this.height = 10;    // Default height in meters
        this.type = 'building'; // Type of building
        this.properties = {}; // Additional properties from OSM
        this.position = { latitude: 0, longitude: 0 }; // Center position
        this.mesh = null;    // THREE.js mesh
        this.physicsBody = null; // CANNON.js body
    }
} 