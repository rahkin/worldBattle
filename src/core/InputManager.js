export class InputManager {
    constructor() {
        this.keys = {};
        this.mousePosition = { x: 0, y: 0 };
        this.mouseButtons = {};
        this.pressedThisFrame = new Set();
        
        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            console.log('Key pressed:', e.code);
            if (!this.keys[e.code]) {
                this.pressedThisFrame.add(e.code);
                console.log('Added to pressedThisFrame:', e.code);
            }
            this.keys[e.code] = true;
            
            // Prevent default behavior for game control keys
            if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyC', 'KeyR', 'KeyT'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.pressedThisFrame.delete(e.code);
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

    isKeyPressed(code) {
        return !!this.keys[code];
    }

    isKeyPressedOnce(code) {
        const isPressed = this.pressedThisFrame.has(code);
        console.log('Checking isKeyPressedOnce:', code, isPressed);
        return isPressed;
    }

    isMouseButtonPressed(button) {
        return !!this.mouseButtons[button];
    }

    getMousePosition() {
        return { ...this.mousePosition };
    }

    update() {
        // Clear the pressedThisFrame set at the end of each frame
        if (this.pressedThisFrame.size > 0) {
            console.log('Clearing pressedThisFrame:', Array.from(this.pressedThisFrame));
        }
        this.pressedThisFrame.clear();
    }
} 