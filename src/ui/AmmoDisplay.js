/**
 * Represents an ammo display component in the game's HUD.
 * Shows the current ammo count for the player's vehicle.
 */
export class AmmoDisplay {
    /**
     * Creates a new AmmoDisplay instance.
     * Initializes a simple text display showing the ammo count.
     */
    constructor() {
        this.element = document.createElement('div');
        this.element.id = 'ammo-display';
        this.element.className = 'hud-element';
        this.element.textContent = 'Ammo: 0';
        document.getElementById('game-ui').appendChild(this.element);
    }

    /**
     * Updates the displayed ammo count.
     * @param {number} ammo - Current ammo count
     */
    updateAmmo(ammo) {
        this.element.textContent = `Ammo: ${ammo}`;
    }

    /**
     * Sets the visibility of the ammo display.
     * @param {boolean} visible - Whether the display should be visible
     */
    setVisible(visible) {
        this.element.style.display = visible ? 'block' : 'none';
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