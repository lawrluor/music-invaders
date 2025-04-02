/**
 * Game class for Space Invaders
 */

// Constants
const WAVE_NUMBER = 1;

class Game {
  constructor(canvas) {
    // Canvas setup
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resizeCanvas();
    
    // Helper for controllers
    this.getSoundController = () => window.soundController || window.sound;
    this.getMidiController = () => window.midiController || window.midi;
    
    // Game state
    this.gameState = 'title'; // title, playing, gameOver, victory, waveTransition
    this.score = 0;
    this.gameMode = 'classic'; // classic or survival
    this.chordMode = false; // Whether to use chords instead of single notes
    this.highScore = utils.loadHighScore(this.gameMode);
    
    // Chord charging system
    this.chordCharge = {
      active: false,
      notes: new Set(),
      startTime: 0,
      maxHoldTime: 10000, // Max time to hold chord before auto-firing (ms)
      lastReleaseTime: 0,
      cooldownTime: 100, // Time before a new charge can start after releasing (ms)
      power: 1, // Power level of the charged laser (1-4)
      isFiring: false // Flag to prevent multiple firings in quick succession
    };
    this.wave = WAVE_NUMBER
    this.health = 100;
    this.initialHealth = 100;
    this.wavesTotal = 5;
    this.pointsPerEnemy = 100;
    this.waveTransitionTime = 2000; // ms - reduced from 3000
    this.waveTransitionStart = 0;
    this.gameOverReason = ''; // Reason for game over
    
    // Game objects
    this.player = null;
    this.enemies = [];
    this.lasers = [];
    this.backgroundTime = 0; // Time for background animation
    
    // Background color schemes for different waves
    this.backgroundSchemes = [
      // Wave 1: Blue theme
      [
        { r: 0, g: 0, b: 30 },   // Deep blue at top
        { r: 10, g: 0, b: 50 },  // Blue-purple in middle
        { r: 30, g: 0, b: 70 }   // Purple at bottom
      ],
      // Wave 2: Green theme
      [
        { r: 0, g: 20, b: 20 },  // Dark teal at top
        { r: 0, g: 40, b: 30 },  // Teal in middle
        { r: 0, g: 60, b: 40 }   // Green at bottom
      ],
      // Wave 3: Red theme
      [
        { r: 30, g: 0, b: 10 },  // Dark red at top
        { r: 50, g: 0, b: 20 },  // Red in middle
        { r: 70, g: 10, b: 30 }  // Red-purple at bottom
      ],
      // Wave 4: Purple theme
      [
        { r: 20, g: 0, b: 30 },  // Dark purple at top
        { r: 40, g: 0, b: 60 },  // Purple in middle
        { r: 60, g: 20, b: 80 }  // Light purple at bottom
      ],
      // Wave 5+: Gold theme
      [
        { r: 30, g: 20, b: 0 },  // Dark gold at top
        { r: 60, g: 40, b: 0 },  // Gold in middle
        { r: 80, g: 60, b: 20 }  // Light gold at bottom
      ]
    ];
    
    // Current background colors (will be set based on wave)
    this.backgroundColors = this.backgroundSchemes[0];
    
    // MIDI note range - will be updated for each wave
    this.midiRange = {
      min: 48, // C3
      max: 84  // C6
    };
    
    // Get the actual MIDI device range to ensure we stay within bounds
    this.updateMidiDeviceRange();
    
    // MIDI note processing
    this.lastProcessedNotes = {};
    
    // Animation frame
    this.animationFrameId = null;
    this.lastFrameTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    
    // UI elements
    this.uiElements = {
      score: document.getElementById('score'),
      highScore: document.getElementById('high-score'),
      wave: document.getElementById('wave'),
      ammoBar: document.getElementById('ammo-bar'),
      healthBar: document.getElementById('health-bar'),
      gameModeDisplay: document.getElementById('game-mode-display'),
      fpsCounter: document.getElementById('fps-counter'),
      finalScore: document.getElementById('final-score'),
      victoryScore: document.getElementById('victory-score'),
      nextWave: document.getElementById('next-wave'),
      titleScreen: document.getElementById('title-screen'),
      gameOverScreen: document.getElementById('game-over-screen'),
      victoryScreen: document.getElementById('victory-screen'),
      waveTransition: document.getElementById('wave-transition')
    };
    
    // Bind methods
    this.init = this.init.bind(this);
    this.startGame = this.startGame.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
    this.handleNoteOn = this.handleNoteOn.bind(this);
    this.handleNoteOff = this.handleNoteOff.bind(this);
    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.startNextWave = this.startNextWave.bind(this);
    
    // Add window resize event listener
    window.addEventListener('resize', this.resizeCanvas);
  }
  
