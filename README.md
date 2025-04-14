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
  - Enhanced star field system:
    - High-precision star rendering with multi-layer shading
    - Accurate constellation mapping (Big Dipper, Orion, Cassiopeia, etc.)
    - Dynamic star visibility based on time of day
    - Optimized rendering with logarithmic depth buffer
    - Realistic star clustering and distribution
    - Natural color temperature distribution
    - Sharp point rendering for clear visibility

- Game mechanics:
  - Vehicle selection system
  - Damage and health system
  - Boost mechanics
  - Camera controls (including rear view)
  - Recovery system with damage penalty
  - Safe position detection for vehicle resets
  - 10-second respawn timer after destruction
  - Dynamic day/night cycle:
    - Real-time based lighting
    - Smooth transitions between day and night
    - Time zone support for future Mapbox integration
    - Dynamic sky colors and fog effects

- [x] Power-up system with visual effects and HUD
  - Health restoration
  - Speed boost
  - Weapon overcharge
  - Shield protection
  - Visual collection effects
  - Top-right HUD display with timers
  - Duration extension on duplicate collection

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
- [x] Weapon system (Dual Cannons, projectile firing)
- [x] Power-up system (Health, Speed, Overcharge)
- [x] Mine system (Deployment, Chain Reactions)
- [x] Resupply system (ammo refill with cooldown)
- [x] Day/Night system (24-hour cycle, lighting)
- [x] Weather system (Clear, Cloudy, Foggy, Storm)
  - Dynamic cloud generation and movement
  - Realistic fog effects
  - Weather transitions
  - Time-of-day lighting effects on clouds
  - Automatic weather cycling
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
- [ ] Day/Night clock
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
worldBattle/
├── src/
│   ├── core/
│   │   ├── Game.js
│   │   ├── InputManager.js
│   │   └── PowerUpSystem.js
│   ├── input/
│   │   └── InputState.js
│   ├── physics/
│   │   ├── MineSystem.js
│   │   ├── VehicleDamageSystem.js
│   │   └── vehicles/
│   │       ├── BaseCar.js
│   │       ├── MuscleCar.js
│   │       ├── Tank.js
│   │       ├── Drone.js
│   │       ├── Scorpion.js
│   │       ├── Ironclad.js
│   │       └── JunkyardKing.js
│   ├── ui/
│   │   ├── HealthBar.js
│   │   └── PowerUpDisplay.js
│   └── utils/
│       └── GeometryUtils.js
├── assets/
│   ├── models/
│   ├── textures/
│   └── sounds/
├── styles/
│   └── main.css
├── index.html
├── package.json
├── README.md
└── DEVLOG.md
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
- Enhanced rear lights for all vehicles:
  - Tank: Military-style dual light strips with enhanced glow effects
  - Ironclad: Triple light strips with industrial look and intense glow
  - Junkyard King: Asymmetric light assemblies with scrappy aesthetic
  - Muscle Car: Custom rear lights with larger light strip and higher emissive intensity
  - Scorpion: Enhanced wheel visibility with custom light positioning
  - Drone: Unique lighting features with energy core and hover engine glow
- Improved vehicle visual effects:
  - Consistent light positioning across all vehicles
  - Enhanced glow effects with multiple layers
  - Optimized light materials and emissive properties
  - Removed unnecessary housing around lights for cleaner look

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

## Game Systems

### Mine System
- Deployable mines from vehicle rear
- Visual arming sequence with blinking effect
- Chain reaction explosions
- Damage and force application
- Mine resupply through power-ups
- Features:
  - Top-rear deployment
  - 2-second arming delay
  - Visual indicators (spikes, glow effects)
  - Chain reaction radius of 3 units
  - Proper collision handling with vehicles
  - No interference with power-up collection

## DEVLOG

### April 15, 2024
- Implemented complete mine system overhaul:
  - Fixed collision detection issues
  - Added chain reaction system
  - Improved visual feedback
  - Fixed multiple damage application bug
  - Added proper deployment from vehicle top
  - Improved mine physics and dropping mechanics
  - Added visual effects (spikes, glow, pulsing)
  - Separated power-up and mine collision groups
  - Added proper cleanup of exploded mines

### File Structure
```
src/
├── core/
│   ├── Game.js             # Main game logic
│   ├── InputManager.js     # Input handling
│   ├── GameLoop.js        # Game loop management
│   ├── TimeSystem.js      # Day/night cycle
│   └── WeatherSystem.js   # Weather effects
├── physics/
│   ├── PhysicsWorld.js    # Physics engine setup
│   ├── VehicleFactory.js  # Vehicle creation
│   ├── MineSystem.js      # Mine mechanics
│   ├── PowerUpSystem.js   # Power-up handling
│   └── CollisionSystem.js # Collision management
├── rendering/
│   ├── SceneManager.js    # Scene management
│   └── CameraManager.js   # Camera controls
├── ui/
│   ├── HealthBar.js       # Health display
│   ├── AmmoDisplay.js     # Ammo counter
│   ├── MineDisplay.js     # Mine counter
│   └── PowerUpDisplay.js  # Power-up effects
└── vehicles/
    ├── BaseCar.js         # Base vehicle class
    ├── MuscleCar.js       # Muscle car variant
    └── Scorpion.js        # Scorpion variant
``` 