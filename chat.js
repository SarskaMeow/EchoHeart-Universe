/* ==========================================================================
   24/7 BUSTLING LOCKER ROOM CHAT ENGINE (chat.js)
   ========================================================================== */

// 1. Fan User Profiles
const CHAT_USERS = [
  { name: 'NekoFan_99', avatar: '🌸', color: '#f4b8c4' },
  { name: 'GuitarShredder_X', avatar: '🎸', color: '#a88beb' },
  { name: 'Oakhaven_Ghost', avatar: '👻', color: '#cbb8f6' },
  { name: 'StrawberryEnthusiast', avatar: '🍓', color: '#ff4d6d' },
  { name: 'Aoi_Bass_Stan', avatar: '🎧', color: '#4cc9f0' },
  { name: 'Sera_Keytar_God', avatar: '🎹', color: '#f72585' },
  { name: 'Akari_Overdrive', avatar: '🔥', color: '#ffb703' },
  { name: 'SubterraneanRocker', avatar: '⚡', color: '#7209b7' },
  { name: 'SakuraHigh_Anon', avatar: '🏫', color: '#e2daf8' }
];

// 2. Continuous Message Pool (English, Japanese, Reactions, & Theories)
const MESSAGE_POOL = [
  "AKARI'S GUITAR SOLO WAS INSANE TODAY!! 🔥🎸",
  "Wait did someone actually catch the Parfait Bandit on camera?? 🍓😂",
  "EchoHeart 180 BPM tracks hit so hard late at night",
  "めっちゃカッコいい！ (So cool!) 🌸✨",
  "Sera on keytar duty is iconic honestly",
  "Locker 102 conspiracy theories going wild in thread B lol",
  "Can't wait for Episode 2 podcast update!",
  "Aoi keeping the whole band on schedule as usual 💙",
  "Who's watching from After Dark Basement mode right now? ⚡",
  "Nekomi's vocals are unmatched honestly",
  "GG! 180 BPM overdrive energy!",
  "草 (lol)",
  "Is the rehearsal schedule locked for Friday?",
  "That strawberry shortcake line in the cafeteria was a warzone today",
  "ECHOHEART UNIVERSE SUPREMACY 🌌✨",
  "Who saved extra parfait in the prep room mini-fridge?? 👀",
  "Turn the volume all the way UP!! 🔊🔥"
];

// 3. Render Message into DOM
function appendChatMessage(username, avatar, color, text, isUser = false) {
  const chatContainer = document.getElementById('chat-messages-container');
  if (!chatContainer) return;

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-row ${isUser ? 'user-message' : ''}`;
  msgDiv.style.cssText = `
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: ${isUser ? 'rgba(168, 139, 235, 0.18)' : 'rgba(15, 10, 30, 0.6)'};
    border-left: 3px solid ${color};
    border-radius: 8px;
    animation: fadeIn 0.3s ease;
  `;

  msgDiv.innerHTML = `
    <span style="font-size: 1.2rem;">${avatar}</span>
    <div style="flex-grow: 1;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
        <strong style="color: ${color}; font-size: 0.85rem;">${username} ${isUser ? '⭐ (YOU)' : ''}</strong>
        <span style="font-size: 0.7rem; color: rgba(226, 218, 248, 0.5);">${timeStr}</span>
      </div>
      <div style="font-size: 0.92rem; color: #ffffff; word-break: break-word;">${text}</div>
    </div>
  `;

  chatContainer.appendChild(msgDiv);

  // Auto-scroll to latest message
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 4. Send Real User Message
function sendUserChatMessage() {
  const inputEl = document.getElementById('chat-user-input');
  if (!inputEl) return;

  const text = inputEl.value.trim();
  if (!text) return;

  // Append user message immediately
  appendChatMessage('You', '🎸', '#ffd166', text, true);
  inputEl.value = '';

  // Save to Local Storage history
  saveChatToLocalStorage('You', '🎸', '#ffd166', text, true);
}

// 5. Simulated 24/7 Live Stream Loop
function start247ChatStream() {
  function pushRandomBotMessage() {
    const randomUser = CHAT_USERS[Math.floor(Math.random() * CHAT_USERS.length)];
    const randomMsg = MESSAGE_POOL[Math.floor(Math.random() * MESSAGE_POOL.length)];

    appendChatMessage(randomUser.name, randomUser.avatar, randomUser.color, randomMsg, false);

    // Random delay between 1.8s and 5.5s to mimic natural live chat rhythm
    const nextInterval = Math.floor(Math.random() * 3700) + 1800;
    setTimeout(pushRandomBotMessage, nextInterval);
  }

  pushRandomBotMessage();
}

// 6. LocalStorage Memory Management
function saveChatToLocalStorage(user, avatar, color, text, isUser) {
  const history = JSON.parse(localStorage.getItem('echo_chat_history') || '[]');
  history.push({ user, avatar, color, text, isUser, timestamp: Date.now() });
  if (history.length > 50) history.shift(); // Keep last 50 entries
  localStorage.setItem('echo_chat_history', JSON.stringify(history));
}

// 7. Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Pre-fill history on load
  const history = JSON.parse(localStorage.getItem('echo_chat_history') || '[]');
  if (history.length > 0) {
    history.forEach(msg => appendChatMessage(msg.user, msg.avatar, msg.color, msg.text, msg.isUser));
  } else {
    // Initial welcome seed
    appendChatMessage('NekoBot', '🤖', '#a88beb', 'Welcome to the 24/7 Locker Room Lounge! Radio broadcast chat is active.');
  }

  // Start continuous 24/7 chat chatter
  start247ChatStream();

  // Enter Key listener for user input
  const inputEl = document.getElementById('chat-user-input');
  if (inputEl) {
    inputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendUserChatMessage();
    });
  }
});
