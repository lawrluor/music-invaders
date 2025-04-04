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
    utils.log('MIDI controller not found');
  }

  // Get canvas element
  const canvas = document.getElementById('game-canvas');

  // Initialize sound controller
  const soundController = window.soundController || window.sound;
  if (soundController) {
    soundController.init();
  } else {
    utils.log('Sound controller not found');
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
        // Check if MIDI device is connected
        const midiController = window.midiController || window.midi;
        if (!midiController || !midiController.selectedInput) {
          // Show warning popup
          showMidiWarningPopup(gameMode, chordMode, 'MIDI Device Required', 'You need a MIDI keyboard or controller to play this game. Please connect a MIDI device and select it from the dropdown menu.');
          button.removeEventListener('click', arguments.callee);
          return
        }
        if (soundController) soundController.resumeAudio();
        // Start the game directly with the selected mode
        window.game.startGame(gameMode, chordMode);
        // Hide title screen and show game
        const titleScreen = document.getElementById('title-screen');
        if (titleScreen) titleScreen.classList.add('hidden');
        // At end, cleanup event listener
        button.removeEventListener('click', arguments.callee);
      });
    }
  };

  // Function to show MIDI warning popup
  // Wrapper around utils.showConfirmationPopup()
  const showMidiWarningPopup = (gameMode, chordMode, title, message) => {
    utils.showConfirmationPopup(title, message,
      () => {
        // Confirm
        const popup = document.getElementById('game-confirmation-popup');
        if (popup) popup.classList.add('hidden');

        if (soundController) soundController.resumeAudio();

        // Start the game anyway
        window.game.startGame(gameMode, chordMode);

        // Hide title screen and show game
        const titleScreen = document.getElementById('title-screen');
        if (titleScreen) titleScreen.classList.add('hidden');
      },
      () => {
        // Cancel
        const popup = document.getElementById('game-confirmation-popup');
        if (popup) popup.classList.add('hidden');
      },
      'Cancel',
      'Continue Anyways'
    );
  };

  // Function to load and display high scores - make it globally available
  window.loadAndDisplayHighScores = () => {
    // Single Note Classic
    const singleNoteClassicHighScoreData = utils.loadHighScore('classic');
    const singleNoteClassicHighScoreElement = document.getElementById('single-note-classic-high-score');
    if (singleNoteClassicHighScoreElement) {
      const scoreText = singleNoteClassicHighScoreData.score;
      const waveText = singleNoteClassicHighScoreData.wave > 0 ? ` (Wave ${singleNoteClassicHighScoreData.wave})` : '';
      singleNoteClassicHighScoreElement.textContent = scoreText + waveText;
    }

    // Single Note Survival
    const singleNoteSurvivalHighScoreData = utils.loadHighScore('survival');
    const singleNoteSurvivalHighScoreElement = document.getElementById('single-note-survival-high-score');
    if (singleNoteSurvivalHighScoreElement) {
      const scoreText = singleNoteSurvivalHighScoreData.score;
      const waveText = singleNoteSurvivalHighScoreData.wave > 0 ? ` (Wave ${singleNoteSurvivalHighScoreData.wave})` : '';
      singleNoteSurvivalHighScoreElement.textContent = scoreText + waveText;
    }

    // Chord Classic
    const chordClassicHighScoreData = utils.loadHighScore('classic_chord');
    const chordClassicHighScoreElement = document.getElementById('chord-classic-high-score');
    if (chordClassicHighScoreElement) {
      const scoreText = chordClassicHighScoreData.score;
      const waveText = chordClassicHighScoreData.wave > 0 ? ` (Wave ${chordClassicHighScoreData.wave})` : '';
      chordClassicHighScoreElement.textContent = scoreText + waveText;
    }

    // Chord Survival
    const chordSurvivalHighScoreData = utils.loadHighScore('survival_chord');
    const chordSurvivalHighScoreElement = document.getElementById('chord-survival-high-score');
    if (chordSurvivalHighScoreElement) {
      const scoreText = chordSurvivalHighScoreData.score;
      const waveText = chordSurvivalHighScoreData.wave > 0 ? ` (Wave ${chordSurvivalHighScoreData.wave})` : '';
      chordSurvivalHighScoreElement.textContent = scoreText + waveText;
    }
  };

  // Load high scores on startup
  window.loadAndDisplayHighScores();

  // Add event listeners for all game mode buttons
  addStartGameListener(singleNoteClassicButton, 'classic', false);
  addStartGameListener(singleNoteSurvivalButton, 'survival', false);
  addStartGameListener(chordClassicButton, 'classic', true);
  addStartGameListener(chordSurvivalButton, 'survival', true);

  // Get references to UI elements
  const settingsModal = document.getElementById('settings-modal');
  const settingsButton = document.getElementById('settings-icon');
  const settingsButtonContainer = document.getElementById('settings-button-container');
  const closeSettingsButton = document.getElementById('close-settings');
  const muteCheckbox = document.getElementById('mute-sound');
  const muteToggleButton = document.getElementById('mute-toggle-button');
  const useChordAbbreviationsCheckbox = document.getElementById('use-chord-abbreviations');
  const useLargeFontCheckbox = document.getElementById('use-large-font');
  const useMusicFontCheckbox = document.getElementById('use-music-font');
  const hideUncommonChordsCheckbox = document.getElementById('hide-uncommon-chords');

  // Function to toggle settings button visibility based on game state
  window.toggleSettingsButtonVisibility = function(gameState) {
    if (!settingsButtonContainer) return;

    // Show settings button only on title, game over, and victory screens
    if (gameState === 'title' || gameState === 'gameOver' || gameState === 'victory') {
      settingsButtonContainer.style.display = 'block';
    } else {
      // Hide during gameplay and wave transitions
      settingsButtonContainer.style.display = 'none';
    }
  };

  // Initial visibility state
  window.toggleSettingsButtonVisibility('title');

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
    // Default to true if not set or parse the stored value
    const savedHideUncommonChordsState = localStorage.getItem('hideUncommonChords') ? localStorage.getItem('hideUncommonChords') === 'true' : 'true';
    console.log('savedHideUncommonChordsState', localStorage.getItem('hideUncommonChords'));
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
          hideUncommonChordsCheckbox.checked = localStorage.getItem('hideUncommonChords') ? localStorage.getItem('hideUncommonChords') === 'true' : 'true';
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

  // Mute sound checkbox event listener
  if (muteCheckbox) {
    muteCheckbox.addEventListener('change', () => {
      const soundController = window.soundController || window.sound;
      if (soundController) {
        soundController.setMuted(muteCheckbox.checked);
      }
    });
  }

  // Mute toggle button event listener
  if (muteToggleButton) {
    muteToggleButton.addEventListener('click', () => {
      const soundController = window.soundController || window.sound;
      if (soundController) {
        soundController.toggleMute();
      }
    });
  }

  // Clear saved data button event listener
  const clearSavedDataButton = document.getElementById('clear-saved-data');
  if (clearSavedDataButton) {
    clearSavedDataButton.addEventListener('click', () => {
      // Show confirmation popup before clearing data
      utils.showConfirmationPopup(
        'Clear Saved Data',
        'Are you sure you want to delete all your saved game data including high scores and settings? This action cannot be undone.',
        () => {
          // User confirmed, clear all data
          utils.clearSavedData();

          setTimeout(() => {
            window.location.reload();
          }, 50);
        },
        null, // No special action on cancel
        'Cancel',
        'Clear All Data'
      );
    });
  }

  utils.log('MIDI Space Invaders initialized');
});
