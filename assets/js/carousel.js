/**
 * Carrousel empilé — port en JS natif du composant React « CarouselStacked »
 * ------------------------------------------------------------------
 * Le composant d'origine (carousel-07.tsx) s'appuie sur React, motion/react,
 * Tailwind et shadcn/ui. Ce site est volontairement sans build : HTML, CSS et
 * JS servis tels quels par GitHub Pages. On a donc porté la *logique* du
 * composant plutôt que d'ajouter une chaîne de compilation (voir README).
 *
 * Ce qui est repris fidèlement :
 *   - la géométrie de la pile, réglée par paliers de largeur d'écran :
 *       x       = offset * xMultiplier
 *       y       = |offset| * yMultiplier
 *       rotate  = offset * rotationMultiplier   (0 si |offset| < 0.05)
 *       scale   = 1 - |offset| * scaleReduction
 *       zIndex  = round(100 - |offset| * 10)
 *   - le glisser-déposer, avec quantification au relâcher :
 *       shift = clamp(round(-dx / distanceDivisor + -v / velocityDivisor), -3, 3)
 *   - un ressort (raideur 200, amortissement 30, masse 1) au lieu d'une
 *     transition CSS, intégré à la main pour coller au `spring` de motion.
 *
 * Ce qui est ajouté :
 *   - flèches précédent / suivant, pastilles, flèches du clavier et prise de
 *     focus. WCAG 2.2 (2.5.7 « Dragging Movements », niveau AA) exige une
 *     alternative à pointeur unique pour toute action au glisser : le
 *     carrousel d'origine n'est manipulable qu'à la souris ou au doigt.
 *   - le respect de prefers-reduced-motion (saut direct, sans ressort).
 *   - un défilement circulaire : avec sept univers, on ne veut pas de butée.
 */
