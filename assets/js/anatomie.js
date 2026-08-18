/**
 * L'Explorateur du Corps Humain — géométrie, rendu et interface
 * ------------------------------------------------------------------
 * Un vrai rendu en trois dimensions, en JavaScript nu, dans un canvas 2D :
 * ni bibliothèque 3D, ni WebGL, ni le moindre fichier de modèle.
 *
 * Le chemin d'une image :
 *
 *   1. CONSTRUIRE — le corps est fabriqué une fois au chargement, à partir de
 *      quatre formes élémentaires : l'ellipsoïde, le tube le long d'un chemin,
 *      la pile de sections (« loft ») et le ruban. Un cœur est une pile de
 *      sections dont le centre dérive vers le bas à gauche ; un intestin, un
 *      tube le long d'une spirale ; une côte, un ruban le long d'un arc.
 *
 *   2. TOURNER — chaque image, tous les sommets passent par deux rotations
 *      (lacet puis tangage) et une projection. Rien d'autre : la scène est
 *      figée, seul le regard tourne autour.
 *
 *   3. TRIER ET PEINDRE — sans carte graphique, la profondeur se règle à
 *      l'ancienne : on trie les triangles du plus lointain au plus proche
 *      (tri par casiers, en temps linéaire) et on les peint dans cet ordre.
 *      Les faces arrière des volumes opaques sont éliminées, la peau est
 *      gardée translucide des deux côtés — c'est ce qui donne l'impression de
 *      voir à l'intérieur.
 *
 * La désignation d'un organe au clic n'utilise pas de couche cachée : on
 * parcourt la liste triée du plus proche au plus lointain et on renvoie le
 * premier triangle qui contient le point. Exact, et sans coût de rendu.
 */
