// Fetch live, working Anime & J-Pop stations on startup
export async function getWorkingAnimeStations() {
  try {
    // Query Radio-Browser API for verified, online HTTPS anime streams
    const response = await fetch(
      'https://de1.api.radio-browser.info/json/stations/search?tag=anime&limit=15&hidebroken=true&order=votes&reverse=true'
    );
    const stations = await response.json();

    // Filter down to secure HTTPS streams
    const httpsStations = stations.filter(s => s.url_resolved.startsWith('https://'));

    return httpsStations.map(s => ({
      name: s.name.trim(),
      url: s.url_resolved,
      codec: s.codec,
      bitrate: s.bitrate
    }));
  } catch (err) {
    console.warn("Failed to fetch Radio-Browser stations:", err);
    return getFallbackStations(); // Fallback if API is unreachable
  }
}