  /**
   * Initialize the game by adding event listeners and loading high score data.
   * This method is called once when the game is first loaded.
   */
  init() {
    // Initialize chord controller if it doesn't exist
    if (!window.chordController) {
      window.chordController = new ChordController();
    }
    
    // Add MIDI event listeners
    const midiController = this.getMidiController();
    if (midiController) {
      midiController.addNoteOnListener(this.handleNoteOn);
      midiController.addNoteOffListener(this.handleNoteOff);
    } else {
      utils.log('MIDI controller not found');
    }
    
    // Track selected game mode and chord mode
    this.selectedGameMode = 'classic';
    this.selectedChordMode = false;
    
    const restartGameButton = document.getElementById('restart-game-button');
    if (restartGameButton) {
      restartGameButton.addEventListener('click', () => {
        if (this.gameState === 'playing') {
          // Hide the entire game container before showing the confirmation dialog
          // This prevents players from abusing the dialog as a pause mechanism
          const gameContainer = document.getElementById('game-container');
          if (gameContainer) {
            gameContainer.style.visibility = 'hidden';
            
            setTimeout(() => {
              // Show confirmation popup
              utils.showConfirmationPopup(
                'Restart Game',
                'Are you sure you want to restart the game? Your progress will be lost and your score will not be saved.',
                () => {
                  // User confirmed restart
                  gameContainer.style.visibility = 'visible';
                  this.restartGame();
                },
                () => {
                  // User canceled restart - resume game
                  gameContainer.style.visibility = 'visible';
                },
                'Cancel',
                'Restart'
              );
            }, 50);
          }
        }
      });
    }
    
    // Add listener on return to menu buttons on game over and victory screens
    const gameOverMenuButton = document.getElementById('game-over-menu-button');
    if (gameOverMenuButton) {
      gameOverMenuButton.addEventListener('click', () => this.returnToMenu());
    }
    
    const victoryMenuButton = document.getElementById('victory-menu-button');
    if (victoryMenuButton) {
      victoryMenuButton.addEventListener('click', () => this.returnToMenu());
    }

    const gameOverPlayAgainButton = document.getElementById('game-over-play-again-button');
    if (gameOverPlayAgainButton) {
      gameOverPlayAgainButton.addEventListener('click', () => this.restartGame());
    }

    const victoryPlayAgainButton = document.getElementById('victory-play-again-button');
    if (victoryPlayAgainButton) {
      victoryPlayAgainButton.addEventListener('click', () => this.restartGame());
    }
    
    // Add listener to exit to menu button (present during gameplay)
    const exitToMenuButton = document.getElementById('exit-to-menu-button');
    if (exitToMenuButton) {
      exitToMenuButton.addEventListener('click', () => {
        // Only allow exit during gameplay
        if (this.gameState === 'playing') {
          // Hide the entire game container before showing the confirmation dialog
          // This prevents players from using the dialog as a pause mechanism
          const gameContainer = document.getElementById('game-container');
          if (gameContainer) {
            gameContainer.style.visibility = 'hidden';
            
            // Show confirmation popup
            setTimeout(() => {
              utils.showConfirmationPopup(
                'Exit to Menu',
                'Are you sure you want to exit to the menu? Your progress will be lost and your score will not be saved.',
                () => {
                  // User confirmed exit
                this.returnToMenu();
                gameContainer.style.visibility = 'visible';
              },
              () => {
                // User canceled exit - resume game
                gameContainer.style.visibility = 'visible';
              },
              'Cancel',
              'Exit'
            );
            }, 50);
          }
        }
      });
    }
    
    // Load high score for current game mode and update display
    this.highScore = utils.loadHighScore(this.gameMode);
    this.uiElements.highScore.textContent = this.highScore;
    
    // Start game loop
    this.lastFrameTime = performance.now();
    this.gameLoop();
    
    utils.log('Game initialized');
  }
  
  // Start a new game
  startGame(gameMode, chordMode = false) {
    // DEDBUG ONLY
    // this.exportBackgroundAsPNG();

    // Cancel any ongoing animation frame to prevent multiple loops
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Set game mode
    this.gameMode = gameMode || 'classic';
    this.chordMode = chordMode;
    
    // Load the appropriate high score for this mode
    // Combine gameMode and chordMode for high score tracking
    const scoreKey = this.chordMode ? `${this.gameMode}_chord` : this.gameMode;
    this.highScore = utils.loadHighScore(scoreKey);
    utils.log(`Starting ${this.gameMode} mode (${this.chordMode ? 'chord' : 'note'} mode) with high score: ${this.highScore}`);
    
    // Update high score display
    if (this.uiElements.highScore) {
      this.uiElements.highScore.textContent = this.highScore;
    }
    
    // Reset game state
    this.gameState = 'playing';
    this.score = 0;
    this.wave = WAVE_NUMBER
    this.health = this.initialHealth;
    this.lastProcessedNotes = {};
    this.activeNotes = new Set();
    
    // Reset chord charge system
    this.resetChordCharge();
    
    // Reset to the first MIDI range scheme
    this.updateMidiRangeForWave();
    
    // Create player with chord mode parameter
    this.player = new Player(this.canvas.width, this.canvas.height, this.chordMode);

    // DEBUG ONLY: Export player as image
    //this.player.exportAsImage();
    
    // Clear existing objects
    this.enemies = [];
    this.lasers = [];
    
    // Create enemies for first wave
    this.createEnemiesForWave();
    
    // Update UI
    this.updateUI();
    
    // Hide all screens
    this.uiElements.titleScreen.classList.add('hidden');
    this.uiElements.gameOverScreen.classList.add('hidden');
    this.uiElements.victoryScreen.classList.add('hidden');
    this.uiElements.waveTransition.classList.add('hidden');
    
    // Resume audio context and play start jingle
    const soundController = this.getSoundController();
    if (soundController) {
      soundController.resumeAudio();
      // Play the game start jingle
      soundController.playGameStartJingle();
    }
    
    // Reset timing variables to ensure smooth animation
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    
    // Hide settings button during gameplay
    if (typeof window.toggleSettingsButtonVisibility === 'function') {
      window.toggleSettingsButtonVisibility(this.gameState);
    }
    
    // Make sure the game loop is running
    if (!this.animationFrameId) {
      this.gameLoop(this.lastFrameTime);
    }
    
    utils.log('Game started');
  }

  restartGame() {
    this.resetChordCharge();
    if (this.activeNotes) {
      this.activeNotes.clear();
    }
    
    // Maintain the current game mode and chord mode
    this.startGame(this.gameMode, this.chordMode);
    // Update the global selections to match
    window.selectedGameMode = this.gameMode;
    window.selectedChordMode = this.chordMode;
  }
  
