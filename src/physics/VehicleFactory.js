import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { MuscleCar } from './vehicles/MuscleCar';
import { BaseCar } from './vehicles/BaseCar';
import { Ironclad } from './vehicles/Ironclad';
import { Scorpion } from './vehicles/Scorpion';
import { JunkyardKing } from './vehicles/JunkyardKing';
import { Tank } from './vehicles/Tank';
import { Drone } from './vehicles/Drone';

export class VehicleFactory {
    constructor(world, scene) {
        this.world = world;
        this.scene = scene;
        this.activeVehicles = new Set();
    }

    createVehicle(type, options = {}) {
        let vehicle;
        switch(type.toLowerCase()) {
            case 'muscle':
                vehicle = new MuscleCar(this.world, this.scene);
                break;
            case 'ironclad':
                vehicle = new Ironclad(this.world, this.scene);
                break;
            case 'scorpion':
                vehicle = new Scorpion(this.world, this.scene);
                break;
            case 'junkyard':
                vehicle = new JunkyardKing(this.world, this.scene);
                break;
            case 'tank':
                vehicle = new Tank(this.world, this.scene);
                break;
            case 'drone':
                vehicle = new Drone(this.world, this.scene);
                break;
            case 'base':
                vehicle = new BaseCar(this.world, this.scene, options);
                break;
            default:
                console.warn(`Vehicle type '${type}' not found, creating base car`);
                vehicle = new BaseCar(this.world, this.scene, options);
        }
        this.activeVehicles.add(vehicle);
        return vehicle;
    }

    removeVehicle(vehicle) {
        this.activeVehicles.delete(vehicle);
    }

    getAvailableVehicles() {
        return [
            {
                id: 'muscle',
                name: 'Muscle Car',
                description: 'Fast and agile with boost capability',
                stats: {
                    speed: 8,
                    handling: 7,
                    durability: 6
                }
            },
            {
                id: 'ironclad',
                name: 'Ironclad',
                description: 'Heavily armored but slower',
                stats: {
                    speed: 4,
                    handling: 5,
                    durability: 9
                }
            },
            {
                id: 'scorpion',
                name: 'Scorpion',
                description: 'Lightweight and fast, but fragile',
                stats: {
                    speed: 9,
                    handling: 8,
                    durability: 4
                }
            },
            {
                id: 'junkyard',
                name: 'Junkyard King',
                description: 'Durable and reliable, built from scrap',
                stats: {
                    speed: 5,
                    handling: 6,
                    durability: 8
                }
            },
            {
                id: 'tank',
                name: 'Tank',
                description: 'Light armored tank with good mobility and firepower',
                stats: {
                    speed: 6,
                    handling: 7,
                    durability: 7
                }
            },
            {
                id: 'drone',
                name: 'Drone',
                description: 'Futuristic hover vehicle with extreme speed',
                stats: {
                    speed: 10,
                    handling: 9,
                    durability: 3
                }
            }
        ];
    }

    async createMuscleCar(position = { x: 0, y: 0, z: 0 }) {
        const chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
        const chassisBody = new CANNON.Body({ mass: 150 });
        chassisBody.addShape(chassisShape);
        chassisBody.position.set(position.x, position.y + 4, position.z);
        this.world.addBody(chassisBody);

        const vehicle = new CANNON.RaycastVehicle({
            chassisBody,
            indexRightAxis: 0,
            indexUpAxis: 1,
            indexForwardAxis: 2
        });

        const wheelOptions = {
            radius: 0.4,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: 30,
            suspensionRestLength: 0.3,
            frictionSlip: 5,
            dampingRelaxation: 2.3,
            dampingCompression: 4.4,
            maxSuspensionForce: 100000,
            rollInfluence: 0.01,
            axleLocal: new CANNON.Vec3(-1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(),
            maxSuspensionTravel: 0.3,
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true
        };

        const wheelPositions = [
            new CANNON.Vec3(-1, 0, 2),
            new CANNON.Vec3(1, 0, 2),
            new CANNON.Vec3(-1, 0, -2),
            new CANNON.Vec3(1, 0, -2)
        ];

        wheelPositions.forEach((position, i) => {
            wheelOptions.chassisConnectionPointLocal = position;
            wheelOptions.isFrontWheel = i < 2;
            vehicle.addWheel(wheelOptions);
        });

        vehicle.addToWorld(this.world);

        const chassisGeometry = new THREE.BoxGeometry(2, 1, 4);
        const chassisMaterial = new THREE.MeshPhongMaterial({
            color: 0x90EE90,
            metalness: 0.9,
            roughness: 0.2,
        });
        const chassisMesh = new THREE.Mesh(chassisGeometry, chassisMaterial);
        chassisMesh.castShadow = true;
        this.scene.add(chassisMesh);

        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 32);
        wheelGeometry.rotateZ(Math.PI / 2); // rotate so the wheel is aligned with Cannon's X-axis

        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });

        const wheelMeshes = vehicle.wheelInfos.map(() => {
            const mesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
            mesh.castShadow = true;
            mesh.userData.spinAngle = 0; // store spin state
            this.scene.add(mesh);
            return mesh;
        });

        return vehicle;
    }

    update(deltaTime = 1 / 60) {
        for (const vehicle of this.activeVehicles) {
            if (vehicle && vehicle.updateVisuals) {
                vehicle.updateVisuals();
            }
        }
    }
} 