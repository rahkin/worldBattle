/**
 * Represents a mine display component in the game's HUD.
 * Shows the current mine count and provides a visual indicator for mine availability.
 */
export class MineDisplay {
    /**
     * Creates a new MineDisplay instance.
     * Initializes the display with a mine icon and count indicator.
     */
    constructor() {
        this.element = document.createElement('div');
        this.element.id = 'mine-display';
        this.element.className = 'hud-element';
        this.element.innerHTML = `
            <div class="mine-icon"></div>
            <div class="mine-count">0</div>
        `;
        document.getElementById('game-ui').appendChild(this.element);
    }

    /**
     * Updates the displayed mine count.
     * @param {number} count - Current number of available mines
     */
    updateCount(count) {
        const countElement = this.element.querySelector('.mine-count');
        countElement.textContent = count;
    }

    /**
     * Sets the visibility of the mine display.
     * @param {boolean} visible - Whether the display should be visible
     */
    setVisible(visible) {
        this.element.style.display = visible ? 'block' : 'none';
    }

    /**
     * Removes the mine display from the DOM.
     * Should be called when the component is no longer needed.
     */
    cleanup() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}