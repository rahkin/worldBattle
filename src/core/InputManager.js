export class InputManager {
    constructor() {
        this.keys = {};
        this.mousePosition = { x: 0, y: 0 };
        this.mouseButtons = {};
        
        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('mousemove', (e) => {
            this.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('mousedown', (e) => {
            this.mouseButtons[e.button] = true;
        });

        window.addEventListener('mouseup', (e) => {
            this.mouseButtons[e.button] = false;
        });
    }

    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }

    isMouseButtonPressed(button) {
        return !!this.mouseButtons[button];
    }

    getMousePosition() {
        return { ...this.mousePosition };
    }
} 