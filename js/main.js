/**
 * Main entry point for MIDI Space Invaders
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize MIDI controller first
  await window.midiController.init();
  
  // Get canvas element
  const canvas = document.getElementById('game-canvas');
  
  // Initialize sound controller
  window.soundController.init();
  
  // Create game instance and expose it globally for debugging
  window.game = new Game(canvas);
  
  // Initialize game
  window.game.init();
  
  // Add event listeners for game mode buttons to resume audio on click
  const classicButton = document.getElementById('classic-mode-button');
  const survivalButton = document.getElementById('survival-mode-button');
  
  if (classicButton) {
    classicButton.addEventListener('click', () => {
      window.soundController.resumeAudio();
    });
  }
  
  if (survivalButton) {
    survivalButton.addEventListener('click', () => {
      window.soundController.resumeAudio();
    });
  }
  
  console.log('MIDI Space Invaders initialized');
});
