/**
 * Gabarit de page « histoire » du Grenier
 * ------------------------------------------------------------------
 * Reproduit la charte des histoires existantes (stories/*) : sections
 * plein écran avec scroll-snap, chapitre par section, palette dérivée de
 * l'univers choisi, morale en clôture. Utilisé par l'Atelier en mode
 * guidé, et décrit au modèle en mode IA pour que les deux se ressemblent.
 */
(function (global) {
  'use strict';

  var GRENIER = global.GRENIER || (global.GRENIER = {});

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /**
   * Découpe un texte brut en chapitres.
   * Un titre de chapitre est une ligne commençant par « ## » ou « Chapitre N ».
   * Les paragraphes sont séparés par une ligne vide.
   */
  function parseChapters(raw) {
    var lines = String(raw || '').replace(/\r\n?/g, '\n').split('\n');
    var chapters = [];
    var current = null;
    var buffer = [];

    function flushParagraph() {
      var text = buffer.join(' ').trim();
      buffer = [];
      if (!text) return;
      if (!current) current = { title: '', paragraphs: [] };
      current.paragraphs.push(text);
    }

    function flushChapter() {
      flushParagraph();
      if (current && (current.title || current.paragraphs.length)) chapters.push(current);
      current = null;
    }

    lines.forEach(function (line) {
      var heading = line.match(/^\s*(?:#{1,4}\s*|Chapitre\s+\d+\s*[:.\-—]?\s*)(.+?)\s*$/i);
      var isHeading = /^\s*#{1,4}\s+/.test(line) || /^\s*Chapitre\s+\d+\b/i.test(line);

      if (isHeading && heading) {
        flushChapter();
        current = { title: heading[1], paragraphs: [] };
      } else if (!line.trim()) {
        flushParagraph();
      } else {
        buffer.push(line.trim());
      }
    });
    flushChapter();

    return chapters.length ? chapters : [{ title: '', paragraphs: [String(raw || '').trim()].filter(Boolean) }];
  }

  /** Éclaircit / assombrit une couleur hexadécimale. */
  function shade(hex, amount) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '#f0c04b'));
    var n = parseInt(m ? m[1] : 'f0c04b', 16);
    var parts = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
      return Math.max(0, Math.min(255, Math.round(v + amount * (amount > 0 ? 255 - v : v))));
    });
    return '#' + parts.map(function (v) { return v.toString(16).padStart(2, '0'); }).join('');
  }

  /**
   * Construit la page HTML complète d'une histoire.
   * @param {Object} data title, emoji, subtitle, accent, chapters, moral, rtl
   * @returns {string} document HTML autonome
   */
  GRENIER.buildStoryPage = function (data) {
    data = data || {};
    var accent = data.accent || '#f0c04b';
    var lang = data.rtl ? 'ar' : 'fr';
    var dir = data.rtl ? ' dir="rtl"' : '';
    var chapters = data.chapters && data.chapters.length
      ? data.chapters
      : parseChapters(data.text || '');

    var sections = chapters.map(function (chapter, i) {
      var paragraphs = (chapter.paragraphs || []).map(function (p) {
        return '      <p>' + esc(p) + '</p>';
      }).join('\n');
      return '' +
        '  <section class="chapter">\n' +
        '    <div class="chapter-inner">\n' +
        '      <span class="chapter-num">Chapitre ' + (i + 1) + '</span>\n' +
        (chapter.title ? '      <h2>' + esc(chapter.title) + '</h2>\n' : '') +
        paragraphs + '\n' +
        '    </div>\n' +
        '  </section>';
    }).join('\n\n');

    var ending = data.moral
      ? '\n\n  <section class="chapter ending">\n' +
        '    <div class="chapter-inner">\n' +
        '      <span class="chapter-num">La morale</span>\n' +
        '      <blockquote>' + esc(data.moral) + '</blockquote>\n' +
        '    </div>\n' +
        '  </section>'
      : '';

    return '<!DOCTYPE html>\n' +
'<html lang="' + lang + '"' + dir + '>\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'<title>' + esc(data.title) + '</title>\n' +
'<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,400&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">\n' +
'<style>\n' +
'  :root {\n' +
'    --accent: ' + accent + ';\n' +
'    --accent-soft: ' + shade(accent, 0.45) + ';\n' +
'    --night: #0a0913;\n' +
'    --deep: ' + shade(accent, -0.86) + ';\n' +
'    --text: #eee6d6;\n' +
'    --muted: rgba(238, 230, 214, .62);\n' +
'  }\n' +
'  * { margin: 0; padding: 0; box-sizing: border-box; }\n' +
'  html { scroll-behavior: smooth; scroll-snap-type: y proximity; }\n' +
'  body {\n' +
'    background: var(--night);\n' +
'    color: var(--text);\n' +
'    font-family: "Nunito", system-ui, sans-serif;\n' +
'    line-height: 1.8;\n' +
'  }\n' +
'  .hero, .chapter {\n' +
'    min-height: 100vh;\n' +
'    display: grid;\n' +
'    place-items: center;\n' +
'    padding: 90px 24px;\n' +
'    scroll-snap-align: start;\n' +
'    position: relative;\n' +
'  }\n' +
'  .hero {\n' +
'    text-align: center;\n' +
'    background: radial-gradient(70% 80% at 50% 30%, var(--deep), var(--night) 70%);\n' +
'  }\n' +
'  .hero-emoji { font-size: 4.6rem; line-height: 1; margin-bottom: 18px; }\n' +
'  .hero h1 {\n' +
'    font-family: "Cormorant Garamond", Georgia, serif;\n' +
'    font-size: clamp(2.6rem, 8vw, 4.6rem);\n' +
'    font-weight: 700;\n' +
'    line-height: 1.08;\n' +
'    color: var(--accent);\n' +
'    text-shadow: 0 0 46px ' + shade(accent, -0.2) + '55;\n' +
'  }\n' +
'  .hero p {\n' +
'    max-width: 640px;\n' +
'    margin: 18px auto 0;\n' +
'    font-family: "Cormorant Garamond", Georgia, serif;\n' +
'    font-style: italic;\n' +
'    font-size: clamp(1.05rem, 2.6vw, 1.4rem);\n' +
'    color: var(--muted);\n' +
'  }\n' +
'  .scroll-hint {\n' +
'    position: absolute;\n' +
'    bottom: 34px; left: 50%;\n' +
'    transform: translateX(-50%);\n' +
'    font-size: 1.6rem;\n' +
'    color: var(--accent);\n' +
'    animation: bob 2s ease-in-out infinite;\n' +
'  }\n' +
'  @keyframes bob { 0%,100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, 10px); } }\n' +
'  .chapter-inner { max-width: 720px; }\n' +
'  .chapter-num {\n' +
'    display: inline-block;\n' +
'    margin-bottom: 12px;\n' +
'    padding: 5px 14px;\n' +
'    border-radius: 999px;\n' +
'    border: 1px solid ' + shade(accent, -0.3) + '66;\n' +
'    font-size: .74rem;\n' +
'    font-weight: 700;\n' +
'    letter-spacing: .14em;\n' +
'    text-transform: uppercase;\n' +
'    color: var(--accent);\n' +
'  }\n' +
'  .chapter h2 {\n' +
'    font-family: "Cormorant Garamond", Georgia, serif;\n' +
'    font-size: clamp(1.8rem, 5vw, 2.7rem);\n' +
'    font-weight: 700;\n' +
'    color: var(--accent-soft);\n' +
'    margin-bottom: 20px;\n' +
'  }\n' +
'  .chapter p { margin-bottom: 18px; font-size: 1.06rem; }\n' +
'  .chapter p::first-letter { }\n' +
'  .ending { background: radial-gradient(70% 80% at 50% 50%, var(--deep), var(--night) 72%); }\n' +
'  blockquote {\n' +
'    font-family: "Cormorant Garamond", Georgia, serif;\n' +
'    font-style: italic;\n' +
'    font-size: clamp(1.3rem, 4vw, 2rem);\n' +
'    line-height: 1.5;\n' +
'    color: var(--accent);\n' +
'    border-left: 3px solid ' + shade(accent, -0.2) + ';\n' +
'    padding-left: 22px;\n' +
'  }\n' +
'  [dir="rtl"] blockquote { border-left: none; border-right: 3px solid ' + shade(accent, -0.2) + '; padding: 0 22px 0 0; }\n' +
'</style>\n' +
'</head>\n' +
'<body>\n\n' +
'  <header class="hero">\n' +
'    <div>\n' +
'      <div class="hero-emoji">' + esc(data.emoji || '✦') + '</div>\n' +
'      <h1>' + esc(data.title) + '</h1>\n' +
(data.subtitle ? '      <p>' + esc(data.subtitle) + '</p>\n' : '') +
'    </div>\n' +
'    <div class="scroll-hint" aria-hidden="true">↓</div>\n' +
'  </header>\n\n' +
sections + ending + '\n\n' +
'</body>\n' +
'</html>\n';
  };

  GRENIER.parseChapters = parseChapters;
  GRENIER.shadeColor = shade;
})(window);
