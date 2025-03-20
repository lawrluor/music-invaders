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
  
  // Add event listener for the start button
  document.getElementById('start-button').addEventListener('click', () => {
    // Make sure audio context is resumed on user interaction
    window.soundController.resumeAudio();
  });
  
  console.log('MIDI Space Invaders initialized');
});
