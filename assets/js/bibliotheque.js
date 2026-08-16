/**
 * Bibliothèque — le catalogue complet
 * ------------------------------------------------------------------
 * Toutes les entrées du dépôt et les créations locales dans une grille
 * unique, filtrable par univers, âge, accès et recherche plein texte.
 * L'accueil (home.js) n'en montre qu'une sélection.
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
    catFilters: document.getElementById('catFilters'),
    ageFilters: document.getElementById('ageFilters'),
    accessFilters: document.getElementById('accessFilters'),
    grid: document.getElementById('libraryGrid'),
    resultLine: document.getElementById('resultLine')
  };

  var allItems = GRENIER.allItems;

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

  /* ── Rendu principal ───────────────────────────────────────── */

  function render() {
    var results = allItems().filter(matches);
    GRENIER.fillCards(el.grid, results, {
      swap: true,
      empty: 'Aucun contenu ne correspond à cette recherche. Essayez un autre mot ou retirez un filtre.'
    });

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

    render();
    auth.onChange(render);
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
