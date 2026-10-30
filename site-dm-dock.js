import { auth, db } from './firebase-config.js?v=3';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, setDoc, collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Inject Cyberpunk DM Dock Styles
const dmDockStyles = `
  .cyber-dm-dock {
    position: fixed;
    bottom: 0;
    right: 24px;
    width: 320px;
    height: 420px;
    background: rgba(10, 4, 22, 0.98);
    border: 1.5px solid var(--accent-cyan, #00f0ff);
    border-bottom: none;
    border-radius: 14px 14px 0 0;
    box-shadow: 0 -4px 25px rgba(0, 240, 255, 0.35), 0 0 15px rgba(255, 0, 127, 0.2);
    display: none;
    flex-direction: column;
    z-index: 6000;
    backdrop-filter: blur(16px);
    transition: transform 0.25s ease;
  }

  .cyber-dm-dock.collapsed {
    height: 42px;
  }

  .dm-dock-header {
    background: rgba(18, 9, 36, 0.95);
    border-bottom: 1px solid var(--accent-cyan, #00f0ff);
    padding: 10px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    border-radius: 12px 12px 0 0;
  }

  .dm-dock-title {
    font-size: 0.82rem;
    font-weight: 900;
    color: var(--accent-cyan, #00f0ff);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    display: flex;
    align-items: center;
    gap: 8px;
    text-shadow: 0 0 8px var(--accent-cyan, #00f0ff);
  }

  .dm-dock-actions {
    display: flex;
    gap: 6px;
  }

  .dm-dock-btn {
    background: transparent;
    border: none;
    color: var(--text-muted, #b8a7d4);
    font-size: 0.85rem;
    cursor: pointer;
    font-weight: 800;
    padding: 0 4px;
  }

  .dm-dock-btn:hover {
    color: #ffffff;
  }

  .dm-dock-body {
    flex: 1;
    padding: 10px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
    background: rgba(4, 2, 9, 0.8);
  }

  .dm-msg-bubble {
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 0.85rem;
    max-width: 85%;
    word-break: break-word;
    line-height: 1.4;
  }

  .dm-msg-bubble.incoming {
    align-self: flex-start;
    background: rgba(22, 10, 42, 0.9);
    border: 1px solid rgba(255, 0, 127, 0.4);
    color: #ffffff;
    border-top-left-radius: 2px;
  }

  .dm-msg-bubble.outgoing {
    align-self: flex-end;
    background: linear-gradient(135deg, rgba(255, 0, 127, 0.4), rgba(157, 78, 221, 0.4));
    border: 1px solid var(--accent-pink, #ff007f);
    color: #ffffff;
    border-top-right-radius: 2px;
  }

  .dm-dock-input-bar {
    padding: 8px;
    background: rgba(10, 4, 22, 0.95);
    border-top: 1px solid rgba(0, 240, 255, 0.3);
    display: flex;
    gap: 6px;
  }

  .dm-dock-input {
    flex: 1;
    background: #030108;
    border: 1px solid rgba(255, 0, 127, 0.4);
    border-radius: 8px;
    padding: 8px 10px;
    color: #fff;
    font-size: 0.82rem;
    outline: none;
  }

  .dm-dock-input:focus {
    border-color: var(--accent-cyan, #00f0ff);
  }

  .dm-dock-send-btn {
    background: var(--accent-pink, #ff007f);
    border: none;
    color: #fff;
    padding: 8px 12px;
    border-radius: 8px;
    font-weight: 900;
    font-size: 0.78rem;
    cursor: pointer;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = dmDockStyles;
document.head.appendChild(styleSheet);

// Build Dock HTML Elements Dynamically
let targetDmUid = null;
let targetDmName = '';
let dmUnsubscribe = null;

const dockElement = document.createElement('div');
dockElement.className = 'cyber-dm-dock';
dockElement.id = 'cyber-dm-dock';
dockElement.innerHTML = `
  <div class="dm-dock-header" id="dm-dock-hdr">
    <span class="dm-dock-title" id="dm-dock-title">💬 Direct Message</span>
    <div class="dm-dock-actions">
      <button class="dm-dock-btn" id="dm-dock-min-btn">➖</button>
      <button class="dm-dock-btn" id="dm-dock-close-btn">✕</button>
    </div>
  </div>
  <div class="dm-dock-body" id="dm-dock-messages"></div>
  <div class="dm-dock-input-bar">
    <input type="text" class="dm-dock-input" id="dm-dock-input-field" placeholder="Transmit direct message..." />
    <button class="dm-dock-send-btn" id="dm-dock-send-btn">SEND</button>
  </div>
`;
document.body.appendChild(dockElement);

// Event Listeners for Dock Controls
document.getElementById('dm-dock-min-btn').onclick = () => {
  dockElement.classList.toggle('collapsed');
};

document.getElementById('dm-dock-close-btn').onclick = () => {
  dockElement.style.display = 'none';
  if (dmUnsubscribe) dmUnsubscribe();
};

document.getElementById('dm-dock-send-btn').onclick = sendDirectMessage;
document.getElementById('dm-dock-input-field').onkeydown = (e) => {
  if (e.key === 'Enter') sendDirectMessage();
};

// Global Function to Open Direct Message Seamlessly (No Popups!)
window.openDirectMessage = function(targetUid, targetName) {
  if (!auth.currentUser) return;
  if (!targetUid || targetUid === auth.currentUser.uid) return;

  targetDmUid = targetUid;
  targetDmName = targetName;

  document.getElementById('dm-dock-title').innerText = `💬 @${targetName}`;
  dockElement.style.display = 'flex';
  dockElement.classList.remove('collapsed');

  listenForDmMessages();
};

function getChatDocId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

function listenForDmMessages() {
  if (dmUnsubscribe) dmUnsubscribe();
  if (!auth.currentUser || !targetDmUid) return;

  const chatId = getChatDocId(auth.currentUser.uid, targetDmUid);
  const q = query(
    collection(db, "direct_messages", chatId, "messages"),
    orderBy("timestamp", "asc"),
    limit(50)
  );

  dmUnsubscribe = onSnapshot(q, (snapshot) => {
    const container = document.getElementById('dm-dock-messages');
    container.innerHTML = '';

    snapshot.forEach((docSnap) => {
      const msg = docSnap.data();
      const isSelf = msg.senderUid === auth.currentUser.uid;

      const msgBubble = document.createElement('div');
      msgBubble.className = `dm-msg-bubble ${isSelf ? 'outgoing' : 'incoming'}`;
      msgBubble.innerText = msg.text || '';
      container.appendChild(msgBubble);
    });

    container.scrollTop = container.scrollHeight;
  });
}

async function sendDirectMessage() {
  const input = document.getElementById('dm-dock-input-field');
  const text = input.value.trim();
  if (!text || !auth.currentUser || !targetDmUid) return;

  const chatId = getChatDocId(auth.currentUser.uid, targetDmUid);

  try {
    await addDoc(collection(db, "direct_messages", chatId, "messages"), {
      senderUid: auth.currentUser.uid,
      senderName: auth.currentUser.displayName || "Lounge Member",
      text: text,
      timestamp: serverTimestamp()
    });
    input.value = '';
  } catch (err) {
    console.error("Failed to send direct message:", err);
  }
}
