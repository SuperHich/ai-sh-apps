#!/usr/bin/env python3
"""Vérifie qu'une histoire a été correctement ajoutée au Grenier des Apps.

Contrôles statiques (fichiers) puis dynamiques (Chromium headless, JS exécuté,
pages servies par un serveur HTTP local).

    python3 .claude/skills/ajouter-histoire/scripts/verifier_histoire.py \
        --categorie science --slug espace

Code de sortie : 0 si tout est OK, 1 si au moins un contrôle échoue.
"""

import argparse
import glob
import http.server
import os
import re
import shutil
import socketserver
import subprocess
import sys
import threading
import unicodedata
from pathlib import Path

CHECK, CROSS, WARN, SKIP = "OK  ", "ECHEC", "ATTN", "SKIP"


class Rapport:
    def __init__(self):
        self.lignes = []
        self.echecs = 0

    def ok(self, msg):
        self.lignes.append(f"[{CHECK}] {msg}")

    def ko(self, msg):
        self.lignes.append(f"[{CROSS}] {msg}")
        self.echecs += 1

    def warn(self, msg):
        self.lignes.append(f"[{WARN}] {msg}")

    def skip(self, msg):
        self.lignes.append(f"[{SKIP}] {msg}")

    def afficher(self):
        print("\n".join(self.lignes))
        print()
        if self.echecs:
            print(f">>> {self.echecs} controle(s) en echec — corriger avant de commiter.")
        else:
            print(">>> Tous les controles sont passes. Etape 6 (commit/push) autorisee.")


