/**
 * La Frise des Empires — construction et interactions
 * ------------------------------------------------------------------
 * Aucune bibliothèque : ni framer-motion, ni observateur tiers. Tout
 * tient sur trois mécanismes du navigateur.
 *
 *   1. CONSTRUIRE — les fiches sont fabriquées une fois depuis
 *      EMPIRES.empires, séparateurs d'époque compris. Filtrer ne
 *      reconstruit rien : on masque, on renumérote les côtés.
 *
 *   2. RÉVÉLER — à chaque image de défilement, on balaie les fiches
 *      encore éteintes et on allume celles qui sont entrées dans
 *      l'écran. Un IntersectionObserver serait plus élégant, mais il
 *      laisse des fiches éteintes derrière un saut brusque — une ancre,
 *      un clic sur le ruban — car elles n'ont jamais croisé l'écran. Le
 *      balayage, lui, rattrape tout ce qui est passé au-dessus. Il ne
 *      coûte rien : la liste des fiches éteintes ne fait que fondre, et
 *      le calcul vit dans le requestAnimationFrame qui sert déjà au
 *      remplissage du rail.
 *
 *   3. INCLINER — un seul écouteur de souris sur la frise met à jour
 *      deux variables CSS par carte visible (--rx, --ry). Les cartes
 *      hors écran sont ignorées : le coût ne dépend pas du nombre de
 *      fiches.
 *
 * Le tout se tait si le visiteur demande moins de mouvement.
 */
