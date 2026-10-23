// scripts/bot-tick.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// ==========================================
// PATH 2: DYNAMIC MAD-LIBS VARIABLE BANKS
// ==========================================
const LOCATIONS = [
  "the rooftop bench", 
  "locker 104", 
  "the B-wing stairs", 
  "the courtyard kiosk", 
  "the music room counter", 
  "the library drop box",
  "the locker room hallway",
  "the 2-B homeroom podium",
  "the Neko FM broadcast desk",
  "the courtyard vending machine",
  "the acoustic equipment shelf",
  "the west stairwell landing"
];

const ITEMS = [
  "a purple guitar pick", 
  "a matcha Pocky box", 
  "a synth cable adapter", 
  "a worn lyric notebook", 
  "a 0.5mm lead pack", 
  "a strawberry parfait coupon",
  "a brass key with a cat charm",
  "a silver drum key",
  "a pastel blue sticky note pad",
  "a roll of Gaffer tape",
  "an extra XLR microphone cable",
  "a pair of foam earplugs"
];

const SUBJECTS = [
  "chapter 4 algebra", 
  "3rd period physics lab", 
  "world history notes", 
  "16th note rhythm theory",
  "classical literature review",
  "chemistry lab safety guidelines",
  "acoustic frequency harmonics",
  "the English grammar worksheet"
];

const SNACKS = [
  "a strawberry melon pan",
  "an iced matcha latte",
  "a tuna mayo sandwich",
  "a spicy ramen snack pack",
  "a hot canned milk tea",
  "a chocolate cornet",
  "a tamagoyaki bento box",
  "a peach gel cup"
];