def racine_depot() -> Path:
    """Racine du depot deduite de l'emplacement du script, pas du dossier courant."""
    ici = Path(__file__).resolve().parent
    try:
        out = subprocess.run(
            ["git", "-C", str(ici), "rev-parse", "--show-toplevel"],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        if out:
            return Path(out)
    except Exception:
        pass
    return ici.parents[3]  # .claude/skills/ajouter-histoire/scripts → racine


def sans_accents(txt: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", txt) if unicodedata.category(c) != "Mn"
    )


def cartes_reelles(html: str):
    """Retourne (cartes_reelles, cartes_a_venir) d'apres les attributs class."""
    reelles, soon = [], []
    for m in re.finditer(r'class="([^"]*)"', html):
        classes = m.group(1).split()
        if "card" not in classes:
            continue
        (soon if "card-soon" in classes else reelles).append(m.start())
    return reelles, soon


# ── Contrôles statiques ───────────────────────────────────────────────────────

def verifier_statique(racine: Path, categorie: str, slug: str, rap: Rapport):
    dossier = racine / "stories" / categorie
    page = dossier / f"{slug}.html"
    index = dossier / "index.html"

    if not dossier.is_dir():
        rap.ko(f"categorie introuvable : stories/{categorie}/")
        return None, None
    if not index.is_file():
        rap.ko(f"index de categorie manquant : stories/{categorie}/index.html")
        return None, None

    # 1 — la page existe et est du HTML complet
    if not page.is_file():
        rap.ko(f"page manquante : stories/{categorie}/{slug}.html")
        return None, None
    html = page.read_text(encoding="utf-8", errors="replace")
    rap.ok(f"page presente : stories/{categorie}/{slug}.html ({len(html)} octets)")

    for balise in ("<!DOCTYPE html>", "</html>", "</body>"):
        if balise.lower() not in html.lower():
            rap.ko(f"HTML incomplet : « {balise} » absent de {slug}.html")
    titre = re.search(r"<title>(.*?)</title>", html, re.S | re.I)
    if titre and titre.group(1).strip():
        rap.ok(f"titre de la page : « {titre.group(1).strip()} »")
    else:
        rap.ko(f"<title> vide ou absent dans {slug}.html")

    # 2 — bouton retour, comme les voisines de la meme categorie
    if 'src="../../components/back-button.js"' in html:
        rap.ok("composant back-button.js charge (chemin relatif correct)")
    else:
        rap.ko('script manquant : <script src="../../components/back-button.js">')

    bouton = re.search(r"<back-button\b([^>]*)>", html, re.I)
    if not bouton:
        rap.ko("balise <back-button> absente de la page")
    else:
        attrs = bouton.group(1)
        href = re.search(r'href="([^"]*)"', attrs)
        cible = (dossier / href.group(1)).resolve() if href else None
        if href and href.group(1) == "index.html":
            rap.ok('bouton retour : href="index.html"')
        elif cible == index.resolve():
            rap.warn(
                f'bouton retour : href="{href.group(1)}" pointe bien vers l\'index de la '
                f'categorie, mais la convention du projet est href="index.html"'
            )
        else:
            rap.ko(
                f'bouton retour : href attendu "index.html", trouve '
                f'"{href.group(1) if href else "(aucun)"}"'
            )

        # convention rtl deduite des histoires voisines
        voisines = [
            Path(p) for p in glob.glob(str(dossier / "*.html"))
            if Path(p).name not in ("index.html", f"{slug}.html")
        ]
        rtl_voisines = sum(
            1 for v in voisines
            if re.search(r"<back-button\b[^>]*\brtl\b", v.read_text(encoding="utf-8", errors="replace"), re.I)
        )
        attendu_rtl = voisines and rtl_voisines * 2 > len(voisines)
        a_rtl = re.search(r"\brtl\b", attrs) is not None
        if attendu_rtl and not a_rtl:
            rap.ko(f"categorie {categorie} : les autres histoires utilisent <back-button ... rtl>")
        elif not attendu_rtl and a_rtl:
            rap.warn(f"attribut rtl present alors que les voisines de {categorie} ne l'utilisent pas")
        else:
            rap.ok(f"convention rtl respectee ({rtl_voisines}/{len(voisines)} voisines en rtl)")

    # 3 — carte dans la grille de l'index de categorie
    idx = index.read_text(encoding="utf-8", errors="replace")
    carte = re.search(
        r'<a\b[^>]*class="[^"]*\bcard\b[^"]*"[^>]*href="' + re.escape(f"{slug}.html") + r'"'
        r'|<a\b[^>]*href="' + re.escape(f"{slug}.html") + r'"[^>]*class="[^"]*\bcard\b[^"]*"',
        idx,
    )
    if not carte:
        rap.ko(f'aucune carte <a class="card" href="{slug}.html"> dans stories/{categorie}/index.html')
    else:
        rap.ok(f'carte trouvee dans l\'index : href="{slug}.html"')
        for champ in ("card-title", "card-desc", "card-art"):
            bloc = idx[carte.start(): carte.start() + 8000]
            if champ not in bloc:
                rap.warn(f"la carte ne contient pas de bloc {champ}")
        reelles, soon = cartes_reelles(idx)
        if soon and carte.start() > min(soon):
            rap.ko("la nouvelle carte est placee apres la carte « Prochainement » — la deplacer avant")
        elif soon:
            rap.ok("carte placee avant la carte « Prochainement »")

    # 4 — compteur statique
    reelles, soon = cartes_reelles(idx)
    attendu = len(reelles)
    compteur = re.search(r'id="storyCount"[^>]*>\s*(\d+)\s*<', idx)
    if not compteur:
        rap.ko('compteur id="storyCount" introuvable dans l\'index de categorie')
    elif int(compteur.group(1)) != attendu:
        rap.ko(
            f'compteur statique = {compteur.group(1)} mais {attendu} cartes reelles '
            f"— mettre a jour <strong id=\"storyCount\">{attendu}</strong>"
        )
    else:
        rap.ok(f'compteur statique a jour : {attendu} histoire(s), {len(soon)} carte(s) « a venir »')

    if "document.getElementById('storyCount')" not in idx and 'getElementById("storyCount")' not in idx:
        rap.warn("le script de recalcul du compteur semble absent de l'index")

    # 5 — animations et unicite des id SVG dans l'index
    delays = set(int(m.group(1)) for m in re.finditer(r"\.card:nth-child\((\d+)\)", idx))
    if delays and attendu > max(delays):
        rap.warn(
            f"{attendu} cartes mais regles d'animation jusqu'a nth-child({max(delays)}) "
            f"— ajouter .card:nth-child({attendu})"
        )
    ids = re.findall(r'\bid="([^"]+)"', idx)
    doublons = sorted({i for i in ids if ids.count(i) > 1})
    if doublons:
        rap.ko(f"id HTML/SVG en double dans l'index (degrades melanges) : {', '.join(doublons)}")
    else:
        rap.ok("aucun id duplique dans l'index de categorie")

    # 6 — liens relatifs de la page resolus sur disque
    casses = []
    for lien in re.findall(r'(?:href|src)="([^"#?:]+)"', html):
        if lien.startswith(("http", "//", "data:", "mailto:")):
            continue
        if not (page.parent / lien).resolve().exists():
            casses.append(lien)
    if casses:
        rap.ko(f"lien(s) relatif(s) casse(s) dans {slug}.html : {', '.join(sorted(set(casses)))}")
    else:
        rap.ok("tous les liens relatifs de la page resolvent sur le disque")

    # 7 — la categorie est bien accessible depuis l'index racine
    racine_idx = (racine / "index.html").read_text(encoding="utf-8", errors="replace")
    if f"stories/{categorie}/index.html" in racine_idx:
        rap.ok(f"categorie {categorie} liee depuis l'index racine")
    else:
        rap.ko(f"index racine : aucun lien vers stories/{categorie}/index.html")

    return attendu, page


# ── Contrôles navigateur ──────────────────────────────────────────────────────

def trouver_chromium() -> str | None:
    for motif in (
        "/opt/pw-browsers/chromium-*/chrome-linux/chrome",
        "/opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell",
    ):
        trouves = sorted(glob.glob(motif))
        if trouves:
            return trouves[-1]
    for nom in ("chromium", "chromium-browser", "google-chrome", "chrome"):
        chemin = shutil.which(nom)
        if chemin:
            return chemin
    return os.environ.get("CHROME_PATH")


class ServeurSilencieux(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def demarrer_serveur(racine: Path, journal: list):
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(racine), **kw)

        def log_message(self, fmt, *args):  # silence + journalisation
            pass

        def send_response(self, code, message=None):
            journal.append((self.path, int(code)))
            super().send_response(code, message)

    httpd = ServeurSilencieux(("127.0.0.1", 0), Handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, httpd.server_address[1]


def dump_dom(chrome: str, url: str, profil: Path):
    # profil neuf a chaque page : sinon le cache HTTP masque le chargement reel
    # des ressources (back-button.js, polices…) sur la seconde page.
    shutil.rmtree(profil, ignore_errors=True)
    proc = subprocess.run(
        [
            chrome, "--headless", "--no-sandbox", "--disable-gpu",
            "--disable-dev-shm-usage", f"--user-data-dir={profil}",
            "--disk-cache-dir=/dev/null", "--media-cache-size=1", "--disk-cache-size=1",
            "--virtual-time-budget=4000", "--enable-logging=stderr", "--log-level=0",
            "--dump-dom", url,
        ],
        capture_output=True, text=True, timeout=90,
    )
    erreurs = [
        l for l in proc.stderr.splitlines()
        if ":ERROR:CONSOLE(" in l or "Uncaught" in l
    ]
    return proc.stdout, erreurs


def verifier_navigateur(racine: Path, categorie: str, slug: str, attendu: int, rap: Rapport):
    chrome = trouver_chromium()
    if not chrome:
        rap.skip("Chromium introuvable — controles navigateur non executes (verifier a la main)")
        return

    profil = racine / ".claude" / ".chrome-profile-verif"
    journal: list = []
    httpd, port = demarrer_serveur(racine, journal)
    base = f"http://127.0.0.1:{port}"
    try:
        # index de categorie, apres execution du JS
        dom, erreurs = dump_dom(chrome, f"{base}/stories/{categorie}/index.html", profil)
        if not dom.strip():
            rap.ko("index de categorie : page vide dans le navigateur")
            return
        rap.ok(f"index de categorie charge dans Chromium ({len(dom)} octets de DOM)")

        if re.search(r'href="' + re.escape(f"{slug}.html") + r'"', dom):
            rap.ok(f"carte visible dans le DOM rendu (lien {slug}.html)")
        else:
            rap.ko(f"carte absente du DOM rendu : aucun lien vers {slug}.html")

        rendu = re.search(r'id="storyCount"[^>]*>\s*(\d+)\s*<', dom)
        if not rendu:
            rap.ko("compteur absent du DOM rendu")
        elif attendu is not None and int(rendu.group(1)) != attendu:
            rap.ko(f"compteur rendu = {rendu.group(1)}, attendu {attendu}")
        else:
            rap.ok(f"compteur rendu par le JS = {rendu.group(1)}")

        for e in erreurs:
            rap.ko(f"erreur console sur l'index : {e.strip()}")
        if not erreurs:
            rap.ok("aucune erreur console sur l'index de categorie")

        # page de l'histoire, accedee comme au clic sur la carte
        journal.clear()
        url = f"{base}/stories/{categorie}/{slug}.html"
        dom, erreurs = dump_dom(chrome, url, profil)
        if len(dom.strip()) < 200:
            rap.ko(f"la page {slug}.html ne se charge pas correctement via HTTP")
        else:
            rap.ok(f"acces a l'histoire OK via {url.replace(base, '')} ({len(dom)} octets de DOM)")

        if "<back-button" in dom:
            rap.ok("element <back-button> present dans le DOM de l'histoire")
        else:
            rap.ko("element <back-button> absent du DOM de l'histoire")

        js = [(p, c) for p, c in journal if p.endswith("components/back-button.js")]
        if any(c == 200 for _, c in js):
            rap.ok("back-button.js reellement servi en 200 au chargement de l'histoire")
        else:
            rap.ko(f"back-button.js non charge par le navigateur (reponses : {js or 'aucune requete'})")

        rates = sorted({p for p, c in journal if c >= 400 and not p.endswith("favicon.ico")})
        if rates:
            rap.ko(f"ressource(s) en erreur HTTP : {', '.join(rates)}")
        else:
            rap.ok("aucune ressource locale en erreur HTTP (404/500)")

        if re.search(r"<h1[^>]*>\s*\S", dom):
            rap.ok("titre <h1> visible dans l'histoire")
        else:
            rap.warn("aucun <h1> non vide detecte dans l'histoire")

        for e in erreurs:
            rap.ko(f"erreur console sur l'histoire : {e.strip()}")
        if not erreurs:
            rap.ok("aucune erreur console sur la page de l'histoire")
    finally:
        httpd.shutdown()
        httpd.server_close()
        shutil.rmtree(profil, ignore_errors=True)


def main():
    p = argparse.ArgumentParser(description="Verifie l'ajout d'une histoire (etape 5 de la routine).")
    p.add_argument("--categorie", required=True, help="religion | arabe | legend | fun | science | …")
    p.add_argument("--slug", required=True, help="nom du fichier sans .html, ex. marie-curie")
    p.add_argument("--sans-navigateur", action="store_true", help="controles statiques uniquement")
    args = p.parse_args()

    racine = racine_depot()
    slug = sans_accents(args.slug).removesuffix(".html")
    rap = Rapport()

    print(f"Verification de stories/{args.categorie}/{slug}.html — depot {racine}\n")
    attendu, page = verifier_statique(racine, args.categorie, slug, rap)

    if page is None:
        rap.afficher()
        sys.exit(1)

    if args.sans_navigateur:
        rap.skip("controles navigateur desactives (--sans-navigateur)")
    else:
        verifier_navigateur(racine, args.categorie, slug, attendu, rap)

    rap.afficher()
    sys.exit(1 if rap.echecs else 0)


if __name__ == "__main__":
    main()
