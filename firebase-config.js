// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCnJX6OKFrDA2PB-qYywbuv14UBc-1Vfu8",
  authDomain: "otaku-lounge-d9890.firebaseapp.com",
  projectId: "otaku-lounge-d9890",
  storageBucket: "otaku-lounge-d9890.firebasestorage.app",
  messagingSenderId: "411795669078",
  appId: "1:411795669078:web:bc20864cbd31ebdc3f3bf7",
  measurementId: "G-27C7DZYKLZ"
};

// Initialize Firebase Services
const app = initializeApp(firebaseConfig);
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
    await loadOrCreateUserProfile(user);
    
    // Automatically close the login modal if open
    const modal = document.getElementById('neko-gate-modal');
    if (modal) modal.remove();

    if (typeof updatePageUI === "function") updatePageUI();
  } else {
    console.log("User logged out or guest state.");
    window.currentUser = null;
    window.userData = null;
    if (typeof updatePageUI === "function") updatePageUI();
  }
});

// Google Login Function
window.loginWithGoogle = async () => {
  console.log("Attempting Google Sign-In...");
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("Google login successful:", result.user.displayName);
  } catch (error) {
    console.error("Google Sign-In Error Code:", error.code);
    console.error("Google Sign-In Error Message:", error.message);
    
    if (error.code === 'auth/unauthorized-domain') {
      alert("Domain not authorized! Make sure your GitHub Pages link is added to Firebase Auth Settings > Authorized Domains.");
    } else if (error.code === 'auth/popup-blocked') {
      alert("Popup blocked by browser. Please allow popups for this website and try again.");
    } else if (error.code !== 'auth/popup-closed-by-user') {
      alert("Login Error: " + error.message);
    }
  }
};

// Logout Function
window.logoutUser = async () => {
  try {
    await signOut(auth);
    console.log("Signed out successfully.");
  } catch (error) {
    console.error("Logout Error:", error);
  }
};

// Load existing user profile or initialize new member profile in Firestore
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
        orbs: 250,
        isVIP: false,
        equippedFrame: "none",
        equippedGlow: "none",
        inventory: ["none"]
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
