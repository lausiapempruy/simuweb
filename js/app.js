/* SimuWeb — logika utama workspace (ES5) */
(function () {
  'use strict';
  var FS = SW.FS, P = SW.Preview;
  var COL = { html: '#ff8a5c', css: '#5cb8ff', js: '#ffd25c', json: '#7be0a0', md: '#c9a7ff', svg: '#4cd7c0', txt: '#9aa3b2' };
  var st = { open: [], active: null, prev: 'index.html', folds: {} };
  var ta, gut, frame, saveT = 0, prevT = 0, askCb = null, toastT = 0;

  function $(id) { return document.getElementById(id); }
  function el(t, c, x) {
    var e = document.createElement(t);
    if (c) e.className = c;
    if (x !== undefined && x !== null) e.textContent = x;
    return e;
  }
  function ext(p) { var m = /\.([a-z0-9]+)$/i.exec(p); return m ? m[1].toLowerCase() : ''; }
  function toast(m) {
    var t = $('toast');
    t.textContent = m; t.className = 'toast on';
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.className = 'toast'; }, 2300);
  }
  function setPane(p) {
    document.body.setAttribute('data-pane', p);
    Array.prototype.forEach.call(document.querySelectorAll('.mob button'), function (b) {
      b.className = b.getAttribute('data-go') === p ? 'on' : '';
    });
  }
  function narrow() { return window.innerWidth <= 900; }

  /* ---------- modal ---------- */
  function closeAsk() { $('modal').hidden = true; askCb = null; }
  function ask(title, msg, val, cb, confirmOnly) {
    $('mTitle').textContent = title;
    $('mMsg').textContent = msg || '';
    var i = $('mIn');
    i.hidden = !!confirmOnly; i.value = val || '';
    askCb = cb; $('modal').hidden = false;
    if (confirmOnly) $('mOk').focus(); else { i.focus(); i.select(); }
  }

  /* ---------- tree ---------- */
  function buildTree() {
    var root = { d: {}, f: [] };
    FS.list().forEach(function (p) {
      var parts = p.split('/'), n = root, i, k;
      for (i = 0; i < parts.length - 1; i++) {
        k = parts[i];
        if (!n.d[k]) n.d[k] = { d: {}, f: [], path: parts.slice(0, i + 1).join('/') };
        n = n.d[k];
      }
      if (parts[parts.length - 1] !== '.keep') n.f.push(p);
    });
    return root;
  }
  function row(depth, path, label, isDir, open) {
    var r = el('div', 'row' + (!isDir && path === st.active ? ' act' : ''));
    r.style.paddingLeft = (6 + depth * 14) + 'px';
    var b = el('button', 'nm'), tg = el('i', 'tg', isDir ? (open ? '▾' : '▸') : (ext(path) || '•'));
    if (!isDir) tg.style.color = COL[ext(path)] || COL.txt;
    b.appendChild(tg); b.appendChild(el('span', '', label));
    b.onclick = function () {
      if (isDir) { st.folds[path] = !open; renderTree(); } else openFile(path);
    };
    var a = el('span', 'ac'), re = el('button', '', '✎'), rm = el('button', '', '✕');
    re.title = 'Ganti nama'; rm.title = 'Hapus';
    re.onclick = function (e) { e.stopPropagation(); askRename(path); };
    rm.onclick = function (e) { e.stopPropagation(); askDelete(path, isDir); };
    a.appendChild(re); a.appendChild(rm);
    r.appendChild(b); r.appendChild(a);
    return r;
  }
  function renderNode(n, box, depth) {
    Object.keys(n.d).sort().forEach(function (k) {
      var d = n.d[k], op = st.folds[d.path] !== false;
      box.appendChild(row(depth, d.path, k, true, op));
      if (op) renderNode(d, box, depth + 1);
    });
    n.f.sort().forEach(function (p) { box.appendChild(row(depth, p, p.split('/').pop(), false)); });
  }
  function renderTree() {
    var box = $('tree');
    box.innerHTML = '';
    renderNode(buildTree(), box, 0);
  }

  /* ---------- tabs & editor ---------- */
  function renderTabs() {
    var box = $('tabs');
    box.innerHTML = '';
    st.open.forEach(function (p) {
      var t = el('div', 'tab' + (p === st.active ? ' on' : ''));
      var b = el('button', '', p.split('/').pop()), x = el('button', 'x', '✕');
      b.title = p; x.title = 'Tutup';
      b.onclick = function () { st.active = p; loadActive(); };
      x.onclick = function () { closeTab(p); };
      t.appendChild(b); t.appendChild(x); box.appendChild(t);
    });
  }
  function gutter() {
    var n = ta.value.split('\n').length, s = [], i;
    for (i = 1; i <= n; i++) s.push(i);
    gut.textContent = s.join('\n');
    gut.scrollTop = ta.scrollTop;
  }
  function status() {
    if (!st.active) { $('stFile').textContent = ''; $('stInfo').textContent = ''; return; }
    $('stFile').textContent = st.active;
    $('stInfo').textContent = ta.value.split('\n').length + ' baris · ' + ta.value.length + ' karakter';
  }
  function loadActive() {
    var has = st.active && FS.has(st.active);
    ta.disabled = !has;
    ta.value = has ? FS.read(st.active) : '';
    $('empty').hidden = !!has;
    gutter(); status(); renderTabs(); renderTree();
  }
  function openFile(p) {
    if (st.open.indexOf(p) < 0) st.open.push(p);
    st.active = p;
    if (ext(p) === 'html' && p !== st.prev) { st.prev = p; refresh(); }
    loadActive();
    if (narrow()) setPane('code');
  }
  function closeTab(p) {
    st.open = st.open.filter(function (x) { return x !== p; });
    if (st.active === p) st.active = st.open.length ? st.open[st.open.length - 1] : null;
    loadActive();
  }
  function changed() {
    $('stSave').textContent = 'Menyimpan…';
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      $('stSave').textContent = FS.persist() ? 'Tersimpan' : 'Gagal simpan (storage penuh?)';
    }, 350);
    clearTimeout(prevT);
    prevT = setTimeout(refresh, 500);
  }

  /* ---------- preview ---------- */
  function firstHtml() {
    var l = FS.list().filter(function (p) { return ext(p) === 'html'; });
    return l.length ? l[0] : null;
  }
  function refresh() {
    var p = st.prev;
    if (!FS.has(p)) { p = FS.has('index.html') ? 'index.html' : firstHtml(); st.prev = p; }
    $('pvPath').textContent = p || '—';
    frame.srcdoc = p ? P.build(p) :
      '<body style="font-family:system-ui,sans-serif;padding:24px;color:#555">Belum ada file HTML. Bikin <b>index.html</b> dulu ya.</body>';
  }
  function navTo(d) {
    if (d.ext) { window.open(d.href, '_blank', 'noopener'); return; }
    var c = [d.path, d.path + '.html', d.path + '/index.html', d.path ? '' : 'index.html'], i;
    for (i = 0; i < c.length; i++) {
      if (c[i] && FS.has(c[i])) { st.prev = c[i]; refresh(); return; }
    }
    toast('File tidak ketemu: ' + d.path);
  }

  /* ---------- aksi file ---------- */
  function baseDir() { var d = st.active ? FS.dir(st.active) : ''; return d ? d + '/' : ''; }
  function askNewFile() {
    ask('File baru', 'Tulis path lengkap, mis. assets/css/tema.css', baseDir() + 'baru.html', function (v) {
      v = FS.norm(v);
      if (!v) return;
      if (FS.has(v) || FS.isDir(v)) { toast('Nama itu sudah dipakai'); return; }
      FS.write(v, '');
      FS.persist(); openFile(v);
    });
  }
  function askNewDir() {
    ask('Folder baru', 'Tulis path folder, mis. assets/img', baseDir() + 'folder-baru', function (v) {
      v = FS.norm(v);
      if (!v) return;
      if (FS.has(v) || FS.isDir(v)) { toast('Nama itu sudah dipakai'); return; }
      FS.write(v + '/.keep', '');
      FS.persist(); renderTree();
    });
  }
  function remap(a, b) {
    function fix(p) { return (p === a || p.indexOf(a + '/') === 0) ? b + p.slice(a.length) : p; }
    st.open = st.open.map(fix);
    if (st.active) st.active = fix(st.active);
    st.prev = fix(st.prev);
  }
  function askRename(path) {
    ask('Ganti nama / pindah', 'Path baru untuk ' + path, path, function (v) {
      v = FS.norm(v);
      if (!v || v === path) return;
      if (FS.has(v) || FS.isDir(v)) { toast('Nama itu sudah dipakai'); return; }
      if (v.indexOf(path + '/') === 0) { toast('Folder nggak bisa dipindah ke dalam dirinya'); return; }
      FS.move(path, v); remap(path, v);
      FS.persist(); loadActive(); refresh();
    });
  }
  function askDelete(path, isDir) {
    ask('Hapus', 'Yakin hapus "' + path + '"' + (isDir ? ' beserta isinya' : '') + '?', '', function () {
      FS.remove(path);
      st.open = st.open.filter(function (p) { return p !== path && p.indexOf(path + '/') !== 0; });
      if (!st.active || !FS.has(st.active)) st.active = st.open.length ? st.open[st.open.length - 1] : null;
      FS.persist(); loadActive(); refresh();
    }, true);
  }
  function resetStarter() {
    FS.replaceAll(SW.starter()); FS.persist();
    st.open = []; st.active = null; st.prev = 'index.html'; st.folds = {};
    openFile('index.html'); refresh();
  }

  /* ---------- impor & ekspor ---------- */
  function doImport(list) {
    Array.prototype.forEach.call(list, function (f) {
      if (!/\.(html?|css|js|json|md|txt|svg|xml|csv|ya?ml)$/i.test(f.name)) { toast('Dilewati (bukan file teks): ' + f.name); return; }
      var r = new FileReader();
      r.onload = function () {
        var name = baseDir() + f.name;
        if (FS.has(name)) name = baseDir() + 'salinan-' + f.name;
        FS.write(name, String(r.result));
        FS.persist(); openFile(name);
      };
      r.readAsText(f);
    });
  }
  function doExport() {
    if (!FS.list().length) { toast('Belum ada file buat diekspor'); return; }
    var a = document.createElement('a');
    a.href = URL.createObjectURL(SW.zip(FS.all()));
    a.download = 'simuweb-project.zip';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    toast('ZIP siap — tinggal upload isinya ke GitHub');
  }
  function openTab() {
    if (!st.prev) { toast('Belum ada file HTML'); return; }
    var url = URL.createObjectURL(new Blob([P.build(st.prev)], { type: 'text/html' }));
    window.open(url, '_blank');
    setTimeout(function () { URL.revokeObjectURL(url); }, 20000);
  }

  /* ---------- init ---------- */
  function init() {
    ta = $('ta'); gut = $('gut'); frame = $('frame');

    ta.oninput = function () {
      if (!st.active) return;
      FS.write(st.active, ta.value);
      gutter(); status(); changed();
    };
    ta.onscroll = function () { gut.scrollTop = ta.scrollTop; };
    ta.onkeydown = function (e) {
      var s = ta.selectionStart, en = ta.selectionEnd, v = ta.value, ins = null;
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault(); FS.persist(); refresh(); toast('Disimpan & dimuat ulang'); return;
      }
      if (e.key === 'Tab') { e.preventDefault(); ins = '  '; }
      else if (e.key === 'Enter') {
        var ls = v.lastIndexOf('\n', s - 1) + 1, ind = /^[ \t]*/.exec(v.slice(ls, s))[0];
        e.preventDefault(); ins = '\n' + ind;
      }
      if (ins !== null) {
        ta.value = v.slice(0, s) + ins + v.slice(en);
        ta.selectionStart = ta.selectionEnd = s + ins.length;
        ta.oninput();
      }
    };

    $('addFile').onclick = askNewFile;
    $('addDir').onclick = askNewDir;
    $('btnNew').onclick = function () {
      ask('Template baru', 'Semua file sekarang diganti project contoh. Lanjut?', '', resetStarter, true);
    };
    $('btnImport').onclick = function () { $('fileIn').click(); };
    $('fileIn').onchange = function () { doImport(this.files); this.value = ''; };
    $('btnExport').onclick = doExport;
    $('pvRefresh').onclick = refresh;
    $('pvOpen').onclick = openTab;
    Array.prototype.forEach.call(document.querySelectorAll('[data-w]'), function (b) {
      b.onclick = function () {
        Array.prototype.forEach.call(document.querySelectorAll('[data-w]'), function (x) { x.className = ''; });
        b.className = 'on'; frame.style.width = b.getAttribute('data-w');
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll('.mob button'), function (b) {
      b.onclick = function () { setPane(b.getAttribute('data-go')); };
    });

    $('mForm').onsubmit = function (e) {
      e.preventDefault();
      var cb = askCb, v = $('mIn').value;
      closeAsk();
      if (cb) cb(v);
    };
    $('mNo').onclick = closeAsk;
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('modal').hidden) closeAsk(); });

    window.addEventListener('message', function (e) {
      var d = e.data;
      if (e.source !== frame.contentWindow || !d || d.sw !== 'nav') return;
      navTo(d);
    });

    if (!FS.load()) { FS.replaceAll(SW.starter()); FS.persist(); }
    var first = FS.has('index.html') ? 'index.html' : (firstHtml() || FS.list()[0]);
    if (first) { st.prev = ext(first) === 'html' ? first : (firstHtml() || 'index.html'); openFile(first); }
    else loadActive();
    refresh();
    if (narrow()) setPane('code');
  }

  init();
})();
