import { Component } from '../core/Component.js';

export class TimeComponent extends Component {
    constructor(config = {}) {
        super();
        this.timeScale = config.timeScale || 1.0;
        this.paused = config.paused || false;
        this.currentTime = config.currentTime || 0;
        this.dayLength = config.dayLength || 24 * 60 * 60; // 24 hours in seconds
        this.dayProgress = config.dayProgress || 0; // 0 to 1
        this.events = new Map();
    }

    update(deltaTime) {
        if (this.paused) return;

        const scaledDeltaTime = deltaTime * this.timeScale;
        this.currentTime += scaledDeltaTime;
        this.dayProgress = (this.currentTime % this.dayLength) / this.dayLength;

        // Check and trigger time-based events
        for (const [time, callback] of this.events) {
            if (this.currentTime >= time) {
                callback();
                this.events.delete(time);
            }
        }
    }

    setTimeScale(scale) {
        this.timeScale = scale;
    }

    setPaused(paused) {
        this.paused = paused;
    }

    setTimeOfDay(hours, minutes = 0, seconds = 0) {
        const totalSeconds = (hours * 60 * 60) + (minutes * 60) + seconds;
        this.currentTime = totalSeconds;
        this.dayProgress = totalSeconds / this.dayLength;
    }

    getTimeOfDay() {
        const totalSeconds = this.currentTime % this.dayLength;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return { hours, minutes, seconds };
    }

    scheduleEvent(time, callback) {
        this.events.set(time, callback);
    }

    clearEvents() {
        this.events.clear();
    }

    cleanup() {
        this.clearEvents();
        this.timeScale = 1.0;
        this.paused = false;
        this.currentTime = 0;
        this.dayProgress = 0;
    }
} 