async function pollVercel() {
  console.log('Polling Vercel live deployment at https://aven-livid.vercel.app ...');
  for (let attempt = 1; attempt <= 12; attempt++) {
    await new Promise(r => setTimeout(r, 4000));
    try {
      const res = await fetch('https://aven-livid.vercel.app/?v=' + Date.now());
      const html = await res.text();
      
      // Look for Vite bundled assets
      const cssMatch = html.match(/href="(\/assets\/[^"]+\.css)"/);
      const jsMatch = html.match(/src="(\/assets\/[^"]+\.js)"/);
      
      console.log(`Attempt ${attempt}:`);
      console.log('  Vite CSS found in HTML:', cssMatch ? cssMatch[1] : 'none');
      console.log('  Vite JS found in HTML:', jsMatch ? jsMatch[1] : 'none');

      if (cssMatch && jsMatch) {
        console.log('\nVite build is LIVE! Testing asset content-types...');
        
        const cssUrl = 'https://aven-livid.vercel.app' + cssMatch[1];
        const resCss = await fetch(cssUrl);
        const ctCss = resCss.headers.get('content-type');
        console.log('CSS URL:', cssUrl);
        console.log('CSS Status:', resCss.status, 'Content-Type:', ctCss);

        const jsUrl = 'https://aven-livid.vercel.app' + jsMatch[1];
        const resJs = await fetch(jsUrl);
        const ctJs = resJs.headers.get('content-type');
        console.log('JS URL:', jsUrl);
        console.log('JS Status:', resJs.status, 'Content-Type:', ctJs);

        if (ctCss && ctCss.includes('text/css') && ctJs && (ctJs.includes('javascript') || ctJs.includes('text/javascript'))) {
          console.log('\n=============================================================');
          console.log('SUCCESS! VERCEL STATIC VITE DEPLOYMENT VERIFIED 100% WORKING');
          console.log('=============================================================');
          return true;
        }
      }
    } catch (e) {
      console.log(`Attempt ${attempt} error:`, e.message);
    }
  }
  return false;
}
pollVercel();
