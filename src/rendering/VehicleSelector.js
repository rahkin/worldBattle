export class VehicleSelector {
    constructor(game) {
        this.game = game;
        this.container = document.createElement('div');
        this.container.className = 'vehicle-selector';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        this.createUI();
        document.body.appendChild(this.container);
    }

    createUI() {
        const title = document.createElement('h1');
        title.textContent = 'Select Your Vehicle';
        title.style.cssText = `
            color: white;
            font-size: 2.5em;
            margin-bottom: 2em;
        `;
        this.container.appendChild(title);

        const vehicles = this.game.vehicleFactory.getAvailableVehicles();
        const vehicleContainer = document.createElement('div');
        vehicleContainer.style.cssText = `
            display: flex;
            gap: 2em;
            flex-wrap: wrap;
            justify-content: center;
            max-width: 1200px;
        `;

        vehicles.forEach(vehicle => {
            const card = this.createVehicleCard(vehicle);
            vehicleContainer.appendChild(card);
        });

        this.container.appendChild(vehicleContainer);
    }

    createVehicleCard(vehicle) {
        const card = document.createElement('div');
        card.className = 'vehicle-card';
        card.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            padding: 2em;
            border-radius: 10px;
            color: white;
            cursor: pointer;
            transition: transform 0.2s;
            width: 300px;
        `;

        card.innerHTML = `
            <h2 style="margin-top: 0;">${vehicle.name}</h2>
            <p>${vehicle.description}</p>
            <div class="stats" style="margin-top: 1em;">
                <div>Speed: ${this.createStatBar(vehicle.stats.speed)}</div>
                <div>Handling: ${this.createStatBar(vehicle.stats.handling)}</div>
                <div>Durability: ${this.createStatBar(vehicle.stats.durability)}</div>
            </div>
        `;

        card.addEventListener('click', () => {
            this.selectVehicle(vehicle.id);
        });

        card.addEventListener('mouseenter', () => {
            card.style.transform = 'scale(1.05)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1)';
        });

        return card;
    }

    createStatBar(value) {
        const max = 10;
        const filled = '█'.repeat(value);
        const empty = '░'.repeat(max - value);
        return `<span style="color: #4CAF50">${filled}</span><span style="color: #666">${empty}</span>`;
    }

    selectVehicle(vehicleId) {
        this.game.selectVehicle(vehicleId);
        this.container.style.display = 'none';
    }

    show() {
        this.container.style.display = 'flex';
    }

    hide() {
        this.container.style.display = 'none';
    }
} 