(function (global) {
  'use strict';

  var GRENIER = global.GRENIER || (global.GRENIER = {});

  /* Réglages par palier de largeur, dans l'esprit des trois jeux de valeurs
     du composant d'origine. `distance` vaut 1,2 × `x` : le seuil de bascule
     tombe donc à 0,6 largeur de carte, là où l'œil considère que la carte
     suivante a pris la place de l'autre. Plus loin, on tire longtemps pour
     rien et le geste semble ne pas répondre. */
  var TIERS = [
    { max: 640,      x: 150, y: 40, rotation: 8,  scaleReduction: 0.06, distance: 180, velocity: 900 },
    { max: 1024,     x: 180, y: 52, rotation: 10, scaleReduction: 0.09, distance: 216, velocity: 900 },
    { max: Infinity, x: 200, y: 64, rotation: 12, scaleReduction: 0.12, distance: 240, velocity: 900 }
  ];

  /* Au-delà de cet écart, une carte est trop loin derrière la pile : on la
     laisse dans le DOM (elle reste atteignable au clavier) mais invisible. */
  var VISIBLE_SPAN = 2.6;

  var SPRING = { stiffness: 200, damping: 30, mass: 1 };

  function tierFor(width) {
    for (var i = 0; i < TIERS.length; i++) if (width < TIERS[i].max) return TIERS[i];
    return TIERS[TIERS.length - 1];
  }

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

  /* Math.round penche vers +∞ : round(0.5) vaut 1 mais round(-0.5) vaut 0.
     Le seuil de bascule serait donc plus dur à franchir vers l'arrière que
     vers l'avant. On arrondit sur la valeur absolue pour que les deux sens
     répondent exactement pareil. */
  function roundSymmetric(value) {
    return Math.sign(value) * Math.round(Math.abs(value));
  }

  function prefersReducedMotion() {
    return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function arrow(path) {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="' + path + '"/></svg>';
  }

  /**
   * Monte un carrousel empilé.
   *
   * @param {HTMLElement} mount   conteneur, vidé puis rempli
   * @param {Array} slides        [{ href, accent, label, html }]
   * @param {Object} [options]    { label, announce }
   * @returns {Object} { go, next, prev, destroy }
   */
  GRENIER.stackedCarousel = function (mount, slides, options) {
    var opts = options || {};
    var count = slides.length;
    if (!count) return null;

    /* ── Structure ────────────────────────────────────────────── */

    mount.innerHTML = '';
    mount.classList.add('gr-carousel');
    mount.setAttribute('role', 'group');
    mount.setAttribute('aria-roledescription', 'carrousel');
    if (opts.label) mount.setAttribute('aria-label', opts.label);

    var stage = document.createElement('div');
    stage.className = 'gr-carousel-stage';

    var nodes = slides.map(function (slide, i) {
      var node = document.createElement('a');
      node.className = 'gr-slide';
      node.href = slide.href;
      /* Un lien est nativement « draggable » : sans ça, Chrome démarre son
         propre glisser-déposer au bout de quelques pixels, avale nos
         pointermove et coupe le geste — surtout vers la droite, où le
         curseur part vers le corps du lien. */
      node.draggable = false;
      node.addEventListener('dragstart', function (e) { e.preventDefault(); });
      node.style.setProperty('--accent', slide.accent || 'var(--gr-gold)');
      node.innerHTML = slide.html;
      /* Prendre le focus d'une carte enfouie la ramène devant : c'est la
         navigation au clavier. On l'ignore quand le focus vient d'un clic,
         sinon le ressort se déclenche au beau milieu d'un glissement. */
      node.addEventListener('focus', function () {
        if (!node.matches || node.matches(':focus-visible')) go(i);
      });
      stage.appendChild(node);
      return node;
    });

    var controls = document.createElement('div');
    controls.className = 'gr-carousel-ctrl';

    var prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'gr-carousel-btn';
    prevBtn.setAttribute('aria-label', 'Univers précédent');
    prevBtn.innerHTML = arrow('M15 6l-6 6 6 6');

    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'gr-carousel-btn';
    nextBtn.setAttribute('aria-label', 'Univers suivant');
    nextBtn.innerHTML = arrow('M9 6l6 6-6 6');

    var dots = document.createElement('div');
    dots.className = 'gr-carousel-dots';
    var dotNodes = slides.map(function (slide, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'gr-carousel-dot';
      dot.setAttribute('aria-label', 'Afficher « ' + (slide.label || 'univers ' + (i + 1)) + ' »');
      dot.style.setProperty('--accent', slide.accent || 'var(--gr-gold)');
      dot.addEventListener('click', function () { go(i); });
      dots.appendChild(dot);
      return dot;
    });

    var status = document.createElement('p');
    status.className = 'gr-sr-only';
    status.setAttribute('aria-live', 'polite');

    controls.appendChild(prevBtn);
    controls.appendChild(dots);
    controls.appendChild(nextBtn);
    mount.appendChild(stage);
    mount.appendChild(controls);
    mount.appendChild(status);

    /* ── État ─────────────────────────────────────────────────── */

    var tier = tierFor(global.innerWidth);
    var position = 0;      /* position continue, peut sortir de [0, count) */
    var target = 0;        /* index visé, entier */
    var velocity = 0;      /* vitesse du ressort, en index/seconde */
    var frame = null;
    var drag = null;
    var suppressClick = false;

    /** Écart le plus court entre une carte et la position, en circulaire. */
    function offsetOf(i) {
      var off = (i - position) % count;
      if (off < 0) off += count;
      if (off > count / 2) off -= count;
      return off;
    }

    function paint() {
      for (var i = 0; i < count; i++) {
        var off = offsetOf(i);
        var abs = Math.abs(off);
        var rotate = abs < 0.05 ? 0 : off * tier.rotation;
        var node = nodes[i];

        node.style.transform =
          'translate3d(calc(-50% + ' + (off * tier.x).toFixed(1) + 'px), ' +
          (abs * tier.y).toFixed(1) + 'px, 0) ' +
          'rotate(' + rotate.toFixed(2) + 'deg) ' +
          'scale(' + Math.max(0.4, 1 - abs * tier.scaleReduction).toFixed(3) + ')';
        node.style.zIndex = String(Math.round(100 - abs * 10));

        var hidden = abs > VISIBLE_SPAN;
        node.style.opacity = hidden ? '0' : String(Math.max(0.2, 1 - abs * 0.3).toFixed(2));
        node.style.pointerEvents = hidden ? 'none' : '';
        node.classList.toggle('is-active', abs < 0.5);
      }
    }

    function indexAt(pos) { return ((Math.round(pos) % count) + count) % count; }
    function current() { return indexAt(position); }

    /* Les pastilles et l'annonce suivent la *cible*, pas la position : au
       clic, l'état affiché doit être celui qu'on vient de demander, sans
       attendre la fin du ressort. */
    function paintChrome(index) {
      var active = index == null ? current() : index;
      dotNodes.forEach(function (dot, i) {
        dot.classList.toggle('is-on', i === active);
        if (i === active) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      if (opts.announce !== false) {
        status.textContent = (slides[active].label || '') +
          ' — univers ' + (active + 1) + ' sur ' + count;
      }
    }

    /* ── Ressort ──────────────────────────────────────────────── */

    function settle() {
      if (frame) return;
      var last = performance.now();

      frame = requestAnimationFrame(function step(now) {
        var dt = Math.min(0.032, (now - last) / 1000);
        last = now;

        /* Intégration en sous-pas : à 200 de raideur, un pas de 32 ms
           diverge. Quatre sous-pas suffisent et restent bon marché. */
        for (var s = 0; s < 4; s++) {
          var h = dt / 4;
          var force = -SPRING.stiffness * (position - target) - SPRING.damping * velocity;
          velocity += (force / SPRING.mass) * h;
          position += velocity * h;
        }

        paint();

        if (Math.abs(position - target) < 0.001 && Math.abs(velocity) < 0.01) {
          position = target;
          velocity = 0;
          frame = null;
          paint();
          paintChrome();
          return;
        }
        frame = requestAnimationFrame(step);
      });
    }

    function go(index, immediate) {
      /* On vise l'occurrence la plus proche de l'index demandé : passer de la
         dernière carte à la première tourne d'un cran, pas de six. */
      var delta = ((index - current()) % count + count) % count;
      if (delta > count / 2) delta -= count;
      target = Math.round(position) + delta;

      if (immediate || prefersReducedMotion()) {
        if (frame) { cancelAnimationFrame(frame); frame = null; }
        position = target;
        velocity = 0;
        paint();
        paintChrome();
        return;
      }
      paintChrome(indexAt(target));
      settle();
    }

    function shift(step) { go(((current() + step) % count + count) % count); }

    /* ── Pointeur ─────────────────────────────────────────────── */

    stage.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button > 0) return;
      if (frame) { cancelAnimationFrame(frame); frame = null; }

      drag = {
        id: e.pointerId,
        x: e.clientX,
        origin: position,
        time: performance.now(),
        lastX: e.clientX,
        speed: 0,
        moved: false
      };
      velocity = 0;
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('is-dragging');
    });

    stage.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x;
      if (Math.abs(dx) > 6) drag.moved = true;

      var now = performance.now();
      var dt = Math.max(1, now - drag.time);
      drag.speed = ((e.clientX - drag.lastX) / dt) * 1000;   /* px/s */
      drag.lastX = e.clientX;
      drag.time = now;

      position = drag.origin - dx / tier.x;
      paint();
    });

    function endDrag(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      var dx = (e ? e.clientX : drag.lastX) - drag.x;
      var totalShift = clamp(
        roundSymmetric(-dx / tier.distance + -drag.speed / tier.velocity), -3, 3
      );
      var landed = roundSymmetric(drag.origin) + totalShift;

      /* Un glissement ne doit pas ouvrir l'univers relâché sous le doigt.
         Le clic arrive juste après ce gestionnaire : on laisse le drapeau
         retomber au tour de boucle suivant. */
      suppressClick = drag.moved;
      setTimeout(function () { suppressClick = false; }, 0);

      stage.classList.remove('is-dragging');
      drag = null;

      target = landed;
      paintChrome(indexAt(target));
      if (prefersReducedMotion()) { position = target; paint(); }
      else settle();
    }

    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    /* Cliquer une carte de côté la ramène au centre au lieu de l'ouvrir :
       on voit ce qu'on choisit avant de partir. */
    stage.addEventListener('click', function (e) {
      var link = e.target.closest ? e.target.closest('.gr-slide') : null;
      if (!link) return;
      if (suppressClick) { e.preventDefault(); return; }
      if (!link.classList.contains('is-active')) {
        e.preventDefault();
        go(nodes.indexOf(link));
      }
    }, true);

    /* ── Clavier et flèches ───────────────────────────────────── */

    prevBtn.addEventListener('click', function () { shift(-1); });
    nextBtn.addEventListener('click', function () { shift(1); });

    mount.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); shift(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); shift(1); }
      else if (e.key === 'Home') { e.preventDefault(); go(0); }
      else if (e.key === 'End') { e.preventDefault(); go(count - 1); }
    });

    /* ── Réactivité ───────────────────────────────────────────── */

    function onResize() {
      var next = tierFor(global.innerWidth);
      if (next === tier) return;
      tier = next;
      paint();
    }
    global.addEventListener('resize', onResize);

    paint();
    paintChrome();

    return {
      go: go,
      next: function () { shift(1); },
      prev: function () { shift(-1); },
      destroy: function () {
        if (frame) cancelAnimationFrame(frame);
        global.removeEventListener('resize', onResize);
        mount.innerHTML = '';
      }
    };
  };
})(window);
