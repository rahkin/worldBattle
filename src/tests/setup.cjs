import { jest } from '@jest/globals';

// Make Jest globals available
global.jest = jest;

// Mock WebGL context
class MockWebGLRenderingContext {
  constructor() {
    // WebGL constants
    this.ARRAY_BUFFER = 34962;
    this.ELEMENT_ARRAY_BUFFER = 34963;
    this.STATIC_DRAW = 35044;
    this.FLOAT = 5126;
    this.TRIANGLES = 4;
    this.UNSIGNED_SHORT = 5123;
    this.COLOR_BUFFER_BIT = 16384;
    this.DEPTH_BUFFER_BIT = 256;
    this.STENCIL_BUFFER_BIT = 1024;
    this.DEPTH_TEST = 2929;
    this.CULL_FACE = 2884;
    this.BLEND = 3042;
    this.SCISSOR_TEST = 3089;
  }

  // WebGL methods
  createBuffer() { return {}; }
  bindBuffer() {}
  bufferData() {}
  createProgram() { return {}; }
  createShader() { return {}; }
  clear() {}
  clearColor() {}
  clearDepth() {}
  enable() {}
  disable() {}
  viewport() {}
}

// Mock HTMLCanvasElement
class MockHTMLCanvasElement {
  constructor() {
    this.width = 800;
    this.height = 600;
    this.style = {};
  }

  getContext() {
    return new MockWebGLRenderingContext();
  }
}

// Mock window and document
global.window = {
  innerWidth: 1024,
  innerHeight: 768,
  devicePixelRatio: 1,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  requestAnimationFrame: jest.fn(),
  cancelAnimationFrame: jest.fn(),
};

global.document = {
  createElement: (type) => {
    if (type === 'canvas') {
      return new MockHTMLCanvasElement();
    }
    return {};
  }
};

// Mock THREE.js classes
const mockVector2 = jest.fn().mockImplementation(() => ({
  x: 0,
  y: 0,
  set: jest.fn(),
  copy: jest.fn(),
  add: jest.fn().mockReturnThis(),
  sub: jest.fn().mockReturnThis(),
  multiplyScalar: jest.fn().mockReturnThis(),
}));

const mockVector3 = jest.fn().mockImplementation(() => ({
  x: 0,
  y: 0,
  z: 0,
  set: jest.fn(),
  copy: jest.fn(),
  add: jest.fn().mockReturnThis(),
  sub: jest.fn().mockReturnThis(),
  multiplyScalar: jest.fn().mockReturnThis(),
}));

const mockBox3 = jest.fn().mockImplementation(() => ({
  min: mockVector3(),
  max: mockVector3(),
  setFromPoints: jest.fn(),
  containsPoint: jest.fn().mockReturnValue(true),
}));

const mockScene = jest.fn().mockImplementation(() => ({
  add: jest.fn(),
  remove: jest.fn(),
  children: [],
}));

const mockWebGLRenderer = jest.fn().mockImplementation(() => ({
  setSize: jest.fn(),
  render: jest.fn(),
  domElement: { style: {} },
  dispose: jest.fn(),
}));

// Mock THREE module
const mockThree = {
  Vector2: mockVector2,
  Vector3: mockVector3,
  Box3: mockBox3,
  Scene: mockScene,
  WebGLRenderer: mockWebGLRenderer,
  RepeatWrapping: 'RepeatWrapping',
  TextureLoader: jest.fn(() => ({
    load: jest.fn().mockReturnValue({
      wrapS: 'RepeatWrapping',
      wrapT: 'RepeatWrapping',
      repeat: { x: 1, y: 1 }
    })
  })),
  MeshStandardMaterial: jest.fn((params) => ({
    ...params,
    dispose: jest.fn(),
    color: { r: 1, g: 1, b: 1 },
    roughness: 0.5,
    metalness: 0.0,
    emissiveIntensity: 0
  }))
};

// Mock building component
const mockBuildingComponent = {
  addDoor: jest.fn(),
  getBoundingBox: jest.fn().mockReturnValue(mockBox3()),
  getCenter: jest.fn().mockReturnValue(mockVector3()),
  getArea: jest.fn().mockReturnValue(100),
  isPointInside: jest.fn().mockReturnValue(true),
};

// Export everything needed by tests
export {
  MockWebGLRenderingContext,
  MockHTMLCanvasElement,
  mockBuildingComponent,
  mockVector2,
  mockVector3,
  mockBox3,
  mockScene,
  mockWebGLRenderer,
  mockThree as default
}; 