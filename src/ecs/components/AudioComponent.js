import { Component } from '../core/Component.js';

export class AudioComponent extends Component {
    constructor(config = {}) {
        super();
        this.sounds = config.sounds || {};
        this.is3D = config.is3D !== undefined ? config.is3D : true;
        this.maxDistance = config.maxDistance || 100;
        this.volume = config.volume || 1.0;
        this.playbackRate = config.playbackRate || 1.0;
        this.loop = config.loop || false;
        this.sound = null;
    }

    setSound(soundName, buffer) {
        this.sounds[soundName] = buffer;
    }

    setVolume(volume) {
        this.volume = volume;
        if (this.sound) {
            this.sound.setVolume(volume);
        }
    }

    setPlaybackRate(rate) {
        this.playbackRate = rate;
        if (this.sound) {
            this.sound.setPlaybackRate(rate);
        }
    }

    setLoop(loop) {
        this.loop = loop;
        if (this.sound) {
            this.sound.setLoop(loop);
        }
    }

    set3D(is3D) {
        this.is3D = is3D;
        if (this.sound) {
            this.sound.setDistanceModel(is3D ? 'inverse' : 'linear');
        }
    }

    setMaxDistance(distance) {
        this.maxDistance = distance;
        if (this.sound) {
            this.sound.setRefDistance(distance);
        }
    }

    cleanup() {
        if (this.sound) {
            this.sound.stop();
            this.sound.disconnect();
            this.sound = null;
        }
    }
} 