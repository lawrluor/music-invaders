// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "__FIREBASE_API_KEY__",
  authDomain: "__FIREBASE_AUTH_DOMAIN__",
  projectId: "__FIREBASE_PROJECT_ID__",
  storageBucket: "__FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
  appId: "__FIREBASE_APP_ID__",
  measurementId: "__FIREBASE_MEASUREMENT_ID__"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

utils.log("Firebase Analytics initialized");

// Wait for DOM to be fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {  
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
        utils.log(`Firebase Analytics: Logged button click - ${name}`);
      });
    }
  });
  
  // Log page view
  logEvent(analytics, 'page_view', {
    page_title: document.title,
    page_location: window.location.href
  });
});