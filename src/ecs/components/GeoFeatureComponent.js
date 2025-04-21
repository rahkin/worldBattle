import { Component } from './Component.js';

export class GeoFeatureComponent extends Component {
    constructor(type, properties = {}) {
        super();
        this.type = type;
        this.properties = properties;
    }

    getType() {
        return this.type;
    }

    getProperties() {
        return this.properties;
    }

    setProperty(key, value) {
        this.properties[key] = value;
    }

    getProperty(key) {
        return this.properties[key];
    }

    clone() {
        return new GeoFeatureComponent(this.type, { ...this.properties });
    }
} 