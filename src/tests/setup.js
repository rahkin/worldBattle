import { jest } from '@jest/globals';

// Make Jest globals available globally
global.jest = jest;

// Mock WebGL context
class WebGLRenderingContext {
  constructor() {
    this.ARRAY_BUFFER = 34962;
    this.ELEMENT_ARRAY_BUFFER = 34963;
    this.STATIC_DRAW = 35044;
    this.TRIANGLES = 4;
    this.UNSIGNED_SHORT = 5123;
    this.FLOAT = 5126;
    this.createBuffer = jest.fn();
    this.bindBuffer = jest.fn();
    this.bufferData = jest.fn();
    this.enableVertexAttribArray = jest.fn();
    this.vertexAttribPointer = jest.fn();
    this.drawElements = jest.fn();
    this.clear = jest.fn();
    this.clearColor = jest.fn();
    this.viewport = jest.fn();
  }
}

// Mock THREE.js
jest.mock('three', () => {
  const mock = {
    Vector2: jest.fn().mockImplementation((x = 0, y = 0) => ({ x, y })),
    Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z })),
    Scene: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      remove: jest.fn()
    })),
    WebGLRenderer: jest.fn().mockImplementation(() => ({
      setSize: jest.fn(),
      render: jest.fn(),
      dispose: jest.fn(),
      domElement: document.createElement('canvas'),
      setPixelRatio: jest.fn(),
      setClearColor: jest.fn(),
      getContext: jest.fn().mockReturnValue(new WebGLRenderingContext())
    })),
    Box3: jest.fn().mockImplementation(() => ({
      setFromPoints: jest.fn(),
      getCenter: jest.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
      getSize: jest.fn().mockReturnValue({ x: 1, y: 1, z: 1 })
    })),
    BoxGeometry: jest.fn(),
    MeshBasicMaterial: jest.fn(),
    Mesh: jest.fn().mockImplementation(() => ({
      position: { set: jest.fn() },
      rotation: { set: jest.fn() },
      scale: { set: jest.fn() },
      add: jest.fn(),
      remove: jest.fn(),
      dispose: jest.fn()
    })),
    Object3D: jest.fn().mockImplementation(() => ({
      position: { set: jest.fn() },
      rotation: { set: jest.fn() },
      scale: { set: jest.fn() },
      add: jest.fn(),
      remove: jest.fn()
    }))
  };
  return mock;
});

// Mock Mapbox GL JS
global.mapboxgl = {
    Map: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        off: jest.fn(),
        remove: jest.fn()
    })),
    Marker: jest.fn(),
    Popup: jest.fn()
};

// Mock fetch
global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        blob: () => Promise.resolve(new Blob())
    })
);

// Mock console
global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
};

// Mock core modules
jest.mock('../core/Game.js', () => ({
    Game: jest.fn().mockImplementation(() => ({
        init: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        update: jest.fn(),
        dispose: jest.fn()
    }))
}));

jest.mock('../ecs/Entity.js', () => ({
    Entity: jest.fn().mockImplementation(() => ({
        id: 'test-entity',
        components: new Map(),
        addComponent: jest.fn(),
        removeComponent: jest.fn(),
        getComponent: jest.fn(),
        hasComponent: jest.fn(),
        dispose: jest.fn()
    }))
}));

jest.mock('../ecs/Component.js', () => ({
    Component: jest.fn().mockImplementation(() => ({
        entity: null,
        init: jest.fn(),
        update: jest.fn(),
        dispose: jest.fn()
    }))
}));

jest.mock('../ecs/System.js', () => ({
    System: jest.fn().mockImplementation(() => ({
        entities: new Set(),
        init: jest.fn(),
        update: jest.fn(),
        dispose: jest.fn()
    }))
}));

jest.mock('../ecs/World.js', () => ({
    World: jest.fn().mockImplementation(() => ({
        entities: new Set(),
        systems: new Map(),
        addEntity: jest.fn(),
        removeEntity: jest.fn(),
        addSystem: jest.fn(),
        removeSystem: jest.fn(),
        getSystem: jest.fn(),
        update: jest.fn(),
        dispose: jest.fn()
    }))
}));

