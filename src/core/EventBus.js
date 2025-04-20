export class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName).add(callback);
    }

    off(eventName, callback) {
        if (this.listeners.has(eventName)) {
            this.listeners.get(eventName).delete(callback);
            if (this.listeners.get(eventName).size === 0) {
                this.listeners.delete(eventName);
            }
        }
    }

    emit(eventName, data) {
        if (this.listeners.has(eventName)) {
            this.listeners.get(eventName).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${eventName}:`, error);
                }
            });
        }
    }

    clear() {
        this.listeners.clear();
    }

    getListenerCount(eventName) {
        return this.listeners.has(eventName) ? this.listeners.get(eventName).size : 0;
    }
} 