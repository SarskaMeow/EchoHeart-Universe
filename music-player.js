// music-player.js — Floating Mini Audio Player Engine with Auto-Override Coordination
(function() {
  // Do not run on the dedicated Neko FM station hub itself
  if (window.location.pathname.includes('neko-fm.html')) return;

  // 1. Inject High-Priority CSS Styles
  function injectStyles() {
    if (document.getElementById('neko-mini-player-styles')) return;

    const style = document.createElement('style');
    style.id = 'neko-mini-player-styles';
    style.textContent = `
      #neko-mini-player-widget {
        position: fixed !important;
        top: 16px !important;
        right: 20px !important;
        z-index: 999999 !important;
        background: rgba(18, 15, 32, 0.95) !important;
        border: 2px solid #00F0FF !important;
        border-radius: 30px !important;
        padding: 6px 16px 6px 12px !important;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 16px rgba(0, 240, 255, 0.35) !important;
        font-family: 'M PLUS Rounded 1c', 'Segoe UI', sans-serif !important;
        user-select: none !important;
        transition: border-color 0.3s ease, box-shadow 0.3s ease !important;
        margin: 0 !important;
        box-sizing: border-box !important;
      }

      #neko-mini-player-widget:hover {
        border-color: #FF3B8D !important;
        box-shadow: 0 4px 24px rgba(255, 59, 141, 0.45) !important;
      }

      .neko-play-btn {
        width: 32px !important;
        height: 32px !important;
        border-radius: 50% !important;
        background: linear-gradient(135deg, #FF3B8D, #B282FF) !important;
        border: none !important;
        color: #FFFFFF !important;
        font-size: 0.85rem !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        box-shadow: 0 2px 10px rgba(255, 59, 141, 0.4) !important;
        transition: transform 0.2s ease !important;
        padding: 0 !important;
        line-height: 1 !important;
      }

      .neko-play-btn:hover {
        transform: scale(1.08) !important;
      }

      .neko-player-info {
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        line-height: 1.2 !important;
      }

      .neko-player-title {
        font-size: 0.78rem !important;
        font-weight: 800 !important;
        color: #FFFFFF !important;
        letter-spacing: 0.5px !important;
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
      }

      .neko-player-sub {
        font-size: 0.68rem !important;
        color: #A09BB9 !important;
        font-weight: 700 !important;
      }

      .neko-live-dot {
        width: 7px !important;
        height: 7px !important;
        border-radius: 50% !important;
        background: #38E57C !important;
        box-shadow: 0 0 8px #38E57C !important;
        display: inline-block !important;
      }

      .neko-live-dot.paused {
        background: #FF3B8D !important;
        box-shadow: 0 0 8px #FF3B8D !important;
      }

      @media (max-width: 768px) {
        #neko-mini-player-widget {
          top: auto !important;
          bottom: 16px !important;
          right: 16px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // 2. Global Audio Engine Setup
  let bgAudio = window._globalNekoMusicAudio;
  if (!bgAudio) {
    bgAudio = new Audio();
    bgAudio.crossOrigin = "anonymous";
    bgAudio.preload = "auto";
    window._globalNekoMusicAudio = bgAudio;
  }

  if (!localStorage.getItem('neko_radio_url')) {
    localStorage.setItem('neko_radio_url', 'assets/neko-fm-stream.mp3');
  }

  // 3. UI Construction & Mounting
  function mountPlayerUI() {
    injectStyles();

    if (document.getElementById('neko-mini-player-widget')) return;

    const container = document.createElement('div');
    container.id = 'neko-mini-player-widget';
    container.innerHTML = `
      <button id="neko-toggle-play-btn" class="neko-play-btn" title="Toggle Neko FM Stream">▶</button>
      <div class="neko-player-info">
        <div class="neko-player-title">
          <span id="neko-status-dot" class="neko-live-dot paused"></span>
          <span>NEKO FM</span>
        </div>
        <div class="neko-player-sub" id="neko-player-subtext">24/7 Radio</div>
      </div>
    `;

    if (document.body) {
      document.body.appendChild(container);
      bindEvents();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(container);
        bindEvents();
      });
    }
  }

  function bindEvents() {
    const btn = document.getElementById('neko-toggle-play-btn');
    if (btn) {
      btn.removeEventListener('click', togglePlayback);
      btn.addEventListener('click', togglePlayback);
    }
  }

  // Pause any on-page media (e.g. Podcast audio) when Neko FM plays
  function pauseOtherOnPageMedia() {
    document.querySelectorAll('audio, video').forEach(media => {
      if (media !== bgAudio && !media.paused) {
        media.pause();
      }
    });
  }

  // 4. Playback State Synchronization
  function togglePlayback() {
    const isCurrentlyPlaying = localStorage.getItem('neko_radio_playing') === 'true';
    localStorage.setItem('neko_radio_playing', isCurrentlyPlaying ? 'false' : 'true');
    handleAudioSync();
  }

  function handleAudioSync() {
    const playBtn = document.getElementById('neko-toggle-play-btn');
    const statusDot = document.getElementById('neko-status-dot');
    const subText = document.getElementById('neko-player-subtext');

    const isPlaying = localStorage.getItem('neko_radio_playing') === 'true';
    const streamUrl = localStorage.getItem('neko_radio_url') || 'assets/neko-fm-stream.mp3';

    if (isPlaying) {
      pauseOtherOnPageMedia();
      if (bgAudio.src !== streamUrl) {
        bgAudio.src = streamUrl;
      }

      bgAudio.play().then(() => {
        if (playBtn) playBtn.innerText = '⏸';
        if (statusDot) statusDot.className = 'neko-live-dot';
        if (subText) subText.innerText = '● Live Stream';
      }).catch(err => {
        console.log("[NEKO FM] Waiting for initial user gesture:", err);
        if (playBtn) playBtn.innerText = '▶';
        if (statusDot) statusDot.className = 'neko-live-dot paused';
        if (subText) subText.innerText = 'Click ▶ Play';
      });
    } else {
      bgAudio.pause();
      if (playBtn) playBtn.innerText = '▶';
      if (statusDot) statusDot.className = 'neko-live-dot paused';
      if (subText) subText.innerText = '24/7 Radio';
    }
  }

  // Auto-Override: If any other audio element plays on the page (e.g. Podcast player), pause Neko FM
  document.addEventListener('play', (e) => {
    if (e.target !== bgAudio) {
      localStorage.setItem('neko_radio_playing', 'false');
      handleAudioSync();
    }
  }, true);

  // 5. Event Listeners for Storage Sync & Automatic Loading
  window.addEventListener('storage', (e) => {
    if (e.key === 'neko_radio_playing' || e.key === 'neko_radio_url') {
      handleAudioSync();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mountPlayerUI();
      handleAudioSync();
    });
  } else {
    mountPlayerUI();
    handleAudioSync();
  }
})();
