/**
 * Catalogue du Grenier des Apps
 * ------------------------------------------------------------------
 * Source unique de vérité pour la bibliothèque : chaque contenu du dépôt
 * y est décrit une fois, et toutes les pages (accueil, index de catégorie,
 * atelier) lisent ces données.
 *
 * Champs d'un contenu :
 *   id       identifiant stable (favoris, historique de lecture)
 *   title    titre affiché
 *   emoji    pictogramme de la carte
 *   desc     résumé d'une ou deux phrases
 *   cat      clé de catégorie (voir GRENIER.categories)
 *   kind     'histoire' | 'jeu' | 'outil'
 *   dir      dossier du fichier, relatif à la racine du site
 *   file     nom du fichier HTML
 *   age      âge minimum conseillé (4, 7 ou 10)
 *   access   'public'  → accessible à tous
 *            'membre'  → nécessite un compte
 *   tags     mots-clés utilisés par la recherche
 */
(function (global) {
  'use strict';

  var GRENIER = global.GRENIER || (global.GRENIER = {});

  /* Racine du site déduite de l'URL de ce script : permet aux pages situées
     dans stories/<cat>/ de pointer vers les mêmes ressources que l'accueil. */
  if (!GRENIER.base) {
    var src = (document.currentScript && document.currentScript.src) || '';
    var cut = src.indexOf('assets/js/');
    GRENIER.base = cut >= 0 ? src.slice(0, cut) : '';
  }

  /* Fonctionnalités exposées au public. L'Atelier reste entièrement codé et
     testable (atelier.html?preview=1) mais n'apparaît nulle part dans
     l'interface tant que ce drapeau est à false. */
  GRENIER.features = {
    atelier: false
  };

  /* Contenus mis en avant sur l'accueil : un échantillon volontairement
     court et varié, pas la bibliothèque entière. */
  GRENIER.featuredIds = [
    'moise', 'petit-aigle', 'dinosaures', 'hannibal',
    'blagues1', 'hot-potato-game', 'espace', 'einstein'
  ];

  /* Derniers contenus arrivés, du plus récent au plus ancien. */
  GRENIER.newestIds = [
    'lumiere-hira', 'lumiere', 'phare', 'al-khwarizmi',
    'einstein', 'ibn-battuta', 'colomb'
  ];

  GRENIER.categories = [
    { key: 'propheties', label: 'Prophètes & Sagesse', emoji: '🌙', accent: '#f0c04b',
      blurb: 'Récits des prophètes, califes et grandes figures spirituelles.' },
    { key: 'arabe',      label: 'Histoires en arabe',  emoji: '📜', accent: '#4fd8a6',
      blurb: 'Contes en langue arabe, à lire de droite à gauche.' },
    { key: 'legendes',   label: 'Légendes du monde',   emoji: '🏛️', accent: '#ff8a5b',
      blurb: 'Héros, savants et explorateurs qui ont marqué l\'Histoire.' },
    { key: 'sciences',   label: 'Sciences & Découvertes', emoji: '🔭', accent: '#5bb8ff',
      blurb: 'Du Big Bang aux dinosaures, les grandes épopées du réel.' },
    { key: 'humour',     label: 'Blagues & Humour',    emoji: '😂', accent: '#ff6f9c',
      blurb: 'De quoi faire rire toute la tablée.' },
    { key: 'jeux',       label: 'Mini-jeux',           emoji: '🎮', accent: '#b18cff',
      blurb: 'Réflexes, mémoire, mots : à jouer seul ou à plusieurs.' },
    { key: 'outils',     label: 'Outils',              emoji: '🧮', accent: '#6ee7d7',
      blurb: 'Des calculatrices et utilitaires pour les grands.' }
  ];

  GRENIER.kinds = {
    histoire: { label: 'Histoire', verb: 'Lire' },
    jeu:      { label: 'Jeu',      verb: 'Jouer' },
    outil:    { label: 'Outil',    verb: 'Ouvrir' }
  };

  GRENIER.items = [
    /* ── Prophètes & Sagesse ─────────────────────────────────── */
    { id: 'adam', title: 'Adam', emoji: '🌍', cat: 'propheties', kind: 'histoire',
      dir: 'stories/religion', file: 'adam.html', age: 4, access: 'public',
      desc: 'La création du premier homme, le jardin du paradis et le pardon qui suit le repentir.',
      tags: ['prophète', 'création', 'paradis'] },
    { id: 'moise', title: 'Moïse', emoji: '🌊', cat: 'propheties', kind: 'histoire',
      dir: 'stories/religion', file: 'moise.html', age: 4, access: 'public',
      desc: 'Du bébé dans le panier sur le Nil à la mer Rouge qui s\'ouvre en deux.',
      tags: ['prophète', 'nil', 'mer rouge', 'egypte'] },
    { id: 'mohamed', title: 'Mohamed ﷺ', emoji: '🕌', cat: 'propheties', kind: 'histoire',
      dir: 'stories/religion', file: 'mohamed.html', age: 7, access: 'public',
      desc: 'De La Mecque à Médine : l\'homme le plus généreux, la révélation et la ville de la paix.',
      tags: ['prophète', 'mecque', 'medine', 'islam'] },
    { id: 'younes', title: 'Younes', emoji: '🐋', cat: 'propheties', kind: 'histoire',
      dir: 'stories/religion', file: 'younes.html', age: 4, access: 'public',
      desc: 'La tempête, le ventre de la baleine et la prière qui remonta du fond des mers.',
      tags: ['prophète', 'baleine', 'mer'] },
    { id: 'jesus', title: 'Jésus', emoji: '✦', cat: 'propheties', kind: 'histoire',
      dir: 'stories/religion', file: 'jesus.html', age: 7, access: 'public',
      desc: 'De l\'étoile de Bethléem au Sermon sur la Montagne : douceur, miracles et amour.',
      tags: ['prophète', 'messie', 'bethleem'] },
    { id: 'noe', title: 'Noé', emoji: '🌈', cat: 'propheties', kind: 'histoire',
      dir: 'stories/religion', file: 'noe.html', age: 4, access: 'public',
      desc: 'L\'arche, le déluge, la colombe au rameau d\'olivier et le premier arc-en-ciel.',
      tags: ['prophète', 'arche', 'deluge', 'animaux'] },
    { id: 'youssef', title: 'Youssef', emoji: '✨', cat: 'propheties', kind: 'histoire',
      dir: 'stories/religion', file: 'youssef.html', age: 7, access: 'public',
      desc: 'Du rêve des onze étoiles au trône d\'Égypte : trahison, prison injuste et pardon.',
      tags: ['prophète', 'reve', 'egypte', 'pardon'] },
    { id: 'ibrahim', title: 'Ibrahim', emoji: '🔥', cat: 'propheties', kind: 'histoire',
      dir: 'stories/religion', file: 'ibrahim.html', age: 7, access: 'public',
      desc: 'Le feu qui devient fraîcheur, les étoiles qui révèlent la vérité et la Kaaba sacrée.',
      tags: ['prophète', 'kaaba', 'feu'] },
    { id: 'haroun', title: 'Haroun', emoji: '🗣️', cat: 'propheties', kind: 'histoire',
      dir: 'stories/religion', file: 'haroun.html', age: 7, access: 'membre',
      desc: 'Le frère éloquent de Moïse, gardien du peuple pendant l\'absence au mont Sinaï.',
      tags: ['prophète', 'parole', 'sinai'] },
    { id: 'soulayman', title: 'Soulayman', emoji: '👑', cat: 'propheties', kind: 'histoire',
      dir: 'stories/religion', file: 'soulayman.html', age: 7, access: 'membre',
      desc: 'Le roi qui parlait aux animaux, commandait le vent et jugeait avec sagesse.',
      tags: ['prophète', 'roi', 'animaux', 'djinns'] },
    { id: 'dawud', title: 'Dawud', emoji: '🎵', cat: 'propheties', kind: 'histoire',
      dir: 'stories/religion', file: 'dawud.html', age: 7, access: 'membre',
      desc: 'Le petit berger qui terrassa le géant Jalut et dont la voix faisait chanter les montagnes.',
      tags: ['prophète', 'berger', 'geant', 'musique'] },
    { id: 'ilyes', title: 'Ilyès', emoji: '⚡', cat: 'propheties', kind: 'histoire',
      dir: 'stories/religion', file: 'ilyes.html', age: 10, access: 'membre',
      desc: 'Celui qui fit descendre le feu du ciel et ramena la pluie après des années de sécheresse.',
      tags: ['prophète', 'feu', 'pluie'] },
    { id: 'haroun-rachid', title: 'Haroun al-Rachid', emoji: '🏛️', cat: 'propheties', kind: 'histoire',
      dir: 'stories/religion', file: 'haroun_rachid.html', age: 10, access: 'membre',
      desc: 'Le calife de Bagdad qui parcourait les rues déguisé la nuit pour écouter son peuple.',
      tags: ['calife', 'bagdad', 'justice', 'mille et une nuits'] },
    { id: 'omar', title: 'Omar ibn al-Khattab', emoji: '⚖️', cat: 'propheties', kind: 'histoire',
      dir: 'stories/religion', file: 'omar.html', age: 10, access: 'membre',
      desc: 'De l\'ennemi de l\'Islam au plus juste des califes — et la nuit où il portait la farine aux pauvres.',
      tags: ['calife', 'justice', 'jerusalem'] },
    { id: 'lumiere-hira', title: 'La Lumière de Hira', emoji: '🌙', cat: 'propheties', kind: 'histoire',
      dir: 'stories/religion', file: 'la-lumiere-de-hira.html', age: 10, access: 'membre',
      desc: 'De l\'Arabie des caravanes à un monde de deux milliards de fidèles : la grotte, l\'Hijra, les siècles suivants.',
      tags: ['histoire', 'islam', 'hijra', 'civilisation'] },

    /* ── Histoires en arabe ──────────────────────────────────── */
    { id: 'aventure-nour', title: 'رحلة نور', emoji: '🧭', cat: 'arabe', kind: 'histoire',
      dir: 'stories/arabe', file: 'aventure-nour.html', age: 7, access: 'public',
      desc: 'Une fille courageuse part à la recherche du Cahf al-Hikma légendaire.',
      tags: ['arabe', 'aventure', 'sagesse', 'nour'] },
    { id: 'petit-aigle', title: 'النسر الصغير الشجاع', emoji: '🦅', cat: 'arabe', kind: 'histoire',
      dir: 'stories/arabe', file: 'petit_aigle.html', age: 4, access: 'public',
      desc: 'Un aiglon grandit parmi les poules jusqu\'au jour où il découvre la force de ses ailes.',
      tags: ['arabe', 'courage', 'aigle', 'confiance'] },
    { id: 'poisson-dore', title: 'السمكة الذهبية', emoji: '🐠', cat: 'arabe', kind: 'histoire',
      dir: 'stories/arabe', file: 'poisson_dore.html', age: 4, access: 'public',
      desc: 'Un petit poisson doré découvre la valeur de l\'amitié sincère au fond de l\'océan.',
      tags: ['arabe', 'amitié', 'océan', 'poisson'] },
    { id: 'squirrel', title: 'السنجاب الصغير', emoji: '🐿️', cat: 'arabe', kind: 'histoire',
      dir: 'stories/arabe', file: 'squirrel.html', age: 4, access: 'membre',
      desc: 'Un écureuil courageux part à la recherche de maïs doré dans la forêt d\'automne.',
      tags: ['arabe', 'foret', 'automne', 'écureuil'] },
    { id: 'samsoum', title: 'سمسوم والجسر المكسور', emoji: '🐰', cat: 'arabe', kind: 'histoire',
      dir: 'stories/arabe', file: 'samsoum.html', age: 4, access: 'membre',
      desc: 'Un lapin découvre que la coopération reconstruit bien plus qu\'un pont.',
      tags: ['arabe', 'solidarité', 'lapin', 'pont'] },

    /* ── Légendes du monde ───────────────────────────────────── */
    { id: 'hannibal', title: 'Hannibal', emoji: '🦁', cat: 'legendes', kind: 'histoire',
      dir: 'stories/legend', file: 'hannibal.html', age: 10, access: 'public',
      desc: 'Le serment d\'un enfant, la traversée des Alpes avec ses éléphants, l\'art de la guerre intelligente.',
      tags: ['carthage', 'alpes', 'elephants', 'rome'] },
    { id: 'elissa', title: 'Elissa', emoji: '👑', cat: 'legendes', kind: 'histoire',
      dir: 'stories/legend', file: 'elissa.html', age: 7, access: 'public',
      desc: 'La princesse de Tyr qui fonda Carthage par la ruse de la peau de bœuf.',
      tags: ['carthage', 'reine', 'ruse', 'tyr'] },
    { id: 'napoleon', title: 'Napoléon', emoji: '🦅', cat: 'legendes', kind: 'histoire',
      dir: 'stories/legend', file: 'napoleon.html', age: 10, access: 'public',
      desc: 'De la Corse au trône de France — le génie militaire, le sacre et la chute.',
      tags: ['france', 'empereur', 'corse', 'histoire'] },
    { id: 'robinhood', title: 'Robin des Bois', emoji: '🏹', cat: 'legendes', kind: 'histoire',
      dir: 'stories/legend', file: 'robinhood.html', age: 7, access: 'public',
      desc: 'Le hors-la-loi qui vola aux riches pour rendre aux pauvres, dans la forêt de Sherwood.',
      tags: ['sherwood', 'justice', 'arc', 'angleterre'] },
    { id: 'karoun', title: 'Kâroun', emoji: '💰', cat: 'legendes', kind: 'histoire',
      dir: 'stories/legend', file: 'karoun.html', age: 7, access: 'public',
      desc: 'L\'homme le plus riche du monde qui crut posséder la terre — jusqu\'à ce qu\'elle l\'engloutisse.',
      tags: ['richesse', 'orgueil', 'leçon'] },
    { id: 'colomb', title: 'Christophe Colomb', emoji: '⛵', cat: 'legendes', kind: 'histoire',
      dir: 'stories/legend', file: 'colomb.html', age: 10, access: 'membre',
      desc: 'Le navigateur de Gênes qui prit la mer vers l\'ouest et découvrit un monde insoupçonné.',
      tags: ['navigation', 'amerique', 'exploration'] },
    { id: 'ibn-battuta', title: 'Ibn Battuta', emoji: '🧭', cat: 'legendes', kind: 'histoire',
      dir: 'stories/legend', file: 'ibn-battuta.html', age: 10, access: 'membre',
      desc: '120 000 kilomètres, 29 ans, 44 pays : le plus grand voyageur du Moyen Âge.',
      tags: ['voyage', 'tanger', 'exploration', 'moyen age'] },
    { id: 'einstein', title: 'Albert Einstein', emoji: '🌌', cat: 'legendes', kind: 'histoire',
      dir: 'stories/legend', file: 'einstein.html', age: 10, access: 'membre',
      desc: 'De l\'employé du bureau des brevets au génie qui réécrivit les lois de l\'univers.',
      tags: ['science', 'relativité', 'physique', 'genie'] },
    { id: 'al-khwarizmi', title: 'Al-Khwarizmi', emoji: '📐', cat: 'legendes', kind: 'histoire',
      dir: 'stories/legend', file: 'al-khwarizmi.html', age: 10, access: 'membre',
      desc: 'Le savant de Bagdad qui inventa l\'algèbre et donna son nom à l\'algorithme.',
      tags: ['maths', 'algebre', 'bagdad', 'algorithme'] },

    /* ── Sciences & Découvertes ──────────────────────────────── */
    { id: 'dinosaures', title: 'Les Dinosaures', emoji: '🦕', cat: 'sciences', kind: 'histoire',
      dir: 'stories/science', file: 'dinosaures.html', age: 4, access: 'public',
      desc: 'L\'épopée des géants qui régnèrent sur la Terre, du Trias à leur disparition.',
      tags: ['dinosaures', 'prehistoire', 'fossiles'] },
    { id: 'humanite', title: 'L\'Odyssée Humaine', emoji: '🌍', cat: 'sciences', kind: 'histoire',
      dir: 'stories/science', file: 'humanite.html', age: 10, access: 'public',
      desc: '300 000 ans d\'histoire en dix chapitres, du premier feu au numérique.',
      tags: ['humanité', 'evolution', 'civilisation'] },
    { id: 'espace', title: 'L\'Infini', emoji: '🌌', cat: 'sciences', kind: 'histoire',
      dir: 'stories/science', file: 'espace.html', age: 7, access: 'public',
      desc: 'Du Big Bang aux trous noirs : un voyage vertigineux à travers l\'univers.',
      tags: ['espace', 'univers', 'big bang', 'etoiles'] },
    { id: 'phare', title: 'Le Phare des Marées Perdues', emoji: '🕯️', cat: 'sciences', kind: 'histoire',
      dir: 'stories/science', file: 'phare.html', age: 7, access: 'membre',
      desc: 'Léna, douze ans, suit un sentier qui n\'apparaît qu\'une fois par siècle.',
      tags: ['aventure', 'mer', 'phare', 'brouillard'] },
    { id: 'lumiere', title: 'La Lumière qui Voyageait', emoji: '🔭', cat: 'sciences', kind: 'histoire',
      dir: 'stories/science', file: 'lumiere.html', age: 7, access: 'membre',
      desc: 'Mille ans de voyage pour une seule nuit d\'observation, entre Nour et sa grand-mère.',
      tags: ['lumiere', 'etoiles', 'astronomie', 'temps'] },

    /* ── Blagues & Humour ────────────────────────────────────── */
    { id: 'blagues1', title: 'Les Blagues de Tonton', emoji: '🎭', cat: 'humour', kind: 'histoire',
      dir: 'stories/fun', file: 'blagues1.html', age: 4, access: 'public',
      desc: 'Le recueil ultime des blagues qu\'on raconte trois fois par repas de famille.',
      tags: ['blagues', 'humour', 'jeux de mots', 'famille'] },

    /* ── Mini-jeux ───────────────────────────────────────────── */
    { id: 'timer-game', title: 'Stop at 10', emoji: '⏱️', cat: 'jeux', kind: 'jeu',
      dir: 'games', file: 'timer-game.html', age: 4, access: 'public',
      desc: 'Stoppe le chrono exactement à 10,00 secondes. Pas une de plus !',
      tags: ['reflexe', 'chrono', 'precision'] },
    { id: 'reaction-game', title: 'React !', emoji: '⚡', cat: 'jeux', kind: 'jeu',
      dir: 'games', file: 'reaction-game.html', age: 4, access: 'public',
      desc: 'Appuie le plus vite possible dès que l\'écran passe au vert.',
      tags: ['reflexe', 'vitesse', 'duel'] },
    { id: 'memory-game', title: 'Remember !', emoji: '🔢', cat: 'jeux', kind: 'jeu',
      dir: 'games', file: 'memory-game.html', age: 7, access: 'public',
      desc: 'Mémorise la séquence de chiffres, puis retape-la dans le bon ordre.',
      tags: ['memoire', 'chiffres', 'concentration'] },
    { id: 'color-blind-game', title: 'Color Blind', emoji: '🎨', cat: 'jeux', kind: 'jeu',
      dir: 'games', file: 'color-blind-game.html', age: 7, access: 'public',
      desc: 'Tape la COULEUR du mot, pas ce qu\'il dit ! 30 secondes de confusion.',
      tags: ['couleurs', 'concentration', 'stroop'] },
    { id: 'hot-potato-game', title: 'Hot Potato', emoji: '🥔', cat: 'jeux', kind: 'jeu',
      dir: 'games', file: 'hot-potato-game.html', age: 4, access: 'public',
      desc: 'Passe la patate avant qu\'elle explose ! Jusqu\'à 8 joueurs.',
      tags: ['multijoueur', 'famille', 'suspense'] },
    { id: 'simon-game', title: 'Simon Dit', emoji: '🎵', cat: 'jeux', kind: 'jeu',
      dir: 'games', file: 'simon-game.html', age: 7, access: 'membre',
      desc: 'Répète la séquence de couleurs et de sons, de plus en plus longue.',
      tags: ['memoire', 'sons', 'couleurs'] },
    { id: 'mot-cache-game', title: 'Mot Caché', emoji: '🔤', cat: 'jeux', kind: 'jeu',
      dir: 'games', file: 'mot-cache-game.html', age: 10, access: 'membre',
      desc: 'Trouve le mot de 5 lettres en 6 essais. Vert = bonne place !',
      tags: ['mots', 'vocabulaire', 'lettres'] },
    { id: 'famille-en-or', title: 'Famille en Or', emoji: '🏆', cat: 'jeux', kind: 'jeu',
      dir: 'games', file: 'famille-en-or.html', age: 7, access: 'membre',
      desc: 'Devine les réponses les plus populaires données par 100 personnes.',
      tags: ['quiz', 'famille', 'multijoueur'] },

    /* ── Outils ──────────────────────────────────────────────── */
    { id: 'financial-calculator', title: 'Calculatrice Financière', emoji: '💰', cat: 'outils', kind: 'outil',
      dir: 'tools', file: 'financial_calculator.html', age: 10, access: 'membre',
      desc: 'Simuler un investissement, calculer les intérêts composés, visualiser le pouvoir d\'achat.',
      tags: ['finance', 'interets', 'investissement', 'epargne'] }
  ];

  /* ── Utilitaires ───────────────────────────────────────────── */

  GRENIER.categoryOf = function (key) {
    for (var i = 0; i < GRENIER.categories.length; i++) {
      if (GRENIER.categories[i].key === key) return GRENIER.categories[i];
    }
    return { key: key, label: key, emoji: '✦', accent: '#f0c04b', blurb: '' };
  };

  GRENIER.itemById = function (id) {
    for (var i = 0; i < GRENIER.items.length; i++) {
      if (GRENIER.items[i].id === id) return GRENIER.items[i];
    }
    return null;
  };

  /** Retrouve un contenu depuis un dossier et un nom de fichier. */
  GRENIER.itemByPath = function (dir, file) {
    for (var i = 0; i < GRENIER.items.length; i++) {
      if (GRENIER.items[i].dir === dir && GRENIER.items[i].file === file) return GRENIER.items[i];
    }
    return null;
  };

  /** Chemin du contenu depuis la racine du site. */
  GRENIER.hrefOf = function (item) {
    return item.dir + '/' + item.file;
  };

  /** Vignette 4:3 du contenu, relative à la racine du site. */
  GRENIER.thumbOf = function (item) {
    if (item && item.thumb) return item.thumb;
    return GRENIER.base + 'assets/thumbs/' + (item ? item.id : '') + '.svg';
  };

  GRENIER.featured = function () {
    return GRENIER.featuredIds.map(GRENIER.itemById).filter(Boolean);
  };

  GRENIER.newest = function () {
    return GRENIER.newestIds.map(GRENIER.itemById).filter(Boolean);
  };

  GRENIER.ageLabel = function (age) {
    return 'Dès ' + age + ' ans';
  };

  GRENIER.counts = function () {
    var out = { total: GRENIER.items.length, public: 0, membre: 0, byCat: {} };
    GRENIER.items.forEach(function (it) {
      out[it.access] += 1;
      out.byCat[it.cat] = (out.byCat[it.cat] || 0) + 1;
    });
    return out;
  };
})(window);