(function (global) {
  'use strict';

  var AN = global.ANATOMIE;
  if (!AN || !AN.organs) return;

  /* ══════════════════════════════════════════════════════════════
     1. FABRIQUE DE MAILLAGES
     Repère du corps : y vers le haut, y = 0 aux pieds, 170 au sommet du
     crâne ; x vers la droite du sujet ; z vers l'avant. Tout est en
     centimètres, ce qui permet de poser les organes à leur place réelle.
     ══════════════════════════════════════════════════════════════ */

  function Mesh() { this.v = []; this.t = []; }

  Mesh.prototype.vert = function (x, y, z) {
    var i = this.v.length / 3;
    this.v.push(x, y, z);
    return i;
  };
  Mesh.prototype.tri = function (a, b, c) { this.t.push(a, b, c); };
  /* Quatre sommets dans le sens qui laisse la normale vers l'extérieur. */
  Mesh.prototype.quad = function (a, b, c, d) { this.t.push(a, b, c, a, c, d); };

  /**
   * Ellipsoïde. `warp(x, y, z, u, v)` permet de le bosseler — les
   * circonvolutions du cerveau, le creux d'un rein.
   */
  function ellipsoid(rx, ry, rz, seg, ring, warp) {
    var m = new Mesh(), ids = [], i, j;
    for (j = 0; j <= ring; j++) {
      var phi = j / ring * Math.PI;
      var cp = Math.cos(phi), sp = Math.sin(phi);
      ids[j] = [];
      for (i = 0; i < seg; i++) {
        var th = i / seg * 2 * Math.PI;
        var x = sp * Math.sin(th) * rx, y = cp * ry, z = sp * Math.cos(th) * rz;
        if (warp) {
          var p = warp(x, y, z, i / seg, j / ring);
          x = p[0]; y = p[1]; z = p[2];
        }
        ids[j][i] = m.vert(x, y, z);
      }
    }
    for (j = 0; j < ring; j++) {
      for (i = 0; i < seg; i++) {
        var i2 = (i + 1) % seg;
        m.quad(ids[j][i], ids[j + 1][i], ids[j + 1][i2], ids[j][i2]);
      }
    }
    return m;
  }

  /**
   * Pile de sections elliptiques, du haut vers le bas. Chaque section porte
   * son centre et ses deux rayons : c'est de quoi tailler un tronc, un
   * poumon, un foie en coin ou un cœur qui pointe vers le bas à gauche.
   * `e` (défaut 1) arrondit ou équarrit la section — 0,7 donne des épaules.
   */
  function loft(sections, seg, capTop, capBottom) {
    var m = new Mesh(), ids = [], i, j;
    for (j = 0; j < sections.length; j++) {
      var s = sections[j];
      var e = s.e || 1;
      ids[j] = [];
      for (i = 0; i < seg; i++) {
        var th = i / seg * 2 * Math.PI;
        var sn = Math.sin(th), cs = Math.cos(th);
        if (e !== 1) {
          sn = (sn < 0 ? -1 : 1) * Math.pow(Math.abs(sn), e);
          cs = (cs < 0 ? -1 : 1) * Math.pow(Math.abs(cs), e);
        }
        ids[j][i] = m.vert((s.cx || 0) + sn * s.rx, s.y, (s.cz || 0) + cs * s.rz);
      }
    }
    for (j = 0; j < sections.length - 1; j++) {
      for (i = 0; i < seg; i++) {
        var i2 = (i + 1) % seg;
        m.quad(ids[j][i], ids[j + 1][i], ids[j + 1][i2], ids[j][i2]);
      }
    }
    if (capTop) {
      var t0 = sections[0];
      var ct = m.vert(t0.cx || 0, t0.y + (t0.rx + t0.rz) * 0.12, t0.cz || 0);
      for (i = 0; i < seg; i++) m.tri(ct, ids[0][i], ids[0][(i + 1) % seg]);
    }
    if (capBottom) {
      var last = sections.length - 1, b0 = sections[last];
      var cb = m.vert(b0.cx || 0, b0.y - (b0.rx + b0.rz) * 0.12, b0.cz || 0);
      for (i = 0; i < seg; i++) m.tri(cb, ids[last][(i + 1) % seg], ids[last][i]);
    }
    return m;
  }

  /**
   * Tube le long d'un chemin. Le repère de chaque anneau est transporté de
   * proche en proche, ce qui évite que le tube ne vrille dans les virages —
   * indispensable pour l'intestin grêle et ses quatre boucles.
   */
  function tube(path, radii, seg, caps) {
    var m = new Mesh(), ids = [], n = path.length, k, i;
    var rx = 1, ry = 0, rz = 0;                 /* le vecteur « droite » courant */

    for (k = 0; k < n; k++) {
      var p = path[k];
      var a = path[Math.max(0, k - 1)], b = path[Math.min(n - 1, k + 1)];
      var tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2];
      var tl = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
      tx /= tl; ty /= tl; tz /= tl;

      if (k === 0) {
        /* Un premier « droite » quelconque, pourvu qu'il ne soit pas dans l'axe. */
        if (Math.abs(ty) < 0.9) { rx = -tz; ry = 0; rz = tx; }
        else { rx = 1; ry = 0; rz = 0; }
      } else {
        /* Transport parallèle : on retire du vecteur précédent ce qui est
           parti dans l'axe du tube, et on renormalise. */
        var d = rx * tx + ry * ty + rz * tz;
        rx -= tx * d; ry -= ty * d; rz -= tz * d;
      }
      var rl = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
      rx /= rl; ry /= rl; rz /= rl;

      var ux = ty * rz - tz * ry, uy = tz * rx - tx * rz, uz = tx * ry - ty * rx;
      var r = typeof radii === 'function' ? radii(k / (n - 1)) : radii;

      ids[k] = [];
      for (i = 0; i < seg; i++) {
        var th = i / seg * 2 * Math.PI;
        var c = Math.cos(th) * r, s = Math.sin(th) * r;
        ids[k][i] = m.vert(p[0] + rx * c + ux * s, p[1] + ry * c + uy * s, p[2] + rz * c + uz * s);
      }
    }
    for (k = 0; k < n - 1; k++) {
      for (i = 0; i < seg; i++) {
        var i2 = (i + 1) % seg;
        m.quad(ids[k][i], ids[k][i2], ids[k + 1][i2], ids[k + 1][i]);
      }
    }
    if (caps !== false) {
      var c0 = m.vert(path[0][0], path[0][1], path[0][2]);
      for (i = 0; i < seg; i++) m.tri(c0, ids[0][(i + 1) % seg], ids[0][i]);
      var cn = m.vert(path[n - 1][0], path[n - 1][1], path[n - 1][2]);
      for (i = 0; i < seg; i++) m.tri(cn, ids[n - 1][i], ids[n - 1][(i + 1) % seg]);
    }
    return m;
  }

  /**
   * Ruban plat le long d'un chemin, élargi vers le haut et le bas. Une côte
   * n'a pas besoin d'être un tube : deux triangles par segment suffisent, et
   * la cage thoracique tient alors en quelques centaines de triangles.
   */
  function ribbon(path, halfWidth) {
    var m = new Mesh(), n = path.length, k;
    var top = [], bot = [];
    for (k = 0; k < n; k++) {
      var w = typeof halfWidth === 'function' ? halfWidth(k / (n - 1)) : halfWidth;
      top.push(m.vert(path[k][0], path[k][1] + w, path[k][2]));
      bot.push(m.vert(path[k][0], path[k][1] - w, path[k][2]));
    }
    for (k = 0; k < n - 1; k++) m.quad(top[k], bot[k], bot[k + 1], top[k + 1]);
    return m;
  }

  function box(w, h, d) {
    return loft([{ y: h / 2, rx: w / 2, rz: d / 2, e: 0.02 },
                 { y: -h / 2, rx: w / 2, rz: d / 2, e: 0.02 }], 4, true, true);
  }

  /** Déplace, tourne et met à l'échelle un maillage, sur place. */
  function place(m, o) {
    var sx = o.sx !== undefined ? o.sx : (o.s || 1);
    var sy = o.sy !== undefined ? o.sy : (o.s || 1);
    var sz = o.sz !== undefined ? o.sz : (o.s || 1);
    var rx = o.rx || 0, ry = o.ry || 0, rz = o.rz || 0;
    var cx = Math.cos(rx), sxr = Math.sin(rx);
    var cy = Math.cos(ry), syr = Math.sin(ry);
    var cz = Math.cos(rz), szr = Math.sin(rz);
    var t = o.t || [0, 0, 0];
    var v = m.v;
    for (var i = 0; i < v.length; i += 3) {
      var x = v[i] * sx, y = v[i + 1] * sy, z = v[i + 2] * sz;
      var y1 = y * cx - z * sxr, z1 = y * sxr + z * cx;          /* autour de x */
      var x2 = x * cy + z1 * syr, z2 = -x * syr + z1 * cy;       /* autour de y */
      var x3 = x2 * cz - y1 * szr, y3 = x2 * szr + y1 * cz;      /* autour de z */
      v[i] = x3 + t[0]; v[i + 1] = y3 + t[1]; v[i + 2] = z2 + t[2];
    }
    return m;
  }

  /* ══════════════════════════════════════════════════════════════
     2. LA SCÈNE
     Un seul jeu de tableaux pour tout le corps : les sommets d'un côté, les
     triangles de l'autre, et pour chaque triangle l'indice de la pièce à
     laquelle il appartient. C'est ce qui permet de tout tourner et de tout
     trier d'un seul mouvement.
     ══════════════════════════════════════════════════════════════ */

  var parts = [];          /* { id, layer, color, alpha, twoSided, pick, box } */
  var partOf = {};         /* id → indice de pièce */
  var VB = [], TB = [], MB = [];
  var scene = null;

  function addPart(spec) {
    var idx = parts.length;
    parts.push({
      id: spec.id, layer: spec.layer, color: spec.color, alpha: spec.alpha || 1,
      twoSided: !!spec.twoSided, pick: spec.pick !== false,
      minx: 1e9, maxx: -1e9, miny: 1e9, maxy: -1e9, minz: 1e9, maxz: -1e9
    });
    if (spec.id) partOf[spec.id] = idx;
    return idx;
  }

  /** Verse un maillage dans la scène, au compte de la pièce donnée. */
  function attach(m, partIdx) {
    var base = VB.length / 3;
    var p = parts[partIdx], i;
    for (i = 0; i < m.v.length; i += 3) {
      var x = m.v[i], y = m.v[i + 1], z = m.v[i + 2];
      VB.push(x, y, z);
      if (x < p.minx) p.minx = x; if (x > p.maxx) p.maxx = x;
      if (y < p.miny) p.miny = y; if (y > p.maxy) p.maxy = y;
      if (z < p.minz) p.minz = z; if (z > p.maxz) p.maxz = z;
    }
    for (i = 0; i < m.t.length; i += 3) {
      TB.push(base + m.t[i], base + m.t[i + 1], base + m.t[i + 2]);
      MB.push(partIdx);
    }
  }

  /* Le chemin de la colonne vertébrale : il sert au rachis, à la moelle,
     aux côtes et à l'aorte descendante — tous s'y accrochent. */
  function spineAt(y) {
    /* Une double courbure : creuse dans le cou et les lombaires, bombée dans
       le dos. Ces trois centimètres de sinuosité suffisent à faire une
       silhouette juste de profil. */
    var t = (150 - y) / 52;
    return -2.2 - 2.4 * Math.sin(t * Math.PI) + 1.2 * Math.sin(t * Math.PI * 2);
  }

  /** Couleur d'une pièce, prise dans la fiche de l'organe. */
  function organColor(id) {
    var o = AN.byId(id);
    return o ? o.color : '#cccccc';
  }

  /* ── Le corps, pièce par pièce ─────────────────────────────── */
  function buildBody() {

    /* ─────────── La peau ───────────
       Translucide et gardée des deux côtés : la face arrière dessine le dos
       vu de l'intérieur, la face avant se pose par-dessus les organes. C'est
       ce sandwich qui donne l'impression de regarder dans un corps. */
    var skin = addPart({ id: 'peau', layer: 'peau', color: '#f0c4a6', alpha: 0.13,
                         twoSided: true, pick: false });

    attach(place(ellipsoid(8.4, 10.4, 9.4, 16, 12), { t: [0, 157, 0.5] }), skin);   /* tête */
    attach(place(ellipsoid(5.6, 3.4, 4.2, 12, 8), { t: [0, 150.5, 4.5] }), skin);   /* mâchoire */
    attach(loft([{ y: 152, rx: 5.0, rz: 4.8 }, { y: 146, rx: 5.4, rz: 5.2 },
                 { y: 142, rx: 6.6, rz: 6.0 }], 14), skin);                          /* cou */

    attach(loft([
      { y: 143, rx: 18.5, rz: 8.6, e: 0.72 },
      { y: 138, rx: 18.0, rz: 9.8 },
      { y: 131, rx: 16.2, rz: 10.4 },
      { y: 123, rx: 14.6, rz: 10.4 },
      { y: 113, rx: 13.4, rz: 9.8 },
      { y: 104, rx: 13.6, rz: 10.2 },
      { y: 96,  rx: 15.6, rz: 10.8 },
      { y: 88,  rx: 15.0, rz: 10.2 }
    ], 18, true, true), skin);                                                       /* tronc */

    [-1, 1].forEach(function (s) {
      attach(loft([                                                                  /* bras */
        { y: 141, rx: 5.4, rz: 5.4, cx: s * 17.5 },
        { y: 128, rx: 4.6, rz: 4.6, cx: s * 20.0 },
        { y: 117, rx: 3.9, rz: 3.9, cx: s * 21.5 },
        { y: 104, rx: 3.2, rz: 3.2, cx: s * 23.0 }
      ], 12, true), skin);
      attach(place(ellipsoid(2.2, 4.2, 1.3, 10, 8), { t: [s * 23.6, 99, 0.5] }), skin);
      attach(loft([                                                                  /* jambe */
        { y: 92, rx: 8.4, rz: 8.4, cx: s * 7.4 },
        { y: 70, rx: 6.8, rz: 6.8, cx: s * 6.6 },
        { y: 48, rx: 5.2, rz: 5.4, cx: s * 5.8 },
        { y: 28, rx: 4.6, rz: 4.8, cx: s * 5.4 },
        { y: 9,  rx: 3.6, rz: 3.8, cx: s * 5.2 }
      ], 14, true), skin);
      attach(place(ellipsoid(3.4, 2.4, 6.4, 10, 8), { t: [s * 5.2, 4, 2.5] }), skin);
    });

    /* ─────────── Le squelette ───────────
       Une seule pièce : on l'allume ou on l'éteint d'un bouton. */
    var os = addPart({ id: 'squelette', layer: 'os', color: organColor('squelette') });
    var i, k;

    attach(place(ellipsoid(7.4, 9.2, 8.4, 14, 10), { t: [0, 157.5, 0.3] }), os);     /* crâne */
    attach(place(box(9, 4.6, 6.4), { t: [0, 150, 3.6] }), os);                       /* mandibule */

    for (i = 0; i < 22; i++) {                                                       /* rachis */
      var vy = 148 - i * 2.4;
      attach(place(box(3.0, 1.8, 2.6), { t: [0, vy, spineAt(vy)] }), os);
    }
    attach(place(box(5.0, 7.0, 3.0), { rx: 0.35, t: [0, 93, spineAt(95) - 1] }), os); /* sacrum */

    /* Les côtes : douze paires d'arcs qui partent du rachis, contournent le
       thorax et rejoignent le sternum. Les deux dernières restent libres. */
    for (i = 0; i < 12; i++) {
      var ry0 = 139 - i * 1.9;
      var wide = 7.5 + 7.2 * Math.sin(Math.min(1, (i + 0.6) / 8) * Math.PI * 0.62);
      var deep = 6.0 + 3.4 * Math.sin(Math.min(1, (i + 0.6) / 8) * Math.PI * 0.55);
      var sweep = i < 10 ? 0.94 : 0.66;
      var drop = 3.5 + i * 0.55;
      [-1, 1].forEach(function (s) {
        var path = [];
        for (k = 0; k <= 9; k++) {
          var t = k / 9, a = t * Math.PI * sweep;
          path.push([
            s * wide * Math.sin(a),
            ry0 - drop * t * t,
            spineAt(ry0) + deep * (1 - Math.cos(a)) * 0.62
          ]);
        }
        attach(ribbon(path, function (u) { return 0.5 - 0.16 * u; }), os);
      });
    }
    attach(place(box(4.4, 17, 1.4), { rx: -0.12, t: [0, 128, 8.4] }), os);            /* sternum */

    [-1, 1].forEach(function (s) {
      attach(tube([[s * 1.6, 140.8, 4.0], [s * 8, 140.4, 6.2], [s * 16, 139.4, 3.2]],
                  0.62, 6), os);                                                     /* clavicule */
      attach(place(box(8.5, 11, 1.0), { ry: s * 0.3, t: [s * 9.5, 133, -6.4] }), os); /* omoplate */
      attach(place(box(3.2, 12, 8.0), { rz: s * 0.16, t: [s * 11, 95, 0] }), os);     /* iliaque */
      attach(tube([[s * 18.5, 139, 2], [s * 21, 128, 1.5], [s * 22, 118.5, 1]], 1.5, 6), os);
      attach(tube([[s * 22, 118.5, 1], [s * 23.4, 101, 1.8]], 1.05, 6), os);
      attach(tube([[s * 8, 96, 0], [s * 6.6, 72, 1], [s * 5.6, 50, 1]], 2.0, 7), os);
      attach(tube([[s * 5.6, 47, 1], [s * 5.2, 12, 1.5]], 1.5, 6), os);
      attach(place(box(4.5, 2.0, 7.5), { t: [s * 5.2, 5, 2.5] }), os);                /* pied */
      attach(place(box(3.0, 4.6, 1.4), { t: [s * 23.6, 98.5, 1.6] }), os);            /* main */
    });

    /* ─────────── Système nerveux ─────────── */
    var cerveau = addPart({ id: 'cerveau', layer: 'organe', color: organColor('cerveau') });
    /* Deux hémisphères bosselés : les circonvolutions ne sont qu'une petite
       ondulation du rayon, mais c'est elle qui fait « cerveau ». */
    var gyri = function (x, y, z, u, v) {
      var f = 1 + 0.05 * Math.sin(u * 22) * Math.sin(v * 11) + 0.03 * Math.sin(v * 17);
      return [x * f, y * f, z * f];
    };
    [-1, 1].forEach(function (s) {
      attach(place(ellipsoid(3.0, 5.2, 7.4, 18, 13, gyri), { t: [s * 3.1, 157.5, 0.5] }), cerveau);
    });
    attach(place(ellipsoid(4.4, 2.2, 3.0, 12, 8, gyri), { t: [0, 151.6, -4.6] }), cerveau);
    attach(tube([[0, 154, -1], [0, 150, -1.6], [0, 147, -2.2]], 1.5, 8), cerveau);

    var moelle = addPart({ id: 'moelle', layer: 'organe', color: organColor('moelle') });
    var spinePath = [];
    for (i = 0; i <= 12; i++) {
      var sy2 = 147 - i * 4;
      spinePath.push([0, sy2, spineAt(sy2) + 0.4]);
    }
    attach(tube(spinePath, function (u) { return 0.8 - 0.25 * u; }, 7), moelle);

    /* ─────────── Système respiratoire ─────────── */
    var poumons = addPart({ id: 'poumons', layer: 'organe', color: organColor('poumons'), alpha: 0.94 });
    /* Le droit compte trois lobes, le gauche deux : il cède la place au cœur,
       et c'est pour cela qu'il est plus étroit. */
    attach(loft([
      { y: 140, cx: 5.0, cz: 0.5, rx: 2.0, rz: 2.2 },
      { y: 136, cx: 6.2, cz: 0.8, rx: 4.2, rz: 4.4 },
      { y: 131, cx: 7.4, cz: 1.0, rx: 5.4, rz: 5.4 },
      { y: 126, cx: 8.0, cz: 1.0, rx: 5.9, rz: 5.5 },
      { y: 122, cx: 8.2, cz: 0.8, rx: 5.9, rz: 5.1 },
      { y: 119, cx: 7.8, cz: 0.6, rx: 5.2, rz: 4.2 },
      { y: 117, cx: 7.0, cz: 0.5, rx: 3.4, rz: 2.8 }
    ], 18, true, true), poumons);
    attach(loft([
      { y: 140, cx: -5.0, cz: 0.5, rx: 1.9, rz: 2.1 },
      { y: 136, cx: -6.4, cz: 0.8, rx: 3.9, rz: 4.2 },
      { y: 131, cx: -7.6, cz: 1.2, rx: 4.9, rz: 5.2 },
      { y: 126, cx: -8.6, cz: 1.6, rx: 4.7, rz: 4.9 },
      { y: 122, cx: -8.8, cz: 1.4, rx: 4.8, rz: 4.6 },
      { y: 119, cx: -8.4, cz: 0.8, rx: 4.4, rz: 3.9 },
      { y: 117, cx: -7.6, cz: 0.5, rx: 3.0, rz: 2.6 }
    ], 18, true, true), poumons);

    var trachee = addPart({ id: 'trachee', layer: 'organe', color: organColor('trachee') });
    attach(tube([[0, 150, 1.6], [0, 144, 1.6], [0, 138, 1.4], [0, 133, 1.2]], 1.1, 8), trachee);
    [-1, 1].forEach(function (s) {
      attach(tube([[0, 133.4, 1.2], [s * 2.6, 131, 0.8], [s * 5.4, 129, 0.4], [s * 7, 127.4, 0.2]],
                  function (u) { return 0.85 - 0.35 * u; }, 6), trachee);
    });

    var diaph = addPart({ id: 'diaphragme', layer: 'organe', color: organColor('diaphragme'),
                          alpha: 0.4, twoSided: true });
    attach(loft([
      { y: 121.5, cz: 1, rx: 4.5, rz: 3.4 },
      { y: 120.5, cz: 1, rx: 8.5, rz: 6.4 },
      { y: 119.0, cz: 1, rx: 12.0, rz: 8.6 },
      { y: 117.4, cz: 1, rx: 14.2, rz: 9.8 },
      { y: 116.0, cz: 1, rx: 15.2, rz: 10.4 }
    ], 18, true), diaph);

    /* ─────────── Système circulatoire ─────────── */
    var coeur = addPart({ id: 'coeur', layer: 'organe', color: organColor('coeur') });
    /* Une pile de sections dont le centre glisse vers le bas, la gauche et
       l'avant : c'est exactement l'axe du cœur dans une poitrine. */
    attach(loft([
      { y: 132.0, cx: -0.6, cz: 1.4, rx: 3.4, rz: 3.0 },
      { y: 129.5, cx: -1.2, cz: 2.0, rx: 4.6, rz: 4.1 },
      { y: 127.0, cx: -1.8, cz: 2.6, rx: 4.9, rz: 4.4 },
      { y: 124.0, cx: -2.4, cz: 3.1, rx: 4.5, rz: 4.0 },
      { y: 121.5, cx: -3.0, cz: 3.5, rx: 3.4, rz: 3.0 },
      { y: 119.5, cx: -3.5, cz: 3.8, rx: 1.7, rz: 1.6 }
    ], 20, true, true), coeur);
    /* L'auricule droite : la petite oreille du cœur, qui casse l'ovale. */
    attach(place(ellipsoid(1.9, 1.5, 1.6, 10, 8), { t: [2.4, 130.4, 2.6] }), coeur);

    var aorte = addPart({ id: 'aorte', layer: 'organe', color: organColor('aorte') });
    attach(tube([
      [-0.5, 130, 2.0], [0, 134, 1.4], [0.2, 137, 0.4], [-1.4, 138.6, -0.6],
      [-3.4, 137.4, -1.6], [-3.6, 134, -2.4], [-2.8, 128, -2.8]
    ], function (u) { return 1.5 - 0.3 * u; }, 8), aorte);
    var desc = [];
    for (i = 0; i <= 7; i++) {
      var dy = 128 - i * 4;
      desc.push([-1.8, dy, spineAt(dy) + 2.2]);
    }
    attach(tube(desc, function (u) { return 1.2 - 0.25 * u; }, 7), aorte);

    var rate = addPart({ id: 'rate', layer: 'organe', color: organColor('rate') });
    attach(place(ellipsoid(2.5, 4.0, 2.8, 12, 9), { rz: 0.3, ry: -0.4, t: [-10.6, 116, -1.6] }), rate);

    /* ─────────── Système digestif ─────────── */
    var oeso = addPart({ id: 'oesophage', layer: 'organe', color: organColor('oesophage') });
    attach(tube([[0, 149, -0.6], [0, 141, -1.4], [0, 133, -1.8], [-0.6, 125, -1.2],
                 [-1.4, 120, 0.4], [-2.2, 117.6, 1.6]], 0.95, 7), oeso);

    var estomac = addPart({ id: 'estomac', layer: 'organe', color: organColor('estomac') });
    attach(tube([
      [-2.2, 118, 1.6], [-4.2, 115.6, 2.4], [-6.4, 113, 2.6], [-7.0, 110.4, 2.2],
      [-5.6, 108.6, 1.6], [-3.0, 108.2, 1.0], [-0.6, 109.4, 0.4]
    ], function (u) {
      /* Large au milieu, pincé aux deux bouts : la forme en J de l'estomac. */
      return 1.4 + 3.0 * Math.sin(Math.min(1, u * 1.25) * Math.PI);
    }, 12), estomac);

    var foie = addPart({ id: 'foie', layer: 'organe', color: organColor('foie') });
    attach(loft([
      { y: 120.5, cx: 5.6, cz: 1.6, rx: 6.4, rz: 4.8 },
      { y: 118.0, cx: 4.4, cz: 1.8, rx: 9.4, rz: 6.4 },
      { y: 115.5, cx: 3.6, cz: 2.0, rx: 10.4, rz: 6.8 },
      { y: 113.0, cx: 4.6, cz: 2.0, rx: 9.0, rz: 6.0 },
      { y: 111.0, cx: 6.4, cz: 1.8, rx: 5.6, rz: 4.0 },
      { y: 109.5, cx: 7.8, cz: 1.6, rx: 2.6, rz: 2.2 }
    ], 20, true, true), foie);

    var pancreas = addPart({ id: 'pancreas', layer: 'organe', color: organColor('pancreas') });
    attach(tube([[4.6, 109.0, -1.4], [2.0, 109.6, -2.0], [-1.5, 110.4, -2.4],
                 [-5.0, 111.0, -2.6], [-8.0, 111.4, -2.4]],
                function (u) { return 2.1 - 1.2 * u; }, 8), pancreas);

    var grele = addPart({ id: 'grele', layer: 'organe', color: organColor('grele') });
    var coil = [];
    for (i = 0; i <= 132; i++) {
      var t2 = i / 132;
      /* Six mètres de tuyau repliés dans vingt centimètres de ventre : des
         allers-retours qui descendent, chacun bombé vers l'avant, et dont
         l'amplitude s'arrondit aux deux bouts pour épouser l'abdomen. */
      var ang = t2 * Math.PI * 9;
      var amp = 8.2 * Math.pow(Math.sin(Math.PI * (0.16 + 0.74 * t2)), 0.5);
      /* Neuf passages en un peu plus de dix centimètres : les anses se
         chevauchent à moitié et forment une masse, comme dans un vrai ventre.
         La profondeur alterne d'un passage à l'autre, ce qui les entrelace. */
      /* Un peu de désordre : sans lui, les anses forment un tressage trop
         régulier, qui a l'air d'un panier plutôt que d'un intestin. */
      var jx = Math.sin(t2 * 37.7) * 0.55 + Math.sin(t2 * 13.1) * 0.4;
      var jy = Math.sin(t2 * 23.3) * 0.75;
      var jz = Math.cos(t2 * 31.1) * 0.7;
      coil.push([
        amp * Math.cos(ang) + jx,
        104.8 - t2 * 12.4 + jy,
        1.6 + 3.2 * Math.sin(ang * 0.5) * Math.sin(ang * 0.5) + 0.8 * Math.cos(ang) + jz
      ]);
    }
    attach(tube(coil, 1.5, 6), grele);

    var colon = addPart({ id: 'colon', layer: 'organe', color: organColor('colon') });
    attach(tube([
      [7.0, 93.5, 3.0], [9.4, 97, 2.4], [10.4, 104, 1.6], [10.2, 111, 1.0],
      [9.0, 115.6, 0.6], [5.0, 116.6, 2.0], [0, 116.0, 3.0], [-5.0, 115.4, 2.2],
      [-9.2, 115.0, 0.4], [-10.0, 110, 0.2], [-9.4, 102, 0.6], [-8.2, 96.5, 1.2],
      [-4.6, 93.0, 1.6], [-1.0, 91.5, 0.4], [0, 89, -0.6]
    ], function (u) { return 2.5 - 0.7 * u; }, 8), colon);

    /* ─────────── Système urinaire ─────────── */
    var reins = addPart({ id: 'reins', layer: 'organe', color: organColor('reins') });
    [-1, 1].forEach(function (s) {
      /* Le creux du haricot, côté colonne : un rayon qu'on pince là où le
         rein regarde vers l'intérieur. */
      var bean = function (x, y, z, u) {
        var toward = (s > 0 ? Math.sin(u * 2 * Math.PI) : -Math.sin(u * 2 * Math.PI));
        var f = 1 - 0.34 * Math.max(0, -toward) * Math.exp(-Math.pow((y / 4.2) * 1.6, 2));
        return [x * f, y, z * f];
      };
      attach(place(ellipsoid(2.4, 4.2, 2.6, 14, 10, bean),
                   { rz: s * 0.12, t: [s * 6.6, s > 0 ? 111.4 : 112.6, spineAt(112) - 1.4] }), reins);
      attach(tube([[s * 6.6, 108.6, -3.4], [s * 5.4, 102, -1.6], [s * 2.6, 96.4, 0.8]], 0.42, 5), reins);
    });

    var vessie = addPart({ id: 'vessie', layer: 'organe', color: organColor('vessie') });
    attach(place(ellipsoid(3.3, 2.9, 2.9, 14, 10), { t: [0, 93.6, 2.0] }), vessie);

    /* ── Gel de la scène en tableaux typés ──
       Une fois le corps bâti, plus rien ne bouge : on referme les listes dans
       des tableaux typés, plus rapides à parcourir soixante fois par seconde. */
    scene = {
      vx: new Float32Array(VB.length / 3),
      vy: new Float32Array(VB.length / 3),
      vz: new Float32Array(VB.length / 3),
      tri: new Int32Array(TB),
      mat: new Uint8Array(MB),
      nv: VB.length / 3,
      nt: TB.length / 3
    };
    for (i = 0; i < scene.nv; i++) {
      scene.vx[i] = VB[i * 3];
      scene.vy[i] = VB[i * 3 + 1];
      scene.vz[i] = VB[i * 3 + 2];
    }
    VB = TB = MB = null;

    /* Le centre et le rayon de chaque pièce : de quoi cadrer un organe. */
    parts.forEach(function (p) {
      p.cx = (p.minx + p.maxx) / 2;
      p.cy = (p.miny + p.maxy) / 2;
      p.cz = (p.minz + p.maxz) / 2;
      p.rad = Math.max(p.maxx - p.minx, p.maxy - p.miny, p.maxz - p.minz) / 2;
    });
  }

  /* ══════════════════════════════════════════════════════════════
     3. LE RENDU
     ══════════════════════════════════════════════════════════════ */

  /* La lumière : d'en haut, à gauche, légèrement de face. Elle ne bouge pas,
     c'est le corps qui tourne dessous. */
  var LX = -0.36, LY = 0.46, LZ = 0.81;
  (function () {
    var l = Math.sqrt(LX * LX + LY * LY + LZ * LZ);
    LX /= l; LY /= l; LZ /= l;
  })();

  var LEVELS = 12;                 /* nuances précalculées par pièce et par état */
  var stage, canvas, ctx, wrap;

  var view = {
    yaw: 0.15, pitch: 0.05, zoom: 2.0,
    tx: 0, ty: 118, tz: 0,
    spinning: true,
    layers: { peau: true, os: false, organe: true },
    system: null,
    selected: null,
    hover: null,
    w: 0, h: 0, dpr: 1,
    time: 0, interacting: 0,
    focus: null                    /* cible d'un cadrage en cours */
  };

  var RX, RY, RZ, SX, SY;          /* sommets tournés puis projetés */
  var triIdx, triDep, triSha, triN; /* la liste des triangles à peindre */
  var order, bucketCount, bucketAt;

  function hexRgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }

  /**
   * Trois jeux de couleurs par pièce : normal, mis en avant, effacé. Les
   * teintes sont calculées une fois pour toutes — construire une chaîne
   * « rgba(...) » par triangle et par image coûterait plus cher que de les
   * peindre.
   */
  function buildPalettes() {
    parts.forEach(function (p) {
      var o = AN.byId(p.id);
      var base = hexRgb(p.color);
      var hi = hexRgb(o && o.hi ? o.hi : '#ffffff');
      p.grow = p.alpha >= 1;
      p.css = [[], [], []];
      for (var st = 0; st < 3; st++) {
        for (var k = 0; k < LEVELS; k++) {
          var sh = 0.28 + 0.95 * (k / (LEVELS - 1));
          var r = base[0], g = base[1], b = base[2], a = p.alpha;
          if (st === 1) {                       /* mis en avant */
            r = r + (hi[0] - r) * 0.45; g = g + (hi[1] - g) * 0.45; b = b + (hi[2] - b) * 0.45;
            a = Math.min(1, p.alpha * 1.5);
          } else if (st === 2) {                /* effacé, pour laisser voir */
            var m = (r + g + b) / 3;
            r = r + (m - r) * 0.55; g = g + (m - g) * 0.55; b = b + (m - b) * 0.55;
            a = p.alpha * (p.layer === 'organe' ? 0.4 : 0.45);
          }
          p.css[st][k] = 'rgba(' + Math.min(255, r * sh | 0) + ',' +
                                   Math.min(255, g * sh | 0) + ',' +
                                   Math.min(255, b * sh | 0) + ',' +
                                   (a < 1 ? a.toFixed(3) : '1') + ')';
        }
      }
    });
  }

  /** Une pièce est-elle à l'écran, vu les couches et le filtre en cours ? */
  function visible(p) {
    if (!view.layers[p.layer]) return false;
    if (p.layer === 'organe' && view.system) {
      var o = AN.byId(p.id);
      if (!o || o.system !== view.system) return false;
    }
    return true;
  }

  function stateOf(idx) {
    if (view.selected !== null) {
      if (idx === view.selected || idx === view.hover) return 1;
      return 2;
    }
    return idx === view.hover ? 1 : 0;
  }

  /** Tourne le corps et projette : deux rotations, une mise à l'échelle. */
  function project(scale, cxp, cyp) {
    var cy = Math.cos(view.yaw), sy = Math.sin(view.yaw);
    var cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
    var vx = scene.vx, vy = scene.vy, vz = scene.vz;
    var tx = view.tx, ty = view.ty, tz = view.tz;

    for (var i = 0, n = scene.nv; i < n; i++) {
      var x = vx[i] - tx, y = vy[i] - ty, z = vz[i] - tz;
      var x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      var y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      RX[i] = x1; RY[i] = y2; RZ[i] = z2;
      SX[i] = cxp + x1 * scale;
      SY[i] = cyp - y2 * scale;
    }
  }

  /** Dresse la liste des triangles visibles, avec leur profondeur et leur ombre. */
  function collect() {
    var tri = scene.tri, mat = scene.mat, nt = scene.nt;
    var n = 0, minz = 1e9, maxz = -1e9;

    for (var t = 0; t < nt; t++) {
      var p = parts[mat[t]];
      if (!p.vis) continue;
      var a = tri[t * 3], b = tri[t * 3 + 1], c = tri[t * 3 + 2];

      var ax = RX[a], ay = RY[a], az = RZ[a];
      var ux = RX[b] - ax, uy = RY[b] - ay, uz = RZ[b] - az;
      var wx = RX[c] - ax, wy = RY[c] - ay, wz = RZ[c] - az;
      var nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      if (nz <= 0) {
        /* Face arrière : on la jette, sauf pour les surfaces qu'on regarde
           des deux côtés — la peau, le diaphragme, les côtes. */
        if (!p.twoSided) continue;
        nx = -nx; ny = -ny; nz = -nz;
      }
      var nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (nl < 1e-9) continue;                 /* triangle dégénéré (pôle) */
      nx /= nl; ny /= nl; nz /= nl;

      var lam = nx * LX + ny * LY + nz * LZ;
      if (lam < 0) lam = 0;
      /* Un liseré sur les bords : sans lui, deux organes de teinte proche se
         confondent là où ils se touchent. */
      var rim = 1 - nz;
      var sh = 0.34 + 0.60 * lam + 0.26 * rim * rim * rim;
      var lvl = (sh * (LEVELS - 1)) | 0;
      if (lvl < 0) lvl = 0; else if (lvl >= LEVELS) lvl = LEVELS - 1;

      var dep = (az + RZ[b] + RZ[c]) / 3;
      if (dep < minz) minz = dep;
      if (dep > maxz) maxz = dep;

      triIdx[n] = t; triDep[n] = dep; triSha[n] = lvl;
      n++;
    }
    triN = n;
    return [minz, maxz];
  }

  /**
   * Tri par casiers : mille casiers de profondeur, un passage pour compter,
   * un pour placer. En temps linéaire, là où un tri comparatif coûterait un
   * facteur log — et à cinq mille triangles par image, cela se sent.
   */
  var NBUCK = 1024;
  function sortByDepth(minz, maxz) {
    var span = maxz - minz;
    var k = span > 1e-6 ? (NBUCK - 1) / span : 0;
    var i, b;
    bucketCount.fill(0);
    for (i = 0; i < triN; i++) {
      b = ((triDep[i] - minz) * k) | 0;
      if (b < 0) b = 0; else if (b >= NBUCK) b = NBUCK - 1;
      triDep[i] = b;                       /* on garde le casier, plus la valeur */
      bucketCount[b]++;
    }
    var acc = 0;
    for (b = 0; b < NBUCK; b++) { bucketAt[b] = acc; acc += bucketCount[b]; }
    for (i = 0; i < triN; i++) order[bucketAt[triDep[i]]++] = i;
  }

  /**
   * Peinture, du plus lointain au plus proche. Les triangles qui partagent
   * exactement la même couleur sont accumulés dans un seul chemin : sur un
   * corps entier, cela divise par trois le nombre d'appels de remplissage.
   */
  function paint() {
    var tri = scene.tri, mat = scene.mat;
    var cur = null, open = false;

    for (var k = 0; k < triN; k++) {
      var e = order[k];
      var t = triIdx[e];
      var p = parts[mat[t]];
      var col = p.css[p.state][triSha[e]];

      if (col !== cur) {
        if (open) { ctx.fillStyle = cur; ctx.fill(); }
        ctx.beginPath();
        cur = col; open = true;
      }
      var a = tri[t * 3], b = tri[t * 3 + 1], c = tri[t * 3 + 2];
      var x0 = SX[a], y0 = SY[a], x1 = SX[b], y1 = SY[b], x2 = SX[c], y2 = SY[c];
      if (p.grow) {
        /* Les faces opaques sont dilatées de 3 % autour de leur centre, sinon
           les fils clairs de l'anticrénelage apparaissent entre elles. Les
           faces translucides, elles, s'en passent : le recouvrement y
           doublerait l'encre et dessinerait une couture à chaque section. */
        var mx = (x0 + x1 + x2) / 3, my = (y0 + y1 + y2) / 3;
        x0 = mx + (x0 - mx) * 1.03; y0 = my + (y0 - my) * 1.03;
        x1 = mx + (x1 - mx) * 1.03; y1 = my + (y1 - my) * 1.03;
        x2 = mx + (x2 - mx) * 1.03; y2 = my + (y2 - my) * 1.03;
      }
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();
    }
    if (open) { ctx.fillStyle = cur; ctx.fill(); }
  }

  /**
   * Quel organe se trouve sous ce point ? On remonte la liste triée du plus
   * proche au plus lointain et on renvoie le premier triangle touché. La peau
   * est ignorée : on veut désigner à travers elle.
   */
  function pickAt(px, py) {
    var tri = scene.tri, mat = scene.mat;
    for (var k = triN - 1; k >= 0; k--) {
      var e = order[k];
      var t = triIdx[e];
      var p = parts[mat[t]];
      if (!p.pick) continue;
      var a = tri[t * 3], b = tri[t * 3 + 1], c = tri[t * 3 + 2];
      var x0 = SX[a], y0 = SY[a], x1 = SX[b], y1 = SY[b], x2 = SX[c], y2 = SY[c];
      /* Trois produits vectoriels : le point est dedans s'ils ont même signe. */
      var d1 = (px - x1) * (y0 - y1) - (x0 - x1) * (py - y1);
      var d2 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
      var d3 = (px - x0) * (y2 - y0) - (x2 - x0) * (py - y0);
      var neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
      var pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
      if (!(neg && pos)) return mat[t];
    }
    return null;
  }

  var baseScale = 1;

  function frame(dt) {
    var w = view.w, h = view.h;
    ctx.clearRect(0, 0, w, h);
    if (!scene) return;

    /* Cadrage en cours : on glisse vers l'organe au lieu d'y sauter. */
    if (view.focus) {
      var f = view.focus, ease = 1 - Math.exp(-dt * 5.5);
      view.tx += (f.tx - view.tx) * ease;
      view.ty += (f.ty - view.ty) * ease;
      view.tz += (f.tz - view.tz) * ease;
      view.zoom += (f.zoom - view.zoom) * ease;
      var dyaw = f.yaw - view.yaw;
      while (dyaw > Math.PI) dyaw -= 2 * Math.PI;
      while (dyaw < -Math.PI) dyaw += 2 * Math.PI;
      view.yaw += dyaw * ease;
      view.pitch += (f.pitch - view.pitch) * ease;
      if (Math.abs(f.zoom - view.zoom) < 0.01 && Math.abs(f.ty - view.ty) < 0.2) view.focus = null;
    } else if (view.spinning) {
      view.yaw += dt * 0.32;
    }
    if (view.yaw > Math.PI) view.yaw -= 2 * Math.PI;
    if (view.yaw < -Math.PI) view.yaw += 2 * Math.PI;

    baseScale = h * 0.88 / 180;
    var scale = baseScale * view.zoom;

    for (var i = 0; i < parts.length; i++) {
      parts[i].vis = visible(parts[i]);
      parts[i].state = stateOf(i);
    }

    project(scale, w / 2, h / 2);
    var mm = collect();
    sortByDepth(mm[0], mm[1]);
    paint();
  }

  /* ══════════════════════════════════════════════════════════════
     4. LA FICHE
     ══════════════════════════════════════════════════════════════ */

  var $ = function (id) { return document.getElementById(id); };
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function fillSheet(o) {
    var sys = AN.systemOf(o.system);
    $('anTitle').textContent = o.name;
    var badge = $('anSystem');
    badge.textContent = sys.label;
    badge.style.setProperty('--sys', sys.color);
    $('anRole').textContent = o.role;
    $('anWhere').textContent = o.where;
    $('anDaily').textContent = o.daily;

    var host = $('anStats');
    host.innerHTML = '';
    Object.keys(o.stats).forEach(function (k) {
      var row = o.stats[k];
      var el = document.createElement('div');
      el.className = 'an-stat';
      el.innerHTML = '<span></span><b></b>';
      el.firstChild.textContent = k;
      el.lastChild.textContent = row[0];
      if (row[1]) {
        var em = document.createElement('em');
        em.textContent = row[1];
        el.lastChild.appendChild(document.createElement('br'));
        el.lastChild.appendChild(em);
      }
      host.appendChild(el);
    });

    var fh = $('anFacts');
    fh.innerHTML = '';
    o.facts.forEach(function (f) {
      var el = document.createElement('div');
      el.className = 'an-fact';
      el.innerHTML = '<i></i><p></p>';
      el.firstChild.textContent = f.e;
      el.lastChild.textContent = f.t;
      fh.appendChild(el);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     5. LE QUAI DES ORGANES, LES COUCHES, LES SYSTÈMES
     ══════════════════════════════════════════════════════════════ */

  var dockBtn = {};

  function buildDock() {
    var host = $('anDock');
    AN.organs.forEach(function (o) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.style.setProperty('--dot', o.color);
      var dot = document.createElement('span');
      dot.className = 'an-dot';
      dot.style.setProperty('--dot', o.color);
      btn.appendChild(dot);
      btn.appendChild(document.createTextNode(o.short));
      btn.addEventListener('click', function () { select(o.id, true, true); });
      host.appendChild(btn);
      dockBtn[o.id] = btn;
    });
  }

  function buildFilters() {
    var host = $('anFilters');
    var mk = function (key, label, color) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'gr-chip';
      b.textContent = label;
      if (color) b.style.setProperty('--sys', color);
      b.addEventListener('click', function () { setFilter(key); });
      host.appendChild(b);
      return b;
    };
    filterBtn['*'] = mk(null, 'Tout le corps', '#f0c04b');
    AN.systems.forEach(function (s) {
      if (s.key === 'squelette') return;         /* le squelette a son propre bouton */
      filterBtn[s.key] = mk(s.key, s.label, s.color);
    });
    setFilter(null);
  }
  var filterBtn = {};

  /** Les cinq équipes d'organes, en cartes cliquables. */
  function buildSystems() {
    var host = $('anSystems');
    AN.systems.forEach(function (sy) {
      var n = AN.organs.filter(function (o) { return o.system === sy.key; }).length;
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'an-system';
      el.style.setProperty('--sys', sy.color);
      var b = document.createElement('b');
      b.textContent = sy.label + ' · ' + n + (n > 1 ? ' organes' : ' entrée');
      var sp = document.createElement('span');
      sp.textContent = sy.blurb;
      el.appendChild(b); el.appendChild(sp);
      el.addEventListener('click', function () {
        if (sy.key === 'squelette') { setLayer('os', true); select('squelette', true, true); }
        else { setFilter(sy.key); clearSelection(); }
        stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      host.appendChild(el);
    });
  }

  function setFilter(key) {
    view.system = key || null;
    Object.keys(filterBtn).forEach(function (k) {
      var on = (k === '*' && !key) || k === key;
      filterBtn[k].classList.toggle('is-on', on);
      filterBtn[k].setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    /* Un organe mis en avant mais masqué par le filtre n'aurait plus de sens. */
    if (key && view.selected !== null) {
      var o = AN.byId(parts[view.selected].id);
      if (o && o.system !== key) clearSelection();
    }
    var sys = key ? AN.systemOf(key) : null;
    $('anSysBlurb').textContent = sys ? sys.blurb : '';
    /* Changer de système, c'est changer de sujet : on revient à la vue
       d'ensemble plutôt que de rester collé à l'organe précédent. */
    if (!game.on) resetView();
  }

  function setLayer(name, on) {
    view.layers[name] = on;
    var b = name === 'peau' ? $('anSkin') : $('anBones');
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function updateDock(id) {
    Object.keys(dockBtn).forEach(function (k) {
      var on = k === id;
      dockBtn[k].classList.toggle('is-on', on);
      dockBtn[k].setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (id && dockBtn[id]) {
      dockBtn[id].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
  }

  function focusOn(idx) {
    var p = parts[idx];
    var minWH = Math.min(view.w, view.h);
    var z = minWH * 0.24 / Math.max(3, p.rad * baseScale);
    view.focus = {
      tx: p.cx, ty: p.cy, tz: p.cz,
      zoom: clamp(z, 1.2, 5),
      yaw: clamp(Math.atan2(-p.cx, p.cz + 30), -0.6, 0.6),
      pitch: 0.05
    };
    view.spinning = false;
    setSpinIcon();
  }

  function select(id, focus, remember) {
    var idx = partOf[id];
    var o = AN.byId(id);
    if (idx === undefined || !o) return;
    if (o.system === 'squelette') setLayer('os', true);
    if (view.system && o.system !== view.system) setFilter(null);

    view.selected = idx;
    fillSheet(o);
    updateDock(id);
    $('anName').textContent = o.name;
    $('anKind').textContent = AN.systemOf(o.system).label;
    if (focus) focusOn(idx);
    if (remember && global.history && history.replaceState) history.replaceState(null, '', '#' + id);
  }

  function clearSelection() {
    view.selected = null;
    updateDock(null);
    $('anName').textContent = 'Le corps humain';
    $('anKind').textContent = 'Touchez un organe';
  }

  /* ══════════════════════════════════════════════════════════════
     6. LES GESTES
     ══════════════════════════════════════════════════════════════ */

  var pointers = {}, pinchStart = 0, zoomStart = 1, moved = 0, hintSeen = false;

  function isControl(node) {
    while (node && node !== stage) {
      var tag = node.tagName;
      if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'LABEL') return true;
      node = node.parentNode;
    }
    return false;
  }

  function touched() {
    view.interacting = view.time;
    if (!hintSeen) { hintSeen = true; $('anHint').classList.add('is-gone'); }
  }

  function localPoint(e) {
    var r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) * (view.w / r.width),
            (e.clientY - r.top) * (view.h / r.height)];
  }

  function dist(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function setZoom(z) { view.zoom = clamp(z, 0.6, 9); view.focus = null; touched(); }

  function bindGestures() {
    stage.addEventListener('pointerdown', function (e) {
      if (isControl(e.target)) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      stage.classList.add('is-dragging');
      moved = 0;
      var ids = Object.keys(pointers);
      if (ids.length === 2) {
        pinchStart = dist(pointers[ids[0]], pointers[ids[1]]);
        zoomStart = view.zoom;
      }
      touched();
    });

    stage.addEventListener('pointermove', function (e) {
      var p = pointers[e.pointerId];
      if (!p) {
        /* Sans bouton enfoncé, le pointeur ne fait que survoler : on éclaire
           l'organe sous le curseur. */
        if (e.pointerType !== 'touch' && scene) {
          var q = localPoint(e);
          var hit = pickAt(q[0], q[1]);
          if (hit !== view.hover) {
            view.hover = hit;
            stage.style.cursor = hit === null ? '' : 'pointer';
            var ho = hit === null ? null : AN.byId(parts[hit].id);
            if (view.selected === null) {
              $('anName').textContent = ho ? ho.name : 'Le corps humain';
              $('anKind').textContent = ho ? AN.systemOf(ho.system).label
                                           : 'Touchez un organe';
            }
          }
        }
        return;
      }
      var dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);

      var ids = Object.keys(pointers);
      if (ids.length >= 2) {
        var d = dist(pointers[ids[0]], pointers[ids[1]]);
        if (pinchStart > 8) setZoom(zoomStart * d / pinchStart);
        return;
      }
      view.focus = null;
      view.yaw -= dx * 0.0085;
      view.pitch = clamp(view.pitch + dy * 0.006, -1.1, 1.1);
      touched();
    });

    function release(e) {
      var p = pointers[e.pointerId];
      delete pointers[e.pointerId];
      if (!Object.keys(pointers).length) stage.classList.remove('is-dragging');
      if (!p || moved > 7 || !scene) return;
      /* Un appui sans glissement : c'est une désignation. */
      var q = localPoint(e);
      var hit = pickAt(q[0], q[1]);
      if (game.on) { answer(hit); return; }
      if (hit === null) { clearSelection(); return; }
      select(parts[hit].id, true, true);
    }
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', function (e) { delete pointers[e.pointerId]; });

    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      setZoom(view.zoom * Math.exp(-e.deltaY * 0.0014));
    }, { passive: false });

    $('anIn').addEventListener('click', function () { setZoom(view.zoom * 1.35); });
    $('anOut').addEventListener('click', function () { setZoom(view.zoom / 1.35); });
    $('anReset').addEventListener('click', resetView);
    $('anPlay').addEventListener('click', function () {
      view.spinning = !view.spinning;
      if (view.spinning) view.focus = null;
      setSpinIcon();
    });
    $('anSkin').addEventListener('click', function () { setLayer('peau', !view.layers.peau); });
    $('anBones').addEventListener('click', function () { setLayer('os', !view.layers.os); });

    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      switch (e.key) {
        case 'ArrowLeft':  view.yaw -= 0.14; view.focus = null; break;
        case 'ArrowRight': view.yaw += 0.14; view.focus = null; break;
        case 'ArrowUp':    view.pitch = clamp(view.pitch - 0.1, -1.1, 1.1); view.focus = null; break;
        case 'ArrowDown':  view.pitch = clamp(view.pitch + 0.1, -1.1, 1.1); view.focus = null; break;
        case '+': case '=': setZoom(view.zoom * 1.25); break;
        case '-': case '_': setZoom(view.zoom / 1.25); break;
        case 'Escape': clearSelection(); resetView(); break;
        case ' ': view.spinning = !view.spinning; setSpinIcon(); break;
        default: return;
      }
      touched();
      e.preventDefault();
    });
  }

  var ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>';

  function setSpinIcon() {
    var b = $('anPlay');
    b.innerHTML = view.spinning ? ICON_PAUSE : ICON_PLAY;
    var label = view.spinning ? 'Arrêter la rotation' : 'Faire tourner le corps';
    b.title = label;
    b.setAttribute('aria-label', label);
  }

  function resetView() {
    view.focus = { tx: 0, ty: 118, tz: 0, zoom: 2.0, yaw: 0.15, pitch: 0.05 };
    touched();
  }

  /* ══════════════════════════════════════════════════════════════
     7. TROUVE L'ORGANE
     Le même code de désignation, retourné en jeu : la question donne un nom,
     c'est au joueur de trouver l'endroit.
     ══════════════════════════════════════════════════════════════ */

  var game = { on: false, list: [], i: 0, score: 0 };

  function gameStart() {
    var pool = AN.organs.filter(function (o) { return o.system !== 'squelette'; });
    for (var i = pool.length - 1; i > 0; i--) {          /* battage de Fisher-Yates */
      var j = (Math.random() * (i + 1)) | 0;
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    game.list = pool.slice(0, 6).map(function (o) { return o.id; });
    game.on = true; game.i = 0; game.score = 0;

    clearSelection();
    setFilter(null);
    setLayer('os', false);
    setLayer('peau', true);
    view.spinning = false; setSpinIcon();
    resetView();
    $('anGame').classList.add('is-playing');
    $('anDockWrap').classList.add('is-hidden');
    $('anQuiz').hidden = false;
    stage.classList.add('is-quiz');
    $('anGameStart').textContent = 'Recommencer';
    gameStep();
    /* La question est sur la scène, mais encore faut-il que la scène soit
       à l'écran : le bouton « Commencer », lui, est tout en bas de la page. */
    stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /** Écrit la question au même endroit dans le bandeau et dans le panneau. */
  function askInto(el, o) {
    el.innerHTML = '';
    el.appendChild(document.createTextNode('Question ' + (game.i + 1) + ' sur 6 — trouve '));
    var b = document.createElement('b');
    b.textContent = o.name.replace(/^(Le |La |L'|Les )/, function (m) { return m.toLowerCase(); });
    el.appendChild(b);
  }

  function gameStep() {
    var o = AN.byId(game.list[game.i]);
    askInto($('anQuestion'), o);
    askInto($('anQuizQ'), o);
    setScore();
    feedback('', '');
  }

  function setScore() {
    var txt = game.score + ' / ' + game.i;
    $('anScore').textContent = txt;
    $('anQuizScore').textContent = txt + ' trouvé' + (game.score > 1 ? 's' : '');
  }

  function feedback(txt, kind) {
    $('anFeedback').textContent = txt;
    $('anFeedback').className = 'an-feedback' + (kind ? ' ' + kind : '');
    $('anQuizFb').textContent = txt;
    $('anQuizFb').className = 'an-quiz-fb' + (kind ? ' ' + kind : '');
  }

  function answer(hit) {
    var want = game.list[game.i];
    var got = hit === null ? null : parts[hit].id;

    if (got === want) {
      game.score++;
      feedback('Exact ! ' + AN.byId(want).name + ', bien vu.', 'is-good');
    } else {
      var o = AN.byId(want);
      var g = got ? AN.byId(got) : null;
      var gotName = g ? g.name.charAt(0).toLowerCase() + g.name.slice(1) : 'le vide';
      /* « Les reins est là » : les organes au pluriel méritent leur verbe. */
      var etre = /^Les /.test(o.name) ? ' sont là.' : ' est là.';
      feedback('Raté : tu as touché ' + gotName + '. ' + o.name + etre, 'is-bad');
      select(want, true, false);
    }

    game.i++;
    if (game.i >= game.list.length) {
      game.on = false;
      $('anGame').classList.remove('is-playing');
      $('anDockWrap').classList.remove('is-hidden');
      $('anQuiz').hidden = true;
      stage.classList.remove('is-quiz');
      var msg = game.score === 6 ? 'Six sur six — tu connais ton corps par cœur.'
              : game.score >= 4 ? 'Beau score : ' + game.score + ' sur 6.'
              : 'Score : ' + game.score + ' sur 6. Refais un tour du corps et retente.';
      $('anQuestion').textContent = msg;
      $('anScore').textContent = game.score + ' / 6';
      return;
    }
    setScore();
    setTimeout(function () {
      if (game.on) { clearSelection(); resetView(); gameStep(); }
    }, 1700);
  }

  /* ══════════════════════════════════════════════════════════════
     8. MISE EN ROUTE
     ══════════════════════════════════════════════════════════════ */

  function resize() {
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(wrap.clientWidth * dpr));
    var h = Math.max(1, Math.round(wrap.clientHeight * dpr));
    if (w === view.w && h === view.h && dpr === view.dpr) return;
    canvas.width = w; canvas.height = h;
    view.w = w; view.h = h; view.dpr = dpr;
  }

  var last = 0;
  function tick(ts) {
    var t = ts / 1000;
    var dt = last ? Math.min(0.05, t - last) : 0;
    last = t;
    view.time = t;
    if (!document.hidden) frame(dt);
    requestAnimationFrame(tick);
  }

  function boot() {
    stage = $('anStage');
    canvas = $('anScene');
    ctx = canvas.getContext('2d');
    wrap = canvas.parentNode;

    buildBody();
    buildPalettes();

    RX = new Float32Array(scene.nv); RY = new Float32Array(scene.nv); RZ = new Float32Array(scene.nv);
    SX = new Float32Array(scene.nv); SY = new Float32Array(scene.nv);
    triIdx = new Int32Array(scene.nt); triDep = new Float32Array(scene.nt);
    triSha = new Uint8Array(scene.nt); order = new Int32Array(scene.nt);
    bucketCount = new Int32Array(NBUCK); bucketAt = new Int32Array(NBUCK);

    buildDock();
    buildFilters();
    buildSystems();
    setLayer('peau', true);
    setLayer('os', false);
    setSpinIcon();
    clearSelection();
    resize();
    global.addEventListener('resize', resize);
    bindGestures();

    $('anGameStart').addEventListener('click', gameStart);
    $('anCount').textContent = AN.organs.length;

    var wanted = (location.hash || '').replace('#', '');
    if (AN.byId(wanted)) select(wanted, true, false);
    global.addEventListener('hashchange', function () {
      var id = (location.hash || '').replace('#', '');
      if (AN.byId(id)) select(id, true, false);
    });

    if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      view.spinning = false;
      setSpinIcon();
    }
    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
