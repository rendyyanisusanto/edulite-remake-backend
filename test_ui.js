const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    // Capture console logs
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

    // Wait for the app to load
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

    // Login
    await page.type('#email', 'admin@edulite.local');
    await page.type('#password', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Go to Students page
    await page.goto('http://localhost:5173/students', { waitUntil: 'networkidle2' });

    console.log("On Students page");

    // Click 'Tambah Siswa'
    const tambahButtons = await page.$$('button');
    let tambahBtn;
    for (let btn of tambahButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('Tambah Siswa')) {
            tambahBtn = btn;
            break;
        }
    }

    if (tambahBtn) {
        console.log("Clicking Tambah Siswa");
        await tambahBtn.click();
        await page.waitForTimeout(1000); // wait for modal transition
        console.log("Modal opened");

        // Try filling form
        await page.type('#nis', '001');
        console.log("Typed in NIS");
    } else {
        console.log("Tambah Siswa button not found");
    }

    // Try Export Excel
    let exportBtn;
    for (let btn of tambahButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('Export Excel')) {
            exportBtn = btn;
            break;
        }
    }

    if (exportBtn) {
        console.log("Clicking Export Excel");
        await exportBtn.click();
        await page.waitForTimeout(2000); // wait for export request
    }

    await browser.close();
})();
