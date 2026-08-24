import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

// 1. html, body & scrollbar standards
css = css.replace(
  `html, body {
  height: 100%;
  font-family: var(--font-sans);
  background-color: var(--bg-app);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`,
  `html, body {
  height: 100%;
  width: 100%;
  font-family: var(--font-sans);
  background-color: var(--bg-app);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  box-sizing: border-box;
}

/* Cross-browser scrollbar consistency (Chromium / Gecko / WebKit) */
html {
  scrollbar-width: thin;
  scrollbar-color: var(--border-default) transparent;
}`
);

// 2. #app container
css = css.replace(
  `#app {
  display: flex;
  min-height: 100vh;
  position: relative;
}`,
  `#app {
  display: flex;
  min-height: 100vh;
  width: 100%;
  max-width: 100%;
  position: relative;
  box-sizing: border-box;
}`
);

// 3. .main-viewport desktop width & padding
css = css.replace(
  `.main-viewport {
  margin-left: var(--sidebar-width);
  flex: 1;
  min-height: 100vh;
  padding: 32px 48px 64px 48px;
  max-width: 1400px;
  overflow-y: auto;
}`,
  `.main-viewport {
  margin-left: var(--sidebar-width);
  width: calc(100% - var(--sidebar-width));
  flex: 1;
  min-width: 0;
  min-height: 100vh;
  padding: 32px 48px 64px 48px;
  box-sizing: border-box;
  overflow-y: auto;
}`
);

// 4. Fullscreen plan viewer
css = css.replace(
  `width: 100vw !important;
  height: 100vh !important;`,
  `width: 100% !important;
  height: 100% !important;`
);

// 5. Modal backdrop
css = css.replace(
  `width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.64);`,
  `width: 100%;
  height: 100%;
  inset: 0;
  background: rgba(0, 0, 0, 0.64);`
);

// 6. Mobile drawer backdrop
css = css.replace(
  `position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;`,
  `position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;`
);

// 7. Mobile responsive max-width 100vw to 100%
css = css.replaceAll('max-width: 100vw;', 'max-width: 100%;');
css = css.replaceAll('width: calc(100vw - 32px);', 'width: calc(100% - 32px);');
css = css.replaceAll('width: calc(100vw - 20px);', 'width: calc(100% - 20px);');

fs.writeFileSync('css/style.css', css, 'utf-8');
console.log('Successfully updated layout width rules in style.css!');
