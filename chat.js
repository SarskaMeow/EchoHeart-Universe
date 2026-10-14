// chat.js — Live Firestore Chat Feed & Core 4 + Locker NPC Chatter Engine
import { db, auth } from './firebase-config.js';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let chatUnsubscribe = null;

// Determine active channel collection across 3 tiers
function getActiveCollectionName() {
  const mode = localStorage.getItem('neko_active_mode') || 'twilight';
  if (mode === 'backstage') return 'backstage_chat_messages';
  if (mode === 'basement') return 'basement_chat_messages';
  return 'chat_messages';
}

// 1. Initialize Real-Time Chat Listener
export function initChatFeed() {
  if (chatUnsubscribe) chatUnsubscribe();

  const collectionName = getActiveCollectionName();
  const chatRef = collection(db, collectionName);
  const q = query(chatRef, orderBy("timestamp", "desc"), limit(75));

  const messagesDisplay = document.getElementById('messages-display');

  chatUnsubscribe = onSnapshot(q, (snapshot) => {
    if (!messagesDisplay) return;
    
    const messages = [];
    snapshot.forEach((doc) => messages.push({ id: doc.id, ...doc.data() }));
    messages.reverse(); // Chronological order

    if (messages.length === 0) {
      messagesDisplay.innerHTML = `<div style="text-align:center; color:#a092c0; padding:40px; font-style:italic;">No messages in this channel yet. Say hi to Prep Room B! 🌸</div>`;
      return;
    }

    messagesDisplay.innerHTML = messages.map(msg => renderMessageHTML(msg)).join('');
    messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
  });
}

