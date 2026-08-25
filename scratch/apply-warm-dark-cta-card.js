import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

const oldCtaCardCss = `.landing-cta-card {
  position: relative;
  background: linear-gradient(135deg, rgba(30, 27, 75, 0.65) 0%, rgba(22, 23, 27, 0.95) 100%);
  border-radius: var(--radius-xl);
  padding: 64px 32px;
  text-align: center;
  overflow: hidden;
  box-shadow: 0 20px 48px -4px rgba(0, 0, 0, 0.60), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
}

[data-theme="light"] .landing-cta-card {
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
}

.landing-cta-signin {
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 500;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  border: none;
}

.landing-cta-signin:hover {
  background: var(--bg-surface-hover);
  transform: translateY(-2px);
}`;

const newCtaCardCss = `.landing-cta-card {
  position: relative;
  background: linear-gradient(135deg, #25231c 0%, #1b1c17 50%, #121310 100%);
  border: 1px solid rgba(138, 154, 91, 0.22);
  border-radius: var(--radius-xl);
  padding: 64px 32px;
  text-align: center;
  overflow: hidden;
  box-shadow: 0 24px 56px -6px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.10);
  display: flex;
  flex-direction: column;
  align-items: center;
}

[data-theme="light"] .landing-cta-card {
  background: linear-gradient(135deg, #25231c 0%, #1b1c17 50%, #121310 100%);
  border: 1px solid rgba(138, 154, 91, 0.25);
  box-shadow: 0 24px 56px -6px rgba(25, 28, 20, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.landing-cta-glow {
  position: absolute;
  top: -110px;
  left: 50%;
  transform: translateX(-50%);
  width: 540px;
  height: 280px;
  background: radial-gradient(ellipse at center, rgba(138, 154, 91, 0.32) 0%, rgba(201, 168, 76, 0.14) 40%, rgba(107, 91, 77, 0.08) 60%, transparent 75%);
  filter: blur(48px);
  pointer-events: none;
}

.landing-cta-card .landing-cta-headline {
  font-size: clamp(26px, 3.5vw, 36px);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #f8fafc;
  margin-bottom: 14px;
}

.landing-cta-card .landing-cta-subtitle {
  font-size: 16px;
  line-height: 1.6;
  color: #c5bfa8;
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
}

.landing-cta-signin {
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 500;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.landing-cta-signin:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.22);
  transform: translateY(-2px);
}`;

css = css.replace(oldCtaCardCss, newCtaCardCss);
fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully replaced navy/indigo tint on CTA card with warm charcoal-brown base and soft olive/gold glow!');
