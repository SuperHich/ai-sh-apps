/**
 * L'Explorateur du Corps Humain — les organes et leurs chiffres
 * ------------------------------------------------------------------
 * Une entrée par organe visitable. La page n'affiche rien qui ne vienne
 * d'ici ; la forme en trois dimensions, elle, est construite dans
 * anatomie.js, où chaque maillage porte le même identifiant.
 *
 * Champs :
 *   id       identifiant stable — sert de clé au maillage et à l'adresse (#foie)
 *   name     nom affiché, article compris
 *   short    nom court, pour le quai et le jeu
 *   system   clé du système auquel il appartient (voir AN.systems)
 *   color/hi teinte de l'organe en 3D et son éclat sous la lumière
 *   role     ce qu'il fait, en deux phrases
 *   where    où le chercher dans le corps
 *   stats    la fiche de chiffres, telle qu'elle s'affiche
 *   daily    ce qu'il accomplit en une seule journée
 *   facts    « le sais-tu ? » — deux surprises par organe
 *
 * Les chiffres sont ceux des ouvrages d'anatomie et de physiologie courants.
 * Quand une valeur est débattue — la surface d'absorption de l'intestin, le
 * nombre de bactéries du côlon — c'est l'estimation récente qui est retenue,
 * et l'écart est dit dans le texte plutôt que caché.
 */