  // Create enemies for the current wave
  // Returns the number of enemies created for ammo calculation
  createEnemiesForWave() {
    // Clear existing enemies
    this.enemies = [];
    
    // Determine number of enemies based on wave
    // For classic mode: 5 to 9 enemies (5 + wave - 1, capped at 9)
    // For survival mode: 5 + wave/2 enemies (increasing more slowly but without cap)
    let enemyCount;
    
    if (this.gameMode === 'classic') {
      enemyCount = 5 + (this.wave - 1); 
    } else { // survival mode
      // Start with 5 enemies, add 1 enemy every wave
      enemyCount = 5 + (this.wave - 1);
    }
    
    // Use the current MIDI range for this wave
    // The range should already be set to 3 octaves (36 notes) if possible
    const startNote = this.midiRange.min;
    const endNote = this.midiRange.max;
    
    // Create a set to track used notes or chord roots
    const usedNotes = new Set();
    
    // Create enemies
    for (let i = 0; i < enemyCount; i++) {
      // Animation offset for variety
      const animationOffset = i * 0.2;
      
      // Random y position near the top with 20% more spread
      const y = utils.random(20, 100); // Increased from (50, 150)
      
      let enemy;
      
      if (this.chordMode) {
        // Chord mode - generate random chord
        // Ensure root notes are within the MIDI range and not duplicated
        let rootNote;
        do {
          rootNote = utils.randomInt(startNote, endNote - 12); // Leave room for chord notes
        } while (usedNotes.has(rootNote));
        
        // Add root note to used notes set
        usedNotes.add(rootNote);
        
        // Generate a random chord
        const chordData = window.chordController.generateRandomChord(rootNote, rootNote);
        
        // Calculate x position based on root note
        const x = utils.midiNoteToXPosition(rootNote, this.canvas.width, startNote, endNote);
        
        // Create enemy with chord data
        enemy = new Enemy(x, y, rootNote, animationOffset, true, chordData);
      } else {
        // Single note mode - generate random note
        let note;
        do {
          note = utils.randomInt(startNote, endNote);
        } while (usedNotes.has(note));
        
        // Add note to used notes set
        usedNotes.add(note);
        
        // Calculate x position based on note
        const x = utils.midiNoteToXPosition(note, this.canvas.width, startNote, endNote);
        
        // Create enemy with single note
        enemy = new Enemy(x, y, note, animationOffset);
        
        // DEBUG only
        // enemy.exportAsImage(); 
      }
      
      this.enemies.push(enemy);
    }
    
    // Return the enemy count for ammo calculation in survival mode
    return enemyCount;
  }
  
  // Main game loop
  gameLoop(timestamp) {
    // Calculate delta time
    if (!this.lastFrameTime) this.lastFrameTime = timestamp;
    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    
    // Update FPS counter
    this.updateFPS(deltaTime);
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Always draw the background for visual consistency
    this.drawBackground(deltaTime);
    
    // Update and draw game objects based on game state
    if (this.gameState === 'playing') {
      this.updatePlaying(deltaTime);
    } else if (this.gameState === 'waveTransition') {
      this.updateWaveTransition(timestamp);
    }
    
    // Request next frame
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }
  
  // Update game during playing state (runs every "frame)
  updatePlaying(deltaTime) {
    // Update player
    if (this.player) {
      this.player.update(deltaTime);
      this.player.draw(this.ctx);
    }
    
    // Update enemies
    let allEnemiesDead = true;
    this.enemies.forEach(enemy => {
      if (enemy.alive) {
        allEnemiesDead = false;
        enemy.update(deltaTime);
        
        // Check if any part of the enemy is inside the shield
        const enemyPoints = [
          { x: enemy.x, y: enemy.y }, // Top-left
          { x: enemy.x + enemy.width, y: enemy.y }, // Top-right
          { x: enemy.x, y: enemy.y + enemy.height }, // Bottom-left
          { x: enemy.x + enemy.width, y: enemy.y + enemy.height }, // Bottom-right
          { x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height } // Bottom-center
        ];
          
        // Check if any point is inside the shield
        const touchingShield = enemyPoints.some(point => 
          this.player.isPointInShield(point.x, point.y)
        );
        
        if (touchingShield && !enemy.hasHitShield) {
          // Enemy touches shield - cause damage immediately (20% of health)
          this.health -= 20; // 20% of initial health (100)
          enemy.hitShield();
          enemy.die(); // Start death animation

          const soundController = this.getSoundController();
          if (soundController) {
            soundController.playEnemyShieldHitSound();
            soundController.playPlayerDamageSound();
          }
        }

        enemy.draw(this.ctx);
      }
    });
    
    // Update lasers
    this.lasers = this.lasers.filter(laser => {
      laser.update(deltaTime);
      laser.draw(this.ctx);
      return laser.active;
    });
    
    // Draw chord charge indicator if in chord mode
    if (this.chordMode) {
      this.drawChordChargeIndicator();
      
      // Check if we need to auto-release the chord charge due to timeout
      if (this.chordCharge.active) {
        const chargeTime = performance.now() - this.chordCharge.startTime;
        if (chargeTime >= this.chordCharge.maxHoldTime) {
          this.releaseChordCharge();
        }
      }
    }

    // Check if all enemies are defeated and there were enemies to begin with to ensure:
    // 1. You don't trigger victory/wave transition if there were no enemies
    // 2. You only trigger it when all enemies that existed are now dead
    if (allEnemiesDead && this.enemies.length > 0) {
      // Check if this was the last wave for classic mode
      if (this.gameMode === 'classic' && this.wave >= this.wavesTotal) {
        this.victory();
        return; // Exit early to prevent simultaneous game over checks
      } else {
        this.startWaveTransition();
        return; // Exit early to prevent simultaneous game over checks
      }
    } 
    
    // Check if out of ammo only if there are no active lasers on the field
    // This ensures the last shot has time to register and kill an enemy before checking ammo
    if (!this.player.hasAmmo() && !this.lasers.length) {
      // Only trigger game over if there are no active lasers that might still hit enemies
      this.gameOver('You ran out of ammo!');
      return; // Exit early to prevent simultaneous game over checks
    }

    // Check if player is dead
    if (this.health <= 0) {
      this.gameOver('Your shield was destroyed by an enemy!');
      return; // Exit early to prevent simultaneous game over checks
    }
    
    // Update UI
    this.updateUI();
  }
  
  // Update wave transition
  updateWaveTransition(timestamp) {
    // Check if transition is complete
    if (timestamp - this.waveTransitionStart >= this.waveTransitionTime) {
      this.startNextWave();
    }
  }
  
  // Start wave transition
  startWaveTransition() {
    this.gameState = 'waveTransition';
    this.waveTransitionStart = performance.now();
    this.wave++;
    
    // Hide settings button during wave transition
    if (typeof window.toggleSettingsButtonVisibility === 'function') {
      window.toggleSettingsButtonVisibility(this.gameState);
    }
    
    // Update UI
    this.uiElements.nextWave.textContent = this.wave;
    this.uiElements.waveTransition.classList.remove('hidden');
    
    // Play sound
    const soundController = this.getSoundController();
    if (soundController) {
      soundController.playWaveCompleteSound();
    }
  }
  
