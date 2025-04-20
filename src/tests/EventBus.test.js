import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { EventBus } from '../core/EventBus.js';

describe('EventBus', () => {
    let eventBus;
    let mockHandler;
    let mockHandler2;

    beforeEach(() => {
        eventBus = new EventBus();
        mockHandler = jest.fn();
        mockHandler2 = jest.fn();
    });

    describe('initialization', () => {
        test('should initialize with empty events map', () => {
            expect(eventBus.events).toEqual(new Map());
        });
    });

    describe('subscription management', () => {
        test('should subscribe to event', () => {
            eventBus.subscribe('test-event', mockHandler);
            expect(eventBus.events.get('test-event')).toContain(mockHandler);
        });

        test('should subscribe multiple handlers to same event', () => {
            eventBus.subscribe('test-event', mockHandler);
            eventBus.subscribe('test-event', mockHandler2);
            const handlers = eventBus.events.get('test-event');
            expect(handlers).toContain(mockHandler);
            expect(handlers).toContain(mockHandler2);
        });

        test('should unsubscribe from event', () => {
            eventBus.subscribe('test-event', mockHandler);
            eventBus.unsubscribe('test-event', mockHandler);
            expect(eventBus.events.get('test-event')).not.toContain(mockHandler);
        });

        test('should handle unsubscribe of non-existent handler', () => {
            expect(() => eventBus.unsubscribe('test-event', mockHandler)).not.toThrow();
        });
    });

    describe('event publishing', () => {
        test('should publish event to all subscribers', () => {
            eventBus.subscribe('test-event', mockHandler);
            eventBus.subscribe('test-event', mockHandler2);
            eventBus.publish('test-event', { data: 'test' });
            expect(mockHandler).toHaveBeenCalledWith({ data: 'test' });
            expect(mockHandler2).toHaveBeenCalledWith({ data: 'test' });
        });

        test('should handle events with no subscribers', () => {
            expect(() => eventBus.publish('test-event', {})).not.toThrow();
        });
    });

    describe('error handling', () => {
        test('should handle errors in event handlers', () => {
            const errorHandler = jest.fn().mockImplementation(() => {
                throw new Error('Test error');
            });
            eventBus.subscribe('test-event', errorHandler);
            expect(() => eventBus.publish('test-event', {})).not.toThrow();
        });

        test('should handle invalid event names', () => {
            expect(() => eventBus.subscribe(null, mockHandler)).toThrow();
            expect(() => eventBus.subscribe(undefined, mockHandler)).toThrow();
            expect(() => eventBus.subscribe('', mockHandler)).toThrow();
        });

        test('should handle invalid handlers', () => {
            expect(() => eventBus.subscribe('test-event', null)).toThrow();
            expect(() => eventBus.subscribe('test-event', undefined)).toThrow();
            expect(() => eventBus.subscribe('test-event', 'not-a-function')).toThrow();
        });
    });

    describe('cleanup', () => {
        test('should clear all events', () => {
            eventBus.subscribe('test-event', mockHandler);
            eventBus.clear();
            expect(eventBus.events.size).toBe(0);
        });
    });
}); 