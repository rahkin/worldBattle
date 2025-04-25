import { System } from '../core/System.js';
import * as THREE from 'three';

export class RendererSystem extends System {
    constructor() {
        super();
        this.renderer = null;
        this.initialized = false;
        console.log('RendererSystem constructed');
    }

    async init() {
        console.log('RendererSystem init starting...');
        if (this.initialized) {
            console.log('RendererSystem already initialized');
            return true;
        }

        try {
            // Create WebGL renderer
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                powerPreference: "high-performance",
                alpha: false // Ensure background is rendered
            });
            
            // Configure renderer
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            this.renderer.setClearColor(0x87ceeb); // Set sky blue clear color
            
            // Style the canvas
            const canvas = this.renderer.domElement;
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.zIndex = '0'; // Below UI elements
            
            // Add to DOM
            document.body.appendChild(canvas);
            console.log('Renderer canvas added to DOM:', {
                width: canvas.width,
                height: canvas.height,
                style: {
                    position: canvas.style.position,
                    zIndex: canvas.style.zIndex,
                    inDOM: !!canvas.parentNode
                }
            });
            
            // Handle window resize
            window.addEventListener('resize', () => this.handleResize());
            
            this.initialized = true;
            console.log('RendererSystem initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize RendererSystem:', error);
            return false;
        }
    }

    getRenderer() {
        if (!this.initialized) {
            console.warn('Getting renderer before initialization');
            this.init();
        }
        return this.renderer;
    }

    render(scene, camera) {
        if (!this.initialized || !scene || !camera) {
            console.warn('Cannot render:', {
                initialized: this.initialized,
                hasScene: !!scene,
                hasCamera: !!camera
            });
            return;
        }

        try {
            this.renderer.render(scene, camera);
        } catch (error) {
            console.error('Render error:', error);
        }
    }

    handleResize() {
        if (!this.initialized) return;
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.renderer.setSize(width, height);
        console.log('Renderer resized:', { width, height });
    }

    cleanup() {
        if (this.renderer) {
            // Remove renderer from DOM
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            
            // Dispose of renderer resources
            this.renderer.dispose();
            this.renderer = null;
        }
        
        // Remove resize listener
        window.removeEventListener('resize', () => this.handleResize());
        
        this.initialized = false;
        console.log('RendererSystem cleaned up');
    }
} 