(function (global) {
  'use strict';

  var AN = global.ANATOMIE || (global.ANATOMIE = {});

  AN.systems = [
    { key: 'nerveux',      label: 'Nerveux',      color: '#b18cff',
      blurb: 'Le poste de commande et son grand câble.' },
    { key: 'respiratoire', label: 'Respiratoire', color: '#5bb8ff',
      blurb: 'Faire entrer l\'oxygène, faire sortir le gaz carbonique.' },
    { key: 'circulatoire', label: 'Circulatoire', color: '#ff6f7c',
      blurb: 'Une pompe et cent mille kilomètres de tuyaux.' },
    { key: 'digestif',     label: 'Digestif',     color: '#f0a84b',
      blurb: 'Neuf mètres de chantier qui transforment un repas en énergie.' },
    { key: 'urinaire',     label: 'Urinaire',     color: '#4fd8a6',
      blurb: 'Le filtre à eau du corps, et son réservoir.' },
    { key: 'squelette',    label: 'Squelette',    color: '#e6e0cf',
      blurb: 'Deux cent six os : la charpente, l\'armure et l\'usine à sang.' }
  ];

  AN.organs = [

    /* ═══════════════ SYSTÈME NERVEUX ═══════════════ */
    {
      id: 'cerveau', name: 'Le cerveau', short: 'Cerveau', system: 'nerveux',
      color: '#e8a9c8', hi: '#ffd4e6',
      role: 'Le poste de commande. Il reçoit tout ce que les sens rapportent, décide, ' +
            'commande les muscles — et fabrique au passage tes souvenirs, tes rêves et tes idées.',
      where: 'Dans la boîte crânienne, protégé par huit os soudés et trois enveloppes, ' +
             'flottant dans un liquide qui l\'empêche de cogner contre l\'os.',
      stats: {
        'Poids': ['1,3 kg', '2 % de ton poids'],
        'Neurones': ['86 milliards', 'et autant de cellules de soutien'],
        'Énergie': ['20 %', 'de tout ce que tu consommes'],
        'Vitesse': ['jusqu\'à 120 m/s', 'dans les nerfs les plus rapides']
      },
      daily: 'Il ne s\'arrête jamais — même endormi, il consomme presque autant qu\'éveillé, ' +
             'et c\'est la nuit qu\'il trie et range ce que tu as appris dans la journée.',
      facts: [
        { e: '🧠', t: 'Il ne ressent pas la douleur : il n\'a aucun capteur pour lui-même. On peut opérer un cerveau sur un patient éveillé, qui parle pendant l\'opération.' },
        { e: '💡', t: 'Ses 86 milliards de neurones échangent par des signaux électriques et chimiques, pour une puissance d\'environ 20 watts — moins qu\'une ampoule de frigo.' }
      ]
    },
    {
      id: 'moelle', name: 'La moelle épinière', short: 'Moelle épinière', system: 'nerveux',
      color: '#c9a6f0', hi: '#efe0ff',
      role: 'Le câble principal entre le cerveau et le reste du corps : tous les ordres ' +
            'descendent par là, toutes les sensations y remontent.',
      where: 'Dans le tunnel creusé au centre des vertèbres, de la base du crâne au bas du dos.',
      stats: {
        'Longueur': ['45 cm', 'du crâne aux lombaires'],
        'Diamètre': ['1 cm', 'un doigt d\'épaisseur'],
        'Poids': ['35 g', 'une lettre'],
        'Nerfs': ['31 paires', 'qui en sortent par les côtés']
      },
      daily: 'Elle transmet des millions de messages, et en tranche certains toute seule : ' +
             'les réflexes ne montent pas jusqu\'au cerveau, ils font demi-tour dans la moelle.',
      facts: [
        { e: '⚡', t: 'Quand tu touches quelque chose de brûlant, ta main part avant que tu ne sentes la douleur : la moelle a commandé le retrait sans attendre l\'avis du cerveau.' },
        { e: '📏', t: 'Elle s\'arrête au milieu du dos, vers la deuxième lombaire. En dessous, le canal ne contient plus qu\'un faisceau de nerfs — d\'où la possibilité d\'une ponction lombaire sans la toucher.' }
      ]
    },

    /* ═══════════════ SYSTÈME CIRCULATOIRE ═══════════════ */
    {
      id: 'coeur', name: 'Le cœur', short: 'Cœur', system: 'circulatoire',
      color: '#d94a52', hi: '#ff8f96',
      role: 'Une pompe musculaire à quatre pièces, infatigable. Le côté droit envoie le sang ' +
            'aux poumons se recharger en oxygène, le côté gauche le pousse dans tout le corps.',
      where: 'Au centre de la poitrine, entre les deux poumons, un peu décalé vers la gauche — ' +
             'et derrière le sternum, qui le protège.',
      stats: {
        'Poids': ['300 g', 'deux pommes'],
        'Taille': ['ton poing fermé', 'il grandit avec toi'],
        'Battements': ['100 000 par jour', '60 à 80 par minute au repos'],
        'Débit': ['7 000 litres par jour', 'une citerne']
      },
      daily: 'Cent mille battements, sans une pause, et de quoi remplir une petite citerne. ' +
             'En une vie de 80 ans, cela fait trois milliards de battements.',
      facts: [
        { e: '🥁', t: 'Le « toc-toc » que le médecin écoute n\'est pas le muscle : ce sont les valves qui claquent en se refermant, pour empêcher le sang de repartir en arrière.' },
        { e: '🔌', t: 'Il a son propre allumage. Un petit paquet de cellules, le nœud sinusal, produit l\'impulsion électrique : un cœur battrait encore quelques instants hors du corps.' }
      ]
    },
    {
      id: 'aorte', name: 'L\'aorte et les gros vaisseaux', short: 'Aorte', system: 'circulatoire',
      color: '#b93a48', hi: '#ff7d8c',
      role: 'La plus grosse artère du corps part du cœur, fait une crosse vers le haut, ' +
            'puis descend le long de la colonne en distribuant des branches à tous les organes.',
      where: 'Elle sort du cœur vers le haut, se recourbe sous la clavicule gauche, ' +
             'puis descend derrière le cœur jusqu\'au ventre.',
      stats: {
        'Diamètre': ['3 cm', 'un tuyau d\'arrosage'],
        'Réseau total': ['100 000 km', 'deux fois et demie le tour de la Terre'],
        'Capillaires': ['5 µm', 'dix fois plus fins qu\'un cheveu'],
        'Pression': ['120 / 80', 'le chiffre que prend le médecin']
      },
      daily: 'Un globule rouge fait le tour complet du circuit en moins d\'une minute, ' +
             'et le refait environ mille cinq cents fois par jour.',
      facts: [
        { e: '🌍', t: 'Bout à bout, tes vaisseaux feraient deux fois et demie le tour de la Terre. Presque tout cette longueur est faite de capillaires invisibles à l\'œil nu.' },
        { e: '🫀', t: 'Les artères ont une paroi épaisse et élastique : elles encaissent le coup de pompe du cœur et le lissent, ce qui explique qu\'on sente le pouls au poignet.' }
      ]
    },
    {
      id: 'rate', name: 'La rate', short: 'Rate', system: 'circulatoire',
      color: '#8e4a6b', hi: '#d489a8',
      role: 'Le poste de tri du sang : elle repère les globules rouges usés, les démonte et ' +
            'recycle leur fer. Elle sert aussi de caserne à une partie des défenses du corps.',
      where: 'À gauche, sous les côtes, derrière l\'estomac — un organe mou de la taille d\'un poing.',
      stats: {
        'Poids': ['150 g', 'une orange'],
        'Longueur': ['12 cm', ''],
        'Sang stocké': ['jusqu\'à 250 ml', 'une réserve d\'urgence'],
        'Globules recyclés': ['des milliards par jour', '']
      },
      daily: 'Elle démonte environ deux millions de globules rouges par seconde à l\'échelle du corps, ' +
             'et en récupère le fer pour en fabriquer de nouveaux.',
      facts: [
        { e: '🩸', t: 'Un globule rouge vit 120 jours. Passé ce délai, il devient rigide, la rate le repère au passage dans ses filtres et le met à la casse.' },
        { e: '➖', t: 'On peut vivre sans elle : le foie et la moelle osseuse reprennent son travail. Les défenses sont juste un peu moins vives contre certains microbes.' }
      ]
    },

    /* ═══════════════ SYSTÈME RESPIRATOIRE ═══════════════ */
    {
      id: 'poumons', name: 'Les poumons', short: 'Poumons', system: 'respiratoire',
      color: '#e79a9a', hi: '#ffd0cc',
      role: 'Deux éponges à air. À chaque inspiration, l\'oxygène passe dans le sang à travers ' +
            'des parois plus fines qu\'une feuille de papier, et le gaz carbonique fait le trajet inverse.',
      where: 'Ils remplissent la cage thoracique de part et d\'autre du cœur. Le gauche est plus ' +
             'petit — deux lobes contre trois à droite — pour lui laisser la place.',
      stats: {
        'Alvéoles': ['480 millions', 'de minuscules bulles'],
        'Surface': ['70 m²', 'un grand appartement, replié dans ta poitrine'],
        'Respirations': ['22 000 par jour', '12 à 20 par minute au repos'],
        'Air brassé': ['10 000 litres par jour', '']
      },
      daily: 'Vingt-deux mille respirations et dix mille litres d\'air, sans y penser une seule fois.',
      facts: [
        { e: '🎈', t: 'Ils ne sont pas des ballons : ce sont 480 millions de petites bulles. C\'est ce repliement qui fait tenir 70 m² d\'échange dans une poitrine.' },
        { e: '💧', t: 'Ils flottent sur l\'eau — ce sont les seuls organes du corps dans ce cas, parce qu\'ils sont pleins d\'air.' }
      ]
    },
    {
      id: 'trachee', name: 'La trachée et les bronches', short: 'Trachée', system: 'respiratoire',
      color: '#9fc9e8', hi: '#dff0ff',
      role: 'Le tuyau d\'arrivée d\'air. Il descend de la gorge, se divise en deux bronches, ' +
            'puis se ramifie encore une vingtaine de fois jusqu\'aux alvéoles.',
      where: 'Devant l\'œsophage, du larynx au milieu de la poitrine, où elle fourche vers chaque poumon.',
      stats: {
        'Longueur': ['11 cm', 'avant la fourche'],
        'Diamètre': ['2 cm', 'un tube de dentifrice'],
        'Anneaux': ['16 à 20', 'de cartilage, en forme de C'],
        'Divisions': ['23 étages', 'jusqu\'aux alvéoles']
      },
      daily: 'Ses cils remontent en permanence un tapis de mucus qui piège poussières et microbes, ' +
             'à un demi-millimètre par seconde — un tapis roulant vers la gorge.',
      facts: [
        { e: '🅾️', t: 'Ses anneaux de cartilage sont ouverts à l\'arrière, en forme de C. C\'est ce qui permet à une grosse bouchée de passer dans l\'œsophage juste derrière.' },
        { e: '🤧', t: 'Un éternuement chasse l\'air à plus de 150 km/h. Une toux, à environ 80. Ce sont les balais d\'urgence de ce tuyau.' }
      ]
    },
    {
      id: 'diaphragme', name: 'Le diaphragme', short: 'Diaphragme', system: 'respiratoire',
      color: '#c98f7a', hi: '#f6c6b2',
      role: 'Le muscle de la respiration, en forme de coupole. Quand il se contracte, il descend, ' +
            'la poitrine s\'agrandit et l\'air entre tout seul. Quand il remonte, l\'air ressort.',
      where: 'Il sépare la poitrine du ventre, comme un plancher bombé sous les poumons et le cœur.',
      stats: {
        'Contractions': ['20 000 par jour', 'à chaque respiration'],
        'Course': ['1,5 à 7 cm', 'de haut en bas'],
        'Épaisseur': ['2 à 4 mm', 'une feuille de muscle'],
        'Ouvertures': ['3', 'pour l\'œsophage, l\'aorte et une grosse veine']
      },
      daily: 'Vingt mille montées et descentes. C\'est le muscle le plus travailleur du corps — ' +
             'devant même le cœur, à ce compte-là.',
      facts: [
        { e: '😮', t: 'Le hoquet, c\'est lui : un spasme, une contraction brusque et involontaire, suivie du claquement des cordes vocales qui se referment.' },
        { e: '🎺', t: 'Chanter, crier, souffler dans une trompette : c\'est lui qu\'on apprend à maîtriser. Le « souffle » des chanteurs, c\'est du diaphragme.' }
      ]
    },

    /* ═══════════════ SYSTÈME DIGESTIF ═══════════════ */
    {
      id: 'oesophage', name: 'L\'œsophage', short: 'Œsophage', system: 'digestif',
      color: '#d9a68c', hi: '#f7d6c4',
      role: 'Le toboggan qui mène de la gorge à l\'estomac. Il ne se contente pas de laisser ' +
            'tomber : ses muscles poussent la bouchée par vagues successives.',
      where: 'Derrière la trachée, il traverse la poitrine et perce le diaphragme pour rejoindre l\'estomac.',
      stats: {
        'Longueur': ['25 cm', ''],
        'Trajet d\'une bouchée': ['5 à 8 secondes', ''],
        'Déglutitions': ['600 par jour', 'repas et salive compris'],
        'Muscles': ['2 couches', 'une en anneaux, une en longueur']
      },
      daily: 'Six cents passages, dont beaucoup sans que tu t\'en aperçoives : on avale sa salive ' +
             'toutes les deux minutes environ.',
      facts: [
        { e: '🙃', t: 'Tu pourrais boire la tête en bas. Ce n\'est pas la gravité qui fait descendre la bouchée mais une onde musculaire, le péristaltisme.' },
        { e: '🚪', t: 'À son extrémité, un anneau musculaire reste fermé pour empêcher l\'acide de remonter. Quand il ferme mal, c\'est la sensation de brûlure d\'estomac.' }
      ]
    },
    {
      id: 'estomac', name: 'L\'estomac', short: 'Estomac', system: 'digestif',
      color: '#e0a05a', hi: '#ffd39b',
      role: 'Une poche musclée qui brasse, acidifie et prédigère. Ce qui en sort n\'a plus rien ' +
            'd\'un repas : c\'est une bouillie prête à être absorbée plus loin.',
      where: 'En haut à gauche du ventre, sous les côtes et sous le diaphragme, en forme de J.',
      stats: {
        'Contenance': ['1 à 1,5 litre', 'jusqu\'à 4 dans un grand repas'],
        'Acidité': ['pH 1,5 à 3,5', 'assez pour attaquer le métal'],
        'Séjour d\'un repas': ['2 à 4 heures', ''],
        'Muqueuse renouvelée': ['tous les 3 jours', 'sinon il se digérerait lui-même']
      },
      daily: 'Il produit environ deux litres de suc gastrique et refait sa paroi intérieure ' +
             'plusieurs fois par semaine.',
      facts: [
        { e: '🧪', t: 'Son acide est assez fort pour attaquer le métal. S\'il ne se troue pas, c\'est qu\'une couche de mucus le tapisse et se refait sans arrêt.' },
        { e: '🍽️', t: 'La digestion ne commence pas là : la salive attaque déjà l\'amidon dans la bouche. Mâche un morceau de pain longtemps, il devient sucré.' }
      ]
    },
    {
      id: 'foie', name: 'Le foie', short: 'Foie', system: 'digestif',
      color: '#9c4a38', hi: '#e0836a',
      role: 'L\'usine chimique du corps : plus de cinq cents tâches différentes. Il filtre le sang ' +
            'venu de l\'intestin, stocke les sucres et les vitamines, neutralise les poisons et fabrique la bile.',
      where: 'En haut à droite du ventre, sous les côtes, posé sur l\'estomac et l\'intestin — ' +
             'le plus gros organe interne.',
      stats: {
        'Poids': ['1,5 kg', 'le plus lourd des organes internes'],
        'Fonctions': ['plus de 500', ''],
        'Sang filtré': ['1,4 litre par minute', 'soit 2 000 litres par jour'],
        'Bile produite': ['1 litre par jour', 'pour dissoudre les graisses']
      },
      daily: 'Deux mille litres de sang passés au crible, un litre de bile fabriqué, ' +
             'et une réserve de sucre tenue à jour heure par heure.',
      facts: [
        { e: '🌱', t: 'C\'est le seul organe interne qui repousse. On peut en prélever une grande part : en quelques mois, il retrouve sa taille — ce qui rend possible le don de foie entre vivants.' },
        { e: '🔥', t: 'Toute cette activité chimique dégage de la chaleur : le foie est l\'un des points les plus chauds du corps, et il participe à te maintenir à 37 °C.' }
      ]
    },
    {
      id: 'pancreas', name: 'Le pancréas', short: 'Pancréas', system: 'digestif',
      color: '#d8c070', hi: '#f7ecb0',
      role: 'Deux métiers dans un seul organe : il déverse dans l\'intestin les enzymes qui ' +
            'découpent les aliments, et envoie dans le sang l\'insuline qui règle le taux de sucre.',
      where: 'Couché en travers, derrière l\'estomac, sa tête calée dans la courbe de l\'intestin.',
      stats: {
        'Longueur': ['15 cm', ''],
        'Poids': ['80 g', ''],
        'Suc digestif': ['1,5 litre par jour', ''],
        'Îlots': ['1 million', 'les usines à insuline']
      },
      daily: 'Un litre et demi d\'enzymes envoyé dans l\'intestin, et un réglage du sucre sanguin ' +
             'ajusté minute par minute, à chaque bouchée.',
      facts: [
        { e: '🍬', t: 'Quand ses îlots ne fabriquent plus d\'insuline, c\'est le diabète de type 1. Avant sa découverte en 1921, la maladie était mortelle en quelques mois.' },
        { e: '✂️', t: 'Ses enzymes sont si puissantes qu\'elles sont fabriquées sous forme inactive et ne s\'allument qu\'une fois arrivées dans l\'intestin.' }
      ]
    },
    {
      id: 'grele', name: 'L\'intestin grêle', short: 'Intestin grêle', system: 'digestif',
      color: '#e8a87c', hi: '#ffd7b8',
      role: 'C\'est là que tout se joue : sept mètres de tuyau replié où les nutriments passent ' +
            'dans le sang. Sa paroi est couverte de millions de petits doigts, les villosités.',
      where: 'Replié au centre du ventre, en dessous de l\'estomac, encadré par le gros intestin.',
      stats: {
        'Longueur': ['6 à 7 m', 'plié dans ton ventre'],
        'Surface': ['30 m²', 'grâce aux villosités'],
        'Trajet': ['3 à 5 heures', ''],
        'Parties': ['3', 'duodénum, jéjunum, iléon']
      },
      daily: 'Il absorbe l\'essentiel de ce que tu manges et de ce que tu bois — plusieurs litres ' +
             'par jour, en comptant les sucs digestifs qu\'il récupère.',
      facts: [
        { e: '📐', t: 'Les vieux manuels annonçaient 250 m² de surface, la taille d\'un court de tennis. Les mesures récentes donnent plutôt une trentaine de mètres carrés — une pièce, ce qui reste énorme pour un tuyau.' },
        { e: '🌊', t: 'Il ondule sans arrêt, même vide : ce sont ces contractions à vide qui font gargouiller un ventre affamé.' }
      ]
    },
    {
      id: 'colon', name: 'Le gros intestin', short: 'Gros intestin', system: 'digestif',
      color: '#c98a5e', hi: '#f0bd94',
      role: 'Le dernier tronçon : il récupère l\'eau et les sels, et héberge un peuple de bactéries ' +
            'qui finissent le travail en digérant ce que nous ne savons pas digérer.',
      where: 'Il fait le tour du ventre : il monte à droite, traverse sous l\'estomac, ' +
             'descend à gauche, puis vire vers la sortie.',
      stats: {
        'Longueur': ['1,5 m', ''],
        'Eau récupérée': ['1,5 litre par jour', ''],
        'Bactéries': ['des dizaines de milliers de milliards', 'autant que tes propres cellules'],
        'Trajet': ['12 à 48 heures', 'la plus longue étape']
      },
      daily: 'Il récupère un litre et demi d\'eau — sans lui, on se déshydraterait à chaque repas — ' +
             'et nourrit un microbiote qui pèse environ deux kilos.',
      facts: [
        { e: '🦠', t: 'Tu portes à peu près autant de bactéries que de cellules humaines, et la plupart vivent là. Elles fabriquent pour toi des vitamines, dont la vitamine K.' },
        { e: '🥦', t: 'Les fibres des légumes ne sont pas digestibles par nous : ce sont elles qui nourrissent le microbiote. Voilà pourquoi les légumes comptent autant.' }
      ]
    },

    /* ═══════════════ SYSTÈME URINAIRE ═══════════════ */
    {
      id: 'reins', name: 'Les reins', short: 'Reins', system: 'urinaire',
      color: '#a05a6e', hi: '#e29cae',
      role: 'Deux stations d\'épuration en forme de haricot. Ils trient le sang goutte à goutte : ' +
            'ils gardent l\'eau et les sels utiles, jettent les déchets, et règlent la tension.',
      where: 'De part et d\'autre de la colonne, dans le dos, à hauteur des dernières côtes. ' +
             'Le droit est un peu plus bas, à cause du foie.',
      stats: {
        'Poids': ['150 g chacun', ''],
        'Néphrons': ['1 million par rein', 'les filtres élémentaires'],
        'Sang filtré': ['180 litres par jour', 'pour 1,5 litre d\'urine'],
        'Passages': ['300 fois par jour', 'tout ton sang y repasse']
      },
      daily: 'Cent quatre-vingts litres filtrés, dont ils réabsorbent 99 % : il ne sort ' +
             'qu\'un litre et demi d\'urine.',
      facts: [
        { e: '♻️', t: 'Ils filtrent 180 litres pour n\'en jeter qu\'un et demi. Presque tout est récupéré au passage — c\'est la plus grande usine de recyclage du corps.' },
        { e: '🫘', t: 'On peut vivre normalement avec un seul rein : il grossit et prend en charge le travail des deux. C\'est ce qui rend le don de rein possible.' }
      ]
    },
    {
      id: 'vessie', name: 'La vessie', short: 'Vessie', system: 'urinaire',
      color: '#6fc8b0', hi: '#b6f0e0',
      role: 'Le réservoir. Un sac de muscle très élastique qui se remplit goutte à goutte ' +
            'et prévient le cerveau quand il est temps d\'aller aux toilettes.',
      where: 'Tout en bas du ventre, derrière l\'os du pubis, au bout des deux tuyaux venus des reins.',
      stats: {
        'Contenance': ['400 à 500 ml', 'une grande canette'],
        'Première envie': ['vers 250 ml', ''],
        'Épaisseur à vide': ['1,5 cm', 'contre 3 mm pleine'],
        'Passages': ['5 à 7 par jour', '']
      },
      daily: 'Elle se remplit et se vide cinq à sept fois, et prévient le cerveau bien avant ' +
             'd\'être pleine — c\'est un système d\'alerte prudent.',
      facts: [
        { e: '🎈', t: 'Sa paroi passe de 1,5 cm à 3 mm en se remplissant : elle s\'étire comme un ballon, et son muscle sait rester détendu jusqu\'au dernier moment.' },
        { e: '🚦', t: 'Deux verrous la ferment : un involontaire et un que tu commandes. Apprendre à maîtriser le second, c\'est tout l\'enjeu de la propreté chez l\'enfant.' }
      ]
    },

    /* ═══════════════ SQUELETTE ═══════════════ */
    {
      id: 'squelette', name: 'Le squelette', short: 'Squelette', system: 'squelette',
      color: '#ece5d2', hi: '#ffffff',
      role: 'La charpente qui te tient debout, l\'armure qui protège le cerveau, le cœur et ' +
            'les poumons, et — on l\'oublie — l\'usine qui fabrique ton sang dans sa moelle.',
      where: 'Partout : 206 os, du crâne aux orteils. Plus de la moitié sont dans tes mains et tes pieds.',
      stats: {
        'Os': ['206', 'chez l\'adulte'],
        'À la naissance': ['environ 270', 'certains se soudent en grandissant'],
        'Le plus long': ['le fémur', 'un quart de ta taille'],
        'Le plus petit': ['l\'étrier', '3 mm, dans l\'oreille']
      },
      daily: 'Sa moelle fabrique environ deux millions de globules rouges par seconde, ' +
             'et il se reconstruit en permanence : ton squelette est entièrement renouvelé en dix ans.',
      facts: [
        { e: '🦴', t: 'L\'os est vivant et se refait sans arrêt : des cellules le démolissent, d\'autres le rebâtissent. Un os cassé qui a bien guéri redevient aussi solide qu\'avant.' },
        { e: '🖐️', t: 'Tes deux mains comptent 54 os et tes deux pieds 52 : à elles seules, tes extrémités rassemblent plus de la moitié de ton squelette.' }
      ]
    }
  ];

  AN.byId = function (id) {
    for (var i = 0; i < AN.organs.length; i++) {
      if (AN.organs[i].id === id) return AN.organs[i];
    }
    return null;
  };

  AN.systemOf = function (key) {
    for (var i = 0; i < AN.systems.length; i++) {
      if (AN.systems[i].key === key) return AN.systems[i];
    }
    return { key: key, label: key, color: '#f0c04b', blurb: '' };
  };
})(window);
