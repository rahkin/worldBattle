# Weapon Sounds

This directory contains all weapon-related sounds, including projectiles, mines, and weapon feedback sounds.

## Sound Types

### Projectiles
1. **Launch**
   - Duration: 0.2-0.5 seconds
   - Should match weapon type (light/heavy)
   - Volume: -6 dB to 0 dB
   - Should be directional

2. **Hit**
   - Duration: 0.5-1 second
   - Should vary based on impact surface
   - Volume: -3 dB to +3 dB
   - Should include impact material sounds

### Mines
1. **Deploy**
   - Duration: 0.5-1 second
   - Should include mechanical sounds
   - Volume: -6 dB to 0 dB
   - Should be directional

2. **Arm**
   - Duration: 0.2-0.5 seconds
   - Should include electronic beep
   - Volume: -12 dB to -6 dB
   - Should be subtle

3. **Explode**
   - Duration: 1-2 seconds
   - Should include explosion and debris
   - Volume: 0 dB to +6 dB
   - Should be impactful

### Weapon Feedback
1. **Empty**
   - Duration: 0.2-0.5 seconds
   - Should be distinct click sound
   - Volume: -6 dB to 0 dB
   - Should be clear but not annoying

2. **Reload**
   - Duration: 1-2 seconds
   - Should include magazine/clip sounds
   - Volume: -6 dB to 0 dB
   - Should be mechanical and clear

## Implementation Notes

- All projectile sounds should use spatial audio
- Mine sounds should be directional based on deployment
- Explosion sounds should have proper falloff
- Feedback sounds should be clear but not overwhelming
- Consider weapon type when mixing sounds
- Use sound pooling for frequently played sounds 