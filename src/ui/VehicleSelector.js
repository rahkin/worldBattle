export class VehicleSelector {
    constructor(game) {
        this.game = game;
        this.element = document.createElement('div');
        this.element.id = 'vehicle-selector';
        this.element.className = 'vehicle-selector';
        
        // Set proper z-index and initial styles
        this.element.style.position = 'fixed';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.element.style.display = 'none';
        this.element.style.zIndex = '1000';  // Above game canvas (0) but below loading indicator (2000)
        this.element.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        this.element.style.overflow = 'auto';
        this.element.style.padding = '20px';
        this.element.style.boxSizing = 'border-box';
        this.element.style.backdropFilter = 'blur(5px)';

        // Create title
        const title = document.createElement('h1');
        title.textContent = 'Select Your Vehicle';
        this.element.appendChild(title);

        // Create vehicle grid container
        const gridContainer = document.createElement('div');
        gridContainer.className = 'vehicle-grid';

        const vehicles = [
            {
                id: 'muscle',
                name: 'Muscle Car',
                description: 'Fast and agile with boost capability',
                stats: { speed: 8, handling: 7, durability: 6 },
                color: '#ff4444',
                special: 'Nitro Boost'
            },
            {
                id: 'scorpion',
                name: 'Scorpion',
                description: 'Lightweight and fast, but fragile',
                stats: { speed: 9, handling: 8, durability: 4 },
                color: '#44ff44',
                special: 'Double Jump'
            },
            {
                id: 'drone',
                name: 'Quantum Racer',
                description: 'Futuristic hover vehicle with extreme speed',
                stats: { speed: 10, handling: 9, durability: 3 },
                color: '#4444ff',
                special: 'Teleport'
            },
            {
                id: 'tank',
                name: 'Light Tank',
                description: 'Light armored tank with good mobility and firepower',
                stats: { speed: 6, handling: 7, durability: 7 },
                color: '#44ffff',
                special: 'Shield'
            },
            {
                id: 'ironclad',
                name: 'Ironclad',
                description: 'Heavily armored but slower',
                stats: { speed: 4, handling: 5, durability: 9 },
                color: '#ffff44',
                special: 'Ram Attack'
            },
            {
                id: 'junkyard',
                name: 'Junkyard King',
                description: 'Durable and reliable, built from scrap',
                stats: { speed: 5, handling: 6, durability: 8 },
                color: '#ff44ff',
                special: 'Self Repair'
            }
        ];

        vehicles.forEach(vehicle => {
            const card = document.createElement('div');
            card.className = 'vehicle-card';
                card.style.borderColor = vehicle.color;

            // Vehicle name
            const name = document.createElement('h2');
            name.className = 'vehicle-name';
            name.textContent = vehicle.name;

            // Vehicle description
            const description = document.createElement('p');
            description.className = 'vehicle-description';
            description.textContent = vehicle.description;

            // Special ability
            const special = document.createElement('div');
            special.className = 'vehicle-special';
            special.innerHTML = `<span style="color: ${vehicle.color}">Special: ${vehicle.special}</span>`;
            special.style.fontSize = '14px';
            special.style.marginBottom = '10px';

            // Stats container
            const stats = document.createElement('div');
            stats.className = 'vehicle-stats';

            // Add stats bars
            const statTypes = ['speed', 'handling', 'durability'];
            statTypes.forEach(statType => {
                const statContainer = document.createElement('div');
                statContainer.className = 'stat-container';

                const label = document.createElement('div');
                label.className = 'stat-label';
                label.textContent = statType.charAt(0).toUpperCase() + statType.slice(1);

                const bar = document.createElement('div');
                bar.className = 'stat-bar';

                const fill = document.createElement('div');
                fill.className = 'stat-fill';
                fill.style.width = `${(vehicle.stats[statType] / 10) * 100}%`;
                fill.style.backgroundColor = vehicle.color;

                bar.appendChild(fill);
                statContainer.appendChild(label);
                statContainer.appendChild(bar);
                stats.appendChild(statContainer);
            });

            // Assemble card
            card.appendChild(name);
            card.appendChild(description);
            card.appendChild(special);
            card.appendChild(stats);

            // Click handler
            card.onclick = () => {
                this.selectVehicle(vehicle);
            };

            gridContainer.appendChild(card);
        });

        this.element.appendChild(gridContainer);
        document.body.appendChild(this.element);
    }

    async selectVehicle(vehicle) {
        console.log('Selecting vehicle:', vehicle.id);
        
        // Prevent any further clicks
        const cards = document.querySelectorAll('.vehicle-card');
        cards.forEach(card => {
            card.style.pointerEvents = 'none';
            card.style.opacity = '0.5';
            card.style.transform = 'scale(0.95)';
        });

        const selectedCard = event.currentTarget;
        selectedCard.style.opacity = '1';
        selectedCard.style.transform = 'scale(1.1)';

        // Stop event propagation
        event.stopPropagation();
        event.preventDefault();

        try {
            // Show loading indicator if available
            if (this.game.loadingIndicator) {
                await this.game.loadingIndicator.show();
                await this.game.loadingIndicator.updateProgress(80, 'Spawning vehicle...', 'Creating vehicle components');
            }

            // Wait for animation
            await new Promise(resolve => setTimeout(resolve, 500));

            // Hide selector first
            await this.hide();

            // Create vehicle
            const createdVehicle = await this.game.selectVehicle(vehicle.id);
            if (!createdVehicle) {
                throw new Error('Failed to create vehicle');
            }

            // Update loading indicator
            if (this.game.loadingIndicator) {
                await this.game.loadingIndicator.updateProgress(100, 'Ready!', 'Vehicle spawned successfully');
                await this.game.loadingIndicator.hide();
            }
        } catch (error) {
            console.error('Error in vehicle selection:', error);
            // Re-enable cards in case of error
            cards.forEach(card => {
                card.style.pointerEvents = 'auto';
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            });
            
            // Show error in loading indicator
            if (this.game.loadingIndicator) {
                await this.game.loadingIndicator.updateProgress(100, 'Error', `Failed to spawn vehicle: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                await this.game.loadingIndicator.hide();
            }
        }
    }

    show() {
        console.log('Showing vehicle selector');
        return new Promise((resolve) => {
            // Reset styles before showing
            this.element.style.transition = 'none';
            this.element.style.opacity = '0';
            this.element.style.transform = 'scale(0.95)';
            this.element.style.display = 'flex';
            
            // Force a reflow
            void this.element.offsetHeight;
            
            // Add transition and animate in
            requestAnimationFrame(() => {
                this.element.style.transition = 'all 0.3s ease';
                this.element.style.opacity = '1';
                this.element.style.transform = 'scale(1)';
                setTimeout(resolve, 300);
            });
        });
    }

    hide() {
        console.log('Hiding vehicle selector');
        return new Promise((resolve) => {
            // Add exit animation
            this.element.style.opacity = '0';
            this.element.style.transform = 'scale(0.95)';
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                console.log('Vehicle selector transition complete, setting display none');
        this.element.style.display = 'none';
                // Force a reflow
                void this.element.offsetHeight;
                resolve();
            }, 300);
        });
    }

    cleanup() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
} 