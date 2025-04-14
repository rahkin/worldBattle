export class InputState {
    constructor() {
        this.keys = new Set();
        this.mousePosition = { x: 0, y: 0 };
        this.mouseButtons = new Set();
        this.gamepad = null;
        this.lastGamepadState = null;
    }

    update() {
        // Update gamepad state if connected
        const gamepads = navigator.getGamepads();
        if (gamepads[0]) {
            this.gamepad = gamepads[0];
            this.lastGamepadState = {
                buttons: Array.from(this.gamepad.buttons),
                axes: Array.from(this.gamepad.axes)
            };
        }
    }

    isKeyPressed(key) {
        return this.keys.has(key);
    }

    isMouseButtonPressed(button) {
        return this.mouseButtons.has(button);
    }

    getMousePosition() {
        return this.mousePosition;
    }

    getGamepadState() {
        return this.lastGamepadState;
    }

    // Event handlers
    handleKeyDown(event) {
        this.keys.add(event.key);
    }

    handleKeyUp(event) {
        this.keys.delete(event.key);
    }

    handleMouseMove(event) {
        this.mousePosition.x = event.clientX;
        this.mousePosition.y = event.clientY;
    }

    handleMouseDown(event) {
        this.mouseButtons.add(event.button);
    }

    handleMouseUp(event) {
        this.mouseButtons.delete(event.button);
    }

    // Cleanup
    cleanup() {
        this.keys.clear();
        this.mouseButtons.clear();
        this.gamepad = null;
        this.lastGamepadState = null;
    }
} 