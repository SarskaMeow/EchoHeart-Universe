/* ==========================================================================
   GLOBAL PERSISTENT AUDIO CONTROLLER (global-player.js)
   ========================================================================== */

const AudioStore = {
  get state() {
    return {
      src: localStorage.getItem('echo_audio_src') || '',
      title: localStorage.getItem('echo_audio_title') || '',
      time: parseFloat(localStorage.getItem('echo_audio_time') || '0'),
      speaker: localStorage.getItem('echo_audio_speaker') || '',
      avatar: localStorage.getItem('echo_audio_avatar') || '',
      mode: localStorage.getItem('echo_audio_mode') || 'radio' // 'radio' or 'podcast'
    };
  },
  save(key, val) {
    localStorage.setItem(`echo_audio_${key}`, val);
  }
};

// Initialize or grab single global audio instance
let globalAudio = document.getElementById('audio-player');
if (!globalAudio) {
  globalAudio = document.createElement('audio');
  globalAudio.id = 'audio-player';
  document.body.appendChild(globalAudio);
}

function formatMiniTime(sec) {
  if (isNaN(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

function updateMiniPlayerUI() {
  const bar = document.getElementById('persistent-player-bar');
  const titleEl = document.getElementById('mini-track-title');
  const speakerEl = document.getElementById('mini-speaker-name');
  const avatarEl = document.getElementById('mini-avatar-box');
  const playBtn = document.getElementById('mini-play-btn');
  const curTimeEl = document.getElementById('mini-time-current');
  const totTimeEl = document.getElementById('mini-time-total');
  const fillEl = document.getElementById('mini-progress-fill');

  const { src, title, time, speaker, avatar } = AudioStore.state;

  // If no audio is loaded, keep player hidden
  if (!src) {
    if (bar) bar.classList.add('hidden');
    return;
  }

  // Show floating bar on Chat, Home, Hub, etc.
  if (bar) bar.classList.remove('hidden');
  if (titleEl) titleEl.innerText = title || '24/7 Neko FM Stream';
  if (speakerEl) speakerEl.innerText = speaker ? `Speaking: ${speaker}` : '📻 Live Stream';
  if (playBtn) playBtn.innerText = globalAudio.paused ? '▶' : '⏸';

  if (avatarEl && avatar) {
    if (avatar.startsWith('http') || avatar.includes('/')) {
      avatarEl.innerHTML = `<img src="${avatar}" alt="${speaker}">`;
    } else {
      avatarEl.innerText = avatar;
    }
  }

  const duration = globalAudio.duration || 192;
  const curTime = globalAudio.currentTime || time;

  if (curTimeEl) curTimeEl.innerText = formatMiniTime(curTime);
  if (totTimeEl) totTimeEl.innerText = formatMiniTime(duration);
  if (fillEl) fillEl.style.width = `${(curTime / duration) * 100}%`;
}

function toggleGlobalPlayback() {
  if (!globalAudio.src) {
    const { src } = AudioStore.state;
    if (src) globalAudio.src = src;
    else return;
  }

  if (globalAudio.paused) {
    globalAudio.play().then(() => {
      updateMiniPlayerUI();
    }).catch(err => console.log('Playback interaction required:', err));
  } else {
    globalAudio.pause();
    updateMiniPlayerUI();
  }
}

function seekGlobalAudio(e) {
  if (!globalAudio.src || !globalAudio.duration) return;
  const track = e.currentTarget.querySelector('.mini-progress-track');
  const rect = track.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  globalAudio.currentTime = pct * globalAudio.duration;
  AudioStore.save('time', globalAudio.currentTime);
  updateMiniPlayerUI();
}

// Sync audio timestamps automatically
globalAudio.addEventListener('timeupdate', () => {
  AudioStore.save('time', globalAudio.currentTime);
  updateMiniPlayerUI();
});

globalAudio.addEventListener('pause', () => updateMiniPlayerUI());
globalAudio.addEventListener('play', () => updateMiniPlayerUI());

// Page load initialization (persists across Home, Chat, Neko FM, etc.)
window.addEventListener('DOMContentLoaded', () => {
  const { src, time } = AudioStore.state;
  if (src) {
    globalAudio.src = src;
    globalAudio.currentTime = time;
    updateMiniPlayerUI();
  }
});
