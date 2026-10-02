# SimuWeb

Bikin website di dalam website. Workspace mini di browser: bikin file & folder, edit kode, lihat hasilnya langsung, lalu ekspor ke ZIP.

## Struktur repo

```
simuweb/
├── index.html
├── README.md
└── assets/
    ├── css/style.css
    └── js/
        ├── fs.js        virtual file system (localStorage)
        ├── zip.js       pembuat ZIP tanpa library
        ├── preview.js   mesin pratinjau (gabung HTML + CSS + JS + JSON)
        ├── starter.js   project contoh "Kopi Senja"
        └── app.js       UI & logika utama
```

## Deploy ke GitHub Pages

1. Upload semua isi folder ini ke repo GitHub.
2. Settings → Pages → Source: `main` / root.
3. Buka link Pages-nya, selesai.

## Fitur

- File & folder bebas (path seperti `assets/css/tema.css`), ganti nama, pindah, hapus
- Tipe file teks: html, css, js, json, md, txt, svg, xml, csv, yml
- Live preview: `<link>` CSS, `<script src>`, gambar SVG, dan `fetch()` ke file JSON dibaca dari project
- Klik link antar halaman (`about.html`) tetap jalan di pratinjau
- Mode Desktop / HP, buka di tab baru
- Ekspor ZIP, impor file dari perangkat
- Auto-save di browser (localStorage), `Ctrl/Cmd + S` untuk muat ulang pratinjau
- Tampilan HP: panel File / Kode / Hasil dipisah lewat tab bawah

## Catatan

Project tersimpan di browser yang sama. Kalau mau dipindah atau dibackup, pakai Ekspor ZIP.
