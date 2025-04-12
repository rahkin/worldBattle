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

## Vehicle Types

### Junkyard King
- Heavy, durable vehicle built from scrap metal
- Enhanced traction and stability
- Scrap Launcher weapon system:
  - Fires 5 projectiles simultaneously in a dense spread pattern
  - Increased range with 150 m/s projectile speed
  - 75 damage per projectile
  - 800ms fire rate
  - Controlled circular spread pattern for better accuracy
  - Orange-tinted muzzle flash effects

### Ironclad
- Heavily armored combat vehicle
- 25mm chain gun with rapid fire capability
- High damage resistance
- Moderate speed and handling

### Tank
- Light armored tank with good mobility
- High-powered main gun
- Long-range capabilities
- Balanced armor and speed

### Muscle Car
- High-speed performance vehicle
- Boost capability
- Excellent handling
- Lower durability
- Dual front-mounted machine guns:
  - Fast fire rate (100ms between shots)
  - Low damage per shot (15 damage)
  - Speed-based spread accuracy
  - Red tracer rounds
  - Muzzle flash effects

### Scorpion
- Lightweight and fast
- Agile handling
- Lower durability
- High maneuverability
- Dual plasma cannons
  - Fast fire rate (150ms between shots)
  - Medium damage (20 per shot)
  - High projectile speed (250 units/s)
  - Cyan energy projectiles with trails
  - Dynamic spread based on vehicle speed
  - Energy burst effects on firing

### Drone
- **Description**: Futuristic hover vehicle with extreme speed
- **Stats**:
  - Speed: 10
  - Handling: 9
  - Durability: 3
- **Special Features**:
  - Hover capability
  - Extreme maneuverability
  - Dual energy beam weapons
    - Fast-firing energy projectiles
    - Velocity inheritance for high-speed combat
    - Blue energy trails and effects
    - Forward-mounted emitters

## Implementation Plan

### Phase 1: Core Vehicle Mechanics
- [x] Project structure setup
- [x] Vehicle model import (Razorback)
- [x] Basic textures applied
- [x] Movement system (acceleration, turning, suspension)
- [x] Physics setup with Cannon-es (gravity, friction, collisions)
- [x] Vehicle damage states and explosion
- [ ] Weapon system (Dual Cannons, projectile firing)
- [ ] Power-up system (Health, Speed, Overcharge)
- [ ] Resupply system (ammo refill with cooldown)
- [ ] Day/Night system (24-hour cycle, lighting, headlights)
- [ ] Weather system (Clear, Rain, Fog, Storm)
- [ ] Sound effects using Howler.js
- [ ] Custom ECS implementation for game logic

### Phase 2: Map Integration
- [ ] Manila rendered with 3D terrain and buildings
- [ ] Camera synced to vehicle position
- [ ] Teleport system (text input and location jump)
- [ ] Minimap with player, power-ups, resupply points
- [ ] Power-up placement on roads (spatial logic)
- [ ] Resupply point placement via real POIs
- [ ] Lighting sync with local time (Mapbox)
- [ ] Real-world weather visual overlays
- [ ] GUI implementation with three-mesh-ui

### Phase 3: Multiplayer Functionality
- [ ] Colyseus server setup with real-time sync
- [ ] Vehicle movement synchronization
- [ ] Weapon fire and health sync
- [ ] Lobby system with disconnect handling
- [ ] Power-up sync (spawn, pickup, effects)
- [ ] Resupply sync (usage and cooldown)
- [ ] Synchronized day/night across all players
- [ ] Synchronized weather and effects
- [ ] Socket.io implementation for reliable networking

### Phase 4: UI & Polish
- [ ] Minimap enhancements (zoom, drag, markers)
- [ ] Teleport UI with autocomplete
- [ ] Weapon cooldown bar (color-coded)
- [ ] Power-up popup and timers
- [ ] Resupply ammo bar and proximity alert
- [ ] Day/Night clock, headlight toggle
- [ ] Weather icon and visibility bar
- [ ] Visual effects (explosions, sparks, weather)
- [ ] dat.GUI implementation for debug controls

### Phase 5: Expansion & Optimization
- [ ] Add new vehicle types:
  - Air Vehicles:
    - Attack Helicopter (agile air support)
    - Gunship (heavy air assault)
    - Fighter Jet (high-speed interceptor)
  - Sea Vehicles:
    - Speedboat (fast water transport)
    - Battleship (heavy naval combat)
    - Submarine (stealth underwater)
- [ ] New power-ups: Shield Boost, Trap Drop
- [ ] Expand resupply types and POIs
- [ ] Add Snow and Heatwave weather types
- [ ] Night-only power-ups and seasonal day/night
- [ ] Add cities: New York, London, Sydney
- [ ] Level-of-detail optimization
- [ ] Cap physics/network load, despawn idle pickups
- [ ] Cache map data, reduce weather API calls
- [ ] 8-player stress test with all systems active
- [ ] Final balancing and iteration from playtests

### Phase 6: AI & NPCs (Using Yuka)
- [ ] Basic AI driver implementation
  - Path following
  - Obstacle avoidance
  - Target pursuit
- [ ] Advanced vehicle behaviors
  - Combat tactics
  - Formation driving
  - Team coordination
