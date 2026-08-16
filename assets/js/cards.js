/**
 * Fabrique de cartes de contenu
 * ------------------------------------------------------------------
 * Une seule définition de la carte, partagée par l'accueil, la
 * bibliothèque et la section des favoris — pour que les trois ne
 * divergent jamais.
 *
 * La carte est bâtie autour de sa vignette : l'espace est réservé par
 * aspect-ratio et l'image est chargée paresseusement, donc la grille ne
 * bouge pas pendant le chargement.
 */
(function (global) {
  'use strict';

  var GRENIER = global.GRENIER;
  var auth = GRENIER.auth;

  /** Contenus créés dans l'Atelier et gardés dans ce navigateur. */
  GRENIER.creations = function () {
    return GRENIER.storage.read('grenier.creations', []).map(function (c) {
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
        thumb: c.thumb || null,
        href: GRENIER.base + 'lecture.html?id=' + encodeURIComponent(c.id)
      };
    });
  };

  /** Catalogue du dépôt + créations locales, chemins résolus. */
  GRENIER.allItems = function () {
    var repo = GRENIER.items.map(GRENIER.resolve);
    return GRENIER.creations().concat(repo);
  };

  /* Vignette de repli pour les créations locales, qui n'ont pas de fichier
     SVG dans le dépôt : un dégradé aux couleurs de leur univers. */
  function fallbackThumb(item) {
    var accent = GRENIER.categoryOf(item.cat).accent;
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0%" stop-color="' + accent + '" stop-opacity=".55"/>' +
          '<stop offset="100%" stop-color="#0b0a16"/></linearGradient></defs>' +
        '<rect width="400" height="300" fill="#0b0a16"/>' +
        '<rect width="400" height="300" fill="url(#g)"/>' +
        '<text x="200" y="185" font-size="96" text-anchor="middle">' + (item.emoji || '✨') + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  GRENIER.thumbFor = function (item) {
    return item.mine ? (item.thumb || fallbackThumb(item)) : GRENIER.thumbOf(item);
  };

  /**
   * Construit la carte d'un contenu.
   * @param {Object} item  entrée du catalogue (ou création locale)
   * @param {number} index position dans la grille, pour la cascade
   */
  GRENIER.cardFor = function (item, index) {
    var cat = GRENIER.categoryOf(item.cat);
    var kind = GRENIER.kinds[item.kind] || GRENIER.kinds.histoire;
    var locked = !auth.canAccess(item);
    var esc = GRENIER.escapeHtml;

    var card = document.createElement('a');
    card.className = 'gr-card gr-reveal' + (locked ? ' is-locked' : '');
    /* Filet de sécurité : une carte doit toujours mener quelque part. */
    card.href = item.href || (GRENIER.base + GRENIER.hrefOf(item));
    card.style.setProperty('--accent', cat.accent);
    card.style.setProperty('--i', index || 0);

    card.innerHTML =
      '<div class="gr-card-media">' +
        '<img class="gr-card-thumb" src="' + GRENIER.thumbFor(item) + '" alt="" ' +
             'loading="lazy" decoding="async" width="400" height="300">' +
        (locked ? '<span class="gr-card-lock">🔒 Membres</span>' : '') +
        '<button class="gr-fav" type="button" aria-pressed="false" ' +
                'aria-label="Ajouter « ' + esc(item.title) + ' » aux favoris">' +
          '<span aria-hidden="true">♥</span></button>' +
        '<span class="gr-card-kind">' + esc(kind.label) + '</span>' +
      '</div>' +
      '<div class="gr-card-body">' +
        '<span class="gr-card-kicker">' +
          (item.mine ? 'Ma création' : esc(cat.label)) + '</span>' +
        '<h3 class="gr-card-title">' + esc(item.title) + '</h3>' +
        '<p class="gr-card-desc">' + esc(item.desc) + '</p>' +
        '<div class="gr-card-foot">' +
          '<span>' + (locked ? 'Réservé aux membres' : esc(GRENIER.ageLabel(item.age))) + '</span>' +
          '<span class="gr-card-cta">' + kind.verb +
            ' <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
            'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M5 12h14M13 6l6 6-6 6"/></svg></span>' +
        '</div>' +
      '</div>';

    /* Favori — le clic ne doit pas suivre le lien de la carte. */
    var fav = card.querySelector('.gr-fav');
    function paintFav(on) {
      fav.classList.toggle('is-on', on);
      fav.setAttribute('aria-pressed', String(on));
      fav.setAttribute('aria-label',
        (on ? 'Retirer « ' : 'Ajouter « ') + item.title + (on ? ' » des favoris' : ' » aux favoris'));
    }
    paintFav(auth.isFavorite(item.id));
    fav.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      paintFav(auth.toggleFavorite(item.id));
      document.dispatchEvent(new CustomEvent('grenier:favorites'));
    });

    /* Contenu réservé : on propose le compte au lieu d'ouvrir la page. */
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
  };

  /**
   * Remplit un conteneur de cartes.
   * @param {Element} container
   * @param {Array} items
   * @param {Object} options {empty: string, swap: boolean}
   */
  GRENIER.fillCards = function (container, items, options) {
    options = options || {};
    container.innerHTML = '';

    if (!items.length) {
      if (options.empty) {
        container.innerHTML =
          '<div class="gr-empty"><div aria-hidden="true">🕯️</div>' +
          GRENIER.escapeHtml(options.empty) + '</div>';
      }
      return;
    }

    var fragment = document.createDocumentFragment();
    items.forEach(function (item, i) { fragment.appendChild(GRENIER.cardFor(item, i)); });
    container.appendChild(fragment);

    if (options.swap) {
      container.classList.remove('gr-swap');
      void container.offsetWidth;      /* redémarre l'animation */
      container.classList.add('gr-swap');
    }
    GRENIER.observeReveals(container);
  };
})(window);
