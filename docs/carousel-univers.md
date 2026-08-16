# Le carrousel des univers — du composant React au JS natif

Le carrousel de la page d'accueil vient d'un composant React fourni
(`carousel-07.tsx`, `CarouselStacked`). Ce document explique pourquoi il a été
porté plutôt qu'installé, ce qui a été conservé à l'identique, et ce qu'il
faudrait faire si le site adoptait un jour React.

---

## 1. Le préalable demandé par le composant

Le composant suppose un projet qui offre :

| Prérequis | Rôle |
|---|---|
| Structure shadcn/ui | fournit `Badge`, `cn()`, et le dossier `components/ui` |
| Tailwind CSS | toutes les classes utilitaires du composant (`absolute`, `rounded-2xl`…) |
| TypeScript | le composant est typé (`interface CarouselItem`, `React.FC<Props>`) |
| React + `motion/react` | `motion.div`, `useMotionValue`, `animate`, `spring` |
| `class-variance-authority` | variantes du `Badge` shadcn |

### État réel du dépôt

`Le Grenier des Apps` est un site **statique sans étape de compilation** :
HTML, CSS et JS servis tels quels par GitHub Pages
(`.github/workflows/pages.yml` publie la racine du dépôt sans rien construire).
Il n'y a ni `package.json`, ni `node_modules`, ni bundler. Chaque histoire est
un fichier HTML autonome, ouvrable en double-cliquant dessus.

Aucun des cinq prérequis n'est donc présent, et ce n'est pas un oubli : c'est la
contrainte de départ du projet (voir la routine « ajouter une histoire » dans
`.claude/skills/ajouter-histoire`).

### Décision

Le composant a été **porté** en JS natif dans `assets/js/carousel.js`, et son
habillage traduit en CSS dans `assets/css/theme.css` (`.gr-carousel`,
`.gr-slide`, `.gr-badge`).

Installer la chaîne React aurait signifié convertir 44 pages de contenu, un
générateur de pages (`assets/js/template.js`), une coquille de navigation
injectée à l'exécution et un déploiement sans build — pour un seul composant
d'accueil. Le rapport coût / bénéfice ne le justifie pas.

---

## 2. Ce qui a été repris à l'identique

### Géométrie de la pile

```
offset = index - position          (distance signée à la carte centrale)

x      = offset * xMultiplier
y      = |offset| * yMultiplier
rotate = offset * rotationMultiplier      → 0 si |offset| < 0.05
scale  = 1 - |offset| * scaleReduction
zIndex = round(100 - |offset| * 10)
```

### Quantification au relâcher

```
shift = clamp(round(-dx / distanceDivisor + -velocity / velocityDivisor), -3, 3)
```

### Ressort

`spring(stiffness: 200, damping: 30, mass: 1)` de `motion` est intégré à la main
dans une boucle `requestAnimationFrame` :

```js
force = -stiffness * (position - target) - damping * velocity;
velocity += (force / mass) * h;
position += velocity * h;
```

avec quatre sous-pas par image (`h = dt / 4`) : à cette raideur, un pas unique de
32 ms diverge.

### Paliers de largeur

Trois jeux de constantes, comme dans le composant d'origine :

| Largeur | x | y | rotation | scaleReduction | distance | velocity |
|---|---|---|---|---|---|---|
| < 640 px | 150 | 40 | 8° | 0.06 | 180 | 900 |
| < 1024 px | 180 | 52 | 10° | 0.09 | 216 | 900 |
| ≥ 1024 px | 200 | 64 | 12° | 0.12 | 240 | 900 |

`distance` vaut 1,2 × `x` : le seuil de bascule tombe à 0,6 largeur de carte,
là où l'œil considère que la carte suivante a pris la place de l'autre.

Trois détails décident du confort du geste, et manquaient à la première
version :

- **`<a draggable="false">`.** Un lien est nativement déplaçable : sans cela,
  Chrome démarre son propre glisser-déposer au bout de quelques pixels, avale
  les `pointermove` et coupe le geste — au hasard de l'endroit où l'on
  appuie, donc « ça marche dans un sens et pas dans l'autre ».
