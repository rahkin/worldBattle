# Damage Sounds

This directory contains all damage-related sounds, including impact sounds, destruction effects, and health regeneration.

## Sound Types

### Impact Sounds
1. **Light**
   - Duration: 0.2-0.5 seconds
   - Should be subtle and quick
   - Volume: -12 dB to -6 dB
   - Should be directional

2. **Medium**
   - Duration: 0.5-1 second
   - Should be noticeable but not overwhelming
   - Volume: -6 dB to 0 dB
   - Should be directional

3. **Heavy**
   - Duration: 1-2 seconds
   - Should be impactful and concerning
   - Volume: -3 dB to +3 dB
   - Should be directional

4. **Critical**
   - Duration: 1-2 seconds
   - Should be alarming and urgent
   - Volume: 0 dB to +6 dB
   - Should be directional

### Destruction
1. **Vehicle Destroyed**
   - Duration: 2-3 seconds
   - Should include explosion and debris
   - Volume: 0 dB to +6 dB
   - Should be impactful

### Health
1. **Regeneration**
   - Duration: 1-2 seconds
   - Should include repair/healing sound
   - Volume: -6 dB to 0 dB
   - Should be positive

## Implementation Notes

- Impact sounds should be played with proper spatial audio
- Volume should scale with damage amount
- Critical sounds should be distinct and alarming
- Destruction sounds should be impactful but not overwhelming
- Health regeneration should be positive and encouraging
- Use sound pooling for frequently played sounds
- Consider vehicle type when mixing sounds
- Implement proper falloff for distant sounds 