const classReportLayout = require('../src/templates/classReports/classReportLayout');

console.log('Testing final class report template...\n');

const testHtml = classReportLayout({
  title: 'Laporan Siswa Per Kelas',
  schoolProfile: {
    school_name: 'SMK Negeri 1 Test',
    address: 'Jl. Pendidikan No. 123, Jakarta',
    phone: '021-12345678'
  },
  classInfo: {
    name: 'XI TKJ 2',
    grade: { name: 'Kelas XI' },
    department: { name: 'Teknik Komputer dan Jaringan' },
    academic_year: { name: '2026/2027' },
    capacity: 32
  },
  homeroomTeacher: {
    full_name: 'Ahmad Hidayat, S.Kom',
    nip: '19850515 201001 1 001',
    position: 'Guru Produkktif',
    photo: null
  },
  students: [
    { nis: '2051', nisn: '0012345678', full_name: 'Dani Pratama', gender: 'L', photo: null },
    { nis: '2052', nisn: '0012345679', full_name: 'Rina Melati', gender: 'P', photo: null },
    { nis: '2053', nisn: '0012345680', full_name: 'Doni Saputra', gender: 'L', photo: null }
  ],
  totalStudents: 3,
  printDate: '07/08/2026, 11:15:00',
  showToolbar: true,
  pdfUrl: '/test.pdf'
});

console.log('✅ Final template generated successfully');
console.log('✅ HTML length:', testHtml.length, 'characters');
console.log('\n📋 Final Structure:');
console.log('1. ✅ School header (kop) - nama, alamat, telp');
console.log('2. ✅ Class name as main title');
console.log('3. ✅ Class identity - tingkat, jurusan, tahun ajaran, kapasitas (one line)');
console.log('4. ✅ Homeroom teacher - teks biasa tanpa card');
console.log('5. ✅ Simple table - No, Foto, NIS, NISN, Nama, L/P (no colors)');
console.log('6. ✅ Simple footer');
console.log('\nPreview (first 500 chars):');
console.log(testHtml.substring(200, 700));

process.exit(0);
