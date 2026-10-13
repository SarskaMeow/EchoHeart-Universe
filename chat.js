/* ==========================================================================
   OTAKU OVERLOAD REAL-TIME CHAT & COSMETICS ENGINE (chat.js)
   ========================================================================== */

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  doc,
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { evaluateMessageSafety, sendNekoGuardNotice } from './moderation.js';

// State Management
let activeChannel = localStorage.getItem('neko_active_mode') || 'twilight'; // 'twilight' (13+) or 'basement' (17+)
let unsubscribeChat = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Listen for Auth changes
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (typeof window.updatePageUI === "function") {
        window.updatePageUI();
      }
      // Start listening to active channel stream
      listenToChannel(activeChannel === 'twilight' ? 'chat_messages' : 'basement_chat_messages');
    } else {
      const display = getDisplayContainer();
      if (display) {
        display.innerHTML = `<div style="text-align: center; color: #a092c0; padding: 30px;">Sign in required to view live community chat streams.</div>`;
      }
    }
  });

  // Enter Key listener for user input box
  const inputEl = getInputElement();
  if (inputEl) {
    inputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        window.handleSendChatMessage(e);
      }
    });
  }
});

/**
 * 1. Dual-Channel Switcher (Twilight 13+ <-> Basement 17+)
 */
window.switchChatChannel = async function(targetChannel) {
  if (targetChannel === activeChannel && unsubscribeChat) return;

  // Age Gate Check for 17+ Basement Channel
  if (targetChannel === 'basement') {
    if (!window.currentUser) {
      alert("Please log in to enter the 17+ Basement Channel.");
      return;
    }

    if (!window.userData || !window.userData.ageVerified17) {
      const confirm17 = confirm("⚡ The Basement Channel is 17+ restricted. Confirm your birth year to unlock access?");
      if (confirm17) {
        try {
          const userRef = doc(db, "users", window.currentUser.uid);
          await updateDoc(userRef, { ageVerified17: true });
          if (window.userData) window.userData.ageVerified17 = true;
        } catch (err) {
          console.error("Age verification update failed:", err);
          alert("Could not update verification status: " + err.message);
          return;
        }
      } else {
        return; // Canceled
      }
    }
  }

  // Update State & UI
  activeChannel = targetChannel;
  localStorage.setItem('neko_active_mode', targetChannel);
  updateTabUI(targetChannel);

  // Switch Real-Time Firestore Stream
  const collectionName = activeChannel === 'twilight' ? 'chat_messages' : 'basement_chat_messages';
  listenToChannel(collectionName);
};

/**
 * 2. Real-Time Firestore Stream Listener
 */
