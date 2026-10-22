// scripts/bot-tick.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Initialize Firebase Admin using the Secret stored in GitHub Actions
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Procedural Time-of-Day Context Pools
const TIME_CONTEXT_POOLS = {
  morning: [
    { author: "Locker_104_Ren", text: "Morning rush! Who left their coffee cup on locker 104's door shelf again? ☕" },
    { author: "Nekomi Aoyama", text: "Guilty... but it was matcha and I was running late for homeroom! 🍵" },
    { author: "Akari Minase", text: "First period bell in 5 minutes! Sprint speed test starting NOW 🏃‍♀️💨" }
  ],
  class_hours: [
    { author: "Sera Hanibara", text: "Psst, listening to synth presets under my desk... 🎧✨" },
    { author: "Locker_142_Rin", text: "Whoever has hallway pass for B-wing, grab extra sticky notes from library drop!" },
    { author: "Aoi Mizuhara", text: "Pay attention in class, everyone." }
  ],
  lunchtime: [
    { author: "Akari Minase", text: "CAFETERIA PARFAIT LINE IS CLEAR! RUN RUN RUN 🍓✨" },
    { author: "Nekomi Aoyama", text: "Acoustic jam session on the rooftop during lunch today! Bring your sandwiches~ 🎸" },
    { author: "Locker_077_Kenji", text: "Trading half a tuna sando for matcha Pocky at locker 77 table!" }
  ],
  afternoon: [
    { author: "Locker_205_Daisuke", text: "Post-lunch 5th period fatigue is real... eyes getting heavy 😴" },
    { author: "Aoi Mizuhara", text: "Reminder: Club activity forms due at the main office before final bell." }
  ],
  club_hours: [
    { author: "Sera Hanibara", text: "Rooftop practice setup complete! Amplifiers powered and ready ⚡" },
    { author: "Akari Minase", text: "DRUM ROLL TIME! Let's get this tempo up to 160 BPM today! 🥁🔥" },
    { author: "Nekomi Aoyama", text: "Girls of Phantom bridge section sounds so clean with the new distortion pedal!" }
  ],
  night: [
    { author: "Locker_188_Sora", text: "Anyone still up doing late homework? Locker 188 group chat is live 🌙" },
    { author: "Nekomi Aoyama", text: "Stargazing from my desk window... writing acoustic lyrics for Nekomi & Sera duo ✨" },
    { author: "Sera Hanibara", text: "Exporting audio stems for our demo! Check Neko FM deck in a bit~ 🎧" }
  ]
};

function getCurrentTimeSlot() {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 12) return 'class_hours';
  if (hour >= 12 && hour < 14) return 'lunchtime';
  if (hour >= 14 && hour < 16) return 'afternoon';
  if (hour >= 16 && hour < 19) return 'club_hours';
  return 'night';
}

async function postBotMessage() {
  const slot = getCurrentTimeSlot();
  const pool = TIME_CONTEXT_POOLS[slot] || TIME_CONTEXT_POOLS.morning;
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  try {
    await db.collection("channels").doc("bots").collection("messages").add({
      author: chosen.author,
      role: "npc",
      text: chosen.text,
      uid: "npc_system",
      timestamp: FieldValue.serverTimestamp()
    });
    console.log(`[Bot Success]: Posted message from ${chosen.author}`);
  } catch (error) {
    console.error("[Bot Error]: Failed to post message:", error);
    process.exit(1);
  }
}

postBotMessage();
