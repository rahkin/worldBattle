import { BuildingSystem } from '../ecs/systems/BuildingSystem.js';
import { World } from '../ecs/World.js';
import * as THREE from 'three';

describe('BuildingSystem', () => {
    let system;
    let world;

    beforeEach(() => {
        world = new World();
        system = new BuildingSystem();
        world.addSystem(system);
    });

    describe('initialization', () => {
        test('should initialize with no properties provided', () => {
            system = new BuildingSystem();
            expect(system.buildings).toEqual(new Map());
            expect(system.constructionQueue).toEqual([]);
            expect(system.demolitionQueue).toEqual([]);
            expect(system.repairQueue).toEqual([]);
            expect(system.maxConstructionWorkers).toBe(10); // Default value
            expect(system.constructionTime).toBe(2.0); // Default value
            expect(system.buildingTemplates.size).toBe(0);
        });

        test('should initialize with partial properties', () => {
            system = new BuildingSystem({
                maxConstructionWorkers: 5
            });
            expect(system.maxConstructionWorkers).toBe(5);
            expect(system.constructionTime).toBe(2.0); // Default value
            expect(system.buildingTemplates.size).toBe(0);
        });

        test('should initialize with all properties', () => {
            const template = {
                footprint: {
                    type: 'rectangular',
                    width: 10,
                    depth: 8
                },
                material: {
                    type: 'brick',
                    color: '#FF0000'
                }
            };

            system = new BuildingSystem({
                maxConstructionWorkers: 5,
                constructionTime: 1.0,
                buildingTemplates: {
                    'test-template': template
                }
            });

            expect(system.maxConstructionWorkers).toBe(5);
            expect(system.constructionTime).toBe(1.0);
            expect(system.buildingTemplates.has('test-template')).toBe(true);
            const storedTemplate = system.buildingTemplates.get('test-template');
            expect(storedTemplate.footprint.type).toBe('rectangular');
            expect(storedTemplate.material.type).toBe('brick');
        });

        test('should handle empty building templates', () => {
            system = new BuildingSystem({
                buildingTemplates: {}
            });
            expect(system.buildingTemplates.size).toBe(0);
        });
    });

    describe('building management', () => {
        let templateName;
        let position;

        beforeEach(() => {
            templateName = 'residential';
            position = new THREE.Vector3(0, 0, 0);
            system.init();
        });

        test('should queue construction', () => {
            const result = system.queueConstruction(templateName, position);
            expect(result).toBe(true);
            expect(system.constructionQueue).toHaveLength(1);
            expect(system.constructionQueue[0].templateName).toBe(templateName);
        });

        test('should create building', () => {
            const buildingId = system.createBuilding(templateName, position);
            expect(buildingId).toBeDefined();
            expect(system.buildings.has(buildingId)).toBe(true);
        });

        test('should queue demolition', () => {
            const buildingId = system.createBuilding(templateName, position);
            const result = system.queueDemolition(buildingId);
            expect(result).toBe(true);
            expect(system.demolitionQueue).toHaveLength(1);
        });

        test('should queue repair', () => {
            const buildingId = system.createBuilding(templateName, position);
            const result = system.queueRepair(buildingId);
            expect(result).toBe(true);
            expect(system.repairQueue).toHaveLength(1);
        });
    });

    describe('update', () => {
        let templateName;
        let position;

        beforeEach(() => {
            templateName = 'residential';
            position = new THREE.Vector3(0, 0, 0);
            system.init();
        });

        test('should update demolition progress', () => {
            const buildingId = system.createBuilding(templateName, position);
            system.queueDemolition(buildingId);
            system.update(0.5);
            expect(system.demolitionQueue[0].progress).toBe(0.5);
        });
    });

    describe('error handling', () => {
        test('should handle invalid template name', () => {
            expect(() => {
                system.createBuilding('invalid-template', new THREE.Vector3(0, 0, 0));
            }).toThrow('Building template not found: invalid-template');
        });

        test('should handle invalid building id', () => {
            expect(() => {
                system.queueDemolition('invalid-building');
            }).toThrow('Building not found: invalid-building');
        });
    });
}); 