import { System } from './System.js';
import { BuildingFootprintComponent } from '../components/BuildingFootprintComponent.js';
import { BuildingResourceComponent } from '../components/BuildingResourceComponent.js';
import { BuildingInteractionComponent } from '../components/BuildingInteractionComponent.js';

export class BuildingSystem extends System {
    constructor(options = {}) {
        super(options.world);
        this.type = 'BuildingSystem';
        
        // Initialize properties with defaults or provided values
        this.buildings = new Map();
        this.constructionQueue = [];
        this.demolitionQueue = [];
        this.repairQueue = [];
        this.maxConstructionWorkers = options.maxConstructionWorkers || 10;
        this.constructionTime = options.constructionTime || 2.0;
        this.buildingTemplates = new Map();

        // Initialize additional building templates if provided
        if (options.buildingTemplates) {
            Object.entries(options.buildingTemplates).forEach(([name, template]) => {
                this.buildingTemplates.set(name, template);
            });
        }
    }

    init() {
        if (!this.world) {
            throw new Error('BuildingSystem requires a World instance');
        }
        // Add default residential template after initialization
        this.buildingTemplates.set('residential', {
            footprint: {
                type: 'rectangular',
                width: 10,
                depth: 8,
                height: 3
            },
            resources: {
                storageCapacity: 1000,
                productionRates: {
                    population: 1
                }
            },
            interaction: {
                interactionPoints: [
                    { type: 'entrance', position: { x: 0, y: 0, z: 0 } }
                ]
            }
        });
        return this;
    }

    queueConstruction(templateName, position) {
        if (!this.buildingTemplates.has(templateName)) {
            throw new Error(`Building template not found: ${templateName}`);
        }

        this.constructionQueue.push({
            templateName,
            position,
            progress: 0
        });

        return true;
    }

    createBuilding(templateName, position) {
        if (!this.buildingTemplates.has(templateName)) {
            throw new Error(`Building template not found: ${templateName}`);
        }

        const template = this.buildingTemplates.get(templateName);
        const entity = this.world.createEntity();
        
        // Add building components
        const footprint = new BuildingFootprintComponent();
        footprint.init(entity, { ...template.footprint, position });
        entity.addComponent(footprint);

        const resources = new BuildingResourceComponent();
        resources.init(entity, template.resources);
        entity.addComponent(resources);

        const interaction = new BuildingInteractionComponent();
        interaction.init(entity, template.interaction);
        entity.addComponent(interaction);

        // Add to world and our building map
        entity.addToWorld(this.world);
        this.buildings.set(entity.id, entity);

        return entity.id;
    }

    queueDemolition(buildingId) {
        if (!this.buildings.has(buildingId)) {
            throw new Error(`Building not found: ${buildingId}`);
        }

        this.demolitionQueue.push({
            buildingId,
            progress: 0
        });

        return true;
    }

    queueRepair(buildingId) {
        if (!this.buildings.has(buildingId)) {
            throw new Error(`Building not found: ${buildingId}`);
        }

        this.repairQueue.push({
            buildingId,
            progress: 0
        });

        return true;
    }

    update(deltaTime) {
        // Update construction progress
        this.constructionQueue.forEach(item => {
            item.progress += deltaTime / this.constructionTime;
            if (item.progress >= 1) {
                this.createBuilding(item.templateName, item.position);
            }
        });
        this.constructionQueue = this.constructionQueue.filter(item => item.progress < 1);

        // Update demolition progress
        this.demolitionQueue.forEach(item => {
            item.progress += deltaTime;
            if (item.progress >= 1) {
                const building = this.buildings.get(item.buildingId);
                if (building) {
                    this.world.removeEntity(building);
                    this.buildings.delete(item.buildingId);
                }
            }
        });
        this.demolitionQueue = this.demolitionQueue.filter(item => item.progress < 1);

        // Update repair progress
        this.repairQueue.forEach(item => {
            item.progress += deltaTime;
            if (item.progress >= 1) {
                const building = this.buildings.get(item.buildingId);
                if (building) {
                    // Reset building health or condition here
                }
            }
        });
        this.repairQueue = this.repairQueue.filter(item => item.progress < 1);
    }

    cleanup() {
        this.buildings.clear();
        this.constructionQueue.length = 0;
        this.demolitionQueue.length = 0;
        this.repairQueue.length = 0;
    }
}