  // Start next wave
  startNextWave() {
    this.gameState = 'playing';
    
    // Update background colors based on wave
    const schemeIndex = Math.min(this.wave - 1, this.backgroundSchemes.length - 1);
    this.backgroundColors = this.backgroundSchemes[schemeIndex];
    
    // Update MIDI range based on wave
    this.updateMidiRangeForWave();
    
    // Create enemies for the new wave
    const previousEnemyCount = this.createEnemiesForWave();
    
    // In survival mode, give additional ammo after each wave
    if (this.gameMode === 'survival' && this.wave > 1) {
      // Add ammo equal to 125% of the enemies in the previous wave, rounded down
      // Make sure previousEnemyCount is a valid number
      const enemyCount = typeof previousEnemyCount === 'number' && !isNaN(previousEnemyCount) ? previousEnemyCount : 5;
      const ammoBonus = this.chordMode ? Math.floor(enemyCount * 1.25) : Math.floor(enemyCount * 1.25);
      this.player.ammo = Math.min(this.player.maxAmmo, this.player.ammo + ammoBonus);
      
      utils.log(`Wave ${this.wave}: Added ${ammoBonus} ammo based on ${enemyCount} enemies`);
    }
    
    // Hide transition screen
    this.uiElements.waveTransition.classList.add('hidden');
  }
  
  // Game over
  gameOver(reason) {
    this.gameState = 'gameOver';
    this.gameOverReason = reason || 'You were defeated!';
    
    // Show settings button on game over screen
    if (typeof window.toggleSettingsButtonVisibility === 'function') {
      window.toggleSettingsButtonVisibility(this.gameState);
    }
    // Add wave bonus in both classic and survival modes
    let waveBonus = 0;
    // In classic mode, only add wave bonus if they completed at least one wave
    if (this.wave > 1) {
      // Wave bonus is (completed waves - 1) * 500 points
      // We subtract 1 because wave 1 doesn't count as a completed wave
      waveBonus = (this.wave - 1) * 500;
      document.getElementById('game-over-wave-bonus-container').style.display = 'block';
      document.getElementById('game-over-wave-bonus').textContent = waveBonus;
      this.score += waveBonus;
    } else {
      document.getElementById('game-over-wave-bonus-container').style.display = 'none';
    }
    
    // Update the waves completed display
    document.getElementById('game-over-waves').textContent = this.wave - 1;
    
    // Check if this is a new high score
    const isNewHighScore = this.score > this.highScore;
    
    // Update high score for the current game mode
    utils.log(`Game over - Current score: ${this.score}, Current high score: ${this.highScore}, Mode: ${this.gameMode}`);
    if (isNewHighScore) {
      this.highScore = this.score;
      // Create a key that combines game mode and chord mode
      const scoreKey = this.chordMode ? `${this.gameMode}_chord` : this.gameMode;
      const saved = utils.saveHighScore(this.highScore, scoreKey);
      utils.log(`High score ${saved ? 'updated' : 'not updated'} to ${this.highScore}`);
      this.uiElements.highScore.textContent = this.highScore;
      
      // Show high score message
      const highScoreMessage = document.getElementById('game-over-high-score-message');
      if (highScoreMessage) {
        highScoreMessage.classList.remove('hidden');
      }
    } else {
      utils.log('Score not high enough to update high score');
      // Hide high score message
      const highScoreMessage = document.getElementById('game-over-high-score-message');
      if (highScoreMessage) {
        highScoreMessage.classList.add('hidden');
      }
    }
    
    // Update UI
    this.uiElements.finalScore.textContent = this.score;
    
    // Display game over reason
    if (!this.gameOverReason) {
      this.gameOverReason = 'You were defeated!';
    }
    document.getElementById('game-over-reason').textContent = this.gameOverReason;
    
    this.uiElements.gameOverScreen.classList.remove('hidden');

    // Play sound - special jingle for high score
    const soundController = this.getSoundController();
    if (soundController) {
      soundController.playGameOverSound(isNewHighScore);
    }
  }
  
  // Victory
  victory() {
    this.gameState = 'victory';
    
    // Show settings button on victory screen
    if (typeof window.toggleSettingsButtonVisibility === 'function') {
      window.toggleSettingsButtonVisibility(this.gameState);
    }
    
    // Store the base score before adding bonus
    const baseScore = this.score;
    
    // Add bonus points for leftover ammo
    const ammoBonus = this.player.ammo * 10;
    this.score += ammoBonus;
    
    // Add bonus points for leftover health
    const healthBonus = Math.round(this.health * 10); // 10 points per health point
    this.score += healthBonus;
    
    // Add wave bonus in both classic and survival modes
    let waveBonus = 0;
    // In classic mode, wave bonus is wavesTotal * 500 (all waves completed)
    if (this.gameMode === 'classic') {
      waveBonus = this.wavesTotal * 500;
    } else {
      // In survival mode, wave bonus is current wave * 500
      waveBonus = this.wave * 500;
    }
    
    // Display wave bonus and update score
    document.getElementById('wave-bonus-container').style.display = 'block';
    document.getElementById('wave-bonus').textContent = waveBonus;
    document.getElementById('waves-completed').textContent = this.gameMode === 'survival' ? this.wave : this.wavesTotal;
    this.score += waveBonus;
    
    // Check if this is a new high score
    const isNewHighScore = this.score > this.highScore;
    
    // Update high score for the current game mode
    utils.log(`Victory - Current score: ${this.score}, Current high score: ${this.highScore}, Mode: ${this.gameMode}`);
    if (isNewHighScore) {
      this.highScore = this.score;
      // Create a key that combines game mode and chord mode
      const scoreKey = this.chordMode ? `${this.gameMode}_chord` : this.gameMode;
      const saved = utils.saveHighScore(this.highScore, scoreKey);
      utils.log(`High score ${saved ? 'updated' : 'not updated'} to ${this.highScore}`);
      this.uiElements.highScore.textContent = this.highScore;
      
      // Show high score message
      const highScoreMessage = document.getElementById('victory-high-score-message');
      if (highScoreMessage) {
        highScoreMessage.classList.remove('hidden');
      }
    } else {
      utils.log('Score not high enough to update high score');
      // Hide high score message
      const highScoreMessage = document.getElementById('victory-high-score-message');
      if (highScoreMessage) {
        highScoreMessage.classList.add('hidden');
      }
    }
    
    // Update UI
    document.getElementById('base-score').textContent = baseScore;
    document.getElementById('ammo-bonus').textContent = ammoBonus;
    document.getElementById('health-bonus').textContent = healthBonus;
    this.uiElements.victoryScore.textContent = this.score;
    this.uiElements.victoryScreen.classList.remove('hidden');
    
    // Play sound - special jingle for high score
    const soundController = this.getSoundController();
    if (soundController) {
      soundController.playVictorySound(isNewHighScore);
    }
  }
  
