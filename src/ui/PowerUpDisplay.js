import * as THREE from 'three';

export class PowerUpDisplay {
    constructor() {
        this.element = null;
        this.activePowerUps = new Map();
    }

    init() {
        // Create container
        this.element = document.createElement('div');
        this.element.className = 'powerup-display';
        this.element.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;

        // Add to UI container
        const uiContainer = document.getElementById('ui-container');
        if (uiContainer) {
            uiContainer.appendChild(this.element);
        }
    }

    update(activePowerUps) {
        if (!this.element) return;

        // Clear existing power-ups
        this.element.innerHTML = '';

        // Add each active power-up
        activePowerUps.forEach((powerUp, id) => {
            const powerUpElement = document.createElement('div');
            powerUpElement.className = 'powerup-item';
            powerUpElement.style.cssText = `
                padding: 10px;
                background: rgba(0, 0, 0, 0.5);
                border: 2px solid #fff;
                border-radius: 5px;
                color: #fff;
                font-family: Arial, sans-serif;
                font-size: 16px;
                display: flex;
                align-items: center;
                gap: 10px;
            `;

            // Icon based on power-up type
            const icon = document.createElement('span');
            switch (powerUp.type) {
                case 'speed':
                    icon.innerHTML = '⚡';
                    powerUpElement.style.borderColor = '#ffff00';
                    break;
                case 'damage':
                    icon.innerHTML = '💥';
                    powerUpElement.style.borderColor = '#ff0000';
                    break;
                case 'defense':
                    icon.innerHTML = '🛡️';
                    powerUpElement.style.borderColor = '#0000ff';
                    break;
                case 'ammo':
                    icon.innerHTML = '🎯';
                    powerUpElement.style.borderColor = '#00ff00';
                    break;
                default:
                    icon.innerHTML = '⭐';
            }
            icon.style.fontSize = '24px';

            // Timer
            const timer = document.createElement('span');
            timer.textContent = Math.ceil(powerUp.remainingTime);

            powerUpElement.appendChild(icon);
            powerUpElement.appendChild(timer);
            this.element.appendChild(powerUpElement);
        });
    }

    cleanup() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.activePowerUps.clear();
    }
} 