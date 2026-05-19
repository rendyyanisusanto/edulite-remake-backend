'use strict';

const puppeteer = require('puppeteer');

class PdfService {
    async renderHtmlToPdf(html, options = {}) {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdf = await page.pdf({
                format: options.format || 'A4',
                width: options.width || undefined,
                height: options.height || undefined,
                margin: options.margin || { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
                printBackground: options.printBackground !== false
            });
            return pdf;
        } finally {
            await browser.close();
        }
    }

    renderHtmlPreview(res, html) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    }

    renderPdfResponse(res, pdfBuffer, filename = 'document.pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer);
    }
}

module.exports = new PdfService();
