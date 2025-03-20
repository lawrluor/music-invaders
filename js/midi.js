/**
 * MIDI controller for the game
 */

class MidiController {
  constructor() {
    // MIDI access and inputs
    this.midiAccess = null;
    this.midiInputs = [];
    this.selectedInput = null;
    
    // MIDI event listeners
    this.noteOnListeners = [];
    this.noteOffListeners = [];
    
    // UI elements
    this.deviceSelect = document.getElementById('midi-device-select');
    this.midiStatus = document.getElementById('midi-status');
    this.midiTestArea = document.getElementById('midi-test-area');
    this.refreshButton = document.getElementById('refresh-midi');
    
    // Bind methods
    this.init = this.init.bind(this);
    this.onMIDISuccess = this.onMIDISuccess.bind(this);
    this.onMIDIFailure = this.onMIDIFailure.bind(this);
    this.updateDeviceList = this.updateDeviceList.bind(this);
    this.onMIDIMessage = this.onMIDIMessage.bind(this);
    this.selectInput = this.selectInput.bind(this);
    this.addNoteOnListener = this.addNoteOnListener.bind(this);
    this.addNoteOffListener = this.addNoteOffListener.bind(this);
    
    // Add event listeners
    this.deviceSelect.addEventListener('change', () => this.selectInput(this.deviceSelect.value));
    this.refreshButton.addEventListener('click', this.updateDeviceList);
  }
  
  // Initialize MIDI access
  async init() {
    if (navigator.requestMIDIAccess) {
      try {
        this.midiAccess = await navigator.requestMIDIAccess();
        this.onMIDISuccess();
      } catch (e) {
        this.onMIDIFailure(e);
      }
    } else {
      this.midiStatus.textContent = 'MIDI Status: Web MIDI API not supported in this browser';
      this.midiStatus.style.color = '#f00';
    }
  }
  
  // Handle successful MIDI access
  onMIDISuccess() {
    console.log('MIDI access granted');
    
    // Update device list when devices are connected/disconnected
    this.midiAccess.onstatechange = this.updateDeviceList;
    
    // Update device list initially
    this.updateDeviceList();
  }
  
  // Handle MIDI access failure
  onMIDIFailure(error) {
    console.error('Failed to get MIDI access', error);
    this.midiStatus.textContent = 'MIDI Status: Failed to access MIDI devices';
    this.midiStatus.style.color = '#f00';
  }
  
  // Update the list of MIDI devices
  updateDeviceList() {
    // Clear current inputs
    this.midiInputs = [];
    
    // Clear select options
    this.deviceSelect.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a MIDI device';
    this.deviceSelect.appendChild(defaultOption);
    
    // Get all inputs
    const inputs = this.midiAccess.inputs.values();
    let count = 0;
    
    // Add each input to the list
    for (let input of inputs) {
      this.midiInputs.push(input);
      
      const option = document.createElement('option');
      option.value = input.id;
      option.textContent = input.name || `MIDI Input ${count + 1}`;
      this.deviceSelect.appendChild(option);
      
      count++;
    }
    
    // Update status
    if (count === 0) {
      this.midiStatus.textContent = 'MIDI Status: No MIDI devices detected';
      this.midiStatus.style.color = '#f00';
    } else {
      this.midiStatus.textContent = `MIDI Status: ${count} device(s) detected`;
      this.midiStatus.style.color = '#0f0';
    }
    
    // Try to select the last used device
    const lastDeviceId = utils.loadLastMidiDevice();
    if (lastDeviceId) {
      this.deviceSelect.value = lastDeviceId;
      this.selectInput(lastDeviceId);
    }
  }
  
  // Select a MIDI input device
  selectInput(inputId) {
    // Disconnect current input if any
    if (this.selectedInput) {
      this.selectedInput.onmidimessage = null;
    }
    
    // Find the selected input
    this.selectedInput = this.midiInputs.find(input => input.id === inputId);
    
    if (this.selectedInput) {
      // Connect to the selected input
      this.selectedInput.onmidimessage = this.onMIDIMessage;
      
      // Update status
      this.midiStatus.textContent = `MIDI Status: Connected to ${this.selectedInput.name}`;
      this.midiStatus.style.color = '#0f0';
      
      // Save selected device
      utils.saveLastMidiDevice(inputId);
      
      console.log(`Selected MIDI input: ${this.selectedInput.name}`);
    } else {
      // Update status
      this.midiStatus.textContent = 'MIDI Status: No device selected';
      this.midiStatus.style.color = '#f00';
    }
  }
  
  // Handle MIDI messages
  onMIDIMessage(message) {
    const data = message.data;
    
    // Note on message (144 = note on, channel 1)
    if ((data[0] & 0xf0) === 0x90 && data[2] > 0) {
      const note = data[1];
      const velocity = data[2];
      
      // Update test area
      this.midiTestArea.textContent = `Note On: ${utils.midiNoteToName(note)} (${note}) - Velocity: ${velocity}`;
      
      // Notify listeners
      this.noteOnListeners.forEach(listener => listener(note, velocity));
    }
    // Note off message (128 = note off, channel 1 or note on with velocity 0)
    else if ((data[0] & 0xf0) === 0x80 || ((data[0] & 0xf0) === 0x90 && data[2] === 0)) {
      const note = data[1];
      
      // Update test area
      this.midiTestArea.textContent = `Note Off: ${utils.midiNoteToName(note)} (${note})`;
      
      // Notify listeners
      this.noteOffListeners.forEach(listener => listener(note));
    }
  }
  
  // Add a note on event listener
  addNoteOnListener(listener) {
    this.noteOnListeners.push(listener);
  }
  
  // Add a note off event listener
  addNoteOffListener(listener) {
    this.noteOffListeners.push(listener);
  }
  
  // Remove a note on event listener
  removeNoteOnListener(listener) {
    const index = this.noteOnListeners.indexOf(listener);
    if (index !== -1) {
      this.noteOnListeners.splice(index, 1);
    }
  }
  
  // Remove a note off event listener
  removeNoteOffListener(listener) {
    const index = this.noteOffListeners.indexOf(listener);
    if (index !== -1) {
      this.noteOffListeners.splice(index, 1);
    }
  }
  
  // Get the range of the selected MIDI device
  getMidiRange() {
    // Default range if no device is selected
    return {
      min: 36, // C2
      max: 96  // C7
    };
  }
}

// Create global MIDI controller
window.midiController = new MidiController();
