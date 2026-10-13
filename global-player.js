/* ============================================================
   GLOBAL PERSISTENT PLAYER ENGINE — OTAKU NEKO LOUNGE
   ============================================================ */

(function () {
  const currentPage = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';

  // EXCLUSION RULE: Disable persistent mini-player on Podcast page
  if (currentPage === 'podcast.html') {
    const existingBar = document.getElementById('persistent-player-bar');
    if (existingBar) existingBar.remove();
    return;
  }

  // Auto-inject Mini-Player UI on Home, Chat, Hub, etc. (excluded on Neko FM page)
  function injectMiniPlayerUI() {
    if (currentPage === 'neko-fm.html') return;
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

  // Global Shared Audio Object
  window.globalAudio = window.globalAudio || new Audio();
  window.globalAudio.crossOrigin = "anonymous";

  document.addEventListener('DOMContentLoaded', () => {
    injectMiniPlayerUI();
    syncPlayerStateFromStorage(true); // Automatically resume stream on load
    bindAudioEvents();
  });

  function syncPlayerStateFromStorage(shouldAutoResume = false) {
    const src = localStorage.getItem('echo_audio_src');
    const title = localStorage.getItem('echo_audio_title');
    const speaker = localStorage.getItem('echo_audio_speaker');
    const avatar = localStorage.getItem('echo_audio_avatar');
    const wasPlaying = localStorage.getItem('echo_audio_playing') === 'true';

    const titleEl = document.getElementById('mini-track-title');
    const speakerEl = document.getElementById('mini-speaker-name');
    const avatarEl = document.getElementById('mini-avatar-box');

    if (titleEl && title) titleEl.innerText = title;
    if (speakerEl && speaker) speakerEl.innerText = speaker;
    if (avatarEl && avatar) avatarEl.innerText = avatar;

    if (src) {
      if (window.globalAudio.src !== src) {
        window.globalAudio.src = src;
      }

      // Resume playing if music was active before switching pages
      if (shouldAutoResume && wasPlaying && window.globalAudio.paused) {
        window.globalAudio.play().then(() => {
          updatePlayButtonUI(true);
        }).catch(err => {
          console.log("Autoplay blocked by browser policy until user interaction:", err);
          updatePlayButtonUI(false);
        });
      } else {
        updatePlayButtonUI(!window.globalAudio.paused);
      }
    }
  }

  function bindAudioEvents() {
    const audio = window.globalAudio;

    audio.addEventListener('play', () => {
      localStorage.setItem('echo_audio_playing', 'true');
      updatePlayButtonUI(true);
    });

    audio.addEventListener('pause', () => {
      localStorage.setItem('echo_audio_playing', 'false');
      updatePlayButtonUI(false);
    });

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

    if (!audio.src || audio.src === 'about:blank' || audio.src !== src) {
      audio.src = src;
      if (!localStorage.getItem('echo_audio_src')) {
        localStorage.setItem('echo_audio_src', src);
        localStorage.setItem('echo_audio_title', 'LISTEN.moe 24/7 Stream');
        localStorage.setItem('echo_audio_speaker', 'Anime & Vocaloid');
      }
    }

    if (audio.paused) {
      audio.play().then(() => {
        localStorage.setItem('echo_audio_playing', 'true');
        updatePlayButtonUI(true);
      }).catch(err => console.log("Playback error:", err));
    } else {
      audio.pause();
      localStorage.setItem('echo_audio_playing', 'false');
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
    const miniBtn = document.getElementById('mini-play-btn');
    if (miniBtn) miniBtn.innerText = isPlaying ? '⏸' : '▶';

    // Synchronize Neko FM page button if present
    const nekoBtn = document.getElementById('radio-play-btn');
    if (nekoBtn) {
      nekoBtn.innerText = isPlaying ? '⏸ Pause Radio Stream' : '▶ Stream Live Signal';
    }
  }

  function formatTime(secs) {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
})();
