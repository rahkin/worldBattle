export class HealthBar {
    constructor() {
        this.element = document.createElement('div');
        this.element.id = 'health-bar';
        this.element.className = 'hud-element';
        this.element.innerHTML = `
            <div class="health-bar-container">
                <div class="health-bar-fill"></div>
                <div class="health-text">100%</div>
            </div>
        `;
        document.getElementById('game-ui').appendChild(this.element);
    }

    update(currentHealth, maxHealth) {
        const percentage = (currentHealth / maxHealth) * 100;
        const fillElement = this.element.querySelector('.health-bar-fill');
        const textElement = this.element.querySelector('.health-text');
        
        fillElement.style.width = `${percentage}%`;
        textElement.textContent = `${Math.round(percentage)}%`;

        // Color transitions based on health percentage
        let color;
        if (percentage > 75) {
            color = '#2ecc71'; // Healthy green
        } else if (percentage > 50) {
            color = '#f1c40f'; // Warning yellow
        } else if (percentage > 25) {
            color = '#e67e22'; // Orange
        } else {
            color = '#e74c3c'; // Critical red
        }
        
        fillElement.style.backgroundColor = color;
        // Add glow effect for low health
        if (percentage <= 25) {
            fillElement.style.boxShadow = `0 0 10px ${color}`;
        } else {
            fillElement.style.boxShadow = 'none';
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
    }
} 