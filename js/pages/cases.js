/* ============================================================
   AUDIT ASSIGNMENTS — 3-Stage Relational Flow
   Stage 1: Audit Planning   (audit_plannings — Status Laporan: Plan / In Progress / Completed)
   Stage 2: Audit Results    (audit_results — findings per planning)
   Stage 3: Agreed Actions   (audit_actions — N actions per finding)

   AAP Amount  = target recovery amount
   Recovery    = amount actually recovered (when AAP Closed)
   Unrecovered = amount written off by management (cannot be collected)
   Outstanding = Amount - Recovery - Unrecovered
   Status Action Plan = 'Completed' when ALL actions closed, else 'In Progress'
   ============================================================ */

const CasesPage = {
  page: 1,
  perPage: 10,
  filters: { dateFrom: '', dateTo: '', department: '', brand: '', outlet: '', trigger: '', status: '', search: '' },
  sortKey: 'planningDate',
  sortDir: 'desc',

  // ============================================================
  // HELPERS — dynamic calculations
  // ============================================================
  _recoveryForResult(resultId) {
    return DB.get('audit_actions')
      .filter(a => a.resultId === resultId && a.status === 'Closed')
      .reduce((s, a) => s + (a.recovery || 0), 0);
  },

  _recoveryForPlanning(planningId) {
    return DB.get('audit_actions')
      .filter(a => a.planningId === planningId && a.status === 'Closed')
      .reduce((s, a) => s + (a.recovery || 0), 0);
  },

  _lossForPlanning(planningId) {
    return DB.get('audit_results')
      .filter(r => r.planningId === planningId)
      .reduce((s, r) => s + (r.totalLoss || 0), 0);
  },

  _actionPlanStatus(planningId) {
    return AuditMetrics.getActionPlanStatus(planningId);
  },

  // Auto-update Status Laporan based on data state
  // Plan → In Progress (when first finding added)
  // In Progress → Plan (if last finding removed)
  // Does NOT touch Completed or Cancelled status
  _autoUpdateLaporanStatus(planningId) {
    const p = DB.find('audit_plannings', planningId);
    if (!p || p.status === 'Completed' || p.status === 'Cancelled') return;
    const results = DB.get('audit_results').filter(r => r.planningId === planningId);
    if (results.length > 0 && p.status === 'Plan') {
      DB.update('audit_plannings', planningId, { status: 'In Progress' });
      AuditMetrics.syncPlanningRelationships(planningId, p.trigger, p.triggerRef, p.trigger, p.triggerRef);
    } else if (results.length === 0 && p.status === 'In Progress') {
      DB.update('audit_plannings', planningId, { status: 'Plan' });
      AuditMetrics.syncPlanningRelationships(planningId, p.trigger, p.triggerRef, p.trigger, p.triggerRef);
    }
  },

  // ======================= MAIN RENDER =======================
  render() {
    if (!Auth.requireAuth()) return;
    Components.renderAppShell(
      'Audit Assignments',
      'Manajemen Penugasan Audit — Planning, Execution & Monitoring',
      CasesPage.buildHtml(),
      'cases'
    );
    CasesPage._pageWired = false;
    CasesPage.afterRender();
  },

  buildHtml() {
    const all      = DB.get('audit_plannings');
    const results  = DB.get('audit_results');
    const actions  = DB.get('audit_actions');
    const filtered = CasesPage.applyFilters(all);
    const sorted   = Utils.sortBy(filtered, CasesPage.sortKey, CasesPage.sortDir);
    const paged    = sorted.slice((CasesPage.page - 1) * CasesPage.perPage, CasesPage.page * CasesPage.perPage);

    const brands   = DB.get('brands');
    const auditors = DB.get('auditors');
    const depts    = ['Store Audit', 'Corporate Audit', 'Business Process Improvement'];
    const triggers = ['WBS', 'FDS', 'Direct'];
    const statuses = ['Plan', 'In Progress', 'Completed', 'Cancelled'];

    // ---- KPI Summary (dynamic recovery from actions) ----
    const totalPlannings  = all.length;
    const totalResults    = results.length;
    const totalActions    = actions.length;
    const openActions     = actions.filter(a => a.status === 'Open').length;
    const closedActions   = actions.filter(a => a.status === 'Closed').length;
    const _metrics        = AuditMetrics.getGlobalMetrics(all);
    const totalLoss       = _metrics.totalLoss;
    const totalRecovery   = _metrics.totalRecovery;
    const totalUnrecovered = _metrics.totalUnrecovered;
    const totalOS         = Math.max(0, _metrics.outstandingLoss);
    const completedPlans  = all.filter(p => p.status === 'Completed').length;
    const inProgressPlans = all.filter(p => p.status === 'In Progress').length;

    return `
      <!-- KPI Strip -->
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr) repeat(2,1fr);margin-bottom:var(--space-5)">
        ${Components.kpiCard('Audit Plannings', totalPlannings, `${completedPlans} selesai · ${inProgressPlans} berjalan`, 'clipboard-list', 'blue')}
        ${Components.kpiCard('Total Findings', totalResults, 'Temuan audit terdokumentasi', 'alert-triangle', 'amber')}
        ${Components.kpiCard('Agreed Actions', totalActions, `${openActions} open · ${closedActions} closed`, 'check-square', openActions > 0 ? 'red' : 'green')}
        ${Components.kpiCard('Total Loss', 'Rp ' + Utils.formatIDR(totalLoss), `Target AAP Rp ${Utils.formatIDR(_metrics.totalAmountInAAP)}`, 'trending-down', 'red')}
        ${Components.kpiCard('Recovery', 'Rp ' + Utils.formatIDR(totalRecovery), `Unrecovered Rp ${Utils.formatIDR(totalUnrecovered)}`, 'trending-up', 'green')}
        ${Components.kpiCard('Outstanding (OS)', 'Rp ' + Utils.formatIDR(totalOS), 'Sisa yang belum terselesaikan', 'clock', totalOS > 0 ? 'amber' : 'green')}
      </div>

      <!-- Page Header -->
      <div class="page-header">
        <div class="page-header-left">
          <h2>Audit Plannings</h2>
          <p>${filtered.length} laporan audit ditemukan</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" data-action="export-csv">
            <i data-lucide="download"></i> Export CSV
          </button>
          ${Perms.can('cases:planning:write') ? `<button class="btn btn-primary" data-action="open-planning"><i data-lucide="plus"></i> New Planning</button>` : ''}
        </div>
      </div>

      <!-- Filters -->
      <div class="card" style="padding:var(--space-4) var(--space-5);margin-bottom:var(--space-4)">
        <div class="filter-bar" style="flex-wrap:wrap">
          <div class="search-input-wrapper">
            <i data-lucide="search"></i>
            <input type="text" class="form-control search-input" id="cases-search" style="min-width:180px" placeholder="Cari nomor laporan, outlet…"
              value="${CasesPage.filters.search}" />
          </div>
          <input type="date" class="form-control" id="cases-date-from" value="${CasesPage.filters.dateFrom}" title="Dari Tanggal" />
          <span style="color:var(--text-muted);font-size:12px">s/d</span>
          <input type="date" class="form-control" id="cases-date-to" value="${CasesPage.filters.dateTo}" title="Sampai Tanggal" />
          <select class="form-control" id="cases-trigger">
            <option value="">Semua Trigger</option>
            ${triggers.map(t => `<option value="${t}" ${CasesPage.filters.trigger === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
          <select class="form-control" id="cases-department">
            <option value="">Semua Dept</option>
            ${depts.map(d => `<option value="${d}" ${CasesPage.filters.department === d ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
          <select class="form-control" id="cases-brand">
            <option value="">Semua Brand</option>
            ${brands.map(b => `<option value="${b.id}" ${CasesPage.filters.brand === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
          </select>
          <select class="form-control" id="cases-outlet">
            <option value="">Semua Outlet</option>
            ${(() => {
              const brandFilter = CasesPage.filters.brand;
              const outletList = brandFilter ? DB.get('outlets').filter(o => o.brand === brandFilter) : DB.get('outlets');
              return outletList.map(o => `<option value="${o.code}" ${CasesPage.filters.outlet === o.code ? 'selected' : ''}>${o.code} — ${o.name}</option>`).join('');
            })()}
          </select>
          <select class="form-control" id="cases-status">
            <option value="">Semua Status</option>
            ${statuses.map(s => `<option value="${s}" ${CasesPage.filters.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <button class="btn btn-secondary btn-sm" data-action="reset-filters"><i data-lucide="rotate-ccw"></i></button>
        </div>
      </div>

      <!-- Planning Table -->
      <div class="card">
        <div class="card-body" style="padding:0">
          <div class="data-table-wrapper">
            ${DataTable.render({
              columns: [
                { key: 'reportNo', label: 'No. Laporan' },
                { key: 'planningDate', label: 'Tgl Planning' },
                { key: 'trigger', label: 'Trigger' },
                { key: 'outletCode', label: 'Outlet' },
                { key: 'brand', label: 'Brand' },
                { key: 'leadAuditor', label: 'Lead Auditor' },
                { key: 'findings', label: 'Findings', sortable: false },
                { key: 'actions', label: 'Actions', sortable: false },
                { key: 'status', label: 'Status Laporan' },
                { key: 'aapStatus', label: 'Status Action Plan', sortable: false },
                { key: 'aksi', label: 'Aksi', sortable: false },
              ],
              data: paged,
              sort: { key: CasesPage.sortKey, dir: CasesPage.sortDir, onChange: 'CasesPage.setSort' },
              emptyMessage: 'Tidak ada audit planning yang ditemukan.',
              buildRow: (p, index) => {
                const lead = auditors.find(a => a.id === p.leadAuditor);
                const pResults = results.filter(r => r.planningId === p.id);
                const pActions = actions.filter(a => a.planningId === p.id);
                const openAct  = pActions.filter(a => a.status === 'Open').length;
                const aapStatus = CasesPage._actionPlanStatus(p.id);
                return `<tr>
                  <td class="col-bold" style="font-size:12px">${Utils.escapeHtml(p.reportNo)}</td>
                  <td style="font-size:12px">${Utils.formatDate(p.planningDate)}</td>
                  <td><span class="badge ${p.trigger === 'WBS' ? 'badge-purple' : p.trigger === 'FDS' ? 'badge-cyan' : 'badge-gray'}">${Utils.escapeHtml(p.trigger)}</span></td>
                  <td style="font-size:11px"><span class="col-mono">${Utils.escapeHtml(p.outletCode || '')}</span> ${Utils.escapeHtml(p.outletName)}</td>
                  <td style="font-size:12px">${Utils.escapeHtml(p.brand)}</td>
                  <td style="font-size:12px">${lead ? Utils.escapeHtml(lead.name) : '-'}</td>
                  <td>
                    <span class="badge ${pResults.length > 0 ? 'badge-amber' : 'badge-gray'}" style="cursor:pointer" data-action="view-planning" data-id="${p.id}" data-tab="results">
                      ${pResults.length} temuan
                    </span>
                  </td>
                  <td>
                    <span class="badge ${openAct > 0 ? 'badge-red' : pActions.length > 0 ? 'badge-green' : 'badge-gray'}" style="cursor:pointer" data-action="view-planning" data-id="${p.id}" data-tab="actions">
                      ${openAct > 0 ? openAct + ' open' : pActions.length + ' done'}
                    </span>
                  </td>
                  <td>${Utils.laporanBadge(p.status)}</td>
                  <td>${Utils.aapStatusBadge(aapStatus)}</td>
                  <td>
                    <div class="flex gap-2">
                      <button class="btn btn-icon btn-secondary btn-sm" data-action="view-planning" data-id="${p.id}" data-tab="planning" title="Lihat Detail"><i data-lucide="eye"></i></button>
                      ${Perms.can('cases:planning:write') ? `<button class="btn btn-icon btn-secondary btn-sm" data-action="open-planning" data-id="${p.id}" title="Edit"><i data-lucide="pencil"></i></button>` : ''}
                      ${Perms.can('cases:planning:write') ? `<button class="btn btn-icon btn-danger btn-sm" data-action="delete-planning" data-id="${p.id}" title="Hapus"><i data-lucide="trash-2"></i></button>` : ''}
                    </div>
                  </td>
                </tr>`;
              },
            })}
          </div>
          <div class="pagination" id="cases-pagination"></div>
        </div>
      </div>`;
  },

  afterRender() {
    const all      = DB.get('audit_plannings');
    const filtered = CasesPage.applyFilters(all);
    Components.renderPagination('cases-pagination', CasesPage.page,
      Math.max(1, Math.ceil(filtered.length / CasesPage.perPage)),
      filtered.length,
      `CasesPage.page = page; CasesPage.refresh();`);
    if (!CasesPage._pageWired) {
      CasesPage._pageWired = true;
      PageLifecycle.delegate('page-content', {
        click: {
          '[data-action="dt-sort"]': (e, target) => CasesPage.setSort(target.dataset.key),
          '[data-action="export-csv"]': () => CasesPage.exportCsv(),
          '[data-action="open-planning"]': (e, target) => CasesPage.openPlanningModal(target.dataset.id || null),
          '[data-action="reset-filters"]': () => CasesPage.resetFilters(),
          '[data-action="view-planning"]': (e, target) => CasesPage.viewPlanning(target.dataset.id, target.dataset.tab),
          '[data-action="delete-planning"]': (e, target) => CasesPage.deletePlanning(target.dataset.id),
        },
      });
    }
    PageLifecycle.on('cases-search', 'input', (e) => CasesPage.setFilter('search', e.target.value));
    PageLifecycle.on('cases-date-from', 'change', (e) => CasesPage.setFilter('dateFrom', e.target.value));
    PageLifecycle.on('cases-date-to', 'change', (e) => CasesPage.setFilter('dateTo', e.target.value));
    PageLifecycle.on('cases-trigger', 'change', (e) => CasesPage.setFilter('trigger', e.target.value));
    PageLifecycle.on('cases-department', 'change', (e) => CasesPage.setFilter('department', e.target.value));
    PageLifecycle.on('cases-brand', 'change', (e) => CasesPage.setFilter('brand', e.target.value));
    PageLifecycle.on('cases-outlet', 'change', (e) => CasesPage.setFilter('outlet', e.target.value));
    PageLifecycle.on('cases-status', 'change', (e) => CasesPage.setFilter('status', e.target.value));
    if (!CasesPage._modalWired) {
      CasesPage._modalWired = true;
      PageLifecycle.delegate('modal-overlay', {
        click: {
          '[data-action="save-planning"]': (e, target) => CasesPage.savePlanning(target.dataset.id),
          '[data-action="save-result"]': (e, target) => CasesPage.saveResult(target.dataset.resultId, target.dataset.planningId),
          '[data-action="save-action"]': (e, target) => CasesPage.saveAction(target.dataset.actionId, target.dataset.resultId, target.dataset.planningId),
          '[data-action="kirim-laporan"]': (e, target) => CasesPage.kirimLaporan(target.dataset.id),
          '[data-action="switch-detail-tab"]': (e, target) => CasesPage._switchDetailTab(target.dataset.tab),
          '[data-action="open-result-modal"]': (e, target) => CasesPage.openResultModal(target.dataset.resultId || null, target.dataset.planningId),
          '[data-action="delete-result"]': (e, target) => CasesPage.deleteResult(target.dataset.resultId, target.dataset.planningId),
          '[data-action="open-action-modal"]': (e, target) => CasesPage.openActionModal(target.dataset.actionId || null, target.dataset.resultId, target.dataset.planningId),
          '[data-action="delete-action"]': (e, target) => CasesPage.deleteAction(target.dataset.actionId, target.dataset.resultId, target.dataset.planningId),
          '[data-action="edit-planning-from-view"]': (e, target) => { Modal.close(); CasesPage.openPlanningModal(target.dataset.id); },
          '[data-action="confirm-kirim-laporan"]': (e, target) => CasesPage._confirmKirimLaporan(target.dataset.id),
          '[data-action="toggle-trigger-ref"]': () => CasesPage._toggleTriggerRef(),
          '[data-action="update-wbs-desc"]': () => CasesPage._updateWbsDesc(),
          '[data-action="update-fds-desc"]': () => CasesPage._updateFdsDesc(),
          '[data-action="fill-outlets"]': () => CasesPage._fillOutlets(),
          '[data-action="toggle-recovery-field"]': () => CasesPage._toggleRecoveryField(),
        },
        change: {
          '[data-action="nature-change"]': (e, target) => CasesPage._onNatureChange(target.dataset.planningId, target.dataset.resultId),
          '#pf-outlet': (e, target) => {
            const code = target.value.split(' — ')[0].trim();
            const outlet = DB.get('outlets').find(o => o.code === code);
            if (outlet) {
              document.getElementById('pf-province').value = outlet.province || '';
              document.getElementById('pf-outlet-manager').value = outlet.outletManager || '';
              document.getElementById('pf-multi-unit-manager').value = outlet.multiUnitManager || '';
              document.getElementById('pf-area-manager').value = outlet.areaManager || '';
              document.getElementById('pf-distrik-manager').value = outlet.distrikManager || '';
            }
          },
        },
        input: {
          '[data-action="cases-format-num"]': (e, target) => Utils.formatNumberInput(target),
        }
      });
    }
    if (window.lucide) lucide.createIcons();
  },

  applyFilters(data) {
    const f = CasesPage.filters;
    return data.filter(p => {
      if (f.dateFrom && p.planningDate < f.dateFrom) return false;
      if (f.dateTo   && p.planningDate > f.dateTo)   return false;
      if (f.department && p.department !== f.department) return false;
      if (f.brand    && p.brand !== f.brand)    return false;
      if (f.outlet   && p.outletCode !== f.outlet) return false;
      if (f.trigger  && p.trigger !== f.trigger) return false;
      if (f.status   && p.status !== f.status)  return false;
      if (f.search) {
        const q = f.search.toLowerCase();
        if (!p.reportNo.toLowerCase().includes(q) &&
            !p.outletName.toLowerCase().includes(q) &&
            !(p.outletCode || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  },

  setFilter(k, v) { CasesPage.filters[k] = v; CasesPage.page = 1; CasesPage.refresh(); },
  resetFilters() {
    CasesPage.filters = { dateFrom: '', dateTo: '', department: '', brand: '', outlet: '', trigger: '', status: '', search: '' };
    CasesPage.page = 1; CasesPage.refresh();
  },
  setSort(k) {
    if (CasesPage.sortKey === k) CasesPage.sortDir = CasesPage.sortDir === 'asc' ? 'desc' : 'asc';
    else { CasesPage.sortKey = k; CasesPage.sortDir = 'desc'; }
    CasesPage.refresh();
  },
  refresh() {
    Utils.updateElementHtmlAndPreserveFocus('page-content', CasesPage.buildHtml());
    CasesPage.afterRender();
    if (window.lucide) lucide.createIcons();
  },

  // ======================= DETAIL VIEW =======================
  viewPlanning(id, tab = 'planning') {
    const p = DB.find('audit_plannings', id);
    if (!p) return;
    const auditors = DB.get('auditors');
    const results  = DB.get('audit_results').filter(r => r.planningId === id);
    const actions  = DB.get('audit_actions').filter(a => a.planningId === id);
    const lead     = auditors.find(a => a.id === p.leadAuditor);
    const team     = (p.auditorTeam || []).map(tid => auditors.find(a => a.id === tid)?.name || tid).join(', ');

    // Dynamic financial summary (via AuditMetrics)
    const metrics       = AuditMetrics.getPlanningMetrics(id);
    const totalLoss     = metrics.totalLoss;
    const totalAmountInAAP = metrics.totalAmountInAAP;
    const totalRecovery = metrics.totalRecovery;
    const totalUnrecovered = metrics.totalUnrecovered;
    const totalOS       = Math.max(0, metrics.outstandingLoss);
    const openActions   = actions.filter(a => a.status === 'Open').length;
    const aapStatus     = CasesPage._actionPlanStatus(id);

    // Trigger info
    let triggerHtml = '';
    if (p.trigger === 'WBS' && p.triggerRef) {
      const wbs = DB.find('wbs_cases', p.triggerRef);
      if (wbs) triggerHtml = `<div class="detail-item"><div class="detail-label">WBS Case</div><div class="detail-value col-bold">${wbs.caseNo} — ${wbs.category}</div></div>`;
    } else if (p.trigger === 'FDS' && p.triggerRef) {
      const fds = DB.find('fds_cases', p.triggerRef);
      if (fds) triggerHtml = `<div class="detail-item"><div class="detail-label">FDS Case</div><div class="detail-value col-bold">${fds.caseNo} — ${fds.category}</div></div>`;
    }

    // "Kirim Laporan" button:
    // - Visible only when status=In Progress AND (no findings OR (findings exist and at least one AAP exists))
    // - Shows date input for "Tanggal Kirim ke Auditee"
    const canSendReport = (Auth.isAuditor() || Auth.isHead()) && p.status === 'In Progress' && (results.length === 0 || actions.length > 0);
    const cannotSendReason = p.status === 'In Progress' && results.length > 0 && actions.length === 0
      ? `<div style="margin-top:var(--space-3);display:inline-flex;align-items:center;gap:6px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);padding:8px 14px;border-radius:6px;font-size:12px;color:#f59e0b">
           <i data-lucide="alert-circle" style="width:14px;height:14px"></i>
           Tambahkan Agreed Action Plan terlebih dahulu sebelum mengirim laporan karena terdapat Temuan Audit.
         </div>` : '';
    const sendReportBtn = canSendReport
      ? `<button class="btn btn-primary btn-sm" data-action="kirim-laporan" data-id="${p.id}" style="margin-top:var(--space-3)">
           <i data-lucide="send" style="width:14px;height:14px"></i> Kirim Laporan ke Auditee
         </button>`
      : p.status === 'Completed'
        ? `<div style="margin-top:var(--space-3);display:inline-flex;align-items:center;gap:6px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);padding:8px 14px;border-radius:6px;font-size:12px;color:#10b981">
             <i data-lucide="check-circle" style="width:14px;height:14px"></i>
             Laporan dikirim ke Auditee${p.reportSentDate ? ' pada <strong>' + Utils.formatDate(p.reportSentDate) + '</strong>' : ''}
           </div>`
        : cannotSendReason;

    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="clipboard-list"></i> ${p.reportNo}</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body" style="padding-top:var(--space-2)">
        <!-- Stage tabs -->
        <div class="modal-tabs">
          <button class="modal-tab ${tab === 'planning' ? 'active' : ''}" id="dtab-planning" data-action="switch-detail-tab" data-tab="planning">
            <i data-lucide="clipboard" style="width:14px;height:14px"></i> 1. Audit Planning
          </button>
          <button class="modal-tab ${tab === 'results' ? 'active' : ''}" id="dtab-results" data-action="switch-detail-tab" data-tab="results">
            <i data-lucide="alert-triangle" style="width:14px;height:14px"></i> 2. Audit Results
            <span class="badge badge-amber" style="margin-left:4px;font-size:9px">${results.length}</span>
          </button>
          <button class="modal-tab ${tab === 'actions' ? 'active' : ''}" id="dtab-actions" data-action="switch-detail-tab" data-tab="actions">
            <i data-lucide="check-square" style="width:14px;height:14px"></i> 3. Agreed Actions
            <span class="badge ${openActions > 0 ? 'badge-red' : 'badge-green'}" style="margin-left:4px;font-size:9px">${openActions > 0 ? openActions + ' open' : actions.length}</span>
          </button>
        </div>

        <!-- Tab: Planning -->
        <div id="dsec-planning" class="modal-section" style="${tab !== 'planning' ? 'display:none' : ''}">
          <div class="detail-grid" style="margin-bottom:var(--space-3)">
            <div class="detail-item"><div class="detail-label">Nomor Laporan</div><div class="detail-value col-bold" style="font-size:15px">${p.reportNo}</div></div>
            <div class="detail-item"><div class="detail-label">Tanggal Planning</div><div class="detail-value">${Utils.formatDate(p.planningDate)}</div></div>
            <div class="detail-item"><div class="detail-label">Periode Audit</div><div class="detail-value">${Utils.formatDate(p.auditDateFrom)} → ${Utils.formatDate(p.auditDateTo)}</div></div>
            <div class="detail-item"><div class="detail-label">Trigger</div><div class="detail-value"><span class="badge ${p.trigger === 'WBS' ? 'badge-purple' : p.trigger === 'FDS' ? 'badge-cyan' : 'badge-gray'}">${p.trigger}</span></div></div>
            ${triggerHtml}
            <div class="detail-item"><div class="detail-label">Outlet</div><div class="detail-value"><span class="col-mono">${p.outletCode}</span> ${p.outletName}</div></div>
            <div class="detail-item"><div class="detail-label">Brand</div><div class="detail-value">${p.brand}</div></div>
            <div class="detail-item"><div class="detail-label">Provinsi</div><div class="detail-value">${p.province}</div></div>
            <div class="detail-item"><div class="detail-label">Outlet Manager</div><div class="detail-value">${p.outletManager || '-'}</div></div>
            <div class="detail-item"><div class="detail-label">Multi Unit Manager</div><div class="detail-value">${p.multiUnitManager || '-'}</div></div>
            <div class="detail-item"><div class="detail-label">Area Manager</div><div class="detail-value">${p.areaManager || '-'}</div></div>
            <div class="detail-item"><div class="detail-label">Distrik Manager</div><div class="detail-value">${p.distrikManager || '-'}</div></div>
            <div class="detail-item"><div class="detail-label">Departemen</div><div class="detail-value">${p.department || '-'}</div></div>
            <div class="detail-item"><div class="detail-label">Tipe Audit</div><div class="detail-value">${Utils.statusBadge(p.auditType)}</div></div>
            <div class="detail-item"><div class="detail-label">Lead Auditor</div><div class="detail-value">${lead ? lead.name : '-'}</div></div>
            <div class="detail-item"><div class="detail-label">Tim Auditor</div><div class="detail-value">${team || '-'}</div></div>
            <div class="detail-item"><div class="detail-label">Status Laporan</div><div class="detail-value">${Utils.laporanBadge(p.status)}</div></div>
            <div class="detail-item"><div class="detail-label">Status Action Plan</div><div class="detail-value">${Utils.aapStatusBadge(aapStatus)}</div></div>
            ${p.reportSentDate ? `<div class="detail-item"><div class="detail-label">Tgl Kirim ke Auditee</div><div class="detail-value" style="font-weight:600;color:#10b981">${Utils.formatDate(p.reportSentDate)}</div></div>` : ''}
          </div>
          <div class="form-group">
            <div class="detail-label">Scope Pemeriksaan</div>
            <div style="font-size:13px;color:var(--text-secondary);background:rgba(255,255,255,0.02);padding:12px;border-radius:6px;border:1px solid var(--border-color);margin-top:4px">${Utils.escapeHtml(p.scope || '-')}</div>
          </div>
          ${results.length > 0 ? `
            <div style="margin-top:var(--space-4);display:flex;gap:var(--space-3)">
              <div style="flex:1;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.15);border-radius:8px;padding:12px;text-align:center">
                <div style="font-size:11px;color:var(--text-muted)">Total Loss</div>
                <div style="font-size:16px;font-weight:700;color:#ef4444">Rp ${Utils.formatIDR(totalLoss)}</div>
              </div>
              <div style="flex:1;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.15);border-radius:8px;padding:12px;text-align:center">
                <div style="font-size:11px;color:var(--text-muted)">Target AAP Amount</div>
                <div style="font-size:16px;font-weight:700;color:var(--blue-light)">Rp ${Utils.formatIDR(totalAmountInAAP)}</div>
              </div>
              <div style="flex:1;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.15);border-radius:8px;padding:12px;text-align:center">
                <div style="font-size:11px;color:var(--text-muted)">Total Recovery</div>
                <div style="font-size:16px;font-weight:700;color:#10b981">Rp ${Utils.formatIDR(totalRecovery)}</div>
              </div>
              <div style="flex:1;background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.15);border-radius:8px;padding:12px;text-align:center">
                <div style="font-size:11px;color:var(--text-muted)">Total Unrecovered</div>
                <div style="font-size:16px;font-weight:700;color:#a855f7">Rp ${Utils.formatIDR(totalUnrecovered)}</div>
              </div>
              <div style="flex:1;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.15);border-radius:8px;padding:12px;text-align:center">
                <div style="font-size:11px;color:var(--text-muted)">Outstanding (OS)</div>
                <div style="font-size:16px;font-weight:700;color:#f59e0b">Rp ${Utils.formatIDR(totalOS)}</div>
              </div>
            </div>` : `
            <div style="margin-top:var(--space-4);text-align:center;padding:16px;border:1px dashed var(--border-color);border-radius:8px;color:var(--text-muted)">
              Belum ada hasil audit. Klik tab "2. Audit Results" untuk menambahkan temuan.
            </div>`}
          <div>${sendReportBtn}</div>
        </div>

        <!-- Tab: Audit Results (Findings) -->
        <div id="dsec-results" class="modal-section" style="${tab !== 'results' ? 'display:none' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-3)">
            <h4 style="font-size:13px;font-weight:700;color:var(--text-primary);margin:0">Temuan Audit — ${p.reportNo}</h4>
            ${Auth.isAuditor() || Auth.isHead() ? `<button class="btn btn-primary btn-sm" data-action="open-result-modal" data-planning-id="${p.id}"><i data-lucide="plus"></i> Tambah Temuan</button>` : ''}
          </div>
          ${results.length === 0
            ? `<div style="text-align:center;padding:32px;border:1px dashed var(--border-color);border-radius:8px;color:var(--text-muted)">Belum ada temuan audit untuk laporan ini.</div>`
            : results.map(r => {
                const rActions  = DB.get('audit_actions').filter(a => a.resultId === r.id);
                const fMetrics  = AuditMetrics.getFindingMetrics(r.id);
                const rRecovery = fMetrics.totalRecovery;
                const rOS       = Math.max(0, fMetrics.outstandingLoss);
                const rOpenAct  = rActions.filter(a => a.status === 'Open').length;
                return `
                <div style="border:1px solid var(--border-color);border-radius:8px;padding:var(--space-4);margin-bottom:var(--space-3);background:rgba(255,255,255,0.02)">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-3)">
                    <div>
                      <span class="col-mono" style="font-size:11px;color:var(--text-muted)">${r.findingNo}</span>
                      ${r.nature === 'Administrative'
                        ? `<span style="font-size:10px;font-weight:700;color:#3b82f6;background:rgba(59,130,246,0.12);padding:2px 7px;border-radius:4px;margin-left:6px;letter-spacing:0.5px">ADMIN</span>`
                        : `<span style="font-size:10px;font-weight:700;color:#ef4444;background:rgba(239,68,68,0.12);padding:2px 7px;border-radius:4px;margin-left:6px;letter-spacing:0.5px">FRAUD</span>`}
                      <h5 style="font-size:14px;font-weight:700;color:var(--text-primary);margin:4px 0">${Utils.escapeHtml(r.findingTitle)}</h5>
                      <div style="display:flex;gap:8px;align-items:center">
                        ${Utils.statusBadge(r.severity)}
                        ${Utils.statusBadge(r.category)}
                        <span style="font-size:11px;color:var(--text-muted)">${Utils.formatDate(r.findingDate)}</span>
                      </div>
                    </div>
                    <div style="display:flex;gap:6px">
                      ${Auth.isAuditor() || Auth.isHead() ? `<button class="btn btn-icon btn-secondary btn-sm" data-action="open-result-modal" data-result-id="${r.id}" data-planning-id="${p.id}" title="Edit"><i data-lucide="pencil"></i></button>` : ''}
                      ${Auth.isHead() ? `<button class="btn btn-icon btn-danger btn-sm" data-action="delete-result" data-result-id="${r.id}" data-planning-id="${p.id}" title="Hapus"><i data-lucide="trash-2"></i></button>` : ''}
                    </div>
                  </div>
                  <p style="font-size:12px;color:var(--text-secondary);margin-bottom:var(--space-3)">${Utils.escapeHtml(r.description || '')}</p>
                  ${r.nature === 'Fraud' && (r.fraudsterName || r.fraudsterNik || r.fraudsterPosition) ? `
                  <div style="padding:10px 12px;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);border-radius:8px;margin-bottom:var(--space-3);font-size:12px">
                    <div style="font-weight:700;color:#ef4444;font-size:11px;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px"><i data-lucide="user-x" style="width:11px;height:11px;display:inline;margin-right:3px"></i> Informasi Fraudster</div>
                    <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:12px">
                      ${r.fraudsterName ? `<span style="color:var(--text-muted)">Nama:</span><span style="color:var(--text-primary);font-weight:500">${Utils.escapeHtml(r.fraudsterName)}</span>` : ''}
                      ${r.fraudsterNik ? `<span style="color:var(--text-muted)">No Induk Karyawan:</span><span style="color:var(--text-primary)">${Utils.escapeHtml(r.fraudsterNik)}</span>` : ''}
                      ${r.fraudsterPosition ? `<span style="color:var(--text-muted)">Jabatan:</span><span style="color:var(--text-primary);font-weight:500">${Utils.escapeHtml(r.fraudsterPosition)}</span>` : ''}
                    </div>
                  </div>` : ''}
                  ${r.nature === 'Administrative'
                    ? `<div style="padding:10px 12px;background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.2);border-radius:8px;margin-bottom:var(--space-3);font-size:12px;color:var(--text-muted)">
                        <i data-lucide="info" style="width:12px;height:12px;display:inline;margin-right:4px;color:#3b82f6"></i>
                        Temuan <strong>Administratif</strong> — tidak memiliki nilai kerugian finansial. Recovery tidak berlaku.
                      </div>`
                    : `<div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-3)">
                      <div style="flex:1;text-align:center;padding:8px;background:rgba(239,68,68,0.08);border-radius:6px">
                        <div style="font-size:10px;color:var(--text-muted)">Total Loss</div>
                        <div style="font-size:13px;font-weight:700;color:#ef4444">Rp ${Utils.formatIDR(r.totalLoss)}</div>
                      </div>
                      <div style="flex:1;text-align:center;padding:8px;background:rgba(59,130,246,0.08);border-radius:6px">
                        <div style="font-size:10px;color:var(--text-muted)">Target AAP Amount</div>
                        <div style="font-size:13px;font-weight:700;color:var(--blue-light)">Rp ${Utils.formatIDR(fMetrics.totalAmountInAAP)}</div>
                      </div>
                      <div style="flex:1;text-align:center;padding:8px;background:rgba(16,185,129,0.08);border-radius:6px">
                        <div style="font-size:10px;color:var(--text-muted)">Recovery (dari AAP)</div>
                        <div style="font-size:13px;font-weight:700;color:#10b981">Rp ${Utils.formatIDR(rRecovery)}</div>
                      </div>
                      <div style="flex:1;text-align:center;padding:8px;background:rgba(168,85,247,0.08);border-radius:6px">
                        <div style="font-size:10px;color:var(--text-muted)">Unrecovered</div>
                        <div style="font-size:13px;font-weight:700;color:#a855f7">Rp ${Utils.formatIDR(fMetrics.totalUnrecovered)}</div>
                      </div>
                      <div style="flex:1;text-align:center;padding:8px;background:rgba(245,158,11,0.08);border-radius:6px">
                        <div style="font-size:10px;color:var(--text-muted)">Outstanding (OS)</div>
                        <div style="font-size:13px;font-weight:700;color:#f59e0b">Rp ${Utils.formatIDR(rOS)}</div>
                      </div>
                    </div>`}
                  <!-- Sub-actions for this finding -->
                  <div style="border-top:1px solid var(--border-color);padding-top:var(--space-3)">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                      <span style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Agreed Action Plans (${rActions.length})</span>
                      ${Auth.isAuditor() || Auth.isHead() ? `<button class="btn btn-secondary btn-sm" style="font-size:10px" data-action="open-action-modal" data-result-id="${r.id}" data-planning-id="${p.id}"><i data-lucide="plus"></i> Add Action</button>` : ''}
                    </div>
                    ${rActions.length === 0
                      ? `<p style="font-size:11px;color:var(--text-muted);margin:0">Belum ada rencana tindakan perbaikan.</p>`
                      : rActions.map(a => {
                          const isOverdue = a.status === 'Open' && a.dueDate && a.dueDate < new Date().toISOString().split('T')[0];
                          const actMetrics = AuditMetrics.getActionMetrics(a);
                          return `
                          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:6px;background:rgba(255,255,255,0.03);margin-bottom:4px;border:1px solid var(--border-color)">
                            <div style="flex:1">
                              <div style="font-size:11px;font-weight:600;color:var(--text-primary)">${a.actionNo} — ${Utils.escapeHtml(a.actionTitle)}</div>
                              <div style="font-size:10px;color:var(--text-muted);margin-top:2px">
                                 PIC: ${a.picName} · Dept: ${a.picDepartment || '-'} · Due: ${Utils.formatDate(a.dueDate)} ${isOverdue ? '<span style="color:#ef4444">⚠ OVERDUE</span>' : ''} · Target: Rp ${Utils.formatIDR(actMetrics.amount)}
                              </div>
                              ${a.status === 'Closed' && r.nature !== 'Administrative' ? `<div style="font-size:10px;color:var(--text-muted);margin-top:2px">Recovery: <span style="color:#10b981;font-weight:600">Rp ${Utils.formatIDR(actMetrics.recovery)}</span> · Unrecovered: <span style="color:#a855f7;font-weight:600">Rp ${Utils.formatIDR(actMetrics.unrecovered)}</span> · OS: Rp ${Utils.formatIDR(actMetrics.outstanding)}</div>` : ''}
                            </div>
                            <div style="display:flex;gap:6px;align-items:center">
                              <span class="badge ${a.status === 'Closed' ? 'badge-green' : isOverdue ? 'badge-red' : 'badge-amber'}">${a.status}${isOverdue ? ' ⚠' : ''}</span>
                              ${Auth.isAuditor() || Auth.isHead() ? `<button class="btn btn-icon btn-secondary btn-sm" data-action="open-action-modal" data-action-id="${a.id}" data-result-id="${r.id}" data-planning-id="${p.id}" title="Edit"><i data-lucide="pencil"></i></button>` : ''}
                              ${Auth.isHead() ? `<button class="btn btn-icon btn-danger btn-sm" data-action="delete-action" data-action-id="${a.id}" data-result-id="${r.id}" data-planning-id="${p.id}" title="Hapus"><i data-lucide="trash-2"></i></button>` : ''}
                            </div>
                          </div>`;
                        }).join('')}
                  </div>
                </div>`;
              }).join('')}
          <!-- Financial summary -->
          ${results.length > 0 ? `
          <div style="border-top:2px solid var(--border-color);padding-top:var(--space-3);margin-top:var(--space-2);display:flex;gap:var(--space-3)">
            <div style="flex:1;background:rgba(239,68,68,0.08);border-radius:6px;padding:10px;text-align:center">
              <div style="font-size:10px;color:var(--text-muted)">TOTAL LOSS</div>
              <div style="font-weight:700;color:#ef4444">Rp ${Utils.formatIDR(totalLoss)}</div>
            </div>
            <div style="flex:1;background:rgba(59,130,246,0.08);border-radius:6px;padding:10px;text-align:center">
              <div style="font-size:10px;color:var(--text-muted)">TOTAL TARGET AAP</div>
              <div style="font-weight:700;color:var(--blue-light)">Rp ${Utils.formatIDR(totalAmountInAAP)}</div>
            </div>
            <div style="flex:1;background:rgba(16,185,129,0.08);border-radius:6px;padding:10px;text-align:center">
              <div style="font-size:10px;color:var(--text-muted)">TOTAL RECOVERY</div>
              <div style="font-weight:700;color:#10b981">Rp ${Utils.formatIDR(totalRecovery)}</div>
            </div>
            <div style="flex:1;background:rgba(168,85,247,0.08);border-radius:6px;padding:10px;text-align:center">
              <div style="font-size:10px;color:var(--text-muted)">TOTAL UNRECOVERED</div>
              <div style="font-weight:700;color:#a855f7">Rp ${Utils.formatIDR(totalUnrecovered)}</div>
            </div>
            <div style="flex:1;background:rgba(245,158,11,0.08);border-radius:6px;padding:10px;text-align:center">
              <div style="font-size:10px;color:var(--text-muted)">OUTSTANDING</div>
              <div style="font-weight:700;color:#f59e0b">Rp ${Utils.formatIDR(totalOS)}</div>
            </div>
          </div>` : ''}
        </div>

        <!-- Tab: Agreed Actions Summary -->
        <div id="dsec-actions" class="modal-section" style="${tab !== 'actions' ? 'display:none' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-3)">
            <h4 style="font-size:13px;font-weight:700;color:var(--text-primary);margin:0">Monitoring Agreed Action Plans — ${p.reportNo}</h4>
          </div>
          ${actions.length === 0
            ? `<div style="text-align:center;padding:32px;border:1px dashed var(--border-color);border-radius:8px;color:var(--text-muted)">Belum ada agreed action untuk laporan ini. Tambahkan dari tab "Audit Results".</div>`
            : `<div class="data-table-wrapper" style="max-height:420px;overflow-y:auto">
                <table class="data-table">
                  <thead><tr>
                    <th>No. AAP</th>
                    <th>Finding</th>
                    <th>Tindakan</th>
                    <th>PIC</th>
                    <th>Dept</th>
                    <th>Target Amount (Rp)</th>
                    <th>Due Date</th>
                    <th>Tgl Selesai</th>
                    <th>Recovery (Rp)</th>
                    <th>Unrecovered (Rp)</th>
                    <th>Outstanding (Rp)</th>
                    <th>Status / Aging</th>
                    <th>Aksi</th>
                  </tr></thead>
                  <tbody>
                    ${actions.map(a => {
                      const findingResult = results.find(r => r.id === a.resultId);
                      const actMetrics = AuditMetrics.getActionMetrics(a);
                      const daysOverdue = AuditMetrics.getDaysOverdue(a);
                      const agingBucket = AuditMetrics.getAgingBucket(a);
                      const isOverdue = a.status === 'Open' && daysOverdue > 0;
                      return `<tr>
                        <td class="col-mono" style="font-size:11px">${a.actionNo}</td>
                        <td style="font-size:11px;color:var(--text-muted)">${findingResult ? findingResult.findingNo : '-'}</td>
                        <td style="font-size:12px;max-width:200px">${Utils.escapeHtml(a.actionTitle)}</td>
                        <td style="font-size:11px">${a.picName}</td>
                        <td style="font-size:11px;color:var(--text-muted)">${a.picDepartment || '-'}</td>
                        <td style="font-size:11px;font-weight:600">Rp ${Utils.formatIDR(actMetrics.amount)}</td>
                        <td style="font-size:11px${isOverdue ? ';color:#ef4444;font-weight:600' : ''}">${Utils.formatDate(a.dueDate)}${isOverdue ? ' ⚠' : ''}</td>
                        <td style="font-size:11px">${a.completionDate ? Utils.formatDate(a.completionDate) : '-'}</td>
                        <td style="font-size:11px;font-weight:600;color:${a.status === 'Closed' && actMetrics.recovery > 0 ? '#10b981' : 'var(--text-muted)'}">
                          ${a.status === 'Closed' ? 'Rp ' + Utils.formatIDR(actMetrics.recovery) : '-'}
                        </td>
                        <td style="font-size:11px;font-weight:600;color:${a.status === 'Closed' && actMetrics.unrecovered > 0 ? '#a855f7' : 'var(--text-muted)'}">
                          ${a.status === 'Closed' ? 'Rp ' + Utils.formatIDR(actMetrics.unrecovered) : '-'}
                        </td>
                        <td style="font-size:11px;font-weight:600;color:${actMetrics.outstanding > 0 ? '#f59e0b' : 'var(--text-muted)'}">
                          Rp ${Utils.formatIDR(actMetrics.outstanding)}
                        </td>
                        <td>
                          <span class="badge ${a.status === 'Closed' ? 'badge-green' : isOverdue ? 'badge-red' : 'badge-amber'}">${a.status}${isOverdue ? ' ⚠' : ''}</span>
                          ${a.status === 'Open' ? `<span style="font-size:10px;display:block;color:var(--text-muted);margin-top:2px">${agingBucket} ${daysOverdue > 0 ? `(${daysOverdue} hari)` : ''}</span>` : ''}
                        </td>
                        <td>
                          <div class="flex gap-2">
                            ${Auth.isAuditor() || Auth.isHead() ? `<button class="btn btn-icon btn-secondary btn-sm" data-action="open-action-modal" data-action-id="${a.id}" data-result-id="${a.resultId}" data-planning-id="${p.id}" title="Edit"><i data-lucide="pencil"></i></button>` : ''}
                            ${Auth.isHead() ? `<button class="btn btn-icon btn-danger btn-sm" data-action="delete-action" data-action-id="${a.id}" data-result-id="${a.resultId}" data-planning-id="${p.id}" title="Hapus"><i data-lucide="trash-2"></i></button>` : ''}
                          </div>
                        </td>
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>
              <div style="margin-top:var(--space-3);display:flex;gap:12px;flex-wrap:wrap">
                <div style="background:rgba(16,185,129,0.1);border-radius:6px;padding:8px 12px;font-size:12px"><span style="color:var(--text-muted)">Closed:</span> <strong style="color:#10b981">${actions.filter(a => a.status === 'Closed').length}</strong></div>
                <div style="background:rgba(245,158,11,0.1);border-radius:6px;padding:8px 12px;font-size:12px"><span style="color:var(--text-muted)">Open:</span> <strong style="color:#f59e0b">${openActions}</strong></div>
                <div style="background:rgba(239,68,68,0.1);border-radius:6px;padding:8px 12px;font-size:12px"><span style="color:var(--text-muted)">Overdue:</span> <strong style="color:#ef4444">${actions.filter(a => a.status === 'Open' && AuditMetrics.getDaysOverdue(a) > 0).length}</strong></div>
                <div style="background:rgba(59,130,246,0.1);border-radius:6px;padding:8px 12px;font-size:12px"><span style="color:var(--text-muted)">Total Target AAP:</span> <strong style="color:var(--blue-light)">Rp ${Utils.formatIDR(totalAmountInAAP)}</strong></div>
                <div style="background:rgba(16,185,129,0.1);border-radius:6px;padding:8px 12px;font-size:12px"><span style="color:var(--text-muted)">Total Recovery:</span> <strong style="color:#10b981">Rp ${Utils.formatIDR(totalRecovery)}</strong></div>
                <div style="background:rgba(168,85,247,0.1);border-radius:6px;padding:8px 12px;font-size:12px"><span style="color:var(--text-muted)">Total Unrecovered:</span> <strong style="color:#a855f7">Rp ${Utils.formatIDR(totalUnrecovered)}</strong></div>
                <div style="background:rgba(245,158,11,0.1);border-radius:6px;padding:8px 12px;font-size:12px"><span style="color:var(--text-muted)">Outstanding:</span> <strong style="color:#f59e0b">Rp ${Utils.formatIDR(totalOS)}</strong></div>
              </div>`}
        </div>
      </div>
      <div class="modal-footer">
        ${Perms.can('cases:planning:write') ? `<button class="btn btn-primary" data-action="edit-planning-from-view" data-id="${p.id}"><i data-lucide="pencil"></i> Edit Planning</button>` : ''}
        <button class="btn btn-secondary" data-action="modal-close">Tutup</button>
      </div>`, 'modal-xl');
    if (window.lucide) lucide.createIcons();
  },

  kirimLaporan(planningId) {
    const p = DB.find('audit_plannings', planningId);
    const results = DB.get('audit_results').filter(r => r.planningId === planningId);
    const actions = DB.get('audit_actions').filter(a => a.planningId === planningId);
    if (results.length > 0 && actions.length === 0) {
      Toast.error('Harus ada minimal satu Agreed Action Plan sebelum laporan dikirim karena terdapat Temuan Audit.', 'Tidak Bisa Kirim');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="send"></i> Kirim Laporan ke Auditee</div>
        <button class="modal-close" data-action="view-planning" data-id="${planningId}" data-tab="planning"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:var(--space-4)">
          Laporan <strong>${p.reportNo}</strong> akan dikirimkan ke auditee. Status Laporan akan berubah menjadi <span class="badge badge-green">Completed</span>.
        </p>
        <div class="form-group">
          <label class="form-label required">Tanggal Kirim Laporan ke Auditee</label>
          <input type="date" class="form-control" id="kl-sentdate" value="${today}" max="${today}" />
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Tanggal resmi pengiriman laporan hasil audit kepada auditee.</div>
        </div>
        <div style="background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.2);border-radius:8px;padding:12px;font-size:12px;color:var(--text-muted);margin-top:var(--space-3)">
          <strong style="color:#10b981">Ringkasan:</strong><br/>
          • ${DB.get('audit_results').filter(r => r.planningId === planningId).length} Temuan Audit<br/>
          • ${actions.length} Agreed Action Plans (${actions.filter(a => a.status === 'Open').length} Open, ${actions.filter(a => a.status === 'Closed').length} Closed)
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="view-planning" data-id="${planningId}" data-tab="planning">Batal</button>
        <button class="btn btn-primary" data-action="confirm-kirim-laporan" data-id="${planningId}">
          <i data-lucide="send"></i> Konfirmasi &amp; Kirim
        </button>
      </div>`, 'modal-md');
    if (window.lucide) lucide.createIcons();
  },

  _confirmKirimLaporan(planningId) {
    const sentDate = document.getElementById('kl-sentdate')?.value;
    if (!sentDate) {
      Toast.error('Tanggal kirim wajib diisi.'); return;
    }
    DB.update('audit_plannings', planningId, { status: 'Completed', reportSentDate: sentDate });
    
    // Auto-sync case status to Closed
    const p = DB.find('audit_plannings', planningId);
    if (p) {
      if (p.trigger === 'WBS' && p.triggerRef) {
        DB.update('wbs_cases', p.triggerRef, { status: 'Closed' });
      } else if (p.trigger === 'FDS' && p.triggerRef) {
        DB.update('fds_cases', p.triggerRef, { status: 'Closed' });
      }
    }

    Toast.success('Laporan berhasil dikirim ke auditee. Status Laporan: Completed.', 'Laporan Dikirim');
    CasesPage.viewPlanning(planningId, 'planning');
    CasesPage.refresh();
  },

  _switchDetailTab(tab) {
    ['planning', 'results', 'actions'].forEach(t => {
      const btn = document.getElementById('dtab-' + t);
      const sec = document.getElementById('dsec-' + t);
      if (btn) btn.classList.toggle('active', t === tab);
      if (sec) sec.style.display = t === tab ? '' : 'none';
    });
    if (window.lucide) lucide.createIcons();
  },

  // ======================= PLANNING MODAL =======================
  openPlanningModal(id) {
    const p = id ? DB.find('audit_plannings', id) : null;
    const isEdit = !!p;
    const auditors  = DB.get('auditors').filter(a => a.status === 'active');
    const brands    = DB.get('brands');
    const provinces = DB.get('provinces');
    const depts     = ['Store Audit', 'Corporate Audit', 'Business Process Improvement'];
    const outlets   = DB.get('outlets');
    const editOutlet = p?.outletCode ? outlets.find(o => o.code === p.outletCode) : null;
    const outletDisplay = editOutlet ? `${editOutlet.code} — ${editOutlet.name}` : '';
    const statuses  = ['Plan', 'In Progress', 'Completed', 'Cancelled'];
    const triggers  = ['WBS', 'FDS', 'Direct'];
    const wbsCases  = DB.get('wbs_cases');
    const fdsCases  = DB.get('fds_cases');

    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="clipboard-list"></i> ${isEdit ? 'Edit' : 'New'} Audit Planning ${isEdit ? '— ' + p.reportNo : ''}</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-grid form-grid-3">
          <div class="form-group">
            <label class="form-label required">Nomor Laporan</label>
            <input type="text" class="form-control" id="pf-reportno" value="${Utils.escapeHtml(p?.reportNo || CasesPage._genReportNo())}" />
          </div>
          <div class="form-group">
            <label class="form-label required">Tanggal Planning</label>
            <input type="date" class="form-control" id="pf-plandate" value="${Utils.formatDateInput(p?.planningDate || new Date().toISOString())}" />
          </div>
          <div class="form-group">
            <label class="form-label required">Status Laporan</label>
            <select class="form-control" id="pf-status">
              ${statuses.map(s => `<option value="${s}" ${(p?.status || 'Plan') === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Trigger</label>
            <select class="form-control" id="pf-trigger" data-action="toggle-trigger-ref">
              ${triggers.map(t => `<option value="${t}" ${(p?.trigger || 'Direct') === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" id="pf-wbs-group" style="${(p?.trigger || 'Direct') !== 'WBS' ? 'display:none' : ''}">
            <label class="form-label">WBS Case Ref</label>
            <select class="form-control" id="pf-wbsref" data-action="update-wbs-desc">
              <option value="">— Pilih WBS Case —</option>
              ${wbsCases.map(w => `<option value="${w.id}" ${p?.triggerRef === w.id ? 'selected' : ''}>${w.caseNo} — ${w.outletName}</option>`).join('')}
            </select>
            <div id="pf-wbs-desc-container"></div>
          </div>
          <div class="form-group" id="pf-fds-group" style="${(p?.trigger || 'Direct') !== 'FDS' ? 'display:none' : ''}">
            <label class="form-label">FDS Case Ref</label>
            <select class="form-control" id="pf-fdsref" data-action="update-fds-desc">
              <option value="">— Pilih FDS Case —</option>
              ${fdsCases.map(f => `<option value="${f.id}" ${p?.triggerRef === f.id ? 'selected' : ''}>${f.caseNo} — ${f.outletName}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Tipe Audit</label>
            <select class="form-control" id="pf-audittype">
              ${['Fieldwork','Monitoring','Desk Review'].map(t => `<option value="${t}" ${(p?.auditType || 'Fieldwork') === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Departemen</label>
            <select class="form-control" id="pf-dept">
              ${depts.map(d => `<option value="${d}" ${p?.department === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Brand</label>
            <select class="form-control" id="pf-brand" data-action="fill-outlets">
              <option value="">— Pilih Brand —</option>
              ${brands.map(b => `<option value="${b.id}" ${p?.brand === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Outlet</label>
            <input type="text" class="form-control" id="pf-outlet" list="pf-outlet-datalist" autocomplete="off" placeholder="Ketik kode/nama outlet..." value="${Utils.escapeHtml(outletDisplay)}">
            <datalist id="pf-outlet-datalist">
              ${outlets.map(o => `<option value="${o.code} — ${o.name}">`).join('')}
            </datalist>
          </div>
          <div class="form-group">
            <label class="form-label">Provinsi</label>
            <input type="text" class="form-control" id="pf-province" value="${Utils.escapeHtml(p?.province || '')}" readonly />
          </div>
          <div class="form-group">
            <label class="form-label">Outlet Manager</label>
            <input type="text" class="form-control" id="pf-outlet-manager" value="${Utils.escapeHtml(p?.outletManager || '')}" readonly />
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px"><i data-lucide="info" style="width:10px;height:10px;display:inline"></i> Dari Master Data Outlets</div>
          </div>
          <div class="form-group">
            <label class="form-label">Multi Unit Manager</label>
            <input type="text" class="form-control" id="pf-multi-unit-manager" value="${Utils.escapeHtml(p?.multiUnitManager || '')}" readonly />
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px"><i data-lucide="info" style="width:10px;height:10px;display:inline"></i> Dari Master Data Outlets</div>
          </div>
          <div class="form-group">
            <label class="form-label">Area Manager</label>
            <input type="text" class="form-control" id="pf-area-manager" value="${Utils.escapeHtml(p?.areaManager || '')}" readonly />
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px"><i data-lucide="info" style="width:10px;height:10px;display:inline"></i> Dari Master Data Outlets</div>
          </div>
          <div class="form-group">
            <label class="form-label">Distrik Manager</label>
            <input type="text" class="form-control" id="pf-distrik-manager" value="${Utils.escapeHtml(p?.distrikManager || '')}" readonly />
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px"><i data-lucide="info" style="width:10px;height:10px;display:inline"></i> Dari Master Data Outlets</div>
          </div>
          <div class="form-group">
            <label class="form-label required">Lead Auditor</label>
            <select class="form-control" id="pf-lead">
              <option value="">— Pilih Auditor —</option>
              ${auditors.map(a => `<option value="${a.id}" ${p?.leadAuditor === a.id ? 'selected' : ''}>${a.name} (${a.department})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tanggal Audit Mulai</label>
            <input type="date" class="form-control" id="pf-datefrom" value="${Utils.formatDateInput(p?.auditDateFrom || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label">Tanggal Audit Selesai</label>
            <input type="date" class="form-control" id="pf-dateto" value="${Utils.formatDateInput(p?.auditDateTo || '')}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Scope / Tujuan Audit</label>
          <textarea class="form-control" id="pf-scope" rows="3" style="resize:vertical">${Utils.escapeHtml(p?.scope || '')}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="modal-close">Batal</button>
        <button class="btn btn-primary" data-action="save-planning" data-id="${id || ''}">
          <i data-lucide="save"></i> ${isEdit ? 'Simpan Perubahan' : 'Buat Planning'}
        </button>
      </div>`, 'modal-lg');
    if (window.lucide) lucide.createIcons();
    CasesPage._updateWbsDesc();
  },

  _updateWbsDesc() {
    const wbsId = document.getElementById('pf-wbsref')?.value;
    const container = document.getElementById('pf-wbs-desc-container');
    if (!container) return;
    if (!wbsId) {
      container.innerHTML = '';
      return;
    }
    const wbs = DB.find('wbs_cases', wbsId);
    if (wbs) {
      container.innerHTML = `
        <div style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2); border-radius:8px; padding:12px; margin-top:8px; font-size:12px;">
          <div style="font-weight:600; color:var(--blue-light);"><i data-lucide="info" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:4px"></i> Deskripsi Kasus WBS:</div>
          <div style="color:var(--text-secondary); margin-top:4px;">${Utils.escapeHtml(wbs.description || '-')}</div>
          <div style="color:var(--text-muted); font-size:11px; margin-top:4px;"><strong>Indikasi Awal:</strong> ${Utils.escapeHtml(wbs.initialIndication || '-')}</div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      // Auto-fill brand, outlet, province from WBS case
      CasesPage._fillFromRef(wbs.brand, wbs.outletCode, wbs.province);
    } else {
      container.innerHTML = '';
    }
  },

  _fillFromRef(brandId, outletCode, province) {
    const brandSel = document.getElementById('pf-brand');
    const outletInput = document.getElementById('pf-outlet');
    const provInput = document.getElementById('pf-province');
    if (brandSel) {
      brandSel.value = brandId || '';
      CasesPage._fillOutlets();
    }
    if (outletInput && outletCode) {
      const outlet = DB.get('outlets').find(o => o.code === outletCode);
      if (outlet) {
        outletInput.value = `${outlet.code} — ${outlet.name}`;
        if (provInput) provInput.value = outlet.province || province || '';
        document.getElementById('pf-outlet-manager').value = outlet.outletManager || '';
        document.getElementById('pf-multi-unit-manager').value = outlet.multiUnitManager || '';
        document.getElementById('pf-area-manager').value = outlet.areaManager || '';
        document.getElementById('pf-distrik-manager').value = outlet.distrikManager || '';
      }
    } else if (provInput) {
      provInput.value = province || '';
    }
  },

  _updateFdsDesc() {
    const fdsId = document.getElementById('pf-fdsref')?.value;
    if (!fdsId) return;
    const fds = DB.find('fds_cases', fdsId);
    if (fds) {
      CasesPage._fillFromRef(fds.brand, fds.outletCode, fds.province);
    }
  },

  _toggleTriggerRef() {
    const trigger = document.getElementById('pf-trigger')?.value;
    document.getElementById('pf-wbs-group').style.display = trigger === 'WBS' ? '' : 'none';
    document.getElementById('pf-fds-group').style.display = trigger === 'FDS' ? '' : 'none';
    if (trigger !== 'WBS') {
      const container = document.getElementById('pf-wbs-desc-container');
      if (container) container.innerHTML = '';
    } else {
      CasesPage._updateWbsDesc();
    }
  },

  _fillOutlets() {
    const brand   = document.getElementById('pf-brand')?.value;
    const outlets = DB.get('outlets').filter(o => !brand || o.brand === brand);
    const list    = document.getElementById('pf-outlet-datalist');
    const input   = document.getElementById('pf-outlet');
    if (!list) return;
    list.innerHTML = outlets.map(o => `<option value="${o.code} — ${o.name}">`).join('');
    if (input && !input.dataset.skipClear) {
      input.value = '';
      document.getElementById('pf-province').value = '';
      document.getElementById('pf-outlet-manager').value = '';
      document.getElementById('pf-multi-unit-manager').value = '';
      document.getElementById('pf-area-manager').value = '';
      document.getElementById('pf-distrik-manager').value = '';
    }
  },

  savePlanning(id) {
    if (!Perms.can('cases:planning:write')) {
      Toast.error('Anda tidak memiliki izin untuk membuat/mengubah Audit Planning.');
      return;
    }
    const reportNo    = document.getElementById('pf-reportno')?.value.trim();
    const planDate    = document.getElementById('pf-plandate')?.value;
    const status      = document.getElementById('pf-status')?.value;
    const trigger     = document.getElementById('pf-trigger')?.value;
    const auditType   = document.getElementById('pf-audittype')?.value;
    const dept        = document.getElementById('pf-dept')?.value;
    const brand       = document.getElementById('pf-brand')?.value;
    const outletVal   = document.getElementById('pf-outlet')?.value;
    const province    = document.getElementById('pf-province')?.value;
    const leadAuditor = document.getElementById('pf-lead')?.value;
    const dateFrom    = document.getElementById('pf-datefrom')?.value;
    const dateTo      = document.getElementById('pf-dateto')?.value;
    const scope       = document.getElementById('pf-scope')?.value;

    if (!reportNo || !planDate || !brand || !outletVal || !leadAuditor) {
      Toast.error('Mohon lengkapi field yang wajib diisi (*).'); return;
    }
    const outletCode = outletVal.split(' — ')[0].trim();
    const outletName = outletVal.includes(' — ') ? outletVal.split(' — ').slice(1).join(' — ') : '';

    let triggerRef = null;
    if (trigger === 'WBS') triggerRef = document.getElementById('pf-wbsref')?.value || null;
    if (trigger === 'FDS') triggerRef = document.getElementById('pf-fdsref')?.value || null;

    // Duplicate check: prevent same WBS/FDS case from being linked to two plannings
    if (triggerRef) {
      const existing = DB.get('audit_plannings').find(p =>
        p.trigger === trigger && p.triggerRef === triggerRef && p.id !== id
      );
      if (existing) {
        Toast.error(`Kasus ${trigger} ini sudah terhubung ke planning ${existing.reportNo}. Setiap kasus hanya boleh memiliki satu Audit Planning.`, 'Duplikat Tidak Diizinkan');
        return;
      }
    }

    const existingPlanning = id ? DB.find('audit_plannings', id) : null;
    const oldTrigger    = existingPlanning?.trigger || null;
    const oldTriggerRef = existingPlanning?.triggerRef || null;

    const outletManager     = document.getElementById('pf-outlet-manager')?.value.trim() || '';
    const multiUnitManager  = document.getElementById('pf-multi-unit-manager')?.value.trim() || '';
    const areaManager       = document.getElementById('pf-area-manager')?.value.trim() || '';
    const distrikManager    = document.getElementById('pf-distrik-manager')?.value.trim() || '';

    const record = { reportNo, planningDate: planDate, status, trigger, triggerRef, auditType, department: dept, brand, outletCode, outletName, province, outletManager, multiUnitManager, areaManager, distrikManager, leadAuditor, auditorTeam: [], auditDateFrom: dateFrom, auditDateTo: dateTo, scope };

    if (id) {
      DB.update('audit_plannings', id, record);
      AuditMetrics.syncPlanningRelationships(id, oldTrigger, oldTriggerRef, trigger, triggerRef);
      Toast.success('Planning berhasil diperbarui.', 'Tersimpan');
    } else {
      const inserted = DB.insert('audit_plannings', record);
      AuditMetrics.syncPlanningRelationships(inserted.id, null, null, trigger, triggerRef);
      Toast.success('Audit Planning berhasil dibuat!', 'Berhasil');
    }
    Modal.close();
    CasesPage.refresh();
  },

  deletePlanning(id) {
    if (!confirm('Hapus planning ini? Semua hasil audit dan tindakan terkait juga akan dihapus.')) return;
    // Remove bidirectional relationship before deleting
    const planning = DB.find('audit_plannings', id);
    if (planning) {
      AuditMetrics.syncPlanningRelationships(id, planning.trigger, planning.triggerRef, null, null);
    }
    const results = DB.get('audit_results').filter(r => r.planningId === id);
    results.forEach(r => {
      DB.set('audit_actions', DB.get('audit_actions').filter(a => a.resultId !== r.id));
    });
    DB.set('audit_results', DB.get('audit_results').filter(r => r.planningId !== id));
    DB.delete('audit_plannings', id);
    Toast.info('Planning berhasil dihapus.', 'Dihapus');
    CasesPage.refresh();
  },

  // ======================= RESULT MODAL =======================
  openResultModal(resultId, planningId) {
    const r = resultId ? DB.find('audit_results', resultId) : null;
    const isEdit = !!r;
    const p = DB.find('audit_plannings', planningId);
    const severities = ['Low', 'Medium', 'High', 'Critical'];
    const statuses   = ['Open', 'Closed'];
    const allCats    = DB.get('fraud_categories');
    const fraudCats  = allCats.filter(c => !c.nature || c.nature === 'Fraud');
    const adminCats  = allCats.filter(c => c.nature === 'Administrative');
    const curNature  = r?.nature || 'Fraud';
    const activeCats = curNature === 'Administrative' ? adminCats : fraudCats;

    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="alert-triangle"></i> ${isEdit ? 'Edit' : 'Tambah'} Temuan Audit — ${p?.reportNo}</div>
        <button class="modal-close" data-action="view-planning" data-id="${planningId}" data-tab="results"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <!-- Nature Toggle -->
        <div style="display:flex;gap:8px;margin-bottom:var(--space-4);padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid var(--border-color)">
          <span style="font-size:12px;font-weight:600;color:var(--text-muted);margin-right:4px;align-self:center">Tipe Temuan:</span>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:6px 14px;border-radius:6px;border:1px solid ${curNature==='Fraud'?'#ef4444':'var(--border-color)'};background:${curNature==='Fraud'?'rgba(239,68,68,0.08)':'transparent'};font-size:12px;font-weight:600;color:${curNature==='Fraud'?'#ef4444':'var(--text-muted)'}">
            <input type="radio" name="rf-nature" value="Fraud" ${curNature==='Fraud'?'checked':''} data-action="nature-change" data-planning-id="${planningId}" data-result-id="${resultId||''}" style="accent-color:#ef4444"> FRAUD
          </label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:6px 14px;border-radius:6px;border:1px solid ${curNature==='Administrative'?'#3b82f6':'var(--border-color)'};background:${curNature==='Administrative'?'rgba(59,130,246,0.08)':'transparent'};font-size:12px;font-weight:600;color:${curNature==='Administrative'?'#3b82f6':'var(--text-muted)'}">
            <input type="radio" name="rf-nature" value="Administrative" ${curNature==='Administrative'?'checked':''} data-action="nature-change" data-planning-id="${planningId}" data-result-id="${resultId||''}" style="accent-color:#3b82f6"> ADMINISTRATIF
          </label>
          <span style="font-size:11px;color:var(--text-muted);align-self:center;margin-left:8px">${curNature==='Administrative'?'Temuan SOP/prosedur — tidak memiliki nilai kerugian finansial':'Temuan dengan indikasi kerugian finansial'}</span>
        </div>
        <div class="form-grid form-grid-3">
          <div class="form-group">
            <label class="form-label required">No. Temuan</label>
            <input type="text" class="form-control" id="rf-findingno" value="${Utils.escapeHtml(r?.findingNo || CasesPage._genFindingNo(planningId))}" />
          </div>
          <div class="form-group">
            <label class="form-label required">Tanggal Temuan</label>
            <input type="date" class="form-control" id="rf-date" value="${Utils.formatDateInput(r?.findingDate || new Date().toISOString())}" />
          </div>
          <div class="form-group">
            <label class="form-label required">Kategori</label>
            <select class="form-control" id="rf-cat">
              ${activeCats.map(c => `<option value="${c.name}" ${r?.category === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label required">Judul Temuan</label>
            <input type="text" class="form-control" id="rf-title" value="${Utils.escapeHtml(r?.findingTitle || '')}" placeholder="Nama/judul temuan audit" />
          </div>
          <div class="form-group">
            <label class="form-label required">Severity</label>
            <select class="form-control" id="rf-severity">
              ${severities.map(s => `<option value="${s}" ${(r?.severity || 'Medium') === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Status Temuan</label>
            <select class="form-control" id="rf-status">
              ${statuses.map(s => `<option value="${s}" ${(r?.status || 'Open') === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" id="rf-loss-group" style="${curNature==='Administrative'?'display:none':''}">  
            <label class="form-label required">Total Loss (Rp)</label>
            <input type="text" class="form-control" id="rf-loss" inputmode="numeric" value="${curNature==='Administrative'?'0':(r?.totalLoss?Number(r.totalLoss).toLocaleString('en-US'):'0')}" data-action="cases-format-num" />
          </div>
          <div id="rf-fraudster-section" style="grid-column:1/-1;border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:var(--space-3);background:rgba(239,68,68,0.03);${curNature==='Administrative'?'display:none':''}">
            <div style="font-size:11px;font-weight:700;color:#ef4444;margin-bottom:var(--space-2);text-transform:uppercase;letter-spacing:0.5px"><i data-lucide="user-x" style="width:12px;height:12px;display:inline;margin-right:4px"></i> Informasi Fraudster</div>
            <div class="form-grid form-grid-3">
              <div class="form-group">
                <label class="form-label">Nama Fraudster</label>
                <input type="text" class="form-control" id="rf-fraudster-name" value="${Utils.escapeHtml(r?.fraudsterName||'')}" placeholder="Nama pelaku" />
              </div>
              <div class="form-group">
                <label class="form-label">No Induk Karyawan</label>
                <input type="text" class="form-control" id="rf-fraudster-nik" value="${Utils.escapeHtml(r?.fraudsterNik||'')}" placeholder="NIK / Employee ID" />
              </div>
              <div class="form-group">
                <label class="form-label">Jabatan</label>
                <input type="text" class="form-control" id="rf-fraudster-position" value="${Utils.escapeHtml(r?.fraudsterPosition||'')}" placeholder="Jabatan / posisi" />
              </div>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi Temuan</label>
          <textarea class="form-control" id="rf-desc" rows="3" style="resize:vertical">${Utils.escapeHtml(r?.description || '')}</textarea>
        </div>
        <div style="background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.2);border-radius:8px;padding:12px;font-size:12px;color:var(--text-muted)">
          <i data-lucide="info" style="width:12px;height:12px;display:inline;margin-right:4px"></i>
          Nilai <strong>Recovery</strong> dan <strong>Outstanding (OS)</strong> dihitung otomatis dari Agreed Action Plans (Stage 3) yang berstatus Closed.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="view-planning" data-id="${planningId}" data-tab="results">Batal</button>
        <button class="btn btn-primary" data-action="save-result" data-result-id="${resultId || ''}" data-planning-id="${planningId}">
          <i data-lucide="save"></i> ${isEdit ? 'Simpan' : 'Tambah Temuan'}
        </button>
      </div>`, 'modal-lg');
    if (window.lucide) lucide.createIcons();
  },

  // Re-render category options when nature radio changes
  _onNatureChange(planningId, resultId) {
    const nature    = document.querySelector('input[name="rf-nature"]:checked')?.value || 'Fraud';
    const allCats   = DB.get('fraud_categories');
    const activeCats = nature === 'Administrative'
      ? allCats.filter(c => c.nature === 'Administrative')
      : allCats.filter(c => !c.nature || c.nature === 'Fraud');
    const catSel = document.getElementById('rf-cat');
    if (catSel) {
      catSel.innerHTML = activeCats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    }
    const lossGroup = document.getElementById('rf-loss-group');
    const lossInput = document.getElementById('rf-loss');
    if (lossGroup) lossGroup.style.display = nature === 'Administrative' ? 'none' : '';
    if (lossInput && nature === 'Administrative') lossInput.value = 0;
    const fraudsterSection = document.getElementById('rf-fraudster-section');
    if (fraudsterSection) fraudsterSection.style.display = nature === 'Administrative' ? 'none' : '';
  },

  saveResult(resultId, planningId) {
    const findingNo   = document.getElementById('rf-findingno')?.value.trim();
    const findingDate = document.getElementById('rf-date')?.value;
    const category    = document.getElementById('rf-cat')?.value;
    const title       = document.getElementById('rf-title')?.value.trim();
    const severity    = document.getElementById('rf-severity')?.value;
    const status      = document.getElementById('rf-status')?.value;
    const description = document.getElementById('rf-desc')?.value;
    const nature     = document.querySelector('input[name="rf-nature"]:checked')?.value || 'Fraud';
    const totalLoss  = nature === 'Administrative' ? 0 : Utils.parseFormattedNumber(document.getElementById('rf-loss')?.value || 0);

    if (!findingNo || !title || !category) {
      Toast.error('Mohon lengkapi field yang wajib diisi.');
      return;
    }
    const fraudsterName     = document.getElementById('rf-fraudster-name')?.value.trim() || '';
    const fraudsterNik      = document.getElementById('rf-fraudster-nik')?.value.trim() || '';
    const fraudsterPosition = document.getElementById('rf-fraudster-position')?.value.trim() || '';

    const record = { planningId, findingNo, findingTitle: title, findingDate, category, severity, status, description, totalLoss, nature, fraudsterName, fraudsterNik, fraudsterPosition };
    if (resultId) {
      DB.update('audit_results', resultId, record);
      Toast.success('Temuan berhasil diperbarui.', 'Tersimpan');
    } else {
      DB.insert('audit_results', record);
      Toast.success('Temuan audit berhasil ditambahkan!', 'Berhasil');
    }
    // Auto-transition: Plan → In Progress when first finding is added
    CasesPage._autoUpdateLaporanStatus(planningId);
    CasesPage.viewPlanning(planningId, 'results');
  },

  deleteResult(resultId, planningId) {
    if (!confirm('Hapus temuan ini? Semua tindakan perbaikan terkait juga akan dihapus.')) return;
    DB.set('audit_actions', DB.get('audit_actions').filter(a => a.resultId !== resultId));
    DB.delete('audit_results', resultId);
    Toast.info('Temuan berhasil dihapus.', 'Dihapus');
    // Auto-transition: In Progress → Plan if no more findings
    CasesPage._autoUpdateLaporanStatus(planningId);
    CasesPage.viewPlanning(planningId, 'results');
  },

  // ======================= ACTION MODAL =======================
  openActionModal(actionId, resultId, planningId) {
    const a = actionId ? DB.find('audit_actions', actionId) : null;
    const isEdit = !!a;
    const r = DB.find('audit_results', resultId);
    const isAdmin = r?.nature === 'Administrative';
    const statuses = ['Open', 'Closed'];
    const isClosed = (a?.status || 'Open') === 'Closed';

    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="check-square"></i> ${isEdit ? 'Edit' : 'Tambah'} Agreed Action — ${r?.findingNo || ''}
          ${isAdmin ? '<span class="badge" style="background:rgba(59,130,246,0.15);color:#3b82f6;font-size:10px;margin-left:8px">ADMIN</span>' : ''}
        </div>
        <button class="modal-close" data-action="view-planning" data-id="${planningId}" data-tab="results"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-grid form-grid-3">
          <div class="form-group">
            <label class="form-label required">No. AAP</label>
            <input type="text" class="form-control" id="af-actno" value="${Utils.escapeHtml(a?.actionNo || CasesPage._genActionNo(resultId))}" />
          </div>
          <div class="form-group">
            <label class="form-label required">PIC (Penanggung Jawab)</label>
            <input type="text" class="form-control" id="af-pic" value="${Utils.escapeHtml(a?.picName || '')}" placeholder="Nama/jabatan PIC" />
          </div>
          <div class="form-group">
            <label class="form-label required">PIC Department</label>
            <select class="form-control" id="af-pic-dept">
              <option value="">— Pilih Department —</option>
              ${DB.get('departments').map(d =>
                `<option value="${d.name}" ${(a?.picDepartment || '') === d.name ? 'selected' : ''}>${d.name}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Status</label>
            <select class="form-control" id="af-status" data-action="toggle-recovery-field">
              ${statuses.map(s => `<option value="${s}" ${(a?.status || 'Open') === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label required">Judul Tindakan</label>
            <input type="text" class="form-control" id="af-title" value="${Utils.escapeHtml(a?.actionTitle || '')}" placeholder="Deskripsi singkat tindakan perbaikan" />
          </div>
          ${!isAdmin ? `
          <div class="form-group" id="af-amount-group">
            <label class="form-label required">Target Amount (Rp)</label>
            <input type="text" class="form-control" id="af-amount" inputmode="numeric" value="${a?.amount?Number(a.amount).toLocaleString('en-US'):'0'}" data-action="cases-format-num" placeholder="Total nilai yang ditargetkan untuk dipulihkan" />
            <div style="font-size:10px;color:var(--text-muted);margin-top:3px">Jumlah kerugian yang diharapkan dapat dipulihkan via AAP ini.</div>
          </div>` : `<input type="hidden" id="af-amount" value="0" />`}
          <div class="form-group">
            <label class="form-label required">Target Due Date</label>
            <input type="date" class="form-control" id="af-duedate" value="${Utils.formatDateInput(a?.dueDate || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label ${isClosed ? 'required' : ''}">Tanggal Selesai</label>
            <input type="date" class="form-control" id="af-completion" value="${Utils.formatDateInput(a?.completionDate || '')}" />
          </div>
          ${!isAdmin ? `
          <div class="form-group" id="af-recovery-group" style="${!isClosed ? 'display:none' : ''}">
            <label class="form-label">Nilai Recovery (Rp)</label>
            <input type="text" class="form-control" id="af-recovery" inputmode="numeric" value="${a?.recovery?Number(a.recovery).toLocaleString('en-US'):'0'}" data-action="cases-format-num" placeholder="Jumlah yang berhasil dikembalikan" />
          </div>
          <div class="form-group" id="af-unrecovered-group" style="${!isClosed ? 'display:none' : ''}">
            <label class="form-label">Nilai Unrecovered (Rp)</label>
            <input type="text" class="form-control" id="af-unrecovered" inputmode="numeric" value="${a?.unrecovered?Number(a.unrecovered).toLocaleString('en-US'):'0'}" data-action="cases-format-num" placeholder="Jumlah yang diputihkan/tidak bisa dikembalikan" />
            <div style="font-size:10px;color:var(--text-muted);margin-top:3px">Jumlah yang resmi diikhlaskan oleh manajemen.</div>
          </div>` : `<input type="hidden" id="af-recovery" value="0" /><input type="hidden" id="af-unrecovered" value="0" />`}
        </div>
        <div class="form-group">
          <label class="form-label">Detail Tindakan / Keterangan</label>
          <textarea class="form-control" id="af-desc" rows="3" style="resize:vertical">${Utils.escapeHtml(a?.description || '')}</textarea>
        </div>
        ${isAdmin
          ? `<div style="background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.15);border-radius:6px;padding:10px;font-size:11px;color:var(--text-muted);margin-top:8px">
               <strong style="color:#3b82f6">ℹ️ Temuan Administratif</strong><br/>
               AAP ini bersifat non-finansial. Tidak ada target pemulihan finansial yang dilacak.<br/>
               Cukup tandai status <strong>Closed</strong> beserta tanggal selesai ketika tindakan sudah diimplementasikan.
             </div>`
          : `<div style="background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.15);border-radius:6px;padding:10px;font-size:11px;color:var(--text-muted);margin-top:8px">
               <strong style="color:var(--blue-light)">⚠ Rumus Outstanding AAP:</strong><br/>
               Outstanding = Target Amount − Recovery − Unrecovered<br/>
               Jika Outstanding = 0, AAP dapat ditutup (status Closed).
             </div>`
        }
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="view-planning" data-id="${planningId}" data-tab="results">Batal</button>
        <button class="btn btn-primary" data-action="save-action" data-action-id="${actionId || ''}" data-result-id="${resultId}" data-planning-id="${planningId}">
          <i data-lucide="save"></i> ${isEdit ? 'Simpan' : 'Tambah Action'}
        </button>
      </div>`, 'modal-lg');
    if (window.lucide) lucide.createIcons();
  },

  _toggleRecoveryField() {
    const status = document.getElementById('af-status')?.value;
    const show = status === 'Closed';
    const grp  = document.getElementById('af-recovery-group');
    const ugrp = document.getElementById('af-unrecovered-group');
    if (grp)  grp.style.display  = show ? '' : 'none';
    if (ugrp) ugrp.style.display = show ? '' : 'none';
  },

  saveAction(actionId, resultId, planningId) {
    const actionNo       = document.getElementById('af-actno')?.value.trim();
    const picName        = document.getElementById('af-pic')?.value.trim();
    const picDepartment  = document.getElementById('af-pic-dept')?.value;
    const status         = document.getElementById('af-status')?.value;
    const actionTitle    = document.getElementById('af-title')?.value.trim();
    const dueDate        = document.getElementById('af-duedate')?.value;
    const completionDate = document.getElementById('af-completion')?.value || null;
    const description    = document.getElementById('af-desc')?.value;
    const amount         = Utils.parseFormattedNumber(document.getElementById('af-amount')?.value || 0);
    const recovery       = status === 'Closed' ? Utils.parseFormattedNumber(document.getElementById('af-recovery')?.value || 0) : 0;
    const unrecovered    = status === 'Closed' ? Utils.parseFormattedNumber(document.getElementById('af-unrecovered')?.value || 0) : 0;

    if (!actionNo || !picName || !picDepartment || !actionTitle || !dueDate) {
      Toast.error('Mohon lengkapi field yang wajib diisi.'); return;
    }

    // Validation: Closed AAP must have a completion date
    if (status === 'Closed' && !completionDate) {
      Toast.error('AAP berstatus Closed harus memiliki Tanggal Selesai.', 'Validasi Gagal'); return;
    }

    // Validation: Completion date cannot be earlier than planning date
    if (completionDate) {
      const planning = DB.find('audit_plannings', planningId);
      if (planning?.planningDate && completionDate < planning.planningDate) {
        Toast.error(`Tanggal Selesai (${completionDate}) tidak boleh lebih awal dari Tanggal Planning (${planning.planningDate}).`, 'Validasi Gagal'); return;
      }
    }

    // Validation: Open AAP must have zero recovery
    if (status === 'Open' && recovery > 0) {
      Toast.error('AAP berstatus Open tidak boleh memiliki nilai Recovery. Ubah status menjadi Closed terlebih dahulu.', 'Validasi Gagal'); return;
    }

    // Validation: Recovery + Unrecovered cannot exceed target amount
    if (recovery + unrecovered > amount && amount > 0) {
      Toast.error(`Total Recovery (Rp ${Utils.formatIDR(recovery)}) + Unrecovered (Rp ${Utils.formatIDR(unrecovered)}) melebihi Target Amount (Rp ${Utils.formatIDR(amount)}).`, 'Validasi Gagal'); return;
    }

    // Validation: Total recovery + unrecovered across all actions of this finding cannot exceed finding's total loss
    const finding = DB.find('audit_results', resultId);
    const totalLoss = finding ? Number(finding.totalLoss || 0) : 0;
    const siblingActions = DB.get('audit_actions').filter(a => a.resultId === resultId && a.id !== actionId);
    const siblingSum = siblingActions.reduce((sum, a) => {
      const rec = a.status === 'Closed' ? Number(a.recovery || 0) : 0;
      const unrec = Number(a.unrecovered || 0);
      return sum + rec + unrec;
    }, 0);
    const proposedTotal = siblingSum + recovery + unrecovered;
    if (proposedTotal > totalLoss && totalLoss > 0) {
      Toast.error(`Total Recovery + Unrecovered terakumulasi (Rp ${Utils.formatIDR(proposedTotal)}) melebihi Total Loss Temuan ini (Rp ${Utils.formatIDR(totalLoss)}).`, 'Validasi Gagal'); return;
    }

    const record = { resultId, planningId, actionNo, picName, picDepartment, status, actionTitle, dueDate, completionDate, description, amount, recovery, unrecovered };
    if (actionId) {
      DB.update('audit_actions', actionId, record);
      Toast.success('Tindakan berhasil diperbarui.', 'Tersimpan');
    } else {
      DB.insert('audit_actions', record);
      Toast.success('Agreed Action berhasil ditambahkan!', 'Berhasil');
    }
    CasesPage.viewPlanning(planningId, 'results');
  },

  deleteAction(actionId, resultId, planningId) {
    if (!confirm('Hapus tindakan perbaikan ini?')) return;
    DB.delete('audit_actions', actionId);
    Toast.info('Tindakan berhasil dihapus.', 'Dihapus');
    CasesPage.viewPlanning(planningId, 'results');
  },

  // ======================= HELPERS =======================
  _genReportNo() {
    const plannings = DB.get('audit_plannings');
    const year = new Date().getFullYear();
    const yearPlans = plannings.filter(p => p.reportNo && p.reportNo.includes(String(year)));
    const next = (yearPlans.length + 1).toString().padStart(3, '0');
    return `LAP-${year}-${next}`;
  },

  _genFindingNo(planningId) {
    const p = DB.find('audit_plannings', planningId);
    const results = DB.get('audit_results').filter(r => r.planningId === planningId);
    const n = (results.length + 1);
    return `${p?.reportNo || 'LAP'}/F${n}`;
  },

  _genActionNo(resultId) {
    const r = DB.find('audit_results', resultId);
    const actions = DB.get('audit_actions').filter(a => a.resultId === resultId);
    const n = (actions.length + 1);
    return `${r?.findingNo || 'AAP'}-${n}`;
  },

  exportCsv() {
    const plannings = DB.get('audit_plannings');
    const results   = DB.get('audit_results');
    const actions   = DB.get('audit_actions');
    const rows = [['No. Laporan', 'Tgl Planning', 'Trigger', 'Outlet', 'Brand', 'Dept', 'Status Laporan', 'Status Action Plan', 'Jml Temuan', 'Total Loss', 'Recovery (dari AAP)', 'OS', 'Open AAP']];
    plannings.forEach(p => {
      const pr = results.filter(r => r.planningId === p.id);
      const pa = actions.filter(a => a.planningId === p.id);
      const totalLoss     = pr.reduce((s, r) => s + (r.totalLoss || 0), 0);
      const totalRecovery = pa.filter(a => a.status === 'Closed').reduce((s, a) => s + (a.recovery || 0), 0);
      rows.push([
        p.reportNo, p.planningDate, p.trigger,
        `${p.outletCode} ${p.outletName}`, p.brand, p.department,
        p.status, CasesPage._actionPlanStatus(p.id),
        pr.length,
        totalLoss,
        totalRecovery,
        Math.max(0, totalLoss - totalRecovery),
        pa.filter(a => a.status === 'Open').length
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `audit-assignments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  },
};

window.CasesPage = CasesPage;
