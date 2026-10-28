// chat.js — Live Firestore Chat Feed, Anonymous Guest Auth, 3-Tier Access, Admin Overdrive, Auto NPC Engine & Real-Time Presence Sync
import { db } from './firebase-config.js';
import { 
  collection, 
  addDoc, 
  query, 
  limit, 
  onSnapshot,
  doc,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const auth = getAuth();
let chatUnsubscribe = null;
let onlineUsersUnsubscribe = null;
let isSeeding = false;

// ==========================================================================
// 🔑 FIREBASE ANONYMOUS GUEST AUTO-LOGIN & PRESENCE TRACKER
// ==========================================================================

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // If no user is logged in, automatically sign them in as an Anonymous Guest
    try {
      const cred = await signInAnonymously(auth);
      window.currentUser = cred.user;
      console.log("⚡ Auto-signed in as Anonymous Guest:", cred.user.uid);
    } catch (err) {
      console.warn("Anonymous auth failed (Ensure Anonymous Sign-In is enabled in Firebase Console):", err);
    }
  } else {
    window.currentUser = user;
  }

  // Register user or guest in the live online tracking list
  updateUserPresenceStatus('active');
});

// Sync user / guest presence status to Firestore ('users' and 'onlineUsers')
export async function updateUserPresenceStatus(status = 'active') {
  if (!window.currentUser) return;

  const uid = window.currentUser.uid;
  const isAnon = window.currentUser.isAnonymous;
  const displayName = isAnon 
    ? `Guest (${uid.substring(0, 4)})` 
    : (window.userData?.displayName || window.currentUser.displayName || 'Classmate');

  try {
    // 1. Sync profile document
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      uid: uid,
      displayName: displayName,
      isGuest: isAnon,
      status: status,
      lastActive: Date.now()
    }, { merge: true });

    // 2. Sync active online presence document
    const presenceRef = doc(db, 'onlineUsers', uid);
    if (status === 'offline') {
      await deleteDoc(presenceRef);
    } else {
      await setDoc(presenceRef, {
        uid: uid,
        displayName: displayName,
        isGuest: isAnon,
        status: status,
        lastSeen: Date.now()
      }, { merge: true });
    }
  } catch (err) {
    console.warn("User presence status sync warning:", err);
  }
}

// Automatically remove presence or mark offline when tab closes
window.addEventListener('beforeunload', () => {
  if (window.currentUser) {
    updateUserPresenceStatus('offline');
  }
});

// Listen for custom status changes dispatched from chat.html or auto-away timer
window.addEventListener('userStatusChanged', (e) => {
  const newStatus = e.detail?.status || 'active';
  updateUserPresenceStatus(newStatus);
});

// Real-time listener to render all active members and guest profiles live in the sidebar/box
export function initOnlineUsersListener() {
  if (onlineUsersUnsubscribe) {
    onlineUsersUnsubscribe();
    onlineUsersUnsubscribe = null;
  }

  const onlineBox = document.getElementById('online-users-list') || document.getElementById('user-list');
  if (!onlineBox) return;

  const onlineRef = collection(db, 'onlineUsers');

  onlineUsersUnsubscribe = onSnapshot(onlineRef, (snapshot) => {
    const users = [];
    snapshot.forEach((doc) => {
      users.push(doc.data());
    });

    onlineBox.innerHTML = users.map(u => `
      <div class="user-presence-item" style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
        <span style="width:8px; height:8px; border-radius:50%; background:${u.isGuest ? '#a092c0' : '#00f0ff'}; display:inline-block;"></span>
        <span style="font-size:0.88rem; color:${u.isGuest ? '#a092c0' : '#e2daf8'}; font-weight:${u.isGuest ? 'normal' : 'bold'};">
          ${escapeHTML(u.displayName)} ${u.isGuest ? '<span style="font-size:0.7rem; opacity:0.7;">(Guest)</span>' : ''}
        </span>
      </div>
    `).join('');
  }, (err) => {
    console.warn("Online users listener warning:", err);
  });
}

// Helper to check if current user has Admin Overdrive privileges
function isUserAdmin() {
  if (localStorage.getItem('neko_admin_override') === 'true') return true;
  return !!(window.userData && (window.userData.isAdmin || window.userData.role === 'admin' || window.userData.role === 'moderator'));
}

// ==========================================================================
// 🛡️ SAFETY RESTRICTIONS & BOT MODERATOR ENGINE
// ==========================================================================

