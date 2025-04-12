# Development Log

## Vehicle Physics Implementation

### 2024-03-22 - Vehicle Control and Physics Improvements

#### Control System Refinements
- Fixed inverted forward/reverse controls
- Corrected steering direction
- Adjusted camera position to view from front of vehicle
- Enhanced wheel contact detection stability

#### Physics Parameter Updates
```javascript
const wheelOptions = {
    radius: 0.4,
    directionLocal: new CANNON.Vec3(0, -1, 0),    // Suspension direction: down
    suspensionStiffness: 50,                       // Increased for better stability
    suspensionRestLength: 0.4,                     // Increased for more travel
    frictionSlip: 5,                               // Reduced to prevent sticking
    dampingRelaxation: 2.3,
    dampingCompression: 4.4,
    maxSuspensionForce: 100000,
    rollInfluence: 0.01,
    axleLocal: new CANNON.Vec3(1, 0, 0),          // Corrected axle direction
};
```

#### Wheel Position Adjustments
- Moved wheel positions to neutral height (Y: 0)
- Corrected wheel positions relative to chassis
- Improved wheel contact detection stability

### 2024-03-XX - Initial Vehicle Setup

#### Vehicle Factory Implementation
- Created `VehicleFactory` class to manage vehicle creation and updates
- Implemented basic chassis and wheel setup
- Added initial physics parameters for testing

#### Wheel Physics Configuration
```javascript
const wheelOptions = {
    radius: 0.4,
    directionLocal: new CANNON.Vec3(0, -1, 0),    // Suspension direction: down
    suspensionStiffness: 30,
    suspensionRestLength: 0.3,
    frictionSlip: 5,
    dampingRelaxation: 2.3,
    dampingCompression: 4.4,
    maxSuspensionForce: 100000,
    rollInfluence: 0.01,
    axleLocal: new CANNON.Vec3(-1, 0, 0),         // Axle direction: left to right
};
```

### Wheel Orientation Fixes

#### Challenge: Wheel Orientation
Initial implementation had wheels laying flat instead of standing vertically.

#### Solution:
1. Pre-rotated wheel geometry to align with Cannon.js physics:
```javascript
const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 32);
wheelGeometry.rotateZ(Math.PI / 2); // Rotate geometry instead of mesh
```

2. Simplified wheel transform updates:
```javascript
vehicle.wheelInfos.forEach((wheelInfo, i) => {
    vehicle.updateWheelTransform(i);
    const t = wheelInfo.worldTransform;
    wheelMesh.position.copy(t.position);
    wheelMesh.quaternion.copy(t.quaternion);
});
```

### Technical Decisions

#### Wheel Setup
- Chose to use `RaycastVehicle` for better physics simulation
- Configured wheel positions symmetrically around chassis
- Added debug logging for wheel configuration verification

#### Visual Representation
- Used `BoxGeometry` for chassis and `CylinderGeometry` for wheels
- Applied material properties for realistic appearance
- Implemented shadow casting for better visual quality

#### Physics Parameters
- Set chassis mass to 150 for balanced handling
- Tuned suspension parameters for realistic behavior
- Adjusted friction and rolling characteristics

### Planned Improvements

1. Vehicle Handling
   - Fine-tune suspension parameters
   - Adjust friction coefficients
   - Implement differential steering

2. Visual Enhancements
   - Add detailed car model
   - Implement wheel textures
   - Add particle effects for tire smoke

3. Physics Refinements
   - Add air resistance
   - Implement terrain interaction
   - Add collision response improvements 