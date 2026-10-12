/* ============================================================
   GLOBAL PERSISTENT PLAYER ENGINE — OTAKU NEKO LOUNGE
   ============================================================ */

(function () {
  // Determine current page filename
  const currentPage = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';

  // EXCLUSION RULE 1: Completely disable persistent player on Podcast page
  if (currentPage === 'podcast.html') {
    const existingBar = document.getElementById('persistent-player-bar');
    if (existingBar) existingBar.remove();
    return;
  }

  // EXCLUSION RULE 2: Hide floating mini-player on Neko FM page (uses main station UI instead)
  if (currentPage === 'neko-fm.html') {
    const existingBar = document.getElementById('persistent-player-bar');
    if (existingBar) existingBar.style.display = 'none';
    return;
  }

  // Inject Mini-Player UI automatically if not present on current page
  function injectMiniPlayerUI() {
    if (document.getElementById('persistent-player-bar')) return;

    const playerHTML = `
      <div id="persistent-player-bar" class="mini-player-bar">
        <div class="mini-player-content">
          <div class="mini-track-info">
            <div class="mini-speaker-avatar" id="mini-avatar-box">📻</div>
            <div class="mini-text-details">
              <span class="mini-track-title" id="mini-track-title">24/7 Neko FM Stream</span>
              <span class="mini-speaker-name" id="mini-speaker-name">Ready to play</span>
            </div>
          </div>
          <div class="mini-player-controls">
            <button id="mini-play-btn" class="mini-control-btn" onclick="toggleGlobalPlayback()">▶</button>
            <div class="mini-progress-wrapper" onclick="seekGlobalAudio(event)">
              <span id="mini-time-current" class="mini-time">00:00</span>
              <div class="mini-progress-track">
                <div id="mini-progress-fill" class="mini-progress-fill"></div>
              </div>
              <span id="mini-time-total" class="mini-time">--:--</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', playerHTML);
  }

  // Global Audio Engine Instantiation
  window.globalAudio = window.globalAudio || new Audio();
  window.globalAudio.crossOrigin = "anonymous";

  document.addEventListener('DOMContentLoaded', () => {
    injectMiniPlayerUI();
    syncPlayerStateFromStorage();
    bindAudioEvents();
  });

  // Sync state across browser tabs and page navigations
  window.addEventListener('storage', (e) => {
    if (e.key.startsWith('echo_audio_')) {
      syncPlayerStateFromStorage();
    }
  });

  function syncPlayerStateFromStorage() {
    const src = localStorage.getItem('echo_audio_src');
    const title = localStorage.getItem('echo_audio_title');
    const speaker = localStorage.getItem('echo_audio_speaker');
    const avatar = localStorage.getItem('echo_audio_avatar');

    const titleEl = document.getElementById('mini-track-title');
    const speakerEl = document.getElementById('mini-speaker-name');
    const avatarEl = document.getElementById('mini-avatar-box');

    if (titleEl && title) titleEl.innerText = title;
    if (speakerEl && speaker) speakerEl.innerText = speaker;
    if (avatarEl && avatar) avatarEl.innerText = avatar;

    if (src && window.globalAudio.src !== src) {
      window.globalAudio.src = src;
    }

    updatePlayButtonUI(!window.globalAudio.paused);
  }

  function bindAudioEvents() {
    const audio = window.globalAudio;

    audio.addEventListener('play', () => updatePlayButtonUI(true));
    audio.addEventListener('pause', () => updatePlayButtonUI(false));

    audio.addEventListener('timeupdate', () => {
      const cur = document.getElementById('mini-time-current');
      const tot = document.getElementById('mini-time-total');
      const fill = document.getElementById('mini-progress-fill');

      if (cur) cur.innerText = formatTime(audio.currentTime);
      if (tot && !isNaN(audio.duration)) tot.innerText = formatTime(audio.duration);

      if (fill && !isNaN(audio.duration) && audio.duration > 0) {
        const pct = (audio.currentTime / audio.duration) * 100;
        fill.style.width = `${pct}%`;
      }
    });
  }

  window.toggleGlobalPlayback = function () {
    const audio = window.globalAudio;
    const src = localStorage.getItem('echo_audio_src') || 'https://listen.moe/fallback';

    if (!audio.src || audio.src === 'about:blank') {
      audio.src = src;
      localStorage.setItem('echo_audio_src', src);
      localStorage.setItem('echo_audio_title', 'LISTEN.moe 24/7 Stream');
      localStorage.setItem('echo_audio_speaker', 'Anime & Vocaloid');
    }

    if (audio.paused) {
      audio.play().then(() => updatePlayButtonUI(true)).catch(err => console.log("Playback error:", err));
    } else {
      audio.pause();
      updatePlayButtonUI(false);
    }
  };

  window.seekGlobalAudio = function (event) {
    const audio = window.globalAudio;
    if (!audio.duration || isNaN(audio.duration)) return;

    const wrapper = event.currentTarget;
    const rect = wrapper.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const pct = clickX / rect.width;

    audio.currentTime = pct * audio.duration;
  };

  function updatePlayButtonUI(isPlaying) {
    const btn = document.getElementById('mini-play-btn');
    if (btn) btn.innerText = isPlaying ? '⏸' : '▶';
  }

  function formatTime(secs) {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
})();