  // Handle MIDI note on event
  handleNoteOn(note, velocity) {
    // Only process if in playing state
    if (this.gameState !== 'playing' || !this.player || !this.player.hasAmmo()) return;
    
    // Prevent duplicate processing (some MIDI devices send multiple note on events)
    if (this.lastProcessedNotes[note] && performance.now() - this.lastProcessedNotes[note] < 100) {
      return;
    }
    
    // Record processing time
    this.lastProcessedNotes[note] = performance.now();
    
    // Keep track of active notes for chord matching
    // Chords can be played in any octave - the pitch class (note % 12) is what matters
    if (!this.activeNotes) {
      this.activeNotes = new Set();
    }
    this.activeNotes.add(note);
    
    if (this.chordMode) {
      // CHORD MODE: Charge up laser based on notes played
      
      // Start a new charge if not already active and cooldown has passed
      const now = performance.now();
      if (!this.chordCharge.active && now - this.chordCharge.lastReleaseTime > this.chordCharge.cooldownTime) {
        this.chordCharge.active = true;
        this.chordCharge.startTime = now;
        this.chordCharge.notes = new Set(this.activeNotes);
        this.chordCharge.power = 1; // Start with power level 1
        
        // Play charging sound
        const soundController = this.getSoundController();
        if (soundController) {
          soundController.playLaserChargeSound(1); // Initial power level
        }
      } else if (this.chordCharge.active) {
        // Update the notes in the current charge
        this.activeNotes.forEach(n => this.chordCharge.notes.add(n));
        
        // Update power level based on number of unique notes (max 4)
        const newPower = Math.min(this.chordCharge.notes.size, 4);
        
        // Play charging sound if power level increased
        if (newPower > this.chordCharge.power && newPower < 4) {
          const soundController = this.getSoundController();
          if (soundController) {
            soundController.playLaserChargeSound(newPower); // Pass the new power level
          }
        }
        
        this.chordCharge.power = newPower;
        
        // If we have 4 notes, fire immediately
        if (this.chordCharge.notes.size >= 4) {
          // Find the best matching enemy if any
          let matchingEnemy = this.enemies.find(enemy => {
            return enemy.alive && enemy.matchesNote(note, Array.from(this.chordCharge.notes));
          });
          
          // Fire at the matching enemy or just release if no match
          if (matchingEnemy) {
            this.fireChargedLaser(matchingEnemy);
          } else {
            this.releaseChordCharge();
          }
          return; // Exit early after firing
        }
        
        // For 1-3 notes, check if any enemy matches the current chord
        let matchingEnemy = this.enemies.find(enemy => {
          return enemy.alive && enemy.matchesNote(note, Array.from(this.chordCharge.notes));
        });
        
        if (matchingEnemy) {
          // We have a match! Fire the laser at the matching enemy
          this.fireChargedLaser(matchingEnemy);
        } else {
          // No match yet, check if we've held the chord too long
          if (now - this.chordCharge.startTime > this.chordCharge.maxHoldTime) {
            // Auto-release after holding too long
            this.releaseChordCharge();
          }
        }
      }
    } else {
      // SINGLE NOTE MODE: Fire immediately
      if (!this.player.hasAmmo()) return;

      const matchingEnemy = this.enemies.find(enemy => enemy.alive && enemy.matchesNote(note));
      
      // Calculate target position
      let targetX, targetY;
      let hit = false;
      
      if (matchingEnemy) {
        // Hit enemy
        targetX = matchingEnemy.x + matchingEnemy.width / 2;
        targetY = matchingEnemy.y + matchingEnemy.height / 2;
        hit = true;
      } else {
        // Miss - target position based on note
        targetX = utils.midiNoteToXPosition(note, this.canvas.width, this.midiRange.min, this.midiRange.max);
        targetY = 0;  // Laser shoot to top of screen
      }
  
    
      // Move player to note position first
      this.player.moveTo(targetX);
      
      // Store the necessary data for firing after movement
      const firingData = {
        targetX,
        targetY,
        hit,
        matchingEnemy,
        timestamp: performance.now()
      };
      
      // Set a short timeout to fire after player has moved
      setTimeout(() => {
        // Only proceed if still in playing state
        if (this.gameState !== 'playing') return;
        
        // Create laser from current player position (now that it's moved)
        const laser = new Laser(
          this.player.x + this.player.width / 2,
          this.player.y,
          firingData.targetX,
          firingData.targetY
        );
        
        if (firingData.hit && firingData.matchingEnemy && firingData.matchingEnemy.alive) {
          // Mark enemy as hit
          firingData.matchingEnemy.hit();
          
          // Start death animation
          firingData.matchingEnemy.die();
          
          // Add score
          this.score += this.pointsPerEnemy;
          
          // Play sound
          const soundController = this.getSoundController();
          if (soundController) {
            soundController.playEnemyDestroyedSound();
            
            // Mark laser as hit
            laser.markHit();
            soundController.playLaserHitSound();
          }
        } else if (!firingData.hit) {
          // Play miss sound
          const soundController = this.getSoundController();
          if (soundController) {
            soundController.playLaserMissSound();
          }
        }
        
        // Add laser
        this.lasers.push(laser);

        // AFTER everything, decrement ammo
        this.player.ammo--;
      }, 100); // 100ms delay to allow player to move first
    }}
  
