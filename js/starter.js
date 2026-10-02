/* SimuWeb — project contoh "Kopi Senja" (multi-file, mirip struktur repo asli) */
window.SW = window.SW || {};
SW.starter = function () {
  function L() { return Array.prototype.join.call(arguments, '\n'); }
  return {
    'index.html': L(
      '<!DOCTYPE html>',
      '<html lang="id">',
      '<head>',
      '  <meta charset="UTF-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1">',
      '  <title>Kopi Senja</title>',
      '  <link rel="icon" href="assets/logo.svg">',
      '  <link rel="stylesheet" href="css/style.css">',
      '</head>',
      '<body>',
      '  <header>',
      '    <img src="assets/logo.svg" alt="Logo" width="40">',
      '    <h1>Kopi Senja</h1>',
      '    <a href="about.html">Tentang</a>',
      '  </header>',
      '  <main>',
      '    <p>Halo! Ini website pertamamu. Edit file di kiri, hasilnya langsung muncul di kanan.</p>',
      '    <h2>Menu hari ini</h2>',
      '    <ul id="menu"><li>Memuat…</li></ul>',
      '  </main>',
      '  <script src="js/main.js"></script>',
      '</body>',
      '</html>'
    ),
    'about.html': L(
      '<!DOCTYPE html>',
      '<html lang="id">',
      '<head>',
      '  <meta charset="UTF-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1">',
      '  <title>Tentang — Kopi Senja</title>',
      '  <link rel="stylesheet" href="css/style.css">',
      '</head>',
      '<body>',
      '  <header><h1>Tentang kami</h1><a href="index.html">← Beranda</a></header>',
      '  <main><p>Kopi Senja buka tiap sore. Halaman ini nyambung ke CSS yang sama, persis kayak website asli.</p></main>',
      '</body>',
      '</html>'
    ),
    'css/style.css': L(
      'body {',
      '  font-family: system-ui, sans-serif;',
      '  max-width: 560px;',
      '  margin: 0 auto;',
      '  padding: 24px;',
      '  background: #fff7ec;',
      '  color: #3b2a1a;',
      '}',
      'header { display: flex; align-items: center; gap: 12px; }',
      'header a { margin-left: auto; color: #c2410c; }',
      'li { padding: 6px 0; border-bottom: 1px dashed #e7c9a5; }'
    ),
    'js/main.js': L(
      '// Ambil data dari file JSON di dalam project',
      'fetch("data/menu.json")',
      '  .then(function (r) { return r.json(); })',
      '  .then(function (data) {',
      '    var ul = document.getElementById("menu");',
      '    ul.innerHTML = "";',
      '    data.forEach(function (m) {',
      '      var li = document.createElement("li");',
      '      li.textContent = m.nama + " — Rp" + m.harga;',
      '      ul.appendChild(li);',
      '    });',
      '  });'
    ),
    'data/menu.json': L(
      '[',
      '  { "nama": "Kopi Susu", "harga": 18000 },',
      '  { "nama": "Es Teh Tarik", "harga": 12000 },',
      '  { "nama": "Roti Bakar", "harga": 15000 }',
      ']'
    ),
    'assets/logo.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#ffb547"/><path d="M18 26h28v10a10 10 0 0 1-10 10h-8a10 10 0 0 1-10-10z" fill="#3b2a1a"/></svg>',
    'README.md': L(
      '# Kopi Senja',
      '',
      'Website pertamaku, dibuat di SimuWeb.',
      '',
      '- `index.html` halaman utama',
      '- `css/style.css` tampilan',
      '- `js/main.js` logika + ambil `data/menu.json`'
    )
  };
};
