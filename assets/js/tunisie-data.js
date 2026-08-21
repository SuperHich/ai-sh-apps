/**
 * Les Âges de la Tunisie — les époques traversées par le territoire
 * ------------------------------------------------------------------
 * Une entrée par époque, dans l'ordre où elles se succèdent. Tout ce que
 * la page affiche vient d'ici : rien n'est écrit en dur dans tunisie.js.
 *
 * Le fil est celui du **territoire**, pas d'un État : ce bout d'Afrique du
 * Nord a changé de maître une douzaine de fois, et chaque maître a laissé
 * quelque chose — une langue, une ville, une loi, un plat. Les époques se
 * suivent donc sans trou : la fin de l'une est le début de la suivante.
 *
 * Champs d'une époque :
 *   id        identifiant stable (ancre d'URL : #age-carthage)
 *   name      nom affiché
 *   short     nom court, pour la bande proportionnelle
 *   emoji     pictogramme
 *   period    la période, telle qu'on la lit
 *   start/end bornes en années, négatives avant Jésus-Christ.
 *             end vaut null pour l'époque en cours.
 *   scaled    false pour une époque sortie de l'échelle (voir la bande)
 *   era       clé de grand âge, voir TUNISIE.eras
 *   color     teinte de la fiche et de la bande
 *   seat      capitale ou siège du pouvoir
 *   rulers    qui gouverne, en une ligne
 *   reach     ce que la puissance tient au-delà du territoire actuel
 *   stat      le chiffre ou la date qui frappe
 *   summary   deux ou trois phrases, lisibles sans dérouler la fiche
 *   events    la chronologie interne : { y: année affichée, text }
 *   figures   les personnes qu'on retient : { name, note }
 *   legacy    ce qui en reste, visible aujourd'hui
 *   meanwhile ce qui se passe ailleurs dans le pays pendant ce temps —
 *             l'intérieur des terres n'a jamais tout à fait obéi à la côte
 *   turn      comment l'époque bascule dans la suivante
 *   sites     les lieux à placer sur la carte, en coordonnées réelles :
 *             { name, lon, lat, kind: 'capitale' | 'ville' | 'site' }
 *
 * Les dates anciennes sont des conventions : 814 av. J.-C. pour la
 * fondation de Carthage est une tradition rapportée par les auteurs
 * antiques, pas une date d'archive. Le texte le dit quand c'est le cas.
 */
