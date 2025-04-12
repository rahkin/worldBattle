export class GameLoop {
    constructor() {
        this.lastTime = 0;
        this.accumulator = 0;
        this.timestep = 1000 / 60; // Target 60 FPS
    }

    start(updateCallback) {
        this.updateCallback = updateCallback;
        this.animate(0);
    }

    animate(currentTime) {
        requestAnimationFrame(this.animate.bind(this));

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.accumulator += deltaTime;

        while (this.accumulator >= this.timestep) {
            this.updateCallback(this.timestep / 1000); // Convert to seconds
            this.accumulator -= this.timestep;
        }
    }
} 