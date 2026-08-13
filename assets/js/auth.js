/**
 * Comptes du Grenier des Apps
 * ------------------------------------------------------------------
 * Le site est 100 % statique (GitHub Pages, aucun serveur) : les comptes
 * vivent donc dans le localStorage du navigateur. Concrètement :
 *
 *   • un compte créé sur un appareil n'existe que sur cet appareil ;
 *   • le mot de passe n'est jamais stocké en clair (PBKDF2-SHA256, sel
 *     aléatoire) mais quelqu'un qui a accès au navigateur peut contourner
 *     la barrière — c'est une porte, pas un coffre-fort ;
 *   • les fichiers HTML réservés restent atteignables par URL directe.
 *
 * C'est volontairement une « inscription douce » : elle personnalise la
 * bibliothèque et réserve l'Atelier, sans prétendre à une vraie sécurité.
 * Pour un vrai contrôle d'accès il faudrait un backend.
 */
(function (global) {
  'use strict';

  var GRENIER = global.GRENIER || (global.GRENIER = {});

  var K_USERS   = 'grenier.users';
  var K_SESSION = 'grenier.session';
  var K_FAVS    = 'grenier.favs';
  var K_SEEN    = 'grenier.seen';
  var ITERATIONS = 150000;

  /* ── Stockage ─────────────────────────────────────────────── */

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ── Empreinte du mot de passe ─────────────────────────────── */

  function toHex(buffer) {
    var bytes = new Uint8Array(buffer), out = '';
    for (var i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
    return out;
  }

  function randomSalt() {
    var bytes = new Uint8Array(16);
    if (global.crypto && global.crypto.getRandomValues) {
      global.crypto.getRandomValues(bytes);
    } else {
      for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return toHex(bytes.buffer);
  }

  /* Repli quand crypto.subtle est indisponible (page ouverte en file://
     par exemple). Nettement plus faible — signalé dans l'enregistrement. */
  function weakHash(password, salt) {
    var input = salt + '|' + password, h1 = 0x811c9dc5, h2 = 0x1000193;
    for (var i = 0; i < input.length; i++) {
      h1 = (h1 ^ input.charCodeAt(i)) >>> 0;
      h1 = Math.imul(h1, 16777619) >>> 0;
      h2 = (h2 + Math.imul(input.charCodeAt(i) + i, 2654435761)) >>> 0;
    }
    return 'weak:' + h1.toString(16) + h2.toString(16);
  }

  function hashPassword(password, salt) {
    var subtle = global.crypto && global.crypto.subtle;
    if (!subtle) return Promise.resolve(weakHash(password, salt));

    var enc = new TextEncoder();
    return subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
      .then(function (key) {
        return subtle.deriveBits({
          name: 'PBKDF2',
          salt: enc.encode(salt),
          iterations: ITERATIONS,
          hash: 'SHA-256'
        }, key, 256);
      })
      .then(function (bits) { return 'pbkdf2:' + toHex(bits); })
      .catch(function () { return weakHash(password, salt); });
  }

  /* ── API publique ─────────────────────────────────────────── */

  var listeners = [];

  function notify() {
    var user = auth.current();
    listeners.forEach(function (fn) {
      try { fn(user); } catch (e) { /* un abonné cassé n'arrête pas les autres */ }
    });
  }

  var auth = {
    /** Utilisateur connecté, ou null. */
    current: function () {
      var session = read(K_SESSION, null);
      if (!session || !session.email) return null;
      var users = read(K_USERS, {});
      var record = users[session.email];
      if (!record) return null;
      return { name: record.name, email: record.email, createdAt: record.createdAt };
    },

    isLoggedIn: function () { return !!auth.current(); },

    signup: function (name, email, password) {
      name = String(name || '').trim();
      email = String(email || '').trim().toLowerCase();
      password = String(password || '');

      if (name.length < 2) return Promise.reject(new Error('Indique un prénom d\'au moins 2 lettres.'));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Promise.reject(new Error('Cette adresse e-mail ne semble pas valide.'));
      if (password.length < 6) return Promise.reject(new Error('Le mot de passe doit faire au moins 6 caractères.'));

      var users = read(K_USERS, {});
      if (users[email]) return Promise.reject(new Error('Un compte existe déjà avec cette adresse sur cet appareil.'));

      var salt = randomSalt();
      return hashPassword(password, salt).then(function (hash) {
        users[email] = {
          name: name, email: email, salt: salt, hash: hash,
          createdAt: new Date().toISOString()
        };
        if (!write(K_USERS, users)) throw new Error('Impossible d\'enregistrer le compte : le stockage du navigateur est bloqué.');
        write(K_SESSION, { email: email, at: Date.now() });
        notify();
        return auth.current();
      });
    },

    login: function (email, password) {
      email = String(email || '').trim().toLowerCase();
      password = String(password || '');

      var users = read(K_USERS, {});
      var record = users[email];
      if (!record) return Promise.reject(new Error('Aucun compte trouvé pour cette adresse sur cet appareil.'));

      return hashPassword(password, record.salt).then(function (hash) {
        if (hash !== record.hash) throw new Error('Mot de passe incorrect.');
        write(K_SESSION, { email: email, at: Date.now() });
        notify();
        return auth.current();
      });
    },

    logout: function () {
      try { localStorage.removeItem(K_SESSION); } catch (e) { /* rien à faire */ }
      notify();
    },

    onChange: function (fn) {
      listeners.push(fn);
      return function () {
        var i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    },

    /** Un contenu est-il consultable en l'état ? */
    canAccess: function (item) {
      return !item || item.access !== 'membre' || auth.isLoggedIn();
    },

    /* ── Favoris ─────────────────────────────────────────────── */
    favorites: function () { return read(K_FAVS, []); },
    isFavorite: function (id) { return auth.favorites().indexOf(id) >= 0; },
    toggleFavorite: function (id) {
      var favs = auth.favorites();
      var i = favs.indexOf(id);
      if (i >= 0) favs.splice(i, 1); else favs.unshift(id);
      write(K_FAVS, favs);
      return i < 0;
    },

    /* ── Historique de consultation ──────────────────────────── */
    markSeen: function (id) {
      var seen = read(K_SEEN, {});
      seen[id] = Date.now();
      write(K_SEEN, seen);
    },
    seen: function () { return read(K_SEEN, {}); },
    recent: function (limit) {
      var seen = read(K_SEEN, {});
      return Object.keys(seen)
        .sort(function (a, b) { return seen[b] - seen[a]; })
        .slice(0, limit || 4);
    }
  };

  GRENIER.auth = auth;
  GRENIER.storage = { read: read, write: write };

  /* ══════════════════════════════════════════════════════════════
     Modale d'inscription / connexion
     ══════════════════════════════════════════════════════════════ */

  var modal = null;
  var afterAuth = null;

  function buildModal() {
    if (modal) return modal;

    modal = document.createElement('div');
    modal.className = 'gr-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Compte du Grenier');
    modal.innerHTML =
      '<div class="gr-modal-box" style="position:relative">' +
        '<button class="gr-btn gr-btn-ghost gr-btn-sm gr-modal-close" type="button" aria-label="Fermer">✕</button>' +
        '<h3 data-gr="title">Rejoindre le Grenier</h3>' +
        '<p data-gr="lead">Un compte débloque les contenus réservés et l\'Atelier de création.</p>' +
        '<div class="gr-tabs">' +
          '<button class="gr-tab is-on" type="button" data-mode="signup">Créer un compte</button>' +
          '<button class="gr-tab" type="button" data-mode="login">J\'ai déjà un compte</button>' +
        '</div>' +
        '<div class="gr-error" data-gr="error" hidden></div>' +
        '<form data-gr="form" novalidate>' +
          '<div class="gr-field" data-gr="nameField">' +
            '<label for="gr-name">Prénom</label>' +
            '<input class="gr-input" id="gr-name" name="name" type="text" autocomplete="given-name" placeholder="Nour">' +
          '</div>' +
          '<div class="gr-field">' +
            '<label for="gr-email">Adresse e-mail</label>' +
            '<input class="gr-input" id="gr-email" name="email" type="email" autocomplete="email" placeholder="nour@exemple.com">' +
          '</div>' +
          '<div class="gr-field">' +
            '<label for="gr-password">Mot de passe</label>' +
            '<input class="gr-input" id="gr-password" name="password" type="password" autocomplete="current-password" placeholder="6 caractères minimum">' +
          '</div>' +
          '<button class="gr-btn gr-btn-primary" type="submit" style="width:100%;height:46px" data-gr="submit">Créer mon compte</button>' +
        '</form>' +
        '<p class="gr-hint" style="margin-top:16px">Le Grenier n\'a pas de serveur : votre compte et vos favoris restent ' +
        'dans ce navigateur, sur cet appareil. Rien n\'est envoyé sur Internet. Le mot de passe est stocké sous forme ' +
        'd\'empreinte — n\'y mettez pas un mot de passe que vous utilisez ailleurs.</p>' +
      '</div>';

    document.body.appendChild(modal);

    var box = modal.querySelector('.gr-modal-box');
    var form = modal.querySelector('[data-gr="form"]');
    var errorBox = modal.querySelector('[data-gr="error"]');
    var submit = modal.querySelector('[data-gr="submit"]');
    var nameField = modal.querySelector('[data-gr="nameField"]');
    var mode = 'signup';

    function setMode(next) {
      mode = next;
      modal.querySelectorAll('.gr-tab').forEach(function (tab) {
        tab.classList.toggle('is-on', tab.getAttribute('data-mode') === next);
      });
      nameField.hidden = next !== 'signup';
      submit.textContent = next === 'signup' ? 'Créer mon compte' : 'Me connecter';
      errorBox.hidden = true;
    }

    modal.querySelectorAll('.gr-tab').forEach(function (tab) {
      tab.addEventListener('click', function () { setMode(tab.getAttribute('data-mode')); });
    });

    modal.querySelector('.gr-modal-close').addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errorBox.hidden = true;
      submit.disabled = true;
      submit.textContent = 'Un instant…';

      var data = new FormData(form);
      var run = mode === 'signup'
        ? auth.signup(data.get('name'), data.get('email'), data.get('password'))
        : auth.login(data.get('email'), data.get('password'));

      run.then(function (user) {
        /* Le rappel est capturé avant close(), qui remet afterAuth à null. */
        var cb = afterAuth;
        afterAuth = null;
        form.reset();
        close();
        if (cb) cb(user);
      }).catch(function (err) {
        errorBox.textContent = err && err.message ? err.message : 'Une erreur est survenue.';
        errorBox.hidden = false;
      }).then(function () {
        submit.disabled = false;
        setMode(mode);
      });
    });

    modal._setMode = setMode;
    modal._box = box;
    return modal;
  }

  function open(options) {
    options = options || {};
    var m = buildModal();
    m._setMode(options.mode || 'signup');
    m.querySelector('[data-gr="title"]').textContent = options.title || 'Rejoindre le Grenier';
    m.querySelector('[data-gr="lead"]').textContent = options.message ||
      'Un compte débloque les contenus réservés et l\'Atelier de création.';
    afterAuth = options.onSuccess || null;
    m.classList.add('is-open');
    var first = m.querySelector('input:not([hidden])');
    setTimeout(function () {
      var visible = m.querySelector('.gr-field:not([hidden]) input');
      (visible || first || m).focus();
    }, 60);
  }

  function close() {
    if (modal) modal.classList.remove('is-open');
    afterAuth = null;
  }

  auth.openModal = open;
  auth.closeModal = close;
})(window);
