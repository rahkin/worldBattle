export class WorldManager {
    constructor(world) {
        this.world = world;
        this.latitude = 14.5086; // NAIA coordinates
        this.longitude = 120.9822;
        this.radius = 5000; // 5km radius
        this.worldGenerator = null;
        this.tileFetcher = null;
    }

    async initialize() {
        // Get required systems
        this.worldGenerator = this.world.getSystem('WorldGenerationSystem');
        this.tileFetcher = this.world.getSystem('TileFetcherSystem');

        if (!this.worldGenerator || !this.tileFetcher) {
            throw new Error('Required systems not found');
        }
    }

    async startWorldGeneration() {
        console.log('=== Starting World Generation ===');
        console.log(`Location: ${this.latitude}, ${this.longitude}`);

        try {
            // Stage 1: Fetch map tiles
            console.log('[Stage 1] Fetching map tiles...');
            const tiles = await this.tileFetcher.fetchTiles(this.latitude, this.longitude, this.radius);
            console.log(`Found ${tiles.length} tiles to process`);

            // Stage 2: Generate terrain
            console.log('[Stage 2] Generating terrain...');
            if (!this.worldGenerator || typeof this.worldGenerator.initializeTerrain !== 'function') {
                throw new Error('WorldGenerator not properly initialized');
            }
            await this.worldGenerator.initializeTerrain(tiles);

            // Stage 3: Process features
            console.log('[Stage 3] Processing features...');
            await this.processLayers(tiles);

            console.log('=== World Generation Complete ===');
        } catch (error) {
            console.error('❌ World generation failed:', error.message);
            throw error;
        }
    }

    async generateWorld() {
        console.log('[Stage 1] Starting world generation...');
        const tiles = await this.worldGenerator.generateTiles();

        console.log('[Stage 3] Finalizing world...');
        await this.worldGenerator.finalize();

        console.log('World generation complete');
        return true;
    }
} 