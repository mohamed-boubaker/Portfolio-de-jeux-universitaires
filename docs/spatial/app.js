'use strict';
const $ = id => document.getElementById(id);
let ready = false, started = false, paused = false;
function invoke(name) {
  if (!ready || !started) return;
  Module['_' + name]();
  $('canvas').focus({ preventScroll: true });
}
globalThis.spatialState = (score, attempts, wins, state) => {
  paused = state === 1;
  $('score').textContent = score;
  $('attempt').textContent = `Tentative ${attempts}`;
  $('wins').textContent = wins;
  $('pause-overlay').hidden = !paused;
  $('pause').innerHTML = paused ? '▶ <span>Reprendre</span>' : 'Ⅱ <span>Pause</span>';
  $('pause').setAttribute('aria-label', paused ? 'Reprendre le jeu' : 'Mettre en pause');
  $('status-text').textContent = ['Maintiens le clic pour piloter vers la Lune.', 'Mission en pause.', 'Lune atteinte ! +10. Nouvelle mission.', 'Collision ou sortie d’écran : −5. Nouvel essai.'][state];
};
function fail() {
  $('cover').hidden = false;
  $('launch').disabled = true;
  $('launch').textContent = 'Chargement impossible';
  $('loading').textContent = 'Recharge la page pour réessayer.';
}
var Module = {
  canvas: $('canvas'),
  setStatus: message => { if (message) $('loading').textContent = 'Chargement des images et de Grapic…'; },
  print: message => console.info(message),
  printErr: message => console.error(message),
  onAbort: fail,
  onRuntimeInitialized: () => {
    ready = true;
    $('launch').disabled = false;
    $('launch').textContent = 'Décoller maintenant ↗';
    $('loading').textContent = 'Prêt au décollage.';
    $('status-text').textContent = 'Clique sur Décoller pour commencer.';
  }
};
$('launch').addEventListener('click', () => {
  if (!ready || started) return;
  started = true;
  $('cover').hidden = true;
  Module.callMain([]);
  for (const id of ['pause', 'restart', 'reset']) $(id).disabled = false;
  fitCanvas(true);
  $('canvas').focus({ preventScroll: true });
});
$('pause').addEventListener('click', () => invoke('spatial_pause'));
$('resume').addEventListener('click', () => invoke('spatial_pause'));
$('restart').addEventListener('click', () => invoke('spatial_restart'));
$('reset').addEventListener('click', () => invoke('spatial_reset'));
$('canvas').addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('keydown', event => {
  if (!started || event.repeat || !['canvas', 'pause', 'resume', 'restart', 'reset'].includes(document.activeElement?.id)) return;
  if (['p', 'P', 'Escape'].includes(event.key)) { event.preventDefault(); invoke('spatial_pause'); }
  if (['r', 'R'].includes(event.key)) { event.preventDefault(); invoke('spatial_restart'); }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && started && !paused) Module._spatial_pause();
});
$('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if ($('viewport').requestFullscreen) await $('viewport').requestFullscreen();
    else throw new Error('Unavailable');
    $('canvas').focus({ preventScroll: true });
  } catch { $('status-text').textContent = 'Le plein écran n’est pas disponible sur ce navigateur.'; }
});
window.addEventListener('error', event => { if (event.target?.tagName === 'SCRIPT') fail(); }, true);
// Ajuster le jeu à la hauteur visible, commandes comprises.
function fitCanvas(alignGame = false) {
  const canvas = $('canvas');
  const viewport = $('viewport');
  const panel = viewport.closest('.game-panel');
  const visibleHeight = Math.floor(window.visualViewport?.height || window.innerHeight);
  if (document.fullscreenElement === viewport) {
    const side = Math.min(window.innerWidth, visibleHeight);
    canvas.style.setProperty('width', `${side}px`, 'important');
    canvas.style.setProperty('height', `${side}px`, 'important');
  } else {
    canvas.style.setProperty('width', '100%', 'important');
    canvas.style.setProperty('height', '100%', 'important');
    // Mesurer après application de la largeur : les commandes peuvent se replier.
    for (let pass = 0; pass < 2; ++pass) {
      const controlsHeight = Array.from(panel.children)
        .filter(child => child !== viewport)
        .reduce((height, child) => height + child.getBoundingClientRect().height, 0);
      const side = Math.max(1, Math.floor(visibleHeight - controlsHeight - 16));
      document.body.style.setProperty('--spatial-max-side', `${side}px`);
    }
    if (alignGame && started) {
      const top = panel.getBoundingClientRect().top + window.scrollY - 8;
      window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
    }
  }
}
function refitGame() { requestAnimationFrame(() => fitCanvas(started)); }
window.addEventListener('resize', refitGame);
window.visualViewport?.addEventListener('resize', refitGame);
document.addEventListener('fullscreenchange', refitGame);
fitCanvas();
