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

  /**
   * Main Initialization
   */
  async function initEngine() {
    setupTabNavigation();
    setupDecoder();
    await loadAndRenderCases();

    // Poll every 30 seconds to automatically reveal newly unlocked posts live
    setInterval(loadAndRenderCases, 30000);
  }

  /**
   * Fetches JSON catalog, computes week index, and renders Free + VIP boards
   */
  async function loadAndRenderCases() {
    try {
      const response = await fetch('case_105_schedule.json');
      if (!response.ok) {
        console.warn('[MYSTERY ENGINE] Could not load case_105_schedule.json');
        return;
      }

      const catalog = await response.json();
      const epochMs = new Date(catalog.epoch_start_iso || '2026-10-12T00:00:00Z').getTime();
      const nowMs = Date.now();

      // Calculate current week index relative to epoch
      const weekIndex = Math.max(0, Math.floor((nowMs - epochMs) / MS_PER_WEEK));

      // Calculate start timestamp (Monday 00:00:00 UTC) of current week cycle
      const currentWeekStartMs = epochMs + (weekIndex * MS_PER_WEEK);
      const elapsedMinsInCurrentWeek = Math.floor((nowMs - currentWeekStartMs) / 60000);

      // Support both multi-case pool catalogs and single-case JSON formats
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

    } catch (err) {
      console.error('[MYSTERY ENGINE] Error loading or rendering cases:', err);
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
      <article class="bbs-thread-card after-dark-glow" style="margin-bottom: 24px;">
        <div class="thread-main-header">
          <span class="thread-tag dark">${isVIP ? '🔒 [VIP EXCLUSIVE CASE]' : '🌙 [ACTIVE WEEKLY CASE]'}</span>
          <h2 class="thread-title">${escapeHTML(title)}</h2>
          <span class="thread-meta">Case ID: <strong>${escapeHTML(caseId)}</strong> • Target Badge: <strong>${escapeHTML(badge)}</strong></span>
        </div>
        <div class="thread-replies-chain">${postsHTML}</div>
      </article>
    `;

    // Replace existing dynamic card if present, or insert at top
    const existingDynamicCard = container.querySelector('.after-dark-glow');
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
