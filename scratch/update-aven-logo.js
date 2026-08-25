import fs from 'fs';

// 1. UPDATE favicon.svg
const newFaviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect width="24" height="24" rx="6" fill="#505537"/>
  <polygon points="12,4.8 4.6,19.2 8.6,19.2 12,11.8 15.4,19.2 19.4,19.2" fill="white"/>
</svg>
`;

fs.writeFileSync('favicon.svg', newFaviconSvg, 'utf-8');

// 2. UPDATE js/landing.js
let landingJs = fs.readFileSync('js/landing.js', 'utf-8');

const oldLandingSvg = `<svg width="24" height="24" viewBox="0 0 24 24" class="brand-icon" style="border-radius: 6px; flex-shrink: 0;">
                <rect width="24" height="24" rx="6" fill="#505537"/>
                <path d="M6 18L12 6L18 18H14L12 13L10 18H6Z" fill="white"/>
              </svg>`;

const newLandingSvg = `<svg width="24" height="24" viewBox="0 0 24 24" class="brand-icon" style="border-radius: 6px; flex-shrink: 0;">
                <rect width="24" height="24" rx="6" fill="#505537"/>
                <polygon points="12,4.8 4.6,19.2 8.6,19.2 12,11.8 15.4,19.2 19.4,19.2" fill="white"/>
              </svg>`;

landingJs = landingJs.split(oldLandingSvg).join(newLandingSvg);

fs.writeFileSync('js/landing.js', landingJs, 'utf-8');

console.log('Successfully updated the new Aven logo across favicon.svg and landing page!');
