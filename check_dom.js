const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    console.log("Navigating...");
    await page.goto('http://localhost:3000/watch-party/test?videoId=6a7104a1a6012085669d3401', { waitUntil: 'networkidle2', timeout: 15000 });
    
    await new Promise(r => setTimeout(r, 5000));
    
    const videoData = await page.evaluate(() => {
      const videos = document.querySelectorAll('video');
      const data = [];
      videos.forEach(v => {
        data.push({
          src: v.src,
          srcObject: v.srcObject ? 'MediaStream' : null,
          readyState: v.readyState,
          networkState: v.networkState,
          paused: v.paused,
          muted: v.muted,
          videoWidth: v.videoWidth,
          videoHeight: v.videoHeight,
          error: v.error ? v.error.message : null,
          autoplay: v.autoplay,
          className: v.className
        });
      });
      return data;
    });
    
    console.log("VIDEOS:", JSON.stringify(videoData, null, 2));
    
    await browser.close();
  } catch (err) {
    console.error("Puppeteer script failed:", err);
  }
})();
