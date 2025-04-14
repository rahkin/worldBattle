# Power-up Sounds

This directory contains all power-up related sounds, including collection, activation, and deactivation sounds.

## Sound Types

### Collection
1. **Pickup**
   - Duration: 0.5-1 second
   - Should be satisfying and clear
   - Volume: -6 dB to 0 dB
   - Should be directional

### Health
1. **Activate**
   - Duration: 0.5-1 second
   - Should include healing/repair sound
   - Volume: -6 dB to 0 dB
   - Should be positive and uplifting

### Speed
1. **Activate**
   - Duration: 0.5-1 second
   - Should include acceleration effect
   - Volume: -6 dB to 0 dB
   - Should be energetic

2. **Deactivate**
   - Duration: 0.5-1 second
   - Should include deceleration effect
   - Volume: -6 dB to 0 dB
   - Should be smooth transition

### Ammo
1. **Pickup**
   - Duration: 0.5-1 second
   - Should include reloading sound
   - Volume: -6 dB to 0 dB
   - Should be satisfying

### Mines
1. **Pickup**
   - Duration: 0.5-1 second
   - Should include mechanical sound
   - Volume: -6 dB to 0 dB
   - Should be distinct

### Overcharge
1. **Activate**
   - Duration: 1-2 seconds
   - Should include power-up effect
   - Volume: -3 dB to +3 dB
   - Should be impactful

2. **Deactivate**
   - Duration: 1-2 seconds
   - Should include power-down effect
   - Volume: -3 dB to +3 dB
   - Should be smooth

### Shield
1. **Activate**
   - Duration: 1-2 seconds
   - Should include shield deployment
   - Volume: -3 dB to +3 dB
   - Should be protective

2. **Hit**
   - Duration: 0.5-1 second
   - Should include impact on shield
   - Volume: -3 dB to +3 dB
   - Should be distinct

3. **Deactivate**
   - Duration: 1-2 seconds
   - Should include shield collapse
   - Volume: -3 dB to +3 dB
   - Should be smooth

## Implementation Notes

- All pickup sounds should use spatial audio
- Activation sounds should be clear and distinct
- Deactivation sounds should be smooth transitions
- Consider power-up importance when mixing volumes
- Use sound pooling for frequently played sounds
- Ensure sounds don't overlap or conflict 