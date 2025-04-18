import { Component } from './Component.js';

export class BuildingResourceComponent extends Component {
    constructor() {
        super();
        this.type = 'BuildingResourceComponent';
        this.resources = new Map();
        this.storageCapacity = 1000;
        this.productionRates = new Map();
        this.consumptionRates = new Map();
        this.workers = [];
        this.productionQueue = [];
        this.maxWorkers = 10;
    }

    init(entityOrProperties, properties = {}) {
        // Handle case where only properties are passed
        if (typeof entityOrProperties === 'object' && !(entityOrProperties instanceof Component)) {
            properties = entityOrProperties;
            super.init(null);
        } else {
            super.init(entityOrProperties);
        }

        if (properties) {
            if (properties.resources instanceof Map) {
                this.resources = new Map(properties.resources);
            }
            
            this.storageCapacity = properties.storageCapacity || this.storageCapacity;
            
            if (properties.productionRates instanceof Map) {
                this.productionRates = new Map(properties.productionRates);
            }
            
            if (properties.consumptionRates instanceof Map) {
                this.consumptionRates = new Map(properties.consumptionRates);
            }
            
            if (Array.isArray(properties.workers)) {
                this.workers = [...properties.workers];
            }
            
            if (Array.isArray(properties.productionQueue)) {
                this.productionQueue = properties.productionQueue.map(item => ({...item}));
            }
            
            this.maxWorkers = properties.maxWorkers || this.maxWorkers;
        }
        return this;
    }

    addResource(type, amount) {
        const current = this.resources.get(type) || 0;
        const newAmount = Math.min(current + amount, this.storageCapacity);
        this.resources.set(type, newAmount);
        return newAmount - current;
    }

    removeResource(type, amount) {
        const current = this.resources.get(type) || 0;
        const newAmount = Math.max(0, current - amount);
        this.resources.set(type, newAmount);
        return current - newAmount;
    }

    getResourceAmount(type) {
        return this.resources.get(type) || 0;
    }

    getStorageUsage() {
        let total = 0;
        for (const amount of this.resources.values()) {
            total += amount;
        }
        return total;
    }

    getStorageUsagePercentage() {
        return (this.getStorageUsage() / this.storageCapacity) * 100;
    }

    setProductionRate(resourceType, rate) {
        this.productionRates.set(resourceType, rate);
    }

    getProductionRate(resourceType) {
        return this.productionRates.get(resourceType) || 0;
    }

    setConsumptionRate(resourceType, rate) {
        this.consumptionRates.set(resourceType, rate);
    }

    getConsumptionRate(resourceType) {
        return this.consumptionRates.get(resourceType) || 0;
    }

    getWorkerEfficiency() {
        if (this.workers.length === 0) return 0;
        let totalEfficiency = 0;
        for (const worker of this.workers) {
            totalEfficiency += worker.efficiency;
        }
        return totalEfficiency / this.workers.length;
    }

    getProductionEfficiency(resourceType) {
        const baseRate = this.getProductionRate(resourceType);
        const efficiency = this.getWorkerEfficiency();
        // If no workers, use base rate
        return baseRate * (this.workers.length === 0 ? 1 : efficiency);
    }

    addWorker(worker) {
        if (this.workers.length < this.maxWorkers) {
            this.workers.push(worker);
            return true;
        }
        return false;
    }

    removeWorker(worker) {
        const index = this.workers.indexOf(worker);
        if (index === -1) return false;
        this.workers.splice(index, 1);
        return true;
    }

    queueProduction(resourceType, amount) {
        this.productionQueue.push({
            resource: resourceType,
            amount,
            progress: 0
        });
    }

    update(deltaTime) {
        // First handle consumption
        for (const [resourceType, rate] of this.consumptionRates) {
            const consumptionAmount = rate * deltaTime;
            const currentAmount = this.getResourceAmount(resourceType);
            if (currentAmount >= consumptionAmount) {
                this.removeResource(resourceType, consumptionAmount);
            }
        }

        // Then handle production queue
        for (let i = this.productionQueue.length - 1; i >= 0; i--) {
            const item = this.productionQueue[i];
            const productionRate = this.getProductionEfficiency(item.resource);
            
            // Calculate remaining amount to produce
            const remaining = item.amount - item.progress;
            
            // Calculate how much to produce this tick
            const productionThisTick = Math.min(
                productionRate * deltaTime,
                remaining
            );
            
            // Add the resources
            this.addResource(item.resource, productionThisTick);
            
            // Update progress
            item.progress += productionThisTick;

            // Check if production is complete
            if (Math.abs(item.progress - item.amount) < 0.001) {
                // Ensure exact amount is produced
                const adjustment = item.amount - item.progress;
                if (Math.abs(adjustment) > 0) {
                    this.addResource(item.resource, adjustment);
                }
                // Remove the completed item
                this.productionQueue.splice(i, 1);
            }
        }
    }

    dispose() {
        this.resources.clear();
        this.productionRates.clear();
        this.consumptionRates.clear();
        this.workers = [];
        this.productionQueue = [];
    }

    cleanup() {
        super.cleanup();
        this.dispose();
    }
} 