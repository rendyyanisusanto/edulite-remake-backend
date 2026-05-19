'use strict';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

module.exports = function reportLayout({ title, schoolProfile, filtersText, tableHeaders = [], tableRows = [], footerText, showToolbar = false, pdfUrl = '#' }) {
    return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${esc(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color:#111; margin:0; background:#fff; }
    .toolbar { display:${showToolbar ? 'flex' : 'none'}; gap:8px; padding:10px; border-bottom:1px solid #ddd; position:sticky; top:0; background:#fff; }
    .btn { border:1px solid #aaa; padding:6px 10px; border-radius:6px; text-decoration:none; color:#111; font-size:12px; }
    .page { padding:16px; }
    .head { display:flex; justify-content:space-between; align-items:flex-start; }
    h1 { margin:0 0 4px; font-size:18px; }
    .meta { font-size:12px; color:#444; }
    table { width:100%; border-collapse:collapse; font-size:11px; }
    th, td { border:1px solid #ddd; padding:6px; vertical-align:top; }
    th { background:#f7f7f7; text-align:left; }
    .foot { margin-top:10px; font-size:11px; color:#666; }
    @media print {
      .toolbar { display:none !important; }
      body { margin:0; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <a class="btn" href="${esc(pdfUrl)}">Download PDF</a>
    <a class="btn" href="javascript:history.back()">Kembali</a>
  </div>
  <div class="page">
    <div class="head">
      <div>
        <h1>${esc(schoolProfile?.school_name || schoolProfile?.name || 'Sekolah')}</h1>
        <div class="meta">${esc(schoolProfile?.address || '-')}</div>
        <div class="meta">${esc(schoolProfile?.phone || schoolProfile?.telephone || '')}</div>
      </div>
      <div class="meta">${esc(new Date().toLocaleString('id-ID'))}</div>
    </div>
    <h2 style="margin:10px 0 6px;font-size:16px;">${esc(title)}</h2>
    <div class="meta">Filter: ${esc(filtersText || '-')}</div>
    <table>
      <thead><tr>${tableHeaders.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>
        ${tableRows.length ? tableRows.map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${tableHeaders.length || 1}">Tidak ada data</td></tr>`}
      </tbody>
    </table>
    <div class="foot">${esc(footerText || `Dicetak oleh Edulite pada ${new Date().toLocaleString('id-ID')}`)}</div>
  </div>
</body>
</html>`;
};
