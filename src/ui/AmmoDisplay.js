/**
 * Represents an ammo display component in the game's HUD.
 * Shows the current ammo count for the player's vehicle.
 */
export class AmmoDisplay {
    /**
     * Creates a new AmmoDisplay instance.
     * Initializes a display with an icon and ammo count.
     */
    constructor() {
        this.element = document.createElement('div');
        this.element.id = 'ammo-display';
        this.element.className = 'hud-element';
        this.element.innerHTML = `
            <div class="ammo-icon">🔫</div>
            <div class="ammo-count">0</div>
        `;
        document.getElementById('game-ui').appendChild(this.element);
    }

    /**
     * Updates the displayed ammo count.
     * @param {number} ammo - Current ammo count
     */
    updateAmmo(ammo) {
        const countElement = this.element.querySelector('.ammo-count');
        countElement.textContent = ammo;
    }

    /**
     * Sets the visibility of the ammo display.
     * @param {boolean} visible - Whether the display should be visible
     */
    setVisible(visible) {
        this.element.style.display = visible ? 'flex' : 'none';
    }

    /**
     * Removes the ammo display from the DOM.
     * Should be called when the component is no longer needed.
     */
    cleanup() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
} 