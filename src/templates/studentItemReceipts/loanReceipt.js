'use strict';
const layout = require('./receiptLayout');
module.exports = ({ data, showToolbar = false, pdfUrl = '#' }) => layout({
    title: 'BUKTI PEMINJAMAN BARANG',
    schoolProfile: data.schoolProfile,
    code: data.deposit.code,
    datetime: data.loan.borrowed_at_text,
    officer: data.loan.borrow_approved_by_name,
    notes: data.loan.borrow_note,
    showToolbar,
    pdfUrl,
    rows: data.rows
});
