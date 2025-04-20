import { Component } from '../core/Component.js';

export class RoadComponent extends Component {
    constructor() {
        super();
        this.type = 'unknown';
        this.width = 1;
        this.lanes = 1;
        this.speedLimit = 50;
        this.isOneWay = false;
        this.intersections = [];
        this.trafficLights = [];
        this.connectedRoads = [];
        this.damage = 0;
        this.maxDamage = 100;
    }

    init(properties) {
        this.type = properties.highway || 'unknown';
        this.width = properties.width || this._getDefaultWidth(this.type);
        this.lanes = properties.lanes || this._getDefaultLanes(this.type);
        this.speedLimit = properties.maxspeed || this._getDefaultSpeedLimit(this.type);
        this.isOneWay = properties.oneway || false;
        this.damage = 0;
        
        // Initialize intersections if available
        if (properties.intersections) {
            this.intersections = properties.intersections.map(intersection => ({
                position: intersection.position,
                type: intersection.type || 'standard',
                trafficLight: intersection.trafficLight || false
            }));
        }
    }

    addTrafficLight(position, type = 'standard') {
        this.trafficLights.push({
            position,
            type,
            state: 'green',
            lastChange: Date.now()
        });
    }

    connectRoad(roadEntity) {
        if (!this.connectedRoads.includes(roadEntity)) {
            this.connectedRoads.push(roadEntity);
        }
    }

    takeDamage(amount) {
        this.damage = Math.min(this.maxDamage, this.damage + amount);
        
        // Update road appearance based on damage
        const entity = this.getEntity();
        if (entity.hasComponent('Mesh')) {
            const mesh = entity.getComponent('Mesh').mesh;
            this._updateRoadAppearance(mesh);
        }
        
        return this.damage >= this.maxDamage;
    }

    _updateRoadAppearance(mesh) {
        const damageState = this.getDamageState();
        const material = mesh.material;
        
        switch (damageState) {
            case 'intact':
                material.color.setHex(0x333333);
                break;
            case 'damaged':
                material.color.setHex(0x555555);
                break;
            case 'severely_damaged':
                material.color.setHex(0x777777);
                break;
            case 'destroyed':
                material.color.setHex(0x999999);
                break;
        }
    }

    getDamageState() {
        if (this.damage < this.maxDamage * 0.25) return 'intact';
        if (this.damage < this.maxDamage * 0.5) return 'damaged';
        if (this.damage < this.maxDamage * 0.75) return 'severely_damaged';
        return 'destroyed';
    }

    _getDefaultWidth(type) {
        const widths = {
            'motorway': 3.5,
            'trunk': 3.5,
            'primary': 3.0,
            'secondary': 2.75,
            'tertiary': 2.5,
            'residential': 2.0,
            'service': 1.5
        };
        return widths[type] || 2.0;
    }

    _getDefaultLanes(type) {
        const lanes = {
            'motorway': 3,
            'trunk': 2,
            'primary': 2,
            'secondary': 1,
            'tertiary': 1,
            'residential': 1,
            'service': 1
        };
        return lanes[type] || 1;
    }

    _getDefaultSpeedLimit(type) {
        const limits = {
            'motorway': 120,
            'trunk': 100,
            'primary': 80,
            'secondary': 60,
            'tertiary': 50,
            'residential': 30,
            'service': 20
        };
        return limits[type] || 50;
    }

    update(deltaTime) {
        // Update traffic lights
        this.trafficLights.forEach(light => {
            const timeSinceChange = Date.now() - light.lastChange;
            if (timeSinceChange > this._getTrafficLightDuration(light.state)) {
                light.state = this._getNextTrafficLightState(light.state);
                light.lastChange = Date.now();
            }
        });
    }

    _getTrafficLightDuration(state) {
        const durations = {
            'green': 30000,  // 30 seconds
            'yellow': 5000,  // 5 seconds
            'red': 25000     // 25 seconds
        };
        return durations[state] || 30000;
    }

    _getNextTrafficLightState(currentState) {
        const states = ['green', 'yellow', 'red'];
        const currentIndex = states.indexOf(currentState);
        return states[(currentIndex + 1) % states.length];
    }

    dispose() {
        this.intersections = [];
        this.trafficLights = [];
        this.connectedRoads = [];
        this.damage = 0;
    }
} 