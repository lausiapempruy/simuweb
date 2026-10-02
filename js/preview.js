/* SimuWeb — mesin pratinjau: link CSS, script, gambar SVG, dan fetch() dibaca dari file virtual */
window.SW = window.SW || {};
SW.Preview = (function () {
  var FS = SW.FS;

  function isExt(u) { return /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(u); }
  function attr(tag, n) {
    var m = new RegExp('\\b' + n + '\\s*=\\s*["\']([^"\']*)["\']', 'i').exec(tag);
    return m ? m[1] : null;
  }
  function dataUri(p) {
    var c = FS.read(p);
    if (c === null) return null;
    if (/\.svg$/i.test(p)) return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(c);
    return null;
  }
  function cssFix(css, base) {
    return css.replace(/url\(\s*["']?([^"')]+)["']?\s*\)/g, function (m, u) {
      if (isExt(u)) return m;
      var d = dataUri(FS.resolve(base, u));
      return d ? 'url("' + d + '")' : m;
    });
  }

  /* Dijalankan DI DALAM iframe (di-inject lewat toString) */
  function bridge(F, DIR) {
    function res(h) {
      h = String(h).split('#')[0].split('?')[0];
      var parts = h.charAt(0) === '/' ? [] : DIR.split('/').filter(Boolean);
      h.split('/').forEach(function (s) {
        if (s === '..') parts.pop(); else if (s && s !== '.') parts.push(s);
      });
      return parts.join('/');
    }
    var of = window.fetch;
    window.fetch = function (u) {
      u = (u && u.url) ? u.url : String(u);
      if (/^(https?:)?\/\//i.test(u)) return of.apply(window, arguments);
      var p = res(u);
      if (typeof F[p] === 'string') {
        var t = /\.json$/i.test(p) ? 'application/json' : 'text/plain';
        return Promise.resolve(new Response(F[p], { status: 200, headers: { 'Content-Type': t } }));
      }
      return Promise.resolve(new Response('Not found', { status: 404 }));
    };
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (!a || window.parent === window) return;
      var h = a.getAttribute('href');
      if (!h || h.charAt(0) === '#' || /^(javascript:|mailto:|tel:)/i.test(h)) return;
      e.preventDefault();
      window.parent.postMessage({ sw: 'nav', href: h, ext: /^([a-z][a-z0-9+.-]*:)?\/\//i.test(h), path: res(h) }, '*');
    });
  }

  function build(entry) {
    var html = FS.read(entry) || '', base = FS.dir(entry);

    html = html.replace(/<link\b[^>]*>/gi, function (tag) {
      var h = attr(tag, 'href');
      if (!h || isExt(h)) return tag;
      var p = FS.resolve(base, h), c = FS.read(p);
      if (c === null) return tag;
      var rel = (attr(tag, 'rel') || '').toLowerCase();
      if (rel.indexOf('stylesheet') > -1) return '<style>' + cssFix(c, FS.dir(p)) + '</style>';
      if (rel.indexOf('icon') > -1) { var d = dataUri(p); if (d) return tag.split(h).join(d); }
      return tag;
    });

    html = html.replace(/<script\b([^>]*?)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi, function (m, a, s, b) {
      if (isExt(s)) return m;
      var c = FS.read(FS.resolve(base, s));
      if (c === null) return m;
      return '<script' + a + b + '>' + c.replace(/<\/script/gi, '<\\/script') + '<\/script>';
    });

    html = html.replace(/(<img\b[^>]*?\bsrc\s*=\s*["'])([^"']+)(["'])/gi, function (m, a, s, b) {
      if (isExt(s)) return m;
      var d = dataUri(FS.resolve(base, s));
      return d ? a + d + b : m;
    });

    var code = '(' + bridge.toString() + ')(' + JSON.stringify(FS.all()) + ',' + JSON.stringify(base) + ');';
    code = code.replace(/<\//g, '<\\/').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    var inj = '<script>' + code + '<\/script>';
    if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, function (m) { return m + inj; });
    return inj + html;
  }

  return { build: build };
})();
