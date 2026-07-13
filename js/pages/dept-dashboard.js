/* ============================================================
   DEPARTMENT DASHBOARD — For non-audit division users
   Simplified: hanya AAP relevan untuk divisi, tanpa metric auditor
   ============================================================ */

const DeptDashboardPage = {
  selectedDept: '',

  render() {
    if (!Auth.requireAuth()) return;
    const isDiv = Auth.isDivision();

    if (isDiv) {
      const dept = Auth.getUserDepartment();
      if (!dept) {
        document.getElementById('app-root').innerHTML = '<div style="padding:40px;text-align:center"><h2>Anda tidak memiliki department yang terdaftar.</h2></div>';
        return;
      }
      DeptDashboardPage.selectedDept = dept;
    } else {
      const allDepts = DB.get('departments') || [];
      const nonAuditDepts = allDepts.filter(d => !['Store Audit', 'Corporate Audit', 'Business Process Improvement'].includes(d.name));
      if (!DeptDashboardPage.selectedDept) {
        DeptDashboardPage.selectedDept = nonAuditDepts.length > 0 ? nonAuditDepts[0].id : '';
      }
    }

    const dept = DeptDashboardPage.selectedDept;
    if (!dept) {
      document.getElementById('app-root').innerHTML = '<div style="padding:40px;text-align:center"><h2>Tidak ada departemen tersedia.</h2></div>';
      return;
    }
    Components.renderAppShell(
      'Dashboard Departemen',
      Utils.getDeptName(dept) + ' — Status Tindakan Perbaikan (AAP)',
      DeptDashboardPage.buildHtml(dept, isDiv),
      'dept-dashboard'
    );
    DeptDashboardPage._pageWired = false;
    DeptDashboardPage.afterRender();
  },

  changeDept(value) {
    DeptDashboardPage.selectedDept = value;
    DeptDashboardPage.render();
  },

  buildHtml(dept, isDiv) {
    const actions = DB.get('audit_actions').filter(a => a.picDepartment === dept);
    const openActions = actions.filter(a => a.status === 'Open');
    const closedActions = actions.filter(a => a.status === 'Closed');

    const totalOpen = openActions.length;
    const totalClosed = closedActions.length;
    const totalAll = actions.length;
    const overdue = openActions.filter(a => {
      if (!a.dueDate) return false;
      const dd = Utils.parseLocalDate(a.dueDate); return dd && dd < new Date();
    }).length;

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h2>Dashboard Departemen — ${Utils.getDeptName(dept)}</h2>
          <p>${isDiv ? 'Ringkasan Action Plan yang menjadi tanggung jawab divisi Anda.' : 'Pilih departemen untuk melihat status Action Plan.'}</p>
        </div>
        ${!isDiv ? `
        <div class="page-header-actions">
          <select class="form-control" id="dept-dashboard-select" style="min-width:200px">
            ${DB.get('departments').filter(d => !['Store Audit','Corporate Audit','Business Process Improvement'].includes(d.name)).map(d =>
              `<option value="${d.id}" ${DeptDashboardPage.selectedDept === d.id ? 'selected' : ''}>${d.name}</option>`
            ).join('')}
          </select>
        </div>` : ''}
      </div>

      <!-- KPI Cards (tanpa metric finansial auditor) -->
      <div class="kpi-grid kpi-grid-4">
        ${Components.kpiCard('Total AAP', totalAll, 'Semua AAP', 'clipboard-list', 'blue')}
        ${Components.kpiCard('Open', totalOpen, 'Belum selesai', 'clock', totalOpen > 0 ? 'amber' : 'green')}
        ${Components.kpiCard('Closed', totalClosed, 'Selesai', 'check-circle', 'green')}
        ${Components.kpiCard('Overdue', overdue, 'Melewati due date', 'alert-triangle', overdue > 0 ? 'red' : 'green')}
      </div>

      <!-- Outstanding AAPs -->
      <div class="card" style="margin-top:var(--space-5)">
        <div class="card-header">
          <div class="card-title"><i data-lucide="clock"></i> Outstanding AAP — Perlu Ditindaklanjuti ${openActions.length > 0 ? '<span class="badge badge-red" style="margin-left:8px">' + openActions.length + '</span>' : ''}</div>
          <input type="text" class="form-control" style="max-width:200px;font-size:11px" placeholder="Cari AAP..." id="dept-search" />
        </div>
        <div class="card-body" style="padding-top:0">
          ${openActions.length === 0
            ? '<div class="text-center text-muted" style="padding:32px">Semua AAP sudah selesai. Tidak ada yang perlu ditindaklanjuti.</div>'
            : `<div class="data-table-wrapper">
                <table class="data-table" id="dept-open-table">
                  <thead><tr>
                    <th>No. AAP</th>
                    <th>Judul Tindakan</th>
                    <th>PIC</th>
                    <th>Tenggat Waktu</th>
                    <th>Target (Rp)</th>
                    <th>Outstanding (Rp)</th>
                    <th>Status</th>
                  </tr></thead>
                  <tbody>
                    ${DeptDashboardPage._sortByDueDate(openActions).map(a => {
                      const overdueDate = Utils.parseLocalDate(a.dueDate); const isOverdue = overdueDate && overdueDate < new Date();
                      const amount = Number(a.amount) || 0;
                      const outstanding = amount - (Number(a.recovery) || 0) - (Number(a.unrecovered) || 0);
                      return `<tr>
                        <td class="col-mono" style="cursor:pointer;color:var(--blue-light);font-size:11px" data-action="view-planning" data-planning-id="${a.planningId}" data-tab="actions">${a.actionNo}</td>
                        <td style="max-width:220px;font-size:12px">${Utils.escapeHtml(a.actionTitle)}</td>
                        <td style="font-size:11px">${Utils.escapeHtml(a.picName)}</td>
                        <td style="font-size:11px;white-space:nowrap;${isOverdue ? 'color:#ef4444;font-weight:600' : ''}">
                          ${Utils.formatDate(a.dueDate)}
                          ${isOverdue ? '<span style="color:#ef4444;font-weight:700;margin-left:4px">⚠</span>' : ''}
                        </td>
                        <td style="font-size:11px;font-weight:600">Rp ${Utils.formatIDR(amount)}</td>
                        <td style="font-size:11px;font-weight:600;color:#f59e0b">Rp ${Utils.formatIDR(outstanding)}</td>
                        <td><span class="badge ${isOverdue ? 'badge-red' : 'badge-amber'}">${a.status}${isOverdue ? ' OVERDUE' : ''}</span></td>
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>`
          }
        </div>
      </div>

      <!-- Recent Closed AAPs -->
      <div class="card" style="margin-top:var(--space-4)">
        <div class="card-header">
          <div class="card-title"><i data-lucide="check-circle"></i> Riwayat AAP Terselesaikan (5 Terakhir)</div>
        </div>
        <div class="card-body" style="padding-top:0">
          ${closedActions.length === 0
            ? '<div class="text-center text-muted" style="padding:32px">Belum ada AAP yang selesai.</div>'
            : `<div class="data-table-wrapper">
                <table class="data-table">
                  <thead><tr>
                    <th>No. AAP</th>
                    <th>Judul Tindakan</th>
                    <th>PIC</th>
                    <th>Tgl Selesai</th>
                    <th>Target (Rp)</th>
                    <th>Recovery (Rp)</th>
                    <th>Unrec. (Rp)</th>
                    <th>Outstanding (Rp)</th>
                  </tr></thead>
                  <tbody>
                    ${DeptDashboardPage._sortByCompletionDate(closedActions).slice(0, 5).map(a => {
                      const amount = Number(a.amount) || 0;
                      const recovery = Number(a.recovery) || 0;
                      const unrecovered = Number(a.unrecovered) || 0;
                      const outstanding = amount - recovery - unrecovered;
                      return `<tr>
                      <td class="col-mono" style="cursor:pointer;color:var(--blue-light);font-size:11px" data-action="view-planning" data-planning-id="${a.planningId}" data-tab="actions">${a.actionNo}</td>
                      <td style="max-width:220px;font-size:12px">${Utils.escapeHtml(a.actionTitle)}</td>
                      <td style="font-size:11px">${Utils.escapeHtml(a.picName)}</td>
                      <td style="font-size:11px;white-space:nowrap">${Utils.formatDate(a.completionDate)}</td>
                      <td style="font-size:11px;font-weight:600">Rp ${Utils.formatIDR(amount)}</td>
                      <td style="font-size:11px;font-weight:600;color:#10b981">Rp ${Utils.formatIDR(recovery)}</td>
                      <td style="font-size:11px;font-weight:600;color:#a855f7">Rp ${Utils.formatIDR(unrecovered)}</td>
                      <td style="font-size:11px;font-weight:600;color:${outstanding > 0 ? '#f59e0b' : 'var(--text-muted)'}">Rp ${Utils.formatIDR(outstanding)}</td>
                    </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>`
          }
        </div>
      </div>
    `;
  },

  afterRender() {
    if (!DeptDashboardPage._pageWired) {
      DeptDashboardPage._pageWired = true;
      PageLifecycle.delegate('page-content', {
        click: {
          '[data-action="view-planning"]': (e, target) => {
            CasesPage?.viewPlanning?.(target.dataset.planningId, target.dataset.tab);
          }
        }
      });
    }
    PageLifecycle.on('dept-dashboard-select', 'change', (e) => this.changeDept(e.target.value));
    PageLifecycle.on('dept-search', 'input', () => this.filterTable());
  },

  filterTable() {
    const q = (document.getElementById('dept-search')?.value || '').toLowerCase();
    const rows = document.querySelectorAll('#dept-open-table tbody tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? '' : 'none';
    });
  },

  _sortByDueDate(actions) {
    return [...actions].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return (Utils.parseLocalDate(a.dueDate) || 0) - (Utils.parseLocalDate(b.dueDate) || 0);
    });
  },

  _sortByCompletionDate(actions) {
    return [...actions].sort((a, b) => {
      if (!a.completionDate) return 1;
      if (!b.completionDate) return -1;
      return (Utils.parseLocalDate(b.completionDate) || 0) - (Utils.parseLocalDate(a.completionDate) || 0);
    });
  }
};

window.DeptDashboardPage = DeptDashboardPage;