  // Handle MIDI note off event
  handleNoteOff(note) {
    // Clear from processed notes
    delete this.lastProcessedNotes[note];
    
    // Remove from active notes for chord matching
    if (this.activeNotes) {
      this.activeNotes.delete(note);
    }
    
    // For chord mode, check if we need to release the charge
    if (this.chordMode && this.chordCharge.active) {
      // Remove the note from the chord charge
      this.chordCharge.notes.delete(note);
      
      // If no more notes are held, release the charge
      if (this.chordCharge.notes.size === 0) {
        // Stop the charging sound when resetting
        const soundController = this.getSoundController();
        if (soundController) {
          soundController.stopLaserChargeSound();
        }
        this.releaseChordCharge();
      } else {
        // Update power level based on remaining notes
        const newPower = Math.min(this.chordCharge.notes.size, 4);
        if (newPower < this.chordCharge.power) {
          // Power level decreased, update it
          this.chordCharge.power = newPower;
          
          // Update the charge sound to match the new power level
          const soundController = this.getSoundController();
          if (soundController) {
            soundController.playLaserChargeSound(newPower);
          }
        }
      }
    }
  }
  
  // Fire a charged laser at a specific enemy
  fireChargedLaser(matchingEnemy) {
    // Prevent firing if already in the process of firing (happens when pressing notes simultaneously)
    if (this.chordCharge.isFiring) return;
    
    // Set the firing flag to prevent multiple shots
    this.chordCharge.isFiring = true;
    
    // Stop the laser charge sound immediately
    const soundController = this.getSoundController();
    if (soundController) {
      soundController.stopLaserChargeSound(0.01); // Very short fade out
    }
    
    // Calculate target position
    const targetX = matchingEnemy.x + matchingEnemy.width / 2;
    const targetY = matchingEnemy.y + matchingEnemy.height / 2;
    
    // Move player directly to the matching enemy's X position instead of using note averages
    // This ensures the player is always aligned with the target in chord mode
    this.player.moveTo(targetX);
    
    // Store the necessary data for firing after movement
    const firingData = {
      targetX,
      targetY,
      matchingEnemy,
      power: this.chordCharge.power,
      timestamp: performance.now()
    };
    
    // Set a short timeout to fire after player has moved
    setTimeout(() => {
      // Only proceed if still in playing state
      if (this.gameState !== 'playing') return;
      
      // Create laser from current player position with power level
      const laser = new Laser(
        firingData.targetX,  // shoot straight at the enemy
        this.player.y,
        firingData.targetX,
        firingData.targetY,
        firingData.power
      );
      
      if (firingData.matchingEnemy && firingData.matchingEnemy.alive) {
        // Mark enemy as hit
        firingData.matchingEnemy.hit();
        
        // Start death animation
        firingData.matchingEnemy.die();
        
        // Add score (bonus for higher power)
        this.score += this.pointsPerEnemy * firingData.power;
        
        // Play sound
        if (soundController) {
          soundController.playEnemyDestroyedSound();
          
          // Mark laser as hit
          laser.markHit();
          soundController.playLaserHitSound();
          
          // Play explosive sound for high-powered lasers (power >= 3)
          if (firingData.power >= 3) {
            soundController.playLaserExplosiveSound();
          }
        }
      }
      
      // Add laser
      this.lasers.push(laser);
      
      // Reset chord charge
      this.resetChordCharge();

      // AFTER everything, decrement ammo
      this.player.ammo--;
    }, 160); // small delay to allow player to move first before firing
  }
  
  // Release the charged laser without a specific target
  releaseChordCharge() {
    // Prevent firing if already in the process of firing
    if (this.chordCharge.isFiring || !this.chordCharge.active || !this.player.hasAmmo()) return;
    
    // Set the firing flag to prevent multiple shots
    this.chordCharge.isFiring = true;
    
    // Stop the laser charge sound immediately
    const soundController = this.getSoundController();
    if (soundController) {
      soundController.stopLaserChargeSound(0.01); // Very short fade out
    }
    
    // Find a suitable target position based on the notes in the chord
    let targetX;
    let targetY = 0; // Top of screen
    
    // If we have notes in the chord, use the most recently played note to determine position
    if (this.chordCharge.notes.size > 0) {
      // Convert notes to an array and use the last one (most recently played)
      const notes = Array.from(this.chordCharge.notes);
      const lastNote = notes[notes.length - 1];
      
      // Calculate position based on the last note played
      targetX = utils.midiNoteToXPosition(lastNote, this.canvas.width, this.midiRange.min, this.midiRange.max);
      
      // Move player to this position
      this.player.moveTo(targetX);
    } else {
      // Fallback - shoot straight up from current player position
      targetX = this.player.x + this.player.width / 2;
    }
    
    // Store the necessary data for firing
    const firingData = {
      targetX,
      targetY,
      power: this.chordCharge.power,
      timestamp: performance.now()
    };
    
    // Set a short timeout to fire
    setTimeout(() => {
      // Only proceed if still in playing state
      if (this.gameState !== 'playing') return;
      
      // Create laser from current player position with power level
      const laser = new Laser(
        this.player.x + this.player.width / 2,
        this.player.y,
        firingData.targetX,
        firingData.targetY,
        firingData.power
      );
      
      // Play miss sound
      if (soundController) {
        soundController.playLaserMissSound();
        
        // Play explosive sound for high-powered lasers (power >= 3)
        if (firingData.power >= 3) {
          soundController.playLaserExplosiveSound();
        }
      }
      
      // Add laser
      this.lasers.push(laser);
      
      // Reset chord charge
      this.resetChordCharge();

      // Decrement ammo
      this.player.ammo--;
    }, 100);
  }
  
  // Reset the chord charge system
  resetChordCharge() {
    // Stop the charging sound when resetting
    const soundController = this.getSoundController();
    if (soundController) {
      soundController.stopLaserChargeSound();
    }
    
    this.chordCharge.active = false;
    this.chordCharge.lastReleaseTime = performance.now();
    this.chordCharge.notes = new Set();
    this.chordCharge.power = 1; // Reset power level
    this.chordCharge.isFiring = false; // Reset the firing flag
    
    // Reset active notes tracking
    if (this.activeNotes) {
      this.activeNotes.clear();
    } else {
      this.activeNotes = new Set();
    }
    
    // Reset last processed notes to prevent note processing issues
    this.lastProcessedNotes = {};
  }
  
