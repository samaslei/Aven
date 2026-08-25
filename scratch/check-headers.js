import https from 'https';

function checkHeader(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      console.log(`URL: ${url}`);
      console.log(`Status: ${res.statusCode}`);
      console.log(`Cache-Control: ${res.headers['cache-control']}`);
      console.log(`Content-Type: ${res.headers['content-type']}`);
      console.log('-------------------------------------------');
      resolve();
    });
  });
}

async function run() {
  console.log('Testing live Vercel caching headers...');
  await checkHeader('https://aven-livid.vercel.app/');
  await checkHeader('https://aven-livid.vercel.app/assets/index-2kMwq7pj.js');
}

run();
