/* ============================================================
   USER MANAGEMENT PAGE (Head & Super Admin only)
   ============================================================ */

const UsersPage = {
  render() {
    if (!Auth.requireAuth()) return;
    if (!Auth.isHead()) { Router.navigate('dashboard'); return; }
    Components.renderAppShell(
      'User Management',
      'Manage system accounts and permissions',
      UsersPage.buildHtml(),
      'users'
    );
    UsersPage._pageWired = false;
    UsersPage.afterRender();
  },

  buildHtml() {
    const users = DB.get('users');
    const depts = DB.get('departments') || [];

    const roleCount = {
      superadmin: users.filter(u=>u.role==='superadmin').length,
      head:       users.filter(u=>u.role==='head').length,
      auditor:    users.filter(u=>u.role==='auditor').length,
      division:   users.filter(u=>u.role==='division').length,
    };

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h2>User Management</h2>
          <p>${users.length} accounts · ${users.filter(u=>u.status==='active').length} active</p>
        </div>
        <div class="page-header-actions">
          ${Auth.isSuperAdmin() ? `<button class="btn btn-primary" id="users-add-btn"><i data-lucide="user-plus"></i> Add User</button>` : ''}
        </div>
      </div>

      <!-- Role KPIs -->
      <div class="kpi-grid kpi-grid-4">
        ${Components.kpiCard('Superadmin', roleCount.superadmin, 'Full system access', 'shield', 'red')}
        ${Components.kpiCard('Manager Audit', roleCount.head, 'Internal Audit', 'shield-check', 'blue')}
        ${Components.kpiCard('Auditor', roleCount.auditor, 'Internal Audit', 'user', 'amber')}
        ${Components.kpiCard('Auditee / Other Dept', roleCount.division, 'Non-Internal Audit', 'building', 'purple')}
      </div>

      <!-- Users Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="users"></i> All Accounts</div>
        </div>
        <div class="card-body" style="padding-top:0">
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${users.map((u,i) => `
                  <tr>
                    <td class="col-number">${i+1}</td>
                    <td class="col-bold">
                      <div style="display:flex;align-items:center;gap:var(--space-2)">
                        <div class="user-avatar" style="width:28px;height:28px;font-size:10px">${Utils.getInitials(u.name)}</div>
                        ${u.name}
                      </div>
                    </td>
                    <td class="col-mono">${u.username}</td>
                    <td style="font-size:11px">${u.email||'-'}</td>
                    <td>${UsersPage.roleBadge(u.role)}</td>
                    <td style="font-size:11px;color:var(--text-muted)">${u.department||'—'}</td>
                    <td>${Utils.statusBadge(u.status)}</td>
                    <td style="font-size:11px">${Utils.formatDate(u.createdAt)}</td>
                    <td>
                      <div class="flex gap-2">
                        ${Auth.isSuperAdmin() ? `
                          <button class="btn btn-icon btn-secondary btn-sm" data-id="${u.id}" data-action="edit-user" title="Edit"><i data-lucide="pencil"></i></button>
                          <button class="btn btn-icon btn-secondary btn-sm" data-id="${u.id}" data-action="reset-user" title="Reset Password"><i data-lucide="key"></i></button>
                          ${u.id !== 'usr_superadmin' ? `<button class="btn btn-icon btn-danger btn-sm" data-id="${u.id}" data-action="delete-user" title="Delete"><i data-lucide="trash-2"></i></button>` : ''}
                        ` : `<span class="text-muted" style="font-size:11px">View only</span>`}
                      </div>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  },

  roleBadge(role) {
    const map = {
      superadmin: ['badge-red',    'Superadmin'],
      head:       ['badge-blue',   'Manager Audit'],
      auditor:    ['badge-amber',  'Auditor'],
      division:   ['badge-purple', 'Auditee / Other Dept'],
    };
    const [cls, label] = map[role] || ['badge-gray', role];
    return `<span class="badge ${cls}">${label}</span>`;
  },

  refresh() {
    document.getElementById('page-content').innerHTML = UsersPage.buildHtml();
    UsersPage.afterRender();
    if (window.lucide) lucide.createIcons();
  },

  afterRender() {
    if (!UsersPage._pageWired) {
      UsersPage._pageWired = true;
      PageLifecycle.delegate('page-content', {
        click: {
          '[data-action="edit-user"]': (e, target) => { this.openEditModal(target.dataset.id); },
          '[data-action="reset-user"]': (e, target) => { this.openResetModal(target.dataset.id); },
          '[data-action="delete-user"]': (e, target) => { this.deleteUser(target.dataset.id); },
          '#users-add-btn': () => this.openAddModal(),
        }
      });
    }
  },

  openAddModal() { UsersPage._openModal(null); },
  openEditModal(id) { UsersPage._openModal(DB.find('users', id)); },

  _openModal(u) {
    const isEdit = !!u;
    const depts  = DB.get('departments') || [];

    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="user-plus"></i> ${isEdit ? 'Edit' : 'Create'} User Account</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-grid form-grid-2">
          <div class="form-group">
            <label class="form-label required">Full Name</label>
            <input type="text" class="form-control" id="uf-name" value="${Utils.escapeHtml(u?.name||'')}" />
          </div>
          <div class="form-group">
            <label class="form-label required">Username</label>
            <input type="text" class="form-control" id="uf-username" value="${Utils.escapeHtml(u?.username||'')}" ${isEdit?'readonly':''} />
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" id="uf-email" value="${Utils.escapeHtml(u?.email||'')}" />
          </div>
          ${!isEdit ? `<div class="form-group">
            <label class="form-label required">Password</label>
            <input type="password" class="form-control" id="uf-password" placeholder="Set initial password" />
          </div>` : '<div></div>'}
          <div class="form-group">
            <label class="form-label required">Role</label>
            <select class="form-control" id="uf-role">
              <option value="auditor"    ${u?.role==='auditor'?'selected':''}>Auditor</option>
              <option value="head"       ${u?.role==='head'?'selected':''}>Manager Audit</option>
              <option value="division"   ${u?.role==='division'?'selected':''}>Auditee / Other Dept</option>
              <option value="superadmin" ${u?.role==='superadmin'?'selected':''}>Superadmin</option>
            </select>
            <div id="uf-perm-summary" class="perm-summary" style="display:none"></div>
          </div>
          <div class="form-group" id="dept-group">
            <label class="form-label required" id="dept-label">Department</label>
            <select class="form-control" id="uf-dept">
              <option value="">-- Pilih Department --</option>
              ${depts.map(d=>`<option value="${d.name}" ${u?.department===d.name?'selected':''}>${d.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" id="uf-status">
              <option value="active"   ${u?.status==='active'?'selected':''}>Active</option>
              <option value="inactive" ${u?.status==='inactive'?'selected':''}>Inactive</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="modal-close">Cancel</button>
        <button class="btn btn-primary" id="users-save-btn">
          <i data-lucide="save"></i> ${isEdit ? 'Update' : 'Create'}
        </button>
      </div>`, 'modal-md');
    if (window.lucide) lucide.createIcons();
    PageLifecycle.on('uf-role', 'change', () => UsersPage.onRoleChange());
    PageLifecycle.on('users-save-btn', 'click', () => UsersPage.saveUser(u?.id || ''));
    UsersPage.onRoleChange();
  },

  onRoleChange() {
    const role = document.getElementById('uf-role').value;
    const deptGroup = document.getElementById('dept-group');
    const deptLabel = document.getElementById('dept-label');
    if (!deptGroup) return;
    if (role === 'superadmin') {
      deptGroup.style.display = 'none';
    } else {
      deptGroup.style.display = '';
      deptLabel.textContent = role === 'division' ? 'Department (wajib untuk Divisi)' : 'Department';
    }

    const summary = document.getElementById('uf-perm-summary');
    if (!summary) return;
    const matrix = Perms.getMatrix();
    const perms = matrix[role] || {};
    const pages = [
      { key: 'wbs', label: 'WBS' },
      { key: 'fds', label: 'FDS' },
      { key: 'cases', label: 'Audit Assignments' },
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'dept-dashboard', label: 'Dept Dashboard' },
      { key: 'fraud-trend', label: 'Fraud Trendline' },
      { key: 'closing-analysis', label: 'AAP Closing' },
      { key: 'outlet-profile', label: 'Outlet Profile' },
      { key: 'reports', label: 'Reports' },
      { key: 'auditors', label: 'Auditors' },
      { key: 'users', label: 'User Mgt' },
      { key: 'master', label: 'Master Data' },
    ];
    const icons = { none: '✕', read: '👁', full: '✏' };
    const cls   = { none: 'none', read: 'read', full: 'full' };
    const html = pages.map(p => {
      const val = perms[p.key] || 'none';
      return `<span class="perm-summary-item ${cls[val]}"><span class="perm-summary-icon">${icons[val]}</span> ${p.label}</span>`;
    }).join('');
    summary.innerHTML = `
      <div class="perm-summary-title">
        <i data-lucide="info" style="width:12px;height:12px"></i>
        Akses untuk role ini:
      </div>
      <div class="perm-summary-grid">${html}</div>
      <div class="perm-summary-footer">
        <button class="btn btn-secondary btn-sm" data-action="goto-role-settings" data-role="${role}" style="font-size:10px">
          <i data-lucide="external-link" style="width:11px;height:11px"></i>
          Buka Role Settings
        </button>
      </div>`;
    summary.style.display = '';
    if (window.lucide) lucide.createIcons();

    const gotoBtn = summary.querySelector('[data-action="goto-role-settings"]');
    if (gotoBtn) {
      gotoBtn.addEventListener('click', () => {
        Modal.close();
        Router.navigate('settings');
      });
    }
  },

  saveUser(id) {
    const isEdit = !!id;
    const name    = document.getElementById('uf-name').value;
    const username= document.getElementById('uf-username').value;
    const email   = document.getElementById('uf-email').value;
    const role    = document.getElementById('uf-role').value;
    const dept    = document.getElementById('uf-dept')?.value || null;
    const status  = document.getElementById('uf-status').value;

    if (!name || !username || !role) { Toast.error('Fill required fields.'); return; }
    if (role === 'division' && !dept) { Toast.error('Department wajib diisi untuk role Divisi.'); return; }

    // Check username uniqueness
    const existing = DB.get('users').find(u => u.username === username && u.id !== id);
    if (existing) { Toast.error('Username already taken.'); return; }

    if (isEdit) {
      DB.update('users', id, { name, email, role, department: dept, status });
      Toast.success('User account updated.');
    } else {
      const password = document.getElementById('uf-password')?.value;
      if (!password) { Toast.error('Password is required.'); return; }
      DB.insert('users', { username, name, email, password, role, department: dept, status });
      Toast.success('User account created.');
    }
    Modal.close();
    UsersPage.refresh();
  },

  openResetModal(id) {
    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="key"></i> Reset Password</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label required">New Password</label>
          <input type="password" class="form-control" id="rp-pass" placeholder="Enter new password" />
        </div>
        <div class="form-group mt-4">
          <label class="form-label required">Confirm Password</label>
          <input type="password" class="form-control" id="rp-confirm" placeholder="Confirm new password" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="modal-close">Cancel</button>
        <button class="btn btn-primary" id="users-reset-btn">
          <i data-lucide="key"></i> Reset Password
        </button>
      </div>`, 'modal-sm');
    if (window.lucide) lucide.createIcons();
    PageLifecycle.on('users-reset-btn', 'click', () => UsersPage.resetPassword(id));
  },

  resetPassword(id) {
    const pass    = document.getElementById('rp-pass').value;
    const confirm = document.getElementById('rp-confirm').value;
    if (!pass)         { Toast.error('Enter new password.'); return; }
    if (pass !== confirm) { Toast.error('Passwords do not match.'); return; }
    if (pass.length < 6)  { Toast.error('Password must be at least 6 characters.'); return; }
    DB.update('users', id, { password: pass });
    Toast.success('Password reset successfully.');
    Modal.close();
  },

  deleteUser(id) {
    if (id === 'usr_superadmin') { Toast.error('Cannot delete the main admin account.'); return; }
    const session = Auth.getSession();
    if (session?.userId === id) { Toast.error('Cannot delete your own account.'); return; }
    Modal.confirm('Delete User', 'Delete this user account? This cannot be undone.', () => {
      DB.delete('users', id);
      Toast.success('User deleted.');
      UsersPage.refresh();
    });
  }
};

window.UsersPage = UsersPage;
