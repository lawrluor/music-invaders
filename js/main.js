/**
 * Main entry point for MIDI Space Invaders
 */
// import ChordController from './chord-controller.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize MIDI controller first
  const midiController = window.midiController || window.midi;
  if (midiController) {
    await midiController.init();
  } else {
    console.error('MIDI controller not found');
  }
  
  // Get canvas element
  const canvas = document.getElementById('game-canvas');
  
  // Initialize sound controller
  const soundController = window.soundController || window.sound;
  if (soundController) {
    soundController.init();
  } else {
    console.error('Sound controller not found');
  }
  
  // Initialize chord controller
  window.chordController = new ChordController();
  
  // Create game instance and expose it globally for debugging
  window.game = new Game(canvas);
  
  // Initialize game
  window.game.init();
  
  // Get references to all game mode buttons
  const singleNoteClassicButton = document.getElementById('single-note-classic-button');
  const singleNoteSurvivalButton = document.getElementById('single-note-survival-button');
  const chordClassicButton = document.getElementById('chord-classic-button');
  const chordSurvivalButton = document.getElementById('chord-survival-button');
  
  // Helper function to add click event to game mode buttons
  const addStartGameListener = (button, gameMode, chordMode) => {
    if (button) {
      button.addEventListener('click', () => {
        if (soundController) soundController.resumeAudio();
        // Start the game directly with the selected mode
        window.game.startGame(gameMode, chordMode);
        // Hide title screen and show game
        const titleScreen = document.getElementById('title-screen');
        if (titleScreen) titleScreen.classList.add('hidden');
      });
    }
  };
  
  // Add event listeners for all game mode buttons
  addStartGameListener(singleNoteClassicButton, 'classic', false);
  addStartGameListener(singleNoteSurvivalButton, 'survival', false);
  addStartGameListener(chordClassicButton, 'classic', true);
  addStartGameListener(chordSurvivalButton, 'survival', true);
  
  console.log('MIDI Space Invaders initialized');
});