function renderMessageHTML(msg) {
  const isCore4 = ['Nekomi 🎸', 'Sera 🎹', 'Akari Minase 🎤', 'Aoi 🥁'].includes(msg.senderName);
  const isVIPMsg = msg.isVIP;

  let badge = '';
  if (isCore4) {
    badge = `<span style="background:rgba(244,184,196,0.2); border:1px solid #f4b8c4; color:#f4b8c4; font-size:0.7rem; padding:2px 6px; border-radius:10px; margin-left:6px; font-weight:800;">BAND</span>`;
  } else if (isVIPMsg) {
    badge = `<span class="vip-badge" style="margin-left:6px;">👑 VIP</span>`;
  }

  const borderAccent = isVIPMsg ? '#ffd166' : (msg.color || '#a88beb');

  return `
    <div class="chat-msg-item" style="background: rgba(15,10,30,0.6); padding: 12px 16px; border-radius: 12px; border-left: 4px solid ${borderAccent}; margin-bottom: 8px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
        <span class="${msg.nameGlow || ''}" style="font-weight: 800; color: ${borderAccent}; font-size: 0.9rem;">
          ${msg.senderName} ${badge}
        </span>
        <span style="font-size: 0.72rem; color: #a092c0;">${msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}</span>
      </div>
      <div style="color: #e2daf8; font-size: 0.92rem; line-height: 1.4; word-break: break-word;">
        ${escapeHTML(msg.text)}
      </div>
    </div>
  `;
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// 2. Global 3-Tier Channel Switcher with Verification & VIP Permission Checks
window.switchChatChannel = async function(mode) {
  if (mode === 'twilight') {
    setModeState('twilight');
    return;
  }

  if (mode === 'basement') {
    if (!window.currentUser) {
      alert("Sign in with Google to enter Basement Mode.");
      revertModeSelectorUI();
      return;
    }

    if (window.userData && window.userData.ageVerified17) {
      setModeState('basement');
      return;
    }

    if (typeof window.handleContentAccess === "function") {
      const allowed = await window.handleContentAccess('basement');
      if (allowed) {
        setModeState('basement');
      } else {
        revertModeSelectorUI();
      }
    } else {
      alert("17+ Age Verification required.");
      revertModeSelectorUI();
    }
    return;
  }

  if (mode === 'backstage') {
    if (!window.currentUser) {
      alert("Sign in with Google to view VIP Backstage status.");
      revertModeSelectorUI();
      return;
    }

    if (window.userData && window.userData.isVIP) {
      setModeState('backstage');
    } else {
      revertModeSelectorUI();
      if (typeof window.showVIPPromoModal === "function") {
        window.showVIPPromoModal();
      } else {
        alert("👑 VIP Backstage Pass required to enter this channel!");
      }
    }
  }
};

function setModeState(mode) {
  localStorage.setItem('neko_active_mode', mode);
  document.body.classList.remove('twilight-mode', 'basement-mode', 'backstage-mode');
  document.body.classList.add(`${mode}-mode`);

  const selector = document.getElementById('mode-selector');
  if (selector) selector.value = mode;

  const tabs = ['twilight', 'basement', 'backstage'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-${t}`);
    if (btn) btn.classList.toggle('active', t === mode);
  });

  initChatFeed();
}

function revertModeSelectorUI() {
  const current = localStorage.getItem('neko_active_mode') || 'twilight';
  const selector = document.getElementById('mode-selector');
  if (selector) selector.value = current;
}

// 3. User Message Sender with Multi-Tier Gate Checks
window.handleSendChatMessage = async function(event) {
  event.preventDefault();
  const input = document.getElementById('chat-input');
  if (!input || !input.value.trim()) return;

  const text = input.value.trim();

  if (!window.currentUser) {
    alert("Please log in with Google to post messages!");
    return;
  }

  const currentMode = localStorage.getItem('neko_active_mode') || 'twilight';

  if (currentMode === 'basement' && (!window.userData || !window.userData.ageVerified17)) {
    alert("You must complete 17+ age verification to post in Basement Channel!");
    return;
  }
  if (currentMode === 'backstage' && (!window.userData || !window.userData.isVIP)) {
    alert("👑 Active VIP Backstage pass required to post in this channel!");
    return;
  }

  try {
    const collectionName = getActiveCollectionName();
    await addDoc(collection(db, collectionName), {
      senderName: window.userData?.displayName || window.currentUser.displayName || 'Classmate',
      text: text,
      color: window.userData?.nameColor || (window.userData?.isVIP ? '#ffd166' : '#a88beb'),
      nameGlow: window.userData?.nameGlow || (window.userData?.isVIP ? 'glow-gold_glow' : ''),
      isVIP: !!window.userData?.isVIP,
      isNPC: false,
      timestamp: serverTimestamp()
    });

    input.value = '';
  } catch (err) {
    console.error("Failed to send chat message:", err);
    alert("Could not post message: " + err.message);
  }
};

window.insertEmoteCode = function(emote) {
  const input = document.getElementById('chat-input');
  if (input) {
    input.value += ` ${emote} `;
    input.focus();
  }
};

// ==========================================================================
// 4. AUTOMATED NPC CHAT SYSTEM (CORE 4 RARE / LOCKER NPCS FREQUENT)
// ==========================================================================

const core4NPCs = [
  {
    name: "Nekomi 🎸",
    color: "#f4b8c4",
    nameGlow: "glow-pink_glow",
    quotes: [
      "Quick break between rehearsals! Prep Room B is sounding great today 🎸",
      "Sera, did you refine those synth stems for the Universe Hub?",
      "Checked the Neko FM setlist votes! You guys have great taste 🌸",
      "Late night cavern jamming... time to tune the lead guitar!",
      "Thanks everyone for tuning into the audio drama broadcast! 🎙️",
      "Gotta get back to practice before Aoi counts us in again!"
    ]
  },
  {
    name: "Sera 🎹",
    color: "#a88beb",
    nameGlow: "",
    quotes: [
      "Just finished mixing the stem files for the Atelier asset downloads 🌌",
      "Don't forget to stream the new Whisper Radio podcast episode!",
      "Adjusting keytar levels... the acoustics in Locker 102 are awesome.",
      "Aoi brought snacks to rehearsal today 🍓",
      "Working on a new synth melody for Girls Phantom Dead!"
    ]
  },
  {
    name: "Akari Minase 🎤",
    color: "#ff4d6d",
    nameGlow: "glow-pink_glow",
    quotes: [
      "Mic check 1-2! Is Locker 102 feeling the energy tonight? 🎤",
      "Finishing up lyrics for our next single in Prep Room B!",
      "Warm tea and vocal warmups before the late night stream.",
      "Hope everyone is having a cozy night in the lounge! 💖"
    ]
  },
  {
    name: "Aoi 🥁",
    color: "#ffd166",
    nameGlow: "glow-gold_glow",
    quotes: [
      "1-2-3-4! Rhythm section keeping the beat tight! 🥁",
      "Just replaced my snare drum head. Ready for full volume!",
      "Who's hanging out in the Basement channel tonight? ⚡",
      "Snack break over, back to the drum kit!"
    ]
  }
];

const lockerNPCs = [
  {
    name: "Classmate #102 🎒",
    color: "#cbb8f6",
    quotes: [
      "Hey everyone! Locker 102 is live tonight!",
      "Anyone listening to Neko FM right now? 📻",
      "Just finished homework, time to chill in the lounge.",
      "Prep Room B audio drama was so good this week!"
    ]
  },
  {
    name: "Locker 088 🎧",
    color: "#f4b8c4",
    quotes: [
      "This J-Rock track on Neko FM is an absolute banger! 🎸",
      "Who else is grabbing stem downloads from the Universe Hub?",
      "Twilight mode colors look so clean tonight 🌸"
    ]
  },
  {
    name: "Locker 204 📚",
    color: "#a88beb",
    quotes: [
      "Reading through the EchoHeart light novel lore archives...",
      "Did the new podcast chapter drop yet?",
      "Sakuraoka High lore runs so deep!"
    ]
  },
  {
    name: "Locker 404 ⚡",
    color: "#ff4d6d",
    quotes: [
      "404: Sleep not found, only J-Pop & J-Rock!",
      "Basement cavern stream goes hard tonight ⚡",
      "Otaku Overload community is top tier!"
    ]
  },
  {
    name: "Locker 013 🌙",
    color: "#e2daf8",
    quotes: [
      "Stargazing while listening to Neko FM radio 🌌",
      "Late night lounge vibes are immaculate.",
      "Send keytar emotes in the chat! 🎹"
    ]
  },
  {
    name: "Locker 319 🎨",
    color: "#ffd166",
    quotes: [
      "Working on custom pixel art sprites in RPG Maker!",
      "The new dual mode toggle transition is super slick.",
      "Neko-Guard keeping the chat cozy as always 🐾"
    ]
  }
];

export async function triggerNPCChatter() {
  // 15% Core 4 (Rare), 85% Locker NPCs (Frequent)
  const roll = Math.floor(Math.random() * 100) + 1;
  const isCore4 = roll <= 15;

  const pool = isCore4 ? core4NPCs : lockerNPCs;
  const character = pool[Math.floor(Math.random() * pool.length)];
  const quote = character.quotes[Math.floor(Math.random() * character.quotes.length)];

  try {
    const collectionName = getActiveCollectionName();
    await addDoc(collection(db, collectionName), {
      senderName: character.name,
      text: quote,
      color: character.color,
      nameGlow: character.nameGlow || '',
      isNPC: true,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to post NPC chatter:", err);
  }
}

// Post an automated NPC message every 3 to 5 minutes
setInterval(() => {
  triggerNPCChatter();
}, Math.floor(Math.random() * 120000) + 180000);

document.addEventListener('DOMContentLoaded', () => {
  initChatFeed();
});
