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
        "title": "Case #105 — The Midnight Melody of Room 302",
        "reward_badge": "Resonance Detective",
        "required_passcode": "HARMONY_1994",
        "timeline": [
          {
            "offset_mins": 0,
            "author": "Library_Yuki",
            "author_badge": "Archivist",
            "avatar_icon": "📚",
            "message": "I was returning overdue reference books to the 3F archive just now. Room 302 (the old music classroom that's been locked since 2012) had faint piano notes coming from inside.",
            "is_npc": false
          },
          {
            "offset_mins": 135,
            "author": "Track_Captain_Ren",
            "author_badge": "Class 3-B",
            "avatar_icon": "🏃",
            "message": "@Library_Yuki bro Room 302 doesn't even have a piano anymore?? They moved all upright pianos to the B1 storage locker last semester!!",
            "is_npc": false
          },
          {
            "offset_mins": 720,
            "author": "Bass_Sera",
            "author_badge": "GIRLS PHANTOM DEAD",
            "avatar_icon": "assets/sera.jpeg",
            "message": "We picked up the vibration on our room mic down in Sub-Level 04. It's radiating straight through the air duct connected to Room 302. Pitch is tuned to 432Hz.",
            "is_npc": true
          },
          {
            "offset_mins": 2160,
            "author": "CatEars_Nekomi",
            "author_badge": "GIRLS PHANTOM DEAD",
            "avatar_icon": "assets/nekomi.jpeg",
            "message": "Nekomi found a torn sheet music scrap tucked inside the 1994 yearbook on the Lore page! Check the radio ticker for clue word 1: SIGNAL!",
            "is_npc": true
          },
          {
            "offset_mins": 3600,
            "author": "Akari_M",
            "author_badge": "SENIOR INVESTIGATOR",
            "avatar_icon": "assets/akari.jpeg",
            "message": "UPDATE: If anyone can decipher the chord code and enter it into the Mystery Decoder tab, we can feed the matching synth note through Neko FM to ground the signal!",
            "is_npc": true
          },
          {
            "offset_mins": 5040,
            "author": "CatEars_Nekomi",
            "author_badge": "GIRLS PHANTOM DEAD",
            "avatar_icon": "assets/nekomi.jpeg",
            "message": "The air ducts are vibrating again... if you guys find the code in the Lore Library archives, put it in the BBS terminal tab before midnight!!",
            "is_npc": true
          },
          {
            "offset_mins": 7200,
            "author": "Akari_M",
            "author_badge": "SENIOR INVESTIGATOR",
            "avatar_icon": "assets/akari.jpeg",
            "message": "[CASE #105 RESOLVED REPORT] Code HARMONY_1994 verified! Ghost melody grounded. Spectrograph report locked to VIP files.",
            "is_npc": true
          }
        ]
      }
    ],
    "vip_cases_pool": [
      {
        "case_id": "VIP-CASE-105",
        "mystery_id": "case_105_sublevel_vault",
        "title": "VIP #105 — Sub-Level 04 Sealed Vault Resonance",
        "reward_badge": "Vault Keymaster",
        "required_passcode": "VAULT_1994",
        "timeline": [
          {
            "offset_mins": 0,
            "author": "Aoi_Pres",
            "author_badge": "STUDENT GOV",
            "avatar_icon": "assets/aoi.jpeg",
            "message": "Sub-Level 04 iron gate resonance frequency recorded at 14.2kHz. Clearance Level 3 required for investigation.",
            "is_npc": true
          },
          {
            "offset_mins": 360,
            "author": "Akari_M",
            "author_badge": "GIRLS PHANTOM DEAD",
            "avatar_icon": "assets/akari.jpeg",
            "message": "The spectrograph behind the sealed iron gate is registering harmonic feedback matching the Room 302 piano track.",
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
    const badge = caseObj.reward_badge || caseObj.badge_reward || 'Resonance Detective';

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
    // This preserves live gossip chatter appended by triggerRandomLiveChatter()!
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
