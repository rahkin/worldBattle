import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { Game } from '../core/Game.js';
import { World } from '../ecs/World.js';
import { EventBus } from '../core/EventBus.js';

describe('Game', () => {
    let game;
    let mockWorld;
    let mockEventBus;
    let originalPerformanceNow;

    beforeEach(() => {
        // Save original performance.now
        originalPerformanceNow = global.performance.now;

        // Mock performance.now to return predictable values
        let time = 0;
        global.performance.now = jest.fn(() => {
            time += 16; // Simulate 16ms per frame
            return time;
        });

        mockWorld = {
            update: jest.fn(),
            cleanup: jest.fn()
        };

        mockEventBus = {
            subscribe: jest.fn(),
            unsubscribe: jest.fn(),
            publish: jest.fn(),
            clear: jest.fn()
        };

        game = new Game({
            isTest: true,
            world: mockWorld,
            eventBus: mockEventBus
        });
    });

    afterEach(() => {
        // Restore original performance.now
        global.performance.now = originalPerformanceNow;
    });

    describe('initialization', () => {
        test('should initialize with default values', () => {
            const defaultGame = new Game({ isTest: true });
            expect(defaultGame.world).toBeInstanceOf(World);
            expect(defaultGame.eventBus).toBeInstanceOf(EventBus);
            expect(defaultGame.isRunning).toBe(false);
            expect(defaultGame.lastTime).toBe(0);
            expect(defaultGame.scene).toBeTruthy();
            expect(defaultGame.camera).toBeTruthy();
            expect(defaultGame.renderer).toBeTruthy();
        });

        test('should initialize with provided values', () => {
            expect(game.world).toBe(mockWorld);
            expect(game.eventBus).toBe(mockEventBus);
            expect(game.isRunning).toBe(false);
            expect(game.lastTime).toBe(0);
            expect(game.scene).toBeTruthy();
            expect(game.camera).toBeTruthy();
            expect(game.renderer).toBeTruthy();
        });
    });

    describe('game loop', () => {
        test('should start game loop', () => {
            game.start();
            expect(game.isRunning).toBe(true);
        });

        test('should stop game loop', () => {
            game.start();
            game.stop();
            expect(game.isRunning).toBe(false);
        });

        test('should update systems', () => {
            game.start();
            game.update();
            expect(mockWorld.update).toHaveBeenCalledWith(0.016); // 16ms = 0.016s
        });
    });

    describe('event handling', () => {
        test('should subscribe to events', () => {
            const handler = jest.fn();
            game.eventBus.subscribe('test', handler);
            expect(mockEventBus.subscribe).toHaveBeenCalledWith('test', handler);
        });

        test('should unsubscribe from events', () => {
            const handler = jest.fn();
            game.eventBus.unsubscribe('test', handler);
            expect(mockEventBus.unsubscribe).toHaveBeenCalledWith('test', handler);
        });

        test('should publish events', () => {
            const data = { test: 'data' };
            game.eventBus.publish('test', data);
            expect(mockEventBus.publish).toHaveBeenCalledWith('test', data);
        });
    });

    describe('cleanup', () => {
        test('should cleanup all systems', () => {
            game.cleanup();
            expect(mockWorld.cleanup).toHaveBeenCalled();
            expect(mockEventBus.clear).toHaveBeenCalled();
            expect(game.isRunning).toBe(false);
        });
    });
}); 