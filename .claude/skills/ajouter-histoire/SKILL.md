---
name: ajouter-histoire
description: Met en ligne une histoire fournie en pièce jointe (txt, md, docx, pdf, html…) dans une catégorie de ce projet (stories/religion, arabe, legend, fun, science) — convertit le texte en page HTML avec son bouton retour, génère la carte dans l'index de la catégorie, met à jour le compteur d'histoires, vérifie l'affichage et l'accès dans un navigateur, commit et push sur main, puis déclenche et vérifie la publication GitHub Pages. À utiliser dès qu'on joint un fichier d'histoire ou qu'on demande d'ajouter une histoire, un conte, un récit ou une légende au Grenier des Apps.
---

# Ajouter une histoire au Grenier des Apps

Routine complète et reproductible : d'une **pièce jointe** contenant le texte de
l'histoire jusqu'au site publié sur GitHub Pages.
Les 7 étapes ci-dessous sont **obligatoires et ordonnées**. Ne jamais passer à
l'étape suivante tant que la précédente n'est pas terminée, et ne jamais
commiter (étape 6) avant que l'étape 5 soit verte. La routine n'est finie que
lorsque le site déployé correspond à `main` (étape 7).

## Entrées attendues

Le texte de l'histoire arrive **toujours en pièce jointe** — c'est la source de
vérité, elle n'est ni inventée ni réécrite.

| Paramètre   | Exemple                        | Si absent                                              |
|-------------|--------------------------------|--------------------------------------------------------|
| Pièce jointe| `/mnt/attach/marie-curie.docx` | Chercher le fichier le plus récent dans `/mnt/attach/`, sinon demander |
| Catégorie   | `science`                      | Proposer d'après le contenu, faire confirmer (`religion`, `arabe`, `legend`, `fun`, `science`) |
| Titre       | `Marie Curie`                  | Titre deviné par le lecteur de pièce jointe             |
| Slug        | `marie-curie`                  | Slug proposé par le lecteur (ASCII, minuscules, tirets) |
| Chapitres   | `5`                            | Découpage détecté dans le fichier                       |

Si la catégorie demandée n'existe pas encore, s'arrêter et demander
confirmation : créer une catégorie implique un nouvel `index.html` de catégorie
+ une carte dans l'`index.html` racine + la mise à jour du compteur
`N thèmes` de la section « Histoires ».

## Étape 0 — Lire la pièce jointe

