import { System } from '../System.js';
import { InputComponent } from '../components/InputComponent.js';

export class InputSystem extends System {
    constructor() {
        super();
        this.requiredComponents = ['InputComponent'];
        this.keyState = {};
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.boundHandleKeyUp = this.handleKeyUp.bind(this);
        this.debugEnabled = false;
        this.frameCounter = 0;
        this.logInterval = 60; // Only log every 60 frames when debug is enabled
        
        window.addEventListener('keydown', this.boundHandleKeyDown);
        window.addEventListener('keyup', this.boundHandleKeyUp);
        
        console.log('InputSystem constructed');
    }

    init(world) {
        // Initialize base system
        this.world = world;
        console.log('InputSystem initialized with world');
        return Promise.resolve();
    }

    handleKeyDown(event) {
        if (event.repeat) return;
        
        // Prevent default browser behavior for game controls
        if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
            event.preventDefault();
        }
        
        this.keyState[event.code] = true;
        
        if (this.debugEnabled) {
            console.log('Key down:', event.code, this.keyState);
        }
    }

    handleKeyUp(event) {
        this.keyState[event.code] = false;
        
        if (this.debugEnabled) {
            console.log('Key up:', event.code, this.keyState);
        }
    }

    update(deltaTime) {
        if (!this.world) {
            console.warn('InputSystem: No world reference');
            return;
        }

        this.frameCounter++;
        const inputEntities = this.world.getEntitiesWithComponents(['InputComponent']);

        for (const entity of inputEntities) {
            const inputComponent = entity.getComponent('InputComponent');
            if (!inputComponent) continue;

            // Store previous state
            const previousState = {
                forward: inputComponent.forward,
                backward: inputComponent.backward,
                left: inputComponent.left,
                right: inputComponent.right,
                boost: inputComponent.boost,
                brake: inputComponent.brake
            };

            // Update input component based on key state
            inputComponent.forward = this.keyState['KeyW'] || this.keyState['ArrowUp'] || false;
            inputComponent.backward = this.keyState['KeyS'] || this.keyState['ArrowDown'] || false;
            inputComponent.left = this.keyState['KeyA'] || this.keyState['ArrowLeft'] || false;
            inputComponent.right = this.keyState['KeyD'] || this.keyState['ArrowRight'] || false;
            inputComponent.boost = this.keyState['ShiftLeft'] || this.keyState['ShiftRight'] || false;
            inputComponent.brake = this.keyState['Space'] || false;

            // Only log if state changed and debug is enabled
            const stateChanged = Object.keys(previousState).some(key => previousState[key] !== inputComponent[key]);
            
            if (this.debugEnabled && stateChanged) {
                console.log('Input state changed:', {
                    entityId: entity.id,
                    forward: inputComponent.forward,
                    backward: inputComponent.backward,
                    left: inputComponent.left,
                    right: inputComponent.right,
                    boost: inputComponent.boost,
                    brake: inputComponent.brake
                });
            }

            inputComponent.update(deltaTime);
        }
    }

    cleanup() {
        window.removeEventListener('keydown', this.boundHandleKeyDown);
        window.removeEventListener('keyup', this.boundHandleKeyUp);
        console.log('InputSystem cleaned up');
    }
} 