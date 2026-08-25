import fs from 'fs';

// 1. UPDATE js/landing.js
let landingJs = fs.readFileSync('js/landing.js', 'utf-8');

// Brand logo in nav
const oldBrandLogo = `<a href="#" class="landing-brand">
              <img src="favicon.svg" alt="Aven Logo" class="brand-icon">
              <span class="brand-text">Aven</span>
              <span class="landing-badge-tag">Academic OS</span>
            </a>`;

const newBrandLogo = `<a href="#" class="landing-brand">
              <svg width="24" height="24" viewBox="0 0 24 24" class="brand-icon" style="border-radius: 6px; flex-shrink: 0;">
                <rect width="24" height="24" rx="6" fill="#505537"/>
                <path d="M6 18L12 6L18 18H14L12 13L10 18H6Z" fill="white"/>
              </svg>
              <span class="brand-text">Aven</span>
              <span class="landing-badge-tag">Academic OS</span>
            </a>`;

landingJs = landingJs.replace(oldBrandLogo, newBrandLogo);

// Pill sparkle color
landingJs = landingJs.replace(
  `<span class="pill-sparkle">✦</span>`,
  `<span class="pill-sparkle" style="color: #8A9A5B;">✦</span>`
);

// Trust indicator avatars
const oldAvatars = `<div class="landing-avatars-stack">
                <div class="landing-avatar-pill" style="background: #6366f1;">CS</div>
                <div class="landing-avatar-pill" style="background: #10b981;">ENG</div>
                <div class="landing-avatar-pill" style="background: #8b5cf6;">MED</div>
                <div class="landing-avatar-pill" style="background: #f59e0b;">BIO</div>
              </div>`;

const newAvatars = `<div class="landing-avatars-stack">
                <div class="landing-avatar-pill" style="background: #8A9A5B;">CS</div>
                <div class="landing-avatar-pill" style="background: #C9A84C;">ENG</div>
                <div class="landing-avatar-pill" style="background: #6B5B4D;">MED</div>
                <div class="landing-avatar-pill" style="background: #B5654A;">BIO</div>
              </div>`;

landingJs = landingJs.replace(oldAvatars, newAvatars);
fs.writeFileSync('js/landing.js', landingJs, 'utf-8');

// 2. UPDATE css/style.css for CTA button gradient
let css = fs.readFileSync('css/style.css', 'utf-8');

const oldCtaButtonsCss = `.landing-cta-btn {
  font-size: 13px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.35);
  border: none;
}

.landing-cta-btn:hover {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  transform: translateY(-1px);
}

/* Hero Section */
.landing-hero {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 64px 24px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.landing-hero-content {
  text-align: center;
  max-width: 820px;
  margin: 0 auto 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.landing-pill-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24px;
}

.pill-sparkle {
  color: #8b5cf6;
}

.landing-hero-headline {
  font-size: clamp(32px, 5vw, 52px);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  margin-bottom: 20px;
  text-wrap: balance;
}

.landing-hero-subheadline {
  font-size: clamp(15px, 2vw, 18px);
  line-height: 1.6;
  color: var(--text-secondary);
  max-width: 660px;
  margin-bottom: 32px;
}

.landing-hero-ctas {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 32px;
}

.landing-hero-primary-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 26px;
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.40);
  border: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.landing-hero-primary-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(99, 102, 241, 0.50);
}`;

const newCtaButtonsCss = `.landing-cta-btn {
  font-size: 13px;
  font-weight: 700;
  padding: 6px 16px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #44482e 0%, #5e6540 50%, #7d8b51 100%);
  box-shadow: 0 3px 12px rgba(68, 72, 46, 0.35);
  color: #ffffff !important;
  border: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.landing-cta-btn:hover {
  background: linear-gradient(135deg, #363a24 0%, #4f5536 50%, #6e7a46 100%);
  box-shadow: 0 5px 16px rgba(68, 72, 46, 0.45);
  transform: translateY(-1px);
}

/* Hero Section */
.landing-hero {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 64px 24px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.landing-hero-content {
  text-align: center;
  max-width: 820px;
  margin: 0 auto 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.landing-pill-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24px;
}

.pill-sparkle {
  color: #8A9A5B;
}

.landing-hero-headline {
  font-size: clamp(32px, 5vw, 52px);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  margin-bottom: 20px;
  text-wrap: balance;
}

.landing-hero-subheadline {
  font-size: clamp(15px, 2vw, 18px);
  line-height: 1.6;
  color: var(--text-secondary);
  max-width: 660px;
  margin-bottom: 32px;
}

.landing-hero-ctas {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 32px;
}

.landing-hero-primary-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 26px;
  font-size: 15px;
  font-weight: 700;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #3d4127 0%, #565d3a 50%, #78864c 100%);
  box-shadow: 0 6px 24px rgba(61, 65, 39, 0.40);
  color: #ffffff !important;
  border: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.landing-hero-primary-cta:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #2e321d 0%, #464d2d 50%, #66723e 100%);
  box-shadow: 0 8px 30px rgba(61, 65, 39, 0.50);
}`;

css = css.replace(oldCtaButtonsCss, newCtaButtonsCss);
fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully updated landing page logo mark, CTA gradient, and trust avatars to warm olive family!');
