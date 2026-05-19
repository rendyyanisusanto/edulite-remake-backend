'use strict';

const PDFDocument = require('pdfkit');
const db = require('../../models');

class StudentItemDepositPdfService {
  async fetchPrintData(id) {
    const deposit = await db.StudentItemDeposit.findByPk(id, {
      include: [
        { model: db.Student, as: 'student', attributes: ['id', 'nis', 'nisn', 'full_name'] },
        { model: db.Class, as: 'class', attributes: ['id', 'name'], required: false },
        { model: db.StudentItemCategory, as: 'category', attributes: ['id', 'name'], required: false },
        { model: db.User, as: 'receivedBy', attributes: ['id', 'name'], required: false }
      ]
    });

    if (!deposit) {
      const err = new Error('Data penitipan tidak ditemukan');
      err.statusCode = 404;
      err.errorCode = 'NOT_FOUND';
      throw err;
    }

    const schoolProfile = await db.SchoolProfile.findOne();
    return { deposit, schoolProfile };
  }

  async generatePdf(data) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      this.renderDocument(doc, data);
      doc.end();
    });
  }

  renderDocument(doc, { deposit, schoolProfile }) {
    const d = deposit;

    doc.font('Helvetica-Bold').fontSize(14).text(schoolProfile?.school_name || 'SEKOLAH', { align: 'center' });
    doc.font('Helvetica').fontSize(10).text(schoolProfile?.address || '-', { align: 'center' });
    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').fontSize(13).text('BUKTI PENITIPAN BARANG SISWA', { align: 'center' });
    doc.moveDown(1);

    const rows = [
      ['Kode Titipan', d.code || '-'],
      ['Tanggal Titip', this.formatDateTime(d.deposit_date)],
      ['Nama Siswa', d.student?.full_name || '-'],
      ['NIS / NISN', `${d.student?.nis || '-'} / ${d.student?.nisn || '-'}`],
      ['Kelas', d.class?.name || '-'],
      ['Kategori Barang', d.category?.name || '-'],
      ['Nama Barang', d.item_name || '-'],
      ['Merk / Model', `${d.brand || '-'} / ${d.model || '-'}`],
      ['Warna', d.color || '-'],
      ['Serial Number / IMEI', `${d.serial_number || '-'} / ${d.imei || '-'}`],
      ['Kondisi Saat Dititipkan', d.condition_in || '-'],
      ['Kelengkapan', d.accessories || '-'],
      ['Lokasi Penyimpanan', d.storage_location || '-'],
      ['Petugas Penerima', d.receivedBy?.name || '-'],
      ['Catatan', d.notes || '-']
    ];

    const startX = 55;
    let y = doc.y;
    rows.forEach(([label, value]) => {
      doc.font('Helvetica').fontSize(10).text(label, startX, y, { width: 170, continued: false });
      doc.font('Helvetica').fontSize(10).text(`: ${value}`, startX + 175, y, { width: 340 });
      y = doc.y + 2;
    });

    y += 40;
    const rightX = 360;
    doc.font('Helvetica').fontSize(10).text('Petugas,', rightX, y, { width: 170, align: 'center' });
    doc.font('Helvetica').text('Siswa,', 80, y, { width: 170, align: 'center' });
    y += 80;
    doc.font('Helvetica-Bold').text(d.receivedBy?.name || '(........................)', rightX, y, { width: 170, align: 'center' });
    doc.font('Helvetica-Bold').text(d.student?.full_name || '(........................)', 80, y, { width: 170, align: 'center' });
  }

  formatDateTime(value) {
    if (!value) return '-';
    return new Date(value).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

module.exports = new StudentItemDepositPdfService();
