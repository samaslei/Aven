async function testAll() {
  const assets = [
    '/css/style.css',
    '/js/app.js',
    '/js/store.js',
    '/favicon.svg',
    '/env.js'
  ];
  console.log('Testing live Vercel assets at https://aven-livid.vercel.app ...');
  for (const asset of assets) {
    const url = 'https://aven-livid.vercel.app' + asset + '?t=' + Date.now();
    const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
    const ct = res.headers.get('content-type');
    const text = await res.text();
    const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
    console.log(asset);
    console.log('  Status:', res.status);
    console.log('  Content-Type:', ct);
    console.log('  Is HTML fallback?', isHtml);
    console.log('  Body snippet:', text.substring(0, 80).replace(/\n/g, ' '));
    console.log('---');
  }
}
testAll();
