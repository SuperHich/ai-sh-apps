/**
 * La Frise des Empires — les puissances dominantes, de Sumer à nos jours
 * ------------------------------------------------------------------
 * Une entrée par empire. Tout ce que la page affiche vient d'ici :
 * rien n'est écrit en dur dans empires.js.
 *
 * Champs :
 *   id        identifiant stable (ancre d'URL, mémorisation de la fiche ouverte)
 *   name      nom affiché
 *   short     nom court, pour l'étiquette du ruban proportionnel
 *   emoji     pictogramme du nœud sur la frise
 *   period    la période, telle qu'on la lit
 *   start/end bornes en années, négatives avant Jésus-Christ (tri et ruban)
 *   era       clé d'époque, voir EMPIRES.eras. Un empire est rangé à son
 *             apogée, pas à sa naissance : l'Ottoman naît au Moyen Âge mais
 *             règne à l'époque moderne, et c'est là qu'on le trouve.
 *   color     teinte de la fiche : nœud, liseré, halo
 *   seat      capitale ou siège du pouvoir
 *   stat      le chiffre qui frappe, au sommet de la puissance
 *   regions   les territoires dominés, en une phrase
 *   strengths ce qui a fait sa force — trois à cinq points
 *   fall      pourquoi il a disparu
 *   extra     ce qu'on en garde, ou ce qu'on ignore souvent
 *
 * Les dates d'empires sont des conventions d'historiens, pas des certitudes :
 * un empire s'éteint rarement un jour précis. Les bornes retenues sont les
 * plus couramment admises, et le texte dit quand elles sont discutées.
 */
