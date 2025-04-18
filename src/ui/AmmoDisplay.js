/**
 * Represents an ammo display component in the game's HUD.
 * Shows the current ammo count for the player's vehicle.
 */
export class AmmoDisplay {
    constructor() {
        this.element = null;
        this.ammoCount = 0;
    }

    init() {
        // Create container
        this.element = document.createElement('div');
        this.element.className = 'ammo-display';
        this.element.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid #fff;
            border-radius: 5px;
            color: #fff;
            font-family: Arial, sans-serif;
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        // Create ammo icon
        const icon = document.createElement('div');
        icon.innerHTML = '🎯'; // Using emoji as placeholder
        icon.style.fontSize = '24px';

        // Create ammo count
        this.countElement = document.createElement('span');
        this.countElement.textContent = this.ammoCount;

        this.element.appendChild(icon);
        this.element.appendChild(this.countElement);

        // Add to UI container
        const uiContainer = document.getElementById('ui-container');
        if (uiContainer) {
            uiContainer.appendChild(this.element);
        }
    }

    /**
     * Updates the displayed ammo count.
     * @param {number} count - Current ammo count
     */
    updateAmmo(count) {
        if (!this.countElement) return;
        this.ammoCount = count;
        this.countElement.textContent = count;
    }

    /**
     * Removes the ammo display from the DOM.
     * Should be called when the component is no longer needed.
     */
    cleanup() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.countElement = null;
    }
} 