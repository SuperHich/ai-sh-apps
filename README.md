# 🌟 Le Grenier des Apps

A browsable library of interactive stories, mini-games and tools for all ages —
built entirely with vanilla HTML, CSS & JavaScript. No frameworks, no build
steps, no server. Just open in a browser.

The home page is a showcase — a curated selection, the latest arrivals and the
seven universes. The full catalogue lives on its own page, searchable and
filterable by universe, age and access level. Every entry is presented by a
hand-drawn SVG thumbnail rather than an icon. Part of the catalogue is open to
everyone; the rest opens once a (local, free) account is created.

## Structure

```
├── index.html              # Home — curated selection
├── bibliotheque.html       # Full catalogue (search + filters)
├── carte.html              # World map of the places in the stories
├── quiz.html               # Quizzes — one per universe
├── atelier.html            # Content creation — hidden behind a feature flag
├── lecture.html            # Reader for locally-created content
├── assets/
│   ├── favicon.svg         # Tab icon — the nav bar's brand mark
│   ├── favicon-mono.svg    # Monochrome silhouette for Safari pinned tabs
│   ├── css/theme.css       # Shared design system + motion
│   ├── thumbs/             # One 400×300 SVG thumbnail per content item
│   └── js/
│       ├── catalog.js      # Source of truth: items, curation, feature flags
│       ├── auth.js         # Local accounts + sign-in modal
│       ├── shell.js        # Shared nav bar, injected on every library page
│       ├── cards.js        # The content card, shared by home and catalogue
│       ├── carousel.js     # Stacked universe carousel (home)
│       ├── carte.js        # Map projection, pins, fan-out placement
│       ├── carte-data.js   # Coastlines, places and travellers' routes
│       ├── quiz.js         # Quiz engine
│       ├── quiz-data.js    # The questions, one block per universe
│       ├── protect.js      # Access guard — kept for future member-only pages
│       ├── home.js         # Home page logic
│       ├── bibliotheque.js # Catalogue filtering and search
│       ├── template.js     # House-style story page generator
│       └── atelier.js      # Guided + AI content creation
├── components/
│   └── back-button.js      # Reusable navigation Web Component
├── stories/
│   ├── arabe/              # Arabic stories (RTL)
│   ├── fun/                # Jokes & humour
│   ├── legend/             # World legends & heroes
│   ├── religion/           # Prophets & righteous figures
│   └── science/            # Science & discovery
├── games/
│   ├── color-blind-game.html
│   ├── famille-en-or.html
│   ├── hot-potato-game.html
│   ├── memory-game.html
│   ├── mot-cache-game.html
│   ├── reaction-game.html
│   ├── simon-game.html
│   └── timer-game.html
├── tools/
│   └── financial_calculator.html
└── .github/workflows/
    └── pages.yml             # GitHub Pages deployment workflow
```

## Running

Open `index.html` in any modern browser. A plain static server
(`python3 -m http.server`) is recommended: opening over `file://` works, but
`crypto.subtle` is unavailable there, so password hashing silently falls back
to a much weaker scheme, and the AI generator needs an HTTPS origin.

## Accounts and access levels

**Everything in the catalogue is open, and accounts are not offered at all.**
No account is needed — nor proposed — to read a story, play a game or open a
tool, from any entry point: home page, catalogue, category index or direct
URL. The nav bar has no "Rejoindre" button and no account menu.

Every entry in `assets/js/catalog.js` still carries an `access` field:

| `access`   | Who can open it        |
|------------|------------------------|
| `public`   | everyone — all 44 items |
| `membre`   | requires an account — none at the moment |

The field and the whole mechanism (locked card state, access filter,
`assets/js/protect.js`) are kept on purpose, for the day part of the catalogue
moves behind an account or a subscription. While no item is `membre`, the
access filter hides itself from the catalogue page rather than offering a
choice that filters nothing.

Favourites and the "Reprendre" rail keep working without an account: they live
in `localStorage`, keyed to the browser, not to a user.

Bringing accounts back is one flag away — `GRENIER.features.comptes = true` in
`assets/js/catalog.js`. While it is `false`, `auth.canAccess()` treats every
item as public **whatever the catalogue says**, so a `membre` item can never
become a locked card with no door: no sign-up prompt, no lock. A visitor who
signed in before the flag was lowered keeps their account menu, so they can
still log out.

**The accounts are deliberately a soft gate, not real security.** The site is
static and served from GitHub Pages, so there is no backend: accounts live in
`localStorage`, exist only on the device that created them, and the underlying
HTML files stay reachable by direct URL. Passwords are never stored in clear
(PBKDF2-SHA256, random salt, 150 000 iterations) but anyone with access to the
browser can bypass the gate. Real access control would need a server.

To put an item back behind an account: set its `access` to `'membre'` in the
catalogue, and add one line right after `<body>` in its page:

```html
<script src="../../assets/js/protect.js"></script>
```

It draws an opaque veil, checks the catalogue and the session, then either
lifts the veil or turns it into a sign-up panel.

## Quizzes and the map

Two ways in that are not a list of cards.

