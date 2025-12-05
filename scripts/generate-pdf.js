const { chromium } = require('playwright');
const path = require('path');

(async () => {
  try {
    console.log('Launching browser...');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const cvPath = path.join(__dirname, '../public/cv.html');
    const pdfPath = path.join(__dirname, '../public/cv.pdf');

    // Convert file path to file:// URL properly for Windows
    const fileUrl = 'file:///' + cvPath.replace(/\\/g, '/');

    console.log(`Loading CV from: ${fileUrl}`);
    await page.goto(fileUrl, { waitUntil: 'networkidle' });

    console.log('Generating PDF...');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm', // CSS handles margins via @page
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });

    console.log(`✅ PDF successfully generated at: ${pdfPath}`);
    await browser.close();
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    if (error.message.includes('Executable doesn\'t exist')) {
      console.error('\n⚠️  Playwright browsers are missing. Please run: npx playwright install');
    }
    process.exit(1);
  }
})();
