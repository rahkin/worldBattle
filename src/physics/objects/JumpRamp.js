import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { VehicleGeometryFactory } from '../../utils/GeometryUtils.js';

export class JumpRamp {
    constructor(world, scene, options = {}) {
        this.world = world;
        this.scene = scene;
        
        // Default options
        this.options = {
            width: options.width || 4,           // Width of the ramp
            height: options.height || 2,         // Height at the highest point
            length: options.length || 6,         // Length of the ramp
            angle: options.angle || Math.PI / 6, // 30 degrees incline
            position: options.position || { x: 0, y: 0, z: 10 },
            color: options.color || 0x808080     // Gray color
        };

        this._createRamp();
    }

    _createRamp() {
        // Create the visual representation
        const rampShape = new THREE.Shape();
        
        // Define the ramp profile points
        rampShape.moveTo(0, 0);
        rampShape.lineTo(this.options.length, this.options.height);
        rampShape.lineTo(this.options.length, 0);
        rampShape.lineTo(0, 0);

        // Create extrusion settings
        const extrudeSettings = {
            steps: 1,
            depth: this.options.width,
            bevelEnabled: false
        };

        // Create the geometry
        const geometry = new THREE.ExtrudeGeometry(rampShape, extrudeSettings);
        geometry.rotateY(Math.PI / 2); // Rotate to align with Z axis

        // Create material with some grip texture
        const material = new THREE.MeshPhongMaterial({
            color: this.options.color,
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide
        });

        // Create the mesh
        this.rampMesh = new THREE.Mesh(geometry, material);
        this.rampMesh.position.set(
            this.options.position.x,
            this.options.position.y,
            this.options.position.z
        );
        this.scene.add(this.rampMesh);

        // Create the physics body
        const vertices = [];
        const faces = [];

        // Define vertices for a triangular prism shape
        vertices.push(
            new CANNON.Vec3(0, 0, 0),                           // 0: front bottom left
            new CANNON.Vec3(this.options.length, 0, 0),         // 1: front bottom right
            new CANNON.Vec3(this.options.length, this.options.height, 0), // 2: front top
            new CANNON.Vec3(0, 0, -this.options.width),         // 3: back bottom left
            new CANNON.Vec3(this.options.length, 0, -this.options.width), // 4: back bottom right
            new CANNON.Vec3(this.options.length, this.options.height, -this.options.width)  // 5: back top
        );

        // Define faces using vertices (CCW order)
        faces.push(
            [0, 1, 2],  // Front face triangle
            [3, 5, 4],  // Back face triangle
            [0, 2, 5, 3],  // Top face
            [0, 3, 4, 1],  // Bottom face
            [1, 4, 5, 2]   // Right face
        );

        // Create a custom ConvexPolyhedron shape
        const rampShape3D = new CANNON.ConvexPolyhedron({
            vertices: vertices,
            faces: faces
        });

        // Create the physics body
        this.rampBody = new CANNON.Body({
            mass: 0,  // Static body
            material: new CANNON.Material({
                friction: 0.8,
                restitution: 0.3
            })
        });

        this.rampBody.addShape(rampShape3D);
        this.rampBody.position.set(
            this.options.position.x,
            this.options.position.y,
            this.options.position.z
        );
        this.world.addBody(this.rampBody);

        // Add some visual enhancements
        this._addGuideLines();
    }

    _addGuideLines() {
        // Add guide lines on the ramp surface
        const lineGeometry = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });

        // Create multiple lines across the ramp
        for (let i = 0; i <= this.options.width; i += 0.5) {
            const points = [];
            points.push(
                new THREE.Vector3(0, 0, -i),
                new THREE.Vector3(this.options.length, this.options.height, -i)
            );
            lineGeometry.setFromPoints(points);
            const line = new THREE.Line(lineGeometry.clone(), lineMaterial);
            this.rampMesh.add(line);
        }
    }

    // Method to update position/rotation if needed
    update() {
        this.rampMesh.position.copy(this.rampBody.position);
        this.rampMesh.quaternion.copy(this.rampBody.quaternion);
    }
} 