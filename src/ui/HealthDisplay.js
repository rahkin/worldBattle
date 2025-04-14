/**
 * Represents a health display component in the game's HUD.
 * Displays a health bar with a percentage and changes color based on health level.
 */
export class HealthDisplay {
    /**
     * Creates a new HealthDisplay instance.
     * Initializes the health bar UI element with a fill bar and percentage text.
     */
    constructor() {
        this.element = document.createElement('div');
        this.element.id = 'health-display';
        this.element.className = 'hud-element';
        this.element.innerHTML = `
            <div class="health-bar">
                <div class="health-fill"></div>
            </div>
            <div class="health-text">Health: 100%</div>
        `;
        document.getElementById('game-ui').appendChild(this.element);
        
        this.healthText = this.element.querySelector('.health-text');
        this.healthFill = this.element.querySelector('.health-fill');
    }

    /**
     * Updates the health display with new health values.
     * Changes the fill bar width and color based on health percentage.
     * @param {number} health - Current health value
     * @param {number} maxHealth - Maximum possible health value
     */
    update(health, maxHealth) {
        if (!this.healthText || !this.healthFill) return;
        
        const percentage = (health / maxHealth) * 100;
        this.healthText.textContent = `Health: ${Math.round(percentage)}%`;
        this.healthFill.style.width = `${percentage}%`;
        
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
        this.healthFill.style.backgroundColor = color;
    }

    /**
     * Sets the visibility of the health display.
     * @param {boolean} visible - Whether the display should be visible
     */
    setVisible(visible) {
        this.element.style.display = visible ? 'block' : 'none';
    }

    /**
     * Removes the health display from the DOM.
     * Should be called when the component is no longer needed.
     */
    cleanup() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
} 