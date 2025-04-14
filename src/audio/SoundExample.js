import { SoundManager } from './SoundManager.js';

export class SoundExample {
    constructor() {
        this.soundManager = new SoundManager();
    }

    // Example: Playing vehicle sounds
    playVehicleSounds(vehicleType, position) {
        // Play engine idle sound (looped)
        this.soundManager.play(`${vehicleType}_engine_idle`, {
            position,
            loop: true,
            volume: 0.5
        });

        // Play acceleration sound
        this.soundManager.play(`${vehicleType}_engine_accelerate`, {
            position,
            pitch: 1.2
        });
    }

    // Example: Playing weapon sounds
    playWeaponSounds(position) {
        // Play projectile launch
        this.soundManager.play('projectile_launch', {
            position,
            volume: 0.8
        });

        // Play weapon empty sound
        this.soundManager.play('weapon_empty', {
            position,
            volume: 0.6
        });
    }

    // Example: Playing power-up sounds
    playPowerUpSounds(powerUpType, position) {
        // Play pickup sound
        this.soundManager.play('pickup', {
            position,
            volume: 0.7
        });

        // Play activation sound if applicable
        if (powerUpType === 'speed') {
            this.soundManager.play('speed_activate', {
                position,
                volume: 0.8
            });
        }
    }

    // Example: Playing environment sounds
    playEnvironmentSounds(weatherType) {
        if (weatherType === 'rain') {
            this.soundManager.play('rain_light', {
                loop: true,
                volume: 0.4
            });
        }
    }

    // Example: Playing damage sounds
    playDamageSounds(damageType, position) {
        switch (damageType) {
            case 'light':
                this.soundManager.play('damage_light', {
                    position,
                    volume: 0.5
                });
                break;
            case 'critical':
                this.soundManager.play('damage_critical', {
                    position,
                    volume: 0.9
                });
                break;
        }
    }

    // Example: Playing UI sounds
    playUISounds(action) {
        switch (action) {
            case 'hover':
                this.soundManager.play('menu_hover', {
                    volume: 0.3
                });
                break;
            case 'select':
                this.soundManager.play('menu_select', {
                    volume: 0.5
                });
                break;
        }
    }

    // Example: Adjusting volumes
    adjustVolumes() {
        // Set master volume
        this.soundManager.setMasterVolume(0.8);

        // Set category volumes
        this.soundManager.setCategoryVolume('vehicles', 0.7);
        this.soundManager.setCategoryVolume('ui', 0.5);
    }

    // Example: Cleanup
    cleanup() {
        this.soundManager.cleanup();
    }
} 