const PROFANITY_BLOCKLIST = ['badword1', 'badword2', 'slur1', 'toxicword']; 

const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'want to die', 'end my life', 
  'self harm', 'cutting myself', 'hopeless and want to end it'
];

function containsProfanity(text) {
  const lower = text.toLowerCase();
  return PROFANITY_BLOCKLIST.some(word => lower.includes(word));
}

function checkCrisisIntervention(text) {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some(phrase => lower.includes(phrase));
}

const MOD_BOT_NAME = "🛡️ NekoBot (Mod)";
const BOT_MESSAGES = [
  "🤖 [System Notice]: Welcome to Otaku Overload! Keep the vibes cyberpunk, stay respectful, and enjoy the 24/7 Neko FM stream 🌸",
  "⚡ [Reminder]: Need lore updates or character codices? Check out the EchoHeart and Girls of Phantom tabs above!",
  "🛡️ [Auto-Mod]: Friendly reminder to keep chats positive and welcoming for everyone in the lounge. Have fun!"
];

let botMessageIndex = 0;

function triggerBotBroadcast(customText = null) {
  const messagesDisplay = document.getElementById('messages-display') || document.getElementById('chat-feed');
  if (!messagesDisplay) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const textToPost = customText || BOT_MESSAGES[botMessageIndex];
  if (!customText) {
    botMessageIndex = (botMessageIndex + 1) % BOT_MESSAGES.length;
  }

  const botDiv = document.createElement('div');
  botDiv.className = 'chat-msg-item bot-msg-item';
  botDiv.style.cssText = "background: rgba(30, 20, 10, 0.85); padding: 12px 16px; border-radius: 12px; border-left: 4px solid #ffd166; margin-bottom: 8px;";
  botDiv.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
      <span style="font-weight: 900; color: #ffd166; font-size: 0.9rem;">
        ${MOD_BOT_NAME} <span style="background:rgba(255,209,102,0.2); border:1px solid #ffd166; color:#ffd166; font-size:0.7rem; padding:2px 6px; border-radius:10px; margin-left:6px; font-weight:800;">BOT</span>
      </span>
      <span style="font-size: 0.72rem; color: #a092c0;">${timeStr}</span>
    </div>
    <div style="color: #e2daf8; font-size: 0.92rem; line-height: 1.4; word-break: break-word;">
      ${escapeHTML(textToPost)}
    </div>
  `;

  messagesDisplay.appendChild(botDiv);
  messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
}

// Schedule regular broadcasts every 5 minutes
setInterval(() => {
  triggerBotBroadcast();
}, 5 * 60 * 1000);

// Determine active channel collection across all modes including backstage VIP
function getActiveCollectionName() {
  const mode = localStorage.getItem('neko_active_mode') || 'twilight';
  if (mode === 'backstage') return 'backstage_chat_messages';
  if (mode === 'basement') return 'basement_chat_messages';
  return 'chat_messages';
}

function parseTimestampToMillis(rawTimestamp) {
  if (!rawTimestamp) return Date.now();
  if (typeof rawTimestamp.toDate === 'function') return rawTimestamp.toDate().getTime();
  if (typeof rawTimestamp === 'number') return rawTimestamp;
  const parsed = new Date(rawTimestamp).getTime();
  return isNaN(parsed) ? Date.now() : parsed;
}

// ==========================================================================
// 1. REAL-TIME CHAT FEED LISTENER
// ==========================================================================

export function initChatFeed() {
  if (chatUnsubscribe) {
    chatUnsubscribe();
    chatUnsubscribe = null;
  }

  const collectionName = getActiveCollectionName();
  const chatRef = collection(db, collectionName);
  const q = query(chatRef, limit(75));

  const messagesDisplay = document.getElementById('messages-display') || document.getElementById('chat-feed');

  chatUnsubscribe = onSnapshot(q, async (snapshot) => {
    if (!messagesDisplay) return;
      
    const messages = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const timeMs = parseTimestampToMillis(data.timestamp);
      messages.push({ id: doc.id, ...data, _timeMs: timeMs });
    });

    messages.sort((a, b) => a._timeMs - b._timeMs);

    if (messages.length === 0 && !isSeeding) {
      isSeeding = true;
      messagesDisplay.innerHTML = `
        <div style="text-align:center; color:#a092c0; padding:40px; font-style:italic;">
          Initializing Locker 102 Chatter... 🌸
        </div>
      `;
      await seedInitialNPCChatter();
      isSeeding = false;
      return;
    }

    if (messages.length > 0) {
      messagesDisplay.innerHTML = messages.map(msg => renderMessageHTML(msg)).join('');
      setTimeout(() => {
        messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
      }, 50);
    }
  }, (error) => {
    console.warn("Chat feed listener warning:", error);
  });
}

function renderMessageHTML(msg) {
  const isCore4 = ['Nekomi 🎸', 'Sera 🎹', 'Akari Minase 🎤', 'Aoi 🥁'].includes(msg.senderName);
  const isVIPMsg = msg.isVIP;
  const isAdminMsg = msg.isAdmin;
  const isGuestMsg = msg.isGuest;

  let badge = '';
  if (isCore4) {
    badge = `<span style="background:rgba(244,184,196,0.2); border:1px solid #f4b8c4; color:#f4b8c4; font-size:0.7rem; padding:2px 6px; border-radius:10px; margin-left:6px; font-weight:800;">BAND</span>`;
  } else if (isAdminMsg) {
    badge = `<span style="background:rgba(255,77,109,0.25); border:1px solid #ff4d6d; color:#ff4d6d; font-size:0.7rem; padding:2px 6px; border-radius:10px; margin-left:6px; font-weight:800;">MOD</span>`;
  } else if (isVIPMsg) {
    badge = `<span class="vip-badge" style="margin-left:6px;">👑 VIP</span>`;
  } else if (isGuestMsg) {
    badge = `<span style="background:rgba(160,146,192,0.2); border:1px solid #a092c0; color:#a092c0; font-size:0.7rem; padding:2px 6px; border-radius:10px; margin-left:6px; font-weight:800;">GUEST</span>`;
  }

  const borderAccent = isAdminMsg ? '#ff4d6d' : (isVIPMsg ? '#ffd166' : (msg.color || '#a88beb'));

  let formattedTime = 'Just now';
  if (msg._timeMs) {
    formattedTime = new Date(msg._timeMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return `
    <div class="chat-msg-item" style="background: rgba(15,10,30,0.6); padding: 12px 16px; border-radius: 12px; border-left: 4px solid ${borderAccent}; margin-bottom: 8px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
        <span class="${msg.nameGlow || ''}" style="font-weight: 800; color: ${borderAccent}; font-size: 0.9rem;">
          ${escapeHTML(msg.senderName)} ${badge}
        </span>
        <span style="font-size: 0.72rem; color: #a092c0;">
          ${formattedTime}
        </span>
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

// ==========================================================================
// 2. GLOBAL CHANNEL SWITCHER
// ==========================================================================

window.switchChatChannel = async function(mode) {
  if (mode === 'twilight' || mode === 'general') {
    setModeState('twilight');
    return;
  }

  if (isUserAdmin()) {
    setModeState(mode);
    return;
  }

  if (mode === 'basement') {
    if (window.currentUser && !window.currentUser.isAnonymous) {
      if (window.userData && window.userData.ageVerified17) {
        setModeState('basement');
        return;
      }
      if (typeof window.handleContentAccess === "function") {
        const allowed = await window.handleContentAccess('basement');
        if (allowed) {
          setModeState('basement');
          return;
        }
      }
    }
    alert("17+ Age Verification and Google login required to view Basement channel.");
    revertModeSelectorUI();
    return;
  }

  if (mode === 'backstage' || mode === 'vip') {
    if (window.currentUser && window.userData && window.userData.isVIP) {
      setModeState('backstage');
    } else {
      revertModeSelectorUI();
      if (typeof window.showVIPPromoModal === "function") {
        window.showVIPPromoModal();
      } else {
        alert("👑 Active VIP Backstage Pass required to enter this channel!");
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

// ==========================================================================
// 3. MESSAGE SENDER WITH SAFETY FILTERS & GUEST HANDLING
// ==========================================================================

window.handleSendChatMessage = async function(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('chat-input') || document.getElementById('user-input-msg');
  if (!input || !input.value.trim()) return;

  const text = input.value.trim();

  // Secret Admin Overdrive Code
  if (text.toLowerCase() === '/admin') {
    const current = localStorage.getItem('neko_admin_override') === 'true';
    localStorage.setItem('neko_admin_override', (!current).toString());
    alert(current ? "🔴 Admin Overdrive Disabled" : "⚡ Secret Admin Overdrive Activated! Unlocked all channels & posting permissions.");
    input.value = '';
    return;
  }

  // Content Restriction & Safety Enforcement
  if (containsProfanity(text)) {
    alert("🛡️ [Auto-Mod]: Please keep our community lounge clean and avoid prohibited language.");
    return;
  }

  if (checkCrisisIntervention(text)) {
    alert("❤️ [Support Notice]: It sounds like you might be going through a difficult time. Please remember that support is available 24/7. You can connect with compassionate professionals by calling or texting 988 (Suicide & Crisis Lifeline). You are not alone.");
    input.value = '';
    return;
  }

  const currentMode = localStorage.getItem('neko_active_mode') || 'twilight';

  if (!isUserAdmin()) {
    if (currentMode === 'basement' && (!window.userData || !window.userData.ageVerified17)) {
      alert("You must log in and complete 17+ age verification to post in Basement Channel!");
      return;
    }
    if (currentMode === 'backstage' && (!window.userData || !window.userData.isVIP)) {
      alert("👑 Active VIP Backstage pass required to post in this channel!");
      return;
    }
  }

  try {
    const collectionName = getActiveCollectionName();
    const isAdmin = isUserAdmin();
    const isAnon = window.currentUser ? window.currentUser.isAnonymous : true;
    const uid = window.currentUser ? window.currentUser.uid : 'anon';

    const senderDisplayName = isAdmin 
      ? '🛡️ MODERATOR' 
      : (window.userData?.displayName || window.currentUser?.displayName || `Guest (${uid.substring(0, 4)})`);

    await addDoc(collection(db, collectionName), {
      senderName: senderDisplayName,
      text: text,
      color: isAdmin ? '#ff007f' : (window.userData?.nameColor || (window.userData?.isVIP ? '#ffd166' : '#a092c0')),
      nameGlow: isAdmin ? 'glow-pink_glow' : (window.userData?.nameGlow || (window.userData?.isVIP ? 'glow-gold_glow' : '')),
      isVIP: !!window.userData?.isVIP || isAdmin,
      isAdmin: isAdmin,
      isGuest: isAnon,
      isNPC: false,
      timestamp: Date.now()
    });

    updateUserPresenceStatus('active');
    input.value = '';
  } catch (err) {
    console.error("Failed to send chat message:", err);
    alert("Could not post message: " + err.message);
  }
};

window.insertEmoteCode = function(emote) {
  const input = document.getElementById('chat-input') || document.getElementById('user-input-msg');
  if (input) {
    input.value += ` ${emote} `;
    input.focus();
  }
};

// ==========================================================================
// 4. AUTOMATED NPC CHAT SYSTEM (LOCKER NPCS & CORE 4)
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

async function postNPCMessage(character) {
  const quote = character.quotes[Math.floor(Math.random() * character.quotes.length)];

  try {
    const collectionName = getActiveCollectionName();
    await addDoc(collection(db, collectionName), {
      senderName: character.name,
      text: quote,
      color: character.color,
      nameGlow: character.nameGlow || '',
      isNPC: true,
      timestamp: Date.now()
    });
  } catch (err) {
    console.warn("NPC message skipped:", err);
  }
}

async function seedInitialNPCChatter() {
  const seed1 = lockerNPCs[Math.floor(Math.random() * lockerNPCs.length)];
  const seed2 = core4NPCs[Math.floor(Math.random() * core4NPCs.length)];
  await postNPCMessage(seed1);
  await postNPCMessage(seed2);
}

let lastNpcPing = Date.now();
setInterval(() => {
  const now = Date.now();
  if (now - lastNpcPing > 25000) {
    const isCore4Chance = Math.random() < 0.3;
    const character = isCore4Chance 
      ? core4NPCs[Math.floor(Math.random() * core4NPCs.length)]
      : lockerNPCs[Math.floor(Math.random() * lockerNPCs.length)];
    
    postNPCMessage(character);
    lastNpcPing = Date.now();
  }
}, 15000);

document.addEventListener('DOMContentLoaded', () => {
  initChatFeed();
  initOnlineUsersListener();
  
  setTimeout(() => {
    triggerBotBroadcast("⚡ [NekoBot]: A new operative has entered the Sub-Stage relay. Welcome aboard!");
  }, 2000);
});
