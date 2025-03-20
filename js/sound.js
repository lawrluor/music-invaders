/**
 * Sound controller for the game
 */

class SoundController {
  constructor() {
    // Audio context
    this.audioContext = null;
    
    // Sound buffers
    this.sounds = {
      laserHit: null,
      laserMiss: null,
      enemyDestroyed: null,
      enemyShieldHit: null,
      playerDamage: null,
      gameOver: null,
      victory: null,
      waveComplete: null
    };
    
    // Bind methods
    this.init = this.init.bind(this);
    this.resumeAudio = this.resumeAudio.bind(this);
    this.createOscillator = this.createOscillator.bind(this);
  }
  
  // Initialize audio context and create sounds
  init() {
    try {
      // Create audio context
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      
      // Create sounds
      this.createSounds();
      
      console.log('Sound controller initialized');
    } catch (e) {
      console.error('Web Audio API is not supported in this browser', e);
    }
  }
  
  // Resume audio context (needed for browsers that suspend audio context until user interaction)
  resumeAudio() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
  
  // Create all game sounds
  createSounds() {
    // Laser hit sound
    this.sounds.laserHit = this.createBuffer(buffer => {
      const duration = 0.2;
      const sampleRate = this.audioContext.sampleRate;
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const frequency = 800 - 600 * (t / duration);
        buffer[i] = 0.5 * Math.sin(frequency * t * Math.PI * 2) * Math.exp(-5 * t);
      }
    }, 0.2);
    
