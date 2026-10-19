// Mode démo : mêmes actions que le script Google, mais en mémoire (sauvegardé dans ce navigateur uniquement).
(function () {
  'use strict';
  var KEY = 'cg_demo_db_v1';
  var PERSONNES = ['Jordana', 'Sara'];
  var UNITES = ['portions', 'sachets', 'pièces', 'boîtes', 'barquettes', 'plats', 'plaquettes', 'bocaux', 'pots', 'bouteilles', 'g', 'kg', 'L'];

  function today() { return new Date().toISOString().slice(0, 10); }
  function daysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
  function uid() { return 'id' + Math.random().toString(36).slice(2, 10); }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }

  function seed() {
    var A = function (nom, categorie, unite, alerte, seuil) { return { nom: nom, categorie: categorie, unite: unite, alerte: !!alerte, seuil: seuil || 0, photo: '' }; };
    var M = function (n, aliment, type, q, emp, pers, note) { return { id: uid(), date: daysAgo(n), aliment: aliment, type: type, quantite: q, emplacement: emp, personne: pers, note: note || '' }; };
    return {
      emplacements: ['Coffre', 'Tiroir haut', 'Tiroir milieu', 'Tiroir bas'],
      categories: ['VIANDE', 'FROMAGE', 'POISSON', 'DESSERT', 'PLAT CUISINE', 'LEGUMES', 'INDETERMINE', 'PATE ET BASES', 'FRUITS', 'LAITAGE', 'BOULANGERIE', 'MEDICAL'],
      aliments: [
        A('Courgettes en dés', 'LEGUMES', 'sachets'), A('Purée de courgettes', 'LEGUMES', 'g'),
        A('Courgettes rondelles', 'LEGUMES', 'sachets'), A('Courgettes entières', 'LEGUMES', 'pièces'),
        A('Saumon', 'POISSON', 'portions', true, 2), A('Beurre', 'LAITAGE', 'plaquettes', true, 1),
        A('Blanc de poulet', 'VIANDE', 'portions', true, 2), A('Épinards', 'LEGUMES', 'sachets', true, 1),
        A('Pain de campagne', 'BOULANGERIE', 'pièces'), A('Lasagnes de Jordana', 'PLAT CUISINE', 'portions'),
        A('Glace vanille', 'DESSERT', 'barquettes'), A('Framboises', 'FRUITS', 'sachets'),
        A('Comté râpé', 'FROMAGE', 'sachets'), A('Pâte brisée', 'PATE ET BASES', 'pièces')
      ],
      mouvements: [
        M(30, 'Courgettes en dés', 'Ajout', 3, 'Coffre', 'Sara'), M(30, 'Purée de courgettes', 'Ajout', 750, 'Tiroir milieu', 'Jordana'),
        M(30, 'Courgettes rondelles', 'Ajout', 2, 'Coffre', 'Sara'), M(30, 'Courgettes entières', 'Ajout', 1, 'Tiroir bas', 'Sara'),
        M(21, 'Saumon', 'Ajout', 4, 'Coffre', 'Sara', 'Filets sous vide'), M(12, 'Saumon', 'Retrait', 3, 'Coffre', 'Jordana'),
        M(20, 'Beurre', 'Ajout', 3, 'Tiroir haut', 'Jordana'), M(9, 'Beurre', 'Retrait', 2, 'Tiroir haut', 'Sara'),
        M(18, 'Blanc de poulet', 'Ajout', 10, 'Coffre', 'Sara'), M(7, 'Blanc de poulet', 'Retrait', 8, 'Coffre', 'Jordana'),
        M(7, 'Blanc de poulet', 'Ajout', 2, 'Tiroir bas', 'Sara'), M(15, 'Épinards', 'Ajout', 4, 'Tiroir milieu', 'Jordana'),
        M(6, 'Épinards', 'Retrait', 3, 'Tiroir milieu', 'Jordana'), M(14, 'Pain de campagne', 'Ajout', 2, 'Tiroir haut', 'Sara'),
        M(10, 'Lasagnes de Jordana', 'Ajout', 6, 'Coffre', 'Jordana', 'Fait maison'), M(4, 'Lasagnes de Jordana', 'Retrait', 1, 'Coffre', 'Sara'),
        M(8, 'Glace vanille', 'Ajout', 2, 'Tiroir haut', 'Jordana'), M(5, 'Framboises', 'Ajout', 3, 'Tiroir bas', 'Sara'),
        M(3, 'Comté râpé', 'Ajout', 2, 'Tiroir haut', 'Sara'), M(2, 'Pâte brisée', 'Ajout', 3, 'Tiroir milieu', 'Jordana')
      ],
      courses: [
        { id: uid(), article: 'Beurre', achete: false, ajoutePar: 'Sara', date: daysAgo(1) },
        { id: uid(), article: 'Blancs de poulet', achete: false, ajoutePar: 'Jordana', date: daysAgo(1) },
        { id: uid(), article: 'Épinards', achete: false, ajoutePar: 'Sara', date: daysAgo(0) }
      ],
      depenses: seedDep(),
      budget: 450, unites: UNITES.slice(), ordres: { emplacements: 'perso', categories: 'perso', unites: 'perso' }
    };
  }

  function seedDep() {
    var D = function (n, magasin, s, j) { return { id: uid(), date: daysAgo(n), magasin: magasin, parts: { Sara: s, Jordana: j } }; };
    return [
      D(1, 'Carrefour', 87.4, 0), D(3, 'Boucherie', 0, 42.9), D(6, 'Picard', 30, 33.15), D(9, 'Marché', 28.5, 0),
      D(14, 'Leclerc', 60, 52.3), D(33, 'Leclerc', 0, 134.2), D(45, 'Picard', 71.8, 0), D(62, 'Carrefour', 98.6, 0),
      D(80, 'Marché', 0, 35.4), D(95, 'Leclerc', 120.5, 40), D(120, 'Picard', 0, 64.3), D(150, 'Carrefour', 101.2, 0)
    ];
  }

  var db;
  function load() {
    try { var v = localStorage.getItem(KEY); if (v) { var o = JSON.parse(v); if (!o.depenses) { o.depenses = seedDep(); o.budget = 450; } if (!o.unites) o.unites = UNITES.slice(); if (!o.ordres) o.ordres = { emplacements: 'perso', categories: 'perso', unites: 'perso' }; return o; } } catch (e) {}
    return seed();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
  db = load();

  function stockOf(aliment, emp) {
    return db.mouvements.reduce(function (s, m) {
      if (m.aliment !== aliment || m.emplacement !== emp) return s;
      return s + (m.type === 'Retrait' ? -m.quantite : m.quantite);
    }, 0);
  }

  function compute() {
    var aliments = db.aliments.map(function (a) {
      var per = {};
      db.mouvements.forEach(function (m) {
        if (m.aliment !== a.nom) return;
        per[m.emplacement] = (per[m.emplacement] || 0) + (m.type === 'Retrait' ? -m.quantite : m.quantite);
      });
      var emplacements = Object.keys(per).map(function (k) { return { nom: k, qte: Math.round(per[k] * 1000) / 1000 }; })
        .filter(function (e) { return e.qte !== 0; });
      var stock = emplacements.reduce(function (s, e) { return s + e.qte; }, 0);
      return { nom: a.nom, categorie: a.categorie, unite: a.unite, alerte: a.alerte, seuil: a.seuil, photo: a.photo, autoCourses: !!a.autoCourses,
        seuilCourses: a.seuilCourses == null ? null : a.seuilCourses, stock: stock, emplacements: emplacements };
    });
    var mv = db.mouvements.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 200);
    var deps = db.depenses.map(function (d) {
      var t = (d.parts.Sara || 0) + (d.parts.Jordana || 0);
      return { id: d.id, date: d.date, magasin: d.magasin, parts: { Sara: d.parts.Sara || 0, Jordana: d.parts.Jordana || 0 }, total: Math.round(t * 100) / 100 };
    }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return { emplacements: sortList(db.emplacements, db.ordres.emplacements), categories: sortList(db.categories, db.ordres.categories),
      unites: sortList(db.unites, db.ordres.unites), ordres: JSON.parse(JSON.stringify(db.ordres)), personnes: PERSONNES, aliments: aliments, courses: db.courses.slice(), mouvements: mv,
      personnesDep: ['Sara', 'Jordana'], depenses: deps, budget: db.budget || 0 };
  }

  function depParts(p) {
    var parts = {}, total = 0;
    ['Sara', 'Jordana'].forEach(function (n) {
      var v = Math.round((Number(String((p.parts || {})[n] == null ? 0 : p.parts[n]).replace(',', '.')) || 0) * 100) / 100;
      if (v < 0) throw new Error('Les montants ne peuvent pas être négatifs.');
      parts[n] = v; total += v;
    });
    if (!(total > 0)) throw new Error('Saisissez au moins un montant.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(p.date || ''))) throw new Error('Choisissez une date.');
    return parts;
  }

  function sortList(arr, mode) {
    if (mode !== 'az' && mode !== 'za') return arr.slice();
    var out = arr.slice().sort(function (a, b) { return a.localeCompare(b, 'fr', { sensitivity: 'base', numeric: true }); });
    return mode === 'za' ? out.reverse() : out;
  }
  function checkAuto(nom) {
    var a = compute().aliments.filter(function (x) { return x.nom === nom; })[0];
    if (!a || !a.autoCourses) return;
    var seuil = a.seuilCourses == null ? a.seuil : a.seuilCourses;
    if (a.stock > seuil + 1e-9) return;
    if (db.courses.some(function (c) { return !c.achete && norm(c.article) === norm(nom); })) return;
    db.courses.push({ id: uid(), article: nom, achete: false, ajoutePar: 'Auto', date: today() });
  }
  function findAl(nom) { return db.aliments.filter(function (a) { return a.nom === nom; })[0]; }

  function addMov(p) {
    if (p.type !== 'Ajout' && p.type !== 'Retrait') throw new Error('Type de mouvement invalide.');
    var q = Number(p.quantite);
    if (!(q > 0)) throw new Error('La quantité doit être supérieure à zéro.');
    if (db.emplacements.indexOf(p.emplacement) < 0) throw new Error('Choisissez un emplacement.');
    if (p.nouvelAliment) {
      var n = String(p.nouvelAliment.nom || '').trim();
      if (!n) throw new Error("Donnez un nom à l'aliment.");
      if (db.aliments.some(function (a) { return norm(a.nom) === norm(n); })) throw new Error('Cet aliment existe déjà : choisissez-le dans la liste.');
      var cn = String(p.nouvelAliment.categorie || '').trim();
      if (p.nouvelAliment.nouvelleCategorie) {
        if (!cn) throw new Error('Donnez un nom à la nouvelle catégorie.');
        var ex = db.categories.filter(function (c) { return norm(c) === norm(cn); })[0];
        if (ex) cn = ex; else db.categories.push(cn);
      } else if (db.categories.indexOf(cn) < 0) throw new Error('Choisissez une catégorie.');
      db.aliments.push({ nom: n, categorie: cn, unite: p.unite || '', alerte: false, seuil: 1, photo: '' });
      p.aliment = n;
    }
    var a = findAl(p.aliment);
    if (!a) throw new Error('Aliment introuvable.');
    if (db.emplacements.indexOf(p.emplacement) < 0) throw new Error('Choisissez un emplacement.');
    if (p.type === 'Retrait') {
      var dispo = stockOf(a.nom, p.emplacement);
      if (q > dispo + 1e-9) throw new Error(dispo <= 0 ? 'Il n’y a plus de ' + a.nom + ' dans cet emplacement.' : 'Il n’y en a que ' + dispo + ' dans cet emplacement.');
    }
    if (p.unite !== undefined && p.type === 'Ajout') a.unite = p.unite || '';
    db.mouvements.push({ id: uid(), date: p.date || today(), aliment: a.nom, type: p.type, quantite: q, emplacement: p.emplacement, personne: p.personne || '', note: p.note || '' });
    if (p.type === 'Retrait') checkAuto(a.nom);
  }

  function handle(action, p) {
    p = p || {};
    switch (action) {
      case 'bootstrap': break;
      case 'addMouvement': addMov(p); break;
      case 'cancelMouvement': {
        var ci = -1; db.mouvements.forEach(function (m, i) { if (m.id === p.id) ci = i; });
        if (ci < 0) throw new Error('Mouvement introuvable (déjà annulé ?).');
        var cm = db.mouvements[ci];
        if (cm.type === 'Ajout' && stockOf(cm.aliment, cm.emplacement) - cm.quantite < -1e-9) throw new Error("Impossible d'annuler cet ajout : une partie a déjà été retirée du stock.");
        db.mouvements.splice(ci, 1); break; }
      case 'updateMouvement': {
        var nq = Number(String(p.quantite).replace(',', '.'));
        if (!(nq > 0)) throw new Error('La quantité doit être supérieure à zéro.');
        var um = db.mouvements.filter(function (m) { return m.id === p.id; })[0];
        if (!um) throw new Error('Mouvement introuvable (déjà annulé ?).');
        var apres = stockOf(um.aliment, um.emplacement) + (um.type === 'Retrait' ? um.quantite - nq : nq - um.quantite);
        if (apres < -1e-9) throw new Error(um.type === 'Retrait' ? "Il n'y en a pas assez dans cet emplacement pour retirer cette quantité." : "Impossible : une partie de cet ajout a déjà été retirée du stock.");
        um.quantite = nq; if (um.type === 'Retrait') checkAuto(um.aliment); break; }
      case 'clearStock':
        var dispo = stockOf(p.aliment, p.emplacement);
        if (dispo <= 0) throw new Error('Rien à retirer ici.');
        db.mouvements.push({ id: uid(), date: today(), aliment: p.aliment, type: 'Retrait', quantite: dispo, emplacement: p.emplacement, personne: p.personne || '', note: 'Tout retiré' });
        checkAuto(p.aliment); break;
      case 'setAlerte':
        var a = findAl(p.aliment); if (!a) throw new Error('Aliment introuvable.');
        a.alerte = !!p.alerte; a.seuil = Math.max(0, Number(p.seuil) || 0); break;
      case 'addCourse':
        var art = String(p.article || '').trim(); if (!art) throw new Error('Écrivez un article.');
        if (db.courses.some(function (c) { return !c.achete && norm(c.article) === norm(art); })) { var e = new Error('Cet article est déjà dans la liste.'); e.code = 'DUP'; throw e; }
        var bo = db.courses.filter(function (c) { return c.achete && norm(c.article) === norm(art); });
        if (bo.length) { bo[0].achete = false; bo[0].ajoutePar = p.ajoutePar || ''; bo[0].date = today(); db.courses = db.courses.filter(function (c) { return bo.indexOf(c) < 1; }); break; }
        db.courses.push({ id: uid(), article: art, achete: false, ajoutePar: p.ajoutePar || '', date: today() }); break;
      case 'setAchete':
        db.courses.forEach(function (c) { if (c.id === p.id) c.achete = !!p.achete; });
        if (p.achete) { var kc = db.courses.filter(function (c) { return c.id === p.id; })[0]; if (kc) db.courses = db.courses.filter(function (c) { return c === kc || !(c.achete && norm(c.article) === norm(kc.article)); }); }
        break;
      case 'deleteAliment':
        var al = compute().aliments.filter(function (x) { return x.nom === p.aliment; })[0];
        if (!al) throw new Error('Aliment introuvable.');
        if (Math.abs(al.stock) > 1e-9) throw new Error('Il reste du stock : retirez-le avant de supprimer.');
        db.aliments = db.aliments.filter(function (x) { return x.nom !== p.aliment; }); break;
      case 'addDepense':
        db.depenses.push({ id: uid(), date: p.date, magasin: String(p.magasin || '').trim() || 'Courses', parts: depParts(p) }); break;
      case 'updateDepense':
        var dd = db.depenses.filter(function (x) { return x.id === p.id; })[0];
        if (!dd) throw new Error('Dépense introuvable (déjà supprimée ?).');
        dd.parts = depParts(p); dd.date = p.date; dd.magasin = String(p.magasin || '').trim() || 'Courses'; break;
      case 'deleteDepense':
        if (!db.depenses.some(function (x) { return x.id === p.id; })) throw new Error('Dépense introuvable (déjà supprimée ?).');
        db.depenses = db.depenses.filter(function (x) { return x.id !== p.id; }); break;
      case 'addCategorie': {
        var nn = String(p.nom || '').trim(); if (!nn) throw new Error('Donnez un nom à la catégorie.');
        if (db.categories.some(function (c) { return norm(c) === norm(nn); })) throw new Error('Cette catégorie existe déjà.');
        db.categories.push(nn); break; }
      case 'renameCategorie': {
        var old = String(p.ancien || '').trim(), nw = String(p.nouveau || '').trim(); if (!nw) throw new Error('Donnez un nom à la catégorie.');
        if (db.categories.indexOf(old) < 0) throw new Error('Catégorie introuvable.');
        if (db.categories.some(function (c) { return c !== old && norm(c) === norm(nw); })) throw new Error('Une autre catégorie porte déjà ce nom.');
        db.categories = db.categories.map(function (c) { return c === old ? nw : c; });
        db.aliments.forEach(function (a) { if (a.categorie === old) a.categorie = nw; }); break; }
      case 'deleteCategorie': {
        var used = db.aliments.filter(function (a) { return a.categorie === p.nom; }).length;
        if (used > 0) throw new Error('Cette catégorie contient encore ' + used + ' aliment' + (used > 1 ? 's' : '') + ' : changez-les de catégorie d’abord.');
        db.categories = db.categories.filter(function (c) { return c !== p.nom; }); break; }
      case 'addEmplacement': {
        var en = String(p.nom || '').trim(); if (!en) throw new Error('Donnez un nom à l’emplacement.');
        if (db.emplacements.some(function (c) { return norm(c) === norm(en); })) throw new Error('Cet emplacement existe déjà.');
        db.emplacements.push(en); break; }
      case 'renameEmplacement': {
        var eo = String(p.ancien || '').trim(), ew = String(p.nouveau || '').trim(); if (!ew) throw new Error('Donnez un nom à l’emplacement.');
        if (db.emplacements.indexOf(eo) < 0) throw new Error('Emplacement introuvable.');
        if (db.emplacements.some(function (c) { return c !== eo && norm(c) === norm(ew); })) throw new Error('Un autre emplacement porte déjà ce nom.');
        db.emplacements = db.emplacements.map(function (c) { return c === eo ? ew : c; });
        db.mouvements.forEach(function (m) { if (m.emplacement === eo) m.emplacement = ew; }); break; }
      case 'deleteEmplacement': {
        var cur = compute(), eu = cur.aliments.filter(function (a) { return a.emplacements.some(function (e) { return e.nom === p.nom && e.qte > 0; }); }).length;
        if (eu > 0) throw new Error('Cet emplacement contient encore ' + eu + ' aliment' + (eu > 1 ? 's' : '') + ' : retirez-' + (eu > 1 ? 'les' : 'le') + ' d’abord.');
        if (db.emplacements.length <= 1) throw new Error('Gardez au moins un emplacement.');
        db.emplacements = db.emplacements.filter(function (c) { return c !== p.nom; }); break; }
      case 'addUnite': {
        var un = String(p.nom || '').trim(); if (!un) throw new Error('Donnez un nom à l’unité.');
        if (db.unites.some(function (c) { return norm(c) === norm(un); })) throw new Error('Cette unité existe déjà.');
        db.unites.push(un); break; }
      case 'renameUnite': {
        var uo = String(p.ancien || '').trim(), uw = String(p.nouveau || '').trim(); if (!uw) throw new Error('Donnez un nom à l’unité.');
        if (db.unites.indexOf(uo) < 0) throw new Error('Unité introuvable.');
        if (db.unites.some(function (c) { return c !== uo && norm(c) === norm(uw); })) throw new Error('Une autre unité porte déjà ce nom.');
        db.unites = db.unites.map(function (c) { return c === uo ? uw : c; });
        db.aliments.forEach(function (a) { if (a.unite === uo) a.unite = uw; }); break; }
      case 'deleteUnite': {
        var uu = db.aliments.filter(function (a) { return a.unite === p.nom; }).length;
        if (uu > 0) throw new Error('Cette unité est utilisée par ' + uu + ' aliment' + (uu > 1 ? 's' : '') + ' : changez-leur d’unité d’abord.');
        db.unites = db.unites.filter(function (c) { return c !== p.nom; }); break; }
      case 'setOrdre':
        if (['emplacements', 'categories', 'unites'].indexOf(p.liste) < 0) throw new Error('Liste inconnue.');
        db.ordres[p.liste] = p.mode === 'az' || p.mode === 'za' ? p.mode : 'perso'; break;
      case 'reorder': {
        var src = db[p.liste]; if (!src) throw new Error('Liste inconnue.');
        var out = (p.noms || []).filter(function (n) { return src.indexOf(n) >= 0; });
        src.forEach(function (n) { if (out.indexOf(n) < 0) out.push(n); });
        db[p.liste] = out; db.ordres[p.liste] = 'perso'; break; }
      case 'updateAliment': {
        var ua = findAl(p.ancien); if (!ua) throw new Error('Aliment introuvable.');
        var nn2 = String(p.nom || '').trim(); if (!nn2) throw new Error("Donnez un nom à l'aliment.");
        if (db.aliments.some(function (x) { return x !== ua && norm(x.nom) === norm(nn2); })) throw new Error('Un autre aliment porte déjà ce nom.');
        if (db.categories.indexOf(p.categorie) < 0) throw new Error('Choisissez une catégorie.');
        if (nn2 !== ua.nom) {
          db.mouvements.forEach(function (m) { if (m.aliment === ua.nom) m.aliment = nn2; });
          db.courses.forEach(function (c) { if (norm(c.article) === norm(ua.nom)) c.article = nn2; });
        }
        ua.nom = nn2; ua.categorie = p.categorie; ua.unite = String(p.unite || '').trim(); break; }
      case 'setAutoCourses': {
        var sa = findAl(p.aliment); if (!sa) throw new Error('Aliment introuvable.');
        sa.autoCourses = !!p.auto; sa.seuilCourses = Math.max(0, Number(p.seuil) || 0);
        if (sa.autoCourses) checkAuto(sa.nom); break; }
      case 'setBudget': db.budget = Math.max(0, Number(p.budget) || 0); break;
      default: throw new Error('Action inconnue : ' + action);
    }
    if (action !== 'bootstrap') save();
    return { ok: true, data: compute() };
  }

  window.DemoApi = {
    call: function (action, payload) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { try { resolve(handle(action, JSON.parse(JSON.stringify(payload || {})))); } catch (e) { reject(e); } }, 120);
      });
    },
    reset: function () { db = seed(); save(); }
  };
})();
