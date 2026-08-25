import fs from 'fs';

// 1. UPDATE js/landing.js (footer logo mark)
let landingJs = fs.readFileSync('js/landing.js', 'utf-8');

const oldFooterBrand = `<div class="landing-brand">
                <img src="favicon.svg" alt="Aven Logo" class="brand-icon">
                <span class="brand-text">Aven</span>
              </div>`;

const newFooterBrand = `<div class="landing-brand">
                <svg width="24" height="24" viewBox="0 0 24 24" class="brand-icon" style="border-radius: 6px; flex-shrink: 0;">
                  <rect width="24" height="24" rx="6" fill="#505537"/>
                  <path d="M6 18L12 6L18 18H14L12 13L10 18H6Z" fill="white"/>
                </svg>
                <span class="brand-text">Aven</span>
              </div>`;

landingJs = landingJs.replace(oldFooterBrand, newFooterBrand);
fs.writeFileSync('js/landing.js', landingJs, 'utf-8');

// 2. UPDATE css/style.css
let css = fs.readFileSync('css/style.css', 'utf-8');

// Ambient radial glows
const oldAmbientGlows = `.landing-bg-glow.glow-top {
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: 700px;
  height: 480px;
  background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.28) 0%, rgba(139, 92, 246, 0.12) 50%, rgba(0, 0, 0, 0) 75%);
}

.landing-bg-glow.glow-middle {
  top: 950px;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 400px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0, 0, 0, 0) 70%);
}`;

const newAmbientGlows = `.landing-bg-glow.glow-top {
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: 700px;
  height: 480px;
  background: radial-gradient(ellipse at center, rgba(138, 154, 91, 0.22) 0%, rgba(201, 168, 76, 0.10) 50%, rgba(0, 0, 0, 0) 75%);
}

.landing-bg-glow.glow-middle {
  top: 950px;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 400px;
  background: radial-gradient(circle, rgba(138, 154, 91, 0.14) 0%, rgba(0, 0, 0, 0) 70%);
}`;

css = css.replace(oldAmbientGlows, newAmbientGlows);

// Bottom CTA card & glow
const oldBottomCta = `[data-theme="light"] .landing-cta-card {
  background: linear-gradient(135deg, #eef2ff 0%, #ffffff 100%);
  box-shadow: 0 20px 48px -4px rgba(99, 102, 241, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.40);
}

.landing-cta-glow {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 480px;
  height: 260px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(0, 0, 0, 0) 70%);
  filter: blur(50px);
  pointer-events: none;
}

.landing-cta-headline {
  font-size: clamp(26px, 3.5vw, 36px);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin-bottom: 14px;
}

.landing-cta-subtitle {
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-secondary);
  max-width: 580px;
  margin-bottom: 32px;
}

.landing-cta-buttons {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
}

.landing-cta-large {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.40);
  border: none;
  transition: all 0.2s ease;
}

.landing-cta-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(99, 102, 241, 0.50);
}`;

const newBottomCta = `[data-theme="light"] .landing-cta-card {
  background: linear-gradient(135deg, rgba(80, 85, 55, 0.08) 0%, #ffffff 100%);
  box-shadow: 0 20px 48px -4px rgba(80, 85, 55, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.40);
}

.landing-cta-glow {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 480px;
  height: 260px;
  background: radial-gradient(circle, rgba(138, 154, 91, 0.35) 0%, rgba(201, 168, 76, 0.15) 45%, rgba(0, 0, 0, 0) 70%);
  filter: blur(50px);
  pointer-events: none;
}

.landing-cta-headline {
  font-size: clamp(26px, 3.5vw, 36px);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin-bottom: 14px;
}

.landing-cta-subtitle {
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-secondary);
  max-width: 580px;
  margin-bottom: 32px;
}

.landing-cta-buttons {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
}

.landing-cta-large {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  font-size: 15px;
  font-weight: 700;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #3d4127 0%, #565d3a 50%, #78864c 100%);
  box-shadow: 0 6px 24px rgba(61, 65, 39, 0.40);
  color: #ffffff !important;
  border: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.landing-cta-large:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #2e321d 0%, #464d2d 50%, #66723e 100%);
  box-shadow: 0 8px 30px rgba(61, 65, 39, 0.50);
}`;

css = css.replace(oldBottomCta, newBottomCta);
fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully replaced purple glow and CTA gradient with warm olive/gold tones in bottom CTA banner!');
