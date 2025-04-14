export class VehicleSelector {
    constructor(game) {
        this.game = game;
        this.element = document.createElement('div');
        this.element.id = 'vehicle-selector';
        this.element.style.position = 'fixed';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.element.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        this.element.style.display = 'none';
        this.element.style.zIndex = '1000';
        this.element.style.padding = '20px';
        this.element.style.boxSizing = 'border-box';

        // Create title
        const title = document.createElement('h1');
        title.textContent = 'Select Your Vehicle';
        title.style.color = '#fff';
        title.style.textAlign = 'center';
        title.style.marginBottom = '40px';
        title.style.fontFamily = 'Arial, sans-serif';
        title.style.fontSize = '32px';
        this.element.appendChild(title);

        // Create vehicle grid container
        const gridContainer = document.createElement('div');
        gridContainer.style.display = 'grid';
        gridContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
        gridContainer.style.gap = '20px';
        gridContainer.style.maxWidth = '1200px';
        gridContainer.style.margin = '0 auto';
        gridContainer.style.padding = '0 20px';

        const vehicles = [
            {
                id: 'muscle',
                name: 'Muscle Car',
                description: 'Fast and agile with boost capability',
                stats: { speed: 8, handling: 7, durability: 6 },
                color: '#ff4444'
            },
            {
                id: 'scorpion',
                name: 'Scorpion',
                description: 'Lightweight and fast, but fragile',
                stats: { speed: 9, handling: 8, durability: 4 },
                color: '#44ff44'
            },
            {
                id: 'drone',
                name: 'Drone',
                description: 'Futuristic hover vehicle with extreme speed',
                stats: { speed: 10, handling: 9, durability: 3 },
                color: '#4444ff'
            },
            {
                id: 'tank',
                name: 'Tank',
                description: 'Light armored tank with good mobility and firepower',
                stats: { speed: 6, handling: 7, durability: 7 },
                color: '#44ffff'
            },
            {
                id: 'ironclad',
                name: 'Ironclad',
                description: 'Heavily armored but slower',
                stats: { speed: 4, handling: 5, durability: 9 },
                color: '#ffff44'
            },
            {
                id: 'junkyard',
                name: 'Junkyard King',
                description: 'Durable and reliable, built from scrap',
                stats: { speed: 5, handling: 6, durability: 8 },
                color: '#ff44ff'
            }
        ];

        vehicles.forEach(vehicle => {
            const card = document.createElement('div');
            card.className = 'vehicle-card';
            card.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            card.style.borderRadius = '10px';
            card.style.padding = '15px';
            card.style.cursor = 'pointer';
            card.style.transition = 'transform 0.2s, background-color 0.2s';
            card.style.border = `2px solid ${vehicle.color}`;
            card.style.height = '160px';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.justifyContent = 'space-between';

            // Hover effects
            card.onmouseenter = () => {
                card.style.transform = 'scale(1.05)';
                card.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                card.style.borderColor = vehicle.color.replace('44', '88');
            };
            card.onmouseleave = () => {
                card.style.transform = 'scale(1)';
                card.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                card.style.borderColor = vehicle.color;
            };

            // Vehicle name
            const name = document.createElement('h2');
            name.textContent = vehicle.name;
            name.style.color = '#fff';
            name.style.marginBottom = '5px';
            name.style.fontFamily = 'Arial, sans-serif';
            name.style.fontSize = '20px';

            // Vehicle description
            const description = document.createElement('p');
            description.textContent = vehicle.description;
            description.style.color = '#aaa';
            description.style.marginBottom = '10px';
            description.style.fontSize = '14px';
            description.style.flexGrow = '1';

            // Stats container
            const stats = document.createElement('div');
            stats.style.display = 'grid';
            stats.style.gridTemplateColumns = 'repeat(3, 1fr)';
            stats.style.gap = '10px';

            // Add stats bars
            const statTypes = ['speed', 'handling', 'durability'];
            statTypes.forEach(statType => {
                const statContainer = document.createElement('div');
                statContainer.style.textAlign = 'center';

                const label = document.createElement('div');
                label.textContent = statType.charAt(0).toUpperCase() + statType.slice(1);
                label.style.color = '#fff';
                label.style.fontSize = '12px';
                label.style.marginBottom = '3px';

                const bar = document.createElement('div');
                bar.style.width = '100%';
                bar.style.height = '6px';
                bar.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                bar.style.borderRadius = '3px';
                bar.style.overflow = 'hidden';

                const fill = document.createElement('div');
                fill.style.width = `${(vehicle.stats[statType] / 10) * 100}%`;
                fill.style.height = '100%';
                fill.style.backgroundColor = vehicle.color;

                bar.appendChild(fill);
                statContainer.appendChild(label);
                statContainer.appendChild(bar);
                stats.appendChild(statContainer);
            });

            // Assemble card
            card.appendChild(name);
            card.appendChild(description);
            card.appendChild(stats);

            // Click handler
            card.onclick = () => {
                this.game.selectVehicle(vehicle.id);
                this.hide();
            };

            gridContainer.appendChild(card);
        });

        this.element.appendChild(gridContainer);
        document.body.appendChild(this.element);
    }

    show() {
        this.element.style.display = 'block';
    }

    hide() {
        this.element.style.display = 'none';
    }

    cleanup() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
} 