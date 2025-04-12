# World Battle

A multiplayer vehicle combat game set in real-world cities with dynamic weather and day/night cycles.

## Implementation Plan

### Phase 1: Core Vehicle Mechanics
- [x] Project structure setup
- [x] Vehicle model import (Razorback)
- [x] Basic textures applied
- [x] Movement system (acceleration, turning, suspension)
- [x] Physics setup with Cannon-es (gravity, friction, collisions)
- [ ] Vehicle damage states and explosion
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

## Development Log

### 2024-03-22 (Update 2)
- Added rearview camera system for both first and third-person modes
- Implemented smooth camera transitions for rearview
- Added 'R' key for rearview toggle
- Enhanced camera controller with improved quaternion handling

### 2024-03-22
- Fixed wheel rotation issues across all vehicles
- Added brake calipers to both sides of wheels for realism
- Improved wheel geometry and materials
- Enhanced vehicle visual features and materials
- Fixed Scorpion wheel initialization bug

### 2024-03-21
- Implemented smooth engine force application
- Added boost system with cooldown
- Improved vehicle controls and physics
- Fixed braking system to prevent flipping
- Added camera effects for boost and braking

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open `http://localhost:5173` in your browser

## Controls

- W/S: Accelerate/Reverse
- A/D: Steer Left/Right
- Space: Brake
- Shift: Boost
- C: Toggle Camera Mode (First/Third Person)
- R: Toggle Rearview (Hold)
- Mouse: Look around
- ESC: Pause menu

## Technologies Used

- Three.js for 3D rendering
- Cannon-es for physics simulation
- Vite for development and building
- Mapbox for real-world map data
- Colyseus for multiplayer server
- Socket.io for networking
- Howler.js for sound effects
- Yuka for AI and NPCs
- Custom ECS for game logic
- three-mesh-ui for 3D user interfaces
- dat.GUI for debug controls

## Technologies & Tools Breakdown

### Core Systems
- **Physics Engine**: Cannon-es
  - Modern physics simulation
  - Improved performance over CANNON.js
  - Better TypeScript support

- **Game Logic**: Custom ECS
  - Entity Component System architecture
  - Modular and efficient game state management
  - Flexible component-based design

### Multiplayer & Networking
- **Server Framework**: Colyseus
  - State synchronization
  - Room management
  - Client prediction

- **Network Transport**: Socket.io
  - Reliable real-time communication
  - Fallback transport methods
  - Connection state management

### Audio & Visual
- **Sound System**: Howler.js
  - Spatial audio support
  - Multiple audio sprite handling
  - Cross-browser compatibility

- **User Interface**: 
  - three-mesh-ui for 3D interfaces
  - dat.GUI for debug controls
  - Custom overlays for HUD

### AI & Behavior
- **NPC System**: Yuka
  - Vehicle AI behaviors
  - Pathfinding
  - Steering behaviors
  - Goal-oriented action planning

## Vehicle Types

### Tank
- Light armored vehicle with rotating turret and tracks
- Mass: 1200 units
- Good balance of speed and durability
- Features: Modern turret design, long-barrel gun, detailed tracks
- Color: Military olive drab
- Special: High mobility with maintained firepower

### Ironclad
- Heavily armored battle vehicle
- Mass: 1500 units
- High durability, moderate speed
- Features: Reinforced armor plating on front and sides
- Color: Brown

### Muscle Car
- Classic high-performance vehicle
- Mass: 800 units
- Balanced weight and performance
- Features: Boost capability, powerful engine
- Color: Green

### Scorpion
- Light and agile racing vehicle
- Mass: 400 units
- High speed, lower durability
- Features: Aerodynamic spoiler and side skirts
- Color: Orange-red

### Drone
- Futuristic hover vehicle
- Mass: 300 units
- Extremely light and agile
- Features: Hover engines, energy core, emissive effects
- Color: Deep sky blue

## Recent Updates
- Added rearview camera system with smooth transitions
- Implemented rearview in both first and third-person modes
- Fixed wheel rotation and brake caliper positioning
- Enhanced wheel geometry and materials across all vehicles
- Improved vehicle visual features and materials
- Fixed Scorpion class wheel initialization
- Added symmetrical brake calipers to all wheels
- Rebalanced vehicle masses for more realistic physics
- Adjusted vehicle handling characteristics
- Fixed tank turret orientation
- Added visual improvements to all vehicles

## Project Structure

```
src/
├── ai/              # AI behavior and pathfinding
├── assets/          # Game assets and resources
├── audio/           # Sound effects and music
├── core/            # Core game systems
├── ecs/             # Entity Component System
├── multiplayer/     # Networking and multiplayer
├── physics/         # Physics simulation
│   └── vehicles/    # Vehicle implementations
│       ├── BaseCar.js
│       ├── Drone.js
│       ├── Ironclad.js
│       ├── JunkyardKing.js
│       ├── MuscleCar.js
│       ├── Scorpion.js
│       └── Tank.js
├── rendering/       # Graphics and visual effects
├── styles/          # CSS and styling
├── ui/             # User interface components
├── utils/          # Utility functions
└── xr/             # VR/AR functionality

Key Components:
- index.js          # Main entry point
- physics/          # Vehicle physics and collision
- rendering/        # Three.js scene management
- multiplayer/      # Colyseus server integration
- ui/              # three-mesh-ui components
- audio/           # Howler.js sound system
```

## Planned Vehicle Types

### Ground Vehicles (Implemented)
- Tank: Heavy assault vehicle
- Ironclad: Armored battle vehicle
- Muscle Car: Performance vehicle
- Scorpion: Racing vehicle
- Drone: Hover vehicle
- Junkyard King: Post-apocalyptic vehicle

### Air Vehicles (Planned)
- **Attack Helicopter**
  - Agile air support role
  - Moderate armor, high maneuverability
  - Features: Missile pods, chin-mounted gun
  - Special: Hover capability, lock-on targeting

- **Gunship**
  - Heavy air assault platform
  - High armor, moderate speed
  - Features: Multiple weapon hardpoints, heavy armor
  - Special: Area suppression capabilities

- **Fighter Jet**
  - High-speed interceptor
  - Low armor, extreme speed
  - Features: Afterburners, air-to-ground weapons
  - Special: Sonic boom effect, high-altitude capability

### Sea Vehicles (Planned)
- **Speedboat**
  - Fast water transport
  - Very low armor, high speed
  - Features: Wake effects, water spray
  - Special: Wave jumping capability

- **Battleship**
  - Heavy naval combat vessel
  - Extreme armor, low speed
  - Features: Multiple turrets, radar system
  - Special: Long-range artillery support

- **Submarine**
  - Stealth underwater vehicle
  - High armor, moderate speed
  - Features: Torpedo tubes, periscope
  - Special: Dive capability, sonar system 