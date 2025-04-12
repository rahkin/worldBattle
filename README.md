# World Battle Racing Game

A 3D racing game built with Three.js for graphics and Cannon.js for physics simulation.

## Features

- 3D vehicle physics simulation using Cannon.js
- Realistic wheel mechanics with suspension and steering
- Dynamic vehicle controls
- Real-time physics-based movement and collisions
- Smooth graphics rendering with Three.js

## Implementation Plan (Phased)

### Phase 1: Environment Setup ⏳
- [ ] Set up Three.js renderer and scene
- [ ] Load Mapbox terrain with buildings
- [ ] Sync Three.js camera with Mapbox camera

### Phase 2: Vehicle & Physics 🚗
- [x] Create a vehicle using cannon-es (box chassis + 4 wheel spheres)
- [x] Connect wheels using constraints
- [ ] Add acceleration, braking, and steering

### Phase 3: Camera Controls 🎥
- [ ] Toggle between first-person and third-person cameras
- [ ] Smoothly follow the player's vehicle

### Phase 4: Weapons & Combat 💥
- [ ] Attach dummy weapons to vehicles
- [ ] Implement projectile firing or raycasting
- [ ] Create health and damage system
- [ ] Display health bar in UI

### Phase 5: Multiplayer 🌐
- [ ] Set up Colyseus server and room logic
- [ ] Sync positions, health, and actions between players
- [ ] Handle joining, leaving, respawning

### Phase 6: AI Bots 🤖
- [ ] Integrate Yuka AI for bot driving logic
- [ ] Allow patrol, chase, attack behaviors
- [ ] Add configurable difficulty and count

### Phase 7: ECS Architecture 🏗️
- [ ] Use ECSY or build a minimal ECS framework
- [ ] Implement reusable systems and components for logic, physics, rendering

### Phase 8: Sound Effects 🔊
- [ ] Load engine sounds, gunfire, explosions using howler.js
- [ ] Add background music (optional)

### Phase 9: UI & Debugging 🛠️
- [ ] Implement dat.GUI panel for debugging and toggles
- [ ] Build in-game HUD using three-mesh-ui or canvas overlays

## Technical Stack

- Three.js - 3D graphics rendering
- Cannon.js - Physics simulation
- JavaScript/ES6+ - Core programming language

## Getting Started

### Prerequisites

- Node.js (v14 or higher recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/worldBattle.git
cd worldBattle
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Vehicle Physics System

The game features a sophisticated vehicle physics system:

- Raycast Vehicle implementation for realistic wheel behavior
- Configurable suspension and wheel properties
- Dynamic wheel rotation and steering
- Chassis-wheel interaction through physics constraints

### Vehicle Configuration

Key vehicle parameters that can be adjusted:

- Chassis dimensions and mass
- Wheel positions and radius
- Suspension properties (stiffness, relaxation, compression)
- Friction and rolling characteristics

## Controls

- W/S - Accelerate/Brake
- A/D - Steer Left/Right
- Space - Handbrake

## Development

See [DEVLOG.md](DEVLOG.md) for detailed development progress and technical decisions.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 