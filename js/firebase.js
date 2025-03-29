// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

console.log("Firebase Analytics initialized:", analytics);


import { logEvent } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";

// Single-Note Classic Button tracking
document.getElementById("single-note-classic-button").addEventListener("click", () => {
  logEvent(analytics, "single-note-classic-button-clicked", {
    button_name: "Single-Note Classic"
  });
});

// Chord Classic Button tracking
document.getElementById("chord-classic-button").addEventListener("click", () => {
  logEvent(analytics, "chord-classic-button-clicked", {
    button_name: "Chord Classic"
  });
});

// Single-Note Survival Button tracking
document.getElementById("single-note-survival-button").addEventListener("click", () => {
  logEvent(analytics, "single-note-survival-button-clicked", {
    button_name: "Single-Note Survival"
  });
});

// Chord Survival
document.getElementById("chord-survival-button").addEventListener("click", () => {
  logEvent(analytics, "chord-survival-button-clicked", {
    button_name: "Chord Survival"
  });
});