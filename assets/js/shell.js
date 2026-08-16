/**
 * Coquille partagée du Grenier des Apps
 * ------------------------------------------------------------------
 * Injecte la barre de navigation fixe (marque, liens, recherche, compte)
 * sur toutes les pages de la bibliothèque, et enrichit les index de
 * catégorie existants : cadenas sur les cartes réservées, interception du
 * clic, décalage sous la barre.
 *
 * Configuration facultative avant le chargement du script :
 *   window.GRENIER_SHELL = {
 *     active: 'home' | 'library' | 'atelier',
 *     search: true,            // afficher le champ de recherche
 *     aurora: true,            // fond animé (pages de la bibliothèque)
 *     onSearch: function (q) {} // sinon la recherche renvoie vers l'accueil
 *   };
 */
(function (global) {
  'use strict';

  var GRENIER = global.GRENIER || (global.GRENIER = {});
  var cfg = global.GRENIER_SHELL || {};
  var base = GRENIER.base || '';

  var ICON_SEARCH =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';

  var NAV_ITEMS = [
    { key: 'home',    label: 'Accueil',      href: 'index.html' },
    { key: 'library', label: 'Bibliothèque', href: 'bibliotheque.html' },
    { key: 'atelier', label: 'Atelier',      href: 'atelier.html', feature: 'atelier' }
  ];

  function visible(item) {
    return !item.feature || (GRENIER.features && GRENIER.features[item.feature]);
  }

  /* ── Fond animé ────────────────────────────────────────────── */
  function mountAurora() {
    if (document.querySelector('.gr-aurora')) return;
    var aurora = document.createElement('div');
    aurora.className = 'gr-aurora';
    aurora.setAttribute('aria-hidden', 'true');
    aurora.innerHTML = '<span></span><span></span><span></span>';
    document.body.insertBefore(aurora, document.body.firstChild);
  }

  /* ── Barre de navigation ───────────────────────────────────── */
  function mountNav() {
    var nav = document.createElement('nav');
    nav.className = 'gr-nav';
    nav.setAttribute('aria-label', 'Navigation principale');

    var links = NAV_ITEMS.filter(visible).map(function (item) {
      var active = item.key === cfg.active ? ' is-active' : '';
      return '<a class="gr-nav-link' + active + '" href="' + base + item.href + '">' + item.label + '</a>';
    }).join('');

    nav.innerHTML =
      '<button class="gr-nav-toggle" type="button" aria-label="Ouvrir le menu" aria-expanded="false">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
        'stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>' +
      '</button>' +
      '<a class="gr-brand" href="' + base + 'index.html">' +
        '<span class="gr-brand-mark" aria-hidden="true">✦</span>' +
        '<span class="gr-brand-text">Le <em>Grenier</em></span>' +
      '</a>' +
      '<div class="gr-nav-links">' + links + '</div>' +
      '<div class="gr-nav-spacer"></div>' +
      (cfg.search === false ? '' :
        '<div class="gr-nav-search">' + ICON_SEARCH +
          '<input type="search" placeholder="Rechercher une histoire, un jeu…" ' +
          'aria-label="Rechercher dans la bibliothèque" data-gr="search">' +
        '</div>') +
      '<div data-gr="account"></div>';

    document.body.insertBefore(nav, document.body.firstChild);

    /* Menu mobile */
    var toggle = nav.querySelector('.gr-nav-toggle');
    var linkBar = nav.querySelector('.gr-nav-links');
    toggle.addEventListener('click', function () {
      var open = linkBar.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    /* Ombre au défilement */
    var onScroll = function () { nav.classList.toggle('is-scrolled', global.scrollY > 12); };
    global.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Recherche */
    var search = nav.querySelector('[data-gr="search"]');
    if (search) {
      if (typeof cfg.onSearch === 'function') {
        search.addEventListener('input', function () { cfg.onSearch(search.value); });
      } else {
        search.addEventListener('keydown', function (e) {
          if (e.key !== 'Enter') return;
          var q = search.value.trim();
          location.href = base + 'bibliotheque.html' + (q ? '?q=' + encodeURIComponent(q) : '');
        });
      }
      GRENIER.searchInput = search;
    }

    /* Raccourci clavier « / » */
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (search) { e.preventDefault(); search.focus(); }
    });

    renderAccount(nav.querySelector('[data-gr="account"]'));
    return nav;
  }

  /* ── Zone compte ───────────────────────────────────────────── */
  function renderAccount(slot) {
    function draw() {
      var user = GRENIER.auth.current();
      slot.innerHTML = '';

      if (!user) {
        var btn = document.createElement('button');
        btn.className = 'gr-btn gr-btn-primary';
        btn.type = 'button';
        btn.textContent = 'Rejoindre';
        btn.addEventListener('click', function () { GRENIER.auth.openModal({}); });
        slot.appendChild(btn);
        return;
      }

      var wrap = document.createElement('div');
      wrap.style.position = 'relative';

      var initial = (user.name || '?').trim().charAt(0).toUpperCase();
      var account = document.createElement('button');
      account.className = 'gr-account';
      account.type = 'button';
      account.setAttribute('aria-haspopup', 'true');
      account.setAttribute('aria-expanded', 'false');
      account.innerHTML = '<span class="gr-avatar">' + initial + '</span><span>' + escapeHtml(user.name) + '</span>';

      var menu = document.createElement('div');
      menu.className = 'gr-panel';
      menu.style.cssText =
        'position:absolute;top:calc(100% + 10px);right:0;min-width:210px;padding:8px;' +
        'z-index:950;display:none;border-radius:16px';
      menu.innerHTML =
        (GRENIER.features && GRENIER.features.atelier
          ? '<a class="gr-nav-link" style="display:block" href="' + base + 'atelier.html">🎨 Mon Atelier</a>'
          : '') +
        '<a class="gr-nav-link" style="display:block" href="' + base + 'index.html#favoris">💖 Mes favoris</a>' +
        '<button class="gr-nav-link" type="button" style="display:block;width:100%;text-align:left;' +
        'border:none;background:none;font:inherit;cursor:pointer" data-gr="logout">↩ Se déconnecter</button>';

      account.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = menu.style.display === 'none';
        menu.style.display = open ? 'block' : 'none';
        account.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', function () {
        menu.style.display = 'none';
        account.setAttribute('aria-expanded', 'false');
      });
      menu.addEventListener('click', function (e) { e.stopPropagation(); });
      menu.querySelector('[data-gr="logout"]').addEventListener('click', function () {
        GRENIER.auth.logout();
        menu.style.display = 'none';
      });

      wrap.appendChild(account);
      wrap.appendChild(menu);
      slot.appendChild(wrap);
    }

    draw();
    GRENIER.auth.onChange(draw);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  GRENIER.escapeHtml = escapeHtml;

  /* ══════════════════════════════════════════════════════════════
     Index de catégorie : cadenas et interception
     ══════════════════════════════════════════════════════════════ */
  function enhanceCategoryGrid() {
    var grid = document.getElementById('storyGrid');
    if (!grid) return;

    /* La barre du Grenier remplace l'ancien bouton retour flottant. */
    var css = document.createElement('style');
    css.textContent =
      'body{padding-top:var(--gr-nav-h)}' +
      'back-button{display:none!important}' +
      '.card{position:relative}';
    document.head.appendChild(css);

    var parts = location.pathname.replace(/\\/g, '/').split('/').filter(Boolean);
    parts.pop();
    var dir = parts.slice(-2).join('/');

    Array.prototype.forEach.call(grid.querySelectorAll('a.card[href]'), function (card) {
      var file = card.getAttribute('href').split('/').pop().split('#')[0].split('?')[0];
      var item = GRENIER.itemByPath(dir, file);
      if (!item || item.access !== 'membre') return;

      var ribbon = document.createElement('span');
      ribbon.className = 'gr-card-lock-ribbon';
      ribbon.innerHTML = '🔒 Membres';
      card.appendChild(ribbon);

      card.addEventListener('click', function (e) {
        if (GRENIER.auth.canAccess(item)) return;
        e.preventDefault();
        GRENIER.auth.openModal({
          title: 'Contenu réservé',
          message: '« ' + item.title +' » s\'ouvre dès la création de votre compte (gratuit, sur cet appareil).',
          onSuccess: function () { location.href = card.getAttribute('href'); }
        });
      });
    });

    /* Le cadenas disparaît dès la connexion. */
    GRENIER.auth.onChange(function (user) {
      grid.querySelectorAll('.gr-card-lock-ribbon').forEach(function (r) {
        r.style.display = user ? 'none' : '';
      });
    });
  }

  /* ── Révélation au défilement ──────────────────────────────── */
  function observeReveals(root) {
    var targets = (root || document).querySelectorAll('.gr-reveal:not(.is-in)');
    if (!targets.length) return;

    if (!('IntersectionObserver' in global)) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    if (!GRENIER._revealObserver) {
      GRENIER._revealObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          obs.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    }
    targets.forEach(function (el) { GRENIER._revealObserver.observe(el); });
  }
  GRENIER.observeReveals = observeReveals;

  /* ── Halo qui suit le curseur sur les cartes ───────────────── */
  function trackPointer(root) {
    (root || document).addEventListener('pointermove', function (e) {
      var card = e.target && e.target.closest ? e.target.closest('.gr-card') : null;
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* Éléments conditionnés par un drapeau : le balisage reste dans la page,
     seule sa révélation dépend de GRENIER.features. */
  function applyFeatureFlags() {
    document.querySelectorAll('[data-feature]').forEach(function (node) {
      var on = GRENIER.features && GRENIER.features[node.getAttribute('data-feature')];
      node.hidden = !on;
    });
  }

  /* ── Démarrage ─────────────────────────────────────────────── */
  function start() {
    applyFeatureFlags();
    if (cfg.aurora !== false && document.querySelector('.gr-page')) mountAurora();
    mountNav();
    enhanceCategoryGrid();
    observeReveals(document);
    trackPointer(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window);
