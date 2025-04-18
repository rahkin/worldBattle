import { System } from '../core/System.js';
import { AudioComponent } from '../components/AudioComponent.js';
import * as THREE from 'three';

// Temporary mock of Howl for testing
class Howl {
    constructor(options) {
        this.src = options.src;
        this.loop = options.loop || false;
        this.volume = options.volume || 1.0;
    }

    play() { return 1; }
    stop() {}
    unload() {}
    rate() {}
}

export class AudioSystem extends System {
    constructor() {
        super();
        this.requiredComponents = [AudioComponent];
        this.listener = new THREE.AudioListener();
        this.sounds = new Map();
        this.audioLoader = new THREE.AudioLoader();
        this.initialized = false;
    }

    async init() {
        try {
            // Try to get camera system
            const cameraSystem = this.world.getSystem('CameraSystem');
            if (!cameraSystem) {
                console.warn('CameraSystem not found, audio will not be spatialized');
                return;
            }
            
            const camera = cameraSystem.getActiveCamera();
            if (!camera) {
                console.warn('No active camera found, audio will not be spatialized');
                return;
            }

            // Add audio listener to the camera
            camera.add(this.listener);
            this.initialized = true;
            console.log('AudioSystem initialized successfully');
        } catch (error) {
            console.warn('Failed to initialize AudioSystem:', error);
        }
    }

    update(deltaTime) {
        if (!this.initialized) return;

        const entities = this.getEntities();
        for (const entity of entities) {
            const audio = entity.getComponent(AudioComponent);
            if (!audio) continue;

            // Update 3D audio position
            if (audio.is3D) {
                const transform = entity.getComponent('Transform');
                if (transform && audio.sound) {
                    audio.sound.setPosition(
                        transform.position.x,
                        transform.position.y,
                        transform.position.z
                    );
                }
            }

            // Update volume based on distance
            if (audio.is3D && audio.maxDistance && audio.sound) {
                const cameraSystem = this.world.getSystem('CameraSystem');
                if (!cameraSystem) continue;
                
                const camera = cameraSystem.getActiveCamera();
                if (camera && transform) {
                    const distance = transform.position.distanceTo(camera.position);
                    const volume = Math.max(0, 1 - (distance / audio.maxDistance));
                    audio.sound.setVolume(volume * audio.volume);
                }
            }
        }
    }

    playSound(entity, soundName, options = {}) {
        if (!this.initialized) {
            console.warn('AudioSystem not initialized, cannot play sound');
            return null;
        }

        const audio = entity.getComponent(AudioComponent);
        if (!audio || !audio.sounds[soundName]) return null;

        const sound = new THREE.PositionalAudio(this.listener);
        this.audioLoader.load(audio.sounds[soundName], (buffer) => {
            sound.setBuffer(buffer);
            sound.setLoop(options.loop || false);
            sound.setVolume(options.volume || 1.0);
            sound.setPlaybackRate(options.playbackRate || 1.0);
            sound.play();
        });

        this.sounds.set(entity.id, sound);
        return sound;
    }

    stopSound(entity) {
        const sound = this.sounds.get(entity.id);
        if (sound) {
            sound.stop();
            this.sounds.delete(entity.id);
        }
    }

    setMasterVolume(volume) {
        if (this.initialized) {
            this.listener.setMasterVolume(volume);
        }
    }

    cleanup() {
        // Stop and dispose of all sounds
        for (const sound of this.sounds.values()) {
            sound.stop();
            sound.disconnect();
        }
        this.sounds.clear();

        // Remove listener from camera if initialized
        if (this.initialized) {
            const cameraSystem = this.world.getSystem('CameraSystem');
            if (cameraSystem) {
                const camera = cameraSystem.getActiveCamera();
                if (camera) {
                    camera.remove(this.listener);
                }
            }
        }
        
        this.initialized = false;
    }
} 