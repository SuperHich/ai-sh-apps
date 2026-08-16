/**
 * L'Atelier — création de contenus
 * ------------------------------------------------------------------
 * Deux chemins vers la même sortie (une page HTML autonome au style du
 * Grenier) :
 *   • mode guidé : le texte saisi passe dans GRENIER.buildStoryPage() ;
 *   • mode IA    : Claude écrit la page, appelé directement depuis le
 *                  navigateur avec la clé de l'utilisateur.
 *
 * Le site étant statique, il n'y a pas de serveur pour relayer l'appel :
 * la requête part du navigateur vers api.anthropic.com, ce qui exige
 * l'en-tête anthropic-dangerous-direct-browser-access. La clé n'est
 * stockée que si l'utilisateur le demande explicitement.
 */
(function (global) {
  'use strict';

  var GRENIER = global.GRENIER;
  var auth = GRENIER.auth;

  var API_URL = 'https://api.anthropic.com/v1/messages';
  var MODEL = 'claude-opus-5';
  var API_VERSION = '2023-06-01';
  var FALLBACK_BETA = 'server-side-fallback-2026-07-01';
  var K_KEY = 'grenier.apikey';
  var K_CREATIONS = 'grenier.creations';

  var el = {};
  var current = null;   // { html, meta }
  var mode = 'guide';

  function $(id) { return document.getElementById(id); }

  /* ══════════════════════════════════════════════════════════════
     Accès
     ══════════════════════════════════════════════════════════════ */

  /** L'Atelier est-il exposé ? Drapeau du catalogue, ou ?preview=1. */
  function isExposed() {
    if (GRENIER.features && GRENIER.features.atelier) return true;
    return new URLSearchParams(location.search).get('preview') === '1';
  }

  function applyAccess() {
    if (!isExposed()) {
      $('soon').hidden = false;
      $('gate').hidden = true;
      $('studio').hidden = true;
      return;
    }
    $('soon').hidden = true;
    var user = auth.current();
    $('gate').hidden = !!user;
    $('studio').hidden = !user;
    if (user) renderMine();
  }

  /* ══════════════════════════════════════════════════════════════
     Formulaire
     ══════════════════════════════════════════════════════════════ */

  function fillCategories() {
    var select = $('f-cat');
    select.innerHTML = GRENIER.categories.map(function (cat) {
      return '<option value="' + cat.key + '">' + cat.emoji + '  ' + cat.label + '</option>';
    }).join('');
  }

  function readMeta() {
    var catKey = $('f-cat').value;
    return {
      title: $('f-title').value.trim(),
      emoji: $('f-emoji').value.trim() || '✨',
      cat: catKey,
      accent: GRENIER.categoryOf(catKey).accent,
      age: Number($('f-age').value),
      desc: $('f-desc').value.trim(),
      subtitle: $('f-subtitle').value.trim(),
      moral: $('f-moral').value.trim(),
      rtl: $('f-rtl').checked
    };
  }

  function setMode(next) {
    mode = next;
    document.querySelectorAll('.gr-tabs .gr-tab[data-mode]').forEach(function (tab) {
      tab.classList.toggle('is-on', tab.getAttribute('data-mode') === next);
    });
    document.querySelectorAll('[data-panel]').forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-panel') !== next;
    });
  }

  /* ══════════════════════════════════════════════════════════════
     Aperçu
     ══════════════════════════════════════════════════════════════ */

  function showPreview(html, meta) {
    current = { html: html, meta: meta };
    var frame = $('preview');
    frame.srcdoc = html;
    frame.hidden = false;
    $('previewEmpty').hidden = true;
    $('previewActions').hidden = false;
    $('saveHint').hidden = false;
  }

  function clearPreview() {
    current = null;
    var frame = $('preview');
    frame.srcdoc = '';
    frame.hidden = true;
    $('previewEmpty').hidden = false;
    $('previewActions').hidden = true;
    $('saveHint').hidden = true;
  }

  /* ══════════════════════════════════════════════════════════════
     Mode guidé
     ══════════════════════════════════════════════════════════════ */

  function buildFromForm() {
    var meta = readMeta();
    var text = $('f-text').value.trim();

    if (!meta.title) return alert('Donnez d\'abord un titre à votre histoire.');
    if (!text) return alert('Le texte de l\'histoire est vide.');

    var html = GRENIER.buildStoryPage({
      title: meta.title,
      emoji: meta.emoji,
      subtitle: meta.subtitle,
      accent: meta.accent,
      moral: meta.moral,
      rtl: meta.rtl,
      text: text
    });

    if (!meta.desc) {
      var first = GRENIER.parseChapters(text)[0];
      var para = (first && first.paragraphs[0]) || '';
      meta.desc = para.length > 150 ? para.slice(0, 147) + '…' : para;
      $('f-desc').value = meta.desc;
    }

    showPreview(html, meta);
  }

  /* ══════════════════════════════════════════════════════════════
     Mode IA — appel direct à l'API Anthropic
     ══════════════════════════════════════════════════════════════ */

  var CHAPTER_COUNTS = { courte: 3, moyenne: 5, longue: 8 };

  function systemPrompt(meta, chapters) {
    return [
      'Tu écris pour « Le Grenier des Apps », une bibliothèque d\'histoires lues en famille.',
      'Tu produis un document HTML complet et autonome, prêt à ouvrir dans un navigateur.',
      '',
      'Style de la maison, à respecter :',
      '- HTML/CSS/JS vanilla uniquement : pas de framework, pas de build, aucune image binaire.',
      '  Les illustrations éventuelles sont des <svg> écrits à la main.',
      '- Polices via Google Fonts : "Cormorant Garamond" pour les titres, "Nunito" pour le texte.',
      '- Fond sombre, texte clair, une couleur d\'accent unique : ' + meta.accent + '.',
      '- Un <header class="hero"> plein écran : grand emoji, <h1> du titre, accroche en italique.',
      '- Ensuite une <section class="chapter"> plein écran par chapitre, avec scroll-snap vertical,',
      '  un <span class="chapter-num"> numérotant le chapitre, un <h2> de titre, puis des <p>.',
      '- Une dernière <section class="chapter ending"> contenant la morale dans un <blockquote>.',
      '- Tout tient dans un seul fichier, avec le CSS dans une balise <style> du <head>.',
      '- Responsive et lisible sur téléphone ; respecte prefers-reduced-motion si tu animes.',
      '',
      'Contraintes du récit :',
      '- Langue : ' + (meta.rtl ? 'arabe littéraire simple, avec <html lang="ar" dir="rtl">' : 'français clair et vivant'),
      '- Public : enfants à partir de ' + meta.age + ' ans, lu à voix haute en famille.',
      '- Exactement ' + chapters + ' chapitres, chacun avec un titre et 3 à 6 paragraphes.',
      '- Un récit qui va au bout : situation, péripéties, résolution, puis une morale en une phrase.',
      '- Rien d\'effrayant ni de violent ; bienveillant, imagé, avec des dialogues.',
      '',
      'Réponds UNIQUEMENT par le document HTML, en commençant par <!DOCTYPE html>.',
      'Aucun commentaire, aucune explication, aucune clôture en blocs de code Markdown.'
    ].join('\n');
  }

  function userPrompt(meta, idea) {
    var lines = ['Idée de départ : ' + idea];
    if (meta.title) lines.push('Titre imposé : ' + meta.title);
    lines.push('Univers de la bibliothèque : ' + GRENIER.categoryOf(meta.cat).label);
    if (meta.emoji) lines.push('Emoji de la page : ' + meta.emoji);
    if (meta.subtitle) lines.push('Accroche souhaitée : ' + meta.subtitle);
    if (meta.moral) lines.push('Morale souhaitée : ' + meta.moral);
    return lines.join('\n');
  }

  function log(message, reset) {
    var box = $('log');
    box.hidden = false;
    if (reset) box.textContent = '';
    box.textContent += message;
    box.scrollTop = box.scrollHeight;
  }

  function buildRequest(meta, idea, chapters, effort, withFallback) {
    var headers = {
      'content-type': 'application/json',
      'x-api-key': $('f-key').value.trim(),
      'anthropic-version': API_VERSION,
      /* Sans cet en-tête, le navigateur est refusé par l'API. */
      'anthropic-dangerous-direct-browser-access': 'true'
    };
    if (withFallback) headers['anthropic-beta'] = FALLBACK_BETA;

    var body = {
      model: MODEL,
      /* max_tokens plafonne réflexion + texte : on laisse de la marge. */
      max_tokens: 32000,
      stream: true,
      output_config: { effort: effort },
      system: systemPrompt(meta, chapters),
      messages: [{ role: 'user', content: userPrompt(meta, idea) }]
    };
    /* Si un garde-fou de sécurité décline la demande, l'API rejoue
       l'appel sur le modèle de repli recommandé plutôt que d'échouer. */
    if (withFallback) body.fallbacks = 'default';

    return { headers: headers, body: JSON.stringify(body) };
  }

  /** Lit un flux SSE et renvoie le texte assemblé. */
  function readStream(response, onText) {
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    var text = '';
    var stopReason = null;

    function pump() {
      return reader.read().then(function (chunk) {
        if (chunk.done) return { text: text, stopReason: stopReason };
        buffer += decoder.decode(chunk.value, { stream: true });

        var blocks = buffer.split('\n\n');
        buffer = blocks.pop();

        blocks.forEach(function (block) {
          block.split('\n').forEach(function (line) {
            if (line.indexOf('data:') !== 0) return;
            var payload = line.slice(5).trim();
            if (!payload || payload === '[DONE]') return;

            var event;
            try { event = JSON.parse(payload); } catch (e) { return; }

            if (event.type === 'content_block_delta' && event.delta && event.delta.type === 'text_delta') {
              text += event.delta.text;
              onText(event.delta.text, text);
            } else if (event.type === 'message_delta' && event.delta) {
              stopReason = event.delta.stop_reason || stopReason;
            } else if (event.type === 'error') {
              throw new Error((event.error && event.error.message) || 'Erreur du flux.');
            }
          });
        });

        return pump();
      });
    }
    return pump();
  }

  function extractHtml(raw) {
    var text = String(raw).trim();
    text = text.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/, '');
    var start = text.search(/<!DOCTYPE html/i);
    if (start < 0) start = text.search(/<html[\s>]/i);
    if (start > 0) text = text.slice(start);
    var end = text.toLowerCase().lastIndexOf('</html>');
    if (end >= 0) text = text.slice(0, end + 7);
    return text.trim();
  }

  function metaFromHtml(html, meta) {
    var doc;
    try {
      doc = new DOMParser().parseFromString(html, 'text/html');
    } catch (e) {
      return meta;
    }
    if (!meta.title) {
      var h1 = doc.querySelector('h1');
      meta.title = (h1 && h1.textContent.trim()) || (doc.title || '').trim() || 'Histoire sans titre';
      $('f-title').value = meta.title;
    }
    if (!meta.desc) {
      var p = doc.querySelector('.hero p') || doc.querySelector('.chapter p') || doc.querySelector('p');
      var text = p ? p.textContent.trim().replace(/\s+/g, ' ') : '';
      meta.desc = text.length > 160 ? text.slice(0, 157) + '…' : text;
      $('f-desc').value = meta.desc;
    }
    return meta;
  }

  function generate() {
    var key = $('f-key').value.trim();
    var idea = $('f-prompt').value.trim();
    var meta = readMeta();

    if (!key) return alert('Renseignez votre clé API Anthropic pour utiliser la génération.');
    if (!idea) return alert('Décrivez en une ou deux phrases l\'histoire que vous voulez.');

    if ($('f-remember').checked) {
      GRENIER.storage.write(K_KEY, key);
    } else {
      try { localStorage.removeItem(K_KEY); } catch (e) { /* stockage indisponible */ }
    }

    var chapters = CHAPTER_COUNTS[$('f-length').value] || 5;
    var effort = $('f-effort').value;
    var button = $('generateBtn');
    button.disabled = true;
    button.textContent = 'Claude écrit…';
    log('Connexion à l\'API Anthropic (' + MODEL + ', effort « ' + effort + '· »)…\n', true);

    var received = 0;

    function call(withFallback) {
      var req = buildRequest(meta, idea, chapters, effort, withFallback);
      return fetch(API_URL, { method: 'POST', headers: req.headers, body: req.body })
        .then(function (response) {
          if (response.ok) return response;
          return response.text().then(function (raw) {
            var detail = raw;
            try { detail = JSON.parse(raw).error.message; } catch (e) { /* texte brut */ }
            /* Le repli côté serveur est une bêta : si le compte ne l'a pas,
               on refait l'appel sans, plutôt que d'échouer. */
            if (withFallback && (response.status === 400 || response.status === 403) &&
                /fallback|beta/i.test(String(detail))) {
              log('Repli automatique indisponible sur ce compte — nouvel essai sans.\n');
              return call(false);
            }
            var err = new Error(detail || ('Erreur HTTP ' + response.status));
            err.status = response.status;
            throw err;
          });
        });
    }

    call(true)
      .then(function (response) {
        if (!response.body) throw new Error('Ce navigateur ne sait pas lire une réponse en flux.');
        log('Réception du texte…\n');
        return readStream(response, function (delta, all) {
          received = all.length;
          if (delta.indexOf('\n') >= 0 || received % 400 < delta.length) {
            log('.', false);
          }
        });
      })
      .then(function (result) {
        if (result.stopReason === 'refusal') {
          throw new Error('La demande a été déclinée par les garde-fous du modèle. Reformulez votre idée.');
        }
        var html = extractHtml(result.text);
        if (!/<html[\s>]/i.test(html)) {
          throw new Error('La réponse ne contient pas de page HTML exploitable. Réessayez.');
        }
        log('\nTerminé : ' + html.length.toLocaleString('fr-FR') + ' caractères.\n');
        showPreview(html, metaFromHtml(html, meta));
      })
      .catch(function (err) {
        var message = err && err.message ? err.message : String(err);
        if (/Failed to fetch|NetworkError/i.test(message)) {
          message = 'Impossible de joindre api.anthropic.com. Vérifiez votre connexion, ' +
            'votre bloqueur de contenu, et que la page est bien servie en HTTPS.';
        }
        log('\n⚠ ' + message + '\n');
      })
      .then(function () {
        button.disabled = false;
        button.textContent = '✨ Générer l\'histoire';
      });
  }

  /* ══════════════════════════════════════════════════════════════
     Enregistrement et export
     ══════════════════════════════════════════════════════════════ */

  function slugify(value) {
    return String(value).toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50) || 'creation';
  }

  function save() {
    if (!current) return;
    var meta = Object.assign({}, current.meta, readMeta());
    if (!meta.title) return alert('Donnez un titre avant d\'ajouter à la bibliothèque.');

    var list = GRENIER.storage.read(K_CREATIONS, []);
    list.unshift({
      id: 'mine-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
      title: meta.title,
      emoji: meta.emoji,
      desc: meta.desc || 'Une création de votre Atelier.',
      cat: meta.cat,
      kind: 'histoire',
      age: meta.age,
      html: current.html,
      createdAt: new Date().toISOString()
    });

    if (!GRENIER.storage.write(K_CREATIONS, list)) {
      return alert('Le stockage du navigateur est plein ou bloqué : impossible d\'enregistrer. ' +
        'Téléchargez plutôt le fichier HTML.');
    }
    renderMine();
    alert('« ' + meta.title + ' » a rejoint votre bibliothèque.');
  }

  function download() {
    if (!current) return;
    var name = slugify(readMeta().title || 'creation') + '.html';
    var blob = new Blob([current.html], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function renderMine() {
    var list = GRENIER.storage.read(K_CREATIONS, []);
    $('mineSection').hidden = list.length === 0;
    var box = $('mineList');
    box.innerHTML = '';

    list.forEach(function (creation) {
      var row = document.createElement('div');
      row.className = 'mine-row';
      row.innerHTML =
        '<span class="emoji" aria-hidden="true">' + creation.emoji + '</span>' +
        '<div class="meta">' +
          '<strong>' + GRENIER.escapeHtml(creation.title) + '</strong>' +
          '<small>' + GRENIER.escapeHtml(GRENIER.categoryOf(creation.cat).label) + ' · ' +
          new Date(creation.createdAt).toLocaleDateString('fr-FR') + '</small>' +
        '</div>' +
        '<div class="actions">' +
          '<a class="gr-btn gr-btn-sm" href="lecture.html?id=' + encodeURIComponent(creation.id) + '">Lire</a>' +
          '<button class="gr-btn gr-btn-sm gr-btn-ghost" type="button">Supprimer</button>' +
        '</div>';

      row.querySelector('button').addEventListener('click', function () {
        if (!confirm('Supprimer « ' + creation.title + ' » ? Cette action est définitive.')) return;
        var kept = GRENIER.storage.read(K_CREATIONS, []).filter(function (c) { return c.id !== creation.id; });
        GRENIER.storage.write(K_CREATIONS, kept);
        renderMine();
      });

      box.appendChild(row);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     Démarrage
     ══════════════════════════════════════════════════════════════ */

  function start() {
    fillCategories();
    clearPreview();

    var savedKey = GRENIER.storage.read(K_KEY, '');
    if (savedKey) {
      $('f-key').value = savedKey;
      $('f-remember').checked = true;
    }

    document.querySelectorAll('.gr-tabs .gr-tab[data-mode]').forEach(function (tab) {
      tab.addEventListener('click', function () { setMode(tab.getAttribute('data-mode')); });
    });

    $('buildBtn').addEventListener('click', buildFromForm);
    $('generateBtn').addEventListener('click', generate);
    $('saveBtn').addEventListener('click', save);
    $('downloadBtn').addEventListener('click', download);
    $('resetBtn').addEventListener('click', clearPreview);

    $('gate').querySelector('[data-gr="join"]').addEventListener('click', function () {
      auth.openModal({ mode: 'signup', title: 'Rejoindre le Grenier', message: 'L\'Atelier s\'ouvre juste après.' });
    });
    $('gate').querySelector('[data-gr="login"]').addEventListener('click', function () {
      auth.openModal({ mode: 'login', title: 'Content de vous revoir', message: 'L\'Atelier s\'ouvre juste après.' });
    });

    applyAccess();
    auth.onChange(applyAccess);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window);
