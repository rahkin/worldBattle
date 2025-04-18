export const mockRenderer = {
    setSize: jest.fn(),
    render: jest.fn(),
    domElement: { style: {} },
    dispose: jest.fn()
};

export const mockCamera = {
    aspect: 1,
    updateProjectionMatrix: jest.fn(),
    position: { set: jest.fn() },
    lookAt: jest.fn()
};

export const mockScene = {};

export const mockThree = {
    WebGLRenderer: jest.fn(() => mockRenderer),
    PerspectiveCamera: jest.fn(() => mockCamera),
    Scene: jest.fn(() => mockScene)
}; 