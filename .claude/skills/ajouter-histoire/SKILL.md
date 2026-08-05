---
name: ajouter-histoire
description: Ajoute une nouvelle histoire HTML dans une catégorie de ce projet (stories/religion, arabe, legend, fun, science) — crée la page avec son bouton retour, génère la carte dans l'index de la catégorie, met à jour le compteur d'histoires, vérifie l'affichage et l'accès dans un navigateur, puis commit et push sur main. À utiliser dès qu'on demande d'ajouter/créer une histoire, un conte, un récit ou une légende au Grenier des Apps.
---

# Ajouter une histoire au Grenier des Apps

Routine complète et reproductible : de la page HTML jusqu'au push sur `main`.
Les 6 étapes ci-dessous sont **obligatoires et ordonnées**. Ne jamais passer à
l'étape suivante tant que la précédente n'est pas terminée, et ne jamais
commiter (étape 6) avant que l'étape 5 soit verte.

## Entrées attendues

| Paramètre   | Exemple                    | Si absent                                              |
|-------------|----------------------------|--------------------------------------------------------|
| Catégorie   | `science`                  | Demander (`religion`, `arabe`, `legend`, `fun`, `science`) |
| Titre       | `Marie Curie`              | Demander                                                |
| Slug        | `marie-curie`              | Déduire du titre : minuscules, sans accents, tirets      |
| Sujet/angle | `la radioactivité`         | Déduire du titre                                        |
| Chapitres   | `5`                        | 5 par défaut (6–10 pour un grand récit)                  |

Si la catégorie demandée n'existe pas encore, s'arrêter et demander
confirmation : créer une catégorie implique un nouvel `index.html` de catégorie
+ une carte dans l'`index.html` racine + la mise à jour du compteur
`N thèmes` de la section « Histoires ».

## Étape 1 — Créer la page de l'histoire

Fichier : `stories/<categorie>/<slug>.html`

1. Lire **une histoire voisine récente** de la même catégorie
   (ex. `stories/science/espace.html`, `stories/legend/al-khwarizmi.html`)
   et en reprendre l'ossature : palette `:root`, sections plein écran avec
   `scroll-snap`, chapitre par section, illustrations SVG inline, fin avec
   morale. `references/modele-histoire.html` donne le squelette minimal.
2. Contraintes du projet — **HTML/CSS/JS vanilla uniquement** :
   pas de framework, pas d'étape de build, aucune image binaire
   (les illustrations sont des `<svg>` écrits à la main), polices via
   Google Fonts, tout tient dans un seul fichier.
3. `<html lang="fr">`, sauf catégorie `arabe` :
   `<html lang="ar" dir="rtl">` et contenu en arabe.
4. Texte adapté aux enfants : phrases courtes, ton narratif, pas de violence
   graphique. Un `<h1>` de titre, un `<h2>` par chapitre.

## Étape 2 — Ajouter le bouton retour

Exactement comme les autres histoires de la catégorie, juste après `<body>` :

```html
<script src="../../components/back-button.js"></script>
<back-button href="index.html"></back-button>
```

- Catégorie `arabe` : ajouter l'attribut `rtl` →
  `<back-button href="index.html" rtl></back-button>`
- Couleur : `color="gold|green|blue|purple|red"` pour s'accorder à la palette
  de la page (défaut `gold`).
- Le `href` reste **relatif à la catégorie** (`index.html`), jamais absolu.

## Étape 3 — Générer la carte dans l'index de la catégorie

Fichier : `stories/<categorie>/index.html`, dans `<div class="grid" id="storyGrid">`.

1. Insérer la nouvelle carte **après la dernière carte réelle** et **avant**
   la carte `card-soon` (« Prochainement »), qui doit rester en dernier.
2. Copier la structure d'une carte existante (`references/modele-carte.html`) :
   `<a class="card" href="<slug>.html">` + `card-art` (SVG 400×300 aux couleurs
   de l'histoire) + `card-tag` / `card-title` / `card-desc` + `card-footer`
   avec le nombre de chapitres.
3. **Les `id` des dégradés SVG doivent être uniques dans la page** (préfixer
   par le slug : `id="curieBg"`, `id="curieGlow"`…), sinon les cartes
   existantes se repeignent avec le mauvais dégradé.
4. Si la grille dépasse 6 cartes, ajouter la règle d'animation correspondante
   (`.card:nth-child(7) { animation-delay:.7s; }`) dans le `<style>`.

## Étape 4 — Mettre à jour le compteur

Dans le même `index.html` de catégorie :

```html
<span><strong id="storyCount">3</strong> histoires disponibles</span>
```

Incrémenter la valeur écrite en dur pour qu'elle égale le nombre de cartes
réelles (hors `card-soon`). Le script de bas de page la recalcule à l'exécution,
mais la valeur statique doit rester juste (affichage avant JS, et cohérence du
diff). Ne pas toucher au `<script>` de recalcul.

Si une catégorie a été créée, mettre aussi à jour `index.html` (racine) :
la carte de la catégorie et le compteur `<span class="section-count">N thèmes</span>`.

## Étape 5 — Tester l'apparition et l'accès

Lancer le vérificateur (aucune dépendance à installer) :

```bash
python3 .claude/skills/ajouter-histoire/scripts/verifier_histoire.py \
  --categorie <categorie> --slug <slug>
```

Il contrôle, statiquement puis **dans Chromium headless** (page servie par un
serveur HTTP local, JS exécuté) :

- la page de l'histoire existe, est du HTML complet, a un `<title>` ;
- le bouton retour est présent, avec le bon `href` et la convention `rtl` de
  la catégorie ;
- la carte pointe vers `<slug>.html` dans la grille, avant la carte « à venir » ;
- le compteur statique = le nombre de cartes réelles = le compteur rendu ;
- le clic sur la carte mène bien à une page qui se charge (lien résolu sur
  disque **et** via HTTP) ;
- aucune erreur console sur les deux pages.

Tout doit être `OK`. En cas d'échec, corriger puis relancer — ne pas commiter
un test rouge. Le rapport final du script est à recopier dans la réponse.

## Étape 6 — Commit et push sur `main`

```bash
git checkout main && git pull origin main
git add stories/<categorie>/<slug>.html stories/<categorie>/index.html
git commit -m "Add \"<Titre>\" <categorie> story"
git push -u origin main
```

- Message de commit dans le style de l'historique du dépôt :
  `Add "L'Infini" science story`.
- Si le push échoue pour raison réseau, réessayer 4 fois (2s, 4s, 8s, 16s).
- Si la session impose une branche de travail dédiée, pousser sur **cette**
  branche et le signaler, plutôt que sur `main`.
- Le déploiement GitHub Pages (`.github/workflows/pages.yml`) se déclenche seul
  à chaque push sur `main` : indiquer à l'utilisateur que la page sera en ligne
  après le workflow.

## Rapport final

Terminer par : chemin de la nouvelle page, catégorie, nombre de chapitres,
ancien → nouveau compteur, résultat des tests, SHA du commit et branche poussée.
