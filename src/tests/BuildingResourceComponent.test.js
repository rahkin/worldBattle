import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { BuildingResourceComponent } from '../ecs/components/BuildingResourceComponent.js';

describe('BuildingResourceComponent', () => {
    let component;

    beforeEach(() => {
        component = new BuildingResourceComponent();
    });

    describe('initialization', () => {
        test('should initialize with default values', () => {
            expect(component.resources).toEqual(new Map());
            expect(component.storageCapacity).toBe(1000);
            expect(component.productionRates).toEqual(new Map());
            expect(component.consumptionRates).toEqual(new Map());
            expect(component.workers).toEqual([]);
            expect(component.productionQueue).toEqual([]);
        });

        test('should initialize with provided values', () => {
            const properties = {
                resources: new Map([['wood', 100]]),
                storageCapacity: 2000,
                productionRates: new Map([['wood', 10]]),
                consumptionRates: new Map([['wood', 5]]),
                workers: [{ id: 'worker1', efficiency: 1 }],
                productionQueue: [{ resource: 'wood', amount: 50, progress: 0 }]
            };

            component.init(properties);

            expect(component.resources).toEqual(properties.resources);
            expect(component.storageCapacity).toBe(properties.storageCapacity);
            expect(component.productionRates).toEqual(properties.productionRates);
            expect(component.consumptionRates).toEqual(properties.consumptionRates);
            expect(component.workers).toEqual(properties.workers);
            expect(component.productionQueue).toEqual(properties.productionQueue);
        });
    });

    describe('resource management', () => {
        test('should add resources', () => {
            component.addResource('wood', 100);
            expect(component.getResourceAmount('wood')).toBe(100);
        });

        test('should remove resources', () => {
            component.addResource('wood', 100);
            component.removeResource('wood', 50);
            expect(component.getResourceAmount('wood')).toBe(50);
        });

        test('should respect storage capacity', () => {
            component.storageCapacity = 100;
            component.addResource('wood', 150);
            expect(component.getResourceAmount('wood')).toBe(100);
        });

        test('should calculate storage usage', () => {
            component.storageCapacity = 1000;
            component.addResource('wood', 300);
            component.addResource('stone', 200);
            expect(component.getStorageUsage()).toBe(500);
            expect(component.getStorageUsagePercentage()).toBe(50);
        });
    });

    describe('production management', () => {
        test('should set production rate', () => {
            component.setProductionRate('wood', 10);
            expect(component.productionRates.get('wood')).toBe(10);
        });

        test('should set consumption rate', () => {
            component.setConsumptionRate('wood', 5);
            expect(component.consumptionRates.get('wood')).toBe(5);
        });

        test('should queue production', () => {
            component.queueProduction('wood', 50);
            expect(component.productionQueue).toHaveLength(1);
            expect(component.productionQueue[0].resource).toBe('wood');
            expect(component.productionQueue[0].amount).toBe(50);
            expect(component.productionQueue[0].progress).toBe(0);
        });

        test('should calculate production efficiency', () => {
            component.addWorker({ id: 'worker1', efficiency: 0.8 });
            component.addWorker({ id: 'worker2', efficiency: 0.6 });
            component.setProductionRate('wood', 10);
            expect(component.getProductionEfficiency('wood')).toBe(7); // 10 * 0.7
        });
    });

    describe('worker management', () => {
        test('should add worker', () => {
            const worker = { id: 'worker1', efficiency: 1 };
            component.addWorker(worker);
            expect(component.workers).toContain(worker);
        });

        test('should remove worker', () => {
            const worker = { id: 'worker1', efficiency: 1 };
            component.addWorker(worker);
            component.removeWorker(worker);
            expect(component.workers).not.toContain(worker);
        });

        test('should calculate worker efficiency', () => {
            component.addWorker({ id: 'worker1', efficiency: 0.8 });
            component.addWorker({ id: 'worker2', efficiency: 0.6 });
            expect(component.getWorkerEfficiency()).toBe(0.7);
        });

        test('should respect worker limit', () => {
            component.maxWorkers = 2;
            component.addWorker({ id: 'worker1', efficiency: 1 });
            component.addWorker({ id: 'worker2', efficiency: 1 });
            component.addWorker({ id: 'worker3', efficiency: 1 });
            expect(component.workers).toHaveLength(2);
        });
    });

    describe('update', () => {
        beforeEach(() => {
            component.addResource('wood', 100);
            component.setProductionRate('wood', 10);
            component.setConsumptionRate('wood', 5);
        });

        test('should update production progress', () => {
            component.queueProduction('wood', 50);
            component.update(1);
            expect(component.productionQueue[0].progress).toBe(10);
        });

        test('should complete production when finished', () => {
            component.queueProduction('wood', 10);
            component.update(1);
            expect(component.productionQueue).toHaveLength(0);
            expect(component.getResourceAmount('wood')).toBe(105);
        });

        test('should handle resource consumption', () => {
            component.update(1);
            expect(component.getResourceAmount('wood')).toBe(95);
        });

        test('should stop production when resources are insufficient', () => {
            component.addResource('wood', 5);
            component.setConsumptionRate('wood', 10);
            component.queueProduction('planks', 10);
            component.update(1);
            expect(component.productionQueue[0].progress).toBe(0);
        });
    });

    describe('cleanup', () => {
        test('should dispose of resources', () => {
            component.addResource('wood', 100);
            component.addWorker({ id: 'worker1', efficiency: 1 });
            component.queueProduction('planks', 10);

            component.dispose();

            expect(component.resources.size).toBe(0);
            expect(component.workers).toEqual([]);
            expect(component.productionQueue).toEqual([]);
            expect(component.productionRates.size).toBe(0);
            expect(component.consumptionRates.size).toBe(0);
        });
    });
}); 