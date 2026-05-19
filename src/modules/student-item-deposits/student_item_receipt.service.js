'use strict';

const db = require('../../models');
const pdfService = require('../../services/pdfService');
const depositTpl = require('../../templates/studentItemReceipts/depositReceipt');
const loanTpl = require('../../templates/studentItemReceipts/loanReceipt');
const dailyReturnTpl = require('../../templates/studentItemReceipts/dailyReturnReceipt');
const finalReturnTpl = require('../../templates/studentItemReceipts/finalReturnReceipt');

const dt = (v) => (v ? new Date(v).toLocaleString('id-ID') : '-');
const mins = (a, b) => (!a || !b ? 0 : Math.max(0, Math.round((new Date(b) - new Date(a)) / 60000)));

class StudentItemReceiptService {
    async schoolProfile() { return db.SchoolProfile.findOne(); }

    async buildDeposit(depositId) {
        const deposit = await db.StudentItemDeposit.findByPk(depositId, { include: [{ model: db.Student, as: 'student', attributes: ['full_name', 'nis', 'nisn'] }, { model: db.Class, as: 'class', attributes: ['name'], required: false }, { model: db.StudentItemCategory, as: 'category', attributes: ['name'], required: false }, { model: db.User, as: 'receivedBy', attributes: ['name'], required: false }] });
        if (!deposit) { const e = new Error('Data titipan tidak ditemukan'); e.statusCode = 404; e.errorCode = 'NOT_FOUND'; throw e; }
        return {
            schoolProfile: await this.schoolProfile(),
            deposit: { code: deposit.code, deposit_date_text: dt(deposit.deposit_date), received_by_name: deposit.receivedBy?.name || '-', notes: deposit.notes || '-' },
            rows: [
                { label: 'Siswa', value: deposit.student?.full_name || '-' }, { label: 'NIS/NISN', value: `${deposit.student?.nis || '-'} / ${deposit.student?.nisn || '-'}` }, { label: 'Kelas', value: deposit.class?.name || '-' },
                { label: 'Kategori', value: deposit.category?.name || '-' }, { label: 'Barang', value: deposit.item_name || '-' }, { label: 'Merk/Model', value: `${deposit.brand || '-'} / ${deposit.model || '-'}` },
                { label: 'Warna', value: deposit.color || '-' }, { label: 'SN/IMEI', value: `${deposit.serial_number || '-'} / ${deposit.imei || '-'}` }, { label: 'Kondisi', value: deposit.condition_in || '-' }, { label: 'Kelengkapan', value: deposit.accessories || '-' }, { label: 'Lokasi', value: deposit.storage_location || '-' }
            ]
        };
    }

    async buildLoan(loanId) {
        const loan = await db.StudentItemLoan.findByPk(loanId, { include: [{ model: db.Student, as: 'student', attributes: ['full_name', 'nis'] }, { model: db.StudentItemDeposit, as: 'deposit', include: [{ model: db.Class, as: 'class', attributes: ['name'], required: false }, { model: db.StudentItemCategory, as: 'category', attributes: ['name'], required: false }] }, { model: db.User, as: 'borrowApprovedBy', attributes: ['name'], required: false }, { model: db.User, as: 'returnConfirmedBy', attributes: ['name'], required: false }] });
        if (!loan) { const e = new Error('Data peminjaman tidak ditemukan'); e.statusCode = 404; e.errorCode = 'NOT_FOUND'; throw e; }
        return {
            schoolProfile: await this.schoolProfile(),
            deposit: { code: loan.deposit?.code || '-' },
            loan: {
                borrowed_at_text: dt(loan.borrowed_at), returned_at_text: dt(loan.returned_at), borrow_approved_by_name: loan.borrowApprovedBy?.name || '-', return_confirmed_by_name: loan.returnConfirmedBy?.name || '-', borrow_note: loan.borrow_note || '-', return_note: loan.return_note || '-'
            },
            rows: [
                { label: 'Tanggal Pinjam', value: loan.loan_date || '-' }, { label: 'Jam Pinjam', value: dt(loan.borrowed_at) }, { label: 'Siswa', value: loan.student?.full_name || '-' }, { label: 'Kelas', value: loan.deposit?.class?.name || '-' },
                { label: 'Barang', value: loan.deposit?.item_name || '-' }, { label: 'Kategori', value: loan.deposit?.category?.name || '-' }, { label: 'Status', value: 'DIPINJAM' }, { label: 'Metode', value: loan.borrow_method || '-' }
            ]
        };
    }

