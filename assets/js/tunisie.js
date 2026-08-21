/**
 * Les Âges de la Tunisie — bande du temps, carte et fiches
 * ------------------------------------------------------------------
 * Pas de bibliothèque : trois pièces, une seule sélection.
 *
 *   1. LA BANDE — les douze époques se suivent sans trou, donc elles
 *      forment un ruban continu plutôt que des barres séparées : la
 *      largeur de chaque segment est sa durée réelle. Une exception
 *      assumée, le Capsien : cinq mille ans de préhistoire écraseraient
 *      les trente siècles suivants en un trait. Il est donc sorti de
 *      l'échelle, dans un bloc à part, derrière une cassure en
 *      pointillés — le dessin dit lui-même qu'il triche là, et nulle
 *      part ailleurs.
 *
 *   2. LA CARTE — le contour du pays et les lieux de l'époque passent
 *      par la même projection (équirectangulaire, corrigée par le
 *      cosinus de la latitude moyenne pour que la forme reste juste) :
 *      un site tombe au bon endroit sans réglage à la main. Les
 *      étiquettes se repoussent verticalement quand deux lieux sont
 *      trop proches — sinon Gabès et Djerba s'écrivent l'une sur
 *      l'autre.
 *
 *   3. LA FICHE — reconstruite à chaque changement d'époque. Une seule
 *      époque est affichée à la fois : c'est un parcours, pas une liste
 *      à dérouler.
 *
 * Trois chemins mènent à la même sélection — la bande, les pastilles,
 * les flèches (boutons ou touches ← →) — parce qu'un segment de bande
 * peut faire vingt pixels de large, et qu'on ne demande pas à un doigt
 * de viser ça.
 */