(function (global) {
  'use strict';

  var EM = global.EMPIRES || (global.EMPIRES = {});

  /* Les quatre grandes périodes, dans l'ordre où on les traverse. */
  EM.eras = [
    { key: 'antiquite',    label: 'Antiquité',            short: 'Antiquité',
      blurb: 'Des premières cités à la chute de Rome',      color: '#f0c04b' },
    { key: 'medieval',     label: 'Moyen Âge',            short: 'Moyen Âge',
      blurb: 'De Byzance aux grandes caravanes',            color: '#ff8a5b' },
    { key: 'moderne',      label: 'Époque moderne',       short: 'Moderne',
      blurb: 'Des caravelles aux empires de la poudre',     color: '#4fd8a6' },
    { key: 'contemporain', label: 'Époque contemporaine', short: 'Contemporain',
      blurb: 'Des machines à vapeur au réseau mondial',     color: '#5bb8ff' }
  ];

  EM.empires = [

    /* ═══════════════ ANTIQUITÉ ═══════════════ */
    {
      id: 'sumer', name: 'Les cités de Sumer', emoji: '🧱',
      short: 'Sumer',
      period: 'v. 4000 – 2004 av. J.-C.', start: -4000, end: -2004,
      era: 'antiquite', color: '#f0c04b',
      seat: 'Ourouk, Our, Lagash',
      stat: { value: '80 000', label: 'habitants à Ourouk, la première grande ville' },
      regions: 'La basse Mésopotamie — le sud de l\'Irak actuel, entre le Tigre et l\'Euphrate.',
      strengths: [
        'L\'écriture : le cunéiforme naît vers 3300 av. J.-C. pour compter des sacs d\'orge, et finit par noter des poèmes.',
        'L\'irrigation : des canaux transforment une plaine sèche en grenier à céréales.',
        'La roue de potier, puis la roue de char — et la voile sur le fleuve.',
        'La ville elle-même : temples, entrepôts, scribes, tribunaux. Tout ce qui fait une cité est inventé là.'
      ],
      fall: 'Jamais unifiées, les cités s\'épuisent à se faire la guerre. La terre trop irriguée devient salée et les récoltes chutent. Our, la dernière capitale, tombe vers 2004 av. J.-C. sous les coups des Élamites, et la langue sumérienne s\'éteint comme langue parlée.',
      extra: 'La plus vieille œuvre littéraire connue, l\'Épopée de Gilgamesh, vient de là — un roi qui part chercher l\'immortalité et revient les mains vides. On y lit déjà un déluge et une arche.'
    },
    {
      id: 'egypte', name: 'L\'Égypte des pharaons', emoji: '🔺',
      short: 'Égypte antique',
      period: 'v. 3150 – 30 av. J.-C.', start: -3150, end: -30,
      era: 'antiquite', color: '#e0b24a',
      seat: 'Memphis, puis Thèbes, puis Alexandrie',
      stat: { value: '3 100 ans', label: 'de civilisation continue — un record absolu' },
      regions: 'La vallée et le delta du Nil, la Nubie au sud, et par moments le Levant jusqu\'à la Syrie.',
      strengths: [
        'Le Nil : sa crue dépose chaque année un limon si fertile qu\'il nourrit un État entier.',
        'Une administration de scribes, d\'impôts et d\'archives, mille ans avant tout le monde.',
        'Un calendrier solaire de 365 jours, une géométrie de terrain, une médecine qui recoud et diagnostique.',
        'Les pyramides : celle de Khéops restera le plus haut bâtiment du monde pendant 3 800 ans.'
      ],
      fall: 'Pas un effondrement, une lente absorption. Les Assyriens, puis les Perses, puis Alexandre prennent le pays tour à tour. Après la défaite de Cléopâtre VII à Actium en 31 av. J.-C., Rome en fait une simple province — son grenier à blé.',
      extra: 'Cléopâtre vit plus près de nous, dans le temps, que de la construction de la pyramide de Khéops : 2 000 ans nous séparent d\'elle, mais 2 500 la séparaient de Khéops.'
    },
    {
      id: 'akkad', name: 'L\'empire d\'Akkad', emoji: '⚔️',
      short: 'Akkad',
      period: '2334 – 2154 av. J.-C.', start: -2334, end: -2154,
      era: 'antiquite', color: '#d98f4a',
      seat: 'Akkad (site jamais retrouvé)',
      stat: { value: '1er', label: 'empire multiethnique de l\'histoire' },
      regions: 'Toute la Mésopotamie, de la Syrie à l\'Élam (l\'ouest de l\'Iran), et un accès aux deux mers.',
      strengths: [
        'Sargon, un échanson devenu roi, réunit pour la première fois des peuples qui ne parlaient pas la même langue.',
        'Une armée permanente de 5 400 hommes « qui mangeaient chaque jour devant lui ».',
        'Des gouverneurs nommés par le roi, à la place des rois locaux : l\'invention du fonctionnaire.',
        'Une langue d\'empire, l\'akkadien, qui servira de langue diplomatique pendant 1 500 ans.'
      ],
      fall: 'Une sécheresse brutale, vers 2200 av. J.-C., vide les campagnes du nord. Affamé et traversé de révoltes, l\'empire cède devant les Gutis descendus des monts Zagros. Sa capitale a si complètement disparu qu\'on n\'a jamais retrouvé son emplacement.',
      extra: 'Enheduanna, fille de Sargon et grande prêtresse d\'Our, signe ses hymnes de son nom : c\'est la première autrice identifiée de l\'histoire humaine, 1 700 ans avant Homère.'
    },
    {
      id: 'babylone', name: 'Babylone', emoji: '⚖️',
      short: 'Babylone',
      period: '1894 – 539 av. J.-C.', start: -1894, end: -539,
      era: 'antiquite', color: '#c98fd8',
      seat: 'Babylone',
      stat: { value: '282', label: 'articles au Code d\'Hammurabi, gravés dans la pierre' },
      regions: 'La Mésopotamie centrale et méridionale ; sous Nabuchodonosor II, tout le Levant jusqu\'à Jérusalem.',
      strengths: [
        'Le Code d\'Hammurabi : des lois écrites, affichées en public, les mêmes pour tous — une révolution.',
        'Les mathématiques en base 60, qui nous donnent encore nos 60 minutes et nos 360 degrés.',
        'Une astronomie si précise qu\'elle prédit les éclipses et fonde le zodiaque.',
        'Une position au carrefour des routes : Babylone taxe tout ce qui passe.'
      ],
      fall: 'En 539 av. J.-C., Cyrus le Grand entre dans la ville presque sans combat — le clergé local, brouillé avec le roi Nabonide, lui ouvre les portes. Babylone devient une capitale perse, puis se vide lentement quand Séleucie détourne son commerce.',
      extra: 'Les jardins suspendus comptaient parmi les sept merveilles du monde… mais aucune fouille n\'en a jamais trouvé la trace à Babylone. Certains historiens pensent qu\'ils étaient en réalité à Ninive.'
    },
    {
      id: 'assyrie', name: 'L\'empire assyrien', emoji: '🏹',
      short: 'Assyrie',
      period: '911 – 609 av. J.-C.', start: -911, end: -609,
      era: 'antiquite', color: '#d0603f',
      seat: 'Assur, puis Ninive',
      stat: { value: '1,4 M km²', label: 'au sommet, de l\'Iran à l\'Égypte' },
      regions: 'La Mésopotamie, la Syrie, le Levant, une partie de l\'Anatolie et, brièvement, l\'Égypte.',
      strengths: [
        'La première armée de métier du monde : payée, entraînée toute l\'année, équipée de fer.',
        'Un génie du siège — béliers, tours mobiles, tunnels — devant lequel aucune muraille ne tenait.',
        'Un réseau de routes à relais qui portait un message d\'un bout à l\'autre de l\'empire en quelques jours.',
        'La bibliothèque d\'Assurbanipal à Ninive : plus de 30 000 tablettes rassemblées volontairement.'
      ],
      fall: 'Un empire tenu par la terreur ne survit pas à ses guerres civiles. Après la mort d\'Assurbanipal, les fils se déchirent ; Mèdes et Babyloniens s\'allient et rasent Ninive en 612 av. J.-C. La chute est si totale que 200 ans plus tard, les Grecs qui passent sur le site ignorent quelle ville s\'y trouvait.',
      extra: 'C\'est cette bibliothèque, brûlée puis enfouie sous ses propres murs, qui a cuit les tablettes d\'argile et les a conservées. Sans l\'incendie de Ninive, nous n\'aurions jamais lu Gilgamesh.'
    },
    {
      id: 'perse', name: 'L\'empire perse achéménide', emoji: '🦁',
      short: 'Perse achéménide',
      period: '550 – 330 av. J.-C.', start: -550, end: -330,
      era: 'antiquite', color: '#4fd8a6',
      seat: 'Persépolis, Suse, Babylone, Ecbatane',
      stat: { value: '≈ 44 %', label: 'de l\'humanité sous un même sceptre — jamais égalé' },
      regions: 'De la vallée de l\'Indus à la Thrace, en passant par l\'Égypte, l\'Anatolie et l\'Asie centrale.',
      strengths: [
        'Les satrapies : vingt provinces autonomes, chacune libre de sa langue et de ses dieux, reliées au roi par l\'impôt.',
        'La Route royale, 2 700 km de Suse à Sardes, parcourue en une semaine par des cavaliers en relais.',
        'La tolérance comme politique : Cyrus renvoie les Juifs de Babylone chez eux et fait rebâtir leur Temple.',
        'La darique, une monnaie d\'or reconnue partout, et un système d\'impôts fixé par écrit.'
      ],
      fall: 'Alexandre le Grand. Trois batailles suffisent — Granique, Issos, Gaugamèles en 331 av. J.-C. Darius III fuit et est assassiné par son propre satrape. Persépolis brûle en 330. Un empire de deux siècles s\'effondre en quatre ans.',
      extra: 'Le cylindre de Cyrus, retrouvé à Babylone, est souvent présenté comme la première déclaration des droits — une copie trône au siège de l\'ONU. Les historiens y voient plutôt une proclamation royale classique, mais son ton de tolérance reste exceptionnel pour l\'époque.'
    },
    {
      id: 'alexandre', name: 'L\'empire d\'Alexandre', emoji: '🐎',
      short: 'Alexandre',
      period: '336 – 323 av. J.-C. (royaumes jusqu\'en 30 av. J.-C.)', start: -336, end: -323,
      era: 'antiquite', color: '#5bb8ff',
      seat: 'Babylone (capitale projetée)',
      stat: { value: '13 ans', label: 'pour conquérir de la Grèce à l\'Indus' },
      regions: 'La Grèce, l\'Égypte, tout l\'ancien empire perse, jusqu\'au Pendjab.',
      strengths: [
        'La phalange macédonienne et ses sarisses de six mètres : un mur de pointes qu\'aucune infanterie n\'entamait.',
        'Une cavalerie d\'élite lancée au moment exact où la ligne adverse s\'ouvrait — la signature tactique d\'Alexandre.',
        'Une politique de fusion : il épouse une princesse perse, garde les satrapes en place, marie 10 000 de ses soldats à des Asiatiques.',
        'Une chaîne de villes neuves, dont Alexandrie d\'Égypte et sa bibliothèque.'
      ],
      fall: 'Alexandre meurt à Babylone à 32 ans, sans héritier en âge de régner. À la question « à qui l\'empire ? », il aurait répondu « au plus fort ». Ses généraux, les diadoques, se déchirent quarante ans durant et découpent l\'ensemble en trois royaumes.',
      extra: 'Il aurait fondé une soixantaine de villes, dont une vingtaine baptisées Alexandrie. L\'une d\'elles, Alexandrie d\'Arachosie, est devenue Kandahar — le nom vient de « Iskandar », Alexandre en persan.'
    },
    {
      id: 'maurya', name: 'L\'empire Maurya', emoji: '☸️',
      short: 'Maurya',
      period: '322 – 185 av. J.-C.', start: -322, end: -185,
      era: 'antiquite', color: '#ffab3d',
      seat: 'Pataliputra (Patna)',
      stat: { value: '5 M km²', label: 'presque tout le sous-continent indien' },
      regions: 'L\'Inde, le Pakistan, le Bangladesh et une partie de l\'Afghanistan.',
      strengths: [
        'Une administration décrite par l\'Arthashastra, traité de gouvernement d\'un réalisme glaçant.',
        'Une armée immense — les sources grecques parlent de 9 000 éléphants de guerre.',
        'Les édits d\'Ashoka, gravés sur des rochers et des piliers dans tout l\'empire : le premier gouvernement à publier sa morale.',
        'Des routes plantées d\'arbres, des puits, des hôpitaux — pour les hommes comme pour les bêtes.'
      ],
      fall: 'Après Ashoka, les successeurs sont faibles et l\'empire trop vaste pour être tenu depuis Pataliputra. En 185 av. J.-C., le général Pushyamitra Shunga assassine le dernier empereur Brihadratha à sa propre revue militaire et fonde sa dynastie.',
      extra: 'Ashoka se convertit au bouddhisme après avoir massacré le Kalinga : 100 000 morts, dit son propre édit, qui exprime des remords. C\'est peut-être le seul conquérant de l\'histoire à avoir fait graver ses regrets dans la pierre. Sa roue orne aujourd\'hui le drapeau de l\'Inde.'
    },
    {
      id: 'han', name: 'La Chine des Han', emoji: '🐉',
      short: 'Chine des Han',
      period: '206 av. J.-C. – 220 ap. J.-C.', start: -206, end: 220,
      era: 'antiquite', color: '#ff6f9c',
      seat: 'Chang\'an, puis Luoyang',
      stat: { value: '57 M', label: 'habitants recensés en l\'an 2 — le premier recensement au monde' },
      regions: 'La Chine, le nord du Vietnam, le nord de la Corée et les oasis d\'Asie centrale.',
      strengths: [
        'Le papier, le sismographe, la brouette, le gouvernail d\'étambot, le haut-fourneau : une avance technique de plusieurs siècles.',
        'Le concours de mandarins : on entre dans l\'administration par examen, pas par naissance.',
        'La Route de la soie, ouverte par l\'ambassade de Zhang Qian, qui relie Chang\'an à Rome.',
        'Un État qui tient les greniers, les prix du sel et du fer, et les canaux.'
      ],
      fall: 'Les eunuques du palais et les clans de l\'impératrice paralysent le pouvoir ; les grands domaines échappent à l\'impôt. La révolte des Turbans jaunes en 184 met le feu aux campagnes, les généraux se taillent des fiefs, et l\'empire éclate en 220 en Trois Royaumes.',
      extra: 'Les Chinois s\'appellent encore aujourd\'hui « les Han », l\'écriture s\'appelle « caractères han » et la langue « langue han ». Une dynastie tombée depuis 1 800 ans donne toujours son nom au groupe humain le plus nombreux de la planète.'
    },
    {
      id: 'rome', name: 'L\'empire romain', emoji: '🏛️',
      short: 'Rome',
      period: '27 av. J.-C. – 476 (Rome dès 753 av. J.-C.)', start: -27, end: 476,
      era: 'antiquite', color: '#ff8a5b',
      seat: 'Rome, puis Milan et Ravenne',
      stat: { value: '80 000 km', label: 'de routes pavées — « tous les chemins mènent à Rome »' },
      regions: 'Tout le pourtour méditerranéen, la Gaule, l\'Espagne, la Bretagne, les Balkans, l\'Afrique du Nord et le Proche-Orient.',
      strengths: [
        'Le droit romain : contrats, propriété, procédure. La moitié des codes civils du monde en descendent.',
        'Une armée d\'ingénieurs autant que de soldats — camps, ponts, routes, aqueducs.',
        'La citoyenneté offerte aux vaincus : on devient romain sans être né à Rome.',
        'Le béton à la pouzzolane, qui prend sous l\'eau et dont les ports tiennent encore.'
      ],
      fall: 'Pas une cause, un enchaînement : la crise du IIIe siècle et ses cinquante empereurs, la monnaie dévaluée, l\'impôt écrasant, la division de 395 en deux empires, puis la poussée des peuples germaniques eux-mêmes chassés par les Huns. En 476, le chef Odoacre dépose Romulus Augustule et n\'a même pas l\'idée de se proclamer empereur : le titre ne valait plus rien.',
      extra: 'Le béton romain se répare tout seul : des grumeaux de chaux vive y libèrent du calcium quand une fissure prend l\'eau, et la referment. On n\'a compris le mécanisme qu\'en 2023.'
    },

    /* ═══════════════ MOYEN ÂGE ═══════════════ */
    {
      id: 'byzance', name: 'L\'empire byzantin', emoji: '⛪',
      short: 'Byzance',
      period: '330 – 1453', start: 330, end: 1453,
      era: 'medieval', color: '#b18cff',
      seat: 'Constantinople',
      stat: { value: '1 123 ans', label: 'de résistance depuis la fondation de Constantinople' },
      regions: 'L\'Anatolie et les Balkans, et sous Justinien l\'Italie, l\'Afrique du Nord et le sud de l\'Espagne.',
      strengths: [
        'Les murailles de Théodose : triple enceinte, fossé, 96 tours. Elles arrêtent tout le monde pendant mille ans.',
        'Le feu grégeois, un liquide enflammé projeté depuis les navires, qui brûlait sur l\'eau — la formule est perdue.',
        'Le Corpus Juris Civilis de Justinien, qui sauve et remet en ordre tout le droit romain.',
        'Le solidus d\'or, monnaie stable pendant sept siècles : le dollar du Moyen Âge.'
      ],
      fall: 'Le coup mortel n\'est pas venu de l\'Orient mais de l\'Occident : en 1204, la quatrième croisade détourne sa route et pille Constantinople. L\'empire s\'en relève mutilé et ruiné. En 1453, Mehmed II l\'achève avec des canons de sept mètres qui ouvrent enfin les murailles.',
      extra: 'Ils ne se disaient jamais « byzantins » — ce mot est une invention d\'historiens du XVIe siècle. Ils se disaient « Rhômaioi » : Romains. Pour eux, l\'empire romain n\'était jamais tombé.'
    },
    {
      id: 'califats', name: 'Les califats et l\'âge d\'or islamique', emoji: '🕌',
      short: 'Califats',
      period: '632 – 1258', start: 632, end: 1258,
      era: 'medieval', color: '#4fd8a6',
      seat: 'Damas (Omeyyades), puis Bagdad (Abbassides)',
      stat: { value: '11 M km²', label: 'de l\'Atlantique à l\'Indus, en moins d\'un siècle' },
      regions: 'L\'Espagne, le Maghreb, l\'Égypte, l\'Arabie, le Levant, la Perse et l\'Asie centrale jusqu\'à l\'Indus.',
      strengths: [
        'La Maison de la Sagesse à Bagdad : on y traduit Aristote, Galien et les mathématiciens indiens, et on les dépasse.',
        'Al-Khwarizmi fonde l\'algèbre ; Ibn al-Haytham fonde l\'optique et la méthode expérimentale ; Ibn Sina écrit le manuel de médecine de l\'Europe pour cinq siècles.',
        'Le papier, appris des Chinois en 751, qui rend le livre abordable et l\'administration possible.',
        'Des hôpitaux publics gratuits, et à Fès, en 859, l\'université Al-Quaraouiyine — la plus ancienne encore en activité.'
      ],
      fall: 'L\'empire se morcelle très tôt en émirats rivaux ; le calife de Bagdad n\'est plus qu\'un arbitre sans armée. En 1258, le Mongol Hulagu prend Bagdad, exécute le calife et jette, dit-on, les bibliothèques dans le Tigre, dont l\'eau serait devenue noire d\'encre.',
      extra: 'Nos chiffres, nos mots « algèbre », « algorithme », « chimie », « zéro », « coton », « sucre », « sirop », « amiral » viennent de l\'arabe. Et « algorithme » n\'est rien d\'autre que le nom d\'al-Khwarizmi, passé par le latin.'
    },
    {
      id: 'mongols', name: 'L\'empire mongol', emoji: '🏇',
      short: 'Mongols',
      period: '1206 – 1368', start: 1206, end: 1368,
      era: 'medieval', color: '#5bb8ff',
      seat: 'Karakorum, puis Khanbaliq (Pékin)',
      stat: { value: '24 M km²', label: 'le plus grand empire d\'un seul tenant de l\'histoire' },
      regions: 'De la mer de Chine à la Hongrie : Chine, Corée, Asie centrale, Perse, Russie, Caucase.',
      strengths: [
        'L\'archer monté : deux ou trois chevaux par cavalier, un arc composite qui perce à 200 mètres, et 100 km par jour.',
        'Le yam, un réseau de relais de poste qui portait un ordre d\'un bout à l\'autre de l\'Eurasie en un mois.',
        'La méritocratie : Gengis Khan promeut ses généraux au talent, y compris d\'anciens ennemis.',
        'La tolérance religieuse et l\'exemption d\'impôt pour tous les clergés — et la protection des artisans et des marchands.'
      ],
      fall: 'Trop grand pour un seul homme. À la mort de Gengis, l\'empire est partagé entre ses fils et devient quatre khanats qui finissent par se faire la guerre. La peste noire ravage les routes, et en 1368 la révolte chinoise des Ming chasse la dynastie Yuan de Pékin.',
      extra: 'La Pax Mongolica a rendu les routes si sûres qu\'un marchand pouvait aller de Venise à Pékin — c\'est le voyage de Marco Polo. Mais ces mêmes routes ont porté la peste noire jusqu\'en Europe, où elle a tué un tiers de la population.'
    },
    {
      id: 'mali', name: 'L\'empire du Mali', emoji: '🌾',
      short: 'Mali',
      period: 'v. 1235 – 1670', start: 1235, end: 1670,
      era: 'medieval', color: '#f0c04b',
      seat: 'Niani, puis Tombouctou comme foyer savant',
      stat: { value: '≈ 50 %', label: 'de l\'or en circulation dans le Vieux Monde' },
      regions: 'L\'Afrique de l\'Ouest : le Mali, le Sénégal, la Gambie, la Guinée, la Mauritanie du Sud et le Niger.',
      strengths: [
        'L\'or des mines de Bambouk et de Bouré, échangé contre le sel du Sahara — à poids égal.',
        'Le contrôle des caravanes transsahariennes, et donc de tout le commerce entre l\'Afrique noire et la Méditerranée.',
        'Tombouctou et Djenné : la mosquée de Sankoré rassemble des milliers d\'étudiants et une bibliothèque de manuscrits.',
        'La Charte du Manden, vers 1236 : un texte oral qui proclame l\'inviolabilité de la vie humaine et interdit la mise en esclavage des captifs de guerre.'
      ],
      fall: 'Des querelles de succession affaiblissent le pouvoir central ; les provinces se détachent. L\'empire Songhaï lui prend Tombouctou et Djenné au XVe siècle, les Touaregs mordent au nord, et le commerce bascule vers les caravelles portugaises qui longent la côte — le Sahara cesse d\'être la route de l\'or.',
      extra: 'En 1324, l\'empereur Mansa Moussa traverse l\'Égypte pour son pèlerinage à La Mecque avec une escorte immense et distribue tant d\'or au Caire que le cours du métal s\'y effondre pour une dizaine d\'années. Il est souvent présenté comme l\'homme le plus riche de tous les temps — une estimation invérifiable, mais qui dit l\'impression laissée.'
    },
    {
      id: 'ottoman', name: 'L\'empire ottoman', emoji: '🌙',
      short: 'Ottomans',
      period: '1299 – 1922', start: 1299, end: 1922,
      era: 'moderne', color: '#e8534f',
      seat: 'Bursa, Edirne, puis Constantinople / Istanbul',
      stat: { value: '623 ans', label: 'sous une seule dynastie, celle d\'Osman' },
      regions: 'Les Balkans, l\'Anatolie, le Levant, l\'Égypte, l\'Afrique du Nord, l\'Arabie et le pourtour de la mer Noire.',
      strengths: [
        'Les janissaires : une infanterie permanente, disciplinée, dotée d\'armes à feu bien avant les armées d\'Europe.',
        'Une artillerie de siège inégalée — les canons qui ouvrent Constantinople en 1453 sont les plus gros du monde.',
        'Le système des millets : chaque communauté religieuse garde ses lois, ses écoles et ses tribunaux.',
        'Une position qui commande les détroits, donc tout le commerce entre l\'Europe et l\'Asie.'
      ],
      fall: 'Le décrochage commence quand l\'Europe contourne l\'empire par la mer et double sa production avec des machines. Les nationalismes détachent un à un les Balkans au XIXe siècle. L\'entrée dans la Première Guerre mondiale aux côtés de l\'Allemagne achève le pays : le sultanat est aboli en 1922, la République turque proclamée en 1923.',
      extra: 'Le café arrive en Europe par les Ottomans — les sacs abandonnés devant Vienne après le siège de 1683 ont, selon la légende, servi à ouvrir les premiers cafés viennois. Le croissant, lui, est né de la même histoire… racontée bien plus tard.'
    },

    /* ═══════════════ ÉPOQUE MODERNE ═══════════════ */
    {
      id: 'azteque', name: 'L\'empire aztèque', emoji: '🦅',
      short: 'Aztèques',
      period: '1428 – 1521', start: 1428, end: 1521,
      era: 'moderne', color: '#ff8a5b',
      seat: 'Tenochtitlan (Mexico)',
      stat: { value: '200 000', label: 'habitants à Tenochtitlan — plus que Paris à la même date' },
      regions: 'Le centre et le sud du Mexique actuel, du Pacifique au golfe.',
      strengths: [
        'Les chinampas : des jardins flottants sur le lac qui donnaient jusqu\'à sept récoltes par an.',
        'Une capitale bâtie sur une île, reliée par des chaussées, avec aqueduc d\'eau douce et rues nettoyées chaque jour.',
        'La Triple Alliance et un système de tribut qui faisait affluer cacao, plumes, coton et or de tout le Mexique.',
        'Le marché de Tlatelolco, où les Espagnols stupéfaits comptent 60 000 personnes en un seul jour.'
      ],
      fall: 'Cortés débarque en 1519 avec moins de 600 hommes — mais il rallie les peuples soumis, à commencer par les Tlaxcaltèques, qui haïssaient le tribut aztèque. La variole, apportée par les Européens, emporte peut-être la moitié de la population avant même le siège. Tenochtitlan tombe en août 1521.',
      extra: 'Le chocolat, la tomate, l\'avocat, le piment, la dinde et le maïs viennent de ce monde-là. Le mot « chocolat » vient du nahuatl *xocolatl*, et « avocat » de *ahuacatl*.'
    },
    {
      id: 'inca', name: 'L\'empire inca', emoji: '⛰️',
      short: 'Incas',
      period: '1438 – 1533', start: 1438, end: 1533,
      era: 'moderne', color: '#4fd8a6',
      seat: 'Cuzco',
      stat: { value: '40 000 km', label: 'de routes de montagne, sans roue ni cheval' },
      regions: 'La cordillère des Andes sur 4 000 km : Pérou, Équateur, Bolivie, nord du Chili et de l\'Argentine.',
      strengths: [
        'Le Qhapaq Ñan, réseau routier avec ponts de corde, tunnels et escaliers taillés dans la falaise.',
        'Les chasquis, coureurs en relais, qui portaient un message de Quito à Cuzco — 2 000 km — en une semaine.',
        'Les quipus : des cordelettes à nœuds qui tenaient toute la comptabilité d\'un empire sans écriture.',
        'Des greniers d\'État répartis partout : pas de monnaie, mais personne ne mourait de faim après une mauvaise récolte.'
      ],
      fall: 'Une guerre civile entre les frères Huáscar et Atahualpa venait de déchirer l\'empire quand Pizarro arrive avec 168 hommes en 1532. La variole, arrivée avant les Espagnols, avait déjà tué l\'empereur Huayna Capac et son héritier. Atahualpa est capturé par ruse à Cajamarca, puis exécuté.',
      extra: 'Les murs incas sont ajustés au millimètre sans une goutte de mortier — on ne peut pas y glisser une lame de couteau. Et ils tiennent debout après cinq siècles de séismes qui ont abattu les églises coloniales bâties par-dessus.'
    },
    {
      id: 'espagne', name: 'L\'empire espagnol', emoji: '⛵',
      short: 'Espagne',
      period: '1492 – 1898', start: 1492, end: 1898,
      era: 'moderne', color: '#f0c04b',
      seat: 'Madrid',
      stat: { value: '13,7 M km²', label: 'et le premier empire « où le soleil ne se couche jamais »' },
      regions: 'Les Amériques du Mexique à l\'Argentine, les Philippines, les Pays-Bas, l\'Italie du Sud et des comptoirs africains.',
      strengths: [
        'L\'argent de Potosí, une montagne entière de métal qui finance les guerres de l\'Europe pendant deux siècles.',
        'Le galion de Manille, qui relie l\'Amérique à l\'Asie : la première fois que les marchandises font le tour du monde.',
        'Les tercios, formations d\'infanterie réputées invincibles pendant plus d\'un siècle.',
        'Une langue et un droit exportés à un continent entier, avec des universités dès 1551 à Lima et Mexico.'
      ],
      fall: 'L\'argent américain provoque une inflation qui ruine l\'économie intérieure ; l\'Espagne s\'endette et fait banqueroute plusieurs fois tout en finançant des guerres permanentes. Les colonies s\'émancipent entre 1810 et 1825, et la guerre de 1898 contre les États-Unis lui enlève ses derniers territoires : Cuba, Porto Rico, les Philippines.',
      extra: 'La conquête a coûté à l\'Amérique un effondrement démographique sans équivalent : la variole, la rougeole et le typhus, contre lesquels les populations n\'avaient aucune défense, ont emporté une part immense des habitants en un siècle. L\'espagnol, lui, est parlé aujourd\'hui par près de 500 millions de personnes.'
    },
    {
      id: 'moghol', name: 'L\'empire moghol', emoji: '🕋',
      short: 'Moghols',
      period: '1526 – 1857', start: 1526, end: 1857,
      era: 'moderne', color: '#b18cff',
      seat: 'Agra, puis Delhi',
      stat: { value: '≈ 25 %', label: 'de la production mondiale vers 1700' },
      regions: 'L\'Inde, le Pakistan, le Bangladesh et une partie de l\'Afghanistan.',
      strengths: [
        'Une richesse agricole et textile inouïe : les cotonnades indiennes habillent l\'Europe et l\'Afrique.',
        'Le système mansabdari d\'Akbar : des officiers classés par rang, payés par l\'État, non héréditaires.',
        'Une politique de tolérance sous Akbar — impôt sur les non-musulmans supprimé, débats interreligieux à la cour.',
        'Une architecture au sommet de son art : le Taj Mahal, le Fort Rouge, la mosquée de Delhi.'
      ],
      fall: 'Les guerres du Deccan menées par Aurangzeb vident le trésor et durent vingt-six ans. En 1739, le Persan Nader Shah pille Delhi et emporte le trône du Paon. Les provinces deviennent indépendantes, la Compagnie anglaise des Indes s\'installe dans le vide après Plassey en 1757, et le dernier empereur est déposé et exilé en 1858 après la révolte des cipayes.',
      extra: 'Le mot français « mogul » ou « magnat » — un mogul du cinéma, un magnat de la presse — vient directement de ces empereurs, tant leur richesse avait frappé l\'Europe.'
    },

    /* ═══════════════ ÉPOQUE CONTEMPORAINE ═══════════════ */
    {
      id: 'britannique', name: 'L\'empire britannique', emoji: '⚓',
      short: 'Britannique',
      period: '1583 – 1997', start: 1583, end: 1997,
      era: 'contemporain', color: '#5bb8ff',
      seat: 'Londres',
      stat: { value: '35,5 M km²', label: 'en 1920 — un quart des terres et un quart de l\'humanité' },
      regions: 'L\'Inde, le Canada, l\'Australie, l\'Afrique de l\'Est et de l\'Ouest, les Caraïbes, la Malaisie, Hong Kong.',
      strengths: [
        'La Royal Navy, plus puissante que les deux flottes suivantes réunies : elle tient les mers, donc le commerce.',
        'La révolution industrielle, née là : charbon, vapeur, acier, chemins de fer, usines.',
        'Le télégraphe sous-marin, qui met Londres à quelques minutes de Bombay — l\'internet du XIXe siècle.',
        'La City, la livre sterling et une finance qui prête au monde entier.'
      ],
      fall: 'Les deux guerres mondiales laissent le pays victorieux et ruiné, débiteur des États-Unis. Les mouvements d\'indépendance, portés en Inde par Gandhi, deviennent irrésistibles : l\'Inde et le Pakistan partent en 1947, l\'Afrique dans les années 1960. La rétrocession de Hong Kong à la Chine, le 1er juillet 1997, en marque la fin symbolique.',
      extra: 'Il en reste le méridien de Greenwich et nos fuseaux horaires, le football, et une langue parlée aujourd\'hui par plus d\'un milliard et demi de personnes — presque toutes ailleurs qu\'en Angleterre.'
    },
    {
      id: 'russie-urss', name: 'La Russie impériale, puis l\'URSS', emoji: '❄️',
      short: 'Russie / URSS',
      period: '1721 – 1991', start: 1721, end: 1991,
      era: 'contemporain', color: '#e8534f',
      seat: 'Saint-Pétersbourg, puis Moscou',
      stat: { value: '22,4 M km²', label: 'et onze fuseaux horaires d\'un seul pays' },
      regions: 'De la Baltique au Pacifique : Russie, Ukraine, Caucase, Asie centrale, Sibérie — et l\'Europe de l\'Est sous influence.',
      strengths: [
        'La profondeur : aucun envahisseur, ni Napoléon ni Hitler, n\'a jamais eu assez d\'espace et d\'hiver devant lui.',
        'Une industrialisation forcée qui, en dix ans, fait passer un pays agricole au rang de puissance sidérurgique — au prix de millions de morts.',
        'La victoire de 1945, obtenue sur le front qui a détruit l\'essentiel de la Wehrmacht.',
        'La conquête spatiale : Spoutnik en 1957, Gagarine en 1961 — l\'Union soviétique est la première dans l\'espace.'
      ],
      fall: 'Une économie planifiée incapable de nourrir ses magasins pendant qu\'elle finance la course aux armements et la guerre d\'Afghanistan. Tchernobyl, en 1986, entame la confiance ; la glasnost libère la parole et les nationalismes. Le 26 décembre 1991, l\'Union soviétique se dissout d\'elle-même en quinze États.',
      extra: 'C\'est le seul grand empire de l\'histoire à s\'être défait sans guerre de sécession ni invasion : un vote, une signature, et le drapeau rouge descendu du Kremlin un soir de décembre.'
    },
    {
      id: 'monde-actuel', name: 'Le monde d\'aujourd\'hui', emoji: '🌐',
      short: 'Monde actuel',
      period: '1945 → aujourd\'hui', start: 1945, end: null,
      era: 'contemporain', color: '#4fd8a6',
      seat: 'Washington, Pékin, Bruxelles, Bangalore…',
      stat: { value: '8 milliards', label: 'd\'humains, reliés par le même réseau' },
      regions: 'Le monde entier — mais la domination n\'est plus territoriale : elle est monétaire, technique et culturelle.',
      strengths: [
        'Les États-Unis sortent de 1945 avec la moitié de la production mondiale, la bombe, et une monnaie devenue celle de tous.',
        'Le dollar, les satellites, l\'internet né d\'ARPANET en 1969, et une culture qui voyage plus vite qu\'aucune armée.',
        'La Chine passe de l\'atelier du monde au premier rang industriel en une génération ; l\'Inde devient le pays le plus peuplé.',
        'Des institutions — ONU, OMS, traités — qui, pour la première fois, essaient de gouverner ensemble ce que les empires prenaient par la force.'
      ],
      fall: 'Aucun empire n\'occupe plus la place. Le monde est devenu multipolaire, et la puissance se joue en brevets, en semi-conducteurs, en câbles sous-marins et en réseaux plutôt qu\'en provinces conquises. Reste la vraie question de notre siècle : le climat et les ressources, qui ne se laissent ni annexer ni négocier.',
      extra: 'Leçon commune à toutes les fiches de cette frise : aucun empire ne s\'est cru mortel, et tous le sont. Le plus long, l\'Égypte, a tenu trente et un siècles ; le plus vaste, le mongol, à peine cent soixante ans.'
    }

  ];

})(window);