**`quiz.html`** runs one quiz per universe — Prophètes & Sagesse, Légendes du
monde and Sciences & Découvertes. Every question comes
from a story already on the site, and every answer, right or wrong, links back
to the story it came from: the quiz rewards reading rather than replacing it.
Questions and answers are shuffled on each run, one question is shown at a
time, and the whole thing works from the keyboard (1–4 to answer, Enter to
advance). Adding a quiz is one block in `assets/js/quiz-data.js`, one item in
the catalogue, one thumbnail.

**`carte.html`** places the stories on a world map — 26 of them, on 17 places,
plus the dotted routes of Elissa, Hannibal, Colomb, Ibn Battuta, Napoléon and
Einstein. Coastlines and pins share one equirectangular projection
(`x = (lon+180)/360·L`, `y = (90-lat)/180·H`), so a pin lands where it belongs
without any hand-tuning. The coastlines are deliberately coarse — a storyteller's
map, not an atlas.

Two problems were worth solving properly there. Eight places sit within a few
degrees of each other in the Near East, so their markers overlapped into one
unclickable blob: each cluster now fans out around its centroid, keeping a dot
at the true position with a thread back to it. And an invisible 29px disc under
each pin brings the touch target above the 24×24px floor of WCAG 2.5.8. The
same information is repeated as a plain list under the map, for anyone who
would rather not poke at a map at all.

## Tab icon

`assets/favicon.svg` reproduces the nav bar's brand mark — the rounded tile and
the four-pointed sparkle — so the site is recognisable in a crowded tab strip.
Two deliberate departures from the nav version: the tile is painted solid
(gold → ember → violet) instead of the bar's translucent gradient, which would
vanish on a white tab strip, and the star is cut out dark rather than laid on
in cream, to hold its contrast down at 16px.

Every page in the repo declares it, with `rel="mask-icon"` alongside for
Safari's pinned tabs. `assets/js/template.js` and the story template in
`.claude/skills/ajouter-histoire` emit the same two lines, so new stories carry
the icon without anyone remembering to add it.

It is **SVG only** — no `.ico`, no `.png`. That keeps the repo free of binary
assets, as everywhere else here, and every current browser reads an SVG
favicon (Chrome, Edge, Firefox, Safari 16+). The cost is that Safari 15 and
earlier fall back to the default page icon, and iOS "Add to Home Screen" uses
a screenshot rather than the icon — both would need a PNG.

## The catalogue on a phone

The filter bar is sticky, which is what you want on a 44-item catalogue — but
eleven wrapped chips made it 476px tall on a 390px-wide screen, more than half
the viewport, leaving no room for the results underneath. Below 720px each
chip group now sits on a single horizontally-scrollable line, which pins the
bar to two rows (156px, 18% of the screen) at any width. Chips get a 44px
minimum height there, and the bar's background is opaque with the fade moved
just below it, so cards no longer read through it.

## Thumbnails

Every card is built around a 400×300 SVG in `assets/thumbs/`, named after the
item's `id`. Thirty-five of them were lifted from the hand-drawn card art that
already lived in the category index pages; the nine games and the tool got new
ones drawn in the same idiom.

They are **static on purpose**. An earlier version animated them from inside the
SVG, which looked good in isolation but broke down at scale: with 44 animated
SVGs rasterising at once, Chromium silently dropped some of them, for continuous
GPU work and no benefit. Motion belongs to the card — reveal on scroll, zoom on
hover — not to 44 images competing in the background.

Images are `loading="lazy"` with `width`/`height` attributes, so the grid
reserves its space and never shifts as thumbnails arrive.

## The universe carousel

The seven universes on the home page are a **stacked carousel**
(`assets/js/carousel.js`): the cards fan out around a centre one, follow the
finger or the mouse, and settle on the nearest card with a spring.

It is a hand port of a React component (`carousel-07.tsx`, built on
`motion/react`, Tailwind and shadcn/ui). The geometry and the drag maths are
kept as-is:

```
x      = offset * xMultiplier            scale  = 1 - |offset| * scaleReduction
y      = |offset| * yMultiplier          zIndex = round(100 - |offset| * 10)
rotate = offset * rotationMultiplier     shift  = clamp(round(-dx / distanceDivisor
         (0 when |offset| < 0.05)                        + -v / velocityDivisor), -3, 3)
```

The `spring` from `motion` (stiffness 200, damping 30, mass 1) is integrated by
hand in `requestAnimationFrame` — four sub-steps per frame, because a single
32 ms step at that stiffness diverges.

**Why it was ported rather than installed.** The component's prerequisites are a
React app with Tailwind, TypeScript and the shadcn `components/ui` folder. This
site has no build step at all: files are served exactly as they are committed.
Adopting them would mean rewriting all 44 content pages, so the logic was
brought over instead. `docs/carousel-univers.md` records the mapping and the
setup instructions that would apply if the site ever does move to React.

