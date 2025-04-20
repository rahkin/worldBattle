import { System } from '../core/System.js';
import { InputComponent } from '../components/InputComponent.js';

export class InputSystem extends System {
    constructor() {
        super();
        this.requiredComponents = ['InputComponent'];
        this.keyState = {};
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.boundHandleKeyUp = this.handleKeyUp.bind(this);
        
        window.addEventListener('keydown', this.boundHandleKeyDown);
        window.addEventListener('keyup', this.boundHandleKeyUp);
        
        console.log('InputSystem initialized');
    }

    handleKeyDown(event) {
        if (event.repeat) return;
        
        // Prevent default browser behavior for game controls
        if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
            event.preventDefault();
        }
        
        this.keyState[event.code] = true;
        console.log('Key down:', event.code, 'Current key states:', this.keyState);
    }

    handleKeyUp(event) {
        this.keyState[event.code] = false;
        console.log('Key up:', event.code, 'Current key states:', this.keyState);
    }

    update(deltaTime) {
        if (!this.world) {
            console.warn('InputSystem: No world reference');
            return;
        }

        const entities = this.world.getEntitiesWithComponents(['InputComponent']);
        console.log('InputSystem update - Found entities:', entities.length);
        
        for (const entity of entities) {
            const input = entity.getComponent('InputComponent');
            if (!input) {
                console.warn('InputSystem: Entity has no InputComponent:', entity.id);
                continue;
            }

            // Update input state based on key states
            input.forward = this.keyState['KeyW'] || this.keyState['ArrowUp'];
            input.backward = this.keyState['KeyS'] || this.keyState['ArrowDown'];
            input.left = this.keyState['KeyA'] || this.keyState['ArrowLeft'];
            input.right = this.keyState['KeyD'] || this.keyState['ArrowRight'];
            input.boost = this.keyState['ShiftLeft'] || this.keyState['ShiftRight'];
            input.brake = this.keyState['Space'];

            // Update the component
            input.update(deltaTime);
        }
    }

    cleanup() {
        window.removeEventListener('keydown', this.boundHandleKeyDown);
        window.removeEventListener('keyup', this.boundHandleKeyUp);
        console.log('InputSystem cleaned up');
    }
} 