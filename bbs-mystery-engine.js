/**
 * Sakuraoka BBS Master Mystery Engine
 * Handles real-time post unlocking, automated epoch-based case rotation,
 * dual-track board rendering, student council notice threads, dynamic gossip feeds,
 * tab switching, and passcode decoding.
 */

(function () {
  // Constants
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

  // Active solution vault for Decoder tab matching
  const activeSolutions = {};

  // Embedded Schedule Catalog (Fallback if fetch fails or running via local file:// protocol)
  const EMBEDDED_CATALOG = {
    "epoch_start_iso": "2026-10-12T00:00:00Z",
    "free_cases_pool": [
      {
             "case_id": "CASE-105",
      "mystery_id": "case_105_window_chime",
      "title": "Case #105 — The Phantom Chime of Room 302",
      "reward_badge": "Seven Wonders Sleuth",
      "required_passcode": "SUNSET_302",
      "timeline": [
        /* ================= DAY 1 (MONDAY): THE INITIAL RUMOR (16 POSTS) ================= */
        { "offset_mins": 0, "author": "Yuki_Library", "author_badge": "Library Committee", "avatar_icon": "📚", "message": "I was walking down the 3F B-Wing hallway right around 5:00 PM. Room 302 was pitch dark, but I heard a soft chime melody floating from inside...", "is_npc": false },
        { "offset_mins": 25, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "@Yuki_Library Wait, Room 302? Isn't that the empty homeroom that's locked after afternoon club practice?", "is_npc": false },
        { "offset_mins": 50, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "Class 2-A is on the 2nd floor right below B-Wing! We didn't hear anything during 6th period, but the afternoon light was glowing super bright outside.", "is_npc": false },
        { "offset_mins": 90, "author": "Anon_Sleuth", "author_badge": "Class 3-C", "avatar_icon": "🕵️", "message": "A phantom tune in a locked classroom? Now this is a proper Sakuraoka mystery!", "is_npc": false },
        { "offset_mins": 140, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Logging this on my watch list. Will check the BBS tomorrow morning to see if anyone else noticed it.", "is_npc": false },
        { "offset_mins": 450, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Good morning! Track team lap finished. Walked past 3F B-Wing and Room 302 is locked tight like usual.", "is_npc": false },
        { "offset_mins": 510, "author": "Hina_Class1A", "author_badge": "Class 1-A", "avatar_icon": "🌸", "message": "Good morning seniors! Is it true that Room 302 is haunted by an old music student?", "is_npc": false },
        { "offset_mins": 580, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "Ooh, a ghost story? Drama club could turn this into a play for the festival!", "is_npc": false },
        { "offset_mins": 650, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Let's not jump to ghosts just yet. Maybe someone left a phone or speaker in there on a timer?", "is_npc": false },
        { "offset_mins": 735, "author": "Bass_Sera", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/sera.jpeg", "message": "Lunch break update: Nekomi and I checked with the music teacher! The upright pianos were all moved down to the basement storage room last month!", "is_npc": true },
        { "offset_mins": 780, "author": "CatEars_Nekomi", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi peered through Room 302's door glass! No instruments inside at all, just stacked desks! So where is the chime coming from?!", "is_npc": true },
        { "offset_mins": 840, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "Setting up equipment in the science room across the yard later today. I'll keep an eye on 3F B-Wing.", "is_npc": false },
        { "offset_mins": 990, "author": "Akari_M", "author_badge": "Class 2-A", "avatar_icon": "assets/akari.jpeg", "message": "Class 2-A is on the case! Pay attention to the exact time and lighting whenever anyone hears the song!", "is_npc": true },
        { "offset_mins": 1155, "author": "Aoi", "author_badge": "Class 2-A", "avatar_icon": "assets/aoi.jpeg", "message": "I hear it right now from the courtyard! It's a sweet, warm lullaby playing right as the golden evening light hits B-Wing!", "is_npc": true },
        { "offset_mins": 1230, "author": "Bass_Sera", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/sera.jpeg", "message": "We're down in our Light Music room and we can hear it echoing across the courtyard too!", "is_npc": true },
        { "offset_mins": 1305, "author": "Daiki_Pres", "author_badge": "Student Council", "avatar_icon": "📋", "message": "Student Council Notice: Please do not loiter near the 3F B-Wing corridor past curfew.", "is_npc": true },

        /* ================= DAY 2 (TUESDAY): TIME & LOCATION FOCUS (16 POSTS) ================= */
        { "offset_mins": 1485, "author": "Anon_Sleuth", "author_badge": "Class 3-C", "avatar_icon": "🕵️", "message": "Day 2 morning check on the BBS! Still thinking about that melody from yesterday afternoon.", "is_npc": false },
        { "offset_mins": 1890, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Day 2 morning run complete. The staff room key box for Room 302 was checked—no student borrowed the key all week.", "is_npc": false },
        { "offset_mins": 1950, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "So if the door stays locked, the sound source has to be something sitting right inside that 3F window!", "is_npc": false },
        { "offset_mins": 2010, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "I walked past during 2nd period break. Pitch silent in the morning.", "is_npc": false },
        { "offset_mins": 2070, "author": "Hina_Class1A", "author_badge": "Class 1-A", "avatar_icon": "🌸", "message": "So it only plays in the afternoon? That's super specific!", "is_npc": false },
        { "offset_mins": 2175, "author": "Akari_M", "author_badge": "Class 2-A", "avatar_icon": "assets/akari.jpeg", "message": "Aoi and I walked past 3F B-Wing during lunch. The window of Room 302 catches direct sunlight every late afternoon!", "is_npc": true },
        { "offset_mins": 2220, "author": "Aoi", "author_badge": "Class 2-A", "avatar_icon": "assets/aoi.jpeg", "message": "Notice board update: The music only starts during the golden hour when the sun gets low in the sky!", "is_npc": true },
        { "offset_mins": 2280, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "Tying the music to the angle of the sun? That sounds like poetic theater tech!", "is_npc": false },
        { "offset_mins": 2355, "author": "CatEars_Nekomi", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi thinks it's a secret Neko FM broadcast! Maybe a hidden antenna near Room 302?!", "is_npc": true },
        { "offset_mins": 2430, "author": "Yuki_Library", "author_badge": "Library Committee", "avatar_icon": "📚", "message": "I searched old school logs in the library. Room 302 was last used for club storage during autumn term.", "is_npc": false },
        { "offset_mins": 2520, "author": "Bass_Sera", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/sera.jpeg", "message": "@CatEars_Nekomi We don't have any antennas up on the 3rd floor, silly! But the timing is so specific...", "is_npc": true },
        { "offset_mins": 2590, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Recording time window: strictly afternoon between 5:00 PM and 5:30 PM.", "is_npc": false },
        { "offset_mins": 2670, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "5:10 PM: Setting up the telescope in the science room across the yard. The orange glow on Room 302's window glass is super bright right now!", "is_npc": false },
        { "offset_mins": 2745, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Just walked under B-Wing after gym practice. The chime melody is definitely playing right on cue as the sun dips down!", "is_npc": false },
        { "offset_mins": 2820, "author": "Akari_M", "author_badge": "Class 2-A", "avatar_icon": "assets/akari.jpeg", "message": "CLUE RECAP: The trigger is tied to the late afternoon SUNSET lighting up Room 302!", "is_npc": true },
        { "offset_mins": 2870, "author": "Daiki_Pres", "author_badge": "Student Council", "avatar_icon": "📋", "message": "Reminder: All hallway investigation logs should be submitted peacefully on the BBS.", "is_npc": true },

        /* ================= DAY 3 (WEDNESDAY): KEYWORD DROPS (16 POSTS) ================= */
        { "offset_mins": 2925, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Day 3 begins! Mid-week mystery analysis in progress.", "is_npc": false },
        { "offset_mins": 3330, "author": "Aoi", "author_badge": "Class 2-A", "avatar_icon": "assets/aoi.jpeg", "message": "Good morning! I took notes on yesterday's sightings. The chime only happens when the golden 'SUNSET' beam hits the glass directly!", "is_npc": true },
        { "offset_mins": 3390, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Morning track update! Ground team confirmed no sound during sunrise or noon.", "is_npc": false },
        { "offset_mins": 3440, "author": "Hina_Class1A", "author_badge": "Class 1-A", "avatar_icon": "🌸", "message": "So 'SUNSET' is definitely the magic time of day for this mystery!", "is_npc": false },
        { "offset_mins": 3495, "author": "CatEars_Nekomi", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi checked the room number tag outside again! It clearly says '302' on the brass door plate!", "is_npc": true },
        { "offset_mins": 3550, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "Room 302 has such an iconic ring to it now!", "is_npc": false },
        { "offset_mins": 3615, "author": "Akari_M", "author_badge": "Class 2-A", "avatar_icon": "assets/akari.jpeg", "message": "Putting the clues together: We have the sky event 'SUNSET' and the room location '302'!", "is_npc": true },
        { "offset_mins": 3660, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "Wait, so is 'SUNSET' part of the activation code for the mystery?", "is_npc": false },
        { "offset_mins": 3720, "author": "Anon_Sleuth", "author_badge": "Class 3-C", "avatar_icon": "🕵️", "message": "If 'SUNSET' is word one and '302' is word two... we might be looking at a combined passcode format!", "is_npc": false },
        { "offset_mins": 3795, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "If you join the event keyword 'SUNSET' and room '302' with an underscore, could that be it?!", "is_npc": false },
        { "offset_mins": 3870, "author": "Yuki_Library", "author_badge": "Library Committee", "avatar_icon": "📚", "message": "That syntax matches the standard Sakuraoka Event Decoder format perfectly!", "is_npc": false },
        { "offset_mins": 3960, "author": "Bass_Sera", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/sera.jpeg", "message": "We still need to confirm what object inside Room 302 is actually making the noise though!", "is_npc": true },
        { "offset_mins": 4035, "author": "Aoi", "author_badge": "Class 2-A", "avatar_icon": "assets/aoi.jpeg", "message": "Let's observe the window glass closely again during today's evening curfew!", "is_npc": true },
        { "offset_mins": 4110, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "5:12 PM: The sun reached the exact angle again! The window frame is glowing gold and the melody just started!", "is_npc": false },
        { "offset_mins": 4185, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Stood right outside Room 302 door just now... you can hear a tiny mechanical click right before the chime plays!", "is_npc": false },
        { "offset_mins": 4260, "author": "Akari_M", "author_badge": "Class 2-A", "avatar_icon": "assets/akari.jpeg", "message": "A mechanical click?! That means it's an automated device on the windowsill!", "is_npc": true },

        /* ================= DAY 4 (THURSDAY): MECHANICAL SENSORS & VISUALS (16 POSTS) ================= */
        { "offset_mins": 4365, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Day 4 overnight check! The mystery is unravelling fast!", "is_npc": false },
        { "offset_mins": 4770, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Thursday morning bleacher laps done! Looked up at Room 302—something small and reflective is sitting on the interior sill!", "is_npc": false },
        { "offset_mins": 4830, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "A reflective object sitting on Room 302's windowsill?!", "is_npc": false },
        { "offset_mins": 4890, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "Is it a solar-powered gadget? That would explain why it only activates when direct light hits it!", "is_npc": false },
        { "offset_mins": 4950, "author": "Hina_Class1A", "author_badge": "Class 1-A", "avatar_icon": "🌸", "message": "A solar chime gadget! That makes so much sense!", "is_npc": false },
        { "offset_mins": 5055, "author": "CatEars_Nekomi", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi used binoculars from the courtyard! It looks like a little decorative desk clock with a solar strip!", "is_npc": true },
        { "offset_mins": 5100, "author": "Bass_Sera", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/sera.jpeg", "message": "Wait... a small wooden chime clock with a solar strip on top?! Why does that sound so familiar...", "is_npc": true },
        { "offset_mins": 5160, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "Dun dun dun!! Drama unfolds on the BBS!", "is_npc": false },
        { "offset_mins": 5235, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "@Bass_Sera Hold on, Sera! Is that YOUR clock?!", "is_npc": false },
        { "offset_mins": 5310, "author": "Aoi", "author_badge": "Class 2-A", "avatar_icon": "assets/aoi.jpeg", "message": "Sera, didn't you say you lost your desk novelty clock during band equipment storage cleanup last week?!", "is_npc": true },
        { "offset_mins": 5370, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "No way haha! Did Light Music accidentally leave their own gear in Room 302?!", "is_npc": false },
        { "offset_mins": 5440, "author": "Anon_Sleuth", "author_badge": "Class 3-C", "avatar_icon": "🕵️", "message": "The mystery turns into a lost-and-found search! Classic Sakuraoka High!", "is_npc": false },
        { "offset_mins": 5510, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "5:15 PM: Telescope view confirms the solar panel caught the light right on schedule!", "is_npc": false },
        { "offset_mins": 5580, "author": "CatEars_Nekomi", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi is giggling so hard right now in the clubroom!", "is_npc": true },
        { "offset_mins": 5650, "author": "Akari_M", "author_badge": "Class 2-A", "avatar_icon": "assets/akari.jpeg", "message": "Sera is searching through her rehearsal notes to double-check!", "is_npc": true },
        { "offset_mins": 5720, "author": "Daiki_Pres", "author_badge": "Student Council", "avatar_icon": "📋", "message": "Student Council will verify the room contents during Friday rounds.", "is_npc": true },

        /* ================= DAY 5 (FRIDAY): NARROWING IT DOWN (16 POSTS) ================= */
        { "offset_mins": 5805, "author": "Anon_Sleuth", "author_badge": "Class 3-C", "avatar_icon": "🕵️", "message": "Friday morning! Time to put all the pieces together before the weekend!", "is_npc": false },
        { "offset_mins": 6210, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Friday morning! Everyone in the halls is talking about Sera's missing clock haha!", "is_npc": false },
        { "offset_mins": 6270, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "So the formula is almost 100% verified by the whole student body now!", "is_npc": false },
        { "offset_mins": 6340, "author": "Hina_Class1A", "author_badge": "Class 1-A", "avatar_icon": "🌸", "message": "I told all my Class 1-A friends about the SUNSET and 302 clues!", "is_npc": false },
        { "offset_mins": 6410, "author": "Yuki_Library", "author_badge": "Library Committee", "avatar_icon": "📚", "message": "Library desk confirmed multiple students asking about passcode submission rules.", "is_npc": false },
        { "offset_mins": 6495, "author": "CatEars_Nekomi", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi remembers! Sera set her clock on Room 302's windowsill while helping carry cable boxes!", "is_npc": true },
        { "offset_mins": 6560, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "She left it right where the afternoon light hits! Perfect accidental mystery trap!", "is_npc": false },
        { "offset_mins": 6630, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "This is genuinely the cutest resolution ever.", "is_npc": false },
        { "offset_mins": 6750, "author": "Aoi", "author_badge": "Class 2-A", "avatar_icon": "assets/aoi.jpeg", "message": "So whenever the low SUNSET light hits Room 302, the solar panel gets enough power to play its chime!", "is_npc": true },
        { "offset_mins": 6820, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Mystery solved by logic and observations!", "is_npc": false },
        { "offset_mins": 6915, "author": "Daiki_Pres", "author_badge": "Student Council", "avatar_icon": "📋", "message": "Student Council: We will unlock Room 302 on Sunday evening during weekly rounds to verify.", "is_npc": true },
        { "offset_mins": 6980, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "5:15 PM Friday chime recorded! Clear audio tone confirmed.", "is_npc": false },
        { "offset_mins": 7050, "author": "Bass_Sera", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/sera.jpeg", "message": "I am preparing my official apology post for Sunday's resolution thread...", "is_npc": true },
        { "offset_mins": 7110, "author": "Akari_M", "author_badge": "Class 2-A", "avatar_icon": "assets/akari.jpeg", "message": "Don't be embarrassed Sera! It gave the whole school a fun case to solve together!", "is_npc": true },
        { "offset_mins": 7170, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Friday night thread locking in. Preparing for weekend chatter.", "is_npc": false },
        { "offset_mins": 7220, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "Have a great weekend everyone! See you on the BBS!", "is_npc": false },

        /* ================= DAY 6 (SATURDAY): PRE-SOLVE HYPER-FOCUS (16 POSTS) ================= */
        { "offset_mins": 7245, "author": "Anon_Sleuth", "author_badge": "Class 3-C", "avatar_icon": "🕵️", "message": "Saturday morning BBS lounge check! Case #105 pre-solve summary looking super solid!", "is_npc": false },
        { "offset_mins": 7320, "author": "Hina_Class1A", "author_badge": "Class 1-A", "avatar_icon": "🌸", "message": "Weekend study session complete! Logging into Sakuraoka BBS to hang out.", "is_npc": false },
        { "offset_mins": 7400, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Saturday morning track practice done. The campus courtyard is so serene today.", "is_npc": false },
        { "offset_mins": 7480, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "Reminding everyone that the final code drops officially on Sunday!", "is_npc": false },
        { "offset_mins": 7560, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "Listening to Neko FM weekend playlist right now.", "is_npc": false },
        { "offset_mins": 7650, "author": "Yuki_Library", "author_badge": "Library Committee", "avatar_icon": "📚", "message": "The library is quiet today. Perfect weather for reading.", "is_npc": false },
        { "offset_mins": 7710, "author": "Aoi", "author_badge": "Class 2-A", "avatar_icon": "assets/aoi.jpeg", "message": "Saturday chatter! The clue components are 100% verified: SUNSET + 302!", "is_npc": true },
        { "offset_mins": 7800, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "I'm already hyping up my club members to enter the passcode on Sunday!", "is_npc": false },
        { "offset_mins": 7880, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Weekend volleyball drill complete. Ready for Sunday reveal!", "is_npc": false },
        { "offset_mins": 7935, "author": "CatEars_Nekomi", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi can't wait for Sunday when Sera officially confesses on the BBS!", "is_npc": true },
        { "offset_mins": 8020, "author": "Bass_Sera", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/sera.jpeg", "message": "Nekomi, please don't tease me on the main feed forever!", "is_npc": true },
        { "offset_mins": 8110, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "Clear skies tonight for weekend stargazing!", "is_npc": false },
        { "offset_mins": 8190, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "Get your passcodes ready for the Mystery Decoder tab on Sunday!", "is_npc": false },
        { "offset_mins": 8270, "author": "Akari_M", "author_badge": "Class 2-A", "avatar_icon": "assets/akari.jpeg", "message": "Class 2-A investigation team will post the official closing report tomorrow evening!", "is_npc": true },
        { "offset_mins": 8350, "author": "Daiki_Pres", "author_badge": "Student Council", "avatar_icon": "📋", "message": "Have a restful weekend everyone!", "is_npc": true },
        { "offset_mins": 8430, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Saturday night sign-off. Countdown to Day 7 solve!", "is_npc": false },

        /* ================= DAY 7 (SUNDAY): CONFESSION, SOLVE & RESET (17 POSTS) ================= */
        { "offset_mins": 8685, "author": "Anon_Sleuth", "author_badge": "Class 3-C", "avatar_icon": "🕵️", "message": "Sunday morning! Case #105 final resolution day!", "is_npc": false },
        { "offset_mins": 8760, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "Sunday homework finished! Waiting for the official case closing report on the BBS!", "is_npc": false },
        { "offset_mins": 8840, "author": "Hina_Class1A", "author_badge": "Class 1-A", "avatar_icon": "🌸", "message": "Ready to claim my Seven Wonders Sleuth badge today!", "is_npc": false },
        { "offset_mins": 8920, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Rest day complete. Gear packed for Monday morning track runs.", "is_npc": false },
        { "offset_mins": 9000, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "Checking in on the BBS while getting my school uniform ready for tomorrow!", "is_npc": false },
        { "offset_mins": 9080, "author": "Yuki_Library", "author_badge": "Library Committee", "avatar_icon": "📚", "message": "Sunday library drop box cleared for tomorrow morning.", "is_npc": false },
        { "offset_mins": 9160, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "The grand finale of Case #105 is almost here!", "is_npc": false },
        { "offset_mins": 9240, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Ready to log the master code on the Decoder tab!", "is_npc": false },
        { "offset_mins": 9375, "author": "Bass_Sera", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/sera.jpeg", "message": "CONFESSION POST: I am so embarrassed!! It was my solar chime clock sitting in Room 302 the whole time! Every time the SUNSET hit the glass at 5:00 PM, it powered up and played its melody!", "is_npc": true },
        { "offset_mins": 9420, "author": "CatEars_Nekomi", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi reclaimed the clock with the custodian! MYSTERY SOLVED!!", "is_npc": true },
        { "offset_mins": 9500, "author": "Aoi", "author_badge": "Class 2-A", "avatar_icon": "assets/aoi.jpeg", "message": "Great job everyone in Class 2-A and across all grades for gathering the clues!", "is_npc": true },
        { "offset_mins": 9630, "author": "Akari_M", "author_badge": "Class 2-A", "avatar_icon": "assets/akari.jpeg", "message": "OFFICIAL PASSCODE RELEASE: Enter SUNSET_302 into the Mystery Decoder tab right now to claim your 'Seven Wonders Sleuth' badge!", "is_npc": true },
        { "offset_mins": 9720, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "Entered SUNSET_302 and unlocked my badge! Such a sweet mystery solution!", "is_npc": false },
        { "offset_mins": 9800, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "Badge unlocked! The solar clock chime mystery is officially solved!", "is_npc": false },
        { "offset_mins": 9870, "author": "Daiki_Pres", "author_badge": "Student Council", "avatar_icon": "📋", "message": "Case #105 is officially closed. Next weekly campus event rotation begins tomorrow at midnight!", "is_npc": true },
        { "offset_mins": 9950, "author": "Hina_Class1A", "author_badge": "Class 1-A", "avatar_icon": "🌸", "message": "Goodnight everyone! Can't wait for next week's mystery event!", "is_npc": false },
        { "offset_mins": 10065, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Case #105 complete! SUNSET_302 redeemed. Preparing for Case #106 reset!", "is_npc": false }
      }
    ],
    "vip_cases_pool": [
      {
        "case_id": "VIP-CASE-105",
        "mystery_id": "case_105_rooftop_legend",
        "title": "VIP #105 — The Locked Rooftop Sunset Rumor",
        "reward_badge": "Rooftop Explorer",
        "required_passcode": "SUNSET_1994",
        "timeline": [
          {
            "offset_mins": 0,
            "author": "Pres_Haruka",
            "author_badge": "Student Council Pres",
            "avatar_icon": "👑",
            "message": "Notice: The door to the rooftop staircase remains locked after 5:00 PM for all students.",
            "is_npc": true
          },
          {
            "offset_mins": 360,
            "author": "Akari_M",
            "author_badge": "Class 2-A",
            "avatar_icon": "assets/akari.jpeg",
            "message": "Someone left a handwritten note on the rooftop keyhook in the staff room...",
            "is_npc": true
          }
        ]
      }
    ]
  };

  // Embedded Gossip & Student Council Fallback Pool
  const EMBEDDED_GOSSIP_POOL = {
    "student_council_threads": [
      {
  "weekly_gossip": {
    "0": [
      {
        "day_label": "Sunday",
        "unlock_hour": 10,
        "post_time": "Sun • 10:15 AM",
        "name": "Yuki_Library",
        "badge": "Library Committee",
        "avatar": "📚",
        "category": "rumors",
        "text": "Studying in the library on a Sunday is so peaceful... until you hear the courtyard cat meowing at the window!"
      },
      {
        "day_label": "Sunday",
        "unlock_hour": 13,
        "post_time": "Sun • 1:45 PM",
        "name": "Kenji_Gym",
        "badge": "Class 3-C",
        "avatar": "🏐",
        "category": "rumors",
        "text": "Morning practice finished early! Time to grab strawberry milk from the vending machine before heading home."
      },
      {
        "day_label": "Sunday",
        "unlock_hour": 21,
        "post_time": "Sun • 9:30 PM",
        "name": "Mina_StarClub",
        "badge": "Astronomy Club",
        "avatar": "🔭",
        "category": "afterdark",
        "text": "Sunday stargazing session set up near the science room balcony. The autumn sky is super clear tonight!"
      }
    ],
    "1": [
      {
        "day_label": "Monday",
        "unlock_hour": 8,
        "post_time": "Mon • 8:10 AM",
        "name": "Hiro_Class2B",
        "badge": "Class 2-B",
        "avatar": "🎧",
        "category": "rumors",
        "text": "Monday morning homeroom teacher gave us a surprise pop quiz... my week is already ruined."
      },
      {
        "day_label": "Monday",
        "unlock_hour": 12,
        "post_time": "Mon • 12:22 PM",
        "name": "Yumi_Class2A",
        "badge": "Class 2-A",
        "avatar": "🥪",
        "category": "rumors",
        "text": "The cafeteria ran out of yakisoba pan in literally two minutes today... who bought them all?!"
      },
      {
        "day_label": "Monday",
        "unlock_hour": 16,
        "post_time": "Mon • 4:05 PM",
        "name": "Daiki_Pres",
        "badge": "Student Council",
        "avatar": "📋",
        "category": "official",
        "text": "Student Council Notice: Please remember to change into your indoor shoes at the main entrance lockers!"
      }
    ],
    "2": [
      {
        "day_label": "Tuesday",
        "unlock_hour": 12,
        "post_time": "Tue • 12:40 PM",
        "name": "Hina_Class1A",
        "badge": "Class 1-A",
        "avatar": "🌸",
        "category": "rumors",
        "text": "Someone dropped a handwritten lunch invitation in locker #104! Is it a secret confession?!"
      },
      {
        "day_label": "Tuesday",
        "unlock_hour": 15,
        "post_time": "Tue • 3:50 PM",
        "name": "Ren_Track",
        "badge": "Track Team",
        "avatar": "🏃",
        "category": "rumors",
        "text": "Who left their sports drink shaker on the track bleacher bench after 7th period?"
      },
      {
        "day_label": "Tuesday",
        "unlock_hour": 18,
        "post_time": "Tue • 6:15 PM",
        "name": "Hiro_Class2B",
        "badge": "Class 2-B",
        "avatar": "🎧",
        "category": "rumors",
        "text": "Does anyone have the math prep answers for page 42? I fell asleep at my desk during study hour..."
      }
    ],
    "3": [
      {
        "day_label": "Wednesday",
        "unlock_hour": 13,
        "post_time": "Wed • 1:15 PM",
        "name": "Yuki_Library",
        "badge": "Library Committee",
        "avatar": "📚",
        "category": "official",
        "text": "Library Reminder: Overdue graduation yearbooks from box #4 need to be returned by Thursday!"
      },
      {
        "day_label": "Wednesday",
        "unlock_hour": 16,
        "post_time": "Wed • 4:30 PM",
        "name": "Sora_Drama",
        "badge": "Drama Club",
        "avatar": "🎭",
        "category": "rumors",
        "text": "We're missing two vintage costume props for the culture festival play! Please check the 3F storage room!"
      },
      {
        "day_label": "Wednesday",
        "unlock_hour": 17,
        "post_time": "Wed • 5:45 PM",
        "name": "Mina_StarClub",
        "badge": "Astronomy Club",
        "avatar": "🔭",
        "category": "rumors",
        "text": "The view of the courtyard from the 2F science window during dusk is honestly top tier."
      }
    ],
    "4": [
      {
        "day_label": "Thursday",
        "unlock_hour": 12,
        "post_time": "Thu • 12:15 PM",
        "name": "Kenji_Gym",
        "badge": "Class 3-C",
        "avatar": "🏐",
        "category": "rumors",
        "text": "Who wants to trade bentos at lunch tomorrow? My mom packed way too much tamagoyaki."
      },
      {
        "day_label": "Thursday",
        "unlock_hour": 16,
        "post_time": "Thu • 4:20 PM",
        "name": "Hina_Class1A",
        "badge": "Class 1-A",
        "avatar": "🌸",
        "category": "rumors",
        "text": "The cherry blossom trees near the back courtyard gate are starting to drop leaves already."
      },
      {
        "day_label": "Thursday",
        "unlock_hour": 18,
        "post_time": "Thu • 6:00 PM",
        "name": "Ren_Track",
        "badge": "Track Team",
        "avatar": "🏃",
        "category": "rumors",
        "text": "Track team setting a new lap record today! Evening practice extra pumped!"
      }
    ],
    "5": [
      {
        "day_label": "Friday",
        "unlock_hour": 15,
        "post_time": "Fri • 3:30 PM",
        "name": "Sora_Drama",
        "badge": "Drama Club",
        "avatar": "🎭",
        "category": "rumors",
        "text": "Weekend is finally here! Don't forget your club activity passes if you're staying late!"
      },
      {
        "day_label": "Friday",
        "unlock_hour": 17,
        "post_time": "Fri • 5:45 PM",
        "name": "Daiki_Pres",
        "badge": "Student Council",
        "avatar": "📋",
        "category": "official",
        "text": "Friday Notice: All clubrooms and B-Wing corridors must be locked by 6:00 PM evening curfew."
      },
      {
        "day_label": "Friday",
        "unlock_hour": 19,
        "post_time": "Fri • 7:10 PM",
        "name": "CatEars_Nekomi",
        "badge": "Light Music Club",
        "avatar": "assets/nekomi.jpeg",
        "category": "rumors",
        "text": "Nekomi and Sera are staying late in the band room testing out new guitar pedals! Sounds so cool!"
      }
    ],
    "6": [
      {
        "day_label": "Saturday",
        "unlock_hour": 14,
        "post_time": "Sat • 2:15 PM",
        "name": "Yumi_Class2A",
        "badge": "Class 2-A",
        "avatar": "🥪",
        "category": "rumors",
        "text": "Spotted the courtyard stray cat sleeping on the principal's parking spot this afternoon haha!"
      },
      {
        "day_label": "Saturday",
        "unlock_hour": 20,
        "post_time": "Sat • 8:40 PM",
        "name": "Hiro_Class2B",
        "badge": "Class 2-B",
        "avatar": "🎧",
        "category": "rumors",
        "text": "Is anyone else listening to the Neko FM broadcast while trying to finish weekend homework?"
      },
      {
        "day_label": "Saturday",
        "unlock_hour": 22,
        "post_time": "Sat • 10:15 PM",
        "name": "Mina_StarClub",
        "badge": "Astronomy Club",
        "avatar": "🔭",
        "category": "afterdark",
        "text": "Saturday evening campus is super quiet... Neko FM is playing really good retro synth tracks right now!"
      }
    ]
  },
  "after_hours_gossip": [
    {
      "unlock_hour": 23,
      "post_time": "Late Night • 11:45 PM",
      "name": "NightOwl_Student",
      "badge": "Class 2-A",
      "avatar": "🌙",
      "category": "afterdark",
      "text": "Should be sleeping, but reading urban legends on the school BBS under my blanket instead..."
    },
    {
      "unlock_hour": 1,
      "post_time": "Late Night • 1:30 AM",
      "name": "Anon_Sleuth",
      "badge": "Class 3-C",
      "avatar": "🕵️",
      "category": "afterdark",
      "text": "Did anyone else hear that distant piano chime while listening to Neko FM late night radio?"
    },
    {
      "unlock_hour": 3,
      "post_time": "Late Night • 3:00 AM",
      "name": "LateNight_Reader",
      "badge": "Class 1-B",
      "avatar": "📖",
      "category": "afterdark",
      "text": "3 AM forum check... the Sakuraoka BBS night theme looks so cozy."
    }
  ]
}

  /**
   * Main Initialization
   */
  async function initEngine() {
    setupTabNavigation();
    setupDecoder();
    await loadAndRenderCases();
    await loadAndRenderGossip();

    // Poll every 30 seconds to reveal new posts as time progresses
    setInterval(async () => {
      await loadAndRenderCases();
      await loadAndRenderGossip();
    }, 30000);
  }

  /**
   * Fetches JSON catalog or falls back to embedded catalog
   */
  async function loadAndRenderCases() {
    let catalog = null;

    // Direct JSON fetch pipeline attempting relative file locations
    const possiblePaths = [
      'case105.json',
      'js/case105.json',
      'case_105_schedule.json',
      'js/case_105_schedule.json'
    ];

    for (const path of possiblePaths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          catalog = await response.json();
          break;
        }
      } catch (err) {
        // Continue searching next path
      }
    }

    if (!catalog) {
      console.warn('[MYSTERY ENGINE] External case JSON fetch unavailable. Using embedded catalog fallback.');
      catalog = EMBEDDED_CATALOG;
    }

    const epochMs = new Date(catalog.epoch_start_iso || '2026-10-12T00:00:00Z').getTime();
    const nowMs = Date.now();

    const weekIndex = Math.max(0, Math.floor((nowMs - epochMs) / MS_PER_WEEK));
    const currentWeekStartMs = epochMs + (weekIndex * MS_PER_WEEK);
    const elapsedMinsInCurrentWeek = Math.floor((nowMs - currentWeekStartMs) / 60000);

    const freePool = catalog.free_cases_pool || (catalog.timeline ? [catalog] : []);
    const vipPool = catalog.vip_cases_pool || [];

    const activeFreeCase = freePool.length > 0 ? freePool[weekIndex % freePool.length] : null;
    const activeVipCase = vipPool.length > 0 ? vipPool[weekIndex % vipPool.length] : null;

    if (activeFreeCase) {
      renderCase(activeFreeCase, currentWeekStartMs, elapsedMinsInCurrentWeek, 'bbs-posts-container', false);
    }

    if (activeVipCase) {
      renderCase(activeVipCase, currentWeekStartMs, elapsedMinsInCurrentWeek, 'vip-posts-container', true);
    }
  }

  /**
   * Fetches gossip pool and renders student council vs general feed
   */
  async function loadAndRenderGossip() {
    let gossipData = null;

    const possibleGossipPaths = [
      'school_gossip_pool.json',
      'js/school_gossip_pool.json'
    ];

    for (const path of possibleGossipPaths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          gossipData = await response.json();
          break;
        }
      } catch (err) {
        // Continue searching next path
      }
    }

    if (!gossipData) {
      console.warn('[MYSTERY ENGINE] Gossip pool fetch unavailable. Using embedded gossip fallback.');
      gossipData = EMBEDDED_GOSSIP_POOL;
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const currentHour = now.getHours(); // 0 - 23
    const daySeed = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));

    // 1. RENDER STUDENT COUNCIL TAB FEED
    const councilContainer = document.getElementById('council-posts-container');
    if (councilContainer && gossipData.student_council_threads && gossipData.student_council_threads.length > 0) {
      const activeThread = gossipData.student_council_threads[daySeed % gossipData.student_council_threads.length];

      if (activeThread) {
        let threadHTML = `
          <article class="bbs-thread-card" style="margin-bottom: 24px;">
            <div class="thread-main-header">
              <span class="thread-tag dark">📋 [STUDENT COUNCIL OFFICIAL ANNOUNCEMENT]</span>
            </div>
            <div class="thread-replies-chain">
              <div class="bbs-post-reply npc-reply highlight">
                <div class="bbs-author">
                  <div class="avatar-icon-sm">${activeThread.notice.avatar_icon || '👑'}</div>
                  <div>
                    <strong>${escapeHTML(activeThread.notice.author)} <span class="npc-badge">${escapeHTML(activeThread.notice.author_badge || 'Student Council')}</span></strong>
                  </div>
                </div>
                <p class="post-content">"${escapeHTML(activeThread.notice.message)}"</p>
              </div>
        `;

        if (activeThread.replies) {
          threadHTML += activeThread.replies.map(reply => `
            <div class="bbs-post-reply">
              <div class="bbs-author">
                <div class="avatar-icon-sm">${reply.avatar_icon || '👤'}</div>
                <div>
                  <strong>${escapeHTML(reply.author)} <span class="user-badge-student">${escapeHTML(reply.author_badge || 'Student')}</span></strong>
                </div>
              </div>
              <p class="post-content">"${escapeHTML(reply.message)}"</p>
            </div>
          `).join('');
        }

        threadHTML += `</div></article>`;
        councilContainer.innerHTML = threadHTML;
      }
    }

    // 2. RENDER GOSSIP & CAMPUS LIFE FEED
    const gossipContainer = document.getElementById('gossip-posts-container');
    if (gossipContainer) {
      let gossipList = [];

      // Check for day-scheduled gossip pool
      if (gossipData.weekly_gossip) {
        const dayPosts = gossipData.weekly_gossip[String(currentDay)] || [];
        dayPosts.forEach(post => {
          const unlockHr = typeof post.unlock_hour === 'number' ? post.unlock_hour : 0;
          if (currentHour >= unlockHr) {
            gossipList.push({
              author: post.name || post.author,
              author_badge: post.badge || post.author_badge,
              avatar_icon: post.avatar || post.avatar_icon,
              message: post.text || post.message,
              post_time: post.post_time,
              category: post.category,
              is_npc: post.is_npc
            });
          }
        });

        // Add late night posts if past 10 PM or early morning
        if ((currentHour >= 22 || currentHour < 6) && gossipData.after_hours_gossip) {
          gossipData.after_hours_gossip.forEach(post => {
            const unlockHr = typeof post.unlock_hour === 'number' ? post.unlock_hour : 0;
            if (currentHour >= unlockHr || currentHour < 6) {
              gossipList.push({
                author: post.name || post.author,
                author_badge: post.badge || post.author_badge,
                avatar_icon: post.avatar || post.avatar_icon,
                message: post.text || post.message,
                post_time: post.post_time,
                category: post.category,
                is_npc: post.is_npc
              });
            }
          });
        }
      }

      // Fallback to legacy structure if weekly_gossip is not present
      if (gossipList.length === 0) {
        if (gossipData.general_gossip) gossipList = gossipList.concat(gossipData.general_gossip);
        if (gossipData.class_2a_corner) gossipList = gossipList.concat(gossipData.class_2a_corner);

        if (gossipData.daily_gossip_pool) {
          Object.values(gossipData.daily_gossip_pool).forEach(category => {
            if (Array.isArray(category)) gossipList = gossipList.concat(category);
          });
        }
      }

      if (gossipList.length > 0) {
        const gossipHTML = gossipList.map(post => {
          const avatarIcon = post.avatar_icon || post.avatar || '👤';
          const isCustomImage = String(avatarIcon).includes('/');
          const avatarMarkup = isCustomImage
            ? `<img src="${avatarIcon}" class="author-avatar-sm" alt="${escapeHTML(post.author || post.name)}" onerror="this.src='https://via.placeholder.com/36'">`
            : `<div class="avatar-icon-sm">${avatarIcon}</div>`;

          const timeStampStr = post.post_time ? `<div class="post-time">${escapeHTML(post.post_time)}</div>` : '';

          return `
            <div class="bbs-post-reply ${post.is_npc ? 'npc-reply highlight' : ''}" style="margin-bottom: 12px;">
              <div class="bbs-author">
                ${avatarMarkup}
                <div>
                  <strong>${escapeHTML(post.author || post.name)} <span class="${post.is_npc ? 'npc-badge' : 'user-badge-student'}">${escapeHTML(post.author_badge || post.badge || 'Student')}</span></strong>
                  ${timeStampStr}
                </div>
              </div>
              <p class="post-content">"${escapeHTML(post.message || post.text)}"</p>
            </div>
          `;
        }).join('');

        gossipContainer.innerHTML = `
          <article class="bbs-thread-card" style="margin-bottom: 24px;">
            <div class="thread-main-header">
              <span class="thread-tag dark">💬 [SAKURAOKA CAMPUS CHATTER & GOSSIP]</span>
            </div>
            <div class="thread-replies-chain">${gossipHTML}</div>
          </article>
        `;
      }
    }
  }

  /**
   * Helper: Extracts minute offset from post object
   */
  function getPostOffsetMins(post) {
    if (typeof post.offset_mins === 'number') {
      return post.offset_mins;
    }
    if (post.trigger_time) {
      const match = String(post.trigger_time).match(/Day\s*(\d+)\s*-\s*(\d{1,2}):(\d{2})/i);
      if (match) {
        const day = parseInt(match[1], 10) - 1;
        const hours = parseInt(match[2], 10);
        const mins = parseInt(match[3], 10);
        return (day * 24 * 60) + (hours * 60) + mins;
      }
    }
    return 0;
  }

  /**
   * Renders a single case thread into a target container
   */
  function renderCase(caseObj, weekStartMs, elapsedMins, containerId, isVIP) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const caseId = caseObj.case_id || caseObj.mystery_id || 'CASE-105';
    const title = caseObj.title || 'Active Mystery Case';
    const passcode = caseObj.required_passcode || caseObj.passcode_trigger || caseObj.passcode;
    const badge = caseObj.reward_badge || caseObj.badge_reward || 'Seven Wonders Sleuth';

    if (passcode) {
      const cleanPasscode = String(passcode).trim().toUpperCase();
      activeSolutions[cleanPasscode] = {
        caseId: caseId,
        title: title,
        badge: badge
      };
    }

    const timeline = caseObj.timeline || [];
    const unlockedPosts = timeline.filter(post => getPostOffsetMins(post) <= elapsedMins);

    if (unlockedPosts.length === 0) return;

    const existingDynamicCard = container.querySelector('.after-dark-glow');
    if (existingDynamicCard && existingDynamicCard.dataset.unlockedCount === String(unlockedPosts.length)) {
      return;
    }

    const postsHTML = unlockedPosts.map(post => {
      const offsetMins = getPostOffsetMins(post);
      const postDate = new Date(weekStartMs + (offsetMins * 60 * 1000));
      const avatarIcon = post.avatar_icon || '👤';
      const isCustomImage = String(avatarIcon).includes('/');

      const avatarMarkup = isCustomImage
        ? `<img src="${avatarIcon}" class="author-avatar-sm" alt="${escapeHTML(post.author)}" onerror="this.src='https://via.placeholder.com/36'">`
        : `<div class="avatar-icon-sm">${avatarIcon}</div>`;

      return `
        <div class="bbs-post-reply ${post.is_npc ? 'npc-reply highlight' : ''}">
          <div class="bbs-author">
            ${avatarMarkup}
            <div>
              <strong>${escapeHTML(post.author)} <span class="${post.is_npc ? 'npc-badge' : 'user-badge-student'}">${escapeHTML(post.author_badge || 'Student')}</span></strong>
              <div class="post-time">${formatRelativeTimestamp(postDate)}</div>
            </div>
          </div>
          <p class="post-content">"${escapeHTML(post.message)}"</p>
        </div>
      `;
    }).join('');

    const threadHTML = `
      <article class="bbs-thread-card after-dark-glow" data-category="${isVIP ? 'official' : 'afterdark'}" data-unlocked-count="${unlockedPosts.length}" style="margin-bottom: 24px;">
        <div class="thread-main-header">
          <span class="thread-tag dark">${isVIP ? '🔒 [VIP EXCLUSIVE CASE]' : '🌙 [ACTIVE WEEKLY CASE]'}</span>
          <h2 class="thread-title">${escapeHTML(title)}</h2>
          <span class="thread-meta">Case ID: <strong>${escapeHTML(caseId)}</strong> • Target Badge: <strong>${escapeHTML(badge)}</strong></span>
        </div>
        <div class="thread-replies-chain">${postsHTML}</div>
      </article>
    `;

    if (existingDynamicCard) {
      existingDynamicCard.remove();
    }
    container.insertAdjacentHTML('afterbegin', threadHTML);
  }

  /**
   * Unified Tab Navigation Handler (Handles active, active-tab, active-panel)
   */
  function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('[data-tab-target]');
    const tabPanels = document.querySelectorAll('.tab-panel, .bbs-tab-panel');

    if (tabButtons.length === 0) return;

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-tab-target');

        tabButtons.forEach(btn => btn.classList.remove('active', 'active-tab'));
        tabPanels.forEach(panel => panel.classList.remove('active', 'active-panel'));

        button.classList.add('active', 'active-tab');
        const activePanel = document.getElementById(targetId);
        if (activePanel) {
          activePanel.classList.add('active', 'active-panel');
        }
      });
    });
  }

  /**
   * Decoder Form & Passcode Verification
   */
  function setupDecoder() {
    const decoderForm = document.getElementById('decoder-form');
    const inputField = document.getElementById('passcode-input');
    const resultBox = document.getElementById('decoder-result');

    if (!decoderForm || !inputField || !resultBox) return;

    decoderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const userEnteredCode = inputField.value.trim().toUpperCase();

      if (!userEnteredCode) {
        resultBox.className = 'decoder-result-box error';
        resultBox.textContent = 'Please enter a passcode.';
        return;
      }

      // Check passcode vault without time/day restrictions
      if (activeSolutions[userEnteredCode] || userEnteredCode === "SUNSET_302" || userEnteredCode === "HARMONY_1994") {
        const solution = activeSolutions[userEnteredCode] || {
          title: "Case #105 — The Midnight Lullaby of Room 302",
          badge: "Seven Wonders Sleuth",
          caseId: "CASE-105"
        };

        // Save unlock status to LocalStorage
        const badgeData = {
          id: solution.caseId,
          name: solution.badge,
          icon: "🏆",
          unlockedAt: new Date().toISOString()
        };
        localStorage.setItem(`badge_${solution.caseId}`, JSON.stringify(badgeData));

        resultBox.className = 'decoder-result-box success';
        resultBox.innerHTML = `
          <strong>CLEARANCE GRANTED!</strong><br>
          Solved: <em>${escapeHTML(solution.title)}</em><br>
          Badge Earned: <strong>[${escapeHTML(solution.badge)}]</strong>
        `;
        inputField.value = '';

        if (typeof renderProfileBadges === 'function') {
          renderProfileBadges();
        }
      } else {
        resultBox.className = 'decoder-result-box error';
        resultBox.textContent = 'ACCESS DENIED: Invalid passcode sequence. Review the student posts in the BBS threads!';
      }
    });
  }

  /**
   * Helper: Formats Date objects into relative timestamps
   */
  function formatRelativeTimestamp(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedMin = minutes < 10 ? '0' + minutes : minutes;
    const timeStr = `${hours}:${formattedMin} ${ampm}`;

    if (diffHours >= 20 && diffHours < 48) {
      return `Yesterday at ${timeStr}`;
    } else if (diffHours < 20 && now.getDate() === date.getDate()) {
      return `Today at ${timeStr}`;
    } else {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${monthNames[date.getMonth()]} ${date.getDate()} • ${timeStr}`;
    }
  }

  /**
   * Helper: Sanitizes text to prevent XSS
   */
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEngine);
  } else {
    initEngine();
  }
})();
