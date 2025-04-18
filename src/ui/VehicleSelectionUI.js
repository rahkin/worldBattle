/**
 * Represents the vehicle selection interface in the game.
 * Displays available vehicles and their stats, allowing players to choose their vehicle.
 */
export class VehicleSelectionUI {
    constructor(game) {
        this.game = game;
        this.element = null;
        this.isVisible = false;
        this.vehicles = [
            {
                type: 'muscle',
                name: 'Muscle Car',
                description: 'High speed, medium handling',
                stats: { speed: 8, handling: 6, durability: 5 },
                color: '#ff4444'
            },
            {
                type: 'ironclad',
                name: 'Ironclad',
                description: 'High durability, low speed',
                stats: { speed: 4, handling: 5, durability: 9 },
                color: '#666666'
            },
            {
                type: 'scorpion',
                name: 'Scorpion',
                description: 'High handling, medium speed',
                stats: { speed: 6, handling: 9, durability: 4 },
                color: '#44ff44'
            },
            {
                type: 'tank',
                name: 'Tank',
                description: 'Extreme durability, very low speed',
                stats: { speed: 3, handling: 3, durability: 10 },
                color: '#8B4513'
            },
            {
                type: 'drone',
                name: 'Drone',
                description: 'Extreme speed, low durability',
                stats: { speed: 10, handling: 8, durability: 2 },
                color: '#4444ff'
            }
        ];
    }

    init() {
        // Create and append the HTML structure
        const html = `
            <div class="vehicle-selection" style="display: none;">
                <h2>Select Your Vehicle</h2>
                <div class="vehicle-grid">
                    ${this.vehicles.map(vehicle => `
                        <div class="vehicle-card" data-vehicle-type="${vehicle.type}" style="border: 2px solid ${vehicle.color}">
                            <h3 style="color: ${vehicle.color}">${vehicle.name}</h3>
                            <p>${vehicle.description}</p>
                            <div class="vehicle-stats">
                                <div>
                                    <div class="stat-label">Speed</div>
                                    <div class="stat-bar">
                                        <div class="stat-bar-fill" style="width: ${vehicle.stats.speed * 10}%; background: ${vehicle.color}"></div>
                                    </div>
                                </div>
                                <div>
                                    <div class="stat-label">Handling</div>
                                    <div class="stat-bar">
                                        <div class="stat-bar-fill" style="width: ${vehicle.stats.handling * 10}%; background: ${vehicle.color}"></div>
                                    </div>
                                </div>
                                <div>
                                    <div class="stat-label">Durability</div>
                                    <div class="stat-bar">
                                        <div class="stat-bar-fill" style="width: ${vehicle.stats.durability * 10}%; background: ${vehicle.color}"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Create a temporary container and set its HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;
        this.element = temp.firstElementChild;

        // Add click handlers to vehicle cards
        this.element.querySelectorAll('.vehicle-card').forEach(card => {
            const vehicleType = card.dataset.vehicleType;
            console.log('Adding click handler for vehicle type:', vehicleType);
            
            card.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                console.log('Vehicle card clicked:', vehicleType);
                this.selectVehicle(vehicleType);
            });

            // Add hover effects
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'scale(1.05)';
                card.style.background = 'rgba(255, 255, 255, 0.2)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'scale(1)';
                card.style.background = 'rgba(255, 255, 255, 0.1)';
            });
        });

        // Add to UI container
        const uiContainer = document.getElementById('ui-container');
        if (uiContainer) {
            uiContainer.appendChild(this.element);
            console.log('Vehicle selection UI added to container');
        } else {
            console.error('UI container not found');
        }
    }

    show() {
        if (this.element) {
            this.element.style.display = 'block';
            this.isVisible = true;
            console.log('Vehicle selection UI shown');
        }
    }

    hide() {
        if (this.element) {
            this.element.style.display = 'none';
            this.isVisible = false;
            console.log('Vehicle selection UI hidden');
        }
    }

    selectVehicle(type) {
        console.log('VehicleSelectionUI: Vehicle selected:', type);
        if (!this.game) {
            console.error('Game instance not found');
            return;
        }
        if (!this.game.selectVehicle) {
            console.error('selectVehicle method not found on game instance');
            return;
        }
        try {
            this.game.selectVehicle(type);
            this.hide();
            console.log('Vehicle selection completed for type:', type);
        } catch (error) {
            console.error('Error selecting vehicle:', error);
        }
    }

    cleanup() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
} 