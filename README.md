# 🌟 Le Grenier des Apps

A browsable library of interactive stories, mini-games and tools for all ages —
built entirely with vanilla HTML, CSS & JavaScript. No frameworks, no build
steps, no server. Just open in a browser.

The landing page is a searchable library: 44 pieces of content across 7
universes, filterable by universe, age and access level, with favourites and a
"continue reading" shelf. Part of the catalogue is open to everyone; the rest
opens once a (local, free) account is created. Members also get **the Atelier**,
where they can compose new stories by hand or have Claude write one in the
house style.

## Structure

```
├── index.html              # The library (search, filters, favourites)
├── atelier.html            # Content creation — members only
├── lecture.html            # Reader for locally-created content
├── assets/
│   ├── css/theme.css       # Shared design system
│   └── js/
│       ├── catalog.js      # Single source of truth for every content item
│       ├── auth.js         # Local accounts + sign-in modal
│       ├── shell.js        # Shared nav bar, injected on every library page
│       ├── protect.js      # Access guard for member-only pages
│       ├── library.js      # Home page logic
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

Every entry in `assets/js/catalog.js` carries an `access` field:

| `access`   | Who can open it                                    |
|------------|----------------------------------------------------|
| `public`   | everyone — 25 items                                 |
| `membre`   | requires an account — 19 items, plus the Atelier    |

**The accounts are deliberately a soft gate, not real security.** The site is
static and served from GitHub Pages, so there is no backend: accounts live in
`localStorage`, exist only on the device that created them, and the underlying
HTML files stay reachable by direct URL. Passwords are never stored in clear
(PBKDF2-SHA256, random salt, 150 000 iterations) but anyone with access to the
browser can bypass the gate. It personalises the library and reserves the
Atelier — it does not protect anything. Real access control would need a server.

Member-only pages carry one extra line right after `<body>`:

```html
<script src="../../assets/js/protect.js"></script>
```

It draws an opaque veil, checks the catalogue and the session, then either
lifts the veil or turns it into a sign-up panel. To change an item's access
level, edit its `access` field in the catalogue and add or remove that line.

## The Atelier

`atelier.html` is the members-only creation area. Both modes produce the same
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
