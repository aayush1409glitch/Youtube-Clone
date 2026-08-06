const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--use-fake-ui-for-media-stream'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => {
      console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
    });

    console.log("Navigating...");
    await page.goto('http://localhost:3000/watch-party/test?videoId=6a710a01c37fdc2616328677', { waitUntil: 'networkidle2', timeout: 10000 });
    
    await new Promise(r => setTimeout(r, 5000));
    console.log("Done waiting.");
    await browser.close();
  } catch (err) {
    console.error("Puppeteer script failed:", err);
  }
})();
