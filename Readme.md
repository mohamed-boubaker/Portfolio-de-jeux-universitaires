# 🎮 Portfolio de jeux universitaires

Les projets C++, Java et Python de Mohamed Boubaker, adaptés pour être exécutés dans le navigateur.

**[▶ Ouvrir le portfolio et jouer](https://mohamed-boubaker.github.io/Portfolio-de-jeux-universitaires/)**

- Jeu spatial : moteur C++ / Grapic compilé en WebAssembly.
- Géométrie Shark : moteur C++ / SDL2 compilé en WebAssembly, trois niveaux et musique originale.
- ShapeCraft : programme Java 21 et interface Swing exécutés via CheerpJ.
- BrickMaster et Pingouin Morpion : contrôleurs Python et templates exécutés via Pyodide, avec données locales à la session.

Les sources universitaires et les adaptations sont accessibles depuis chaque page. Les adaptations navigateur ont été réalisées avec l’aide de ChatGPT. Les anciennes versions simplifiées restent dans `Portfolio_Jeux_Web_Mohamed/`.

## Hébergement GitHub Pages

Dans **Settings → Pages → Build and deployment**, choisir **Deploy from a branch**, puis la branche **main** et le dossier **/docs**. Enregistrer avec **Save**.

Le dossier `docs/` contient la version complète prête à publier ; aucun build ni abonnement ChatGPT n’est nécessaire. Le fichier `.nojekyll` permet de servir directement tous les fichiers statiques, notamment les moteurs WebAssembly, le JAR Java et les paquets Python. Les liens sont relatifs pour fonctionner dans le sous-dossier du dépôt.

Le premier lancement des applications Java et Python nécessite une connexion Internet pour charger leurs moteurs depuis leurs CDN. Les données de ces applications restent dans l’onglet et sont réinitialisées au rechargement.
