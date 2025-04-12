import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

export class DebugManager {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.debugger = null;
        this.isEnabled = false;

        // Add keyboard listener for debug toggle
        document.addEventListener('keydown', (event) => {
            if (event.code === 'KeyP') { // 'P' for physics debug
                this.toggleDebug();
            }
        });
    }

    init() {
        this.debugger = new CannonDebugger(this.scene, this.world, {
            // Debugger options
            color: 0xff0000, // Red color for physics bodies
            scale: 1, // Scale of the debug wireframes
            onInit: (body, mesh) => {
                // Custom initialization for debug meshes
                mesh.visible = this.isEnabled;
            }
        });
    }

    toggleDebug() {
        this.isEnabled = !this.isEnabled;
        
        // Toggle visibility of all debug meshes
        this.scene.traverse((object) => {
            if (object.userData && object.userData.isCannonDebugMesh) {
                object.visible = this.isEnabled;
            }
        });

        console.log(`Physics debug ${this.isEnabled ? 'enabled' : 'disabled'}`);
    }

    update() {
        if (this.isEnabled && this.debugger) {
            this.debugger.update();
        }
    }
} 