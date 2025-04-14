# Vehicle Sounds

This directory contains all vehicle-specific sounds, organized by vehicle type. Each vehicle has its own subdirectory with unique engine and effect sounds.

## Vehicle Types

### Base Vehicle
- Standard engine sounds
- Basic collision effects
- Generic boost sound

### Muscle Car
- Aggressive V8 engine sound
- Loud, powerful revving
- Supercharger whine for boost
- Backfire effects on deceleration

### Junkyard King
- Rough, uneven engine idle
- Mechanical clattering sounds
- Wheezing turbo boost
- Metal-on-metal collision sounds

### Ironclad
- Heavy industrial engine sound
- Deep mechanical revving
- Pneumatic boost effect
- Heavy impact sounds

### Tank
- Deep diesel engine sound
- Track movement sounds
- Heavy machinery effects
- Turbine boost sound

### Drone
- Electric motor whine
- High-pitched electric revving
- Electric surge boost
- Light impact sounds

### Scorpion
- Exotic engine sound
- Aggressive revving
- Sci-fi boost effect
- Medium impact sounds

## Sound Requirements

### Engine Sounds
1. **Idle**
   - Duration: 2-3 seconds (looped)
   - Should be seamless when looped
   - Volume: -12 dB to -6 dB

2. **Rev**
   - Duration: 1-2 seconds
   - Should match vehicle's power characteristics
   - Volume: -6 dB to 0 dB

3. **Acceleration**
   - Duration: 2-4 seconds
   - Should have clear RPM progression
   - Volume: -6 dB to 0 dB

4. **Deceleration**
   - Duration: 2-4 seconds
   - Should include appropriate effects (backfire, etc.)
   - Volume: -6 dB to 0 dB

### Collision Sounds
1. **Light**
   - Duration: 0.5-1 second
   - Volume: -12 dB to -6 dB
   - Should be subtle

2. **Medium**
   - Duration: 0.5-1 second
   - Volume: -6 dB to 0 dB
   - Should be noticeable but not overwhelming

3. **Heavy**
   - Duration: 1-2 seconds
   - Volume: -3 dB to +3 dB
   - Should be impactful

### Boost Sounds
- Duration: 1-3 seconds
- Should match vehicle's boost characteristics
- Volume: -3 dB to +3 dB
- Should be distinct from engine sounds

## Implementation Notes

- Engine sounds should be pitch-shifted based on vehicle speed
- Collision sounds should be played with proper spatial audio
- Boost sounds should be layered with engine sounds
- All sounds should be properly normalized
- Consider vehicle mass when mixing collision sounds 