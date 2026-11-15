'use strict';
const launch = document.getElementById('launch');
const viewport = document.getElementById('java-viewport');
const stage = document.getElementById('java-stage');
const status = document.getElementById('runtime-status');
function fitJava() {
  const fullscreen = document.fullscreenElement === viewport;
  const availableHeight = (window.visualViewport?.height || window.innerHeight) - (fullscreen ? 16 : 130);
  const width = Math.max(1, Math.min(1100, Math.floor(viewport.clientWidth - 8)));
  const height = Math.max(1, Math.min(760, Math.floor(availableHeight)));
  // Le rendu et les coordonnées Java utilisent les mêmes pixels CSS.
  stage.style.removeProperty('transform');
  stage.style.width = `${width}px`;
  stage.style.height = `${height}px`;
  stage.style.left = `${Math.max(0, Math.floor((viewport.clientWidth - width) / 2))}px`;
  viewport.style.height = `${height + 8}px`;
  stage.style.top = fullscreen ? `${Math.max(0, Math.floor((viewport.clientHeight - height) / 2))}px` : '4px';
}
window.addEventListener('resize', fitJava);
document.addEventListener('fullscreenchange', fitJava);
fitJava();
viewport.addEventListener('contextmenu', event => event.preventDefault());
launch.addEventListener('click', async () => {
  launch.disabled = true;
  status.textContent = 'Chargement de Java… Le premier lancement peut prendre un moment.';
  try {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cjrtnc.leaningtech.com/5.0/loader.js';
      script.onload = resolve; script.onerror = reject; document.head.append(script);
    });
    await cheerpjInit({ version: 21, status: 'default' });
    status.textContent = 'Chargement du projet et de ses images…';
    const response = await fetch('shapecraft.jar');
    if (!response.ok) throw new Error('Le fichier du projet n’est pas accessible.');
    cheerpOSAddStringFile('/str/shapecraft.jar', new Uint8Array(await response.arrayBuffer()));
    cheerpjCreateDisplay(-1, -1, stage);
    document.getElementById('runtime-cover').hidden = true;
    status.textContent = 'Moteur prêt · L’interface Java s’ouvre dans le cadre.';
    fitJava();
    viewport.scrollIntoView({ block: 'start', behavior: 'instant' });
    const exit = await cheerpjRunJar('/str/shapecraft.jar');
    if (exit !== 0) throw new Error('Code de sortie Java : ' + exit);
  } catch (error) {
    console.error(error);
    status.textContent = 'Le jeu n’a pas pu démarrer. Recharge la page pour réessayer.';
    document.getElementById('runtime-cover').hidden = false;
    launch.disabled = false; launch.textContent = 'Recharger et réessayer'; launch.onclick = () => location.reload();
  }
});
document.getElementById('reset').addEventListener('click', () => location.reload());
document.getElementById('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await viewport.requestFullscreen();
  } catch { status.textContent = 'Le plein écran n’est pas disponible sur ce navigateur.'; }
});
