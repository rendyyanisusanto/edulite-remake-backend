'use strict';

const svc = require('./student_item_deposit.service');
const pdfSvc = require('./student_item_deposit_pdf.service');

const ok = (res, message, data) => res.json({ success: true, message, data });

exports.getCategories = async (req, res, next) => { try { ok(res, 'Data kategori berhasil diambil', await svc.getCategories(req.query)); } catch (e) { next(e); } };
exports.createCategory = async (req, res, next) => { try { ok(res.status(201), 'Kategori berhasil dibuat', await svc.createCategory(req.body)); } catch (e) { next(e); } };
exports.getCategoryById = async (req, res, next) => { try { ok(res, 'Data kategori berhasil diambil', await svc.getCategoryById(req.params.id)); } catch (e) { next(e); } };
exports.updateCategory = async (req, res, next) => { try { ok(res, 'Kategori berhasil diperbarui', await svc.updateCategory(req.params.id, req.body)); } catch (e) { next(e); } };
exports.deleteCategory = async (req, res, next) => { try { await svc.deleteCategory(req.params.id); ok(res, 'Kategori berhasil dihapus', null); } catch (e) { next(e); } };

exports.getDeposits = async (req, res, next) => { try { ok(res, 'Data penitipan berhasil diambil', await svc.getDeposits(req.query)); } catch (e) { next(e); } };
exports.createDeposit = async (req, res, next) => { try { ok(res.status(201), 'Penitipan barang berhasil dibuat', await svc.createDeposit(req.body, req.user, req.file)); } catch (e) { next(e); } };
exports.getDepositById = async (req, res, next) => { try { ok(res, 'Detail penitipan berhasil diambil', await svc.getDepositById(req.params.id)); } catch (e) { next(e); } };
exports.updateDeposit = async (req, res, next) => { try { ok(res, 'Data penitipan berhasil diperbarui', await svc.updateDeposit(req.params.id, req.body, req.user, req.file)); } catch (e) { next(e); } };

exports.cancelDeposit = async (req, res, next) => { try { ok(res, 'Penitipan berhasil dibatalkan', await svc.cancelDeposit(req.params.id, req.body, req.user)); } catch (e) { next(e); } };
exports.markLost = async (req, res, next) => { try { ok(res, 'Barang ditandai hilang', await svc.markLost(req.params.id, req.body, req.user)); } catch (e) { next(e); } };
exports.markDamaged = async (req, res, next) => { try { ok(res, 'Barang ditandai rusak', await svc.markDamaged(req.params.id, req.body, req.user)); } catch (e) { next(e); } };

exports.loanDeposit = async (req, res, next) => { try { ok(res, 'Barang berhasil dipinjam', await svc.loanDeposit(req.params.id, req.body, req.user, 'WEB_ADMIN')); } catch (e) { next(e); } };
exports.returnDaily = async (req, res, next) => { try { ok(res, 'Barang berhasil dikembalikan', await svc.returnDaily(req.params.id, req.body, req.user, 'WEB_ADMIN')); } catch (e) { next(e); } };
exports.finalReturn = async (req, res, next) => { try { ok(res, 'Barang berhasil diambil permanen', await svc.finalReturn(req.params.id, req.body, req.user, req.file)); } catch (e) { next(e); } };

exports.getLoans = async (req, res, next) => { try { ok(res, 'Data peminjaman berhasil diambil', await svc.getLoans(req.query, 'all')); } catch (e) { next(e); } };
exports.getActiveLoans = async (req, res, next) => { try { ok(res, 'Data barang belum kembali berhasil diambil', await svc.getLoans(req.query, 'active')); } catch (e) { next(e); } };
exports.getOverdueLoans = async (req, res, next) => { try { ok(res, 'Data overdue berhasil diambil', await svc.getLoans(req.query, 'overdue')); } catch (e) { next(e); } };
exports.getLogs = async (req, res, next) => { try { ok(res, 'Log berhasil diambil', await svc.getLogs(req.params.id)); } catch (e) { next(e); } };

exports.getDashboard = async (req, res, next) => { try { ok(res, 'Dashboard berhasil diambil', await svc.getDashboard()); } catch (e) { next(e); } };

exports.getSetting = async (req, res, next) => { try { ok(res, 'Pengaturan berhasil diambil', await svc.getSetting()); } catch (e) { next(e); } };
exports.updateSetting = async (req, res, next) => { try { ok(res, 'Pengaturan berhasil diperbarui', await svc.updateSetting(req.params.id, req.body, req.user)); } catch (e) { next(e); } };

exports.print = async (req, res, next) => {
    try {
        const data = await pdfSvc.fetchPrintData(req.params.id);
        const pdfBuffer = await pdfSvc.generatePdf(data);
        const filename = `bukti-penitipan-${data.deposit.code || data.deposit.id}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer);
    } catch (e) { next(e); }
};
exports.printPreview = async (req, res, next) => {
    try {
        ok(res, 'Data cetak berhasil diambil', await svc.printData(req.params.id));
    } catch (e) { next(e); }
};

exports.kioskRfidScan = async (req, res, next) => { try { ok(res, 'Data siswa ditemukan', await svc.rfidScan(req.body.rfid_code)); } catch (e) { next(e); } };
exports.kioskLoan = async (req, res, next) => { try { ok(res, 'Barang berhasil dipinjam. Harap dikembalikan sesuai batas waktu.', await svc.loanDeposit(req.params.id, { ...req.body, borrow_method: 'RFID_KIOSK', borrow_rfid_code: req.body.rfid_code }, null, 'RFID_KIOSK')); } catch (e) { next(e); } };
exports.kioskReturnDaily = async (req, res, next) => { try { ok(res, 'Barang berhasil dikembalikan.', await svc.returnDaily(req.params.id, { ...req.body, return_method: 'RFID_KIOSK', return_rfid_code: req.body.rfid_code }, null, 'RFID_KIOSK')); } catch (e) { next(e); } };
exports.kioskTodayHistory = async (req, res, next) => { try { ok(res, 'Histori peminjaman hari ini berhasil diambil', await svc.getTodayKioskHistory()); } catch (e) { next(e); } };
