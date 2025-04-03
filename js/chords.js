// Chord utilities for Space Invaders game

class ChordController {
  constructor() {
    // Define chord types and their intervals
    this.chordTypes = {
      // Triads
      'maj': [0, 4, 7],     // Major (C, E, G)
      'min': [0, 3, 7],     // Minor (C, Eb, G)
      'dim': [0, 3, 6],     // Diminished (C, Eb, Gb)
      'aug': [0, 4, 8],     // Augmented (C, E, G#)

      // Seventh chords
      '7': [0, 4, 7, 10],   // Dominant 7th (C, E, G, Bb)
      'maj6': [0, 4, 7, 9], // Major 6th (C, E, G, A)
      'min6': [0, 3, 7, 9], // Minor 6th (C, Eb, G, A)
      'maj7': [0, 4, 7, 11], // Major 7th (C, E, G, B)
      'min7': [0, 3, 7, 10], // Minor 7th (C, Eb, G, Bb)
      'dim7': [0, 3, 6, 9],  // Diminished 7th (C, Eb, Gb, A)
      'half-dim7': [0, 3, 6, 10], // Half-diminished 7th (C, Eb, Gb, Bb)
      'minMaj7': [0, 3, 7, 11] // Minor-major 7th (C, Eb, G, B)
    };

    // Define chord abbreviations
    this.chordAbbreviations = {
      'maj': 'M',
      'min': 'm',
      'dim': '°',
      'aug': '+',
      '7': '⁷', // Unicode superscript 7
      'maj6': '⁶', // Unicode superscript 6
      'min6': '‐⁶', // Unicode superscript 6 with 'm'
      'maj7': 'Δ⁷', // Unicode superscript 7 with 'M'
      'min7': '‐⁷', // Unicode superscript 7 with 'm'. Minus is U+2010
      'dim7': '°⁷', // Unicode superscript 7 with 'o'
      'half-dim7': 'ø⁷', // Unicode superscript 7 with 'ø'
      'minMaj7': 'm(Δ⁷)' // Minor-major 7th with superscript
    };

    // Reference: types of dashes: https://jkorpela.fi/dashes.html

    // Add all note name variations (flat, natural, sharp)
    this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']; // Standard 12 notes for MIDI conversion

    // Extended note names with enharmonic equivalents for display
    this.extendedNoteNames = {
      0: ['C', 'B#'],
      1: ['C#', 'Db'],
      2: ['D'],
      3: ['D#', 'Eb'],
      4: ['E', 'Fb'],
      5: ['F', 'E#'],
      6: ['F#', 'Gb'],
      7: ['G'],
      8: ['G#', 'Ab'],
      9: ['A'],
      10: ['A#', 'Bb'],
      11: ['B', 'Cb']
    };

    // Check if abbreviations are enabled (load from localStorage)
    this.useAbbreviations = localStorage.getItem('useChordAbbreviations') === 'true';

    // Check if we should hide uncommon chords (load from localStorage). Default to true if not set.
    this.hideUncommonChords = localStorage.getItem('hideUncommonChords') ? localStorage.getItem('hideUncommonChords') === 'true' : 'true';

    // Define common key names (for filtering uncommon chords)
    this.commonKeyNames = [
      // Major keys (C, G, D, A, E, B/Cb, F#/Gb, C#/Db, Ab, Eb, Bb, F)
      'C', 'G', 'D', 'A', 'E', 'B', 'Cb', 'F#', 'Gb', 'C#', 'Db', 'Ab', 'Eb', 'Bb', 'F',
      // Minor keys (Am, Em, Bm, F#m, C#m, G#m, D#m/Ebm, A#m/Bbm, Fm, Cm, Gm, Dm)
      'Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Ebm', 'A#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'
    ];
  }

  // Get the name of a note from MIDI note number
  getNoteNameFromMidi(midiNote) {
    const noteIndex = midiNote % 12;
    const octave = Math.floor(midiNote / 12) - 1;
    // Use the primary name (first in the array) for each note
    return `${this.extendedNoteNames[noteIndex][0]}${octave}`;
  }

  // Check if a chord is common based on its root note and type
  isCommonChord(rootNote, chordType) {
    // Extract just the note name without octave
    const noteName = rootNote.replace(/\d+$/, '');

    // For major chords, aug chords, and dominant 7 chords
    if (chordType === 'maj' || chordType === 'aug' || chordType === '7') {
      // Check if the root note is a common major key
      return this.commonKeyNames.some(key => {
        // If it's a major key (not ending with m)
        if (!key.endsWith('m')) {
          // Check if the note matches
          return key === noteName;
        }
        return false;
      });
    }
    // For minor chords, dim chords, half-dim chords, and minMaj chords
    else if (chordType === 'min' || chordType === 'dim' || chordType === 'half-dim7' || chordType === 'minMaj7') {
      // Check if the root note + 'm' is a common minor key
      return this.commonKeyNames.some(key => {
        // If it's a minor key (ending with m)
        if (key.endsWith('m')) {
          // Check if the note matches (removing the 'm' suffix)
          return key.slice(0, -1) === noteName;
        }
        return false;
      });
    }

    // For other chord types, use the same rules as their base type
    if (chordType === 'maj6' || chordType === 'maj7') {
      return this.isCommonChord(rootNote, 'maj');
    } else if (chordType === 'min6' || chordType === 'min7' || chordType === 'dim7') {
      return this.isCommonChord(rootNote, 'min');
    }

    // Default to true for any other chord types
    return true;
  }

