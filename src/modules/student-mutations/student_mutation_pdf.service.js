'use strict';

const PDFDocument = require('pdfkit');
const { StudentMutation, Student, User, DocumentSetting, SchoolProfile, AcademicYear } = require('../../models');

class StudentMutationPdfService {
    async fetchPrintData(id) {
        const mutation = await StudentMutation.findByPk(id, {
            include: [
                { model: Student, as: 'student', attributes: ['id', 'nis', 'nisn', 'full_name', 'student_status'] },
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'], required: false },
                { model: User, as: 'creator', attributes: ['id', 'name'], required: false },
                { model: User, as: 'approver', attributes: ['id', 'name'], required: false }
            ]
        });

        if (!mutation) {
            const err = new Error('Data mutasi tidak ditemukan');
            err.statusCode = 404;
            err.errorCode = 'NOT_FOUND';
            throw err;
        }

        const [documentSetting, schoolProfile] = await Promise.all([
            DocumentSetting.findOne({
                where: { document_type: 'MUTATION', is_active: true },
                order: [['updated_at', 'DESC']]
            }),
            SchoolProfile.findOne()
        ]);

        return { mutation, documentSetting, schoolProfile };
    }

    async generatePdf(data) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50
            });

            const buffers = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            this.renderDocument(doc, data);
            doc.end();
        });
    }

    renderDocument(doc, data) {
        const { mutation, documentSetting, schoolProfile } = data;
        const student = mutation.student || {};

        doc.fontSize(14).font('Helvetica-Bold').text('SURAT KETERANGAN MUTASI SISWA', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica').text(schoolProfile?.name || 'Sekolah', { align: 'center' });
        doc.moveDown(1);

        const city = documentSetting?.city || schoolProfile?.city || 'Kota';
        const dateLabel = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        doc.fontSize(10).text(`${city}, ${dateLabel}`, { align: 'right' });
        doc.moveDown(1);

        const rows = [
            ['Nomor Dokumen', mutation.document_number || '-'],
            ['Jenis Mutasi', mutation.mutation_type],
            ['Kategori', mutation.mutation_category],
            ['Status', mutation.status],
            ['Tahun Ajaran', mutation.academic_year?.name || '-'],
            ['Tanggal Mutasi', this.formatDate(mutation.mutation_date)],
            ['Tanggal Efektif', this.formatDate(mutation.effective_date)],
            ['Nama Siswa', student.full_name || '-'],
            ['NIS / NISN', `${student.nis || '-'} / ${student.nisn || '-'}`],
            ['Sekolah Asal', mutation.origin_school || '-'],
            ['Sekolah Tujuan', mutation.destination_school || '-']
        ];

        rows.forEach(([label, value]) => {
            doc.font('Helvetica-Bold').text(`${label}:`, { continued: true });
            doc.font('Helvetica').text(` ${value}`);
        });

        doc.moveDown(0.8);
        doc.font('Helvetica-Bold').text('Alasan Mutasi');
        doc.font('Helvetica').text(mutation.reason || '-');

        if (mutation.description) {
            doc.moveDown(0.8);
            doc.font('Helvetica-Bold').text('Deskripsi');
            doc.font('Helvetica').text(mutation.description);
        }

        if (mutation.notes) {
            doc.moveDown(0.8);
            doc.font('Helvetica-Bold').text('Catatan');
            doc.font('Helvetica').text(mutation.notes);
        }

        doc.moveDown(2);
        doc.font('Helvetica').text('Mengetahui,', { align: 'right' });
        doc.moveDown(3);

        doc.font('Helvetica-Bold').text(
            documentSetting?.signer_name ||
            schoolProfile?.principal_name ||
            mutation.approver?.name ||
            '-',
            { align: 'right' }
        );
        doc.font('Helvetica').text(
            documentSetting?.signer_title ||
            schoolProfile?.principal_title ||
            'Penanggung Jawab',
            { align: 'right' }
        );
        if (documentSetting?.signer_nip || schoolProfile?.principal_nip) {
            doc.text(`NIP: ${documentSetting?.signer_nip || schoolProfile?.principal_nip}`, { align: 'right' });
        }
    }

    formatDate(value) {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    }
}

module.exports = new StudentMutationPdfService();
