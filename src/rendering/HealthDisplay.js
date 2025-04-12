export class HealthDisplay {
    constructor() {
        this.healthBar = null;
        this.healthText = null;
        this.container = null;
        
        this._createHealthDisplay();
    }

    _createHealthDisplay() {
        // Create container div
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '20px';
        this.container.style.left = '20px';
        this.container.style.width = '200px';
        this.container.style.height = '40px';
        this.container.style.zIndex = '1000';
        
        // Create health bar background
        const background = document.createElement('div');
        background.style.position = 'absolute';
        background.style.width = '100%';
        background.style.height = '20px';
        background.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        background.style.borderRadius = '10px';
        this.container.appendChild(background);
        
        // Create health bar
        this.healthBar = document.createElement('div');
        this.healthBar.style.position = 'absolute';
        this.healthBar.style.width = '100%';
        this.healthBar.style.height = '20px';
        this.healthBar.style.backgroundColor = '#00ff00';
        this.healthBar.style.borderRadius = '10px';
        this.healthBar.style.transition = 'width 0.3s ease, background-color 0.3s ease';
        this.container.appendChild(this.healthBar);
        
        // Create health text
        this.healthText = document.createElement('div');
        this.healthText.style.position = 'absolute';
        this.healthText.style.top = '25px';
        this.healthText.style.width = '100%';
        this.healthText.style.textAlign = 'center';
        this.healthText.style.color = 'white';
        this.healthText.style.fontFamily = 'Arial';
        this.healthText.style.fontSize = '16px';
        this.healthText.style.textShadow = '1px 1px 2px black';
        this.healthText.textContent = '100%';
        this.container.appendChild(this.healthText);
        
        // Add to document
        document.body.appendChild(this.container);
    }

    update(health, maxHealth) {
        if (!this.healthBar || !this.healthText) return;
        
        // Update health bar width
        const healthPercentage = health / maxHealth;
        this.healthBar.style.width = `${healthPercentage * 100}%`;
        
        // Update health bar color based on health
        let color;
        if (healthPercentage > 0.6) {
            color = '#00ff00'; // Green
        } else if (healthPercentage > 0.3) {
            color = '#ffff00'; // Yellow
        } else {
            color = '#ff0000'; // Red
        }
        this.healthBar.style.backgroundColor = color;
        
        // Update health text
        this.healthText.textContent = `${Math.round(healthPercentage * 100)}%`;
    }

    setVisible(visible) {
        if (this.container) {
            this.container.style.display = visible ? 'block' : 'none';
        }
    }
} 