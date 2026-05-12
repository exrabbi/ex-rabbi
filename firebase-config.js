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
  apiKey:            "PASTE_YOUR_API_KEY_HERE",
  authDomain:        "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "PASTE_YOUR_PROJECT_ID",
  storageBucket:     "PASTE_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId:             "PASTE_YOUR_APP_ID"
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
