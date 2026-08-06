#!/usr/bin/env python3
"""Extrait le texte d'une piece jointe et propose titre / slug / decoupage.

Formats geres sans dependance : .txt .md .markdown .html .htm .docx
(.pdf et images : passer par les skills `pdf` / `docx` ou l'outil Read).

    python3 .claude/skills/ajouter-histoire/scripts/lire_piece_jointe.py \
        /mnt/attach/mon-histoire.docx
    python3 ... /mnt/attach/histoire.md --texte    # texte brut complet

Sortie par defaut : un resume structure (titre devine, slug, chapitres
detectes avec leur premiere ligne, nombre de mots) a utiliser pour l'etape 1
de la routine. Le texte reste la source de verite : ne pas le reecrire.
"""

import argparse
import html as html_mod
import re
import sys
import unicodedata
import zipfile
from pathlib import Path

# Une ligne est un titre de chapitre si elle ressemble a l'un de ces motifs.
MOTIFS_CHAPITRE = [
    re.compile(r"^\s{0,3}#{1,3}\s+(?P<t>\S.*)$"),                      # markdown
    re.compile(r"^\s*chapitre\s+[\wIVXLC]+\s*[:.–-]?\s*(?P<t>.*)$", re.I),
    re.compile(r"^\s*(?:partie|acte|episode)\s+[\wIVXLC]+\s*[:.–-]?\s*(?P<t>.*)$", re.I),
    re.compile(r"^\s*[IVXLC]{1,5}\s*[.)–-]\s+(?P<t>\S.*)$"),      # II. Titre
    re.compile(r"^\s*\d{1,2}\s*[.)–-]\s+(?P<t>\S.*)$"),           # 2) Titre
    re.compile(r"^\s*(?:الفصل|الباب|الجزء)\b\s*(?P<t>.*)$"),            # arabe
]


def sans_accents(txt: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", txt) if unicodedata.category(c) != "Mn"
    )


