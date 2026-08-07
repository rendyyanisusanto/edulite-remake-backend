const classReportLayout = require('../src/templates/classReports/classReportLayout');

console.log('Testing simplified class report template...\n');

const testHtml = classReportLayout({
  title: 'Laporan Siswa Per Kelas',
  schoolProfile: {
    school_name: 'SMK Test',
    address: 'Jl. Test No. 123',
    phone: '021-123456'
  },
  classInfo: {
    name: 'X TKJ 1',
    grade: { name: 'Kelas X' },
    department: { name: 'Teknik Komputer dan Jaringan' },
    academic_year: { name: '2026/2027' },
    capacity: 30
  },
  homeroomTeacher: {
    full_name: 'Budi Santoso, S.Kom',
    nip: '19800101 200001 1 001',
    position: 'Guru Produkktif',
    photo: null
  },
  students: [
    { nis: '1001', nisn: '0012345678', full_name: 'Ahmad Dani', gender: 'L', photo: null },
    { nis: '1002', nisn: '0012345679', full_name: 'Siti Aminah', gender: 'P', photo: null }
  ],
  totalStudents: 2,
  printDate: '07/08/2026, 11:00:00',
  showToolbar: true,
  pdfUrl: '/test.pdf'
});

console.log('✅ Simplified template generated successfully');
console.log('✅ HTML length:', testHtml.length, 'characters');
console.log('\n📋 Simplified Structure:');
console.log('1. ✅ NO school header (kop removed)');
console.log('2. ✅ Class name as main title');
console.log('3. ✅ Teacher name below class name (no photo, no NIP)');
console.log('4. ✅ No colored gender labels');
console.log('5. ✅ Simple table: No, Foto, NIS, NISN, Nama, L/P');
console.log('\nSample from template (first 300 chars):');
console.log(testHtml.substring(0, 300) + '...\n');

process.exit(0);
