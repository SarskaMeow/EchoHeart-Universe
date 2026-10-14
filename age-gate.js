// age-gate.js — 3-Tier Mode Verification & Firestore Gate Handler
import { db } from './firebase-config.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let ageGateResolver = null;

// Helper to check if current user has Admin Overdrive privileges
function isUserAdmin() {
  if (localStorage.getItem('neko_admin_override') === 'true') return true;
  return !!(window.userData && (window.userData.isAdmin || window.userData.role === 'admin'));
}

/**
 * Universal content access verification handler called by mode switchers
 * @param {string} mode - 'twilight' | 'basement' | 'backstage'
 * @returns {Promise<boolean>}
 */
window.handleContentAccess = async function(mode) {
  // Twilight mode (13+) is public
  if (mode === 'twilight') return true;

  // Secret Admin Overdrive bypass
  if (isUserAdmin()) return true;

  // Basement mode (17+) requires sign-in and age confirmation
  if (mode === 'basement') {
    if (!window.currentUser) {
      alert("Sign-in required to enter Basement Mode.");
      return false;
    }

    if (window.userData && window.userData.ageVerified17) {
      return true; // Already verified
    }

    // Show verification modal and await user action
    return new Promise((resolve) => {
      ageGateResolver = resolve;
      show17PlusAgeModal();
    });
  }

  // Backstage VIP mode check
  if (mode === 'backstage') {
    if (!window.currentUser) return false;
    return !!(window.userData && window.userData.isVIP);
  }

  return true;
};

// Render 17+ Age Gate Confirmation Modal
function show17PlusAgeModal() {
  const existing = document.getElementById('age-gate-modal');
  if (existing) existing.remove();

  const modalHTML = `
    <div id="age-gate-modal" class="modal-overlay" style="position: fixed; inset: 0; background: rgba(5, 2, 12, 0.92); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;">
      <div style="background: rgba(22, 15, 42, 0.96); border: 2px solid #ff4d6d; border-radius: 20px; padding: 28px; max-width: 420px; width: 100%; text-align: center; color: #fff; box-shadow: 0 12px 40px rgba(255, 77, 109, 0.3);">
        <h3 style="margin-top: 0; color: #ff4d6d; font-size: 1.3rem; font-weight: 800;">⚡ 17+ Basement Channel Access</h3>
        <p style="color: #cbb8f6; font-size: 0.9rem; line-height: 1.5; margin-bottom: 20px;">
          Basement Mode contains late-night stream feeds and mature discussions. Please confirm you meet the 17+ age requirement to enter.
        </p>
        
        <div style="background: rgba(30,20,50,0.6); padding: 14px; border-radius: 12px; margin-bottom: 20px; text-align: left; border: 1px solid rgba(255,77,109,0.3);">
          <label style="font-size: 0.85rem; color: #fff; cursor: pointer; display: flex; align-items: center; gap: 10px; font-weight: 700;">
            <input type="checkbox" id="age-confirm-checkbox" style="width: 20px; height: 20px; accent-color: #ff4d6d; cursor: pointer;">
            I confirm I am 17 years of age or older.
          </label>
        </div>

        <div style="display: flex; gap: 10px; flex-direction: column;">
          <button onclick="confirmUserAge17()" style="background: linear-gradient(135deg, #ff4d6d, #7209b7); color: #fff; border: none; padding: 12px; border-radius: 12px; font-weight: 800; font-size: 0.95rem; cursor: pointer;">
            Confirm & Unlock Basement Mode
          </button>
          <button onclick="cancelAgeGate()" style="background: transparent; border: 1px solid rgba(255,77,109,0.4); padding: 10px; border-radius: 12px; color: #cbb8f6; font-size: 0.85rem; cursor: pointer; font-weight: 700;">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Save confirmation to Firestore (with smooth local session fallback)
window.confirmUserAge17 = async function() {
  const checkbox = document.getElementById('age-confirm-checkbox');
  if (!checkbox || !checkbox.checked) {
    alert("Please check the box to confirm you are at least 17 years old.");
    return;
  }

  // Update local session state immediately so access is never blocked
  if (window.userData) window.userData.ageVerified17 = true;

  try {
    if (window.currentUser) {
      const userRef = doc(db, "users", window.currentUser.uid);
      // Use setDoc with merge: true to avoid missing doc crashes
      await setDoc(userRef, { ageVerified17: true }, { merge: true });
    }
  } catch (err) {
    console.warn("Firestore write restricted; unlocked Basement Mode for active session:", err);
  }

  const modal = document.getElementById('age-gate-modal');
  if (modal) modal.remove();

  if (ageGateResolver) {
    ageGateResolver(true);
    ageGateResolver = null;
  }
};

// Cancel handler
window.cancelAgeGate = function() {
  const modal = document.getElementById('age-gate-modal');
  if (modal) modal.remove();
  if (ageGateResolver) {
    ageGateResolver(false);
    ageGateResolver = null;
  }
};
