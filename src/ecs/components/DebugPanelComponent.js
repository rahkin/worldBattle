import { Component } from '../core/Component.js';

export class DebugPanelComponent extends Component {
    constructor() {
        super();
        this.stats = {
            totalFeatures: 0,
            successCount: 0,
            errorCount: 0,
            successRate: 0,
            currentLayer: '',
            lastUpdate: new Date()
        };
    }

    updateStats(stats) {
        this.stats = {
            ...stats,
            lastUpdate: new Date()
        };
    }

    render() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            z-index: 1000;
        `;

        const title = document.createElement('h3');
        title.textContent = 'World Generation Stats';
        title.style.margin = '0 0 10px 0';
        panel.appendChild(title);

        const statsList = document.createElement('ul');
        statsList.style.listStyle = 'none';
        statsList.style.padding = '0';
        statsList.style.margin = '0';

        const items = [
            `Layer: ${this.stats.currentLayer}`,
            `Total Features: ${this.stats.totalFeatures}`,
            `Successfully Generated: ${this.stats.successCount}`,
            `Failed to Generate: ${this.stats.errorCount}`,
            `Success Rate: ${this.stats.successRate.toFixed(2)}%`,
            `Last Update: ${this.stats.lastUpdate.toLocaleTimeString()}`
        ];

        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            li.style.margin = '5px 0';
            statsList.appendChild(li);
        });

        panel.appendChild(statsList);
        return panel;
    }
} 