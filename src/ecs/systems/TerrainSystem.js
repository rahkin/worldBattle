import { System } from '../core/System.js';
import { TerrainComponent } from '../components/TerrainComponent.js';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class TerrainSystem extends System {
    constructor(scene, physicsWorld) {
        super();
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.terrainBodies = new Map();
        this.terrainMeshes = new Map();
        this.terrainSize = 100;
        this.terrainResolution = 50;
        this.terrainHeight = 0.1; // Match the ground plane height
        
        console.log('TerrainSystem constructed with:', {
            hasScene: !!this.scene,
            hasPhysicsWorld: !!this.physicsWorld
        });
    }

    init() {
        console.log('TerrainSystem initializing...');
        
        if (!this.scene || !this.physicsWorld) {
            throw new Error('TerrainSystem requires scene and physicsWorld');
        }

        // Initialize terrain for each entity with a TerrainComponent
        this.world.getEntitiesWithComponents(['TerrainComponent']).forEach(entity => {
            this.createTerrain(entity);
        });

        console.log('TerrainSystem initialized');
        return Promise.resolve();
    }

    createTerrain(entity) {
        const terrainComponent = entity.getComponent('TerrainComponent');
        
        // Create terrain shape
        const shape = new CANNON.Heightfield(
            this.generateHeightfieldData(terrainComponent),
            {
                elementSize: this.terrainSize / this.terrainResolution
            }
        );

        // Create terrain body
        const body = new CANNON.Body({
            mass: 0, // Static body
            material: this.physicsWorld.defaultMaterial,
            shape: shape,
            position: new CANNON.Vec3(0, this.terrainHeight, 0)
        });

        // Add body to physics world
        this.physicsWorld.addBody(body);
        this.terrainBodies.set(entity.id, body);

        // Create terrain mesh
        const geometry = new THREE.PlaneGeometry(
            this.terrainSize,
            this.terrainSize,
            this.terrainResolution,
            this.terrainResolution
        );

        // Apply heightmap to geometry
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            vertices[i + 1] = terrainComponent.getHeightAt(new THREE.Vector2(x, z));
        }

        geometry.computeVertexNormals();
        geometry.attributes.position.needsUpdate = true;

        const material = new THREE.MeshStandardMaterial({
            color: 0x3a7d44,
            roughness: 0.8,
            metalness: 0.2,
            flatShading: true
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;

        // Add mesh to scene
        this.scene.add(mesh);
        this.terrainMeshes.set(entity.id, mesh);
        
        console.log('Terrain created:', {
            entityId: entity.id,
            hasBody: !!body,
            hasMesh: !!mesh,
            position: body.position
        });
    }

    generateHeightfieldData(terrainComponent) {
        const data = [];
        const step = this.terrainSize / this.terrainResolution;

        for (let i = 0; i <= this.terrainResolution; i++) {
            const row = [];
            for (let j = 0; j <= this.terrainResolution; j++) {
                const x = -this.terrainSize / 2 + j * step;
                const z = -this.terrainSize / 2 + i * step;
                const height = terrainComponent.getHeightAt(new THREE.Vector2(x, z));
                row.push(height);
            }
            data.push(row);
        }

        return data;
    }

    update() {
        // Update terrain physics and rendering if needed
        this.getEntitiesWithComponents(['TerrainComponent']).forEach(entity => {
            const terrainComponent = entity.getComponent('TerrainComponent');
            const mesh = this.terrainMeshes.get(entity.id);
            
            if (mesh) {
                // Update mesh if terrain height changes
                const vertices = mesh.geometry.attributes.position.array;
                for (let i = 0; i < vertices.length; i += 3) {
                    const x = vertices[i];
                    const z = vertices[i + 2];
                    vertices[i + 1] = terrainComponent.getHeightAt(new THREE.Vector2(x, z));
                }
                
                mesh.geometry.computeVertexNormals();
                mesh.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    cleanup() {
        console.log('TerrainSystem cleaning up...');
        
        // Remove terrain bodies and meshes
        this.terrainBodies.forEach(body => {
            if (this.physicsWorld) {
                this.physicsWorld.removeBody(body);
            }
        });
        
        this.terrainMeshes.forEach(mesh => {
            if (this.scene) {
                this.scene.remove(mesh);
                if (mesh.geometry) mesh.geometry.dispose();
                if (mesh.material) mesh.material.dispose();
            }
        });
        
        this.terrainBodies.clear();
        this.terrainMeshes.clear();
        
        console.log('TerrainSystem cleanup complete');
    }
} 