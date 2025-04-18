/**
 * Represents a mine display component in the game's HUD.
 * Shows the current mine count and provides a visual indicator for mine availability.
 */
export class MineDisplay {
    constructor() {
        this.element = null;
        this.countElement = null;
        this.maxElement = null;
    }

    init() {
        // Create container
        this.element = document.createElement('div');
        this.element.className = 'mine-display';
        this.element.style.cssText = `
            position: absolute;
            bottom: 60px;
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

        // Create mine icon
        const icon = document.createElement('div');
        icon.innerHTML = '💣'; // Using emoji as placeholder
        icon.style.fontSize = '24px';

        // Create count display
        this.countElement = document.createElement('span');
        this.maxElement = document.createElement('span');
        const separator = document.createElement('span');
        separator.textContent = '/';

        this.countElement.textContent = '0';
        this.maxElement.textContent = '3';

        this.element.appendChild(icon);
        this.element.appendChild(this.countElement);
        this.element.appendChild(separator);
        this.element.appendChild(this.maxElement);

        // Add to UI container
        const uiContainer = document.getElementById('ui-container');
        if (uiContainer) {
            uiContainer.appendChild(this.element);
        }
    }

    /**
     * Updates the displayed mine count.
     * @param {number} count - Current number of available mines
     * @param {number} max - Maximum number of mines
     */
    updateCount(count, max) {
        if (!this.countElement || !this.maxElement) return;
        this.countElement.textContent = count;
        this.maxElement.textContent = max;
        
        // Change color based on mine count
        if (count === 0) {
            this.element.style.color = '#ff4444';
        } else if (count < max) {
            this.element.style.color = '#ffaa44';
        } else {
            this.element.style.color = '#ffffff';
        }
    }

    /**
     * Sets the visibility of the mine display.
     * @param {boolean} visible - Whether the display should be visible
     */
    setVisible(visible) {
        this.element.style.display = visible ? 'flex' : 'none';
    }

    /**
     * Removes the mine display from the DOM.
     * Should be called when the component is no longer needed.
     */
    cleanup() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.countElement = null;
        this.maxElement = null;
    }
}