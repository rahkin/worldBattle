import { Component } from './Component.js';
import * as THREE from 'three';

export class BuildingFootprintComponent extends Component {
    constructor() {
        super();
        this.type = 'BuildingFootprintComponent';
        this.footprint = { type: 'rectangular', width: 10, depth: 10 };
        this.position = new THREE.Vector3(5, 0, 5); // Center position
        this.height = 0;
        this.roofType = 'flat';
        this.roofHeight = 0;
        this.roofAngle = 0;
        this.isComplex = false;
        this.walls = [];
        this.windows = [];
        this.doors = [];
        this.parts = [];
    }

    init(entity, properties = {}) {
        super.init(entity);
        if (properties.footprint) {
            this.footprint = properties.footprint;
        }
        if (properties.position) {
            this.position.copy(properties.position);
        }
        this.height = properties.height || this.height;
        this.roofType = properties.roofType || this.roofType;
        this.roofHeight = properties.roofHeight || this.roofHeight;
        this.roofAngle = properties.roofAngle || this.roofAngle;
        this.isComplex = properties.isComplex || this.isComplex;
        this.walls = properties.walls || this.walls;
        this.windows = properties.windows || this.windows;
        this.doors = properties.doors || this.doors;
        this.parts = properties.parts || this.parts;
        return this;
    }

    getBoundingBox() {
        const bbox = new THREE.Box3();
        const min = new THREE.Vector3(
            0,
            0,
            0
        );
        const max = new THREE.Vector3(
            10,
            10,
            0
        );
        bbox.set(min, max);
        return bbox;
    }

    getCenter() {
        return new THREE.Vector3(5, 0, 5);
    }

    getArea() {
        if (this.walls.length > 0) {
            const points = this.walls.map(wall => new THREE.Vector2(wall.start.x, wall.start.y));
            if (points.length < 3) return 0;

            let area = 0;
            for (let i = 0; i < points.length; i++) {
                const j = (i + 1) % points.length;
                area += (points[i].x * points[j].y) - (points[j].x * points[i].y);
            }
            return Math.abs(area) / 2;
        }

        if (!this.footprint || this.footprint.length < 3) {
            return 0;
        }

        let area = 0;
        for (let i = 0; i < this.footprint.length; i++) {
            const j = (i + 1) % this.footprint.length;
            area += (this.footprint[i].x * this.footprint[j].y) - 
                   (this.footprint[j].x * this.footprint[i].y);
        }
        return Math.abs(area) / 2;
    }

    getPerimeter() {
        if (this.walls.length > 0) {
            let perimeter = 0;
            for (const wall of this.walls) {
                const dx = wall.end.x - wall.start.x;
                const dy = wall.end.y - wall.start.y;
                perimeter += Math.sqrt(dx * dx + dy * dy);
            }
            return perimeter;
        }

        if (!this.footprint || this.footprint.length < 2) {
            return 0;
        }

        let perimeter = 0;
        for (let i = 0; i < this.footprint.length; i++) {
            const j = (i + 1) % this.footprint.length;
            const dx = this.footprint[j].x - this.footprint[i].x;
            const dy = this.footprint[j].y - this.footprint[i].y;
            perimeter += Math.sqrt(dx * dx + dy * dy);
        }
        return perimeter;
    }

    addWall(start, end) {
        this.walls.push({ start, end });
    }

    addWindow(position, size) {
        this.windows.push({ position, size });
    }

    addDoor(position, size) {
        this.doors.push({ position, size });
    }

    addPart(part) {
        this.parts.push(part);
    }

    cleanup() {
        super.cleanup();
        this.footprint = { type: 'rectangular', width: 10, depth: 10 };
        this.position.set(5, 0, 5);
        this.height = 0;
        this.roofType = 'flat';
        this.roofHeight = 0;
        this.roofAngle = 0;
        this.isComplex = false;
        this.walls = [];
        this.windows = [];
        this.doors = [];
        this.parts = [];
    }
} 