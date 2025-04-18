import { jest } from '@jest/globals';

// Mock implementation of THREE.js
const mockRenderer = {
    setSize: jest.fn(),
    render: jest.fn(),
    domElement: { style: {} },
    dispose: jest.fn()
};

const mockCamera = {
    aspect: 1,
    updateProjectionMatrix: jest.fn(),
    position: { set: jest.fn() },
    lookAt: jest.fn()
};

const mockScene = {};

export const WebGLRenderer = jest.fn(() => mockRenderer);
export const PerspectiveCamera = jest.fn(() => mockCamera);
export const Scene = jest.fn(() => mockScene);

export default {
    WebGLRenderer,
    PerspectiveCamera,
    Scene
};

// Export named exports as well
export { WebGLRenderer, PerspectiveCamera, Scene };

export const Vector3 = () => ({ x: 0, y: 0, z: 0 });
export const Color = () => {};
export const Fog = () => {};
export const AmbientLight = () => {};
export const DirectionalLight = () => {};

export { mockRenderer, mockCamera, mockScene }; 