/**
 * Page d'accueil : la bibliothèque
 * ------------------------------------------------------------------
 * Rassemble le catalogue du dépôt et les créations locales de l'Atelier
 * dans une grille unique, filtrable par univers, âge, accès et recherche.
 */
(function (global) {
  'use strict';

  var GRENIER = global.GRENIER;
  var auth = GRENIER.auth;

  var AGES = [
    { key: 'all', label: 'Tous les âges' },
    { key: '4',   label: 'Dès 4 ans' },
    { key: '7',   label: 'Dès 7 ans' },
    { key: '10',  label: 'Dès 10 ans' }
  ];

  var ACCESS = [
    { key: 'all',    label: 'Tout' },
    { key: 'public', label: '🔓 Libre' },
    { key: 'membre', label: '🔒 Membres' }
  ];

  var state = { q: '', cat: 'all', age: 'all', access: 'all' };

  var el = {
    universes: document.getElementById('universes'),
    catFilters: document.getElementById('catFilters'),
    ageFilters: document.getElementById('ageFilters'),
    accessFilters: document.getElementById('accessFilters'),
    grid: document.getElementById('libraryGrid'),
    resultLine: document.getElementById('resultLine'),
    recentSection: document.getElementById('reprendre'),
    recentGrid: document.getElementById('recentGrid'),
    favSection: document.getElementById('favoris'),
    favGrid: document.getElementById('favGrid'),
    stats: document.getElementById('stats')
  };

  /* ── Créations locales de l'Atelier ────────────────────────── */

  function creations() {
    var list = GRENIER.storage.read('grenier.creations', []);
    return list.map(function (c) {
      return {
        id: c.id,
        title: c.title,
        emoji: c.emoji || '✨',
        desc: c.desc || 'Une création de votre Atelier.',
        cat: c.cat || 'sciences',
        kind: c.kind || 'histoire',
        age: c.age || 7,
        access: 'membre',
        tags: (c.tags || []).concat(['atelier', 'ma création']),
        mine: true,
        href: 'lecture.html?id=' + encodeURIComponent(c.id)
      };
    });
  }

  function allItems() {
    var base = GRENIER.items.map(function (it) {
      var copy = Object.assign({}, it);
      copy.href = GRENIER.hrefOf(it);
      return copy;
    });
    return creations().concat(base);
  }

  /* ── Filtrage ──────────────────────────────────────────────── */

  function normalize(text) {
    return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function matches(item) {
    if (state.cat !== 'all' && item.cat !== state.cat) return false;
    if (state.age !== 'all' && item.age > Number(state.age)) return false;
    if (state.access !== 'all' && item.access !== state.access) return false;

    var q = normalize(state.q).trim();
    if (!q) return true;

    var haystack = normalize([
      item.title, item.desc, (item.tags || []).join(' '),
      GRENIER.categoryOf(item.cat).label, GRENIER.kinds[item.kind].label
    ].join(' '));

    return q.split(/\s+/).every(function (word) { return haystack.indexOf(word) >= 0; });
  }

  /* ── Cartes ────────────────────────────────────────────────── */

  function cardFor(item) {
    var cat = GRENIER.categoryOf(item.cat);
    var locked = !auth.canAccess(item);
    var kind = GRENIER.kinds[item.kind] || GRENIER.kinds.histoire;

    var card = document.createElement('a');
    card.className = 'gr-card gr-reveal' + (locked ? ' is-locked' : '');
    card.href = item.href;
    card.style.setProperty('--accent', cat.accent);
    card.setAttribute('aria-label', item.title + ' — ' + cat.label);

    card.innerHTML =
      '<div class="gr-card-top">' +
        '<span class="gr-card-icon" aria-hidden="true">' + item.emoji + '</span>' +
        '<button class="gr-fav" type="button" title="Ajouter aux favoris" ' +
          'aria-label="Ajouter ' + GRENIER.escapeHtml(item.title) + ' aux favoris">♥</button>' +
      '</div>' +
      '<span class="gr-card-kicker">' + (item.mine ? '✨ Ma création' : cat.emoji + ' ' + GRENIER.escapeHtml(cat.label)) + '</span>' +
      '<h3 class="gr-card-title">' + GRENIER.escapeHtml(item.title) + '</h3>' +
      '<p class="gr-card-desc">' + GRENIER.escapeHtml(item.desc) + '</p>' +
      '<div class="gr-card-foot">' +
        '<span>' + (locked
          ? '<span class="gr-lock">🔒 Membres</span>'
          : GRENIER.escapeHtml(kind.label) + ' · ' + GRENIER.ageLabel(item.age)) + '</span>' +
        '<span class="gr-card-cta">' + kind.verb + ' →</span>' +
      '</div>';

    /* Favori */
    var fav = card.querySelector('.gr-fav');
    if (auth.isFavorite(item.id)) fav.classList.add('is-on');
    fav.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var on = auth.toggleFavorite(item.id);
      fav.classList.toggle('is-on', on);
      renderFavorites();
    });

    /* Contenu réservé */
    if (locked) {
      card.addEventListener('click', function (e) {
        e.preventDefault();
        auth.openModal({
          title: 'Contenu réservé',
          message: '« ' + item.title + ' » s\'ouvre dès la création de votre compte — gratuit et instantané.',
          onSuccess: function () { location.href = item.href; }
        });
      });
    }

    return card;
  }

  function fillGrid(container, items, emptyMessage) {
    container.innerHTML = '';
    if (!items.length) {
      container.innerHTML =
        '<div class="gr-empty"><div>🕯️</div>' + GRENIER.escapeHtml(emptyMessage) + '</div>';
      return;
    }
    var fragment = document.createDocumentFragment();
    items.forEach(function (item) { fragment.appendChild(cardFor(item)); });
    container.appendChild(fragment);
    GRENIER.observeReveals(container);
  }

  /* ── Filtres ───────────────────────────────────────────────── */

  function chip(label, accent, isOn, onClick, count) {
    var btn = document.createElement('button');
    btn.className = 'gr-chip' + (isOn ? ' is-on' : '');
    btn.type = 'button';
    if (accent) btn.style.setProperty('--chip', accent);
    btn.innerHTML = label + (count != null ? ' <small>' + count + '</small>' : '');
    btn.addEventListener('click', onClick);
    return btn;
  }

  function renderFilters() {
    var items = allItems();

    el.catFilters.innerHTML = '';
    el.catFilters.appendChild(
      chip('✦ Tout', '#f0c04b', state.cat === 'all', function () { setState({ cat: 'all' }); }, items.length)
    );
    GRENIER.categories.forEach(function (cat) {
      var count = items.filter(function (it) { return it.cat === cat.key; }).length;
      if (!count) return;
      el.catFilters.appendChild(
        chip(cat.emoji + ' ' + cat.label, cat.accent, state.cat === cat.key,
          function () { setState({ cat: cat.key }); }, count)
      );
    });

    el.ageFilters.innerHTML = '';
    AGES.forEach(function (age) {
      el.ageFilters.appendChild(
        chip(age.label, '#5bb8ff', state.age === age.key, function () { setState({ age: age.key }); })
      );
    });

    el.accessFilters.innerHTML = '';
    ACCESS.forEach(function (acc) {
      el.accessFilters.appendChild(
        chip(acc.label, '#b18cff', state.access === acc.key, function () { setState({ access: acc.key }); })
      );
    });
  }

  function renderUniverses() {
    var items = allItems();
    el.universes.innerHTML = '';
    GRENIER.categories.forEach(function (cat) {
      var list = items.filter(function (it) { return it.cat === cat.key; });
      var tile = document.createElement('button');
      tile.className = 'universe gr-reveal';
      tile.type = 'button';
      tile.style.setProperty('--accent', cat.accent);
      tile.innerHTML =
        '<span class="emoji" aria-hidden="true">' + cat.emoji + '</span>' +
        '<strong>' + GRENIER.escapeHtml(cat.label) + '</strong>' +
        '<small>' + GRENIER.escapeHtml(cat.blurb) + '</small>' +
        '<span class="count">' + list.length + ' contenu' + (list.length > 1 ? 's' : '') + '</span>';
      tile.addEventListener('click', function () {
        setState({ cat: cat.key });
        document.getElementById('bibliotheque').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      el.universes.appendChild(tile);
    });
    GRENIER.observeReveals(el.universes);
  }

  /* ── Sections dynamiques ───────────────────────────────────── */

  function byId(items) {
    var map = {};
    items.forEach(function (it) { map[it.id] = it; });
    return map;
  }

  function renderRecent() {
    var map = byId(allItems());
    var list = auth.recent(4).map(function (id) { return map[id]; }).filter(Boolean);
    el.recentSection.hidden = list.length === 0;
    if (list.length) fillGrid(el.recentGrid, list, '');
  }

  function renderFavorites() {
    var map = byId(allItems());
    var list = auth.favorites().map(function (id) { return map[id]; }).filter(Boolean);
    el.favSection.hidden = list.length === 0;
    if (list.length) fillGrid(el.favGrid, list, '');
  }

  function renderStats() {
    var items = allItems();
    var values = [
      items.length,
      GRENIER.categories.length,
      items.filter(function (it) { return it.access === 'public'; }).length,
      items.filter(function (it) { return it.access === 'membre'; }).length
    ];

    el.stats.querySelectorAll('b').forEach(function (node, i) {
      var target = values[i];
      var reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) { node.textContent = String(target); return; }

      var start = performance.now();
      var duration = 900 + i * 120;
      (function step(now) {
        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        node.textContent = String(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(step);
      })(start);
    });
  }

  /* ── Rendu principal ───────────────────────────────────────── */

  function render() {
    var results = allItems().filter(matches);
    fillGrid(el.grid, results,
      'Aucun contenu ne correspond à cette recherche. Essayez un autre mot ou retirez un filtre.');

    var bits = [];
    if (state.q) bits.push('« ' + state.q + ' »');
    if (state.cat !== 'all') bits.push(GRENIER.categoryOf(state.cat).label);
    if (state.age !== 'all') bits.push('dès ' + state.age + ' ans');
    if (state.access === 'public') bits.push('accès libre');
    if (state.access === 'membre') bits.push('réservé aux membres');

    el.resultLine.innerHTML = '<b>' + results.length + '</b> contenu' + (results.length > 1 ? 's' : '') +
      (bits.length ? ' · ' + GRENIER.escapeHtml(bits.join(' · ')) : ' dans la bibliothèque');

    renderFilters();
  }

  function setState(patch) {
    Object.assign(state, patch);
    render();
  }

  /* ── Démarrage ─────────────────────────────────────────────── */

  function start() {
    var params = new URLSearchParams(location.search);
    var q = params.get('q');
    if (q) {
      state.q = q;
      if (GRENIER.searchInput) GRENIER.searchInput.value = q;
    }
    var cat = params.get('univers');
    if (cat) state.cat = cat;

    renderUniverses();
    render();
    renderRecent();
    renderFavorites();
    renderStats();

    auth.onChange(function () {
      render();
      renderRecent();
      renderFavorites();
    });
  }

  GRENIER.library = {
    setQuery: function (q) { setState({ q: q }); },
    refresh: render
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window);