  // Draw chord charge indicator
  drawChordChargeIndicator() {
    if (!this.chordMode || !this.chordCharge.active) return;
    
    const ctx = this.ctx;
    const power = this.chordCharge.power;
    const chargeTime = performance.now() - this.chordCharge.startTime;
    
    // Position at the bottom of the screen, above the player
    const indicatorWidth = 100;
    const indicatorHeight = 10;
    const x = this.player.x + (this.player.width / 2) - (indicatorWidth / 2);
    const y = this.canvas.height - 50;
    
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, indicatorWidth, indicatorHeight);
    
    // Draw charge level
    let chargeColor;
    switch(power) {
      case 1: // Single note - cyan
        chargeColor = 'rgba(0, 255, 255, 0.7)';
        break;
      case 2: // Two notes - green
        chargeColor = 'rgba(0, 255, 100, 0.7)';
        break;
      case 3: // Three notes - yellow/orange
        chargeColor = 'rgba(255, 200, 0, 0.7)';
        break;
      case 4: // Four notes or more - red/purple
        chargeColor = 'rgba(255, 0, 255, 0.7)';
        break;
    }
    
    // Draw charge level
    // this.chordCharge.notes.size 
    ctx.fillStyle = chargeColor;
    ctx.fillRect(x, y, indicatorWidth / 4 * power, indicatorHeight);
    
    // Draw power level indicators
    for (let i = 1; i <= 4; i++) {
      const markerX = x + (indicatorWidth * i / 4);
      ctx.strokeStyle = i <= power ? 'white' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(markerX, y);
      ctx.lineTo(markerX, y + indicatorHeight);
      ctx.stroke();
    }
    
    // Draw border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, indicatorWidth, indicatorHeight);
    
