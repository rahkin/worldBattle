export class ResourceManager {
    constructor() {
        this.resources = new Map();
        this.loadingPromises = new Map();
    }

    async load(key, url) {
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
                this.loadingPromises.delete(key);
                throw error;
            });

        this.loadingPromises.set(key, promise);
        return promise;
    }

    get(key) {
        return this.resources.get(key);
    }

    dispose() {
        this.resources.clear();
        this.loadingPromises.clear();
    }
} 