import { db } from './firebase-config.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let ageGateResolver = null;

// Universal access check called by Navbar Mode Switcher
window.handleContentAccess = async function(mode) {
  if (mode === 'basement') {
    if (!window.currentUser) {
      return false;
    }

    if (window.userData && window.userData.ageVerified17) {
      return true; // Already verified in Firestore
    }

    // Return a Promise that resolves when user checks box & confirms modal
    return new Promise((resolve) => {
      ageGateResolver = resolve;
      showAgeModal(17);
    });
  }
  return true;
};

// Call this when user attempts to join a chat room directly
window.enterChatRoom = async function(requiredAgeTier = 13) {
  if (!window.currentUser || !window.userData) {
    alert("Please log in with Google to join the chat!");
    return;
  }

  if (requiredAgeTier === 13) {
    if (window.userData.ageVerified13) {
      window.location.href = "chat.html";
    } else {
      showAgeModal(13);
    }
  } else if (requiredAgeTier === 17) {
    if (window.userData.ageVerified17) {
      window.location.href = "chat.html";
    } else {
      showAgeModal(17);
    }
  }
};

// UI Modal Generator
function showAgeModal(requiredAgeTier) {
  const existing = document.getElementById('age-gate-modal');
  if (existing) existing.remove();

  const isSeventeenPlus = requiredAgeTier === 17;
  const title = isSeventeenPlus ? "⚡ 17+ Basement Cavern Access" : "💬 13+ Community Chat Terms";
  const bodyText = isSeventeenPlus 
    ? "This cavern mode contains late-night streams and mature discussions. You must be at least 17 years old to unlock access."
    : "To participate in Otaku Overload community chats, you must confirm that you are at least 13 years of age.";

  const modalHTML = `
    <div id="age-gate-modal" style="position: fixed; inset: 0; background: rgba(5, 2, 12, 0.92); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;">
      <div style="background: rgba(22, 15, 42, 0.96); border: 2px solid ${isSeventeenPlus ? '#ff4d6d' : '#a88beb'}; border-radius: 20px; padding: 28px; max-width: 420px; width: 100%; text-align: center; color: #fff; box-shadow: 0 12px 40px rgba(0,0,0,0.85);">
        <h3 style="margin-top: 0; color: ${isSeventeenPlus ? '#ff4d6d' : '#a88beb'}; font-size: 1.3rem; font-weight: 800;">${title}</h3>
        <p style="color: #cbb8f6; font-size: 0.9rem; line-height: 1.5; margin-bottom: 20px;">${bodyText}</p>
        
        <div style="background: rgba(30,20,50,0.6); padding: 14px; border-radius: 12px; margin-bottom: 20px; text-align: left; border: 1px solid rgba(168,139,235,0.2);">
          <label style="font-size: 0.85rem; color: #fff; cursor: pointer; display: flex; align-items: center; gap: 10px; font-weight: 700;">
            <input type="checkbox" id="age-confirm-checkbox" style="width: 20px; height: 20px; accent-color: ${isSeventeenPlus ? '#ff4d6d' : '#a88beb'}; cursor: pointer;">
            I confirm I am ${requiredAgeTier} years of age or older.
          </label>
        </div>

        <div style="display: flex; gap: 10px; flex-direction: column;">
          <button onclick="confirmUserAge(${requiredAgeTier})" style="background: linear-gradient(135deg, ${isSeventeenPlus ? '#ff4d6d, #7209b7' : '#a88beb, #f4b8c4'}); color: ${isSeventeenPlus ? '#fff' : '#0b0818'}; border: none; padding: 12px; border-radius: 12px; font-weight: 800; font-size: 0.95rem; cursor: pointer;">
            Confirm & Enter
          </button>
          <button onclick="cancelAgeGate()" style="background: transparent; border: 1px solid rgba(168,139,235,0.3); padding: 10px; border-radius: 12px; color: #cbb8f6; font-size: 0.85rem; cursor: pointer; font-weight: 700;">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Cancel handler
window.cancelAgeGate = function() {
  const modal = document.getElementById('age-gate-modal');
  if (modal) modal.remove();
  if (ageGateResolver) {
    ageGateResolver(false);
    ageGateResolver = null;
  }
};

// Save confirmation to Firestore
window.confirmUserAge = async function(tier) {
  const checkbox = document.getElementById('age-confirm-checkbox');
  if (!checkbox || !checkbox.checked) {
    alert(`Please check the box to confirm you are at least ${tier} years old.`);
    return;
  }

  try {
    const userRef = doc(db, "users", window.currentUser.uid);
    const updateObj = {};

    if (tier === 13) {
      updateObj.ageVerified13 = true;
      if (window.userData) window.userData.ageVerified13 = true;
    } else if (tier === 17) {
      updateObj.ageVerified17 = true;
      if (window.userData) window.userData.ageVerified17 = true;
    }

    await updateDoc(userRef, updateObj);

    // Remove modal
    const modal = document.getElementById('age-gate-modal');
    if (modal) modal.remove();

    // Resolve mode switcher promise if active
    if (ageGateResolver) {
      ageGateResolver(true);
      ageGateResolver = null;
    } else {
      window.location.href = "chat.html";
    }
  } catch (err) {
    console.error("Age verification failed to save:", err);
    alert("Error updating profile: " + err.message);
    if (ageGateResolver) {
      ageGateResolver(false);
      ageGateResolver = null;
    }
  }
};
