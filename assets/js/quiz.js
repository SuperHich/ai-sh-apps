/**
 * Quiz du Grenier
 * ------------------------------------------------------------------
 * Une seule page pour tous les quiz : sans paramètre, elle propose les
 * univers disponibles ; avec ?univers=<clé>, elle déroule les questions.
 *
 * Trois règles de conception :
 *   - une question à la fois, pour ne pas noyer un lecteur de 7 ans ;
 *   - la réponse est corrigée tout de suite, avec une phrase d'explication
 *     et un lien vers l'histoire d'où elle vient : le quiz ramène toujours
 *     au contenu ;
 *   - tout est jouable au clavier (1-4 pour répondre, Entrée pour avancer),
 *     et les changements d'état sont annoncés aux lecteurs d'écran.
 */
(function (global) {
  'use strict';

  var GRENIER = global.GRENIER;

  function $(id) { return document.getElementById(id); }

  var el = {
    hub: $('quizHub'),
    hubGrid: $('hubGrid'),
    jeu: $('quizJeu'),
    fil: $('quizFil'),
    barre: $('quizBarre'),
    compteur: $('quizCompteur'),
    question: $('quizQuestion'),
    choix: $('quizChoix'),
    retour: $('quizRetour'),
    suivant: $('quizSuivant'),
    fin: $('quizFin'),
    score: $('quizScore'),
    bilan: $('quizBilan'),
    revoir: $('quizRevoir'),
    titre: $('quizTitre'),
    soustitre: $('quizSousTitre')
  };

  var etat = {
    cle: null,
    quiz: null,
    questions: [],
    index: 0,
    bonnes: 0,
    repondu: false,
    ratees: []
  };

  /* ── Utilitaires ───────────────────────────────────────────── */

  var esc = function (v) { return GRENIER.escapeHtml(v); };

  /** Mélange de Fisher-Yates : deux parties de suite ne se ressemblent pas. */
  function melanger(liste) {
    var copie = liste.slice();
    for (var i = copie.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = copie[i]; copie[i] = copie[j]; copie[j] = t;
    }
    return copie;
  }

  /**
   * Prépare une question : les propositions sont mélangées, donc l'index de
   * la bonne réponse est recalculé. Sans ça, la bonne réponse serait
   * toujours au même endroit d'une partie à l'autre.
   */
  function preparer(question) {
    var bonneValeur = question.choix[question.bonne];
    var choix = melanger(question.choix);
    return {
      q: question.q,
      choix: choix,
      bonne: choix.indexOf(bonneValeur),
      note: question.note,
      source: question.source
    };
  }

  function lienSource(id) {
    var item = GRENIER.itemById(id);
    if (!item) return null;
    return { titre: item.title, href: GRENIER.base + GRENIER.hrefOf(item), emoji: item.emoji };
  }

  /* ── Choix de l'univers ────────────────────────────────────── */

  function montrerHub() {
    el.hub.hidden = false;
    el.jeu.hidden = true;
    el.fin.hidden = true;
    document.title = 'Les quiz du Grenier — Le Grenier des Apps';

    el.hubGrid.innerHTML = '';
    Object.keys(GRENIER.quizzes).forEach(function (cle, i) {
      var quiz = GRENIER.quizzes[cle];
      var cat = GRENIER.categoryOf(cle);

      var carte = document.createElement('a');
      carte.className = 'quiz-univers gr-reveal';
      carte.href = '?univers=' + encodeURIComponent(cle);
      carte.style.setProperty('--accent', cat.accent);
      carte.style.setProperty('--i', i);
      carte.innerHTML =
        '<span class="quiz-univers-emoji" aria-hidden="true">' + cat.emoji + '</span>' +
        '<strong>' + esc(quiz.titre) + '</strong>' +
        '<small>' + esc(quiz.sousTitre) + '</small>' +
        '<span class="gr-badge">' + quiz.questions.length + ' questions</span>';
      el.hubGrid.appendChild(carte);
    });
    GRENIER.observeReveals(el.hub);
  }

  /* ── Déroulé d'une partie ──────────────────────────────────── */

  function demarrer(cle) {
    var quiz = GRENIER.quizzes[cle];
    var cat = GRENIER.categoryOf(cle);

    etat.cle = cle;
    etat.quiz = quiz;
    etat.questions = melanger(quiz.questions).map(preparer);
    etat.index = 0;
    etat.bonnes = 0;
    etat.ratees = [];

    document.title = 'Quiz ' + quiz.titre + ' — Le Grenier des Apps';
    document.body.style.setProperty('--accent', cat.accent);
    el.titre.textContent = 'Quiz · ' + quiz.titre;
    el.soustitre.textContent = quiz.sousTitre;

    el.hub.hidden = true;
    el.fin.hidden = true;
    el.jeu.hidden = false;
    poserQuestion();
  }

  function poserQuestion() {
    var question = etat.questions[etat.index];
    etat.repondu = false;

    el.compteur.textContent = 'Question ' + (etat.index + 1) + ' sur ' + etat.questions.length;
    el.barre.style.width = (etat.index / etat.questions.length * 100) + '%';
    el.question.textContent = question.q;
    el.retour.hidden = true;
    el.retour.innerHTML = '';
    el.suivant.hidden = true;

    el.choix.innerHTML = '';
    question.choix.forEach(function (texte, i) {
      var b = document.createElement('button');
      b.className = 'quiz-choix';
      b.type = 'button';
      b.innerHTML = '<span class="quiz-touche" aria-hidden="true">' + (i + 1) + '</span>' +
        '<span>' + esc(texte) + '</span>';
      b.addEventListener('click', function () { repondre(i); });
      el.choix.appendChild(b);
    });
    el.choix.firstChild.focus();
  }

  function repondre(choisi) {
    if (etat.repondu) return;
    etat.repondu = true;

    var question = etat.questions[etat.index];
    var juste = choisi === question.bonne;
    if (juste) etat.bonnes++;
    else etat.ratees.push(question);

    var boutons = el.choix.querySelectorAll('.quiz-choix');
    for (var i = 0; i < boutons.length; i++) {
      boutons[i].disabled = true;
      if (i === question.bonne) boutons[i].classList.add('is-bonne');
      else if (i === choisi) boutons[i].classList.add('is-ratee');
    }

    var source = lienSource(question.source);
    el.retour.className = 'quiz-retour ' + (juste ? 'is-bonne' : 'is-ratee');
    el.retour.innerHTML =
      '<strong>' + (juste ? '✓ Bien vu !' : '✗ Raté — c\'était : ' + esc(question.choix[question.bonne])) + '</strong>' +
      '<p>' + esc(question.note) + '</p>' +
      (source ? '<a href="' + source.href + '">' +
        (source.emoji || '📖') + ' Revoir « ' + esc(source.titre) + ' »</a>' : '');
    el.retour.hidden = false;

    var dernier = etat.index === etat.questions.length - 1;
    el.suivant.textContent = dernier ? 'Voir mon score' : 'Question suivante';
    el.suivant.hidden = false;
    el.suivant.focus();
  }

  function avancer() {
    if (!etat.repondu) return;
    if (etat.index < etat.questions.length - 1) {
      etat.index++;
      poserQuestion();
    } else {
      terminer();
    }
  }

  /* ── Fin de partie ─────────────────────────────────────────── */

  function terminer() {
    var total = etat.questions.length;
    var n = etat.bonnes;
    el.barre.style.width = '100%';
    el.jeu.hidden = true;
    el.fin.hidden = false;

    var mot = n === total ? 'Sans faute !'
      : n >= total * 0.7 ? 'Beau score.'
      : n >= total * 0.4 ? 'Pas mal — il reste des histoires à relire.'
      : 'Le quiz ramène aux histoires : elles ont toutes les réponses.';

    el.score.innerHTML = '<b>' + n + '</b> <span>sur ' + total + '</span>';
    el.bilan.textContent = mot;

    el.revoir.innerHTML = '';
    if (etat.ratees.length) {
      var vus = {};
      var liens = etat.ratees.map(function (q) { return lienSource(q.source); })
        .filter(function (s) {
          if (!s || vus[s.href]) return false;
          vus[s.href] = true;
          return true;
        });
      if (liens.length) {
        var titre = document.createElement('p');
        titre.className = 'quiz-revoir-titre';
        titre.textContent = 'À relire :';
        el.revoir.appendChild(titre);
        liens.forEach(function (s) {
          var a = document.createElement('a');
          a.className = 'gr-btn';
          a.href = s.href;
          a.textContent = (s.emoji || '📖') + ' ' + s.titre;
          el.revoir.appendChild(a);
        });
      }
    }
    el.fin.querySelector('[data-gr="rejouer"]').focus();
  }

  /* ── Clavier ───────────────────────────────────────────────── */

  document.addEventListener('keydown', function (e) {
    if (el.jeu.hidden) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (!etat.repondu && /^[1-4]$/.test(e.key)) {
      var boutons = el.choix.querySelectorAll('.quiz-choix');
      var i = Number(e.key) - 1;
      if (boutons[i]) { e.preventDefault(); repondre(i); }
    } else if (etat.repondu && (e.key === 'Enter' || e.key === ' ')) {
      /* Entrée sur le bouton « suivant » suffit déjà ; ce raccourci sert
         quand le focus a été perdu (clic dans le vide, par exemple). */
      if (document.activeElement !== el.suivant) { e.preventDefault(); avancer(); }
    }
  });

  /* ── Démarrage ─────────────────────────────────────────────── */

  function start() {
    el.suivant.addEventListener('click', avancer);
    el.fin.querySelector('[data-gr="rejouer"]').addEventListener('click', function () {
      demarrer(etat.cle);
    });

    var cle = new URLSearchParams(location.search).get('univers');
    if (cle && GRENIER.quizzes[cle]) demarrer(cle);
    else montrerHub();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window);
