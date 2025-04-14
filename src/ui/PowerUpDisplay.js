import * as THREE from 'three';

export class PowerUpDisplay {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.container = document.createElement('div');
        this.container.id = 'power-up-display';
        this.container.style.position = 'fixed';
        this.container.style.top = '20px';
        this.container.style.right = '20px';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '10px';
        this.container.style.zIndex = '1000';
        document.body.appendChild(this.container);

        // Map to store active power-ups and their timers
        this.activePowerUps = new Map();

        // Style for power-up items
        const style = document.createElement('style');
        style.textContent = `
            .power-up-item {
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 10px;
                border-radius: 5px;
                display: flex;
                align-items: center;
                gap: 10px;
                font-family: Arial, sans-serif;
                min-width: 150px;
                position: relative;
            }
            .power-up-icon {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
            }
            .power-up-timer {
                margin-left: auto;
                font-weight: bold;
            }
            .power-up-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: #4CAF50;
                transition: width 0.1s linear;
            }
        `;
        document.head.appendChild(style);
    }

    addPowerUp(type, duration) {
        // Remove existing power-up of the same type if it exists
        if (this.activePowerUps.has(type)) {
            this.removePowerUp(type);
        }

        // Create power-up display element
        const element = document.createElement('div');
        element.className = 'power-up-item';
        element.dataset.type = type;

        // Create icon
        const icon = document.createElement('div');
        icon.className = 'power-up-icon';
        icon.style.background = this.getPowerUpColor(type);
        icon.textContent = this.getPowerUpIcon(type);

        // Create label
        const label = document.createElement('span');
        label.textContent = this.getPowerUpLabel(type);

        // Create timer
        const timer = document.createElement('span');
        timer.className = 'power-up-timer';

        // Create progress bar
        const progress = document.createElement('div');
        progress.className = 'power-up-progress';
        progress.style.width = '100%';

        // Assemble elements
        element.appendChild(icon);
        element.appendChild(label);
        element.appendChild(timer);
        element.appendChild(progress);
        this.container.appendChild(element);

        // Store power-up info
        const startTime = Date.now();
        const powerUpInfo = {
            element,
            timer,
            progress,
            startTime,
            duration,
            updateInterval: setInterval(() => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, duration - elapsed);
                const percent = (remaining / duration) * 100;

                timer.textContent = (remaining / 1000).toFixed(1) + 's';
                progress.style.width = percent + '%';

                if (remaining <= 0) {
                    this.removePowerUp(type);
                }
            }, 100)
        };

        this.activePowerUps.set(type, powerUpInfo);
    }

    removePowerUp(type) {
        const powerUpInfo = this.activePowerUps.get(type);
        if (powerUpInfo) {
            clearInterval(powerUpInfo.updateInterval);
            powerUpInfo.element.remove();
            this.activePowerUps.delete(type);
        }
    }

    getPowerUpColor(type) {
        const colors = {
            health: '#4CAF50',
            speed: '#2196F3',
            weapon: '#F44336',
            shield: '#9C27B0',
            ammo: '#FF9800',
            overcharge: '#FF00FF'
        };
        return colors[type] || '#FFFFFF';
    }

    getPowerUpIcon(type) {
        const icons = {
            health: '❤️',
            speed: '⚡',
            weapon: '🎯',
            shield: '🛡️',
            ammo: '🔫',
            overcharge: '💥'
        };
        return icons[type] || '✨';
    }

    getPowerUpLabel(type) {
        const labels = {
            health: 'Health',
            speed: 'Speed Boost',
            weapon: 'Weapon Overcharge',
            shield: 'Shield',
            ammo: 'Ammo',
            overcharge: 'Overcharge'
        };
        return labels[type] || type;
    }

    update(deltaTime) {
        // Update all active power-ups
        for (const [type, info] of this.activePowerUps) {
            const elapsed = Date.now() - info.startTime;
            const remaining = Math.max(0, info.duration - elapsed);
            const percent = (remaining / info.duration) * 100;

            info.timer.textContent = (remaining / 1000).toFixed(1) + 's';
            info.progress.style.width = percent + '%';

            if (remaining <= 0) {
                this.removePowerUp(type);
            }
        }
    }

    cleanup() {
        // Clear all intervals
        for (const [type, info] of this.activePowerUps) {
            clearInterval(info.updateInterval);
            info.element.remove();
        }
        this.activePowerUps.clear();
        this.container.remove();
    }
} 