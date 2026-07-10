/* ============================================================
   SETTINGS — Role & Permission Management Page
   ============================================================ */

const SettingsPage = {

  _roles: [
    { key: 'superadmin', label: 'Superadmin' },
    { key: 'head',       label: 'Mgr Audit' },
    { key: 'auditor',    label: 'Auditor' },
    { key: 'division',   label: 'Auditee' },
  ],

  _sections: [
    {
      label: 'ANALYTICS',
      pages: [
        { key: 'dashboard',        label: 'Executive Dashboard' },
        { key: 'dept-dashboard',   label: 'Dashboard Divisi' },
        { key: 'fraud-trend',      label: 'Fraud Trendline' },
        { key: 'closing-analysis', label: 'AAP Closing Analysis' },
        { key: 'outlet-profile',   label: 'Outlet Profile' },
      ],
    },
    {
      label: 'CASE MANAGEMENT',
      pages: [
        { key: 'wbs',   label: 'WBS Overview' },
        { key: 'fds',   label: 'FDS Overview' },
        { key: 'cases', label: 'Audit Assignments' },
      ],
    },
    {
      label: 'LAPORAN',
      pages: [
        { key: 'reports', label: 'Laporan' },
      ],
    },
    {
      label: 'MASTER',
      pages: [
        { key: 'master',   label: 'Master Data' },
        { key: 'users',    label: 'User Management' },
        { key: 'auditors', label: 'Auditors' },
      ],
    },
  ],

  render() {
    if (!Auth.requireAuth()) return;
    Components.renderAppShell(
      'Role Settings',
      'Konfigurasi akses setiap role terhadap halaman aplikasi',
      SettingsPage.buildHtml(),
      'settings'
    );
    SettingsPage.afterRender();
  },

  buildHtml() {
    const matrix = Perms.getMatrix();

    const headerRoleBadges = SettingsPage._roles.map(r => {
      const icons = { superadmin: '🔵', head: '🟣', auditor: '🟠', division: '⚪' };
      return `<th class="perm-role-header">
        <span class="perm-role-badge ${r.key}">${icons[r.key] || ''} ${r.label}</span>
      </th>`;
    }).join('');

    const bodyRows = SettingsPage._sections.flatMap(s => {
      const sectionRow = `<tr class="perm-section-row"><td colspan="${SettingsPage._roles.length + 1}">${s.label}</td></tr>`;
      const pageRows = s.pages.map(p => {
        const cells = SettingsPage._roles.map(r => {
          const val = matrix[r.key]?.[p.key] || 'none';
          return `<td>
            <div class="perm-btn-group" data-role="${r.key}" data-page="${p.key}">
              ${['none','read','full'].map(lvl => `
                <label class="perm-btn ${val === lvl ? 'selected' : ''}" data-value="${lvl}">
                  <input type="radio" name="perm_${r.key}_${p.key}" value="${lvl}" ${val === lvl ? 'checked' : ''}>
                  ${lvl === 'none' ? '✕' : lvl === 'read' ? '👁' : '✏'}
                </label>
              `).join('')}
            </div>
          </td>`;
        }).join('');
        return `<tr><td>${p.label}</td>${cells}</tr>`;
      });
      return [sectionRow, ...pageRows];
    }).join('');

    return `
      <div class="perm-wrapper">
        <div class="page-header">
          <div class="page-header-left">
            <h2>Responsibility Matrix</h2>
            <p>Atur hak akses setiap role terhadap halaman dan fitur aplikasi</p>
          </div>
          <div class="page-header-right">
            <button class="btn btn-outline" data-action="settings-reset" style="margin-right:8px">
              <i data-lucide="rotate-ccw"></i> Reset
            </button>
            <button class="btn btn-primary" data-action="settings-save">
              <i data-lucide="save"></i> Simpan
            </button>
          </div>
        </div>

        <div style="overflow-x:auto">
          <table class="perm-matrix">
            <thead>
              <tr>
                <th>Halaman / Fitur</th>
                ${headerRoleBadges}
              </tr>
            </thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>

        <div class="perm-legend">
          <span class="perm-legend-item"><span class="perm-legend-dot none"></span> None — Tidak bisa mengakses</span>
          <span class="perm-legend-item"><span class="perm-legend-dot read"></span> Read Only — Bisa melihat</span>
          <span class="perm-legend-item"><span class="perm-legend-dot full"></span> Full — Akses penuh</span>
        </div>
      </div>

      <div class="perm-special-card">
        <div class="page-header">
          <div class="page-header-left">
            <h2>Aksi Khusus</h2>
            <p>Pengaturan lanjutan untuk fitur tertentu dalam satu halaman</p>
          </div>
        </div>
        <div class="perm-special-body">
          <div class="perm-special-row">
            <div class="perm-special-label">
              <i data-lucide="folder-open" style="width:14px;height:14px;margin-right:6px;color:var(--blue-light)"></i>
              Audit Assignments — Buat/Edit Planning
            </div>
            <div class="perm-switch-group">
              ${SettingsPage._roles.map(r => {
                const val = Perms._getOverrides()[r.key]?.['cases:planning:write'] || false;
                const icons = { superadmin: '🔵', head: '🟣', auditor: '🟠', division: '⚪' };
                return `<label class="perm-switch-item">
                  <span style="font-size:11px">${icons[r.key] || ''} ${r.label}</span>
                  <span class="perm-switch">
                    <input type="checkbox" data-action="override-toggle" data-role="${r.key}" data-perm="cases:planning:write" ${val ? 'checked' : ''}>
                    <span class="slider"></span>
                  </span>
                </label>`;
              }).join('')}
            </div>
          </div>
          <div style="margin-top:8px;font-size:11px;color:var(--text-muted)">
            Jika ON, role tersebut bisa membuat dan mengubah Audit Planning.
            Jika OFF, hanya bisa mengisi temuan (Findings) dan tindak lanjut (AAP).
          </div>
        </div>
      </div>
    `;
  },

  afterRender() {
    document.querySelectorAll('.perm-btn-group').forEach(group => {
      group.addEventListener('click', (e) => {
        const label = e.target.closest('.perm-btn');
        if (!label) return;
        const radio = label.querySelector('input[type="radio"]');
        if (!radio) return;
        radio.checked = true;
        group.querySelectorAll('.perm-btn').forEach(l => l.classList.remove('selected'));
        label.classList.add('selected');
      });
    });

    document.querySelector('[data-action="settings-save"]')
      ?.addEventListener('click', () => SettingsPage._save());

    document.querySelector('[data-action="settings-reset"]')
      ?.addEventListener('click', () => SettingsPage._reset());
  },

  _collectMatrix() {
    const matrix = {};
    SettingsPage._roles.forEach(r => {
      matrix[r.key] = {};
      SettingsPage._sections.forEach(s => {
        s.pages.forEach(p => {
          const sel = document.querySelector(`input[name="perm_${r.key}_${p.key}"]:checked`);
          matrix[r.key][p.key] = sel ? sel.value : 'none';
        });
      });
    });
    return matrix;
  },

  _save() {
    const matrix = SettingsPage._collectMatrix();
    Perms._cache = matrix;
    Perms.save();

    document.querySelectorAll('[data-action="override-toggle"]').forEach(cb => {
      const role = cb.dataset.role;
      const permKey = cb.dataset.perm;
      if (!Perms._overrides[role]) Perms._overrides[role] = {};
      Perms._overrides[role][permKey] = cb.checked;
    });
    localStorage.setItem('ia_audit_permissions_overrides', JSON.stringify(Perms._overrides));

    Toast?.success('Pengaturan akses berhasil disimpan.');
    SettingsPage.render();
  },

  _reset() {
    Perms.reset();
    localStorage.removeItem('ia_audit_permissions_overrides');
    Toast?.success('Pengaturan akses dikembalikan ke default.');
    SettingsPage.render();
  },
};

window.SettingsPage = SettingsPage;
