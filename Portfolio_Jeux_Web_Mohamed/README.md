# Arcade de Mohamed — 5 jeux en démonstration web 🎮

Site web **statique**, utilisable sans serveur ni installation : ouvrez `index.html` dans un navigateur récent.

Ce site regroupe cinq **adaptations jouables simplifiées** de projets universitaires de L1, L2 et L3. Chaque jeu possède sa propre page :

| Page | Projet d'origine | Démo web jouable |
|---|---|---|
| `spatial.html` | Jeu spatial — C++ / Grapic, L1 | Rejoindre la Lune en évitant des astéroïdes |
| `shark.html` | Géométrie Shark — C++ / SDL2, L2 | Jeu de saut et d'obstacles |
| `morpion.html` | Pingouin Morpion — Python / PostgreSQL, L2 | Morpion contre l'ordinateur |
| `brickmaster.html` | BrickMaster — Python / PostgreSQL, L2 | Placement de formes sur une grille |
| `shapecraft.html` | ShapeCraft — Java / Swing, L3 | Usine avec tapis, rotateur, peintre et livraisons |

## Important — transparence

Ces jeux ne sont **pas des conversions exactes** des applications d'origine. Leur logique de démonstration a été recréée en **HTML, CSS et JavaScript**, sans réutiliser les codes Java/C++/Python originaux ni leurs assets ou leurs serveurs PostgreSQL. Certains mécanismes sont simplifiés ou différents. Les projets universitaires restent accessibles dans leurs dépôts originaux.

**Crédit à afficher dans la description du dépôt / CV :**
> Site de démonstration web créé avec l'aide de ChatGPT (OpenAI) en HTML, CSS et JavaScript. Il propose des adaptations jouables simplifiées de mes projets universitaires, distinctes des versions originales réalisées pendant ma formation.

## Comment tester sur ton ordinateur

1. Décompresser `Portfolio_Jeux_Web_Mohamed.zip`.
2. Ouvrir le dossier `Portfolio_Jeux_Web_Mohamed`.
3. Double-cliquer sur `index.html`.
4. Cliquer sur « Jouer à la démo ».

## Comment mettre le site en ligne gratuitement avec GitHub Pages

1. Sur GitHub, créer un **nouveau dépôt public** `portfolio-jeux-web` (sans README automatique).
2. Ouvrir le dossier extrait et **sélectionner les fichiers qui sont à l'intérieur**, `index.html`, les cinq autres `.html`, `assets/`, `js/` et `README.md`. **Ne pas téléverser le ZIP ni un dossier supplémentaire qui entourerait tout**.
3. Dans GitHub, cliquer **uploading an existing file**, glisser les fichiers sélectionnés, puis **Commit changes**.
4. Aller dans **Settings → Pages**.
5. Sous **Build and deployment**, mettre **Source = Deploy from a branch**, puis **Branch = main** et **Folder = /(root)**, cliquer **Save**.
6. Le site sera accessible à une adresse de la forme : `https://mohamed-boubaker.github.io/portfolio-jeux-web/` **après publication réussie**. Vérifier l'adresse exacte dans Settings → Pages.
7. Sur le README de chaque projet universitaire, ajouter un lien vers la démo du jeu (`spatial.html`, `shark.html`, etc.) via l'adresse du site.

**À ne pas faire :** publier des mots de passe, des données personnelles, des fichiers de cours protégés ou des ressources graphiques sans droits de publication. Ce pack est autonome et ne contient aucun secret ni image originale issue des ZIP de cours.

## Structure

```
index.html
spatial.html
shark.html
morpion.html
brickmaster.html
shapecraft.html
assets/style.css
js/spatial.js
js/shark.js
js/morpion.js
js/brickmaster.js
js/shapecraft.js
README.md
```

Site destiné à présenter le parcours et les projets de **Mohamed Boubaker**. Les mentions d'assistance IA sont présentes dans le site et dans ce README.
