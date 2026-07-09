/* ============================================================
   WBS (WHISTLEBLOWING SYSTEM) PAGE
   ============================================================ */

const WBSPage = {
  page: 1,
  perPage: 10,
  filters: { dateFrom: '', dateTo: '', brand: '', outlet: '', status: '', search: '', sortBy: '', sortDir: '' },

  render() {
    if (!Auth.requireAuth()) return;
    Components.renderAppShell(
      'WBS Overview',
      'Whistleblowing System — Case Monitoring',
      WBSPage.buildHtml(),
      'wbs'
    );
    WBSPage.afterRender();
    WBSPage.renderCharts();
  },

  buildHtml() {
    const all      = DB.get('wbs_cases');
    const filtered = WBSPage.applyFilters(all);
    const brands   = DB.get('brands');

    // KPIs
    const total       = filtered.length;
    const newC        = filtered.filter(c => c.status === 'New').length;
    const invest      = filtered.filter(c => c.status === 'Investigation').length;
    const inProgress  = filtered.filter(c => c.status === 'In Progress').length;
    const closed      = filtered.filter(c => c.status === 'Closed').length;
    const onHold      = filtered.filter(c => c.status === 'On Hold').length;
    const completion  = total ? Utils.pct(closed, total) : 0;

    // Pagination
    const paged = filtered.slice((WBSPage.page-1)*WBSPage.perPage, WBSPage.page*WBSPage.perPage);

    return `
      <!-- KPI Strip -->
      <div class="kpi-grid kpi-grid-6" style="grid-template-columns:repeat(4,1fr) 1fr 1fr 1fr">
        ${Components.kpiCard('Total WBS', total, 'All WBS reports', 'megaphone', 'blue')}
        ${Components.kpiCard('New', newC, 'Awaiting review', 'plus-circle', 'cyan')}
        ${Components.kpiCard('Investigation', invest, 'Under investigation', 'search', 'amber')}
        ${Components.kpiCard('In Progress', inProgress, 'Report in progress', 'file-text', 'purple')}
        ${Components.kpiCard('Closed', closed, 'Resolved', 'check-circle', 'green')}
        ${Components.kpiCard('On Hold', onHold, 'Paused cases', 'pause-circle', 'gray')}
        ${Components.kpiCard('% Completion', completion+'%', 'Closed rate', 'percent', completion>=80?'green':'amber')}
      </div>

      <!-- Charts Row -->
      <div class="charts-grid charts-grid-3">
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="align-left"></i> WBS Status Distribution</div></div>
          <div class="card-body"><div class="chart-wrapper"><canvas id="chart-wbs-status"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="activity"></i> WBS Trend Report</div></div>
          <div class="card-body"><div class="chart-wrapper"><canvas id="chart-wbs-trend"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="bar-chart-horizontal"></i> Top 5 WBS Category</div></div>
          <div class="card-body"><div class="chart-wrapper"><canvas id="chart-wbs-top5"></canvas></div></div>
        </div>
      </div>

      <div class="charts-grid" style="grid-template-columns:1fr 1fr">
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="bar-chart"></i> Amount by Severity Level</div></div>
          <div class="card-body"><div class="chart-wrapper"><canvas id="chart-wbs-level"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="pie-chart"></i> Report by Brand</div></div>
          <div class="card-body"><div class="chart-wrapper"><canvas id="chart-wbs-brand"></canvas></div></div>
        </div>
      </div>

      <!-- Case Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="list"></i> WBS Cases Progress</div>
          ${Auth.isAuditor() ? `<button class="btn btn-primary btn-sm" id="wbs-add-btn"><i data-lucide="plus"></i> Add WBS Case</button>` : ''}
        </div>
        <div class="card-body" style="padding-top:0">
          <div class="filter-bar" style="margin-bottom:var(--space-3)">
            <div class="search-input-wrapper">
              <i data-lucide="search"></i>
              <input type="text" class="form-control search-input" id="wbs-search" placeholder="Search case no, outlet…" value="${WBSPage.filters.search}" />
            </div>
            <input type="date" class="form-control" id="wbs-date-from" value="${WBSPage.filters.dateFrom}" />
            <span style="color:var(--text-muted);font-size:12px">to</span>
            <input type="date" class="form-control" id="wbs-date-to" value="${WBSPage.filters.dateTo}" />
            <select class="form-control" data-filter="brand">
              <option value="">All Brands</option>
              ${brands.map(b=>`<option value="${b.id}" ${WBSPage.filters.brand===b.id?'selected':''}>${b.name}</option>`).join('')}
            </select>
            <select class="form-control" data-filter="outlet">
              <option value="">All Outlets</option>
              ${(() => {
                const brandFilter = WBSPage.filters.brand;
                const outletList = brandFilter ? DB.get('outlets').filter(o => o.brand === brandFilter) : DB.get('outlets');
                return outletList.map(o => `<option value="${o.code}" ${WBSPage.filters.outlet===o.code?'selected':''}>${o.code} — ${o.name}</option>`).join('');
              })()}
            </select>
            <select class="form-control" data-filter="status">
              <option value="">All Status</option>
              ${['New','Investigation','In Progress','Closed','On Hold'].map(s=>`<option value="${s}" ${WBSPage.filters.status===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="data-table-wrapper">
            ${DataTable.render({
              columns: [
                { key: 'caseNo', label: 'Case No.' },
                { key: 'reportDate', label: 'Report Date' },
                { key: 'category', label: 'Category' },
                { key: 'outletCode', label: 'Outlet' },
                { key: 'brand', label: 'Brand' },
                { key: 'province', label: 'Province' },
                { key: 'severity', label: 'Severity' },
                { key: 'estimatedFraud', label: 'Est. Fraud' },
                { key: 'status', label: 'Status' },
                { key: 'linkedPlanning', label: 'Audit Report', sortable: false },
                { key: 'actions', label: 'Actions', sortable: false },
              ],
              data: paged,
              sort: { key: WBSPage.filters.sortBy, dir: WBSPage.filters.sortDir, onChange: 'WBSPage.setSort' },
              emptyMessage: 'No WBS cases found',
              buildRow: (c) => {
                const pl = c.linkedPlanningId ? DB.find('audit_plannings', c.linkedPlanningId) : null;
                let auditReportHtml;
                if (!pl) {
                  auditReportHtml = '<span class="text-muted" style="font-size:11px">Belum Dibuat</span>';
                } else {
                  const aapStatus = AuditMetrics.getActionPlanStatus(pl.id);
                  auditReportHtml = `
                    <div style="font-size:11px;line-height:1.3">
                      <a href="javascript:void(0)" data-action="view-linked-planning" data-planning-id="${pl.id}" style="font-weight:600;color:var(--blue-light);display:block">${Utils.escapeHtml(pl.reportNo)}</a>
                      <div style="margin-top:2px;display:flex;gap:4px;flex-wrap:wrap">
                        ${CasesPage.laporanBadge(pl.status)}
                        ${CasesPage.aapStatusBadge(aapStatus)}
                      </div>
                    </div>`;
                }
                return `<tr>
                  <td class="col-bold">${Utils.escapeHtml(c.caseNo)}</td>
                  <td>${Utils.formatDate(c.reportDate)}</td>
                  <td>${Utils.escapeHtml(c.category)}</td>
                  <td><span class="col-mono">${Utils.escapeHtml(c.outletCode)}</span> ${Utils.escapeHtml(c.outletName)}</td>
                  <td>${Utils.statusBadge(Utils.escapeHtml(c.brand))}</td>
                  <td style="font-size:11px">${Utils.escapeHtml(c.province)}</td>
                  <td>${Utils.severityBadge(c.severity)}</td>
                  <td class="text-amber font-bold">Rp ${Utils.formatIDR(c.estimatedFraud)}</td>
                  <td>${Utils.statusBadge(c.status)}</td>
                  <td style="font-size:11px">${auditReportHtml}</td>
                  <td>
                    <div class="flex gap-2">
                      <button class="btn btn-icon btn-secondary btn-sm" data-action="view-case" data-case-id="${c.id}" title="View"><i data-lucide="eye"></i></button>
                      ${Auth.isAuditor() ? `<button class="btn btn-icon btn-secondary btn-sm" data-action="edit-case" data-case-id="${c.id}" title="Edit"><i data-lucide="pencil"></i></button>` : ''}
                      ${Auth.isHead() ? `<button class="btn btn-icon btn-danger btn-sm" data-action="delete-case" data-case-id="${c.id}" title="Delete"><i data-lucide="trash-2"></i></button>` : ''}
                    </div>
                  </td>
                </tr>`;
              }
            })}
          </div>
          <div class="pagination" id="wbs-pagination"></div>
        </div>
      </div>`;
  },

  renderCharts() {
    const all      = DB.get('wbs_cases');
    let filtered = WBSPage.applyFilters(all);
    const f        = WBSPage.filters;

    // Status stacked
    const statuses = ['New','In Progress','Investigation','Closed','On Hold'];
    const total    = filtered.length || 1;
    Charts.stackedHbar('chart-wbs-status',
      ['Total WBS'],
      statuses.map((s, i) => ({
        label: s,
        data: [Math.round(filtered.filter(c=>c.status===s).length/total*100)],
        backgroundColor: [CHART_COLORS.cyan, CHART_COLORS.purple, CHART_COLORS.amber, CHART_COLORS.blue, '#64748b'][i] + 'cc',
        borderRadius: 4
      })));

    // Trend
    const months = Utils.buildMonthBuckets(filtered, 'reportDate', f.dateFrom, f.dateTo);
    Charts.line('chart-wbs-trend',
      months.map(m=>m.label),
      [{ label: 'WBS Report', data: months.map(m=>m.items.length),
         borderColor: CHART_COLORS.blue, backgroundColor: CHART_COLORS.blue+'20',
         pointBackgroundColor: CHART_COLORS.blue, borderWidth: 2, pointRadius: 4, tension: 0.3 }]);

    // Top 5 category
    const byCat = Utils.groupBy(filtered, 'category');
    const top5  = Object.entries(byCat).map(([k,v])=>({name:k,count:v.length}))
      .sort((a,b)=>b.count-a.count).slice(0,5);
    Charts.hbar('chart-wbs-top5',
      top5.map(c=>c.name),
      [{ label:'WBS Report', data:top5.map(c=>c.count),
         backgroundColor:CHART_COLORS.blue+'cc', borderRadius:4 }]);

    // Amount by level
    const levels = ['High','Medium','Low'];
    Charts.bar('chart-wbs-level',
      levels,
      [{ label:'Est. Fraud Amount', data:levels.map(l=>Utils.sum(filtered.filter(c=>c.severity===l),'estimatedFraud')),
         backgroundColor:[CHART_COLORS.red,CHART_COLORS.amber,CHART_COLORS.green].map(c=>c+'cc'), borderRadius:4 }],
      { plugins: { legend: { display: false } } });

    // Brand donut
    const brandG = Utils.groupBy(filtered, 'brand');
    Charts.donut('chart-wbs-brand',
      Object.keys(brandG),
      Object.values(brandG).map(v=>v.length),
      [CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.green, CHART_COLORS.purple]);

    // Pagination
    filtered = WBSPage.applyFilters(all);
    Components.renderPagination('wbs-pagination', WBSPage.page,
      Math.max(1, Math.ceil(filtered.length/WBSPage.perPage)),
      filtered.length,
      `(p) => { WBSPage.page = p; WBSPage.refresh(); }`);
    if (window.lucide) lucide.createIcons();
  },

  applyFilters(data) {
    const f = WBSPage.filters;
    let filtered = data.filter(c => {
      if (f.dateFrom && c.reportDate < f.dateFrom) return false;
      if (f.dateTo   && c.reportDate > f.dateTo)   return false;
      if (f.brand    && c.brand !== f.brand)        return false;
      if (f.outlet   && c.outletCode !== f.outlet)  return false;
      if (f.status   && c.status !== f.status)      return false;
      if (f.search) {
        const q = f.search.toLowerCase();
        if (!c.caseNo.toLowerCase().includes(q) &&
            !c.outletName.toLowerCase().includes(q) &&
            !(c.outletCode||'').toLowerCase().includes(q)) return false;
      }
      return true;
    });
    if (f.sortBy) { 
      filtered.sort((a,b) => Utils._cmpVal(a[f.sortBy], b[f.sortBy], f.sortDir || 'asc')); 
    }
    return filtered;
  },

  setFilter(k, v) { WBSPage.filters[k] = v; WBSPage.page = 1; WBSPage.refresh(); },
  setSort(column) { if (WBSPage.filters.sortBy===column) { WBSPage.filters.sortDir = WBSPage.filters.sortDir==='asc'?'desc':'asc'; } else { WBSPage.filters.sortBy = column; WBSPage.filters.sortDir = 'asc'; } WBSPage.refresh(); },

  refresh() {
    Charts.destroyAll();
    Utils.updateElementHtmlAndPreserveFocus('page-content', WBSPage.buildHtml());
    WBSPage.afterRender();
    WBSPage.renderCharts();
    if (window.lucide) lucide.createIcons();
  },

  afterRender() {
    PageLifecycle.delegate('page-content', {
      change: {
        '[data-filter="brand"]': (e, target) => this.setFilter('brand', target.value),
        '[data-filter="outlet"]': (e, target) => this.setFilter('outlet', target.value),
        '[data-filter="status"]': (e, target) => this.setFilter('status', target.value),
      },
      click: {
        '[data-action="view-linked-planning"]': (e, target) => this.viewLinkedPlanning(target.dataset.planningId),
        '[data-action="view-case"]': (e, target) => this.viewCase(target.dataset.caseId),
        '[data-action="edit-case"]': (e, target) => this.openEditModal(target.dataset.caseId),
        '[data-action="delete-case"]': (e, target) => this.deleteCase(target.dataset.caseId),
        '[data-action="view-linked-planning-detail"]': (e, target) => {
          const pid = target.dataset.planningId;
          Modal.close();
          Router.navigate('cases');
          setTimeout(() => CasesPage.viewPlanning(pid, 'planning'), 150);
        },
        '[data-action="create-planning-from-wbs"]': (e, target) => {
          const cid = target.dataset.caseId;
          Modal.close();
          this._createPlanningFromWbs(cid);
        },
        '[data-action="edit-wbs-from-view"]': (e, target) => {
          const cid = target.dataset.caseId;
          Modal.close();
          this.openEditModal(cid);
        },
        '[data-action="modal-close"]': () => Modal.close(),
        '[data-action="save-case"]': (e, target) => this.saveCase(target.dataset.caseId),
      }
    });
    PageLifecycle.on('wbs-search', 'input', (e) => this.setFilter('search', e.target.value));
    PageLifecycle.on('wbs-date-from', 'change', (e) => this.setFilter('dateFrom', e.target.value));
    PageLifecycle.on('wbs-date-to', 'change', (e) => this.setFilter('dateTo', e.target.value));
    PageLifecycle.delegate('page-content', {
      click: {
        '[data-action="dt-sort"]': (e, target) => this.setSort(target.dataset.key),
      }
    });
    const addBtn = document.getElementById('wbs-add-btn');
    if (addBtn) addBtn.addEventListener('click', () => this.openAddModal());
  },

  viewLinkedPlanning(planningId) {
    Router.navigate('cases');
    setTimeout(() => {
      CasesPage.viewPlanning(planningId, 'planning');
    }, 150);
  },

  viewCase(id) {
    const c = DB.find('wbs_cases', id);
    if (!c) return;
    const auditors = DB.get('auditors');
    const aud = auditors.find(a => a.id === c.assignedTo);

    // Check if an audit planning already linked
    const plannings = DB.get('audit_plannings');
    const linkedPlanning = c.linkedPlanningId ? plannings.find(p => p.id === c.linkedPlanningId) : null;

    let auditPlanHtml = '';
    if (linkedPlanning) {
      const results = DB.get('audit_results').filter(r => r.planningId === linkedPlanning.id);
      const actions = DB.get('audit_actions').filter(a => a.planningId === linkedPlanning.id);
      const openAct = actions.filter(a => a.status === 'Open').length;
      auditPlanHtml = `
        <div style="grid-column:1/-1;background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.2);padding:var(--space-4);border-radius:var(--radius-md)">
          <div style="font-size:11px;font-weight:700;color:var(--blue-light);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Linked Audit Assignment</div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text-primary)">${linkedPlanning.reportNo}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${results.length} temuan · ${openAct} open AAP · Status: ${linkedPlanning.status}</div>
            </div>
            <button class="btn btn-secondary btn-sm" data-action="view-linked-planning-detail" data-planning-id="${linkedPlanning.id}">
              <i data-lucide="eye"></i> Lihat Audit Planning
            </button>
          </div>
        </div>`;
    } else {
      auditPlanHtml = `
        <div style="grid-column:1/-1;background:rgba(245,158,11,0.04);border:1.5px dashed rgba(245,158,11,0.25);padding:var(--space-4);border-radius:var(--radius-md);text-align:center">
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:var(--space-3)">Belum ada Audit Planning untuk laporan WBS ini.</p>
          ${Auth.isAuditor() || Auth.isHead() ? `
          <button class="btn btn-primary btn-sm" data-action="create-planning-from-wbs" data-case-id="${c.id}">
            <i data-lucide="clipboard-list"></i> Buat Audit Planning
          </button>` : ''}
        </div>`;
    }

    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="megaphone"></i> ${c.caseNo}</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="detail-grid">
          <div class="detail-item"><div class="detail-label">Case No</div><div class="detail-value col-bold">${c.caseNo}</div></div>
          <div class="detail-item"><div class="detail-label">Report Date</div><div class="detail-value">${Utils.formatDate(c.reportDate)}</div></div>
          <div class="detail-item"><div class="detail-label">Category</div><div class="detail-value">${c.category}</div></div>
          <div class="detail-item"><div class="detail-label">Status</div><div class="detail-value">${Utils.statusBadge(c.status)}</div></div>
          <div class="detail-item"><div class="detail-label">Outlet</div><div class="detail-value"><span class="col-mono">${c.outletCode}</span> ${c.outletName}</div></div>
          <div class="detail-item"><div class="detail-label">Brand</div><div class="detail-value">${c.brand}</div></div>
          <div class="detail-item"><div class="detail-label">Province</div><div class="detail-value">${c.province}</div></div>
          <div class="detail-item"><div class="detail-label">Severity</div><div class="detail-value">${Utils.severityBadge(c.severity)}</div></div>
          <div class="detail-item"><div class="detail-label">Estimated Fraud</div><div class="detail-value text-amber font-bold">${Utils.formatIDRFull(c.estimatedFraud)}</div></div>
          <div class="detail-item"><div class="detail-label">Assigned To</div><div class="detail-value">${aud ? aud.name : '-'}</div></div>
          <div class="detail-item"><div class="detail-label">Resolved Date</div><div class="detail-value">${Utils.formatDate(c.resolvedDate)}</div></div>
          <div class="detail-item"></div>
          ${auditPlanHtml}
        </div>
        ${c.description ? `<div class="divider"></div><div class="detail-label" style="font-weight:600;font-size:12px">Deskripsi Laporan</div><p style="margin-top:6px;font-size:13px;color:var(--text-secondary)">${c.description}</p>` : ''}
        ${c.initialIndication ? `<div class="divider"></div><div class="detail-label" style="font-weight:600;font-size:12px;color:var(--amber-primary)">Indikasi Awal</div><p style="margin-top:6px;font-size:13px;color:var(--text-secondary);background:rgba(245,158,11,0.05);padding:10px;border-radius:6px;border:1px solid rgba(245,158,11,0.15)">${c.initialIndication}</p>` : ''}
        ${c.notes ? `<div class="divider"></div><div class="detail-label" style="font-weight:600;font-size:12px">Catatan</div><p style="margin-top:6px;font-size:13px;color:var(--text-secondary)">${c.notes}</p>` : ''}
      </div>
      <div class="modal-footer">
        ${Auth.isAuditor() || Auth.isHead() ? `<button class="btn btn-secondary" data-action="edit-wbs-from-view" data-case-id="${c.id}"><i data-lucide="pencil"></i> Edit WBS</button>` : ''}
        <button class="btn btn-secondary" data-action="modal-close">Tutup</button>
      </div>`, 'modal-lg');
    if (window.lucide) lucide.createIcons();
  },

  _createPlanningFromWbs(wbsId) {
    // Navigate to cases and open planning modal pre-filled with WBS trigger
    Router.navigate('cases');
    setTimeout(() => {
      CasesPage.openPlanningModal(null);
      setTimeout(() => {
        const trigSel = document.getElementById('pf-trigger');
        if (trigSel) { trigSel.value = 'WBS'; CasesPage._toggleTriggerRef(); }
        const wbsSel = document.getElementById('pf-wbsref');
        if (wbsSel) wbsSel.value = wbsId;
      }, 100);
    }, 200);
  },

  openAddModal() { WBSPage._openCaseModal(null); },
  openEditModal(id) { WBSPage._openCaseModal(DB.find('wbs_cases', id)); },

  _openCaseModal(c) {
    const isEdit = !!c;
    const auditors = DB.get('auditors').filter(a => a.status === 'active');
    const brands = DB.get('brands');
    const cats = DB.get('fraud_categories');
    const provinces = DB.get('provinces');
    const outlets = DB.get('outlets');
    const activeOutlets = c?.brand ? outlets.filter(o => o.brand === c.brand) : outlets;

    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="megaphone"></i> ${isEdit ? 'Edit' : 'Add New'} WBS Case</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-grid form-grid-2">
          <div class="form-group">
            <label class="form-label required">Case No</label>
            <input type="text" class="form-control" id="wf-caseno" value="${Utils.escapeHtml(c?.caseNo||WBSPage._genCaseNo())}" />
          </div>
          <div class="form-group">
            <label class="form-label required">Report Date</label>
            <input type="date" class="form-control" id="wf-date" value="${Utils.formatDateInput(c?.reportDate||new Date().toISOString())}" />
          </div>
          <div class="form-group">
            <label class="form-label required">Category</label>
            <select class="form-control" id="wf-cat">
              ${cats.map(cat=>`<option value="${cat.name}" ${c?.category===cat.name?'selected':''}>${cat.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Brand</label>
            <select class="form-control" id="wf-brand" onchange="WBSPage._fillOutlets()">
              <option value="">— Pilih Brand —</option>
              ${brands.map(b=>`<option value="${b.id}" ${c?.brand===b.id?'selected':''}>${b.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Outlet</label>
            <select class="form-control" id="wf-outlet">
              <option value="">— Pilih Outlet —</option>
              ${activeOutlets.map(o=>`<option value="${o.code}|${o.name}|${o.province}" ${c?.outletCode===o.code?'selected':''}>${o.code} — ${o.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Outlet Name</label>
            <input type="text" class="form-control" id="wf-outletname" value="${Utils.escapeHtml(c?.outletName||'')}" readonly />
          </div>
          <div class="form-group">
            <label class="form-label required">Province</label>
            <input type="text" class="form-control" id="wf-prov" value="${Utils.escapeHtml(c?.province||'')}" readonly />
          </div>
          <div class="form-group">
            <label class="form-label required">Severity</label>
            <select class="form-control" id="wf-sev">
              ${['High','Medium','Low'].map(s=>`<option value="${s}" ${c?.severity===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Status</label>
            <select class="form-control" id="wf-status">
              ${['New','Investigation','In Progress','On Hold','Closed'].map(s=>`<option value="${s}" ${c?.status===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Estimated Fraud (IDR)</label>
            <input type="text" class="form-control" id="wf-fraud" inputmode="numeric" value="${c?.estimatedFraud?Number(c.estimatedFraud).toLocaleString('en-US'):'0'}" oninput="Utils.formatNumberInput(this)" />
          </div>
          <div class="form-group">
            <label class="form-label">Assigned To</label>
            <select class="form-control" id="wf-assign">
              <option value="">-- Select Auditor --</option>
              ${auditors.map(a=>`<option value="${a.id}" ${c?.assignedTo===a.id?'selected':''}>${a.name} (${a.department})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Resolved Date</label>
            <input type="date" class="form-control" id="wf-resolved" value="${Utils.formatDateInput(c?.resolvedDate)}" />
          </div>
        </div>
        <div class="form-group mt-4">
          <label class="form-label">Description</label>
          <textarea class="form-control" id="wf-desc" rows="2">${Utils.escapeHtml(c?.description||'')}</textarea>
        </div>
        <div class="form-group mt-4">
          <label class="form-label">Notes</label>
          <textarea class="form-control" id="wf-notes" rows="2">${Utils.escapeHtml(c?.notes||'')}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="modal-close">Cancel</button>
        <button class="btn btn-primary" data-action="save-case" data-case-id="${c?.id||''}">
          <i data-lucide="save"></i> ${isEdit ? 'Update' : 'Save'} Case
        </button>
      </div>`, 'modal-lg');
    if (window.lucide) lucide.createIcons();
    document.getElementById('wf-outlet')?.addEventListener('change', function() {
      const parts = this.value.split('|');
      const nameInput = document.getElementById('wf-outletname');
      const provInput = document.getElementById('wf-prov');
      if (nameInput) nameInput.value = parts[1] || '';
      if (provInput) provInput.value = parts[2] || '';
    });
  },

  _fillOutlets() {
    const brand   = document.getElementById('wf-brand')?.value;
    const outlets = DB.get('outlets').filter(o => !brand || o.brand === brand);
    const sel     = document.getElementById('wf-outlet');
    if (!sel) return;
    sel.innerHTML = `<option value="">— Pilih Outlet —</option>` +
      outlets.map(o => `<option value="${o.code}|${o.name}|${o.province}">${o.code} — ${o.name}</option>`).join('');
    
    const nameInput = document.getElementById('wf-outletname');
    const provInput = document.getElementById('wf-prov');
    if (nameInput) nameInput.value = '';
    if (provInput) provInput.value = '';
  },

  _genCaseNo() {
    const all = DB.get('wbs_cases');
    return `WBS-${new Date().getFullYear()}-${String(all.length + 1).padStart(3,'0')}`;
  },

  saveCase(id) {
    const outletVal = document.getElementById('wf-outlet')?.value || '';
    const parts = outletVal.split('|');
    const outletCode = parts[0] || '';
    const outletName = parts[1] || '';

    const data = {
      caseNo:        document.getElementById('wf-caseno').value,
      reportDate:    document.getElementById('wf-date').value,
      category:      document.getElementById('wf-cat').value,
      brand:         document.getElementById('wf-brand').value,
      outletCode:    outletCode,
      outletName:    outletName,
      province:      document.getElementById('wf-prov').value,
      severity:      document.getElementById('wf-sev').value,
      status:        document.getElementById('wf-status').value,
      estimatedFraud:Utils.parseFormattedNumber(document.getElementById('wf-fraud').value),
      assignedTo:    document.getElementById('wf-assign').value,
      resolvedDate:  document.getElementById('wf-resolved').value || null,
      description:   document.getElementById('wf-desc').value,
      notes:         document.getElementById('wf-notes').value,
    };
    if (!data.caseNo || !data.reportDate || !data.outletCode) {
      Toast.error('Please fill all required fields.'); return;
    }
    if (id) { DB.update('wbs_cases', id, data); Toast.success('WBS case updated.'); }
    else     { DB.insert('wbs_cases', data);     Toast.success('WBS case added.'); }
    Modal.close();
    WBSPage.refresh();
  },

  deleteCase(id) {
    Modal.confirm('Delete WBS Case', 'This action cannot be undone. Delete this case?', () => {
      const pl = DB.get('audit_plannings').find(p => p.trigger === 'WBS' && p.triggerRef === id);
      if (pl) {
        DB.update('audit_plannings', pl.id, { trigger: 'Direct', triggerRef: null });
      }
      DB.delete('wbs_cases', id);
      Toast.success('WBS case deleted.');
      WBSPage.refresh();
    });
  }
};

window.WBSPage = WBSPage;
