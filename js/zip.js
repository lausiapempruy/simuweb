/* SimuWeb — pembuat file ZIP (mode "store", tanpa kompresi) tanpa library */
window.SW = window.SW || {};
SW.zip = function (files) {
  var enc = new TextEncoder(), T = [], n, c, k, parts = [], cd = [], off = 0, count = 0;
  for (n = 0; n < 256; n++) {
    c = n;
    for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    T[n] = c >>> 0;
  }
  function crc(b) {
    var x = 0xFFFFFFFF, i;
    for (i = 0; i < b.length; i++) x = T[(x ^ b[i]) & 255] ^ (x >>> 8);
    return (x ^ 0xFFFFFFFF) >>> 0;
  }
  function u16(v) { return [v & 255, (v >>> 8) & 255]; }
  function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
  function cat() {
    var o = [], i;
    for (i = 0; i < arguments.length; i++) o = o.concat(arguments[i]);
    return new Uint8Array(o);
  }
  Object.keys(files).sort().forEach(function (p) {
    var nb = enc.encode(p), db = enc.encode(files[p]), h = crc(db), L = db.length;
    var lh = cat([0x50, 0x4b, 3, 4], u16(20), u16(0x0800), u16(0), u16(0), u16(33), u32(h), u32(L), u32(L), u16(nb.length), u16(0));
    parts.push(lh, nb, db);
    cd.push(cat([0x50, 0x4b, 1, 2], u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(33), u32(h), u32(L), u32(L),
      u16(nb.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off)), nb);
    off += lh.length + nb.length + L;
    count++;
  });
  var size = 0;
  cd.forEach(function (b) { size += b.length; });
  var end = cat([0x50, 0x4b, 5, 6], u16(0), u16(0), u16(count), u16(count), u32(size), u32(off), u16(0));
  return new Blob(parts.concat(cd, [end]), { type: 'application/zip' });
};
