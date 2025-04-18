export class HealthBar {
    constructor() {
        this.maxHealth = 100;
        this.currentHealth = 100;
        this.element = null;
        this.bar = null;
    }

    init() {
        // Create container
        this.element = document.createElement('div');
        this.element.className = 'health-bar-container';
        this.element.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            width: 200px;
            height: 20px;
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid #fff;
            border-radius: 10px;
            overflow: hidden;
        `;

        // Create health bar
        this.bar = document.createElement('div');
        this.bar.className = 'health-bar';
        this.bar.style.cssText = `
            width: 100%;
            height: 100%;
            background: linear-gradient(to right, #ff0000, #00ff00);
            transition: width 0.3s ease-in-out;
        `;

        this.element.appendChild(this.bar);

        // Add to UI container
        const uiContainer = document.getElementById('ui-container');
        if (uiContainer) {
            uiContainer.appendChild(this.element);
        }
    }

    update(currentHealth, maxHealth = 100) {
        if (!this.bar) return;
        
        this.currentHealth = currentHealth;
        this.maxHealth = maxHealth;
        
        const healthPercentage = (currentHealth / maxHealth) * 100;
        this.bar.style.width = `${healthPercentage}%`;
        
        // Update color based on health percentage
        if (healthPercentage > 60) {
            this.bar.style.background = '#00ff00'; // Green
        } else if (healthPercentage > 30) {
            this.bar.style.background = '#ffff00'; // Yellow
        } else {
            this.bar.style.background = '#ff0000'; // Red
        }
    }

    setVisible(visible) {
        this.element.style.display = visible ? 'block' : 'none';
    }

    showRespawnCounter(seconds) {
        const counterElement = this.element.querySelector('.respawn-counter');
        if (!counterElement) {
            const counter = document.createElement('div');
            counter.className = 'respawn-counter';
            this.element.appendChild(counter);
        }
        counterElement.style.display = 'block';
        counterElement.textContent = `Respawn in: ${Math.ceil(seconds)}`;
    }

    hideRespawnCounter() {
        const counterElement = this.element.querySelector('.respawn-counter');
        if (counterElement) {
            counterElement.style.display = 'none';
        }
    }

    cleanup() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.bar = null;
    }
} 