// Mock building components
jest.mock('../ecs/components/BuildingFootprintComponent.js', () => ({
    BuildingFootprintComponent: jest.fn().mockImplementation(() => ({
        vertices: [],
        height: 0,
        init: jest.fn(),
        addWall: jest.fn(),
        addWindow: jest.fn(),
        addDoor: jest.fn(),
        getBoundingBox: jest.fn().mockReturnValue(new THREE.Box3()),
        getCenter: jest.fn().mockReturnValue(new THREE.Vector3()),
        getArea: jest.fn().mockReturnValue(100),
        isPointInside: jest.fn().mockReturnValue(true),
        dispose: jest.fn()
    }))
}));

jest.mock('../ecs/components/BuildingMaterialComponent.js', () => ({
    BuildingMaterialComponent: jest.fn().mockImplementation(() => ({
        materials: new Map(),
        textures: new Map(),
        wallMaterials: new Map(),
        roofMaterials: new Map(),
        windowMaterials: new Map(),
        doorMaterials: new Map(),
        decals: [],
        init: jest.fn(),
        addMaterial: jest.fn(),
        addTexture: jest.fn(),
        applyWeathering: jest.fn(),
        applyDamage: jest.fn(),
        updateIllumination: jest.fn(),
        createMaterial: jest.fn(),
        createTexture: jest.fn(),
        updateMaterial: jest.fn(),
        transitionMaterial: jest.fn(),
        dispose: jest.fn()
    }))
}));

jest.mock('../ecs/components/BuildingResourceComponent.js', () => ({
    BuildingResourceComponent: jest.fn().mockImplementation(() => ({
        resources: new Map(),
        workers: new Set(),
        productionQueue: [],
        productionRates: new Map(),
        consumptionRates: new Map(),
        init: jest.fn(),
        addResource: jest.fn(),
        removeResource: jest.fn(),
        getResourceAmount: jest.fn().mockReturnValue(0),
        setProductionRate: jest.fn(),
        setConsumptionRate: jest.fn(),
        addWorker: jest.fn(),
        removeWorker: jest.fn(),
        queueProduction: jest.fn(),
        update: jest.fn(),
        dispose: jest.fn()
    }))
}));

jest.mock('../ecs/components/BuildingInteractionComponent.js', () => ({
    BuildingInteractionComponent: jest.fn().mockImplementation(() => ({
        interactionPoints: new Map(),
        events: new Map(),
        cooldowns: new Map(),
        init: jest.fn(),
        addInteractionPoint: jest.fn(),
        addEvent: jest.fn(),
        isWithinInteractionRadius: jest.fn().mockReturnValue(true),
        getNearestInteractionPoint: jest.fn(),
        triggerEvent: jest.fn(),
        handleClick: jest.fn(),
        handleHover: jest.fn(),
        handleDrag: jest.fn(),
        update: jest.fn(),
        dispose: jest.fn()
    }))
}));

jest.mock('../ecs/systems/MapboxBuildingImporter.js', () => ({
    MapboxBuildingImporter: jest.fn().mockImplementation(() => ({
        importQueue: [],
        buildingTemplates: new Map(),
        init: jest.fn(),
        fetchBuildingData: jest.fn().mockResolvedValue([]),
        queueImport: jest.fn(),
        update: jest.fn(),
        dispose: jest.fn()
    }))
}));

// Mock other dependencies
jest.mock('../core/InputManager.js', () => ({
  InputManager: jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    update: jest.fn(),
    dispose: jest.fn()
  }))
}));

jest.mock('../core/ResourceManager.js', () => ({
  ResourceManager: jest.fn().mockImplementation(() => ({
    load: jest.fn(),
    get: jest.fn(),
    dispose: jest.fn()
  }))
}));

jest.mock('../core/EventBus.js', () => ({
  EventBus: jest.fn().mockImplementation(() => ({
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    publish: jest.fn()
  }))
}));

// Mock HTMLCanvasElement
class HTMLCanvasElement {
  constructor() {
    this.width = 800;
    this.height = 600;
  }

  getContext(contextType) {
    if (contextType === 'webgl2' || contextType === 'webgl') {
      return new WebGLRenderingContext();
    }
    return null;
  }
}

// Mock document object
global.document = {
  createElement: (type) => {
    if (type === 'canvas') {
      return new HTMLCanvasElement();
    }
    return {};
  }
};

// Mock window object
global.window = {
  requestAnimationFrame: (callback) => setTimeout(callback, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  innerWidth: 800,
  innerHeight: 600,
  devicePixelRatio: 1,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock performance object
global.performance = {
  now: () => Date.now()
};

// Export for use in tests
export { WebGLRenderingContext, HTMLCanvasElement }; 