export class LoadingComponent {
    constructor() {
        this.progress = 0;
        this.status = 'idle'; // idle, loading, complete, error
        this.message = '';
        this.totalTiles = 0;
        this.loadedTiles = 0;
        this.stages = {
            tiles: { completed: false, message: 'Fetching map tiles...' },
            terrain: { completed: false, message: 'Generating terrain...' },
            buildings: { completed: false, message: 'Constructing buildings...' },
            roads: { completed: false, message: 'Building roads...' },
            landuse: { completed: false, message: 'Generating land features...' },
            water: { completed: false, message: 'Generating water bodies...' }
        };
    }

    updateProgress(loaded, total) {
        this.loadedTiles = loaded;
        this.totalTiles = total;
        this.progress = total > 0 ? (loaded / total) * 100 : 0;
        this.status = 'loading';
        this.message = `Loading tiles: ${loaded}/${total} (${this.progress.toFixed(1)}%)`;
    }

    updateStage(stageName, completed, message) {
        if (this.stages[stageName]) {
            this.stages[stageName].completed = completed;
            if (message) {
                this.stages[stageName].message = message;
            }
        }
        
        // Update overall progress based on completed stages
        const totalStages = Object.keys(this.stages).length;
        const completedStages = Object.values(this.stages).filter(stage => stage.completed).length;
        this.progress = (completedStages / totalStages) * 100;
        
        // Update message to show current stage
        const currentStage = Object.entries(this.stages).find(([_, stage]) => !stage.completed);
        if (currentStage) {
            this.message = currentStage[1].message;
        }
    }

    setComplete() {
        this.status = 'complete';
        this.message = 'Loading complete';
        this.progress = 100;
        // Mark all stages as complete
        Object.keys(this.stages).forEach(stage => {
            this.stages[stage].completed = true;
        });
    }

    setError(error) {
        this.status = 'error';
        this.message = `Error: ${error.message}`;
        this.progress = 0;
    }

    getStatus() {
        return {
            status: this.status,
            message: this.message,
            progress: this.progress,
            stages: this.stages
        };
    }
} 