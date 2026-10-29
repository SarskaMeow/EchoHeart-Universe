// 1. Group all ES6 Imports at the top
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js";
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion,
  collection,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// 4. App Check Shield (Disabled during dev/testing to prevent 400 bad request console warnings)
let appCheck;
/* 
try {
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider('6LfOse0tAAAAAIfKhHlTDRbxLaTqY3bH1FHznTTn'),
    isTokenAutoRefreshEnabled: true
  });
} catch (appCheckErr) {
  console.warn("App Check deferred:", appCheckErr.message);
}
*/

// 5. Initialize Auth & Firestore Exports
export const auth = getAuth(app);
export const db = getFirestore(app);
export { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  collection, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
};

// Global User State variables attached to window
window.currentUser = null;
window.userData = null;

// Catch result from mobile redirect auth flows upon returning to page
getRedirectResult(auth)
  .then(async (result) => {
    if (result && result.user) {
      console.log("Redirect login successful:", result.user.displayName || result.user.email);
      window.currentUser = result.user;
      await loadOrCreateUserProfile(result.user);
      if (typeof updatePageUI === "function") updatePageUI();
    }
  })
  .catch((error) => {
    console.error("Error catching redirect result:", error);
  });

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
    localStorage.setItem('neko_active_mode', 'twilight');

    if (typeof userState !== 'undefined') {
      userState.isLoggedIn = false;
    }

    if (typeof applyThemeMode === "function") {
      applyThemeMode('twilight');
    }

    if (typeof updatePageUI === "function") updatePageUI();
  }
});

// EMAIL & PASSWORD SIGN UP FUNCTION
window.signUpWithEmail = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Email account created successfully:", userCredential.user.email);
    
    // Create profile with optional display name
    await loadOrCreateUserProfile(userCredential.user, displayName);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Sign Up Error:", error.code, error.message);
    alert("Sign Up Failed: " + error.message);
    return { success: false, error: error.message };
  }
};

// EMAIL & PASSWORD LOGIN FUNCTION
window.loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Email sign-in successful:", userCredential.user.email);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Email Login Error:", error.code, error.message);
    alert("Login Failed: " + error.message);
    return { success: false, error: error.message };
  }
};

// PASSWORD RESET FUNCTION
window.resetPasswordWithEmail = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent! Please check your inbox and spam folder.");
    return { success: true };
  } catch (error) {
    console.error("Password Reset Error:", error.code, error.message);
    alert("Password Reset Failed: " + error.message);
    return { success: false, error: error.message };
  }
};

// GOOGLE LOGIN FUNCTION
window.loginWithGoogle = async () => {
  console.log("Attempting Google Sign-In...");

  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const isInApp = /FBAN|FBAV|Instagram|Line|Messenger/i.test(ua);
  
  if (isInApp) {
    alert("Google Sign-In isn't supported inside social app browsers. Please open this page in Chrome or Safari.");
    return;
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    try {
      await signInWithRedirect(auth, provider);
    } catch (redirectError) {
      console.error("Redirect Login Error:", redirectError);
      alert("Sign-in failed: " + redirectError.message);
    }
    return;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    console.log("Google login successful:", result.user.displayName);
  } catch (error) {
    console.warn("Popup warning/error code:", error.code);

    if (
      error.code === 'auth/popup-blocked' || 
      error.code === 'auth/cancelled-popup-request' ||
      error.code === 'auth/web-storage-unsupported'
    ) {
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirectError) {
        console.error("Redirect Login Error:", redirectError);
        alert("Sign-in failed: " + redirectError.message);
      }
    } else if (error.code === 'auth/unauthorized-domain') {
      alert("Domain not authorized! Add this domain in Firebase Console > Auth Settings > Authorized Domains.");
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

// Firestore User Profile Handler
async function loadOrCreateUserProfile(user, customDisplayName = null) {
  try {
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      window.userData = docSnap.data();

      if (window.userData.isVIP && window.userData.vipExpiresAt) {
        const now = new Date();
        const expiresAt = window.userData.vipExpiresAt.toDate 
          ? window.userData.vipExpiresAt.toDate() 
          : new Date(window.userData.vipExpiresAt);
          
        if (now > expiresAt) {
          window.userData.isVIP = false;
          console.log("VIP pass has expired.");
        }
      }

      console.log("User profile loaded:", window.userData);
    } else {
      // Generate a dynamic procedural avatar seed using UID/email
      const avatarSeed = user.uid || user.email;
      const generatedAvatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=0f071c,040209`;

      const defaultData = {
        uid: user.uid,
        displayName: customDisplayName || user.displayName || user.email.split('@')[0] || "Lounge Member",
        email: user.email,
        photoURL: user.photoURL || generatedAvatarUrl,
        ageVerified13: true,
        ageVerified17: false,
        isVIP: false,
        vipExpiresAt: null,
        activityPoints: 0,
        equippedAvatar: "generated",
        equippedFrame: "none",
        equippedGlow: "none",
        inventory: ["generated_avatar"]
      };
      await setDoc(userRef, defaultData);
      window.userData = defaultData;
      console.log("New profile created in Firestore with dynamic avatar.");
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
      showAuthModal("Welcome to Otaku Lounge", "Sign in to earn VIP Backstage passes, participate in polls, and chat live!");
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
    const isVIP = window.userData.isVIP;
    btn.innerHTML = `👤 Profile ${isVIP ? '👑 VIP' : ''}`;
    btn.style.borderColor = isVIP ? '#ffd166' : '#a88beb';
  } else {
    btn.innerHTML = `🔑 Login`;
    btn.style.borderColor = '#a88beb';
  }
};
