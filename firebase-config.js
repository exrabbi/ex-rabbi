/*
 * ====================================================
 *  EX GLOBAL — Firebase Configuration
 * ====================================================
 *  SETUP STEPS (5 minutes, free):
 *  1. Go to: https://console.firebase.google.com
 *  2. Click "Add project" → Enter project name → Continue
 *  3. Left sidebar: Build → Authentication → Get Started
 *  4. Sign-in method → Google → Enable → Save
 *  5. Project Settings (gear icon) → Your apps → "</>" web
 *  6. Register app → copy the firebaseConfig values below
 *  7. Also set Authorized Domain: exrabbi.github.io
 * ====================================================
 */

const firebaseConfig = {
  apiKey:            "AIzaSyCPSsxifbE92WqEa2VsGdSqaJIRTPkZiLQ",
  authDomain:        "exglobal21.firebaseapp.com",
  projectId:         "exglobal21",
  storageBucket:     "exglobal21.firebasestorage.app",
  messagingSenderId: "461652919348",
  appId:             "1:461652919348:web:08b88b4ebc0bd893d73661",
  measurementId:     "G-1LLGFN395P"
};

// Only initialize if config looks real
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "PASTE_YOUR_API_KEY_HERE") {
  try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase ready ✓");
  } catch (e) {
    console.warn("Firebase init error:", e.message);
  }
}
