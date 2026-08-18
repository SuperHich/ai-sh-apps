/**
 * L'Explorateur des Planètes — les astres et leurs chiffres
 * ------------------------------------------------------------------
 * Une entrée par corps visitable. Tout ce que la page affiche vient
 * d'ici : rien n'est écrit en dur dans planetes.js.
 *
 * Champs :
 *   id         identifiant stable (mémorisation du dernier astre visité)
 *   name       nom affiché, article compris
 *   kind       la famille de l'astre, en une ligne
 *   tagline    deux phrases pour donner envie
 *   color/hi   teinte dominante et éclat : pastille du quai, boule de comparaison
 *   diamKm     diamètre équatorial en kilomètres (échelle de comparaison)
 *   gravity    accélération de pesanteur en m/s² (poids du visiteur)
 *   yearDays   durée de la révolution en jours terrestres (âge du visiteur)
 *   tripKm     distance à la Terre au plus près, en km (temps de voyage)
 *   lightMin   temps que met la lumière du Soleil pour l'atteindre, en minutes
 *   render     tout ce dont le moteur de rendu a besoin (voir planetes.js)
 *   stats      la carte d'identité, telle qu'elle s'affiche
 *   gases      composition de l'atmosphère, en pourcentages
 *   moons      lunes remarquables ; moonNote donne le compte réel
 *   facts      « Le sais-tu ? » — trois surprises par astre
 *   orbit      demi-grand axe (UA) et période (années) pour le plan du système
 *
 * Les chiffres sont ceux des fiches de la NASA et de l'ESA. Les comptes de
 * lunes bougent d'année en année : ils sont donnés comme « connues à ce jour ».
 */
