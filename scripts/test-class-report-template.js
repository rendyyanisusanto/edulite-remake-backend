const classReportLayout = require('../src/templates/classReports/classReportLayout');

console.log('Testing class report template...\n');

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
    full_name: 'Test Teacher',
    nip: '19800101 202001 1 001',
    position: 'Guru Produkktif',
    photo: null
  },
  students: [
    { nis: '1001', nisn: '0012345678', full_name: 'Siswa Test 1', gender: 'L', photo: null },
    { nis: '1002', nisn: '0012345679', full_name: 'Siswa Test 2', gender: 'P', photo: null }
  ],
  totalStudents: 2,
  printDate: '07/08/2026, 10:30:00',
  showToolbar: true,
  pdfUrl: '/test.pdf'
});

console.log('✅ Template generated successfully');
console.log('✅ HTML length:', testHtml.length, 'characters');
console.log('\nSample from template:');
console.log(testHtml.substring(0, 300) + '...\n');

process.exit(0);