    // Optionally, show notes in chord
    // if (this.chordCharge.notes.size > 0) {
    //   const noteNames = Array.from(this.chordCharge.notes).map(note => utils.midiNoteToName(note));
    //   ctx.fillStyle = 'white';
    //   ctx.font = '12px Arial';
    //   ctx.textAlign = 'center';
    //   ctx.fillText(noteNames.join(' '), x + indicatorWidth / 2, y - 5);
    // }
  }
  
  // Update UI elements
  updateUI() {
    if (this.uiElements.score) this.uiElements.score.textContent = this.score;
    if (this.uiElements.wave) this.uiElements.wave.textContent = this.wave;
    
    // Update game mode display
    if (this.uiElements.gameModeDisplay) {
      const modeName = this.gameMode.charAt(0).toUpperCase() + this.gameMode.slice(1);
      const modeText = this.chordMode ? 'Chord' : 'Single-Note';
      this.uiElements.gameModeDisplay.textContent = `${modeText} Mode (${modeName})`;
    }
    
    // Update ammo bar
    if (this.player) {
      const ammoPercent = (this.player.ammo / this.player.maxAmmo) * 100;
      const ammoBar = document.getElementById('ammo-bar');
      if (ammoBar) {
        ammoBar.style.width = `${ammoPercent}%`;
      }
      
      // Update ammo value text
      const ammoValue = document.getElementById('ammo-value');
      if (ammoValue) {
        ammoValue.textContent = Math.max(0, this.player.ammo);  // Never display negative ammo value
      }
    }
    
    // Update health bar
    if (this.uiElements.healthBar) {
      const healthPercent = (this.health / this.initialHealth) * 100;
      this.uiElements.healthBar.style.width = `${healthPercent}%`;
      
      // Update health value text
      document.getElementById('health-value').textContent = Math.round(this.health);
      
      // Change color based on health
      if (healthPercent > 60) {
        this.uiElements.healthBar.style.backgroundColor = '#006305';
      } else if (healthPercent > 30) {
        this.uiElements.healthBar.style.backgroundColor = '#bdae07';
      } else {
        this.uiElements.healthBar.style.backgroundColor = '#c20600';
      }
    }
  }
  
  // Update FPS counter
  updateFPS(deltaTime) {
    this.frameCount++;
    
    // Update FPS every 500ms
    if (performance.now() - this.lastFpsUpdate > 500) {
      this.fps = Math.round(this.frameCount / ((performance.now() - this.lastFpsUpdate) / 1000));
      this.uiElements.fpsCounter.textContent = `FPS: ${this.fps}`;
      
      this.lastFpsUpdate = performance.now();
      this.frameCount = 0;
    }
  }
  
  // Resize canvas to fill window
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  // Update MIDI range based on the current wave
  updateMidiRangeForWave() {
    // Get the device's MIDI range
    const deviceRange = window.midiController.getMidiRange();
    
    // Calculate the available range for starting notes
    // We need at least 36 semitones (3 octaves) above the starting note
    const availableRange = deviceRange.max - deviceRange.min - 36;
    
    if (availableRange < 0) {
      // If the device range is less than 36 semitones, use the entire range
      this.midiRange = {
        min: deviceRange.min,
        max: deviceRange.max
      };
    } else {
      // Randomly select a starting note within the available range
      // Use the wave number as a seed for variety between waves
      const waveOffset = (this.wave - 1) * 5 % availableRange; // Shift by 5 semitones per wave, wrap around
      const randomOffset = utils.randomInt(0, Math.min(12, availableRange)); // Add some randomness, but not too much
      
      // Combine the wave-based offset with some randomness
      const startingOffset = (waveOffset + randomOffset) % (availableRange + 1);
      
      // Set the MIDI range
      this.midiRange = {
        min: deviceRange.min + startingOffset,
        max: deviceRange.min + startingOffset + 36 // 3 octaves above the min
      };
    }
    
    utils.log(`Wave ${this.wave} MIDI range: ${this.midiRange.min} (${utils.midiNoteToName(this.midiRange.min)}) - ${this.midiRange.max} (${utils.midiNoteToName(this.midiRange.max)})`);
  }
  
  // Update the MIDI device range
  updateMidiDeviceRange() {
    // Get the range from the MIDI controller
    const deviceRange = window.midiController.getMidiRange();
    
    // Set initial MIDI range based on device capabilities
    if (deviceRange.max - deviceRange.min >= 36) {
      // If device has at least 3 octaves, use middle 3 octaves
      const center = Math.floor((deviceRange.min + deviceRange.max) / 2);
      this.midiRange = {
        min: Math.max(deviceRange.min, center - 18),
        max: Math.min(deviceRange.max, center + 18)
      };
    } else {
      // Use the entire device range if it's less than 3 octaves
      this.midiRange = {
        min: deviceRange.min,
        max: deviceRange.max
      };
    }
    
    utils.log(`MIDI device range: ${deviceRange.min} (${utils.midiNoteToName(deviceRange.min)}) - ${deviceRange.max} (${utils.midiNoteToName(deviceRange.max)})`);
  }
  
  // Draw animated background
  drawBackground(deltaTime) {
    // Update background animation time
    this.backgroundTime += deltaTime * 0.0001;
    if (this.backgroundTime > 1) this.backgroundTime -= 1;
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Create gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
    
    // Add color stops using the current background colors
    const top = this.backgroundColors[0];
    const middle = this.backgroundColors[1];
    const bottom = this.backgroundColors[2];
    
    gradient.addColorStop(0, `rgb(${top.r}, ${top.g}, ${top.b})`);
    gradient.addColorStop(0.5, `rgb(${middle.r}, ${middle.g}, ${middle.b})`);
    gradient.addColorStop(1, `rgb(${bottom.r}, ${bottom.g}, ${bottom.b})`);
    
    // Fill background
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
    
    // Draw some 'stars' as simple dots, off-white with reduced opacity
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    
    // Draw fixed stars (don't move)
    for (let i = 0; i < 200; i++) {
      // Use prime numbers to get better distribution
      const x = width * ((i * 13) % 97) / 97;
      const y = height * ((i * 17) % 89) / 89;
      const size = 1 + (i % 3);
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Draw animated stars (twinkle)
    for (let i = 0; i < 100; i++) {
      // Use prime numbers for better distribution
      const x = width * ((i * 23) % 101) / 101;
      const y = height * ((i * 29) % 103) / 103;
      
      // Calculate size with time-based twinkle effect
      const twinkle = 0.5 + 0.5 * Math.sin(this.backgroundTime * 10 + i * 0.3);
      const size = 1.5 + twinkle * 2.5;
      
      // Draw star
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  // Export background as PNG image
  exportBackgroundAsPNG(filename = 'background.png') {    
    // Create a temporary canvas with the same dimensions
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw some 'stars' as simple dots, off-white with reduced opacity
    tempCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';

    // Draw fixed stars (don't move)
    for (let i = 0; i < 200; i++) {
      // Use prime numbers to get better distribution
      const x = tempCanvas.width * ((i * 13) % 97) / 97;
      const y = tempCanvas.height * ((i * 17) % 89) / 89;
      const size = 1 + (i % 3);
      
      tempCtx.beginPath();
      tempCtx.arc(x, y, size, 0, Math.PI * 2);
      tempCtx.fill();
    }
    
    // Draw animated stars (twinkle)
    for (let i = 0; i < 100; i++) {
      // Use prime numbers for better distribution
      const x = tempCanvas.width * ((i * 23) % 101) / 101;
      const y = tempCanvas.height * ((i * 29) % 103) / 103;
      
      // Calculate size with time-based twinkle effect
      const twinkle = 0.5 + 0.5 * Math.sin(this.backgroundTime * 10 + i * 0.3);
      const size = 1.5 + twinkle * 2.5;
      
      // Draw star
      tempCtx.beginPath();
      tempCtx.arc(x, y, size, 0, Math.PI * 2);
      tempCtx.fill();
    }
    
    // Create download link
    const link = document.createElement('a');
    link.download = filename;
    link.href = tempCanvas.toDataURL('image/png');
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    utils.log(`Background exported as ${filename}`);
  }
  
  // Reset game to initial state
  reset() {
    this.gameState = 'title';
    this.wave = WAVE_NUMBER
    this.score = 0;
    this.health = 100;
    this.gameOverReason = '';
    this.lastProcessedNotes = {};
    this.activeNotes = new Set();
    
    // Reset chord charge system
    this.resetChordCharge();
    
    // Reset to the first MIDI range scheme
    this.updateMidiRangeForWave();
    
    // Create player with chord mode parameter
    this.player = new Player(this.canvas.width, this.canvas.height, this.chordMode);

    // DEBUG ONLY: Export player as image
    //this.player.exportAsImage();
    
    // Clear existing objects
    this.enemies = [];
    this.lasers = [];
    
    // Reset background
    this.backgroundColors = this.backgroundSchemes[0];
    
    // Reset MIDI range
    this.updateMidiDeviceRange();
    this.updateMidiRangeForWave();
    
    // Clear any note processing state
    this.lastProcessedNotes = {};
    this.activeNotes = new Set();
    
    // Reset chord mode state
    this.chordMode = false;
    
    // Update UI
    this.updateUI();
    
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  // Return to the main menu
  returnToMenu() {
    utils.log('Returning to main menu');
    
    // Cancel any ongoing animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Play a sound effect when returning to menu
    const soundController = this.getSoundController();
    if (soundController) {
      soundController.playMenuSound();
    }
    
    // Reset the game state
    this.reset();
    
    // Make sure the title screen is shown
    this.uiElements.titleScreen.classList.remove('hidden');
    
    // Refresh high scores in the menu
    if (typeof loadAndDisplayHighScores === 'function') {
      loadAndDisplayHighScores();
    } else if (window.loadAndDisplayHighScores) {
      window.loadAndDisplayHighScores();
    }
    
    // Show settings button on title screen
    if (typeof window.toggleSettingsButtonVisibility === 'function') {
      window.toggleSettingsButtonVisibility(this.gameState);
    }
    
    // Restart the game loop to ensure proper rendering
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }
}

// Export Game class
window.Game = Game;
