import { Component } from '../core/Component.js';
import * as THREE from 'three';

export class BuildingMaterialComponent extends Component {
    constructor() {
        super();
        this.materials = new Map();
        this.textures = new Map();
        this.wallMaterials = new Map();
        this.roofMaterials = new Map();
        this.windowMaterials = new Map();
        this.doorMaterials = new Map();
        this.decals = [];
        this.weathering = 0;
        this.damage = 0;
        this.illumination = 0;
    }

    init(properties) {
        this.weathering = properties.weathering || 0;
        this.damage = properties.damage || 0;
        this.illumination = properties.illumination || 0;

        if (properties.materials) {
            Object.entries(properties.materials).forEach(([name, material]) => {
                this.addMaterial(name, material);
            });
        }

        if (properties.textures) {
            Object.entries(properties.textures).forEach(([name, texture]) => {
                this.addTexture(name, texture);
            });
        }

        if (properties.wallMaterials) {
            Object.entries(properties.wallMaterials).forEach(([name, material]) => {
                this.addWallMaterial(name, material);
            });
        }

        if (properties.roofMaterials) {
            Object.entries(properties.roofMaterials).forEach(([name, material]) => {
                this.addRoofMaterial(name, material);
            });
        }

        if (properties.windowMaterials) {
            Object.entries(properties.windowMaterials).forEach(([name, material]) => {
                this.addWindowMaterial(name, material);
            });
        }

        if (properties.doorMaterials) {
            Object.entries(properties.doorMaterials).forEach(([name, material]) => {
                this.addDoorMaterial(name, material);
            });
        }

        if (properties.decals) {
            this.decals = properties.decals.map(decal => ({
                position: decal.position,
                size: decal.size,
                texture: decal.texture,
                rotation: decal.rotation || 0
            }));
        }
    }

    addMaterial(name, material) {
        this.materials.set(name, this._createMaterial(material));
    }

    addTexture(name, texture) {
        this.textures.set(name, this._createTexture(texture));
    }

    addWallMaterial(name, material) {
        this.wallMaterials.set(name, this._createMaterial(material));
    }

    addRoofMaterial(name, material) {
        this.roofMaterials.set(name, this._createMaterial(material));
    }

    addWindowMaterial(name, material) {
        this.windowMaterials.set(name, this._createMaterial(material));
    }

    addDoorMaterial(name, material) {
        this.doorMaterials.set(name, this._createMaterial(material));
    }

    addDecal(position, size, texture, rotation = 0) {
        this.decals.push({
            position,
            size,
            texture,
            rotation
        });
    }

    _createMaterial(materialDef) {
        const material = new THREE.MeshStandardMaterial({
            color: materialDef.color || 0xffffff,
            roughness: materialDef.roughness || 0.5,
            metalness: materialDef.metalness || 0.0,
            map: materialDef.texture ? this._createTexture(materialDef.texture) : null,
            normalMap: materialDef.normalMap ? this._createTexture(materialDef.normalMap) : null,
            bumpMap: materialDef.bumpMap ? this._createTexture(materialDef.bumpMap) : null,
            emissive: materialDef.emissive || 0x000000,
            emissiveIntensity: materialDef.emissiveIntensity || 0.0,
            transparent: materialDef.transparent || false,
            opacity: materialDef.opacity || 1.0
        });

        if (materialDef.wireframe) {
            material.wireframe = true;
        }

        return material;
    }

    _createTexture(textureDef) {
        if (typeof textureDef === 'string') {
            return new THREE.TextureLoader().load(textureDef);
        }

        const texture = new THREE.TextureLoader().load(textureDef.url);
        if (textureDef.repeat) {
            texture.repeat.set(textureDef.repeat.x, textureDef.repeat.y);
        }
        if (textureDef.wrapS) {
            texture.wrapS = textureDef.wrapS;
        }
        if (textureDef.wrapT) {
            texture.wrapT = textureDef.wrapT;
        }
        return texture;
    }

    applyWeathering(amount) {
        this.weathering = Math.min(1, Math.max(0, this.weathering + amount));
        this._updateMaterials();
    }

    applyDamage(amount) {
        this.damage = Math.min(1, Math.max(0, this.damage + amount));
        this._updateMaterials();
    }

    setIllumination(amount) {
        this.illumination = Math.min(1, Math.max(0, amount));
        this._updateMaterials();
    }

    _updateMaterials() {
        // Update all materials based on current state
        this.materials.forEach(material => {
            this._updateMaterial(material);
        });

        this.wallMaterials.forEach(material => {
            this._updateMaterial(material);
        });

        this.roofMaterials.forEach(material => {
            this._updateMaterial(material);
        });

        this.windowMaterials.forEach(material => {
            this._updateMaterial(material);
        });

        this.doorMaterials.forEach(material => {
            this._updateMaterial(material);
        });
    }

    _updateMaterial(material) {
        // Apply weathering effects
        if (this.weathering > 0) {
            material.roughness = Math.min(1, material.roughness + this.weathering * 0.2);
            material.color.r *= (1 - this.weathering * 0.1);
            material.color.g *= (1 - this.weathering * 0.1);
            material.color.b *= (1 - this.weathering * 0.1);
        }

        // Apply damage effects
        if (this.damage > 0) {
            material.roughness = Math.min(1, material.roughness + this.damage * 0.3);
            material.metalness = Math.max(0, material.metalness - this.damage * 0.2);
        }

        // Apply illumination effects
        if (this.illumination > 0) {
            material.emissiveIntensity = this.illumination;
        }
    }

    update(deltaTime) {
        // Update dynamic material properties
        this._updateMaterials();
    }

    dispose() {
        this.materials.forEach(material => material.dispose());
        this.textures.forEach(texture => texture.dispose());
        this.wallMaterials.forEach(material => material.dispose());
        this.roofMaterials.forEach(material => material.dispose());
        this.windowMaterials.forEach(material => material.dispose());
        this.doorMaterials.forEach(material => material.dispose());
        
        this.materials.clear();
        this.textures.clear();
        this.wallMaterials.clear();
        this.roofMaterials.clear();
        this.windowMaterials.clear();
        this.doorMaterials.clear();
        this.decals = [];
    }
} 