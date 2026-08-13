/**
 * Garde d'accès des contenus réservés aux membres
 * ------------------------------------------------------------------
 * À placer en une seule ligne, juste après <body>, sur les pages dont le
 * catalogue indique access: 'membre' :
 *
 *   <script src="../../assets/js/protect.js"></script>
 *
 * Le script pose immédiatement un voile opaque (pour que le contenu ne
 * clignote pas), charge le catalogue et le module de comptes, puis :
 *   • membre connecté  → le voile disparaît, la lecture est enregistrée ;
 *   • visiteur         → le voile devient un panneau d'invitation.
 *
 * Rappel d'honnêteté : le fichier HTML reste public sur GitHub Pages. Cette
 * garde est côté navigateur — elle organise l'accès, elle ne le verrouille
 * pas. Voir l'en-tête de assets/js/auth.js.
 */
(function (global) {
  'use strict';

  var src = (document.currentScript && document.currentScript.src) || '';
  var cut = src.indexOf('assets/js/');
  var base = cut >= 0 ? src.slice(0, cut) : '';

  /* ── 1. Voile immédiat ─────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent =
    '.gr-veil{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;' +
    'padding:24px;background:#08070f;color:#f4efe4;' +
    'font-family:"Outfit",system-ui,-apple-system,sans-serif;text-align:center}' +
    '.gr-veil-spin{width:38px;height:38px;border-radius:50%;border:3px solid rgba(244,239,228,.18);' +
    'border-top-color:#f0c04b;animation:gr-spin .8s linear infinite}' +
    '@keyframes gr-spin{to{transform:rotate(360deg)}}' +
    '.gr-gate{max-width:460px}' +
    '.gr-gate .gr-gate-emoji{font-size:3.2rem;line-height:1;margin-bottom:14px}' +
    '.gr-gate h1{font-family:"Playfair Display",Georgia,serif;font-size:1.75rem;margin:0 0 10px}' +
    '.gr-gate p{margin:0 0 22px;font-size:.95rem;line-height:1.6;color:rgba(244,239,228,.7)}' +
    '.gr-gate-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}';
  document.head.appendChild(style);

  var veil = document.createElement('div');
  veil.className = 'gr-veil';
  veil.innerHTML = '<div class="gr-veil-spin" role="status" aria-label="Vérification de l\'accès"></div>';
  (document.body || document.documentElement).appendChild(veil);

  /* Filet de sécurité : si un script ne se charge pas, on n'emprisonne
     personne derrière un écran noir. */
  var failsafe = setTimeout(release, 6000);

  function release() {
    clearTimeout(failsafe);
    if (veil && veil.parentNode) veil.parentNode.removeChild(veil);
  }

  /* ── 2. Chargement des dépendances ─────────────────────────── */
  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = url;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Chargement impossible : ' + url)); };
      document.head.appendChild(s);
    });
  }

  function loadCss(url) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }

  /* ── 3. Contrôle ───────────────────────────────────────────── */
  function currentItem() {
    var GRENIER = global.GRENIER;
    var path = location.pathname.replace(/\\/g, '/');
    var parts = path.split('/').filter(Boolean);
    var file = parts.pop() || 'index.html';
    var dir = parts.slice(-2).join('/');
    return GRENIER.itemByPath(dir, file) ||
           GRENIER.itemByPath(parts.slice(-1).join('/'), file);
  }

  function showGate(item) {
    var GRENIER = global.GRENIER;
    var home = base + 'index.html';
    var backHref = item ? base + item.dir + '/index.html' : home;

    veil.innerHTML =
      '<div class="gr-gate">' +
        '<div class="gr-gate-emoji">' + (item ? item.emoji : '🔐') + '</div>' +
        '<h1>' + (item ? item.title : 'Contenu réservé') + '</h1>' +
        '<p>Ce contenu fait partie de la sélection réservée aux membres du Grenier. ' +
        'La création d\'un compte est gratuite, instantanée et reste sur cet appareil.</p>' +
        '<div class="gr-gate-actions">' +
          '<button class="gr-btn gr-btn-primary" type="button" data-gr="join">Créer mon compte</button>' +
          '<button class="gr-btn" type="button" data-gr="login">Me connecter</button>' +
          '<a class="gr-btn gr-btn-ghost" href="' + backHref + '">Retour</a>' +
        '</div>' +
      '</div>';

    function ask(mode) {
      GRENIER.auth.openModal({
        mode: mode,
        title: mode === 'login' ? 'Content de vous revoir' : 'Rejoindre le Grenier',
        message: 'Une fois connecté, « ' + (item ? item.title : 'ce contenu') + ' » s\'ouvre aussitôt.',
        onSuccess: function () { release(); if (item) GRENIER.auth.markSeen(item.id); }
      });
    }

    veil.querySelector('[data-gr="join"]').addEventListener('click', function () { ask('signup'); });
    veil.querySelector('[data-gr="login"]').addEventListener('click', function () { ask('login'); });
  }

  loadCss(base + 'assets/css/theme.css');

  loadScript(base + 'assets/js/catalog.js')
    .then(function () { return loadScript(base + 'assets/js/auth.js'); })
    .then(function () {
      clearTimeout(failsafe);
      var GRENIER = global.GRENIER;
      var item = currentItem();

      if (!item || GRENIER.auth.canAccess(item)) {
        if (item) GRENIER.auth.markSeen(item.id);
        release();
      } else {
        showGate(item);
      }
    })
    .catch(function () { release(); });
})(window);
