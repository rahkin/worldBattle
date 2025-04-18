import { System } from '../core/System.js';
import { TimeComponent } from '../components/TimeComponent.js';

export class TimeSystem extends System {
    constructor() {
        super();
        this.requiredComponents = [TimeComponent];
        this.timeScale = 1.0;
        this.paused = false;
        this.currentTime = 0;
        this.dayLength = 24 * 60 * 60; // 24 hours in seconds
        this.dayProgress = 0; // 0 to 1
    }

    update(deltaTime) {
        if (this.paused) return;

        const scaledDeltaTime = deltaTime * this.timeScale;
        this.currentTime += scaledDeltaTime;
        this.dayProgress = (this.currentTime % this.dayLength) / this.dayLength;

        const entities = this.getEntities();
        for (const entity of entities) {
            const timeComponent = entity.getComponent(TimeComponent);
            if (timeComponent) {
                timeComponent.update(scaledDeltaTime);
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

    isDaytime() {
        const hour = this.getTimeOfDay().hours;
        return hour >= 6 && hour < 18;
    }

    cleanup() {
        this.timeScale = 1.0;
        this.paused = false;
        this.currentTime = 0;
        this.dayProgress = 0;
    }
} 