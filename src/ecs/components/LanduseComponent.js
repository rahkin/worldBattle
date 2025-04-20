import { Component } from '../core/Component.js';

export class LanduseComponent extends Component {
    constructor() {
        super();
        this.type = 'unknown';
        this.area = 0;
        this.density = 0;
        this.vegetation = [];
        this.buildings = [];
        this.isProtected = false;
        this.damage = 0;
        this.maxDamage = 100;
    }

    init(properties) {
        this.type = properties.landuse || 'unknown';
        this.area = properties.area || 0;
        this.density = properties.density || this._getDefaultDensity(this.type);
        this.isProtected = properties.protected || false;
        this.damage = 0;

        // Initialize vegetation if available
        if (properties.vegetation) {
            this.vegetation = properties.vegetation.map(plant => ({
                type: plant.type,
                position: plant.position,
                size: plant.size || 1,
                health: plant.health || 100
            }));
        }

        // Initialize buildings if available
        if (properties.buildings) {
            this.buildings = properties.buildings.map(building => ({
                type: building.type,
                position: building.position,
                size: building.size || 1
            }));
        }
    }

    addVegetation(type, position, size = 1) {
        this.vegetation.push({
            type,
            position,
            size,
            health: 100
        });
    }

    addBuilding(type, position, size = 1) {
        this.buildings.push({
            type,
            position,
            size
        });
    }

    takeDamage(amount) {
        this.damage = Math.min(this.maxDamage, this.damage + amount);
        
        // Update land use appearance based on damage
        const entity = this.getEntity();
        if (entity.hasComponent('Mesh')) {
            const mesh = entity.getComponent('Mesh').mesh;
            this._updateLanduseAppearance(mesh);
        }
        
        return this.damage >= this.maxDamage;
    }

    _updateLanduseAppearance(mesh) {
        const damageState = this.getDamageState();
        const material = mesh.material;
        
        switch (damageState) {
            case 'intact':
                material.color.setHex(this._getLanduseColor(this.type));
                break;
            case 'damaged':
                material.color.setHex(this._getDamagedColor(this.type));
                break;
            case 'severely_damaged':
                material.color.setHex(0x8B4513); // Brown for severely damaged
                break;
            case 'destroyed':
                material.color.setHex(0x696969); // Dark gray for destroyed
                break;
        }
    }

    getDamageState() {
        if (this.damage < this.maxDamage * 0.25) return 'intact';
        if (this.damage < this.maxDamage * 0.5) return 'damaged';
        if (this.damage < this.maxDamage * 0.75) return 'severely_damaged';
        return 'destroyed';
    }

    _getDefaultDensity(type) {
        const densities = {
            'residential': 0.8,
            'commercial': 0.9,
            'industrial': 0.7,
            'park': 0.3,
            'forest': 0.6,
            'grass': 0.4,
            'farmland': 0.5
        };
        return densities[type] || 0.5;
    }

    _getLanduseColor(type) {
        const colors = {
            'residential': 0x9E9E9E,
            'commercial': 0x607D8B,
            'industrial': 0x455A64,
            'park': 0x4CAF50,
            'forest': 0x2E7D32,
            'grass': 0x8BC34A,
            'farmland': 0x795548
        };
        return colors[type] || 0x9E9E9E;
    }

    _getDamagedColor(type) {
        const colors = {
            'residential': 0x757575,
            'commercial': 0x455A64,
            'industrial': 0x263238,
            'park': 0x388E3C,
            'forest': 0x1B5E20,
            'grass': 0x689F38,
            'farmland': 0x5D4037
        };
        return colors[type] || 0x757575;
    }

    update(deltaTime) {
        // Update vegetation health
        this.vegetation.forEach(plant => {
            if (plant.health < 100) {
                plant.health = Math.min(100, plant.health + deltaTime * 0.1);
            }
        });
    }

    dispose() {
        this.vegetation = [];
        this.buildings = [];
        this.damage = 0;
    }
} 