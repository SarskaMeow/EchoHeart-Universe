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
        "mystery_id": "case_105_midnight_piano",
        "title": "Case #105 — The Midnight Lullaby of Room 302",
        "reward_badge": "Seven Wonders Sleuth",
        "required_passcode": "HARMONY_1994",
        "timeline": [
          /* ================= DAY 1 (MONDAY) ================= */
          { "offset_mins": 0, "author": "Yuki_Library", "author_badge": "Library Committee", "avatar_icon": "📚", "message": "I was walking down the 3F B-Wing hallway after sunset. Room 302 was pitch dark, but I heard a soft piano melody coming from inside...", "is_npc": false },
          { "offset_mins": 45, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "@Yuki_Library Wait, Room 302? Isn't that the old music practice room that's been locked all term?", "is_npc": false },
          { "offset_mins": 450, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Good morning! Just finished morning lap practice. Walked past B-Wing and Room 302 is locked tight like usual.", "is_npc": false },
          { "offset_mins": 510, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "Class 2-A homeroom is right below 302. During morning prep we didn't hear anything, but the sunset yesterday looked super pretty against the window.", "is_npc": false },
          { "offset_mins": 615, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "Break time! Is this another one of those Seven Wonders of Sakuraoka urban legends starting up again?", "is_npc": false },
          { "offset_mins": 735, "author": "Bass_Sera", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/sera.jpeg", "message": "Lunch break update: Me and Nekomi checked with our music teacher. The upright pianos were all moved down to the B1 storage room last term!", "is_npc": true },
          { "offset_mins": 780, "author": "CatEars_Nekomi", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi peered through Room 302's door window during lunch break! No piano inside at all, just stacked wooden desks! So where is the music coming from?!", "is_npc": true },
          { "offset_mins": 915, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Maybe someone left a radio in there playing a prank on us?", "is_npc": false },
          { "offset_mins": 990, "author": "Akari_M", "author_badge": "Class 2-A", "avatar_icon": "assets/akari.jpeg", "message": "Our Class 2-A group is on the case! If anyone hears the song again after 5 PM, post the exact time here on the BBS.", "is_npc": true },
          { "offset_mins": 1080, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "Sunset just started. Setting up the telescope in the science room across the courtyard.", "is_npc": false },
          { "offset_mins": 1155, "author": "Aoi", "author_badge": "Class 2-A", "avatar_icon": "assets/aoi.jpeg", "message": "I hear it right now from the courtyard! It's a sweet lullaby tune playing right as the orange sunset hits Room 302's window!", "is_npc": true },
          { "offset_mins": 1230, "author": "Bass_Sera", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/sera.jpeg", "message": "We're down in our rehearsal room and we can hear the faint melody echo through the courtyard too!", "is_npc": true },
          { "offset_mins": 1305, "author": "Pres_Haruka", "author_badge": "Student Council Pres", "avatar_icon": "👑", "message": "Student Council Notice: Please do not loiter near the 3F B-Wing hallway after evening curfew.", "is_npc": true },
          { "offset_mins": 1380, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "Late night check... the school courtyard is pitch black. Super cozy vibe tonight.", "is_npc": false },
          { "offset_mins": 1425, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Day 1 report logged. More investigations tomorrow morning!", "is_npc": false },

          /* ================= DAY 2 (TUESDAY) ================= */
          { "offset_mins": 1485, "author": "Anon_Sleuth", "author_badge": "Class 3-C", "avatar_icon": "🕵️", "message": "Midnight check on the BBS... anyone else unable to sleep thinking about Room 302?", "is_npc": false },
          { "offset_mins": 1890, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Day 2 morning run complete. The staff room key box for Room 302 was checked—no student has borrowed the key all week.", "is_npc": false },
          { "offset_mins": 1950, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "So if the key was never checked out, how did anyone get inside to make music?", "is_npc": false },
          { "offset_mins": 2055, "author": "Hina_Class1A", "author_badge": "Class 1-A", "avatar_icon": "🌸", "message": "My senior told me there used to be a student band performance tradition at Sakuraoka High back in the 1990s!", "is_npc": false },
          { "offset_mins": 2175, "author": "Akari_M", "author_badge": "Class 2-A", "avatar_icon": "assets/akari.jpeg", "message": "Great clue @Hina_Class1A! Me and Aoi are going to check the old event posters along the 3F B-Wing notice board during lunch.", "is_npc": true },
          { "offset_mins": 2220, "author": "Aoi", "author_badge": "Class 2-A", "avatar_icon": "assets/aoi.jpeg", "message": "I found a framed vintage Culture Festival poster on the 3F wall! It's dated from the 1994 school year!", "is_npc": true },
          { "offset_mins": 2355, "author": "CatEars_Nekomi", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi checked our Light Music rehearsal locker during lunch break! We have equipment cases from 1994 stored in the back!", "is_npc": true },
          { "offset_mins": 2430, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "Ooh, vintage gear from 1994?! Did you find anything inside?", "is_npc": false },
          { "offset_mins": 2520, "author": "Bass_Sera", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/sera.jpeg", "message": "There's an old setlist card tucked inside one of the bass cases! It lists the 1994 finale song!", "is_npc": true },
          { "offset_mins": 2595, "author": "VP_Chiaki", "author_badge": "Student Council VP", "avatar_icon": "📋", "message": "Student Council note: Please make sure all clubroom storage lockers are kept tidy after use.", "is_npc": true },
          { "offset_mins": 2670, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "6:30 PM: I can see the warm orange sunset reflecting in Room 302's window again tonight.", "is_npc": false },
          { "offset_mins": 2745, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Just walked under 302 leaving gym practice. The piano lullaby is definitely playing right now!", "is_npc": false },
          { "offset_mins": 2820, "author": "Akari_M", "author_badge": "Class 2-A", "avatar_icon": "assets/akari.jpeg", "message": "It starts every day right as the sunset fills the B-Wing corridor. Keep tracking the clues everyone!", "is_npc": true },
          { "offset_mins": 2865, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "Listening to the melody from the courtyard bench... it sounds so warm and nostalgic.", "is_npc": false },

          /* ================= DAY 3 (WEDNESDAY) ================= */
          { "offset_mins": 2925, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Day 3 begins! Mid-week mystery updates loading...", "is_npc": false },
          { "offset_mins": 3330, "author": "Aoi", "author_badge": "Class 2-A", "avatar_icon": "assets/aoi.jpeg", "message": "Good morning! @Bass_Sera what was written on that 1994 setlist card you found yesterday?", "is_npc": true },
          { "offset_mins": 3390, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Yeah, spill the details! Track team wants to know!", "is_npc": false },
          { "offset_mins": 3495, "author": "CatEars_Nekomi", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi read the handwritten setlist card! The title of the 1994 song is 'HARMONY'!", "is_npc": true },
          { "offset_mins": 3615, "author": "Akari_M", "author_badge": "Class 2-A", "avatar_icon": "assets/akari.jpeg", "message": "CLUE UPDATE: 'HARMONY' is the main mystery keyword! Combine it with the 1994 festival year code!", "is_npc": true },
          { "offset_mins": 3660, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "Tuned into Neko FM right now during lunch! The radio ticker just mentioned '1994 Sunset Hits'!", "is_npc": false },
          { "offset_mins": 3795, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "So combining the setlist keyword and the year gives us the passcode formula!", "is_npc": false },
          { "offset_mins": 3870, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "Class 2-A is solving this so fast haha! Drama club is watching the BBS live!", "is_npc": false },
          { "offset_mins": 3960, "author": "Aoi", "author_badge": "Class 2-A", "avatar_icon": "assets/aoi.jpeg", "message": "So HARMONY + 1994 is definitely our core passcode combination!", "is_npc": true },
          { "offset_mins": 4035, "author": "Bass_Sera", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/sera.jpeg", "message": "We're so close to unlocking the Mystery Decoder tab with the full passcode!", "is_npc": true },
          { "offset_mins": 4110, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "5:45 PM: Sunset hit Room 302's window glass again. The music has started right on time!", "is_npc": false },
          { "offset_mins": 4185, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Stood outside Room 302 door just now... you can hear a tiny chime clicking inside as the song plays!", "is_npc": false },
          { "offset_mins": 4260, "author": "Akari_M", "author_badge": "Class 2-A", "avatar_icon": "assets/akari.jpeg", "message": "A chime?! That means it's an object sitting on the windowsill inside, not a ghost!", "is_npc": true },
          { "offset_mins": 4305, "author": "Anon_Sleuth", "author_badge": "Class 3-C", "avatar_icon": "🕵️", "message": "An object playing music on the windowsill every evening? We're finding out tomorrow!", "is_npc": false },

          /* ================= DAY 4 (THURSDAY) ================= */
          { "offset_mins": 4365, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Day 4 overnight check! Let's solve this before Friday!", "is_npc": false },
          { "offset_mins": 4770, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Thursday morning! Track team is running bleacher laps. B-Wing looks beautiful in the morning light.", "is_npc": false },
          { "offset_mins": 4830, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "@Kenji_Gym said he heard a chime yesterday... could it be an old wind-up music box sitting in the room?", "is_npc": false },
          { "offset_mins": 4935, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "An antique wind-up music box left inside Room 302 since 1994?! That is super sweet!", "is_npc": false },
          { "offset_mins": 5055, "author": "CatEars_Nekomi", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi asked the veteran school custodian! He remembers a wooden piano music box sitting on Room 302's windowsill!", "is_npc": true },
          { "offset_mins": 5100, "author": "Bass_Sera", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/sera.jpeg", "message": "He said he winds it up every Monday morning before school starts so it plays a sunset melody all week long for the students!", "is_npc": true },
          { "offset_mins": 5235, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "AWH WOW!! The custodian has been keeping the 1994 music box playing as a tradition this whole time!!", "is_npc": false },
          { "offset_mins": 5310, "author": "Aoi", "author_badge": "Class 2-A", "avatar_icon": "assets/aoi.jpeg", "message": "That is the sweetest story ever! That's why it plays every single day at sunset!", "is_npc": true },
          { "offset_mins": 5400, "author": "Pres_Haruka", "author_badge": "Student Council Pres", "avatar_icon": "👑", "message": "Student Council confirmation: The 1994 music box is a preserved piece of Sakuraoka High culture.", "is_npc": true },
          { "offset_mins": 5475, "author": "Akari_M", "author_badge": "Class 2-A", "avatar_icon": "assets/akari.jpeg", "message": "Mystery solved! Enter the keyword HARMONY_1994 into the Mystery Decoder tab to claim your badge!", "is_npc": true },
          { "offset_mins": 5550, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "5:45 PM: Sunset hit the window, and the little music box played its song on schedule!", "is_npc": false },
          { "offset_mins": 5625, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Sakuraoka High traditions are pretty amazing.", "is_npc": false },
          { "offset_mins": 5700, "author": "Hina_Class1A", "author_badge": "Class 1-A", "avatar_icon": "🌸", "message": "Heading to the Mystery Decoder tab right now to claim my badge!", "is_npc": false },
          { "offset_mins": 5745, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Passcode verified: HARMONY_1994! Get ready for Friday celebration!", "is_npc": false },

          /* ================= DAY 5 (FRIDAY) ================= */
          { "offset_mins": 5805, "author": "Anon_Sleuth", "author_badge": "Class 3-C", "avatar_icon": "🕵️", "message": "Friday morning on the BBS! Claim your Seven Wonders Sleuth badge today!", "is_npc": false },
          { "offset_mins": 6210, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Morning practice! Everyone in the halls is talking about the Room 302 music box today.", "is_npc": false },
          { "offset_mins": 6270, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "Enter HARMONY_1994 into the Mystery Decoder tab in the top navigation bar!", "is_npc": false },
          { "offset_mins": 6375, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "I entered it! Got the Seven Wonders Sleuth badge added to my profile!", "is_npc": false },
          { "offset_mins": 6495, "author": "CatEars_Nekomi", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi and Sera are going to perform 'Sunset Harmony' live at the Culture Festival!", "is_npc": true },
          { "offset_mins": 6540, "author": "Akari_M", "author_badge": "Class 2-A", "avatar_icon": "assets/akari.jpeg", "message": "CASE COMPLETE! Thank you to everyone who helped investigate the 3F B-Wing hallway!", "is_npc": true },
          { "offset_mins": 6675, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "Got my new badge unlocked!! 'Seven Wonders Sleuth' looks so cool on my handle!", "is_npc": false },
          { "offset_mins": 6750, "author": "Aoi", "author_badge": "Class 2-A", "avatar_icon": "assets/aoi.jpeg", "message": "Loved working on this mystery with everyone in Class 2-A this week!", "is_npc": true },
          { "offset_mins": 6840, "author": "Bass_Sera", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/sera.jpeg", "message": "Light Music Club is starting band practice for the culture fest cover track right now!", "is_npc": true },
          { "offset_mins": 6915, "author": "Pres_Haruka", "author_badge": "Student Council Pres", "avatar_icon": "👑", "message": "Official Student Council update: Room 302's music box will remain a protected school treasure.", "is_npc": true },
          { "offset_mins": 6990, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "5:45 PM: Watching the Friday sunset while listening to the music box one last time this school week.", "is_npc": false },
          { "offset_mins": 7065, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Best mystery of the term! Have a great weekend everyone!", "is_npc": false },
          { "offset_mins": 7140, "author": "Hina_Class1A", "author_badge": "Class 1-A", "avatar_icon": "🌸", "message": "Heading home for the weekend! Thanks Class 2-A!", "is_npc": false },
          { "offset_mins": 7185, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Case #105 officially solved on Friday evening. Weekend lounge open!", "is_npc": false },

          /* ================= DAY 6 (SATURDAY) ================= */
          { "offset_mins": 7245, "author": "Anon_Sleuth", "author_badge": "Class 3-C", "avatar_icon": "🕵️", "message": "Saturday morning BBS lounge check. Case #105 victory lap!", "is_npc": false },
          { "offset_mins": 7650, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "Listening to Neko FM Saturday stream while finishing my weekend homework.", "is_npc": false },
          { "offset_mins": 7710, "author": "Aoi", "author_badge": "Class 2-A", "avatar_icon": "assets/aoi.jpeg", "message": "Logged into the BBS from home! So glad Class 2-A solved the mystery together.", "is_npc": true },
          { "offset_mins": 7815, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Saturday morning club practice done. Campus is super peaceful today.", "is_npc": false },
          { "offset_mins": 7935, "author": "CatEars_Nekomi", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi and Sera are rehearsing the 'Sunset Harmony' arrangement in the band room right now!", "is_npc": true },
          { "offset_mins": 7980, "author": "Bass_Sera", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/sera.jpeg", "message": "We added a synth melody to match Neko FM's weekend vibe!", "is_npc": true },
          { "offset_mins": 8115, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "Can't wait to hear the performance at the Culture Festival!", "is_npc": false },
          { "offset_mins": 8190, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "Anyone who missed the case during the week can still enter HARMONY_1994 in the Decoder tab!", "is_npc": false },
          { "offset_mins": 8280, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "Clear skies expected for stargazing tonight!", "is_npc": false },
          { "offset_mins": 8355, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Relaxing Saturday afternoon. Sakuraoka BBS is the best place to chill.", "is_npc": false },
          { "offset_mins": 8430, "author": "Akari_M", "author_badge": "Class 2-A", "avatar_icon": "assets/akari.jpeg", "message": "Planning out next week's student activities on the BBS!", "is_npc": true },
          { "offset_mins": 8505, "author": "Pres_Haruka", "author_badge": "Student Council Pres", "avatar_icon": "👑", "message": "Have a restful weekend everyone!", "is_npc": true },
          { "offset_mins": 8580, "author": "Hina_Class1A", "author_badge": "Class 1-A", "avatar_icon": "🌸", "message": "Showing off my 'Seven Wonders Sleuth' badge on my student profile!", "is_npc": false },
          { "offset_mins": 8625, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Saturday night late chatter signing off.", "is_npc": false },

          /* ================= DAY 7 (SUNDAY) ================= */
          { "offset_mins": 8685, "author": "Anon_Sleuth", "author_badge": "Class 3-C", "avatar_icon": "🕵️", "message": "Sunday morning! Last day of Case #105 cycle before weekly reset!", "is_npc": false },
          { "offset_mins": 9090, "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "Finishing up Sunday homework before Monday morning prep.", "is_npc": false },
          { "offset_mins": 9150, "author": "Yuki_Library", "author_badge": "Library Committee", "avatar_icon": "📚", "message": "Sunday reminder: Return all borrowed study materials tomorrow morning!", "is_npc": false },
          { "offset_mins": 9255, "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Rest day for the track team. Ready for Monday morning runs!", "is_npc": false },
          { "offset_mins": 9375, "author": "CatEars_Nekomi", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi finished polishing the band arrangement for tomorrow's practice!", "is_npc": true },
          { "offset_mins": 9420, "author": "Bass_Sera", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/sera.jpeg", "message": "Recorded a mini song preview for Neko FM's Sunday night broadcast!", "is_npc": true },
          { "offset_mins": 9555, "author": "Sora_Drama", "author_badge": "Drama Club", "avatar_icon": "🎭", "message": "So glad Room 302's mystery turned out to be such a sweet school memory.", "is_npc": false },
          { "offset_mins": 9630, "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "Packing my school bag for Monday morning!", "is_npc": false },
          { "offset_mins": 9720, "author": "Mina_StarClub", "author_badge": "Astronomy Club", "avatar_icon": "🔭", "message": "Sunday dusk: Room 302 music box playing its final weekend lullaby.", "is_npc": false },
          { "offset_mins": 9795, "author": "Kenji_Gym", "author_badge": "Class 3-C", "avatar_icon": "🏐", "message": "Ready for Monday morning gym class!", "is_npc": false },
          { "offset_mins": 9870, "author": "Akari_M", "author_badge": "Class 2-A", "avatar_icon": "assets/akari.jpeg", "message": "[CASE #105 FINAL RESOLUTION REPORT] Case Closed. The solar music box of Room 302 remains a Sakuraoka tradition.", "is_npc": true },
          { "offset_mins": 9945, "author": "Pres_Haruka", "author_badge": "Student Council Pres", "avatar_icon": "👑", "message": "Thank you to Akari, Aoi, Nekomi, Sera, and all participating students.", "is_npc": true },
          { "offset_mins": 10020, "author": "Hina_Class1A", "author_badge": "Class 1-A", "avatar_icon": "🌸", "message": "Goodnight everyone! See you at school tomorrow!", "is_npc": false },
          { "offset_mins": 10065, "author": "NightOwl_Student", "author_badge": "Class 2-A", "avatar_icon": "🌙", "message": "Weekly cycle complete. Mystery archives locked for reset.", "is_npc": false }
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
        "thread_id": "sc_notice_01",
        "notice": {
          "author": "Pres_Haruka",
          "author_badge": "Class 3-A (Student Body Pres)",
          "avatar_icon": "👑",
          "message": "Student Council Notice: Umbrella rack clearance in the main foyer is complete. Unclaimed items are available at the council desk."
        },
        "replies": [
          { "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "@Pres_Haruka Thank you! Heading to retrieve my clear umbrella during lunch!" },
          { "author": "VP_Chiaki", "author_badge": "Class 2-B (Student Council VP)", "avatar_icon": "📋", "message": "Desk is staffed continuously throughout 2nd and 3rd period breaks!" }
        ]
      },
      {
        "thread_id": "sc_notice_02",
        "notice": {
          "author": "Pres_Haruka",
          "author_badge": "Class 3-A (Student Body Pres)",
          "avatar_icon": "👑",
          "message": "Student Council Survey: Submissions for next month's cafeteria special dessert menu are open in room 2-A drop box!"
        },
        "replies": [
          { "author": "CatEars_Nekomi", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/nekomi.jpeg", "message": "NEKOMI VOTES FOR STRAWBERRY CREPES WITH EXTRA WHIPPED CREAM!! 🍓🐾", "is_npc": true },
          { "author": "Bass_Sera", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/sera.jpeg", "message": "Seconding Nekomi's crepe vote! Or melon pan ice cream sandwiches!", "is_npc": true }
        ]
      }
    ],
    "general_gossip": [
      { "author": "Yumi_Class2A", "author_badge": "Class 2-A", "avatar_icon": "🥪", "message": "Did anyone catch the cafeteria's Yakisoba Pan today? Sold out in three minutes flat!" },
      { "author": "Hiro_Class2B", "author_badge": "Class 2-B", "avatar_icon": "🎧", "message": "Neko FM was playing such a cozy lo-fi playlist during lunch today. Perfect courtyard vibe." },
      { "author": "Aoi", "author_badge": "Class 2-A", "avatar_icon": "assets/aoi.jpeg", "message": "Akari and I trimmed the Class 2-A window garden before homeroom today!", "is_npc": true },
      { "author": "CatEars_Nekomi", "author_badge": "Class 2-A (Light Music)", "avatar_icon": "assets/nekomi.jpeg", "message": "Nekomi traded half a crepe for Sera's matcha latte during break! Class 2-A desk trades are elite today!", "is_npc": true },
      { "author": "Ren_Track", "author_badge": "Track Team", "avatar_icon": "🏃", "message": "Morning lap practice hit a new record today! Autumn breeze feels incredible on the field." }
    ]
  };

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

    try {
      let response = await fetch('js/case_105_schedule.json');
      if (!response.ok) {
        response = await fetch('case_105_schedule.json');
      }
      if (response.ok) {
        catalog = await response.json();
      }
    } catch (err) {
      console.warn('[MYSTERY ENGINE] Schedule fetch unavailable. Using embedded catalog fallback.');
    }

    if (!catalog) {
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

    try {
      let response = await fetch('js/school_gossip_pool.json');
      if (!response.ok) {
        response = await fetch('school_gossip_pool.json');
      }
      if (response.ok) {
        gossipData = await response.json();
      }
    } catch (err) {
      console.warn('[MYSTERY ENGINE] Gossip pool fetch unavailable. Using embedded gossip fallback.');
    }

    if (!gossipData) {
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
    const passcode = caseObj.required_passcode || caseObj.passcode_trigger;
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
