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
  }

  /**
   * Fetches JSON catalog, computes week index, and renders Free + VIP boards
   */
  async function loadAndRenderCases() {
    try {
      // Updated to match your exact file name
      const response = await fetch('case_105_schedule.json');
      if (!response.ok) {
        console.warn('[MYSTERY ENGINE] Could not load case_105_schedule.json');
        return;
      }

      const catalog = await response.json();
      const epochMs = new Date(catalog.epoch_start_iso || '2026-01-05T00:00:00Z').getTime();
      const nowMs = Date.now();

      // Calculate current week index relative to epoch
      const weekIndex = Math.max(0, Math.floor((nowMs - epochMs) / MS_PER_WEEK));

      // Calculate the exact start timestamp (Monday 00:00:00) of the current week cycle
      const currentWeekStartMs = epochMs + (weekIndex * MS_PER_WEEK);
      const elapsedMinsInCurrentWeek = Math.floor((nowMs - currentWeekStartMs) / 60000);

      // Select active cases using rotational modulo
      const freePool = catalog.free_cases_pool || [];
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
   * Renders a single case thread into a target container
   */
  function renderCase(caseObj, weekStartMs, elapsedMins, containerId, isVIP) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Register passcode into solution vault
    if (caseObj.required_passcode) {
      const cleanPasscode = caseObj.required_passcode.trim().toUpperCase();
      activeSolutions[cleanPasscode] = {
        caseId: caseObj.case_id,
        title: caseObj.title,
        badge: caseObj.reward_badge || 'Case Solved'
      };
    }

    // GATING GUARD: Only allow posts whose offset_mins is <= elapsed real-world time
    const unlockedPosts = (caseObj.timeline || []).filter(post => post.offset_mins <= elapsedMins);

    // Build reply posts HTML
    const postsHTML = unlockedPosts.map(post => {
      // Calculate exact deterministic past date
      const postDate = new Date(weekStartMs + (post.offset_mins * 60 * 1000));
      const avatarIcon = post.avatar_icon || '👤';
      const isCustomImage = avatarIcon.includes('/');

      const avatarMarkup = isCustomImage
        ? `<img src="${avatarIcon}" class="author-avatar-sm" alt="${post.author}" onerror="this.src='https://via.placeholder.com/36'">`
        : `<div class="avatar-icon-sm">${avatarIcon}</div>`;

      return `
        <div class="bbs-post-reply ${post.is_npc ? 'npc-reply highlight' : ''}">
          <div class="bbs-author">
            ${avatarMarkup}
            <div>
              <strong>${escapeHTML(post.author)} <span class="${post.is_npc ? 'npc-badge' : 'user-badge-student'}">${escapeHTML(post.author_badge || 'Student')}</span></strong>
              <div class="post-time">${formatTimestamp(postDate)}</div>
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
          <h2 class="thread-title">${escapeHTML(caseObj.title)}</h2>
          <span class="thread-meta">Case ID: <strong>${escapeHTML(caseObj.case_id)}</strong> • Target Badge: <strong>${escapeHTML(caseObj.reward_badge || 'None')}</strong></span>
        </div>
        <div class="thread-replies-chain">${postsHTML}</div>
      </article>
    `;

    // Replace or inject into container
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
   * Helper: Formats Date objects into standard BBS timestamps
   */
  function formatTimestamp(date) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedMin = minutes < 10 ? '0' + minutes : minutes;
    return `${monthNames[date.getMonth()]} ${date.getDate()} • ${hours}:${formattedMin} ${ampm}`;
  }

  /**
   * Helper: Sanitizes text to prevent accidental XSS
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
