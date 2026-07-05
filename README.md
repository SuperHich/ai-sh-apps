# 🌟 Le Grenier des Apps

A collection of interactive stories and mini-games for kids — built entirely with vanilla HTML, CSS & JavaScript. No frameworks, no build steps. Just open in a browser.

## Structure

```
├── index.html              # Main landing page
├── components/
│   └── back-button.js      # Reusable navigation Web Component
├── stories/
│   ├── arabe/              # Arabic stories (RTL)
│   │   ├── index.html
│   │   ├── aventure-nour.html
│   │   ├── petit_aigle.html
│   │   ├── poisson_dore.html
│   │   ├── samsoum.html
│   │   └── squirrel.html
│   ├── fun/                # Jokes & humour
│   │   ├── index.html
│   │   └── blagues1.html
│   ├── legend/             # World legends & heroes
│   │   ├── index.html
│   │   ├── dinosaures.html
│   │   ├── elissa.html
│   │   ├── hannibal.html
│   │   ├── karoun.html
│   │   ├── napoleon.html
│   │   └── robinhood.html
│   └── religion/           # Prophets & righteous figures
│       ├── index.html
│       ├── adam.html
│       ├── dawud.html
│       ├── haroun.html
│       ├── haroun_rachid.html
│       ├── ibrahim.html
│       ├── ilyes.html
│       ├── jesus.html
│       ├── mohamed.html
│       ├── moise.html
│       ├── noe.html
│       ├── omar.html
│       ├── soulayman.html
│       ├── younes.html
│       └── youssef.html
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

Open `index.html` in any modern browser — no server required.

## Deployment

The site is deployed to GitHub Pages via `.github/workflows/pages.yml`. The workflow uploads the static files at the repository root and deploys them on every push to `main`.

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
