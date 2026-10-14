(function () {
  'use strict';

  var CFG = window.CONFIG || {};
  var DEMO = !CFG.API_URL;

  /* ============================== Outils ============================== */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var enc = encodeURIComponent;
  var norm = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); };
  var ls = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var today = function () { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  var fmtNum = function (n) { return String(Math.round(n * 100) / 100).replace('.', ','); };
  var INVAR = ['g', 'kg', 'l', 'L', 'ml', 'cl'];
  function unitLabel(q, u) {
    if (!u) return '';
    if (INVAR.indexOf(u) >= 0) return u;
    if (u === 'bocal' || u === 'bocaux') return q > 1 ? 'bocaux' : 'bocal';
    var plural = /[sx]$/.test(u) ? u : u + 's';
    var sing = /s$/.test(u) ? u.slice(0, -1) : u;
    return q > 1 ? plural : sing;
  }
  var qty = function (q, u) { return fmtNum(q) + (u ? ' ' + unitLabel(q, u) : ''); };
  function fmtDate(s) {
    var d = new Date(s + 'T12:00:00'); if (isNaN(d)) return s;
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function dayLabel(s) {
    if (s === today()) return "Aujourd'hui";
    var y = new Date(); y.setDate(y.getDate() - 1); y.setMinutes(y.getMinutes() - y.getTimezoneOffset());
    if (s === y.toISOString().slice(0, 10)) return 'Hier';
    return fmtDate(s);
  }

  var CAT = {
    'VIANDE': ['🥩', '#fde4e1'], 'FROMAGE': ['🧀', '#fdf0c9'], 'POISSON': ['🐟', '#dcecfb'], 'DESSERT': ['🍰', '#fbe3f0'],
    'PLAT CUISINE': ['🍲', '#fde9d4'], 'LEGUMES': ['🥦', '#dff3dc'], 'INDETERMINE': ['📦', '#e8edf2'], 'PATE ET BASES': ['🥟', '#f6ecd6'],
    'FRUITS': ['🍓', '#fde0e4'], 'LAITAGE': ['🥛', '#eaf1fb'], 'BOULANGERIE': ['🥖', '#f8e8cf'], 'MEDICAL': ['🧊', '#e1f1f8']
  };
  var catInfo = function (c) { return CAT[norm(c).toUpperCase()] || ['🍽️', '#e8f1f7']; };
  var niceCat = function (c) { c = String(c || '').trim().toLowerCase(); return c.charAt(0).toUpperCase() + c.slice(1); };
  var UNITES = ['portions', 'sachets', 'pièces', 'boîtes', 'barquettes', 'plats', 'plaquettes', 'bocaux', 'pots', 'bouteilles', 'g', 'kg', 'L'];

  var P = {
    snow: '<path d="M3 11 12 4l9 7"/><path d="M5 9.5V20h14V9.5"/><path d="M8 17h8"/><path d="M9 17v-3.5h2V17M13 17v-2.5h2.2V17"/>',
    home: '<path d="M3 11 12 3l9 8v10h-6v-6H9v6H3V11z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4l2-2zM10 21h4"/>',
    dots: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
    back: '<path d="M15 5l-7 7 7 7"/>', chev: '<path d="M9 5l7 7-7 7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    alert: '<path d="M12 3 2 20h20L12 3zM12 10v4.5M12 17.5v.01"/>',
    basket: '<path d="M3 9h18l-2 11H5L3 9zM8 9l4-6 4 6"/>',
    check: '<path d="M5 12l5 5 9-10"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    filter: '<path d="M3 6h18M6 12h12M10 18h4"/>',
    chest: '<path d="M3 11 12 4l9 7"/><path d="M5 9.5V20h14V9.5"/><path d="M8 17h8"/><path d="M9 17v-3.5h2V17M13 17v-2.5h2.2V17"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14-4M4 4v4h4M4 13a8 8 0 0 0 14 4M20 20v-4h-4"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    euro: '<path d="M18 7a7 7 0 1 0 0 10M4 10h9M4 14h9"/>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'
  };
  var ico = function (n, c) { return '<svg class="ic ' + (c || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>'; };

  var SCENE = '<svg class="scene-svg" viewBox="0 0 320 104" preserveAspectRatio="xMinYMax slice" aria-hidden="true"><rect x="0" y="92" width="320" height="12" fill="#e6ebe2"/><rect x="0" y="88" width="150" height="5" rx="2" fill="#c9b79c"/><rect x="10" y="55" width="13" height="6" rx="1.5" fill="#9cbfa5"/><rect x="8" y="60" width="17" height="28" rx="5" fill="#cfdcc9"/><rect x="11" y="70.64" width="11" height="8.4" rx="2" fill="#fff" opacity=".8"/><rect x="30" y="49" width="11" height="6" rx="1.5" fill="#c9a77e"/><rect x="28" y="54" width="15" height="34" rx="5" fill="#ead9bf"/><rect x="31" y="66.92" width="9" height="10.2" rx="2" fill="#fff" opacity=".8"/><rect x="47" y="71" width="8" height="4" rx="2" fill="#cf8c68"/><rect x="89" y="71" width="8" height="4" rx="2" fill="#cf8c68"/><rect x="52" y="64" width="40" height="24" rx="5" fill="#e4a98a"/><path d="M50 64a22 11 0 0 1 44 0z" fill="#cf8c68"/><circle cx="72" cy="51" r="3" fill="#e4a98a"/><path d="M58 74h28" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/><path d="M60 40c-4-5 4-7 0-12M67 42c-4-5 4-7 0-12M74 40c-4-5 4-7 0-12" fill="none" stroke="#cbd8cd" stroke-width="2" stroke-linecap="round"/><ellipse cx="122" cy="85" rx="22" ry="4.5" fill="#fff" stroke="#d9e2d8"/><ellipse cx="122" cy="84" rx="14" ry="2.6" fill="#f1f4ee"/><path d="M109 83c1-10 8-13 13-13s12 3 13 13z" fill="#e6b27a"/><circle cx="117" cy="77" r="2.6" fill="#8fb08a"/><circle cx="127" cy="78" r="2.2" fill="#8fb08a"/><rect x="132" y="72" width="14" height="16" rx="3" fill="#c9b79c"/><path d="M139 72c-2-10-8-14-14-15 2 7 7 12 14 15zM139 72c1-12 6-17 12-19-1 9-5 15-12 19z" fill="#7fa38a"/></svg>';

  /* ============================== État ============================== */
  var data = ls.get('cg_data', null);
  var loading = false, loadError = '', pending = 0, dirty = false;
  var me = ls.get('cg_me', '');
  var UI = { stockQ: '', filt: { emp: '', cat: '' }, showAll: false, showBought: false, low: false, cTab: 'buy', month: '', year: 0, synthFrom: 'more' };
  var EXP = { id: null };
  var F = null;
  var routeChanged = true;
  var sheetResolve = null;

  /* ============================== API ============================== */
  async function api(action, payload) {
    if (DEMO) return window.DemoApi.call(action, payload || {});
    var token = ls.get('cg_token', '');
    var res;
    try {
      res = await fetch(CFG.API_URL, {
        method: 'POST', redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({ action: action, token: token }, payload || {}))
      });
    } catch (e) { var ne = new Error('Pas de connexion. Réessayez dans un instant.'); ne.code = 'NET'; throw ne; }
    var json;
    try { json = await res.json(); } catch (e) { throw new Error('Réponse inattendue du serveur.'); }
    if (!json.ok) { var er = new Error(json.error || 'Erreur'); er.code = json.code || ''; throw er; }
    return json;
  }

  async function load(silent) {
    if (!silent && !data) { loading = true; render(); }
    try {
      var r = await api('bootstrap');
      if (pending === 0) { data = r.data; ls.set('cg_data', data); }
      loadError = '';
    } catch (e) {
      if (e.code === 'AUTH') { ls.set('cg_token', ''); data = null; ls.set('cg_data', null); gateError = e.message; }
      loadError = e.message;
    }
    loading = false; render();
  }

  async function write(action, payload) {
    pending++;
    try {
      var r = await api(action, payload);
      if (r.data) { if (pending === 1) { data = r.data; ls.set('cg_data', data); } else { dirty = true; } }
      return r;
    } finally {
      pending--;
      if (pending === 0 && dirty) { dirty = false; load(true); }
    }
  }

  /* ============================== Données dérivées ============================== */
  var findAl = function (nom) { return data.aliments.filter(function (a) { return a.nom === nom; })[0]; };
  var byName = function (a, b) { return a.nom.localeCompare(b.nom, 'fr'); };
  var lowItems = function () { return data.aliments.filter(function (a) { return a.alerte && a.stock <= a.seuil; }).sort(function (a, b) { return a.stock - b.stock || byName(a, b); }); };
  var toBuy = function () { return data.courses.filter(function (c) { return !c.achete; }); };
  var inCourses = function (nom) { return data.courses.some(function (c) { return !c.achete && norm(c.article) === norm(nom); }); };
  var placeCount = function (emp) { return data.aliments.filter(function (a) { return a.emplacements.some(function (e) { return e.nom === emp && e.qte > 0; }); }).length; };
  var inStock = function (a) { return a.stock > 0 || a.emplacements.some(function (e) { return e.qte > 0; }); };

  /* ----- dépenses de courses ----- */
  var persDep = function () { return data.personnesDep || ['Sara', 'Jordana']; };
  var eur = function (n) { return (Math.round(n * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; };
  var nb = function (n) { return (Math.round(n * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var pnum = function (v) { var n = Number(String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.')); return isNaN(n) ? 0 : n; };
  var curMonth = function () { return today().slice(0, 7); };
  var depList = function () { return data.depenses || []; };
  var MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var MONTHS_S = ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
  function monthLabel(ym) { var m = MONTHS[Number(ym.slice(5, 7)) - 1]; return m.charAt(0).toUpperCase() + m.slice(1) + ' ' + ym.slice(0, 4); }
  function shiftMonth(ym, d) { var y = Number(ym.slice(0, 4)), m = Number(ym.slice(5, 7)) - 1 + d; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return y + '-' + ('0' + (m + 1)).slice(-2); }
  function sumDep(list) {
    var by = {}; persDep().forEach(function (p) { by[p] = 0; });
    var total = 0;
    list.forEach(function (d) { persDep().forEach(function (p) { var v = (d.parts && d.parts[p]) || 0; by[p] += v; total += v; }); });
    return { by: by, total: total };
  }

  /* ============================== Composants ============================== */
  function thumb(a, cls) {
    var ci = catInfo(a.categorie);
    if (a.photo) return '<div class="thumb ' + (cls || '') + '"><img src="' + esc(a.photo) + '" alt="" loading="lazy"></div>';
    return '<div class="thumb ' + (cls || '') + '" style="--c:' + ci[1] + '">' + ci[0] + '</div>';
  }
  function header(title, sub, o) {
    o = o || {};
    return '<header class="top">' + (o.back ? '<button class="icon-btn" data-act="back" aria-label="Retour">' + ico('back') + '</button>' : '') +
      '<div class="top-t"><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>' + (o.right || '') + '</header>';
  }
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }
  function openSheet(html) { var s = $('#sheet'); s.innerHTML = '<div class="sheet-bg" data-act="closesheet"></div><div class="sheet-c">' + html + '</div>'; s.classList.add('open'); }
  function closeSheet() { $('#sheet').classList.remove('open'); if (sheetResolve) { var r = sheetResolve; sheetResolve = null; r(false); } }
  function confirmSheet(title, text, ok, danger) {
    return new Promise(function (resolve) {
      sheetResolve = resolve;
      openSheet('<h3>' + esc(title) + '</h3><p>' + esc(text) + '</p><div class="btn-row"><button class="btn ghost sm" data-act="sheet-cancel">Annuler</button><button class="btn sm ' + (danger ? 'ret' : '') + '" data-act="sheet-ok">' + esc(ok) + '</button></div>');
    });
  }
  function foodChips(a, empFilter) {
    var list = a.emplacements.filter(function (e) { return e.qte > 0 && (!empFilter || e.nom === empFilter); });
    var out = [];
    if (list.length !== 1) out.push('<span class="chip">' + esc(qty(empFilter ? list.reduce(function (s, e) { return s + e.qte; }, 0) : a.stock, a.unite)) + '</span>');
    list.forEach(function (e) {
      if (list.length === 1) out.push('<span class="chip">' + esc(qty(e.qte, a.unite)) + '</span>');
      out.push('<span class="chip loc">' + ico('chest') + esc(e.nom) + (list.length > 1 ? ' · ' + fmtNum(e.qte) : '') + '</span>');
    });
    return '<div class="chips">' + out.join('') + '</div>';
  }
  function foodRow(a, empFilter) {
    return '<a class="row" href="#/aliment/' + enc(a.nom) + '">' + thumb(a) + '<div class="row-b"><div class="row-t">' + esc(a.nom) + '</div>' + foodChips(a, empFilter) + '</div>' + ico('chev') + '</a>';
  }

  /* ============================== Vues ============================== */
  function viewLoading() { return header('Mon garde-manger', 'Chargement…') + '<div class="skel"></div><div class="skel"></div><div class="skel"></div>'; }
  function viewError() {
    return header('Oups', 'Impossible de charger les données') + '<p class="err">' + esc(loadError || 'Erreur inconnue.') + '</p><button class="btn" data-act="refresh">' + ico('refresh') + ' Réessayer</button>';
  }
  var gateError = '';
  function viewGate() {
    return '<header class="hero">' + ico('snow', 'hero-ic') + '<div><h1>Mon garde-manger</h1><p>Première connexion</p></div></header>' +
      '<form data-form="token" class="card pad"><div class="field"><label for="g-code">Code d’accès</label>' +
      '<input class="inp" id="g-code" type="password" autocomplete="current-password" placeholder="Le code choisi dans Apps Script" required></div>' +
      (gateError ? '<p class="err">' + esc(gateError) + '</p>' : '') +
      '<button class="btn" type="submit">Entrer</button><p class="hint">Ce code reste enregistré sur cet appareil uniquement.</p></form>';
  }

  function budgetTileText() {
    var tot = sumDep(depList().filter(function (d) { return d.date.slice(0, 7) === curMonth(); })).total, b = data.budget || 0;
    if (b > 0) return tot <= b ? 'reste ' + eur(b - tot).replace(',00', '') : 'budget dépassé';
    return eur(tot).replace(',00', '') + ' ce mois-ci';
  }

  function viewHome() {
    var low = lowItems().length, buy = toBuy().length;
    var places = data.emplacements.map(function (n) {
      return '<a class="place-row" href="#/emplacement/' + enc(n) + '">' + ico('chest') + '<b>' + esc(n) + '</b><span class="pill">' + placeCount(n) + '</span><span class="lbl">aliments</span>' + ico('chev') + '</a>';
    }).join('');
    return (DEMO ? '<div class="demo-flag">Mode démo : données fictives, enregistrées seulement dans ce navigateur.</div>' : '') +
      (loadError && data ? '<div class="offline">Hors connexion : affichage de la dernière version enregistrée.</div>' : '') +
      '<header class="hero">' + ico('snow', 'hero-ic') + '<div><h1>Mon garde-manger</h1><p>Tout votre stock au bout des doigts</p></div></header>' +
      '<a class="search" href="#/stock?focus=1">' + ico('search') + '<span>Rechercher un aliment</span></a>' +
      '<div class="scene">' + SCENE + '<p class="hand">De bons repas<br>toute l’année ! ♡</p></div>' +
      '<div class="bigs one">' +
      '<a class="bigbtn wide teal" href="#/mouvement"><span class="bi">' + ico('snow') + '</span><span class="bt"><b>Enregistrer un mouvement</b><small>Ajouter ou retirer un aliment</small></span></a></div>' +
      '<div class="tiles four">' +
      '<a class="tile sky" href="#/stock"><span class="ti">' + ico('list') + '</span><b>Voir le stock</b><small>Tous les aliments</small></a>' +
      '<a class="tile amber" href="#/stock?low=1">' + (low ? '<span class="badge">' + low + '</span>' : '') + '<span class="ti">' + ico('alert') + '</span><b>Stock faible</b><small>À surveiller</small></a>' +
      '<a class="tile lav" href="#/courses">' + (buy ? '<span class="badge">' + buy + '</span>' : '') + '<span class="ti">' + ico('basket') + '</span><b>À acheter</b><small>Ma liste</small></a>' +
      '<a class="tile mint" href="#/courses?tab=budget"><span class="ti">' + ico('euro') + '</span><b>Budget courses</b><small>' + esc(budgetTileText()) + '</small></a></div>' +
      '<h2 class="sec">' + ico('chest') + 'Mes emplacements</h2><p class="sub">' + data.emplacements.length + ' espaces, un seul objectif : se régaler !</p>' +
      '<div class="card list">' + places + '</div>';
  }

  function stockItems() {
    var q = norm(UI.stockQ), f = UI.filt;
    return data.aliments.filter(function (a) {
      if (!UI.showAll && !inStock(a)) return false;
      if (UI.showAll && inStock(a)) { /* garde tout */ }
      if (q && norm(a.nom).indexOf(q) < 0) return false;
      if (f.cat && a.categorie !== f.cat) return false;
      if (f.emp && !a.emplacements.some(function (e) { return e.nom === f.emp && e.qte > 0; })) return false;
      return true;
    }).sort(byName);
  }
  function stockListHtml() {
    var items = stockItems(), zero = data.aliments.filter(function (a) { return !inStock(a); }).length;
    var html = items.length ? '<div class="rows">' + items.map(function (a) { return foodRow(a, UI.filt.emp); }).join('') + '</div>'
      : '<div class="empty"><div class="big">🧊</div>Aucun aliment ne correspond.</div>';
    if (zero) html += '<button class="more-link" data-act="showall">' + (UI.showAll ? 'Masquer les aliments à zéro' : 'Voir aussi les aliments à zéro (' + zero + ')') + '</button>';
    return html;
  }
  function viewStock(p) {
    var active = (UI.filt.emp ? 1 : 0) + (UI.filt.cat ? 1 : 0);
    var n = stockItems().length, lowN = lowItems().length;
    var seg = '<div class="seg2"><button data-act="setlow" data-low="0" class="' + (!UI.low ? 'on' : '') + '">Tous</button>' +
      '<button data-act="setlow" data-low="1" class="warn ' + (UI.low ? 'on' : '') + '">Stock faible <span class="cnt">' + lowN + '</span></button></div>';
    if (UI.low) return header('Stock', 'Tous vos aliments, bien rangés', { back: true }) + seg + lowBody();
    return header('Stock', 'Tous vos aliments, bien rangés', { back: true }) + seg +
      '<div class="search">' + ico('search') + '<input id="stock-q" type="search" placeholder="Rechercher un aliment" value="' + esc(UI.stockQ) + '" autocomplete="off"></div>' +
      '<div class="resline"><span id="stock-count">' + n + ' résultat' + (n > 1 ? 's' : '') + '</span><button class="pillbtn" data-act="filter">' + ico('filter') + 'Filtre' + (active ? ' (' + active + ')' : '') + '</button></div>' +
      '<div id="stock-list">' + stockListHtml() + '</div>';
  }

  function viewPlace(nom) {
    if (data.emplacements.indexOf(nom) < 0) return notFound();
    var items = data.aliments.filter(function (a) { return a.emplacements.some(function (e) { return e.nom === nom && e.qte > 0; }); }).sort(byName);
    var rows = items.map(function (a) {
      var e = a.emplacements.filter(function (x) { return x.nom === nom; })[0];
      return '<div class="row">' + '<a href="#/aliment/' + enc(a.nom) + '">' + thumb(a, 'sm') + '</a><div class="row-b"><a class="row-t" style="display:block" href="#/aliment/' + enc(a.nom) + '">' + esc(a.nom) + '</a>' +
        '<div class="chips"><span class="chip">' + esc(qty(e.qte, a.unite)) + '</span></div>' +
        '<div class="mini-actions"><a class="mini" href="#/mouvement?type=Retrait&aliment=' + enc(a.nom) + '&emp=' + enc(nom) + '">Retirer</a>' +
        '<button class="mini red" data-act="clear" data-nom="' + esc(a.nom) + '" data-emp="' + esc(nom) + '">Tout retirer</button></div></div></div>';
    }).join('');
    return header(nom, items.length + ' aliment' + (items.length > 1 ? 's' : '') + ' dans cet emplacement', { back: true }) +
      (items.length ? '<div class="rows">' + rows + '</div>' : '<div class="empty"><div class="big">❄️</div>Cet emplacement est vide.</div>') +
      '<div class="btn-row"><a class="btn ghost sm" href="#/mouvement?type=Ajout&emp=' + enc(nom) + '">' + ico('plus') + 'Ajouter ici</a></div>';
  }

  function notFound() { return header('Introuvable', '', { back: true }) + '<div class="empty"><div class="big">🤔</div>Cet élément n’existe plus.</div>'; }

  function viewFood(nom) {
    var a = findAl(nom); if (!a) return notFound();
    var emps = a.emplacements.filter(function (e) { return e.qte > 0; });
    var where = emps.length ? '<div class="card list">' + emps.map(function (e) {
      return '<div class="place-row" style="flex-wrap:wrap">' + ico('chest') + '<b>' + esc(e.nom) + '</b><span class="chip">' + esc(qty(e.qte, a.unite)) + '</span>' +
        '<div class="mini-actions" style="width:100%;margin:2px 0 0 34px"><a class="mini" href="#/mouvement?type=Retrait&aliment=' + enc(a.nom) + '&emp=' + enc(e.nom) + '">Retirer</a>' +
        '<button class="mini red" data-act="clear" data-nom="' + esc(a.nom) + '" data-emp="' + esc(e.nom) + '">Tout retirer</button></div></div>';
    }).join('') + '</div>' : '<div class="card pad empty" style="padding:18px">Plus en stock.</div>';
    var seuilUnit = a.unite ? ' ' + unitLabel(2, a.unite) : '';
    return header(a.nom, niceCat(a.categorie), { back: true }) +
      '<div class="card pad" style="display:flex;gap:14px;align-items:center;margin-bottom:14px">' + thumb(a, 'lg') +
      '<div><div class="sub" style="margin:0">En stock au total</div><div style="font-size:26px;font-weight:800">' + esc(qty(a.stock, a.unite)) + '</div></div></div>' +
      '<div class="btn-row" style="margin-top:0"><a class="btn sm" href="#/mouvement?type=Ajout&aliment=' + enc(a.nom) + '">' + ico('plus') + 'Ajouter</a>' +
      '<a class="btn sm ret" href="#/mouvement?type=Retrait&aliment=' + enc(a.nom) + '">' + ico('minus') + 'Retirer</a></div>' +
      '<h2 class="sec">' + ico('chest') + 'Où est-il ?</h2><div style="height:8px"></div>' + where +
      '<div class="card pad alert-panel" style="margin-top:16px"><div class="head">' + ico('bell') + '<div style="flex:1"><b>Alerte stock faible</b><div class="sub" style="margin:0">Gérer l’alerte pour cet aliment</div></div>' +
      '<label class="switch"><input type="checkbox" data-alert-toggle="' + esc(a.nom) + '" ' + (a.alerte ? 'checked' : '') + '><i></i></label></div>' +
      (a.alerte ? '<div class="seuil">Seuil d’alerte : <input type="number" min="0" step="any" inputmode="decimal" data-alert-seuil="' + esc(a.nom) + '" value="' + esc(a.seuil) + '">' + esc(seuilUnit.trim()) + '</div>' +
        '<p class="hint">Cet aliment apparaîtra dans « Stock faible » quand la quantité sera inférieure ou égale à ' + esc(qty(a.seuil, a.unite)) + '.</p>' : '') + '</div>' +
      '<div class="stack" style="margin-top:16px">' +
      '<button class="btn ghost sm" data-act="addcourse" data-nom="' + esc(a.nom) + '"' + (inCourses(a.nom) ? ' disabled' : '') + '>' + ico('basket') + (inCourses(a.nom) ? 'Déjà dans la liste de courses' : 'Ajouter à la liste de courses') + '</button>' +
      '<a class="btn ghost sm" href="#/historique/' + enc(a.nom) + '">' + ico('clock') + 'Voir les mouvements</a>' +
      (!inStock(a) ? '<button class="btn danger sm" data-act="delete-aliment" data-nom="' + esc(a.nom) + '">' + ico('trash') + 'Supprimer cet aliment</button>' : '') + '</div>';
  }

  function lowText(a) { return a.stock <= 0 ? 'Rupture de stock' : 'Il reste ' + qty(a.stock, a.unite); }
  function todoRow(c) {
    return '<div class="todo' + (c.achete ? ' bought' : '') + '" data-row="' + esc(c.id) + '"><button class="circle' + (c.achete ? ' on' : '') + '" data-act="' + (c.achete ? 'unachete' : 'achete') + '" data-id="' + esc(c.id) + '" aria-label="' + (c.achete ? 'Remettre dans la liste' : 'Marquer comme acheté') + '">' + (c.achete ? ico('check') : '') + '</button>' +
      '<span class="name">' + esc(c.article) + '</span></div>';
  }
  function lowBody() {
    var low = lowItems(), buy = toBuy();
    var rows = low.map(function (a) {
      var on = inCourses(a.nom);
      return '<div class="row"><a href="#/aliment/' + enc(a.nom) + '">' + thumb(a) + '</a><a class="row-b" href="#/aliment/' + enc(a.nom) + '"><div class="row-t">' + esc(a.nom) + '</div><div class="row-s low">' + esc(lowText(a)) + '</div></a>' +
        '<button class="round-btn' + (on ? ' on' : '') + '" data-act="addcourse" data-nom="' + esc(a.nom) + '" aria-label="Ajouter aux courses"' + (on ? ' disabled' : '') + '>' + ico(on ? 'check' : 'basket') + '</button></div>';
    }).join('');
    return (low.length ? '<div class="rows">' + rows + '</div>' : '<div class="empty"><div class="big">🎉</div>Tout va bien, aucun stock faible.<p class="hint">Activez l’alerte sur un aliment depuis sa fiche.</p></div>') +
      '<div class="lav-card"><div class="head">' + ico('basket') + '<div><h3>À acheter</h3><p>Votre prochaine liste de courses</p></div></div>' +
      (buy.length ? '<div class="card list">' + buy.slice(0, 5).map(todoRow).join('') + '</div>' : '<p class="hint" style="margin:0 0 4px">Rien à acheter pour le moment.</p>') +
      '<a class="more-link" style="color:#4a3896" href="#/courses">' + (buy.length > 5 ? 'Voir les ' + buy.length + ' articles' : 'Ouvrir la liste de courses') + '</a></div>';
  }

  function viewCourses() {
    var buy = toBuy();
    var seg = '<div class="seg2"><button data-act="ctab" data-tab="buy" class="' + (UI.cTab === 'buy' ? 'on' : '') + '">À acheter <span class="cnt">' + buy.length + '</span></button>' +
      '<button data-act="ctab" data-tab="budget" class="' + (UI.cTab === 'budget' ? 'on' : '') + '">Budget</button></div>';
    return header('Courses', 'Liste et budget du mois', { back: true }) + seg + (UI.cTab === 'budget' ? budgetBody() : buyBody());
  }

  function budgetBody() {
    var ym = UI.month || curMonth(), list = depList().filter(function (d) { return d.date.slice(0, 7) === ym; });
    var s = sumDep(list), b = data.budget || 0;
    var budgetBlock;
    if (b > 0) {
      var pct = Math.min(100, Math.round(s.total / b * 100)), over = s.total > b;
      budgetBlock = '<div class="bar"><i class="' + (over ? 'over' : '') + '" style="width:' + pct + '%"></i></div><div class="ln"><span>Budget : ' + esc(eur(b).replace(',00', '')) + '</span><span>' +
        (over ? 'Dépassé de ' + esc(eur(s.total - b)) : 'Reste ' + esc(eur(b - s.total))) + '</span></div>';
    } else budgetBlock = '<button class="lnk" style="padding-top:6px" data-act="setbudget">Définir un budget mensuel' + ico('chev') + '</button>';
    var who = persDep().map(function (p) { return '<div class="card"><small>Payé par ' + esc(p) + '</small><b>' + esc(eur(s.by[p])) + '</b></div>'; }).join('');
    var rows = list.map(function (d) {
      var parts = persDep().filter(function (p) { return (d.parts[p] || 0) > 0; });
      var who2 = parts.length > 1 ? parts.map(function (p) { return esc(p) + ' ' + esc(eur(d.parts[p])); }).join(' · ') : esc(parts[0] || '');
      return '<div class="exp"><div class="ed">' + ico('basket') + '</div><div class="eb"><b>' + esc(d.magasin || 'Courses') + '</b><small>' + esc(fmtDate(d.date)) + ' · ' + who2 + '</small></div>' +
        '<div class="am">' + esc(eur(d.total)) + '</div><button class="edit" data-act="expense-edit" data-id="' + esc(d.id) + '" aria-label="Modifier la dépense">' + ico('pencil') + '</button></div>';
    }).join('');
    return '<div class="month"><button class="icon-btn" data-act="monthprev" aria-label="Mois précédent">' + ico('back') + '</button><b>' + esc(monthLabel(ym)) + '</b>' +
      '<button class="icon-btn" data-act="monthnext" aria-label="Mois suivant"' + (ym >= curMonth() ? ' disabled' : '') + '>' + ico('chev') + '</button></div>' +
      '<div class="card bud"><div class="lbl">Dépensé ce mois-ci</div><div class="tot">' + esc(eur(s.total)) + '</div>' + budgetBlock + '</div>' +
      '<div class="who" style="grid-template-columns:repeat(' + persDep().length + ',1fr)">' + who + '</div>' +
      '<button class="btn" data-act="expense-add">' + ico('plus') + 'Ajouter une dépense</button>' +
      '<a class="lnk" href="#/synthese?from=courses">Voir la synthèse annuelle' + ico('chev') + '</a>' +
      '<div class="day">Dépenses du mois</div>' +
      (list.length ? '<div class="card list">' + rows + '</div>' : '<div class="empty"><div class="big">🧾</div>Aucune dépense ce mois-ci.</div>');
  }

  function viewSynth() {
    var y = UI.year || Number(today().slice(0, 4)), curY = Number(today().slice(0, 4)), curM = Number(today().slice(5, 7));
    var list = depList().filter(function (d) { return Number(d.date.slice(0, 4)) === y; });
    var tot = sumDep(list), elapsed = y === curY ? curM : 12;
    var cards = persDep().map(function (p) { return '<div class="card"><small>' + esc(p) + '</small><b>' + esc(eur(tot.by[p])) + '</b></div>'; }).join('');
    var rows = '';
    for (var m = 1; m <= 12; m++) {
      var ym = y + '-' + ('0' + m).slice(-2), s = sumDep(list.filter(function (d) { return d.date.slice(0, 7) === ym; })), fut = y > curY || (y === curY && m > curM);
      rows += '<div class="trow' + (fut ? ' mut' : '') + '"><span>' + MONTHS_S[m - 1] + '</span>' +
        persDep().map(function (p) { return '<span>' + (fut ? '—' : nb(s.by[p])) + '</span>'; }).join('') + '<span class="tt">' + (fut ? '—' : nb(s.total)) + '</span></div>';
    }
    var cols = 'grid-template-columns:1.05fr ' + persDep().map(function () { return '1fr'; }).join(' ') + ' 1fr';
    return header('Synthèse des dépenses', 'Courses · à titre indicatif', { back: true }) +
      '<div class="month"><button class="icon-btn" data-act="yearprev" aria-label="Année précédente">' + ico('back') + '</button><b>' + y + '</b>' +
      '<button class="icon-btn" data-act="yearnext" aria-label="Année suivante"' + (y >= curY ? ' disabled' : '') + '>' + ico('chev') + '</button></div>' +
      '<div class="card bud"><div class="lbl">Total dépensé en ' + y + '</div><div class="tot">' + esc(eur(tot.total)) + '</div>' +
      (tot.total > 0 ? '<div class="lbl">soit ' + esc(eur(tot.total / elapsed)) + ' par mois en moyenne</div>' : '') + '</div>' +
      '<div class="who" style="grid-template-columns:repeat(' + persDep().length + ',1fr)">' + cards + '</div>' +
      '<div class="day">Mois par mois</div><div class="card" style="overflow:hidden">' +
      '<div class="trow head" style="' + cols + '"><span>Mois</span>' + persDep().map(function (p) { return '<span>' + esc(p) + '</span>'; }).join('') + '<span>Total</span></div>' +
      rows.replace(/class="trow/g, 'style="' + cols + '" class="trow') +
      '<div class="trow foot" style="' + cols + '"><span>Année</span>' + persDep().map(function (p) { return '<span>' + nb(tot.by[p]) + '</span>'; }).join('') + '<span>' + nb(tot.total) + '</span></div></div>' +
      '<p class="hint">Montants en euros. Les mois à venir s’afficheront au fil de l’année.</p>';
  }

  /* ----- feuille de saisie d'une dépense ----- */
  function openExpense(d) {
    EXP.id = d ? d.id : null;
    var parts = persDep().map(function (p, i) {
      var v = d ? d.parts[p] || 0 : 0;
      return '<div class="field"><label for="x-p-' + i + '">' + esc(p) + ' (€)</label><input class="inp" id="x-p-' + i + '" data-person="' + esc(p) + '" type="text" inputmode="decimal" autocomplete="off" value="' + esc(String(v).replace('.', ',')) + '"></div>';
    }).join('');
    openSheet('<h3>' + (d ? 'Modifier la dépense' : 'Nouvelle dépense') + '</h3>' +
      '<div class="two"><div class="field"><label for="x-date">Date</label><input class="inp" id="x-date" type="date" value="' + esc(d ? d.date : today()) + '"></div>' +
      '<div class="field"><label for="x-shop">Magasin</label><input class="inp" id="x-shop" maxlength="40" placeholder="Ex. Carrefour" autocomplete="off" value="' + esc(d ? d.magasin : '') + '"></div></div>' +
      '<div class="two" style="grid-template-columns:repeat(' + persDep().length + ',1fr)">' + parts + '</div>' +
      '<div class="totline"><span>Total</span><b id="x-total">0,00 €</b></div><p class="err" id="x-err" hidden></p>' +
      '<button class="btn" data-act="expense-save" id="x-save">Enregistrer la dépense</button>' +
      (d ? '<button class="btn danger sm" style="margin-top:10px" data-act="expense-del">' + ico('trash') + 'Supprimer cette dépense</button>' : ''));
    updateExpTotal();
  }
  function expParts() { var o = {}; $$('#sheet [data-person]').forEach(function (i) { o[i.dataset.person] = pnum(i.value); }); return o; }
  function updateExpTotal() {
    var el = $('#x-total'); if (!el) return;
    var p = expParts(), t = 0; Object.keys(p).forEach(function (k) { t += p[k]; }); el.textContent = eur(t);
  }
  async function saveExpense() {
    var parts = expParts(), total = 0; Object.keys(parts).forEach(function (k) { total += parts[k]; });
    var date = $('#x-date').value, err = $('#x-err'), btn = $('#x-save');
    var msg = !date ? 'Choisissez une date.' : (Object.keys(parts).some(function (k) { return parts[k] < 0; }) ? 'Les montants ne peuvent pas être négatifs.' : (!(total > 0) ? 'Saisissez au moins un montant.' : ''));
    if (msg) { err.textContent = msg; err.hidden = false; return; }
    err.hidden = true; btn.disabled = true;
    var payload = { date: date, magasin: $('#x-shop').value.trim(), parts: parts };
    var editing = EXP.id;
    if (editing) payload.id = editing;
    try {
      await write(editing ? 'updateDepense' : 'addDepense', payload);
      var ym = date.slice(0, 7); UI.month = ym > curMonth() ? '' : ym;
      closeSheetSilent(); render(); toast(editing ? 'Dépense modifiée ✓' : 'Dépense enregistrée ✓');
    } catch (e) { btn.disabled = false; err.textContent = e.message; err.hidden = false; }
  }
  function openBudget() {
    openSheet('<h3>Budget mensuel des courses</h3><p>Montant à ne pas dépasser chaque mois (0 pour désactiver).</p>' +
      '<div class="field"><label for="x-budget">Budget (€)</label><input class="inp" id="x-budget" type="text" inputmode="decimal" autocomplete="off" value="' + esc(String(data.budget || 0).replace('.', ',')) + '"></div>' +
      '<p class="err" id="x-err" hidden></p><button class="btn" data-act="budget-save" id="x-save">Enregistrer</button>');
  }

  function buyBody() {
    var buy = toBuy(), bought = data.courses.filter(function (c) { return c.achete; });
    var opts = data.aliments.map(function (a) { return '<option value="' + esc(a.nom) + '">'; }).join('');
    return '<form data-form="course" class="addline"><input class="inp" id="c-new" list="c-list" placeholder="Ajouter un article" autocomplete="off" maxlength="80"><datalist id="c-list">' + opts + '</datalist>' +
      '<button class="btn" type="submit" aria-label="Ajouter">' + ico('plus') + '</button></form>' +
      (buy.length ? '<div class="card list" id="todo-list">' + buy.map(todoRow).join('') + '</div>' : '<div class="empty"><div class="big">🛒</div>La liste est vide.</div>') +
      (bought.length ? '<button class="more-link" data-act="toggle-bought">' + (UI.showBought ? 'Masquer' : 'Voir') + ' les articles déjà achetés (' + bought.length + ')</button>' +
        (UI.showBought ? '<div class="card list" style="margin-top:8px">' + bought.slice(-15).reverse().map(todoRow).join('') + '</div>' : '') : '');
  }

  function viewHistory(nom) {
    var list = data.mouvements.filter(function (m) { return !nom || m.aliment === nom; });
    var html = '', last = '';
    list.forEach(function (m) {
      if (m.date !== last) { html += '<div class="day">' + esc(dayLabel(m.date)) + '</div>'; last = m.date; }
      var a = findAl(m.aliment), unit = a ? a.unite : '';
      html += '<div class="card mv" style="margin-bottom:8px"><div class="sign ' + (m.type === 'Retrait' ? 'out' : 'in') + '">' + (m.type === 'Retrait' ? '−' : '+') + '</div><div style="flex:1;min-width:0">' +
        '<div><b>' + esc(m.aliment) + '</b> · ' + esc(qty(m.quantite, unit)) + '</div><div class="meta">' + esc(m.emplacement) + (m.personne ? ' · ' + esc(m.personne) : '') + '</div>' +
        (m.note ? '<div class="note">« ' + esc(m.note) + ' »</div>' : '') + '</div></div>';
    });
    return header('Mouvements', nom || 'Les plus récents en premier', { back: true }) + (list.length ? html : '<div class="empty"><div class="big">🗒️</div>Aucun mouvement enregistré.</div>');
  }

  /* ----- catégories ----- */
  var CATE = { nom: null };
  function viewCats() {
    var rows = data.categories.map(function (c) {
      var n = data.aliments.filter(function (a) { return a.categorie === c; }).length;
      return '<button class="menu-row" data-act="cat-edit" data-cat="' + esc(c) + '"><span class="cico" style="background:' + catInfo(c)[1] + '">' + catInfo(c)[0] + '</span><span>' + esc(niceCat(c)) + '<small style="display:block;color:var(--muted,#6b7f8a);font-weight:400">' + n + ' aliment' + (n > 1 ? 's' : '') + '</small></span>' + ico('chev') + '</button>';
    }).join('');
    return header('Catégories', 'Modifier, ajouter ou retirer', { back: true }) +
      '<button class="btn" data-act="cat-add" style="margin-bottom:14px">' + ico('plus') + 'Ajouter une catégorie</button>' +
      (rows ? '<div class="card list">' + rows + '</div>' : '<div class="empty"><div class="big">🏷️</div>Aucune catégorie.</div>');
  }
  function openCat(nom) {
    CATE.nom = nom || null;
    var n = nom ? data.aliments.filter(function (a) { return a.categorie === nom; }).length : 0;
    openSheet('<h3>' + (nom ? 'Modifier la catégorie' : 'Nouvelle catégorie') + '</h3>' +
      '<div class="field"><label for="x-cat-nom">Nom</label><input class="inp" id="x-cat-nom" maxlength="40" autocomplete="off" placeholder="Ex. Sauces" value="' + esc(nom ? niceCat(nom) : '') + '"></div>' +
      '<p class="err" id="x-err" hidden></p><button class="btn" data-act="cat-save" id="x-save">Enregistrer</button>' +
      (nom ? (n ? '<p class="hint" style="margin-top:10px">Pour la supprimer, changez d’abord ses ' + n + ' aliment(s) de catégorie.</p>' : '<button class="btn danger sm" style="margin-top:10px" data-act="cat-del">' + ico('trash') + 'Supprimer cette catégorie</button>') : ''));
  }
  /* ----- emplacements ----- */
  var EMPE = { nom: null };
  function empCount(n) { return data.aliments.filter(function (a) { return a.emplacements.some(function (e) { return e.nom === n && e.qte > 0; }); }).length; }
  function viewEmps() {
    var rows = data.emplacements.map(function (n) {
      var c = empCount(n);
      return '<button class="menu-row" data-act="emp-edit" data-emp="' + esc(n) + '">' + ico('chest') + '<span>' + esc(n) + '<small style="display:block;color:var(--ink2);font-weight:400">' + (c ? c + ' aliment' + (c > 1 ? 's' : '') : 'vide') + '</small></span>' + ico('chev') + '</button>';
    }).join('');
    return header('Emplacements', 'Modifier, ajouter ou retirer', { back: true }) +
      '<button class="btn" data-act="emp-add" style="margin-bottom:14px">' + ico('plus') + 'Ajouter un emplacement</button>' +
      '<div class="card list">' + rows + '</div>';
  }
  function openEmp(nom) {
    EMPE.nom = nom || null;
    var n = nom ? empCount(nom) : 0;
    openSheet('<h3>' + (nom ? 'Modifier l’emplacement' : 'Nouvel emplacement') + '</h3>' +
      '<div class="field"><label for="x-emp-nom">Nom</label><input class="inp" id="x-emp-nom" maxlength="40" autocomplete="off" placeholder="Ex. Frigo du garage" value="' + esc(nom || '') + '"></div>' +
      '<p class="err" id="x-err" hidden></p><button class="btn" data-act="emp-save" id="x-save">Enregistrer</button>' +
      (nom ? (n ? '<p class="hint" style="margin-top:10px">Pour le supprimer, retirez d’abord ses ' + n + ' aliment' + (n > 1 ? 's' : '') + '.</p>' : '<button class="btn danger sm" style="margin-top:10px" data-act="emp-del">' + ico('trash') + 'Supprimer cet emplacement</button>') + '<p class="hint" style="margin-top:10px">Renommer met à jour tout l’historique : rien n’est perdu.</p>' : ''));
  }
  function viewMore() {
    var pers = data.personnes.map(function (p) { return '<button type="button" class="' + (me === p ? 'on add' : '') + '" data-act="setme" data-p="' + esc(p) + '">' + esc(p) + '</button>'; }).join('');
    return header('Plus', 'Réglages et raccourcis') +
      '<div class="card pad" style="margin-bottom:14px"><div class="field" style="margin:0"><label>' + 'Qui utilise cet appareil ?' + '</label><div class="seg" style="margin:0;grid-template-columns:repeat(' + data.personnes.length + ',1fr)">' + pers + '</div><p class="hint">Sert à pré-remplir « Personne » dans les mouvements.</p></div></div>' +
      '<div class="card list">' +
      '<a class="menu-row" href="#/synthese">' + ico('chart') + '<span>Synthèse des dépenses</span>' + ico('chev') + '</a>' +
      '<button class="menu-row" data-act="setbudget">' + ico('euro') + '<span>Budget mensuel des courses</span>' + ico('chev') + '</button>' +
      '<a class="menu-row" href="#/emplacements">' + ico('chest') + '<span>Emplacements</span>' + ico('chev') + '</a>' +
      '<a class="menu-row" href="#/categories">' + ico('tag') + '<span>Catégories</span>' + ico('chev') + '</a>' +
      '<a class="menu-row" href="#/courses">' + ico('basket') + '<span>Liste de courses</span>' + ico('chev') + '</a>' +
      '<a class="menu-row" href="#/historique">' + ico('clock') + '<span>Historique des mouvements</span>' + ico('chev') + '</a>' +
      '<a class="menu-row" href="#/stock?all=1">' + ico('list') + '<span>Tous les aliments (y compris à zéro)</span>' + ico('chev') + '</a>' +
      '<button class="menu-row" data-act="refresh">' + ico('refresh') + '<span>Actualiser les données</span>' + ico('chev') + '</button>' +
      (DEMO ? '<button class="menu-row" data-act="demo-reset">' + ico('trash') + '<span>Réinitialiser la démo</span>' + ico('chev') + '</button>'
        : '<button class="menu-row" data-act="change-token">' + ico('key') + '<span>Changer le code d’accès</span>' + ico('chev') + '</button>') + '</div>' +
      '<p class="ver">Mon garde-manger · ' + (DEMO ? 'mode démo' : 'connecté au Google Sheet') + '</p>';
  }

  /* ----- formulaire de mouvement ----- */
  function defaultEmp() { return data.emplacements[0] || ''; }
  function initForm(p) {
    F = { type: p.type === 'Retrait' ? 'Retrait' : 'Ajout', aliment: p.aliment || '', q: '', nom: '', cat: '', newcat: '', qte: '', unite: '', emp: p.emp || defaultEmp(), date: today(), pers: me || '', note: '' };
    prefillFromAliment();
  }
  function prefillFromAliment() {
    var a = findAl(F.aliment);
    if (a) F.unite = a.unite || '';
    if (F.type === 'Retrait') {
      var emps = a ? a.emplacements.filter(function (e) { return e.qte > 0; }) : [];
      if (!emps.some(function (e) { return e.nom === F.emp; })) F.emp = emps.length === 1 ? emps[0].nom : '';
    } else if (!F.emp) {
      F.emp = defaultEmp();
      var best = a && !F.emp ? a.emplacements.slice().sort(function (x, y) { return y.qte - x.qte; })[0] : null;
      if (best && best.qte > 0) F.emp = best.nom;
    }
  }
  function syncForm() {
    if (!F || !$('#f-qte')) return;
    var g = function (id) { var e = $('#' + id); return e ? e.value : undefined; };
    var v;
    if ((v = g('f-search')) !== undefined) F.q = v;
    if ((v = g('f-nom')) !== undefined) F.nom = v;
    if ((v = g('f-cat')) !== undefined) F.cat = v;
    if ((v = g('f-newcat')) !== undefined) F.newcat = v;
    if ((v = g('f-qte')) !== undefined) F.qte = v;
    if ((v = g('f-unite')) !== undefined && !$('#f-unite').disabled) F.unite = v;
    if ((v = g('f-emp')) !== undefined) F.emp = v;
    if ((v = g('f-date')) !== undefined) F.date = v;
    if ((v = g('f-pers')) !== undefined) F.pers = v;
    if ((v = g('f-note')) !== undefined) F.note = v;
  }
  function opt(v, l, sel) { return '<option value="' + esc(v) + '"' + (sel ? ' selected' : '') + '>' + esc(l) + '</option>'; }
  function sugsHtml() {
    var q = norm(F.q); if (!q) return '';
    var ret = F.type === 'Retrait', pool = ret ? data.aliments.filter(inStock) : data.aliments;
    var m = pool.filter(function (a) { return norm(a.nom).indexOf(q) >= 0; }).sort(byName).slice(0, 6);
    var exact = data.aliments.some(function (a) { return norm(a.nom) === q; });
    var html = m.map(function (a) { return '<button type="button" data-act="pickfood" data-nom="' + esc(a.nom) + '"><span>' + esc(a.nom) + '</span><span class="sm">' + esc(qty(a.stock, a.unite)) + ' en stock</span></button>'; }).join('');
    if (!ret && !exact) html += '<button type="button" class="create" data-act="createfood">' + ico('plus') + '<span>Créer « ' + esc(F.q.trim()) + ' »</span></button>';
    if (!html) return '<p class="hint">Aucun aliment en stock ne correspond.</p>';
    return '<div class="card list sug">' + html + '</div>';
  }
  function foodField() {
    var a = findAl(F.aliment);
    if (F.aliment === '__new__') return '<div class="sel new"><span>Nouvel aliment : <b>' + esc(F.nom) + '</b> (sera créé)</span><button type="button" data-act="changefood">Changer</button></div>';
    if (a) return '<div class="sel"><span><b>' + esc(a.nom) + '</b> · ' + esc(qty(a.stock, a.unite)) + ' en stock</span><button type="button" data-act="changefood">Changer</button></div>';
    return '<div class="search" style="margin-bottom:8px">' + ico('search') + '<input id="f-search" type="text" placeholder="Tape le nom : poulet, glace…" autocomplete="off" value="' + esc(F.q) + '"></div><div id="f-sugs">' + sugsHtml() + '</div>';
  }
  function moveFields() {
    var ret = F.type === 'Retrait', a = findAl(F.aliment), isNew = F.aliment === '__new__';
    var empList = ret && a ? a.emplacements.filter(function (e) { return e.qte > 0; }).map(function (e) { return { v: e.nom, l: e.nom + ' (' + fmtNum(e.qte) + ')' }; })
      : data.emplacements.map(function (n) { return { v: n, l: n }; });
    var empOpts = opt('', 'Choisir un emplacement…', !F.emp) + empList.map(function (e) { return opt(e.v, e.l, e.v === F.emp); }).join('');
    var units = UNITES.slice(); if (F.unite && units.indexOf(F.unite) < 0) units.unshift(F.unite);
    var unitOpts = opt('', '—', !F.unite) + units.map(function (u) { return opt(u, u, u === F.unite); }).join('');
    var avail = ret && a && F.emp ? (a.emplacements.filter(function (e) { return e.nom === F.emp; })[0] || { qte: 0 }).qte : null;
    var catOpts = opt('', 'Choisir une catégorie…', !F.cat) + data.categories.map(function (c) { return opt(c, niceCat(c), c === F.cat); }).join('') + opt('__newcat__', '＋ Nouvelle catégorie…', F.cat === '__newcat__');
    var persOpts = opt('', '—', !F.pers) + data.personnes.map(function (p) { return opt(p, p, p === F.pers); }).join('');
    return '<div class="seg"><button type="button" data-act="settype" data-type="Ajout" class="' + (!ret ? 'on add' : '') + '">' + ico('plus') + 'Ajouter</button>' +
      '<button type="button" data-act="settype" data-type="Retrait" class="' + (ret ? 'on ret' : '') + '">' + ico('minus') + 'Retirer</button></div>' +
      '<div class="field"><label for="f-search">Aliment <i>*</i></label>' + foodField() + '</div>' +
      (isNew ? '<div class="field"><label for="f-cat">Catégorie <i>*</i></label><select class="inp" id="f-cat">' + catOpts + '</select></div>' +
        (F.cat === '__newcat__' ? '<div class="field"><label for="f-newcat">Nom de la nouvelle catégorie <i>*</i></label><input class="inp" id="f-newcat" maxlength="40" autocomplete="off" placeholder="Ex. Sauces" value="' + esc(F.newcat) + '"></div>' : '') : '') +
      '<div class="two"><div class="field"><label for="f-qte">Quantité <i>*</i></label><input class="inp" id="f-qte" type="number" inputmode="decimal" step="any" min="0" value="' + esc(F.qte) + '" placeholder="0"></div>' +
      '<div class="field"><label for="f-unite">Unité</label><select class="inp" id="f-unite"' + (ret ? ' disabled' : '') + '>' + unitOpts + '</select></div></div>' +
      (avail !== null ? '<p class="hint" style="margin:-6px 2px 12px">Disponible dans cet emplacement : ' + esc(qty(avail, a.unite)) + '</p>' : '') +
      '<div class="field"><label for="f-emp">Emplacement <i>*</i></label><select class="inp" id="f-emp">' + empOpts + '</select></div>' +
      '<div class="two"><div class="field"><label for="f-date">Date <i>*</i></label><input class="inp" id="f-date" type="date" value="' + esc(F.date) + '"></div>' +
      '<div class="field"><label for="f-pers">Personne</label><select class="inp" id="f-pers">' + persOpts + '</select></div></div>' +
      '<div class="field"><label for="f-note">Note</label><textarea class="inp" id="f-note" maxlength="200" placeholder="Facultatif">' + esc(F.note) + '</textarea><div class="counter"><span id="f-count">' + F.note.length + '</span>/200</div></div>' +
      '<p class="err" id="f-err" hidden></p>' +
      '<button class="btn ' + (ret ? 'ret' : '') + '" type="submit" id="f-submit">' + ico('check') + 'Enregistrer</button>';
  }
  function viewMove() {
    return header('Enregistrer un mouvement', 'Ajouter ou retirer un aliment de votre stock', { back: true }) + '<form data-form="move" id="move-form" novalidate>' + moveFields() + '</form>';
  }
  function validateMove() {
    var q = Number(String(F.qte).replace(',', '.'));
    if (!F.aliment) return 'Choisissez un aliment.';
    if (F.aliment === '__new__') { if (!F.nom.trim()) return 'Donnez un nom au nouvel aliment.'; if (!F.cat) return 'Choisissez une catégorie.'; if (F.cat === '__newcat__' && !F.newcat.trim()) return 'Donnez un nom à la nouvelle catégorie.'; }
    if (!(q > 0)) return 'La quantité doit être supérieure à zéro. Utilisez Ajouter ou Retirer pour indiquer le sens.';
    if (!F.emp) return 'Choisissez un emplacement.';
    if (!F.date) return 'Choisissez une date.';
    if (F.type === 'Retrait') {
      var a = findAl(F.aliment), e = a && a.emplacements.filter(function (x) { return x.nom === F.emp; })[0], dispo = e ? e.qte : 0;
      if (q > dispo + 1e-9) return 'Il n’y en a que ' + qty(dispo, a.unite) + ' dans cet emplacement.';
    }
    return '';
  }
  async function submitMove() {
    syncForm();
    var err = validateMove(), box = $('#f-err');
    if (err) { box.textContent = err; box.hidden = false; box.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    box.hidden = true;
    var btn = $('#f-submit'); btn.disabled = true;
    var payload = { type: F.type, aliment: F.aliment, quantite: Number(String(F.qte).replace(',', '.')), unite: F.unite, emplacement: F.emp, date: F.date, personne: F.pers, note: F.note.trim() };
    if (F.aliment === '__new__') { payload.aliment = ''; payload.nouvelAliment = F.cat === '__newcat__' ? { nom: F.nom.trim(), categorie: F.newcat.trim(), nouvelleCategorie: true } : { nom: F.nom.trim(), categorie: F.cat }; }
    if (F.pers) { me = F.pers; ls.set('cg_me', me); }
    try { await write('addMouvement', payload); toast(F.type === 'Ajout' ? 'Ajouté ✓' : 'Retiré ✓'); F = null; goBack(); }
    catch (e) { btn.disabled = false; box.textContent = e.message; box.hidden = false; }
  }

  /* ============================== Rendu / routage ============================== */
  var ROUTES = [
    [/^\/$/, 'home'], [/^\/stock$/, 'stock'], [/^\/mouvement$/, 'move'], [/^\/alertes$/, 'alerts'], [/^\/courses$/, 'courses'],
    [/^\/plus$/, 'more'], [/^\/categories$/, 'cats'], [/^\/emplacements$/, 'emps'], [/^\/synthese$/, 'synth'], [/^\/emplacement\/(.+)$/, 'place'], [/^\/aliment\/(.+)$/, 'food'], [/^\/historique(?:\/(.+))?$/, 'history']
  ];
  var memHash = null, navStack = [];
  function curHash() { return memHash !== null ? memHash : (location.hash.replace(/^#/, '') || '/'); }
  function nav(h) {
    h = String(h).replace(/^#/, '') || '/';
    navStack.push(curHash()); memHash = h;
    try { if ((location.hash.replace(/^#/, '') || '/') !== h) location.hash = h; } catch (e) {}
    routeChanged = true; closeSheetSilent(); render();
  }
  function goBack() {
    if (!navStack.length) { nav('#/'); return; }
    var h = navStack.pop(); memHash = h;
    try { location.hash = h; } catch (e) {}
    routeChanged = true; closeSheetSilent(); render();
  }
  function currentRoute() {
    var h = curHash(), parts = h.split('?'), path = parts[0], params = {};
    new URLSearchParams(parts[1] || '').forEach(function (v, k) { params[k] = v; });
    for (var i = 0; i < ROUTES.length; i++) {
      var m = path.match(ROUTES[i][0]);
      if (m) return { name: ROUTES[i][1], arg: m[1] ? decodeURIComponent(m[1]) : '', params: params };
    }
    return { name: 'home', arg: '', params: params };
  }
  var TABS = [['home', 'Accueil', 'home', '#/'], ['stock', 'Stock', 'list', '#/stock'], ['fab'], ['courses', 'Courses', 'basket', '#/courses'], ['more', 'Plus', 'dots', '#/plus']];
  function buildTabbar() {
    $('#tabbar').innerHTML = TABS.map(function (t) {
      if (t[0] === 'fab') return '<a class="fab" href="#/mouvement" aria-label="Enregistrer un mouvement">' + ico('snow') + '</a>';
      return '<a class="tab" data-tab="' + t[0] + '" href="' + t[3] + '">' + ico(t[2]) + '<span>' + t[1] + '</span></a>';
    }).join('');
  }
  var TABMAP = { home: 'home', place: 'home', stock: 'stock', food: 'stock', alerts: 'stock', courses: 'courses', history: 'more', more: 'more', cats: 'more', emps: 'more' };

  function render() {
    syncForm();
    var r = currentRoute(), html, hideTab = false;
    if (!DEMO && !ls.get('cg_token', '')) { html = viewGate(); hideTab = true; }
    else if (!data) { html = loading ? viewLoading() : (loadError ? viewError() : viewLoading()); }
    else {
      if (r.name === 'stock' && routeChanged) { UI.showAll = !!r.params.all; UI.low = r.params.low === '1'; }
      if (r.name === 'alerts' && routeChanged) UI.low = true;
      if (r.name === 'courses' && routeChanged) UI.cTab = r.params.tab === 'budget' ? 'budget' : 'buy';
      if (r.name === 'synth' && routeChanged) { UI.synthFrom = r.params.from === 'courses' ? 'courses' : 'more'; UI.year = Number(today().slice(0, 4)); }
      switch (r.name) {
        case 'home': html = viewHome(); break;
        case 'stock': case 'alerts': html = viewStock(r.params); break;
        case 'move': if (routeChanged || !F) initForm(r.params); html = viewMove(); hideTab = true; break;
        case 'courses': html = viewCourses(); break;
        case 'synth': html = viewSynth(); break;
        case 'more': html = viewMore(); break;
        case 'cats': html = viewCats(); break;
        case 'emps': html = viewEmps(); break;
        case 'place': html = viewPlace(r.arg); break;
        case 'food': html = viewFood(r.arg); break;
        case 'history': html = viewHistory(r.arg); break;
        default: html = viewHome();
      }
    }
    var app = $('#app');
    app.className = hideTab ? 'notab' : '';
    app.innerHTML = html;
    $('#tabbar').classList.toggle('hide', hideTab);
    var activeTab = r.name === 'synth' ? (UI.synthFrom === 'courses' ? 'courses' : 'more') : TABMAP[r.name];
    $$('#tabbar .tab').forEach(function (t) { t.classList.toggle('on', t.dataset.tab === activeTab); });
    if (routeChanged) { window.scrollTo(0, 0); }
    if (r.name === 'stock' && routeChanged && r.params.focus) { var q = $('#stock-q'); if (q) q.focus(); }
    routeChanged = false;
  }

  /* ============================== Événements ============================== */
  window.addEventListener('hashchange', function () {
    var h = location.hash.replace(/^#/, '') || '/';
    if (h === curHash()) return;
    memHash = h; routeChanged = true; closeSheetSilent(); render();
  });
  function closeSheetSilent() { $('#sheet').classList.remove('open'); sheetResolve = null; }

  async function safe(fn) { try { return await fn(); } catch (e) { toast(e.message || 'Erreur'); load(true); } }

  document.addEventListener('click', function (ev) {
    var link = ev.target.closest('a[href^="#/"]');
    if (link) { ev.preventDefault(); nav(link.getAttribute('href')); return; }
    var t = ev.target.closest('[data-act]'); if (!t) return;
    var act = t.dataset.act;
    switch (act) {
      case 'back': goBack(); break;
      case 'setlow': UI.low = t.dataset.low === '1'; render(); break;
      case 'ctab': UI.cTab = t.dataset.tab; render(); break;
      case 'monthprev': UI.month = shiftMonth(UI.month || curMonth(), -1); render(); break;
      case 'monthnext': if ((UI.month || curMonth()) < curMonth()) { UI.month = shiftMonth(UI.month || curMonth(), 1); render(); } break;
      case 'yearprev': UI.year = (UI.year || Number(today().slice(0, 4))) - 1; render(); break;
      case 'yearnext': if ((UI.year || 0) < Number(today().slice(0, 4))) { UI.year += 1; render(); } break;
      case 'expense-add': openExpense(null); break;
      case 'expense-edit': { var ed = depList().filter(function (x) { return x.id === t.dataset.id; })[0]; if (ed) openExpense(ed); break; }
      case 'expense-save': saveExpense(); break;
      case 'expense-del': {
        var dd = depList().filter(function (x) { return x.id === EXP.id; })[0]; if (!dd) break;
        confirmSheet('Supprimer cette dépense ?', (dd.magasin || 'Courses') + ' · ' + eur(dd.total) + ' · ' + fmtDate(dd.date), 'Supprimer', true).then(function (ok) {
          if (!ok) return;
          safe(function () { return write('deleteDepense', { id: dd.id }); }).then(function () { render(); toast('Dépense supprimée'); });
        }); break; }
      case 'setbudget': openBudget(); break;
      case 'emp-add': openEmp(null); break;
      case 'emp-edit': openEmp(t.dataset.emp); break;
      case 'emp-save': {
        var en = $('#x-emp-nom').value.trim(), eb = $('#x-save'), ee = $('#x-err');
        if (!en) { ee.textContent = 'Donnez un nom à l’emplacement.'; ee.hidden = false; break; }
        eb.disabled = true;
        var wasEdit = !!EMPE.nom;
        write(wasEdit ? 'renameEmplacement' : 'addEmplacement', wasEdit ? { ancien: EMPE.nom, nouveau: en } : { nom: en })
          .then(function () { closeSheetSilent(); render(); toast(wasEdit ? 'Emplacement modifié ✓' : 'Emplacement ajouté ✓'); })
          .catch(function (e) { eb.disabled = false; ee.textContent = e.message; ee.hidden = false; });
        break; }
      case 'emp-del': {
        var de = EMPE.nom;
        confirmSheet('Supprimer cet emplacement ?', '« ' + de + ' » sera retiré de la liste.', 'Supprimer', true).then(function (ok) {
          if (!ok) return;
          safe(function () { return write('deleteEmplacement', { nom: de }); }).then(function () { render(); toast('Emplacement supprimé'); });
        }); break; }
      case 'cat-add': openCat(null); break;
      case 'cat-edit': openCat(t.dataset.cat); break;
      case 'cat-save': {
        var cn = $('#x-cat-nom').value.trim(), cb = $('#x-save'), ce = $('#x-err');
        if (!cn) { ce.textContent = 'Donnez un nom à la catégorie.'; ce.hidden = false; break; }
        cb.disabled = true;
        write(CATE.nom ? 'renameCategorie' : 'addCategorie', CATE.nom ? { ancien: CATE.nom, nouveau: cn } : { nom: cn })
          .then(function () { closeSheetSilent(); render(); toast(CATE.nom ? 'Catégorie modifiée ✓' : 'Catégorie ajoutée ✓'); })
          .catch(function (e) { cb.disabled = false; ce.textContent = e.message; ce.hidden = false; });
        break; }
      case 'cat-del': {
        var dc = CATE.nom;
        confirmSheet('Supprimer cette catégorie ?', '« ' + niceCat(dc) + ' » sera retirée de la liste.', 'Supprimer', true).then(function (ok) {
          if (!ok) return;
          safe(function () { return write('deleteCategorie', { nom: dc }); }).then(function () { render(); toast('Catégorie supprimée'); });
        }); break; }
      case 'budget-save': {
        var bv = pnum($('#x-budget').value), bb = $('#x-save'); bb.disabled = true;
        write('setBudget', { budget: bv }).then(function () { closeSheetSilent(); render(); toast('Budget enregistré ✓'); }).catch(function (e) { bb.disabled = false; var er = $('#x-err'); er.textContent = e.message; er.hidden = false; });
        break; }
      case 'pickfood': syncForm(); F.aliment = t.dataset.nom; F.q = ''; prefillFromAliment(); $('#move-form').innerHTML = moveFields(); break;
      case 'createfood': { syncForm(); var nn = F.q.trim(); F.aliment = '__new__'; F.nom = nn.charAt(0).toUpperCase() + nn.slice(1); F.q = ''; $('#move-form').innerHTML = moveFields(); break; }
      case 'changefood': syncForm(); F.aliment = ''; F.nom = ''; F.cat = ''; F.newcat = ''; F.q = ''; $('#move-form').innerHTML = moveFields(); { var fs = $('#f-search'); if (fs) fs.focus(); } break;
      case 'settype': syncForm(); F.type = t.dataset.type; F.aliment = (F.type === 'Retrait' && F.aliment === '__new__') ? '' : F.aliment;
        if (F.type === 'Retrait') { var a0 = findAl(F.aliment); if (a0 && !inStock(a0)) F.aliment = ''; }
        prefillFromAliment(); $('#move-form').innerHTML = moveFields(); break;
      case 'filter':
        openSheet('<h3>Filtrer le stock</h3><div class="field"><label for="x-emp">Emplacement</label><select class="inp" id="x-emp">' + opt('', 'Tous les emplacements', !UI.filt.emp) + data.emplacements.map(function (n) { return opt(n, n, n === UI.filt.emp); }).join('') + '</select></div>' +
          '<div class="field"><label for="x-cat">Catégorie</label><select class="inp" id="x-cat">' + opt('', 'Toutes les catégories', !UI.filt.cat) + data.categories.map(function (c) { return opt(c, niceCat(c), c === UI.filt.cat); }).join('') + '</select></div>' +
          '<div class="btn-row"><button class="btn ghost sm" data-act="filter-reset">Réinitialiser</button><button class="btn sm" data-act="filter-apply">Appliquer</button></div>'); break;
      case 'filter-apply': UI.filt = { emp: $('#x-emp').value, cat: $('#x-cat').value }; closeSheetSilent(); render(); break;
      case 'filter-reset': UI.filt = { emp: '', cat: '' }; closeSheetSilent(); render(); break;
      case 'closesheet': case 'sheet-cancel': closeSheet(); break;
      case 'sheet-ok': if (sheetResolve) { var rs = sheetResolve; sheetResolve = null; $('#sheet').classList.remove('open'); rs(true); } break;
      case 'showall': UI.showAll = !UI.showAll; $('#stock-list').innerHTML = stockListHtml(); break;
      case 'refresh': toast('Actualisation…'); load(true); break;
      case 'setme': me = t.dataset.p; ls.set('cg_me', me); render(); break;
      case 'toggle-bought': UI.showBought = !UI.showBought; render(); break;
      case 'demo-reset': window.DemoApi.reset(); load(true); toast('Démo réinitialisée'); break;
      case 'change-token': ls.set('cg_token', ''); gateError = ''; render(); break;
      case 'achete': case 'unachete': {
        var id = t.dataset.id, flag = act === 'achete', row = t.closest('.todo');
        if (row && flag) row.classList.add('done');
        data.courses.forEach(function (c) { if (c.id === id) c.achete = flag; });
        setTimeout(render, flag ? 280 : 0);
        safe(function () { return write('setAchete', { id: id, achete: flag }); });
        break; }
      case 'addcourse': {
        var nom = t.dataset.nom; if (inCourses(nom)) { toast('Déjà dans la liste'); break; }
        data.courses.push({ id: 'tmp' + Date.now(), article: nom, achete: false, ajoutePar: me, date: today() }); render();
        safe(function () { return write('addCourse', { article: nom, ajoutePar: me }); }).then(function () { toast('Ajouté à la liste de courses ✓'); });
        break; }
      case 'clear': {
        var n = t.dataset.nom, e = t.dataset.emp;
        confirmSheet('Tout retirer ?', 'Retirer tout le stock de « ' + n + ' » dans « ' + e + ' » ?', 'Tout retirer', true).then(function (ok) {
          if (!ok) return;
          safe(function () { return write('clearStock', { aliment: n, emplacement: e, personne: me }); }).then(function () { render(); toast('Retiré ✓'); });
        }); break; }
      case 'delete-aliment': {
        var dn = t.dataset.nom;
        confirmSheet('Supprimer cet aliment ?', '« ' + dn + ' » sera retiré de la liste des aliments. L’historique de ses mouvements est conservé.', 'Supprimer', true).then(function (ok) {
          if (!ok) return;
          safe(function () { return write('deleteAliment', { aliment: dn }); }).then(function () { nav('#/stock'); toast('Supprimé'); });
        }); break; }
    }
  });

  document.addEventListener('submit', function (ev) {
    var f = ev.target.closest('form[data-form]'); if (!f) return;
    ev.preventDefault();
    var kind = f.dataset.form;
    if (kind === 'move') submitMove();
    if (kind === 'token') {
      var code = $('#g-code').value.trim(); if (!code) return;
      ls.set('cg_token', code); gateError = ''; data = null; load();
    }
    if (kind === 'course') {
      var inp = $('#c-new'), art = inp.value.trim(); if (!art) return;
      if (inCourses(art)) { toast('Déjà dans la liste'); inp.value = ''; return; }
      data.courses.push({ id: 'tmp' + Date.now(), article: art, achete: false, ajoutePar: me, date: today() }); render();
      safe(function () { return write('addCourse', { article: art, ajoutePar: me }); });
    }
  });

  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.id === 'stock-q') {
      UI.stockQ = t.value; $('#stock-list').innerHTML = stockListHtml();
      var n = stockItems().length; $('#stock-count').textContent = n + ' résultat' + (n > 1 ? 's' : '');
    }
    if (t.id === 'f-note') $('#f-count').textContent = t.value.length;
    if (t.id === 'f-search') { F.q = t.value; $('#f-sugs').innerHTML = sugsHtml(); }
    if (t.dataset && t.dataset.person) updateExpTotal();
  });
  document.addEventListener('focusin', function (ev) { var t = ev.target; if (t.dataset && t.dataset.person) { try { t.select(); } catch (e) {} } });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && ev.target.id === 'f-search') {
      ev.preventDefault();
      var b = $('#f-sugs button'); if (b) b.click();
    }
  });

  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.id === 'f-aliment') { syncForm(); F.emp = F.type === 'Retrait' ? '' : F.emp; prefillFromAliment(); $('#move-form').innerHTML = moveFields(); }
    if (t.id === 'f-emp') { syncForm(); $('#move-form').innerHTML = moveFields(); }
    if (t.id === 'f-cat') { syncForm(); $('#move-form').innerHTML = moveFields(); if (F.cat === '__newcat__') { var nc = $('#f-newcat'); if (nc) nc.focus(); } }
    if (t.dataset && t.dataset.alertToggle) {
      var nom = t.dataset.alertToggle, a = findAl(nom), on = t.checked; a.alerte = on; if (on && !a.seuil) a.seuil = 1; render();
      safe(function () { return write('setAlerte', { aliment: nom, alerte: on, seuil: a.seuil }); });
    }
    if (t.dataset && t.dataset.alertSeuil) {
      var n2 = t.dataset.alertSeuil, a2 = findAl(n2), s = Math.max(0, Number(String(t.value).replace(',', '.')) || 0); a2.seuil = s; render();
      safe(function () { return write('setAlerte', { aliment: n2, alerte: a2.alerte, seuil: s }); });
    }
  });

  /* ============================== Démarrage ============================== */
  buildTabbar();
  render();
  if (DEMO || ls.get('cg_token', '')) load(!!data);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && data && pending === 0 && !F) load(true); });
})();
