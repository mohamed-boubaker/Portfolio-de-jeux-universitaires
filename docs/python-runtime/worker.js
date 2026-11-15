'use strict';
// Pyodide v314 utilise les workers module : aucun importScripts classique.
let python;
self.onmessage = async ({ data }) => {
  try {
    let result;
    if (data.type === 'boot') {
      self.postMessage({ progress: 'Chargement de Python…' });
      const { loadPyodide } = await import('https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs');
      python = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/',
        stdout: message => console.log(message),
        stderr: message => console.error(message)
      });
      self.postMessage({ progress: 'Préparation des pages et des données…' });
      await python.loadPackage(new URL('markupsafe-3.0.3-cp314-cp314-pyemscripten_2026_0_wasm32.whl', self.location.href).href);
      await python.loadPackage(new URL('jinja2-3.1.6-py3-none-any.whl', self.location.href).href);
      const [runtimeResponse, payloadResponse] = await Promise.all([
        fetch(new URL('runtime.py', self.location.href)), fetch(data.payloadURL)
      ]);
      if (!runtimeResponse.ok || !payloadResponse.ok) throw new Error('Les fichiers du projet ne sont pas accessibles.');
      python.runPython(await runtimeResponse.text());
      python.globals.set('payload_input', await payloadResponse.text());
      python.globals.set('project_base', data.base);
      result = python.runPython('boot(payload_input, project_base)');
    } else {
      if (!python) throw new Error('Le moteur est encore en cours de chargement.');
      python.globals.set('route_input', data.route || '');
      python.globals.set('post_input', JSON.stringify(data.post || {}));
      result = python.runPython('navigate(route_input, post_input)');
    }
    self.postMessage({ id: data.id, result: JSON.parse(result) });
  } catch (error) {
    console.error(error);
    self.postMessage({ id: data.id, stage: data.type === 'boot' ? 'boot' : 'request', error: String(error.message || error) });
  }
};
