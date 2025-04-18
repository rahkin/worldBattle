import { Component } from '../Component.js';
import * as THREE from 'three';

export class WaterComponent extends Component {
    constructor() {
        super();
        this.type = 'unknown';
        this.depth = 0;
        this.waveHeight = 0;
        this.waveSpeed = 0;
        this.waveLength = 0;
        this.flowDirection = new THREE.Vector2(0, 0);
        this.flowSpeed = 0;
        this.isPolluted = false;
        this.pollutionLevel = 0;
        this.maxPollution = 100;
    }

    init(properties) {
        this.type = properties.water || 'unknown';
        this.depth = properties.depth || this._getDefaultDepth(this.type);
        this.waveHeight = properties.waveHeight || this._getDefaultWaveHeight(this.type);
        this.waveSpeed = properties.waveSpeed || this._getDefaultWaveSpeed(this.type);
        this.waveLength = properties.waveLength || this._getDefaultWaveLength(this.type);
        this.flowSpeed = properties.flowSpeed || this._getDefaultFlowSpeed(this.type);
        
        if (properties.flowDirection) {
            this.flowDirection.set(properties.flowDirection.x, properties.flowDirection.y);
        }

        this.isPolluted = properties.polluted || false;
        this.pollutionLevel = properties.pollutionLevel || 0;
    }

    update(deltaTime) {
        // Update water animation
        const entity = this.getEntity();
        if (entity.hasComponent('Mesh')) {
            const mesh = entity.getComponent('Mesh').mesh;
            this._updateWaterAnimation(mesh, deltaTime);
        }
    }

    _updateWaterAnimation(mesh, deltaTime) {
        const material = mesh.material;
        const time = Date.now() * 0.001; // Convert to seconds

        // Update wave animation
        if (material.uniforms) {
            material.uniforms.time.value = time;
            material.uniforms.waveHeight.value = this.waveHeight;
            material.uniforms.waveSpeed.value = this.waveSpeed;
            material.uniforms.waveLength.value = this.waveLength;
        }

        // Update pollution appearance
        if (this.isPolluted) {
            const pollutionFactor = this.pollutionLevel / this.maxPollution;
            material.opacity = 1 - pollutionFactor * 0.5;
            material.color.setHex(this._getPollutedColor(this.type, pollutionFactor));
        }
    }

    addPollution(amount) {
        this.pollutionLevel = Math.min(this.maxPollution, this.pollutionLevel + amount);
        this.isPolluted = this.pollutionLevel > 0;
        
        // Update water appearance
        const entity = this.getEntity();
        if (entity.hasComponent('Mesh')) {
            const mesh = entity.getComponent('Mesh').mesh;
            this._updateWaterAppearance(mesh);
        }
    }

    _updateWaterAppearance(mesh) {
        const material = mesh.material;
        const pollutionFactor = this.pollutionLevel / this.maxPollution;
        
        material.opacity = 1 - pollutionFactor * 0.5;
        material.color.setHex(this._getPollutedColor(this.type, pollutionFactor));
    }

    _getDefaultDepth(type) {
        const depths = {
            'ocean': 1000,
            'sea': 200,
            'lake': 50,
            'river': 10,
            'pond': 5,
            'stream': 2
        };
        return depths[type] || 10;
    }

    _getDefaultWaveHeight(type) {
        const heights = {
            'ocean': 2.0,
            'sea': 1.0,
            'lake': 0.5,
            'river': 0.2,
            'pond': 0.1,
            'stream': 0.05
        };
        return heights[type] || 0.1;
    }

    _getDefaultWaveSpeed(type) {
        const speeds = {
            'ocean': 1.0,
            'sea': 0.8,
            'lake': 0.5,
            'river': 0.3,
            'pond': 0.2,
            'stream': 0.1
        };
        return speeds[type] || 0.2;
    }

    _getDefaultWaveLength(type) {
        const lengths = {
            'ocean': 20,
            'sea': 15,
            'lake': 10,
            'river': 5,
            'pond': 3,
            'stream': 2
        };
        return lengths[type] || 5;
    }

    _getDefaultFlowSpeed(type) {
        const speeds = {
            'ocean': 0.5,
            'sea': 0.3,
            'lake': 0.1,
            'river': 1.0,
            'pond': 0.05,
            'stream': 0.8
        };
        return speeds[type] || 0.1;
    }

    _getPollutedColor(type, pollutionFactor) {
        const baseColors = {
            'ocean': 0x0077be,
            'sea': 0x0088cc,
            'lake': 0x0099dd,
            'river': 0x00aaff,
            'pond': 0x00bbff,
            'stream': 0x00ccff
        };

        const pollutedColors = {
            'ocean': 0x004466,
            'sea': 0x005577,
            'lake': 0x006688,
            'river': 0x007799,
            'pond': 0x0088aa,
            'stream': 0x0099bb
        };

        const baseColor = baseColors[type] || 0x0077be;
        const pollutedColor = pollutedColors[type] || 0x004466;

        return this._lerpColor(baseColor, pollutedColor, pollutionFactor);
    }

    _lerpColor(color1, color2, factor) {
        const r1 = (color1 >> 16) & 0xff;
        const g1 = (color1 >> 8) & 0xff;
        const b1 = color1 & 0xff;

        const r2 = (color2 >> 16) & 0xff;
        const g2 = (color2 >> 8) & 0xff;
        const b2 = color2 & 0xff;

        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);

        return (r << 16) | (g << 8) | b;
    }

    dispose() {
        this.flowDirection.set(0, 0);
        this.isPolluted = false;
        this.pollutionLevel = 0;
    }
} 