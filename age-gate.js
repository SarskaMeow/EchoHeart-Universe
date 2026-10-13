import { db } from './firebase-config.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Call this when user attempts to join a chat room
window.enterChatRoom = async function(requiredAgeTier = 13) {
  if (!window.currentUser || !window.userData) {
    alert("Please log in with Google or Facebook to join the chat!");
    return;
  }

  // Check 13+ Requirement
  if (requiredAgeTier === 13) {
    if (window.userData.ageVerified13) {
      window.location.href = "chat.html"; // Access Granted
    } else {
      showAgeModal(13); // Prompt for 13+ confirmation
    }
  } 
  // Check 17+ Requirement (Future Late-Night / Cavern Chat)
  else if (requiredAgeTier === 17) {
    if (window.userData.ageVerified17) {
      window.location.href = "chat-17.html"; // Access Granted
    } else {
      showAgeModal(17); // Prompt for 17+ confirmation
    }
  }
};

// UI Modal Generator
function showAgeModal(requiredAgeTier) {
  const existing = document.getElementById('age-gate-modal');
  if (existing) existing.remove();

  const isSeventeenPlus = requiredAgeTier === 17;
  const title = isSeventeenPlus ? "🔞 17+ Late-Night Lounge Access" : "💬 13+ Community Chat Terms";
  const bodyText = isSeventeenPlus 
    ? "This lounge contains mature discussions and unmoderated late-night radio streams. You must be at least 17 years old to participate."
    : "To participate in Otaku Lounge community chats, you must confirm that you are at least 13 years of age in accordance with platform terms.";

  const modalHTML = `
    <div id="age-gate-modal" style="position: fixed; inset: 0; background: rgba(13, 11, 24, 0.92); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;">
      <div style="background: #160f2a; border: 2px solid ${isSeventeenPlus ? '#ff4d6d' : '#a88beb'}; border-radius: 20px; padding: 28px; max-width: 420px; width: 100%; text-align: center; color: #fff; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
        <h3 style="margin-top: 0; color: ${isSeventeenPlus ? '#ff4d6d' : '#a88beb'}; font-size: 1.3rem;">${title}</h3>
        <p style="color: #cbb8f6; font-size: 0.9rem; line-height: 1.5; margin-bottom: 20px;">${bodyText}</p>
        
        <div style="background: rgba(30,20,50,0.6); padding: 14px; border-radius: 12px; margin-bottom: 20px; text-align: left;">
          <label style="font-size: 0.85rem; color: #fff; cursor: pointer; display: flex; align-items: center; gap: 10px;">
            <input type="checkbox" id="age-confirm-checkbox" style="width: 20px; height: 20px; accent-color: #a88beb; cursor: pointer;">
            I confirm I am ${requiredAgeTier} years of age or older.
          </label>
        </div>

        <div style="display: flex; gap: 10px; flex-direction: column;">
          <button onclick="confirmUserAge(${requiredAgeTier})" style="background: linear-gradient(135deg, ${isSeventeenPlus ? '#ff4d6d, #a88beb' : '#a88beb, #f4b8c4'}); color: #000; border: none; padding: 12px; border-radius: 12px; font-weight: 800; font-size: 0.95rem; cursor: pointer;">
            Enter Chat
          </button>
          <button onclick="document.getElementById('age-gate-modal').remove()" style="background: transparent; border: 1px solid rgba(168,139,235,0.3); padding: 10px; border-radius: 12px; color: #cbb8f6; font-size: 0.85rem; cursor: pointer;">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

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
      window.userData.ageVerified13 = true;
    } else if (tier === 17) {
      updateObj.ageVerified17 = true;
      window.userData.ageVerified17 = true;
    }

    await updateDoc(userRef, updateObj);

    // Remove modal and grant access
    document.getElementById('age-gate-modal').remove();
    window.location.href = tier === 17 ? "chat-17.html" : "chat.html";
  } catch (err) {
    console.error("Age verification failed to save:", err);
    alert("Error updating profile: " + err.message);
  }
};
