// music-player.js — Invisible Background Audio Engine for Neko FM & Tabs
(function() {
  // Do not run the global background loop on the FM station management hub itself
  if (window.location.pathname.includes('neko-fm.html')) return;

  // Create a single invisible audio element for background playback
  let bgAudio = window._globalNekoMusicAudio;
  if (!bgAudio) {
    bgAudio = new Audio();
    bgAudio.crossOrigin = "anonymous";
    bgAudio.preload = "auto";
    window._globalNekoMusicAudio = bgAudio;
  }

  function handleAudioSync() {
    // If the user is on the podcast page, keep background music paused/muted per your rule
    if (window.location.pathname.includes('podcast.html')) {
      bgAudio.pause();
      return;
    }

    const isPlaying = localStorage.getItem('neko_radio_playing') === 'true';
    const streamUrl = localStorage.getItem('neko_radio_url');

    if (isPlaying && streamUrl) {
      // If the URL changed or it wasn't playing, load and play the last existing station
      if (bgAudio.src !== streamUrl) {
        bgAudio.src = streamUrl;
      }
      
      if (bgAudio.paused) {
        bgAudio.play().catch(err => {
          console.log("Background music waiting for user browser interaction gesture:", err);
        });
      }
    } else {
      bgAudio.pause();
    }
  }

  // Listen for storage changes across tabs (e.g., when toggling play/pause on Neko FM)
  window.addEventListener('storage', (e) => {
    if (e.key === 'neko_radio_playing' || e.key === 'neko_radio_url') {
      handleAudioSync();
    }
  });

  // Run synchronization on page load
  document.addEventListener('DOMContentLoaded', handleAudioSync);
  
  // Also attempt sync immediately in case DOM is already loaded
  handleAudioSync();
})();
