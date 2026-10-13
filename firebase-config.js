// firebase-config.js

// 1. Group all ES6 Imports at the top
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js";
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnJX6OKFrDA2PB-qYywbuv14UBc-1Vfu8",
  authDomain: "otaku-lounge-d9890.firebaseapp.com",
  projectId: "otaku-lounge-d9890",
  storageBucket: "otaku-lounge-d9890.firebasestorage.app",
  messagingSenderId: "411795669078",
  appId: "1:411795669078:web:bc20864cbd31ebdc3f3bf7",
  measurementId: "G-27C7DZYKLZ"
};

// 3. Initialize Firebase App
const app = initializeApp(firebaseConfig);

// 4. Enable Fraud Defense / reCAPTCHA Enterprise Bot Shield
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider('6LfOse0tAAAAAIfKhHlTDRbxLaTqY3bH1FHznTTn'),
  isTokenAutoRefreshEnabled: true
});

// 5. Initialize Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// Global User State variables attached to window
window.currentUser = null;
window.userData = null;

// Track auth state automatically across all pages
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Logged in user detected:", user.email);
    window.currentUser = user;

    localStorage.setItem('neko_logged_in', 'true');
    if (typeof userState !== 'undefined') {
      userState.isLoggedIn = true;
    }

    await loadOrCreateUserProfile(user);

    const modal = document.getElementById('neko-gate-modal');
    if (modal) modal.remove();

    if (typeof updatePageUI === "function") updatePageUI();
  } else {
    console.log("User logged out or guest state.");
    window.currentUser = null;
    window.userData = null;

    localStorage.removeItem('neko_logged_in');
    localStorage.setItem('neko_active_mode', 'echoheart'); // Default to EchoHeart Mode

    if (typeof userState !== 'undefined') {
      userState.isLoggedIn = false;
    }

    if (typeof applyThemeMode === "function") {
      applyThemeMode('echoheart');
    }

    if (typeof updatePageUI === "function") updatePageUI();
  }
});

// Google Login Function
window.loginWithGoogle = async () => {
  console.log("Attempting Google Sign-In...");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    console.log("Google login successful:", result.user.displayName);
  } catch (error) {
    console.warn("Popup warning/error code:", error.code);

    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirectError) {
        console.error("Redirect Login Error:", redirectError);
        alert("Sign-in failed: " + redirectError.message);
      }
    } else if (error.code === 'auth/unauthorized-domain') {
      alert("Domain not authorized! Make sure your domain is added to Firebase Auth Settings > Authorized Domains.");
    } else if (error.code !== 'auth/popup-closed-by-user') {
      alert("Login Error: " + error.message);
    }
  }
};

// Logout Function
window.logoutUser = async () => {
  try {
    await signOut(auth);
    console.log("Signed out successfully from Firebase.");

    if (window.location.pathname.includes("account.html")) {
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Logout Error:", error);
  }
};

// Firestore User Profile Handler (Orbs + Age Verification)
async function loadOrCreateUserProfile(user) {
  try {
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      window.userData = docSnap.data();
      console.log("User profile loaded from Firestore:", window.userData);
    } else {
      const defaultData = {
        uid: user.uid,
        displayName: user.displayName || "Lounge Member",
        email: user.email,
        photoURL: user.photoURL || "",
        orbs: 250, // Starting currency balance for cosmetics
        ageVerified13: false, // Core Chat (EchoHeart Mode)
        ageVerified17: false, // Basement Mode / Cavern Chat
        equippedAvatar: "default",
        equippedFrame: "none",
        equippedGlow: "none",
        inventory: ["default_avatar"]
      };
      await setDoc(userRef, defaultData);
      window.userData = defaultData;
      console.log("New profile created in Firestore with 250 Orbs.");
    }
  } catch (err) {
    console.error("Firestore user profile error:", err);
  }
}

// Nav Auth Button Handler
window.openAuthOrAccount = function() {
  if (window.currentUser) {
    window.location.href = "account.html";
  } else {
    if (typeof showAuthModal === "function") {
      showAuthModal("Welcome to Otaku Lounge", "Sign in with Google to earn Orbs, unlock avatar frames, and chat live!");
    } else {
      window.loginWithGoogle();
    }
  }
};

// Automatic Navbar Button UI Update
window.updatePageUI = function() {
  const btn = document.getElementById('nav-auth-btn');
  if (!btn) return;

  if (window.currentUser && window.userData) {
    btn.innerHTML = `👤 Profile (🔮 ${window.userData.orbs || 0})`;
    btn.style.borderColor = '#ffd166';
  } else {
    btn.innerHTML = `🔑 Login`;
    btn.style.borderColor = '#a88beb';
  }
};
