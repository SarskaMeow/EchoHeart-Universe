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

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Global User State
window.currentUser = null;
window.userData = null;

// Track auth state automatically across all pages
onAuthStateChanged(auth, async (user) => {
  if (user) {
    window.currentUser = user;
    await loadOrCreateUserProfile(user);
    if (typeof updatePageUI === "function") updatePageUI();
  } else {
    window.currentUser = null;
    window.userData = null;
    if (typeof updatePageUI === "function") updatePageUI();
  }
});

// Google Login
window.loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Login Error:", error);
  }
};

// Logout
window.logoutUser = async () => {
  await signOut(auth);
};

async function loadOrCreateUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    window.userData = docSnap.data();
  } else {
    const defaultData = {
      uid: user.uid,
      displayName: user.displayName || "Lounge Member",
      email: user.email,
      photoURL: user.photoURL,
      orbs: 250,
      isVIP: false,
      equippedFrame: "none",
      equippedGlow: "none",
      inventory: ["none"]
    };
    await setDoc(userRef, defaultData);
    window.userData = defaultData;
  }
}
