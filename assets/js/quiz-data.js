/**
 * Questions des quiz du Grenier
 * ------------------------------------------------------------------
 * Chaque question est tirée d'une histoire déjà en ligne : rien ici ne
 * demande de connaissance extérieure au site. C'est le principe — le quiz
 * récompense la lecture, il ne la remplace pas.
 *
 * Champs d'une question :
 *   q        l'énoncé
 *   choix    quatre réponses, dans l'ordre où elles sont écrites
 *   bonne    index de la bonne réponse dans `choix`
 *   source   id du contenu d'où vient la réponse (voir catalog.js) ; sert à
 *            proposer « Revoir l'histoire » après coup
 *   note     une phrase qui explique, affichée après la réponse
 *
 * Pour ajouter un quiz : une entrée de plus dans GRENIER.quizzes, une carte
 * dans GRENIER.items (kind 'jeu', file 'quiz.html?univers=<clé>') et une
 * vignette assets/thumbs/quiz-<clé>.svg.
 */
(function (global) {
  'use strict';

  var GRENIER = global.GRENIER || (global.GRENIER = {});

  GRENIER.quizzes = {

    /* ── Prophètes & Sagesse ─────────────────────────────────── */
    propheties: {
      titre: 'Prophètes & Sagesse',
      sousTitre: 'Dix questions sur les récits des prophètes.',
      questions: [
        {
          q: 'Sur quel fleuve la maman de Moïse dépose-t-elle le panier ?',
          choix: ['Le Jourdain', 'Le Nil', 'L\'Euphrate', 'Le Tigre'],
          bonne: 1, source: 'moise',
          note: 'Le panier de roseaux descend le Nil, en Égypte, sous la surveillance de sa sœur Myriam.'
        },
        {
          q: 'Dans quelle ville Younes est-il envoyé pour guider les habitants ?',
          choix: ['Ninive', 'Babylone', 'Jéricho', 'Damas'],
          bonne: 0, source: 'younes',
          note: 'C\'est en quittant Ninive, découragé, que Younes embarque — et rencontre la tempête.'
        },
        {
          q: 'Que rapporte la colombe envoyée par Noé ?',
          choix: ['Un poisson', 'Une plume blanche', 'Un rameau d\'olivier', 'Un grain de blé'],
          bonne: 2, source: 'noe',
          note: 'Le petit rameau vert annonce que la terre réapparaît. L\'arche s\'arrêtera sur le mont Ararat.'
        },
        {
          q: 'Que voit Youssef dans son rêve, au tout début de l\'histoire ?',
          choix: [
            'Sept vaches grasses et sept vaches maigres',
            'Onze étoiles, le soleil et la lune qui se prosternent',
            'Un puits rempli d\'eau claire',
            'Une tunique aux mille couleurs'
          ],
          bonne: 1, source: 'youssef',
          note: 'Les sept vaches viennent plus tard : c\'est le rêve du Pharaon, que Youssef interprétera en prison.'
        },
        {
          q: 'Dans le jardin du paradis, qu\'est-il demandé à Adam et Hawa ?',
          choix: [
            'De ne manger d\'aucun fruit',
            'De ne pas parler à Iblis',
            'De ne pas s\'approcher d\'un seul arbre',
            'De ne jamais quitter le jardin'
          ],
          bonne: 2, source: 'adam',
          note: 'Un seul arbre était interdit — tout le reste du paradis leur appartenait.'
        },
        {
          q: 'Quel roi fait jeter Ibrahim dans un immense feu ?',
          choix: ['Nemrod', 'Pharaon', 'Jalut', 'Iarbas'],
          bonne: 0, source: 'ibrahim',
          note: 'Le feu ne le brûle pas : Ibrahim en ressort calme et indemne.'
        },
        {
          q: 'Comment les habitants de La Mecque surnommaient-ils Mohamed ﷺ avant la révélation ?',
          choix: ['Al-Amine, le fidèle', 'Al-Hakim, le sage', 'Al-Farouk', 'Al-Karim'],
          bonne: 0, source: 'mohamed',
          note: 'Al-Amine : celui en qui on peut avoir confiance. On lui confiait ses biens les yeux fermés.'
        },
        {
          q: 'Avec quoi Jésus nourrit-il des milliers de personnes ?',
          choix: [
            'Douze paniers de figues',
            'Cinq pains et deux poissons',
            'Une jarre d\'huile sans fond',
            'Trois galettes d\'orge'
          ],
          bonne: 1, source: 'jesus',
          note: 'Mais ce sont ses paroles — « aimez-vous les uns les autres » — qui marquaient le plus les foules.'
        },
        {
          q: 'Quel oiseau apprend à Soulayman l\'existence de la reine de Saba ?',
          choix: ['Un aigle', 'Un corbeau', 'La huppe (Hudhud)', 'Une colombe'],
          bonne: 2, source: 'soulayman',
          note: 'Le Hudhud, son messager ailé, revient d\'un long vol avec la nouvelle du royaume de Bilqis.'
        },
        {
          q: 'Avec quoi le jeune Dawud vient-il à bout du géant Jalut ?',
          choix: ['Une épée de fer', 'Une lance', 'Une fronde et une pierre', 'Un arc'],
          bonne: 2, source: 'dawud',
          note: 'Le fer viendra plus tard : Dieu le lui amollira entre les mains pour forger des cottes de mailles.'
        }
      ]
    },

    /* ── Légendes du monde ───────────────────────────────────── */
    legendes: {
      titre: 'Légendes du monde',
      sousTitre: 'Dix questions sur les héros, les savants et les explorateurs.',
      questions: [
        {
          q: 'Par où Hannibal fait-il passer son armée et ses éléphants pour surprendre Rome ?',
          choix: ['Par la mer', 'Par les Alpes', 'Par le désert de Libye', 'Par les Pyrénées'],
          bonne: 1, source: 'hannibal',
          note: 'Les Romains l\'attendaient au sud, par la mer. Il est arrivé du nord, par-dessus les montagnes enneigées.'
        },
        {
          q: 'À Cannes, où Hannibal place-t-il ses meilleurs guerriers ?',
          choix: [
            'Au centre, pour enfoncer les lignes',
            'Sur les côtés, pour refermer les ailes',
            'En réserve, derrière les éléphants',
            'En embuscade dans les collines'
          ],
          bonne: 1, source: 'hannibal',
          note: 'Le centre, volontairement faible, recule et attire les Romains — les ailes se referment comme deux cornes.'
        },
        {
          q: 'Comment Elissa obtient-elle la colline où naîtra Carthage ?',
          choix: [
            'Elle l\'achète au prix de son or',
            'Elle la gagne à la guerre',
            'Elle découpe une peau de bœuf en fines lanières',
            'Le roi Iarbas la lui offre en cadeau'
          ],
          bonne: 2, source: 'elissa',
          note: 'On lui accorde « ce qu\'une peau de bœuf peut couvrir » : découpée en lanières, elle encercle toute une colline.'
        },
        {
          q: 'De quelle ville Elissa s\'enfuit-elle avant de fonder Carthage ?',
          choix: ['Tyr', 'Alexandrie', 'Athènes', 'Rome'],
          bonne: 0, source: 'elissa',
          note: 'Tyr, sur la côte de l\'actuel Liban, où son frère devenu roi menaçait sa vie.'
        },
        {
          q: 'Sur quelle île Napoléon est-il né, en 1769 ?',
          choix: ['La Sardaigne', 'La Corse', 'Sainte-Hélène', 'La Sicile'],
          bonne: 1, source: 'napoleon',
          note: 'Il finira sur une autre île, Sainte-Hélène, au milieu de l\'Atlantique — et y mourra en 1821.'
        },
        {
          q: 'Que fait Napoléon de remarquable lors de son sacre, en 1804 ?',
          choix: [
            'Il refuse la couronne',
            'Il se couronne lui-même',
            'Il partage la couronne avec le pape',
            'Il se fait couronner à Rome'
          ],
          bonne: 1, source: 'napoleon',
          note: 'À Notre-Dame de Paris, il prend la couronne des mains du pape et la pose lui-même sur sa tête.'
        },
        {
          q: 'Dans quelle forêt Robin des Bois et sa bande vivent-ils ?',
          choix: ['Brocéliande', 'La Forêt-Noire', 'Sherwood', 'Fontainebleau'],
          bonne: 2, source: 'robinhood',
          note: 'Sherwood, en Angleterre, avec Petit Jean et Frère Tuck — et le shérif de Nottingham aux trousses.'
        },
        {
          q: 'De quoi Kâroun était-il persuadé au sujet de son immense fortune ?',
          choix: [
            'Qu\'elle venait d\'un don de Dieu',
            'Qu\'il la devait à son propre savoir',
            'Qu\'elle lui venait de son père',
            'Qu\'elle était un simple prêt'
          ],
          bonne: 1, source: 'karoun',
          note: '« Je l\'ai obtenue grâce à un savoir qui est en moi. » Il voyait un mérite là où il y avait un dépôt.'
        },
        {
          q: 'De quoi Christophe Colomb resta-t-il convaincu jusqu\'à sa mort, en 1506 ?',
          choix: [
            'D\'avoir atteint les Indes',
            'D\'avoir découvert un continent inconnu',
            'D\'avoir fait le tour de la Terre',
            'D\'avoir trouvé le passage du Nord-Ouest'
          ],
          bonne: 0, source: 'colomb',
          note: 'Il appela « Indios » les habitants des îles atteintes le 12 octobre 1492, et n\'en changea jamais.'
        },
        {
          q: 'Combien de temps dura le voyage d\'Ibn Battuta, parti pour un simple pèlerinage ?',
          choix: ['Un an', 'Neuf ans', 'Vingt-neuf ans', 'Cinquante ans'],
          bonne: 2, source: 'ibn-battuta',
          note: 'Parti de Tanger en 1325 pour être rentré dans l\'année, il revient en 1354 — après 120 000 km.'
        }
      ]
    },

    /* ── Sciences & Découvertes ──────────────────────────────── */
    sciences: {
      titre: 'Sciences & Découvertes',
      sousTitre: 'Dix questions sur le cosmos, la vie et le temps long.',
      questions: [
        {
          q: 'Il y a combien de temps les dinosaures ont-ils disparu ?',
          choix: ['66 millions d\'années', '245 millions d\'années', '2 millions d\'années', '600 000 ans'],
          bonne: 0, source: 'dinosaures',
          note: 'Les premiers dinosaures, eux, apparaissent il y a 245 millions d\'années, au Trias.'
        },
        {
          q: 'Que sont devenus les dinosaures à plumes qui ont survécu à la catastrophe ?',
          choix: ['Les crocodiles', 'Les chauves-souris', 'Les oiseaux', 'Les lézards'],
          bonne: 2, source: 'dinosaures',
          note: 'Le moineau sur la branche est un dinosaure. Leur règne continue, en plus léger.'
        },
        {
          q: 'Quel âge a l\'univers ?',
          choix: ['4,6 milliards d\'années', '13,8 milliards d\'années', '300 000 ans', '2 000 milliards d\'années'],
          bonne: 1, source: 'espace',
          note: '4,6 milliards d\'années, c\'est l\'âge du système solaire — bien plus jeune que l\'univers.'
        },
        {
          q: 'Combien de temps la lumière du Soleil met-elle pour atteindre la Terre ?',
          choix: ['8 secondes', '8 minutes', '8 heures', 'Instantanément'],
          bonne: 1, source: 'espace',
          note: 'Il lui faut ensuite 4 heures pour atteindre Neptune. Le Soleil que tu vois a 8 minutes.'
        },
        {
          q: 'D\'où viennent les atomes qui composent ton corps ?',
          choix: [
            'Du cœur d\'étoiles mortes',
            'De l\'atmosphère terrestre',
            'Des océans primitifs',
            'Des comètes uniquement'
          ],
          bonne: 0, source: 'espace',
          note: 'Le fer, le calcium, l\'oxygène : tous forgés dans des étoiles, puis dispersés par leur explosion.'
        },
        {
          q: 'Quelle question pose le paradoxe de Fermi, en 1950 ?',
          choix: [
            '« Qu\'y avait-il avant le Big Bang ? »',
            '« L\'univers a-t-il une fin ? »',
            '« Où sont-ils ? »',
            '« Sommes-nous au centre ? »'
          ],
          bonne: 2, source: 'espace',
          note: 'Si l\'univers est si vaste et si vieux, pourquoi n\'avons-nous jamais capté personne ?'
        },
        {
          q: 'Autour de quoi se réunissent les premiers humains, il y a 300 000 ans ?',
          choix: ['Autour du feu', 'Autour des premières récoltes', 'Autour des rivières', 'Autour des grottes peintes'],
          bonne: 0, source: 'humanite',
          note: 'Le feu ne sert pas qu\'à cuire : autour de lui naissent les premières paroles et les premiers récits.'
        },
        {
          q: 'Quelle révolution change tout, il y a 10 000 ans ?',
          choix: ['L\'écriture', 'La roue', 'L\'agriculture', 'La métallurgie'],
          bonne: 2, source: 'humanite',
          note: 'On sème, donc on reste. Les villages, les villes et les royaumes suivent — piège ou progrès, le débat dure encore.'
        },
        {
          q: 'Pourquoi Mémé Solange dit-elle que regarder une étoile, c\'est regarder le passé ?',
          choix: [
            'Parce que les étoiles ne bougent plus',
            'Parce que sa lumière a mis mille ans à nous parvenir',
            'Parce qu\'on l\'observe avec un vieux télescope',
            'Parce qu\'elle n\'existe que dans le carnet'
          ],
          bonne: 1, source: 'lumiere',
          note: 'L\'Étoile du Veilleur est peut-être déjà éteinte : sa dernière lumière voyage encore vers nous.'
        },
        {
          q: 'Que choisit Léna face à la Gardienne des Brumes ?',
          choix: [
            'Prendre la place de son grand-père',
            'Repartir sans rien dire',
            'Allumer le phare chaque nuit à sa place',
            'Échanger la boussole contre sa liberté'
          ],
          bonne: 2, source: 'phare',
          note: '« Je ne veux pas prendre sa place. Je veux allumer le phare à sa place. C\'est ça, la vraie veille. »'
        }
      ]
    }
  };
})(window);
