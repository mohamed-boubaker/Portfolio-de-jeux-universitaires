// Une seule piste pour tout le jeu : menu et niveaux, sans superposition.
(() => {
  const button = document.getElementById('sound');
  const slider = document.getElementById('music-volume');
  const track = new Audio();
  track.preload = 'none';
  track.src = 'audio/shark-orbit.mp3';
  track.loop = true;
  let enabled = true, volume = 0.28, started = false, state = 0;
  let requested = false, blocked = false, failed = false;
  try {
    enabled = localStorage.getItem('shark-music-enabled') !== 'false';
    const stored = localStorage.getItem('shark-music-volume');
    if (stored !== null && Number.isFinite(Number(stored))) volume = Math.max(0, Math.min(1, Number(stored)));
  } catch { /* Le jeu fonctionne aussi sans stockage local. */ }

  function save() {
    try {
      localStorage.setItem('shark-music-enabled', String(enabled));
      localStorage.setItem('shark-music-volume', String(volume));
    } catch { /* Préférences limitées à cette page. */ }
  }
  function render() {
    const audible = enabled && volume > 0;
    button.setAttribute('aria-pressed', String(audible && !blocked && !failed));
    button.setAttribute('aria-label', failed ? 'Musique indisponible' : audible && !blocked ? 'Couper la musique (M)' : 'Activer la musique (M)');
    button.title = button.getAttribute('aria-label');
    button.innerHTML = failed ? '♪ <span>Audio indisponible</span>' : audible && !blocked ? '♪ <span>Son activé</span>' : '♪ <span>Son coupé</span>';
    button.disabled = failed;
    slider.value = String(Math.round(volume * 100));
    track.volume = volume * (state === 0 ? 0.65 : 1);
  }
  function shouldPlay() {
    return started && enabled && volume > 0 && !document.hidden && state !== 2 && state !== 4 && !failed;
  }
  async function sync() {
    if (!shouldPlay()) {
      requested = false;
      track.pause();
      return;
    }
    if (requested || blocked) return;
    requested = true;
    try {
      await track.play();
      if (!shouldPlay()) { requested = false; track.pause(); }
    } catch (error) {
      requested = false;
      if (shouldPlay() && error.name !== 'AbortError') { blocked = true; render(); }
    }
  }
  function toggle() {
    if (blocked || !enabled || volume === 0) {
      enabled = true; blocked = false;
      if (volume === 0) volume = 0.28;
    } else enabled = false;
    render(); save(); sync();
  }
  button.addEventListener('click', toggle);
  slider.addEventListener('input', () => {
    volume = Math.max(0, Math.min(1, Number(slider.value) / 100));
    enabled = volume > 0; blocked = false;
    render(); save(); sync();
  });
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('keydown', event => {
    if (!event.repeat && event.key.toLowerCase() === 'm' && document.activeElement?.id === 'canvas') {
      event.preventDefault(); toggle();
    }
  });
  track.addEventListener('error', () => { failed = true; requested = false; track.pause(); render(); });
  globalThis.SharkMusic = {
    start() { started = true; blocked = false; sync(); },
    setState(next) { if (state !== next) { state = next; render(); sync(); } }
  };
  render();
})();
