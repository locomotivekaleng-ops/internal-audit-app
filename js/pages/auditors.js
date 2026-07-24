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
    const allDepts = DB.get('departments');
    const plannings = DB.get('audit_plannings');
    const depts    = allDepts.filter(d => auditors.some(a => a.department === d.id && a.status === 'active'));

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
          <p>${auditors.filter(a=>a.status==='active').length} active auditors across ${deptStats.length} departments</p>
        </div>
      </div>

      <!-- Dept KPIs -->
      <div class="kpi-grid kpi-grid-3">
        ${deptStats.map((d,i) => `
          <div class="kpi-card ${['blue','green','purple'][i]}">
            <div class="kpi-label">${Utils.escapeHtml(d.dept.name)}</div>
            <div class="kpi-value">${d.count}</div>
            <div class="kpi-sub">${d.cases} cases assigned</div>
          </div>`).join('')}
      </div>

      <!-- Dept Tabs + Search -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-4)">
        <div class="dept-tabs">
          <div class="dept-tab ${AuditorsPage.activeDept==='all'?'active':''}" data-dept="all">All Departments</div>
          ${depts.map(d => `<div class="dept-tab ${AuditorsPage.activeDept===d.id?'active':''}" data-dept="${d.id}">${Utils.escapeHtml(d.name)}</div>`).join('')}
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
        <div class="auditor-avatar-large" style="background:linear-gradient(135deg,${colors[colorIdx]},${colors[(colorIdx+2)%colors.length]})">${initials}</div>
        <div class="card-name">${Utils.escapeHtml(a.name)}</div>
        <div class="card-title">${Utils.escapeHtml(a.title)}</div>
        <div class="card-dept"><span class="badge ${(()=>{const dn=Utils.getDeptName(a.department);return dn==='Store Audit'?'badge-blue':dn==='Corporate Audit'?'badge-green':'badge-purple'})()}" style="font-size:9px">${Utils.escapeHtml(Utils.getDeptName(a.department))}</span></div>
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
          NIK: ${Utils.escapeHtml(a.nik)} &nbsp;·&nbsp; Since ${a.joinDate ? a.joinDate.substring(0,4) : '-'}
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
          '[data-action="view-auditor"]': (e, target) => { this.viewAuditor(target.dataset.id); },
          '[data-dept]': (e, target) => { this.setDept(target.dataset.dept); },
        }
      });
    }
    PageLifecycle.on('auditors-search', 'input', (e) => this.setSearch(e.target.value));
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
          <div style="font-size:16px;font-weight:700;color:var(--text-primary)">${Utils.escapeHtml(a.name)}</div>
          <div style="font-size:12px;color:var(--text-muted)">${Utils.escapeHtml(a.title)}</div>
          <div style="margin-top:var(--space-2)"><span class="badge badge-blue">${Utils.getDeptName(a.department)}</span> ${Utils.statusBadge(a.status)}</div>
        </div>
        <div class="detail-grid">
          <div class="detail-item"><div class="detail-label">NIK</div><div class="detail-value">${Utils.escapeHtml(a.nik)}</div></div>
          <div class="detail-item"><div class="detail-label">Join Date</div><div class="detail-value">${Utils.formatDate(a.joinDate)}</div></div>
          <div class="detail-item"><div class="detail-label">Email</div><div class="detail-value">${Utils.escapeHtml(a.email||'-')}</div></div>
          <div class="detail-item"><div class="detail-label">Phone</div><div class="detail-value">${Utils.escapeHtml(a.phone||'-')}</div></div>
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
          <td class="col-bold">${Utils.escapeHtml(p.reportNo)}</td><td>${Utils.escapeHtml(Utils.getOutletName(p.outletCode)||p.outletCode)}</td>
          <td class="text-red">Rp ${Utils.formatIDR(DB.get('audit_results').filter(r=>r.planningId===p.id).reduce((s,r)=>s+(r.totalLoss||0),0))}</td><td>${Utils.statusBadge(p.status)}</td>
        </tr>`).join('')}
        </tbody></table></div>` : ''}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="modal-close">Close</button>
      </div>`, 'modal-lg');
    if (window.lucide) lucide.createIcons();
  },
};

window.AuditorsPage = AuditorsPage;
