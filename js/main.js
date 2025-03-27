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
  
  // Function to load and display high scores - make it globally available
  window.loadAndDisplayHighScores = () => {
    // Single Note Classic
    const singleNoteClassicHighScore = utils.loadHighScore('classic');
    const singleNoteClassicHighScoreElement = document.getElementById('single-note-classic-high-score');
    if (singleNoteClassicHighScoreElement) {
      singleNoteClassicHighScoreElement.textContent = singleNoteClassicHighScore;
    }
    
    // Single Note Survival
    const singleNoteSurvivalHighScore = utils.loadHighScore('survival');
    const singleNoteSurvivalHighScoreElement = document.getElementById('single-note-survival-high-score');
    if (singleNoteSurvivalHighScoreElement) {
      singleNoteSurvivalHighScoreElement.textContent = singleNoteSurvivalHighScore;
    }
    
    // Chord Classic
    const chordClassicHighScore = utils.loadHighScore('classic_chord');
    const chordClassicHighScoreElement = document.getElementById('chord-classic-high-score');
    if (chordClassicHighScoreElement) {
      chordClassicHighScoreElement.textContent = chordClassicHighScore;
    }
    
    // Chord Survival
    const chordSurvivalHighScore = utils.loadHighScore('survival_chord');
    const chordSurvivalHighScoreElement = document.getElementById('chord-survival-high-score');
    if (chordSurvivalHighScoreElement) {
      chordSurvivalHighScoreElement.textContent = chordSurvivalHighScore;
    }
  };
  
  // Load high scores on startup
  window.loadAndDisplayHighScores();
  
  // Add event listeners for all game mode buttons
  addStartGameListener(singleNoteClassicButton, 'classic', false);
  addStartGameListener(singleNoteSurvivalButton, 'survival', false);
  addStartGameListener(chordClassicButton, 'classic', true);
  addStartGameListener(chordSurvivalButton, 'survival', true);
  
  // Settings modal functionality
  const settingsButton = document.getElementById('settings-button');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettingsButton = document.getElementById('close-settings');
  const useChordAbbreviationsCheckbox = document.getElementById('use-chord-abbreviations');
  const useLargeFontCheckbox = document.getElementById('use-large-font');
  const useMusicFontCheckbox = document.getElementById('use-music-font');
  const hideUncommonChordsCheckbox = document.getElementById('hide-uncommon-chords');
  
  // Initialize checkbox states from localStorage
  if (useChordAbbreviationsCheckbox) {
    const savedState = localStorage.getItem('useChordAbbreviations') === 'true';
    useChordAbbreviationsCheckbox.checked = savedState;
    
    // Add change event listener
    useChordAbbreviationsCheckbox.addEventListener('change', (event) => {
      const useAbbreviations = event.target.checked;
      
      // Save to localStorage
      localStorage.setItem('useChordAbbreviations', useAbbreviations);
      
      // Update the chord controller if it exists
      if (window.chordController) {
        window.chordController.toggleAbbreviations(useAbbreviations);
        
        // Update all enemies in the current game if it exists
        if (window.game && window.game.enemies) {
          window.game.enemies.forEach(enemy => {
            if (enemy.isChord) {
              enemy.updateDisplayName();
            }
          });
        }
      }
    });
  }
  
  // Initialize large font checkbox
  if (useLargeFontCheckbox) {
    const savedLargeFontState = localStorage.getItem('useLargeFont') === 'true';
    useLargeFontCheckbox.checked = savedLargeFontState;
    
    // Add change event listener
    useLargeFontCheckbox.addEventListener('change', (event) => {
      const useLargeFont = event.target.checked;
      
      // Save to localStorage
      localStorage.setItem('useLargeFont', useLargeFont);
    });
  }
  
  // Initialize music font checkbox
  if (useMusicFontCheckbox) {
    // Default to true if not set
    const savedMusicFontState = localStorage.getItem('useMusicFont') !== 'false';
    useMusicFontCheckbox.checked = savedMusicFontState;
    
    // Add change event listener
    useMusicFontCheckbox.addEventListener('change', (event) => {
      const useMusicFont = event.target.checked;
      
      // Save to localStorage
      localStorage.setItem('useMusicFont', useMusicFont.toString());
    });
  }
  
  // Initialize hide uncommon chords checkbox
  if (hideUncommonChordsCheckbox) {
    const savedHideUncommonChordsState = localStorage.getItem('hideUncommonChords') === 'true';
    hideUncommonChordsCheckbox.checked = savedHideUncommonChordsState;
    
    // Add change event listener
    hideUncommonChordsCheckbox.addEventListener('change', (event) => {
      const hideUncommonChords = event.target.checked;
      
      // Save to localStorage
      localStorage.setItem('hideUncommonChords', hideUncommonChords.toString());
      
      // Update the chord controller if it exists
      if (window.chordController) {
        window.chordController.toggleHideUncommonChords(hideUncommonChords);
      }
    });
  }
  
  // Open settings modal
  if (settingsButton) {
    settingsButton.addEventListener('click', () => {
      if (settingsModal) {
        settingsModal.classList.remove('hidden');
        
        // Update checkbox states when opening modal
        if (useChordAbbreviationsCheckbox && window.chordController) {
          useChordAbbreviationsCheckbox.checked = window.chordController.useAbbreviations;
        }
        
        if (useLargeFontCheckbox) {
          useLargeFontCheckbox.checked = localStorage.getItem('useLargeFont') === 'true';
        }
        
        if (useMusicFontCheckbox) {
          useMusicFontCheckbox.checked = localStorage.getItem('useMusicFont') !== 'false';
        }
        
        if (hideUncommonChordsCheckbox) {
          hideUncommonChordsCheckbox.checked = localStorage.getItem('hideUncommonChords') === 'true';
        }
      }
    });
  }
  
  // Close settings modal
  if (closeSettingsButton) {
    closeSettingsButton.addEventListener('click', () => {
      if (settingsModal) {
        settingsModal.classList.add('hidden');
      }
    });
  }
  
  // Close modal when clicking outside of it
  if (settingsModal) {
    settingsModal.addEventListener('click', (event) => {
      if (event.target === settingsModal) {
        settingsModal.classList.add('hidden');
      }
    });
  }
  
  console.log('MIDI Space Invaders initialized');
});