(function (global) {
  'use strict';

  var TN = global.TUNISIE;
  if (!TN || !TN.periods) return;

  var doc = global.document;
  var SVGNS = 'http://www.w3.org/2000/svg';

  function $(id) { return doc.getElementById(id); }

  var elBand   = $('tnBand');
  var elChips  = $('tnChips');
  var elMap    = $('tnMap');
  var elCard   = $('tnCard');
  var elPrev   = $('tnPrev');
  var elNext   = $('tnNext');
  var elPos    = $('tnPos');
  var elReach  = $('tnReach');
  if (!elBand || !elCard || !elMap) return;

  var calmQuery = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function isCalm() { return !!(calmQuery && calmQuery.matches); }

  var periods = TN.periods;
  var index = 0;

  /* ══════════════════════════════════════════════════════════════
     Petits utilitaires
     ══════════════════════════════════════════════════════════════ */

  function el(tag, cls, text) {
    var node = doc.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function svg(tag, attrs) {
    var node = doc.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function svgText(str, attrs) {
    var node = svg('text', attrs);
    node.textContent = str;
    return node;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  /* « -814 » se lit « 814 av. J.-C. » ; « 1861 » se lit tel quel. */
  function yearLabel(y) {
    if (y === 0) return '0';
    return y < 0 ? Math.abs(y) + ' av. J.-C.' : String(y);
  }

  /* ══════════════════════════════════════════════════════════════
     1. LA BANDE DU TEMPS
     ══════════════════════════════════════════════════════════════ */

  var BAND_W = 1000;            /* unités du viewBox — le SVG s'étire */
  var OFF_W  = 96;              /* largeur du bloc hors échelle */
  var GAP    = 26;              /* la cassure entre le bloc et l'échelle */
  var TOP    = 26;              /* place laissée au curseur au-dessus */
  var BAR_H  = 34;
  var ERA_H  = 9;
  var BAND_H = TOP + ERA_H + 6 + BAR_H + 26;

  var scaled = periods.filter(function (p) { return p.scaled !== false; });
  var offScale = periods.filter(function (p) { return p.scaled === false; });

  var minY = Math.min.apply(null, scaled.map(function (p) { return p.start; }));
  var maxY = Math.max.apply(null, scaled.map(TN.endOf));
  var span = maxY - minY;
  var plotL = OFF_W + GAP;
  var plotW = BAND_W - plotL - 4;

  function bx(year) { return plotL + ((year - minY) / span) * plotW; }

  /* Le rectangle d'une époque dans la bande : le bloc hors échelle pour
     le Capsien, la position réelle pour toutes les autres. */
  function bandBox(p, i) {
    if (p.scaled === false) {
      var slot = offScale.indexOf(p);
      var w = OFF_W / offScale.length;
      return { x: slot * w, w: w - 2 };
    }
    var x1 = bx(p.start), x2 = bx(TN.endOf(p));
    return { x: x1, w: Math.max(4, x2 - x1) };
  }

  var bandSegs = [];

  function drawBand() {
    clear(elBand);
    bandSegs = [];
    elBand.setAttribute('viewBox', '0 0 ' + BAND_W + ' ' + BAND_H);

    var yEra = TOP;
    var yBar = TOP + ERA_H + 6;

    /* ── Le bandeau des grands âges, au-dessus des époques ── */
    TN.eras.forEach(function (era) {
      var group = periods.filter(function (p) { return p.era === era.key; });
      if (!group.length) return;
      var first = bandBox(group[0], 0);
      var last  = bandBox(group[group.length - 1], 0);
      var x = first.x, w = (last.x + last.w) - first.x;
      elBand.appendChild(svg('rect', {
        x: x.toFixed(1), y: yEra, width: Math.max(2, w).toFixed(1), height: ERA_H,
        rx: 4.5, fill: era.color, 'fill-opacity': '.34'
      }));
      if (w > 96) {
        elBand.appendChild(svgText(era.short || era.label, {
          x: (x + w / 2).toFixed(1), y: yEra - 8, 'text-anchor': 'middle', class: 'tn-band-era'
        }));
      }
    });

    /* ── Les repères de siècles ── */
    var step = 500;
    var first = Math.ceil(minY / step) * step;
    for (var y = first; y <= maxY; y += step) {
      var gx = bx(y);
      elBand.appendChild(svg('line', {
        x1: gx.toFixed(1), y1: yBar, x2: gx.toFixed(1), y2: yBar + BAR_H + 6, class: 'tn-band-grid'
      }));
      elBand.appendChild(svgText(yearLabel(y), {
        x: gx.toFixed(1), y: yBar + BAR_H + 20, 'text-anchor': 'middle', class: 'tn-band-tick'
      }));
    }

    /* ── La cassure : ce qui sépare le hors-échelle du reste ── */
    elBand.appendChild(svg('path', {
      d: 'M' + (OFF_W + 7) + ' ' + (yBar - 4) +
         ' l10 ' + (BAR_H / 2 + 4) + ' l-10 ' + (BAR_H / 2 + 4),
      class: 'tn-band-break'
    }));
    elBand.appendChild(svgText('hors échelle', {
      x: (OFF_W / 2).toFixed(1), y: yBar + BAR_H + 20, 'text-anchor': 'middle', class: 'tn-band-tick'
    }));

    /* ── Les époques ── */
    periods.forEach(function (p, i) {
      var box = bandBox(p, i);
      var g = svg('g', {
        class: 'tn-seg', 'data-id': p.id, tabindex: '0', role: 'button',
        'aria-label': p.name + ', ' + p.period
      });
      var title = svg('title', {});
      title.textContent = p.name + ' — ' + p.period;
      g.appendChild(title);
      g.appendChild(svg('rect', {
        x: box.x.toFixed(1), y: yBar, width: box.w.toFixed(1), height: BAR_H,
        rx: 6, fill: p.color, class: 'tn-seg-fill'
      }));
      /* Le nom ne tient pas dans tous les segments : le protectorat fait
         soixante-quinze ans, soit vingt pixels de large. On mesure au lieu
         de deviner — sinon « Fatimides » déborde sur ses voisins. */
      if (box.w > p.short.length * 6.6 + 14) {
        g.appendChild(svgText(p.short, {
          x: (box.x + box.w / 2).toFixed(1), y: (yBar + BAR_H / 2 + 4).toFixed(1),
          'text-anchor': 'middle', class: 'tn-seg-name'
        }));
      }
      g.addEventListener('click', function () { select(i); });
      g.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(i); }
      });
      elBand.appendChild(g);
      bandSegs.push({ node: g, box: box });
    });

    /* ── Le curseur, posé sur l'époque choisie ── */
    var cursor = svg('path', { id: 'tnCursor', class: 'tn-band-cursor', d: 'M0 0' });
    elBand.appendChild(cursor);
    moveCursor();
  }

  function moveCursor() {
    var cursor = elBand.querySelector('#tnCursor');
    if (!cursor) return;
    var box = bandSegs[index].box;
    var cx = box.x + box.w / 2;
    var y = TOP + ERA_H + 2;
    cursor.setAttribute('d', 'M' + (cx - 7).toFixed(1) + ' ' + (y - 9) +
                             ' L' + (cx + 7).toFixed(1) + ' ' + (y - 9) +
                             ' L' + cx.toFixed(1) + ' ' + y + ' Z');
    cursor.setAttribute('fill', periods[index].color);

    bandSegs.forEach(function (seg, i) {
      seg.node.classList.toggle('is-on', i === index);
      seg.node.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
  }

  /* ══════════════════════════════════════════════════════════════
     2. LES PASTILLES — le même choix, à hauteur de doigt
     ══════════════════════════════════════════════════════════════ */

  var chips = [];

  function buildChips() {
    if (!elChips) return;
    periods.forEach(function (p, i) {
      var chip = el('button', 'tn-chip');
      chip.type = 'button';
      chip.style.setProperty('--tint', p.color);
      chip.setAttribute('aria-pressed', 'false');
      chip.appendChild(el('i', null, p.emoji));
      chip.appendChild(el('b', null, p.short));
      chip.appendChild(el('small', null, p.period));
      chip.addEventListener('click', function () { select(i); });
      elChips.appendChild(chip);
      chips.push(chip);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     3. LA CARTE
     ══════════════════════════════════════════════════════════════ */

  /* Les marges ne sont pas symétriques : à l'est, les étiquettes des
     villes côtières s'écrivent dans la mer et il leur faut de la place ;
     à l'ouest, elles se retournent vers l'intérieur des terres. */
  var MAP_H = 620, PAD_T = 30, PAD_L = 78, PAD_R = 108;
  var lats = TN.outline.map(function (pt) { return pt[1]; });
  var lons = TN.outline.map(function (pt) { return pt[0]; });
  var lat0 = Math.min.apply(null, lats), lat1 = Math.max.apply(null, lats);
  var lon0 = Math.min.apply(null, lons), lon1 = Math.max.apply(null, lons);
  /* Sans le cosinus, un degré de longitude vaudrait un degré de latitude
     et le pays sortirait deux fois trop large. */
  var kx = Math.cos((lat0 + lat1) / 2 * Math.PI / 180);
  var scale = (MAP_H - PAD_T * 2) / (lat1 - lat0);
  var MAP_W = (lon1 - lon0) * kx * scale + PAD_L + PAD_R;

  function mx(lon) { return PAD_L + (lon - lon0) * kx * scale; }
  function my(lat) { return PAD_T + (lat1 - lat) * scale; }

  function pathOf(points) {
    return points.map(function (pt, i) {
      return (i ? 'L' : 'M') + mx(pt[0]).toFixed(1) + ' ' + my(pt[1]).toFixed(1);
    }).join(' ') + ' Z';
  }

  function drawMapBase() {
    clear(elMap);
    elMap.setAttribute('viewBox', '0 0 ' + MAP_W.toFixed(1) + ' ' + MAP_H);

    var defs = svg('defs', {});
    var grad = svg('linearGradient', { id: 'tnLand', x1: '0', y1: '0', x2: '0.4', y2: '1' });
    grad.appendChild(svg('stop', { offset: '0%',   'stop-color': '#2a2340' }));
    grad.appendChild(svg('stop', { offset: '100%', 'stop-color': '#1a1528' }));
    defs.appendChild(grad);
    elMap.appendChild(defs);

    elMap.appendChild(svg('path', { d: pathOf(TN.outline), class: 'tn-land' }));
    TN.islands.forEach(function (isle) {
      elMap.appendChild(svg('path', { d: pathOf(isle.points), class: 'tn-land tn-isle' }));
    });
    TN.labels.forEach(function (lab) {
      elMap.appendChild(svgText(lab.text, {
        x: mx(lab.lon).toFixed(1), y: my(lab.lat).toFixed(1),
        'text-anchor': lab.anchor === 'end' ? 'end' : 'start', class: 'tn-geo'
      }));
    });

    /* La couche des lieux : redessinée à chaque époque. */
    elMap.appendChild(svg('g', { id: 'tnSites' }));
  }

  /* Deux étiquettes du même côté et à la même hauteur se recouvrent :
     on les écarte du minimum nécessaire, en descendant. */
  function spreadLabels(list) {
    var MIN = 17;
    ['start', 'end'].forEach(function (side) {
      var same = list.filter(function (s) { return s.anchor === side; })
                     .sort(function (a, b) { return a.ly - b.ly; });
      for (var i = 1; i < same.length; i++) {
        if (same[i].ly - same[i - 1].ly < MIN) same[i].ly = same[i - 1].ly + MIN;
      }
    });
  }

  function drawSites(period) {
    var layer = elMap.querySelector('#tnSites');
    if (!layer) return;
    clear(layer);

    var list = period.sites.map(function (s) {
      return {
        site: s,
        x: mx(s.lon), y: my(s.lat), ly: my(s.lat) + 4,
        /* À l'ouest, l'étiquette part vers la gauche ; à l'est, elle
           s'écrit dans la mer, où il y a toute la place. */
        anchor: s.lon < 9.85 ? 'end' : 'start'
      };
    });
    spreadLabels(list);

    list.forEach(function (item, i) {
      var s = item.site;
      var g = svg('g', { class: 'tn-site tn-site-' + s.kind });
      if (!isCalm()) g.style.animationDelay = (i * 55) + 'ms';

      var title = svg('title', {});
      title.textContent = s.name;
      g.appendChild(title);

      if (s.kind === 'capitale') {
        g.appendChild(svg('circle', {
          cx: item.x.toFixed(1), cy: item.y.toFixed(1), r: 13,
          fill: 'none', stroke: period.color, 'stroke-opacity': '.45', 'stroke-width': '2'
        }));
      }
      g.appendChild(svg('circle', {
        cx: item.x.toFixed(1), cy: item.y.toFixed(1),
        r: s.kind === 'capitale' ? 7 : (s.kind === 'ville' ? 5 : 4.4),
        fill: s.kind === 'site' ? 'none' : period.color,
        stroke: period.color,
        'stroke-width': s.kind === 'site' ? 2.4 : 2,
        'stroke-dasharray': s.kind === 'site' ? '3.2 2.6' : 'none'
      }));

      var dx = item.anchor === 'end' ? -12 : 12;
      /* « Thysdrus (El Jem) » s'écrit « Thysdrus » sur la carte : le nom
         complet reste dans l'infobulle, et la carte ne se remplit pas de
         parenthèses. */
      var label = svgText(s.name.replace(/\s*\(.*\)\s*$/, ''), {
        x: (item.x + dx).toFixed(1), y: item.ly.toFixed(1),
        'text-anchor': item.anchor,
        class: 'tn-site-name' + (s.kind === 'capitale' ? ' is-capital' : '')
      });
      g.appendChild(label);

      /* Quand l'étiquette a dû descendre, un fil la relie à son point. */
      if (Math.abs(item.ly - (item.y + 4)) > 2) {
        g.appendChild(svg('line', {
          x1: item.x.toFixed(1), y1: item.y.toFixed(1),
          x2: (item.x + dx * 0.55).toFixed(1), y2: (item.ly - 4).toFixed(1),
          class: 'tn-site-thread'
        }));
      }
      layer.appendChild(g);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     4. LA FICHE
     ══════════════════════════════════════════════════════════════ */

  function block(cls, heading, build) {
    var wrap = el('div', 'tn-block' + (cls ? ' ' + cls : ''));
    wrap.appendChild(el('h3', null, heading));
    build(wrap);
    return wrap;
  }

  function drawCard(p) {
    clear(elCard);
    elCard.style.setProperty('--tint', p.color);

    var era = TN.eraOf(p.era);

    var head = el('header', 'tn-card-head');
    var kicker = el('div', 'tn-kicker');
    kicker.appendChild(el('span', 'tn-period', p.period));
    kicker.appendChild(el('span', 'tn-tag', era.short || era.label));
    head.appendChild(kicker);

    var h2 = el('h2', 'tn-name');
    h2.appendChild(el('span', 'tn-emoji', p.emoji));
    h2.appendChild(doc.createTextNode(p.name));
    head.appendChild(h2);
    head.appendChild(el('p', 'tn-summary', p.summary));

    var stat = el('p', 'tn-stat');
    stat.appendChild(el('b', null, p.stat.value));
    stat.appendChild(el('span', null, p.stat.label));
    head.appendChild(stat);
    elCard.appendChild(head);

    /* Les trois lignes qu'on cherche en premier. */
    var meta = el('dl', 'tn-meta');
    [['Capitale', p.seat], ['Qui gouverne', p.rulers], ['Étendue', p.reach]].forEach(function (row) {
      meta.appendChild(el('dt', null, row[0]));
      meta.appendChild(el('dd', null, row[1]));
    });
    elCard.appendChild(meta);

    elCard.appendChild(block('tn-events', 'Ce qui s\'y passe', function (wrap) {
      var ol = el('ol', 'tn-timeline');
      p.events.forEach(function (ev) {
        var li = el('li');
        li.appendChild(el('b', null, ev.y));
        li.appendChild(el('span', null, ev.text));
        ol.appendChild(li);
      });
      wrap.appendChild(ol);
    }));

    elCard.appendChild(block('tn-figures', 'Qui on retient', function (wrap) {
      var ul = el('ul', 'tn-people');
      p.figures.forEach(function (f) {
        var li = el('li');
        li.appendChild(el('b', null, f.name));
        li.appendChild(el('span', null, f.note));
        ul.appendChild(li);
      });
      wrap.appendChild(ul);
    }));

    elCard.appendChild(block('tn-legacy', 'Ce qu\'il en reste aujourd\'hui', function (wrap) {
      var ul = el('ul', 'tn-list');
      p.legacy.forEach(function (line) { ul.appendChild(el('li', null, line)); });
      wrap.appendChild(ul);
    }));

    elCard.appendChild(block('tn-meanwhile', 'Pendant ce temps', function (wrap) {
      wrap.appendChild(el('p', null, p.meanwhile));
    }));

    elCard.appendChild(block('tn-turn', 'Comment ça bascule', function (wrap) {
      wrap.appendChild(el('p', null, p.turn));
    }));
  }

  /* ══════════════════════════════════════════════════════════════
     5. LA SÉLECTION
     ══════════════════════════════════════════════════════════════ */

  function select(i, opts) {
    i = Math.max(0, Math.min(periods.length - 1, i));
    var p = periods[i];
    index = i;

    drawCard(p);
    drawSites(p);
    moveCursor();

    chips.forEach(function (chip, k) {
      var on = k === i;
      chip.classList.toggle('is-on', on);
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    /* La pastille choisie peut être hors du rail : on la ramène. */
    if (chips[i] && elChips && elChips.scrollWidth > elChips.clientWidth) {
      var c = chips[i];
      elChips.scrollTo({
        left: c.offsetLeft - (elChips.clientWidth - c.offsetWidth) / 2,
        behavior: isCalm() ? 'auto' : 'smooth'
      });
    }

    if (elPos) elPos.textContent = (i + 1) + ' / ' + periods.length;
    if (elPrev) elPrev.disabled = i === 0;
    if (elNext) elNext.disabled = i === periods.length - 1;
    if (elReach) {
      /* Le Capsien n'a pas de capitale : personne ne gouverne encore rien. */
      var cap = p.sites.filter(function (s) { return s.kind === 'capitale'; })[0];
      elReach.textContent = p.sites.length + ' lieux sur la carte' +
        (cap ? ' — ' + cap.name + ' est alors le siège du pouvoir.'
             : ' — aucune capitale : le pouvoir n\'a pas encore de ville.');
    }

    /* Le stage se rejoue à chaque changement : la fiche entre, la carte
       repeuple ses points. */
    if (!isCalm()) {
      elCard.classList.remove('is-fresh');
      /* Forcer le navigateur à reprendre l'animation depuis le début. */
      void elCard.offsetWidth;
      elCard.classList.add('is-fresh');
    }

    if (!opts || opts.hash !== false) {
      var hash = '#age-' + p.id;
      if (global.history && global.history.replaceState) {
        global.history.replaceState(null, '', hash);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════
     6. MISE EN ROUTE
     ══════════════════════════════════════════════════════════════ */

  drawBand();
  buildChips();
  drawMapBase();

  if (elPrev) elPrev.addEventListener('click', function () { select(index - 1); });
  if (elNext) elNext.addEventListener('click', function () { select(index + 1); });

  /* Les flèches font défiler les époques — sauf quand on est en train
     d'écrire dans la recherche de la barre de navigation. */
  doc.addEventListener('keydown', function (ev) {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    var tag = (ev.target && ev.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (ev.target && ev.target.isContentEditable)) return;
    if (ev.key === 'ArrowRight') { ev.preventDefault(); select(index + 1); }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); select(index - 1); }
  });

  /* Une époque ouverte depuis l'URL : tunisie.html#age-hafsides */
  var start = 0;
  var hash = (global.location.hash || '').replace('#', '');
  if (hash.indexOf('age-') === 0) {
    var wanted = hash.slice('age-'.length);
    periods.forEach(function (p, i) { if (p.id === wanted) start = i; });
  }
  select(start, { hash: false });

})(window);
