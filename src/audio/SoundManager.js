import { Howl, Howler } from 'howler';

export class SoundManager {
    constructor() {
        this.sounds = new Map();
        this.categories = {
            vehicles: 1.0,
            weapons: 1.0,
            powerups: 1.0,
            environment: 1.0,
            damage: 1.0,
            ui: 1.0
        };
        this.masterVolume = 1.0;
        this.muted = false;
        this.soundPool = new Map();
        this.initializeSounds();
    }

    initializeSounds() {
        // Vehicle sounds
        this.loadVehicleSounds('base');
        this.loadVehicleSounds('muscle_car');
        this.loadVehicleSounds('junkyard_king');
        this.loadVehicleSounds('ironclad');
        this.loadVehicleSounds('tank');
        this.loadVehicleSounds('drone');
        this.loadVehicleSounds('scorpion');

        // Weapon sounds
        this.loadWeaponSounds();

        // Power-up sounds
        this.loadPowerUpSounds();

        // Environment sounds
        this.loadEnvironmentSounds();

        // Damage sounds
        this.loadDamageSounds();

        // UI sounds
        this.loadUISounds();
    }

    loadVehicleSounds(vehicleType) {
        const basePath = `assets/sounds/vehicles/${vehicleType}/`;
        const sounds = [
            'engine_idle',
            'engine_rev',
            'engine_accelerate',
            'engine_decelerate',
            'boost'
        ];

        if (vehicleType === 'base') {
            sounds.push('collision_light', 'collision_medium', 'collision_heavy');
        }

        if (vehicleType === 'tank') {
            sounds.push('track_movement');
        }

        sounds.forEach(sound => {
            this.sounds.set(`${vehicleType}_${sound}`, new Howl({
                src: [`${basePath}${sound}.mp3`],
                loop: sound === 'engine_idle',
                volume: this.getCategoryVolume('vehicles'),
                spatial: true
            }));
        });
    }

    loadWeaponSounds() {
        const basePath = 'assets/sounds/weapons/';
        const sounds = [
            'projectile_launch',
            'projectile_hit',
            'mine_deploy',
            'mine_arm',
            'mine_explode',
            'weapon_empty',
            'weapon_reload'
        ];

        sounds.forEach(sound => {
            this.sounds.set(sound, new Howl({
                src: [`${basePath}${sound}.mp3`],
                volume: this.getCategoryVolume('weapons'),
                spatial: true
            }));
        });
    }

    loadPowerUpSounds() {
        const basePath = 'assets/sounds/powerups/';
        const sounds = [
            'pickup',
            'health_activate',
            'speed_activate',
            'speed_deactivate',
            'ammo_pickup',
            'mines_pickup',
            'overcharge_activate',
            'overcharge_deactivate',
            'shield_activate',
            'shield_hit',
            'shield_deactivate'
        ];

        sounds.forEach(sound => {
            this.sounds.set(sound, new Howl({
                src: [`${basePath}${sound}.mp3`],
                volume: this.getCategoryVolume('powerups'),
                spatial: true
            }));
        });
    }

    loadEnvironmentSounds() {
        const basePath = 'assets/sounds/environment/';
        const sounds = [
            'wind_light',
            'wind_heavy',
            'rain_light',
            'rain_heavy',
            'thunder_distant',
            'thunder_close'
        ];

        sounds.forEach(sound => {
            this.sounds.set(sound, new Howl({
                src: [`${basePath}${sound}.mp3`],
                loop: sound.includes('wind') || sound.includes('rain'),
                volume: this.getCategoryVolume('environment'),
                spatial: false
            }));
        });
    }

    loadDamageSounds() {
        const basePath = 'assets/sounds/damage/';
        const sounds = [
            'damage_light',
            'damage_medium',
            'damage_heavy',
            'damage_critical',
            'vehicle_destroyed',
            'health_regeneration'
        ];

        sounds.forEach(sound => {
            this.sounds.set(sound, new Howl({
                src: [`${basePath}${sound}.mp3`],
                volume: this.getCategoryVolume('damage'),
                spatial: true
            }));
        });
    }

    loadUISounds() {
        const basePath = 'assets/sounds/ui/';
        const sounds = [
            'menu_hover',
            'menu_select',
            'vehicle_select',
            'game_start',
            'game_over',
            'victory',
            'countdown'
        ];

        sounds.forEach(sound => {
            this.sounds.set(sound, new Howl({
                src: [`${basePath}${sound}.mp3`],
                volume: this.getCategoryVolume('ui'),
                spatial: false
            }));
        });
    }

    play(soundId, options = {}) {
        if (this.muted) return;

        const sound = this.sounds.get(soundId);
        if (!sound) {
            console.warn(`Sound not found: ${soundId}`);
            return;
        }

        const {
            position,
            volume = 1.0,
            pitch = 1.0,
            loop = false
        } = options;

        if (position) {
            sound.pos(position.x, position.y, position.z);
        }

        sound.volume(volume * this.masterVolume * this.getCategoryVolume(this.getCategory(soundId)));
        sound.rate(pitch);
        sound.loop(loop);

        return sound.play();
    }

    stop(soundId) {
        const sound = this.sounds.get(soundId);
        if (sound) {
            sound.stop();
        }
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        Howler.volume(this.masterVolume);
    }

    setCategoryVolume(category, volume) {
        if (this.categories[category] !== undefined) {
            this.categories[category] = Math.max(0, Math.min(1, volume));
        }
    }

    getCategoryVolume(category) {
        return this.categories[category] || 1.0;
    }

    getCategory(soundId) {
        if (soundId.startsWith('base_') || soundId.startsWith('muscle_car_') || 
            soundId.startsWith('junkyard_king_') || soundId.startsWith('ironclad_') || 
            soundId.startsWith('tank_') || soundId.startsWith('drone_') || 
            soundId.startsWith('scorpion_')) {
            return 'vehicles';
        }

        const category = soundId.split('_')[0];
        return this.categories[category] ? category : 'ui';
    }

    mute() {
        this.muted = true;
        Howler.mute(true);
    }

    unmute() {
        this.muted = false;
        Howler.mute(false);
    }

    isMuted() {
        return this.muted;
    }

    cleanup() {
        this.sounds.forEach(sound => {
            sound.unload();
        });
        this.sounds.clear();
        this.soundPool.clear();
    }
} 