(function (global) {
  'use strict';

  var PL = global.PLANETES || (global.PLANETES = {});

  /* Vitesses servant aux temps de voyage. */
  PL.speeds = {
    avion:   900,           /* km/h — un long-courrier */
    fusee:   58000,         /* km/h — la sonde New Horizons, l'objet le plus rapide lancé */
    lumiere: 1079252849     /* km/h — 299 792 km par seconde */
  };

  PL.bodies = [

    /* ═══════════════ LE SOLEIL ═══════════════ */
    {
      id: 'soleil', name: 'Le Soleil', kind: 'Étoile naine jaune',
      tagline: 'Une boule de gaz brûlant si large qu\'on y rangerait un million trois cent mille Terres. ' +
               'Tout ce qui vit ici vit de sa lumière, partie de son cœur il y a des dizaines de milliers d\'années.',
      color: '#ff9d3c', hi: '#fff3c4',
      diamKm: 1392700, gravity: 274, yearDays: null, tripKm: 149600000, lightMin: 8.3,
      render: { paint: 'sun', spin: 0.55, axial: 7, atmo: 1.15, glow: '#ff8a2b', emissive: true, rings: null, moons: [] },
      stats: {
        'Diamètre': ['1 392 700 km', '109 fois la Terre'],
        'Masse': ['333 000 Terres', '99,86 % du système solaire'],
        'Gravité': ['274 m/s²', '28 fois la nôtre'],
        'Rotation': ['25 jours', 'à l\'équateur ; 35 aux pôles'],
        'Surface': ['5 500 °C', 'le cœur : 15 millions'],
        'Âge': ['4,6 milliards d\'années', 'encore la moitié à vivre'],
        'Distance': ['149,6 millions de km', 'de la Terre'],
        'Lumière': ['8 min 20 s', 'pour nous parvenir']
      },
      gases: [
        { n: 'Hydrogène', p: 73, c: '#ffd166' },
        { n: 'Hélium', p: 25, c: '#ff8a5b' },
        { n: 'Oxygène, carbone, fer…', p: 2, c: '#b18cff' }
      ],
      gasNote: 'Le Soleil n\'a pas d\'atmosphère au sens où nous l\'entendons : il est gazeux de part en part. ' +
               'Chaque seconde, il transforme 600 millions de tonnes d\'hydrogène en hélium — c\'est cette fusion qui l\'allume.',
      moons: [], moonNote: 'Une étoile n\'a pas de lunes : ce sont les huit planètes, les astéroïdes et les comètes qui tournent autour d\'elle.',
      facts: [
        { e: '🌞', t: 'Sa lumière met 8 minutes et 20 secondes à nous atteindre. Quand tu regardes le Soleil, tu le vois tel qu\'il était avant que tu n\'aies fini de lire cette phrase — huit minutes plus tôt.' },
        { e: '🔥', t: 'Sa surface est à 5 500 °C, mais sa couronne, tout autour, monte à un million de degrés. Personne n\'explique encore complètement pourquoi le dehors est plus chaud que le dedans.' },
        { e: '⚖️', t: 'À lui seul, il pèse 99,86 % de tout le système solaire. Les huit planètes réunies ne sont qu\'un reste de poussière.' }
      ],
      orbit: null
    },

    /* ═══════════════ MERCURE ═══════════════ */
    {
      id: 'mercure', name: 'Mercure', kind: 'Planète tellurique',
      tagline: 'La plus petite, la plus rapide, la plus proche du Soleil. Un monde de roche criblé de cratères ' +
               'où le sol passe de 430 °C le jour à −180 °C la nuit.',
      color: '#a8a29a', hi: '#e8e2d6',
      diamKm: 4879, gravity: 3.7, yearDays: 88, tripKm: 77000000, lightMin: 3.2,
      render: { paint: 'mercure', spin: 0.9, axial: 2, atmo: 0, glow: null, rings: null, moons: [] },
      stats: {
        'Diamètre': ['4 879 km', '0,38 fois la Terre'],
        'Masse': ['0,055 Terre', 'la plus légère des huit'],
        'Gravité': ['3,7 m/s²', '38 % de la nôtre'],
        'Un jour': ['176 jours', 'du lever au lever du Soleil'],
        'Une année': ['88 jours', 'la plus courte'],
        'Température': ['−180 à 430 °C', 'le plus grand écart'],
        'Distance': ['57,9 millions de km', 'du Soleil'],
        'Lunes': ['aucune', '']
      },
      gases: [
        { n: 'Oxygène', p: 42, c: '#5bb8ff' },
        { n: 'Sodium', p: 29, c: '#ffd166' },
        { n: 'Hydrogène', p: 22, c: '#4fd8a6' },
        { n: 'Hélium et autres', p: 7, c: '#b18cff' }
      ],
      gasNote: 'Ce n\'est pas vraiment une atmosphère mais une exosphère : quelques atomes arrachés au sol ' +
               'par le vent solaire, si rares qu\'ils ne se rencontrent presque jamais. Le ciel y est noir en plein jour.',
      moons: [], moonNote: 'Aucune lune : si proche du Soleil, sa gravité ne parviendrait pas à en retenir une.',
      facts: [
        { e: '🌡️', t: 'Malgré sa proximité avec le Soleil, ce n\'est pas la planète la plus chaude : sans atmosphère pour garder la chaleur, ses nuits tombent à −180 °C. C\'est Vénus qui détient le record.' },
        { e: '🧊', t: 'Au fond de cratères polaires où le Soleil n\'est jamais entré, les sondes ont trouvé de la glace d\'eau. Sur la planète la plus proche du Soleil.' },
        { e: '🏃', t: 'Elle file à 47 km par seconde autour du Soleil — la plus rapide des huit. Les Romains lui ont donné le nom du messager des dieux.' }
      ],
      orbit: { au: 0.39, periodY: 0.24 }
    },

    /* ═══════════════ VÉNUS ═══════════════ */
    {
      id: 'venus', name: 'Vénus', kind: 'Planète tellurique',
      tagline: 'La jumelle de la Terre par la taille, son contraire pour tout le reste : 464 °C au sol, ' +
               'une pression de sous-marin et des pluies d\'acide sulfurique qui s\'évaporent avant de toucher terre.',
      color: '#e6c37a', hi: '#fff0c8',
      diamKm: 12104, gravity: 8.87, yearDays: 225, tripKm: 41000000, lightMin: 6.0,
      render: { paint: 'venus', spin: -0.35, axial: 3, atmo: 0.85, glow: '#ffd79a', rings: null, moons: [] },
      stats: {
        'Diamètre': ['12 104 km', '0,95 fois la Terre'],
        'Masse': ['0,82 Terre', 'presque la nôtre'],
        'Gravité': ['8,87 m/s²', '90 % de la nôtre'],
        'Un jour': ['243 jours', 'et à l\'envers'],
        'Une année': ['225 jours', 'plus courte que son jour'],
        'Température': ['464 °C', 'la plus chaude'],
        'Pression': ['92 bars', 'comme 900 m sous la mer'],
        'Lunes': ['aucune', '']
      },
      gases: [
        { n: 'Dioxyde de carbone', p: 96.5, c: '#ff8a5b' },
        { n: 'Diazote', p: 3.5, c: '#5bb8ff' }
      ],
      gasNote: 'Cet épais manteau de gaz carbonique retient la chaleur du Soleil : c\'est l\'effet de serre, ' +
               'poussé à l\'extrême. Vénus est l\'avertissement grandeur nature que la Terre garde en vue.',
      moons: [], moonNote: 'Aucune lune, comme Mercure.',
      facts: [
        { e: '🔄', t: 'Elle tourne à l\'envers : sur Vénus, le Soleil se lève à l\'ouest. Et son jour dure plus longtemps que son année.' },
        { e: '🌟', t: 'C\'est l\'objet le plus brillant du ciel après le Soleil et la Lune. On l\'appelle l\'étoile du berger — alors que ce n\'est pas une étoile.' },
        { e: '🛰️', t: 'Les sondes soviétiques Venera se sont posées sur elle dans les années 1970. La plus résistante a tenu 127 minutes avant d\'être écrasée et cuite.' }
      ],
      orbit: { au: 0.72, periodY: 0.62 }
    },

    /* ═══════════════ LA TERRE ═══════════════ */
    {
      id: 'terre', name: 'La Terre', kind: 'Planète tellurique',
      tagline: 'Le seul monde connu où l\'eau coule, où l\'air se respire et où quelqu\'un lit cette phrase. ' +
               'Vue de l\'espace, une bille bleue enveloppée d\'une pellicule d\'atmosphère fine comme un vernis.',
      color: '#3d7ad6', hi: '#a8e0ff',
      diamKm: 12742, gravity: 9.81, yearDays: 365.25, tripKm: 0, lightMin: 8.3,
      render: { paint: 'terre', spin: 1, axial: 23.4, atmo: 0.9, glow: '#7ab8ff', rings: null,
                moons: [{ n: 'Lune', r: 2.1, s: 0.09, c: '#c9c4b8' }] },
      stats: {
        'Diamètre': ['12 742 km', 'notre étalon'],
        'Masse': ['5 970 milliards de milliards de tonnes', ''],
        'Gravité': ['9,81 m/s²', 'ce que tu ressens'],
        'Un jour': ['23 h 56 min 4 s', 'une rotation complète'],
        'Une année': ['365,25 jours', 'd\'où les années bissextiles'],
        'Température': ['−89 à 58 °C', '15 °C en moyenne'],
        'Distance': ['149,6 millions de km', 'du Soleil'],
        'Lunes': ['1', 'la Lune']
      },
      gases: [
        { n: 'Diazote', p: 78, c: '#5bb8ff' },
        { n: 'Dioxygène', p: 21, c: '#4fd8a6' },
        { n: 'Argon', p: 0.9, c: '#b18cff' },
        { n: 'Dioxyde de carbone et autres', p: 0.1, c: '#ff8a5b' }
      ],
      gasNote: 'Toute la vie tient dans les onze premiers kilomètres. Si la Terre était une pomme, ' +
               'l\'atmosphère respirable serait plus fine que sa peau.',
      moons: [{ n: 'La Lune', d: '3 474 km — le cinquième plus gros satellite du système solaire' }],
      moonNote: 'Une seule, mais exceptionnellement grosse pour la taille de sa planète. C\'est elle qui stabilise ' +
                'l\'axe de la Terre et donne des saisons régulières.',
      facts: [
        { e: '🌊', t: '71 % de sa surface est couverte d\'eau, et on a mieux cartographié la surface de Mars que le fond de nos océans.' },
        { e: '🧲', t: 'Son noyau de fer liquide en mouvement fabrique un champ magnétique qui dévie le vent solaire. Sans lui, l\'air aurait été soufflé dans l\'espace, comme sur Mars.' },
        { e: '🚀', t: 'Elle file à 107 000 km/h autour du Soleil, et personne ne sent rien. Tu viens de parcourir 30 kilomètres en lisant cette phrase.' }
      ],
      orbit: { au: 1, periodY: 1 }
    },

    /* ═══════════════ LA LUNE ═══════════════ */
    {
      id: 'lune', name: 'La Lune', kind: 'Satellite naturel de la Terre',
      tagline: 'Le seul autre monde où des humains ont posé le pied. Sans air ni vent, les empreintes ' +
               'd\'Apollo 11 y sont encore intactes, cinquante ans plus tard.',
      color: '#b9b3a6', hi: '#f2eee2',
      diamKm: 3474, gravity: 1.62, yearDays: 27.3, tripKm: 384400, lightMin: 8.3,
      render: { paint: 'lune', spin: 0.7, axial: 6.7, atmo: 0, glow: null, rings: null, moons: [] },
      stats: {
        'Diamètre': ['3 474 km', '0,27 fois la Terre'],
        'Masse': ['0,012 Terre', ''],
        'Gravité': ['1,62 m/s²', 'six fois moins qu\'ici'],
        'Un jour': ['29,5 jours', 'du lever au lever du Soleil'],
        'Un tour': ['27,3 jours', 'autour de la Terre'],
        'Température': ['−173 à 127 °C', 'sans air pour tempérer'],
        'Distance': ['384 400 km', 'de la Terre'],
        'Visiteurs': ['12 humains', 'entre 1969 et 1972']
      },
      gases: [],
      gasNote: 'Pratiquement aucune atmosphère : quelques atomes d\'hélium et d\'argon. Le ciel y est noir même ' +
               'en plein jour, aucun son ne s\'y propage, et l\'on y voit les étoiles à midi.',
      moons: [], moonNote: 'La Lune est elle-même une lune : c\'est la nôtre.',
      facts: [
        { e: '👣', t: 'Sans vent ni pluie, les traces de pas des astronautes d\'Apollo resteront visibles pendant des millions d\'années.' },
        { e: '🔒', t: 'Elle tourne sur elle-même exactement à la vitesse où elle tourne autour de nous : elle nous montre toujours la même face. L\'autre côté est resté un mystère jusqu\'en 1959.' },
        { e: '📏', t: 'Elle s\'éloigne de nous de 3,8 cm par an — l\'épaisseur d\'un doigt tous les dix ans. Dans un milliard d\'années, il n\'y aura plus d\'éclipses totales de Soleil.' }
      ],
      orbit: null
    },

    /* ═══════════════ MARS ═══════════════ */
    {
      id: 'mars', name: 'Mars', kind: 'Planète tellurique',
      tagline: 'La planète rouge — rouillée, littéralement, par le fer de son sable. Elle porte le plus haut ' +
               'volcan et le plus long canyon du système solaire, et des robots y roulent en ce moment même.',
      color: '#c1502e', hi: '#ffb896',
      diamKm: 6779, gravity: 3.72, yearDays: 687, tripKm: 78000000, lightMin: 12.7,
      render: { paint: 'mars', spin: 0.97, axial: 25.2, atmo: 0.25, glow: '#ff9d6b', rings: null,
                moons: [{ n: 'Phobos', r: 1.75, s: 0.035, c: '#8f8378' }, { n: 'Deimos', r: 2.35, s: 0.025, c: '#9a8d80' }] },
      stats: {
        'Diamètre': ['6 779 km', '0,53 fois la Terre'],
        'Masse': ['0,107 Terre', ''],
        'Gravité': ['3,72 m/s²', '38 % de la nôtre'],
        'Un jour': ['24 h 37 min', 'presque le nôtre'],
        'Une année': ['687 jours', 'deux fois la nôtre'],
        'Température': ['−140 à 20 °C', '−63 °C en moyenne'],
        'Distance': ['227,9 millions de km', 'du Soleil'],
        'Lunes': ['2', 'Phobos et Deimos']
      },
      gases: [
        { n: 'Dioxyde de carbone', p: 95, c: '#ff8a5b' },
        { n: 'Diazote', p: 2.8, c: '#5bb8ff' },
        { n: 'Argon', p: 2, c: '#b18cff' },
        { n: 'Dioxygène et autres', p: 0.2, c: '#4fd8a6' }
      ],
      gasNote: 'Cent fois plus fine que la nôtre : elle suffit à soulever des tempêtes de poussière qui couvrent ' +
               'la planète entière, mais pas à retenir la chaleur ni à permettre à l\'eau liquide de tenir en surface.',
      moons: [
        { n: 'Phobos', d: '22 km — il fait le tour de Mars en 7 h et se rapproche : il finira écrasé ou en anneau' },
        { n: 'Deimos', d: '12 km — vu du sol martien, il ressemble à une étoile un peu grosse' }
      ],
      moonNote: 'Deux cailloux minuscules, sans doute des astéroïdes capturés. Ils portent les noms grecs de la Peur et de la Terreur.',
      facts: [
        { e: '🌋', t: 'Olympus Mons est un volcan de 22 km de haut et 600 km de large : trois fois l\'Everest, large comme la France.' },
        { e: '🏜️', t: 'Valles Marineris entaille sa surface sur 4 000 km — la longueur des États-Unis — et 7 km de profondeur. Le Grand Canyon tiendrait dans un de ses recoins.' },
        { e: '💧', t: 'Des lits de rivières asséchés, des deltas, des galets roulés : il y a 3,5 milliards d\'années, de l\'eau coulait là. Où elle est passée reste la grande question.' }
      ],
      orbit: { au: 1.52, periodY: 1.88 }
    },

    /* ═══════════════ JUPITER ═══════════════ */
    {
      id: 'jupiter', name: 'Jupiter', kind: 'Géante gazeuse',
      tagline: 'Le géant : deux fois et demie toutes les autres planètes réunies. Pas de sol, seulement des ' +
               'bandes de nuages qui filent en sens contraires et une tempête plus large que la Terre.',
      color: '#d8a678', hi: '#ffe3c0',
      diamKm: 139820, gravity: 24.79, yearDays: 4333, tripKm: 588000000, lightMin: 43.3,
      render: { paint: 'jupiter', spin: 2.4, axial: 3.1, atmo: 0.5, glow: '#ffd0a0',
                rings: { inner: 1.35, outer: 1.55, opacity: 0.1, bands: [[1.35, 1.55, 0.1]] },
                moons: [{ n: 'Io', r: 1.55, s: 0.05, c: '#e8d878' }, { n: 'Europe', r: 1.85, s: 0.045, c: '#e0d8c8' },
                        { n: 'Ganymède', r: 2.25, s: 0.06, c: '#b8a894' }, { n: 'Callisto', r: 2.7, s: 0.055, c: '#8a7f74' }] },
      stats: {
        'Diamètre': ['139 820 km', '11 fois la Terre'],
        'Masse': ['318 Terres', 'la plus lourde'],
        'Gravité': ['24,8 m/s²', '2,5 fois la nôtre'],
        'Un jour': ['9 h 56 min', 'la rotation la plus rapide'],
        'Une année': ['11,9 ans', ''],
        'Température': ['−145 °C', 'au sommet des nuages'],
        'Distance': ['778,5 millions de km', 'du Soleil'],
        'Lunes': ['95 connues', 'et le compte monte']
      },
      gases: [
        { n: 'Hydrogène', p: 90, c: '#ffd166' },
        { n: 'Hélium', p: 10, c: '#ff8a5b' }
      ],
      gasNote: 'Jupiter n\'a pas de surface : en descendant, le gaz s\'épaissit jusqu\'à devenir un océan ' +
               'd\'hydrogène métallique liquide. Une sonde qui y plongerait serait broyée bien avant d\'atteindre le centre.',
      moons: [
        { n: 'Ganymède', d: '5 268 km — la plus grosse lune du système solaire, plus grande que Mercure' },
        { n: 'Europe', d: 'un océan d\'eau salée sous 15 km de glace : le meilleur espoir de vie ailleurs' },
        { n: 'Io', d: 'le monde le plus volcanique connu : 400 volcans en éruption permanente' },
        { n: 'Callisto', d: 'la surface la plus criblée de cratères du système solaire' }
      ],
      moonNote: '95 lunes connues à ce jour. Les quatre grosses ont été vues par Galilée en 1610 avec une lunette ' +
                'moins puissante que des jumelles d\'aujourd\'hui — la preuve que tout ne tournait pas autour de la Terre.',
      facts: [
        { e: '🔴', t: 'La Grande Tache Rouge est un anticyclone qui souffle depuis au moins 350 ans. La Terre entière y tiendrait.' },
        { e: '🛡️', t: 'Sa gravité énorme dévie ou avale les comètes qui traverseraient le système : elle joue les gardes du corps des planètes intérieures.' },
        { e: '⭐', t: 'S\'il avait été 80 fois plus massif, il se serait allumé : le système solaire aurait eu deux soleils. Il lui a manqué de la matière.' }
      ],
      orbit: { au: 5.2, periodY: 11.86 }
    },

    /* ═══════════════ SATURNE ═══════════════ */
    {
      id: 'saturne', name: 'Saturne', kind: 'Géante gazeuse',
      tagline: 'La plus belle au télescope. Ses anneaux, larges de 280 000 km et épais de quelques dizaines ' +
               'de mètres, ne sont pas solides : ce sont des milliards de blocs de glace en orbite.',
      color: '#e3c893', hi: '#fff3d4',
      diamKm: 116460, gravity: 10.44, yearDays: 10759, tripKm: 1200000000, lightMin: 79,
      render: { paint: 'saturne', spin: 2.2, axial: 26.7, atmo: 0.4, glow: '#ffe6b8',
                rings: { inner: 1.24, outer: 2.28, opacity: 0.92,
                         bands: [[1.24, 1.52, 0.35], [1.53, 1.94, 0.95], [1.95, 2.02, 0.12], [2.03, 2.28, 0.55]] },
                moons: [{ n: 'Titan', r: 2.85, s: 0.06, c: '#e0a860' }, { n: 'Encelade', r: 2.5, s: 0.03, c: '#f0f4f8' }] },
      stats: {
        'Diamètre': ['116 460 km', '9 fois la Terre'],
        'Masse': ['95 Terres', ''],
        'Gravité': ['10,4 m/s²', 'presque la nôtre'],
        'Un jour': ['10 h 42 min', ''],
        'Une année': ['29,4 ans', ''],
        'Température': ['−178 °C', 'au sommet des nuages'],
        'Distance': ['1,43 milliard de km', 'du Soleil'],
        'Lunes': ['146 connues', 'le record']
      },
      gases: [
        { n: 'Hydrogène', p: 96, c: '#ffd166' },
        { n: 'Hélium', p: 3, c: '#ff8a5b' },
        { n: 'Méthane et autres', p: 1, c: '#4fd8a6' }
      ],
      gasNote: 'Sa densité est si faible — 0,69 fois celle de l\'eau — que si l\'on trouvait une baignoire ' +
               'assez grande, Saturne y flotterait.',
      moons: [
        { n: 'Titan', d: '5 150 km — la seule lune à atmosphère épaisse, avec des lacs de méthane liquide' },
        { n: 'Encelade', d: 'des geysers d\'eau salée jaillissent de son pôle sud, nourris par un océan souterrain' },
        { n: 'Japet', d: 'une face noire comme le charbon, l\'autre blanche comme la neige' },
        { n: 'Mimas', d: 'un cratère géant lui donne un air de Étoile Noire' }
      ],
      moonNote: '146 lunes connues à ce jour — plus que tout le reste du système solaire réuni.',
      facts: [
        { e: '💍', t: 'Ses anneaux sont larges comme deux tiers de la distance Terre-Lune, mais souvent épais de moins de dix mètres. Vus par la tranche, ils disparaissent.' },
        { e: '⬡', t: 'Un hexagone parfait de 30 000 km de côté tourne au-dessus de son pôle nord. C\'est un courant-jet, et on ne sait pas bien pourquoi il a six côtés.' },
        { e: '⏳', t: 'Ses anneaux ne sont peut-être vieux que de 100 millions d\'années — les dinosaures ont vécu sur une Terre qui voyait peut-être une Saturne toute nue.' }
      ],
      orbit: { au: 9.54, periodY: 29.46 }
    },

    /* ═══════════════ URANUS ═══════════════ */
    {
      id: 'uranus', name: 'Uranus', kind: 'Géante de glaces',
      tagline: 'La planète couchée : elle roule sur son orbite comme un tonneau, l\'axe basculé à 98°. ' +
               'Chez elle, un pôle reste 42 ans en plein jour, puis 42 ans dans la nuit.',
      color: '#8fd8dd', hi: '#daf8fa',
      diamKm: 50724, gravity: 8.87, yearDays: 30687, tripKm: 2600000000, lightMin: 160,
      render: { paint: 'uranus', spin: -1.4, axial: 82, atmo: 0.6, glow: '#a8ecef',
                rings: { inner: 1.6, outer: 2.02, opacity: 0.55,
                         bands: [[1.6, 1.64, 0.4], [1.72, 1.76, 0.5], [1.86, 1.9, 0.6], [1.97, 2.02, 0.75]] },
                moons: [{ n: 'Titania', r: 2.6, s: 0.04, c: '#b4a89c' }, { n: 'Obéron', r: 3.0, s: 0.038, c: '#a89c92' }] },
      stats: {
        'Diamètre': ['50 724 km', '4 fois la Terre'],
        'Masse': ['14,5 Terres', ''],
        'Gravité': ['8,87 m/s²', '90 % de la nôtre'],
        'Un jour': ['17 h 14 min', 'et à l\'envers'],
        'Une année': ['84 ans', 'une vie humaine'],
        'Température': ['−224 °C', 'la plus froide'],
        'Inclinaison': ['98°', 'elle roule sur le côté'],
        'Lunes': ['28 connues', 'nommées d\'après Shakespeare']
      },
      gases: [
        { n: 'Hydrogène', p: 83, c: '#ffd166' },
        { n: 'Hélium', p: 15, c: '#ff8a5b' },
        { n: 'Méthane', p: 2, c: '#4fd8a6' }
      ],
      gasNote: 'C\'est le méthane qui la peint en bleu-vert : il avale la lumière rouge et renvoie le reste. ' +
               'Sous les nuages, un manteau d\'eau, d\'ammoniac et de méthane glacés — d\'où le nom de géante de glaces.',
      moons: [
        { n: 'Titania', d: '1 578 km — la plus grande, avec des canyons de 1 600 km' },
        { n: 'Miranda', d: 'un patchwork de falaises de 20 km de haut, comme recollée après explosion' },
        { n: 'Obéron', d: 'criblée de cratères, avec une montagne de 11 km' }
      ],
      moonNote: '28 lunes connues, toutes nommées d\'après des personnages de Shakespeare et de Pope — la seule ' +
                'famille du système solaire à ne pas porter de noms mythologiques.',
      facts: [
        { e: '🎳', t: 'Un choc titanesque, aux premiers temps du système solaire, l\'a probablement renversée. Elle ne s\'en est jamais relevée.' },
        { e: '🥶', t: 'Elle détient le record de froid : −224 °C, plus froid que Neptune pourtant bien plus loin du Soleil.' },
        { e: '👁️', t: 'Une seule sonde l\'a visitée : Voyager 2, en janvier 1986, pendant quelques heures. Tout ce qu\'on en sait de près vient de ce passage.' }
      ],
      orbit: { au: 19.2, periodY: 84.01 }
    },

    /* ═══════════════ NEPTUNE ═══════════════ */
    {
      id: 'neptune', name: 'Neptune', kind: 'Géante de glaces',
      tagline: 'La dernière, la plus venteuse : ses rafales atteignent 2 100 km/h, cinq fois les pires ouragans ' +
               'terrestres. Elle a été trouvée avec un crayon avant d\'être vue avec un télescope.',
      color: '#3f6fd8', hi: '#a8c4ff',
      diamKm: 49244, gravity: 11.15, yearDays: 60190, tripKm: 4300000000, lightMin: 250,
      render: { paint: 'neptune', spin: 1.5, axial: 28.3, atmo: 0.7, glow: '#7fa8ff',
                rings: { inner: 1.7, outer: 2.05, opacity: 0.2, bands: [[1.7, 1.73, 0.2], [1.9, 1.95, 0.3], [2.0, 2.05, 0.25]] },
                moons: [{ n: 'Triton', r: 2.6, s: 0.05, c: '#d8dce8' }] },
      stats: {
        'Diamètre': ['49 244 km', '3,9 fois la Terre'],
        'Masse': ['17 Terres', ''],
        'Gravité': ['11,2 m/s²', '14 % de plus qu\'ici'],
        'Un jour': ['16 h 6 min', ''],
        'Une année': ['165 ans', 'un seul tour depuis 1846'],
        'Température': ['−214 °C', ''],
        'Vents': ['2 100 km/h', 'les plus violents connus'],
        'Lunes': ['16 connues', '']
      },
      gases: [
        { n: 'Hydrogène', p: 80, c: '#ffd166' },
        { n: 'Hélium', p: 19, c: '#ff8a5b' },
        { n: 'Méthane', p: 1, c: '#4fd8a6' }
      ],
      gasNote: 'Son bleu profond vient du méthane, mais plus intense que celui d\'Uranus sans qu\'on sache ' +
               'exactement pourquoi. Il pleuvrait des diamants dans ses profondeurs, le carbone y étant écrasé sous la pression.',
      moons: [
        { n: 'Triton', d: '2 707 km — il tourne à l\'envers, signe qu\'il a été capturé, et crache des geysers d\'azote' },
        { n: 'Néréide', d: 'l\'orbite la plus allongée de toutes les lunes connues' }
      ],
      moonNote: '16 lunes connues. Triton, la plus grosse, sera un jour déchiquetée par Neptune et pourrait lui offrir des anneaux.',
      facts: [
        { e: '✏️', t: 'Elle a été découverte par le calcul : les mathématiciens Le Verrier et Adams ont deviné sa position d\'après les écarts d\'Uranus. Les astronomes l\'ont trouvée le soir même, à un degré près.' },
        { e: '💎', t: 'À 7 000 km sous les nuages, la pression est telle que le carbone du méthane se comprimerait en diamants qui pleuvraient vers le centre.' },
        { e: '🕰️', t: 'Elle n\'a bouclé qu\'un seul tour du Soleil depuis sa découverte en 1846 — son anniversaire est tombé en 2011.' }
      ],
      orbit: { au: 30.06, periodY: 164.8 }
    },

    /* ═══════════════ PLUTON ═══════════════ */
    {
      id: 'pluton', name: 'Pluton', kind: 'Planète naine',
      tagline: 'Neuvième planète pendant 76 ans, reclassée en 2006. On la croyait morte et grise : ' +
               'New Horizons y a trouvé des montagnes de glace d\'eau et un immense cœur de gel d\'azote.',
      color: '#c4a68a', hi: '#f2e2d0',
      diamKm: 2377, gravity: 0.62, yearDays: 90560, tripKm: 5000000000, lightMin: 328,
      render: { paint: 'pluton', spin: 0.6, axial: 57, atmo: 0.15, glow: '#e8c8a8', rings: null,
                moons: [{ n: 'Charon', r: 2.3, s: 0.07, c: '#a89c92' }] },
      stats: {
        'Diamètre': ['2 377 km', 'plus petit que la Lune'],
        'Masse': ['0,002 Terre', ''],
        'Gravité': ['0,62 m/s²', '16 fois moins qu\'ici'],
        'Un jour': ['6,4 jours', ''],
        'Une année': ['248 ans', ''],
        'Température': ['−229 °C', ''],
        'Distance': ['5,9 milliards de km', 'du Soleil'],
        'Lunes': ['5', 'dont Charon, la moitié de sa taille']
      },
      gases: [
        { n: 'Azote', p: 90, c: '#5bb8ff' },
        { n: 'Méthane', p: 9, c: '#4fd8a6' },
        { n: 'Monoxyde de carbone', p: 1, c: '#ff8a5b' }
      ],
      gasNote: 'Une atmosphère qui apparaît et disparaît : quand Pluton s\'approche du Soleil, ses glaces ' +
               's\'évaporent et forment un voile ; quand elle s\'éloigne, tout retombe en neige sur le sol.',
      moons: [
        { n: 'Charon', d: '1 212 km — si grosse qu\'ils tournent tous deux autour d\'un point situé dans le vide' },
        { n: 'Nix, Hydre, Kerbéros, Styx', d: 'quatre petits blocs qui culbutent de façon chaotique' }
      ],
      moonNote: 'Cinq lunes. Pluton et Charon forment presque une planète double : aucune des deux ne tourne vraiment autour de l\'autre.',
      facts: [
        { e: '💛', t: 'Tombaugh Regio, sa grande plaine en forme de cœur, est un glacier d\'azote gelé, large de 1 000 km, qui se renouvelle et n\'a aucun cratère : il est jeune.' },
        { e: '📉', t: 'Elle a perdu son titre de planète en 2006, quand on a compris qu\'elle n\'était que la première d\'une foule de mondes glacés au-delà de Neptune.' },
        { e: '🛸', t: 'New Horizons a mis 9 ans et 5 milliards de kilomètres pour l\'atteindre, et n\'est passée que 22 minutes près d\'elle, le 14 juillet 2015. Elle emporte les cendres de son découvreur.' }
      ],
      orbit: { au: 39.5, periodY: 248 }
    }
  ];

  PL.byId = function (id) {
    for (var i = 0; i < PL.bodies.length; i++) {
      if (PL.bodies[i].id === id) return PL.bodies[i];
    }
    return null;
  };
})(window);
