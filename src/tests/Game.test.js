import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { Game } from '../core/Game';

describe('Game', () => {
    let mockCanvas;
    let mockBody;
    let mockWorld;
    let mockEventBus;
    let mockSceneManager;
    let mockVehicleSystem;
    let game;

    beforeEach(() => {
        // Mock canvas and body
        mockCanvas = document.createElement('canvas');
        mockBody = document.createElement('body');
        document.body.appendChild(mockCanvas);
        document.body.appendChild(mockBody);

        // Mock WebGL context
        const mockContext = {
            getParameter: jest.fn().mockReturnValue('WebGL'),
            getExtension: jest.fn().mockReturnValue({}),
            getShaderPrecisionFormat: jest.fn().mockReturnValue({ rangeMin: 0, rangeMax: 0, precision: 0 })
        };
        mockCanvas.getContext = jest.fn().mockReturnValue(mockContext);

        // Mock window dimensions
        Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });

        // Mock THREE.js
        jest.mock('three', () => {
            class MockWebGLRenderer {
                constructor() {
                    this.setSize = jest.fn();
                    this.setPixelRatio = jest.fn();
                    this.render = jest.fn();
                    this.dispose = jest.fn();
                    this.domElement = document.createElement('canvas');
                }
            }
            MockWebGLRenderer.prototype.isWebGLRenderer = true;

            class MockPerspectiveCamera {
                constructor() {
                    this.aspect = 1;
                    this.updateProjectionMatrix = jest.fn();
                    this.position = { set: jest.fn() };
                    this.lookAt = jest.fn();
                }
            }
            MockPerspectiveCamera.prototype.isPerspectiveCamera = true;

            class MockScene {
                constructor() {
                    this.add = jest.fn();
                    this.remove = jest.fn();
                }
            }
            MockScene.prototype.isScene = true;

            class MockClock {
                constructor() {
                    this.getDelta = jest.fn().mockReturnValue(0.016);
                    this.start = jest.fn();
                    this.stop = jest.fn();
                }
            }

            return {
                WebGLRenderer: jest.fn().mockImplementation(() => new MockWebGLRenderer()),
                PerspectiveCamera: jest.fn().mockImplementation(() => new MockPerspectiveCamera()),
                Scene: jest.fn().mockImplementation(() => new MockScene()),
                Clock: jest.fn().mockImplementation(() => new MockClock()),
                Color: jest.fn()
            };
        });

        // Mock CANNON.js
        jest.mock('cannon-es', () => ({
            World: jest.fn().mockImplementation(() => ({
                addBody: jest.fn(),
                removeBody: jest.fn(),
                step: jest.fn()
            })),
            Body: jest.fn().mockImplementation(() => ({
                addShape: jest.fn(),
                updateMassProperties: jest.fn()
            })),
            Box: jest.fn(),
            Vec3: jest.fn(),
            Quaternion: jest.fn()
        }));

        // Mock World
        mockWorld = {
            init: jest.fn().mockResolvedValue(undefined),
            update: jest.fn(),
            cleanup: jest.fn(),
            addSystem: jest.fn(),
            getSystem: jest.fn().mockReturnValue(mockVehicleSystem)
        };

        // Mock EventBus
        mockEventBus = {
            on: jest.fn(),
            emit: jest.fn(),
            clear: jest.fn()
        };

        // Mock SceneManager
        mockSceneManager = {
            init: jest.fn().mockResolvedValue(undefined),
            render: jest.fn(),
            cleanup: jest.fn(),
            scene: {
                add: jest.fn(),
                remove: jest.fn()
            },
            renderer: {
                setSize: jest.fn(),
                setPixelRatio: jest.fn(),
                domElement: document.createElement('canvas')
            }
        };

        // Mock VehicleSystem
        mockVehicleSystem = {
            init: jest.fn().mockResolvedValue(undefined),
            createVehicle: jest.fn().mockReturnValue({ id: 'test-vehicle' }),
            update: jest.fn(),
            cleanup: jest.fn()
        };

        // Create game instance
        game = new Game({
            world: mockWorld,
            eventBus: mockEventBus,
            sceneManager: mockSceneManager
        });
    });

    afterEach(() => {
        document.body.removeChild(mockCanvas);
        document.body.removeChild(mockBody);
        jest.clearAllMocks();
    });

    describe('Test Mode', () => {
        beforeEach(async () => {
            await game.init();
        });

        it('should initialize in test mode', () => {
            expect(game.isTest).toBe(true);
            expect(mockWorld.init).toHaveBeenCalled();
            expect(mockEventBus.on).toHaveBeenCalledWith('resize', expect.any(Function));
        });

        it('should update the world in test mode', async () => {
            const deltaTime = 0.016;
            await game.update(deltaTime);
            expect(mockWorld.update).toHaveBeenCalledWith(deltaTime);
        });

        it('should clean up resources', async () => {
            await game.cleanup();
            expect(mockWorld.cleanup).toHaveBeenCalled();
            expect(mockEventBus.clear).toHaveBeenCalled();
        });
    });

    describe('Real Mode', () => {
        beforeEach(async () => {
            // Force real mode
            game.isTest = false;
            await game.init();
        });

        it('should initialize in real mode', () => {
            expect(game.isTest).toBe(false);
            expect(game.scene).toBeDefined();
            expect(game.camera).toBeDefined();
            expect(game.renderer).toBeDefined();
        });

        it('should handle resize events', () => {
            const mockWidth = 1024;
            const mockHeight = 768;
            window.innerWidth = mockWidth;
            window.innerHeight = mockHeight;

            window.dispatchEvent(new Event('resize'));

            expect(game.camera.aspect).toBe(mockWidth / mockHeight);
            expect(game.camera.updateProjectionMatrix).toHaveBeenCalled();
            expect(game.renderer.setSize).toHaveBeenCalledWith(mockWidth, mockHeight);
        });

        it('should update the world and render the scene', async () => {
            const deltaTime = 0.016;
            await game.update(deltaTime);

            expect(mockWorld.update).toHaveBeenCalledWith(deltaTime);
            expect(game.sceneManager.render).toHaveBeenCalledWith(game.camera);
        });

        it('should clean up resources', async () => {
            await game.cleanup();
            expect(mockWorld.cleanup).toHaveBeenCalled();
            expect(mockEventBus.clear).toHaveBeenCalled();
            expect(game.sceneManager.cleanup).toHaveBeenCalled();
        });
    });
});