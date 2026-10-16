// music-player.js — Floating Mini Audio Player Engine for Neko FM
(function() {
  // Do not run on the dedicated Neko FM station hub itself
  if (window.location.pathname.includes('neko-fm.html')) return;

  // 1. Inject Mini Player CSS Styles
  const style = document.createElement('style');
  style.textContent = `
    .neko-mini-player {
      position: fixed;
      top: 12px;
      right: 18px;
      z-index: 10001;
      background: rgba(18, 15, 32, 0.92);
      border: 1.5px solid rgba(0, 240, 255, 0.4);
      border-radius: 30px;
      padding: 6px 14px 6px 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 12px rgba(0, 240, 255, 0.15);
      font-family: 'M PLUS Rounded 1c', 'Segoe UI', sans-serif;
      transition: all 0.3s ease;
      user-select: none;
    }

    .neko-mini-player:hover {
      border-color: #FF3B8D;
      box-shadow: 0 4px 24px rgba(255, 59, 141, 0.3);
    }

    .neko-play-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FF3B8D, #B282FF);
      border: none;
      color: #FFFFFF;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(255, 59, 141, 0.4);
      transition: transform 0.2s ease;
    }

    .neko-play-btn:hover {
      transform: scale(1.08);
    }

    .neko-player-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      line-height: 1.15;
    }

    .neko-player-title {
      font-size: 0.76rem;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .neko-player-sub {
      font-size: 0.68rem;
      color: #A09BB9;
      font-weight: 700;
    }

    .neko-live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #38E57C;
      box-shadow: 0 0 8px #38E57C;
    }

    .neko-live-dot.paused {
      background: #FF3B8D;
      box-shadow: 0 0 8px #FF3B8D;
    }

    @media (max-width: 768px) {
      .neko-mini-player {
        top: auto;
        bottom: 16px;
        right: 16px;
      }
    }
  `;
  document.head.appendChild(style);

  // 2. Global Audio Element Setup
  let bgAudio = window._globalNekoMusicAudio;
  if (!bgAudio) {
    bgAudio = new Audio();
    bgAudio.crossOrigin = "anonymous";
    bgAudio.preload = "auto";
    window._globalNekoMusicAudio = bgAudio;
  }

  // Set default default stream audio if none exists in localStorage
  if (!localStorage.getItem('neko_radio_url')) {
    localStorage.setItem('neko_radio_url', 'assets/neko-fm-stream.mp3');
  }

  // 3. Inject Floating Player Widget into DOM
  let playerContainer;
  function createPlayerUI() {
    if (document.getElementById('neko-mini-player-widget')) return;

    playerContainer = document.createElement('div');
    playerContainer.id = 'neko-mini-player-widget';
    playerContainer.className = 'neko-mini-player';
    playerContainer.innerHTML = `
      <button id="neko-toggle-play-btn" class="neko-play-btn" title="Toggle Neko FM Stream">▶</button>
      <div class="neko-player-info">
        <div class="neko-player-title">
          <span id="neko-status-dot" class="neko-live-dot paused"></span>
          <span>NEKO FM</span>
        </div>
        <div class="neko-player-sub" id="neko-player-subtext">24/7 Radio</div>
      </div>
    `;

    document.body.appendChild(playerContainer);

    // Bind Play/Pause Toggle
    document.getElementById('neko-toggle-play-btn').addEventListener('click', togglePlayback);
  }

  // 4. Playback Logic & Sync
  function togglePlayback() {
    const isCurrentlyPlaying = localStorage.getItem('neko_radio_playing') === 'true';
    if (isCurrentlyPlaying) {
      localStorage.setItem('neko_radio_playing', 'false');
    } else {
      localStorage.setItem('neko_radio_playing', 'true');
    }
    handleAudioSync();
  }

  function handleAudioSync() {
    const playBtn = document.getElementById('neko-toggle-play-btn');
    const statusDot = document.getElementById('neko-status-dot');
    const subText = document.getElementById('neko-player-subtext');

    // Mute/Pause on podcast page
    if (window.location.pathname.includes('podcast.html')) {
      bgAudio.pause();
      if (playBtn) playBtn.innerText = '▶';
      if (statusDot) statusDot.className = 'neko-live-dot paused';
      if (subText) subText.innerText = 'Muted (Podcast)';
      return;
    }

    const isPlaying = localStorage.getItem('neko_radio_playing') === 'true';
    const streamUrl = localStorage.getItem('neko_radio_url') || 'assets/neko-fm-stream.mp3';

    if (isPlaying) {
      if (bgAudio.src !== streamUrl) {
        bgAudio.src = streamUrl;
      }

      bgAudio.play().then(() => {
        if (playBtn) playBtn.innerText = '⏸';
        if (statusDot) statusDot.className = 'neko-live-dot';
        if (subText) subText.innerText = '● Live Stream';
      }).catch(err => {
        console.log("Audio waiting for user gesture:", err);
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

  // 5. Event Listeners for Tab Sync & Page Load
  window.addEventListener('storage', (e) => {
    if (e.key === 'neko_radio_playing' || e.key === 'neko_radio_url') {
      handleAudioSync();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    createPlayerUI();
    handleAudioSync();
  });

  // Execute immediately if DOM is already ready
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    createPlayerUI();
    handleAudioSync();
  }
})();
