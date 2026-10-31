import { auth, db } from './firebase-config.js?v=3';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp 
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
let activeMessageListeners = {};
let presenceUnsubscribe = null;
let activePresenceData = new Map();

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

// Header Controls
document.getElementById('dm-dock-hdr').onclick = (e) => {
  if (e.target.closest('button') || e.target.closest('a')) return;
  dockElement.classList.toggle('collapsed');
};

document.getElementById('dm-dock-min-btn').onclick = (e) => {
  e.stopPropagation();
  dockElement.classList.toggle('collapsed');
};

document.getElementById('dm-dock-close-btn').onclick = (e) => {
  e.stopPropagation();
  dockElement.style.display = 'none';
  targetDmUid = null;
  targetDmName = '';
  sessionStorage.removeItem('active_dm_uid');
  sessionStorage.removeItem('active_dm_name');
  if (dmUnsubscribe) dmUnsubscribe();
};

document.getElementById('dm-dock-send-btn').onclick = sendDirectMessage;
document.getElementById('dm-dock-input-field').onkeydown = (e) => {
  if (e.key === 'Enter') sendDirectMessage();
};

// Navbar Friends Dropdown Toggle setup
document.addEventListener('DOMContentLoaded', () => {
  const friendsBtn = document.getElementById('nav-friends-btn');
  const friendsDropdown = document.getElementById('nav-friends-dropdown');

  if (friendsBtn && friendsDropdown) {
    friendsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      friendsDropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!friendsDropdown.contains(e.target) && e.target !== friendsBtn) {
        friendsDropdown.classList.remove('open');
      }
    });
  }
});

function getChatDocId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

// Global Friend Request Dispatcher using arrayUnion
window.sendFriendRequest = async function(targetUid, targetName) {
  if (!auth.currentUser || !targetUid || targetUid === auth.currentUser.uid) return;

  try {
    const targetRef = doc(db, "users", targetUid);
    const targetSnap = await getDoc(targetRef);

    if (targetSnap.exists()) {
      const targetData = targetSnap.data();
      const existingPending = targetData.pendingRequests || [];
      const existingFriends = targetData.friendsList || [];

      // Don't duplicate if already pending or friends
      if (existingFriends.some(f => f.uid === auth.currentUser.uid) || existingPending.some(r => r.uid === auth.currentUser.uid)) {
        return;
      }

      const myDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const myData = myDoc.exists() ? myDoc.data() : {};

      const reqObj = {
        uid: auth.currentUser.uid,
        name: myData.displayName || auth.currentUser.displayName || "Lounge Member",
        photoURL: myData.photoURL || ''
      };

      await updateDoc(targetRef, {
        pendingRequests: arrayUnion(reqObj)
      });
    }
  } catch (err) {
    console.error("Failed to send friend request:", err);
  }
};

window.requestOrOpenDM = async function(targetUid, targetName) {
  if (!auth.currentUser || !targetUid || targetUid === auth.currentUser.uid) return;

  try {
    const myDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    const myData = myDoc.exists() ? myDoc.data() : {};
    const friendsList = myData.friendsList || [];

    const isFriend = friendsList.some(f => f.uid === targetUid);

    targetDmUid = targetUid;
    targetDmName = targetName;
    sessionStorage.setItem('active_dm_uid', targetUid);
    sessionStorage.setItem('active_dm_name', targetName);

    if (!isFriend) {
      await window.sendFriendRequest(targetUid, targetName);
    }

    document.getElementById('dm-dock-title').innerText = `💬 @${targetName}`;
    dockElement.style.display = 'flex';
    dockElement.classList.remove('collapsed');

    listenForDmMessages();
  } catch (e) {
    console.error("Error opening DM/Request:", e);
  }
};

window.openDirectMessage = function(targetUid, targetName) {
  if (!auth.currentUser || !targetUid) return;

  targetDmUid = targetUid;
  targetDmName = targetName;
  sessionStorage.setItem('active_dm_uid', targetUid);
  sessionStorage.setItem('active_dm_name', targetName);

  document.getElementById('dm-dock-title').innerText = `💬 @${targetName}`;
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

function setupMessageListenersForList(user, userList) {
  userList.forEach(item => {
    const targetUid = item.uid;
    if (!targetUid) return;

    const chatId = getChatDocId(user.uid, targetUid);
    if (activeMessageListeners[chatId]) return;

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
          if (msg.senderUid !== user.uid) {
            window.openDirectMessage(item.uid, item.name || 'Lounge Member');
          }
        }
      });
    });
  });
}

