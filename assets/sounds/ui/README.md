# UI Sounds

This directory contains all user interface sounds, including menu navigation, game state changes, and feedback sounds.

## Sound Types

### Menu Navigation
1. **Hover**
   - Duration: 0.1-0.3 seconds
   - Should be subtle and smooth
   - Volume: -12 dB to -6 dB
   - Should be non-intrusive

2. **Select**
   - Duration: 0.2-0.4 seconds
   - Should be clear and satisfying
   - Volume: -6 dB to 0 dB
   - Should be distinct

### Vehicle Selection
1. **Select**
   - Duration: 0.5-1 second
   - Should match vehicle type
   - Volume: -6 dB to 0 dB
   - Should be distinctive

### Game State
1. **Start**
   - Duration: 1-2 seconds
   - Should be energetic and exciting
   - Volume: -3 dB to +3 dB
   - Should be impactful

2. **Over**
   - Duration: 1-2 seconds
   - Should be dramatic and conclusive
   - Volume: -3 dB to +3 dB
   - Should be appropriate for outcome

3. **Victory**
   - Duration: 2-3 seconds
   - Should be triumphant and celebratory
   - Volume: -3 dB to +3 dB
   - Should be rewarding

4. **Countdown**
   - Duration: 0.5-1 second
   - Should be clear and urgent
   - Volume: -6 dB to 0 dB
   - Should be consistent

## Implementation Notes

- All UI sounds should be stereo
- Volume should be consistent across similar actions
- Sounds should be clear but not overwhelming
- Consider context when mixing volumes
- Use sound pooling for frequently played sounds
- Ensure sounds don't overlap or conflict
- Keep sounds short and to the point
- Make sure sounds are appropriate for their context 