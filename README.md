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
│   │   └── petit_aigle.html
│   └── religion/           # Prophets stories
│       ├── index.html
│       ├── adam.html
│       ├── ibrahim.html
│       ├── moise.html
│       ├── jesus.html
│       ├── mohamed.html
│       ├── noe.html
│       ├── younes.html
│       ├── youssef.html
│       └── haroun.html
└── games/
    ├── memory-game.html
    ├── simon-game.html
    ├── reaction-game.html
    ├── color-blind-game.html
    ├── hot-potato-game.html
    ├── mot-cache-game.html
    └── timer-game.html
```

## Running

Open `index.html` in any modern browser — no server required.

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
