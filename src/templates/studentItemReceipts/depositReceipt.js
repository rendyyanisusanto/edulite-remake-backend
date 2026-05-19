'use strict';
const layout = require('./receiptLayout');
module.exports = ({ data, showToolbar = false, pdfUrl = '#' }) => layout({
    title: 'BUKTI PENITIPAN BARANG',
    schoolProfile: data.schoolProfile,
    code: data.deposit.code,
    datetime: data.deposit.deposit_date_text,
    officer: data.deposit.received_by_name,
    notes: data.deposit.notes,
    showToolbar,
    pdfUrl,
    rows: data.rows
});
