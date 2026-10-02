/* SimuWeb — virtual file system (path -> isi teks), disimpan di localStorage */
window.SW = window.SW || {};
SW.FS = (function () {
  var KEY = 'simuweb.v1', files = {};

  function norm(p) {
    return String(p || '').replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^(\.\/|\/)+/, '').replace(/\/$/, '').replace(/^\s+|\s+$/g, '');
  }
  function dir(p) { var i = p.lastIndexOf('/'); return i < 0 ? '' : p.slice(0, i); }
  function resolve(base, rel) {
    rel = String(rel).split('#')[0].split('?')[0];
    var parts = rel.charAt(0) === '/' ? [] : base.split('/').filter(Boolean);
    rel.split('/').forEach(function (s) {
      if (s === '..') parts.pop(); else if (s && s !== '.') parts.push(s);
    });
    return parts.join('/');
  }
  function load() {
    try {
      var r = localStorage.getItem(KEY);
      if (r) { files = JSON.parse(r) || {}; return Object.keys(files).length > 0; }
    } catch (e) {}
    return false;
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(files)); return true; } catch (e) { return false; } }
  function list() { return Object.keys(files).sort(); }
  function has(p) { return Object.prototype.hasOwnProperty.call(files, p); }
  function read(p) { return has(p) ? files[p] : null; }
  function write(p, c) { files[p] = c; }
  function under(p, q) { return q === p || q.indexOf(p + '/') === 0; }
  function move(a, b) {
    var out = {}, k;
    for (k in files) { if (under(a, k)) out[b + k.slice(a.length)] = files[k]; else out[k] = files[k]; }
    files = out;
  }
  function remove(p) { var k; for (k in files) { if (under(p, k)) delete files[k]; } }
  function isDir(p) { return list().some(function (k) { return k.indexOf(p + '/') === 0; }); }
  function all() { var o = {}, k; for (k in files) o[k] = files[k]; return o; }
  function replaceAll(o) { files = {}; var k; for (k in o) files[k] = o[k]; }

  return { norm: norm, dir: dir, resolve: resolve, load: load, persist: persist, list: list, has: has,
           read: read, write: write, move: move, remove: remove, isDir: isDir, all: all, replaceAll: replaceAll };
})();
