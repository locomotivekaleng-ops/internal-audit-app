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
            <p style="margin-top:8px;font-size:10px;color:var(--amber-light);font-weight:600;background:rgba(245,158,11,0.1);padding:4px 10px;border-radius:4px;display:inline-block">⚠ TESTING — Data fiktif</p>
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
              <input type="password" class="form-control" id="login-password" placeholder="Enter your password" autocomplete="current-password" required />
            </div>
            <button type="submit" class="btn login-btn" id="login-btn">
              Sign In
            </button>
          </form>

          <div class="demo-accounts">
            <p>Demo Accounts (click to fill)</p>
            <div class="demo-account-item" data-username="admin" data-password="admin123">
              <span>admin</span><span class="role-tag">Superadmin</span>
            </div>
            <div class="demo-account-item" data-username="manager" data-password="123">
              <span>manager</span><span class="role-tag">Manager Audit</span>
            </div>
            <div class="demo-account-item" data-username="auditor" data-password="123">
              <span>auditor</span><span class="role-tag">Auditor</span>
            </div>
            <div class="demo-account-item" data-username="divisi" data-password="123">
              <span>divisi</span><span class="role-tag">Auditee</span>
            </div>
          </div>

          <div class="login-footer">
            Internal Audit Division &mdash; Confidential System
          </div>
        </div>
      </div>`;
    this.afterRender();
  },

  afterRender() {
    PageLifecycle.on('login-form', 'submit', (e) => this.handleLogin(e));
    if (!this._eventsWired) {
      this._eventsWired = true;
      PageLifecycle.delegate('app-root', {
        click: {
          '.demo-account-item': (e, target) => {
            this.fillDemo(target.dataset.username, target.dataset.password);
          }
        }
      });
    }
  },

  handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');

    btn.textContent = 'Signing in…';
    btn.disabled = true;

    setTimeout(() => {
      const session = Auth.login(username, password);
      if (session) {
        errEl.classList.add('hidden');
        Toast.success(`Welcome back, ${session.name}!`, 'Signed In');
        Router.navigate('dashboard');
      } else {
        errEl.classList.remove('hidden');
        document.getElementById('login-error-text').textContent = 'Invalid username or password.';
        btn.textContent = 'Sign In';
        btn.disabled = false;
      }
    }, 400);
  },

  fillDemo(u, p) {
    document.getElementById('login-username').value = u;
    document.getElementById('login-password').value = p;
  }
};

window.LoginPage = LoginPage;
