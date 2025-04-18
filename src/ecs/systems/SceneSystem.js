import { System } from '../core/System.js';
import { MeshComponent } from '../components/MeshComponent.js';

export class SceneSystem extends System {
    constructor(scene) {
        super();
        this.requiredComponents = [MeshComponent];
        this.scene = scene;
        this.meshes = new Map();
    }

    getScene() {
        return this.scene;
    }

    addToScene(entity) {
        const meshComponent = entity.getComponent(MeshComponent);
        if (meshComponent && meshComponent.mesh) {
            this.scene.add(meshComponent.mesh);
            this.meshes.set(entity.id, meshComponent);
        }
    }

    removeFromScene(entity) {
        const meshComponent = entity.getComponent(MeshComponent);
        if (meshComponent && meshComponent.mesh) {
            this.scene.remove(meshComponent.mesh);
            this.meshes.delete(entity.id);
        }
    }

    clearScene() {
        console.log('Clearing all objects from scene...');
        
        // Remove and dispose of all managed meshes
        for (const meshComponent of this.meshes.values()) {
            if (meshComponent.mesh) {
                this.scene.remove(meshComponent.mesh);
                if (meshComponent.mesh.geometry) meshComponent.mesh.geometry.dispose();
                if (meshComponent.mesh.material) {
                    if (Array.isArray(meshComponent.mesh.material)) {
                        meshComponent.mesh.material.forEach(material => material.dispose());
                    } else {
                        meshComponent.mesh.material.dispose();
                    }
                }
            }
        }
        this.meshes.clear();

        // Remove any remaining objects from the scene
        while(this.scene.children.length > 0) { 
            const object = this.scene.children[0];
            this.scene.remove(object);
            
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        }

        console.log('Scene cleared');
    }

    update(deltaTime) {
        // Update all mesh transforms
        for (const [entityId, meshComponent] of this.meshes) {
            const entity = this.world.getEntity(entityId);
            if (entity) {
                meshComponent.updateTransform();
            }
        }
    }

    cleanup() {
        this.clearScene();
    }
} 