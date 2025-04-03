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
      laserChargeLow: null,
      laserChargeMedium: null,
      laserChargeHigh: null,
      laserExplosive: null, // New explosive sound for high-powered lasers
      enemyDestroyed: null,
      enemyShieldHit: null,
      playerDamage: null,
      gameOver: null,
      victory: null,
      waveComplete: null
    };
    
    // Active sound sources that can be stopped
    this.activeSources = {
      laserCharge: null
    };
    
    // Mute state - load from localStorage if available
    this.muted = localStorage.getItem('musicInvadersMuted') === 'true';
    
    // Bind methods
    this.init = this.init.bind(this);
    this.resumeAudio = this.resumeAudio.bind(this);
    this.createOscillator = this.createOscillator.bind(this);
    this.toggleMute = this.toggleMute.bind(this);
    this.setMuted = this.setMuted.bind(this);
  }
  
  // Initialize audio context and create sounds
  init() {
    try {
      // Create audio context
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      
      // Create sounds
      this.createSounds();
      
      // Initialize UI with current mute state
      this.updateMuteUI();
      
      utils.log('Sound controller initialized');
    } catch (e) {
      utils.error('Web Audio API is not supported in this browser', e);
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
        buffer[i] = 0.3 * Math.sin(frequency * t * Math.PI * 2) * Math.exp(-5 * t);
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
        const volume = 0.15;
        buffer[i] = volume * Math.sin(frequency * t * Math.PI * 2) * Math.exp(-6 * t);
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
    
    // Laser charge sounds for different power levels
    // Level 1 (low power)
    this.sounds.laserChargeLow = this.createBuffer(buffer => {
      const duration = 1.0;
      const sampleRate = this.audioContext.sampleRate;
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        // Base frequency starts low and rises slowly
        const baseFreq = 100 + 50 * Math.pow(t / duration, 1.2);
        // Add pulsing/oscillation effect
        const pulseRate = 10 + (30 * (t / duration)); // Slower pulses
        const pulseAmount = 0.6 * Math.sin(pulseRate * t * Math.PI * 2);
        // Add some harmonics for richness
        const harmonic1 = 0.25 * Math.sin(baseFreq * 2 * t * Math.PI * 2);
        const harmonic2 = 0.1 * Math.sin(baseFreq * 3 * t * Math.PI * 2);
        // Combine waveforms
        const volume = 0.12;
        buffer[i] = volume * (
          Math.sin(baseFreq * t * Math.PI * 2) * (1 + pulseAmount) + 
          harmonic1 + harmonic2
        ) * Math.pow(t / duration, 0.6); // Gradual ramp-up
      }
    }, 1.5);
    
    // Level 2 (medium power)
    this.sounds.laserChargeMedium = this.createBuffer(buffer => {
      const duration = 1.0;
      const sampleRate = this.audioContext.sampleRate;
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        // Base frequency starts where low power ends and rises faster
        const baseFreq = 150 + 80 * Math.pow(t / duration, 1.4);
        // Add pulsing/oscillation effect
        const pulseRate = 20 + (40 * (t / duration)); // Medium pulses
        const pulseAmount = 0.65 * Math.sin(pulseRate * t * Math.PI * 2);
        // Add some harmonics for richness
        const harmonic1 = 0.3 * Math.sin(baseFreq * 2 * t * Math.PI * 2);
        const harmonic2 = 0.15 * Math.sin(baseFreq * 3.2 * t * Math.PI * 2);
        // Combine waveforms
        const volume = 0.15;
        buffer[i] = volume * (
          Math.sin(baseFreq * t * Math.PI * 2) * (1 + pulseAmount) + 
          harmonic1 + harmonic2
        ) * Math.pow(t / duration, 0.65); // Gradual ramp-up
      }
    }, 1.5);
    
    // Level 3 (high power)
    this.sounds.laserChargeHigh = this.createBuffer(buffer => {
      const duration = 1.0;
      const sampleRate = this.audioContext.sampleRate;
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        // Base frequency starts where medium power ends and rises even faster
        const baseFreq = 230 + 120 * Math.pow(t / duration, 1.6);
        // Add pulsing/oscillation effect
        const pulseRate = 30 + (60 * (t / duration)); // Faster pulses
        const pulseAmount = 0.7 * Math.sin(pulseRate * t * Math.PI * 2);
        // Add some harmonics for richness
        const harmonic1 = 0.35 * Math.sin(baseFreq * 2 * t * Math.PI * 2);
        const harmonic2 = 0.2 * Math.sin(baseFreq * 3.5 * t * Math.PI * 2);
        // Combine waveforms
        const volume = 0.18;
        buffer[i] = volume * (
          Math.sin(baseFreq * t * Math.PI * 2) * (1 + pulseAmount) + 
          harmonic1 + harmonic2
        ) * Math.pow(t / duration, 0.7); // Gradual ramp-up
      }
    }, 1.5); 
    
    // Laser explosive sound for high-powered lasers (power >= 3)
    this.sounds.laserExplosive = this.createBuffer(buffer => {
      const sampleRate = this.audioContext.sampleRate;
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        
        // Initial explosion burst
        const burstPhase = Math.min(t / 0.1, 1); // First 0.1 seconds is the burst
        const burstFreq = 150 * Math.random();
        const burst = 0.8 * Math.sin(burstFreq * t * Math.PI * 2) * (1 - burstPhase);
        
        // Rumbling bass frequencies
        const bassFreq = 80 + 40 * Math.sin(t * 20);
        const bass = 0.2 * Math.sin(bassFreq * t * Math.PI * 0.2) * Math.exp(-1 * t);
        
        // Mid-range crackling
        const crackleFreq = 300 + 400 * Math.random();
        const crackle = 0.3 * Math.sin(crackleFreq * t * Math.PI * 2) * Math.exp(-6 * t);
        
        // High-frequency sizzle
        const sizzleFreq = 2000 + 1000 * Math.random();
        const sizzle = 0.05 * Math.sin(sizzleFreq * t * Math.PI * 2) * Math.exp(-8 * t);
        
        // White noise component
        const noise = 0.3 * (Math.random() * 2 - 1) * Math.exp(-4 * t);
        
        // Combine all components
        buffer[i] = (burst + bass + crackle + sizzle + noise) * 0.25; // Scale down to avoid clipping
      }
    }, 1.5);
    
    // Wave complete sound
    this.sounds.waveComplete = this.createBuffer(buffer => {
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
  playSound(soundName, volume = 1.0, trackSource = false, sourceKey = null) {
    if (!this.audioContext || !this.sounds[soundName]) return null;
    if (this.muted) return null; // Don't play if muted
    
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
    
    // Track this source if requested
    if (trackSource && sourceKey) {
      // Stop any previously playing sound with this key
      if (this.activeSources[sourceKey]) {
        const { source: oldSource, gainNode: oldGainNode } = this.activeSources[sourceKey];
        // Fade out the old sound quickly
        const now = this.audioContext.currentTime;
        oldGainNode.gain.setValueAtTime(oldGainNode.gain.value, now);
        oldGainNode.gain.linearRampToValueAtTime(0, now + 0.02);
        // Schedule the old source to stop after the fade out
        setTimeout(() => {
          try {
            oldSource.stop();
          } catch (e) {
            // Ignore errors if source is already stopped
          }
        }, 25);
      }
      // Store both source and gain node for potential fade out
      this.activeSources[sourceKey] = { source, gainNode };
    }
    
    // Add a very short fadeout at the end for laser sounds to avoid clipping
    if (soundName.startsWith('laser')) {
      const duration = source.buffer.duration;
      const now = this.audioContext.currentTime;
      // Keep full volume until near the end, then fade out quickly
      const fadeStartTime = now + (duration - 0.05); // fadeout 50ms before end
      gainNode.gain.setValueAtTime(volume, fadeStartTime);
      gainNode.gain.linearRampToValueAtTime(0, now + duration);
    }
    
    // Play sound
    source.start();
    
    // Return the source for potential external control
    return source;
  }
  
  // Create and play an oscillator
  createOscillator(frequency, duration, type = 'sine', volume = 0.5) {
    if (!this.audioContext) return;
    if (this.muted) return; // Don't play if muted
    
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
  
  // Play explosive laser sound for high-powered lasers
  playLaserExplosiveSound() {
    this.playSound('laserExplosive', 0.7);
  }
  
  // Play laser charge sound with power level (1-3)
  playLaserChargeSound(power = 1) {
    // Note: We don't need to explicitly call stopLaserChargeSound() here anymore
    // as the playSound method will now handle stopping previous sounds with the same key
    
    // Clamp power to valid range
    const clampedPower = Math.min(Math.max(Math.round(power), 1), 3);
    
    // Select the appropriate sound based on power level
    let soundName;
    switch (clampedPower) {
      case 1:
        soundName = 'laserChargeLow';
        break;
      case 2:
        soundName = 'laserChargeMedium';
        break;
      case 3:
        soundName = 'laserChargeHigh';
        break;
      default:
        soundName = 'laserChargeLow';
    }
    
    // Play the selected sound with appropriate volume and track it
    const volume = 0.2 + (clampedPower * 0.1); // Volume increases with power
    this.playSound(soundName, volume, true, 'laserCharge');
  }
  
  // Stop the laser charge sound with optional fade out
  stopLaserChargeSound(fadeOutTime = 0.05) {
    if (this.activeSources.laserCharge) {
      const { source, gainNode } = this.activeSources.laserCharge;
      
      // If audio context is available, fade out for smoother stop
      if (this.audioContext) {
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(0, now + fadeOutTime);
        
        // Stop the source after fade out
        setTimeout(() => {
          try {
            source.stop();
          } catch (e) {
            // Source might already be stopped, ignore error
          }
          this.activeSources.laserCharge = null;
        }, fadeOutTime * 1000);
      } else {
        // No audio context, stop immediately
        try {
          source.stop();
        } catch (e) {
          // Source might already be stopped, ignore error
        }
        this.activeSources.laserCharge = null;
      }
    }
  }
  
  // Play game over sound - special sad jingle
  playGameOverSound(isNewHighScore = false) {
    if (!this.audioContext) return;
    
    // Resume audio context if suspended
    this.resumeAudio();
    
    if (isNewHighScore) {
      // Play the high score jingle instead
      this.playHighScoreJingle();
      return;
    }
    
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
  playVictorySound(isNewHighScore = false) {
    if (!this.audioContext) return;
    
    // Resume audio context if suspended
    this.resumeAudio();
    
    if (isNewHighScore) {
      // Play the high score jingle instead
      this.playHighScoreJingle();
      return;
    }
    
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
      // Play a C major chord
      [60, 64, 67].forEach(note => {
        const frequency = 440 * Math.pow(2, (note - 69) / 12);
        this.createOscillator(frequency, 1.8, 'sine', 0.3);
      });
    }, 1000);
  }
  
  // Play special high score jingle - longer and more elaborate
  playHighScoreJingle() {
    if (!this.audioContext) return;
    
    // Resume audio context if suspended
    this.resumeAudio();
    
    // Celebratory high score jingle - more elaborate pattern
    // First part - ascending pattern
    const part1 = [60, 64, 67, 72, 76, 79]; // C4, E4, G4, C5, E5, G5
    
    part1.forEach((note, index) => {
      setTimeout(() => {
        const frequency = 440 * Math.pow(2, (note - 69) / 12);
        this.createOscillator(frequency, 0.3, 'sine', 0.4);
      }, index * 150);
    });
    
    // Second part - descending pattern
    const part2 = [76, 72, 76, 79, 84]; // E5, C5, E5, G5, C6
    
    part2.forEach((note, index) => {
      setTimeout(() => {
        const frequency = 440 * Math.pow(2, (note - 69) / 12);
        this.createOscillator(frequency, 0.3, 'triangle', 0.4);
      }, 1000 + index * 150);
    });
    
    // Final triumphant chord with shimmer
    setTimeout(() => {
      [60, 64, 67, 72, 76, 84].forEach((note, i) => { // C major chord with octaves
        const frequency = 440 * Math.pow(2, (note - 69) / 12);
        // Stagger the notes slightly for a shimmer effect
        setTimeout(() => {
          this.createOscillator(frequency, 2.5 - (i * 0.1), 'sine', 0.25);
        }, i * 50);
      });
    }, 2000);
    
    // Add a little flourish at the end
    setTimeout(() => {
      [88, 84, 88, 91].forEach((note, i) => { // High notes flourish
        setTimeout(() => {
          const frequency = 440 * Math.pow(2, (note - 69) / 12);
          this.createOscillator(frequency, 0.2, 'sine', 0.2);
        }, i * 100);
      });
    }, 3000);
  }
  
  // Play wave complete sound
  playWaveCompleteSound() {
    if (!this.audioContext) return;
    
    // Resume audio context if suspended
    this.resumeAudio();
    
    // Optional: Generate a random root note between C3 (48) and C5 (72)
    // const rootNote = Math.floor(Math.random() * 25) + 48; // C3 to C5
    const rootNote = 60; // C4
    
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
  
  // Play menu sound - short sound for returning to menu
  playMenuSound() {
    if (!this.audioContext) return;
    
    // Resume audio context if suspended
    this.resumeAudio();
    
    // Simple descending pattern
    const notes = [67, 64, 60]; // G4, E4, C4 - descending C major triad
    
    // Play each note with delay
    notes.forEach((note, index) => {
      setTimeout(() => {
        const frequency = 440 * Math.pow(2, (note - 69) / 12);
        this.createOscillator(frequency, 0.2, 'sine', 0.4);
      }, index * 100); // 100ms between notes
    });
  }
  
  // Play game start jingle - short upbeat sound when starting a new game
  playGameStartJingle() {
    if (!this.audioContext) return;
    if (this.muted) return; // Don't play if muted
    
    // Resume audio context if suspended
    this.resumeAudio();
    
    // Upbeat ascending pattern
    const notes = [60, 64, 67, 72]; // C4, E4, G4, C5 - ascending C major arpeggio
    
    // Play each note with delay - quick and energetic
    notes.forEach((note, index) => {
      setTimeout(() => {
        const frequency = 440 * Math.pow(2, (note - 69) / 12);
        this.createOscillator(frequency, 0.15, 'sine', 0.3);
      }, index * 125); // 125ms between notes for a quick jingle
    });
    
    // Add a final chord for emphasis
    setTimeout(() => {
      // Play a C major chord
      [60, 64, 67].forEach(note => {
        const frequency = 440 * Math.pow(2, (note - 69) / 12);
        this.createOscillator(frequency, 0.4, 'sine', 0.25);
      });
    }, 625); // Play after the ascending notes
  }
  
  // Toggle mute state
  toggleMute() {
    this.muted = !this.muted;
    
    // Save to localStorage
    localStorage.setItem('musicInvadersMuted', this.muted);
    
    // Update UI elements
    this.updateMuteUI();
    
    // Stop any currently playing sounds if muting
    if (this.muted) {
      // Stop laser charge sound if it's playing
      this.stopLaserChargeSound(0);
      
      // Stop all active sources
      Object.values(this.activeSources).forEach(source => {
        if (source && source.stop) {
          try {
            source.stop(0);
          } catch (e) {
            // Ignore errors if already stopped
          }
        }
      });
    }
    
    return this.muted;
  }
  
  // Set muted state directly
  setMuted(muted) {
    if (this.muted !== muted) {
      this.muted = muted;
      
      // Save to localStorage
      localStorage.setItem('musicInvadersMuted', this.muted);
      
      // Update UI elements
      this.updateMuteUI();
      
      // Stop any currently playing sounds if muting
      if (this.muted) {
        // Stop laser charge sound if it's playing
        this.stopLaserChargeSound(0);
        
        // Stop all active sources
        Object.values(this.activeSources).forEach(source => {
          if (source && source.stop) {
            try {
              source.stop(0);
            } catch (e) {
              // Ignore errors if already stopped
            }
          }
        });
      }
    }
    
    return this.muted;
  }
  
  // Update all UI elements related to mute state
  updateMuteUI() {
    // Update mute button icon
    const muteButton = document.getElementById('mute-toggle-button');
    if (muteButton) {
      muteButton.textContent = this.muted ? '🔇' : '🔊';
    }
    
    // Update checkbox in settings
    const muteCheckbox = document.getElementById('mute-sound');
    if (muteCheckbox) {
      muteCheckbox.checked = this.muted;
    }
  }
}

// Create global sound controller
window.soundController = new SoundController();
