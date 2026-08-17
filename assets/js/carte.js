/**
 * La carte des histoires
 * ------------------------------------------------------------------
 * Projette les contours (carte-data.js) et les lieux du catalogue sur un
 * SVG, puis relie chaque épingle aux contenus qui s'y passent.
 *
 * Projection équirectangulaire, la plus simple qui soit :
 *     x = (lon + 180) / 360 * L        y = (90 - lat) / 180 * H
 * Contours et épingles passent par la même formule — c'est ce qui garantit
 * qu'une épingle tombe au bon endroit sans réglage à la main.
 *
 * Le Proche-Orient concentre huit lieux dans un mouchoir de poche : à
 * l'échelle du monde, leurs pastilles se recouvrent et deviennent
 * incliquables. On les écarte donc en éventail autour du groupe, en gardant
 * un point à la position réelle et un fil qui relie les deux — la carte
 * reste honnête, et chaque lieu redevient atteignable au doigt.
 *
 * Accessibilité : la carte n'est pas le seul chemin. La même information
 * existe en liste dessous, chaque épingle est un bouton atteignable au
 * clavier, et le panneau de détail est annoncé (aria-live).
 */
(function (global) {
  'use strict';

  var GRENIER = global.GRENIER;

  /* Repère : le monde entier. On coupe au-delà de 82°N et 58°S — ni
     l'Antarctique ni la banquise n'accueillent d'histoire. */
  var L = 1000, H = 500;
  var NORD = 82, SUD = -58;

  /* Deux lieux plus proches que ça (en unités de carte) sont regroupés. */
  var SEUIL = 24;

  function px(lon) { return (lon + 180) / 360 * L; }
  function py(lat) { return (90 - lat) / 180 * H; }

  function $(id) { return document.getElementById(id); }

  var el = {
    carte: $('carteSvg'),
    panneau: $('cartePanneau'),
    liste: $('carteListe'),
    compte: $('carteCompte')
  };

  var etat = { lieux: [] };

  /* ── Tracés ────────────────────────────────────────────────── */

  function chemin(points, ferme) {
    return points.map(function (p, i) {
      return (i ? 'L' : 'M') + px(p[0]).toFixed(1) + ' ' + py(p[1]).toFixed(1);
    }).join(' ') + (ferme ? ' Z' : '');
  }

  function svgEl(nom, attrs) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', nom);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  /* ── Placement des épingles ────────────────────────────────── */

  function lieuxValides() {
    return GRENIER.lieux.map(function (lieu) {
      var items = lieu.stories.map(GRENIER.itemById).filter(Boolean);
      if (!items.length) return null;
      var copie = Object.assign({}, lieu, { items: items });
      copie.x = px(lieu.lon);
      copie.y = py(lieu.lat);
      copie.mx = copie.x;   /* position du marqueur, écartée si besoin */
      copie.my = copie.y;
      return copie;
    }).filter(Boolean);
  }

  /**
   * Écarte en éventail les lieux trop proches les uns des autres. Le point
   * reste à sa place ; seul le marqueur bouge, relié par un fil.
   */
  function ecarter(lieux) {
    var restants = lieux.slice();
    while (restants.length) {
      var tete = restants.shift();
      var groupe = [tete];
      for (var i = restants.length - 1; i >= 0; i--) {
        var d = Math.hypot(restants[i].x - tete.x, restants[i].y - tete.y);
        if (d < SEUIL) groupe.push(restants.splice(i, 1)[0]);
      }
      if (groupe.length < 2) continue;

      var cx = groupe.reduce(function (s, l) { return s + l.x; }, 0) / groupe.length;
      var cy = groupe.reduce(function (s, l) { return s + l.y; }, 0) / groupe.length;
      var rayon = Math.max(32, 7 * groupe.length);

      /* Ordre stable : du plus au nord au plus au sud, pour que l'éventail
         suive à peu près la géographie au lieu de la mélanger. */
      groupe.sort(function (a, b) { return a.y - b.y || a.x - b.x; });
      groupe.forEach(function (lieu, k) {
        var angle = -Math.PI / 2 + k * (2 * Math.PI / groupe.length);
        lieu.mx = cx + Math.cos(angle) * rayon;
        lieu.my = cy + Math.sin(angle) * rayon * 0.8;
        lieu.ecarte = true;
      });
    }
    return lieux;
  }

  /* ── Construction ──────────────────────────────────────────── */

  function construire(lieux) {
    el.carte.setAttribute('viewBox',
      '0 ' + py(NORD).toFixed(1) + ' ' + L + ' ' + (py(SUD) - py(NORD)).toFixed(1));

    /* Grille : un méridien tous les 30°, un parallèle tous les 20°. */
    var grille = svgEl('g', { class: 'carte-grille' });
    for (var lon = -150; lon <= 150; lon += 30) {
      grille.appendChild(svgEl('line', {
        x1: px(lon).toFixed(1), y1: py(NORD).toFixed(1),
        x2: px(lon).toFixed(1), y2: py(SUD).toFixed(1),
        'vector-effect': 'non-scaling-stroke'
      }));
    }
    for (var lat = 80; lat >= -40; lat -= 20) {
      grille.appendChild(svgEl('line', {
        x1: 0, y1: py(lat).toFixed(1), x2: L, y2: py(lat).toFixed(1),
        'vector-effect': 'non-scaling-stroke'
      }));
    }
    el.carte.appendChild(grille);

    var terres = svgEl('g', { class: 'carte-terres' });
    Object.keys(GRENIER.continents).forEach(function (nom) {
      terres.appendChild(svgEl('path', {
        d: chemin(GRENIER.continents[nom], true),
        class: 'carte-terre',
        'vector-effect': 'non-scaling-stroke'
      }));
    });
    el.carte.appendChild(terres);

    var routes = svgEl('g', { class: 'carte-routes' });
    GRENIER.trajets.forEach(function (t) {
      if (!GRENIER.itemById(t.story)) return;
      var p = svgEl('path', {
        d: chemin(t.points, false),
        class: 'carte-route',
        'data-story': t.story,
        'vector-effect': 'non-scaling-stroke'
      });
      p.appendChild(svgEl('title', {})).textContent = t.nom;
      routes.appendChild(p);
    });
    el.carte.appendChild(routes);

    var epingles = svgEl('g', { class: 'carte-epingles' });
    lieux.forEach(function (lieu, i) {
      var accent = GRENIER.categoryOf(lieu.items[0].cat).accent;
      var g = svgEl('g', {
        class: 'carte-epingle' + (lieu.ecarte ? ' is-ecartee' : ''),
        tabindex: '0',
        role: 'button',
        'aria-label': lieu.nom + ' — ' + lieu.items.length +
          (lieu.items.length > 1 ? ' histoires' : ' histoire')
      });
      g.style.setProperty('--accent', accent);

      if (lieu.ecarte) {
        g.appendChild(svgEl('line', {
          class: 'carte-fil', 'vector-effect': 'non-scaling-stroke',
          x1: lieu.x.toFixed(1), y1: lieu.y.toFixed(1),
          x2: lieu.mx.toFixed(1), y2: lieu.my.toFixed(1)
        }));
        g.appendChild(svgEl('circle', {
          class: 'carte-ancre', cx: lieu.x.toFixed(1), cy: lieu.y.toFixed(1), r: 2
        }));
      }

      var marqueur = svgEl('g', {
        class: 'carte-marqueur',
        transform: 'translate(' + lieu.mx.toFixed(1) + ' ' + lieu.my.toFixed(1) + ')'
      });
      /* Cible tactile : le halo peint fait 17 px de large, sous le minimum
         de 24 × 24 px du critère WCAG 2.5.8. Ce disque transparent la porte
         à 29 px, sans dépasser l'écart entre deux épingles de l'éventail. */
      marqueur.appendChild(svgEl('circle', { class: 'carte-cible', r: 13 }));
      marqueur.appendChild(svgEl('circle', { class: 'carte-halo', r: 14 }));
      marqueur.appendChild(svgEl('circle', { class: 'carte-point', r: 7 }));
      if (lieu.items.length > 1) {
        var n = svgEl('text', { class: 'carte-nombre', y: 3 });
        n.textContent = lieu.items.length;
        marqueur.appendChild(n);
      }
      var etiquette = svgEl('text', { class: 'carte-etiquette', y: -15 });
      etiquette.textContent = lieu.nom;
      marqueur.appendChild(etiquette);
      g.appendChild(marqueur);

      g.addEventListener('click', function () { ouvrir(i); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrir(i); }
      });
      epingles.appendChild(g);
      lieu.noeud = g;
    });
    el.carte.appendChild(epingles);
  }

  /* ── Panneau de détail ─────────────────────────────────────── */

  function ouvrir(i) {
    var lieu = etat.lieux[i];
    if (!lieu) return;

    etat.lieux.forEach(function (l) { l.noeud.classList.toggle('is-on', l === lieu); });
    /* L'épingle ouverte passe devant : dans un éventail, elle serait sinon
       recouverte par ses voisines. */
    lieu.noeud.parentNode.appendChild(lieu.noeud);

    var routes = el.carte.querySelectorAll('.carte-route');
    var ids = lieu.items.map(function (it) { return it.id; });
    for (var r = 0; r < routes.length; r++) {
      routes[r].classList.toggle('is-on', ids.indexOf(routes[r].getAttribute('data-story')) >= 0);
    }

    var esc = GRENIER.escapeHtml;
    el.panneau.innerHTML =
      '<h2>' + esc(lieu.nom) + '</h2>' +
      '<p class="carte-note">' + esc(lieu.note) + '</p>' +
      '<div class="carte-liens">' +
      lieu.items.map(function (it) {
        var cat = GRENIER.categoryOf(it.cat);
        return '<a class="carte-lien" href="' + GRENIER.base + GRENIER.hrefOf(it) + '" ' +
          'style="--accent:' + cat.accent + '">' +
          '<span aria-hidden="true">' + (it.emoji || '📖') + '</span>' +
          '<span><strong>' + esc(it.title) + '</strong>' +
          '<small>' + esc(GRENIER.ageLabel(it.age)) + ' · ' + esc(cat.label) + '</small></span>' +
          '</a>';
      }).join('') +
      '</div>';
    el.panneau.hidden = false;
  }

  /* ── Liste équivalente (et repli sans carte) ───────────────── */

  function construireListe(lieux) {
    var esc = GRENIER.escapeHtml;
    el.liste.innerHTML = lieux.map(function (lieu, i) {
      return '<li><button type="button" class="carte-item" data-i="' + i + '">' +
        '<strong>' + esc(lieu.nom) + '</strong>' +
        '<span>' + lieu.items.map(function (it) { return esc(it.title); }).join(' · ') + '</span>' +
        '</button></li>';
    }).join('');

    el.liste.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.carte-item') : null;
      if (!b) return;
      ouvrir(Number(b.getAttribute('data-i')));
      el.panneau.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  /* ── Démarrage ─────────────────────────────────────────────── */

  function start() {
    etat.lieux = ecarter(lieuxValides());
    var total = etat.lieux.reduce(function (n, l) { return n + l.items.length; }, 0);

    construire(etat.lieux);
    construireListe(etat.lieux);
    el.compte.innerHTML = '<b>' + total + '</b> histoires situées sur <b>' +
      etat.lieux.length + '</b> lieux';

    ouvrir(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window);
