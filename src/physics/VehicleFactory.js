import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class VehicleFactory {
    constructor(world, scene) {
        this.world = world;
        this.scene = scene;
        this.vehicles = new Map();
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

        this.vehicles.set(vehicle, {
            chassis: chassisMesh,
            wheels: wheelMeshes
        });

        console.log("Wheel Configuration:");
        vehicle.wheelInfos.forEach((wheel, i) => {
            console.log(`Wheel ${i} (${i < 2 ? 'Front' : 'Rear'}):`);
            console.log("  Axle:", wheel.axleLocal.toString());
            console.log("  Direction:", wheel.directionLocal.toString());
            console.log("  Position:", wheel.chassisConnectionPointLocal.toString());
        });

        return vehicle;
    }

    update(deltaTime = 1 / 60) {
        this.vehicles.forEach((meshes, vehicle) => {
            const { chassis, wheels } = meshes;

            // Update chassis
            chassis.position.copy(vehicle.chassisBody.position);
            chassis.quaternion.copy(vehicle.chassisBody.quaternion);

            // Forward direction (z axis)
            const forward = new CANNON.Vec3(0, 0, 1);
            const velocity = vehicle.chassisBody.velocity;
            const forwardVelocity = velocity.dot(forward);

            // Update wheels
            vehicle.wheelInfos.forEach((wheelInfo, i) => {
                vehicle.updateWheelTransform(i);
                const wheelMesh = wheels[i];
                const t = wheelInfo.worldTransform;
                wheelMesh.position.copy(t.position);
                wheelMesh.quaternion.copy(t.quaternion);

                // 🔁 Spin animation (forward or backward)
                const radius = wheelInfo.radius;
                const speed = vehicle.chassisBody.velocity.length();
                const angularVelocity = speed / radius;
                const direction = Math.sign(forwardVelocity || 1);

                // Manually add spin angle on top of quaternion rotation
                wheelMesh.userData.spinAngle = (wheelMesh.userData.spinAngle || 0) + angularVelocity * deltaTime * direction;
                wheelMesh.rotateX(angularVelocity * deltaTime * direction); // Apply local spin
            });
        });
    }
} 