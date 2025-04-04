// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBr6cmDgLfDAEaigKL3lpO6-SGBKuJnVuI",
  authDomain: "music-invaders.firebaseapp.com",
  projectId: "music-invaders",
  storageBucket: "music-invaders.firebasestorage.app",
  messagingSenderId: "1022855122132",
  appId: "1:1022855122132:web:9f21d41871db91ecee7f41",
  measurementId: "G-XJDT9WPZSL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Expose analytics globally for use in other modules
window.firebaseAnalytics = analytics;
window.firebaseLogEvent = logEvent;

utils.log("Firebase Analytics initialized");

// Track screen size
const trackScreenSize = () => {
  // Get screen dimensions
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;

  // Log screen size event
  window.firebaseLogEvent(window.firebaseAnalytics, 'screen_view', {
    screen_width: screenWidth,
    screen_height: screenHeight,
    window_width: windowWidth,
    window_height: windowHeight,
    pixel_ratio: pixelRatio,
    orientation: screenWidth > screenHeight ? 'landscape' : 'portrait',
    aspect_ratio: (windowWidth / windowHeight).toFixed(2)
  });

  utils.log(`Firebase Analytics: Logged screen size - ${windowWidth}x${windowHeight} (${pixelRatio}x)`);
};

// Wait for DOM to be fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Track initial screen size
  trackScreenSize();

  // Track screen size on resize (debounced to avoid excessive logging)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(trackScreenSize, 5000);  // wait until user is completely done resizing
  });

  // Game mode button tracking
  const buttons = {
    "single-note-classic-button": "Single-Note Classic",
    "chord-classic-button": "Chord Classic",
    "single-note-survival-button": "Single-Note Survival",
    "chord-survival-button": "Chord Survival",
    "game-over-menu-button": "Game Over - Menu",
    "game-over-play-again-button": "Game Over - Play Again",
    "victory-menu-button": "Victory - Menu",
    "victory-play-again-button": "Victory - Play Again"
  };

  // Attach event listeners to all buttons
  Object.entries(buttons).forEach(([id, name]) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("click", () => {
        window.firebaseLogEvent(window.firebaseAnalytics, "button_click", {
          button_id: id,
          button_name: name
        });
        utils.log(`Firebase Analytics: Logged button click - ${name}`);
      });
    }
  });

  // Log page view
  window.firebaseLogEvent(window.firebaseAnalytics, 'page_view', {
    page_title: document.title,
    page_location: window.location.href
  });
});