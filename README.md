# Music Invaders

A space invaders game that uses a MIDI keyboard as the controller. Each enemy corresponds to a specific note on your MIDI keyboard. Press the correct note to destroy the enemy!

## Play Now

Once deployed, you can play the game online at: [MIDI Space Invaders](https://lawrluor.github.io/space-invaders/)

**Note:** You'll need a MIDI keyboard connected to your computer to play. The game uses the Web MIDI API, which is supported in Chrome, Edge, and Opera browsers.

## Features

1. **MIDI Keyboard Control**: Connect your MIDI keyboard to play the game. Each enemy is associated with a specific note.

2. **Musical Layout**: Enemies are positioned on the x-axis proportionally to a piano keyboard layout.

3. **Game Modes**:
   - **Classic Mode**: Battle through 5 waves of increasingly difficult enemies to win.
   - **Survival Mode**: Play through endless waves of enemies until you run out of ammo or health. Earn bonus ammo after each wave based on the number of enemies.

4. **Shield Protection**: Your spaceship is protected by a shield. Enemies that pass through will damage your health.

5. **Limited Ammo**: Each note press fires one shot, using one ammo. Don't run out!

6. **Animations**: Smooth animations for enemies, lasers, and background elements.

7. **Sound Effects**: Custom sound effects for hits, misses, and game events.

8. **High Score Tracking**: Your highest score is saved between game sessions.

9. **Dynamic MIDI Range**: Each wave uses a different MIDI note range, keeping the gameplay fresh and challenging.

10. **Colorful Backgrounds**: Background colors change with each wave for visual variety.

## How to Play

1. Connect a MIDI keyboard to your computer
2. Open the game in a supported browser (Chrome, Edge, or Opera)
3. Select your MIDI device from the dropdown menu
4. Click 'Start Game'
5. Press the notes on your keyboard that correspond to the enemies
6. Complete all waves to win!

## Game Controls

- **MIDI Keyboard**: Press notes to fire at enemies.
- **Mouse**: Use the buttons on screen to navigate menus.

## Local Development

1. Clone the repository:
   ```
   git clone https://github.com/YOUR_USERNAME/space-invaders.git
   cd space-invaders
   ```

2. Open `index.html` in your browser or use a local server:
   ```
   npx http-server
   ```

3. Connect your MIDI keyboard and enjoy!

## Technologies Used

- HTML5 Canvas for rendering
- Web MIDI API for MIDI device integration
- Web Audio API for sound generation
- Vanilla JavaScript (no frameworks)
- Local Storage for saving high scores and device preferences

## Browser Compatibility

This game requires a browser that supports the Web MIDI API:
- Google Chrome
- Microsoft Edge
- Opera

Firefox and Safari do not currently support the Web MIDI API without extensions.

## License

MIT