(function (global) {
  'use strict';

  var EM = global.EMPIRES;
  if (!EM || !EM.empires) return;

  var doc = global.document;
  function $(id) { return doc.getElementById(id); }

  /* Le visiteur peut demander moins d'animation : on l'écoute, et on
     continue de l'écouter s'il change d'avis en cours de route. */
  var calmQuery = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function isCalm() { return !!(calmQuery && calmQuery.matches); }

  var elItems  = $('emItems');
  var elRail   = $('emRail');
  var elOrbs   = $('emOrbs');
  var elFilters = $('emFilters');
  var elEmpty  = $('emEmpty');
  var elRibbon = $('emRibbon');
  if (!elItems) return;

  var eraByKey = {};
  EM.eras.forEach(function (era) { eraByKey[era.key] = era; });

  /* Les fiches déjà construites, dans l'ordre d'affichage. */
  var cards = [];
  var current = 'tous';
  /* Le premier passage laisse l'observateur révéler les fiches au
     défilement ; les filtrages suivants les montrent tout de suite. */
  var firstPaint = true;

  /* ══════════════════════════════════════════════════════════════
     Petits utilitaires
     ══════════════════════════════════════════════════════════════ */

  function el(tag, cls, text) {
    var node = doc.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  /* « -1894 » se lit « 1894 av. J.-C. » ; « 1945 » se lit tel quel. */
  function yearLabel(y) {
    return y < 0 ? Math.abs(y) + ' av. J.-C.' : String(y);
  }

  /* L'année de fin d'un empire encore debout, c'est aujourd'hui. */
  function endYear(e) {
    return e.end == null ? new Date().getFullYear() : e.end;
  }

  /* ══════════════════════════════════════════════════════════════
     1. CONSTRUCTION DES FICHES
     ══════════════════════════════════════════════════════════════ */

  function buildCard(empire, index) {
    var era = eraByKey[empire.era] || {};

    var item = el('li', 'em-item');
    item.id = 'empire-' + empire.id;
    item.dataset.era = empire.era;
    item.dataset.id = empire.id;
    item.style.setProperty('--tint', empire.color);

    /* Le nœud sur le rail. L'emoji est décoratif : le nom est juste à côté. */
    var node = el('span', 'em-node', empire.emoji);
    node.setAttribute('aria-hidden', 'true');
    item.appendChild(node);

    var card = el('article', 'em-card');

    /* ── En-tête cliquable ── */
    var bodyId = 'empire-body-' + empire.id;
    var top = el('button', 'em-top');
    top.type = 'button';
    top.setAttribute('aria-expanded', 'false');
    top.setAttribute('aria-controls', bodyId);

    var kicker = el('div', 'em-kicker');
    kicker.appendChild(el('span', 'em-period', empire.period));
    if (era.label) kicker.appendChild(el('span', 'em-tag', era.short || era.label));
    top.appendChild(kicker);

    var title = el('div', 'em-title');
    title.appendChild(el('h3', null, empire.name));
    var caret = el('span', 'em-caret');
    caret.setAttribute('aria-hidden', 'true');
    caret.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    title.appendChild(caret);
    top.appendChild(title);

    /* Les régions dominées restent lisibles fiche fermée : c'est
       l'information qu'on cherche le plus souvent. */
    var where = el('p', 'em-where');
    where.appendChild(el('b', null, 'Régions dominées — '));
    where.appendChild(doc.createTextNode(empire.regions));
    top.appendChild(where);

    if (empire.stat) {
      var stat = el('span', 'em-stat');
      stat.appendChild(el('b', null, empire.stat.value));
      stat.appendChild(el('span', null, empire.stat.label));
      top.appendChild(stat);
    }
    card.appendChild(top);

    /* ── Corps dépliable ── */
    var body = el('div', 'em-body');
    body.id = bodyId;
    var scroller = el('div');
    var inner = el('div', 'em-body-in');

    var forces = el('div', 'em-block');
    forces.appendChild(el('h4', null, 'Points forts'));
    var ul = el('ul');
    empire.strengths.forEach(function (line) { ul.appendChild(el('li', null, line)); });
    forces.appendChild(ul);
    inner.appendChild(forces);

    var fall = el('div', 'em-block em-fall');
    fall.appendChild(el('h4', null, 'Cause de la disparition'));
    fall.appendChild(el('p', null, empire.fall));
    inner.appendChild(fall);

    var extra = el('div', 'em-block em-extra');
    extra.appendChild(el('h4', null, 'Ce qu\'on en garde'));
    extra.appendChild(el('p', null, empire.extra));
    inner.appendChild(extra);

    var seat = el('p', 'em-seat');
    seat.appendChild(el('b', null, 'Siège du pouvoir : '));
    seat.appendChild(doc.createTextNode(empire.seat));
    inner.appendChild(seat);

    scroller.appendChild(inner);
    body.appendChild(scroller);
    card.appendChild(body);
    item.appendChild(card);

    top.addEventListener('click', function () { toggle(item, top); });

    return { node: item, card: card, top: top, empire: empire, index: index };
  }

  function toggle(item, top, force) {
    var open = force != null ? force : !item.classList.contains('is-open');
    item.classList.toggle('is-open', open);
    top.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function build() {
    var frag = doc.createDocumentFragment();
    var seenEra = {};

    EM.empires.forEach(function (empire, i) {
      /* Le premier empire d'une époque amène son séparateur. */
      if (!seenEra[empire.era]) {
        seenEra[empire.era] = true;
        var era = eraByKey[empire.era];
        if (era) {
          var sep = el('li', 'em-era');
          sep.dataset.era = era.key;
          sep.style.setProperty('--tint', era.color);
          sep.appendChild(el('b', null, era.label));
          sep.appendChild(el('span', null, era.blurb));
          frag.appendChild(sep);
        }
      }
      var card = buildCard(empire, i);
      cards.push(card);
      frag.appendChild(card.node);
    });

    elItems.appendChild(frag);
  }

  /* ══════════════════════════════════════════════════════════════
     2. FILTRES D'ÉPOQUE
     Filtrer ne détruit rien : on masque, puis on redistribue les
     côtés pour que la quinconce reste alternée.
     ══════════════════════════════════════════════════════════════ */

  function countIn(key) {
    return EM.empires.filter(function (e) { return e.era === key; }).length;
  }

  function buildFilters() {
    if (!elFilters) return;

    var options = [{ key: 'tous', label: 'Tous', color: '#f4efe4', count: EM.empires.length }];
    EM.eras.forEach(function (era) {
      options.push({ key: era.key, label: era.label, color: era.color, count: countIn(era.key) });
    });

    options.forEach(function (opt) {
      var chip = el('button', 'em-chip');
      chip.type = 'button';
      chip.dataset.era = opt.key;
      chip.style.setProperty('--tint', opt.color);
      chip.setAttribute('aria-pressed', opt.key === current ? 'true' : 'false');
      if (opt.key === current) chip.classList.add('is-on');
      chip.appendChild(el('i', null, ''));
      chip.appendChild(el('b', null, opt.label));
      chip.appendChild(el('small', null, opt.count));
      chip.addEventListener('click', function () { applyFilter(opt.key); });
      elFilters.appendChild(chip);
    });
  }

  function applyFilter(key) {
    current = key;

    if (elFilters) {
      Array.prototype.forEach.call(elFilters.children, function (chip) {
        var on = chip.dataset.era === key;
        chip.classList.toggle('is-on', on);
        chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    /* Les séparateurs suivent leur époque. */
    Array.prototype.forEach.call(elItems.querySelectorAll('.em-era'), function (sep) {
      sep.hidden = key !== 'tous' && sep.dataset.era !== key;
    });

    var shown = 0;
    cards.forEach(function (card) {
      var visible = key === 'tous' || card.empire.era === key;
      card.node.hidden = !visible;
      if (visible) {
        card.node.classList.remove('side-l', 'side-r');
        card.node.classList.add(shown % 2 === 0 ? 'side-l' : 'side-r');
        /* Une fiche rendue par un filtre ne doit pas attendre l'observateur :
           elle réapparaîtrait transparente, et sa révélation ayant déjà eu
           lieu, plus rien ne viendrait la rallumer. */
        if (!firstPaint) card.node.classList.add('is-in');
        shown++;
      }
    });

    if (elEmpty) elEmpty.hidden = shown > 0;
    firstPaint = false;
    drawRibbon();
    updateRail();
  }

  /* ══════════════════════════════════════════════════════════════
     3. RÉVÉLATION AU DÉFILEMENT ET REMPLISSAGE DU RAIL
     ══════════════════════════════════════════════════════════════ */

  /* Les fiches encore éteintes. La liste ne fait que rétrécir. */
  var dormant = [];

  function watchReveal() {
    if (isCalm()) {
      cards.forEach(function (c) { c.node.classList.add('is-in'); });
      dormant = [];
      return;
    }
    dormant = cards.slice();
    sweepReveal();
  }

  /* Allume toute fiche dont le haut est entré dans l'écran — ou l'a déjà
     dépassé, ce qui arrive après un saut d'ancre. */
  function sweepReveal() {
    if (!dormant.length) return;
    var edge = (global.innerHeight || doc.documentElement.clientHeight) * 0.92;
    var still = [];
    for (var i = 0; i < dormant.length; i++) {
      var card = dormant[i];
      if (card.node.hidden) { still.push(card); continue; }
      if (card.node.getBoundingClientRect().top < edge) {
        card.node.classList.add('is-in');
      } else {
        still.push(card);
      }
    }
    dormant = still;
  }

  /* La part de la frise déjà parcourue, entre 0 et 1. */
  function updateRail() {
    if (!elRail) return;
    var box = elRail.getBoundingClientRect();
    var view = global.innerHeight || doc.documentElement.clientHeight;
    var seen = view * 0.55 - box.top;
    var ratio = box.height > 0 ? seen / box.height : 0;
    ratio = Math.max(0, Math.min(1, ratio));
    elRail.style.setProperty('--fill', (ratio * 100).toFixed(2) + '%');
  }

  /* ══════════════════════════════════════════════════════════════
     4. LE RELIEF À LA SOURIS
     Une seule écoute, et deux variables CSS par carte visible.
     ══════════════════════════════════════════════════════════════ */

  var MAX_TILT = 3.2;   /* degrés — au-delà, le texte devient pénible à lire */

  function watchTilt() {
    var zone = elItems.parentNode;
    if (!zone) return;

    var frame = 0;
    var mx = 0, my = 0;

    function paint() {
      frame = 0;
      var view = global.innerHeight || doc.documentElement.clientHeight;
      cards.forEach(function (card) {
        if (card.node.hidden) return;
        var box = card.card.getBoundingClientRect();
        /* Hors écran : rien à incliner, et surtout rien à calculer. */
        if (box.bottom < -80 || box.top > view + 80) return;
        var side = card.node.classList.contains('side-l') ? -1 : 1;
        card.card.style.setProperty('--ry', (mx * MAX_TILT * side).toFixed(2) + 'deg');
        card.card.style.setProperty('--rx', (my * -MAX_TILT).toFixed(2) + 'deg');
      });
    }

    zone.addEventListener('mousemove', function (ev) {
      if (isCalm()) return;
      var box = zone.getBoundingClientRect();
      mx = ((ev.clientX - box.left) / box.width) * 2 - 1;
      my = ((ev.clientY - box.top) / box.height) * 2 - 1;
      if (!frame) frame = global.requestAnimationFrame(paint);
    });

    /* En sortant, les cartes se remettent d'aplomb. */
    zone.addEventListener('mouseleave', function () {
      mx = 0; my = 0;
      if (!frame) frame = global.requestAnimationFrame(paint);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     5. LES SPHÈRES D'AMBIANCE
     ══════════════════════════════════════════════════════════════ */

  function buildOrbs() {
    if (!elOrbs || isCalm()) return;
    var tints = ['#f0c04b', '#ff8a5b', '#b18cff', '#5bb8ff', '#4fd8a6', '#ff6f9c'];
    for (var i = 0; i < 6; i++) {
      var orb = el('span');
      var size = 190 + i * 55;
      orb.style.width = size + 'px';
      orb.style.height = size + 'px';
      orb.style.left = (6 + i * 16) + '%';
      orb.style.top = (5 + i * 15) + '%';
      orb.style.background = tints[i % tints.length];
      orb.style.animationDelay = (-i * 4.5) + 's';
      orb.style.animationDuration = (24 + i * 3) + 's';
      elOrbs.appendChild(orb);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     6. LE RUBAN PROPORTIONNEL
     Les fiches sont espacées régulièrement ; ce ruban respecte les
     durées réelles. Il est redessiné à chaque filtrage et à chaque
     changement de largeur.
     ══════════════════════════════════════════════════════════════ */

  var ROW = 19, PAD_TOP = 26, PAD_L = 128, PAD_R = 16;

  function drawRibbon() {
    if (!elRibbon) return;

    var list = EM.empires.filter(function (e) {
      return current === 'tous' || e.era === current;
    });
    if (!list.length) { elRibbon.innerHTML = ''; return; }

    var width = Math.max(640, elRibbon.clientWidth || 640);
    var height = PAD_TOP + list.length * ROW + 22;

    var minY = Math.min.apply(null, list.map(function (e) { return e.start; }));
    var maxY = Math.max.apply(null, list.map(endYear));
    var span = maxY - minY || 1;
    var plot = width - PAD_L - PAD_R;

    function x(year) { return PAD_L + ((year - minY) / span) * plot; }

    var svg = [];
    svg.push('<rect x="0" y="0" width="' + width + '" height="' + height + '" fill="none"/>');

    /* Des repères de siècle, choisis pour rester lisibles quelle que
       soit l'étendue affichée. */
    var steps = [2000, 1000, 500, 250, 100, 50, 25];
    var step = steps[0];
    for (var s = 0; s < steps.length; s++) {
      if (span / steps[s] <= 9) { step = steps[s]; break; }
    }
    var first = Math.ceil(minY / step) * step;
    for (var y = first; y <= maxY; y += step) {
      svg.push('<line class="grid" x1="' + x(y).toFixed(1) + '" y1="' + (PAD_TOP - 12) +
               '" x2="' + x(y).toFixed(1) + '" y2="' + (height - 16) + '"/>');
      svg.push('<text class="lbl" x="' + x(y).toFixed(1) + '" y="' + (height - 4) +
               '" text-anchor="middle">' + yearLabel(y) + '</text>');
    }

    list.forEach(function (e, i) {
      var top = PAD_TOP + i * ROW;
      var x1 = x(e.start), x2 = x(endYear(e));
      var w = Math.max(3, x2 - x1);
      svg.push('<text class="lbl" x="' + (PAD_L - 9) + '" y="' + (top + 9) +
               '" text-anchor="end">' + escapeXml(e.short || e.name) + '</text>');
      svg.push('<g class="bar" data-id="' + e.id + '" role="listitem" tabindex="0">' +
               '<title>' + escapeXml(e.name + ' — ' + e.period) + '</title>' +
               '<rect x="' + x1.toFixed(1) + '" y="' + (top - 1) + '" width="' + w.toFixed(1) +
               '" height="11" rx="5.5" fill="' + e.color + '" fill-opacity="0.82"/></g>');
    });

    elRibbon.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    elRibbon.setAttribute('height', height);
    elRibbon.innerHTML = svg.join('');

    Array.prototype.forEach.call(elRibbon.querySelectorAll('.bar'), function (bar) {
      bar.addEventListener('click', function () { jumpTo(bar.dataset.id); });
      bar.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); jumpTo(bar.dataset.id); }
      });
    });
  }

  function escapeXml(str) {
    return String(str).replace(/[<>&"]/g, function (ch) {
      return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[ch];
    });
  }

  /* Aller à une fiche, l'ouvrir, et la laisser sous les yeux. */
  function jumpTo(id) {
    var card = cards.filter(function (c) { return c.empire.id === id; })[0];
    if (!card || card.node.hidden) return;
    toggle(card.node, card.top, true);
    card.node.classList.add('is-in');
    card.node.scrollIntoView({
      behavior: isCalm() ? 'auto' : 'smooth',
      block: 'center'
    });
    /* Un saut d'ancre atterrit parfois sans qu'aucun défilement ne soit
       signalé : on rattrape la révélation à l'image suivante. */
    global.requestAnimationFrame(sweepReveal);
  }

  /* ══════════════════════════════════════════════════════════════
     7. MISE EN ROUTE
     ══════════════════════════════════════════════════════════════ */

  build();
  buildFilters();
  buildOrbs();
  applyFilter('tous');
  watchReveal();
  watchTilt();

  /* Une fiche ouverte depuis l'ancre de l'URL : /empires.html#empire-rome */
  var hash = (global.location.hash || '').replace('#', '');
  if (hash.indexOf('empire-') === 0) {
    var wanted = hash.slice('empire-'.length);
    /* La page vient de se construire : on laisse la mise en page se poser. */
    global.requestAnimationFrame(function () { jumpTo(wanted); });
  }

  /* Le défilement ne fait qu'armer une image : le calcul a lieu dedans. */
  var railFrame = 0;
  global.addEventListener('scroll', function () {
    if (!railFrame) railFrame = global.requestAnimationFrame(function () {
      railFrame = 0;
      sweepReveal();
      updateRail();
    });
  }, { passive: true });

  var resizeFrame = 0;
  global.addEventListener('resize', function () {
    if (!resizeFrame) resizeFrame = global.requestAnimationFrame(function () {
      resizeFrame = 0;
      drawRibbon();
      sweepReveal();
      updateRail();
    });
  }, { passive: true });

  updateRail();

})(window);
