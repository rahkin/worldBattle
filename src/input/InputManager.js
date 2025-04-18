export class InputManager {
    constructor() {
        this.keys = new Map();
        this.mouseButtons = new Map();
        this.mousePosition = { x: 0, y: 0 };
        this.mouseDelta = { x: 0, y: 0 };
        this.wheelDelta = 0;
        this.isPointerLocked = false;
        this.pointerLockEnabled = false;

        // Bind event handlers
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onWheel = this.onWheel.bind(this);
        this.onPointerLockChange = this.onPointerLockChange.bind(this);
    }

    init() {
        // Add event listeners
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('wheel', this.onWheel);
        document.addEventListener('pointerlockchange', this.onPointerLockChange);

        // Initialize key mappings
        this.initializeKeyMappings();
    }

    initializeKeyMappings() {
        // Movement keys
        this.keyMappings = {
            forward: ['w', 'arrowup'],
            backward: ['s', 'arrowdown'],
            left: ['a', 'arrowleft'],
            right: ['d', 'arrowright'],
            boost: ['shift'],
            brake: ['space'],
            mine: ['q'],
            powerup: ['e']
        };
    }

    onKeyDown(event) {
        const key = event.key.toLowerCase();
        this.keys.set(key, true);
    }

    onKeyUp(event) {
        const key = event.key.toLowerCase();
        this.keys.set(key, false);
    }

    onMouseMove(event) {
        if (this.isPointerLocked) {
            this.mouseDelta.x = event.movementX;
            this.mouseDelta.y = event.movementY;
        } else {
            this.mouseDelta.x = 0;
            this.mouseDelta.y = 0;
        }
        this.mousePosition.x = event.clientX;
        this.mousePosition.y = event.clientY;
    }

    onMouseDown(event) {
        this.mouseButtons.set(event.button, true);
        if (event.button === 0 && this.pointerLockEnabled) {
            this.requestPointerLock();
        }
    }

    onMouseUp(event) {
        this.mouseButtons.set(event.button, false);
    }

    onWheel(event) {
        this.wheelDelta = event.deltaY;
    }

    onPointerLockChange() {
        this.isPointerLocked = document.pointerLockElement !== null;
    }

    requestPointerLock() {
        if (!this.isPointerLocked) {
            document.body.requestPointerLock();
        }
    }

    exitPointerLock() {
        if (this.isPointerLocked) {
            document.exitPointerLock();
        }
    }

    isActionPressed(action) {
        const keys = this.keyMappings[action];
        if (!keys) return false;
        return keys.some(key => this.keys.get(key));
    }

    isKeyPressed(key) {
        return this.keys.get(key.toLowerCase()) || false;
    }

    isMouseButtonPressed(button) {
        return this.mouseButtons.get(button) || false;
    }

    getMousePosition() {
        return { ...this.mousePosition };
    }

    getMouseDelta() {
        const delta = { ...this.mouseDelta };
        this.mouseDelta = { x: 0, y: 0 };
        return delta;
    }

    getWheelDelta() {
        const delta = this.wheelDelta;
        this.wheelDelta = 0;
        return delta;
    }

    cleanup() {
        // Remove event listeners
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('wheel', this.onWheel);
        document.removeEventListener('pointerlockchange', this.onPointerLockChange);

        // Exit pointer lock if active
        this.exitPointerLock();

        // Clear all states
        this.keys.clear();
        this.mouseButtons.clear();
        this.mousePosition = { x: 0, y: 0 };
        this.mouseDelta = { x: 0, y: 0 };
        this.wheelDelta = 0;
        this.isPointerLocked = false;
    }

    enablePointerLock() {
        console.log('Enabling pointer lock');
        this.pointerLockEnabled = true;
    }

    disablePointerLock() {
        console.log('Disabling pointer lock');
        this.pointerLockEnabled = false;
        this.exitPointerLock();
    }
} 