// Mock World class
jest.mock('../ecs/World');
jest.mock('three', () => ({
    Group: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
        remove: jest.fn(),
        position: { set: jest.fn() },
        quaternion: { set: jest.fn() },
        scale: { set: jest.fn() }
    })),
    BoxGeometry: jest.fn(),
    MeshBasicMaterial: jest.fn(),
    Mesh: jest.fn().mockImplementation(() => ({
        position: { set: jest.fn() },
        quaternion: { set: jest.fn() },
        scale: { set: jest.fn() }
    }))
}));

jest.mock('cannon-es', () => ({
    Body: jest.fn().mockImplementation(() => ({
        position: { set: jest.fn() },
        quaternion: { set: jest.fn() },
        addShape: jest.fn()
    })),
    Box: jest.fn(),
    Vec3: jest.fn().mockImplementation(() => ({
        set: jest.fn()
    })),
    Quaternion: jest.fn().mockImplementation(() => ({
        set: jest.fn()
    }))
}));

const { World } = require('../ecs/World');
const VehicleSystem = require('../ecs/systems/VehicleSystem').default;
const VehicleComponent = require('../ecs/components/VehicleComponent').default;
const PhysicsBody = require('../ecs/components/PhysicsBody').default;
const MeshComponent = require('../ecs/components/MeshComponent').default;

describe('VehicleSystem', () => {
    let world;
    let vehicleSystem;

    beforeEach(() => {
        world = new World();
        vehicleSystem = new VehicleSystem();
        world.addSystem(vehicleSystem);
    });

    afterEach(() => {
        world.cleanup();
    });

    test('creates a vehicle with all required components', () => {
        const vehicle = world.createEntity();
        vehicleSystem.createVehicle(vehicle);

        expect(vehicle.hasComponent(VehicleComponent)).toBe(true);
        expect(vehicle.hasComponent(PhysicsBody)).toBe(true);
        expect(vehicle.hasComponent(MeshComponent)).toBe(true);

        const meshComponent = vehicle.getComponent(MeshComponent);
        const vehicleComponent = vehicle.getComponent(VehicleComponent);
        const physicsBody = vehicle.getComponent(PhysicsBody);

        expect(meshComponent.mesh).toBeDefined();
        expect(vehicleComponent.stats).toBeDefined();
        expect(physicsBody.body).toBeDefined();
    });

    test('properly initializes vehicle components', () => {
        const vehicle = world.createEntity();
        vehicleSystem.createVehicle(vehicle);

        const vehicleComponent = vehicle.getComponent(VehicleComponent);
        expect(vehicleComponent.world).toBe(world);
        expect(vehicleComponent.entity).toBe(vehicle);

        const meshComponent = vehicle.getComponent(MeshComponent);
        expect(meshComponent.world).toBe(world);
        expect(meshComponent.entity).toBe(vehicle);

        const physicsBody = vehicle.getComponent(PhysicsBody);
        expect(physicsBody.world).toBe(world);
        expect(physicsBody.entity).toBe(vehicle);
    });
});