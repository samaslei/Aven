async function checkIndex() {
  const res = await fetch('https://aven-livid.vercel.app/?v=' + Date.now());
  const text = await res.text();
  console.log('--- Lines of interest from live HTML ---');
  for (const line of text.split('\n')) {
    if (line.includes('icon') || line.includes('brand') || line.includes('style.css')) {
      console.log(' ', line.trim());
    }
  }
}
checkIndex();
