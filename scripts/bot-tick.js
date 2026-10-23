// scripts/bot-tick.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Time-Aware Conversational Pools for Natural 24/7 Activity
const TIME_BASED_CONVERSATIONS = {
  // Morning (5:00 AM - 8:59 AM)
  morning: [
    [
      { author: "Locker_104_Ren", text: "Morning rush! Who left their coffee cup on locker 104's door shelf again? ☕" },
      { author: "Nekomi Aoyama", text: "Guilty... but it was matcha and I was running late for homeroom! 🍵" },
      { author: "Akari Minase", text: "First period bell in 5 minutes! Sprint speed test starting NOW 🏃‍♀️💨" }
    ],
    [
      { author: "Locker_212_Mina", text: "Did anyone actually finish the page 44 math homework? Please tell me I'm not the only one..." },
      { author: "Aoi Mizuhara", text: "Mina, math solutions were posted on the board yesterday. Review during homeroom." },
      { author: "Akari Minase", text: "I filled mine with drum rhythms instead... hope sensei likes 16th notes 🥁" }
    ],
    [
      { author: "Locker_089_Kaito", text: "Who took the last melon pan from the courtyard kiosk? It was gone by 8:10 AM! 🥖" },
      { author: "Nekomi Aoyama", text: "I saw someone with two in their bag near the main stairs..." },
      { author: "Locker_077_Kenji", text: "No comment. Trading one for a matcha Pocky box though." }
    ]
  ],

  // Class Hours (9:00 AM - 11:59 AM)
  class_hours: [
    [
      { author: "Locker_052_Taro", text: "Sensei is writing notes so fast my pencil is literally smoking ✍️🔥" },
      { author: "Sera Hanibara", text: "Psst, tuning synth presets under my desk... 🎧✨" },
      { author: "Aoi Mizuhara", text: "Pay attention in class, everyone." }
    ],
    [
      { author: "Locker_142_Rin", text: "Whoever has hallway pass for B-wing, grab extra sticky notes from library drop!" },
      { author: "Nekomi Aoyama", text: "I'm passing by B-wing right now! Grabbing a stack for the music room 📝" }
    ],
    [
      { author: "Locker_205_Daisuke", text: "3rd period physics lab experiment is bubbling weirdly... is that supposed to turn blue?" },
      { author: "Aoi Mizuhara", text: "Daisuke, step away from the burner and check step 3 on page 88 immediately." }
    ]
  ],

  // Lunchtime (12:00 PM - 1:59 PM)
  lunchtime: [
    [
      { author: "Akari Minase", text: "CAFETERIA PARFAIT LINE IS CLEAR! RUN RUN RUN 🍓✨" },
      { author: "Locker_077_Kenji", text: "Trading half a tuna sando for matcha Pocky at locker 77 table!" },
      { author: "Aoi Mizuhara", text: "Please do not run in the hallways." }
    ],
    [
      { author: "Nekomi Aoyama", text: "Acoustic jam session on the rooftop during lunch today! Bring your sandwiches~ 🎸" },
      { author: "Sera Hanibara", text: "The sunlight on the rooftop is so warm right now~ perfect volume testing weather ✨" },
      { author: "Akari Minase", text: "OMW WITH MY DRUMSTICKS AND A BENTO! 🍱🔥" }
    ],
    [
      { author: "Locker_115_Hana", text: "Rooftop acoustics today are amazing! We can hear the guitar chords down from the courtyard!" },
      { author: "Nekomi Aoyama", text: "Testing out a new chorus melody for Girls of Phantom! Glad it carries well ✨" }
    ]
  ],

  // Afternoon & Club Hours (2:00 PM - 6:59 PM)
  afternoon: [
    [
      { author: "Sera Hanibara", text: "Rooftop amp setup complete! Checking gain levels on input 2 ⚡" },
      { author: "Nekomi Aoyama", text: "Girls of Phantom bridge section sounds so clean with the new distortion pedal! 🎸" },
      { author: "Akari Minase", text: "GIVE ME THAT COUNT-IN! 1... 2... 3... GO! 🥁🔥" }
    ],
    [
      { author: "Locker_205_Daisuke", text: "Echoes of the band practice sound amazing from down in the courtyard 🌅" },
      { author: "Aoi Mizuhara", text: "Keep the bass end balanced so we don't shake the staff room windows." }
    ],
    [
      { author: "Akari Minase", text: "Tempo test at 165 BPM hit perfectly on the third attempt today!! 🥁✨" },
      { author: "Sera Hanibara", text: "Saved the audio stems! Waveform looks super tight~" }
    ]
  ],

  // Late Night & Night Owls (7:00 PM - 4:59 AM)
  night: [
    [
      { author: "Locker_188_Sora", text: "Anyone still up working on chapter 4 math problems? 🌙" },
      { author: "Sera Hanibara", text: "Exporting audio stems for our demo while doing algebra... dual screen focus 🎧" },
      { author: "Nekomi Aoyama", text: "Don't forget to get some sleep before tomorrow's sound check!" }
    ],
    [
      { author: "Locker_089_Kaito", text: "Night owl study grind session... caffeine level at 100% ☕" },
      { author: "Akari Minase", text: "Goodnight everyone! Heavy drum training tomorrow morning!! 🥁💤" },
      { author: "Nekomi Aoyama", text: "Stargazing from my desk window... writing acoustic lyrics for Nekomi & Sera duo ✨" }
    ],
    [
      { author: "Sera Hanibara", text: "Finished mixing the synth pads for Neko FM loop... export complete 🎧✨" },
      { author: "Locker_188_Sora", text: "Sounds incredible! Perfect background audio for late night homework." }
    ]
  ]
};

function getCurrentTimeSlot() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 12) return 'class_hours';
  if (hour >= 12 && hour < 14) return 'lunchtime';
  if (hour >= 14 && hour < 19) return 'afternoon';
  return 'night';
}

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

  // Get current time slot pool
  const timeSlot = getCurrentTimeSlot();
  const activePools = TIME_BASED_CONVERSATIONS[timeSlot] || TIME_BASED_CONVERSATIONS.night;

  // Check the last posted message text across the whole channel
  const lastMsgSnap = await messagesRef.orderBy("timestamp", "desc").limit(1).get();
  let lastText = "";
  if (!lastMsgSnap.empty) {
    lastText = lastMsgSnap.docs[0].data().text || "";
  }

  // Check all messages in each pool so no line in the pool matches the last posted message
  let availablePools = activePools.filter(pool => {
    return !pool.some(msg => msg.text === lastText);
  });
  
  if (availablePools.length === 0) availablePools = activePools;

  // Pick a random conversation from the valid pools
  const conversation = availablePools[Math.floor(Math.random() * availablePools.length)];

  console.log(`[Bot Engine] Slot: ${timeSlot} | Starting chat sequence (${conversation.length} messages)...`);

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
