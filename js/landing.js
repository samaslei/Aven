/**
 * Aven - Marketing Landing Page Component
 * Reflects Aven's current visual identity:
 * - Dark-first theme with full Light mode support
 * - Violet / Indigo accent
 * - Borderless emboss-card depth
 * - Pill-shaped active states
 * - Real Subjects dashboard product mockup
 */

export class LandingPage {
  constructor(onNavigateAuth, onToggleTheme) {
    this.onNavigateAuth = onNavigateAuth; // (isSignUp: boolean) => void
    this.onToggleTheme = onToggleTheme;
    this.container = null;
  }

  render(container) {
    this.container = container;

    container.innerHTML = `
      <div class="landing-wrapper">
        <!-- Ambient Radial Glows -->
        <div class="landing-bg-glow glow-top" aria-hidden="true"></div>
        <div class="landing-bg-glow glow-middle" aria-hidden="true"></div>
        <div class="landing-bg-grid" aria-hidden="true"></div>

        <!-- Sticky Header / Navbar -->
        <header class="landing-nav">
          <div class="landing-nav-container">
            <a href="#" class="landing-brand">
              <img src="favicon.svg" alt="Aven Logo" class="brand-icon">
              <span class="brand-text">Aven</span>
              <span class="landing-badge-tag">Academic OS</span>
            </a>

            <nav class="landing-nav-links" aria-label="Landing page navigation">
              <a href="#features" class="landing-nav-link">Features</a>
              <a href="#how-it-works" class="landing-nav-link">How It Works</a>
              <a href="#why-aven" class="landing-nav-link">Why Aven</a>
            </nav>

            <div class="landing-nav-actions">
              <button type="button" class="btn-ghost btn-icon landing-theme-toggle" id="landing-theme-btn" aria-label="Toggle Light/Dark Theme" title="Toggle Theme">
                <svg class="icon-theme-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                <svg class="icon-theme-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              </button>
              
              <button type="button" class="btn btn-secondary btn-sm landing-signin-btn" id="landing-nav-signin">
                Sign in
              </button>
              <button type="button" class="btn btn-primary btn-sm landing-cta-btn" id="landing-nav-getstarted">
                Get started
              </button>
            </div>
          </div>
        </header>

        <!-- Main Hero Section -->
        <section class="landing-hero">
          <div class="landing-hero-content">
            <div class="landing-pill-tag">
              <span class="pill-sparkle">✦</span>
              <span>The Academic Operating System</span>
            </div>

            <h1 class="landing-hero-headline">
              Unify your subjects, study tracking, grades, and syllabi.
            </h1>

            <p class="landing-hero-subheadline">
              Replace messy spreadsheets, disconnected study apps, and lost PDF syllabi with a cohesive, dark-first workspace engineered for high-achieving university students.
            </p>

            <div class="landing-hero-ctas">
              <button type="button" class="btn btn-primary landing-hero-primary-cta" id="hero-getstarted-btn">
                <span>Get started for free</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
              <a href="#features" class="btn btn-secondary landing-hero-secondary-cta" id="hero-explore-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="10 8 16 12 10 16 10 8"></polygon>
                </svg>
                <span>See what's inside</span>
              </a>
            </div>

            <div class="landing-hero-social-proof">
              <div class="landing-avatars-stack">
                <div class="landing-avatar-pill" style="background: #6366f1;">CS</div>
                <div class="landing-avatar-pill" style="background: #10b981;">ENG</div>
                <div class="landing-avatar-pill" style="background: #8b5cf6;">MED</div>
                <div class="landing-avatar-pill" style="background: #f59e0b;">BIO</div>
              </div>
              <span class="landing-proof-text">Trusted by students taking heavy STEM & honors course loads</span>
            </div>
          </div>

          <!-- Hero Product Mockup (Real Subjects Dashboard UI) -->
          <div class="landing-hero-mockup-wrapper">
            <div class="landing-mockup-frame">
              <!-- Window Chrome Bar -->
              <div class="mockup-window-header">
                <div class="mockup-window-dots">
                  <span class="dot-red"></span>
                  <span class="dot-yellow"></span>
                  <span class="dot-green"></span>
                </div>
                <div class="mockup-url-bar">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span>app.aven.ac/#subjects</span>
                </div>
                <div class="mockup-header-actions">
                  <span class="mockup-badge-live">● Live Cloud</span>
                </div>
              </div>

              <!-- Realistic Subjects Dashboard Interface -->
              <div class="mockup-app-body">
                <!-- Top 4 Metric Stat Cards -->
                <div class="mockup-stats-banner">
                  <div class="mockup-stat-card stat-blue">
                    <div class="mockup-stat-head">
                      <span>Enrolled Subjects</span>
                      <span class="mockup-stat-icon">📚</span>
                    </div>
                    <div class="mockup-stat-val">5 Active</div>
                    <div class="mockup-stat-sub">5 total courses enrolled</div>
                  </div>

                  <div class="mockup-stat-card stat-teal">
                    <div class="mockup-stat-head">
                      <span>Study Time (Week)</span>
                      <span class="mockup-stat-icon">⏱️</span>
                    </div>
                    <div class="mockup-stat-val">18.4h</div>
                    <div class="mockup-stat-sub">52.8h all-time · 34 sessions</div>
                  </div>

                  <div class="mockup-stat-card stat-indigo">
                    <div class="mockup-stat-head">
                      <span>Cumulative GPA</span>
                      <span class="mockup-stat-icon">📈</span>
                    </div>
                    <div class="mockup-stat-val" style="color: #10b981;">1.22</div>
                    <div class="mockup-stat-sub">Avg 94.2% · 5/5 graded</div>
                  </div>

                  <div class="mockup-stat-card stat-purple">
                    <div class="mockup-stat-head">
                      <span>Study Streak</span>
                      <span class="mockup-stat-icon">🔥</span>
                    </div>
                    <div class="mockup-stat-val">8 days</div>
                    <div class="mockup-stat-sub">Best: 14 days</div>
                  </div>
                </div>

                <!-- Mockup Toolbar -->
                <div class="mockup-toolbar">
                  <div class="mockup-toolbar-left">
                    <div class="mockup-segmented">
                      <span class="mockup-seg active">Active (5)</span>
                      <span class="mockup-seg">Archived (0)</span>
                    </div>
                    <div class="mockup-pill-filter">Year 2 · 1st Sem</div>
                  </div>
                  <div class="mockup-toolbar-right">
                    <span class="mockup-action-btn">+ New Subject</span>
                  </div>
                </div>

                <!-- Mockup Subject Cards Grid -->
                <div class="mockup-cards-grid">
                  <!-- Subject 1: CS 102 -->
                  <div class="mockup-subject-card" style="--card-accent: #6366f1;">
                    <div class="mockup-card-top">
                      <div class="mockup-color-bar" style="background: #6366f1;"></div>
                      <div class="mockup-card-title-group">
                        <div class="mockup-card-code">CS 102</div>
                        <div class="mockup-card-name">Data Structures & Algorithms</div>
                        <div class="mockup-card-prof">Dr. Elena Santos</div>
                      </div>
                    </div>
                    <div class="mockup-term-tag">2nd Year · 1st Sem</div>
                    <div class="mockup-metrics-grid">
                      <div class="mockup-m-item">
                        <span class="m-label">Study Time</span>
                        <span class="m-val">12.5h</span>
                      </div>
                      <div class="mockup-m-item">
                        <span class="m-label">Standing</span>
                        <span class="mockup-standing-pill excellent">● 1.00 (96.4%)</span>
                      </div>
                      <div class="mockup-m-item">
                        <span class="m-label">Plan</span>
                        <span class="mockup-plan-badge">✓ Attached</span>
                      </div>
                    </div>
                  </div>

                  <!-- Subject 2: MATH 21 -->
                  <div class="mockup-subject-card" style="--card-accent: #8b5cf6;">
                    <div class="mockup-card-top">
                      <div class="mockup-color-bar" style="background: #8b5cf6;"></div>
                      <div class="mockup-card-title-group">
                        <div class="mockup-card-code">MATH 21</div>
                        <div class="mockup-card-name">Discrete Mathematics</div>
                        <div class="mockup-card-prof">Prof. Marcus Vance</div>
                      </div>
                    </div>
                    <div class="mockup-term-tag">2nd Year · 1st Sem</div>
                    <div class="mockup-metrics-grid">
                      <div class="mockup-m-item">
                        <span class="m-label">Study Time</span>
                        <span class="m-val">8.2h</span>
                      </div>
                      <div class="mockup-m-item">
                        <span class="m-label">Standing</span>
                        <span class="mockup-standing-pill superior">● 1.25 (93.1%)</span>
                      </div>
                      <div class="mockup-m-item">
                        <span class="m-label">Plan</span>
                        <span class="mockup-plan-badge">✓ Attached</span>
                      </div>
                    </div>
                  </div>

                  <!-- Subject 3: PHYS 11 -->
                  <div class="mockup-subject-card" style="--card-accent: #06b6d4;">
                    <div class="mockup-card-top">
                      <div class="mockup-color-bar" style="background: #06b6d4;"></div>
                      <div class="mockup-card-title-group">
                        <div class="mockup-card-code">PHYS 11</div>
                        <div class="mockup-card-name">General Physics II (Electromagnetism)</div>
                        <div class="mockup-card-prof">Dr. Aris Chen</div>
                      </div>
                    </div>
                    <div class="mockup-term-tag">2nd Year · 1st Sem</div>
                    <div class="mockup-metrics-grid">
                      <div class="mockup-m-item">
                        <span class="m-label">Study Time</span>
                        <span class="m-val">6.8h</span>
                      </div>
                      <div class="mockup-m-item">
                        <span class="m-label">Standing</span>
                        <span class="mockup-standing-pill verygood">● 1.50 (90.8%)</span>
                      </div>
                      <div class="mockup-m-item">
                        <span class="m-label">Plan</span>
                        <span class="mockup-plan-badge">✓ Attached</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Feature Grid (6 Borderless Emboss-Depth Cards) -->
        <section class="landing-section" id="features">
          <div class="landing-section-header">
            <div class="landing-pill-tag">Features</div>
            <h2 class="landing-section-title">Everything you need for academic mastery</h2>
            <p class="landing-section-subtitle">
              Engineered from the ground up to replace fragmented tools with an integrated system.
            </p>
          </div>

          <div class="landing-features-grid">
            <!-- Card 1: Study Tracker -->
            <div class="landing-feature-card">
              <div class="feature-icon-wrapper" style="background: rgba(99, 102, 241, 0.14); color: #6366f1;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3 class="feature-card-title">Study Tracker & Heatmap</h3>
              <p class="feature-card-desc">
                Log study sessions and track your consistency across subjects. Watch your study consistency grow on a GitHub/LeetCode-style activity heatmap.
              </p>
              <div class="feature-card-highlight">
                <span class="highlight-tag">Milestone Journey</span>
                <span class="highlight-tag">Streak Tracking</span>
              </div>
            </div>

            <!-- Card 2: Grade Calculator -->
            <div class="landing-feature-card">
              <div class="feature-icon-wrapper" style="background: rgba(16, 185, 129, 0.14); color: #10b981;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3 class="feature-card-title">Weighted Grade Calculator</h3>
              <p class="feature-card-desc">
                Organize assessments by customizable weighted categories (Quizzes, Exams, Labs). Full Philippine 1.00–5.00 grading scale support with target final score solver.
              </p>
              <div class="feature-card-highlight">
                <span class="highlight-tag">Philippine Scale</span>
                <span class="highlight-tag">Target Solver</span>
              </div>
            </div>

            <!-- Card 3: Subjects Dashboard -->
            <div class="landing-feature-card">
              <div class="feature-icon-wrapper" style="background: rgba(139, 92, 246, 0.14); color: #8b5cf6;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </div>
              <h3 class="feature-card-title">Subjects Command Center</h3>
              <p class="feature-card-desc">
                Your enrolled courses organized by academic year and semester. View standing, hours logged, attached syllabi, and bulk-archive completed semesters.
              </p>
              <div class="feature-card-highlight">
                <span class="highlight-tag">Term Filtering</span>
                <span class="highlight-tag">Semester Archiving</span>
              </div>
            </div>

            <!-- Card 4: Study Plans -->
            <div class="landing-feature-card">
              <div class="feature-icon-wrapper" style="background: rgba(245, 158, 11, 0.14); color: #f59e0b;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
              </div>
              <h3 class="feature-card-title">Interactive Study Plans</h3>
              <p class="feature-card-desc">
                Embed interactive HTML curriculum guides, markdown syllabi, and weekly schedules directly inside each course for instant reference during study sessions.
              </p>
              <div class="feature-card-highlight">
                <span class="highlight-tag">HTML Viewer</span>
                <span class="highlight-tag">Course-Bound</span>
              </div>
            </div>

            <!-- Card 5: Time Distribution -->
            <div class="landing-feature-card">
              <div class="feature-icon-wrapper" style="background: rgba(6, 182, 212, 0.14); color: #06b6d4;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <h3 class="feature-card-title">Study Time Distribution</h3>
              <p class="feature-card-desc">
                Visual breakdown of where your hours are actually going. Balance your efforts across high-unit majors and identify neglected courses before midterms.
              </p>
              <div class="feature-card-highlight">
                <span class="highlight-tag">Course Breakdown</span>
                <span class="highlight-tag">Weekly Stats</span>
              </div>
            </div>

            <!-- Card 6: Settings & Cloud Sync -->
            <div class="landing-feature-card">
              <div class="feature-icon-wrapper" style="background: rgba(236, 72, 153, 0.14); color: #ec4899;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <polyline points="23 20 23 14 17 14"></polyline>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                </svg>
              </div>
              <h3 class="feature-card-title">Cloud Sync & Personalization</h3>
              <p class="feature-card-desc">
                Seamless real-time Supabase cloud sync across laptop and mobile, high-contrast Dark & Light modes, custom passing marks, and instant JSON backups.
              </p>
              <div class="feature-card-highlight">
                <span class="highlight-tag">Cloud Sync</span>
                <span class="highlight-tag">Dark & Light</span>
              </div>
            </div>
          </div>
        </section>

        <!-- How It Works (3 Steps) -->
        <section class="landing-section section-elevated" id="how-it-works">
          <div class="landing-section-header">
            <div class="landing-pill-tag">Workflow</div>
            <h2 class="landing-section-title">How Aven streamlines your semester</h2>
            <p class="landing-section-subtitle">
              Three simple steps to transform how you track academics and prepare for exams.
            </p>
          </div>

          <div class="landing-steps-grid">
            <div class="landing-step-card">
              <div class="step-badge">01</div>
              <h3 class="step-title">Add your subjects</h3>
              <p class="step-desc">
                Create courses with codes, instructor names, semester tags, and custom color accents. Upload your syllabi and grade category breakdown weights.
              </p>
            </div>

            <div class="landing-step-card">
              <div class="step-badge">02</div>
              <h3 class="step-title">Track & log study sessions</h3>
              <p class="step-desc">
                Log your study hours when working on problem sets or reviewing notes. Aven automatically tallies your consistency, heatmap activity, and streaks.
              </p>
            </div>

            <div class="landing-step-card">
              <div class="step-badge">03</div>
              <h3 class="step-title">See your standing & solve targets</h3>
              <p class="step-desc">
                Log quiz scores and lab marks. Aven calculates your exact standing and tells you the precise score you need on the final exam to secure your target grade.
              </p>
            </div>
          </div>
        </section>

        <!-- Why Students Use Aven (Benefits Checklist) -->
        <section class="landing-section" id="why-aven">
          <div class="landing-section-header">
            <div class="landing-pill-tag">Benefits</div>
            <h2 class="landing-section-title">Built for high standards, zero friction</h2>
            <p class="landing-section-subtitle">
              Why top university students choose Aven over generic productivity apps.
            </p>
          </div>

          <div class="landing-benefits-grid">
            <div class="benefit-item">
              <div class="benefit-check">✓</div>
              <div class="benefit-text">
                <strong>Zero disjointed spreadsheets</strong>
                <p>No more fragile formulas or broken links. Everything is organized into a single dedicated application.</p>
              </div>
            </div>

            <div class="benefit-item">
              <div class="benefit-check">✓</div>
              <div class="benefit-text">
                <strong>Philippine university grading scale</strong>
                <p>Native 1.00–5.00 GPA calculation with customizable grade boundaries and category weights.</p>
              </div>
            </div>

            <div class="benefit-item">
              <div class="benefit-check">✓</div>
              <div class="benefit-text">
                <strong>Real-time Supabase cloud sync</strong>
                <p>Your study sessions, grade entries, and syllabus plans update instantly across all your devices.</p>
              </div>
            </div>

            <div class="benefit-item">
              <div class="benefit-check">✓</div>
              <div class="benefit-text">
                <strong>Distraction-free dark-first interface</strong>
                <p>Designed for late-night study sessions with deep dark tones and ultra-refined typography.</p>
              </div>
            </div>

            <div class="benefit-item">
              <div class="benefit-check">✓</div>
              <div class="benefit-text">
                <strong>Instant target grade solver</strong>
                <p>Know exactly what score you need on term exams without doing manual algebraic gymnastics.</p>
              </div>
            </div>

            <div class="benefit-item">
              <div class="benefit-check">✓</div>
              <div class="benefit-text">
                <strong>Embedded syllabi & curriculum viewer</strong>
                <p>Keep your learning objectives, lecture schedules, and reading lists one click away.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Final CTA Banner -->
        <section class="landing-final-cta">
          <div class="landing-cta-card">
            <div class="landing-cta-glow" aria-hidden="true"></div>
            <h2 class="landing-cta-headline">Elevate your academic workflow today.</h2>
            <p class="landing-cta-subtitle">
              Join students who stay organized, hit their study goals, and finish every semester with total clarity.
            </p>
            <div class="landing-cta-buttons">
              <button type="button" class="btn btn-primary landing-cta-large" id="cta-getstarted-btn">
                <span>Get started for free</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
              <button type="button" class="btn btn-secondary landing-cta-signin" id="cta-signin-btn">
                Sign in to existing account
              </button>
            </div>
          </div>
        </section>

        <!-- Footer -->
        <footer class="landing-footer">
          <div class="landing-footer-container">
            <div class="landing-footer-brand">
              <div class="landing-brand">
                <img src="favicon.svg" alt="Aven Logo" class="brand-icon">
                <span class="brand-text">Aven</span>
              </div>
              <p class="landing-footer-tagline">Academic Operating System for university students.</p>
            </div>

            <div class="landing-footer-links">
              <div class="footer-col">
                <span class="footer-col-title">Navigation</span>
                <a href="#features">Features</a>
                <a href="#how-it-works">How It Works</a>
                <a href="#why-aven">Why Aven</a>
              </div>
              <div class="footer-col">
                <span class="footer-col-title">Account</span>
                <a href="#" id="footer-signin-link">Sign In</a>
                <a href="#" id="footer-signup-link">Create Account</a>
              </div>
            </div>
          </div>

          <div class="landing-footer-bottom">
            <p>© 2026 Aven · Academic Operating System. Built with precision for students.</p>
          </div>
        </footer>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Navigation / CTA button handlers
    const navSignIn = document.getElementById('landing-nav-signin');
    const navGetStarted = document.getElementById('landing-nav-getstarted');
    const heroGetStarted = document.getElementById('hero-getstarted-btn');
    const ctaGetStarted = document.getElementById('cta-getstarted-btn');
    const ctaSignIn = document.getElementById('cta-signin-btn');
    const footerSignIn = document.getElementById('footer-signin-link');
    const footerSignUp = document.getElementById('footer-signup-link');
    const themeToggleBtn = document.getElementById('landing-theme-btn');

    if (navSignIn) {
      navSignIn.addEventListener('click', () => this.onNavigateAuth(false));
    }
    if (navGetStarted) {
      navGetStarted.addEventListener('click', () => this.onNavigateAuth(true));
    }
    if (heroGetStarted) {
      heroGetStarted.addEventListener('click', () => this.onNavigateAuth(true));
    }
    if (ctaGetStarted) {
      ctaGetStarted.addEventListener('click', () => this.onNavigateAuth(true));
    }
    if (ctaSignIn) {
      ctaSignIn.addEventListener('click', () => this.onNavigateAuth(false));
    }
    if (footerSignIn) {
      footerSignIn.addEventListener('click', (e) => {
        e.preventDefault();
        this.onNavigateAuth(false);
      });
    }
    if (footerSignUp) {
      footerSignUp.addEventListener('click', (e) => {
        e.preventDefault();
        this.onNavigateAuth(true);
      });
    }

    if (themeToggleBtn && this.onToggleTheme) {
      themeToggleBtn.addEventListener('click', () => {
        this.onToggleTheme();
      });
    }

    // Smooth scroll for anchor links
    this.container.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId && targetId !== '#') {
          const targetEl = this.container.querySelector(targetId);
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }
}
