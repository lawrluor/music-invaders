/**
 * Utility functions for the game
 */

const utils = {
  // Environment detection
  isProduction: function() {
    // Check if we're in production based on URL
    // This will return true if the site is hosted on a real domain
    // and false for localhost or file:// URLs
    return !(window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1' ||
           window.location.protocol === 'file:');
  },

  // Debug logger that only outputs in development
  log: function(message, ...args) {
    if (!this.isProduction()) {
      console.log(message, ...args);
    }
  },

  // Warning logger that only outputs in development
  warn: function(message, ...args) {
    if (!this.isProduction()) {
      console.warn(message, ...args);
    }
  },

  // Error logger that always outputs (even in production)
  error: function(message, ...args) {
    console.error(message, ...args);
  },

  // Create a random number between min and max
  random: function(min, max) {
    return Math.random() * (max - min) + min;
  },

  // Create a random integer between min and max (inclusive)
  randomInt: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Convert MIDI note number to note name
  midiNoteToName: function(note) {
    // Define sharp and flat note names
    const sharpNoteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatNoteNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

    const octave = Math.floor(note / 12) - 1;
    const noteIndex = note % 12;

    // For notes that have sharps, randomly choose between sharp and flat notation
    // Notes with sharps are at indices 1, 3, 6, 8, 10
    let noteName;
    if ([1, 3, 6, 8, 10].includes(noteIndex) && Math.random() < 0.5) {
      // Use flat notation (which is the next note's flat)
      noteName = flatNoteNames[noteIndex];
    } else {
      // Use sharp notation
      noteName = sharpNoteNames[noteIndex];
    }

    return noteName + octave;
  },

  // Calculate x position based on MIDI note
  midiNoteToXPosition: function(note, canvasWidth, minNote, maxNote) {
    // Ensure note is within the range
    note = Math.max(minNote, Math.min(maxNote, note));

    // Calculate position based on note range
    const range = maxNote - minNote;
    const position = (note - minNote) / range;

    // Add some padding on the sides
    const padding = canvasWidth * 0.1;
    return padding + position * (canvasWidth - 2 * padding);
  },

  // Compare high scores including wave information
  // Returns 1 if score1 is better, -1 if score2 is better, 0 if equal
  compareHighScores: function(scoreData1, scoreData2) {
    // First compare by score
    if (scoreData1.score > scoreData2.score) {
      return 1; // First score is higher
    } else if (scoreData1.score < scoreData2.score) {
      return -1; // Second score is higher
    } else {
      // If scores are equal, compare by wave
      if (scoreData1.wave > scoreData2.wave) {
        return 1; // First wave is higher
      } else if (scoreData1.wave < scoreData2.wave) {
        return -1; // Second wave is higher
      } else {
        return 0; // Completely equal
      }
    }
  },

  // Save high score to local storage based on game mode
  saveHighScore: function(score, gameMode = 'classic', wave = 1) {
    // Generate storage key based on game mode and whether it's chord mode
    let storageKey;

    // Check if gameMode includes chord indicator
    if (gameMode.includes('_chord')) {
      // Already has chord indicator
      storageKey = gameMode === 'survival_chord' ?
        'musicInvadersSurvivalChordHighScore' :
        'musicInvadersClassicChordHighScore';
    } else {
      // Standard note mode
      storageKey = gameMode === 'survival' ?
        'musicInvadersSurvivalHighScore' :
        'musicInvadersClassicHighScore';
    }

    // Get current high score data
    let currentHighScoreData;
    try {
      const savedData = localStorage.getItem(storageKey);
      currentHighScoreData = savedData ? JSON.parse(savedData) : { score: 0, wave: 0 };
    } catch (e) {
      // Handle case where previous data might be just a number
      const previousScore = parseInt(localStorage.getItem(storageKey) || 0, 10);
      currentHighScoreData = { score: previousScore, wave: 0 };
    }

    // Only save if the new score is higher than the current high score
    if (score > currentHighScoreData.score) {
      const newData = { score: score, wave: wave };
      localStorage.setItem(storageKey, JSON.stringify(newData));
      this.log(`New high score for ${gameMode} mode: ${score} (Wave ${wave})`);
      return true;
    }
    return false;
  },

  // Save high score to local storage with option to prioritize wave over score
  // Not currently used, as raw score is used for high scores
  saveHighScoreWithWavePriority: function(score, wave, gameMode = 'classic', prioritizeWave = false) {
    // Generate storage key based on game mode and whether it's chord mode
    let storageKey = gameMode.includes('_chord') ?
      (gameMode === 'survival_chord' ? 'musicInvadersSurvivalChordHighScore' : 'musicInvadersClassicChordHighScore') :
      (gameMode === 'survival' ? 'musicInvadersSurvivalHighScore' : 'musicInvadersClassicHighScore');

    // Add suffix for wave-prioritized high scores
    if (prioritizeWave) {
      storageKey += '_wave';
    }

    // Get current high score data
    let currentHighScoreData;
    try {
      const savedData = localStorage.getItem(storageKey);
      currentHighScoreData = savedData ? JSON.parse(savedData) : { score: 0, wave: 0 };
    } catch (e) {
      // Handle case where previous data might be just a number
      const previousScore = parseInt(localStorage.getItem(storageKey) || 0, 10);
      currentHighScoreData = { score: previousScore, wave: 0 };
    }

    let shouldSave = false;

    if (prioritizeWave) {
      // Save if the wave is higher, or if wave is the same but score is higher
      if (wave > currentHighScoreData.wave) {
        shouldSave = true;
      } else if (wave === currentHighScoreData.wave && score > currentHighScoreData.score) {
        shouldSave = true;
      }
    } else {
      // Traditional approach: save if score is higher
      if (score > currentHighScoreData.score) {
        shouldSave = true;
      }
    }

    if (shouldSave) {
      const newData = { score: score, wave: wave };
      localStorage.setItem(storageKey, JSON.stringify(newData));

      if (prioritizeWave) {
        this.log(`New wave record for ${gameMode} mode: Wave ${wave} with score ${score}`);
      } else {
        this.log(`New high score for ${gameMode} mode: ${score} (Wave ${wave})`);
      }

      return true;
    }

    return false;
  },

  // Load high score from local storage based on game mode
  loadHighScore: function(gameMode = 'classic') {
    // Generate storage key based on game mode and whether it's chord mode
    let storageKey;

    // Check if gameMode includes chord indicator
    if (gameMode.includes('_chord')) {
      // Already has chord indicator
      storageKey = gameMode === 'survival_chord' ?
        'musicInvadersSurvivalChordHighScore' :
        'musicInvadersClassicChordHighScore';
    } else {
      // Standard note mode
      storageKey = gameMode === 'survival' ?
        'musicInvadersSurvivalHighScore' :
        'musicInvadersClassicHighScore';
    }

    const storedData = localStorage.getItem(storageKey);

    // If no score exists yet, return default object
    if (storedData === null) {
      this.log(`No high score found for ${gameMode} mode, starting at 0`);
      return { score: 0, wave: 0 };
    }

    try {
      // Try to parse as JSON first (new format)
      return JSON.parse(storedData);
    } catch (e) {
      // If parsing fails, it's probably the old format (just a number)
      const score = parseInt(storedData, 10);
      return { score: score, wave: 0 };
    }
  },

  // Save last selected MIDI device
  saveLastMidiDevice: function(deviceId) {
    localStorage.setItem('midiSpaceInvadersLastDevice', deviceId);
  },

  // Load last selected MIDI device
  loadLastMidiDevice: function() {
    return localStorage.getItem('midiSpaceInvadersLastDevice') || '';
  },

  /**
   * Clears all saved game data from localStorage
   * Returns an object with information about what was cleared
   */
  clearSavedData: function() {
    const results = {
      highScoresCleared: 0,
      settingsCleared: 0,
      total: 0
    };

    // List of all keys used by the game
    const gameDataKeys = [
      // High scores
      'musicInvadersClassicHighScore',
      'musicInvadersSurvivalHighScore',
      'musicInvadersClassicChordHighScore',
      'musicInvadersSurvivalChordHighScore',
      // Settings
      'useLargeFont',
      'useMusicFont',
      'useChordAbbreviations',
      'hideUncommonChords',
      'muteSounds',
      // MIDI device
      'midiSpaceInvadersLastDevice'
    ];

    // Remove each item and count them
    gameDataKeys.forEach(key => {
      if (localStorage.getItem(key) !== null) {
        // Determine the type of data being cleared for reporting
        if (key.includes('HighScore')) {
          results.highScoresCleared++;
        } else {
          results.settingsCleared++;
        }

        localStorage.removeItem(key);
        results.total++;
      }
    });

    this.log(`Cleared ${results.total} items: ${results.highScoresCleared} high scores and ${results.settingsCleared} settings`);
    return results;
  },

  /**
   * Shows a confirmation popup with custom message and actions
   * @param {string} title - The title of the popup
   * @param {string} message - The message to display
   * @param {Function} onConfirm - Function to call if user confirms
   * @param {Function} onCancel - Function to call if user cancels
   */
  showConfirmationPopup: function(title, message, onConfirm, onCancel, cancelText = 'Cancel', confirmText = 'Confirm') {
    // Create popup container
    const popupHtml = `
      <div class="popup">
        <div class="popup-content">
          <h2>${title}</h2>
          <div class="popup-text">
            <p>${message}</p>
          </div>
          <div class="popup-buttons">
            <button class="popup-button">${cancelText}</button>
            <button class="popup-button">${confirmText}</button>
          </div>
        </div>
      </div>
    `;

    // Create a new popup element
    const popup = document.createElement('div');
    popup.innerHTML = popupHtml;
    document.body.appendChild(popup);

    // Get the buttons
    const cancelButton = popup.querySelector('.popup-buttons button:first-child');
    const confirmButton = popup.querySelector('.popup-buttons button:last-child');

    // Add event listeners
    cancelButton.addEventListener('click', () => {
      popup.remove();
      if (onCancel) onCancel();
    });

    confirmButton.addEventListener('click', () => {
      popup.remove();
      if (onConfirm) onConfirm();
    });
  }
};
