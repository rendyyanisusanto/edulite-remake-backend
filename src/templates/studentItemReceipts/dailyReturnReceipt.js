'use strict';
const layout = require('./receiptLayout');
module.exports = ({ data, showToolbar = false, pdfUrl = '#' }) => layout({
    title: 'BUKTI PENGEMBALIAN BARANG',
    schoolProfile: data.schoolProfile,
    code: data.deposit.code,
    datetime: data.loan.returned_at_text,
    officer: data.loan.return_confirmed_by_name,
    notes: data.loan.return_note,
    showToolbar,
    pdfUrl,
    rows: data.rows
});
