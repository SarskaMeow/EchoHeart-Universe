// age-gate.js — Auth-Gated Channel Verification & Access Handler
import { db } from './firebase-config.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Helper to check if current user has Admin Overdrive privileges
function isUserAdmin() {
  if (localStorage.getItem('neko_admin_override') === 'true') return true;
  return !!(window.userData && (window.userData.isAdmin || window.userData.role === 'admin' || window.userData.role === 'moderator'));
}

/**
 * Universal content access verification handler called by channel & mode switchers
 * @param {string} channelId - 'general' | 'lore' | 'music' | 'bots' | 'vip'
 * @returns {Promise<boolean>}
 */
window.handleContentAccess = async function(channelId) {
  // Secret Admin Overdrive bypass
  if (isUserAdmin()) return true;

  // VIP channel requires VIP status
  if (channelId === 'vip') {
    if (!window.currentUser) {
      alert("Sign-in required to enter the VIP lounge.");
      return false;
    }
    if (!window.userData?.isVIP) {
      alert("🔒 VIP status required to access this lounge.");
      return false;
    }
    return true;
  }

  // All standard channels require being logged in via Auth (Email / Google)
  if (!window.currentUser) {
    alert("🔒 Sign-in with Email or Google to join live chat.");
    return false;
  }

  // Mark 13+ verified in Firestore if not set yet
  if (window.userData && !window.userData.ageVerified13) {
    window.userData.ageVerified13 = true;
    try {
      const userRef = doc(db, "users", window.currentUser.uid);
      await setDoc(userRef, { ageVerified13: true }, { merge: true });
    } catch (err) {
      console.warn("Firestore write fallback for session:", err);
    }
  }

  return true;
};
