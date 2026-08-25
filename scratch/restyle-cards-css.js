import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

// Replace stat-card styles with flat, light, generous card treatment with circular icon badges
const oldStatCardBlock = `/* ==========================================================================
   Dashboard / Subjects View
   ========================================================================= */
.stats-banner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 124px;
  gap: 6px;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 10px -1px rgba(0, 0, 0, 0.24), 0 1px 3px 0 rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.035);
  box-sizing: border-box;
}

[data-theme="light"] .stat-card {
  background: #ffffff;
  border: none;
  box-shadow: 0 2px 8px -1px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.40);
}

/* 1. Enrolled Subjects — Subtle Blue-Tinted Gradient */
.stat-card.stat-card-blue {
  background: linear-gradient(145deg, rgba(37, 99, 235, 0.16) 0%, rgba(59, 130, 246, 0.05) 50%, var(--bg-surface) 100%);
  box-shadow: 0 2px 10px -1px rgba(0, 0, 0, 0.24), 0 1px 3px 0 rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(147, 197, 253, 0.08);
}

[data-theme="light"] .stat-card.stat-card-blue {
  background: linear-gradient(145deg, rgba(37, 99, 235, 0.10) 0%, rgba(59, 130, 246, 0.03) 50%, #ffffff 100%);
  box-shadow: 0 2px 8px -1px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.40);
}

.stat-card.stat-card-blue:hover {
  background: linear-gradient(145deg, rgba(37, 99, 235, 0.22) 0%, rgba(59, 130, 246, 0.08) 50%, var(--bg-surface-elevated) 100%);
  transform: translateY(-2px);
  box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.48), 0 0 18px rgba(59, 130, 246, 0.20), inset 0 1px 0 rgba(147, 197, 253, 0.28);
}

[data-theme="light"] .stat-card.stat-card-blue:hover {
  background: linear-gradient(145deg, rgba(37, 99, 235, 0.14) 0%, rgba(59, 130, 246, 0.05) 50%, #ffffff 100%);
  box-shadow: 0 10px 24px -4px rgba(37, 99, 235, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.60);
}

/* 2. Study Time (Week) — Subtle Teal/Green-Tinted Gradient */
.stat-card.stat-card-teal {
  background: linear-gradient(145deg, rgba(13, 148, 136, 0.16) 0%, rgba(16, 185, 129, 0.05) 50%, var(--bg-surface) 100%);
  box-shadow: 0 2px 10px -1px rgba(0, 0, 0, 0.24), 0 1px 3px 0 rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(110, 231, 183, 0.08);
}

[data-theme="light"] .stat-card.stat-card-teal {
  background: linear-gradient(145deg, rgba(13, 148, 136, 0.10) 0%, rgba(16, 185, 129, 0.03) 50%, #ffffff 100%);
  box-shadow: 0 2px 8px -1px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.40);
}

.stat-card.stat-card-teal:hover {
  background: linear-gradient(145deg, rgba(13, 148, 136, 0.22) 0%, rgba(16, 185, 129, 0.08) 50%, var(--bg-surface-elevated) 100%);
  transform: translateY(-2px);
  box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.48), 0 0 18px rgba(16, 185, 129, 0.20), inset 0 1px 0 rgba(110, 231, 183, 0.28);
}

[data-theme="light"] .stat-card.stat-card-teal:hover {
  background: linear-gradient(145deg, rgba(13, 148, 136, 0.14) 0%, rgba(16, 185, 129, 0.05) 50%, #ffffff 100%);
  box-shadow: 0 10px 24px -4px rgba(16, 185, 129, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.60);
}

/* 3. Cumulative GPA — Subtle Indigo/Violet-Tinted Gradient */
.stat-card.stat-card-indigo {
  background: linear-gradient(145deg, rgba(99, 102, 241, 0.18) 0%, rgba(124, 58, 237, 0.06) 50%, var(--bg-surface) 100%);
  box-shadow: 0 2px 10px -1px rgba(0, 0, 0, 0.24), 0 1px 3px 0 rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(196, 181, 253, 0.08);
}

[data-theme="light"] .stat-card.stat-card-indigo {
  background: linear-gradient(145deg, rgba(99, 102, 241, 0.11) 0%, rgba(124, 58, 237, 0.04) 50%, #ffffff 100%);
  box-shadow: 0 2px 8px -1px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.40);
}

.stat-card.stat-card-indigo:hover {
  background: linear-gradient(145deg, rgba(99, 102, 241, 0.26) 0%, rgba(124, 58, 237, 0.10) 50%, var(--bg-surface-elevated) 100%);
  transform: translateY(-2px);
  box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.48), 0 0 18px rgba(99, 102, 241, 0.22), inset 0 1px 0 rgba(196, 181, 253, 0.30);
}

[data-theme="light"] .stat-card.stat-card-indigo:hover {
  background: linear-gradient(145deg, rgba(99, 102, 241, 0.16) 0%, rgba(124, 58, 237, 0.06) 50%, #ffffff 100%);
  box-shadow: 0 10px 24px -4px rgba(99, 102, 241, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.60);
}

/* 4. Study Streak — Subtle Purple/Violet-Tinted Gradient */
.stat-card.stat-card-purple,
.stat-card.stat-card-hero {
  background: linear-gradient(145deg, rgba(147, 51, 234, 0.16) 0%, rgba(168, 85, 247, 0.05) 50%, var(--bg-surface) 100%);
  box-shadow: 0 2px 10px -1px rgba(0, 0, 0, 0.24), 0 1px 3px 0 rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(216, 180, 254, 0.08);
}

[data-theme="light"] .stat-card.stat-card-purple,
[data-theme="light"] .stat-card.stat-card-hero {
  background: linear-gradient(145deg, rgba(147, 51, 234, 0.10) 0%, rgba(168, 85, 247, 0.03) 50%, #ffffff 100%);
  box-shadow: 0 2px 8px -1px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.40);
}

.stat-card.stat-card-purple:hover,
.stat-card.stat-card-hero:hover {
  background: linear-gradient(145deg, rgba(147, 51, 234, 0.22) 0%, rgba(168, 85, 247, 0.08) 50%, var(--bg-surface-elevated) 100%);
  transform: translateY(-2px);
  box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.48), 0 0 18px rgba(168, 85, 247, 0.20), inset 0 1px 0 rgba(216, 180, 254, 0.28);
}

[data-theme="light"] .stat-card.stat-card-purple:hover,
[data-theme="light"] .stat-card.stat-card-hero:hover {
  background: linear-gradient(145deg, rgba(147, 51, 234, 0.14) 0%, rgba(168, 85, 247, 0.05) 50%, #ffffff 100%);
  box-shadow: 0 10px 24px -4px rgba(147, 51, 234, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.60);
}`;

