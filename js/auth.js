/**
 * Aven - Supabase Authentication UI & Flows
 */

import { signIn, signUp, isSupabaseConfigured } from './supabase.js';

export class AuthController {
  constructor(onAuthSuccess, onBackToLanding = null) {
    this.onAuthSuccess = onAuthSuccess;
    this.onBackToLanding = onBackToLanding;
    this.isSignUp = false;
    this.isLoading = false;
    this.authContainer = null;
  }

  renderAuthScreen(container, initialIsSignUp = false) {
    this.authContainer = container;
    this.isSignUp = initialIsSignUp;

    container.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-backdrop-glow"></div>
        <div class="auth-card">
          <div class="auth-top-bar">
            ${this.onBackToLanding ? `
              <button type="button" class="auth-back-btn" id="auth-back-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>Back to Aven</span>
              </button>
            ` : '<div></div>'}
          </div>

          <div class="auth-header">
            <div class="brand auth-brand">
              <img src="favicon.svg" alt="Aven Logo" class="brand-icon">
              <span class="brand-text">Aven</span>
              <span class="brand-tag">Cloud</span>
            </div>
            <h2 class="auth-title" id="auth-title">${this.isSignUp ? 'Create your Aven Account' : 'Welcome to Aven'}</h2>
            <p class="auth-subtitle" id="auth-subtitle">${this.isSignUp ? 'Start tracking courses, study streaks, and weighted grades in the cloud.' : 'Sign in to sync your subjects, study sessions, and grades across all devices.'}</p>
          </div>

          ${!isSupabaseConfigured ? `
            <div class="auth-notice warning" id="supabase-config-warning">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div>
                <strong>Supabase credentials missing</strong>
                <p>Ensure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> are set in your <code>.env</code> file.</p>
              </div>
            </div>
          ` : ''}

          <div class="auth-tabs">
            <button type="button" class="auth-tab-btn ${!this.isSignUp ? 'active' : ''}" id="tab-signin-btn">Sign In</button>
            <button type="button" class="auth-tab-btn ${this.isSignUp ? 'active' : ''}" id="tab-signup-btn">Create Account</button>
          </div>

          <form id="auth-form" class="auth-form" novalidate>
            <div id="auth-alert" class="auth-alert hidden"></div>

            <div class="form-group ${this.isSignUp ? '' : 'hidden'}" id="group-name">
              <label class="form-label" for="auth-display-name">Full Name</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input type="text" id="auth-display-name" class="form-input" placeholder="e.g. Alex Rivera" autocomplete="name" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="auth-email">Email Address</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input type="email" id="auth-email" class="form-input" placeholder="student@university.edu" required autocomplete="email" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="auth-password">Password</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input type="password" id="auth-password" class="form-input" placeholder="••••••••" required autocomplete="${this.isSignUp ? 'new-password' : 'current-password'}" />
                <button type="button" class="btn-toggle-password" id="btn-toggle-pwd" aria-label="Toggle password visibility">
                  <svg id="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
              <span class="form-hint" id="password-hint">${this.isSignUp ? 'Minimum 6 characters' : ''}</span>
            </div>

            <button type="submit" class="btn btn-primary auth-submit-btn" id="auth-submit-btn">
              <span id="auth-btn-text">${this.isSignUp ? 'Create Account' : 'Sign In'}</span>
              <span id="auth-spinner" class="auth-spinner hidden"></span>
            </button>
          </form>

          <div class="auth-footer">
            <p class="auth-footer-text">
              ${this.isSignUp ? 'Already have an account?' : "Don't have an account yet?"}
              <button type="button" class="auth-switch-link" id="auth-switch-btn">
                ${this.isSignUp ? 'Sign in' : 'Sign up for free'}
              </button>
            </p>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const tabSignIn = document.getElementById('tab-signin-btn');
    const tabSignUp = document.getElementById('tab-signup-btn');
    const switchBtn = document.getElementById('auth-switch-btn');
    const form = document.getElementById('auth-form');
    const togglePwd = document.getElementById('btn-toggle-pwd');
    const pwdInput = document.getElementById('auth-password');

    tabSignIn?.addEventListener('click', () => this.setMode(false));
    tabSignUp?.addEventListener('click', () => this.setMode(true));
    switchBtn?.addEventListener('click', () => this.setMode(!this.isSignUp));

    const backBtn = document.getElementById('auth-back-btn');
    if (backBtn && this.onBackToLanding) {
      backBtn.addEventListener('click', () => this.onBackToLanding());
    }

    togglePwd?.addEventListener('click', () => {
      if (!pwdInput) return;
      const isPassword = pwdInput.type === 'password';
      pwdInput.type = isPassword ? 'text' : 'password';
      togglePwd.innerHTML = isPassword ? `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      ` : `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
    });

    form?.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  setMode(isSignUp) {
    this.isSignUp = isSignUp;
    const titleEl = document.getElementById('auth-title');
    const subtitleEl = document.getElementById('auth-subtitle');
    const groupName = document.getElementById('group-name');
    const tabSignIn = document.getElementById('tab-signin-btn');
    const tabSignUp = document.getElementById('tab-signup-btn');
    const btnText = document.getElementById('auth-btn-text');
    const pwdHint = document.getElementById('password-hint');
    const switchBtn = document.getElementById('auth-switch-btn');
    const footerText = document.querySelector('.auth-footer-text');

    if (tabSignIn && tabSignUp) {
      tabSignIn.classList.toggle('active', !isSignUp);
      tabSignUp.classList.toggle('active', isSignUp);
    }

    if (groupName) {
      groupName.classList.toggle('hidden', !isSignUp);
    }

    if (titleEl) titleEl.textContent = isSignUp ? 'Create your Aven Account' : 'Welcome back to Aven';
    if (subtitleEl) subtitleEl.textContent = isSignUp 
      ? 'Start tracking courses, study streaks, and weighted grades in the cloud.'
      : 'Sign in to access your synchronized courses and academic records.';

    if (btnText) btnText.textContent = isSignUp ? 'Create Account' : 'Sign In';
    if (pwdHint) pwdHint.textContent = isSignUp ? 'Minimum 6 characters' : '';

    if (footerText && switchBtn) {
      footerText.innerHTML = isSignUp 
        ? `Already have an account? <button type="button" class="auth-switch-link" id="auth-switch-btn">Sign in</button>`
        : `Don't have an account yet? <button type="button" class="auth-switch-link" id="auth-switch-btn">Sign up for free</button>`;
      document.getElementById('auth-switch-btn')?.addEventListener('click', () => this.setMode(!this.isSignUp));
    }

    this.setLoading(false);
    this.showAlert('', 'none');
  }

  showAlert(message, type = 'error') {
    const alertEl = document.getElementById('auth-alert');
    if (!alertEl) return;
    if (!message || type === 'none') {
      alertEl.className = 'auth-alert hidden';
      alertEl.textContent = '';
      return;
    }
    alertEl.className = `auth-alert ${type}`;
    alertEl.textContent = message;
  }

  setLoading(isLoading) {
    this.isLoading = isLoading;
    const submitBtn = document.getElementById('auth-submit-btn');
    const btnText = document.getElementById('auth-btn-text');
    const spinner = document.getElementById('auth-spinner');

    if (submitBtn) submitBtn.disabled = isLoading;
    if (btnText) btnText.classList.toggle('hidden', isLoading);
    if (spinner) spinner.classList.toggle('hidden', !isLoading);
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (this.isLoading) return;

    const emailInput = document.getElementById('auth-email');
    const pwdInput = document.getElementById('auth-password');
    const nameInput = document.getElementById('auth-display-name');

    const email = emailInput?.value.trim();
    const password = pwdInput?.value;
    const displayName = nameInput?.value.trim();

    if (!email || !email.includes('@')) {
      this.showAlert('Please provide a valid email address.');
      emailInput?.focus();
      return;
    }

    if (!password || password.length < 6) {
      this.showAlert('Password must be at least 6 characters.');
      pwdInput?.focus();
      return;
    }

    this.setLoading(true);
    this.showAlert('', 'none');

    try {
      if (this.isSignUp) {
        const { data, error } = await signUp(email, password, displayName);
        if (error) throw error;

        if (data?.session) {
          this.showAlert('Account created successfully! Loading...', 'success');
          if (this.onAuthSuccess) this.onAuthSuccess(data.session);
        } else if (data?.user) {
          this.showAlert('Confirmation link sent! Please check your email inbox and click the link to confirm your account and open Aven.', 'success');
          this.setMode(false);
        }
      } else {
        const { data, error } = await signIn(email, password);
        if (error) throw error;

        if (data?.session) {
          this.showAlert('Signed in successfully!', 'success');
          if (this.onAuthSuccess) this.onAuthSuccess(data.session);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      const msg = err.message || 'Failed to authenticate. Please check your credentials.';
      this.showAlert(msg, 'error');
    } finally {
      this.setLoading(false);
    }
  }
}
