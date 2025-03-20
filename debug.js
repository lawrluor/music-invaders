// Debug script to log errors
console.log('Debug script loaded');

// Override console.error to log to a visible element
const originalError = console.error;
console.error = function() {
  // Call the original console.error
  originalError.apply(console, arguments);
  
  // Create debug output element if it doesn't exist
  let debugOutput = document.getElementById('debug-output');
  if (!debugOutput) {
    debugOutput = document.createElement('div');
    debugOutput.id = 'debug-output';
    debugOutput.style.position = 'fixed';
    debugOutput.style.bottom = '10px';
    debugOutput.style.left = '10px';
    debugOutput.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    debugOutput.style.color = 'white';
    debugOutput.style.padding = '10px';
    debugOutput.style.zIndex = '9999';
    debugOutput.style.maxHeight = '200px';
    debugOutput.style.overflowY = 'auto';
    debugOutput.style.maxWidth = '80%';
    document.body.appendChild(debugOutput);
  }
  
  // Add error message to debug output
  const errorMsg = document.createElement('div');
  errorMsg.textContent = Array.from(arguments).join(' ');
  debugOutput.appendChild(errorMsg);
};

// Add window error handler
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Error:', message, 'at', source, 'line', lineno, 'column', colno);
  return false;
};

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled Promise Rejection:', event.reason);
});

// Add a function to test game state
window.debugGameState = function() {
  if (window.game) {
    console.log('Game state:', window.game.gameState);
    console.log('Player:', window.game.player);
    console.log('Enemies:', window.game.enemies);
    console.log('Stars:', window.game.stars);
  } else {
    console.error('Game instance not found');
  }
};

// (Optional) Add debug button to the page
// window.addEventListener('DOMContentLoaded', function() {
//   const debugButton = document.createElement('button');
//   debugButton.textContent = 'Debug Game';
//   debugButton.style.position = 'fixed';
//   debugButton.style.top = '10px';
//   debugButton.style.right = '10px';
//   debugButton.style.zIndex = '9999';
//   debugButton.style.backgroundColor = 'red';
//   debugButton.style.color = 'white';
//   debugButton.style.padding = '5px 10px';
//   debugButton.style.border = 'none';
//   debugButton.style.borderRadius = '5px';
  
//   debugButton.addEventListener('click', function() {
//     window.debugGameState();
    
//     // Force game to start if not already started
//     if (window.game && window.game.gameState !== 'playing') {
//       console.log('Forcing game to start...');
//       window.game.startGame();
//     }
//   });
  
//   document.body.appendChild(debugButton);
// });
