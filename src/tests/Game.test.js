import { jest } from '@jest/globals';
import { WebGLRenderer, PerspectiveCamera, Scene, Clock } from 'three';
import { Game } from '../core/Game.js';

jest.mock('three', () => {
    const mockCanvas = {
        getContext: jest.fn(() => ({
            getExtension: jest.fn(() => true)
        })),
        style: {},
    };

    return {
        WebGLRenderer: jest.fn().mockImplementation(() => ({
            setSize: jest.fn(),
            setPixelRatio: jest.fn(),
            render: jest.fn(),
            dispose: jest.fn(),
            domElement: mockCanvas,
        })),
        PerspectiveCamera: jest.fn().mockImplementation(() => ({
            aspect: 1,
            updateProjectionMatrix: jest.fn()
        })),
        Scene: jest.fn(),
        Clock: jest.fn().mockImplementation(() => ({
            getDelta: jest.fn().mockReturnValue(0.016),
            start: jest.fn(),
            stop: jest.fn(),
        })),
    };
});

describe('Game', () => {
    let game;
    
    beforeEach(() => {
        global.innerWidth = 800;
        global.innerHeight = 600;
        jest.clearAllMocks();
        game = new Game({ isTest: true });
    });

    afterEach(() => {
        game.cleanup();
        jest.clearAllMocks();
    });

    describe('initialization', () => {
        it('should initialize renderer, camera, and scene', () => {
            expect(WebGLRenderer).toHaveBeenCalled();
            expect(PerspectiveCamera).toHaveBeenCalled();
            expect(Scene).toHaveBeenCalled();
        });

        it('should handle resize events', () => {
            const newWidth = 1024;
            const newHeight = 768;
            global.innerWidth = newWidth;
            global.innerHeight = newHeight;

            global.dispatchEvent(new Event('resize'));

            const renderer = WebGLRenderer.mock.results[0].value;
            expect(renderer.setSize).toHaveBeenCalledWith(newWidth, newHeight);
        });

        it('should check WebGL support', () => {
            const mockCanvas = WebGLRenderer.mock.results[0].value.domElement;
            expect(mockCanvas.getContext).toHaveBeenCalledWith('webgl2');
        });
    });

    describe('game loop', () => {
        beforeEach(() => {
            global.requestAnimationFrame = jest.fn();
            global.cancelAnimationFrame = jest.fn();
        });

        it('should start and stop the game loop', () => {
            game.start();
            expect(global.requestAnimationFrame).toHaveBeenCalled();

            game.stop();
            expect(global.cancelAnimationFrame).toHaveBeenCalled();
        });

        it('should update and render each frame', () => {
            const renderer = WebGLRenderer.mock.results[0].value;
            const camera = PerspectiveCamera.mock.results[0].value;
            const scene = Scene.mock.results[0].value;

            game.update();

            expect(renderer.render).toHaveBeenCalledWith(scene, camera);
        });
    });

    describe('cleanup', () => {
        it('should dispose of resources and remove event listeners', () => {
            const renderer = WebGLRenderer.mock.results[0].value;
            const removeEventListenerSpy = jest.spyOn(global, 'removeEventListener');

            game.cleanup();

            expect(renderer.dispose).toHaveBeenCalled();
            expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
        });
    });
});