const newStatCardBlock = `/* ==========================================================================
   Dashboard / Subjects View (FeedBacker Flat Clean Cards)
   ========================================================================= */
.stats-banner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 130px;
  gap: 10px;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  box-shadow: var(--shadow-sm);
  box-sizing: border-box;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.stat-card-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

/* Circular Icon Badges next to stats (Reference Style) */
.stat-card-icon {
  width: 34px;
  height: 34px;
  padding: 7px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-hover);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
  transition: var(--transition);
}

.stat-card:hover .stat-card-icon {
  background: var(--accent-surface);
  color: var(--accent);
}

.stat-card-value {
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  line-height: 1.1;
}

.stat-card-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 400;
}`;

css = css.replace(oldStatCardBlock, newStatCardBlock);

// Restyle subject-card to match clean flat reference
const oldSubjectCard = `.subject-card {
  --sub-color: #6366f1;
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.38), 
              0 2px 6px -1px rgba(0, 0, 0, 0.25), 
              inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), 
              box-shadow 0.24s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 1;
}

.subject-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(145deg, 
    color-mix(in srgb, var(--sub-color) 12%, var(--bg-surface)) 0%, 
    color-mix(in srgb, var(--sub-color) 3.5%, var(--bg-surface)) 45%, 
    var(--bg-surface) 100%
  );
  opacity: 0;
  transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
  z-index: -1;
}

.subject-card:hover::before {
  opacity: 1;
}

[data-theme="light"] .subject-card {
  background: #ffffff;
  border: none;
  box-shadow: 0 4px 18px -2px rgba(0, 0, 0, 0.06), 
              0 2px 6px -1px rgba(0, 0, 0, 0.03), 
              inset 0 1px 0 rgba(255, 255, 255, 0.40);
}

[data-theme="light"] .subject-card::before {
  background: linear-gradient(145deg, 
    color-mix(in srgb, var(--sub-color) 9%, #ffffff) 0%, 
    color-mix(in srgb, var(--sub-color) 2.5%, #ffffff) 50%, 
    #ffffff 100%
  );
}

.subject-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px -3px rgba(0, 0, 0, 0.30), 
              0 0 24px -4px color-mix(in srgb, var(--sub-color) 30%, transparent), 
              inset 0 1px 0 color-mix(in srgb, var(--sub-color) 30%, rgba(255, 255, 255, 0.08));
}

[data-theme="light"] .subject-card:hover {
  box-shadow: 0 5px 14px -2px rgba(15, 23, 42, 0.08), 
              0 0 18px -4px color-mix(in srgb, var(--sub-color) 22%, transparent), 
              inset 0 1px 0 rgba(255, 255, 255, 0.60);
}`;

const newSubjectCard = `.subject-card {
  --sub-color: #505537;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;
}

.subject-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-default);
}`;

css = css.replace(oldSubjectCard, newSubjectCard);

// Restyle Category Cards in Grades
const oldCatCardCompact = `.category-card.compact-row {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-left: 3.5px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 8px 14px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: nowrap;
  transition: background 0.15s ease, transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  position: relative;
  min-height: 42px;
  box-sizing: border-box;
  box-shadow: 0 2px 8px -1px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.035);
  min-width: 0;
}`;

const newCatCardCompact = `.category-card.compact-row {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 12px 18px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: nowrap;
  transition: background 0.15s ease, transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  position: relative;
  min-height: 46px;
  box-sizing: border-box;
  box-shadow: var(--shadow-sm);
  min-width: 0;
}`;

css = css.replace(oldCatCardCompact, newCatCardCompact);

// Restyle Category Card Expanded
const oldCatCardExpanded = `.category-card.expanded {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px -1px rgba(0, 0, 0, 0.24), 0 1px 3px 0 rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.035);
  border-left: 3.5px solid var(--border-default);
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}`;

const newCatCardExpanded = `.category-card.expanded {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}`;

css = css.replace(oldCatCardExpanded, newCatCardExpanded);

// Restyle Tool Cards in Study Tracker
css = css.replaceAll(
  'box-shadow: 0 2px 10px -1px rgba(0, 0, 0, 0.24), 0 1px 3px 0 rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.035);',
  'box-shadow: var(--shadow-sm); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl);'
);

fs.writeFileSync('css/style.css', css, 'utf-8');
console.log('Successfully restyled cards with clean, light, flat treatment!');
