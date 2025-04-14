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
            <div class="mine-icon">💣</div>
            <div class="mine-count">0</div>
            <div class="mine-max">/ 5</div>
        `;
        document.getElementById('game-ui').appendChild(this.element);
    }

    /**
     * Updates the displayed mine count.
     * @param {number} count - Current number of available mines
     * @param {number} maxCount - Maximum number of mines
     */
    updateCount(count, maxCount) {
        const countElement = this.element.querySelector('.mine-count');
        const maxElement = this.element.querySelector('.mine-max');
        countElement.textContent = count;
        maxElement.textContent = `/ ${maxCount}`;
        
        // Change color based on mine count
        if (count === 0) {
            this.element.style.color = '#ff4444';
        } else if (count < maxCount) {
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
    }
}