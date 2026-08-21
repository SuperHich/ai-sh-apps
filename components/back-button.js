/**
 * <back-button> Web Component
 *
 * Usage:
 *   <back-button href="../index.html"></back-button>
 *   <back-button href="../../index.html" label="Accueil"></back-button>
 *   <back-button href="../index.html" color="blue"></back-button>
 *   <back-button href="../index.html" label="الرئيسية" rtl></back-button>
 *
 * Attributes:
 *   href  — (required) redirect path
 *   label — (optional) button text, default "Retour"
 *   color — (optional) preset name or custom rgb values, default "green"
 *           Presets: green, blue, gold, purple
 *   rtl   — (optional) if present, places arrow after label and positions button on the right
 */
class BackButton extends HTMLElement {
  static get observedAttributes() {
    return ['href', 'label', 'color', 'rtl'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  getColorValues(color) {
    const presets = {
      green:  { r: 30,  g: 107, b: 58  },
      blue:   { r: 30,  g: 80,  b: 160 },
      gold:   { r: 160, g: 120, b: 20  },
      purple: { r: 100, g: 40,  b: 140 },
      red:    { r: 200, g: 50,  b: 50  },
    };
    return presets[color] || presets['gold'];
  }

  render() {
    const href = this.getAttribute('href') || '#';
    const label = this.getAttribute('label') || 'Retour';
    const colorName = this.getAttribute('color') || 'gold';
    const isRtl = this.hasAttribute('rtl');
    const c = this.getColorValues(colorName);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 9999;
        }
        a {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 12px;
          background: rgba(${c.r},${c.g},${c.b},0.15);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(${c.r},${c.g},${c.b},0.3);
          color: rgb(${c.r},${c.g},${c.b});
          text-decoration: none;
          font-family: 'Nunito', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          transition: background 0.2s, transform 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        a:hover, a:focus {
          background: rgba(${c.r},${c.g},${c.b},0.25);
          transform: scale(1.05);
        }
      </style>
      <a href="${href}"${isRtl ? ' style="direction:rtl"' : ''}>
        ${isRtl ? label : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>`}
        ${isRtl ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>` : label}
      </a>
    `;
  }
}

customElements.define('back-button', BackButton);

/* ══════════════════════════════════════════════════════════════
   MESURE D'AUDIENCE
   GoatCounter : pas de cookie, pas de donnée personnelle, donc pas
   de bandeau de consentement à ajouter au site.

   Le script est chargé d'ici plutôt que collé dans les 66 pages :
   chaque page du site charge shell.js ou components/back-button.js,
   et les cinq index de catégorie chargent les deux — d'où le
   drapeau, qui évite de compter deux fois la même visite. Le bloc
   est donc écrit à l'identique dans les deux fichiers : s'il change
   ici, il doit changer là-bas.

   Rien n'est envoyé depuis un poste de développement : ni file://,
   ni localhost. Le tableau de bord ne montre que de vrais visiteurs.
   ══════════════════════════════════════════════════════════════ */
(function () {
  if (window.GRENIER_MESURE) return;

  var host = location.hostname;
  if (location.protocol === 'file:' || host === '' ||
      host === 'localhost' || host === '127.0.0.1' || host === '::1') return;

  window.GRENIER_MESURE = true;

  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://gc.zgo.at/count.js';
  tag.setAttribute('data-goatcounter', 'https://superhich.goatcounter.com/count');
  (document.head || document.documentElement).appendChild(tag);
})();
