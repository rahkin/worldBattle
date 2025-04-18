export class EventBus {
    constructor() {
        this.events = new Map();
    }

    subscribe(eventName, handler) {
        if (!eventName || typeof eventName !== 'string') {
            throw new Error('Invalid event name');
        }
        if (!handler || typeof handler !== 'function') {
            throw new Error('Invalid event handler');
        }

        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        this.events.get(eventName).push(handler);
    }

    unsubscribe(eventName, handler) {
        if (!this.events.has(eventName)) return;

        const handlers = this.events.get(eventName);
        const index = handlers.indexOf(handler);
        if (index !== -1) {
            handlers.splice(index, 1);
        }
    }

    publish(eventName, data) {
        if (!this.events.has(eventName)) return;

        const handlers = this.events.get(eventName);
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error in event handler for ${eventName}:`, error);
            }
        });
    }

    clear() {
        this.events.clear();
    }
} 