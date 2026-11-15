'use strict';
const launch = document.getElementById('launch');
const frame = document.getElementById('project-frame');
const status = document.getElementById('runtime-status');
const alert = document.getElementById('runtime-error');
const base = new URL('.', location.href);
let worker, busy = false, counter = 0;
const objectURLs = [];

function send(route, post = {}) {
  if (busy || !worker) return;
  busy = true; frame.setAttribute('aria-busy', 'true');
  status.textContent = 'Mise à jour de la page…'; alert.hidden = true;
  worker.postMessage({ id: ++counter, route, post });
}
function connectPage(result) {
  objectURLs.splice(0).forEach(url => URL.revokeObjectURL(url));
  frame.onload = () => {
    const doc = frame.contentDocument;
    for (const [name, text] of Object.entries(result.downloads || {})) {
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      objectURLs.push(url);
      doc.querySelectorAll('a[href]').forEach(a => {
        if (a.getAttribute('href').endsWith('/' + name)) { a.href = url; a.download = 'historique.txt'; a.target = '_self'; }
      });
    }
    doc.querySelectorAll('.pion-image[data-couleur]').forEach(img => { img.style.borderColor = img.dataset.couleur; });
    doc.addEventListener('submit', event => {
      event.preventDefault();
      const post = {};
      const fields = new FormData(event.target);
      if (event.submitter?.name) fields.append(event.submitter.name, event.submitter.value);
      for (const [key, value] of fields.entries()) (post[key] ||= []).push(String(value));
      const action = event.target.getAttribute('action');
      const route = action ? action.replace(/^\/+|\/+$/g, '') : result.route;
      send(route, post);
    });
    doc.addEventListener('click', event => {
      const a = event.target.closest('a[href]');
      if (!a || a.href.startsWith('blob:')) return;
      const url = new URL(a.getAttribute('href'), base);
      if (url.origin !== location.origin) return;
      event.preventDefault();
      const route = url.pathname.startsWith(base.pathname) ? url.pathname.slice(base.pathname.length) : '';
      send(route.replace(/^\/+|\/+$/g, ''));
    });
    busy = false; frame.setAttribute('aria-busy', 'false');
    if (document.getElementById('quick-play')) document.getElementById('quick-play').disabled = false;
    status.textContent = 'Session locale · Tes données restent dans cet onglet.';
    history.replaceState(null, '', result.route ? '#' + result.route : base.pathname);
  };
  frame.srcdoc = result.html;
  frame.hidden = false;
  document.getElementById('runtime-cover').hidden = true;
}
function start() {
  if (busy) return;
  if (worker) worker.terminate();
  busy = true; launch.disabled = true; alert.hidden = true; frame.setAttribute('aria-busy', 'true');
  worker = new Worker(new URL('../python-runtime/worker.js', base), { type: 'module' });
  worker.onmessage = ({ data }) => {
    if (data.progress) { status.textContent = data.progress; return; }
    if (data.error) {
      busy = false; launch.disabled = false; frame.setAttribute('aria-busy', 'false');
      status.textContent = 'Le chargement ou l’action a été interrompu.';
      alert.textContent = data.stage === 'boot' ? 'L’application n’a pas pu démarrer. Recharge la page puis réessaie.' : 'Cette action n’a pas abouti. Tu peux réessayer ou réinitialiser la session.';
      alert.hidden = false;
      console.error(data.error);
      return;
    }
    connectPage(data.result);
    document.getElementById('reset').disabled = false;
  };
  worker.onerror = () => {
    busy = false; launch.disabled = false;
    status.textContent = 'Le moteur n’a pas pu démarrer. Recharge la page pour réessayer.';
  };
  worker.postMessage({ type: 'boot', id: ++counter, base: base.pathname.replace(/\/$/, ''), payloadURL: new URL('app-data.json', base).href });
}
launch.addEventListener('click', start);
document.getElementById('reset').addEventListener('click', () => { busy = false; start(); });
document.getElementById('quick-play')?.addEventListener('click', () => {
  send('Jeu', { bouton_lancer: ['JOUER'], choix_equipe1: ['#357DB8'], choix_equipe2: ['#D17835'], choix_config: ['DEMO_3X3'] });
});