  // Toggle the hide uncommon chords setting
  toggleHideUncommonChords(value) {
    this.hideUncommonChords = value;
  }

  // Get a random chord type
  getRandomChordType() {
    const chordTypes = Object.keys(this.chordTypes);
    return chordTypes[Math.floor(Math.random() * chordTypes.length)];
  }

  // Generate a random chord
  generateRandomChord(minRoot, maxRoot) {
    // Maximum attempts to find a common chord
    const maxAttempts = 50;
    let attempts = 0;

    while (attempts < maxAttempts) {
      // Get random root note
      const root = Math.floor(Math.random() * (maxRoot - minRoot + 1)) + minRoot;
      const rootNoteName = this.getNoteNameFromMidi(root);

      // Get random chord type
      const chordType = this.getRandomChordType();

      // If we're hiding uncommon chords and this chord is uncommon, try again
      if (this.hideUncommonChords && !this.isCommonChord(rootNoteName, chordType)) {
        attempts++;
        continue;
      }

      // Generate chord notes
      const chordNotes = this.generateChordFromRoot(root, chordType);

      return {
        root: root,
        type: chordType,
        notes: chordNotes,
        name: this.getChordName(root, chordType)
      };
    }

    // If we couldn't find a common chord after max attempts, just return any chord
    // Get random root note
    const root = Math.floor(Math.random() * (maxRoot - minRoot + 1)) + minRoot;
    const chordType = this.getRandomChordType();
    const chordNotes = this.generateChordFromRoot(root, chordType);

    return {
      root: root,
      type: chordType,
      notes: chordNotes,
      name: this.getChordName(root, chordType)
    };
  }

  // Generate chord notes from root and type
  generateChordFromRoot(rootNote, chordType) {
    if (!this.chordTypes[chordType]) {
      console.error(`Unknown chord type: ${chordType}`);
      return [];
    }

    // Get intervals for this chord type
    const intervals = this.chordTypes[chordType];

    // Generate notes (these are reference notes - player can play in any octave)
    return intervals.map(interval => rootNote + interval);
  }

  // Get chord name (e.g., "C maj7" or "C Δ" if abbreviations enabled)
  getChordName(rootNote, chordType, preferredSpelling = null) {
    const rootIndex = rootNote % 12;

    // Determine which spelling to use (primary or alternate)
    let rootName;
    if (preferredSpelling && this.extendedNoteNames[rootIndex].includes(preferredSpelling)) {
      // Use the preferred spelling if specified and valid
      rootName = preferredSpelling;
    } else {
      // Default to primary spelling (first in the array)
      rootName = this.extendedNoteNames[rootIndex][0];

      // For certain chord types, prefer flat spellings
      const flatPreferredTypes = ['min', 'dim', 'dim7', 'half-dim7'];
      if (flatPreferredTypes.includes(chordType) && this.extendedNoteNames[rootIndex].length > 1) {
        // Check if there's a flat spelling available
        const flatSpelling = this.extendedNoteNames[rootIndex].find(name => name.includes('b'));
        if (flatSpelling) {
          rootName = flatSpelling;
        }
      }
    }

    // Don't include a space between root and chord type
    if (this.useAbbreviations && this.chordAbbreviations[chordType]) {
      return `${rootName}${this.chordAbbreviations[chordType]}`;
    } else {
      return `${rootName}${chordType}`;
    }
  }

  // Toggle abbreviations on/off
  toggleAbbreviations(useAbbrev) {
    this.useAbbreviations = useAbbrev;
    localStorage.setItem('useChordAbbreviations', useAbbrev);
  }

  // Find a chord by its name (supports enharmonic equivalents)
  findChordByName(chordName) {
    // Extract root name and chord type from the chord name
    // This regex matches the note name at the beginning and the chord type after
    const match = chordName.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return null;

    const [, rootName, chordType] = match;

    // Find the pitch class for this root name
    let rootPitchClass = -1;
    for (let pc = 0; pc < 12; pc++) {
      if (this.extendedNoteNames[pc].includes(rootName)) {
        rootPitchClass = pc;
        break;
      }
    }

    if (rootPitchClass === -1) return null; // Root name not found

    // Find the chord type (with or without abbreviation)
    let foundChordType = chordType;
    if (this.useAbbreviations) {
      // Try to find the chord type from the abbreviation
      for (const [type, abbrev] of Object.entries(this.chordAbbreviations)) {
        if (abbrev === chordType) {
          foundChordType = type;
          break;
        }
      }
    }

    // Check if this is a valid chord type
    if (!this.chordTypes[foundChordType]) return null;

    // Generate the chord notes
    return this.generateChordFromRoot(rootPitchClass, foundChordType);
  }

  // Check if a set of played notes matches a chord
  notesMatchChord(playedNotes, chordNotes) {
    // Must have the same number of notes
    if (playedNotes.length !== chordNotes.length) {
      return false;
    }

    // Convert notes to pitch classes (0-11) to make them octave-agnostic
    const playedClasses = playedNotes.map(note => note % 12);
    const chordClasses = chordNotes.map(note => note % 12);

    // Sort both arrays to compare
    const sortedPlayed = [...playedClasses].sort((a, b) => a - b);
    const sortedChord = [...chordClasses].sort((a, b) => a - b);

    // Check if all note classes match (ignoring octaves)
    for (let i = 0; i < sortedPlayed.length; i++) {
      if (sortedPlayed[i] !== sortedChord[i]) {
        return false;
      }
    }

    return true;
  }
}

// Create global chord controller
window.chordController = new ChordController();
