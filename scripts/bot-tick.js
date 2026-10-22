// scripts/bot-tick.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Conversational Dialogue Exchanges (Multi-Message Bursts)
const CHAT_CONVERSATIONS = [
  // Morning Rush
  [
    { author: "Locker_104_Ren", text: "Morning rush! Who left their coffee cup on locker 104's door shelf again? ☕" },
    { author: "Nekomi Aoyama", text: "Guilty... but it was matcha and I was running late for homeroom! 🍵" },
    { author: "Akari Minase", text: "First period bell in 5 minutes! Sprint speed test starting NOW 🏃‍♀️💨" }
  ],
  // Rooftop Jam Session
  [
    { author: "Sera Hanibara", text: "Rooftop amp setup complete! Checking gain levels on input 2 ⚡" },
    { author: "Nekomi Aoyama", text: "Chorus section on the new track sounds so punchy today! 🎸" },
    { author: "Akari Minase", text: "GIVE ME THAT COUNT-IN! 1... 2... 3... GO! 🥁🔥" }
  ],
  // Cafeteria Chaos
  [
    { author: "Akari Minase", text: "CAFETERIA PARFAIT LINE IS CLEAR! RUN RUN RUN 🍓✨" },
    { author: "Locker_077_Kenji", text: "Trading half a tuna sando for matcha Pocky at locker 77 table!" },
    { author: "Aoi Mizuhara", text: "Please do not run in the hallways." }
  ],
  // Study Group / Late Hours
  [
    { author: "Locker_188_Sora", text: "Anyone still up working on chapter 4 math problems? 🌙" },
    { author: "Sera Hanibara", text: "Exporting audio stems for our demo while doing algebra... dual screen focus 🎧" },
    { author: "Nekomi Aoyama", text: "Don't forget to get some sleep before tomorrow's sound check!" }
  ]
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Cleanup Function: Keep collection trimmed to max 75 messages safely
async function pruneOldMessages() {
  try {
    const messagesRef = db.collection("channels").doc("bots").collection("messages");
    const snapshot = await messagesRef.orderBy("timestamp", "desc").get();

    if (snapshot.size > 75) {
      console.log(`[Cleaner]: Message count is ${snapshot.size}. Trimming to 75...`);
      const docsToDelete = snapshot.docs.slice(75);
      
      const batch = db.batch();
      docsToDelete.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`[Cleaner]: Successfully purged ${docsToDelete.length} old messages.`);
    }
  } catch (err) {
    console.error("[Cleaner Error]: Failed to trim messages:", err);
  }
}

async function runChatBurst() {
  const messagesRef = db.collection("channels").doc("bots").collection("messages");

  // Check the last posted message text across the whole channel
  const lastMsgSnap = await messagesRef.orderBy("timestamp", "desc").limit(1).get();
  let lastText = "";
  if (!lastMsgSnap.empty) {
    lastText = lastMsgSnap.docs[0].data().text || "";
  }

  // Check all messages in each pool so no line in the pool matches the last posted message
  let availablePools = CHAT_CONVERSATIONS.filter(pool => {
    return !pool.some(msg => msg.text === lastText);
  });
  
  if (availablePools.length === 0) availablePools = CHAT_CONVERSATIONS;

  // Pick a random conversation from the valid pools
  const conversation = availablePools[Math.floor(Math.random() * availablePools.length)];

  console.log(`[Bot Engine]: Starting chat sequence (${conversation.length} messages)...`);

  for (const msg of conversation) {
    try {
      await messagesRef.add({
        author: msg.author,
        role: "npc",
        text: msg.text,
        uid: "npc_system",
        timestamp: FieldValue.serverTimestamp()
      });
      console.log(`[Bot Success]: ${msg.author} -> "${msg.text}"`);

      // 3 to 8 second typing gap
      const typingDelay = Math.floor(Math.random() * (8000 - 3000)) + 3000;
      await sleep(typingDelay);
    } catch (error) {
      console.error("[Bot Error]: Failed to post message:", error);
      process.exit(1);
    }
  }

  console.log("[Bot Engine]: Chat sequence finished successfully.");

  // Safely prune down to top 75 messages
  await pruneOldMessages();
}

runChatBurst();
