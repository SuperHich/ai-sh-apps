/**
 * Données de la carte du monde
 * ------------------------------------------------------------------
 * Deux jeux de données, tous les deux en coordonnées géographiques réelles
 * (longitude, latitude) : les contours des continents et les lieux des
 * histoires. carte.js les projette avec la même formule, donc une épingle
 * tombe toujours au bon endroit sur le dessin.
 *
 * Les contours sont volontairement **simplifiés** : une trentaine de points
 * par continent, de quoi reconnaître les formes, pas de quoi mesurer une
 * côte. C'est une carte de conteur, pas un atlas.
 */
(function (global) {
  'use strict';

  var GRENIER = global.GRENIER || (global.GRENIER = {});

  /* Contours en [longitude, latitude]. L'Eurasie est tracée d'un seul tenant :
     découpée en deux, la couture Europe/Asie se voyait. Les petites terres
     (Îles Britanniques, Corse, Sicile) sont là parce que des histoires s'y
     passent — sans elles, Robin des Bois et Napoléon flottaient en mer. */
  GRENIER.continents = {
    afrique: [
      [-17, 14], [-16, 21], [-13, 26], [-9, 30], [-6, 35.9], [0, 36], [8, 37], [10, 37.3],
      [11, 33], [15, 32], [20, 31], [25, 31.5], [30, 31.4], [32, 31.2], [34, 28], [36, 22],
      [38, 18], [40, 15], [43, 12], [45, 10.5], [43, 5], [41, -1], [40, -8], [39, -13],
      [35, -17], [33, -22], [31, -26], [28, -31], [25, -34], [19, -35], [16, -29],
      [13, -23], [12, -17], [13, -11], [9, -1], [9, 4], [5, 6], [-2, 5], [-8, 4], [-13, 8]
    ],
    eurasie: [
      [-9, 37], [-9, 43], [-1.5, 43.5], [-1.5, 46], [-4.5, 48.5], [0, 49.5], [3, 51.5],
      [4.5, 53], [8, 54], [8.5, 57], [10, 58], [5, 59], [6, 62], [12, 65], [15, 68],
      [20, 70], [26, 71], [30, 70], [33, 68], [40, 66], [44, 68], [55, 69], [60, 71],
      [70, 73], [78, 73], [90, 75], [100, 77], [110, 74], [120, 73], [130, 72], [140, 71],
      [150, 70], [160, 69], [170, 68], [178, 65], [172, 62], [165, 60], [160, 55],
      [155, 52], [145, 48], [140, 45], [135, 44], [130, 40], [126, 37], [122, 39],
      [121, 32], [117, 24], [110, 20], [106, 10], [103, 1], [100, 7], [97, 16], [92, 22],
      [87, 21], [80, 15], [77, 8], [73, 17], [70, 22], [66, 25], [60, 25], [57, 23],
      [52, 25], [48, 29], [44, 29], [40, 25], [35, 28], [33, 31], [36, 36], [32, 36],
      [29, 41], [26, 40], [23, 40], [19, 40], [16, 41], [13, 38], [15, 37], [12, 44],
      [9, 44], [5, 43], [3, 42], [0, 39], [-2, 37], [-6, 36]
    ],
    'iles-britanniques': [
      [-5, 50], [-3, 50.5], [0.5, 51], [1.5, 52.5], [-0.5, 53.5], [0, 54.5], [-1.5, 55.5],
      [-2, 57], [-3, 58.5], [-5, 58.5], [-5.5, 57], [-4.5, 55], [-3, 54.5], [-5, 54],
      [-4, 53], [-3, 51.5]
    ],
    irlande: [
      [-10, 51.5], [-6, 52], [-6, 54.5], [-8, 55.3], [-10, 54]
    ],
    corse: [
      [8.55, 41.4], [9.55, 41.4], [9.4, 43], [8.6, 42.9]
    ],
    sicile: [
      [12.4, 37.8], [15.3, 38.2], [15.1, 36.7], [12.6, 37.1]
    ],
    'amerique-nord': [
      [-125, 49], [-130, 55], [-136, 58], [-142, 60], [-150, 60], [-158, 58], [-165, 60],
      [-168, 66], [-160, 71], [-150, 70], [-140, 70], [-130, 70], [-120, 71], [-110, 69],
      [-100, 70], [-95, 73], [-88, 74], [-80, 76], [-70, 78], [-62, 72], [-64, 66],
      [-56, 60], [-56, 52], [-60, 47], [-66, 45], [-70, 43], [-74, 40], [-76, 36],
      [-81, 31], [-80, 25], [-83, 29], [-88, 30], [-94, 29], [-97, 26], [-97, 21],
      [-92, 18], [-88, 16], [-84, 10], [-79, 9], [-83, 15], [-90, 17], [-96, 19],
      [-105, 20], [-110, 24], [-114, 28], [-117, 32], [-121, 35], [-124, 41]
    ],
    'amerique-sud': [
      [-79, 9], [-75, 11], [-72, 12], [-64, 11], [-60, 8], [-52, 5], [-50, 0], [-44, -2],
      [-38, -6], [-35, -8], [-39, -14], [-40, -20], [-45, -23], [-48, -26], [-53, -33],
      [-57, -38], [-62, -40], [-65, -45], [-68, -50], [-71, -54], [-75, -51], [-74, -44],
      [-73, -38], [-71, -30], [-70, -22], [-71, -18], [-75, -14], [-79, -6], [-81, -4],
      [-80, 1], [-78, 6]
    ],
    oceanie: [
      [113, -22], [114, -26], [116, -32], [122, -34], [129, -32], [135, -35], [140, -38],
      [147, -38], [151, -33], [153, -28], [146, -19], [142, -11], [136, -12], [130, -11],
      [126, -14], [122, -17]
    ]
  };

  /* Deux cadrages. Treize des quinze lieux tiennent dans la Méditerranée et
     le Proche-Orient : au cadrage mondial ils s'empilent, illisibles. */
  GRENIER.vues = [
    { cle: 'monde', label: 'Le monde', lonMin: -180, lonMax: 180, latMax: 82, latMin: -58 },
    { cle: 'mediterranee', label: 'Méditerranée & Proche-Orient',
      lonMin: -14, lonMax: 60, latMax: 58, latMin: 10 }
  ];

  /**
   * Lieux des histoires. Un lieu regroupe tous les contenus qui s'y passent :
   * Jérusalem en porte trois, l'Égypte quatre. `stories` liste des id du
   * catalogue — carte.js ignore silencieusement un id inconnu, pour qu'une
   * histoire renommée ne casse jamais la page.
   */
  GRENIER.lieux = [
    { nom: 'Égypte, le long du Nil', lon: 31.2, lat: 30.0,
      note: 'Le panier de Moïse, la parole de Haroun, la prison puis le palais de Youssef, et la terre qui s\'ouvre sous Kâroun.',
      stories: ['moise', 'haroun', 'youssef', 'karoun'] },

    { nom: 'Jérusalem & Bethléem', lon: 35.23, lat: 31.78,
      note: 'Le royaume de Dawud et de son fils Soulayman ; l\'étable où naît Jésus, à quelques kilomètres de là.',
      stories: ['dawud', 'soulayman', 'jesus'] },

    { nom: 'La Mecque', lon: 39.83, lat: 21.42,
      note: 'La Kaaba bâtie par Ibrahim et Ismaïl, la naissance de Mohamed ﷺ, et la grotte de Hira sur la montagne de la Lumière.',
      stories: ['mohamed', 'lumiere-hira', 'ibrahim'] },

    { nom: 'Médine', lon: 39.6, lat: 24.47,
      note: 'La ville de l\'Hégire, puis celle d\'où Omar ibn al-Khattab gouverna en marchant parmi les pauvres.',
      stories: ['omar'] },

    { nom: 'Ninive', lon: 43.15, lat: 36.36,
      note: 'La ville qui n\'écoutait pas Younes — et qui, à son retour, l\'accueillit les bras ouverts.',
      stories: ['younes'] },

    { nom: 'Bagdad', lon: 44.36, lat: 33.31,
      note: 'La Maison de la Sagesse : le trône de Haroun al-Rachid et le bureau où Al-Khwarizmi invente l\'algèbre.',
      stories: ['haroun-rachid', 'al-khwarizmi'] },

    { nom: 'Mont Ararat', lon: 44.3, lat: 39.7,
      note: 'Là où l\'arche de Noé se posa, quand la colombe revint avec un rameau d\'olivier.',
      stories: ['noe'] },

    { nom: 'Terre de Canaan', lon: 35.5, lat: 33.0,
      note: 'Le pays où Ilyès défia les adorateurs de Baal.',
      stories: ['ilyes'] },

    { nom: 'Carthage', lon: 10.32, lat: 36.85,
      note: 'La colline gagnée par Elissa avec une peau de bœuf, devenue la cité qui donna Hannibal au monde.',
      stories: ['elissa', 'hannibal'] },

    { nom: 'Tanger', lon: -5.8, lat: 35.77,
      note: 'Le point de départ — et de retour, vingt-neuf ans plus tard — d\'Ibn Battuta.',
      stories: ['ibn-battuta'] },

    { nom: 'Forêt de Sherwood', lon: -1.15, lat: 53.2,
      note: 'Les grands chênes où Robin des Bois et sa bande guettaient les convois du shérif de Nottingham.',
      stories: ['robinhood'] },

    { nom: 'Ajaccio, Corse', lon: 8.74, lat: 41.93,
      note: 'L\'île où naquit Napoléon en 1769, avant Paris, Austerlitz, Moscou et Sainte-Hélène.',
      stories: ['napoleon'] },

    { nom: 'Gênes', lon: 8.95, lat: 44.4,
      note: 'Les quais où grandit Cristoforo Colombo, persuadé qu\'on pouvait rejoindre les Indes par l\'ouest.',
      stories: ['colomb'] },

    { nom: 'Ulm & Princeton', lon: 10.0, lat: 48.4,
      note: 'D\'Ulm à Berne, de Berlin à Princeton : le trajet d\'Albert Einstein, de la boussole à la relativité.',
      stories: ['einstein'] },

    { nom: 'Côte de Bretagne', lon: -4.5, lat: 48.3,
      note: 'L\'île de Kervénan, son phare éteint et le Sentier des Brumes qui n\'apparaît qu\'une fois par siècle.',
      stories: ['phare'] }
  ];

  /**
   * Trajets des grands voyageurs. Tracés en pointillés, et mis en avant
   * quand on ouvre le lieu de départ.
   */
  GRENIER.trajets = [
    { story: 'elissa', nom: 'La fuite d\'Elissa : de Tyr à Carthage',
      points: [[35.2, 33.27], [28, 35.5], [20, 36.5], [10.32, 36.85]] },

    { story: 'hannibal', nom: 'La marche d\'Hannibal : Carthage, l\'Espagne, les Alpes, l\'Italie',
      points: [[10.32, 36.85], [-4, 37], [0.5, 41], [3, 43], [7, 45.2], [11, 44.5], [16.1, 41.3]] },

    { story: 'colomb', nom: 'La traversée de 1492 : de Palos à San Salvador',
      points: [[-6.9, 37.2], [-16, 28], [-40, 26], [-60, 25], [-74.5, 24.0]] },

    { story: 'ibn-battuta', nom: 'La Rihla : Tanger, La Mecque, Delhi, la Chine, le Mali, Tanger',
      points: [[-5.8, 35.77], [10, 34], [31.2, 30], [39.83, 21.42], [44.36, 33.31],
               [56, 27], [77.2, 28.6], [90, 22], [110, 20], [116.4, 39.9], [90, 25],
               [60, 25], [39.83, 21.42], [31.2, 30], [10, 33], [-3, 16.8], [-5.8, 35.77]] },

    { story: 'napoleon', nom: 'De la Corse à Sainte-Hélène',
      points: [[8.74, 41.93], [2.35, 48.85], [13.4, 52.5], [37.6, 55.75], [4.4, 50.7],
               [-9, 40], [-14, 20], [-9, 0], [-5.7, -15.96]] },

    { story: 'einstein', nom: 'D\'Ulm à Princeton',
      points: [[10.0, 48.4], [7.45, 46.95], [13.4, 52.5], [-4, 48], [-40, 45], [-74.66, 40.35]] }
  ];
})(window);
