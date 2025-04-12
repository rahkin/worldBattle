# World Battle

A multiplayer vehicle combat game set in real-world cities with dynamic weather and day/night cycles.

## Implementation Plan

### Phase 1: Core Vehicle Mechanics
- [x] Project structure setup
- [x] Vehicle model import (Razorback)
- [x] Basic textures applied
- [x] Movement system (acceleration, turning, suspension)
- [x] Physics setup (gravity, friction, collisions)
- [ ] Vehicle damage states and explosion
- [ ] Weapon system (Dual Cannons, projectile firing)
- [ ] Power-up system (Health, Speed, Overcharge)
- [ ] Resupply system (ammo refill with cooldown)
- [ ] Day/Night system (24-hour cycle, lighting, headlights)
- [ ] Weather system (Clear, Rain, Fog, Storm)

### Phase 2: Map Integration
- [ ] Manila rendered with 3D terrain and buildings
- [ ] Camera synced to vehicle position
- [ ] Teleport system (text input and location jump)
- [ ] Minimap with player, power-ups, resupply points
- [ ] Power-up placement on roads (spatial logic)
- [ ] Resupply point placement via real POIs
- [ ] Lighting sync with local time (Mapbox)
- [ ] Real-world weather visual overlays

### Phase 3: Multiplayer Functionality
- [ ] Server setup with real-time sync
- [ ] Vehicle movement synchronization
- [ ] Weapon fire and health sync
- [ ] Lobby system with disconnect handling
- [ ] Power-up sync (spawn, pickup, effects)
- [ ] Resupply sync (usage and cooldown)
- [ ] Synchronized day/night across all players
- [ ] Synchronized weather and effects

### Phase 4: UI & Polish
- [ ] Minimap enhancements (zoom, drag, markers)
- [ ] Teleport UI with autocomplete
- [ ] Weapon cooldown bar (color-coded)
- [ ] Power-up popup and timers
- [ ] Resupply ammo bar and proximity alert
- [ ] Day/Night clock, headlight toggle
- [ ] Weather icon and visibility bar
- [ ] Visual effects (explosions, sparks, weather)
- [ ] Add vehicles: Ironclad, Scorpion, Junkyard King

### Phase 5: Expansion & Optimization
- [ ] Add new vehicles: Tank, Drone
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

## Development Log

### 2024-03-21
- Implemented smooth engine force application
- Added boost system with cooldown
- Improved vehicle controls and physics
- Fixed braking system to prevent flipping
- Added camera effects for boost and braking

### 2024-03-20
- Set up basic project structure
- Implemented vehicle physics with CANNON.js
- Added Razorback vehicle model
- Created basic movement system
- Implemented camera following system

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
- Mouse: Look around
- ESC: Pause menu

## Technologies Used

- Three.js for 3D rendering
- CANNON.js for physics
- Vite for development and building
- Mapbox for real-world map data
- WebSocket for multiplayer functionality

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
- Rebalanced vehicle masses for more realistic physics
- Adjusted vehicle handling characteristics
- Fixed tank turret orientation
- Added visual improvements to all vehicles 