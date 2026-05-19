'use strict';
const layout = require('./receiptLayout');
module.exports = ({ data, showToolbar = false, pdfUrl = '#' }) => layout({
    title: 'BUKTI PENGAMBILAN PERMANEN',
    schoolProfile: data.schoolProfile,
    code: data.deposit.code,
    datetime: data.finalReturn.return_date_text,
    officer: data.finalReturn.handed_by_name,
    notes: data.finalReturn.notes,
    showToolbar,
    pdfUrl,
    rows: data.rows
});
