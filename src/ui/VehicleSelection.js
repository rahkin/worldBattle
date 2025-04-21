import { EventBus } from '../core/EventBus.js';

export class VehicleSelection {
    constructor(options = {}) {
        if (!options.eventBus) {
            throw new Error('EventBus is required for VehicleSelection');
        }
        this.container = null;
        this.eventBus = options.eventBus;
        this.vehicles = [
            { id: 'muscle', name: 'Muscle Car', description: 'High speed, medium handling' },
            { id: 'tank', name: 'Tank', description: 'High durability, low speed' },
            { id: 'scorpion', name: 'Sports Car', description: 'Excellent handling, high speed' },
            { id: 'ironclad', name: 'Monster Truck', description: 'Good off-road, medium speed' },
            { id: 'drone', name: 'Quantum Racer', description: 'Futuristic supercar with extreme speed' }
        ];
    }

    async init() {
        console.log('Initializing VehicleSelection UI');
        
        // Create UI container if it doesn't exist
        let uiContainer = document.getElementById('ui-container');
        if (!uiContainer) {
            uiContainer = document.createElement('div');
            uiContainer.id = 'ui-container';
            uiContainer.style.position = 'absolute';
            uiContainer.style.top = '0';
            uiContainer.style.left = '0';
            uiContainer.style.width = '100%';
            uiContainer.style.height = '100%';
            uiContainer.style.pointerEvents = 'none';
            document.body.appendChild(uiContainer);
        }

        // Create container
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '50%';
        this.container.style.left = '50%';
        this.container.style.transform = 'translate(-50%, -50%)';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.container.style.padding = '20px';
        this.container.style.borderRadius = '10px';
        this.container.style.color = 'white';
        this.container.style.fontFamily = 'Arial, sans-serif';
        this.container.style.minWidth = '300px';
        this.container.style.textAlign = 'center';
        this.container.style.pointerEvents = 'auto';

        // Add title
        const title = document.createElement('h2');
        title.textContent = 'Select Your Vehicle';
        title.style.marginBottom = '20px';
        title.style.color = '#fff';
        this.container.appendChild(title);

        // Create vehicle selection grid
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        grid.style.gap = '15px';
        grid.style.marginBottom = '20px';

        // Add vehicle options
        this.vehicles.forEach(vehicle => {
            const card = this.createVehicleCard(vehicle);
            grid.appendChild(card);
        });

        this.container.appendChild(grid);
        uiContainer.appendChild(this.container);
        
        console.log('VehicleSelection UI initialized');
    }

    createVehicleCard(vehicle) {
        const card = document.createElement('div');
        card.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        card.style.padding = '15px';
        card.style.borderRadius = '5px';
        card.style.cursor = 'pointer';
        card.style.transition = 'all 0.3s ease';

        const name = document.createElement('h3');
        name.textContent = vehicle.name;
        name.style.margin = '0 0 10px 0';
        name.style.color = '#fff';

        const description = document.createElement('p');
        description.textContent = vehicle.description;
        description.style.margin = '0';
        description.style.fontSize = '14px';
        description.style.color = '#ccc';

        card.appendChild(name);
        card.appendChild(description);

        // Hover effects
        card.onmouseover = () => {
            card.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            card.style.transform = 'scale(1.05)';
        };
        card.onmouseout = () => {
            card.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            card.style.transform = 'scale(1)';
        };

        // Click handler
        card.onclick = () => {
            console.log('Vehicle card clicked:', vehicle.id);
            this.selectVehicle(vehicle.id);
        };

        return card;
    }

    selectVehicle(vehicleId) {
        console.log('VehicleSelection: Selecting vehicle:', vehicleId);
        // Hide the selection screen
        this.hide();
        
        // Emit vehicle selected event
        this.eventBus.emit('vehicleSelected', { vehicleType: vehicleId });
    }

    show() {
        if (this.container) {
            this.container.style.display = 'block';
        } else {
            this.init();
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    cleanup() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
    }
} 