def slugifier(titre: str) -> str:
    """Slug ASCII, comme les fichiers du projet (squirrel.html, petit_aigle.html)."""
    s = sans_accents(titre).lower()
    s = re.sub(r"['’]", "-", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return re.sub(r"-{2,}", "-", s).strip("-")[:40]


# ── Extraction par format ─────────────────────────────────────────────────────

def texte_de_html(brut: str) -> str:
    brut = re.sub(r"(?is)<(script|style)\b.*?</\1>", "", brut)
    brut = re.sub(r"(?i)<\s*(br|/p|/div|/h[1-6]|/li)\s*/?>", "\n", brut)
    brut = re.sub(r"(?i)<h([1-6])[^>]*>", lambda m: "\n" + "#" * int(m.group(1)) + " ", brut)
    brut = re.sub(r"<[^>]+>", "", brut)
    return html_mod.unescape(brut)


def texte_de_docx(chemin: Path) -> str:
    with zipfile.ZipFile(chemin) as z:
        noms = [n for n in ("word/document.xml",) if n in z.namelist()]
        if not noms:
            raise ValueError("docx invalide : word/document.xml introuvable")
        xml = z.read(noms[0]).decode("utf-8", errors="replace")

    # les styles de titre deviennent des marqueurs markdown
    def paragraphe(m):
        bloc = m.group(0)
        niveau = re.search(r'w:val="Heading(\d)"|w:val="Titre(\d)"', bloc)
        texte = "".join(re.findall(r"<w:t[^>]*>(.*?)</w:t>", bloc, re.S))
        texte = html_mod.unescape(re.sub(r"<[^>]+>", "", texte)).strip()
        if not texte:
            return "\n"
        if niveau:
            n = int(niveau.group(1) or niveau.group(2))
            return "\n" + "#" * min(n, 3) + " " + texte + "\n"
        return texte + "\n"

    xml = re.sub(r"<w:br[^>]*/>", "\n", xml)
    corps = re.search(r"<w:body\b[^>]*>(.*)</w:body>", xml, re.S)
    xml = corps.group(1) if corps else xml
    texte = re.sub(r"<w:p\b.*?</w:p>|<w:p\b[^>]*/>", paragraphe, xml, flags=re.S)
    return html_mod.unescape(re.sub(r"<[^>]+>", "", texte))  # residus XML (tableaux, sectPr)


def extraire(chemin: Path) -> str:
    suf = chemin.suffix.lower()
    if suf in (".txt", ".md", ".markdown", ""):
        return chemin.read_text(encoding="utf-8", errors="replace")
    if suf in (".html", ".htm"):
        return texte_de_html(chemin.read_text(encoding="utf-8", errors="replace"))
    if suf == ".docx":
        return texte_de_docx(chemin)
    if suf in (".pdf", ".png", ".jpg", ".jpeg", ".webp", ".doc", ".odt", ".pages"):
        raise SystemExit(
            f"Format {suf} non gere ici — utiliser le skill `pdf` / `docx` ou l'outil Read "
            f"pour extraire le texte, puis reprendre la routine a l'etape 1."
        )
    raise SystemExit(f"Format inconnu : {suf}")


# ── Analyse ───────────────────────────────────────────────────────────────────

def nettoyer(texte: str) -> list[str]:
    lignes = [l.rstrip() for l in texte.replace("\r\n", "\n").replace("\r", "\n").split("\n")]
    sortie, vides = [], 0
    for l in lignes:
        if l.strip():
            sortie.append(l.strip())
            vides = 0
        else:
            vides += 1
            if vides == 1 and sortie:
                sortie.append("")
    return sortie


def chapitres(lignes: list[str]) -> list[tuple[int, str]]:
    trouves = []
    for i, l in enumerate(lignes):
        if not l or len(l) > 90:
            continue
        for motif in MOTIFS_CHAPITRE:
            m = motif.match(l)
            if m:
                trouves.append((i, (m.groupdict().get("t") or l).strip() or l))
                break
    return trouves


def main():
    p = argparse.ArgumentParser(description="Lit une piece jointe (etape 1 de la routine).")
    p.add_argument("fichier", help="chemin de la piece jointe, ex. /mnt/attach/histoire.docx")
    p.add_argument("--texte", action="store_true", help="afficher le texte extrait complet")
    args = p.parse_args()

    chemin = Path(args.fichier).expanduser()
    if not chemin.is_file():
        raise SystemExit(f"Fichier introuvable : {chemin}")

    lignes = nettoyer(extraire(chemin))
    if args.texte:
        print("\n".join(lignes))
        return

    contenu = [l for l in lignes if l]
    if not contenu:
        raise SystemExit("Piece jointe vide apres extraction.")

    chaps = chapitres(lignes)
    # la premiere ligne non vide est le titre de l'histoire, pas un chapitre
    premiere = lignes.index(contenu[0])
    titre = contenu[0].lstrip("# ").strip()
    if chaps and chaps[0][0] == premiere:
        titre = chaps[0][1]
        chaps = chaps[1:]
    if not titre:
        titre = chemin.stem.replace("_", " ").replace("-", " ").strip()

    mots = sum(len(l.split()) for l in contenu)
    tout = "".join(contenu)
    lettres = [c for c in tout if c.isalpha()]
    arabes = [c for c in lettres if "؀" <= c <= "ۿ"]
    rtl = bool(lettres) and len(arabes) / len(lettres) > 0.3

    slug = slugifier(titre) or slugifier(chemin.stem)

    print(f"Fichier      : {chemin}  ({chemin.stat().st_size} octets, {suffixe(chemin)})")
    print(f"Titre devine : {titre}")
    print(f"Slug propose : {slug or '(a choisir — titre non latin : donner un slug ASCII)'}")
    print(f"Volume       : {mots} mots, {len(contenu)} paragraphes")
    print(f"Langue       : {'arabe / RTL — categorie arabe, lang=ar dir=rtl' if rtl else 'latine (fr par defaut)'}")
    print(f"Chapitres    : {len(chaps) if chaps else 0} detecte(s)")
    for i, (ligne, t) in enumerate(chaps, 1):
        print(f"  {i:>2}. l.{ligne + 1:<4} {t[:70]}")
    if not chaps:
        print("  (aucun marqueur de chapitre — decouper aux ruptures narratives")
        print("   et signaler ce decoupage a l'utilisateur dans le rapport final)")
    print()
    print("Rappel : ne pas reecrire le texte fourni. Le mettre en forme, pas le reformuler.")


def suffixe(chemin: Path) -> str:
    return chemin.suffix.lower().lstrip(".") or "sans extension"


if __name__ == "__main__":
    main()
