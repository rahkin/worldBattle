# World Battle Game

A 3D vehicle combat game built with Three.js and Cannon.js.

## Features

- Real-time vehicle physics
- Dynamic weather system using OpenWeatherMap API
- Day/night cycle
- Power-up system
- Mine deployment
- Multiple vehicle types
- Realistic terrain and environment

## File Structure

```
worldBattle/
├── assets/                  # Game assets
│   ├── icons/              # Website icons
│   └── models/             # 3D models
├── src/                    # Source code
│   ├── core/              # Core game systems
│   │   ├── Game.js        # Main game class
│   │   ├── GameLoop.js    # Game loop management
│   │   ├── InputManager.js # Input handling
│   │   ├── TimeSystem.js  # Time and day/night cycle
│   │   ├── WeatherSystem.js # Weather system
│   │   ├── OpenWeatherMapService.js # Weather API integration
│   │   ├── RainSystem.js  # Rain effects
│   │   └── GroundEffectsSystem.js # Ground effects
│   ├── physics/           # Physics systems
│   │   ├── vehicles/      # Vehicle implementations
│   │   ├── PowerUpSystem.js
│   │   └── MineSystem.js
│   ├── rendering/         # Rendering systems
│   └── ui/                # UI components
├── index.html             # Main HTML file
└── index.js               # Entry point
```

## Weather System

The game features a dynamic weather system that:
- Uses real-time weather data from OpenWeatherMap API
- Adapts to the player's actual location
- Updates every 5 minutes
- Affects gameplay through:
  - Rain and storm effects
  - Wind affecting vehicle handling
  - Ground conditions based on temperature and humidity
  - Dynamic cloud and fog systems

## Controls

- WASD: Vehicle movement
- Mouse: Aim and fire
- Right Click: Deploy mines
- R: Rear view
- 1-4: Weather test controls
- Y: Time test mode

## Development

To run the game locally:
1. Clone the repository
2. Open `index.html` in a web browser
3. Allow location access for real-time weather

## Dependencies

- Three.js
- Cannon.js
- OpenWeatherMap API

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