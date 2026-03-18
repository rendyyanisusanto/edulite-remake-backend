'use strict';

const { Guestbook, User } = require('../../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');

class GuestbookService {

    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = query.search || '';

        const where = {};

        // Search by guest_name, phone, purpose
        if (search) {
            where[Op.or] = [
                { guest_name: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
                { purpose: { [Op.like]: `%${search}%` } }
            ];
        }

        // Filter by status
        if (query.status) {
            where.status = query.status;
        }

        // Filter by guest_type
        if (query.guest_type) {
            where.guest_type = query.guest_type;
        }

        // Filter by exact visit_date (only if no range)
        if (query.visit_date && !query.date_from && !query.date_to) {
            where.visit_date = query.visit_date;
        }

        // Filter by date range
        if (query.date_from || query.date_to) {
            where.visit_date = {};
            if (query.date_from) where.visit_date[Op.gte] = query.date_from;
            if (query.date_to) where.visit_date[Op.lte] = query.date_to;
        }

        const { count, rows } = await Guestbook.findAndCountAll({
            where,
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name'] }
            ],
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        return {
            totalItems: count,
            guestbooks: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    }

    async findById(id) {
        const item = await Guestbook.findByPk(id, {
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name'] },
                { model: User, as: 'updater', attributes: ['id', 'name'] }
            ]
        });
        if (!item) throw new Error('Data tamu tidak ditemukan');
        return item;
    }

    async create(data) {
        if (!data.guest_name) throw new Error('Nama tamu wajib diisi');
        if (!data.visit_date) throw new Error('Tanggal kunjungan wajib diisi');
        if (!data.purpose) throw new Error('Tujuan kunjungan wajib diisi');

        return await Guestbook.create({
            ...data,
            status: 'CHECKED_IN',
            checkin_time: new Date()
        });
    }

    async update(id, data) {
        const item = await this.findById(id);
        return await item.update(data);
    }

    async checkout(id, userId) {
        const item = await this.findById(id);
        if (item.status === 'CHECKED_OUT') throw new Error('Tamu sudah melakukan checkout');
        if (item.status === 'CANCELLED') throw new Error('Kunjungan sudah dibatalkan, tidak dapat checkout');
        return await item.update({
            checkout_time: new Date(),
            status: 'CHECKED_OUT',
            updated_by: userId
        });
    }

    async cancel(id, userId) {
        const item = await this.findById(id);
        if (item.status === 'CANCELLED') throw new Error('Kunjungan sudah dibatalkan');
        if (item.status === 'CHECKED_OUT') throw new Error('Tamu sudah checkout, tidak dapat dibatalkan');
        return await item.update({
            status: 'CANCELLED',
            updated_by: userId
        });
    }

    async delete(id) {
        const item = await this.findById(id);
        return await item.destroy();
    }

    async exportExcel(res, query) {
        const result = await this.findAll({ ...query, limit: 100000 });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Edulite';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Buku Tamu');

        worksheet.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'Nama Tamu', key: 'guest_name', width: 25 },
            { header: 'Jenis Tamu', key: 'guest_type', width: 18 },
            { header: 'No HP', key: 'phone', width: 16 },
            { header: 'Alamat', key: 'address', width: 30 },
            { header: 'Tujuan Kunjungan', key: 'purpose', width: 30 },
            { header: 'Orang yang Dituju', key: 'related_person', width: 22 },
            { header: 'Tanggal Kunjungan', key: 'visit_date', width: 18 },
            { header: 'Jam Masuk', key: 'checkin_time', width: 20 },
            { header: 'Jam Keluar', key: 'checkout_time', width: 20 },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'Catatan', key: 'note', width: 25 },
        ];

        // Style header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0984E3' }
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 20;

        result.guestbooks.forEach((item, index) => {
            const row = worksheet.addRow({
                no: index + 1,
                guest_name: item.guest_name || '',
                guest_type: item.guest_type || '',
                phone: item.phone || '',
                address: item.address || '',
                purpose: item.purpose || '',
                related_person: item.related_person || '',
                visit_date: item.visit_date
                    ? new Date(item.visit_date).toLocaleDateString('id-ID')
                    : '',
                checkin_time: item.checkin_time
                    ? new Date(item.checkin_time).toLocaleString('id-ID')
                    : '',
                checkout_time: item.checkout_time
                    ? new Date(item.checkout_time).toLocaleString('id-ID')
                    : '',
                status: item.status || '',
                note: item.note || '',
            });

            // Alternate row background
            if (index % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF8FAFF' }
                };
            }

            // Status cell color
            const statusCell = row.getCell('status');
            if (item.status === 'CHECKED_IN') {
                statusCell.font = { color: { argb: 'FF16A34A' }, bold: true };
            } else if (item.status === 'CHECKED_OUT') {
                statusCell.font = { color: { argb: 'FF2563EB' }, bold: true };
            } else if (item.status === 'CANCELLED') {
                statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
            }
        });

        // Border all cells
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                };
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=buku_tamu.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    }

    async exportPdf(res, query) {
        const result = await this.findAll({ ...query, limit: 100000 });

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 40,
                    size: 'A4',
                    layout: 'landscape',
                    bufferPages: true
                });

                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', 'attachment; filename=buku_tamu.pdf');
                    res.send(pdfData);
                    resolve();
                });

                // ---- HEADER ----
                try {
                    doc.image(path.join(process.cwd(), 'public/header.png'), 40, 10, { width: 762 });
                    doc.y = 85;
                } catch (e) {
                    doc.y = 40;
                }

                doc.fontSize(13).font('Helvetica-Bold').fillColor('#111827')
                    .text('LAPORAN BUKU TAMU', { align: 'center' });

                const printDate = new Date().toLocaleDateString('id-ID', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
                doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
                    .text(`Dicetak pada: ${printDate}`, { align: 'center' });
                doc.moveDown(0.8);

                // ---- TABLE SETUP ----
                const tableStartX = 40;
                const colWidths = [28, 110, 75, 75, 90, 100, 80, 70, 70, 64];
                const headers = [
                    'No', 'Nama Tamu', 'Jenis Tamu', 'No HP',
                    'Tujuan', 'Orang Dituju', 'Tgl Kunjungan',
                    'Jam Masuk', 'Jam Keluar', 'Status'
                ];
                const totalTableWidth = colWidths.reduce((a, b) => a + b, 0);
                const rowHeight = 16;

                const drawTableHeader = (y) => {
                    doc.fillColor('#0984e3')
                        .rect(tableStartX, y, totalTableWidth, 18)
                        .fill();
                    doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
                    let x = tableStartX;
                    headers.forEach((h, i) => {
                        doc.text(h, x + 3, y + 4, { width: colWidths[i] - 6, lineBreak: false });
                        x += colWidths[i];
                    });
                    return y + 20;
                };

                let currentY = drawTableHeader(doc.y);

                // ---- TABLE ROWS ----
                result.guestbooks.forEach((item, index) => {
                    if (currentY + rowHeight > 555) {
                        doc.addPage();
                        currentY = 40;
                        currentY = drawTableHeader(currentY);
                    }

                    // Alternate row background
                    if (index % 2 === 0) {
                        doc.fillColor('#f0f7ff')
                            .rect(tableStartX, currentY, totalTableWidth, rowHeight)
                            .fill();
                    } else {
                        doc.fillColor('#ffffff')
                            .rect(tableStartX, currentY, totalTableWidth, rowHeight)
                            .fill();
                    }

                    // Status color
                    const statusColor = item.status === 'CHECKED_IN'
                        ? '#16a34a'
                        : item.status === 'CHECKED_OUT'
                            ? '#2563eb'
                            : '#dc2626';

                    const rowData = [
                        String(index + 1),
                        item.guest_name || '-',
                        item.guest_type || '-',
                        item.phone || '-',
                        item.purpose
                            ? (item.purpose.length > 22 ? item.purpose.substring(0, 22) + '…' : item.purpose)
                            : '-',
                        item.related_person || '-',
                        item.visit_date
                            ? new Date(item.visit_date).toLocaleDateString('id-ID')
                            : '-',
                        item.checkin_time
                            ? new Date(item.checkin_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                            : '-',
                        item.checkout_time
                            ? new Date(item.checkout_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                            : '-',
                        item.status || '-',
                    ];

                    let x = tableStartX;
                    rowData.forEach((d, i) => {
                        const isStatus = i === 9;
                        doc.font('Helvetica').fontSize(7.5)
                            .fillColor(isStatus ? statusColor : '#1f2937')
                            .text(d, x + 3, currentY + 3, { width: colWidths[i] - 6, lineBreak: false });
                        x += colWidths[i];
                    });

                    // Row border
                    doc.strokeColor('#e5e7eb').lineWidth(0.4)
                        .rect(tableStartX, currentY, totalTableWidth, rowHeight)
                        .stroke();

                    currentY += rowHeight;
                });

                // Empty state
                if (result.guestbooks.length === 0) {
                    doc.font('Helvetica-Oblique').fontSize(10).fillColor('#9ca3af')
                        .text('Tidak ada data buku tamu.', tableStartX, currentY + 10, {
                            width: totalTableWidth,
                            align: 'center'
                        });
                }

                // ---- FOOTER PAGE NUMBERS ----
                const pages = doc.bufferedPageRange();
                for (let i = 0; i < pages.count; i++) {
                    doc.switchToPage(i);
                    doc.fontSize(8).fillColor('#9ca3af')
                        .text(
                            `Halaman ${i + 1} dari ${pages.count}`,
                            0,
                            doc.page.height - 25,
                            { align: 'center', lineBreak: false }
                        );
                }

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }
}

module.exports = new GuestbookService();