    async buildDailyReturn(loanId) {
        const data = await this.buildLoan(loanId);
        const loan = await db.StudentItemLoan.findByPk(loanId);
        data.rows = [
            { label: 'Tanggal Pinjam', value: loan.loan_date || '-' }, { label: 'Jam Pinjam', value: dt(loan.borrowed_at) }, { label: 'Jam Kembali', value: dt(loan.returned_at) }, { label: 'Durasi (mnt)', value: mins(loan.borrowed_at, loan.returned_at) },
            { label: 'Siswa', value: data.rows.find((x) => x.label === 'Siswa')?.value || '-' }, { label: 'Kelas', value: data.rows.find((x) => x.label === 'Kelas')?.value || '-' }, { label: 'Barang', value: data.rows.find((x) => x.label === 'Barang')?.value || '-' },
            { label: 'Status', value: 'DIKEMBALIKAN' }, { label: 'Metode', value: loan.return_method || '-' }
        ];
        return data;
    }

    async buildFinalReturn(finalReturnId) {
        const f = await db.StudentItemFinalReturn.findByPk(finalReturnId, { include: [{ model: db.StudentItemDeposit, as: 'deposit', include: [{ model: db.Student, as: 'student', attributes: ['full_name'] }, { model: db.Class, as: 'class', attributes: ['name'], required: false }] }, { model: db.User, as: 'handedBy', attributes: ['name'], required: false }] });
        if (!f) { const e = new Error('Data pengambilan permanen tidak ditemukan'); e.statusCode = 404; e.errorCode = 'NOT_FOUND'; throw e; }
        return {
            schoolProfile: await this.schoolProfile(),
            deposit: { code: f.deposit?.code || '-' },
            finalReturn: { return_date_text: dt(f.return_date), handed_by_name: f.handedBy?.name || '-', notes: f.notes || '-' },
            rows: [
                { label: 'Tanggal Ambil', value: dt(f.return_date) }, { label: 'Siswa', value: f.deposit?.student?.full_name || '-' }, { label: 'Kelas', value: f.deposit?.class?.name || '-' }, { label: 'Barang', value: f.deposit?.item_name || '-' },
                { label: 'Diambil Oleh', value: f.returned_to || '-' }, { label: 'Tipe', value: f.returned_to_type || '-' }, { label: 'Hubungan', value: f.returned_to_relation || '-' }, { label: 'Alasan', value: f.return_reason || '-' }, { label: 'Kondisi', value: f.condition_out || '-' }
            ]
        };
    }

    async render(kind, id, mode) {
        const base = `/api/v1/student-item-receipts/${kind}/${id}`;
        let html;
        if (kind === 'deposit') html = depositTpl({ data: await this.buildDeposit(id), showToolbar: true, pdfUrl: `${base}/pdf` });
        if (kind === 'loan') html = loanTpl({ data: await this.buildLoan(id), showToolbar: true, pdfUrl: `${base}/pdf` });
        if (kind === 'daily-return') html = dailyReturnTpl({ data: await this.buildDailyReturn(id), showToolbar: true, pdfUrl: `${base}/pdf` });
        if (kind === 'final-return') html = finalReturnTpl({ data: await this.buildFinalReturn(id), showToolbar: true, pdfUrl: `${base}/pdf` });
        if (!html) { const e = new Error('Jenis nota tidak valid'); e.statusCode = 400; e.errorCode = 'VALIDATION_ERROR'; throw e; }
        if (mode === 'preview') return { type: 'html', content: html };
        const pdf = await pdfService.renderHtmlToPdf(html, { format: 'A5', margin: { top: '6mm', right: '5mm', bottom: '6mm', left: '5mm' }, printBackground: true });
        return { type: 'pdf', content: pdf };
    }
}

module.exports = new StudentItemReceiptService();
