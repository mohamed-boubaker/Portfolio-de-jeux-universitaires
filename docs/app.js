'use strict';
const $ = id => document.getElementById(id);
let ready = false, started = false, currentLevel = -1, paused = false;
function launch() {
  if (!ready || started) return;
  started = true;
  globalThis.SharkMusic?.start();
  $('cover').hidden = true;
  Module.callMain([]);
  fitShark(true);
  $('canvas').focus({ preventScroll: true });
}
function invoke(name, ...args) {
  if (!ready) return;
  launch();
  const fn = Module['_' + name];
  if (typeof fn === 'function') fn(...args);
  $('canvas').focus({ preventScroll: true });
}
globalThis.sharkState = (level, state, attempts, progress) => {
  globalThis.SharkMusic?.setState(state);
  currentLevel = level;
  paused = state === 2;
  $('screen-label').textContent = level < 0 ? 'CHOISIS TON NIVEAU' : `NIVEAU 0${level + 1}`;
  $('status-text').textContent = ['Choisis un niveau pour commencer.', 'Évite les obstacles et atteins la fin.', 'Jeu en pause.', 'Collision ! On repart…', 'Niveau terminé. Bien joué !'][state];
  $('attempt').textContent = level < 0 ? 'Bonne partie !' : `Tentative ${attempts}`;
  $('progress').value = progress;
  $('progress-label').textContent = `${progress} %`;
  $('pause-overlay').hidden = !paused;
  $('win').hidden = state !== 4;
  $('pause').innerHTML = paused ? '▶ <span>Reprendre</span>' : 'Ⅱ <span>Pause</span>';
  $('pause').setAttribute('aria-label', paused ? 'Reprendre le jeu' : 'Mettre en pause');
  for (const id of ['pause', 'restart', 'jump']) $(id).disabled = level < 0;
  $('menu').disabled = level < 0;
  document.querySelectorAll('[data-level]').forEach(button => {
    const selected = Number(button.dataset.level) === level;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
};
function failure(message) {
  $('loading').textContent = message;
  $('cover').hidden = false;
  $('launch').disabled = true;
  $('launch').textContent = 'Chargement impossible';
}
var Module = {
  canvas: $('canvas'),
  setStatus: message => { if (message) $('loading').textContent = 'Chargement des niveaux et des images…'; },
  print: message => console.info(message),
  printErr: message => console.error(message),
  onAbort: () => failure('Le moteur n’a pas pu démarrer. Recharge la page pour réessayer.'),
  onRuntimeInitialized: () => {
    ready = true;
    $('launch').disabled = false;
    $('launch').textContent = 'Jouer maintenant ↗';
    $('loading').textContent = 'Le moteur est prêt. À toi de jouer.';
    document.querySelectorAll('[data-level]').forEach(button => { button.disabled = false; });
  }
};
$('launch').addEventListener('click', launch);
document.querySelectorAll('[data-level]').forEach(button => button.addEventListener('click', () => invoke('shark_select', Number(button.dataset.level))));
$('pause').addEventListener('click', () => invoke('shark_pause'));
$('resume').addEventListener('click', () => invoke('shark_pause'));
$('restart').addEventListener('click', () => invoke('shark_restart'));
$('menu').addEventListener('click', () => invoke('shark_menu'));
$('jump').addEventListener('pointerdown', event => { event.preventDefault(); invoke('shark_jump'); });
$('canvas').addEventListener('contextmenu', event => event.preventDefault());
$('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if ($('viewport').requestFullscreen) await $('viewport').requestFullscreen();
    else { $('status-text').textContent = 'Le plein écran n’est pas disponible sur ce navigateur.'; return; }
    $('canvas').focus({ preventScroll: true });
  } catch { $('status-text').textContent = 'Le plein écran n’est pas disponible sur ce navigateur.'; }
});
document.addEventListener('keydown', event => {
  if (document.activeElement === $('canvas') && ['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && started && currentLevel >= 0 && !paused) Module._shark_pause();
});
window.addEventListener('error', event => {
  if (event.target && event.target.tagName === 'SCRIPT') failure('Téléchargement interrompu. Recharge la page pour réessayer.');
}, true);

// Garder le cadre 4:3 visible en entier et légèrement plus compact.
function fitShark(alignGame = false) {
  const canvas = $('canvas');
  const viewport = $('viewport');
  const panel = viewport.closest('.game-panel');
  const visibleHeight = Math.floor(window.visualViewport?.height || window.innerHeight);
  if (document.fullscreenElement === viewport) {
    const width = Math.floor(Math.min(window.innerWidth, visibleHeight * 4 / 3) * 0.94);
    canvas.style.setProperty('width', `${width}px`, 'important');
    canvas.style.setProperty('height', `${width * 3 / 4}px`, 'important');
  } else {
    canvas.style.setProperty('width', '100%', 'important');
    canvas.style.setProperty('height', '100%', 'important');
    for (let pass = 0; pass < 2; ++pass) {
      const controlsHeight = Array.from(panel.children)
        .filter(child => child !== viewport)
        .reduce((height, child) => height + child.getBoundingClientRect().height, 0);
      const width = Math.max(1, Math.floor((visibleHeight - controlsHeight - 28) * 4 / 3));
      document.body.style.setProperty('--shark-max-width', `${width}px`);
    }
    if (alignGame && started) {
      const top = panel.getBoundingClientRect().top + window.scrollY - 12;
      window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
    }
  }
}
function refitShark() { requestAnimationFrame(() => fitShark(started)); }
window.addEventListener('resize', refitShark);
window.visualViewport?.addEventListener('resize', refitShark);
document.addEventListener('fullscreenchange', refitShark);
fitShark();