    // Laser miss sound
    this.sounds.laserMiss = this.createBuffer(buffer => {
      const sampleRate = this.audioContext.sampleRate;
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const frequency = 200 + 100 * Math.sin(t * 20);
        buffer[i] = 0.3 * Math.sin(frequency * t * Math.PI * 2) * Math.exp(-10 * t);
      }
    }, 0.3);
    
    // Enemy destroyed sound
    this.sounds.enemyDestroyed = this.createBuffer(buffer => {
      const sampleRate = this.audioContext.sampleRate;
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const frequency = 300 + 200 * Math.random();
        buffer[i] = 0.5 * Math.sin(frequency * t * Math.PI * 2) * Math.exp(-6 * t);
      }
    }, 0.7);  // duration
    
    // Enemy shield hit sound
    this.sounds.enemyShieldHit = this.createBuffer(buffer => {
      const sampleRate = this.audioContext.sampleRate;
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const frequency = 100 + 50 * Math.sin(t * 10);
        buffer[i] = 0.4 * Math.sin(frequency * t * Math.PI * 2) * Math.exp(-3 * t);
      }
    }, 0.5);
    
    // Player damage sound
    this.sounds.playerDamage = this.createBuffer(buffer => {
      const sampleRate = this.audioContext.sampleRate;
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const frequency = 150 + 100 * Math.sin(t * 30);
        buffer[i] = 0.5 * Math.sin(frequency * t * Math.PI * 2) * Math.exp(-5 * t);
      }
    }, 0.3);
    
    // Game over sound
    this.sounds.gameOver = this.createBuffer(buffer => {
      const duration = 1.5;
      const sampleRate = this.audioContext.sampleRate;
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const frequency = 200 - 150 * (t / duration);
        buffer[i] = 0.5 * Math.sin(frequency * t * Math.PI * 2) * Math.exp(-2 * t);
      }
    }, 1.5);
    
    // Victory sound
    this.sounds.victory = this.createBuffer(buffer => {
      const sampleRate = this.audioContext.sampleRate;
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        let note = 0;
        
        if (t < 0.5) note = 0;
        else if (t < 1.0) note = 4;
        else if (t < 1.5) note = 7;
        else note = 12;
        
        const frequency = 440 * Math.pow(2, note / 12);
        buffer[i] = 0.5 * Math.sin(frequency * t * Math.PI * 2) * Math.exp(-1 * t);
      }
    }, 2.0);
    
    // Wave complete sound
    this.sounds.waveComplete = this.createBuffer(buffer => {
      const duration = 1.0;
      const sampleRate = this.audioContext.sampleRate;
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        let note = 0;
        
        if (t < 0.3) note = 0;
        else if (t < 0.6) note = 4;
        else note = 7;
        
        const frequency = 440 * Math.pow(2, note / 12);
        buffer[i] = 0.5 * Math.sin(frequency * t * Math.PI * 2) * Math.exp(-2 * t);
      }
    }, 1.0);
  }
  
  // Create an audio buffer with the given generator function
  createBuffer(generatorFunc, duration) {
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    generatorFunc(data);
    
    return buffer;
  }
  
  // Play a sound from the buffer
  playSound(soundName, volume = 1.0) {
    if (!this.audioContext || !this.sounds[soundName]) return;
    
    // Resume audio context if suspended
    this.resumeAudio();
    
    // Create source node
    const source = this.audioContext.createBufferSource();
    source.buffer = this.sounds[soundName];
    
    // Create gain node for volume control
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;
    
    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Play sound
    source.start();
  }
  
  // Create and play an oscillator
  createOscillator(frequency, duration, type = 'sine', volume = 0.5) {
    if (!this.audioContext) return;
    
    // Resume audio context if suspended
    this.resumeAudio();
    
    // Create oscillator
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    // Create gain node for volume and envelope
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0;
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Start oscillator
    oscillator.start();
    
    // Apply envelope
    const now = this.audioContext.currentTime;
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
    
    // Stop oscillator after duration
    oscillator.stop(now + duration);
  }
  
  // Play laser hit sound
  playLaserHitSound() {
    this.playSound('laserHit', 0.4);
  }
  
  // Play laser miss sound
  playLaserMissSound() {
    this.playSound('laserMiss', 0.3);
  }
  
  // Play enemy destroyed sound
  playEnemyDestroyedSound() {
    this.playSound('enemyDestroyed', 0.5);
  }
  
  // Play enemy shield hit sound
  playEnemyShieldHitSound() {
    this.playSound('enemyShieldHit', 0.4);
  }
  
  // Play player damage sound
  playPlayerDamageSound() {
    this.playSound('playerDamage', 0.5);
  }
  
  // Play game over sound - special sad jingle
  playGameOverSound() {
    if (!this.audioContext) return;
    
    // Resume audio context if suspended
    this.resumeAudio();
    
    // Sad jingle - descending minor pattern
    const notes = [64, 62, 59, 55]; // E4, D4, B3, G3 - descending minor pattern
    
    // Play each note with delay
    notes.forEach((note, index) => {
      setTimeout(() => {
        const frequency = 440 * Math.pow(2, (note - 69) / 12);
        this.createOscillator(frequency, 0.5, 'sine', 0.4);
      }, index * 250);
    });
    
    // Play final minor chord
    setTimeout(() => {
      [55, 58, 62].forEach(note => { // G3, A#3, D4 - G minor chord
        const frequency = 440 * Math.pow(2, (note - 69) / 12);
        this.createOscillator(frequency, 1.5, 'sine', 0.3);
      });
    }, 1200);
  }
  
  // Play victory sound - special triumphant jingle
  playVictorySound() {
    if (!this.audioContext) return;
    
    // Resume audio context if suspended
    this.resumeAudio();
    
    // Triumphant jingle - ascending major pattern
    const notes = [60, 64, 67, 72, 76]; // C4, E4, G4, C5, E5 - ascending C major pattern
    
    // Play each note with delay
    notes.forEach((note, index) => {
      setTimeout(() => {
        const frequency = 440 * Math.pow(2, (note - 69) / 12);
        this.createOscillator(frequency, 0.4, 'sine', 0.4);
      }, index * 180);
    });
    
    // Play final major chord
    setTimeout(() => {
      [60, 64, 67, 72].forEach(note => { // C4, E4, G4, C5 - C major chord
        const frequency = 440 * Math.pow(2, (note - 69) / 12);
        this.createOscillator(frequency, 1.8, 'sine', 0.3);
      });
    }, 1000);
  }
  
  // Play wave complete sound - randomly generated major triad between C3-C5
  playWaveCompleteSound() {
    if (!this.audioContext) return;
    
    // Resume audio context if suspended
    this.resumeAudio();
    
    // Generate a random root note between C3 (48) and C5 (72)
    const rootNote = Math.floor(Math.random() * 25) + 48; // C3 to C5
    
    // Calculate major triad: root, major third (4 semitones up), perfect fifth (7 semitones up)
    const notes = [
      rootNote,           // Root
      rootNote + 4,       // Major third
      rootNote + 7        // Perfect fifth
    ];
    
    // Play each note of the triad with slight delay
    notes.forEach((note, index) => {
      // Convert MIDI note to frequency: f = 440 * 2^((n-69)/12)
      const frequency = 440 * Math.pow(2, (note - 69) / 12);
      
      // Play each note with a slight delay
      setTimeout(() => {
        this.createOscillator(frequency, 0.6, 'sine', 0.4);
      }, index * 200); // 200ms delay between notes
    });
    
    // Play final chord after individual notes
    setTimeout(() => {
      notes.forEach(note => {
        const frequency = 440 * Math.pow(2, (note - 69) / 12);
        this.createOscillator(frequency, 1.2, 'sine', 0.3);
      });
    }, 800); // Play chord after all individual notes
  }
}

// Create global sound controller
window.soundController = new SoundController();