function listenToChannel(collectionName) {
  const displayBox = getDisplayContainer();
  if (!displayBox) return;

  displayBox.innerHTML = `<div style="text-align: center; color: #a092c0; padding: 20px;">Connecting to ${activeChannel.toUpperCase()} stream...</div>`;

  const messagesQuery = query(
    collection(db, collectionName),
    orderBy("timestamp", "asc"),
    limit(75)
  );

  // Unsubscribe from previous listener if active
  if (unsubscribeChat) unsubscribeChat();

  unsubscribeChat = onSnapshot(messagesQuery, (snapshot) => {
    displayBox.innerHTML = '';

    if (snapshot.empty) {
      displayBox.innerHTML = `<div style="text-align: center; color: #a092c0; padding: 30px;">No messages in this channel yet. Say hello!</div>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const msgData = docSnap.data();
      const msgRowHTML = renderMessageRow(msgData);
      displayBox.insertAdjacentHTML('beforeend', msgRowHTML);
    });

    // Auto-scroll to latest message
    displayBox.scrollTop = displayBox.scrollHeight;
  }, (error) => {
    console.error("Firestore listener error:", error);
    displayBox.innerHTML = `<div style="text-align: center; color: #ff4d6d; padding: 20px;">Error loading messages. Check your age permissions.</div>`;
  });
}

/**
 * 3. Render Message Row with Cosmetics & Formatting
 */
function renderMessageRow(msg) {
  const author = escapeHTML(msg.authorName || "Lounge Member");
  const text = parseEmotesAndEscape(msg.text || "");
  const avatarUrl = msg.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.authorUid || 'Lounge'}`;
  const frameClass = msg.authorFrame && msg.authorFrame !== 'none' ? `frame-${msg.authorFrame}` : '';
  const glowClass = msg.authorGlow && msg.authorGlow !== 'none' ? `glow-${msg.authorGlow}` : '';
  
  let formattedTime = "Just now";
  if (msg.timestamp && msg.timestamp.toDate) {
    formattedTime = msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Neko-Guard Bot Styling Highlight
  const isBot = msg.authorUid === 'neko_guard_bot';
  const botContainerStyle = isBot ? 'background: rgba(255, 209, 102, 0.12); border: 1px solid #ffd166; padding: 10px 14px; border-radius: 12px; margin-bottom: 8px;' : '';

  return `
    <div class="chat-msg-row chat-row" style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px; ${botContainerStyle}">
      <div class="msg-avatar-container" style="position: relative; width: 42px; height: 42px; flex-shrink: 0;">
        <img src="${avatarUrl}" class="msg-avatar-img" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; background: #120924;" alt="${author}">
        <div class="msg-avatar-frame ${frameClass}"></div>
      </div>
      <div class="msg-body-wrapper" style="flex: 1;">
        <div class="msg-meta" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
          <span class="msg-author-name ${glowClass}" style="font-weight: 800; font-size: 0.9rem; color: #a88beb;">${author}</span>
          <span class="msg-time" style="font-size: 0.7rem; color: #a092c0;">${formattedTime}</span>
        </div>
        <div class="msg-text-bubble" style="color: #ffffff; font-size: 0.93rem; word-break: break-word; line-height: 1.4;">
          ${text}
        </div>
      </div>
    </div>
  `;
}

/**
 * 4. User Message Posting & Moderation Check
 */
window.handleSendChatMessage = async function(event) {
  if (event) event.preventDefault();

  const inputEl = getInputElement();
  const rawText = inputEl ? inputEl.value.trim() : '';

  if (!rawText) return;
  if (!window.currentUser) {
    alert("You must be logged in to send messages.");
    return;
  }

  const targetCollection = activeChannel === 'twilight' ? 'chat_messages' : 'basement_chat_messages';
  const userDisplayName = window.userData ? (window.userData.displayName || "Lounge Member") : "Lounge Member";

  // Safety & Moderation Evaluation
  const evalResult = evaluateMessageSafety(rawText);

  if (evalResult.status === 'crisis') {
    alert("Notice: We care about your safety. Supportive crisis resources have been posted to chat.");
    await sendNekoGuardNotice(targetCollection, userDisplayName, 'crisis_support');
    inputEl.value = '';
    return;
  }

  if (evalResult.status === 'block') {
    alert("Your message contained restricted language or harassment and could not be sent.");
    await sendNekoGuardNotice(targetCollection, userDisplayName, 'vibe_check');
    inputEl.value = '';
    return;
  }

  // Send Cleaned Message to Firestore
  try {
    await addDoc(collection(db, targetCollection), {
      authorUid: window.currentUser.uid,
      authorName: userDisplayName,
      authorAvatar: (window.userData && window.userData.photoURL) ? window.userData.photoURL : `https://api.dicebear.com/7.x/bottts/svg?seed=${window.currentUser.uid}`,
      authorFrame: (window.userData && window.userData.equippedFrame) ? window.userData.equippedFrame : 'none',
      authorGlow: (window.userData && window.userData.equippedGlow) ? window.userData.equippedGlow : 'none',
      text: evalResult.cleanText,
      timestamp: serverTimestamp()
    });

    inputEl.value = ''; // Reset input field
  } catch (err) {
    console.error("Failed to post chat message:", err);
    alert("Could not send message. Please check your network and age verification permissions.");
  }
};

// Backwards-compatible alias for sendUserChatMessage
window.sendUserChatMessage = window.handleSendChatMessage;

/**
 * 5. Helper Utilities & Emote Parsing
 */
window.insertEmoteCode = function(code) {
  const inputEl = getInputElement();
  if (!inputEl) return;
  inputEl.value += (inputEl.value.length ? ' ' : '') + code + ' ';
  inputEl.focus();
};

window.insertEmote = window.insertEmoteCode;

function getDisplayContainer() {
  return document.getElementById('messages-display') || 
         document.getElementById('chat-stream') || 
         document.getElementById('chat-messages-container');
}

function getInputElement() {
  return document.getElementById('chat-input') || 
         document.getElementById('chat-user-input') || 
         document.getElementById('chat-text');
}

function updateTabUI(channel) {
  const twilightBtn = document.getElementById('tab-twilight');
  const basementBtn = document.getElementById('tab-basement');

  if (twilightBtn && basementBtn) {
    if (channel === 'twilight') {
      twilightBtn.style.background = 'var(--accent-purple)';
      twilightBtn.style.color = '#000';
      basementBtn.style.background = 'rgba(255, 77, 109, 0.2)';
      basementBtn.style.color = '#ff4d6d';
    } else {
      basementBtn.style.background = '#ff4d6d';
      basementBtn.style.color = '#fff';
      twilightBtn.style.background = 'rgba(168, 139, 235, 0.2)';
      twilightBtn.style.color = '#a88beb';
    }
  }
}

function parseEmotesAndEscape(rawText) {
  let safeText = escapeHTML(rawText);

  const EMOTES = {
    ':neko_wave:': 'https://api.iconify.design/fluent-emoji-flat:cat-face.svg',
    ':cat_pog:': 'https://api.iconify.design/fluent-emoji-flat:smiling-cat-with-heart-eyes.svg',
    ':orb_hype:': 'https://api.iconify.design/fluent-emoji-flat:crystal-ball.svg',
    '🎸': 'https://api.iconify.design/fluent-emoji-flat:guitar.svg',
    '🎹': 'https://api.iconify.design/fluent-emoji-flat:musical-keyboard.svg',
    '🥁': 'https://api.iconify.design/fluent-emoji-flat:drum.svg',
    '🌸': 'https://api.iconify.design/fluent-emoji-flat:cherry-blossom.svg',
    '🍓': 'https://api.iconify.design/fluent-emoji-flat:strawberry.svg'
  };

  Object.keys(EMOTES).forEach((code) => {
    const imgTag = `<img src="${EMOTES[code]}" title="${code}" class="chat-custom-emote" style="height:24px; vertical-align:middle; margin:0 2px;" alt="${code}">`;
    safeText = safeText.split(code).join(imgTag);
  });

  return safeText;
}

function escapeHTML(str) {
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}
