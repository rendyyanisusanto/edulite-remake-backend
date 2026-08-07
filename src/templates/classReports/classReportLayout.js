'use strict';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[m]));

const getPhotoUrl = (photo) => {
  if (!photo) return null;
  if (photo.startsWith('http')) return photo;
  return `/uploads/${photo}`;
};

const formatGender = (gender) => {
  if (gender === 'L') return 'Laki-laki';
  if (gender === 'P') return 'Perempuan';
  return '-';
};

module.exports = function classReportLayout({
  title, schoolProfile, classInfo, homeroomTeacher, students = [],
  totalStudents = 0, printDate, showToolbar = false, pdfUrl = '#'
}) {
  const className = classInfo?.name || '-';
  const gradeName = classInfo?.grade?.name || '-';
  const deptName = classInfo?.department?.name || '-';
  const academicYear = classInfo?.academic_year?.name || '-';
  const capacity = classInfo?.capacity || 0;

  const waliName = homeroomTeacher?.full_name || null;

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${esc(title)} - ${esc(className)}</title>
  <style>
    body { font-family: Arial, sans-serif; color:#111; margin:0; background:#fff; }
    .toolbar { display:${showToolbar ? 'flex' : 'none'}; gap:8px; padding:10px; border-bottom:1px solid #ddd; position:sticky; top:0; background:#fff; z-index:100; }
    .btn { border:1px solid #aaa; padding:6px 10px; border-radius:6px; text-decoration:none; color:#111; font-size:12px; background:#fff; cursor:pointer; }
    .btn:hover { background:#f5f5f5; }
    .btn-primary { background:#000; color:#fff; border-color:#000; }
    .btn-primary:hover { background:#333; }
    .page { padding:16px; max-width:1200px; margin:0 auto; }
    .report-title { text-align:center; margin:30px 0 25px 0; }
    .report-title h1 { margin:0 0 10px; font-size:20px; font-weight:bold; }
    .class-identity { text-align:center; margin:20px 0 30px 0; font-size:12px; color:#555; }
    .class-identity p { margin:3px 0; }
    .teacher-name { text-align:center; font-size:13px; color:#333; margin:15px 0 25px 0; font-weight:500; }
    table { width:100%; border-collapse:collapse; font-size:11px; }
    th, td { border:1px solid #ddd; padding:8px; text-align:left; vertical-align:middle; }
    th { background:#f0f0f0; font-weight:bold; text-align:center; }
    .text-center { text-align:center; }
    .number-col { width:40px; text-align:center; }
    .photo-col { width:50px; }
    .student-photo { width:30px; height:35px; object-fit:cover; border-radius:50%; border:1px solid #ddd; }
    .footer { margin-top:20px; padding-top:15px; border-top:1px solid #ddd; font-size:10px; color:#666; display:flex; justify-content:space-between; }
    @media print {
      .toolbar { display:none !important; }
      body { margin:0; }
      .page { padding:10px; max-width:none; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <a class="btn btn-primary" href="${esc(pdfUrl)}">Download PDF</a>
    <button class="btn" onclick="window.print()">Cetak Web</button>
    <a class="btn" href="javascript:history.back()">Kembali</a>
  </div>

  <div class="page">
    <div class="report-title">
      <h1>${esc(className)}</h1>
    </div>

    <div class="class-identity">
      <p><strong>Tingkat:</strong> ${esc(gradeName)} | <strong>Jurusan:</strong> ${esc(deptName)} | <strong>Tahun Ajaran:</strong> ${esc(academicYear)} | <strong>Kapasitas:</strong> ${capacity} siswa</p>
    </div>

    ${waliName ? `<p class="teacher-name">Wali Kelas: ${esc(waliName)}</p>` : ''}

    <table>
      <thead>
        <tr>
          <th class="number-col">No</th>
          <th class="photo-col">Foto</th>
          <th>NIS</th>
          <th>NISN</th>
          <th>Nama Lengkap</th>
          <th>L/P</th>
        </tr>
      </thead>
      <tbody>
        ${students.length > 0 ? students.map((student, index) => {
          const studentPhoto = getPhotoUrl(student.photo);
          return `<tr>
            <td class="text-center">${index + 1}</td>
            <td class="text-center">
              ${studentPhoto ?
                `<img src="${esc(studentPhoto)}" alt="Foto" class="student-photo" onerror="this.style.display='none'"/>` :
                '<span style="color:#999;font-size:9px;">-</span>'
              }
            </td>
            <td>${esc(student.nis || '-')}</td>
            <td>${esc(student.nisn || '-')}</td>
            <td>${esc(student.full_name || '-')}</td>
            <td class="text-center">${formatGender(student.gender)}</td>
          </tr>`;
        }).join('') : '<tr><td colspan="6" class="text-center">Tidak ada data siswa</td></tr>'}
      </tbody>
    </table>

    <div class="footer">
      <span>Total: ${totalStudents} siswa</span>
      <span>Dicetak pada ${esc(printDate)}</span>
    </div>
  </div>
</body>
</html>`;
};
