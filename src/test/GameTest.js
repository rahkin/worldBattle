import { Game } from '../core/Game.js';
import { VehicleComponent } from '../ecs/components/VehicleComponent.js';
import { MeshComponent } from '../ecs/components/MeshComponent.js';
import { PhysicsBody } from '../ecs/components/PhysicsBody.js';
import { InputComponent } from '../ecs/components/InputComponent.js';
import { TimeComponent } from '../ecs/components/TimeComponent.js';
import { WeatherComponent } from '../ecs/components/WeatherComponent.js';

export class GameTest {
    constructor() {
        this.game = new Game();
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    async runTests() {
        console.log('Starting game tests...');
        
        try {
            // Initialize game
            await this.testInitialization();
            
            // Test ECS systems
            await this.testECSSystems();
            
            // Test vehicle functionality
            await this.testVehicleSystem();
            
            // Test physics
            await this.testPhysics();
            
            // Test input handling
            await this.testInputSystem();
            
            // Test weather and time
            await this.testEnvironmentSystems();
            
            console.log('\nTest Results:');
            console.log(`Total Tests: ${this.testResults.total}`);
            console.log(`Passed: ${this.testResults.passed}`);
            console.log(`Failed: ${this.testResults.failed}`);
            
            return this.testResults.failed === 0;
        } catch (error) {
            console.error('Test suite failed:', error);
            return false;
        }
    }

    async testInitialization() {
        console.log('\nTesting game initialization...');
        
        try {
            await this.game.init();
            this.assert(this.game.world !== null, 'ECS World initialized');
            this.assert(this.game.sceneManager !== null, 'Scene Manager initialized');
            this.assert(this.game.cameraManager !== null, 'Camera Manager initialized');
            this.assert(this.game.inputManager !== null, 'Input Manager initialized');
            
            console.log('Game initialization tests passed');
        } catch (error) {
            console.error('Game initialization tests failed:', error);
            throw error;
        }
    }

    async testECSSystems() {
        console.log('\nTesting ECS systems...');
        
        try {
            // Test system registration
            const requiredSystems = [
                'SceneSystem',
                'TimeSystem',
                'WeatherSystem',
                'InputSystem',
                'VehicleSystem',
                'PhysicsSystem',
                'PowerUpSystem',
                'MineSystem',
                'CollisionSystem',
                'AudioSystem'
            ];
            
            for (const systemName of requiredSystems) {
                const system = this.game.world.getSystem(systemName);
                this.assert(system !== null, `${systemName} registered`);
            }
            
            // Test entity creation
            const entity = this.game.world.createEntity();
            this.assert(entity !== null, 'Entity creation');
            
            // Test component addition
            const component = new TimeComponent();
            entity.addComponent(component);
            this.assert(entity.getComponent(TimeComponent) === component, 'Component addition');
            
            console.log('ECS system tests passed');
        } catch (error) {
            console.error('ECS system tests failed:', error);
            throw error;
        }
    }

    async testVehicleSystem() {
        console.log('\nTesting vehicle system...');
        
        try {
            const vehicleSystem = this.game.world.getSystem('VehicleSystem');
            
            // Test vehicle creation
            const vehicleEntity = vehicleSystem.createVehicle('base');
            this.assert(vehicleEntity !== null, 'Vehicle creation');
            
            // Test vehicle components
            const vehicleComponent = vehicleEntity.getComponent(VehicleComponent);
            const meshComponent = vehicleEntity.getComponent(MeshComponent);
            const physicsBody = vehicleEntity.getComponent(PhysicsBody);
            
            this.assert(vehicleComponent !== null, 'Vehicle component');
            this.assert(meshComponent !== null, 'Mesh component');
            this.assert(physicsBody !== null, 'Physics body component');
            
            // Test vehicle removal
            vehicleSystem.removeVehicle(vehicleEntity);
            this.assert(!this.game.world.entities.has(vehicleEntity.id), 'Vehicle removal');
            
            console.log('Vehicle system tests passed');
        } catch (error) {
            console.error('Vehicle system tests failed:', error);
            throw error;
        }
    }

    async testPhysics() {
        console.log('\nTesting physics system...');
        
        try {
            const physicsSystem = this.game.world.getSystem('PhysicsSystem');
            
            // Test physics world
            this.assert(physicsSystem.world !== null, 'Physics world initialized');
            
            // Test physics update
            const initialTime = performance.now();
            physicsSystem.update(0.016); // 60 FPS delta time
            const updateTime = performance.now() - initialTime;
            this.assert(updateTime < 100, 'Physics update performance'); // Should take less than 100ms
            
            console.log('Physics system tests passed');
        } catch (error) {
            console.error('Physics system tests failed:', error);
            throw error;
        }
    }

    async testInputSystem() {
        console.log('\nTesting input system...');
        
        try {
            const inputSystem = this.game.world.getSystem('InputSystem');
            const inputEntity = this.game.world.getEntitiesWithComponent(InputComponent)[0];
            
            // Test input component
            this.assert(inputEntity !== null, 'Input entity exists');
            const inputComponent = inputEntity.getComponent(InputComponent);
            this.assert(inputComponent !== null, 'Input component exists');
            
            // Simulate input events
            const keyEvent = new KeyboardEvent('keydown', { key: 'w' });
            window.dispatchEvent(keyEvent);
            this.assert(inputComponent.keys.w === true, 'Key press detection');
            
            const mouseEvent = new MouseEvent('mousedown', { button: 0 });
            window.dispatchEvent(mouseEvent);
            this.assert(inputComponent.mouseButtons[0] === true, 'Mouse button press detection');
            
            console.log('Input system tests passed');
        } catch (error) {
            console.error('Input system tests failed:', error);
            throw error;
        }
    }

    async testEnvironmentSystems() {
        console.log('\nTesting environment systems...');
        
        try {
            // Test time system
            const timeSystem = this.game.world.getSystem('TimeSystem');
            const timeEntity = this.game.world.getEntitiesWithComponent(TimeComponent)[0];
            const timeComponent = timeEntity.getComponent(TimeComponent);
            
            this.assert(timeComponent !== null, 'Time component exists');
            const initialTime = timeComponent.currentTime;
            timeSystem.update(1.0); // Advance time by 1 second
            this.assert(timeComponent.currentTime > initialTime, 'Time progression');
            
            // Test weather system
            const weatherSystem = this.game.world.getSystem('WeatherSystem');
            const weatherEntity = this.game.world.getEntitiesWithComponent(WeatherComponent)[0];
            const weatherComponent = weatherEntity.getComponent(WeatherComponent);
            
            this.assert(weatherComponent !== null, 'Weather component exists');
            weatherComponent.setWeather('rain', 1.0);
            this.assert(weatherComponent.currentWeather === 'rain', 'Weather change');
            
            console.log('Environment system tests passed');
        } catch (error) {
            console.error('Environment system tests failed:', error);
            throw error;
        }
    }

    assert(condition, message) {
        this.testResults.total++;
        if (condition) {
            this.testResults.passed++;
            console.log(`✓ ${message}`);
        } else {
            this.testResults.failed++;
            console.error(`✗ ${message}`);
        }
    }
} 