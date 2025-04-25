export class LoadingIndicator {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'loading-indicator';
        this.container.style.display = 'none';

        this.progressBar = document.createElement('div');
        this.progressBar.className = 'progress-bar';
        
        this.progressFill = document.createElement('div');
        this.progressFill.className = 'progress-fill';
        
        this.statusText = document.createElement('div');
        this.statusText.className = 'status-text';
        
        this.detailText = document.createElement('div');
        this.detailText.className = 'detail-text';

        this.progressBar.appendChild(this.progressFill);
        this.container.appendChild(this.progressBar);
        this.container.appendChild(this.statusText);
        this.container.appendChild(this.detailText);
        
        document.body.appendChild(this.container);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .loading-indicator {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                color: white;
                font-family: 'Arial', sans-serif;
            }
            
            .progress-bar {
                width: 300px;
                height: 4px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 2px;
                margin: 20px 0;
                overflow: hidden;
            }
            
            .progress-fill {
                width: 0%;
                height: 100%;
                background: #00ff88;
                transition: width 0.3s ease-out;
            }
            
            .status-text {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .detail-text {
                font-size: 16px;
                opacity: 0.7;
            }
        `;
        document.head.appendChild(style);
    }

    async show() {
        this.container.style.display = 'flex';
        return new Promise(resolve => setTimeout(resolve, 100));
    }

    async hide() {
        this.container.style.opacity = '0';
        this.container.style.transition = 'opacity 0.3s ease-out';
        await new Promise(resolve => setTimeout(resolve, 300));
        this.container.style.display = 'none';
        this.container.style.opacity = '1';
    }

    async updateProgress(progress, status, detail) {
        this.progressFill.style.width = `${progress}%`;
        this.statusText.textContent = status || '';
        this.detailText.textContent = detail || '';
        return new Promise(resolve => setTimeout(resolve, 100));
    }
} 