- **Arrondi symétrique.** `Math.round` penche vers +∞ : `round(0.5)` vaut 1
  mais `round(-0.5)` vaut 0. Le seuil était donc légèrement plus dur à
  franchir vers l'arrière. On arrondit sur la valeur absolue.
- La prise de focus est ignorée quand elle vient d'un clic
  (`:focus-visible`) : sinon le ressort se déclenchait au milieu du geste.

### Correspondance des dépendances

| Composant React | Équivalent natif ici |
|---|---|
| `motion/react` — `animate` + `spring` | intégrateur de ressort dans `carousel.js` |
| `motion/react` — `drag="x"` / `onDragEnd` | `pointerdown` / `pointermove` / `pointerup` + `setPointerCapture` |
| shadcn `Badge` (via `class-variance-authority`) | `.gr-badge` dans `theme.css`, couleur pilotée par `--accent` |
| Classes Tailwind | classes du design system (`--gr-*`) |
| `React.FC` typé | JSDoc `@param` sur `GRENIER.stackedCarousel` |

**Aucune dépendance npm n'a été ajoutée** : `motion` et
`class-variance-authority` n'auraient pas de chaîne pour être empaquetés.

---

## 3. Ce qui a été ajouté

### Accessibilité — obligatoire, pas optionnel

Le composant source ne se manipule qu'en glissant. **WCAG 2.2, critère 2.5.7
« Dragging Movements » (niveau AA)** exige une alternative à pointeur unique
pour toute action au glisser. Ont donc été ajoutés :

- des flèches **Univers précédent / suivant** (46 × 46 px, au-dessus du minimum
  de 44 × 44 px du critère 2.5.8) ;
- des **pastilles** nommées (« Afficher « Mini-jeux » »), avec `aria-current`,
  et une cible tactile de 44 px de haut même si la pastille peinte fait 8 px ;
- les **flèches ← →**, `Origine` et `Fin` au clavier ;
- la **prise de focus** d'une carte enfouie la ramène au premier plan, pour que
  la tabulation ne donne jamais le focus à un lien invisible ;
- une région `aria-live="polite"` qui annonce « <univers> — univers N sur 7 ».

### Mouvement réduit

`prefers-reduced-motion: reduce` supprime le ressort : le carrousel saute
directement à la carte visée.

### Défilement circulaire

Sept univers, pas de butée : l'écart est calculé modulo 7, et passer du dernier
au premier tourne d'un cran, pas de six.

---

## 4. Si le site passait un jour à React

Marche à suivre pour retrouver le composant d'origine tel quel.

```bash
# 1. Un projet React + TypeScript + Vite
npm create vite@latest grenier -- --template react-ts
cd grenier && npm install

# 2. Tailwind CSS
npm install -D tailwindcss @tailwindcss/vite
# vite.config.ts : ajouter le plugin tailwindcss()
# src/index.css  : @import "tailwindcss";

# 3. Alias @/* dans tsconfig.json et vite.config.ts
#    "paths": { "@/*": ["./src/*"] }

# 4. shadcn/ui
npx shadcn@latest init
npx shadcn@latest add badge

# 5. Dépendances du composant
npm install motion class-variance-authority
```

Puis déposer `carousel-07.tsx` dans `src/components/ui/`.

### Pourquoi `components/ui` précisément

Ce n'est pas une convention esthétique : `npx shadcn add <composant>` **écrit**
dans le dossier déclaré par `components.json` (`aliases.ui`, par défaut
`@/components/ui`), et les composants générés s'importent entre eux par ce même
alias — `carousel-07.tsx` fait `import { Badge } from "@/components/ui/badge"`.
Un dossier différent oblige à corriger `components.json` **et** chaque import à
la main, à chaque `shadcn add`. Le dossier est aussi la frontière du projet :
`components/ui` contient du code appartenant au projet (modifiable, versionné),
le reste de `components/` contient les composants métier qui les assemblent.

### Ce qu'il ne faudrait pas perdre au passage

Le composant d'origine n'a ni flèches, ni clavier, ni `prefers-reduced-motion`.
Une bascule vers React devrait **reporter la section 3 de ce document**, sans
quoi le carrousel repasserait sous le niveau AA.
