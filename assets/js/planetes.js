/**
 * L'Explorateur des Planètes — moteur de rendu et interface
 * ------------------------------------------------------------------
 * Aucune bibliothèque, aucune image : le globe est calculé pixel par pixel.
 *
 * Le principe, en trois temps :
 *
 *   1. PEINDRE — chaque astre reçoit une carte du monde (une image
 *      équirectangulaire de 1024 × 512) fabriquée par du bruit procédural :
 *      continents, bandes de nuages, cratères, calottes polaires. C'est le
 *      calcul le plus lourd ; il n'a lieu qu'une fois par astre, et le
 *      résultat reste en mémoire.
 *
 *   2. PROJETER — pour un rayon et une inclinaison donnés, on calcule une
 *      fois pour toutes, pour chaque pixel du disque, la ligne de la carte à
 *      lire, la colonne de départ, et l'éclairage reçu. C'est la « table ».
 *
 *   3. TOURNER — faire tourner la planète ne coûte alors qu'un décalage de
 *      colonne : on relit la table et on recopie les couleurs. Soixante fois
 *      par seconde, sans jamais refaire de trigonométrie.
 *
 * Les anneaux, les lunes et les halos sont dessinés par-dessus en vectoriel.
 */
(function (global) {
  'use strict';

  var PL = global.PLANETES;
  if (!PL || !PL.bodies) return;

  /* ══════════════════════════════════════════════════════════════
     1. BRUIT PROCÉDURAL
     Un bruit de valeur en trois dimensions : on l'échantillonne sur la
     sphère unité plutôt que sur le rectangle de la carte, ce qui évite
     à la fois la couture au méridien 180° et l'étirement aux pôles.
     ══════════════════════════════════════════════════════════════ */

  var SEED = 1337;

  /* Le brassage se fait avec Math.imul : une multiplication d'entiers 32 bits
     qui déborde proprement. Écrite avec l'opérateur *, elle passerait par des
     flottants, perdrait ses bits de poids faible et rendrait presque toujours
     la même valeur — un bruit tout plat. */
  function hashi(i, j, k) {
    var n = (Math.imul(i, 1619) + Math.imul(j, 31337) + Math.imul(k, 6971) + Math.imul(SEED, 1013)) | 0;
    n = (n << 13) ^ n;
    n = (Math.imul(n, Math.imul(Math.imul(n, n), 15731) + 789221) + 1376312589) | 0;
    return (n & 0x7fffffff) / 1073741824 - 1;   /* −1 … 1 */
  }

  function noise3(x, y, z) {
    var ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    var fx = x - ix, fy = y - iy, fz = z - iz;
    /* Lissage en 3t² − 2t³ : les raccords entre cellules deviennent invisibles. */
    var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);

    var c000 = hashi(ix, iy, iz),         c100 = hashi(ix + 1, iy, iz);
    var c010 = hashi(ix, iy + 1, iz),     c110 = hashi(ix + 1, iy + 1, iz);
    var c001 = hashi(ix, iy, iz + 1),     c101 = hashi(ix + 1, iy, iz + 1);
    var c011 = hashi(ix, iy + 1, iz + 1), c111 = hashi(ix + 1, iy + 1, iz + 1);

    var x00 = c000 + (c100 - c000) * ux, x10 = c010 + (c110 - c010) * ux;
    var x01 = c001 + (c101 - c001) * ux, x11 = c011 + (c111 - c011) * ux;
    var y0 = x00 + (x10 - x00) * uy, y1 = x01 + (x11 - x01) * uy;
    return y0 + (y1 - y0) * uz;
  }

  /** Bruit fractal : plusieurs octaves de plus en plus fines. Rend 0 → 1. */
  function fbm(x, y, z, oct) {
    var v = 0, a = 0.5, f = 1, tot = 0;
    for (var i = 0; i < oct; i++) {
      v += a * noise3(x * f, y * f, z * f);
      tot += a; a *= 0.5; f *= 2;
    }
    return v / tot * 0.5 + 0.5;
  }

  /** Bruit « en crêtes » : donne des chaînes de montagnes plutôt que des bosses. */
  function ridged(x, y, z, oct) {
    var v = 0, a = 0.5, f = 1, tot = 0;
    for (var i = 0; i < oct; i++) {
      v += a * (1 - Math.abs(noise3(x * f, y * f, z * f)));
      tot += a; a *= 0.5; f *= 2;
    }
    return v / tot;
  }

  /* Tirage pseudo-aléatoire reproductible : les cratères tombent toujours
     au même endroit, d'une visite à l'autre. */
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), 1 | t);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function smooth(e0, e1, x) {
    var t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  }
  /** Mélange de deux couleurs [r,g,b] données en 0-255. */
  function mixc(c1, c2, t, out) {
    out[0] = c1[0] + (c2[0] - c1[0]) * t;
    out[1] = c1[1] + (c2[1] - c1[1]) * t;
    out[2] = c1[2] + (c2[2] - c1[2]) * t;
    return out;
  }
  function hex(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }

  /* ══════════════════════════════════════════════════════════════
     2. LA CARTE DU MONDE
     Trois tableaux de la taille de la carte :
       col   la couleur (0xAABBGGRR, l'ordre attendu par ImageData)
       mask  bit 1 = de l'eau (reflets), bit 2 = des lumières de ville
       hgt   le relief, qui sert à ombrer la couleur avant de la ranger
     ══════════════════════════════════════════════════════════════ */

  var TEX_W = 1024, TEX_H = 512;

  /**
   * Creuse un cratère dans le champ de relief : un fond déprimé, un
   * bourrelet sur le pourtour. On ne parcourt que la boîte englobante.
   */
  function crater(hgt, latC, lonC, rad, depth) {
    var cy = Math.cos(latC), sy = Math.sin(latC);
    var vx = cy * Math.sin(lonC), vy = sy, vz = cy * Math.cos(lonC);

    var dy = Math.ceil(rad / Math.PI * TEX_H) + 2;
    var y0 = Math.max(0, Math.floor((0.5 - latC / Math.PI) * TEX_H) - dy);
    var y1 = Math.min(TEX_H - 1, Math.floor((0.5 - latC / Math.PI) * TEX_H) + dy);

    for (var y = y0; y <= y1; y++) {
      var lat = (0.5 - (y + 0.5) / TEX_H) * Math.PI;
      var cl = Math.cos(lat), sl = Math.sin(lat);
      /* Près des pôles, une même distance angulaire couvre beaucoup plus de
         colonnes : la largeur de la boîte s'élargit d'autant. */
      var span = rad / Math.max(0.06, cl);
      var dx = span > Math.PI ? TEX_W : Math.ceil(span / (2 * Math.PI) * TEX_W) + 2;
      var xc = Math.floor((lonC / (2 * Math.PI) + 0.5) * TEX_W);

      for (var k = -dx; k <= dx; k++) {
        var x = ((xc + k) % TEX_W + TEX_W) % TEX_W;
        var lon = ((x + 0.5) / TEX_W - 0.5) * 2 * Math.PI;
        var d = Math.acos(clamp(cl * Math.sin(lon) * vx + sl * vy + cl * Math.cos(lon) * vz, -1, 1)) / rad;
        if (d >= 1.25) continue;
        var i = y * TEX_W + x;
        if (d < 0.82) hgt[i] -= depth * (0.82 - d) * 1.2;                 /* le fond */
        hgt[i] += depth * 1.1 * Math.exp(-Math.pow((d - 0.9) / 0.2, 2));  /* le bourrelet */
      }
    }
  }

  /** Distance angulaire entre un texel et un point donné (lat, lon). */
  function angDist(lat, lon, latC, lonC) {
    var d = Math.sin(lat) * Math.sin(latC) +
            Math.cos(lat) * Math.cos(latC) * Math.cos(lon - lonC);
    return Math.acos(clamp(d, -1, 1));
  }

  /* ── Palettes ── */
  var P = {
      oceanDeep: hex('#071d3d'), oceanShallow: hex('#1a6ea8'), sand: hex('#c9b177'),
      grass: hex('#2f6b34'), forest: hex('#1d4a26'), dry: hex('#a8894e'),
      rock: hex('#6b5b4a'), snow: hex('#f2f6fa'), ice: hex('#dbe9f2'),
      moonLo: hex('#4c4842'), moonHi: hex('#c3bcae'), maria: hex('#3a3833'),
      mercLo: hex('#5c574f'), mercHi: hex('#b0a99c'),
      marsLo: hex('#7d3f22'), marsHi: hex('#d98a52'), marsDark: hex('#5e3b2c'),
      venusLo: hex('#c2954c'), venusHi: hex('#f7e6bb'),
      jupZone: hex('#efdcbd'), jupBelt: hex('#a4703f'), jupPole: hex('#8c8079'), jupSpot: hex('#c2543a'),
      satZone: hex('#f4e3bb'), satBelt: hex('#cfa971'), satPole: hex('#9a8f80'),
      uraLo: hex('#6fc3cc'), uraHi: hex('#b6ecef'),
      nepLo: hex('#22429c'), nepHi: hex('#5f8ee8'), nepSpot: hex('#152c66'),
      pluLo: hex('#6d4a37'), pluHi: hex('#e2cbab'), pluHeart: hex('#f5ecd8'),
    sunLo: hex('#e0620d'), sunHi: hex('#fff3c0')
  };

  var out = [0, 0, 0];        /* tampon de couleur, réutilisé à chaque texel */

  /**
   * Ouvre un chantier de peinture : les tableaux, puis le relief — cratères
   * compris. La couleur, elle, se pose ensuite par tranches de lignes, pour
   * qu'une carte de un demi-million de texels ne fige pas la page.
   */
  function beginPaint(body) {
    var W = TEX_W, H = TEX_H, N = W * H;
    var col = new Uint32Array(N);
    var mask = new Uint8Array(N);
    var hgt = new Float32Array(N);
    var kind = body.render.paint;
    var rand = rng(body.id.length * 7919 + body.diamKm);

    /* ── Étape 1 : le relief (seulement pour les mondes solides) ── */
    var solid = (kind === 'mercure' || kind === 'lune' || kind === 'mars' ||
                 kind === 'terre' || kind === 'pluton');

    if (kind === 'mercure') {
      for (var n = 0; n < 300; n++) {
        crater(hgt, Math.asin(rand() * 2 - 1), (rand() - 0.5) * 2 * Math.PI,
               0.012 + Math.pow(rand(), 3) * 0.14, 0.5 + rand() * 0.5);
      }
    } else if (kind === 'lune') {
      for (var n2 = 0; n2 < 340; n2++) {
        crater(hgt, Math.asin(rand() * 2 - 1), (rand() - 0.5) * 2 * Math.PI,
               0.010 + Math.pow(rand(), 3.2) * 0.16, 0.5 + rand() * 0.6);
      }
    } else if (kind === 'mars') {
      for (var n3 = 0; n3 < 170; n3++) {
        crater(hgt, Math.asin(rand() * 2 - 1) * 0.85, (rand() - 0.5) * 2 * Math.PI,
               0.010 + Math.pow(rand(), 3) * 0.11, 0.4 + rand() * 0.5);
      }
    } else if (kind === 'pluton') {
      for (var n4 = 0; n4 < 90; n4++) {
        crater(hgt, Math.asin(rand() * 2 - 1), (rand() - 0.5) * 2 * Math.PI,
               0.012 + Math.pow(rand(), 3) * 0.10, 0.35 + rand() * 0.4);
      }
    }

    return { id: body.id, kind: kind, solid: solid, col: col, mask: mask, hgt: hgt, y: 0 };
  }

  /**
   * Étape 2 : la couleur, texel par texel, sur au plus `rows` lignes.
   * Rend true quand la carte est finie.
   */
  function paintRows(job, rows) {
    var W = TEX_W, H = TEX_H;
    var col = job.col, mask = job.mask, hgt = job.hgt;
    var kind = job.kind, solid = job.solid;
    var yEnd = Math.min(H, job.y + rows);

    for (var y = job.y; y < yEnd; y++) {
      var i = y * W;
      var lat = (0.5 - (y + 0.5) / H) * Math.PI;
      var cl = Math.cos(lat), sl = Math.sin(lat);
      var alat = Math.abs(lat);

      for (var x = 0; x < W; x++, i++) {
        var lon = ((x + 0.5) / W - 0.5) * 2 * Math.PI;
        var px = cl * Math.sin(lon), py = sl, pz = cl * Math.cos(lon);
        var relief = 0, water = 0, lights = 0;

        switch (kind) {

          /* ── Le Soleil : granulation serrée, taches sombres ── */
          case 'sun': {
            var gran = fbm(px * 26, py * 26, pz * 26, 3);
            var cell = fbm(px * 9 + 40, py * 9, pz * 9, 3);
            var t = clamp(gran * 0.62 + cell * 0.5, 0, 1);
            var spot = fbm(px * 5.4 + 90, py * 5.4, pz * 5.4, 3);
            mixc(P.sunLo, P.sunHi, Math.pow(t, 1.25), out);
            /* Les taches : un cœur sombre, cerné d'une pénombre plus claire.
               Elles restent petites — quelques-unes seulement par hémisphère. */
            if (spot > 0.735) {
              var pen = smooth(0.735, 0.775, spot);
              out[0] *= 1 - pen * 0.34; out[1] *= 1 - pen * 0.45; out[2] *= 1 - pen * 0.55;
              var core = smooth(0.775, 0.80, spot);
              out[0] *= 1 - core * 0.55; out[1] *= 1 - core * 0.68; out[2] *= 1 - core * 0.72;
            } else if (spot > 0.68) {                /* une plage, plus brillante */
              mixc(out, P.sunHi, smooth(0.68, 0.735, spot) * 0.3, out);
            }
            break;
          }

          /* ── Mercure : gris chaud, criblé ── */
          case 'mercure': {
            var m = fbm(px * 3.4, py * 3.4, pz * 3.4, 4);
            var h = hgt[i];
            mixc(P.mercLo, P.mercHi, clamp(m * 0.85 + 0.1 + h * 0.12, 0, 1), out);
            /* Un grand bassin d'impact clair, comme Caloris. */
            var db = angDist(lat, lon, 0.52, -1.1);
            if (db < 0.42) mixc(out, P.mercHi, smooth(0.42, 0.18, db) * 0.35, out);
            relief = 1;
            break;
          }

          /* ── La Lune : hautes terres claires, mers de basalte ── */
          case 'lune': {
            var mm = fbm(px * 1.5 + 12, py * 1.5, pz * 1.5, 3);
            var gr = fbm(px * 6, py * 6, pz * 6, 3);
            /* Les mers sont des coulées de basalte : leur bord s'estompe sur
               une centaine de kilomètres, il ne se découpe pas au ciseau. */
            var sea = smooth(0.535, 0.60, mm) * smooth(-0.95, -0.65, lat);
            mixc(P.moonLo, P.moonHi, clamp(gr * 0.9, 0, 1), out);
            mixc(out, P.maria, sea * 0.88, out);
            /* Les rayons clairs jetés par les jeunes cratères. */
            var dr = angDist(lat, lon, -0.75, -0.28);
            if (dr > 0.12 && dr < 1.1) {
              var ray = fbm(px * 22, py * 22, pz * 22, 2);
              var strength = (1 - dr / 1.1) * smooth(0.52, 0.72, ray) * 0.5;
              mixc(out, P.snow, strength, out);
            }
            relief = 1;
            break;
          }

          /* ── Vénus : voiles de soufre, tout en tourbillons ── */
          case 'venus': {
            var warp = fbm(px * 1.9 + 5, py * 1.9, pz * 1.9, 3);
            var band = Math.sin(lat * 9 + warp * 6) * 0.5 + 0.5;
            var swirl = fbm(px * 4.2 + warp * 3, py * 4.2, pz * 4.2 + warp * 3, 4);
            var v = clamp(band * 0.35 + swirl * 0.75, 0, 1);
            mixc(P.venusLo, P.venusHi, Math.pow(v, 1.1), out);
            break;
          }

          /* ── La Terre : océans, continents, déserts, banquises, nuages ── */
          case 'terre': {
            var wx = fbm(px * 1.1 + 30, py * 1.1, pz * 1.1, 3) - 0.5;
            var cont = fbm(px * 1.75 + wx * 1.4, py * 1.75 + wx, pz * 1.75 - wx * 1.4, 5);
            var mount = ridged(px * 4.4, py * 4.4, pz * 4.4, 3);
            var moist = fbm(px * 2.4 + 70, py * 2.4, pz * 2.4, 3);
            var land = cont - 0.505;

            if (land <= 0) {                                    /* l'océan */
              mixc(P.oceanDeep, P.oceanShallow, smooth(-0.16, 0, land), out);
              water = 1;
            } else {                                            /* les terres */
              var elev = land * 2.6 + mount * 0.5 - 0.2;
              if (land < 0.009) {
                mixc(P.sand, P.grass, smooth(0, 0.009, land), out);
                /* Le trait de côte se fond sur deux ou trois texels : sans cela,
                   le rivage monte en marches d'escalier quand on zoome. */
                if (land < 0.0035) mixc(P.oceanShallow, out, smooth(0, 0.0035, land), out);
              } else if (alat > 1.16 || (alat > 1.02 && elev > 0.25)) {
                mixc(P.ice, P.snow, clamp(moist, 0, 1), out);    /* calottes */
              } else if (alat > 0.31 && alat < 0.56 && moist < 0.52) {
                mixc(P.dry, P.sand, smooth(0.3, 0.52, moist), out);  /* déserts chauds */
              } else {
                mixc(P.forest, P.grass, clamp(moist * 1.2, 0, 1), out);
                if (moist < 0.42) mixc(out, P.dry, smooth(0.42, 0.26, moist) * 0.8, out);
                /* Les lumières de la nuit sont semées, pas étalées : sans ce
                   tirage texel par texel, le côté obscur s'ourle d'une bande
                   dorée continue au lieu d'un semis de villes. */
                lights = (moist > 0.44 && moist < 0.78 && alat < 1.02 &&
                          hashi(x, y, 11) > 0.34) ? 1 : 0;
              }
              if (elev > 0.34) {                                 /* la montagne */
                mixc(out, P.rock, smooth(0.34, 0.55, elev), out);
                if (elev > 0.52) mixc(out, P.snow, smooth(0.52, 0.68, elev), out);
              }
              hgt[i] = elev * 0.5;
            }
            /* La banquise polaire par-dessus l'eau. */
            if (alat > 1.28) {
              var pol = smooth(1.28, 1.4, alat) * (0.6 + 0.4 * fbm(px * 8, py * 8, pz * 8, 2));
              mixc(out, P.snow, clamp(pol, 0, 1), out);
              water = 0; lights = 0;
            }
            /* Les nuages, cuits dans la carte : ils tournent avec le globe. */
            var cw = fbm(px * 2.2 + 200, py * 2.2, pz * 2.2, 3) - 0.5;
            var cloud = fbm(px * 3.4 + cw * 2.4 + 120, py * 3.4 + cw, pz * 3.4 + cw * 2.4, 4);
            var lift = 0.55 + 0.16 * Math.cos(lat * 6);           /* bandes nuageuses */
            var ca = smooth(lift, lift + 0.16, cloud) * 0.92;
            if (ca > 0.01) {
              mixc(out, P.snow, ca, out);
              water *= (1 - ca) > 0.6 ? 1 : 0;
              lights *= (1 - ca) > 0.6 ? 1 : 0;
              relief = 0;
            } else { relief = 0.5; }
            break;
          }

          /* ── Mars : rouille, terrains sombres, calottes, canyon, volcan ── */
          case 'mars': {
            var mr = fbm(px * 2.9, py * 2.9, pz * 2.9, 4);
            var albedo = fbm(px * 1.35 + 15, py * 1.35, pz * 1.35, 3);
            mixc(P.marsLo, P.marsHi, clamp(mr * 0.9 + 0.08, 0, 1), out);
            if (albedo < 0.44) mixc(out, P.marsDark, smooth(0.44, 0.3, albedo) * 0.85, out);

            /* Valles Marineris : une entaille de 4 000 km qui serpente sous
               l'équateur, large au milieu et effilée aux deux bouts. */
            var wob = fbm(px * 5 + 44, py * 5, pz * 5, 3) - 0.5;
            var vl = -0.16 + wob * 0.11;
            var dvl = Math.abs(lat - vl);
            var vw = 0.05 + 0.055 * Math.sin(smooth(-1.55, 0.62, lon) * Math.PI);
            if (dvl < vw && lon > -1.55 && lon < 0.62) {
              var edge = smooth(vw, 0, dvl);
              mixc(out, P.marsDark, edge * 0.45, out);
              /* Une pente franche mais pas verticale : sinon l'ombrage tranche
                 au noir et le canyon devient un trait de crayon. */
              hgt[i] -= edge * 0.6;
            }
            /* Olympus Mons : un dôme clair, énorme. */
            var dom = angDist(lat, lon, 0.32, -2.05);
            if (dom < 0.19) {
              var b2 = smooth(0.19, 0.02, dom);
              mixc(out, P.marsHi, b2 * 0.45, out);
              hgt[i] += b2 * 1.5;
              if (dom < 0.028) hgt[i] -= 2.2;                    /* la caldeira */
            }
            /* Les calottes de glace carbonique. */
            if (alat > 1.24) {
              var pc = smooth(1.24, 1.36, alat) * (0.65 + 0.35 * fbm(px * 9, py * 9, pz * 9, 2));
              mixc(out, P.snow, clamp(pc, 0, 1), out);
            }
            relief = 1;
            break;
          }

          /* ── Jupiter et Saturne : des bandes, de la turbulence, des taches ── */
          case 'jupiter':
          case 'saturne': {
            var sat = kind === 'saturne';
            var zone = sat ? P.satZone : P.jupZone;
            var belt = sat ? P.satBelt : P.jupBelt;
            var pole = sat ? P.satPole : P.jupPole;

            var tw = fbm(px * 2.6 + 8, py * 5.2, pz * 2.6, 3) - 0.5;   /* étirée en longitude */
            var fine = fbm(px * 7 + 3, py * 16, pz * 7, 3) - 0.5;
            var la = lat + tw * (sat ? 0.05 : 0.075) + fine * 0.02;
            /* Alternance de zones claires et de ceintures sombres. */
            var b = Math.sin(la * (sat ? 13 : 15)) * 0.5 + 0.5;
            b = Math.pow(b, sat ? 1.5 : 1.15);
            mixc(belt, zone, clamp(b * (sat ? 0.9 : 1) + (sat ? 0.1 : 0), 0, 1), out);
            /* Les régions polaires, plus grises. */
            var pf = smooth(0.85, 1.35, alat);
            mixc(out, pole, pf * 0.75, out);
            /* Grains fins dans les bandes. */
            var gg = fine * (sat ? 0.14 : 0.24);
            out[0] = clamp(out[0] * (1 + gg), 0, 255);
            out[1] = clamp(out[1] * (1 + gg), 0, 255);
            out[2] = clamp(out[2] * (1 + gg), 0, 255);

            if (!sat) {
              /* La Grande Tache Rouge : une ellipse tourbillonnante. */
              var dlon = lon - 0.85;
              while (dlon > Math.PI) dlon -= 2 * Math.PI;
              while (dlon < -Math.PI) dlon += 2 * Math.PI;
              var ex = dlon * Math.cos(lat) / 0.42, ey = (lat + 0.36) / 0.15;
              var er = Math.sqrt(ex * ex + ey * ey);
              if (er < 1.35) {
                var swirl2 = fbm(px * 12 + er * 4, py * 12, pz * 12, 3);
                var sIn = smooth(1.35, 0.75, er);
                mixc(out, P.jupSpot, sIn * (0.62 + swirl2 * 0.38), out);
                if (er < 0.45) mixc(out, P.jupSpot, 0.35, out);
              }
              /* Trois ovales blancs, plus au sud. */
              for (var ov = 0; ov < 3; ov++) {
                var olon = -1.9 + ov * 1.15, olat = -0.62;
                var dl2 = lon - olon;
                while (dl2 > Math.PI) dl2 -= 2 * Math.PI;
                while (dl2 < -Math.PI) dl2 += 2 * Math.PI;
                var ox = dl2 * Math.cos(lat) / 0.13, oy = (lat - olat) / 0.06;
                var orr = Math.sqrt(ox * ox + oy * oy);
                if (orr < 1.2) mixc(out, P.snow, smooth(1.2, 0.5, orr) * 0.8, out);
              }
            } else {
              /* L'hexagone polaire nord, esquissé. */
              if (lat > 1.18) {
                var hexn = fbm(px * 14, py * 14, pz * 14, 2);
                mixc(out, P.satPole, smooth(1.18, 1.4, lat) * (0.4 + hexn * 0.3), out);
              }
            }
            break;
          }

          /* ── Uranus : presque lisse, un souffle de bandes ── */
          case 'uranus': {
            var un = fbm(px * 3.4, py * 6.5, pz * 3.4, 3);
            var ub = Math.sin(lat * 11 + (un - 0.5) * 2.2) * 0.5 + 0.5;
            mixc(P.uraLo, P.uraHi, clamp(0.42 + ub * 0.22 + (un - 0.5) * 0.3, 0, 1), out);
            if (alat > 1.0) mixc(out, P.uraHi, smooth(1.0, 1.45, alat) * 0.35, out);
            break;
          }

          /* ── Neptune : bleu profond, cirrus blancs, grande tache sombre ── */
          case 'neptune': {
            var nw = fbm(px * 2.2 + 11, py * 4.4, pz * 2.2, 3) - 0.5;
            var nb = Math.sin(lat * 9 + nw * 3) * 0.5 + 0.5;
            mixc(P.nepLo, P.nepHi, clamp(nb * 0.55 + 0.12, 0, 1), out);
            /* Les traînées de méthane gelé qui filent au-dessus des nuages. */
            var cir = fbm(px * 6 + 60, py * 15, pz * 6, 3);
            if (cir > 0.62) mixc(out, P.snow, smooth(0.62, 0.78, cir) * 0.6, out);
            /* La Grande Tache Sombre. */
            var dln = lon + 1.2;
            while (dln > Math.PI) dln -= 2 * Math.PI;
            while (dln < -Math.PI) dln += 2 * Math.PI;
            var nx = dln * Math.cos(lat) / 0.34, ny = (lat - 0.42) / 0.13;
            var nr = Math.sqrt(nx * nx + ny * ny);
            if (nr < 1.2) mixc(out, P.nepSpot, smooth(1.2, 0.5, nr) * 0.85, out);
            break;
          }

          /* ── Pluton : terres fauves, taches noires, et le cœur ── */
          case 'pluton': {
            var pn = fbm(px * 3.2, py * 3.2, pz * 3.2, 4);
            mixc(P.pluLo, P.pluHi, clamp(pn * 0.95, 0, 1), out);
            /* Cthulhu Macula : la longue région sombre de l'équateur. */
            var dark = fbm(px * 1.6 + 22, py * 1.6, pz * 1.6, 3);
            if (alat < 0.45 && lon < -0.2 && lon > -2.6 && dark > 0.44) {
              mixc(out, P.pluLo, smooth(0.44, 0.6, dark) * smooth(0.45, 0.2, alat) * 0.9, out);
            }
            /* Tombaugh Regio : deux lobes et une pointe — le fameux cœur. */
            /* La courbe du cœur, celle des mathématiciens :
               (x² + y² − 1)³ − x²y³ ≤ 0. Deux lobes et une pointe, d'un trait. */
            var hx = (lon - 1.27) * Math.cos(lat) / 0.52;
            var hy = (lat - 0.04) / 0.40;
            var q = hx * hx + hy * hy - 1;
            var hf = q * q * q - hx * hx * hy * hy * hy;
            var heart = hf < 0 ? 1 : (hf < 0.6 ? 1 - hf / 0.6 : 0);
            if (heart > 0) {
              mixc(out, P.pluHeart, clamp(heart, 0, 1) * 0.95, out);
              hgt[i] *= 1 - heart;                     /* le glacier a effacé les cratères */
            }
            relief = 1;
            break;
          }
        }

        /* ── Étape 3 : l'ombrage du relief, cuit dans la couleur ──
           Une lumière rasante fixe venue du nord-ouest de la carte.
           C'est ce qui fait « exister » les cratères quand on zoome. */
        if (relief > 0 && solid) {
          var xl = (x - 1 + W) % W, xr2 = (x + 1) % W;
          var yu = y > 0 ? y - 1 : y, yd = y < H - 1 ? y + 1 : y;
          var gx = hgt[y * W + xl] - hgt[y * W + xr2];
          var gy = hgt[yu * W + x] - hgt[yd * W + x];
          var sh = clamp(1 + (gx * 0.55 + gy * 0.55) * relief, 0.35, 1.75);
          out[0] *= sh; out[1] *= sh; out[2] *= sh;
        }

        col[i] = 0xff000000 |
                 (clamp(out[2], 0, 255) << 16) |
                 (clamp(out[1], 0, 255) << 8) |
                 clamp(out[0], 0, 255);
        mask[i] = (water ? 1 : 0) | (lights ? 2 : 0);
      }
    }

    job.y = yEnd;
    return yEnd >= H;
  }

  /** Peint une carte d'un seul tenant — pour l'astre qu'on attend, lui. */
  function paintBody(body) {
    var job = beginPaint(body);
    paintRows(job, TEX_H);
    return { col: job.col, mask: job.mask, w: TEX_W, h: TEX_H };
  }

  /* ══════════════════════════════════════════════════════════════
     3. LE MOTEUR
     ══════════════════════════════════════════════════════════════ */

  /* La lumière du Soleil, en coordonnées écran : elle vient d'en haut à
     gauche et légèrement de face. Elle ne bouge jamais — c'est le globe
     qui tourne dessous. */
  var LX = -0.52, LY = 0.34, LZ = 0.78;
  (function () {
    var l = Math.sqrt(LX * LX + LY * LY + LZ * LZ);
    LX /= l; LY /= l; LZ /= l;
  })();
  /* Vecteur médian lumière/observateur, pour le reflet du Soleil sur les mers. */
  var HX = LX, HY = LY, HZ = LZ + 1;
  (function () {
    var l = Math.sqrt(HX * HX + HY * HY + HZ * HZ);
    HX /= l; HY /= l; HZ /= l;
  })();

  var stage   = document.getElementById('plStage');
  var canvas  = document.getElementById('plScene');
  var ctx     = canvas.getContext('2d');
  var wrap    = canvas.parentNode;
  var veil    = document.getElementById('plLoading');

  var sphereCv = document.createElement('canvas');
  var sphereCtx = sphereCv.getContext('2d');
  var sphereImg = null, sphereBuf = null;

  var starCv = document.createElement('canvas');

  var reduceMotion = global.matchMedia &&
                     global.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var view = {
    body: null,
    tex: null,
    spin: 0.6,
    spinning: !reduceMotion,
    tilt: 0.26,
    zoom: 1,
    dpr: 1,
    w: 0, h: 0,          /* taille du canvas en pixels réels */
    time: 0,             /* l'horloge de la page, jamais interrompue */
    clock: 0,            /* celle de la scène : la pause l'arrête */
    interacting: 0,      /* horodatage de la dernière manipulation */
    table: null,
    tableKey: ''
  };

  var texCache = {};
  var pool = {};         /* tampons de la table, réutilisés d'un rayon à l'autre */

  /* ── La table de projection ───────────────────────────────────
     Pour un diamètre S (en pixels) et une inclinaison donnée, on calcule
     une fois pour toutes ce que chaque pixel du disque doit lire dans la
     carte, et la lumière qu'il reçoit. Faire tourner la planète ne coûte
     ensuite qu'un décalage entier de colonne. */
  function buildTable(S, tilt, body) {
    var buf = pool[S];
    var max = S * S;
    if (!buf) {
      /* Les tampons sont lourds (une vingtaine de méga-octets au plus grand
         diamètre) : on n'en garde que quelques-uns, les plus récents. */
      var keys = Object.keys(pool);
      while (keys.length >= 3) { delete pool[keys.shift()]; }
      buf = pool[S] = {
        idx: new Int32Array(max), row: new Int32Array(max), ub: new Int32Array(max),
        sh: new Float32Array(max), sp: new Float32Array(max), rim: new Float32Array(max)
      };
    }
    var idx = buf.idx, row = buf.row, ub = buf.ub, sh = buf.sh, sp = buf.sp, rim = buf.rim;

    var R = S / 2;
    var cosT = Math.cos(tilt), sinT = Math.sin(tilt);
    var emissive = !!body.render.emissive;
    var hasAir = (body.render.atmo || 0) > 0.1;
    var amb = emissive ? 0 : (hasAir ? 0.055 : 0.022);
    var soft = hasAir ? 0.68 : 1;
    var n = 0;

    for (var py = 0; py < S; py++) {
      var v = -((py + 0.5) - R) / R;
      var v2 = v * v;
      var rowBase = py * S;
      for (var px = 0; px < S; px++) {
        var u = ((px + 0.5) - R) / R;
        var d2 = u * u + v2;
        if (d2 >= 1) continue;
        var w = Math.sqrt(1 - d2);

        /* Du repère de l'écran vers celui de la planète : une rotation
           autour de l'axe horizontal, de l'angle dont on la regarde. */
        var by = v * cosT + w * sinT;
        var bz = -v * sinT + w * cosT;
        var lat = Math.asin(by < -1 ? -1 : (by > 1 ? 1 : by));
        var lon = Math.atan2(u, bz);

        var vy = ((0.5 - lat / Math.PI) * TEX_H) | 0;
        if (vy < 0) vy = 0; else if (vy >= TEX_H) vy = TEX_H - 1;
        var vx = ((lon / (2 * Math.PI) + 0.5) * TEX_W) | 0;
        if (vx < 0) vx = 0; else if (vx >= TEX_W) vx = TEX_W - 1;

        var dl = u * LX + v * LY + w * LZ;
        var lit = dl > 0 ? dl : 0;

        idx[n] = rowBase + px;
        row[n] = vy * TEX_W;
        ub[n] = vx;

        if (emissive) {
          /* Une étoile ne connaît pas la nuit : seulement l'assombrissement
             du bord, où l'on voit ses couches plus froides par la tranche. */
          sh[n] = 0.44 + 0.56 * Math.pow(w, 0.5);
          sp[n] = 0;
          rim[n] = Math.pow(1 - w, 1.7) * 1.15;
        } else {
          sh[n] = amb + (1 - amb) * Math.pow(lit, soft);
          var hd = u * HX + v * HY + w * HZ;
          sp[n] = hd > 0 ? Math.pow(hd, 120) : 0;
          rim[n] = hasAir ? Math.pow(1 - w, 3) * (dl + 0.28 > 0 ? dl + 0.28 : 0) *
                            (body.render.atmo || 0) * 1.5 : 0;
        }
        n++;
      }
    }

    return { S: S, n: n, idx: idx, row: row, ub: ub, sh: sh, sp: sp, rim: rim };
  }

  /** Recompose le disque de la planète pour la rotation courante. */
  function drawSphere(tbl) {
    var S = tbl.S;
    if (sphereCv.width !== S) {
      sphereCv.width = sphereCv.height = S;
      sphereImg = sphereCtx.createImageData(S, S);
      sphereBuf = new Uint32Array(sphereImg.data.buffer);
    }
    var img = sphereBuf;
    img.fill(0);

    var tex = view.tex.col, msk = view.tex.mask;
    var idx = tbl.idx, row = tbl.row, ub = tbl.ub, sh = tbl.sh, sp = tbl.sp, rim = tbl.rim;
    var n = tbl.n;

    /* La rotation, ramenée à un décalage de colonnes. */
    var turn = view.spin / (2 * Math.PI);
    turn -= Math.floor(turn);
    var off = (turn * TEX_W) | 0;

    var glow = view.body.render.glow ? hex(view.body.render.glow) : [255, 255, 255];
    var gR = glow[0] * 0.85, gG = glow[1] * 0.85, gB = glow[2] * 0.85;

    for (var i = 0; i < n; i++) {
      var u = ub[i] + off;
      if (u >= TEX_W) u -= TEX_W;
      var ti = row[i] + u;
      var c = tex[ti];
      var s = sh[i];
      var r = (c & 255) * s;
      var g = ((c >> 8) & 255) * s;
      var b = ((c >> 16) & 255) * s;

      var m = msk[ti];
      if (m !== 0) {
        if (m & 1) {                                   /* le Soleil sur la mer */
          var q = sp[i];
          if (q > 0.002) { r += q * 120; g += q * 132; b += q * 140; }
        }
        if ((m & 2) && s < 0.15) {                     /* les villes, côté nuit */
          var e = (0.15 - s) * 6.5;
          r += e * 108; g += e * 78; b += e * 30;
        }
      }
      var rm = rim[i];
      if (rm > 0.002) { r += rm * gR; g += rm * gG; b += rm * gB; }

      img[idx[i]] = 0xff000000 |
                    ((b > 255 ? 255 : b) | 0) << 16 |
                    ((g > 255 ? 255 : g) | 0) << 8 |
                    ((r > 255 ? 255 : r) | 0);
    }
    sphereCtx.putImageData(sphereImg, 0, 0);
  }

  /* ── Les anneaux ──────────────────────────────────────────────
     Des cercles concentriques aplatis par l'inclinaison. La moitié
     lointaine passe derrière le globe, la moitié proche devant : c'est
     ce chevauchement qui donne la profondeur. */
  var RING_TINT = {
    saturne: [232, 216, 180], uranus: [150, 190, 200],
    jupiter: [160, 145, 130], neptune: [150, 165, 200]
  };

  function drawRings(c, R, body, sinT, half) {
    var rings = body.render.rings;
    if (!rings) return;
    var flat = Math.abs(sinT);
    if (flat < 0.012) flat = 0.012;
    var tint = RING_TINT[body.id] || [200, 195, 185];
    var sign = sinT >= 0 ? 1 : -1;

    c.save();
    c.beginPath();
    /* La moitié proche est celle qui, à l'écran, tombe du côté du pôle
       que l'on ne voit pas. */
    if (half === 'front') c.rect(-8 * R, sign > 0 ? 0 : -8 * R, 16 * R, 8 * R);
    else                  c.rect(-8 * R, sign > 0 ? -8 * R : 0, 16 * R, 8 * R);
    c.clip();
    c.scale(1, flat);

    var rin = rings.inner * R, rout = rings.outer * R;
    var grad = c.createRadialGradient(0, 0, rin, 0, 0, rout);
    var span = rout - rin;
    var op = rings.opacity * (half === 'front' ? 1 : 0.72);

    grad.addColorStop(0, 'rgba(0,0,0,0)');
    for (var i = 0; i < rings.bands.length; i++) {
      var bd = rings.bands[i];
      var a0 = clamp((bd[0] * R - rin) / span, 0, 1);
      var a1 = clamp((bd[1] * R - rin) / span, 0, 1);
      var al = bd[2] * op;
      var css = 'rgba(' + tint[0] + ',' + tint[1] + ',' + tint[2] + ',';
      grad.addColorStop(Math.min(a0 + 0.001, 1), css + (al * 0.35) + ')');
      grad.addColorStop(clamp((a0 + a1) / 2, 0, 1), css + al + ')');
      grad.addColorStop(Math.max(a1 - 0.001, 0), css + (al * 0.35) + ')');
      if (i < rings.bands.length - 1) {
        var gap = clamp((rings.bands[i + 1][0] * R - rin) / span - 0.004, 0, 1);
        if (gap > a1) grad.addColorStop(gap, 'rgba(0,0,0,0)');
      }
    }
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    c.fillStyle = grad;
    c.beginPath();
    c.arc(0, 0, rout, 0, Math.PI * 2);
    c.arc(0, 0, rin, 0, Math.PI * 2, true);
    c.fill('evenodd');
    c.restore();
  }

  /* ── Les lunes ────────────────────────────────────────────────
     Elles tournent dans le plan équatorial, donc sur la même ellipse
     que les anneaux, et passent devant puis derrière leur planète. */
  function drawMoons(c, R, body, sinT, cosT, roll, half) {
    var moons = body.render.moons;
    if (!moons || !moons.length) return;
    /* La lumière, ramenée dans le repère incliné du dessin. */
    var lx = LX * Math.cos(-roll) - LY * Math.sin(-roll);
    var ly = LX * Math.sin(-roll) + LY * Math.cos(-roll);

    for (var i = 0; i < moons.length; i++) {
      var m = moons[i];
      var a = view.clock * (0.42 / Math.pow(m.r, 1.5)) + i * 2.4;
      var ca = Math.cos(a);
      var x = m.r * R * Math.sin(a);
      var y = m.r * R * sinT * ca;
      var front = ca * cosT > 0;
      if ((half === 'front') !== front) continue;

      var rad = Math.max(1.6, m.s * R);
      var g = c.createRadialGradient(x - rad * lx * 0.5, y + rad * ly * 0.5, rad * 0.1, x, y, rad);
      g.addColorStop(0, m.c);
      g.addColorStop(0.62, m.c);
      g.addColorStop(1, '#0a0a12');
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, rad, 0, Math.PI * 2);
      c.fill();

      if (R > 92 && half === 'front') {
        c.save();
        c.translate(x, y + rad + 13);
        c.rotate(-roll);                 /* le nom reste horizontal à l'écran */
        c.fillStyle = 'rgba(244,239,228,.5)';
        c.font = '500 11px Outfit, system-ui, sans-serif';
        c.textAlign = 'center';
        c.fillText(m.n, 0, 0);
        c.restore();
      }
    }
  }

  /* ── Le champ d'étoiles ──────────────────────────────────────── */
  function buildStars(w, h, dpr) {
    starCv.width = w; starCv.height = h;
    var c = starCv.getContext('2d');
    var rand = rng(20260818);

    /* Un souffle de Voie lactée, en diagonale. */
    var band = c.createLinearGradient(0, h, w, 0);
    band.addColorStop(0, 'rgba(90,120,200,0)');
    band.addColorStop(0.45, 'rgba(120,140,220,.05)');
    band.addColorStop(0.6, 'rgba(160,150,220,.07)');
    band.addColorStop(1, 'rgba(90,120,200,0)');
    c.fillStyle = band;
    c.fillRect(0, 0, w, h);

    var count = Math.round((w * h) / (2600 * dpr));
    for (var i = 0; i < count; i++) {
      var x = rand() * w, y = rand() * h;
      var r = (0.35 + Math.pow(rand(), 3) * 1.7) * dpr;
      var a = 0.25 + rand() * 0.65;
      var tone = rand();
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fillStyle = tone > 0.9 ? 'rgba(255,214,150,' + a + ')'
                  : tone > 0.8 ? 'rgba(180,210,255,' + a + ')'
                               : 'rgba(255,255,255,' + a + ')';
      c.fill();
      if (r > 1.6 * dpr) {                     /* les plus vives scintillent en croix */
        c.strokeStyle = 'rgba(255,255,255,' + (a * 0.24) + ')';
        c.lineWidth = dpr * 0.7;
        c.beginPath();
        c.moveTo(x - r * 3, y); c.lineTo(x + r * 3, y);
        c.moveTo(x, y - r * 3); c.lineTo(x, y + r * 3);
        c.stroke();
      }
    }
  }

  /* ── La composition d'une image ──────────────────────────────── */
  function frame(dt) {
    var w = view.w, h = view.h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(starCv, 0, 0);

    if (!view.tex || !view.body) return;

    var body = view.body;
    var baseR = Math.min(w, h) * 0.34;
    var R = baseR * view.zoom;                       /* rayon à l'écran */

    /* Le disque est calculé à taille réduite quand on le manipule : on
       reste fluide pendant le geste, on retrouve le détail au repos. */
    var maxS = global.innerWidth < 760 ? 560 : 920;
    var busy = (view.time - view.interacting) < 0.18;
    var S = Math.min(R * 2, busy ? Math.min(maxS, 400) : maxS);
    /* Arrondi au multiple de 32 : quelques diamètres possibles seulement,
       donc peu de tables à recalculer et peu de tampons à garder. */
    S = Math.max(64, Math.round(S / 32) * 32);

    var key = S + '|' + view.tilt.toFixed(3) + '|' + body.id;
    if (key !== view.tableKey) {
      view.table = buildTable(S, view.tilt, body);
      view.tableKey = key;
    }
    drawSphere(view.table);

    var cx = w / 2, cy = h / 2;
    var sinT = Math.sin(view.tilt), cosT = Math.cos(view.tilt);
    var roll = (body.render.axial || 0) * Math.PI / 180;

    ctx.save();
    ctx.translate(cx, cy);

    /* Le halo, posé derrière : couronne du Soleil ou atmosphère vue de loin. */
    var atmo = body.render.atmo || 0;
    if (atmo > 0) {
      var gl = body.render.glow || '#ffffff';
      var rgb = hex(gl);
      var outer = body.render.emissive ? 3.1 : 1.42;
      var halo = ctx.createRadialGradient(0, 0, R * 0.92, 0, 0, R * outer);
      halo.addColorStop(0, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' +
                           (body.render.emissive ? 0.5 : 0.26 * atmo) + ')');
      halo.addColorStop(0.35, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' +
                           (body.render.emissive ? 0.14 : 0.07 * atmo) + ')');
      halo.addColorStop(1, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, R * outer, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.rotate(roll);
    drawMoons(ctx, R, body, sinT, cosT, roll, 'back');
    drawRings(ctx, R, body, sinT, 'back');

    ctx.drawImage(sphereCv, -R, -R, R * 2, R * 2);

    drawRings(ctx, R, body, sinT, 'front');
    drawMoons(ctx, R, body, sinT, cosT, roll, 'front');
    ctx.restore();

    /* En pause, tout s'immobilise — le globe comme ses lunes. */
    if (view.spinning) {
      view.clock += dt;
      view.spin += (body.render.spin || 1) * 0.14 * dt;
      if (view.spin > 1e6) view.spin -= 1e6;
    }
  }

  /* ══════════════════════════════════════════════════════════════
     4. LA FICHE
     ══════════════════════════════════════════════════════════════ */

  var $ = function (id) { return document.getElementById(id); };
  var EARTH = PL.byId('terre');

  /* L'astre choisi. Distinct de view.body, qui n'est remplacé qu'une fois la
     carte peinte : la fiche, elle, s'affiche tout de suite. */
  var current = null;

  function nf(v, dec) {
    return v.toLocaleString('fr-FR', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
  }

  /** Une durée en heures, dite comme on la dirait à voix haute. */
  function humanTime(hours) {
    var sec = hours * 3600;
    if (sec < 60) return nf(sec, sec < 10 ? 1 : 0) + (sec < 2 ? ' seconde' : ' secondes');
    if (hours < 1) return Math.round(hours * 60) + ' minutes';
    if (hours < 72) return nf(hours, hours < 10 ? 1 : 0) + (hours < 2 ? ' heure' : ' heures');
    var days = hours / 24;
    if (days < 400) return nf(days, 0) + (days < 2 ? ' jour' : ' jours');
    var years = days / 365.25;
    if (years < 10) return nf(years, 1) + (years < 2 ? ' an' : ' ans');
    return nf(years, 0) + ' ans';
  }

  function fillStats(b) {
    var host = $('plStats');
    host.innerHTML = '';
    Object.keys(b.stats).forEach(function (k) {
      var row = b.stats[k];
      var el = document.createElement('div');
      el.className = 'pl-stat';
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
  }

  function fillFacts(b) {
    var host = $('plFacts');
    host.innerHTML = '';
    b.facts.forEach(function (f) {
      var el = document.createElement('div');
      el.className = 'pl-fact';
      el.innerHTML = '<i></i><p style="margin:0"></p>';
      el.firstChild.textContent = f.e;
      el.lastChild.textContent = f.t;
      host.appendChild(el);
    });
  }

  function fillMoons(b) {
    var host = $('plMoons');
    host.innerHTML = '';
    b.moons.forEach(function (m) {
      var el = document.createElement('div');
      el.className = 'pl-moon';
      el.innerHTML = '<b></b> ';
      el.firstChild.textContent = m.n;
      el.appendChild(document.createTextNode('— ' + m.d));
      host.appendChild(el);
    });
    host.hidden = b.moons.length === 0;
    $('plMoonNote').textContent = b.moonNote;
  }

  function fillGas(b) {
    var host = $('plGas');
    host.innerHTML = '';
    b.gases.forEach(function (g) {
      var el = document.createElement('div');
      el.className = 'pl-gas-row';
      var top = document.createElement('div');
      top.className = 'pl-gas-top';
      var nm = document.createElement('b'); nm.textContent = g.n;
      var pc = document.createElement('span'); pc.textContent = nf(g.p, g.p < 10 && g.p % 1 ? 1 : 0) + ' %';
      top.appendChild(nm); top.appendChild(pc);
      var bar = document.createElement('div');
      bar.className = 'pl-gas-bar';
      var fill = document.createElement('i');
      fill.style.width = Math.max(1.5, g.p) + '%';
      fill.style.setProperty('--gas', g.c);
      bar.appendChild(fill);
      el.appendChild(top); el.appendChild(bar);
      host.appendChild(el);
    });
    host.hidden = b.gases.length === 0;
    $('plGasNote').textContent = b.gasNote;
  }

  function fillCompare(b) {
    var host = $('plCompare');
    host.innerHTML = '';
    var big = Math.max(b.diamKm, EARTH.diamKm);
    var scale = 132 / big;

    function ball(body, label) {
      var d = Math.max(4, body.diamKm * scale);
      var fig = document.createElement('figure');
      var el = document.createElement('div');
      el.className = 'ball';
      el.style.width = el.style.height = d + 'px';
      el.style.setProperty('--co', body.color);
      el.style.setProperty('--hi', body.hi);
      var cap = document.createElement('figcaption');
      cap.innerHTML = '<b></b>';
      cap.firstChild.textContent = label;
      cap.appendChild(document.createTextNode(nf(body.diamKm) + ' km'));
      fig.appendChild(el); fig.appendChild(cap);
      return fig;
    }

    if (b.id === 'terre') {
      host.appendChild(ball(EARTH, 'La Terre'));
      $('plCompareNote').textContent =
        'C\'est elle, l\'étalon : toutes les autres tailles de cette page se comparent à ces 12 742 kilomètres.';
      return;
    }
    host.appendChild(ball(b, b.name));
    host.appendChild(ball(EARTH, 'La Terre'));

    var ratio = b.diamKm / EARTH.diamKm;
    $('plCompareNote').textContent = ratio > 1
      ? b.name + ' est ' + nf(ratio, ratio < 10 ? 1 : 0) + ' fois plus large que la Terre — il en faudrait ' +
        nf(Math.round(Math.pow(ratio, 3))) + ' pour la remplir.'
      : b.name + ' est ' + nf(1 / ratio, 1) + ' fois plus petite que la Terre.';
  }

  /** Les grands nombres se disent en millions et en milliards, pas en chiffres. */
  function bigKm(km) {
    if (km >= 1e9) return nf(km / 1e9, 1) + (km < 2e9 ? ' milliard' : ' milliards') + ' de km';
    if (km >= 1e6) return nf(km / 1e6, km < 1e7 ? 1 : 0) + ' millions de km';
    return nf(Math.round(km / 100) * 100) + ' km';
  }

  function fillTrip(b) {
    var host = $('plTrip');
    host.innerHTML = '';

    function row(label, value) {
      var el = document.createElement('div');
      el.className = 'pl-trip-row';
      var s = document.createElement('span'); s.textContent = label;
      var v = document.createElement('b'); v.textContent = value;
      el.appendChild(s); el.appendChild(v);
      host.appendChild(el);
    }

    if (b.id === 'terre') {
      row('Distance', 'tu y es');
      row('La lumière du Soleil met', '8 min 20 s pour t\'atteindre');
      row('Tu voyages, sans rien sentir', '107 000 km/h autour du Soleil');
      return;
    }
    row('Distance, au plus près', bigKm(b.tripKm));
    row('À la vitesse de la lumière', humanTime(b.tripKm / PL.speeds.lumiere));
    row('En sonde spatiale (58 000 km/h)', humanTime(b.tripKm / PL.speeds.fusee));
    row('En avion de ligne (900 km/h)', humanTime(b.tripKm / PL.speeds.avion));
  }

  function updateYou() {
    var b = current;
    if (!b) return;
    var kg = parseFloat($('plMass').value);
    var yrs = parseFloat($('plAge').value);

    if (isFinite(kg) && kg > 0) {
      var w = kg * b.gravity / EARTH.gravity;
      var pct = b.gravity / EARTH.gravity;
      $('plWeight').innerHTML = '';
      $('plWeight').appendChild(document.createTextNode(nf(w, w < 10 ? 1 : 0) + ' kg'));
      var s = document.createElement('small');
      s.textContent = b.id === 'terre'
        ? 'ton poids d\'ici, forcément'
        : (pct < 1 ? 'soit ' + Math.round(pct * 100) + ' % de ton poids d\'ici : tu bondirais à chaque pas'
                   : 'soit ' + nf(pct, 1) + ' fois ton poids d\'ici : chaque pas te coûterait');
      $('plWeight').appendChild(s);
    }

    if (!b.yearDays) {
      $('plAgeOut').innerHTML = '<small>Le Soleil ne tourne autour de rien : il n\'a pas d\'années à lui.</small>';
      return;
    }
    if (isFinite(yrs) && yrs > 0) {
      var local = yrs * 365.25 / b.yearDays;
      $('plAgeOut').innerHTML = '';
      var txt, sub;
      if (local >= 1) {
        txt = nf(local, local < 10 ? 1 : 0) + (local < 2 ? ' an' : ' ans');
        sub = 'en années de ' + b.name.replace(/^(Le |La |L')/, '') +
              ' (une y dure ' + nf(b.yearDays / 365.25, b.yearDays > 3650 ? 0 : 2) + ' de nos années)';
      } else {
        txt = 'pas encore 1 an';
        sub = 'il te faudrait ' + nf(b.yearDays / 365.25, 1) + ' de nos années pour y fêter ton premier anniversaire';
      }
      $('plAgeOut').appendChild(document.createTextNode(txt));
      var s2 = document.createElement('small');
      s2.textContent = sub;
      $('plAgeOut').appendChild(s2);
    }
  }

  function fillSheet(b) {
    current = b;
    canvas.setAttribute('aria-label', b.name + ', ' + b.kind.toLowerCase() +
      ', vue de l\'espace. Sa description complète est donnée juste en dessous.');
    $('plName').textContent = b.name;
    $('plKind').textContent = b.kind;
    $('plCardTitle').textContent = b.name + ' — carte d\'identité';
    $('plTagline').textContent = b.tagline;
    fillStats(b); fillFacts(b); fillMoons(b); fillGas(b); fillCompare(b); fillTrip(b);
    updateYou();
  }

  /* ══════════════════════════════════════════════════════════════
     5. LE QUAI DES ASTRES
     ══════════════════════════════════════════════════════════════ */

  var dockButtons = {};

  function buildDock() {
    var host = $('plDock');
    PL.bodies.forEach(function (b) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.style.setProperty('--dot', b.color);
      btn.style.setProperty('--dot-hi', b.hi);
      var dot = document.createElement('span');
      dot.className = 'pl-dot';
      dot.style.setProperty('--dot', b.color);
      dot.style.setProperty('--dot-hi', b.hi);
      btn.appendChild(dot);
      btn.appendChild(document.createTextNode(b.name));
      btn.addEventListener('click', function () { select(b.id, true); });
      host.appendChild(btn);
      dockButtons[b.id] = btn;
    });
  }

  /** Ouvre un astre : peint sa carte si c'est la première visite. */
  function select(id, remember) {
    var b = PL.byId(id);
    if (!b || (view.body && view.body.id === id)) return;

    Object.keys(dockButtons).forEach(function (k) {
      var on = k === id;
      dockButtons[k].classList.toggle('is-on', on);
      dockButtons[k].setAttribute('aria-selected', on ? 'true' : 'false');
    });
    fillSheet(b);
    markMap(id);

    if (remember) {
      try { localStorage.setItem('grenier.planetes', id); } catch (e) {}
      if (global.history && history.replaceState) history.replaceState(null, '', '#' + id);
      dockButtons[id].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }

    var apply = function () {
      view.body = b;
      view.tex = texCache[id];
      view.tableKey = '';
      view.spin = 0.6;
      veil.classList.remove('is-on');
    };

    if (texCache[id]) { apply(); return; }
    veil.classList.add('is-on');
    prepaint.stop = true;
    /* Deux images d'attente : le voile doit être visible avant que le fil
       principal ne parte peindre le million de pixels de la carte. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        texCache[id] = paintBody(b);
        apply();
        prepaint.stop = false;
        prepaint();
      });
    });
  }

  /* ── Peinture d'avance ────────────────────────────────────────
     Une carte demande une demi-seconde de calcul. Plutôt que de la faire
     attendre à chaque clic, on peint les astres suivants pendant que le
     visiteur lit la fiche — un à la fois, et seulement quand plus rien ne
     bouge, pour que la rotation ne saccade pas. */
  function prepaint() {
    if (prepaint.stop || document.hidden) return;
    var next = null;
    for (var i = 0; i < PL.bodies.length; i++) {
      if (!texCache[PL.bodies[i].id]) { next = PL.bodies[i]; break; }
    }
    if (!next) return;

    var run = function (deadline) {
      if (prepaint.stop || document.hidden || view.time - view.interacting < 1.5) {
        setTimeout(prepaint, 1200);          /* on repassera plus tard */
        return;
      }
      if (!prepaint.job || prepaint.job.id !== next.id) prepaint.job = beginPaint(next);

      /* Par tranches de trente-deux lignes, tant que le navigateur nous laisse
         du temps : la peinture avance sans jamais manquer une image. */
      var done = false;
      do {
        done = paintRows(prepaint.job, 32);
      } while (!done && deadline && deadline.timeRemaining && deadline.timeRemaining() > 8);

      if (done) {
        texCache[next.id] = { col: prepaint.job.col, mask: prepaint.job.mask, w: TEX_W, h: TEX_H };
        prepaint.job = null;
      }
      setTimeout(prepaint, done ? 400 : 40);
    };
    if (global.requestIdleCallback) global.requestIdleCallback(run, { timeout: 4000 });
    else setTimeout(run, 900);
  }

  /* ══════════════════════════════════════════════════════════════
     6. LES GESTES
     ══════════════════════════════════════════════════════════════ */

  var pointers = {}, pinchStart = 0, zoomStart = 1, hintSeen = false;

  function touched() {
    view.interacting = view.time;
    if (!hintSeen) { hintSeen = true; $('plHint').classList.add('is-gone'); }
  }

  function setZoom(z) {
    view.zoom = clamp(z, 0.55, 4);
    view.tableKey = '';
    touched();
  }

  /**
   * Les boutons flottants sont posés à l'intérieur de la scène. Sans cette
   * garde, leur pointerdown remonte jusqu'ici, la scène capture le pointeur,
   * et le relâchement lui est réattribué : le clic n'atteint jamais le bouton.
   * Au doigt le clic est synthétisé depuis la séquence tactile et passait
   * quand même — d'où un bouton qui marchait sur téléphone et pas à la souris.
   */
  function isControl(node) {
    while (node && node !== stage) {
      var tag = node.tagName;
      if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'LABEL') return true;
      node = node.parentNode;
    }
    return false;
  }

  stage.addEventListener('pointerdown', function (e) {
    if (isControl(e.target)) return;
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    stage.classList.add('is-dragging');
    var ids = Object.keys(pointers);
    if (ids.length === 2) {
      pinchStart = dist(pointers[ids[0]], pointers[ids[1]]);
      zoomStart = view.zoom;
    }
    touched();
  });

  function dist(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  stage.addEventListener('pointermove', function (e) {
    var p = pointers[e.pointerId];
    if (!p) return;
    var dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;

    var ids = Object.keys(pointers);
    if (ids.length >= 2) {
      var d = dist(pointers[ids[0]], pointers[ids[1]]);
      if (pinchStart > 8) setZoom(zoomStart * d / pinchStart);
      return;
    }
    /* La surface suit le doigt : c'est le seul réglage qui compte. */
    view.spin -= dx * 0.0055 / Math.max(0.7, view.zoom);
    var t = clamp(view.tilt + dy * 0.006, -1.35, 1.35);
    if (t !== view.tilt) { view.tilt = t; view.tableKey = ''; }
    touched();
  });

  function release(e) {
    delete pointers[e.pointerId];
    if (!Object.keys(pointers).length) stage.classList.remove('is-dragging');
  }
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  stage.addEventListener('wheel', function (e) {
    e.preventDefault();
    setZoom(view.zoom * Math.exp(-e.deltaY * 0.0014));
  }, { passive: false });

  $('plIn').addEventListener('click', function () { setZoom(view.zoom * 1.35); });
  $('plOut').addEventListener('click', function () { setZoom(view.zoom / 1.35); });
  $('plReset').addEventListener('click', function () {
    view.zoom = 1; view.tilt = 0.26; view.tableKey = ''; touched();
  });

  var playBtn = $('plPlay');
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>';

  function setSpinning(on) {
    view.spinning = on;
    playBtn.innerHTML = on ? ICON_PAUSE : ICON_PLAY;
    var label = on ? 'Mettre la rotation en pause' : 'Relancer la rotation';
    playBtn.title = label;
    playBtn.setAttribute('aria-label', label);
  }
  playBtn.addEventListener('click', function () { setSpinning(!view.spinning); });

  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    var step = 0.16;
    switch (e.key) {
      case 'ArrowLeft':  view.spin -= step; touched(); break;
      case 'ArrowRight': view.spin += step; touched(); break;
      case 'ArrowUp':    view.tilt = clamp(view.tilt + 0.1, -1.35, 1.35); view.tableKey = ''; touched(); break;
      case 'ArrowDown':  view.tilt = clamp(view.tilt - 0.1, -1.35, 1.35); view.tableKey = ''; touched(); break;
      case '+': case '=': setZoom(view.zoom * 1.25); break;
      case '-': case '_': setZoom(view.zoom / 1.25); break;
      case ' ': setSpinning(!view.spinning); break;
      default: return;
    }
    e.preventDefault();
  });

  $('plMass').addEventListener('input', updateYou);
  $('plAge').addEventListener('input', updateYou);

  /* ══════════════════════════════════════════════════════════════
     7. LE PLAN DU SYSTÈME
     Vu de dessus, légèrement de biais. Les orbites sont compressées —
     sinon Mercure et Neptune ne tiendraient jamais dans la même image.
     ══════════════════════════════════════════════════════════════ */

  var SVGNS = 'http://www.w3.org/2000/svg';
  var mapItems = [];
  var MAP_CX = 480, MAP_CY = 140, MAP_FLAT = 0.55;

  function mapRadius(au) {
    /* Une échelle logarithmique : sans elle, Mercure serait collée au Soleil
       et Neptune hors du cadre. */
    return 76 + 122 * (Math.log(1 + au * 1.6) / Math.log(1 + 39.5 * 1.6));
  }

  function svgEl(name, attrs) {
    var el = document.createElementNS(SVGNS, name);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  function buildMap() {
    var svg = $('plMap');

    var halo = svgEl('circle', { cx: MAP_CX, cy: MAP_CY, r: 28, fill: 'url(#plSunGlow)' });
    var defs = svgEl('defs', {});
    var rg = svgEl('radialGradient', { id: 'plSunGlow' });
    rg.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#ffcf6b', 'stop-opacity': '.85' }));
    rg.appendChild(svgEl('stop', { offset: '45%', 'stop-color': '#ff9d3c', 'stop-opacity': '.32' }));
    rg.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#ff9d3c', 'stop-opacity': '0' }));
    defs.appendChild(rg);
    svg.appendChild(defs);
    svg.appendChild(halo);

    PL.bodies.forEach(function (b, n) {
      if (!b.orbit) return;
      var r = mapRadius(b.orbit.au);
      svg.appendChild(svgEl('ellipse', {
        cx: MAP_CX, cy: MAP_CY, rx: r, ry: r * MAP_FLAT, class: 'pl-orbit'
      }));

      var g = svgEl('g', { class: 'pl-map-hit', tabindex: '0', role: 'button' });
      var title = svgEl('title', {});
      title.textContent = 'Visiter ' + b.name;
      g.appendChild(title);
      g.appendChild(svgEl('circle', { r: 13, fill: 'transparent' }));
      var ring = svgEl('circle', { r: 9, fill: 'none', stroke: b.color, 'stroke-width': 1.4, opacity: 0 });
      g.appendChild(ring);
      var dot = svgEl('circle', {
        r: Math.max(3, Math.min(7.5, Math.log(b.diamKm / 1000) * 2.1)),
        fill: b.color
      });
      g.appendChild(dot);
      /* Une étiquette sur deux passe au-dessus : les orbites internes sont
         serrées, et les noms se marcheraient dessus. */
      var label = svgEl('text', {
        class: 'pl-map-name', x: 0, y: (n % 2 ? -13 : 21), 'text-anchor': 'middle'
      });
      label.textContent = b.name;
      g.appendChild(label);

      g.addEventListener('click', function () { select(b.id, true); scrollToStage(); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(b.id, true); scrollToStage(); }
      });
      svg.appendChild(g);

      mapItems.push({ id: b.id, g: g, ring: ring, r: r, period: b.orbit.periodY, phase: n * 1.13 });
    });

    /* Sur un téléphone, le plan déborde du cadre : on l'ouvre centré sur le
       Soleil plutôt que sur son bord gauche. */
    requestAnimationFrame(function () {
      var frame = svg.parentNode;
      frame.scrollLeft = (frame.scrollWidth - frame.clientWidth) / 2;
    });

    /* Le Soleil, au centre, par-dessus les orbites. */
    var sun = svgEl('g', { class: 'pl-map-hit', tabindex: '0', role: 'button' });
    var st = svgEl('title', {}); st.textContent = 'Visiter le Soleil';
    sun.appendChild(st);
    sun.appendChild(svgEl('circle', { cx: MAP_CX, cy: MAP_CY, r: 10, fill: '#ffb347' }));
    sun.addEventListener('click', function () { select('soleil', true); scrollToStage(); });
    svg.appendChild(sun);
  }

  function markMap(id) {
    mapItems.forEach(function (it) {
      it.ring.setAttribute('opacity', it.id === id ? 0.9 : 0);
    });
  }

  function updateMap(t) {
    for (var i = 0; i < mapItems.length; i++) {
      var it = mapItems[i];
      var a = it.phase + (reduceMotion ? 0 : t * (2 * Math.PI) / (it.period * 5.5));
      var x = MAP_CX + it.r * Math.cos(a);
      var y = MAP_CY + it.r * MAP_FLAT * Math.sin(a);
      it.g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')');
    }
  }

  function scrollToStage() {
    stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    buildStars(w, h, dpr);
    view.tableKey = '';
  }

  var last = 0;
  function tick(ts) {
    var t = ts / 1000;
    var dt = last ? Math.min(0.05, t - last) : 0;
    last = t;
    view.time = t;
    if (!document.hidden) {
      frame(dt);
      updateMap(t);
    }
    requestAnimationFrame(tick);
  }

  function boot() {
    buildDock();
    buildMap();
    setSpinning(!reduceMotion);
    resize();
    global.addEventListener('resize', resize);

    var wanted = (location.hash || '').replace('#', '');
    if (!PL.byId(wanted)) {
      try { wanted = localStorage.getItem('grenier.planetes') || ''; } catch (e) { wanted = ''; }
    }
    select(PL.byId(wanted) ? wanted : 'terre', false);
    markMap(PL.byId(wanted) ? wanted : 'terre');

    global.addEventListener('hashchange', function () {
      var id = (location.hash || '').replace('#', '');
      if (PL.byId(id)) select(id, false);
    });

    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
