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

console.log("Firebase Analytics initialized");

// Wait for DOM to be fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, attaching Firebase Analytics event listeners");
  
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
        logEvent(analytics, "button_click", {
          button_id: id,
          button_name: name
        });
      });
    }
  });
  
  // Log page view
  logEvent(analytics, 'page_view', {
    page_title: document.title,
    page_location: window.location.href
  });
  console.log("Firebase Analytics: Logged page view");
});