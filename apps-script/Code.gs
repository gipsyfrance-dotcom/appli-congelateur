/**
 * Mon congélateur — API Google Apps Script
 * Lit et écrit dans le Google Sheet « Inventaire Congélateur ».
 * Le stock n'est jamais stocké : il est recalculé à partir de l'onglet Mouvements.
 *
 * Déploiement : voir README.md (Déployer > Nouveau déploiement > Application Web,
 * « Exécuter en tant que : moi », « Qui a accès : tout le monde »).
 * Le code d'accès se règle dans Paramètres du projet > Propriétés du script > ACCESS_CODE.
 */

var CFG = {
  SHEET_ID: '10VkA9XZsbCZH5imp9_VlHmtc55D6To8VzQ45bxVzStk',
  TZ: 'Europe/Paris',
  PERSONNES: ['Jordana', 'Sara'],
  PERSONNES_DEP: ['Sara', 'Jordana'], // ordre d'affichage des parts dans les dépenses (une colonne par personne dans l'onglet Depenses)
  TABS: { emplacements: 'Emplacements', aliments: 'Aliments', categories: 'Categories', mouvements: 'Mouvements', courses: 'Courses', depenses: 'Depenses' }
};

/* ---------------------------- Points d'entrée ---------------------------- */

function doGet() {
  return json_({ ok: true, message: 'API Mon congélateur en ligne.' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var code = PropertiesService.getScriptProperties().getProperty('ACCESS_CODE');
    if (!code) return json_({ ok: false, code: 'AUTH', error: "Code d'accès non défini dans le script (propriété ACCESS_CODE)." });
    if (String(req.token || '') !== String(code)) return json_({ ok: false, code: 'AUTH', error: "Code d'accès incorrect." });

    lock.waitLock(20000);
    switch (req.action) {
      case 'bootstrap': break;
      case 'addMouvement': addMouvement_(req); break;
      case 'clearStock': clearStock_(req); break;
      case 'setAlerte': setAlerte_(req); break;
      case 'addCourse': addCourse_(req); break;
      case 'setAchete': setAchete_(req); break;
      case 'deleteAliment': deleteAliment_(req); break;
      case 'addDepense': addDepense_(req); break;
      case 'updateDepense': updateDepense_(req); break;
      case 'deleteDepense': deleteDepense_(req); break;
      case 'setBudget': setBudget_(req); break;
      case 'addCategorie': addCategorie_(req); break;
      case 'renameCategorie': renameCategorie_(req); break;
      case 'deleteCategorie': deleteCategorie_(req); break;
      case 'addEmplacement': addEmplacement_(req); break;
      case 'renameEmplacement': renameEmplacement_(req); break;
      case 'deleteEmplacement': deleteEmplacement_(req); break;
      default: return json_({ ok: false, error: 'Action inconnue : ' + req.action });
    }
    SpreadsheetApp.flush();
    return json_({ ok: true, data: state_() });
  } catch (err) {
    var dup = err && err.code === 'DUP';
    return json_({ ok: false, code: dup ? 'DUP' : '', error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* ---------------------------- Lecture ---------------------------- */

function state_() {
  var emp = readTable_(CFG.TABS.emplacements), cat = readTable_(CFG.TABS.categories);
  var al = readTable_(CFG.TABS.aliments), mv = readTable_(CFG.TABS.mouvements), co = readTable_(CFG.TABS.courses);

  var emplacements = emp.rows.map(function (r) { return String(r[col_(emp, ['nom', 'emplacement', 'nomemplacement'], 0)] || '').trim(); }).filter(Boolean);
  var categories = cat.rows.map(function (r) { return String(r[col_(cat, ['nom', 'categorie', 'nomcategorie'], 0)] || '').trim(); }).filter(Boolean);

  var cNom = col_(al, ['nom', 'aliment'], 0), cCat = col_(al, ['categorie']), cAl = col_(al, ['alerteactivee', 'alerte']),
      cSe = col_(al, ['seuilalerte', 'seuildalerte', 'seuil']), cUn = col_(al, ['unite']), cPh = col_(al, ['photo', 'image']);
  var aliments = {}, order = [];
  al.rows.forEach(function (r) {
    var nom = String(r[cNom] || '').trim(); if (!nom) return;
    aliments[nom] = {
      nom: nom, categorie: cCat < 0 ? '' : String(r[cCat] || '').trim(), alerte: cAl < 0 ? false : bool_(r[cAl]),
      seuil: cSe < 0 ? 0 : num_(r[cSe]), unite: cUn < 0 ? '' : String(r[cUn] || '').trim(), photo: cPh < 0 ? '' : String(r[cPh] || '').trim(),
      stock: 0, emplacements: [], _per: {}
    };
    order.push(nom);
  });

  var mDate = col_(mv, ['date']), mAl = col_(mv, ['aliment']), mTy = col_(mv, ['type']), mQt = col_(mv, ['quantite']),
      mEm = col_(mv, ['emplacement']), mPe = col_(mv, ['personne']), mNo = col_(mv, ['note']);
  var mouvements = [];
  mv.rows.forEach(function (r) {
    var nom = String(r[mAl] || '').trim(), emp2 = String(r[mEm] || '').trim(), q = num_(r[mQt]);
    if (!nom || !q) return;
    var type = String(r[mTy] || '').trim();
    var a = aliments[nom];
    if (a) a._per[emp2] = (a._per[emp2] || 0) + (type === 'Retrait' ? -q : q);
    mouvements.push({ date: date_(r[mDate]), aliment: nom, type: type, quantite: q, emplacement: emp2, personne: mPe < 0 ? '' : String(r[mPe] || '').trim(), note: mNo < 0 ? '' : String(r[mNo] || '').trim() });
  });
  mouvements.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });

  var alimentsOut = order.map(function (nom) {
    var a = aliments[nom];
    a.emplacements = Object.keys(a._per).map(function (k) { return { nom: k, qte: Math.round(a._per[k] * 1000) / 1000 }; })
      .filter(function (e) { return e.qte !== 0; });
    a.stock = a.emplacements.reduce(function (s, e) { return s + e.qte; }, 0);
    delete a._per;
    return a;
  });

  var kId = col_(co, ['idcourses', 'idcourse', 'id']), kAr = col_(co, ['article'], 0), kAc = col_(co, ['achete']),
      kPa = col_(co, ['ajoutepar']), kDa = col_(co, ['dateajout', 'datedajout', 'date']);
  var courses = [];
  co.rows.forEach(function (r, i) {
    var art = String(r[kAr] || '').trim(); if (!art) return;
    var id = kId < 0 ? '' : String(r[kId] || '').trim();
    courses.push({ id: id || ('row' + (i + 2)), article: art, achete: kAc < 0 ? false : bool_(r[kAc]), ajoutePar: kPa < 0 ? '' : String(r[kPa] || '').trim(), date: kDa < 0 ? '' : date_(r[kDa]) });
  });

  return {
    emplacements: emplacements, categories: categories, personnes: CFG.PERSONNES, aliments: alimentsOut, courses: courses, mouvements: mouvements.slice(0, 200),
    personnesDep: CFG.PERSONNES_DEP, depenses: depenses_(), budget: num_(PropertiesService.getScriptProperties().getProperty('BUDGET_MENSUEL'))
  };
}

/* ---------------------------- Dépenses de courses ---------------------------- */

/** Crée l'onglet « Depenses » la première fois (colonnes : IdDepense, Date, Magasin, une par personne, Total). */
function ensureDepenses_() {
  var ss = ss_(), sh = ss.getSheetByName(CFG.TABS.depenses);
  if (sh) return sh;
  sh = ss.insertSheet(CFG.TABS.depenses);
  var headers = ['IdDepense', 'Date', 'Magasin'].concat(CFG.PERSONNES_DEP).concat(['Total']);
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.getRange('B2:B').setNumberFormat('dd/mm/yyyy');
  sh.getRange(2, 4, sh.getMaxRows() - 1, CFG.PERSONNES_DEP.length + 1).setNumberFormat('#,##0.00 "€"');
  return sh;
}

function depenses_() {
  ensureDepenses_();
  var t = readTable_(CFG.TABS.depenses);
  var kId = col_(t, ['iddepense', 'id']), kDa = col_(t, ['date']), kMa = col_(t, ['magasin']);
  var kP = CFG.PERSONNES_DEP.map(function (p) { return col_(t, [norm_(p)]); });
  var out = [];
  t.rows.forEach(function (r, i) {
    var parts = {}, total = 0;
    CFG.PERSONNES_DEP.forEach(function (p, j) { var v = kP[j] < 0 ? 0 : num_(r[kP[j]]); parts[p] = v; total += v; });
    var date = kDa < 0 ? '' : date_(r[kDa]);
    if (!date && !total) return;
    out.push({ id: (kId < 0 ? '' : String(r[kId] || '').trim()) || ('row' + (i + 2)), date: date, magasin: kMa < 0 ? '' : String(r[kMa] || '').trim(), parts: parts, total: Math.round(total * 100) / 100 });
  });
  out.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  return out;
}

function depenseParts_(p) {
  var parts = {}, total = 0;
  CFG.PERSONNES_DEP.forEach(function (n) {
    var v = Math.round(num_((p.parts || {})[n]) * 100) / 100;
    if (v < 0) throw new Error('Les montants ne peuvent pas être négatifs.');
    parts[n] = v; total += v;
  });
  if (!(total > 0)) throw new Error('Saisissez au moins un montant.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(p.date || ''))) throw new Error('Choisissez une date.');
  return { parts: parts, total: Math.round(total * 100) / 100 };
}

function writeDepenseRow_(sh, rowNum, t, id, p, v) {
  var vals = { iddepense: id, date: dateObj_(p.date), magasin: String(p.magasin || '').trim() || 'Courses', total: v.total };
  CFG.PERSONNES_DEP.forEach(function (n) { vals[norm_(n)] = v.parts[n]; });
  var row = [];
  for (var i = 0; i < t.lastCol; i++) row.push('');
  Object.keys(vals).forEach(function (k) { var c = col_(t, k === 'iddepense' ? ['iddepense', 'id'] : [k]); if (c >= 0) row[c] = vals[k]; });
  sh.getRange(rowNum, 1, 1, t.lastCol).setValues([row]);
}

function addDepense_(p) {
  var v = depenseParts_(p);
  ensureDepenses_();
  var t = readTable_(CFG.TABS.depenses);
  writeDepenseRow_(t.sh, Math.max(t.sh.getLastRow(), 1) + 1, t, Utilities.getUuid(), p, v);
}

function findDepenseRow_(t, id) {
  var kId = col_(t, ['iddepense', 'id']);
  for (var i = 0; i < t.rows.length; i++) {
    var rid = (kId < 0 ? '' : String(t.rows[i][kId] || '').trim()) || ('row' + (i + 2));
    if (rid === id) return i + 2;
  }
  return -1;
}

function updateDepense_(p) {
  var v = depenseParts_(p);
  ensureDepenses_();
  var t = readTable_(CFG.TABS.depenses), row = findDepenseRow_(t, p.id);
  if (row < 0) throw new Error('Dépense introuvable (déjà supprimée ?).');
  writeDepenseRow_(t.sh, row, t, p.id.indexOf('row') === 0 ? Utilities.getUuid() : p.id, p, v);
}

function deleteDepense_(p) {
  ensureDepenses_();
  var t = readTable_(CFG.TABS.depenses), row = findDepenseRow_(t, p.id);
  if (row < 0) throw new Error('Dépense introuvable (déjà supprimée ?).');
  t.sh.deleteRow(row);
}

function setBudget_(p) {
  var b = Math.max(0, Math.round(num_(p.budget) * 100) / 100);
  PropertiesService.getScriptProperties().setProperty('BUDGET_MENSUEL', String(b));
}

function stockAt_(aliment, emplacement) {
  var mv = readTable_(CFG.TABS.mouvements);
  var mAl = col_(mv, ['aliment']), mTy = col_(mv, ['type']), mQt = col_(mv, ['quantite']), mEm = col_(mv, ['emplacement']);
  var total = 0;
  mv.rows.forEach(function (r) {
    if (String(r[mAl] || '').trim() === aliment && String(r[mEm] || '').trim() === emplacement) {
      var q = num_(r[mQt]); total += (String(r[mTy] || '').trim() === 'Retrait' ? -q : q);
    }
  });
  return total;
}

/* ---------------------------- Écriture ---------------------------- */

function addMouvement_(p) {
  if (p.type !== 'Ajout' && p.type !== 'Retrait') throw new Error('Type de mouvement invalide.');
  var q = num_(p.quantite);
  if (!(q > 0)) throw new Error('La quantité doit être supérieure à zéro.');
  var st = state_();
  if (st.emplacements.indexOf(p.emplacement) < 0) throw new Error('Choisissez un emplacement.');

  if (p.nouvelAliment) {
    var nom = String(p.nouvelAliment.nom || '').trim();
    if (!nom) throw new Error("Donnez un nom à l'aliment.");
    if (st.aliments.some(function (a) { return normName_(a.nom) === normName_(nom); })) throw new Error('Cet aliment existe déjà : choisissez-le dans la liste.');
    var catName = String(p.nouvelAliment.categorie || '').trim();
    if (p.nouvelAliment.nouvelleCategorie) {
      if (!catName) throw new Error('Donnez un nom à la nouvelle catégorie.');
      var exist = st.categories.filter(function (c) { return normName_(c) === normName_(catName); })[0];
      if (exist) catName = exist; else addCategorie_({ nom: catName });
    } else if (st.categories.indexOf(catName) < 0) throw new Error('Choisissez une catégorie.');
    var al = readTable_(CFG.TABS.aliments);
    appendRow_(al, { nom: nom, categorie: catName, alerteactivee: false, seuilalerte: 1, unite: p.unite || '' }, { nom: ['nom', 'aliment'], categorie: ['categorie'], alerteactivee: ['alerteactivee', 'alerte'], seuilalerte: ['seuilalerte', 'seuildalerte', 'seuil'], unite: ['unite'] });
    p.aliment = nom;
  } else {
    if (!st.aliments.some(function (a) { return a.nom === p.aliment; })) throw new Error('Aliment introuvable.');
  }

  if (p.type === 'Retrait') {
    var dispo = stockAt_(p.aliment, p.emplacement);
    if (q > dispo + 1e-9) throw new Error(dispo <= 0 ? "Il n'y en a plus dans cet emplacement." : "Il n'y en a que " + dispo + ' dans cet emplacement.');
  }

  // Met à jour l'unité de l'aliment lors d'un ajout si elle a changé.
  if (p.type === 'Ajout' && p.unite !== undefined && !p.nouvelAliment) setCell_(CFG.TABS.aliments, ['nom', 'aliment'], p.aliment, ['unite'], String(p.unite || ''));

  var mv = readTable_(CFG.TABS.mouvements);
  appendRow_(mv, {
    date: dateObj_(p.date), aliment: p.aliment, type: p.type, quantite: q, emplacement: p.emplacement,
    personne: p.personne || '', note: p.note || '', idmouvement: Utilities.getUuid()
  }, { date: ['date'], aliment: ['aliment'], type: ['type'], quantite: ['quantite'], emplacement: ['emplacement'], personne: ['personne'], note: ['note'], idmouvement: ['idmouvement', 'id'] });
}

/* ---------------------------- Catégories ---------------------------- */

function catTable_() {
  var t = readTable_(CFG.TABS.categories);
  return { t: t, c: col_(t, ['nom', 'categorie', 'nomcategorie'], 0) };
}

function addCategorie_(p) {
  var nom = String(p.nom || '').trim();
  if (!nom) throw new Error('Donnez un nom à la catégorie.');
  var ct = catTable_();
  if (ct.t.rows.some(function (r) { return normName_(r[ct.c]) === normName_(nom); })) throw new Error('Cette catégorie existe déjà.');
  ct.t.sh.getRange(Math.max(ct.t.sh.getLastRow(), 1) + 1, ct.c + 1).setValue(nom);
}

function renameCategorie_(p) {
  var ancien = String(p.ancien || '').trim(), nouveau = String(p.nouveau || '').trim();
  if (!nouveau) throw new Error('Donnez un nom à la catégorie.');
  var ct = catTable_(), row = -1;
  ct.t.rows.forEach(function (r, i) {
    var v = String(r[ct.c] || '').trim();
    if (v === ancien) row = i + 2;
    else if (normName_(v) === normName_(nouveau)) throw new Error('Une autre catégorie porte déjà ce nom.');
  });
  if (row < 0) throw new Error('Catégorie introuvable.');
  ct.t.sh.getRange(row, ct.c + 1).setValue(nouveau);
  var al = readTable_(CFG.TABS.aliments), cc = col_(al, ['categorie']);
  if (cc >= 0 && al.rows.length) {
    var vals = al.rows.map(function (r) { return [String(r[cc] || '').trim() === ancien ? nouveau : r[cc]]; });
    al.sh.getRange(2, cc + 1, vals.length, 1).setValues(vals);
  }
}

function deleteCategorie_(p) {
  var nom = String(p.nom || '').trim();
  var al = readTable_(CFG.TABS.aliments), cc = col_(al, ['categorie']);
  var used = cc < 0 ? 0 : al.rows.filter(function (r) { return String(r[cc] || '').trim() === nom; }).length;
  if (used > 0) throw new Error('Cette catégorie contient encore ' + used + ' aliment' + (used > 1 ? 's' : '') + ' : changez-les de catégorie d’abord.');
  var ct = catTable_(), row = -1;
  ct.t.rows.forEach(function (r, i) { if (String(r[ct.c] || '').trim() === nom) row = i + 2; });
  if (row < 0) throw new Error('Catégorie introuvable.');
  ct.t.sh.deleteRow(row);
}

/* ---------------------------- Emplacements ---------------------------- */

function empTable_() {
  var t = readTable_(CFG.TABS.emplacements);
  return { t: t, c: col_(t, ['nom', 'emplacement', 'nomemplacement'], 0) };
}

function addEmplacement_(p) {
  var nom = String(p.nom || '').trim();
  if (!nom) throw new Error('Donnez un nom à l’emplacement.');
  var et = empTable_();
  if (et.t.rows.some(function (r) { return normName_(r[et.c]) === normName_(nom); })) throw new Error('Cet emplacement existe déjà.');
  et.t.sh.getRange(Math.max(et.t.sh.getLastRow(), 1) + 1, et.c + 1).setValue(nom);
}

function renameEmplacement_(p) {
  var ancien = String(p.ancien || '').trim(), nouveau = String(p.nouveau || '').trim();
  if (!nouveau) throw new Error('Donnez un nom à l’emplacement.');
  var et = empTable_(), row = -1;
  et.t.rows.forEach(function (r, i) {
    var v = String(r[et.c] || '').trim();
    if (v === ancien) row = i + 2;
    else if (normName_(v) === normName_(nouveau)) throw new Error('Un autre emplacement porte déjà ce nom.');
  });
  if (row < 0) throw new Error('Emplacement introuvable.');
  et.t.sh.getRange(row, et.c + 1).setValue(nouveau);
  // l'historique des mouvements suit le nouveau nom
  var mv = readTable_(CFG.TABS.mouvements), mc = col_(mv, ['emplacement']);
  if (mc >= 0 && mv.rows.length) {
    var vals = mv.rows.map(function (r) { return [String(r[mc] || '').trim() === ancien ? nouveau : r[mc]]; });
    mv.sh.getRange(2, mc + 1, vals.length, 1).setValues(vals);
  }
}

function deleteEmplacement_(p) {
  var nom = String(p.nom || '').trim();
  var st = state_();
  var used = st.aliments.filter(function (a) { return a.emplacements.some(function (e) { return e.nom === nom && e.qte > 0; }); }).length;
  if (used > 0) throw new Error('Cet emplacement contient encore ' + used + ' aliment' + (used > 1 ? 's' : '') + ' : retirez-' + (used > 1 ? 'les' : 'le') + ' d’abord.');
  if (st.emplacements.length <= 1) throw new Error('Gardez au moins un emplacement.');
  var et = empTable_(), row = -1;
  et.t.rows.forEach(function (r, i) { if (String(r[et.c] || '').trim() === nom) row = i + 2; });
  if (row < 0) throw new Error('Emplacement introuvable.');
  et.t.sh.deleteRow(row);
}

function clearStock_(p) {
  var dispo = stockAt_(p.aliment, p.emplacement);
  if (dispo <= 0) throw new Error('Rien à retirer ici.');
  addMouvement_({ type: 'Retrait', aliment: p.aliment, quantite: dispo, emplacement: p.emplacement, date: todayStr_(), personne: p.personne || '', note: 'Tout retiré' });
}

function setAlerte_(p) {
  var ok = setCell_(CFG.TABS.aliments, ['nom', 'aliment'], p.aliment, ['alerteactivee', 'alerte'], !!p.alerte);
  if (!ok) throw new Error('Aliment introuvable.');
  setCell_(CFG.TABS.aliments, ['nom', 'aliment'], p.aliment, ['seuilalerte', 'seuildalerte', 'seuil'], Math.max(0, num_(p.seuil)));
}

function addCourse_(p) {
  var art = String(p.article || '').trim();
  if (!art) throw new Error('Écrivez un article.');
  var co = readTable_(CFG.TABS.courses);
  var kAr = col_(co, ['article'], 0), kAc = col_(co, ['achete']);
  var dup = co.rows.some(function (r) { return normName_(r[kAr]) === normName_(art) && !(kAc >= 0 && bool_(r[kAc])); });
  if (dup) { var e = new Error('Cet article est déjà dans la liste.'); e.code = 'DUP'; throw e; }
  appendRow_(co, { idcourses: Utilities.getUuid(), article: art, achete: false, ajoutepar: p.ajoutePar || '', dateajout: dateObj_(todayStr_()) },
    { idcourses: ['idcourses', 'idcourse', 'id'], article: ['article'], achete: ['achete'], ajoutepar: ['ajoutepar'], dateajout: ['dateajout', 'datedajout', 'date'] });
}

function setAchete_(p) {
  var co = readTable_(CFG.TABS.courses);
  var kId = col_(co, ['idcourses', 'idcourse', 'id']), kAc = col_(co, ['achete']);
  if (kAc < 0) throw new Error('Colonne « Acheté » introuvable dans Courses.');
  for (var i = 0; i < co.rows.length; i++) {
    var id = kId < 0 ? '' : String(co.rows[i][kId] || '').trim();
    if ((id || ('row' + (i + 2))) === p.id) { co.sh.getRange(i + 2, kAc + 1).setValue(!!p.achete); return; }
  }
}

function deleteAliment_(p) {
  var st = state_();
  var a = st.aliments.filter(function (x) { return x.nom === p.aliment; })[0];
  if (!a) throw new Error('Aliment introuvable.');
  if (Math.abs(a.stock) > 1e-9) throw new Error('Il reste du stock : retirez-le avant de supprimer.');
  var al = readTable_(CFG.TABS.aliments), c = col_(al, ['nom', 'aliment'], 0);
  for (var i = al.rows.length - 1; i >= 0; i--) {
    if (String(al.rows[i][c] || '').trim() === p.aliment) { al.sh.deleteRow(i + 2); return; }
  }
}

/* ---------------------------- Utilitaires feuille ---------------------------- */

function ss_() { return SpreadsheetApp.openById(CFG.SHEET_ID); }

function norm_(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); }
function normName_(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }

function readTable_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Onglet introuvable : ' + name);
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return { sh: sh, headers: [], idx: {}, rows: [], lastCol: 0 };
  var values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  var idx = {};
  values[0].forEach(function (h, i) { var k = norm_(h); if (k && !(k in idx)) idx[k] = i; });
  return { sh: sh, headers: values[0], idx: idx, rows: values.slice(1), lastCol: lastCol };
}

/** Trouve l'index d'une colonne parmi plusieurs noms possibles (insensible aux accents, espaces, tirets bas). */
function col_(t, aliases, fallback) {
  for (var i = 0; i < aliases.length; i++) { if (aliases[i] in t.idx) return t.idx[aliases[i]]; }
  return fallback === undefined ? -1 : fallback;
}

function appendRow_(t, obj, map) {
  var row = [];
  for (var i = 0; i < t.lastCol; i++) row.push('');
  Object.keys(obj).forEach(function (k) {
    var c = col_(t, map[k] || [k]);
    if (c >= 0) row[c] = obj[k];
  });
  t.sh.getRange(t.sh.getLastRow() + 1, 1, 1, t.lastCol).setValues([row]);
}

function setCell_(tab, keyAliases, keyValue, colAliases, value) {
  var t = readTable_(tab), k = col_(t, keyAliases, 0), c = col_(t, colAliases);
  if (c < 0) return false;
  for (var i = 0; i < t.rows.length; i++) {
    if (String(t.rows[i][k] || '').trim() === keyValue) { t.sh.getRange(i + 2, c + 1).setValue(value); return true; }
  }
  return false;
}

function bool_(v) { return v === true || ['TRUE', 'VRAI', 'OUI', 'YES', 'Y', '1'].indexOf(String(v).toUpperCase()) >= 0; }
function num_(v) { if (typeof v === 'number') return v; var n = parseFloat(String(v || '').replace(',', '.')); return isNaN(n) ? 0 : n; }
function todayStr_() { return Utilities.formatDate(new Date(), CFG.TZ, 'yyyy-MM-dd'); }
function dateObj_(s) { return Utilities.parseDate((s || todayStr_()) + ' 12:00', CFG.TZ, 'yyyy-MM-dd HH:mm'); }
function date_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, CFG.TZ, 'yyyy-MM-dd');
  var s = String(v || '').trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return s;
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ---------------------------- Aides à lancer à la main ---------------------------- */

/** À exécuter une fois dans l'éditeur : vérifie que les onglets et colonnes sont reconnus (voir « Journal d'exécution »). */
function verifierFeuilles() {
  var need = {
    Emplacements: [['nom', 'emplacement']], Categories: [['nom', 'categorie']],
    Aliments: [['nom', 'aliment'], ['categorie'], ['alerteactivee', 'alerte'], ['seuilalerte', 'seuildalerte', 'seuil'], ['unite']],
    Mouvements: [['date'], ['aliment'], ['type'], ['quantite'], ['emplacement'], ['personne'], ['note'], ['idmouvement', 'id']],
    Courses: [['idcourses', 'idcourse', 'id'], ['article'], ['achete'], ['ajoutepar'], ['dateajout', 'datedajout', 'date']]
  };
  Object.keys(need).forEach(function (tab) {
    try {
      var t = readTable_(tab);
      Logger.log('✔ ' + tab + ' — en-têtes : ' + t.headers.join(' | ') + ' — ' + t.rows.length + ' ligne(s)');
      need[tab].forEach(function (al) { if (col_(t, al) < 0) Logger.log('   ✖ colonne manquante (une de) : ' + al.join(' / ')); });
    } catch (e) { Logger.log('✖ ' + tab + ' : ' + e.message); }
  });
  Logger.log('Code d’accès défini : ' + (PropertiesService.getScriptProperties().getProperty('ACCESS_CODE') ? 'oui' : 'NON'));
}
