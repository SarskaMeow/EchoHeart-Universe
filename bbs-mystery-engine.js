/**
 * Sakuraoka BBS Master Mystery Engine
 * Handles real-time post unlocking, automated epoch-based case rotation,
 * dual-track board rendering, tab switching, and passcode decoding.
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
        "mystery_id": "case_105_midnight_piano",
        "title": "Case #105 — The Midnight Piano in Room 302",
        "reward_badge": "Seven Wonders Sleuth",
        "required_passcode": "HARMONY_1994",
        "timeline": [
          /* ================= DAY 1 (MONDAY) ================= */
          { "offset_mins": 0, "author": "Yuki_Library", "author_badge": "Library Committee", "avatar_icon": "📚", "message": "I was returning reference books to the 3F archive after sunset. Room 302 was pitch dark, but I heard a soft piano melody coming from inside...", "is_npc": false },
          { "offset_mins": 45, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "@Yuki_Library Wait, Room 302? Isn't that the old music room that's been locked up all semester?", "is_npc": false },
          { "offset_mins": 450, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Good morning! Just finished morning lap practice. Walked past B-Wing and Room 302 is locked tight like usual.", "is_npc": false },
          { "offset_mins": 510, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "My homeroom is right below 302. During morning prep we didn't hear anything, but the windowsill light looked weird.", "is_npc": false },
          { "offset_mins": 615, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "Break time! Is this another one of those Seven Wonders of Sakuraoka urban legends starting up again?", "is_npc": false },
          { "offset_mins": 735, "author": "Bass_Sera", "author_badge": "Light Music Club", "avatar_icon": "assets/sera.jpeg", "message": "Lunch break update: We checked with the music teacher. The upright pianos were all moved to the B1 storage room last year!", "is_npc": true },
          { "offset_mins": 780, "author": "CatEars_Nekomi", "author_badge": "Light Music Club", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi checked Room 302 during lunch break! No piano inside at all, just stacked wooden desks! So where did the music come from?!", "is_npc": true },
          { "offset_mins": 915, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Maybe someone left a bluetooth speaker in there as a prank?", "is_npc": false },
          { "offset_mins": 990, "author": "Akari_M", "author_badge": "Mystery Club", "avatar_icon": "assets/akari.jpeg", "message": "Mystery Club is taking the case! If anyone hears the song again after 5 PM, post the exact time here on the BBS.", "is_npc": true },
          { "offset_mins": 1080, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "Sunset just started. Setting up the telescope in the science room across the courtyard.", "is_npc": false },
          { "offset_mins": 1155, "author": "Yuki_Library", "author_badge": "Library Committee", "avatar_icon": "📚", "message": "I hear it again right now!! It's a slow lullaby tune playing in 3/4 time signature!", "is_npc": false },
          { "offset_mins": 1230, "author": "Bass_Sera", "author_badge": "Light Music Club", "avatar_icon": "assets/sera.jpeg", "message": "We're down in our rehearsal room and we can hear the faint echo too. Pitch is tuned to classic grand piano resonance.", "is_npc": true },
          { "offset_mins": 1305, "author": "Aoi_Pres", "author_badge": "Student Council", "avatar_icon": "assets/aoi.jpeg", "message": "Reminder from Student Council: Please do not loiter near the 3F B-Wing hallway after evening curfew.", "is_npc": true },
          { "offset_mins": 1380, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "Late night check... the school courtyard is pitch black. Super eerie vibe tonight.", "is_npc": false },
          { "offset_mins": 1425, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Day 1 report logged. Mystery Club is investigating tomorrow morning!", "is_npc": false },

          /* ================= DAY 2 (TUESDAY) ================= */
          { "offset_mins": 1485, "author": "Anon_Sleuth", "author_badge": "Class 3-C", "avatar_icon": "🕵️", "message": "Midnight check on the BBS... anyone else unable to sleep thinking about Room 302?", "is_npc": false },
          { "offset_mins": 1890, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Day 2 morning run complete. The staff room key box for Room 302 was checked—no one checked out the key yesterday.", "is_npc": false },
          { "offset_mins": 1950, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "So if the key was never checked out, how did anyone get inside to play music?", "is_npc": false },
          { "offset_mins": 2055, "author": "Hina_Class1A", "author_badge": "Class 1-A", "avatar_icon": "🌸", "message": "My senior told me there used to be a famous piano prodigy student at Sakuraoka High back in the 1990s!", "is_npc": false },
          { "offset_mins": 2175, "author": "Akari_M", "author_badge": "Mystery Club", "avatar_icon": "assets/akari.jpeg", "message": "Great clue @Hina_Class1A! Library Committee is helping us search the old school archives during lunch hour.", "is_npc": true },
          { "offset_mins": 2220, "author": "Yuki_Library", "author_badge": "Library Committee", "avatar_icon": "📚", "message": "We found old graduation albums from 1990 to 1998 on the archive shelf!", "is_npc": false },
          { "offset_mins": 2355, "author": "CatEars_Nekomi", "author_badge": "Light Music Club", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi found a sheet music notebook tucked behind the 1994 yearbook! It has handwritten notes in the margins!", "is_npc": true },
          { "offset_mins": 2430, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "Ooh, a mystery from 1994?! What do the notes say?!", "is_npc": false },
          { "offset_mins": 2520, "author": "Bass_Sera", "author_badge": "Light Music Club", "avatar_icon": "assets/sera.jpeg", "message": "The notes list a specific song title: 'Sunset Harmony'. The music club used to perform it at the culture festival.", "is_npc": true },
          { "offset_mins": 2595, "author": "Daiki_Pres", "author_badge": "Student Council", "avatar_icon": "📋", "message": "Student Council note: Archives must be kept orderly. Please return all 1990s yearbooks to box #4.", "is_npc": true },
          { "offset_mins": 2670, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "6:30 PM: I can see a faint reflection in Room 302's window again tonight.", "is_npc": false },
          { "offset_mins": 2745, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Just walked under 302 leaving gym practice. The piano melody is definitely playing right now!", "is_npc": false },
          { "offset_mins": 2820, "author": "Akari_M", "author_badge": "Mystery Club", "avatar_icon": "assets/akari.jpeg", "message": "It starts every day right as the sun finishes setting. Keep tracking the clues everyone!", "is_npc": true },
          { "offset_mins": 2865, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "Listening to the melody from the courtyard bench... it actually sounds really pretty, not scary at all.", "is_npc": false },

          /* ================= DAY 3 (WEDNESDAY) ================= */
          { "offset_mins": 2925, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Day 3 begins! Mid-week mystery updates loading...", "is_npc": false },
          { "offset_mins": 3330, "author": "Yuki_Library", "author_badge": "Library Committee", "avatar_icon": "📚", "message": "Good morning! I examined the 1994 yearbook sheet music again under a magnifying glass.", "is_npc": false },
          { "offset_mins": 3390, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Find anything interesting @Yuki_Library?", "is_npc": false },
          { "offset_mins": 3495, "author": "CatEars_Nekomi", "author_badge": "Light Music Club", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi found a keyword stamped on the corner of the music sheet! The word is: SIGNAL!", "is_npc": true },
          { "offset_mins": 3615, "author": "Akari_M", "author_badge": "Mystery Club", "avatar_icon": "assets/akari.jpeg", "message": "CLUE UPDATE: 'SIGNAL' is word 1! Check Neko FM's radio ticker during lunch break for word 2!", "is_npc": true },
          { "offset_mins": 3660, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "Tuned into Neko FM right now during lunch! The broadcast ticker says: 'Search the 1994 graduation album page 32!'", "is_npc": false },
          { "offset_mins": 3795, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "Heading to the library archive on 3F right now to check page 32!", "is_npc": false },
          { "offset_mins": 3870, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "The whole class is invested in this now haha! Drama club is watching the BBS updates live!", "is_npc": false },
          { "offset_mins": 3960, "author": "Yuki_Library", "author_badge": "Library Committee", "avatar_icon": "📚", "message": "FOUND IT! Page 32 shows a photo of the 1994 Music Club holding a banner that says 'HARMONY'!", "is_npc": false },
          { "offset_mins": 4035, "author": "Bass_Sera", "author_badge": "Light Music Club", "avatar_icon": "assets/sera.jpeg", "message": "So 'HARMONY' is a core clue word! We're getting closer to solving the mystery passcode!", "is_npc": true },
          { "offset_mins": 4110, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "5:45 PM: Room 302's window light just clicked on again. The piano music has started!", "is_npc": false },
          { "offset_mins": 4185, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Stood right outside Room 302 door just now... you can hear faint mechanical gears ticking inside along with the music!", "is_npc": false },
          { "offset_mins": 4260, "author": "Akari_M", "author_badge": "Mystery Club", "avatar_icon": "assets/akari.jpeg", "message": "Mechanical gears?! That means it might not be a ghost or live player at all!", "is_npc": true },
          { "offset_mins": 4305, "author": "Anon_Sleuth", "author_badge": "Class 3-C", "avatar_icon": "🕵️", "message": "A mechanical device inside a locked room playing every sunset? Interesting...", "is_npc": false },

          /* ================= DAY 4 (THURSDAY) ================= */
          { "offset_mins": 4365, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Day 4 overnight check! Let's solve this before the weekend!", "is_npc": false },
          { "offset_mins": 4770, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Thursday morning! Track team is doing bleacher runs. B-Wing looks peaceful today.", "is_npc": false },
          { "offset_mins": 4830, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "@Kenji_Gym said he heard gears ticking inside yesterday... could it be an old wind-up music box?", "is_npc": false },
          { "offset_mins": 4935, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "A giant wind-up music box left inside Room 302 since 1994?! That would be super romantic!", "is_npc": false },
          { "offset_mins": 5055, "author": "CatEars_Nekomi", "author_badge": "Light Music Club", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi asked the veteran custodian officer! He remembers a wooden grandfather clock music box in Room 302 back in the 90s!", "is_npc": true },
          { "offset_mins": 5100, "author": "Bass_Sera", "author_badge": "Light Music Club", "avatar_icon": "assets/sera.jpeg", "message": "He said the clock mechanism was set to activate whenever ambient sunlight hit the solar sensor on the windowsill!", "is_npc": true },
          { "offset_mins": 5235, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "WHOA!! So whenever the sunset hits the window at 5:45 PM, the light triggers the music box to play!!", "is_npc": false },
          { "offset_mins": 5310, "author": "Yuki_Library", "author_badge": "Library Committee", "avatar_icon": "📚", "message": "That explains why it plays every single day at sunset like clockwork!", "is_npc": false },
          { "offset_mins": 5400, "author": "Daiki_Pres", "author_badge": "Student Council", "avatar_icon": "📋", "message": "Student Council confirmation: A custodian has verified the antique solar music box on the Room 302 shelf.", "is_npc": true },
          { "offset_mins": 5475, "author": "Akari_M", "author_badge": "Mystery Club", "avatar_icon": "assets/akari.jpeg", "message": "We know HOW it works now! Now we just need to decode the full passcode combination to log the case solution!", "is_npc": true },
          { "offset_mins": 5550, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "5:45 PM: Sunset light hit the window, music box started playing on schedule!", "is_npc": false },
          { "offset_mins": 5625, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Man, mystery solved almost! Sakuraoka High history is pretty cool.", "is_npc": false },
          { "offset_mins": 5700, "author": "Hina_Class1A", "author_badge": "Class 1-A", "avatar_icon": "🌸", "message": "So what is the exact passcode format for the Mystery Decoder tab?", "is_npc": false },
          { "offset_mins": 5745, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Combine the music clue + graduation year! Try entering it on Friday!", "is_npc": false },

          /* ================= DAY 5 (FRIDAY) ================= */
          { "offset_mins": 5805, "author": "Anon_Sleuth", "author_badge": "Class 3-C", "avatar_icon": "🕵️", "message": "Friday is here! Let's complete the passcode formula!", "is_npc": false },
          { "offset_mins": 6210, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Morning practice! Everyone's talking about the Room 302 solar music box today.", "is_npc": false },
          { "offset_mins": 6270, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "We have two main clues: The sheet music keyword 'HARMONY' and the graduation year '1994'.", "is_npc": false },
          { "offset_mins": 6375, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "Combine them with an underscore! Like HARMONY_1994!", "is_npc": false },
          { "offset_mins": 6495, "author": "CatEars_Nekomi", "author_badge": "Light Music Club", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi tested the passcode formula! Check the Mystery Decoder tab in the top navigation bar!", "is_npc": true },
          { "offset_mins": 6540, "author": "Akari_M", "author_badge": "Mystery Club", "avatar_icon": "assets/akari.jpeg", "message": "INSTRUCTIONS: Go to the 'Mystery Decoder' tab, type in HARMONY_1994, and hit submit to claim your badge!", "is_npc": true },
          { "offset_mins": 6675, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "IT WORKED!! 'CLEARANCE GRANTED! Solved: Case #105 — Badge: Seven Wonders Sleuth'!!", "is_npc": false },
          { "offset_mins": 6750, "author": "Yuki_Library", "author_badge": "Library Committee", "avatar_icon": "📚", "message": "I entered it too! Got the Seven Wonders Sleuth badge added to my profile!", "is_npc": false },
          { "offset_mins": 6840, "author": "Bass_Sera", "author_badge": "Light Music Club", "avatar_icon": "assets/sera.jpeg", "message": "Awesome job everyone! Light Music Club is going to perform a modern cover of 'Sunset Harmony' at the culture fest!", "is_npc": true },
          { "offset_mins": 6915, "author": "Aoi_Pres", "author_badge": "Student Council", "avatar_icon": "assets/aoi.jpeg", "message": "Official Student Council update: The 1994 solar music box in Room 302 will remain preserved as a school heritage piece.", "is_npc": true },
          { "offset_mins": 6990, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "5:45 PM: Watching the sunset play its final song of the school week.", "is_npc": false },
          { "offset_mins": 7065, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Best mystery case of the term! Everyone have a great weekend!", "is_npc": false },
          { "offset_mins": 7140, "author": "Hina_Class1A", "author_badge": "Class 1-A", "avatar_icon": "🌸", "message": "Heading home for the weekend! Thanks Mystery Club!", "is_npc": false },
          { "offset_mins": 7185, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Case #105 officially solved on Friday evening. Weekend recap coming up!", "is_npc": false },

          /* ================= DAY 6 (SATURDAY) ================= */
          { "offset_mins": 7245, "author": "Anon_Sleuth", "author_badge": "Class 3-C", "avatar_icon": "🕵️", "message": "Saturday morning BBS lounge check. Case #105 victory lap!", "is_npc": false },
          { "offset_mins": 7650, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "Listening to Neko FM Saturday morning stream while doing homework.", "is_npc": false },
          { "offset_mins": 7710, "author": "Yuki_Library", "author_badge": "Library Committee", "avatar_icon": "📚", "message": "Logged into the BBS from home! Loved how everyone worked together on this mystery.", "is_npc": false },
          { "offset_mins": 7815, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Saturday morning club practice done. Campus is super quiet today.", "is_npc": false },
          { "offset_mins": 7935, "author": "CatEars_Nekomi", "author_badge": "Light Music Club", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi and Sera are practicing the 'Sunset Harmony' cover in the band room right now!", "is_npc": true },
          { "offset_mins": 7980, "author": "Bass_Sera", "author_badge": "Light Music Club", "avatar_icon": "assets/sera.jpeg", "message": "We added a synth baseline to match Neko FM's weekend vibe!", "is_npc": true },
          { "offset_mins": 8115, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "Can't wait to hear the song at the Culture Festival!", "is_npc": false },
          { "offset_mins": 8190, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "Anyone who missed the case during the week can still enter HARMONY_1994 in the Decoder tab!", "is_npc": false },
          { "offset_mins": 8280, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "Clear skies expected for stargazing tonight!", "is_npc": false },
          { "offset_mins": 8355, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Relaxing Saturday afternoon. Sakuraoka BBS is the best place to chill.", "is_npc": false },
          { "offset_mins": 8430, "author": "Akari_M", "author_badge": "Mystery Club", "avatar_icon": "assets/akari.jpeg", "message": "Mystery Club is prepping file archives for next week's rotation case!", "is_npc": true },
          { "offset_mins": 8505, "author": "Daiki_Pres", "author_badge": "Student Council", "avatar_icon": "📋", "message": "Have a restful weekend everyone!", "is_npc": true },
          { "offset_mins": 8580, "author": "Hina_Class1A", "author_badge": "Class 1-A", "avatar_icon": "🌸", "message": "Wearing my new 'Seven Wonders Sleuth' badge on my profile!", "is_npc": false },
          { "offset_mins": 8625, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Saturday night late chatter signing off.", "is_npc": false },

          /* ================= DAY 7 (SUNDAY) ================= */
          { "offset_mins": 8685, "author": "Anon_Sleuth", "author_badge": "Class 3-C", "avatar_icon": "🕵️", "message": "Sunday morning! Last day of Case #105 cycle before weekly reset!", "is_npc": false },
          { "offset_mins": 9090, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "Finishing up Sunday homework before tomorrow morning.", "is_npc": false },
          { "offset_mins": 9150, "author": "Yuki_Library", "author_badge": "Library Committee", "avatar_icon": "📚", "message": "Sunday reminder: Return all borrowed 1990s yearbooks tomorrow morning!", "is_npc": false },
          { "offset_mins": 9255, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Rest day for the track team. Ready for Monday laps!", "is_npc": false },
          { "offset_mins": 9375, "author": "CatEars_Nekomi", "author_badge": "Light Music Club", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi finished polishing the band arrangement for tomorrow's rehearsal!", "is_npc": true },
          { "offset_mins": 9420, "author": "Bass_Sera", "author_badge": "Light Music Club", "avatar_icon": "assets/sera.jpeg", "message": "Recorded a mini snippet for Neko FM Sunday night broadcast!", "is_npc": true },
          { "offset_mins": 9555, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "So glad Room 302's mystery turned out to be such a nice school story.", "is_npc": false },
          { "offset_mins": 9630, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "Packing my school bag for Monday morning!", "is_npc": false },
          { "offset_mins": 9720, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "Sunday dusk: Room 302 music box playing its final weekend melody.", "is_npc": false },
          { "offset_mins": 9795, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Ready for Monday morning gym class!", "is_npc": false },
          { "offset_mins": 9870, "author": "Akari_M", "author_badge": "Mystery Club", "avatar_icon": "assets/akari.jpeg", "message": "[CASE #105 FINAL RESOLUTION REPORT] Mystery solved! The solar music box of Room 302 remains a Sakuraoka legend.", "is_npc": true },
          { "offset_mins": 9945, "author": "Aoi_Pres", "author_badge": "Student Council", "avatar_icon": "assets/aoi.jpeg", "message": "Thank you to the Mystery Club and all participating students.", "is_npc": true },
          { "offset_mins": 10020, "author": "Hina_Class1A", "author_badge": "Class 1-A", "avatar_icon": "🌸", "message": "Goodnight everyone! See you at school tomorrow!", "is_npc": false },
          { "offset_mins": 10065, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Weekly cycle complete. Case #105 mystery archivism locked.", "is_npc": false }
        ]
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
            "author": "Aoi_Pres",
            "author_badge": "Student Council",
            "avatar_icon": "assets/aoi.jpeg",
            "message": "Notice: The door to the rooftop staircase remains locked after 5:00 PM for all students.",
            "is_npc": true
          },
          {
            "offset_mins": 360,
            "author": "Akari_M",
            "author_badge": "Mystery Club",
            "avatar_icon": "assets/akari.jpeg",
            "message": "Someone left a handwritten note on the rooftop keyhook in the staff room...",
            "is_npc": true
          }
        ]
      }
    ]
  };

  /**
   * Main Initialization
   */
  async function initEngine() {
    setupTabNavigation();
    setupDecoder();
    await loadAndRenderCases();

    // Poll every 30 seconds to reveal new posts as time progresses
    setInterval(loadAndRenderCases, 30000);
  }

  /**
   * Fetches JSON catalog or falls back to embedded catalog
   */
  async function loadAndRenderCases() {
    let catalog = null;

    try {
      const response = await fetch('case_105_schedule.json');
      if (response.ok) {
        catalog = await response.json();
      }
    } catch (err) {
      console.warn('[MYSTERY ENGINE] Fetch unavailable or blocked by CORS. Using embedded catalog fallback.');
    }

    if (!catalog) {
      catalog = EMBEDDED_CATALOG;
    }

    const epochMs = new Date(catalog.epoch_start_iso || '2026-10-12T00:00:00Z').getTime();
    const nowMs = Date.now();

    // Calculate current week index relative to epoch
    const weekIndex = Math.max(0, Math.floor((nowMs - epochMs) / MS_PER_WEEK));

    // Calculate start timestamp (Monday 00:00:00 UTC) of current week cycle
    const currentWeekStartMs = epochMs + (weekIndex * MS_PER_WEEK);
    const elapsedMinsInCurrentWeek = Math.floor((nowMs - currentWeekStartMs) / 60000);

    // Support multi-case pools and flat single-case JSONs
    const freePool = catalog.free_cases_pool || (catalog.timeline ? [catalog] : []);
    const vipPool = catalog.vip_cases_pool || [];

    const activeFreeCase = freePool.length > 0 ? freePool[weekIndex % freePool.length] : null;
    const activeVipCase = vipPool.length > 0 ? vipPool[weekIndex % vipPool.length] : null;

    // Render Free Board
    if (activeFreeCase) {
      renderCase(activeFreeCase, currentWeekStartMs, elapsedMinsInCurrentWeek, 'bbs-posts-container', false);
    }

    // Render VIP Board
    if (activeVipCase) {
      renderCase(activeVipCase, currentWeekStartMs, elapsedMinsInCurrentWeek, 'vip-posts-container', true);
    }
  }

  /**
   * Helper: Extracts minute offset from post object (supports offset_mins or "Day X - HH:MM" strings)
   */
  function getPostOffsetMins(post) {
    if (typeof post.offset_mins === 'number') {
      return post.offset_mins;
    }
    if (post.trigger_time) {
      const match = String(post.trigger_time).match(/Day\s*(\d+)\s*-\s*(\d{1,2}):(\d{2})/i);
      if (match) {
        const day = parseInt(match[1], 10) - 1; // Day 1 = 0 days elapsed
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

    // Normalize property keys for both catalog & legacy formats
    const caseId = caseObj.case_id || caseObj.mystery_id || 'CASE-105';
    const title = caseObj.title || 'Active Mystery Case';
    const passcode = caseObj.required_passcode || caseObj.passcode_trigger;
    const badge = caseObj.reward_badge || caseObj.badge_reward || 'Seven Wonders Sleuth';

    // Register passcode into solution vault
    if (passcode) {
      const cleanPasscode = String(passcode).trim().toUpperCase();
      activeSolutions[cleanPasscode] = {
        caseId: caseId,
        title: title,
        badge: badge
      };
    }

    // GATING GUARD: Only allow posts whose calculated minute offset is <= elapsed time
    const timeline = caseObj.timeline || [];
    const unlockedPosts = timeline.filter(post => getPostOffsetMins(post) <= elapsedMins);

    if (unlockedPosts.length === 0) return;

    // CHAT PRESERVATION GUARD:
    // If card already exists and unlocked post count hasn't changed, DO NOT re-render.
    const existingDynamicCard = container.querySelector('.after-dark-glow');
    if (existingDynamicCard && existingDynamicCard.dataset.unlockedCount === String(unlockedPosts.length)) {
      return;
    }

    // Build reply posts HTML
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

    // Wrap in main thread article card
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

    // Remove old card if new posts unlocked, then prepend updated card
    if (existingDynamicCard) {
      existingDynamicCard.remove();
    }
    container.insertAdjacentHTML('afterbegin', threadHTML);
  }

  /**
   * Tab Navigation Handler
   */
  function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('[data-tab-target]');
    const tabPanels = document.querySelectorAll('.bbs-tab-panel');

    if (tabButtons.length === 0) return;

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-tab-target');

        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));

        button.classList.add('active');
        const activePanel = document.getElementById(targetId);
        if (activePanel) {
          activePanel.classList.add('active');
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

      if (activeSolutions[userEnteredCode]) {
        const solution = activeSolutions[userEnteredCode];
        resultBox.className = 'decoder-result-box success';
        resultBox.innerHTML = `
          <strong>CLEARANCE GRANTED!</strong><br>
          Solved: <em>${escapeHTML(solution.title)}</em><br>
          Badge Earned: <strong>[${escapeHTML(solution.badge)}]</strong>
        `;
        inputField.value = '';
      } else {
        resultBox.className = 'decoder-result-box error';
        resultBox.textContent = 'ACCESS DENIED: Invalid passcode or frequency out of range.';
      }
    });
  }

  /**
   * Helper: Formats Date objects into relative timestamps ("Today at...", "Yesterday at...")
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

  // Run engine when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEngine);
  } else {
    initEngine();
  }
})();
