/**
 * Accueil — une vitrine, pas la bibliothèque entière
 * ------------------------------------------------------------------
 * Montre une sélection : ce qu'on était en train de lire, un choix mis en
 * avant, les dernières arrivées, les univers. Le catalogue complet et ses
 * filtres vivent sur bibliotheque.html.
 */
(function (global) {
  'use strict';

  var GRENIER = global.GRENIER;
  var auth = GRENIER.auth;

  function $(id) { return document.getElementById(id); }

  /* ── Rails horizontaux ─────────────────────────────────────── */

  /** Ajoute les flèches et tient leur état actif au fil du défilement. */
  function equipRail(rail) {
    var wrap = rail.parentNode;

    function button(dir, label, path) {
      var b = document.createElement('button');
      b.className = 'gr-rail-btn is-' + dir;
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="' + path + '"/></svg>';
      b.addEventListener('click', function () {
        rail.scrollBy({ left: (dir === 'next' ? 1 : -1) * rail.clientWidth * 0.8, behavior: 'smooth' });
      });
      return b;
    }

    var prev = button('prev', 'Faire défiler vers la gauche', 'M15 6l-6 6 6 6');
    var next = button('next', 'Faire défiler vers la droite', 'M9 6l6 6-6 6');
    wrap.appendChild(prev);
    wrap.appendChild(next);

    function sync() {
      var max = rail.scrollWidth - rail.clientWidth;
      prev.disabled = rail.scrollLeft < 8;
      next.disabled = rail.scrollLeft > max - 8;
    }
    rail.addEventListener('scroll', sync, { passive: true });
    global.addEventListener('resize', sync);
    sync();
  }

  /* ── Sections ──────────────────────────────────────────────── */

  function renderFeatured() {
    GRENIER.fillCards($('featuredGrid'), GRENIER.featured());
  }

  function renderNewest() {
    var rail = $('newestRail');
    GRENIER.fillCards(rail, GRENIER.newest());
    equipRail(rail);
  }

  function renderResume() {
    var map = {};
    GRENIER.allItems().forEach(function (it) { map[it.id] = it; });
    var list = auth.recent(6).map(function (id) { return map[id]; }).filter(Boolean);

    $('resumeSection').hidden = list.length === 0;
    if (!list.length) return;

    var rail = $('resumeRail');
    GRENIER.fillCards(rail, list);
    if (!rail.dataset.equipped) {
      equipRail(rail);
      rail.dataset.equipped = '1';
    }
  }

  function renderFavorites() {
    var map = {};
    GRENIER.allItems().forEach(function (it) { map[it.id] = it; });
    var list = auth.favorites().map(function (id) { return map[id]; }).filter(Boolean);

    $('favSection').hidden = list.length === 0;
    if (list.length) GRENIER.fillCards($('favGrid'), list);
  }

  function renderUniverses() {
    var items = GRENIER.allItems();
    var box = $('universes');
    box.innerHTML = '';

    GRENIER.categories.forEach(function (cat, i) {
      var count = items.filter(function (it) { return it.cat === cat.key; }).length;

      var tile = document.createElement('a');
      tile.className = 'universe gr-reveal';
      tile.href = GRENIER.base + 'bibliotheque.html?univers=' + encodeURIComponent(cat.key);
      tile.style.setProperty('--accent', cat.accent);
      tile.style.setProperty('--i', i);
      tile.innerHTML =
        '<span class="emoji" aria-hidden="true">' + cat.emoji + '</span>' +
        '<strong>' + GRENIER.escapeHtml(cat.label) + '</strong>' +
        '<small>' + GRENIER.escapeHtml(cat.blurb) + '</small>' +
        '<span class="count">' + count + ' contenu' + (count > 1 ? 's' : '') + '</span>';
      box.appendChild(tile);
    });
    GRENIER.observeReveals(box);
  }

  function renderStats() {
    var items = GRENIER.allItems();
    var values = [
      items.length,
      GRENIER.categories.length,
      items.filter(function (it) { return it.access === 'public'; }).length
    ];
    var reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

    $('stats').querySelectorAll('b').forEach(function (node, i) {
      var target = values[i];
      if (reduced) { node.textContent = String(target); return; }

      var start = performance.now();
      var duration = 900 + i * 120;
      (function step(now) {
        var t = Math.min(1, (now - start) / duration);
        node.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(step);
      })(start);
    });
  }

  /* ── Démarrage ─────────────────────────────────────────────── */

  function start() {
    renderUniverses();
    renderFeatured();
    renderNewest();
    renderResume();
    renderFavorites();
    renderStats();

    document.addEventListener('grenier:favorites', renderFavorites);
    auth.onChange(function () {
      renderFeatured();
      renderNewest();
      renderResume();
      renderFavorites();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window);
