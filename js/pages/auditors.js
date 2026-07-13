/* ============================================================
   AUDITOR MANAGEMENT PAGE
   ============================================================ */

const AuditorsPage = {
  activeDept: 'all',
  search: '',

  render() {
    if (!Auth.requireAuth()) return;
    Components.renderAppShell(
      'Auditor Management',
      'Internal Audit Division — Team Directory',
      AuditorsPage.buildHtml(),
      'auditors'
    );
    AuditorsPage._pageWired = false;
    AuditorsPage.afterRender();
  },

  buildHtml() {
    const auditors = DB.get('auditors');
    const depts    = DB.get('departments');
    const plannings = DB.get('audit_plannings');

    const filtered = auditors.filter(a => {
      if (AuditorsPage.activeDept !== 'all' && a.department !== AuditorsPage.activeDept) return false;
      if (AuditorsPage.search) {
        const q = AuditorsPage.search.toLowerCase();
        if (!a.name.toLowerCase().includes(q) && !(a.nik || '').includes(q)) return false;
      }
      return true;
    });

    // Stats per dept
    const deptStats = depts.map(d => ({
      dept: d,
      count: auditors.filter(a => a.department === d.id && a.status === 'active').length,
      cases: (() => {
        const deptAuditorIds = new Set(auditors.filter(a => a.department === d.id).map(a => a.id));
        return plannings.filter(p => deptAuditorIds.has(p.leadAuditor)).length;
      })()
    }));

    return `
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-header-left">
          <h2>Auditor Management</h2>
          <p>${auditors.filter(a=>a.status==='active').length} active auditors across 3 departments</p>
        </div>
        <div class="page-header-actions">
          ${Auth.isHead() ? `<button class="btn btn-primary" id="auditors-add-btn"><i data-lucide="user-plus"></i> Add Auditor</button>` : ''}
        </div>
      </div>

      <!-- Dept KPIs -->
      <div class="kpi-grid kpi-grid-3">
        ${deptStats.map((d,i) => `
          <div class="kpi-card ${['blue','green','purple'][i]}">
            <div class="kpi-label">${d.dept.name}</div>
            <div class="kpi-value">${d.count}</div>
            <div class="kpi-sub">${d.cases} cases assigned</div>
          </div>`).join('')}
      </div>

      <!-- Dept Tabs + Search -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-4)">
        <div class="dept-tabs">
          <div class="dept-tab ${AuditorsPage.activeDept==='all'?'active':''}" data-dept="all">All Departments</div>
          ${depts.map(d => `<div class="dept-tab ${AuditorsPage.activeDept===d.id?'active':''}" data-dept="${d.id}">${d.name}</div>`).join('')}
        </div>
        <div class="search-input-wrapper">
          <i data-lucide="search"></i>
          <input type="text" class="form-control search-input" id="auditors-search" placeholder="Search name, NIK…" value="${AuditorsPage.search}" style="min-width:200px" />
        </div>
      </div>

      <!-- Auditor Cards -->
      ${filtered.length === 0
        ? `<div class="empty-state"><i data-lucide="users"></i><p>No auditors found.</p></div>`
        : `<div class="auditor-grid">
            ${filtered.map(a => AuditorsPage.buildAuditorCard(a, plannings)).join('')}
           </div>`}`;
  },

  buildAuditorCard(a, plannings) {
    const assignedCases = plannings.filter(p => p.leadAuditor === a.id);
    const closedCases   = assignedCases.filter(p => p.status === 'Completed').length;
    const totalLoss     = assignedCases.reduce((sum, p) => {
      const results = DB.get('audit_results').filter(r => r.planningId === p.id);
      return sum + results.reduce((s, r) => s + (r.totalLoss || 0), 0);
    }, 0);
    const initials      = Utils.getInitials(a.name);
    const colors        = ['#3b82f6','#10b981','#a855f7','#f59e0b','#ef4444','#06b6d4'];
    const colorIdx      = a.name.charCodeAt(0) % colors.length;

    return `
      <div class="auditor-card" id="aud-card-${a.id}">
        <div class="auditor-actions">
          ${Auth.isHead() ? `
            <button class="btn btn-icon btn-secondary btn-sm" data-id="${a.id}" data-action="edit-auditor" title="Edit"><i data-lucide="pencil"></i></button>
            ${Auth.isSuperAdmin() ? `<button class="btn btn-icon btn-danger btn-sm" data-id="${a.id}" data-action="delete-auditor" title="Delete"><i data-lucide="trash-2"></i></button>` : ''}
          ` : ''}
        </div>
        <div class="auditor-avatar-large" style="background:linear-gradient(135deg,${colors[colorIdx]},${colors[(colorIdx+2)%colors.length]})">${initials}</div>
        <div class="card-name">${a.name}</div>
        <div class="card-title">${a.title}</div>
        <div class="card-dept"><span class="badge ${(()=>{const dn=Utils.getDeptName(a.department);return dn==='Store Audit'?'badge-blue':dn==='Corporate Audit'?'badge-green':'badge-purple'})()}" style="font-size:9px">${Utils.getDeptName(a.department)}</span></div>
        ${a.status === 'inactive' ? '<div style="text-align:center;margin-top:4px"><span class="badge badge-red">Inactive</span></div>' : ''}
        <div class="card-stats">
          <div class="auditor-stat">
            <div class="stat-val">${assignedCases.length}</div>
            <div class="stat-label">Cases</div>
          </div>
          <div class="auditor-stat">
            <div class="stat-val">${closedCases}</div>
            <div class="stat-label">Closed</div>
          </div>
          <div class="auditor-stat">
            <div class="stat-val">${Utils.formatIDR(totalLoss)}</div>
            <div class="stat-label">Loss Handled</div>
          </div>
        </div>
        <div style="margin-top:var(--space-3);font-size:10px;color:var(--text-muted)">
          NIK: ${a.nik} &nbsp;·&nbsp; Since ${a.joinDate ? a.joinDate.substring(0,4) : '-'}
        </div>
        <button class="btn btn-secondary w-full mt-2" style="font-size:11px;justify-content:center" data-id="${a.id}" data-action="view-auditor">
          <i data-lucide="eye"></i> View Profile
        </button>
      </div>`;
  },

  setDept(dept) { AuditorsPage.activeDept = dept; AuditorsPage.refresh(); },
  setSearch(v) { AuditorsPage.search = v; AuditorsPage.refresh(); },

  refresh() {
    Utils.updateElementHtmlAndPreserveFocus('page-content', AuditorsPage.buildHtml());
    AuditorsPage.afterRender();
    if (window.lucide) lucide.createIcons();
  },

  afterRender() {
    if (!AuditorsPage._pageWired) {
      AuditorsPage._pageWired = true;
      PageLifecycle.delegate('page-content', {
        click: {
          '[data-action="edit-auditor"]': (e, target) => { this.openEditModal(target.dataset.id); },
          '[data-action="delete-auditor"]': (e, target) => { this.deleteAuditor(target.dataset.id); },
          '[data-action="view-auditor"]': (e, target) => { this.viewAuditor(target.dataset.id); },
          '[data-dept]': (e, target) => { this.setDept(target.dataset.dept); },
          '#auditors-add-btn': () => this.openAddModal(),
        }
      });
    }
    PageLifecycle.on('auditors-search', 'input', (e) => this.setSearch(e.target.value));
    if (!AuditorsPage._modalWired) {
      AuditorsPage._modalWired = true;
      PageLifecycle.delegate('modal-overlay', {
        click: {
          '.modal-close-btn': () => Modal.close(),
          '[data-action="edit-from-view"]': (e, target) => {
            Modal.close();
            this.openEditModal(target.dataset.id);
          },
        }
      });
    }
  },

  viewAuditor(id) {
    const a = DB.find('auditors', id);
    if (!a) return;
    const cases = DB.get('audit_plannings').filter(p => p.leadAuditor === id);
    const closed = cases.filter(p => p.status === 'Completed').length;
    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="user"></i> ${a.name}</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div style="text-align:center;margin-bottom:var(--space-5)">
          <div class="auditor-avatar-large" style="margin:0 auto var(--space-3)">${Utils.getInitials(a.name)}</div>
          <div style="font-size:16px;font-weight:700;color:var(--text-primary)">${a.name}</div>
          <div style="font-size:12px;color:var(--text-muted)">${a.title}</div>
          <div style="margin-top:var(--space-2)"><span class="badge badge-blue">${a.department}</span> ${Utils.statusBadge(a.status)}</div>
        </div>
        <div class="detail-grid">
          <div class="detail-item"><div class="detail-label">NIK</div><div class="detail-value">${a.nik}</div></div>
          <div class="detail-item"><div class="detail-label">Join Date</div><div class="detail-value">${Utils.formatDate(a.joinDate)}</div></div>
          <div class="detail-item"><div class="detail-label">Email</div><div class="detail-value">${a.email||'-'}</div></div>
          <div class="detail-item"><div class="detail-label">Phone</div><div class="detail-value">${a.phone||'-'}</div></div>
        </div>
        <div class="divider"></div>
        <h4 style="font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:var(--space-3)">Case Statistics</h4>
        <div class="kpi-grid kpi-grid-3" style="gap:var(--space-3)">
          <div class="kpi-card blue" style="padding:var(--space-4)"><div class="kpi-label">Total Assigned</div><div class="kpi-value">${cases.length}</div></div>
          <div class="kpi-card green" style="padding:var(--space-4)"><div class="kpi-label">Closed</div><div class="kpi-value">${closed}</div></div>
          <div class="kpi-card amber" style="padding:var(--space-4)"><div class="kpi-label">Completion</div><div class="kpi-value">${Utils.pct(closed, cases.length)}%</div></div>
        </div>
        ${cases.length > 0 ? `
        <div class="divider"></div>
        <h4 style="font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:var(--space-3)">Recent Cases</h4>
        <div class="data-table-wrapper"><table class="data-table"><thead><tr><th>No. Laporan</th><th>Outlet</th><th>Total Loss</th><th>Status</th></tr></thead><tbody>
        ${cases.slice(0,5).map(p=>`<tr>
          <td class="col-bold">${p.reportNo}</td><td>${Utils.getOutletName(p.outletCode)||p.outletCode}</td>
          <td class="text-red">Rp ${Utils.formatIDR(DB.get('audit_results').filter(r=>r.planningId===p.id).reduce((s,r)=>s+(r.totalLoss||0),0))}</td><td>${Utils.statusBadge(p.status)}</td>
        </tr>`).join('')}
        </tbody></table></div>` : ''}
      </div>
      <div class="modal-footer">
        ${Auth.isHead() ? `<button class="btn btn-primary" data-action="edit-from-view" data-id="${a.id}"><i data-lucide="pencil"></i> Edit</button>` : ''}
        <button class="btn btn-secondary" data-action="modal-close">Close</button>
      </div>`, 'modal-lg');
    if (window.lucide) lucide.createIcons();
  },

  openAddModal() { AuditorsPage._openModal(null); },
  openEditModal(id) { AuditorsPage._openModal(DB.find('auditors', id)); },

  _openModal(a) {
    const isEdit = !!a;
    const users = DB.get('users');
    const depts = DB.get('departments');

    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="user-plus"></i> ${isEdit ? 'Edit' : 'Add New'} Auditor</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-grid form-grid-2">
          <div class="form-group">
            <label class="form-label required">Full Name</label>
            <input type="text" class="form-control" id="af-name" value="${Utils.escapeHtml(a?.name||'')}" />
          </div>
          <div class="form-group">
            <label class="form-label required">NIK (Employee ID)</label>
            <input type="text" class="form-control" id="af-nik" value="${Utils.escapeHtml(a?.nik||'')}" />
          </div>
          <div class="form-group">
            <label class="form-label required">Title / Position</label>
            <input type="text" class="form-control" id="af-title" value="${Utils.escapeHtml(a?.title||'')}" placeholder="e.g. Senior Auditor" />
          </div>
          <div class="form-group">
            <label class="form-label required">Department</label>
            <select class="form-control" id="af-dept">
              ${depts.map(d=>`<option value="${d.id}" ${a?.department===d.id?'selected':''}>${d.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" id="af-email" value="${Utils.escapeHtml(a?.email||'')}" />
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="text" class="form-control" id="af-phone" value="${Utils.escapeHtml(a?.phone||'')}" />
          </div>
          <div class="form-group">
            <label class="form-label">Join Date</label>
            <input type="date" class="form-control" id="af-join" value="${Utils.formatDateInput(a?.joinDate)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" id="af-status">
              <option value="active" ${a?.status==='active'?'selected':''}>Active</option>
              <option value="inactive" ${a?.status==='inactive'?'selected':''}>Inactive</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Linked User Account</label>
            <select class="form-control" id="af-user">
              <option value="">-- No linked account --</option>
              ${users.filter(u=>u.role==='auditor'||u.role==='head').map(u=>`<option value="${u.id}" ${a?.userId===u.id?'selected':''}>${u.username} (${u.name})</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="modal-close">Cancel</button>
        <button class="btn btn-primary" id="auditors-save-btn">
          <i data-lucide="save"></i> ${isEdit ? 'Update' : 'Save'}
        </button>
      </div>`, 'modal-md');
    if (window.lucide) lucide.createIcons();
    PageLifecycle.on('auditors-save-btn', 'click', () => AuditorsPage.saveAuditor(a?.id || ''));
  },

  saveAuditor(id) {
    const data = {
      name:     document.getElementById('af-name').value,
      nik:      document.getElementById('af-nik').value,
      title:    document.getElementById('af-title').value,
      department: document.getElementById('af-dept').value,
      email:    document.getElementById('af-email').value,
      phone:    document.getElementById('af-phone').value,
      joinDate: document.getElementById('af-join').value,
      status:   document.getElementById('af-status').value,
      userId:   document.getElementById('af-user').value || null,
    };
    if (!data.name || !data.nik || !data.title) { Toast.error('Fill required fields.'); return; }
    if (id) { DB.update('auditors', id, data); Toast.success('Auditor updated.'); }
    else     { DB.insert('auditors', data);    Toast.success('Auditor added.'); }
    Modal.close();
    AuditorsPage.refresh();
  },

  deleteAuditor(id) {
    const refs = DB.get('audit_plannings').filter(p => p.leadAuditor === id || (p.auditorTeam || []).includes(id)).length;
    if (refs > 0) {
      Toast.error(`Tidak dapat menghapus auditor: masih menjadi Lead/Team Auditor di ${refs} perencanaan audit. Hapus atau ubah referensi terlebih dahulu.`);
      return;
    }
    Modal.confirm('Delete Auditor', 'Are you sure you want to delete this auditor record?', () => {
      DB.delete('auditors', id);
      Toast.success('Auditor deleted.');
      AuditorsPage.refresh();
    });
  }
};

window.AuditorsPage = AuditorsPage;