const GEAR = [
  "the vintage overdrive pedal",
  "the portable synth module",
  "the mesh drum practice pad",
  "the acoustic amplifier head",
  "the multi-track DAW controller",
  "the studio condenser mic"
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ==========================================
// PATH 2: EXPANDED DYNAMIC TEMPLATE GENERATORS
// ==========================================
const DYNAMIC_TEMPLATES = {
  morning: [
    // 1. Lost Item Inquiry
    () => {
      const item = getRandom(ITEMS);
      const loc = getRandom(LOCATIONS);
      return [
        { author: "Locker_104_Ren", text: `Has anyone seen ${item}? I think I dropped it near ${loc}! 😅` },
        { author: "Nekomi Aoyama", text: `I passed by ${loc} a few minutes ago, let me check for you!` },
        { author: "Akari Minase", text: `FOUND IT! Leaving it right on top of ${loc} for you! 🏃‍♀️💨` }
      ];
    },
    // 2. Breakfast & Snack Trade
    () => {
      const snack = getRandom(SNACKS);
      const loc = getRandom(LOCATIONS);
      return [
        { author: "Locker_089_Kaito", text: `Just picked up extra ${snack} near ${loc}! Anyone want to trade? 🥐` },
        { author: "Nekomi Aoyama", text: `Ooh! I'll trade you my matcha Pocky box for it!` },
        { author: "Locker_089_Kaito", text: "Deal! See you by the lockers before homeroom bell! ✨" }
      ];
    },
    // 3. Morning Gear Setup
    () => {
      const gear = getRandom(GEAR);
      const loc = getRandom(LOCATIONS);
      return [
        { author: "Sera Hanibara", text: `Early morning test on ${gear} near ${loc}... input levels look clean! 🎧` },
        { author: "Akari Minase", text: "THAT SUB-BASS RESONANCE HIT ALL THE WAY DOWN THE HALLWAY!! 🥁🔥" },
        { author: "Aoi Mizuhara", text: "Please keep test volumes moderate until homeroom starts." }
      ];
    }
  ],

  class_hours: [
    // 1. Academic Help Call
    () => {
      const subject = getRandom(SUBJECTS);
      return [
        { author: "Locker_052_Taro", text: `Is anyone else lost on the ${subject} assignment? ✍️` },
        { author: "Aoi Mizuhara", text: `Review the board examples from yesterday before class ends.` },
        { author: "Sera Hanibara", text: `I saved a summary diagram if anyone needs to glance at it later~` }
      ];
    },
    // 2. Secret Item Swap
    () => {
      const item = getRandom(ITEMS);
      const loc = getRandom(LOCATIONS);
      return [
        { author: "Locker_142_Rin", text: `Leaving ${item} inside the drop slot at ${loc}! 📝` },
        { author: "Nekomi Aoyama", text: `Awesome! Grabbing it right on my way past B-wing!` },
        { author: "Aoi Mizuhara", text: "Please keep hallway pass trips brief during class." }
      ];
    },
    // 3. Classroom Countdown
    () => {
      const snack = getRandom(SNACKS);
      return [
        { author: "Locker_205_Daisuke", text: "10 minutes left in period 4... my mind is entirely on getting ${snack}! 🍱" },
        { author: "Akari Minase", text: "STRETCHING LEGS UNDER DESK FOR MAXIMUM SPEED SPRINT 🏃‍♀️💨" },
        { author: "Aoi Mizuhara", text: "Akari, sit up straight and pay attention." }
      ];
    }
  ],

  lunchtime: [
    // 1. Kiosk & Locker Trade
    () => {
      const item = getRandom(ITEMS);
      const loc = getRandom(LOCATIONS);
      return [
        { author: "Locker_077_Kenji", text: `Trading ${item} for lunch snacks near ${loc}!` },
        { author: "Nekomi Aoyama", text: `Save some for rooftop jam practice later! 🎸` }
      ];
    },
    // 2. Lunch Food Hunt
    () => {
      const snack = getRandom(SNACKS);
      const loc = getRandom(LOCATIONS);
      return [
        { author: "Akari Minase", text: `REGISTER LINE NEAR ${loc} HAS EXTRA ${snack}! RUN RUN RUN!! 🍓🔥` },
        { author: "Locker_104_Ren", text: "OMW! Don't let them sell out before I get there!!" },
        { author: "Aoi Mizuhara", text: "Please do not run inside the building." }
      ];
    },
    // 3. Rooftop Equipment Testing
    () => {
      const gear = getRandom(GEAR);
      return [
        { author: "Sera Hanibara", text: `Setting up ${gear} on the rooftop bench during lunch! Ambient vibes are immaculate 🎧✨` },
        { author: "Nekomi Aoyama", text: "I'll bring my acoustic guitar up to layer over the synth pads! 🎸" },
        { author: "Locker_115_Hana", text: "Sounds super pretty from down in the courtyard!" }
      ];
    }
  ],

  afternoon: [
    // 1. Post-Practice Snack Run
    () => {
      const loc = getRandom(LOCATIONS);
      return [
        { author: "Akari Minase", text: `Speed run to ${loc} for post-practice snacks!! 🏃‍♀️💨` },
        { author: "Aoi Mizuhara", text: `Please do not run inside the building.` },
        { author: "Akari Minase", text: "Fast walking mode engaged!! 🤫" }
      ];
    },
    // 2. Club Gear Tuning
    () => {
      const gear = getRandom(GEAR);
      const item = getRandom(ITEMS);
      return [
        { author: "Sera Hanibara", text: `Rehearsal check: tuned ${gear} and grabbed ${item} from the storage rack ⚡` },
        { author: "Nekomi Aoyama", text: "The tone transition in the bridge section sounds so clean now!" },
        { author: "Akari Minase", text: "GIVE ME THAT COUNT-IN! 1... 2... 3... GO! 🥁💥" }
      ];
    },
    // 3. Hallway Cleanup Notice
    () => {
      const item = getRandom(ITEMS);
      const loc = getRandom(LOCATIONS);
      return [
        { author: "Aoi Mizuhara", text: `Post-club reminder: someone left ${item} sitting near ${loc}.` },
        { author: "Locker_104_Ren", text: "That's mine! Heading back to grab it right now! Thank you Aoi-senpai! 🙏" }
      ];
    }
  ],

  night: [
    // 1. Late Night Study Break
    () => {
      const subject = getRandom(SUBJECTS);
      const item = getRandom(ITEMS);
      return [
        { author: "Locker_188_Sora", text: `Late night study grind... currently stuck on ${subject} 🌙` },
        { author: "Sera Hanibara", text: `Taking a quick break from mixing synth tracks! Left ${item} on my desk for focus ✨` },
        { author: "Aoi Mizuhara", text: `Remember to take short breaks every 45 minutes, Sora.` }
      ];
    },
    // 2. Late Night Snack Fuel
    () => {
      const snack = getRandom(SNACKS);
      const loc = getRandom(LOCATIONS);
      return [
        { author: "Locker_089_Kaito", text: `Vending machine near ${loc} just restocked ${snack}! ☕` },
        { author: "Locker_077_Kenji", text: "DON'T MOVE! I'm coming down to the lounge right now!!" },
        { author: "Locker_089_Kaito", text: "Late night jackpot study fuel locked in." }
      ];
    },
    // 3. Late Night Music Production
    () => {
      const gear = getRandom(GEAR);
      return [
        { author: "Sera Hanibara", text: `Late night DAW export in progress... running ${gear} preset loop 🎧🌌` },
        { author: "Nekomi Aoyama", text: "Listening under my blanket... the reverb trail sounds so dreamy, Sera! ✨" },
        { author: "Sera Hanibara", text: "Teaser audio drops on Neko FM tomorrow morning! 🎶" }
      ];
    }
  ]
};

// Time-Aware Narrative Story Pools (Massive Rotation Expansion)
const STORY_CONVERSATIONS = {
  // Morning (5:00 AM - 8:59 AM)
  morning: [
    // 1. Long 8-Message Morning Assembly & Lost Key Exchange
    [
      { author: "Locker_104_Ren", text: "Morning rush! Who left their coffee cup on locker 104's door shelf again? ☕" },
      { author: "Nekomi Aoyama", text: "Guilty... but it was matcha and I was running late for homeroom! 🍵" },
      { author: "Locker_104_Ren", text: "Fair enough, but it nearly knocked over my acoustic guitar case! 😅" },
      { author: "Akari Minase", text: "First period bell in 5 minutes! Sprint speed test starting NOW 🏃‍♀️💨" },
      { author: "Locker_212_Mina", text: "Wait!! Did anyone find a brass key with a pink cat charm near the lockers?!" },
      { author: "Aoi Mizuhara", text: "Mina, check the lost and found box near the main office counter." },
      { author: "Locker_212_Mina", text: "FOUND IT! Someone turned it in already! Thank you Aoi-senpai! ✨" },
      { author: "Akari Minase", text: "30 SECONDS LEFT! GET TO CLASS EVERYONE!! 🔔🔥" }
    ],
    // 2. Homework Panics
    [
      { author: "Locker_212_Mina", text: "Did anyone actually finish the page 44 math homework? Please tell me I'm not the only one..." },
      { author: "Aoi Mizuhara", text: "Mina, math solutions were posted on the board yesterday. Review during homeroom." },
      { author: "Akari Minase", text: "I filled mine with drum rhythms instead... hope sensei likes 16th notes 🥁" }
    ],
    // 3. Kiosk Rush
    [
      { author: "Locker_089_Kaito", text: "Who took the last melon pan from the courtyard kiosk? It was gone by 8:10 AM! 🥖" },
      { author: "Nekomi Aoyama", text: "I saw someone with two in their bag near the main stairs..." },
      { author: "Locker_077_Kenji", text: "No comment. Trading one for a matcha Pocky box though." }
    ],
    // 4. Morning Sounddeck Cable Check
    [
      { author: "Sera Hanibara", text: "Testing XLR channel 3 on the courtyard stage sub-box... sound check early bird! 🎧✨" },
      { author: "Nekomi Aoyama", text: "Signal sounds super clean from the main staircase! What mic preamps are we on today?" },
      { author: "Sera Hanibara", text: "Switched to the tube set! Vocal warmth for Nekomi & Sera tracks +100% 🌸" },
      { author: "Akari Minase", text: "I HEAR THAT BASS REVERB FROM THE FRONT GATE!! ON MY WAY UP! 🏃‍♀️💨" }
    ],
    // 5. Lost Drumstick Bag Panic
    [
      { author: "Akari Minase", text: "EMERGENCY EMERGENCY!! WHERE IS MY BLACK CANVAS STICK BAG?!! 🥁😱" },
      { author: "Nekomi Aoyama", text: "Did you check under the rooftop bench from yesterday's rehearsal?" },
      { author: "Akari Minase", text: "FOUND IT!! It was sitting right on the acoustic amp shelf! PHEW! 💨" },
      { author: "Sera Hanibara", text: "Classic Akari morning panic count: 1 ⚡" }
    ],
    // 6. Early Bird Hallway Prep
    [
      { author: "Locker_142_Rin", text: "Does anyone have an extra mechanical pencil lead pack? Locker 142 emergency!! ✏️" },
      { author: "Locker_104_Ren", text: "Check the shelf under 104, I left a spare 0.5mm box there earlier!" },
      { author: "Aoi Mizuhara", text: "Please return to your homeroom desks before the second bell rings." }
    ]
  ],

  // Class Hours (9:00 AM - 11:59 AM)
  class_hours: [
    // 1. Fast Notes
    [
      { author: "Locker_052_Taro", text: "Sensei is writing notes so fast my pencil is literally smoking ✍️🔥" },
      { author: "Sera Hanibara", text: "Psst, tuning synth presets under my desk... 🎧✨" },
      { author: "Aoi Mizuhara", text: "Pay attention in class, everyone." }
    ],
    // 2. Long 9-Message Secret Note Passing Session
    [
      { author: "Locker_142_Rin", text: "Whoever has hallway pass for B-wing, grab extra sticky notes from library drop!" },
      { author: "Nekomi Aoyama", text: "I'm passing by B-wing right now! Grabbing a stack for the music room 📝" },
      { author: "Locker_142_Rin", text: "Can you snag the blue pastel ones? Trying to write down song lyrics!" },
      { author: "Nekomi Aoyama", text: "Got them! Leaving them inside locker 142's top shelf slot 🌸" },
      { author: "Sera Hanibara", text: "Wait, are those lyrics for the new synth track?!" },
      { author: "Nekomi Aoyama", text: "Yes! Chorus line for 'Girls of Phantom' is coming together so nicely ✨" },
      { author: "Akari Minase", text: "I ALREADY HAVE THE BASS DRUM PATTERN FOR IT IN MY HEAD 🥁⚡" },
      { author: "Aoi Mizuhara", text: "Please refrain from messaging during lectures." },
      { author: "Akari Minase", text: "Oops... phone going back in bag now!! 🤫" }
    ],
    // 3. Lab Experiment Blues
    [
      { author: "Locker_205_Daisuke", text: "3rd period physics lab experiment is bubbling weirdly... is that supposed to turn blue?" },
      { author: "Aoi Mizuhara", text: "Daisuke, step away from the burner and check step 3 on page 88 immediately." }
    ],
    // 4. Desk-Passing Synth Patch Notes
    [
      { author: "Sera Hanibara", text: "Psst... adjusted the filter cutoff on the 'Phantom Resonance' synth patch 🎧" },
      { author: "Nekomi Aoyama", text: "Oooh, does it blend better with my acoustic rhythm chords now?" },
      { author: "Sera Hanibara", text: "Way better! Leaving a flash drive with the WAV preview on locker 142." },
      { author: "Aoi Mizuhara", text: "Please focus on second period history lectures." }
    ],
    // 5. Lab Coat Mix-Up
    [
      { author: "Locker_205_Daisuke", text: "Who took lab coat #14 from the B-wing rack? The pockets are stuffed with guitar picks!" },
      { author: "Akari Minase", text: "MY BAD!! I used it during quick drum stick sanding earlier 🥁😅" },
      { author: "Locker_205_Daisuke", text: "There's literally sawdust in the left pocket Akari!!" },
      { author: "Akari Minase", text: "I'LL TRADE YOU A MATCHA POCKY BOX TO WASH IT!! 🙏" }
    ],
    // 6. Countdown to Lunch
    [
      { author: "Locker_052_Taro", text: "10 minutes until lunch bell... stomach is growling louder than the hallway speakers 🍱" },
      { author: "Akari Minase", text: "STRETCHING LEGS UNDER DESK IN PREPARATION FOR THE CAFETERIA SPRINT 🏃‍♀️💨" },
      { author: "Aoi Mizuhara", text: "Akari, sit up straight." }
    ]
  ],

  // Lunchtime (12:00 PM - 1:59 PM)
  lunchtime: [
    // 1. Long 10-Message Full Band Cafeteria & Rooftop Debate
    [
      { author: "Akari Minase", text: "CAFETERIA PARFAIT LINE IS CLEAR! RUN RUN RUN 🍓✨" },
      { author: "Locker_077_Kenji", text: "Trading half a tuna sando for matcha Pocky at locker 77 table!" },
      { author: "Nekomi Aoyama", text: "Acoustic jam session on the rooftop during lunch today! Bring your sandwiches~ 🎸" },
      { author: "Sera Hanibara", text: "I brought the portable synth module! We can test input levels 🎧" },
      { author: "Locker_104_Ren", text: "Save space on the bench! I'm bringing my guitar cable adapter." },
      { author: "Akari Minase", text: "I HAVE THE PRACTICE PADS AND BENTO IN HAND! OMW UP! 🍱🔥" },
      { author: "Aoi Mizuhara", text: "Akari, please do not run on the rooftop stairs." },
      { author: "Akari Minase", text: "Fast walking! Fast walking only!! 🏃‍♀️💨" },
      { author: "Nekomi Aoyama", text: "Sunlight is perfect today! Setup complete! ☀️✨" },
      { author: "Sera Hanibara", text: "Count us in, Akari! 1... 2... 3... GO! 🎶" }
    ],
    // 2. Courtyard Sound Check
    [
      { author: "Locker_115_Hana", text: "Rooftop acoustics today are amazing! We can hear the guitar chords down from the courtyard!" },
      { author: "Nekomi Aoyama", text: "Testing out a new chorus melody for Girls of Phantom! Glad it carries well ✨" }
    ],
    // 3. Strawberry Melon Pan Hunt
    [
      { author: "Locker_077_Kenji", text: "Limited edition strawberry melon pan is IN STOCK at register 2!! 🍞🍓" },
      { author: "Akari Minase", text: "TARGET ACQUIRED! EXECUTION SPEED: MAXIMUM 🏃‍♀️💨" },
      { author: "Locker_104_Ren", text: "Ren knocked over two chairs trying to beat Akari to line 2..." },
      { author: "Locker_077_Kenji", text: "Worth it. She secured the last two." }
    ],
    // 4. Neko FM Deck Playlist Discussion
    [
      { author: "Sera Hanibara", text: "Updating lunch broadcast queue on Neko FM deck... synthwave or chill lo-fi today? 🎧" },
      { author: "Locker_188_Sora", text: "Lo-fi beats please! Perfect background music for last-minute study review." },
      { author: "Nekomi Aoyama", text: "Vote for lo-fi + 1! It matches the rooftop sunlight today ✨" },
      { author: "Sera Hanibara", text: "Lo-fi mix queued! Broadcasting in 3... 2... 1... 🎶" }
    ],
    // 5. Bento Exchange
    [
      { author: "Locker_212_Mina", text: "Trading home-baked tamagoyaki for spicy ramen snack packs at locker 77!" },
      { author: "Locker_089_Kaito", text: "I have two extra spicy packs from the vending kiosk! Deal!" },
      { author: "Locker_212_Mina", text: "Best lunch exchange day ever ✨" }
    ]
  ],

  // Afternoon & Club Hours (2:00 PM - 6:59 PM)
  afternoon: [
    // 1. Long 8-Message Intense Band Rehearsal Sequence
    [
      { author: "Sera Hanibara", text: "Rooftop amp setup complete! Checking gain levels on input 2 ⚡" },
      { author: "Nekomi Aoyama", text: "Girls of Phantom bridge section sounds so clean with the new distortion pedal! 🎸" },
      { author: "Akari Minase", text: "GIVE ME THAT COUNT-IN! 1... 2... 3... GO! 🥁🔥" },
      { author: "Aoi Mizuhara", text: "Bass frequency is clipping slightly on the low E string. Tightening tone knob." },
      { author: "Sera Hanibara", text: "Adjusted EQ on mixer panel! Waveform looks super smooth now 🎛️✨" },
      { author: "Nekomi Aoyama", text: "That transition into the chorus gave me chills! One more time from measure 16?" },
      { author: "Akari Minase", text: "COUNTING IN AGAIN! 1... 2... 3... LET'S GOOOOO!! 🥁💥" },
      { author: "Locker_205_Daisuke", text: "Sounds insane from the courtyard! You guys are killin it today! 🌅" }
    ],
    // 2. Courtyard Rehearsal Reactions
    [
      { author: "Locker_205_Daisuke", text: "Echoes of the band practice sound amazing from down in the courtyard 🌅" },
      { author: "Aoi Mizuhara", text: "Keep the bass end balanced so we don't shake the staff room windows." }
    ],
    // 3. High-Tempo Break
    [
      { author: "Akari Minase", text: "TEMPO TEST AT 170 BPM HIT PERFECTLY ON THE FOURTH TAKE! 🥁🔥" },
      { author: "Nekomi Aoyama", text: "My fingers are literally flying on the fretboard! That fast bridge section sounds CRAZY good!" },
      { author: "Sera Hanibara", text: "Saved the audio stems on the DAW panel! Waveform alignment is 100% 🎛️✨" },
      { author: "Aoi Mizuhara", text: "Great stamina today everyone. Take a 15-minute hydration break before the final run." },
      { author: "Akari Minase", text: "ICE COLD MATCHA MILK TIME!! OMW DOWN TO THE VENDING KIOSK! 🥤💨" }
    ],
    // 4. Overdrive Pedal Test
    [
      { author: "Nekomi Aoyama", text: "Testing out Sera's new vintage overdrive pedal on my electric guitar 🎸⚡" },
      { author: "Locker_205_Daisuke", text: "Whoa!! That guitar tone from the rooftop sounds super punchy!" },
      { author: "Sera Hanibara", text: "Told you! Analog warmth gives 'Girls of Phantom' such a solid edge ✨" }
    ],
    // 5. Club Room Cleanup Duty
    [
      { author: "Aoi Mizuhara", text: "Post-practice club reminder: coil all XLR cables and lock amp head cabinets." },
      { author: "Sera Hanibara", text: "Cable rack organized and audio deck covered! 🎧" },
      { author: "Akari Minase", text: "Drum hardware folded and packed! Ready for tomorrow! 🥁" }
    ],
    // 6. Sunset Acoustic Jam
    [
      { author: "Locker_104_Ren", text: "Sunset light in the courtyard right now is insane 🌅" },
      { author: "Nekomi Aoyama", text: "Brought out my acoustic for a quick 10-minute unwind session before heading home~" },
      { author: "Locker_188_Sora", text: "Best backdrop for acoustic chords ever." }
    ]
  ],

  // Late Night & Night Owls (7:00 PM - 4:59 AM)
  night: [
    // 1. Long 10-Message Late Night Group Study & Music Production Chat
    [
      { author: "Locker_188_Sora", text: "Anyone still up working on chapter 4 math problems? 🌙" },
      { author: "Sera Hanibara", text: "Exporting audio stems for our demo while doing algebra... dual screen focus 🎧" },
      { author: "Nekomi Aoyama", text: "Working on acoustic lyrics under my desk lamp... 📝✨" },
      { author: "Locker_089_Kaito", text: "Problem #14 is brutal... how do you factor the cubic equation?!" },
      { author: "Aoi Mizuhara", text: "Group the first two terms together, Kaito. Factor out x squared." },
      { author: "Locker_089_Kaito", text: "THAT WORKED!! Aoi-senpai you are a literal lifesaver!! 🙏" },
      { author: "Sera Hanibara", text: "Audio stems finished exporting! Uploading to Neko FM deck now 🎶" },
      { author: "Nekomi Aoyama", text: "Listening now... the ambient synth pads sound so dreamy! 🌌" },
      { author: "Akari Minase", text: "Just woke up to drink water... ARE YOU GUYS STILL UP?!" },
      { author: "Nekomi Aoyama", text: "Heading to sleep now! Goodnight everyone~ 💤✨" }
    ],
    // 2. Caffeine Study Grind
    [
      { author: "Locker_089_Kaito", text: "Night owl study grind session... caffeine level at 100% ☕" },
      { author: "Akari Minase", text: "Goodnight everyone! Heavy drum training tomorrow morning!! 🥁💤" },
      { author: "Nekomi Aoyama", text: "Stargazing from my desk window... writing acoustic lyrics for Nekomi & Sera duo ✨" }
    ],
    // 3. Neko FM Loop Finish
    [
      { author: "Sera Hanibara", text: "Finished mixing the synth pads for Neko FM loop... export complete 🎧✨" },
      { author: "Locker_188_Sora", text: "Sounds incredible! Perfect background audio for late night homework." }
    ],
    // 4. Late Night DAW Mix Review
    [
      { author: "Sera Hanibara", text: "Late night DAW rendering station active... master compression tweak on track 2 🎧🌌" },
      { author: "Nekomi Aoyama", text: "Listening on my headphones under my blanket... the vocal reverb layer sounds so dreamy Sera!" },
      { author: "Sera Hanibara", text: "Added a slight tape delay effect on the chorus drop ✨ Glad you love it!" },
      { author: "Locker_188_Sora", text: "Wait... is this demo getting uploaded to Neko FM tomorrow?!" },
      { author: "Sera Hanibara", text: "Teaser clip drops at 8:00 AM homeroom tick! 🎶" }
    ],
    // 5. Midnight Vending Machine Jackpot
    [
      { author: "Locker_089_Kaito", text: "Dorm vending machine just dispensed two hot milk tea cans for the price of one ☕✨" },
      { author: "Locker_077_Kenji", text: "DON'T MOVE! I'M COMING DOWN TO THE LOUNGE WITH SANDO PACKS!!" },
      { author: "Locker_089_Kaito", text: "Late night jackpot study fuel confirmed." }
    ],
    // 6. Drum Transcription Night Owls
    [
      { author: "Akari Minase", text: "Transcribing drum sheet music by desk lamp light... 16th note fills are insane 🥁📝" },
      { author: "Aoi Mizuhara", text: "Akari, turn off your lamp and get proper rest. Big rehearsal tomorrow." },
      { author: "Akari Minase", text: "Last measure complete!! Closing notebook now Aoi-senpai!! 💤" }
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
  const timeSlot = getCurrentTimeSlot();

  // Get the last posted message text across the channel to prevent back-to-back duplicates
  const lastMsgSnap = await messagesRef.orderBy("timestamp", "desc").limit(1).get();
  let lastText = "";
  if (!lastMsgSnap.empty) {
    lastText = lastMsgSnap.docs[0].data().text || "";
  }

  // 50% Chance to pick Path 2 (Dynamic Template) vs Path 1 (Narrative Story)
  const useDynamic = Math.random() > 0.5 && DYNAMIC_TEMPLATES[timeSlot] && DYNAMIC_TEMPLATES[timeSlot].length > 0;

  let conversation;

  if (useDynamic) {
    const generator = getRandom(DYNAMIC_TEMPLATES[timeSlot]);
    conversation = generator();
    console.log(`[Bot Engine] Slot: ${timeSlot} | Generated Path 2 Dynamic Sequence (${conversation.length} msgs)...`);
  } else {
    const staticPool = STORY_CONVERSATIONS[timeSlot] || STORY_CONVERSATIONS.night;
    let availablePools = staticPool.filter(pool => !pool.some(msg => msg.text === lastText));
    if (availablePools.length === 0) availablePools = staticPool;

    conversation = getRandom(availablePools);
    console.log(`[Bot Engine] Slot: ${timeSlot} | Picked Path 1 Story Sequence (${conversation.length} msgs)...`);
  }

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

      // 3 to 8 second typing delay between messages
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