- [ ] NPC Types:
  - Civilian vehicles (ambient traffic)
  - Enemy combat units
  - Squad members
- [ ] AI Director system
  - Dynamic difficulty adjustment
  - Event spawning
  - Combat intensity control
- [ ] Behavior Trees
  - Combat decision making
  - Role-based actions
  - Strategic objectives
- [ ] Environment awareness
  - Threat detection
  - Resource management
  - Territory control
- [ ] Performance optimization
  - LOD for AI processing
  - Behavior pooling
  - Priority scheduling

## Project Structure

```
src/
├── core/
│   ├── Game.js              # Main game loop and state
│   ├── InputManager.js      # Input handling
│   ├── GameLoop.js         # Game timing
│   └── DamageTest.js       # Testing environment
├── physics/
│   ├── PhysicsWorld.js     # Physics simulation
│   ├── VehicleDamageSystem.js     # Vehicle damage handling
│   └── vehicles/
│       ├── BaseCar.js      # Base vehicle class
│       ├── MuscleCar.js    # Muscle car implementation
│       ├── Scorpion.js     # Scorpion implementation
│       ├── Drone.js        # Drone implementation
│       ├── JunkyardKing.js # Junkyard King implementation
│       ├── Ironclad.js     # Ironclad implementation
│       └── TestVehicle.js  # Test vehicle
├── rendering/
│   ├── SceneManager.js     # Scene management
│   ├── CameraManager.js    # Camera control
│   ├── HealthDisplay.js    # HUD elements
│   └── VehicleSelector.js  # Vehicle selection UI
└── utils/
    ├── Constants.js        # Game constants
    ├── Materials.js        # Material definitions
    └── Debug.js           # Debug utilities
```

## Development

### Recent Updates
- Added 10-second respawn countdown timer
- Enhanced vehicle destruction and respawn system
- Improved HUD display with respawn counter
- Fixed vehicle cleanup during respawn
- Enhanced explosion effects and particle systems
- Added dual machine gun system to Muscle Car
- Implemented projectile system with tracer rounds
- Added muzzle flash effects
- Added speed-based weapon spread
- Added dual plasma cannon system to Scorpion
  - Fast-firing energy weapons
  - Cyan energy projectiles with trails
  - Dynamic spread based on vehicle speed
  - Energy burst effects on firing
- Implemented projectile system with energy trails
- Added muzzle flash and energy burst effects
- Enhanced vehicle damage system
- Added vehicle respawn functionality
- Improved explosion effects and particle systems
- Added vehicle selection UI
- Implemented health display system
- Added debug visualization tools
- Added dual energy beam weapon system to Drone
  - Forward-mounted energy emitters
  - Velocity inheritance for high-speed combat
  - Blue energy trails and visual effects
  - Improved projectile physics
- Enhanced vehicle damage system
- Improved explosion effects and particle systems
- Added vehicle cleanup during respawn
- Fixed projectile system integration

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

## Development Guidelines

### Code Style
- Use ES6+ features
- Follow modular design patterns
- Document complex physics calculations
- Use consistent naming conventions

### Physics Guidelines
- Keep physics timestep constant
- Use proper mass ratios
- Implement smooth transitions
- Handle edge cases gracefully

### Performance
- Optimize render loops
- Manage memory efficiently
- Use object pooling
- Implement proper cleanup

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Development Log

### 2025-04-12
- Added 10-second respawn countdown timer
- Enhanced vehicle destruction and respawn system
- Improved HUD display with respawn counter
- Fixed vehicle cleanup during respawn
- Enhanced explosion effects and particle systems

### 2025-03-22 (Update 2)
- Added rearview camera system for both first and third-person modes
- Implemented smooth camera transitions for rearview
- Added 'R' key for rearview toggle
- Enhanced camera controller with improved quaternion handling

### 2025-03-22
- Fixed wheel rotation issues across all vehicles
- Added brake calipers to both sides of wheels for realism
- Improved wheel geometry and materials
- Enhanced vehicle visual features and materials
- Fixed Scorpion wheel initialization bug

### 2025-03-21
- Implemented smooth engine force application
- Added boost system with cooldown
- Improved vehicle controls and physics
- Fixed braking system to prevent flipping
- Added camera effects for boost and braking

## Damage System

The game features a comprehensive vehicle damage system:

- Health-based damage tracking (0-100%)
- Visual damage states:
  - Light damage: Minor dents and scratches
  - Medium damage: Visible deformation
  - Heavy damage: Severe structural damage
  - Critical damage: Smoke effects
- Destruction sequence:
  - Vehicle explodes when health reaches 0
  - 10-second respawn countdown
  - Vehicle respawns with same type/properties
- Recovery mechanics:
  - Manual recovery with health penalty
  - Safe position detection
  - Cooldown system 

## Weapon Systems Progress
- [x] Tank cannon (static forward-facing turret with 8s reload)
- [x] Ironclad cannon
- [ ] Remaining weapon systems in development

Key Features:
- Tank cannon fires large orange projectiles with realistic reload time
- Static turret design for reliability
- Muzzle flash effects
- Long-range projectiles (1600 units)
- High accuracy with minimal spread 