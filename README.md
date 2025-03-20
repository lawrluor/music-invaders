# MIDI Space Invaders

A space invaders game that uses a MIDI keyboard as the controller. Each enemy corresponds to a specific note on your MIDI keyboard. Press the correct note to destroy the enemy!

## Features

1. **MIDI Keyboard Control**: Connect your MIDI keyboard to play the game. Each enemy is associated with a specific note.

2. **Musical Layout**: Enemies are positioned on the x-axis proportionally to a piano keyboard layout.

3. **Waves of Enemies**: Battle through 5 waves of increasingly difficult enemies.

4. **Shield Protection**: Your spaceship is protected by a shield. Enemies that pass through will damage your health.

5. **Limited Ammo**: Each note press fires one shot, using one ammo. Don't run out!

6. **Animations**: Smooth animations for enemies, lasers, and background elements.

7. **Sound Effects**: Custom sound effects for hits, misses, and game events.

8. **High Score Tracking**: Your highest score is saved between game sessions.

## How to Play

1. Open the game in a web browser that supports the Web MIDI API (Chrome, Edge, Opera).

2. Connect your MIDI keyboard to your computer.

3. On the title screen, select your MIDI device from the dropdown menu.

4. Click "Start Game" to begin.

5. Press the notes on your MIDI keyboard that correspond to the enemies you want to destroy.

6. Survive all 5 waves to win!

## Game Controls

- **MIDI Keyboard**: Press notes to fire at enemies.
- **Mouse**: Use the buttons on screen to navigate menus.

## Technical Details

- Built with HTML5 Canvas and JavaScript.
- Uses the Web MIDI API to connect to MIDI devices.
- Web Audio API for sound generation.
- Local Storage for saving high scores and device preferences.

## Browser Compatibility

This game requires a browser that supports the Web MIDI API:
- Google Chrome
- Microsoft Edge
- Opera

Firefox and Safari do not currently support the Web MIDI API without extensions.

## Running Locally

To run the game locally, simply open the `index.html` file in a compatible web browser. No server is required.

## License

This project is available for personal and educational use.
