// Mock WebGL context
const mockGL = {
    getParameter: jest.fn(),
    getExtension: jest.fn(),
    createBuffer: jest.fn(),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
    createTexture: jest.fn(),
    bindTexture: jest.fn(),
    texImage2D: jest.fn(),
    texParameteri: jest.fn(),
    createShader: jest.fn(),
    shaderSource: jest.fn(),
    compileShader: jest.fn(),
    getShaderParameter: jest.fn(),
    getShaderInfoLog: jest.fn(),
    createProgram: jest.fn(),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    getProgramParameter: jest.fn(),
    getProgramInfoLog: jest.fn(),
    useProgram: jest.fn(),
    getAttribLocation: jest.fn(),
    enableVertexAttribArray: jest.fn(),
    vertexAttribPointer: jest.fn(),
    drawArrays: jest.fn(),
    clearColor: jest.fn(),
    clear: jest.fn(),
    viewport: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    blendFunc: jest.fn(),
    depthFunc: jest.fn(),
    cullFace: jest.fn(),
    frontFace: jest.fn(),
    polygonOffset: jest.fn(),
    lineWidth: jest.fn(),
    pixelStorei: jest.fn(),
    activeTexture: jest.fn(),
    generateMipmap: jest.fn(),
    uniform1f: jest.fn(),
    uniform2f: jest.fn(),
    uniform3f: jest.fn(),
    uniform4f: jest.fn(),
    uniform1i: jest.fn(),
    uniform2i: jest.fn(),
    uniform3i: jest.fn(),
    uniform4i: jest.fn(),
    uniform1fv: jest.fn(),
    uniform2fv: jest.fn(),
    uniform3fv: jest.fn(),
    uniform4fv: jest.fn(),
    uniform1iv: jest.fn(),
    uniform2iv: jest.fn(),
    uniform3iv: jest.fn(),
    uniform4iv: jest.fn(),
    uniformMatrix2fv: jest.fn(),
    uniformMatrix3fv: jest.fn(),
    uniformMatrix4fv: jest.fn(),
    getUniformLocation: jest.fn(),
    getError: jest.fn().mockReturnValue(0)
};

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation((type) => {
    if (type === 'webgl' || type === 'webgl2') {
        return mockGL;
    }
    return null;
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn().mockImplementation((callback) => {
    return setTimeout(callback, 0);
});

// Mock cancelAnimationFrame
global.cancelAnimationFrame = jest.fn().mockImplementation((id) => {
    clearTimeout(id);
});

// Mock performance.now()
global.performance = {
    now: jest.fn().mockReturnValue(0)
};

// Mock window properties
global.window = {
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 1
};

// Mock canvas and context
HTMLCanvasElement.prototype.getContext = function(contextType) {
    if (contextType === 'webgl' || contextType === 'webgl2') {
        return mockGL;
    }
    return {};
};

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock performance.now()
global.performance = {
    now: () => Date.now()
};

// Mock window properties used by Three.js
global.window = global;
global.document = window.document; 