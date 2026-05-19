'use strict';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

module.exports = function receiptLayout({ title, schoolProfile, code, datetime, rows = [], officer = '-', notes = '-', showToolbar = false, pdfUrl = '#' }) {
    return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(title)}</title>
<style>
  body { font-family: "Courier New", monospace; margin:0; background:#fff; }
  .toolbar { display:${showToolbar ? 'flex' : 'none'}; gap:8px; padding:8px; border-bottom:1px solid #ddd; font-family: Arial, sans-serif; }
  .btn { border:1px solid #aaa; padding:6px 10px; border-radius:6px; text-decoration:none; color:#111; font-size:12px; }
  .wrap { width: 80mm; margin: 0 auto; padding: 6mm 2mm; font-size: 11px; line-height: 1.35; }
  .receipt { width: 76mm; margin: 0 auto; }
  .center { text-align: center; }
  .line { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display:flex; justify-content:space-between; gap:8px; }
  .label { width:28mm; }
  .value { flex:1; text-align:right; word-break: break-word; }
  .signatures { display:flex; justify-content:space-between; margin-top: 18px; }
</style>
</head>
<body>
  <div class="toolbar">
    <a class="btn" href="${esc(pdfUrl)}">Download PDF</a>
    <a class="btn" href="javascript:history.back()">Kembali</a>
  </div>
  <div class="wrap"><div class="receipt">
    <div class="center"><strong>${esc(schoolProfile?.school_name || schoolProfile?.name || 'Sekolah')}</strong></div>
    <div class="center">${esc([schoolProfile?.address, schoolProfile?.city].filter(Boolean).join(', '))}</div>
    <div class="center">${esc(schoolProfile?.phone || schoolProfile?.telephone || '')}</div>
    <div class="line"></div>
    <div class="center"><strong>${esc(title)}</strong></div>
    <div class="row"><span class="label">No</span><span class="value">${esc(code || '-')}</span></div>
    <div class="row"><span class="label">Tanggal</span><span class="value">${esc(datetime || '-')}</span></div>
    <div class="line"></div>
    ${rows.map((r) => `<div class="row"><span class="label">${esc(r.label)}</span><span class="value">${esc(r.value)}</span></div>`).join('')}
    <div class="line"></div>
    <div class="row"><span class="label">Petugas</span><span class="value">${esc(officer || '-')}</span></div>
    <div class="row"><span class="label">Catatan</span><span class="value">${esc(notes || '-')}</span></div>
    <div class="line"></div>
    <div>Tanda tangan:</div>
    <div class="signatures"><div>Petugas<br><br>(_______)</div><div>Siswa<br><br>(_______)</div></div>
    <div class="line"></div>
    <div class="center">Dicetak oleh Edulite</div>
  </div></div>
</body>
</html>`;
};
