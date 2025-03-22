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
      '7': '7',
      'maj6': 'M6',
      'min6': 'm6',
      'maj7': 'Δ',
      'min7': 'm7',
      'dim7': '°7',
      'half-dim7': 'ø7',
      'minMaj7': 'm(Maj7)'
    };
    
    // Note names (for display)
    this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Check if abbreviations are enabled (load from localStorage)
    this.useAbbreviations = localStorage.getItem('useChordAbbreviations') === 'true';
  }
  
  // Get the name of a note from MIDI note number
  getNoteNameFromMidi(midiNote) {
    const noteIndex = midiNote % 12;
    const octave = Math.floor(midiNote / 12) - 1;
    return `${this.noteNames[noteIndex]}${octave}`;
  }
  
  // Get a random chord type
  getRandomChordType() {
    const chordTypes = Object.keys(this.chordTypes);
    return chordTypes[Math.floor(Math.random() * chordTypes.length)];
  }
  
  // Generate a random chord
  generateRandomChord(minRoot, maxRoot) {
    // Get random root note
    const root = Math.floor(Math.random() * (maxRoot - minRoot + 1)) + minRoot;
    
    // Get random chord type
    const chordType = this.getRandomChordType();
    
    // Generate chord notes
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
  getChordName(rootNote, chordType) {
    const rootName = this.noteNames[rootNote % 12];
    
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
