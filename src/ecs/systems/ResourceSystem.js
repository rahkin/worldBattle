import { System } from '../core/System.js';

export class ResourceSystem extends System {
    constructor() {
        super();
        this.resources = new Map();
        this.loadingPromises = new Map();
    }

    async init() {
        // Initialize any default resources here
        return Promise.resolve();
    }

    async loadResource(key, url) {
        if (this.loadingPromises.has(key)) {
            return this.loadingPromises.get(key);
        }

        const promise = fetch(url)
            .then(response => response.blob())
            .then(blob => {
                this.resources.set(key, blob);
                this.loadingPromises.delete(key);
                return blob;
            })
            .catch(error => {
                console.error(`Failed to load resource ${key}:`, error);
                this.loadingPromises.delete(key);
                throw error;
            });

        this.loadingPromises.set(key, promise);
        return promise;
    }

    getResource(key) {
        return this.resources.get(key);
    }

    hasResource(key) {
        return this.resources.has(key);
    }

    async preloadResources(resourceMap) {
        const loadPromises = [];
        for (const [key, url] of Object.entries(resourceMap)) {
            loadPromises.push(this.loadResource(key, url));
        }
        return Promise.all(loadPromises);
    }

    cleanup() {
        this.resources.clear();
        this.loadingPromises.clear();
    }
} 