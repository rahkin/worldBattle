import { Component } from '../core/Component.js';

export class BuildingComponent extends Component {
    constructor() {
        super();
        this.height = 0;
        this.type = 'unknown';
        this.material = 'concrete';
        this.windows = false;
        this.doors = [];
        this.isCollapsed = false;
        this.health = 100;
        this.maxHealth = 100;
        this.damageThreshold = 30;
        this.collapseTime = 0;
    }

    init(properties) {
        this.height = properties.height || 10;
        this.type = properties.building || 'unknown';
        this.material = properties.material || 'concrete';
        this.windows = properties.windows || false;
        this.health = this.maxHealth = properties.health || 100;
        this.damageThreshold = properties.damageThreshold || 30;
        
        // Parse door positions if available
        if (properties.doors) {
            this.doors = properties.doors.map(door => ({
                position: door.position,
                width: door.width || 1,
                height: door.height || 2
            }));
        }
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        
        if (this.health <= this.damageThreshold && !this.isCollapsed) {
            this.collapse();
        }
        
        return this.health <= 0;
    }

    collapse() {
        this.isCollapsed = true;
        this.collapseTime = Date.now();
        
        // Trigger collapse animation and effects
        const entity = this.getEntity();
        if (entity.hasComponent('Mesh')) {
            const mesh = entity.getComponent('Mesh').mesh;
            // Add collapse animation or particle effects here
        }
    }

    update(deltaTime) {
        if (this.isCollapsed) {
            // Update collapse animation
            const collapseProgress = (Date.now() - this.collapseTime) / 1000;
            if (collapseProgress > 2) { // Collapse animation duration
                // Remove the building or mark it for cleanup
                this.getEntity().markForRemoval();
            }
        }
    }

    getDamageState() {
        if (this.health >= this.maxHealth * 0.8) return 'intact';
        if (this.health >= this.maxHealth * 0.5) return 'damaged';
        if (this.health >= this.maxHealth * 0.2) return 'severely_damaged';
        return 'destroyed';
    }

    getDoorPositions() {
        return this.doors.map(door => door.position);
    }

    dispose() {
        this.doors = [];
        this.isCollapsed = false;
        this.health = this.maxHealth;
    }
} 