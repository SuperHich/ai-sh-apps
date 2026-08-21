/**
 * Les Âges de la France — les époques traversées par le territoire
 * ------------------------------------------------------------------
 * Même moteur que la Tunisie (assets/js/ages.js), mêmes champs : voir
 * assets/js/tunisie-data.js pour leur description complète. Une page
 * charge un jeu de données et un seul, publié dans window.AGES.
 *
 * Le fil est celui du **territoire**, pas d'un État : l'hexagone a été
 * gaulois, romain, franc, féodal, royal, révolutionnaire et républicain
 * sans jamais cesser d'être habité par les mêmes gens. Les époques se
 * suivent donc sans trou, la fin de l'une étant le début de la suivante.
 *
 * Les bornes sont des conventions d'historiens. 481 pour Clovis, 987 pour
 * Hugues Capet, 1453 pour la fin de la guerre de Cent Ans : ce sont des
 * repères commodes, pas des ruptures nettes — le texte le dit quand la
 * date est discutée.
 */
(function (global) {
  'use strict';

  var FR = {};

  FR.key = 'france';

  /* Le pays est presque aussi large que haut : on coupe les étiquettes au
     méridien de Paris, ce qui envoie les villes de l'Ouest vers
     l'Atlantique et celles de l'Est vers le Rhin — de la place des deux
     côtés. */
  FR.labelSplit = 2.0;

  /* ══════════════════════════════════════════════════════════════
     LE DESSIN DU PAYS
     Une cinquantaine de points : de quoi reconnaître la Bretagne, le
     cap Gris-Nez et le coude du Rhin, pas de quoi mesurer une côte.
     ══════════════════════════════════════════════════════════════ */
  FR.outline = [
    [2.37, 51.03], [1.85, 50.95], [1.58, 50.87], [1.37, 50.06], [0.11, 49.49],
    [-0.30, 49.35], [-1.26, 49.34], [-1.28, 49.68], [-1.62, 49.68], [-1.58, 48.83], [-2.02, 48.65], [-3.05, 48.78],
    [-4.49, 48.39], [-4.73, 48.04], [-3.37, 47.72], [-2.20, 47.28], [-1.78, 46.50],
    [-1.15, 46.16], [-1.03, 45.62], [-1.16, 44.66], [-1.55, 43.48], [-1.79, 43.35],
    [-0.75, 42.95], [0.65, 42.70], [1.45, 42.50], [2.00, 42.35], [3.03, 42.43],
    [3.05, 43.02], [3.70, 43.40], [4.85, 43.35], [5.35, 43.28], [6.15, 43.05],
    [7.27, 43.70], [7.53, 43.78], [6.90, 44.35], [6.65, 45.10], [7.02, 45.63],
    [6.80, 46.13], [6.15, 46.15], [6.10, 46.45], [6.45, 46.78], [7.00, 47.35],
    [7.58, 47.58], [7.80, 48.60], [8.23, 48.97], [7.60, 49.05], [6.85, 49.20],
    [6.36, 49.47], [5.85, 49.55], [4.85, 50.15], [4.15, 50.28], [3.65, 50.35],
    [3.25, 50.72], [2.55, 50.80]
  ];

  FR.islands = [
    { name: 'Corse', points: [[8.57, 42.97], [9.35, 43.00], [9.55, 42.15], [9.40, 41.38],
                              [8.80, 41.55], [8.55, 42.35]] }
  ];

  FR.labels = [
    { text: 'Manche',            lon: 0.10,  lat: 50.30, anchor: 'middle' },
    { text: 'Océan Atlantique',  lon: -2.30, lat: 45.30, anchor: 'middle' },
    { text: 'Méditerranée',      lon: 5.30,  lat: 42.30, anchor: 'middle' },
    { text: 'Espagne',           lon: 0.20,  lat: 42.05, anchor: 'middle' },
    { text: 'Allemagne',         lon: 8.05,  lat: 49.60, anchor: 'start' },
    { text: 'Italie',            lon: 7.35,  lat: 44.70, anchor: 'start' }
  ];

  /* ══════════════════════════════════════════════════════════════
     LES CINQ GRANDS ÂGES
     ══════════════════════════════════════════════════════════════ */
  FR.eras = [
    { key: 'origines',     label: 'Aux origines',            short: 'Origines',
      blurb: 'Des grottes ornées aux premiers villages',       color: '#c9973f' },
    { key: 'antiquite',    label: 'L\'Antiquité',            short: 'Antiquité',
      blurb: 'La Gaule, celtique puis romaine',                color: '#f0c04b' },
    { key: 'medieval',     label: 'Le Moyen Âge',            short: 'Moyen Âge',
      blurb: 'Mille ans, trois dynasties et une guerre de cent ans', color: '#4fd8a6' },
    { key: 'moderne',      label: 'L\'époque moderne',       short: 'Moderne',
      blurb: 'Des châteaux de la Loire à Versailles',          color: '#b18cff' },
    { key: 'contemporain', label: 'L\'époque contemporaine', short: 'Contemporain',
      blurb: 'De la Bastille à aujourd\'hui',                  color: '#5bb8ff' }
  ];

  FR.periods = [

    /* ═══════════════ AUX ORIGINES ═══════════════ */
    {
      id: 'prehistoire', name: 'Les premiers hommes', short: 'Préhistoire', emoji: '🦬',
      period: 'v. 40 000 – 800 av. J.-C.', start: -40000, end: -800, scaled: false,
      era: 'origines', color: '#c9973f',
      seat: 'Pas de ville : des abris sous roche, puis des villages de bois et de terre',
      rulers: 'Des bandes de chasseurs, puis des paysans, puis des chefferies de l\'âge du bronze',
      reach: 'Tout le territoire, des grottes du Périgord aux alignements de Bretagne',
      stat: { value: '36 000 ans', label: 'pour les peintures de la grotte Chauvet, les plus anciennes connues' },
      summary: 'Quarante mille ans avant qu\'on écrive le premier mot ici, des hommes peignent ' +
        'des lions et des rhinocéros au fond d\'une grotte ardéchoise. Puis le climat se réchauffe, ' +
        'la forêt avance, et les chasseurs deviennent paysans : ils défrichent, sèment, dressent ' +
        'des pierres de vingt tonnes et fondent le bronze. Tout cela sans une ligne d\'archive.',
      events: [
        { y: 'v. 36 000 av. J.-C.', text: 'La grotte Chauvet est peinte : 425 animaux, un art déjà maîtrisé dès sa première trace.' },
        { y: 'v. 17 000 av. J.-C.', text: 'Lascaux. La grotte sera retrouvée en 1940 par quatre adolescents cherchant leur chien.' },
        { y: 'v. 4 500 av. J.-C.', text: 'Premiers alignements de Carnac : près de 3 000 menhirs plantés sur quatre kilomètres.' },
        { y: 'v. 2 000 av. J.-C.', text: 'L\'âge du bronze : l\'étain vient de Cornouailles, le cuivre des Alpes. Le territoire commerce déjà loin.' },
        { y: 'v. 800 av. J.-C.', text: 'Le fer arrive, et avec lui les peuples que les Romains appelleront gaulois.' }
      ],
      figures: [
        { name: 'L\'homme de Tautavel', note: 'Un crâne de 450 000 ans trouvé dans les Pyrénées-Orientales : le plus ancien habitant connu du pays.' },
        { name: 'L\'homme de Cro-Magnon', note: 'Cinq squelettes découverts en 1868 aux Eyzies, en Dordogne, en creusant une voie de chemin de fer. Le nom du site est devenu celui de l\'espèce en Europe.' },
        { name: 'La dame de Brassempouy', note: 'Trois centimètres d\'ivoire, 25 000 ans : le plus ancien visage humain sculpté connu.' }
      ],
      legacy: [
        'Lascaux et Chauvet, fermées et reconstituées à l\'identique à côté — les originales ne supportent plus les visiteurs.',
        'Les alignements de Carnac, le plus grand ensemble mégalithique du monde.',
        'Des noms de rivières — la Seine, la Loire, l\'Ardèche — plus vieux que le celtique lui-même.',
        'Le paysage : les clairières d\'aujourd\'hui sont souvent les défrichements du néolithique.'
      ],
      meanwhile: 'Pendant la dernière glaciation, la Manche est à sec : on passe à pied vers l\'Angleterre, et la toundra descend jusqu\'à la Loire. Le réchauffement, vers 10 000 av. J.-C., referme le passage et installe la forêt — c\'est ce climat-là, tempéré et pluvieux, qui fera plus tard la richesse agricole du pays.',
      turn: 'Vers 800 av. J.-C., des peuples celtes s\'installent ou se forment sur place, avec le fer, le char et une aristocratie guerrière. La Gaule commence — et avec elle, les premiers textes qui parlent d\'ici, écrits par des Grecs et des Romains.',
      sites: [
        { name: 'Chauvet', lon: 4.42, lat: 44.39, kind: 'site' },
        { name: 'Lascaux', lon: 1.18, lat: 45.05, kind: 'site' },
        { name: 'Les Eyzies', lon: 1.01, lat: 44.94, kind: 'site' },
        { name: 'Carnac', lon: -3.08, lat: 47.58, kind: 'site' },
        { name: 'Tautavel', lon: 2.75, lat: 42.82, kind: 'site' }
      ]
    },

    /* ═══════════════ ANTIQUITÉ ═══════════════ */
    {
      id: 'gaule', name: 'La Gaule celtique', short: 'Gaule celtique', emoji: '🌿',
      period: '800 – 52 av. J.-C.', start: -800, end: -52,
      era: 'antiquite', color: '#f0c04b',
      seat: 'Aucune capitale : des oppida, villes fortifiées de hauteur — Bibracte, Gergovie',
      rulers: 'Une soixantaine de peuples indépendants, des rois puis des assemblées d\'aristocrates',
      reach: 'De l\'Atlantique au Rhin ; les Celtes essaiment jusqu\'en Italie du Nord et en Anatolie',
      stat: { value: '1 100 litres', label: 'la contenance du cratère de Vix, plus grand vase de bronze de l\'Antiquité' },
      summary: 'Ni la forêt ni les huttes de la légende : une Gaule de villes fortifiées, de routes, ' +
        'de monnaies d\'or et d\'artisans que Rome enviait. Son point faible n\'est pas la technique, ' +
        'c\'est la politique — soixante peuples qui ne s\'unissent jamais plus d\'une saison, et un ' +
        'proconsul romain endetté qui y voit sa chance.',
      events: [
        { y: 'v. 600 av. J.-C.', text: 'Des Grecs de Phocée fondent Massalia (Marseille) et apportent la vigne et l\'olivier.' },
        { y: 'v. 500 av. J.-C.', text: 'La tombe de Vix, en Bourgogne : une princesse, un torque d\'or et un cratère grec de 208 kg.' },
        { y: 'v. 390 av. J.-C.', text: 'Brennus et ses Sénons prennent Rome. « Vae victis » — malheur aux vaincus.' },
        { y: '121 av. J.-C.', text: 'Rome s\'installe dans le Midi : la Provincia, qui a donné le mot Provence.' },
        { y: '58 – 52 av. J.-C.', text: 'Guerre des Gaules. César y gagne une armée, une fortune et un livre.' },
        { y: '52 av. J.-C.', text: 'Vercingétorix bat César à Gergovie, puis capitule à Alésia après un siège à double enceinte.' }
      ],
      figures: [
        { name: 'Vercingétorix', note: 'Arverne, il réussit ce que personne n\'avait fait : coaliser les peuples gaulois. Six ans de prison à Rome, puis l\'exécution.' },
        { name: 'La dame de Vix', note: 'Enterrée vers 500 av. J.-C. avec un char et une vaisselle grecque : la preuve qu\'on commerçait avec la Méditerranée bien avant Rome.' },
        { name: 'Diviciacos', note: 'Chef éduen et druide, ami de Cicéron : le seul druide de l\'histoire dont on connaisse le nom.' }
      ],
      legacy: [
        'Le tonneau, la cotte de mailles, le savon et la moissonneuse à roues : des inventions gauloises que Rome a adoptées.',
        'Une centaine de mots encore en usage — chêne, alouette, charrue, bruyère, mouton.',
        'Les noms des villes : Lyon vient de Lugdunum, Paris des Parisii, Amiens des Ambiens.',
        'Bibracte, sur le mont Beuvray, où l\'on fouille encore la capitale des Éduens.'
      ],
      meanwhile: 'La Gaule frappe monnaie, exporte du blé et importe du vin italien par dizaines de milliers d\'amphores. Le sud est déjà romain depuis soixante-dix ans quand César attaque le reste : la conquête a commencé par le commerce.',
      turn: 'Après Alésia, la Gaule devient romaine sans révolte majeure : les aristocrates gaulois gardent leurs terres, prennent la citoyenneté et, en un siècle, siègent au Sénat de Rome.',
      sites: [
        { name: 'Bibracte', lon: 4.04, lat: 46.92, kind: 'capitale' },
        { name: 'Alésia', lon: 4.50, lat: 47.54, kind: 'site' },
        { name: 'Gergovie', lon: 3.12, lat: 45.72, kind: 'site' },
        { name: 'Vix', lon: 4.53, lat: 47.90, kind: 'site' },
        { name: 'Massalia', lon: 5.37, lat: 43.30, kind: 'ville' },
        { name: 'Lutèce', lon: 2.35, lat: 48.86, kind: 'ville' }
      ]
    },
    {
      id: 'romaine', name: 'La Gaule romaine', short: 'Gaule romaine', emoji: '🏛️',
      period: '52 av. J.-C. – 481', start: -52, end: 481,
      era: 'antiquite', color: '#ff8a5b',
      seat: 'Lugdunum (Lyon), capitale des Trois Gaules',
      rulers: 'Des gouverneurs romains — et très vite des élites gauloises devenues citoyennes',
      reach: 'Quatre provinces, du Rhin aux Pyrénées et des Alpes à l\'Atlantique',
      stat: { value: '25 cm par km', label: 'la pente de l\'aqueduc de Nîmes : 50 km de calcul juste' },
      summary: 'Cinq siècles, l\'époque la plus longue après la préhistoire — et la plus décisive : ' +
        'c\'est là que la langue bascule. Le gaulois s\'efface devant le latin parlé, celui des ' +
        'marchés et des soldats, qui deviendra le français. Les villes se couvrent d\'arènes et ' +
        'd\'aqueducs, et la Gaule finit par donner à Rome des empereurs.',
      events: [
        { y: '43 av. J.-C.', text: 'Fondation de Lugdunum, qui devient la capitale des Gaules et bat la monnaie de l\'Empire.' },
        { y: '48', text: 'L\'empereur Claude, né à Lyon, fait entrer les Gaulois au Sénat. Son discours est gravé sur bronze : on l\'a retrouvé.' },
        { y: '177', text: 'Martyrs de Lyon, dont l\'esclave Blandine : le christianisme est déjà là.' },
        { y: '260 – 274', text: 'L\'Empire des Gaules : quinze ans de sécession, le temps que Rome se remette de ses crises.' },
        { y: '406', text: 'Dans la nuit du 31 décembre, le Rhin gelé est traversé par des dizaines de milliers de personnes.' },
        { y: '451', text: 'Attila est arrêté aux champs Catalauniques, près de Châlons, par une armée romano-germanique.' },
        { y: '476 – 481', text: 'L\'Empire d\'Occident s\'éteint ; des royaumes germaniques se partagent la Gaule.' }
      ],
      figures: [
        { name: 'Claude', note: 'Empereur né à Lyon en 10 av. J.-C. — le premier chef de l\'Empire né hors d\'Italie.' },
        { name: 'Blandine', note: 'Jeune esclave suppliciée dans l\'amphithéâtre de Lyon en 177 : la plus ancienne martyre nommée du pays.' },
        { name: 'Saint Martin', note: 'Soldat devenu évêque de Tours. Le manteau partagé avec un pauvre est le récit fondateur de la charité chrétienne en Gaule.' },
        { name: 'Sidoine Apollinaire', note: 'Aristocrate lettré du Ve siècle : ses lettres racontent, presque en direct, un monde romain qui s\'éteint.' }
      ],
      legacy: [
        'Le pont du Gard, les arènes de Nîmes et d\'Arles, le théâtre antique d\'Orange — tous encore utilisés pour des spectacles.',
        'La langue : le français est du latin parlé en Gaule pendant cinq siècles, avec un accent celte et des mots germaniques par-dessus.',
        'Le tracé des routes : beaucoup de nationales suivent encore les voies romaines.',
        'Les vignobles de Bourgogne, du Rhône et de Bordeaux, plantés à cette époque.'
      ],
      meanwhile: 'Le christianisme remonte les vallées depuis Lyon et Marseille, et les campagnes gardent longtemps leurs dieux : le mot « païen » vient de paganus, l\'habitant du pagus, la campagne. Les villes se rétrécissent derrière des remparts bâtis avec les pierres de leurs propres monuments.',
      turn: 'En 481, un jeune roi franc de quinze ans hérite d\'un petit royaume autour de Tournai. Il s\'appelle Clovis, et en trente ans il tiendra presque toute la Gaule.',
      sites: [
        { name: 'Lugdunum (Lyon)', lon: 4.83, lat: 45.76, kind: 'capitale' },
        { name: 'Nîmes', lon: 4.36, lat: 43.84, kind: 'ville' },
        { name: 'Pont du Gard', lon: 4.54, lat: 43.95, kind: 'site' },
        { name: 'Arles', lon: 4.63, lat: 43.68, kind: 'ville' },
        { name: 'Narbonne', lon: 3.00, lat: 43.18, kind: 'ville' },
        { name: 'Tours', lon: 0.68, lat: 47.39, kind: 'ville' }
      ]
    },

    /* ═══════════════ MOYEN ÂGE ═══════════════ */
    {
      id: 'merovingiens', name: 'Les Mérovingiens', short: 'Mérovingiens', emoji: '👑',
      period: '481 – 751', start: 481, end: 751,
      era: 'medieval', color: '#4fd8a6',
      seat: 'Soissons, puis Paris — et bientôt plusieurs capitales à la fois',
      rulers: 'La dynastie de Clovis ; à la fin, les maires du palais gouvernent à la place des rois',
      reach: 'La Gaule presque entière, plus une partie de l\'Allemagne actuelle',
      stat: { value: '496 ou 508', label: 'le baptême de Clovis à Reims — la date est encore discutée' },
      summary: 'Un roi franc païen se fait baptiser catholique alors que tous les autres rois ' +
        'germaniques sont ariens : ce choix, plus que ses victoires, décide de la suite. Clovis ' +
        'gagne le clergé gallo-romain, donc l\'administration, donc les villes. Ses successeurs ' +
        'découperont le royaume à chaque héritage, jusqu\'à ne plus régner que de nom.',
      events: [
        { y: '486', text: 'Clovis bat Syagrius à Soissons et prend le dernier morceau romain de la Gaule.' },
        { y: '496 ou 508', text: 'Baptême à Reims par l\'évêque Remi, avec 3 000 guerriers selon la tradition.' },
        { y: '507', text: 'Vouillé : les Wisigoths sont rejetés au-delà des Pyrénées.' },
        { y: '511', text: 'Mort de Clovis. Le royaume est partagé entre ses quatre fils — et le sera à chaque génération.' },
        { y: '629 – 639', text: 'Dagobert Ier, dernier roi mérovingien à gouverner vraiment. Saint-Denis devient la nécropole royale.' },
        { y: '732', text: 'Charles Martel arrête une armée arabo-berbère près de Poitiers.' },
        { y: '751', text: 'Pépin le Bref dépose le dernier Mérovingien et se fait sacrer roi.' }
      ],
      figures: [
        { name: 'Clovis', note: 'Roi à 15 ans, chrétien à 30, maître de la Gaule à 45. Le vase de Soissons et le crâne fendu du guerrier sont dans tous les manuels depuis.' },
        { name: 'Clotilde', note: 'Reine burgonde et catholique, elle pousse son mari au baptême : la conversion du royaume passe par elle.' },
        { name: 'Sainte Geneviève', note: 'Elle persuade les Parisiens de ne pas fuir devant Attila. Paris est épargnée, et elle en devient la patronne.' },
        { name: 'Grégoire de Tours', note: 'Évêque et historien : sans ses dix livres d\'Histoires, on ne saurait presque rien de ces trois siècles.' }
      ],
      legacy: [
        'Paris capitale, choisie par Clovis vers 508 — elle ne l\'a plus jamais vraiment cédée.',
        'La basilique de Saint-Denis, tombeau des rois pendant treize siècles.',
        'Le nom du pays : la Francia, le pays des Francs.',
        'La loi salique, code franc dont on tirera bien plus tard l\'exclusion des femmes du trône.'
      ],
      meanwhile: 'Les monastères se multiplient — Luxeuil, Corbie, Jumièges — et deviennent les seuls lieux où l\'on copie, enseigne et défriche. Le latin parlé, lui, s\'éloigne assez de l\'écrit pour qu\'on doive bientôt traduire les sermons : le roman, ancêtre du français, est en train de naître.',
      turn: 'Les maires du palais commandent l\'armée et les terres depuis trois générations. En 751, avec l\'accord du pape, l\'un d\'eux prend aussi le titre. La dynastie change de nom.',
      sites: [
        { name: 'Reims', lon: 4.03, lat: 49.26, kind: 'site' },
        { name: 'Paris', lon: 2.35, lat: 48.86, kind: 'capitale' },
        { name: 'Soissons', lon: 3.32, lat: 49.38, kind: 'ville' },
        { name: 'Saint-Denis', lon: 2.36, lat: 48.94, kind: 'site' },
        { name: 'Poitiers', lon: 0.34, lat: 46.58, kind: 'site' },
        { name: 'Tours', lon: 0.68, lat: 47.39, kind: 'ville' }
      ]
    },
    {
      id: 'carolingiens', name: 'Les Carolingiens', short: 'Carolingiens', emoji: '📜',
      period: '751 – 987', start: 751, end: 987,
      era: 'medieval', color: '#6ee7d7',
      seat: 'Aix-la-Chapelle sous Charlemagne, puis Laon',
      rulers: 'Pépin, Charlemagne, Louis le Pieux, et une longue suite d\'héritiers en concurrence',
      reach: 'De l\'Èbre à l\'Elbe et de la mer du Nord à Rome — puis, après 843, la seule Francie occidentale',
      stat: { value: '25 décembre 800', label: 'Charlemagne couronné empereur à Rome : l\'Empire d\'Occident renaît' },
      summary: 'Deux siècles qui montent très haut et redescendent très vite. Charlemagne réunit ' +
        'l\'Occident, impose une écriture lisible et une école par évêché ; ses petits-fils se ' +
        'partagent l\'héritage à Verdun, et les Vikings remontent les fleuves pendant que le pouvoir ' +
        'se dissout entre les comtes. C\'est là que naît, sur une carte, la France.',
      events: [
        { y: '751', text: 'Pépin le Bref est sacré roi : le sacre religieux entre dans la politique française pour mille ans.' },
        { y: '778', text: 'Roncevaux : une arrière-garde franque est massacrée. Trois siècles plus tard, la Chanson de Roland en fera un chef-d\'œuvre.' },
        { y: '789', text: 'L\'Admonitio generalis ordonne une école auprès de chaque évêché et de chaque monastère.' },
        { y: '800', text: 'Couronnement impérial à Rome, le jour de Noël.' },
        { y: '843', text: 'Traité de Verdun : l\'empire est coupé en trois. La part occidentale deviendra la France.' },
        { y: '885 – 886', text: 'Siège de Paris par les Vikings : le comte Eudes tient un an, et la royauté change de camp.' },
        { y: '911', text: 'Le roi cède la future Normandie au chef viking Rollon contre la paix et le baptême.' },
        { y: '987', text: 'Hugues Capet est élu roi : les Carolingiens sortent de l\'histoire.' }
      ],
      figures: [
        { name: 'Charlemagne', note: 'Quarante-six ans de règne, cinquante campagnes, et une passion pour l\'école qu\'il n\'a lui-même jamais bien maîtrisée : il apprenait à écrire tard, la nuit, sans grand succès.' },
        { name: 'Alcuin', note: 'Savant venu d\'York, cheville ouvrière de la renaissance carolingienne et de la nouvelle écriture.' },
        { name: 'Eudes', note: 'Comte de Paris, héros du siège viking, élu roi en 888 : l\'ancêtre politique des Capétiens.' },
        { name: 'Rollon', note: 'Chef viking devenu premier duc de Normandie. Son arrière-arrière-arrière-petit-fils conquerra l\'Angleterre.' }
      ],
      legacy: [
        'La minuscule caroline : nos lettres minuscules, les espaces entre les mots, la ponctuation — cette page en descend directement.',
        'La frontière franco-allemande, dessinée en creux par le partage de 843.',
        'La Normandie, née d\'un traité avec des envahisseurs.',
        'Le sacre de Reims, rite fondateur de la royauté française jusqu\'à Charles X.'
      ],
      meanwhile: 'Face aux raids vikings, hongrois et sarrasins, le roi ne protège plus : les comtes et les châtelains le font à sa place, et gardent le pouvoir qui va avec. La féodalité n\'a pas été décidée, elle a été improvisée localement, château par château.',
      turn: 'À la mort du dernier Carolingien, les grands du royaume préfèrent élire l\'un des leurs, un duc dont le domaine tient en quelques comtés autour de Paris. Personne ne parie sur sa descendance.',
      sites: [
        { name: 'Laon', lon: 3.62, lat: 49.56, kind: 'capitale' },
        { name: 'Paris', lon: 2.35, lat: 48.86, kind: 'ville' },
        { name: 'Verdun', lon: 5.38, lat: 49.16, kind: 'site' },
        { name: 'Rouen', lon: 1.10, lat: 49.44, kind: 'ville' },
        { name: 'Tours', lon: 0.68, lat: 47.39, kind: 'site' }
      ]
    },
    {
      id: 'capetiens', name: 'Les Capétiens et l\'âge des cathédrales', short: 'Capétiens', emoji: '⛪',
      period: '987 – 1328', start: 987, end: 1328,
      era: 'medieval', color: '#46c2c2',
      seat: 'Paris',
      rulers: 'Quinze rois capétiens, de père en fils, sans une seule rupture de succession',
      reach: 'Un domaine royal d\'abord minuscule, qui finit par couvrir presque le royaume',
      stat: { value: '341 ans', label: 'de Capétiens directs — jamais le trône n\'échappe au fils aîné' },
      summary: 'Le hasard biologique le plus rentable de l\'histoire de France : quinze générations ' +
        'de suite, un fils survit à son père. Cette continuité transforme un roitelet d\'Île-de-France ' +
        'en souverain d\'un royaume unifié, pendant que le pays se couvre de cathédrales, défriche ' +
        'ses forêts et invente l\'université.',
      events: [
        { y: '987', text: 'Hugues Capet est élu et sacré. Il fait aussitôt sacrer son fils de son vivant — l\'astuce qui fonde la dynastie.' },
        { y: '1095', text: 'À Clermont, Urbain II prêche la première croisade devant une foule de Français.' },
        { y: '1163', text: 'Début du chantier de Notre-Dame de Paris. Il durera deux siècles.' },
        { y: '1214', text: 'Bouvines : Philippe Auguste bat une coalition européenne. Le royaume double de taille sous son règne.' },
        { y: '1257', text: 'Robert de Sorbon fonde le collège qui portera son nom.' },
        { y: '1307', text: 'Philippe le Bel fait arrêter les Templiers un vendredi 13 et s\'empare de leurs biens.' },
        { y: '1328', text: 'Mort du dernier Capétien direct sans fils : la couronne passe aux Valois, et l\'Angleterre conteste.' }
      ],
      figures: [
        { name: 'Philippe Auguste', note: 'Il quadruple le domaine royal, pave Paris, bâtit le Louvre et invente les archives de la monarchie après avoir perdu les siennes dans une bataille.' },
        { name: 'Aliénor d\'Aquitaine', note: 'Reine de France puis d\'Angleterre, mère de deux rois : son remariage fait passer l\'Aquitaine aux Plantagenêts et prépare trois siècles de guerre.' },
        { name: 'Saint Louis', note: 'Roi arbitre de l\'Europe, rendant la justice sous un chêne à Vincennes — et roi de deux croisades manquées, mort de maladie devant Tunis.' },
        { name: 'Suger', note: 'Abbé de Saint-Denis : c\'est son chantier, vers 1140, qui invente le gothique — mur de verre, croisée d\'ogives, lumière.' }
      ],
      legacy: [
        'Les cathédrales gothiques : Chartres, Amiens, Reims, Bourges, Notre-Dame — 80 en deux siècles.',
        'L\'université de Paris et le Quartier latin, qui doit son nom à la langue qu\'on y parlait.',
        'Le Louvre, forteresse de Philippe Auguste dont on voit encore les fondations sous le musée.',
        'Une administration : baillis, sénéchaux, archives, monnaie royale — l\'État commence là.'
      ],
      meanwhile: 'Le climat est doux, la population double, les forêts reculent et les foires de Champagne deviennent la place financière de l\'Europe. C\'est l\'apogée démographique du Moyen Âge — et la raison pour laquelle la peste de 1348 fera tant de morts : le pays est plein.',
      turn: 'En 1328, il n\'y a plus d\'héritier direct. Les barons écartent Édouard III d\'Angleterre, petit-fils de Philippe le Bel par sa mère, au profit d\'un cousin Valois. Édouard s\'y résout — puis change d\'avis neuf ans plus tard.',
      sites: [
        { name: 'Paris', lon: 2.35, lat: 48.86, kind: 'capitale' },
        { name: 'Chartres', lon: 1.49, lat: 48.45, kind: 'site' },
        { name: 'Reims', lon: 4.03, lat: 49.26, kind: 'ville' },
        { name: 'Bouvines', lon: 3.19, lat: 50.57, kind: 'site' },
        { name: 'Clermont', lon: 3.09, lat: 45.78, kind: 'ville' },
        { name: 'Bordeaux', lon: -0.58, lat: 44.84, kind: 'ville' }
      ]
    },
    {
      id: 'centans', name: 'La guerre de Cent Ans', short: 'Cent Ans', emoji: '⚔️',
      period: '1328 – 1453', start: 1328, end: 1453,
      era: 'medieval', color: '#5bb8ff',
      seat: 'Paris, puis Bourges — on surnomme Charles VII « le roi de Bourges »',
      rulers: 'Les Valois, contestés par les rois d\'Angleterre qui se disent rois de France',
      reach: 'Un royaume coupé en trois : anglais au nord-ouest, bourguignon à l\'est, royal au sud',
      stat: { value: '116 ans', label: 'de guerre — l\'expression « guerre de Cent Ans » date du XIXe siècle' },
      summary: 'Le pire siècle du millénaire : la guerre, la peste et la famine ensemble. La ' +
        'population tombe de moitié, Paris est anglaise, le roi est réfugié sur la Loire — et le ' +
        'royaume est sauvé par une paysanne de dix-sept ans qui n\'avait aucune raison d\'être ' +
        'écoutée. Il en sort une armée permanente, un impôt permanent, et un pays.',
      events: [
        { y: '1337', text: 'Édouard III d\'Angleterre revendique la couronne de France. La guerre commence.' },
        { y: '1346', text: 'Crécy : l\'arc long anglais anéantit la chevalerie française.' },
        { y: '1347 – 1352', text: 'La peste noire emporte un tiers à la moitié de la population.' },
        { y: '1356', text: 'Poitiers : le roi Jean le Bon est fait prisonnier et emmené à Londres.' },
        { y: '1415', text: 'Azincourt : une nouvelle armée française est détruite dans la boue.' },
        { y: '1420', text: 'Traité de Troyes : le roi d\'Angleterre est reconnu héritier du trône de France.' },
        { y: '1429', text: 'Jeanne d\'Arc délivre Orléans, puis fait sacrer Charles VII à Reims.' },
        { y: '1431', text: 'Jeanne est brûlée à Rouen. Un procès de 1456 la réhabilite.' },
        { y: '1453', text: 'Castillon : l\'artillerie royale l\'emporte, les Anglais quittent la Guyenne. Il ne leur reste que Calais.' }
      ],
      figures: [
        { name: 'Jeanne d\'Arc', note: 'Dix-sept ans, aucune expérience militaire, et une capacité à convaincre qui reste inexpliquée. Morte à dix-neuf ans, canonisée en 1920.' },
        { name: 'Du Guesclin', note: 'Petit noble breton devenu connétable : il gagne en refusant la bataille rangée, ce que la chevalerie considérait comme déshonorant.' },
        { name: 'Jacques Cœur', note: 'Marchand de Bourges, financier de Charles VII, plus riche que le roi — donc ruiné par lui.' },
        { name: 'Christine de Pizan', note: 'Première femme à vivre de sa plume en France ; elle écrit un poème en l\'honneur de Jeanne d\'Arc quelques semaines après Orléans.' }
      ],
      legacy: [
        'L\'armée permanente (1445) et l\'impôt permanent : deux inventions de guerre devenues l\'ossature de l\'État.',
        'L\'artillerie des frères Bureau — Castillon est la première grande bataille gagnée par le canon.',
        'Le sentiment national : c\'est de ce siècle que date l\'idée qu\'on est « français » avant d\'être picard ou gascon.',
        'Une figure devenue emblème, revendiquée depuis par à peu près tous les camps politiques du pays.'
      ],
      meanwhile: 'Pendant que le royaume se déchire, les ducs de Bourgogne bâtissent à Dijon et à Bruges l\'une des cours les plus riches d\'Europe. Leur alliance anglaise coûte très cher à la France — et leur État, qui a failli devenir un pays, disparaîtra en 1477.',
      turn: 'Le royaume sort de la guerre exsangue mais unifié et armé. Quarante ans plus tard, ses rois iront chercher en Italie une guerre de prestige — et en rapporteront la Renaissance.',
      sites: [
        { name: 'Orléans', lon: 1.90, lat: 47.90, kind: 'site' },
        { name: 'Rouen', lon: 1.10, lat: 49.44, kind: 'ville' },
        { name: 'Bourges', lon: 2.40, lat: 47.08, kind: 'capitale' },
        { name: 'Azincourt', lon: 2.13, lat: 50.46, kind: 'site' },
        { name: 'Crécy', lon: 1.88, lat: 50.25, kind: 'site' },
        { name: 'Castillon', lon: 0.03, lat: 44.85, kind: 'site' }
      ]
    },

    /* ═══════════════ ÉPOQUE MODERNE ═══════════════ */
    {
      id: 'renaissance', name: 'Renaissance et guerres de Religion', short: 'Renaissance', emoji: '🎨',
      period: '1453 – 1610', start: 1453, end: 1610,
      era: 'moderne', color: '#b18cff',
      seat: 'Les châteaux de la Loire, puis Paris',
      rulers: 'Les derniers Valois, puis le premier Bourbon',
      reach: 'Le royaume s\'arrondit — Bretagne (1532), Calais (1558), Trois-Évêchés — et les premiers voyages vers le Canada',
      stat: { value: '1539', label: 'l\'ordonnance de Villers-Cotterêts impose le français dans tous les actes officiels' },
      summary: 'Un siècle et demi de contrastes violents : on bâtit Chambord et on massacre à ' +
        'Paris, on imprime Rabelais et on brûle des hérétiques. La France y gagne sa langue ' +
        'administrative, son état civil, ses châteaux — et, au bout de trente-six ans de guerre ' +
        'civile religieuse, le premier texte de tolérance durable en Europe.',
      events: [
        { y: '1494', text: 'Début des guerres d\'Italie : les rois y cherchent des duchés, y trouvent l\'art italien.' },
        { y: '1515', text: 'Marignan. François Ier ramène aussi Léonard de Vinci, qui mourra à Amboise en 1519.' },
        { y: '1534', text: 'Jacques Cartier remonte le Saint-Laurent et donne à la région le nom de Canada.' },
        { y: '1539', text: 'Villers-Cotterêts : le français remplace le latin dans la justice, et les curés tiennent registre des baptêmes — le premier état civil.' },
        { y: '1562', text: 'Début des guerres de Religion : huit guerres en trente-six ans.' },
        { y: '24 août 1572', text: 'Massacre de la Saint-Barthélemy à Paris, puis en province : plusieurs milliers de protestants tués.' },
        { y: '1598', text: 'Édit de Nantes : Henri IV accorde aux protestants la liberté de culte et des places de sûreté.' },
        { y: '1610', text: 'Henri IV est assassiné rue de la Ferronnerie par Ravaillac.' }
      ],
      figures: [
        { name: 'François Ier', note: 'Roi bâtisseur et mécène : Chambord, Fontainebleau, le Collège de France, et Léonard de Vinci pour voisin.' },
        { name: 'Catherine de Médicis', note: 'Reine puis régente pendant trente ans, au milieu des guerres civiles : longtemps caricaturée, aujourd\'hui relue comme une politique acculée.' },
        { name: 'Montaigne', note: 'Maire de Bordeaux et inventeur d\'un genre littéraire, l\'essai, qui consiste à penser en public sans conclure.' },
        { name: 'Ambroise Paré', note: 'Chirurgien des champs de bataille : il remplace l\'huile bouillante par des pansements, et divise la mortalité par des ligatures.' }
      ],
      legacy: [
        'Les châteaux de la Loire — Chambord et ses 440 pièces, Chenonceau sur son pont.',
        'Le français comme langue de l\'État, quatre siècles avant qu\'il soit la langue de tous.',
        'L\'état civil : chaque Français a une date de naissance écrite quelque part depuis 1539.',
        'L\'édit de Nantes, premier compromis religieux durable d\'Europe — révoqué en 1685, ce qui coûtera très cher.'
      ],
      meanwhile: 'L\'imprimerie fait de Lyon la deuxième ville du livre en Europe ; Rabelais, Ronsard et Montaigne écrivent en français par choix, alors que le latin reste la langue savante. Sur les côtes, les pêcheurs bretons et normands vont déjà chercher la morue à Terre-Neuve.',
      turn: 'La monarchie sort des guerres civiles convaincue d\'une chose : tout pouvoir qui n\'est pas au roi est un risque. Richelieu en fera un programme.',
      sites: [
        { name: 'Chambord', lon: 1.51, lat: 47.62, kind: 'site' },
        { name: 'Amboise', lon: 0.98, lat: 47.41, kind: 'ville' },
        { name: 'Paris', lon: 2.35, lat: 48.86, kind: 'capitale' },
        { name: 'La Rochelle', lon: -1.15, lat: 46.16, kind: 'ville' },
        { name: 'Saint-Malo', lon: -2.02, lat: 48.65, kind: 'ville' },
        { name: 'Lyon', lon: 4.83, lat: 45.76, kind: 'ville' }
      ]
    },
    {
      id: 'absolue', name: 'La monarchie absolue', short: 'Monarchie absolue', emoji: '☀️',
      period: '1610 – 1789', start: 1610, end: 1789,
      era: 'moderne', color: '#f0c04b',
      seat: 'Paris, puis Versailles à partir de 1682',
      rulers: 'Louis XIII, Louis XIV, Louis XV, Louis XVI — et leurs ministres, Richelieu, Mazarin, Colbert',
      reach: 'Le royaume atteint ses frontières actuelles ou presque ; un empire colonial de la Nouvelle-France aux Antilles et à l\'Inde',
      stat: { value: '20 millions', label: 'd\'habitants vers 1700 : le pays le plus peuplé d\'Europe occidentale' },
      summary: 'L\'État se met à tout tenir : l\'armée, l\'impôt, les routes, les manufactures, la ' +
        'langue, l\'Académie, et jusqu\'à la noblesse qu\'on installe à Versailles pour la surveiller. ' +
        'Le modèle fascine l\'Europe et s\'épuise en guerres. Pendant ce temps, dans les salons et ' +
        'les cafés, les Lumières démontent pièce à pièce la légitimité de l\'ensemble.',
      events: [
        { y: '1635', text: 'Richelieu fonde l\'Académie française pour « donner des règles certaines à notre langue ».' },
        { y: '1648 – 1653', text: 'La Fronde : princes et parlements se révoltent. Louis XIV, enfant, doit fuir Paris — il ne l\'oubliera jamais.' },
        { y: '1661', text: 'Mort de Mazarin : à 22 ans, Louis XIV décide de gouverner sans premier ministre.' },
        { y: '1681', text: 'Inauguration du canal du Midi : 240 km, 328 ouvrages, quinze ans de travaux.' },
        { y: '1682', text: 'La cour s\'installe à Versailles.' },
        { y: '1685', text: 'Révocation de l\'édit de Nantes : 200 000 protestants quittent le royaume avec leurs métiers.' },
        { y: '1751 – 1772', text: 'L\'Encyclopédie de Diderot et d\'Alembert : 28 volumes, 72 000 articles, la science contre l\'autorité.' },
        { y: '1783', text: 'Premiers vols humains, en montgolfière puis en ballon à hydrogène, sous les yeux de la foule parisienne.' },
        { y: '5 mai 1789', text: 'Ouverture des États généraux, convoqués faute d\'argent.' }
      ],
      figures: [
        { name: 'Louis XIV', note: '72 ans de règne, le plus long d\'Europe. Il a fait de la France la première puissance du continent et l\'a laissée ruinée.' },
        { name: 'Vauban', note: 'Ingénieur de 300 places fortes, il finit par écrire un projet d\'impôt égal pour tous — et tombe en disgrâce.' },
        { name: 'Molière', note: 'Comédien mort en scène, dont la troupe deviendra la Comédie-Française : le français est encore appelé « la langue de Molière ».' },
        { name: 'Émilie du Châtelet', note: 'Physicienne et mathématicienne, traductrice de Newton : sa version française des Principia est encore la référence.' }
      ],
      legacy: [
        'Versailles, copié de Saint-Pétersbourg à Vienne.',
        'Les fortifications de Vauban, douze sites classés à l\'UNESCO.',
        'Le canal du Midi, toujours navigable après trois siècles et demi.',
        'Les Lumières : la Déclaration des droits de 1789 et une bonne part des constitutions du monde en descendent.'
      ],
      meanwhile: 'L\'autre face du siècle : le Code noir de 1685 organise l\'esclavage dans les colonies, et les ports de Nantes, Bordeaux et La Rochelle s\'enrichissent de la traite. La France perd le Canada et l\'Inde en 1763, puis finance la révolution américaine — au prix d\'une dette qui la mènera aux États généraux.',
      turn: 'Convoqués pour voter l\'impôt, les députés du tiers état se déclarent Assemblée nationale et refusent de se séparer. En six semaines, la monarchie absolue a cessé d\'exister.',
      sites: [
        { name: 'Versailles', lon: 2.13, lat: 48.80, kind: 'capitale' },
        { name: 'Paris', lon: 2.35, lat: 48.86, kind: 'ville' },
        { name: 'Briançon', lon: 6.64, lat: 44.90, kind: 'site' },
        { name: 'Toulouse', lon: 1.44, lat: 43.60, kind: 'ville' },
        { name: 'Nantes', lon: -1.55, lat: 47.22, kind: 'ville' },
        { name: 'Rochefort', lon: -0.96, lat: 45.94, kind: 'site' }
      ]
    },

    /* ═══════════════ ÉPOQUE CONTEMPORAINE ═══════════════ */
    {
      id: 'revolution', name: 'La Révolution et l\'Empire', short: 'Révolution · Empire', emoji: '🔺',
      period: '1789 – 1815', start: 1789, end: 1815,
      era: 'contemporain', color: '#e8534f',
      seat: 'Paris',
      rulers: 'Une monarchie constitutionnelle, une république, un Directoire, un Consulat, un Empire — en vingt-six ans',
      reach: 'Au sommet, 130 départements de Hambourg à Rome, et la moitié de l\'Europe sous influence',
      stat: { value: '1 mètre', label: 'défini en 1799 comme la dix-millionième partie du quart du méridien' },
      summary: 'Vingt-six ans qui remettent tout à zéro : les privilèges, les provinces, les poids ' +
        'et mesures, le calendrier, la justice, la propriété. Le pays y gagne un droit civil et un ' +
        'système métrique que le monde entier copiera, et y perd un million d\'hommes. La ' +
        'République naît, meurt, renaît — le débat, lui, n\'a jamais cessé depuis.',
      events: [
        { y: '14 juillet 1789', text: 'Prise de la Bastille, forteresse-prison qui ne contenait que sept détenus.' },
        { y: '4 – 26 août 1789', text: 'Abolition des privilèges, puis Déclaration des droits de l\'homme et du citoyen.' },
        { y: '1790', text: 'Les provinces deviennent 83 départements, dessinés pour qu\'on puisse rejoindre le chef-lieu en une journée de cheval.' },
        { y: '21 septembre 1792', text: 'Proclamation de la République, au lendemain de Valmy.' },
        { y: '1793 – 1794', text: 'La Terreur, la guerre de Vendée, la guerre aux frontières. Puis la chute de Robespierre.' },
        { y: '4 février 1794', text: 'Première abolition de l\'esclavage — rétabli par Bonaparte en 1802, aboli définitivement en 1848.' },
        { y: '1804', text: 'Le Code civil, puis le sacre de Napoléon Ier.' },
        { y: '1805 – 1812', text: 'Austerlitz, l\'apogée ; la Russie, la rupture. 400 000 hommes ne rentrent pas.' },
        { y: '1815', text: 'Waterloo, et l\'exil à Sainte-Hélène.' }
      ],
      figures: [
        { name: 'Olympe de Gouges', note: 'Autrice en 1791 de la Déclaration des droits de la femme et de la citoyenne. Guillotinée en 1793.' },
        { name: 'Robespierre', note: 'Avocat opposé à la peine de mort devenu maître de la Terreur : la Révolution en une seule trajectoire.' },
        { name: 'Napoléon Bonaparte', note: 'Né à Ajaccio un an après le rattachement de la Corse : le plus célèbre des Français a failli naître étranger.' },
        { name: 'Toussaint Louverture', note: 'Ancien esclave devenu gouverneur de Saint-Domingue ; sa déportation ouvre la voie à l\'indépendance d\'Haïti en 1804.' }
      ],
      legacy: [
        'Le Code civil, encore en vigueur, et recopié de la Belgique au Japon.',
        'Le système métrique, adopté aujourd\'hui par presque toute la planète.',
        'Les départements, les préfets, le baccalauréat, la Banque de France, le Conseil d\'État.',
        'Le drapeau, la Marseillaise, le 14 Juillet — et une Déclaration des droits toujours en tête de la Constitution.'
      ],
      meanwhile: 'La Révolution est aussi une guerre civile : la Vendée insurgée, la Terreur, les colonnes infernales. Et une guerre européenne quasi continue de 1792 à 1815, qui transporte partout, avec les armées, le Code civil et l\'idée de nation.',
      turn: 'Les vainqueurs replacent un Bourbon sur le trône. Mais aucun régime ne tiendra plus de dix-huit ans avant 1870 : la France passera le siècle à chercher lequel choisir.',
      sites: [
        { name: 'Paris', lon: 2.35, lat: 48.86, kind: 'capitale' },
        { name: 'Valmy', lon: 4.77, lat: 49.08, kind: 'site' },
        { name: 'Versailles', lon: 2.13, lat: 48.80, kind: 'site' },
        { name: 'Nantes', lon: -1.55, lat: 47.22, kind: 'ville' },
        { name: 'Ajaccio', lon: 8.74, lat: 41.93, kind: 'ville' },
        { name: 'Marseille', lon: 5.37, lat: 43.30, kind: 'ville' }
      ]
    },
    {
      id: 'revolutions', name: 'Le siècle des régimes', short: 'XIXe siècle', emoji: '🚂',
      period: '1815 – 1870', start: 1815, end: 1870,
      era: 'contemporain', color: '#ff8a5b',
      seat: 'Paris',
      rulers: 'Deux rois, une république, un empereur : la Restauration, Louis-Philippe, la IIe République, Napoléon III',
      reach: 'Nice et la Savoie rejoignent le pays en 1860 ; l\'empire colonial repart, d\'Alger à Saïgon',
      stat: { value: '4 régimes', label: 'en 55 ans — et trois révolutions dans les rues de Paris' },
      summary: 'La France industrialise et se déchire en même temps. Le chemin de fer, la banque, ' +
        'les grands magasins et les usines transforment le pays ; les barricades de 1830, 1848 et ' +
        '1871 disent que la question du régime n\'est pas réglée. Paris est éventrée et rebâtie, ' +
        'et se met à ressembler à ce qu\'elle est encore.',
      events: [
        { y: '1830', text: 'Les Trois Glorieuses chassent Charles X. La même année commence la conquête de l\'Algérie.' },
        { y: '1848', text: 'IIe République : suffrage universel masculin, abolition définitive de l\'esclavage, droit au travail.' },
        { y: '1851 – 1852', text: 'Coup d\'État de Louis-Napoléon, puis Second Empire.' },
        { y: '1853 – 1870', text: 'Haussmann perce les boulevards : 20 000 immeubles détruits, 40 000 construits.' },
        { y: '1860', text: 'Nice et la Savoie sont rattachées par plébiscite : la carte du pays prend sa forme actuelle.' },
        { y: '1863 – 1885', text: 'Pasteur : la pasteurisation, puis le vaccin contre la rage.' },
        { y: '1870', text: 'Sedan. L\'empereur est capturé, la République est proclamée le 4 septembre.' }
      ],
      figures: [
        { name: 'Victor Hugo', note: 'Pair de France, exilé dix-neuf ans pour son opposition à Napoléon III, enterré au Panthéon devant deux millions de personnes.' },
        { name: 'Victor Schœlcher', note: 'Il fait signer en avril 1848 le décret d\'abolition de l\'esclavage dans les colonies françaises.' },
        { name: 'Louis Pasteur', note: 'Chimiste devenu microbiologiste : il prouve que les maladies viennent de germes, pas de l\'air vicié.' },
        { name: 'George Sand', note: 'Romancière la plus lue de son temps, sous un nom d\'homme, et actrice de la révolution de 1848.' }
      ],
      legacy: [
        'Le Paris haussmannien : boulevards, immeubles à balcons filants, égouts, parcs.',
        'Le réseau ferré en étoile depuis Paris, qui structure encore les déplacements du pays.',
        'La photographie (Niépce, Daguerre) et le cinéma, qui suivra en 1895 à Lyon.',
        'Les frontières métropolitaines telles qu\'on les connaît, fixées en 1860.'
      ],
      meanwhile: 'La campagne se vide vers les villes, les enfants travaillent à l\'usine avant les premières lois sociales, et la France se dote d\'un second empire colonial — Algérie, Sénégal, Indochine — dont les conséquences occuperont tout le siècle suivant.',
      turn: 'La défaite de Sedan emporte l\'Empire. La République qui la remplace commence dans le pire contexte possible — invasion, siège, Commune écrasée — et deviendra pourtant le régime le plus durable depuis 1789.',
      sites: [
        { name: 'Paris', lon: 2.35, lat: 48.86, kind: 'capitale' },
        { name: 'Sedan', lon: 4.94, lat: 49.70, kind: 'site' },
        { name: 'Lyon', lon: 4.83, lat: 45.76, kind: 'ville' },
        { name: 'Le Havre', lon: 0.11, lat: 49.49, kind: 'ville' },
        { name: 'Lille', lon: 3.06, lat: 50.63, kind: 'ville' },
        { name: 'Nice', lon: 7.27, lat: 43.70, kind: 'ville' }
      ]
    },
    {
      id: 'republique3', name: 'La République et les deux guerres', short: 'IIIe République', emoji: '🕯️',
      period: '1870 – 1945', start: 1870, end: 1945,
      era: 'contemporain', color: '#c98fd8',
      seat: 'Paris — et Vichy de 1940 à 1944',
      rulers: 'La IIIe République, puis l\'occupation allemande et l\'État français, puis la France libre',
      reach: 'Le deuxième empire colonial du monde, de l\'Afrique à l\'Indochine',
      stat: { value: '1 400 000', label: 'soldats français morts pendant la Grande Guerre' },
      summary: 'Le régime qui installe l\'école gratuite, la laïcité et le suffrage — et qui traverse ' +
        'deux guerres mondiales sur son propre sol. La première saigne une génération et laisse un ' +
        'monument aux morts dans chacune des 36 000 communes ; la seconde emporte le régime ' +
        'lui-même, et il faudra la Résistance pour le refonder.',
      events: [
        { y: '1871', text: 'La Commune de Paris : soixante-douze jours, puis la Semaine sanglante.' },
        { y: '1881 – 1882', text: 'Lois Ferry : l\'école primaire devient gratuite, laïque et obligatoire.' },
        { y: '1889', text: 'La tour Eiffel, montée en deux ans pour l\'Exposition universelle, devait être démontée au bout de vingt.' },
        { y: '1894 – 1906', text: 'L\'affaire Dreyfus coupe le pays en deux et invente l\'intellectuel engagé.' },
        { y: '1905', text: 'Séparation des Églises et de l\'État.' },
        { y: '1914 – 1918', text: 'Verdun, la Somme, le Chemin des Dames. Un homme mobilisé sur six ne revient pas.' },
        { y: '1936', text: 'Front populaire : congés payés, semaine de 40 heures, conventions collectives.' },
        { y: '1940', text: 'Défaite en six semaines, armistice, régime de Vichy — et l\'appel du 18 juin à Londres.' },
        { y: '1944 – 1945', text: 'Débarquements, Libération, droit de vote des femmes, Sécurité sociale.' }
      ],
      figures: [
        { name: 'Jules Ferry', note: 'Ministre de l\'école gratuite et obligatoire — et théoricien de l\'expansion coloniale : le même homme, la même décennie.' },
        { name: 'Marie Curie', note: 'Deux prix Nobel, dans deux disciplines. Première femme professeure à la Sorbonne, elle équipe en 1914 des voitures radiologiques pour le front.' },
        { name: 'Jean Moulin', note: 'Préfet révoqué par Vichy, il unifie la Résistance en un seul Conseil national, en 1943. Arrêté, torturé, mort en déportation.' },
        { name: 'Charles de Gaulle', note: 'Général de brigade à titre temporaire quand il parle à la radio le 18 juin 1940 : personne ou presque ne l\'entend, et tout le monde s\'en souvient.' }
      ],
      legacy: [
        'L\'école républicaine et la laïcité de 1905, toujours au centre du débat public.',
        'La Sécurité sociale et le programme du Conseil national de la Résistance, appliqués dès 1945.',
        'Le droit de vote des femmes, obtenu en 1944 — vingt-six ans après les Britanniques.',
        'Les monuments aux morts, dans presque chaque commune : le seul monument que partagent tous les villages de France.'
      ],
      meanwhile: 'L\'empire colonial est à son maximum en 1931, quand l\'Exposition coloniale attire huit millions de visiteurs à Vincennes. Ce sont ses soldats — tirailleurs d\'Afrique, d\'Indochine, du Maghreb — qui composent une part décisive des armées de 1914 et de 1944.',
      turn: 'La IVe République, née en 1946, hérite de la reconstruction et de la décolonisation. Elle tombera sur l\'Algérie, en 1958.',
      sites: [
        { name: 'Paris', lon: 2.35, lat: 48.86, kind: 'capitale' },
        { name: 'Verdun', lon: 5.38, lat: 49.16, kind: 'site' },
        { name: 'Vichy', lon: 3.43, lat: 46.13, kind: 'ville' },
        { name: 'Bayeux', lon: -0.70, lat: 49.28, kind: 'site' },
        { name: 'Strasbourg', lon: 7.75, lat: 48.58, kind: 'ville' },
        { name: 'Lyon', lon: 4.83, lat: 45.76, kind: 'ville' }
      ]
    },
    {
      id: 'contemporaine', name: 'La France d\'aujourd\'hui', short: 'Aujourd\'hui', emoji: '🇫🇷',
      period: 'depuis 1945', start: 1945, end: null,
      era: 'contemporain', color: '#4fd8a6',
      seat: 'Paris',
      rulers: 'La IVe puis, depuis 1958, la Ve République',
      reach: 'Un pays de 68 millions d\'habitants, présent sur trois océans par ses territoires d\'outre-mer',
      stat: { value: '1958', label: 'la Ve République — la constitution qui gouverne encore le pays' },
      summary: 'Trente ans de croissance et de plein emploi, une décolonisation qui fait tomber un ' +
        'régime, une construction européenne menée avec l\'ancien ennemi, puis un demi-siècle de ' +
        'transformations sociales — l\'école pour tous, la contraception, l\'abolition de la peine ' +
        'de mort. C\'est la seule époque de cette page dont on ne connaît pas encore la dernière ligne.',
      events: [
        { y: '1946', text: 'IVe République. Le pays se reconstruit et se dote d\'un plan.' },
        { y: '1951 – 1957', text: 'CECA puis traité de Rome : l\'Europe se bâtit d\'abord sur le charbon, l\'acier et un marché commun.' },
        { y: '1954 – 1962', text: 'Guerre d\'Algérie. Elle emporte la IVe République et laisse des plaies encore ouvertes.' },
        { y: '1958', text: 'De Gaulle revient, la Ve République est adoptée par référendum.' },
        { y: 'mai 1968', text: 'Grèves et manifestations : dix millions de grévistes, et une société qui change plus vite que ses lois.' },
        { y: '1974 – 1975', text: 'Majorité à 18 ans, puis loi Veil sur l\'interruption volontaire de grossesse.' },
        { y: '1981', text: 'Abolition de la peine de mort, portée par Robert Badinter.' },
        { y: '1992 – 2002', text: 'Maastricht, puis l\'euro dans les portefeuilles au 1er janvier 2002.' },
        { y: '2015', text: 'Après les attentats de Paris, la COP21 aboutit à l\'accord de Paris sur le climat.' }
      ],
      figures: [
        { name: 'Simone Veil', note: 'Rescapée d\'Auschwitz, ministre de la Santé, première présidente du Parlement européen élu : trois vies dans une.' },
        { name: 'Robert Badinter', note: 'Avocat puis garde des Sceaux, il obtient en 1981 l\'abolition de la peine de mort contre une opinion majoritairement hostile.' },
        { name: 'Jean Monnet', note: 'Inspirateur de la déclaration Schuman de 1950 : construire l\'Europe par l\'économie, faute de pouvoir la construire d\'un coup.' },
        { name: 'Germaine Tillion', note: 'Ethnologue, résistante, déportée, puis médiatrice pendant la guerre d\'Algérie. Au Panthéon depuis 2015.' }
      ],
      legacy: [
        'Une cinquantaine de sites classés au patrimoine mondial — le Mont-Saint-Michel, Versailles, Carcassonne, les rives de la Seine, la baie de Marseille…',
        'Le pays le plus visité du monde, avec une centaine de millions de visiteurs par an.',
        'Un service public d\'école, de santé et de retraite hérité de 1945, et toujours au cœur du débat.',
        'Et, sous tout cela, la superposition entière : un dolmen, un aqueduc romain, une cathédrale gothique et une ligne à grande vitesse dans le même canton.'
      ],
      meanwhile: 'L\'outre-mer — Antilles, Guyane, La Réunion, Mayotte, Polynésie, Nouvelle-Calédonie — fait de la France un pays de trois océans et le deuxième domaine maritime du monde. Les débats sur son statut et son avenir sont l\'un des fils les plus vivants de l\'époque.',
      turn: 'À suivre : c\'est la seule époque de cette frise qui n\'a pas encore de date de fin.',
      sites: [
        { name: 'Paris', lon: 2.35, lat: 48.86, kind: 'capitale' },
        { name: 'Strasbourg', lon: 7.75, lat: 48.58, kind: 'ville' },
        { name: 'Marseille', lon: 5.37, lat: 43.30, kind: 'ville' },
        { name: 'Toulouse', lon: 1.44, lat: 43.60, kind: 'ville' },
        { name: 'Nantes', lon: -1.55, lat: 47.22, kind: 'ville' },
        { name: 'Lyon', lon: 4.83, lat: 45.76, kind: 'ville' },
        { name: 'Ajaccio', lon: 8.74, lat: 41.93, kind: 'ville' }
      ]
    }
  ];

  global.AGES = FR;

})(window);