Three pointer-handling traps are worth knowing about. Two of them looked like
"the drag only works one way": an `<a>` is natively draggable, so Chrome
hijacked the gesture with its own drag-and-drop (`draggable="false"` fixes
it), and `Math.round` leans towards +∞, which made the backward threshold
slightly harder to cross than the forward one (rounding on the absolute value
fixes it). The third killed the click entirely: `setPointerCapture` on the
stage retargets the compatibility mouse events — `mousedown`, `mouseup` and
therefore `click` — to the capturing element, so the click never reached the
slide's link and no universe ever opened. The drag is tracked with `window`
listeners instead.

Two things were **added** to the original:

- **Arrows, dots, keyboard.** WCAG 2.2 §2.5.7 (*Dragging Movements*, level AA)
  requires a single-pointer alternative to any drag operation. The source
  component can only be driven by dragging. Focusing a buried card also brings
  it to the front, so tabbing through the universes works.
- **`prefers-reduced-motion`**, which skips the spring and jumps to the target.

## Feature flags

`GRENIER.features` in `assets/js/catalog.js` decides what the interface exposes:

```js
GRENIER.features = { atelier: false, comptes: false };
```

`atelier` — with it off, the Atelier disappears from the nav bar, the account
menu and the home page, and `atelier.html` shows a "not open yet" panel. **No
code is removed** — markup carrying `data-feature="atelier"` stays in the page
and `shell.js` reveals it when the flag flips. To work on the feature
meanwhile, open `atelier.html?preview=1`.

`comptes` — with it off, nothing invites a visitor to sign in or sign up, and
nothing can be reserved for members (see the section above). `auth.js` stays
loaded and complete: the modal, PBKDF2 hashing, sessions and favourites are all
still there, waiting for the flag. The Atelier's own sign-up flow keeps working
behind `atelier.html?preview=1`, which is not public either.

## The Atelier

`atelier.html` is the members-only creation area, currently hidden behind the
flag above. Both modes produce the same
thing: a self-contained HTML page in the house style, previewed in a sandboxed
iframe before it is kept.

- **Guided mode** — title, universe, age, chapters (`##` opens a chapter, blank
  lines separate paragraphs) and a closing moral. `assets/js/template.js` lays
  it out.
- **AI mode** — describe the idea in a sentence and Claude writes the whole
  page. Because there is no backend, the browser calls the Anthropic API
  **directly** with the user's own key (`anthropic-dangerous-direct-browser-access`),
  streaming the result. The key stays in the browser and is only persisted if
  the user ticks the box; use a dedicated key with a spend cap. The request runs
  on `claude-opus-5` and opts into server-side refusal fallbacks by default,
  retrying without them if the account lacks the beta.

Saved creations live in `localStorage` and appear in the library tagged
*Ma création*, readable through `lecture.html`. To publish one for everyone,
download the HTML file and drop it into `stories/<universe>/` — the
`/ajouter-histoire` routine handles the rest.

## Deployment

The site is deployed to GitHub Pages via `.github/workflows/pages.yml`. The workflow uploads the static files at the repository root and deploys them on every push to `main`.

## Adding a story (Claude Code routine)

The repeatable procedure for adding a story lives in
`.claude/skills/ajouter-histoire/`. Attach the story file (`.txt`, `.md`,
`.docx`, `.html`, `.pdf`…) and run:

```
/ajouter-histoire science
```

It walks the seven steps: read the attachment (source of truth — the text is
laid out, never rewritten), create `stories/<category>/<slug>.html`, add the
`<back-button>` like its siblings, generate the card in the category index,
bump the story counter, verify the result, commit and push, then make sure the
Pages workflow actually deployed the new `main` (a merge has already gone out
without triggering one) — dispatching or re-running it when it didn't.

Reading an attachment is a standalone script too — `.txt`, `.md`, `.html` and
`.docx`, no dependencies; it reports the guessed title, an ASCII slug, the
detected chapters and whether the text is RTL:

```bash
python3 .claude/skills/ajouter-histoire/scripts/lire_piece_jointe.py \
  /mnt/attach/marie-curie.docx
```

The verification step is a standalone script — usable without Claude:

```bash
python3 .claude/skills/ajouter-histoire/scripts/verifier_histoire.py \
  --categorie science --slug marie-curie --source /mnt/attach/marie-curie.docx
```

It runs static checks (file, back-button, card, counter, relative links,
duplicate SVG ids) then loads both pages in headless Chromium over a local HTTP
server to confirm the card renders, the counter matches, the story is reachable
and no console/HTTP error occurs. With `--source`, it also checks every
paragraph of the original attachment made it into the page — no rewriting, no
silent trimming. Exit code 0 means the change is safe to push.
Add `--sans-navigateur` to skip the browser checks.

## Reusable Components

### `<back-button>`

A Web Component for consistent navigation across all pages.

```html
<script src="../../components/back-button.js"></script>
<back-button href="../index.html"></back-button>
```

| Attribute | Default    | Description                              |
|-----------|------------|------------------------------------------|
| `href`    | `#`        | Navigation target path                   |
| `label`   | `Retour`   | Button text                              |
| `color`   | `green`    | Preset: `green`, `blue`, `gold`, `purple`|
