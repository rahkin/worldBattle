import { Component } from '../core/Component.js';

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
        this.mineCooldown = 0;
        this.mineDeployCooldown = 1000; // 1 second cooldown between mine deployments
        
        // Vehicle control states
        this.forward = false;
        this.backward = false;
        this.left = false;
        this.right = false;
        this.boost = false;
        this.brake = false;
        
        // Control values for vehicle physics
        this.engineForce = 0;
        this.steeringForce = 0;
        this.brakeForce = 0;
        
        // Force limits
        this.maxEngineForce = 2000;  // Default max engine force
        this.maxSteeringForce = 50;  // Default max steering force
        this.maxBrakeForce = 100;    // Default max brake force
        
        // Recovery state
        this.recovery = false;
        this.recoveryCooldown = 0;
        this.recoveryDelay = 3000; // 3 second cooldown for recovery

        // Bind event handlers once in constructor
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.boundHandleKeyUp = this.handleKeyUp.bind(this);
        this.boundHandleMouseDown = this.handleMouseDown.bind(this);
        this.boundHandleMouseUp = this.handleMouseUp.bind(this);
        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    }

    init(entity) {
        super.init(entity);
        this.entity = entity;
        this.world = entity.world;
        console.log(`Initialized InputComponent for entity ${entity.id}`);
        
        // Set up event listeners using bound methods
        window.addEventListener('keydown', this.boundHandleKeyDown);
        window.addEventListener('keyup', this.boundHandleKeyUp);
        window.addEventListener('mousedown', this.boundHandleMouseDown);
        window.addEventListener('mouseup', this.boundHandleMouseUp);
        window.addEventListener('mousemove', this.boundHandleMouseMove);
    }

    update(deltaTime) {
        // Calculate engine force based on forward/backward input
        this.engineForce = 0;
        if (this.forward) {
            this.engineForce = this.maxEngineForce * (this.boost ? 1.5 : 1);
        } else if (this.backward) {
            this.engineForce = -this.maxEngineForce * 0.5; // Reverse is half power
        }

        // Calculate steering force based on left/right input
        this.steeringForce = 0;
        if (this.left) {
            this.steeringForce = this.maxSteeringForce;
        } else if (this.right) {
            this.steeringForce = -this.maxSteeringForce;
        }

        // Calculate brake force
        this.brakeForce = this.brake ? this.maxBrakeForce : 0;

        // Update mine deployment cooldown
        if (this.mineCooldown > 0) {
            this.mineCooldown = Math.max(0, this.mineCooldown - deltaTime);
        }

        // Update recovery cooldown
        if (this.recoveryCooldown > 0) {
            this.recoveryCooldown = Math.max(0, this.recoveryCooldown - deltaTime);
        }

        // Reset mouse delta after each update
        this.resetMouseDelta();
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
        console.log('Key down:', event.code);
        
        // Update vehicle control states
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.forward = true;
                console.log('Forward input activated');
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.backward = true;
                console.log('Backward input activated');
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.left = true;
                console.log('Left input activated');
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.right = true;
                console.log('Right input activated');
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.boost = true;
                console.log('Boost activated');
                break;
            case 'Space':
                this.brake = true;
                console.log('Brake activated');
                break;
        }

        // Prevent default browser behavior for game controls
        if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyC', 'KeyR', 'KeyT'].includes(event.code)) {
            event.preventDefault();
        }
    }

    handleKeyUp(event) {
        this.setKey(event.code, false);
        console.log('Key up:', event.code);
        
        // Update vehicle control states
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.forward = false;
                console.log('Forward input deactivated');
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.backward = false;
                console.log('Backward input deactivated');
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.left = false;
                console.log('Left input deactivated');
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.right = false;
                console.log('Right input deactivated');
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.boost = false;
                console.log('Boost deactivated');
                break;
            case 'Space':
                this.brake = false;
                console.log('Brake deactivated');
                break;
        }
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
        // Reset all input states
        this.forward = false;
        this.backward = false;
        this.left = false;
        this.right = false;
        this.boost = false;
        this.brake = false;
        
        this.engineForce = 0;
        this.steeringForce = 0;
        this.brakeForce = 0;
        
        // Remove event listeners using the same bound methods
        window.removeEventListener('keydown', this.boundHandleKeyDown);
        window.removeEventListener('keyup', this.boundHandleKeyUp);
        window.removeEventListener('mousedown', this.boundHandleMouseDown);
        window.removeEventListener('mouseup', this.boundHandleMouseUp);
        window.removeEventListener('mousemove', this.boundHandleMouseMove);
        
        this.keys.clear();
        this.mouseButtons.clear();
        super.cleanup();
    }

    // Special state methods
    setLookingBack(state) {
        this.lookingBack = state;
    }

    setDeployMine(state) {
        if (state && this.mineCooldown <= 0) {
            this.deployMine = true;
            this.mineCooldown = this.mineDeployCooldown;
        } else {
            this.deployMine = false;
        }
    }

    setRecovery(state) {
        if (state && this.recoveryCooldown <= 0) {
            this.recovery = true;
            this.recoveryCooldown = this.recoveryDelay;
        } else {
            this.recovery = false;
        }
    }

    canDeployMine() {
        return this.mineCooldown <= 0;
    }

    canRecover() {
        return this.recoveryCooldown <= 0;
    }
} 