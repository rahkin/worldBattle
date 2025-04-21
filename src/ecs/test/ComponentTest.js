import { World } from '../World.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { GeoFeatureComponent } from '../components/GeoFeatureComponent.js';
import { PhysicsBody } from '../components/PhysicsBody.js';
import * as CANNON from 'cannon-es';

class ComponentTest {
    constructor() {
        this.world = new World();
        this.testResults = [];
    }

    runTests() {
        console.log('=== Running Component Tests ===');
        
        this.testPositionComponent();
        this.testGeoFeatureComponent();
        this.testPhysicsComponent();
        this.testEntityWithComponents();
        
        this.displayResults();
    }

    testPositionComponent() {
        try {
            const pos = new PositionComponent(1, 2, 3);
            this.assert('Position values set correctly', 
                pos.x === 1 && pos.y === 2 && pos.z === 3);

            pos.setPosition(4, 5, 6);
            const newPos = pos.getPosition();
            this.assert('Position update works', 
                newPos.x === 4 && newPos.y === 5 && newPos.z === 6);

            const clone = pos.clone();
            this.assert('Position clone works',
                clone.x === pos.x && clone.y === pos.y && clone.z === pos.z);
        } catch (error) {
            this.testResults.push({
                name: 'PositionComponent',
                passed: false,
                error: error.message
            });
        }
    }

    testGeoFeatureComponent() {
        try {
            const props = { height: 10, material: 'brick' };
            const geo = new GeoFeatureComponent('building', props);
            
            this.assert('GeoFeature type set correctly',
                geo.getType() === 'building');
            
            this.assert('GeoFeature properties set correctly',
                geo.getProperty('height') === 10 &&
                geo.getProperty('material') === 'brick');

            geo.setProperty('floors', 3);
            this.assert('GeoFeature property update works',
                geo.getProperty('floors') === 3);

            const clone = geo.clone();
            this.assert('GeoFeature clone works',
                clone.getType() === geo.getType() &&
                clone.getProperty('height') === geo.getProperty('height'));
        } catch (error) {
            this.testResults.push({
                name: 'GeoFeatureComponent',
                passed: false,
                error: error.message
            });
        }
    }

    testPhysicsComponent() {
        try {
            const physics = new PhysicsBody({
                mass: 1,
                type: 'dynamic'
            });

            this.assert('Physics component created with correct mass',
                physics.getMass() === 1);

            this.assert('Physics component type set correctly',
                physics.type === 'dynamic');

            // Test body initialization
            const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
            physics.initBody(shape);
            
            this.assert('Physics body initialized with shape',
                physics.body !== null && physics.body.shapes.length === 1);

            // Test position setting
            physics.setPosition(1, 2, 3);
            const pos = physics.getPosition();
            this.assert('Physics position set correctly',
                pos.x === 1 && pos.y === 2 && pos.z === 3);

            // Test velocity setting
            physics.setVelocity(4, 5, 6);
            const vel = physics.getVelocity();
            this.assert('Physics velocity set correctly',
                vel.x === 4 && vel.y === 5 && vel.z === 6);

            // Test mass update
            physics.setMass(2);
            this.assert('Physics mass updated correctly',
                physics.getMass() === 2);

            // Test cloning
            const clone = physics.clone();
            this.assert('Physics component cloned correctly',
                clone.mass === physics.mass && 
                clone.type === physics.type);

        } catch (error) {
            this.testResults.push({
                name: 'PhysicsBody',
                passed: false,
                error: error.message
            });
        }
    }

    testEntityWithComponents() {
        try {
            const entity = this.world.createEntity();
            
            entity.addComponent(new PositionComponent(1, 2, 3));
            entity.addComponent(new GeoFeatureComponent('building', { height: 10 }));
            entity.addComponent(new PhysicsBody({ mass: 0, type: 'static' }));

            const pos = entity.getComponent('PositionComponent');
            const geo = entity.getComponent('GeoFeatureComponent');
            const physics = entity.getComponent('PhysicsBody');

            this.assert('Entity has all components',
                pos !== null && geo !== null && physics !== null);

            this.assert('Components retain values',
                pos.x === 1 && pos.y === 2 && pos.z === 3 &&
                geo.getType() === 'building' &&
                geo.getProperty('height') === 10 &&
                physics.getMass() === 0 &&
                physics.type === 'static');
        } catch (error) {
            this.testResults.push({
                name: 'EntityWithComponents',
                passed: false,
                error: error.message
            });
        }
    }

    assert(name, condition) {
        this.testResults.push({
            name,
            passed: condition,
            error: condition ? null : 'Assertion failed'
        });
    }

    displayResults() {
        console.log('\n=== Test Results ===');
        let passed = 0;
        let failed = 0;

        this.testResults.forEach(result => {
            if (result.passed) {
                console.log(`✓ PASS: ${result.name}`);
                passed++;
            } else {
                console.log(`✗ FAIL: ${result.name}`);
                console.log(`  Error: ${result.error}`);
                failed++;
            }
        });

        console.log(`\nTotal: ${this.testResults.length}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
    }
}

// Run tests
const test = new ComponentTest();
test.runTests(); 