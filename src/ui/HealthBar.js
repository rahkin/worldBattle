export class HealthBar {
    constructor() {
        this.element = document.createElement('div');
        this.element.id = 'health-bar';
        this.element.className = 'hud-element';
        this.element.innerHTML = `
            <div class="health-bar-fill"></div>
            <div class="health-text">Health: 100%</div>
            <div class="respawn-counter" style="display: none;">Respawn in: 10</div>
        `;
        document.getElementById('game-ui').appendChild(this.element);
    }

    update(currentHealth, maxHealth) {
        const percentage = (currentHealth / maxHealth) * 100;
        const fillElement = this.element.querySelector('.health-bar-fill');
        const textElement = this.element.querySelector('.health-text');
        
        fillElement.style.width = `${percentage}%`;
        textElement.textContent = `Health: ${Math.round(percentage)}%`;

        // Color interpolation from green to red
        let color;
        if (percentage > 50) {
            const g = 255;
            const r = Math.floor(255 * (1 - (percentage - 50) / 50));
            color = `rgb(${r}, ${g}, 0)`;
        } else {
            const r = 255;
            const g = Math.floor(255 * (percentage / 50));
            color = `rgb(${r}, ${g}, 0)`;
        }
        fillElement.style.backgroundColor = color;
    }

    setVisible(visible) {
        this.element.style.display = visible ? 'block' : 'none';
    }

    showRespawnCounter(seconds) {
        const counterElement = this.element.querySelector('.respawn-counter');
        counterElement.style.display = 'block';
        counterElement.textContent = `Respawn in: ${Math.ceil(seconds)}`;
    }

    updateRespawnCounter(seconds) {
        const counterElement = this.element.querySelector('.respawn-counter');
        counterElement.textContent = `Respawn in: ${Math.ceil(seconds)}`;
    }

    hideRespawnCounter() {
        const counterElement = this.element.querySelector('.respawn-counter');
        counterElement.style.display = 'none';
    }

    cleanup() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
} 