/* ============================================================
   LOGIN PAGE
   ============================================================ */

const LoginPage = {
  render() {
    document.getElementById('app-root').innerHTML = `
      <div class="login-page">
        <div class="login-bg-orb login-bg-orb-1"></div>
        <div class="login-bg-orb login-bg-orb-2"></div>
        <div class="login-card">
          <div class="login-header">
            <div class="login-logo">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <h1>Internal Audit</h1>
            <p>Monitoring System · Sign in to continue</p>
          </div>

          <div id="login-error" class="login-error hidden">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span id="login-error-text">Invalid username or password.</span>
          </div>

          <form class="login-form" id="login-form">
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" class="form-control" id="login-username" placeholder="Enter your username" autocomplete="username" required />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="input-icon-wrapper">
                <input type="password" class="form-control" id="login-password" placeholder="Enter your password" autocomplete="current-password" required />
                <button type="button" class="input-icon-btn" id="toggle-password" tabindex="-1" aria-label="Show password">
                  <i data-lucide="eye"></i>
                </button>
              </div>
            </div>
            <button type="submit" class="btn login-btn" id="login-btn">
              Sign In
            </button>
          </form>

          <div class="login-footer">
            Internal Audit Division &mdash; Confidential System
          </div>
        </div>
      </div>`;
    this.afterRender();
  },

  afterRender() {
    PageLifecycle.on('login-form', 'submit', (e) => this.handleLogin(e));
    PageLifecycle.on('toggle-password', 'click', () => this.togglePassword());
  },

  togglePassword() {
    const input = document.getElementById('login-password');
    const icon = document.querySelector('#toggle-password i');
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
    if (window.lucide) lucide.createIcons();
  },

  async handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');

    btn.textContent = 'Signing in…';
    btn.disabled = true;

    try {
      const session = await Auth.login(username, password);
      errEl.classList.add('hidden');
      Toast.success('Welcome back, ' + session.name + '!', 'Signed In');
      Router.navigate('dashboard');
    } catch (err) {
      errEl.classList.remove('hidden');
      document.getElementById('login-error-text').textContent = err.message || 'Invalid username or password.';
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  },

};

window.LoginPage = LoginPage;