function initFriendsPresenceTracker(friendsList) {
  if (presenceUnsubscribe) presenceUnsubscribe();

  const presenceCol = collection(db, 'presence');
  presenceUnsubscribe = onSnapshot(presenceCol, (snapshot) => {
    const nowMs = Date.now();
    activePresenceData.clear();

    snapshot.forEach(docSnap => {
      const data = docSnap.data({ serverTimestamps: 'estimate' });
      const uid = data.uid || docSnap.id;

      let lastActiveMs = nowMs;
      if (data.lastActive && typeof data.lastActive.toDate === 'function') {
        lastActiveMs = data.lastActive.toDate().getTime();
      }

      if (nowMs - lastActiveMs <= 120000) {
        activePresenceData.set(uid, data.status || 'active');
      }
    });

    renderNavbarFriendsList(friendsList);
  }, (err) => {
    console.warn("Friends presence listener warning:", err);
  });
}

function renderNavbarFriendsList(friendsList = []) {
  const menuContainer = document.getElementById('nav-friends-menu');
  const countBadge = document.getElementById('nav-friends-count');
  const listContainer = document.getElementById('nav-friends-list');

  if (!menuContainer || !countBadge || !listContainer) return;

  // Make sure the menu element is always visible when logged in
  menuContainer.style.display = 'inline-block';
  countBadge.innerText = friendsList.length;

  if (friendsList.length === 0) {
    listContainer.innerHTML = '<div class="friends-empty-msg">No friends connected yet.</div>';
    return;
  }

  listContainer.innerHTML = '';
  friendsList.forEach(friend => {
    const isOnline = activePresenceData.has(friend.uid);
    const status = activePresenceData.get(friend.uid) || 'offline';

    let statusDot = '🔴';
    if (isOnline) {
      if (status === 'active') statusDot = '🟢';
      else if (status === 'away') statusDot = '🟡';
      else if (status === 'busy') statusDot = '🔴';
    } else {
      statusDot = '⚪';
    }

    const row = document.createElement('div');
    row.className = 'friends-item-row';
    row.title = `Click to chat with @${friend.name}`;
    row.onclick = () => {
      const dropdown = document.getElementById('nav-friends-dropdown');
      if (dropdown) dropdown.classList.remove('open');
      window.openDirectMessage(friend.uid, friend.name);
    };

    row.innerHTML = `
      <span>${friend.name}</span>
      <span style="font-size:0.75rem;">${statusDot}</span>
    `;

    listContainer.appendChild(row);
  });
}

// Real-Time Auth Engine
onAuthStateChanged(auth, (user) => {
  if (!user) {
    const menuContainer = document.getElementById('nav-friends-menu');
    if (menuContainer) menuContainer.style.display = 'none';
    if (presenceUnsubscribe) presenceUnsubscribe();
    return;
  }

  const savedUid = sessionStorage.getItem('active_dm_uid');
  const savedName = sessionStorage.getItem('active_dm_name');
  if (savedUid && savedName) {
    window.openDirectMessage(savedUid, savedName);
  }

  onSnapshot(doc(db, "users", user.uid), (snap) => {
    if (!snap.exists()) return;

    const userData = snap.data();
    const pending = userData.pendingRequests || [];
    const currentFriends = userData.friendsList || [];

    initFriendsPresenceTracker(currentFriends);
    setupMessageListenersForList(user, currentFriends);
    setupMessageListenersForList(user, pending);

    if (pending.length > 0 && targetDmUid === null) {
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

        const myName = userData.displayName || user.displayName || "Lounge Member";
        const myRef = doc(db, "users", user.uid);
        const senderRef = doc(db, "users", currentPendingRequest.uid);

        // Build objects for array operations
        const friendObjForMe = { uid: currentPendingRequest.uid, name: currentPendingRequest.name };
        const friendObjForSender = { uid: user.uid, name: myName };

        try {
          // 1. Remove request & Add friend to Receiver (2nd account)
          await updateDoc(myRef, {
            pendingRequests: arrayRemove(currentPendingRequest),
            friendsList: arrayUnion(friendObjForMe)
          });

          // 2. Add friend directly to Sender (Mod account)
          await updateDoc(senderRef, {
            friendsList: arrayUnion(friendObjForSender)
          });

          window.openDirectMessage(currentPendingRequest.uid, currentPendingRequest.name);
        } catch (err) {
          console.error("Error accepting friend request:", err);
        }
      };

      document.getElementById('dock-dismiss-req-btn').onclick = (e) => {
        e.stopPropagation();
        dockElement.style.display = 'none';
      };
    }
  });
});