(function (global) {
  'use strict';

  var TN = global.TUNISIE || (global.TUNISIE = {});

  /* ══════════════════════════════════════════════════════════════
     LE DESSIN DU PAYS
     Contour volontairement grossier — une trentaine de points, de quoi
     reconnaître le golfe de Gabès et le cap Bon, pas de quoi mesurer une
     côte. Coordonnées réelles en [longitude, latitude] : la carte et les
     lieux passent par la même projection, donc un site tombe au bon
     endroit sans réglage à la main.
     ══════════════════════════════════════════════════════════════ */
  TN.outline = [
    [8.58, 36.95], [9.10, 37.10], [9.55, 37.22], [9.82, 37.34], [10.22, 37.20],
    [10.30, 36.86], [10.62, 36.82], [11.05, 37.08], [11.15, 36.82], [10.78, 36.45],
    [10.55, 36.10], [10.58, 35.86], [10.83, 35.72], [11.06, 35.50], [10.95, 35.15],
    [10.80, 34.74], [10.45, 34.30], [10.08, 34.05], [10.05, 33.86], [10.60, 33.62],
    [11.11, 33.50], [11.52, 33.18], [11.10, 32.60], [10.70, 32.05], [10.28, 31.72],
    [9.85, 31.05], [9.52, 30.23], [9.10, 31.50], [8.70, 32.30], [8.35, 32.58],
    [7.98, 33.15], [7.52, 33.90], [8.25, 34.55], [8.30, 35.20], [8.25, 35.75],
    [8.45, 36.45]
  ];

  /* Deux îles, parce que l'histoire y est passée : Djerba des Lotophages
     et des corsaires, les Kerkennah où Hannibal s'embarque en exil. */
  TN.islands = [
    { name: 'Djerba',    points: [[10.72, 33.88], [11.05, 33.88], [11.05, 33.68], [10.72, 33.70]] },
    { name: 'Kerkennah', points: [[11.02, 34.75], [11.30, 34.72], [11.22, 34.55], [11.00, 34.60]] }
  ];

  /* Repères de lecture posés autour du dessin. */
  TN.labels = [
    /* Les repères sont posés là où il y a de la place : le grand large du
       golfe de Gabès pour la mer, le coin nord-est pour la Sicile. */
    { text: 'Mer Méditerranée', lon: 11.48, lat: 34.10, anchor: 'end' },
    { text: 'Algérie',          lon: 7.80,  lat: 35.40, anchor: 'end' },
    { text: 'Libye',            lon: 11.05, lat: 31.60, anchor: 'start' }
  ];

  /* ══════════════════════════════════════════════════════════════
     LES CINQ GRANDS ÂGES
     ══════════════════════════════════════════════════════════════ */
  TN.eras = [
    { key: 'origines',  label: 'Aux origines',      short: 'Origines',
      blurb: 'Avant l\'écriture, des hommes déjà là',        color: '#c9973f' },
    { key: 'antiquite', label: 'L\'Antiquité',      short: 'Antiquité',
      blurb: 'Carthage, puis Rome — la côte tournée vers la mer', color: '#f0c04b' },
    { key: 'tardive',   label: 'L\'Antiquité tardive', short: 'Ant. tardive',
      blurb: 'Deux siècles de maîtres de passage',          color: '#d0603f' },
    { key: 'ifriqiya',  label: 'L\'Ifriqiya musulmane', short: 'Ifriqiya',
      blurb: 'De Kairouan à Tunis, cinq siècles de capitales', color: '#4fd8a6' },
    { key: 'moderne',   label: 'Le temps moderne et contemporain', short: 'Moderne',
      blurb: 'La Régence, le protectorat, la République',   color: '#5bb8ff' }
  ];

  TN.periods = [

    /* ═══════════════ AUX ORIGINES ═══════════════ */
    {
      id: 'capsiens', name: 'Le temps des Capsiens', short: 'Capsiens', emoji: '🐚',
      period: 'v. 10 000 – 5 000 av. J.-C.', start: -10000, end: -5000, scaled: false,
      era: 'origines', color: '#c9973f',
      seat: 'Aucune ville : des campements près des sources et des chotts',
      rulers: 'Des groupes de chasseurs-cueilleurs, puis d\'éleveurs et de cultivateurs',
      reach: 'Tout le centre et le sud du pays, jusqu\'aux confins algériens',
      stat: { value: '10 000 ans', label: 'de présence humaine avant la première ville' },
      summary: 'Bien avant la première pierre taillée d\'un mur, des hommes vivent déjà ici. ' +
        'Les archéologues appellent leur culture le « Capsien », d\'après Capsa — le nom antique ' +
        'de Gafsa, où on l\'a identifiée pour la première fois. Ils laissent derrière eux des ' +
        'monticules de coquilles d\'escargots, des lames de silex minuscules et des œufs ' +
        'd\'autruche gravés.',
      events: [
        { y: 'v. 40 000 av. J.-C.', text: 'À El Guettar, un amas de boules de pierre déposé autour d\'une source : l\'un des plus anciens gestes rituels connus au monde.' },
        { y: 'v. 10 000 av. J.-C.', text: 'La culture capsienne s\'installe dans les steppes de l\'intérieur, à la fin de la dernière glaciation.' },
        { y: 'v. 6 000 av. J.-C.', text: 'Le Sahara est vert : lacs, girafes et éléphants là où il n\'y a plus que du sable.' },
        { y: 'v. 5 000 av. J.-C.', text: 'Le troupeau remplace la chasse. Les ancêtres des Amazighs (Berbères) sont en place.' }
      ],
      figures: [
        { name: 'Les Capsiens', note: 'Le nom vient de Capsa, l\'antique Gafsa : la préhistoire tunisienne porte le nom d\'une ville tunisienne.' },
        { name: 'Les Amazighs', note: 'Les « hommes libres » : la population de fond, présente avant tous les autres et jamais remplacée.' }
      ],
      legacy: [
        'Les escargotières — des collines entières faites de coquilles vidées repas après repas — encore visibles autour de Gafsa.',
        'La langue amazighe, parlée aujourd\'hui à Djerba, à Tamezret et dans quelques villages du Sud.',
        'Des noms de lieux qui ne sont ni arabes, ni latins, ni puniques : ils viennent de ce fond-là.'
      ],
      meanwhile: 'Le climat fait tout : le Sahara d\'alors est une savane humide, et les hommes y circulent librement. Son assèchement, vers 3 000 av. J.-C., pousse les populations vers le nord et le littoral — là où l\'histoire va commencer.',
      turn: 'Vers l\'an 1000 av. J.-C., des marins venus de Tyr, au Liban actuel, s\'arrêtent sur cette côte pour faire escale entre l\'Orient et l\'Espagne. Ils y installent des comptoirs. L\'un d\'eux deviendra Carthage.',
      sites: [
        { name: 'Capsa (Gafsa)', lon: 8.78, lat: 34.42, kind: 'site' },
        { name: 'El Guettar', lon: 8.94, lat: 34.34, kind: 'site' },
        { name: 'Chott el Jérid', lon: 8.40, lat: 33.70, kind: 'site' },
        { name: 'Tamezret', lon: 9.83, lat: 33.62, kind: 'site' }
      ]
    },

    /* ═══════════════ ANTIQUITÉ ═══════════════ */
    {
      id: 'carthage', name: 'Carthage la punique', short: 'Carthage', emoji: '⚓',
      period: '814 – 146 av. J.-C.', start: -814, end: -146,
      era: 'antiquite', color: '#f0c04b',
      seat: 'Carthage — la « ville neuve » (Qart Hadasht)',
      rulers: 'Deux suffètes élus chaque année, un sénat de grandes familles marchandes',
      reach: 'Les côtes d\'Afrique du Nord, la Sardaigne, l\'ouest de la Sicile, les Baléares et le sud de l\'Espagne',
      stat: { value: '220', label: 'navires de guerre à l\'abri dans le port circulaire' },
      summary: 'Une colonie de marchands phéniciens devient en trois siècles la première puissance ' +
        'de la Méditerranée occidentale. Carthage ne cherche pas des terres mais des routes : ' +
        'elle vit du commerce, paie des mercenaires plutôt que de lever une armée, et tient la mer ' +
        'jusqu\'au jour où une cité paysanne du Latium décide qu\'elle veut la même chose.',
      events: [
        { y: '814 av. J.-C.', text: 'Fondation par Elissa (Didon), princesse de Tyr en fuite — une tradition rapportée par les Anciens, que l\'archéologie situe plutôt vers 800.' },
        { y: '480 av. J.-C.', text: 'Défaite d\'Himère en Sicile : Carthage se replie sur l\'Afrique et se met à cultiver son arrière-pays.' },
        { y: '264 – 241 av. J.-C.', text: 'Première guerre punique. Rome apprend la mer, Carthage perd la Sicile.' },
        { y: '218 av. J.-C.', text: 'Hannibal quitte l\'Espagne, franchit les Alpes avec ses éléphants et écrase Rome à Cannes.' },
        { y: '202 av. J.-C.', text: 'Zama : Scipion l\'emporte, et la cavalerie numide de Massinissa a changé de camp.' },
        { y: '146 av. J.-C.', text: 'Troisième guerre punique. Après trois ans de siège, la ville brûle pendant dix-sept jours.' }
      ],
      figures: [
        { name: 'Elissa (Didon)', note: 'La fondatrice. La légende dit qu\'elle acheta autant de terre qu\'en couvrirait une peau de bœuf — et découpa la peau en lanières.' },
        { name: 'Hannibal Barca', note: 'Quinze ans de campagne en Italie sans jamais être vaincu en bataille rangée. Il finira exilé, et se donnera la mort pour ne pas être livré à Rome.' },
        { name: 'Magon', note: 'Son traité d\'agronomie en 28 livres fut le seul ouvrage que le Sénat romain ordonna de traduire après la chute de la ville.' },
        { name: 'Hannon le Navigateur', note: 'Il descend la côte atlantique de l\'Afrique bien plus loin que personne, et en rapporte un récit qu\'on lit encore.' }
      ],
      legacy: [
        'Kerkouane, sur le cap Bon : la seule ville punique jamais reconstruite par les Romains — on y voit encore les baignoires en forme de siège, dans les maisons.',
        'Le tophet de Salammbô, ses stèles et le débat qui ne s\'éteint pas sur ce qu\'on y sacrifiait.',
        'Le nom même du continent : « Afrique » vient des Afri, le peuple qui vivait autour de Carthage.',
        'Le port circulaire, dont le plan se lit encore dans le terrain, à côté de la lagune.'
      ],
      meanwhile: 'À l\'intérieur des terres, les royaumes numides ne sont pas des figurants : Massinissa unifie la Numidie, s\'allie à Rome au bon moment et règne soixante ans. Le mausolée libyco-punique de Dougga, avec son inscription en deux langues, est un monument numide, pas carthaginois.',
      turn: 'Rome ne se contente pas de gagner : elle rase la ville, vend les survivants et fait du territoire une province. L\'histoire du sel répandu sur les ruines, elle, est une invention du XIXe siècle — aucun auteur antique n\'en parle.',
      sites: [
        { name: 'Carthage', lon: 10.32, lat: 36.85, kind: 'capitale' },
        { name: 'Utique', lon: 10.06, lat: 37.05, kind: 'ville' },
        { name: 'Kerkouane', lon: 11.10, lat: 36.95, kind: 'site' },
        { name: 'Hadrumète (Sousse)', lon: 10.64, lat: 35.83, kind: 'ville' },
        { name: 'Dougga', lon: 9.22, lat: 36.42, kind: 'site' },
        { name: 'Kerkennah', lon: 11.15, lat: 34.68, kind: 'site' }
      ]
    },
    {
      id: 'rome', name: 'L\'Afrique romaine', short: 'Rome', emoji: '🏛️',
      period: '146 av. J.-C. – 439 apr. J.-C.', start: -146, end: 439,
      era: 'antiquite', color: '#ff8a5b',
      seat: 'Carthage, refondée par César et Auguste sur les ruines de la punique',
      rulers: 'Un proconsul envoyé de Rome, des cités largement autonomes',
      reach: 'La province d\'Afrique proconsulaire : la Tunisie actuelle, l\'est de l\'Algérie et l\'ouest de la Libye',
      stat: { value: '8 mois sur 12', label: 'de blé pour Rome, fournis par l\'Afrique selon Flavius Josèphe' },
      summary: 'Six siècles — l\'époque la plus longue après la préhistoire. Le territoire devient ' +
        'le grenier et le pressoir de l\'Empire : blé au nord, olivier partout ailleurs. Les villes ' +
        'se couvrent de théâtres, de thermes et de mosaïques, et la province donne à Rome des ' +
        'écrivains, des juristes et une bonne part de sa littérature chrétienne.',
      events: [
        { y: '146 av. J.-C.', text: 'Création de la province d\'Afrique. Le sol est cadastré au cordeau — on en voit encore le quadrillage d\'avion.' },
        { y: '44 – 29 av. J.-C.', text: 'César puis Auguste refondent Carthage, qui redevient une des plus grandes villes de l\'Empire.' },
        { y: '203', text: 'Perpétue et Félicité sont exécutées dans l\'amphithéâtre de Carthage ; le récit de leur détention est écrit par Perpétue elle-même.' },
        { y: '238', text: 'À Thysdrus (El Jem), les propriétaires terriens proclament empereur le vieux Gordien. Le règne durera vingt jours.' },
        { y: 'v. 238', text: 'Construction de l\'amphithéâtre d\'El Jem, 35 000 places, dans une ville qui n\'a que l\'huile pour richesse.' },
        { y: '439', text: 'Les Vandales entrent dans Carthage sans presque combattre, le 19 octobre.' }
      ],
      figures: [
        { name: 'Térence', note: 'Né à Carthage, esclave affranchi, il devient l\'un des deux grands auteurs comiques latins. « Je suis homme, et rien de ce qui est humain ne m\'est étranger » est de lui.' },
        { name: 'Apulée', note: 'Formé à Carthage, auteur de L\'Âne d\'or — le seul roman latin qui nous soit parvenu entier.' },
        { name: 'Tertullien', note: 'Le premier grand écrivain chrétien de langue latine. Il invente une bonne partie du vocabulaire théologique en écrivant à Carthage.' },
        { name: 'Saint Cyprien', note: 'Évêque de Carthage, décapité en 258 : l\'Afrique est alors le cœur intellectuel du christianisme occidental.' }
      ],
      legacy: [
        'L\'amphithéâtre d\'El Jem, troisième du monde romain par la taille, presque intact.',
        'Dougga, la ville romaine la mieux conservée d\'Afrique du Nord : capitole, théâtre, rues et latrines à douze places.',
        'L\'aqueduc de Zaghouan, 132 km jusqu\'à Carthage, dont les arches traversent encore la plaine.',
        'Les mosaïques du Bardo — la plus riche collection au monde, sauvée des villas de Sousse, d\'El Jem et de Dougga.',
        'L\'olivier du Sahel : les oliveraies de Sfax sont l\'héritage direct de ce moment-là.'
      ],
      meanwhile: 'La campagne parle toujours punique et libyque : les inscriptions bilingues de Dougga le prouvent, et saint Augustin, un siècle plus tard, cherchera encore des prêtres capables de prêcher en punique. Le christianisme se déchire ici sur le schisme donatiste, qui est aussi une révolte des campagnes contre les villes.',
      turn: 'Une armée vandale de 80 000 personnes, femmes et enfants compris, traverse le détroit de Gibraltar en 429 et met dix ans à descendre jusqu\'à Carthage. L\'Empire, occupé ailleurs, ne peut rien.',
      sites: [
        { name: 'Carthage', lon: 10.32, lat: 36.85, kind: 'capitale' },
        { name: 'Thysdrus (El Jem)', lon: 10.71, lat: 35.30, kind: 'site' },
        { name: 'Dougga', lon: 9.22, lat: 36.42, kind: 'site' },
        { name: 'Sufetula (Sbeitla)', lon: 9.12, lat: 35.24, kind: 'site' },
        { name: 'Bulla Regia', lon: 8.75, lat: 36.56, kind: 'site' },
        { name: 'Zaghouan', lon: 10.14, lat: 36.40, kind: 'site' },
        { name: 'Sicca (Le Kef)', lon: 8.71, lat: 36.18, kind: 'ville' }
      ]
    },

    /* ═══════════════ ANTIQUITÉ TARDIVE ═══════════════ */
    {
      id: 'vandales', name: 'Le royaume vandale', short: 'Vandales', emoji: '🛶',
      period: '439 – 533', start: 439, end: 533,
      era: 'tardive', color: '#d0603f',
      seat: 'Carthage',
      rulers: 'Une dynastie germanique de foi arienne, sur une population restée latine et catholique',
      reach: 'L\'Afrique du Nord, la Sardaigne, la Corse, les Baléares et un moment la Sicile',
      stat: { value: '14 jours', label: 'de pillage à Rome en 455 — le mot « vandalisme » ne naîtra qu\'en 1794' },
      summary: 'Un siècle à peine, mais un siècle spectaculaire : les Vandales sont le seul peuple ' +
        'germanique à s\'être doté d\'une flotte, et cette flotte tient la Méditerranée occidentale. ' +
        'Ils gardent l\'administration romaine, l\'impôt romain et la langue latine — ils changent ' +
        'les propriétaires, pas le pays.',
      events: [
        { y: '429', text: 'Genséric fait passer son peuple d\'Espagne en Afrique.' },
        { y: '439', text: 'Prise de Carthage. Le royaume vandale d\'Afrique est reconnu par l\'Empire en 442.' },
        { y: '455', text: 'La flotte vandale remonte le Tibre et pille Rome pendant deux semaines.' },
        { y: '468', text: 'Une expédition byzantine gigantesque est détruite au cap Bon par des brûlots.' },
        { y: '533', text: 'Bélisaire débarque ; en trois mois, le royaume s\'effondre.' }
      ],
      figures: [
        { name: 'Genséric', note: 'Quarante-neuf ans de règne, une flotte partie de rien, et le sac de Rome. L\'un des politiques les plus habiles de son siècle.' },
        { name: 'Gélimer', note: 'Le dernier roi. Vaincu, il est exhibé dans le triomphe de Bélisaire à Constantinople, puis reçoit un domaine et vit tranquille.' },
        { name: 'Dracontius', note: 'Poète latin de Carthage, emprisonné par le roi pour avoir loué un souverain étranger : la culture latine continue, même en prison.' }
      ],
      legacy: [
        'Un mot, « vandalisme », forgé en 1794 par l\'abbé Grégoire — la réputation d\'un peuple faite quatorze siècles après sa disparition.',
        'Des mosaïques de villas qui montrent des seigneurs vandales à cheval, habillés à la romaine : la meilleure preuve qu\'ils ont continué le pays plus qu\'ils ne l\'ont détruit.',
        'La fin de l\'approvisionnement de Rome en blé africain — un des coups qui achèvent l\'Empire d\'Occident.'
      ],
      meanwhile: 'Pendant que la côte change de maître, des royaumes berbères se reconstituent à l\'intérieur : dans l\'Aurès, dans les steppes, des chefs frappent monnaie et se disent rois. Ils survivront aux Vandales, aux Byzantins, et négocieront avec les armées arabes.',
      turn: 'Justinien veut refaire l\'Empire romain. Il envoie Bélisaire avec 15 000 hommes ; la population catholique l\'accueille en libérateur, et le royaume vandale disparaît en une saison.',
      sites: [
        { name: 'Carthage', lon: 10.32, lat: 36.85, kind: 'capitale' },
        { name: 'Cap Bon', lon: 11.05, lat: 37.05, kind: 'site' },
        { name: 'Bizerte', lon: 9.87, lat: 37.27, kind: 'ville' },
        { name: 'Hadrumète (Sousse)', lon: 10.64, lat: 35.83, kind: 'ville' }
      ]
    },
    {
      id: 'byzance', name: 'L\'Afrique byzantine', short: 'Byzance', emoji: '✝️',
      period: '533 – 647', start: 533, end: 647,
      era: 'tardive', color: '#c98fd8',
      seat: 'Carthage, siège d\'un exarque tout-puissant',
      rulers: 'Constantinople, par un préfet puis un exarque cumulant l\'armée et le civil',
      reach: 'De la Tripolitaine à la Maurétanie, avec la Sardaigne et les Baléares',
      stat: { value: '3 mois', label: 'entre le débarquement de Bélisaire et l\'effondrement du royaume vandale' },
      summary: 'Un siècle de reconquête qui coûte plus qu\'elle ne rapporte. Byzance rebâtit, ' +
        'fortifie, taxe lourdement — et se met à dos les Berbères comme les propriétaires locaux. ' +
        'Quand les cavaliers arabes arrivent, la province est riche en murailles et pauvre en ' +
        'loyautés.',
      events: [
        { y: '533 – 534', text: 'Bélisaire reprend l\'Afrique ; Justinien lance un immense programme de forteresses.' },
        { y: '591', text: 'Création de l\'exarchat d\'Afrique : un vice-roi qui commande tout, si loin de Constantinople qu\'il en devient dangereux.' },
        { y: '610', text: 'L\'exarque de Carthage envoie son fils Héraclius prendre le pouvoir à Constantinople — un empereur byzantin parti de Tunisie.' },
        { y: '646', text: 'L\'exarque Grégoire se proclame empereur et installe sa cour à Sbeitla, loin des côtes.' },
        { y: '647', text: 'Bataille de Sbeitla : Grégoire est tué, la première armée arabe repart avec un tribut énorme.' }
      ],
      figures: [
        { name: 'Bélisaire', note: 'Le meilleur général de Justinien. Il reprend l\'Afrique presque sans combattre, puis passe en Italie.' },
        { name: 'Héraclius', note: 'Parti de Carthage avec la flotte d\'Afrique, il devient empereur à Constantinople en 610 et sauve l\'Empire d\'Orient.' },
        { name: 'Grégoire le Patrice', note: 'Le dernier maître byzantin de l\'intérieur. Sa fille, dit la tradition arabe, se serait jetée d\'un cheval plutôt que d\'être prise.' }
      ],
      legacy: [
        'Les forteresses de Haïdra, d\'Aïn Tounga et de Kélibia, bâties avec les pierres des temples romains d\'à côté.',
        'Les basiliques de Sbeitla et leurs baptistères en mosaïque, parmi les plus beaux du monde chrétien antique.',
        'La disparition de Carthage comme grande ville : plus jamais elle ne sera une capitale.'
      ],
      meanwhile: 'La peste dite « de Justinien » vide les campagnes, la pression fiscale déclenche des révoltes, et les royaumes berbères de l\'intérieur — les Djedar, les Aurès — deviennent des puissances autonomes avec lesquelles il faut composer.',
      turn: 'Les raids arabes venus d\'Égypte se transforment en conquête. En 670, un camp militaire est planté à mi-chemin de la mer et de la montagne : Kairouan. Carthage tombera pour de bon en 698.',
      sites: [
        { name: 'Carthage', lon: 10.32, lat: 36.85, kind: 'capitale' },
        { name: 'Sufetula (Sbeitla)', lon: 9.12, lat: 35.24, kind: 'ville' },
        { name: 'Haïdra', lon: 8.45, lat: 35.57, kind: 'site' },
        { name: 'Kélibia', lon: 11.09, lat: 36.85, kind: 'site' },
        { name: 'Aïn Tounga', lon: 9.44, lat: 36.51, kind: 'site' }
      ]
    },

    /* ═══════════════ L'IFRIQIYA MUSULMANE ═══════════════ */
    {
      id: 'conquete', name: 'La conquête arabe et la naissance de l\'Ifriqiya', short: 'Conquête', emoji: '🕌',
      period: '647 – 800', start: 647, end: 800,
      era: 'ifriqiya', color: '#4fd8a6',
      seat: 'Kairouan, fondée en 670',
      rulers: 'Des gouverneurs nommés par les califes de Damas, puis de Bagdad',
      reach: 'Toute l\'Ifriqiya, base de départ pour le Maghreb puis pour l\'Espagne',
      stat: { value: '670', label: 'la fondation de Kairouan, première ville arabe du Maghreb' },
      summary: 'Un siècle et demi de va-et-vient plutôt qu\'une conquête d\'un seul élan : les armées ' +
        'arabes prennent, perdent, reprennent. Ce qui reste à la fin n\'est pas seulement un ' +
        'gouverneur, c\'est une langue, une religion et une ville neuve plantée volontairement ' +
        'loin de la mer et des souvenirs byzantins.',
      events: [
        { y: '647', text: 'Premier grand raid : victoire de Sbeitla, puis retour en Égypte contre un tribut.' },
        { y: '670', text: 'Oqba ibn Nafi fonde Kairouan — un camp au milieu de la steppe, qui devient une capitale.' },
        { y: '683', text: 'Oqba est tué à Tahouda par le chef berbère Koceila, qui reprend Kairouan.' },
        { y: 'v. 698', text: 'Hassan ibn Numan prend Carthage et fonde l\'arsenal de Tunis : le pouvoir change de rive.' },
        { y: 'v. 703', text: 'La Kahena, reine berbère de l\'Aurès, est vaincue après des années de résistance.' },
        { y: '740 – 772', text: 'Grandes révoltes kharidjites : les Berbères adoptent un islam égalitaire pour contester les Arabes.' }
      ],
      figures: [
        { name: 'Oqba ibn Nafi', note: 'Fondateur de Kairouan. La tradition veut qu\'il ait choisi le lieu après qu\'une source eut jailli du sable.' },
        { name: 'Koceila', note: 'Chef berbère converti, longtemps allié puis adversaire : il bat et tue Oqba, et gouverne Kairouan cinq ans.' },
        { name: 'La Kahena (Dihya)', note: 'Reine et devineresse des Djerawa. Elle pratique la terre brûlée pour décourager l\'envahisseur — et s\'aliène ainsi ses propres alliés.' },
        { name: 'Hassan ibn Numan', note: 'Il prend Carthage, en démonte les pierres, et bâtit avec elles la Tunis qui la remplacera.' }
      ],
      legacy: [
        'La langue arabe et l\'islam, qui deviennent le socle commun du pays.',
        'Kairouan, quatrième ville sainte dans une tradition largement partagée au Maghreb.',
        'Tunis, née d\'un arsenal creusé pour tenir la mer contre Byzance : elle est encore la capitale.',
        'Le mot « Ifriqiya », arabisation du latin Africa, qui donnera son nom à tout un continent.'
      ],
      meanwhile: 'Le christianisme ne disparaît pas d\'un coup : des évêques africains sont encore signalés au XIe siècle, et des communautés chrétiennes vivent à Tunis et à Gafsa longtemps après la conquête. La conversion se fait sur des siècles, pas sur une bataille.',
      turn: 'En 800, le calife de Bagdad Haroun al-Rachid renonce à gouverner une province si lointaine : il concède l\'Ifriqiya à Ibrahim ibn al-Aghlab, à charge pour lui d\'y maintenir l\'ordre et d\'envoyer un tribut. L\'autonomie commence.',
      sites: [
        { name: 'Kairouan', lon: 10.10, lat: 35.68, kind: 'capitale' },
        { name: 'Tunis', lon: 10.18, lat: 36.80, kind: 'ville' },
        { name: 'Carthage', lon: 10.32, lat: 36.85, kind: 'site' },
        { name: 'Sbeitla', lon: 9.12, lat: 35.24, kind: 'site' },
        { name: 'Gafsa', lon: 8.78, lat: 34.42, kind: 'ville' }
      ]
    },
    {
      id: 'aghlabides', name: 'L\'âge d\'or aghlabide', short: 'Aghlabides', emoji: '🕋',
      period: '800 – 909', start: 800, end: 909,
      era: 'ifriqiya', color: '#6ee7d7',
      seat: 'Kairouan, puis les villes-palais d\'al-Abbassiya et de Raqqada',
      rulers: 'Une dynastie héréditaire, émirs au nom du calife abbasside',
      reach: 'L\'Ifriqiya, la Sicile conquise à partir de 827, Malte, un pied en Italie du Sud',
      stat: { value: '128 m', label: 'de diamètre pour le grand bassin des Aghlabides, réservoir de Kairouan' },
      summary: 'Un siècle qui pèse plus que sa durée. Les Aghlabides bâtissent la Grande Mosquée de ' +
        'Kairouan telle qu\'on la voit encore, creusent des réservoirs immenses, alignent des ribats ' +
        'le long de la côte et lancent depuis Sousse la conquête de la Sicile. Kairouan devient l\'un ' +
        'des grands foyers de savoir du monde musulman.',
      events: [
        { y: '800', text: 'Ibrahim ibn al-Aghlab obtient l\'Ifriqiya à titre héréditaire.' },
        { y: '827', text: 'Le juge Asad ibn al-Furat embarque à Sousse pour la Sicile : un cadi commandant une flotte.' },
        { y: '836', text: 'Ziyadat Allah Ier reconstruit la Grande Mosquée de Kairouan — le modèle de toutes les mosquées du Maghreb.' },
        { y: 'v. 860', text: 'Creusement des bassins de Kairouan, chef-d\'œuvre d\'hydraulique : décanteur, réserve, château d\'eau.' },
        { y: '876', text: 'Fondation de Raqqada, ville-palais où la cour va vivre à l\'écart des juristes de Kairouan.' },
        { y: '909', text: 'Le dernier émir s\'enfuit vers l\'Orient : les missionnaires fatimides ont retourné les tribus berbères Kutama.' }
      ],
      figures: [
        { name: 'Ziyadat Allah Ier', note: 'Le bâtisseur : la mosquée de Kairouan et l\'expédition de Sicile sont de lui.' },
        { name: 'Asad ibn al-Furat', note: 'Juriste devenu amiral, mort au siège de Syracuse. Une carrière que personne n\'a refaite.' },
        { name: 'Sahnoun', note: 'Sa Mudawwana fixe le droit malékite pour tout l\'Occident musulman — jusqu\'aujourd\'hui.' },
        { name: 'Ibn al-Jazzar', note: 'Médecin de Kairouan (Xe s.) : son « Viatique du voyageur » sera traduit en latin et enseigné dans les universités d\'Europe.' }
      ],
      legacy: [
        'La Grande Mosquée de Kairouan, ses colonnes antiques remployées et son minaret carré, le plus ancien encore debout.',
        'Les bassins des Aghlabides, toujours en eau à l\'entrée de la ville.',
        'Les ribats de Sousse et de Monastir : moitié couvent, moitié fort, avec vue sur la mer.',
        'Le malékisme, école juridique majoritaire en Tunisie depuis douze siècles.',
        'L\'arabe de Sicile, qui a laissé des centaines de mots dans le sicilien d\'aujourd\'hui.'
      ],
      meanwhile: 'Kairouan attire les savants de tout l\'Occident musulman. Une communauté juive importante s\'y installe et y produit une école médicale et talmudique réputée jusqu\'en Égypte et en Espagne.',
      turn: 'Un prédicateur ismaïlien, Abou Abdallah al-Chi\'i, convertit la confédération berbère des Kutama en Kabylie et lève une armée au nom d\'un imam caché. En 909, cette armée entre à Raqqada.',
      sites: [
        { name: 'Kairouan', lon: 10.10, lat: 35.68, kind: 'capitale' },
        { name: 'Raqqada', lon: 10.07, lat: 35.60, kind: 'site' },
        { name: 'Sousse', lon: 10.64, lat: 35.83, kind: 'ville' },
        { name: 'Monastir', lon: 10.83, lat: 35.78, kind: 'ville' },
        { name: 'Tunis', lon: 10.18, lat: 36.80, kind: 'ville' },
        { name: 'Sfax', lon: 10.76, lat: 34.74, kind: 'ville' }
      ]
    },
    {
      id: 'fatimides', name: 'Fatimides et Zirides', short: 'Fatimides', emoji: '🌊',
      period: '909 – 1160', start: 909, end: 1160,
      era: 'ifriqiya', color: '#46c2c2',
      seat: 'Mahdia, puis Sabra al-Mansuriya près de Kairouan',
      rulers: 'Un califat chiite ismaélien, puis ses gouverneurs berbères zirides devenus indépendants',
      reach: 'Du Maroc à l\'Égypte, la Sicile, et bientôt jusqu\'à la Syrie depuis Le Caire',
      stat: { value: '973', label: 'l\'année où le calife quitte l\'Ifriqiya pour Le Caire, ville qu\'il vient de fonder' },
      summary: 'La Tunisie sert ici de rampe de lancement à un empire qui finira ailleurs. Le califat ' +
        'fatimide naît à Raqqada, se protège derrière la presqu\'île de Mahdia, conquiert l\'Égypte — ' +
        'et déménage. Les Zirides qu\'il laisse derrière lui finissent par rompre avec Le Caire, ' +
        'et le paient très cher.',
      events: [
        { y: '910', text: 'Ubayd Allah est proclamé calife al-Mahdi à Raqqada : le califat fatimide est né en Ifriqiya.' },
        { y: '916 – 921', text: 'Construction de Mahdia sur une presqu\'île défendue par un seul mur : une capitale imprenable par terre.' },
        { y: '944 – 947', text: 'Révolte d\'Abou Yazid, « l\'homme à l\'âne », qui manque de renverser le califat.' },
        { y: '969 – 973', text: 'Conquête de l\'Égypte, fondation du Caire et d\'al-Azhar ; le calife s\'y installe et laisse l\'Ifriqiya aux Zirides.' },
        { y: '1048', text: 'Les Zirides rompent avec Le Caire et reconnaissent le calife sunnite de Bagdad.' },
        { y: '1057', text: 'Les tribus hilaliennes prennent Kairouan ; la cour se réfugie à Mahdia. Kairouan ne sera plus jamais capitale.' },
        { y: '1148 – 1160', text: 'Les Normands de Sicile occupent Mahdia et la côte, jusqu\'à l\'arrivée des Almohades.' }
      ],
      figures: [
        { name: 'Ubayd Allah al-Mahdi', note: 'Le premier calife fatimide, proclamé en Tunisie : la dynastie qui fondera Le Caire est née ici.' },
        { name: 'Abou Yazid', note: 'Un maître d\'école kharidjite monté sur un âne gris, à la tête d\'une révolte qui assiège Mahdia pendant des mois.' },
        { name: 'Buluggin ibn Ziri', note: 'Le premier des Zirides, chef berbère sanhadja à qui le calife confie tout le Maghreb en partant.' },
        { name: 'Ibn Rachiq', note: 'Poète et critique de Kairouan ; son traité sur la poésie arabe est encore cité mille ans plus tard.' }
      ],
      legacy: [
        'Mahdia : la Skifa Kahla, porte creusée de 44 mètres de couloir, et le port taillé dans le roc.',
        'La Grande Mosquée de Mahdia, sans minaret et avec un portail monumental — une exception dans tout l\'islam médiéval.',
        'Le Caire et son université al-Azhar, fondés par une dynastie partie de Mahdia.',
        'L\'arabisation des campagnes, accélérée par l\'arrivée des tribus venues d\'Orient.'
      ],
      meanwhile: 'L\'arrivée des Banu Hilal, envoyés d\'Égypte, a longtemps été décrite d\'après Ibn Khaldoun comme une invasion de sauterelles. Les historiens d\'aujourd\'hui la lisent autrement : une migration lente, qui transforme surtout la langue et l\'économie des campagnes, du sédentaire vers le pastoral.',
      turn: 'Les Almohades, venus du Maroc, chassent les Normands de Mahdia en 1160 et rattachent l\'Ifriqiya à un empire qui va du Portugal à la Tripolitaine. Le centre de gravité du pays se déplace vers Tunis.',
      sites: [
        { name: 'Mahdia', lon: 11.06, lat: 35.50, kind: 'capitale' },
        { name: 'Sabra (al-Mansuriya)', lon: 10.12, lat: 35.65, kind: 'site' },
        { name: 'Kairouan', lon: 10.10, lat: 35.68, kind: 'ville' },
        { name: 'Sfax', lon: 10.76, lat: 34.74, kind: 'ville' },
        { name: 'Djerba', lon: 10.85, lat: 33.81, kind: 'site' },
        { name: 'Tunis', lon: 10.18, lat: 36.80, kind: 'ville' }
      ]
    },
    {
      id: 'hafsides', name: 'Almohades et Hafsides — Tunis capitale', short: 'Hafsides', emoji: '📚',
      period: '1160 – 1574', start: 1160, end: 1574,
      era: 'ifriqiya', color: '#5bb8ff',
      seat: 'Tunis',
      rulers: 'D\'abord des gouverneurs almohades, puis les Hafsides, califes indépendants à partir de 1229',
      reach: 'De Bougie à Tripoli, avec une suzeraineté reconnue par moments jusqu\'à Tlemcen',
      stat: { value: '345 ans', label: 'de dynastie hafside — la plus longue que le pays ait connue' },
      summary: 'C\'est le moment où la Tunisie devient la Tunisie : Tunis remplace Kairouan et Mahdia, ' +
        'la médina prend la forme qu\'elle a gardée, la Zitouna devient une université, et les ' +
        'marchands de Pise, Gênes et Venise ont leurs entrepôts sur le port. Un pays de commerce, de ' +
        'juristes et de diplomatie — qui doit aussi encaisser une croisade.',
      events: [
        { y: '1160', text: 'Les Almohades unifient l\'Ifriqiya et nomment gouverneur un descendant d\'Abou Hafs.' },
        { y: '1229', text: 'Abou Zakariya cesse d\'obéir à Marrakech : la dynastie hafside est indépendante.' },
        { y: '1249', text: 'Al-Mustansir prend le titre de calife ; Tunis reçoit des ambassades de toute la Méditerranée.' },
        { y: '1270', text: 'Huitième croisade : Saint Louis débarque à Carthage et meurt du flux de ventre sous les murs de Tunis.' },
        { y: '1332', text: 'Naissance à Tunis d\'Ibn Khaldoun.' },
        { y: '1535', text: 'Charles Quint reprend Tunis à Barberousse et y installe un roi hafside vassal.' },
        { y: '1574', text: 'Sinan Pacha prend Tunis pour le sultan ottoman : la dynastie s\'éteint.' }
      ],
      figures: [
        { name: 'Ibn Khaldoun', note: 'Né à Tunis, il invente dans sa Muqaddima une science des sociétés — cycles des dynasties, rôle de la solidarité de groupe — cinq siècles avant la sociologie.' },
        { name: 'Abou Zakariya', note: 'Le fondateur de l\'indépendance hafside, bâtisseur de madrasas et d\'aqueducs.' },
        { name: 'Aïcha Manoubia', note: 'Sainte femme du XIIIe siècle, restée si populaire que son mausolée à Tunis reçoit encore des visiteurs.' },
        { name: 'Saint Louis', note: 'Roi de France mort devant Tunis en 1270 — la croisade s\'arrête là, faute de croisés valides.' }
      ],
      legacy: [
        'La médina de Tunis, classée à l\'UNESCO : sept cents monuments dans un labyrinthe qui date de ce moment-là.',
        'La mosquée Zitouna et son enseignement, qui formera les élites du pays jusqu\'au XXe siècle.',
        'Les souks spécialisés — parfumeurs, chéchias, étoffes — organisés en corporations dès cette époque.',
        'Les premiers réfugiés andalous, arrivés après 1492, qui apportent l\'irrigation, la musique et des métiers.'
      ],
      meanwhile: 'La course maritime devient une industrie : les ports tunisiens arment contre les chrétiens, ceux d\'Europe contre les musulmans, et chacun rachète ses captifs. Djerba change de mains une dizaine de fois entre Espagnols, corsaires et Ottomans.',
      turn: 'La Méditerranée est devenue le champ clos de deux empires : les Habsbourg et les Ottomans. Pris entre les deux, le dernier Hafside s\'appuie sur l\'Espagne — et c\'est ce qui achève de le perdre.',
      sites: [
        { name: 'Tunis', lon: 10.18, lat: 36.80, kind: 'capitale' },
        { name: 'Kairouan', lon: 10.10, lat: 35.68, kind: 'ville' },
        { name: 'Béja', lon: 9.18, lat: 36.73, kind: 'ville' },
        { name: 'Djerba', lon: 10.85, lat: 33.81, kind: 'site' },
        { name: 'Mahdia', lon: 11.06, lat: 35.50, kind: 'ville' },
        { name: 'Testour', lon: 9.44, lat: 36.55, kind: 'site' }
      ]
    },

    /* ═══════════════ MODERNE ET CONTEMPORAIN ═══════════════ */
    {
      id: 'ottomane', name: 'La Régence de Tunis', short: 'Ottomans', emoji: '🌙',
      period: '1574 – 1881', start: 1574, end: 1881,
      era: 'moderne', color: '#b18cff',
      seat: 'Tunis, et le palais du Bardo',
      rulers: 'Une province ottomane devenue autonome : pachas, deys, puis beys mouradites et husseinites',
      reach: 'Les frontières du pays actuel, à peu de chose près — elles se fixent à cette époque',
      stat: { value: '1861', label: 'la première constitution écrite du monde arabe, promulguée à Tunis' },
      summary: 'Sur le papier, une province du sultan d\'Istanbul ; en pratique, un État qui bat sa ' +
        'monnaie, signe ses traités et se transmet de père en fils. C\'est aussi le siècle des ' +
        'réformes : abolition de l\'esclavage, pacte garantissant les droits des sujets, ' +
        'constitution — et d\'une faillite qui ouvrira la porte aux Européens.',
      events: [
        { y: '1574', text: 'Tunis devient une province ottomane. Une milice de janissaires y installe son propre pouvoir.' },
        { y: '1609', text: 'Arrivée massive des Morisques chassés d\'Espagne : ils fondent ou repeuplent Testour, Soliman, Grombalia.' },
        { y: '1705', text: 'Hussein ben Ali fonde la dynastie husseinite, qui régnera jusqu\'en 1957.' },
        { y: '1846', text: 'Ahmed Bey abolit l\'esclavage — avant la France (1848) et les États-Unis (1865).' },
        { y: '1857', text: 'Le Pacte fondamental garantit l\'égalité devant l\'impôt et la justice, quelle que soit la religion.' },
        { y: '1861', text: 'Promulgation de la Constitution : une première dans le monde arabe et musulman.' },
        { y: '1864', text: 'Révolte d\'Ali Ben Ghedhahem : le doublement de l\'impôt met le pays à feu.' },
        { y: '1869', text: 'Banqueroute. Une commission financière internationale prend le contrôle des recettes.' },
        { y: '1881', text: 'L\'armée française entre par le nord-ouest ; le traité du Bardo est signé le 12 mai.' }
      ],
      figures: [
        { name: 'Hammouda Pacha', note: 'Trente-deux ans de règne, une armée réorganisée, Venise et Alger tenues en respect : l\'apogée de la Régence.' },
        { name: 'Ahmed Ier Bey', note: 'Il abolit l\'esclavage, crée l\'école militaire du Bardo et rêve d\'un État moderne — au prix de dettes énormes.' },
        { name: 'Kheireddine Pacha', note: 'Réformateur et Premier ministre, auteur d\'un livre qui appelle les musulmans à s\'approprier les techniques de l\'Europe. Il fonde le collège Sadiki en 1875.' },
        { name: 'Ali Ben Ghedhahem', note: 'Chef de la grande révolte fiscale de 1864, resté dans la mémoire populaire comme le « bey du peuple ».' }
      ],
      legacy: [
        'Les mosquées à minaret octogonal et tuiles vertes, marque de l\'architecture turque à Tunis.',
        'La chéchia, dont le commerce fit vivre des quartiers entiers, et le malouf andalou-ottoman.',
        'Le collège Sadiki, qui formera presque toute l\'élite nationaliste du siècle suivant.',
        'Le palais du Bardo, siège du bey puis du Parlement, et son musée.',
        'Des frontières et un appareil d\'État déjà en place : l\'indépendance de 1956 restaurera un pays, pas une idée.'
      ],
      meanwhile: 'La course s\'éteint après 1830 et la prise d\'Alger par la France. La Régence perd sa principale ressource, s\'endette pour se moderniser, et se retrouve prise entre un empire ottoman affaibli et deux voisins européens décidés à se partager la rive sud.',
      turn: 'Prétextant des incursions de tribus khroumires en Algérie, la France envoie 30 000 hommes. Le bey signe le traité du Bardo : il garde son trône, la France prend la diplomatie, l\'armée et les finances.',
      sites: [
        { name: 'Tunis', lon: 10.18, lat: 36.80, kind: 'capitale' },
        { name: 'Le Bardo', lon: 10.13, lat: 36.81, kind: 'site' },
        { name: 'Testour', lon: 9.44, lat: 36.55, kind: 'site' },
        { name: 'Bizerte', lon: 9.87, lat: 37.27, kind: 'ville' },
        { name: 'Le Kef', lon: 8.71, lat: 36.18, kind: 'ville' },
        { name: 'Djerba', lon: 10.85, lat: 33.81, kind: 'ville' }
      ]
    },
    {
      id: 'protectorat', name: 'Le protectorat français', short: 'Protectorat', emoji: '⚙️',
      period: '1881 – 1956', start: 1881, end: 1956,
      era: 'moderne', color: '#ff6f9c',
      seat: 'Tunis — le bey au Bardo, le résident général avenue de France',
      rulers: 'Un résident général français ; le bey règne et signe, mais ne gouverne plus',
      reach: 'Le territoire actuel, intégré à l\'ensemble colonial français d\'Afrique du Nord',
      stat: { value: '75 ans', label: 'de protectorat — le trône reste, le pouvoir passe' },
      summary: 'La forme choisie n\'est pas l\'annexion mais le protectorat : les institutions ' +
        'tunisiennes subsistent, vidées de leur substance. Le pays se couvre de chemins de fer, de ' +
        'mines et de fermes coloniales, pendant qu\'une élite formée à Sadiki et à Paris invente le ' +
        'nationalisme tunisien — et qu\'un syndicat lui donne sa force de frappe.',
      events: [
        { y: '1881', text: 'Traité du Bardo, complété en 1883 par la convention de La Marsa : le protectorat est en place.' },
        { y: '1907', text: 'Le mouvement des Jeunes Tunisiens réclame l\'accès des Tunisiens aux emplois et aux écoles.' },
        { y: '1920', text: 'Fondation du Destour, premier parti réclamant une constitution.' },
        { y: '1930', text: 'Tahar Haddad publie « Notre femme dans la législation islamique et la société » : le livre le fait exclure, ses idées passeront dans la loi en 1956.' },
        { y: '1934', text: 'Congrès de Ksar Hellal : Bourguiba fonde le Néo-Destour, un parti de masse.' },
        { y: '1942 – 1943', text: 'La campagne de Tunisie : six mois de combats entre l\'Axe et les Alliés, de Kasserine à Bizerte.' },
        { y: '1946', text: 'L\'UGTT de Farhat Hached fait du syndicat un acteur politique de premier plan.' },
        { y: '1952', text: 'Assassinat de Farhat Hached par la Main rouge ; le pays s\'embrase, les fellagas prennent le maquis.' },
        { y: '1956', text: 'Indépendance, le 20 mars.' }
      ],
      figures: [
        { name: 'Habib Bourguiba', note: 'Avocat formé à Paris, stratège de l\'indépendance par étapes, premier président de la République.' },
        { name: 'Farhat Hached', note: 'Fondateur de l\'UGTT : il lie la question sociale et la question nationale. Assassiné en 1952.' },
        { name: 'Tahar Haddad', note: 'Syndicaliste et penseur, défenseur des droits des femmes trente ans avant le Code du statut personnel.' },
        { name: 'Aboul-Kacem Chebbi', note: 'Poète mort à 25 ans. Ses vers — « Si le peuple un jour veut vivre… » — sont dans l\'hymne national.' }
      ],
      legacy: [
        'La ville nouvelle de Tunis et son avenue bordée de ficus, plaquée contre la médina.',
        'Le réseau ferré, les ports et les mines de phosphate de Gafsa, ouvertes en 1899.',
        'Une tradition syndicale exceptionnellement forte, qui pèsera encore en 2011.',
        'Le bilinguisme : le français reste la langue des sciences, de l\'administration et d\'une partie de la presse.'
      ],
      meanwhile: 'La Tunisie est le seul pays du Maghreb où la lutte nationale s\'appuie autant sur un syndicat que sur un parti. C\'est aussi une terre de guerre mondiale : la bataille de Kasserine, en février 1943, est le premier grand affrontement entre l\'armée américaine et la Wehrmacht.',
      turn: 'Après l\'autonomie interne concédée en 1955, le protocole du 20 mars 1956 reconnaît l\'indépendance. Un an plus tard, la monarchie husseinite est abolie et la République proclamée.',
      sites: [
        { name: 'Tunis', lon: 10.18, lat: 36.80, kind: 'capitale' },
        { name: 'Ksar Hellal', lon: 10.89, lat: 35.65, kind: 'site' },
        { name: 'Bizerte', lon: 9.87, lat: 37.27, kind: 'ville' },
        { name: 'Kasserine', lon: 8.83, lat: 35.17, kind: 'site' },
        { name: 'Gafsa', lon: 8.78, lat: 34.42, kind: 'ville' },
        { name: 'Sfax', lon: 10.76, lat: 34.74, kind: 'ville' }
      ]
    },
    {
      id: 'republique', name: 'La Tunisie indépendante', short: 'République', emoji: '🇹🇳',
      period: 'depuis 1956', start: 1956, end: null,
      era: 'moderne', color: '#e8534f',
      seat: 'Tunis',
      rulers: 'Une république : Bourguiba, Ben Ali, puis les présidents élus depuis 2011',
      reach: 'Un État de 163 610 km² et d\'environ 12 millions d\'habitants',
      stat: { value: '13 août 1956', label: 'le Code du statut personnel, cinq mois après l\'indépendance' },
      summary: 'Soixante-dix ans qui commencent par un pari : bâtir un État sur l\'école, la santé et ' +
        'un droit de la famille sans équivalent dans la région. Suivent un long régime autoritaire, ' +
        'puis un soulèvement parti d\'une petite ville du centre qui renverse le pouvoir en ' +
        'vingt-neuf jours et met en marche tout un voisinage.',
      events: [
        { y: '20 mars 1956', text: 'Indépendance. Bourguiba forme le premier gouvernement.' },
        { y: '13 août 1956', text: 'Le Code du statut personnel abolit la polygamie et la répudiation, et fixe un âge minimum au mariage.' },
        { y: '25 juillet 1957', text: 'La monarchie est abolie, la République proclamée.' },
        { y: '1961 – 1963', text: 'Crise de Bizerte, puis évacuation de la dernière base française.' },
        { y: '1978', text: '« Jeudi noir » : la rupture entre l\'UGTT et le régime tourne à l\'affrontement.' },
        { y: '7 novembre 1987', text: 'Ben Ali destitue Bourguiba, déclaré sénile par un collège de médecins.' },
        { y: '17 décembre 2010', text: 'À Sidi Bouzid, Mohamed Bouazizi s\'immole. Le pays entier se soulève.' },
        { y: '14 janvier 2011', text: 'Ben Ali quitte le pouvoir après vingt-trois ans.' },
        { y: '2014', text: 'Adoption d\'une constitution par une assemblée élue.' },
        { y: '2015', text: 'Le Quartet du dialogue national reçoit le prix Nobel de la paix.' },
        { y: '2021 – 2022', text: 'Le président Kaïs Saïed suspend le Parlement, puis fait adopter une nouvelle constitution par référendum.' }
      ],
      figures: [
        { name: 'Habib Bourguiba', note: 'Trente ans au pouvoir : école obligatoire, planning familial, droit de la famille — et un parti unique.' },
        { name: 'Mohamed Bouazizi', note: 'Vendeur ambulant de Sidi Bouzid dont le geste, le 17 décembre 2010, déclenche le soulèvement.' },
        { name: 'Le Quartet du dialogue national', note: 'UGTT, patronat, Ligue des droits de l\'homme et Ordre des avocats : prix Nobel de la paix 2015 pour avoir évité la guerre civile.' },
        { name: 'Radhia Haddad', note: 'Première femme élue au Parlement tunisien, en 1959, et longtemps voix des droits des femmes.' }
      ],
      legacy: [
        'Huit sites classés au patrimoine mondial : Carthage, El Jem, Kerkouane, Dougga, Kairouan, la médina de Tunis, la médina de Sousse et le parc de l\'Ichkeul.',
        'Un droit de la famille qui reste, sur plusieurs points, le plus favorable aux femmes de la région.',
        'Une société largement scolarisée : l\'école publique a été le grand chantier des premières décennies.',
        'Et, sous tout cela, la superposition entière : un site punique, une mosaïque romaine, une mosquée aghlabide et un immeuble haussmannien dans un rayon de trente kilomètres.'
      ],
      meanwhile: 'L\'économie s\'est déplacée vers la côte — tourisme, textile, industries — pendant que l\'intérieur, celui des Capsiens et des révoltes fiscales, reste le parent pauvre. C\'est de là, de Sidi Bouzid et de Kasserine, qu\'est partie la secousse de 2010.',
      turn: 'L\'époque n\'est pas terminée : c\'est la seule de cette page dont on ne connaît pas encore la dernière ligne.',
      sites: [
        { name: 'Tunis', lon: 10.18, lat: 36.80, kind: 'capitale' },
        { name: 'Sidi Bouzid', lon: 9.48, lat: 35.04, kind: 'site' },
        { name: 'Bizerte', lon: 9.87, lat: 37.27, kind: 'ville' },
        { name: 'Sfax', lon: 10.76, lat: 34.74, kind: 'ville' },
        { name: 'Sousse', lon: 10.64, lat: 35.83, kind: 'ville' },
        { name: 'Djerba', lon: 10.85, lat: 33.81, kind: 'ville' },
        { name: 'Gabès', lon: 10.10, lat: 33.88, kind: 'ville' }
      ]
    }
  ];

  /* ── Utilitaires partagés avec la page ─────────────────────── */

  /** L'année de fin d'une époque encore en cours, c'est aujourd'hui. */
  TN.endOf = function (p) {
    return p.end == null ? new Date().getFullYear() : p.end;
  };

  TN.byId = function (id) {
    for (var i = 0; i < TN.periods.length; i++) {
      if (TN.periods[i].id === id) return TN.periods[i];
    }
    return null;
  };

  TN.eraOf = function (key) {
    for (var i = 0; i < TN.eras.length; i++) {
      if (TN.eras[i].key === key) return TN.eras[i];
    }
    return { key: key, label: key, color: '#f0c04b' };
  };

})(window);
