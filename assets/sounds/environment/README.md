# Environment Sounds

This directory contains all environmental sounds, including weather effects and ambient sounds.

## Sound Types

### Wind
1. **Light**
   - Duration: 30-60 seconds (looped)
   - Should be subtle and continuous
   - Volume: -18 dB to -12 dB
   - Should be stereo

2. **Heavy**
   - Duration: 30-60 seconds (looped)
   - Should be strong and gusty
   - Volume: -12 dB to -6 dB
   - Should be stereo

### Rain
1. **Light**
   - Duration: 30-60 seconds (looped)
   - Should be gentle and consistent
   - Volume: -12 dB to -6 dB
   - Should be stereo

2. **Heavy**
   - Duration: 30-60 seconds (looped)
   - Should be intense and varied
   - Volume: -6 dB to 0 dB
   - Should be stereo

### Thunder
1. **Distant**
   - Duration: 2-5 seconds
   - Should be low and rumbling
   - Volume: -6 dB to 0 dB
   - Should be stereo

2. **Close**
   - Duration: 1-3 seconds
   - Should be sharp and impactful
   - Volume: 0 dB to +6 dB
   - Should be stereo

## Implementation Notes

- All weather sounds should be looped seamlessly
- Volume should be adjusted based on player's location
- Wind sounds should be directional
- Rain sounds should be omnidirectional
- Thunder sounds should be played with proper delay
- Consider time of day when mixing sounds
- Use sound layering for more realistic effects
- Implement proper falloff for distant sounds 