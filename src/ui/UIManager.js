import { HealthBar } from './HealthBar.js';
import { AmmoDisplay } from './AmmoDisplay.js';
import { MineDisplay } from './MineDisplay.js';
import { PowerUpDisplay } from './PowerUpDisplay.js';
import { VehicleSelectionUI } from './VehicleSelectionUI.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.healthBar = null;
        this.ammoDisplay = null;
        this.mineDisplay = null;
        this.powerUpDisplay = null;
        this.vehicleSelectionUI = null;
    }

    async init() {
        try {
            // Initialize UI components
            this.healthBar = new HealthBar();
            this.ammoDisplay = new AmmoDisplay();
            this.mineDisplay = new MineDisplay();
            this.powerUpDisplay = new PowerUpDisplay();
            this.vehicleSelectionUI = new VehicleSelectionUI(this.game);

            // Initialize components
            await this.healthBar.init();
            await this.ammoDisplay.init();
            await this.mineDisplay.init();
            await this.powerUpDisplay.init();
            await this.vehicleSelectionUI.init();

            // Show vehicle selection UI initially
            this.vehicleSelectionUI.show();
        } catch (error) {
            console.error('Error initializing UI components:', error);
            throw error;
        }
    }

    update(deltaTime) {
        if (this.game.playerVehicleEntity) {
            const vehicleComponent = this.game.playerVehicleEntity.getComponent('vehicle');
            if (vehicleComponent) {
                this.updateUI(vehicleComponent);
            }
        }
    }

    updateUI(vehicle) {
        if (!vehicle) return;

        // Update health display
        if (this.healthBar) {
            this.healthBar.update(
                vehicle.health ?? 100,
                vehicle.maxHealth ?? 100
            );
        }

        // Update ammo display
        if (this.ammoDisplay) {
            this.ammoDisplay.updateAmmo(vehicle.ammo ?? 0);
        }

        // Update mine display
        if (this.mineDisplay) {
            const mines = vehicle.mines ?? [];
            this.mineDisplay.updateCount(mines.length, vehicle.maxMines ?? 3);
        }

        // Update power-up display
        if (this.powerUpDisplay) {
            this.powerUpDisplay.update(vehicle.activePowerUps ?? []);
        }
    }

    dispose() {
        // Clean up UI components
        if (this.healthBar) this.healthBar.cleanup();
        if (this.ammoDisplay) this.ammoDisplay.cleanup();
        if (this.mineDisplay) this.mineDisplay.cleanup();
        if (this.powerUpDisplay) this.powerUpDisplay.cleanup();
        if (this.vehicleSelectionUI) this.vehicleSelectionUI.cleanup();

        // Clear references
        this.healthBar = null;
        this.ammoDisplay = null;
        this.mineDisplay = null;
        this.powerUpDisplay = null;
        this.vehicleSelectionUI = null;
    }
} 