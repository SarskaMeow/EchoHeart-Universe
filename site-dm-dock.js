import { auth, db } from './firebase-config.js?v=3';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, getDoc, setDoc, collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Inject Cyberpunk DM Dock & Request Bar Styles
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
    transition: height 0.25s ease;
  }

  .cyber-dm-dock.collapsed {
    height: 44px;
    overflow: hidden;
  }

  .dm-dock-header {
    background: rgba(18, 9, 36, 0.95);
    border-bottom: 1px solid var(--accent-cyan, #00f0ff);
    padding: 10px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    border-radius: 12px 12px 0 0;
    height: 44px;
    box-sizing: border-box;
  }

  .dm-dock-title {
    font-size: 0.82rem;
    font-weight: 900;
    color: var(--accent-cyan, #00f0ff);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    display: flex;
    align-items: center;
    gap: 6px;
    text-shadow: 0 0 8px var(--accent-cyan, #00f0ff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dm-dock-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .dm-dock-btn {
    background: transparent;
    border: none;
    color: var(--text-muted, #b8a7d4);
    font-size: 0.85rem;
    cursor: pointer;
    font-weight: 800;
    padding: 2px 4px;
    border-radius: 4px;
  }

  .dm-dock-btn:hover { color: #ffffff; }

  .dm-dock-accept-btn {
    background: linear-gradient(135deg, #00f0ff, #9d4edd);
    border: none;
    color: #000000;
    font-size: 0.72rem;
    font-weight: 900;
    padding: 4px 10px;
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(0, 240, 255, 0.6);
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

let targetDmUid = null;
let targetDmName = '';
let dmUnsubscribe = null;
let isInitialFriendLoad = true;
let knownFriendUids = new Set();
let activeMessageListeners = {};

// Construct Dock Element
const dockElement = document.createElement('div');
dockElement.className = 'cyber-dm-dock collapsed';
dockElement.id = 'cyber-dm-dock';
dockElement.innerHTML = `
  <div class="dm-dock-header" id="dm-dock-hdr">
    <span class="dm-dock-title" id="dm-dock-title">💬 Direct Message</span>
    <div class="dm-dock-actions" id="dm-dock-actions-box">
      <button class="dm-dock-btn" id="dm-dock-min-btn" title="Toggle Minimize">➖</button>
      <button class="dm-dock-btn" id="dm-dock-close-btn" title="Dismiss">✕</button>
    </div>
  </div>
  <div class="dm-dock-body" id="dm-dock-messages"></div>
  <div class="dm-dock-input-bar" id="dm-dock-input-bar">
    <input type="text" class="dm-dock-input" id="dm-dock-input-field" placeholder="Transmit direct message..." />
    <button class="dm-dock-send-btn" id="dm-dock-send-btn">SEND</button>
  </div>
`;
document.body.appendChild(dockElement);

// Controls
document.getElementById('dm-dock-hdr').onclick = (e) => {
  if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
  dockElement.classList.toggle('collapsed');
};

document.getElementById('dm-dock-min-btn').onclick = () => dockElement.classList.toggle('collapsed');
document.getElementById('dm-dock-close-btn').onclick = () => {
  dockElement.style.display = 'none';
  targetDmUid = null;
  if (dmUnsubscribe) dmUnsubscribe();
};

document.getElementById('dm-dock-send-btn').onclick = sendDirectMessage;
document.getElementById('dm-dock-input-field').onkeydown = (e) => {
  if (e.key === 'Enter') sendDirectMessage();
};

function getChatDocId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

// FB-Style Check: If friends -> open chat directly. If not friends -> send request first.
window.requestOrOpenDM = async function(targetUid, targetName) {
  if (!auth.currentUser || !targetUid || targetUid === auth.currentUser.uid) return;

  try {
    const myDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    const myData = myDoc.exists() ? myDoc.data() : {};
    const friendsList = myData.friendsList || [];

    const isFriend = friendsList.some(f => f.uid === targetUid);

    if (isFriend) {
      window.openDirectMessage(targetUid, targetName);
    } else {
      await window.sendFriendRequest(targetUid, targetName);
      alert(`🤝 Connection request sent to @${targetName}! Waiting for them to accept.`);
    }
  } catch (e) {
    console.error("Error opening DM/Request:", e);
  }
};

window.openDirectMessage = function(targetUid, targetName) {
  if (!auth.currentUser || !targetUid) return;

  targetDmUid = targetUid;
  targetDmName = targetName;

  document.getElementById('dm-dock-title').innerText = `💬 @${targetName}`;
  document.getElementById('dm-dock-actions-box').innerHTML = `
    <button class="dm-dock-btn" id="dm-dock-min-btn">➖</button>
    <button class="dm-dock-btn" id="dm-dock-close-btn">✕</button>
  `;

  document.getElementById('dm-dock-min-btn').onclick = () => dockElement.classList.toggle('collapsed');
  document.getElementById('dm-dock-close-btn').onclick = () => {
    dockElement.style.display = 'none';
    targetDmUid = null;
    if (dmUnsubscribe) dmUnsubscribe();
  };

  dockElement.style.display = 'flex';
  dockElement.classList.remove('collapsed');

  listenForDmMessages();
};

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

// Function to listen for incoming messages from existing friends
function setupFriendMessageListeners(user, friendsList) {
  friendsList.forEach(friend => {
    const chatId = getChatDocId(user.uid, friend.uid);
    if (activeMessageListeners[chatId]) return; // Already listening

    let isInitialMsgSnapshot = true;
    const q = query(
      collection(db, "direct_messages", chatId, "messages"),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    activeMessageListeners[chatId] = onSnapshot(q, (snapshot) => {
      if (isInitialMsgSnapshot) {
        isInitialMsgSnapshot = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const msg = change.doc.data();
          // If message is from the friend and chat isn't currently open to them
          if (msg.senderUid !== user.uid) {
            window.openDirectMessage(friend.uid, friend.name);
          }
        }
      });
    });
  });
}

// REAL-TIME LISTENER FOR INCOMING REQUESTS & ACCEPTANCE SYNC
onAuthStateChanged(auth, (user) => {
  if (!user) return;

  onSnapshot(doc(db, "users", user.uid), (snap) => {
    if (!snap.exists()) return;

    const userData = snap.data();
    const pending = userData.pendingRequests || [];
    const currentFriends = userData.friendsList || [];

    // Setup background message listeners for all friends
    setupFriendMessageListeners(user, currentFriends);

    // Populate set on initial load without popping up all existing friends
    if (isInitialFriendLoad) {
      currentFriends.forEach(f => knownFriendUids.add(f.uid));
      isInitialFriendLoad = false;
    } else {
      // Auto-open chat dock when a NEW friend is added live
      currentFriends.forEach(f => {
        if (!knownFriendUids.has(f.uid)) {
          knownFriendUids.add(f.uid);
          window.openDirectMessage(f.uid, f.name);
        }
      });
    }

    // Display minimized request tab on receiver's screen
    if (pending.length > 0 && dockElement.classList.contains('collapsed') && targetDmUid === null) {
      const currentPendingRequest = pending[0];

      document.getElementById('dm-dock-title').innerText = `🤝 Request: @${currentPendingRequest.name}`;
      
      const actionsBox = document.getElementById('dm-dock-actions-box');
      actionsBox.innerHTML = `
        <button class="dm-dock-accept-btn" id="dock-accept-req-btn">Accept</button>
        <a href="account.html" class="dm-dock-btn" title="View in Account">👤</a>
        <button class="dm-dock-btn" id="dock-dismiss-req-btn" title="Dismiss">✕</button>
      `;

      dockElement.style.display = 'flex';
      dockElement.classList.add('collapsed');

      document.getElementById('dock-accept-req-btn').onclick = async (e) => {
        e.stopPropagation();
        const updatedPending = pending.filter(r => r.uid !== currentPendingRequest.uid);
        const myName = userData.displayName || user.displayName || "Lounge Member";

        // Prevent Duplicate Friends Bug: Deduplicate by UID
        const existingFriendsMap = new Map();
        currentFriends.forEach(f => existingFriendsMap.set(f.uid, f.name));
        existingFriendsMap.set(currentPendingRequest.uid, currentPendingRequest.name);

        const updatedFriends = Array.from(existingFriendsMap.entries()).map(([uid, name]) => ({ uid, name }));

        // 1. Update receiver's profile
        await setDoc(doc(db, "users", user.uid), { 
          pendingRequests: updatedPending, 
          friendsList: updatedFriends 
        }, { merge: true });

        // 2. Update sender's profile with deduplication
        const senderRef = doc(db, "users", currentPendingRequest.uid);
        const senderSnap = await getDoc(senderRef);
        if (senderSnap.exists()) {
          const senderFriends = senderSnap.data().friendsList || [];
          const senderFriendsMap = new Map();
          senderFriends.forEach(f => senderFriendsMap.set(f.uid, f.name));
          senderFriendsMap.set(user.uid, myName);

          const updatedSenderFriends = Array.from(senderFriendsMap.entries()).map(([uid, name]) => ({ uid, name }));

          await setDoc(senderRef, {
            friendsList: updatedSenderFriends
          }, { merge: true });
        }

        window.openDirectMessage(currentPendingRequest.uid, currentPendingRequest.name);
      };

      document.getElementById('dock-dismiss-req-btn').onclick = (e) => {
        e.stopPropagation();
        dockElement.style.display = 'none';
      };
    }
  });
});
