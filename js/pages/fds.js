/* ============================================================
   FDS (FRAUD DETECTION SYSTEM) PAGE
   ============================================================ */

const FDSPage = {
  page: 1,
  perPage: 10,
  filters: { dateFrom: '', dateTo: '', brand: '', outlet: '', status: '', search: '', sortBy: '', sortDir: 'asc' },

  render() {
    if (!Auth.requireAuth()) return;
    Components.renderAppShell(
      'FDS Overview',
      'Fraud Detection System — Case Monitoring',
      FDSPage.buildHtml(),
      'fds'
    );
    FDSPage._pageWired = false;
    FDSPage.afterRender();
    FDSPage.renderCharts();
  },

  buildHtml() {
    const all      = DB.get('fds_cases');
    const filtered = FDSPage.applyFilters(all);
    const brands   = DB.get('brands');

    const total       = filtered.length;
    const planned     = filtered.filter(c => c.status === 'Planned').length;
    const invest      = filtered.filter(c => c.status === 'Investigation').length;
    const inProgress  = filtered.filter(c => c.status === 'In Progress').length;
    const closed      = filtered.filter(c => c.status === 'Closed').length;
    const hold        = filtered.filter(c => c.status === 'Hold').length;
    const cancel      = filtered.filter(c => c.status === 'Cancelled').length;
    const completion  = total ? Utils.pct(closed, total) : 0;

    const paged = filtered.slice((FDSPage.page-1)*FDSPage.perPage, FDSPage.page*FDSPage.perPage);

    return `
      <!-- KPI Strip -->
      <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:var(--space-3)">
        ${Components.kpiCard('Total FDS', total, '', 'scan-search', 'blue')}
        ${Components.kpiCard('Planned', planned, '', 'calendar', 'cyan')}
        ${Components.kpiCard('Investigation', invest, '', 'search', 'amber')}
        ${Components.kpiCard('In Progress', inProgress, '', 'file-text', 'purple')}
        ${Components.kpiCard('Closed', closed, '', 'check-circle', 'green')}
        ${Components.kpiCard('Hold', hold, '', 'pause-circle', 'gray')}
        ${Components.kpiCard('Cancel', cancel, '', 'x-circle', 'red')}
        ${Components.kpiCard('% Completion', completion+'%', '', 'percent', completion>=50?'green':'amber')}
      </div>

      <!-- Charts Row 1 -->
      <div class="charts-grid" style="grid-template-columns:1fr 1fr">
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="align-left"></i> FDS Status Distribution</div></div>
          <div class="card-body"><div class="chart-wrapper"><canvas id="chart-fds-status"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="bar-chart-horizontal"></i> Top Detection by Category</div></div>
          <div class="card-body"><div class="chart-wrapper"><canvas id="chart-fds-top5"></canvas></div></div>
        </div>
      </div>

      <!-- Charts Row 2 -->
      <div class="charts-grid charts-grid-3">
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="bar-chart"></i> Amount by Category</div></div>
          <div class="card-body"><div class="chart-wrapper"><canvas id="chart-fds-amount"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="pie-chart"></i> Brand Detection</div></div>
          <div class="card-body"><div class="chart-wrapper"><canvas id="chart-fds-brand"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="activity"></i> Trend FDS Detection</div></div>
          <div class="card-body"><div class="chart-wrapper"><canvas id="chart-fds-trend"></canvas></div></div>
        </div>
      </div>

      <!-- Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="list"></i> FDS Cases Progress</div>
          ${Auth.isAuditor() ? `<button class="btn btn-primary btn-sm" id="fds-add-btn"><i data-lucide="plus"></i> Add FDS Case</button>` : ''}
        </div>
        <div class="card-body" style="padding-top:0">
          <div class="filter-bar" style="margin-bottom:var(--space-3)">
            <div class="search-input-wrapper">
              <i data-lucide="search"></i>
              <input type="text" class="form-control search-input" id="fds-search" placeholder="Search…" value="${FDSPage.filters.search}" />
            </div>
            <input type="date" class="form-control" id="fds-date-from" value="${FDSPage.filters.dateFrom}" />
            <span style="color:var(--text-muted);font-size:12px">to</span>
            <input type="date" class="form-control" id="fds-date-to" value="${FDSPage.filters.dateTo}" />
            <select class="form-control" data-filter="brand">
              <option value="">All Brands</option>
              ${brands.map(b=>`<option value="${b.id}" ${FDSPage.filters.brand===b.id?'selected':''}>${b.name}</option>`).join('')}
            </select>
            <select class="form-control" data-filter="outlet">
              <option value="">All Outlets</option>
              ${(() => {
                const brandFilter = FDSPage.filters.brand;
                const outletList = brandFilter ? DB.get('outlets').filter(o => o.brand === brandFilter) : DB.get('outlets');
                return outletList.map(o => `<option value="${o.code}" ${FDSPage.filters.outlet===o.code?'selected':''}>${o.code} — ${o.name}</option>`).join('');
              })()}
            </select>
            <select class="form-control" data-filter="status">
              <option value="">All Status</option>
              ${['Planned','Investigation','In Progress','Closed','Hold','Cancelled'].map(s=>`<option value="${s}" ${FDSPage.filters.status===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="data-table-wrapper">
            ${DataTable.render({
              columns: [
                { key: 'caseNo', label: 'Case No.' },
                { key: 'detectionDate', label: 'Detection Date' },
                { key: 'category', label: 'Category' },
                { key: 'outletCode', label: 'Outlet' },
                { key: 'brand', label: 'Brand' },
                { key: 'province', label: 'Province' },
                { key: 'estimatedFraud', label: 'Est. Fraud' },
                { key: 'status', label: 'Status' },
                { key: 'auditReport', label: 'Audit Report', sortable: false },
                { key: 'actions', label: 'Actions', sortable: false },
              ],
              data: paged,
              sort: { key: FDSPage.filters.sortBy, dir: FDSPage.filters.sortDir, onChange: 'FDSPage.setSort' },
              emptyMessage: 'No FDS cases found',
              buildRow: (c, index) => `<tr>
                <td class="col-bold">${Utils.escapeHtml(c.caseNo)}</td>
                <td>${Utils.formatDate(c.detectionDate)}</td>
                <td>${Utils.escapeHtml(c.category)}</td>
                <td><span class="col-mono">${Utils.escapeHtml(c.outletCode)}</span> ${Utils.escapeHtml(c.outletName)}</td>
                <td>${Utils.statusBadge(c.brand)}</td>
                <td style="font-size:11px">${Utils.escapeHtml(c.province)}</td>
                <td class="text-amber font-bold">Rp ${Utils.formatIDR(c.estimatedFraud)}</td>
                <td>${Utils.statusBadge(c.status)}</td>
                <td>${(() => {
                  const pl = c.linkedPlanningId ? DB.find('audit_plannings', c.linkedPlanningId) : null;
                  if (!pl) return '<span class="text-muted" style="font-size:11px">Belum Dibuat</span>';
                  const aapStatus = AuditMetrics.getActionPlanStatus(pl.id);
                  return `
                    <div style="font-size:11px;line-height:1.3">
                      <a href="javascript:void(0)" data-action="view-linked-planning" data-planning-id="${pl.id}" style="font-weight:600;color:var(--blue-light);display:block">${Utils.escapeHtml(pl.reportNo)}</a>
                      <div style="margin-top:2px;display:flex;gap:4px;flex-wrap:wrap">
                        ${Utils.laporanBadge(pl.status)}
                        ${Utils.aapStatusBadge(aapStatus)}
                      </div>
                    </div>
                  `;
                })()}</td>
                <td>
                  <div class="flex gap-2">
                    <button class="btn btn-icon btn-secondary btn-sm" data-action="view-case" data-case-id="${c.id}" title="View"><i data-lucide="eye"></i></button>
                    ${Auth.isAuditor() ? `<button class="btn btn-icon btn-secondary btn-sm" data-action="edit-case" data-case-id="${c.id}" title="Edit"><i data-lucide="pencil"></i></button>` : ''}
                    ${Auth.isHead() ? `<button class="btn btn-icon btn-danger btn-sm" data-action="delete-case" data-case-id="${c.id}" title="Delete"><i data-lucide="trash-2"></i></button>` : ''}
                  </div>
                </td>
              </tr>`,
            })}
          </div>
          <div class="pagination" id="fds-pagination"></div>
        </div>
      </div>`;
  },

  renderCharts() {
    const all      = DB.get('fds_cases');
    let filtered = FDSPage.applyFilters(all);
    const f        = FDSPage.filters;

    // Status stacked
    const statuses = ['Hold','Closed','Planned'];
    const total    = filtered.length || 1;
    Charts.stackedHbar('chart-fds-status',
      ['Total FDS'],
      statuses.map((s,i) => ({
        label: s,
        data: [Math.round(filtered.filter(c=>c.status===s).length/total*100)],
        backgroundColor: [CHART_COLORS.amber, CHART_COLORS.blue, CHART_COLORS.purple][i] + 'cc',
        borderRadius: 4
      })));

    // Top 5 by category
    const byCat = Utils.groupBy(filtered, 'category');
    const catList = Object.entries(byCat).map(([k,v])=>({name:k,count:v.length}))
      .sort((a,b)=>b.count-a.count).slice(0,5);
    Charts.hbar('chart-fds-top5',
      catList.map(c=>c.name),
      [{ label:'Count', data:catList.map(c=>c.count), backgroundColor:CHART_COLORS.blue+'cc', borderRadius:4 }]);

    // Amount by category
    Charts.bar('chart-fds-amount',
      catList.map(c=>c.name),
      [{ label:'Est. Fraud Amount', data:catList.map(c=>Utils.sum(byCat[c.name],'estimatedFraud')),
         backgroundColor:CHART_COLORS.blue+'cc', borderRadius:4 }],
      { plugins: { legend: { display: false } } });

    // Brand donut
    const brandG = Utils.groupBy(filtered, 'brand');
    Charts.donut('chart-fds-brand',
      Object.keys(brandG),
      Object.values(brandG).map(v=>v.length),
      [CHART_COLORS.amber, CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.purple]);

    // Trend
    const months = Utils.buildMonthBuckets(filtered, 'detectionDate', f.dateFrom, f.dateTo);
    Charts.bar('chart-fds-trend',
      months.map(m=>m.label),
      [{ label:'Total Detection', data:months.map(m=>m.items.length),
         backgroundColor:CHART_COLORS.blue+'cc', borderRadius:4 }],
      { plugins: { legend: { display: false } },
        scales: { y: { ticks: { precision: 0, callback: v=>v } } } });

    // Pagination
    filtered = FDSPage.applyFilters(all);
    Components.renderPagination('fds-pagination', FDSPage.page,
      Math.max(1, Math.ceil(filtered.length/FDSPage.perPage)),
      filtered.length,
      `FDSPage.page = page; FDSPage.refresh();`);
    if (window.lucide) lucide.createIcons();
  },

  applyFilters(data) {
    const f = FDSPage.filters;
    let filtered = data.filter(c => {
      if (f.dateFrom && c.detectionDate < f.dateFrom) return false;
      if (f.dateTo   && c.detectionDate > f.dateTo)   return false;
      if (f.brand  && c.brand  !== f.brand)  return false;
      if (f.outlet && c.outletCode !== f.outlet) return false;
      if (f.status && c.status !== f.status)  return false;
      if (f.search) {
        const q = f.search.toLowerCase();
        if (!c.caseNo.toLowerCase().includes(q) && !(c.outletName||'').toLowerCase().includes(q) &&
            !(c.outletCode||'').toLowerCase().includes(q)) return false;
      }
      return true;
    });
    if (f.sortBy) {
      filtered.sort((a, b) => Utils._cmpVal(a[f.sortBy], b[f.sortBy], f.sortDir || 'asc'));
    }
    return filtered;
  },

  setFilter(k,v) { FDSPage.filters[k]=v; FDSPage.page=1; FDSPage.refresh(); },
  setSort(col) { if (FDSPage.filters.sortBy===col) { FDSPage.filters.sortDir=FDSPage.filters.sortDir==='asc'?'desc':'asc'; } else { FDSPage.filters.sortBy=col; FDSPage.filters.sortDir='asc'; } FDSPage.refresh(); },

  refresh() {
    Charts.destroyAll();
    Utils.updateElementHtmlAndPreserveFocus('page-content', FDSPage.buildHtml());
    FDSPage.afterRender();
    FDSPage.renderCharts();
    if (window.lucide) lucide.createIcons();
  },

  afterRender() {
    if (!FDSPage._pageWired) {
      FDSPage._pageWired = true;
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
          '[data-action="dt-sort"]': (e, target) => this.setSort(target.dataset.key),
          '#fds-add-btn': () => this.openAddModal(),
        }
      });
    }
    PageLifecycle.on('fds-search', 'input', (e) => this.setFilter('search', e.target.value));
    PageLifecycle.on('fds-date-from', 'change', (e) => this.setFilter('dateFrom', e.target.value));
    PageLifecycle.on('fds-date-to', 'change', (e) => this.setFilter('dateTo', e.target.value));
    if (!FDSPage._modalWired) {
      FDSPage._modalWired = true;
      PageLifecycle.delegate('modal-overlay', {
        click: {
          '[data-action="save-case"]': (e, target) => FDSPage.saveCase(target.dataset.caseId),
          '[data-action="view-linked-planning-detail"]': (e, target) => {
            const pid = target.dataset.planningId;
            Modal.close();
            Router.navigate('cases');
            setTimeout(() => CasesPage.viewPlanning(pid, 'planning'), 150);
          },
          '[data-action="create-planning-from-fds"]': (e, target) => {
            const cid = target.dataset.caseId;
            Modal.close();
            FDSPage._createPlanningFromFds(cid);
          },
          '[data-action="edit-fds-from-view"]': (e, target) => {
            const cid = target.dataset.caseId;
            Modal.close();
            FDSPage.openEditModal(cid);
          },
          '[data-action="modal-close"]': () => Modal.close(),
        },
        change: {
          '#ff-brand': (e, target) => FDSPage._fillOutlets(),
          '#ff-outlet': (e, target) => {
            const code = target.value.split(' — ')[0].trim();
            const outlet = DB.get('outlets').find(o => o.code === code);
            const ni = document.getElementById('ff-outletname');
            const pi = document.getElementById('ff-prov');
            if (outlet) {
              if (ni) ni.value = outlet.name || '';
              if (pi) pi.value = outlet.province || '';
            } else {
              if (ni) ni.value = '';
              if (pi) pi.value = '';
            }
          },
        },
        input: {
          '#ff-fraud': (e, target) => Utils.formatNumberInput(target),
        }
      });
    }
  },

  viewLinkedPlanning(planningId) {
    Router.navigate('cases');
    setTimeout(() => {
      CasesPage.viewPlanning(planningId, 'planning');
    }, 150);
  },

  viewCase(id) {
    const c = DB.find('fds_cases', id);
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
        <div style="grid-column:1/-1;background:rgba(6,182,212,0.05);border:1px solid rgba(6,182,212,0.2);padding:var(--space-4);border-radius:var(--radius-md)">
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
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:var(--space-3)">Belum ada Audit Planning untuk alert FDS ini.</p>
          ${Auth.isAuditor() || Auth.isHead() ? `
          <button class="btn btn-primary btn-sm" data-action="create-planning-from-fds" data-case-id="${c.id}">
            <i data-lucide="clipboard-list"></i> Buat Audit Planning
          </button>` : ''}
        </div>`;
    }

    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="scan-search"></i> ${c.caseNo}</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="detail-grid">
          <div class="detail-item"><div class="detail-label">Case No</div><div class="detail-value col-bold">${c.caseNo}</div></div>
          <div class="detail-item"><div class="detail-label">Detection Date</div><div class="detail-value">${Utils.formatDate(c.detectionDate)}</div></div>
          <div class="detail-item"><div class="detail-label">Category</div><div class="detail-value">${c.category}</div></div>
          <div class="detail-item"><div class="detail-label">Status</div><div class="detail-value">${Utils.statusBadge(c.status)}</div></div>
          <div class="detail-item"><div class="detail-label">Outlet</div><div class="detail-value"><span class="col-mono">${c.outletCode}</span> ${c.outletName}</div></div>
          <div class="detail-item"><div class="detail-label">Brand</div><div class="detail-value">${c.brand}</div></div>
          <div class="detail-item"><div class="detail-label">Province</div><div class="detail-value">${c.province}</div></div>
          <div class="detail-item"><div class="detail-label">Estimated Fraud</div><div class="detail-value text-amber font-bold">${Utils.formatIDRFull(c.estimatedFraud)}</div></div>
          <div class="detail-item"><div class="detail-label">Assigned To</div><div class="detail-value">${aud ? aud.name : '-'}</div></div>
          <div class="detail-item"></div>
          ${auditPlanHtml}
        </div>
        ${c.description ? `<div class="divider"></div><div class="detail-label" style="font-weight:600;font-size:12px">Deskripsi Deteksi</div><p style="margin-top:6px;font-size:13px;color:var(--text-secondary)">${c.description}</p>` : ''}
        ${c.notes ? `<div class="divider"></div><div class="detail-label" style="font-weight:600;font-size:12px">Catatan</div><p style="margin-top:6px;font-size:13px;color:var(--text-secondary)">${c.notes}</p>` : ''}
      </div>
      <div class="modal-footer">
        ${Auth.isAuditor() || Auth.isHead() ? `<button class="btn btn-secondary" data-action="edit-fds-from-view" data-case-id="${c.id}"><i data-lucide="pencil"></i> Edit FDS</button>` : ''}
        <button class="btn btn-secondary" data-action="modal-close">Tutup</button>
      </div>`, 'modal-lg');
    if (window.lucide) lucide.createIcons();
  },

  _createPlanningFromFds(fdsId) {
    Router.navigate('cases');
    setTimeout(() => {
      CasesPage.openPlanningModal(null);
      setTimeout(() => {
        const trigSel = document.getElementById('pf-trigger');
        if (trigSel) { trigSel.value = 'FDS'; CasesPage._toggleTriggerRef(); }
        const fdsSel = document.getElementById('pf-fdsref');
        if (fdsSel) fdsSel.value = fdsId;
      }, 100);
    }, 200);
  },

  openAddModal() { FDSPage._openModal(null); },
  openEditModal(id) { FDSPage._openModal(DB.find('fds_cases', id)); },

  _openModal(c) {
    const isEdit = !!c;
    const auditors = DB.get('auditors').filter(a => a.status === 'active');
    const brands = DB.get('brands');
    const cats = DB.get('fraud_categories');
    const provinces = DB.get('provinces');
    const outlets = DB.get('outlets');
    const activeOutlets = c?.brand ? outlets.filter(o => o.brand === c.brand) : outlets;
    const editOutlet = c?.outletCode ? outlets.find(o => o.code === c.outletCode) : null;
    const outletDisplay = editOutlet ? `${editOutlet.code} — ${editOutlet.name}` : '';

    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="scan-search"></i> ${isEdit ? 'Edit' : 'Add New'} FDS Case</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-grid form-grid-2">
          <div class="form-group">
            <label class="form-label required">Case No</label>
            <input type="text" class="form-control" id="ff-caseno" value="${Utils.escapeHtml(c?.caseNo||FDSPage._genCaseNo())}" />
          </div>
          <div class="form-group">
            <label class="form-label required">Detection Date</label>
            <input type="date" class="form-control" id="ff-date" value="${Utils.formatDateInput(c?.detectionDate||new Date().toISOString())}" />
          </div>
          <div class="form-group">
            <label class="form-label required">Category</label>
            <select class="form-control" id="ff-cat">
              ${cats.map(cat=>`<option value="${cat.name}" ${c?.category===cat.name?'selected':''}>${cat.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Brand</label>
            <select class="form-control" id="ff-brand" data-action="fds-fill-outlets">
              <option value="">— Pilih Brand —</option>
              ${brands.map(b=>`<option value="${b.id}" ${c?.brand===b.id?'selected':''}>${b.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Outlet</label>
            <input type="text" class="form-control" id="ff-outlet" list="ff-outlet-datalist" autocomplete="off" placeholder="Ketik kode/nama outlet..." value="${Utils.escapeHtml(outletDisplay)}">
            <datalist id="ff-outlet-datalist">
              ${activeOutlets.map(o => `<option value="${o.code} — ${o.name}">`).join('')}
            </datalist>
          </div>
          <div class="form-group">
            <label class="form-label required">Outlet Name</label>
            <input type="text" class="form-control" id="ff-outletname" value="${Utils.escapeHtml(c?.outletName||'')}" readonly />
          </div>
          <div class="form-group">
            <label class="form-label required">Province</label>
            <input type="text" class="form-control" id="ff-prov" value="${Utils.escapeHtml(c?.province||'')}" readonly />
          </div>
          <div class="form-group">
            <label class="form-label required">Status</label>
            <select class="form-control" id="ff-status">
              ${['Planned','Investigation','In Progress','Hold','Closed','Cancelled'].map(s=>`<option value="${s}" ${c?.status===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Estimated Fraud (IDR)</label>
            <input type="text" class="form-control" id="ff-fraud" inputmode="numeric" value="${c?.estimatedFraud?Number(c.estimatedFraud).toLocaleString('en-US'):'0'}" data-action="fds-format-fraud" />
          </div>
          <div class="form-group">
            <label class="form-label">Assigned To</label>
            <select class="form-control" id="ff-assign">
              <option value="">-- Select Auditor --</option>
              ${auditors.map(a=>`<option value="${a.id}" ${c?.assignedTo===a.id?'selected':''}>${a.name} (${a.department})</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group mt-4">
          <label class="form-label">Description</label>
          <textarea class="form-control" id="ff-desc" rows="2">${Utils.escapeHtml(c?.description||'')}</textarea>
        </div>
        <div class="form-group mt-4">
          <label class="form-label">Notes</label>
          <textarea class="form-control" id="ff-notes" rows="2">${Utils.escapeHtml(c?.notes||'')}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="modal-close">Cancel</button>
        <button class="btn btn-primary" data-action="save-case" data-case-id="${c?.id||''}">
          <i data-lucide="save"></i> ${isEdit ? 'Update' : 'Save'} Case
        </button>
      </div>`, 'modal-lg');
    if (window.lucide) lucide.createIcons();
  },

  _fillOutlets() {
    const brand   = document.getElementById('ff-brand')?.value;
    const outlets = DB.get('outlets').filter(o => !brand || o.brand === brand);
    const list    = document.getElementById('ff-outlet-datalist');
    const input   = document.getElementById('ff-outlet');
    if (!list) return;
    list.innerHTML = outlets.map(o => `<option value="${o.code} — ${o.name}">`).join('');
    if (input) input.value = '';
    const nameInput = document.getElementById('ff-outletname');
    const provInput = document.getElementById('ff-prov');
    if (nameInput) nameInput.value = '';
    if (provInput) provInput.value = '';
  },

  _genCaseNo() {
    const all = DB.get('fds_cases');
    return `FDS-${new Date().getFullYear()}-${String(all.length + 1).padStart(3,'0')}`;
  },

  saveCase(id) {
    const outletVal = document.getElementById('ff-outlet')?.value || '';
    const outletCode = outletVal.split(' — ')[0].trim();
    const outletName = outletVal.includes(' — ') ? outletVal.split(' — ').slice(1).join(' — ') : '';

    const data = {
      caseNo:        document.getElementById('ff-caseno').value,
      detectionDate: document.getElementById('ff-date').value,
      category:      document.getElementById('ff-cat').value,
      brand:         document.getElementById('ff-brand').value,
      outletCode:    outletCode,
      outletName:    outletName,
      province:      document.getElementById('ff-prov').value,
      status:        document.getElementById('ff-status').value,
      estimatedFraud:Utils.parseFormattedNumber(document.getElementById('ff-fraud').value),
      assignedTo:    document.getElementById('ff-assign').value,
      description:   document.getElementById('ff-desc').value,
      notes:         document.getElementById('ff-notes').value,
    };
    if (!data.caseNo || !data.detectionDate) { Toast.error('Fill required fields.'); return; }
    if (id) { DB.update('fds_cases', id, data); Toast.success('FDS case updated.'); }
    else     { DB.insert('fds_cases', data);     Toast.success('FDS case added.'); }
    Modal.close();
    FDSPage.refresh();
  },

  deleteCase(id) {
    Modal.confirm('Delete FDS Case', 'This cannot be undone. Delete this case?', () => {
      const pl = DB.get('audit_plannings').find(p => p.trigger === 'FDS' && p.triggerRef === id);
      if (pl) {
        DB.update('audit_plannings', pl.id, { trigger: 'Direct', triggerRef: null });
      }
      DB.delete('fds_cases', id);
      Toast.success('FDS case deleted.');
      FDSPage.refresh();
    });
  }
};

window.FDSPage = FDSPage;