Les fichiers joints à la conversation atterrissent dans `/mnt/attach/`
(sinon : chemin donné par l'utilisateur). Analyser le fichier :

```bash
python3 .claude/skills/ajouter-histoire/scripts/lire_piece_jointe.py /mnt/attach/<fichier>
python3 .claude/skills/ajouter-histoire/scripts/lire_piece_jointe.py /mnt/attach/<fichier> --texte
```

Il gère `.txt`, `.md`, `.html`, `.docx` sans dépendance et affiche : titre
deviné, slug proposé, volume, langue (détection arabe/RTL) et chapitres
détectés. Pour un `.pdf`, un `.doc`/`.odt` ou une image, passer par le skill
`pdf` / `docx` ou l'outil Read, puis reprendre ici.

Confirmer avec l'utilisateur, en une seule question groupée : catégorie, titre
final, slug, et découpage en chapitres retenu. Puis enchaîner sans autre
interruption jusqu'à l'étape 6.

## Étape 1 — Mettre le texte joint en page

Fichier : `stories/<categorie>/<slug>.html`

1. **Le texte de la pièce jointe est repris intégralement et tel quel.**
   Mise en forme, pas réécriture : ne pas reformuler, ne pas résumer, ne pas
   ajouter d'épisodes, ne pas « améliorer » le style. Corriger seulement les
   fautes de frappe évidentes, et signaler ces corrections dans le rapport
   final. Si un passage est inutilisable en l'état (illisible, incomplet),
   le dire plutôt que de l'inventer.
2. Lire **une histoire voisine récente** de la même catégorie
   (ex. `stories/science/espace.html`, `stories/legend/al-khwarizmi.html`)
   et en reprendre l'ossature : palette `:root`, sections plein écran avec
   `scroll-snap`, chapitre par section, illustrations SVG inline, fin avec
   morale. `references/modele-histoire.html` donne le squelette minimal.
3. Correspondance texte → HTML :
   - titre du fichier → `<h1>` du hero, avec accroche si le texte en fournit une ;
   - chaque chapitre détecté → une `<section>` avec `<h2>` ;
   - paragraphes → `<p>` ; dialogues et citations marquantes → `<blockquote>` ;
   - morale ou phrase de fin → section `.ending`.
   Aucun paragraphe du fichier ne doit disparaître au passage.
4. Contraintes du projet — **HTML/CSS/JS vanilla uniquement** :
   pas de framework, pas d'étape de build, aucune image binaire
   (les illustrations sont des `<svg>` écrits à la main d'après le contenu du
   texte), polices via Google Fonts, tout tient dans un seul fichier.
5. `<html lang="fr">`, sauf texte arabe (catégorie `arabe`) :
   `<html lang="ar" dir="rtl">`.
6. Ne pas commiter la pièce jointe elle-même : seule la page HTML entre dans le
   dépôt.

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
   avec le nombre de chapitres. Le `card-desc` est un résumé d'une ou deux
   phrases **du texte joint** — c'est le seul endroit où l'on rédige.
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
  --categorie <categorie> --slug <slug> --source /mnt/attach/<fichier>
```

`--source` est **obligatoire ici** : c'est lui qui vérifie que chaque
paragraphe de la pièce jointe se retrouve bien dans la page (détecte tout
texte réécrit, résumé ou oublié).

Il contrôle, statiquement puis **dans Chromium headless** (page servie par un
serveur HTTP local, JS exécuté) :

- la page de l'histoire existe, est du HTML complet, a un `<title>` ;
- le texte joint est repris intégralement (`--source`) ;
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
  branche et le signaler, plutôt que sur `main`. Dans ce cas l'étape 7 n'a
  lieu qu'une fois la branche fusionnée dans `main`.

## Étape 7 — Publier sur GitHub Pages et le vérifier

Le workflow `.github/workflows/pages.yml` se déclenche en principe seul à chaque
push sur `main`. **En principe seulement** : l'événement `push` a déjà été perdu
(fusion de la PR #2 → aucun run créé, site figé sur la version précédente), et un
run a déjà échoué à sa première tentative. La routine ne s'arrête donc pas au
push : elle vérifie que le site déployé correspond bien à `main`.

Les outils GitHub sont différés : les charger d'abord avec
`ToolSearch` → `select:mcp__github__actions_list,mcp__github__actions_run_trigger,mcp__github__get_job_logs`.

1. Relever le SHA de `main` après fusion : `git rev-parse origin/main`.
2. Lister les runs du workflow et chercher celui dont `head_sha` = ce SHA :
   `actions_list` (`list_workflow_runs`, `resource_id: pages.yml`,
   `workflow_runs_filter: {branch: main}`).
3. **Aucun run pour ce SHA** → le déclencher soi-même :
   `actions_run_trigger` (`run_workflow`, `workflow_id: pages.yml`, `ref: main`).
4. **Run en échec** → `actions_run_trigger` (`rerun_failed_jobs`).
5. Attendre la fin, puis confirmer avec `actions_list` (`list_workflow_jobs`) :
   `conclusion: success` sur les 5 étapes. Les logs du job
   (`get_job_logs`) doivent contenir `Reported success!` et
   `Evaluated environment url: https://superhich.github.io/ai-sh-apps/`.
6. Ne pas attendre entre deux appels avec `sleep` enchaînés : une boucle
   `until` courte, puis re-interroger l'API.

Hors session Claude, l'équivalent en ligne de commande est
`gh workflow run pages.yml --ref main` puis `gh run watch`.

**Honnêteté du rapport.** L'environnement d'exécution bloque la sortie réseau
vers `superhich.github.io` : impossible de charger le site publié pour le
vérifier. La preuve du déploiement vient des logs du workflow — le dire ainsi,
ne jamais affirmer avoir vu la page en ligne. Rappeler aussi à l'utilisateur de
faire un rechargement forcé (Ctrl/Cmd + Maj + R) : l'index est fortement mis en
cache par le navigateur.

## Rapport final

Terminer par : fichier source utilisé, chemin de la nouvelle page, catégorie,
nombre de chapitres, ancien → nouveau compteur, corrections faites au texte
(le cas échéant), résultat des tests, SHA du commit et branche poussée, et
état du déploiement Pages (numéro de run, SHA déployé, URL).
