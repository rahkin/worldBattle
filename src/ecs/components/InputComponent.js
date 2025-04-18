import { Component } from '../Component.js';

export class InputComponent extends Component {
    constructor() {
        super();
        // Keyboard state
        this.keys = new Map();
        
        // Mouse state
        this.mouseButtons = new Map();
        this.mousePosition = { x: 0, y: 0 };
        this.mouseDelta = { x: 0, y: 0 };
        this.lastMousePosition = { x: 0, y: 0 };
        
        // Special input states
        this.lookingBack = false;
        this.deployMine = false;
        this.lastMineDeployTime = 0;
        this.mineDeployCooldown = 1000; // 1 second cooldown between mine deployments
        
        // Vehicle control states
        this.engineForce = 0;
        this.brakeForce = 0;
        this.steeringForce = 0;
        this.boost = false;
        this.firing = false;
        
        // Recovery state
        this.recovery = false;
    }

    update() {
        // Reset forces
        this.engineForce = 0;
        this.brakeForce = 0;
        this.steeringForce = 0;
        
        // Forward/Backward movement
        if (this.isKeyPressed('KeyW')) {
            this.engineForce = 1;
        } else if (this.isKeyPressed('KeyS')) {
            this.engineForce = -1;
        }
        
        // Left/Right steering
        if (this.isKeyPressed('KeyA')) {
            this.steeringForce = -1;
        } else if (this.isKeyPressed('KeyD')) {
            this.steeringForce = 1;
        }
        
        // Brake/Handbrake
        if (this.isKeyPressed('Space')) {
            this.brakeForce = 1;
        }
        
        // Boost
        this.boost = this.isKeyPressed('ShiftLeft') || this.isKeyPressed('ShiftRight');
        
        // Weapon firing
        this.firing = this.isMouseButtonPressed(0); // Left mouse button
        
        // Mine deployment
        if (this.isKeyPressed('KeyC') && this.canDeployMine()) {
            this.deployMine = true;
        } else {
            this.deployMine = false;
        }
        
        // Look back
        this.lookingBack = this.isKeyPressed('KeyR');
        
        // Recovery
        this.recovery = this.isKeyPressed('KeyT');
    }

    setKey(code, pressed) {
        this.keys.set(code, pressed);
    }

    setMouseButton(button, pressed) {
        this.mouseButtons.set(button, pressed);
    }

    setMousePosition(x, y) {
        this.mousePosition.x = x;
        this.mousePosition.y = y;
    }

    setMouseDelta(x, y) {
        this.mouseDelta.x = x;
        this.mouseDelta.y = y;
    }

    handleKeyDown(event) {
        this.setKey(event.code, true);
        // Prevent default behavior for game control keys
        if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyC', 'KeyR', 'KeyT'].includes(event.code)) {
            event.preventDefault();
        }
    }

    handleKeyUp(event) {
        this.setKey(event.code, false);
    }

    handleMouseDown(event) {
        this.setMouseButton(event.button, true);
    }

    handleMouseUp(event) {
        this.setMouseButton(event.button, false);
    }

    handleMouseMove(event) {
        this.setMousePosition(event.clientX, event.clientY);
        
        // Calculate mouse movement delta
        const deltaX = event.clientX - this.lastMousePosition.x;
        const deltaY = event.clientY - this.lastMousePosition.y;
        this.setMouseDelta(deltaX, deltaY);
        
        // Update last position
        this.lastMousePosition.x = event.clientX;
        this.lastMousePosition.y = event.clientY;
    }

    isKeyPressed(keyCode) {
        return this.keys.get(keyCode) || false;
    }

    isMouseButtonPressed(button) {
        return this.mouseButtons.get(button) || false;
    }

    getMousePosition() {
        return { ...this.mousePosition };
    }

    getMouseDelta() {
        return { ...this.mouseDelta };
    }

    resetMouseDelta() {
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
    }

    cleanup() {
        this.keys.clear();
        this.mouseButtons.clear();
    }

    // Vehicle control methods
    setEngineForce(force) {
        this.engineForce = force;
    }

    setBrakeForce(force) {
        this.brakeForce = force;
    }

    setSteeringForce(force) {
        this.steeringForce = force;
    }

    setBoost(active) {
        this.boost = active;
    }

    // Special state methods
    setLookingBack(state) {
        this.lookingBack = state;
    }

    setDeployMine(state) {
        this.deployMine = state;
    }

    setRecovery(state) {
        this.recovery = state;
    }

    canDeployMine() {
        const now = Date.now();
        if (now - this.lastMineDeployTime >= this.mineDeployCooldown) {
            this.lastMineDeployTime = now;
            return true;
        }
        return false;
    }
} 