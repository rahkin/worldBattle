# Game Sound Effects

This directory contains all sound effects for the game, organized by category. Each subdirectory contains specific types of sounds with their own README files detailing requirements and usage.

## Directory Structure

- `vehicles/` - Vehicle-specific sounds (engine, collision, etc.)
- `weapons/` - Weapon and combat-related sounds
- `powerups/` - Power-up collection and activation sounds
- `environment/` - Weather and ambient sounds
- `damage/` - Damage and health-related sounds
- `ui/` - User interface sounds

## General Guidelines

1. **File Format**: All sounds should be in MP3 format for maximum compatibility
2. **Bitrate**: 128-192 kbps for good quality while maintaining reasonable file size
3. **Sample Rate**: 44.1 kHz
4. **Channels**: 
   - Mono for spatial sounds (vehicles, weapons, etc.)
   - Stereo for UI and ambient sounds
5. **File Naming**: Use lowercase with underscores (e.g., `engine_idle.mp3`)
6. **Duration**: 
   - Short effects: 0.1-2 seconds
   - Looping sounds: 2-10 seconds
   - Ambient sounds: 30-60 seconds

## Implementation Notes

- All sounds are managed through Howler.js
- Spatial audio is used for in-game sounds
- Sound pooling is implemented for frequently used effects
- Volume and pitch modulation are applied based on game state
- Master volume and category-specific volume controls are available

## Sound Categories

### Vehicles
- Engine sounds (idle, rev, acceleration)
- Collision sounds
- Boost effects
- Vehicle-specific sounds

### Weapons
- Projectile sounds
- Mine deployment and explosion
- Weapon feedback (empty, reload)

### Power-ups
- Collection sounds
- Activation/deactivation effects
- Shield impacts

### Environment
- Weather effects
- Ambient sounds
- Time-of-day variations

### Damage
- Impact sounds
- Destruction effects
- Health regeneration

### UI
- Menu navigation
- Game state changes
- Feedback sounds

## Adding New Sounds

1. Place the sound file in the appropriate category directory
2. Update the corresponding category's README if adding a new type of sound
3. Register the sound in the game's sound management system
4. Test the sound in-game with proper spatialization and volume levels 