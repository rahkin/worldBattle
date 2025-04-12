# World Battle

A 3D vehicle combat game built with Three.js and CANNON.js.

## Features

- Multiple vehicle types with unique characteristics:
  - **Muscle Car**: High-speed performance vehicle with rear-mounted exhaust
  - **Scorpion**: Agile vehicle with enhanced wheel visibility
  - **Drone**: Hovering vehicle with energy core and hover engines
  - **Junkyard King**: Heavy-duty vehicle with improvised armor
  - **Ironclad**: Heavily armored assault vehicle
  - **Test Vehicle**: For testing damage and collision systems

- Advanced physics simulation:
  - Realistic vehicle handling
  - Collision detection and response
  - Damage system with visual feedback
  - Wheel physics and suspension
  - Vehicle recovery and teleport system

- Visual effects:
  - Dynamic lighting and shadows
  - Post-processing effects
  - Particle systems
  - Health display HUD
  - Respawn countdown timer
  - Explosion effects

- Game mechanics:
  - Vehicle selection system
  - Damage and health system
  - Boost mechanics
  - Camera controls (including rear view)
  - Recovery system with damage penalty
  - Safe position detection for vehicle resets
  - 10-second respawn timer after destruction

## Development

### Recent Updates
- Added 10-second respawn countdown timer with HUD display
- Enhanced vehicle destruction and respawn system
- Implemented proper HUD health display
- Enhanced vehicle models with detailed features
- Added damage testing environment
- Improved wheel physics and visibility
- Added ramps for vehicle jumps
- Added vehicle recovery and teleport system
- Implemented safe position detection for vehicle resets

### Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open `http://localhost:5173` in your browser

### Controls

- WASD: Vehicle movement
- Space: Brake
- Shift: Boost
- R: Toggle rear view camera
- T: Test teleport (development)
- Mouse: Look around
- Scroll: Zoom camera

## Technologies

- Three.js for 3D rendering
- CANNON.js for physics simulation
- Vite for development and building
- JavaScript ES6+

## License

MIT License 