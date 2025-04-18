import { System } from '../core/System.js';
import { InputComponent } from '../components/InputComponent.js';

export class InputSystem extends System {
    constructor() {
        super();
        this.requiredComponents = [InputComponent];
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Store bound methods to be able to remove them later
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.boundHandleKeyUp = this.handleKeyUp.bind(this);
        this.boundHandleMouseDown = this.handleMouseDown.bind(this);
        this.boundHandleMouseUp = this.handleMouseUp.bind(this);
        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
        this.boundHandleContextMenu = (e) => e.preventDefault();

        // Add event listeners
        window.addEventListener('keydown', this.boundHandleKeyDown);
        window.addEventListener('keyup', this.boundHandleKeyUp);
        window.addEventListener('mousedown', this.boundHandleMouseDown);
        window.addEventListener('mouseup', this.boundHandleMouseUp);
        window.addEventListener('mousemove', this.boundHandleMouseMove);
        window.addEventListener('contextmenu', this.boundHandleContextMenu);
    }

    cleanup() {
        // Remove event listeners
        window.removeEventListener('keydown', this.boundHandleKeyDown);
        window.removeEventListener('keyup', this.boundHandleKeyUp);
        window.removeEventListener('mousedown', this.boundHandleMouseDown);
        window.removeEventListener('mouseup', this.boundHandleMouseUp);
        window.removeEventListener('mousemove', this.boundHandleMouseMove);
        window.removeEventListener('contextmenu', this.boundHandleContextMenu);
    }

    handleKeyDown(event) {
        const entities = this.world.getEntitiesWithComponents([InputComponent]);
        for (const entity of entities) {
            const input = entity.getComponent(InputComponent);
            input.setKey(event.code, true);

            // Handle special key states
            if (event.code === 'KeyR' && !event.ctrlKey) {
                input.setLookingBack(true);
            }
            if (event.code === 'KeyT') {
                input.setRecovery(true);
            }
        }
    }

    handleKeyUp(event) {
        const entities = this.world.getEntitiesWithComponents([InputComponent]);
        for (const entity of entities) {
            const input = entity.getComponent(InputComponent);
            input.setKey(event.code, false);

            // Handle special key states
            if (event.code === 'KeyR') {
                input.setLookingBack(false);
            }
            if (event.code === 'KeyT') {
                input.setRecovery(false);
            }
        }
    }

    handleMouseDown(event) {
        const entities = this.world.getEntitiesWithComponents([InputComponent]);
        for (const entity of entities) {
            const input = entity.getComponent(InputComponent);
            input.setMouseButton(event.button, true);

            // Handle mine deployment
            if (event.button === 2) { // Right mouse button
                event.preventDefault();
                input.setDeployMine(true);
            }
        }
    }

    handleMouseUp(event) {
        const entities = this.world.getEntitiesWithComponents([InputComponent]);
        for (const entity of entities) {
            const input = entity.getComponent(InputComponent);
            input.setMouseButton(event.button, false);

            // Handle mine deployment
            if (event.button === 2) {
                input.setDeployMine(false);
            }
        }
    }

    handleMouseMove(event) {
        const entities = this.world.getEntitiesWithComponents([InputComponent]);
        for (const entity of entities) {
            const input = entity.getComponent(InputComponent);
            input.setMousePosition(event.clientX, event.clientY);
            input.setMouseDelta(event.movementX, event.movementY);
        }
    }

    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents([InputComponent]);
        
        for (const entity of entities) {
            const input = entity.getComponent(InputComponent);
            
            // Process movement input
            const forwardKey = input.isKeyPressed('KeyW');
            const backwardKey = input.isKeyPressed('KeyS');
            const leftKey = input.isKeyPressed('KeyA');
            const rightKey = input.isKeyPressed('KeyD');
            const brakeKey = input.isKeyPressed('Space');
            const boostKey = input.isKeyPressed('ShiftLeft') || input.isKeyPressed('ShiftRight');

            // Calculate engine force
            let engineForce = 0;
            const normalForce = 1800;
            const boostForce = 2200;
            const reverseForce = 800;

            if (forwardKey) {
                engineForce = boostKey ? boostForce : normalForce;
            } else if (backwardKey) {
                engineForce = -reverseForce;
            }
            input.setEngineForce(engineForce);

            // Calculate brake force
            input.setBrakeForce(brakeKey ? 100 : 0);

            // Calculate steering force
            const maxSteerVal = 0.5;
            let steeringForce = 0;
            if (leftKey) {
                steeringForce = maxSteerVal;
            } else if (rightKey) {
                steeringForce = -maxSteerVal;
            }
            input.setSteeringForce(steeringForce);

            // Update boost state
            input.setBoost(boostKey);

            // Update firing state
            input.firing = input.isMouseButtonPressed(0); // Left mouse button

            // Reset mouse delta after processing
            input.resetMouseDelta();
        }
    }
} 