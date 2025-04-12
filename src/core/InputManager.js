export class InputManager {
    constructor() {
        this.keys = new Map();
        this.mouseButtons = new Map();
        this.mousePosition = { x: 0, y: 0 };
        this.normalizedMousePosition = { x: 0, y: 0 };
        this.pressedThisFrame = new Set();
        
        this.setupListeners();
    }

    setupListeners() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }

    handleKeyDown(event) {
        console.log('Key pressed:', event.code);
        if (!this.keys.has(event.code)) {
            this.pressedThisFrame.add(event.code);
            console.log('Added to pressedThisFrame:', event.code);
        }
        this.keys.set(event.code, true);
        
        // Prevent default behavior for game control keys
        if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyC', 'KeyR', 'KeyT'].includes(event.code)) {
            event.preventDefault();
        }
    }

    handleKeyUp(event) {
        this.keys.set(event.code, false);
        this.pressedThisFrame.delete(event.code);
    }

    handleMouseDown(event) {
        this.mouseButtons.set(event.button, true);
    }

    handleMouseUp(event) {
        this.mouseButtons.set(event.button, false);
    }

    handleMouseMove(event) {
        // Get the canvas element
        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        // Get canvas bounds
        const rect = canvas.getBoundingClientRect();

        // Calculate normalized coordinates (-1 to 1)
        this.normalizedMousePosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.normalizedMousePosition.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Store raw mouse position
        this.mousePosition.x = event.clientX - rect.left;
        this.mousePosition.y = event.clientY - rect.top;
    }

    isKeyPressed(code) {
        return !!this.keys.get(code);
    }

    isKeyPressedOnce(code) {
        const isPressed = this.pressedThisFrame.has(code);
        console.log('Checking isKeyPressedOnce:', code, isPressed);
        return isPressed;
    }

    isMouseButtonPressed(button) {
        return !!this.mouseButtons.get(button);
    }

    getMousePosition() {
        return this.normalizedMousePosition;
    }

    getRawMousePosition() {
        return this.mousePosition;
    }

    update() {
        // Clear the pressedThisFrame set at the end of each frame
        if (this.pressedThisFrame.size > 0) {
            console.log('Clearing pressedThisFrame:', Array.from(this.pressedThisFrame));
        }
        this.pressedThisFrame.clear();
    }
} 