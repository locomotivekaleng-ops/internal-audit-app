/* ============================================================
   EXECUTIVE DASHBOARD PAGE — v3 Relational Model
   Pulls KPIs from audit_plannings, audit_results, audit_actions
   ============================================================ */

const DashboardPage = {
  filters: {
    dateFrom: '',
    dateTo:   '',
    department: '',
    brand: '',
    province: '',
    auditor: '',
    trigger: '',
    nature: '',
  },

  render() {
    if (!Auth.requireAuth()) return;
    Components.renderAppShell(
      'Executive Dashboard',
      'Internal Audit — Executive Summary',
      DashboardPage.buildHtml(),
      'dashboard'
    );
    DashboardPage._pageWired = false;
    DashboardPage.afterRender();
    DashboardPage.renderCharts();
  },

  buildHtml() {
    // Relational data
    const plannings = DB.get('audit_plannings');
    const results   = DB.get('audit_results');
    const actions   = DB.get('audit_actions');
    const wbs       = DB.get('wbs_cases');
    const fds       = DB.get('fds_cases');
    const brands    = DB.get('brands');
    const provinces = DB.get('provinces');
    const depts     = DB.get('departments');

    const f = DashboardPage.filters;

    // Filtered plannings
    const filteredPlans = DashboardPage.applyPlanningFilters(plannings);
    const planIds       = new Set(filteredPlans.map(p => p.id));

    // Filtered results (join to filtered plannings + nature filter)
    const filteredResults  = results.filter(r => {
      if (!planIds.has(r.planningId)) return false;
      if (f.nature) {
        if (f.nature === 'Fraud' && r.nature === 'Administrative') return false;
        if (f.nature === 'Administrative' && (!r.nature || r.nature !== 'Administrative')) return false;
      }
      return true;
    });
    const filteredResultIds = new Set(filteredResults.map(r => r.id));
    const filteredActions  = actions.filter(a => planIds.has(a.planningId) && filteredResultIds.has(a.resultId));

    // WBS & FDS filtered
    const wbsFiltered = DashboardPage.applyWbsFilters(wbs);
    const fdsFiltered = DashboardPage.applyFdsFilters(fds);

    // ---- Planning KPIs ----
    const totalPlannings    = filteredPlans.length;
    const completedPlans    = filteredPlans.filter(p => p.status === 'Completed').length;
    const inProgressPlans   = filteredPlans.filter(p => p.status === 'In Progress').length;
    const achievement       = totalPlannings ? Utils.pct(completedPlans, totalPlannings) : 0;

    // ---- WBS KPIs ----
    const wbsTotal    = wbsFiltered.length;
    const wbsClosed   = wbsFiltered.filter(c => c.status === 'Closed').length;
    const wbsOnHold   = wbsFiltered.filter(c => c.status === 'On Hold').length;
    const fdsTotal    = fdsFiltered.length;
    const fdsClosed   = fdsFiltered.filter(c => c.status === 'Closed').length;

    // ---- Financial KPIs (fraud findings only for Loss/Recovery) ----
    const fraudResults  = filteredResults.filter(r => !r.nature || r.nature !== 'Administrative');
    const _fin          = AuditMetrics.getGlobalMetricsFromResults(fraudResults, filteredPlans);
    const totalLoss     = _fin.totalLoss;
    const totalRecovery = _fin.totalRecovery;
    const totalUnrecovered = _fin.totalUnrecovered;
    const totalOS       = Math.max(0, _fin.outstandingLoss);
    const pctRecov      = totalLoss ? Utils.pct(totalRecovery, totalLoss) : 0;

    // ---- AAP KPIs ----
    const totalActions  = filteredActions.length;
    const openActions   = filteredActions.filter(a => a.status === 'Open').length;
    const closedActions = filteredActions.filter(a => a.status === 'Closed').length;
    const today         = new Date().toISOString().split('T')[0];
    const overdueActions= filteredActions.filter(a => a.status === 'Open' && a.dueDate && a.dueDate < today).length;

    // ---- Audit type mix ----
    const fieldwork   = filteredPlans.filter(p => p.auditType === 'Fieldwork').length;
    const monitoring  = filteredPlans.filter(p => p.auditType === 'Monitoring').length;
    const deskReview  = filteredPlans.filter(p => p.auditType === 'Desk Review').length;

    const brandOpts    = brands.map(b => ({ value: b.id, label: b.name }));
    const provOpts     = provinces.map(p => ({ value: p.id, label: p.name }));
    const deptOpts     = depts.map(d => ({ value: d.id, label: d.name }));
    const triggerOpts  = ['WBS', 'FDS', 'Direct'].map(t => ({ value: t, label: t }));
    const auditorOpts  = DB.get('auditors').map(a => ({ value: a.id, label: a.name }));

    return `
      <!-- Filter Bar -->
      <div class="card" style="padding:var(--space-4) var(--space-5)">
        <div class="filter-bar">
          <i data-lucide="filter" style="width:15px;height:15px;color:var(--text-muted);flex-shrink:0"></i>
          <input type="date" class="form-control" id="f-date-from" value="${f.dateFrom}" />
          <span style="color:var(--text-muted);font-size:12px">to</span>
          <input type="date" class="form-control" id="f-date-to" value="${f.dateTo}" />
          <select class="form-control" id="f-dept">
            <option value="">All Departments</option>
            ${deptOpts.map(o => `<option value="${o.value}" ${f.department === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
          <select class="form-control" id="f-brand">
            <option value="">All Brands</option>
            ${brandOpts.map(o => `<option value="${o.value}" ${f.brand === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
          <select class="form-control" id="f-province">
            <option value="">All Provinces</option>
            ${provOpts.slice(0, 10).map(o => `<option value="${o.value}" ${f.province === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
          <select class="form-control" id="f-trigger">
            <option value="">All Triggers</option>
            ${triggerOpts.map(o => `<option value="${o.value}" ${f.trigger === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
          <select class="form-control" id="f-auditor">
            <option value="">All Auditors</option>
            ${auditorOpts.map(o => `<option value="${o.value}" ${f.auditor === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
          <select class="form-control" id="f-nature">
            <option value="">All Findings</option>
            <option value="Fraud" ${f.nature==='Fraud'?'selected':''}>Fraud Only</option>
            <option value="Administrative" ${f.nature==='Administrative'?'selected':''}>Admin Only</option>
          </select>
          <button class="btn btn-secondary btn-sm" id="dash-reset-btn">
            <i data-lucide="rotate-ccw"></i> Reset
          </button>
        </div>
      </div>

      <!-- KPI Row 1: Audit Assignments -->
      <div class="kpi-grid kpi-grid-6" style="grid-template-columns:repeat(3,1fr) 1fr 1fr 1fr">
          <div data-action="drill-down" data-metric="total-plannings" style="cursor:pointer; transition:transform 0.2s;">
          ${Components.kpiCard('Total Plannings', totalPlannings, `${filteredResults.length} temuan terdokumentasi`, 'clipboard-list', 'blue')}
        </div>
          <div data-action="drill-down" data-metric="completed-plannings" style="cursor:pointer; transition:transform 0.2s;">
          ${Components.kpiCard('Completed', completedPlans, `${inProgressPlans} sedang berjalan`, 'check-circle', 'green')}
        </div>
        <div data-action="drill-down" data-metric="achievement" style="cursor:pointer; transition:transform 0.2s;">
          ${Components.kpiCard('Achievement', achievement + '%', `${completedPlans}/${totalPlannings} selesai`, 'target', achievement >= 80 ? 'green' : 'amber')}
        </div>
        <div data-action="drill-down" data-metric="wbs" style="cursor:pointer; transition:transform 0.2s;">
          ${Components.kpiCard('WBS', wbsTotal, `${wbsClosed} closed · ${wbsOnHold} on hold`, 'megaphone', 'purple')}
        </div>
        <div data-action="drill-down" data-metric="fds" style="cursor:pointer; transition:transform 0.2s;">
          ${Components.kpiCard('FDS', fdsTotal, `${fdsClosed} closed`, 'scan-search', 'cyan')}
        </div>
        <div data-action="drill-down" data-metric="active-plannings" style="cursor:pointer; transition:transform 0.2s;">
          ${Components.kpiCard('Active', inProgressPlans, 'Audit sedang berjalan', 'activity', 'amber')}
        </div>
      </div>

      <!-- KPI Row 2: Financial -->
      <div class="kpi-grid" style="grid-template-columns:repeat(5,1fr)">
        <div data-action="drill-down" data-metric="total-loss" style="cursor:pointer; transition:transform 0.2s;">
          ${Components.kpiCard('Total Loss (IDR)', 'Rp ' + Utils.formatIDR(totalLoss), `Dari ${filteredResults.length} temuan audit`, 'trending-down', 'red')}
        </div>
        <div data-action="drill-down" data-metric="recovery" style="cursor:pointer; transition:transform 0.2s;">
          ${Components.kpiCard('Recovery (IDR)', 'Rp ' + Utils.formatIDR(totalRecovery), 'Amount recovered', 'trending-up', 'green')}
        </div>
        <div data-action="drill-down" data-metric="unrecovered" style="cursor:pointer; transition:transform 0.2s;">
          ${Components.kpiCard('Unrecovered (IDR)', 'Rp ' + Utils.formatIDR(totalUnrecovered), 'Diputihkan manajemen', 'x-circle', totalUnrecovered > 0 ? 'red' : 'green')}
        </div>
        <div data-action="drill-down" data-metric="pct-recovery" style="cursor:pointer; transition:transform 0.2s;">
          ${Components.kpiCard('% Recovery', pctRecov + '%', 'Recovery rate', 'pie-chart', pctRecov >= 70 ? 'green' : 'amber')}
        </div>
        <div data-action="drill-down" data-metric="outstanding" style="cursor:pointer; transition:transform 0.2s;">
          ${Components.kpiCard('OS (IDR)', 'Rp ' + Utils.formatIDR(totalOS), 'Outstanding amount', 'clock', totalOS > 0 ? 'amber' : 'green')}
        </div>
      </div>

      <!-- KPI Row 3: AAP -->
      <div class="kpi-grid kpi-grid-3">
        <div data-action="drill-down" data-metric="total-aap" style="cursor:pointer; transition:transform 0.2s;">
          ${Components.kpiCard('Total AAP', totalActions, 'Agreed action plans issued', 'check-square', 'blue')}
        </div>
        <div data-action="drill-down" data-metric="aap-open" style="cursor:pointer; transition:transform 0.2s;">
          ${Components.kpiCard('AAP Open', openActions, `${closedActions} closed`, 'clock', openActions > 0 ? 'amber' : 'green')}
        </div>
        <div data-action="drill-down" data-metric="aap-overdue" style="cursor:pointer; transition:transform 0.2s;">
          ${Components.kpiCard('Overdue AAP', overdueActions, 'Melewati target due date', 'alert-circle', overdueActions > 0 ? 'red' : 'green')}
        </div>
      </div>

      <!-- Charts Row 1 -->
      <div class="charts-grid charts-grid-3">
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="bar-chart-2"></i> Findings by Category</div></div>
          <div class="card-body"><div class="chart-wrapper"><canvas id="chart-fraud-category"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="pie-chart"></i> AAP Status</div></div>
          <div class="card-body"><div class="chart-wrapper"><canvas id="chart-aap-status"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="bar-chart"></i> Recovery Overview</div></div>
          <div class="card-body"><div class="chart-wrapper"><canvas id="chart-recovery"></canvas></div></div>
        </div>
      </div>

      <!-- Charts Row 2 -->
      <div class="charts-grid charts-grid-3">
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="activity"></i> Audit Planning Trend</div></div>
          <div class="card-body"><div class="chart-wrapper"><canvas id="chart-trend"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="map-pin"></i> Top 5 Province by Findings</div></div>
          <div class="card-body"><div class="chart-wrapper"><canvas id="chart-province"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="percent"></i> Audit Type Mix</div></div>
          <div class="card-body">
            <div class="chart-wrapper"><canvas id="chart-activity"></canvas></div>
            <div style="display:flex;gap:var(--space-3);margin-top:var(--space-3);font-size:12px;flex-wrap:wrap">
              <span><span style="color:var(--blue-primary)">●</span> Fieldwork: <strong>${fieldwork}</strong></span>
              <span><span style="color:var(--green-primary)">●</span> Monitoring: <strong>${monitoring}</strong></span>
              <span><span style="color:var(--purple-primary,#a855f7)">●</span> Desk Review: <strong>${deskReview}</strong></span>
            </div>
          </div>
        </div>
      </div>`;
  },

  renderCharts() {
    const plannings = DB.get('audit_plannings');
    const results   = DB.get('audit_results');
    const actions   = DB.get('audit_actions');
    const f         = DashboardPage.filters;

    const filteredPlans   = DashboardPage.applyPlanningFilters(plannings);
    const planIds         = new Set(filteredPlans.map(p => p.id));
    const filteredResults = results.filter(r => {
      if (!planIds.has(r.planningId)) return false;
      if (f.nature) {
        if (f.nature === 'Fraud' && r.nature === 'Administrative') return false;
        if (f.nature === 'Administrative' && (!r.nature || r.nature !== 'Administrative')) return false;
      }
      return true;
    });
    const filteredResultIds = new Set(filteredResults.map(r => r.id));
    const filteredActions = actions.filter(a => planIds.has(a.planningId) && filteredResultIds.has(a.resultId));

    // ---- Chart 1: Findings by Category (bar+line combo) ----
    const byCat    = Utils.groupBy(filteredResults, 'category');
    const catLabels = Object.keys(byCat);
    const catLoss   = catLabels.map(k => Utils.sum(byCat[k], 'totalLoss'));
    const catCounts = catLabels.map(k => byCat[k].length);
    Charts.combo('chart-fraud-category', catLabels, catLoss, catCounts, 'Total Loss (Rp)', 'Jumlah Temuan');

    // ---- Chart 2: AAP Status Donut ----
    const aapClosed = filteredActions.filter(a => a.status === 'Closed').length;
    const aapOpen   = filteredActions.filter(a => a.status === 'Open').length;
    Charts.donut('chart-aap-status',
      ['Closed', 'Open'], [aapClosed, aapOpen],
      [CHART_COLORS.green, CHART_COLORS.amber]);

    // ---- Chart 3: Recovery Bar (via AuditMetrics) ----
    const _fin       = AuditMetrics.getGlobalMetrics(filteredPlans);
    const totalLoss     = _fin.totalLoss;
    const totalRecovery = _fin.totalRecovery;
    const totalUnrecovered = _fin.totalUnrecovered;
    const totalOS       = Math.max(0, _fin.outstandingLoss);
    Charts.bar('chart-recovery',
      ['Total'],
      [
        { label: 'Loss',        data: [totalLoss],        backgroundColor: CHART_COLORS.red + 'cc',   borderRadius: 4 },
        { label: 'Recovery',    data: [totalRecovery],    backgroundColor: CHART_COLORS.green + 'cc', borderRadius: 4 },
        { label: 'Unrecovered', data: [totalUnrecovered], backgroundColor: CHART_COLORS.purple + 'cc',borderRadius: 4 },
        { label: 'OS',          data: [totalOS],          backgroundColor: CHART_COLORS.amber + 'cc', borderRadius: 4 },
      ]);

    // ---- Chart 4: Planning Trend (monthly) ----
    const months      = Utils.buildMonthBuckets(filteredPlans, 'planningDate', f.dateFrom, f.dateTo);
    const trendLabels = months.map(m => m.label);
    const trendCounts = months.map(m => m.items.length);
    // Join results to months (Fraud only for financial loss)
    const trendLoss   = months.map(m => {
      const mPlanIds = new Set(m.items.map(p => p.id));
      return results.filter(r => mPlanIds.has(r.planningId) && (!r.nature || r.nature !== 'Administrative')).reduce((s, r) => s + (r.totalLoss || 0), 0);
    });
    Charts.combo('chart-trend', trendLabels, trendLoss, trendCounts, 'Total Loss (Rp)', 'Plannings');

    // ---- Chart 5: Top 5 Provinces by Findings ----
    const byProv = Utils.groupBy(filteredResults, r => {
      const p = filteredPlans.find(pl => pl.id === r.planningId);
      return Utils.getProvName(p?.province) || 'Unknown';
    });
    // Rewrite groupBy for custom key
    const provMap = {};
    filteredResults.forEach(r => {
      const p = filteredPlans.find(pl => pl.id === r.planningId);
      const key = Utils.getProvName(p?.province) || 'Unknown';
      provMap[key] = (provMap[key] || 0) + 1;
    });
    const provEntries = Object.entries(provMap)
      .map(([k, v]) => ({ name: k, count: v }))
      .sort((a, b) => b.count - a.count).slice(0, 5);
    Charts.hbar('chart-province',
      provEntries.map(p => p.name),
      [{ label: 'Temuan', data: provEntries.map(p => p.count), backgroundColor: CHART_COLORS.amber + 'cc', borderRadius: 4 }]);

    // ---- Chart 6: Audit Type Mix ----
    const fieldwork  = filteredPlans.filter(p => p.auditType === 'Fieldwork').length;
    const monitoring = filteredPlans.filter(p => p.auditType === 'Monitoring').length;
    const deskRev    = filteredPlans.filter(p => p.auditType === 'Desk Review').length;
    const totalMix   = fieldwork + monitoring + deskRev || 1;
    Charts.stackedHbar('chart-activity',
      ['Total'],
      [
        { label: 'Fieldwork',   data: [Math.round(fieldwork/totalMix*100)],  backgroundColor: CHART_COLORS.blue + 'cc',   borderRadius: [4, 0, 0, 4] },
        { label: 'Monitoring',  data: [Math.round(monitoring/totalMix*100)], backgroundColor: CHART_COLORS.green + 'cc',  borderRadius: [0, 0, 0, 0] },
        { label: 'Desk Review', data: [Math.round(deskRev/totalMix*100)],   backgroundColor: CHART_COLORS.purple + 'cc', borderRadius: [0, 4, 4, 0] },
      ]);
  },

  applyPlanningFilters(plannings) {
    const f = DashboardPage.filters;
    return plannings.filter(p => {
      if (f.dateFrom   && p.planningDate < f.dateFrom)   return false;
      if (f.dateTo     && p.planningDate > f.dateTo)     return false;
      if (f.department && p.department !== f.department) return false;
      if (f.brand      && p.brand !== f.brand)           return false;
      if (f.province   && p.province !== f.province)     return false;
      if (f.trigger    && p.trigger !== f.trigger)       return false;
      if (f.auditor    && p.leadAuditor !== f.auditor)   return false;
      return true;
    });
  },

  applyWbsFilters(wbs) {
    const f = DashboardPage.filters;
    return wbs.filter(c => {
      if (f.dateFrom && c.reportDate < f.dateFrom) return false;
      if (f.dateTo   && c.reportDate > f.dateTo)   return false;
      if (f.brand    && c.brand !== f.brand)       return false;
      if (f.province && c.province !== f.province) return false;
      return true;
    });
  },

  applyFdsFilters(fds) {
    const f = DashboardPage.filters;
    return fds.filter(c => {
      if (f.dateFrom && c.detectionDate < f.dateFrom) return false;
      if (f.dateTo   && c.detectionDate > f.dateTo)   return false;
      if (f.brand    && c.brand !== f.brand)           return false;
      if (f.province && c.province !== f.province)     return false;
      return true;
    });
  },

  afterRender() {
    if (!DashboardPage._pageWired) {
      DashboardPage._pageWired = true;
      PageLifecycle.delegate('page-content', {
        click: {
          '[data-action="drill-down"]': (e, target) => this.drillDown(target.dataset.metric),
          '#dash-reset-btn': () => this.resetFilters(),
        }
      });
    }
    PageLifecycle.on('f-date-from', 'change', (e) => this.setFilter('dateFrom', e.target.value));
    PageLifecycle.on('f-date-to', 'change', (e) => this.setFilter('dateTo', e.target.value));
    PageLifecycle.on('f-dept', 'change', (e) => this.setFilter('department', e.target.value));
    PageLifecycle.on('f-brand', 'change', (e) => this.setFilter('brand', e.target.value));
    PageLifecycle.on('f-province', 'change', (e) => this.setFilter('province', e.target.value));
    PageLifecycle.on('f-trigger', 'change', (e) => this.setFilter('trigger', e.target.value));
    PageLifecycle.on('f-auditor', 'change', (e) => this.setFilter('auditor', e.target.value));
    PageLifecycle.on('f-nature', 'change', (e) => this.setFilter('nature', e.target.value));
  },

  setFilter(key, value) {
    DashboardPage.filters[key] = value;
    Charts.destroyAll();
    Utils.updateElementHtmlAndPreserveFocus('page-content', DashboardPage.buildHtml());
    DashboardPage.afterRender();
    DashboardPage.renderCharts();
    if (window.lucide) lucide.createIcons();
  },

  resetFilters() {
    DashboardPage.filters = { dateFrom: '', dateTo: '', department: '', brand: '', province: '', auditor: '', trigger: '', nature: '' };
    Charts.destroyAll();
    Utils.updateElementHtmlAndPreserveFocus('page-content', DashboardPage.buildHtml());
    DashboardPage.afterRender();
    DashboardPage.renderCharts();
    if (window.lucide) lucide.createIcons();
  },

  drillDown(type) {
    const plannings = DB.get('audit_plannings');
    const results   = DB.get('audit_results');
    const actions   = DB.get('audit_actions');
    const wbs       = DB.get('wbs_cases');
    const fds       = DB.get('fds_cases');
    const auditors  = DB.get('auditors');

    const filteredPlans = DashboardPage.applyPlanningFilters(plannings);
    const planIds       = new Set(filteredPlans.map(p => p.id));
    const filteredResults = results.filter(r => {
      if (!planIds.has(r.planningId)) return false;
      const fnature = DashboardPage.filters.nature;
      if (fnature) {
        if (fnature === 'Fraud' && r.nature === 'Administrative') return false;
        if (fnature === 'Administrative' && (!r.nature || r.nature !== 'Administrative')) return false;
      }
      return true;
    });
    const filteredResultIds = new Set(filteredResults.map(r => r.id));
    const filteredActions = actions.filter(a => planIds.has(a.planningId) && filteredResultIds.has(a.resultId));
    const wbsFiltered   = DashboardPage.applyWbsFilters(wbs);

    const fdsFiltered = DashboardPage.applyFdsFilters(fds);

    let modalTitle = '';
    let modalBody = '';
    let modalSize = 'modal-lg';

    if (type === 'total-plannings' || type === 'completed-plannings' || type === 'active-plannings') {
      let title = 'Total Plannings';
      let plans = filteredPlans;
      if (type === 'completed-plannings') {
        title = 'Completed Plannings';
        plans = filteredPlans.filter(p => p.status === 'Completed');
      } else if (type === 'active-plannings') {
        title = 'Active Plannings';
        plans = filteredPlans.filter(p => p.status === 'In Progress');
      }

      modalTitle = `📋 ${title} — Detail`;
      modalBody = `
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:var(--space-4)">
          Menampilkan ${plans.length} perencanaan audit yang sesuai dengan filter dashboard.
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>No. Laporan</th>
                <th>Tanggal</th>
                <th>Brand / Outlet</th>
                <th>Trigger</th>
                <th>Lead Auditor</th>
                <th style="text-align:center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${plans.length === 0 ? `<tr><td colspan="6" class="text-center text-muted" style="padding:24px">Tidak ada data plannings</td></tr>` :
                plans.map(p => {
                  const aud = auditors.find(a => a.id === p.leadAuditor)?.name || p.leadAuditor;
                  return `
                    <tr>
                      <td class="col-bold"><a href="javascript:void(0)" data-action="nav-planning" data-planning-id="${p.id}" style="color:var(--blue-light)">${p.reportNo}</a></td>
                      <td>${Utils.formatDate(p.planningDate)}</td>
                      <td>${Utils.getBrandName(p.brand)} — <span class="col-mono" style="font-size:11px">${p.outletCode}</span> ${Utils.getOutletName(p.outletCode)}</td>
                      <td><span class="badge badge-gray">${p.trigger}</span></td>
                      <td>${aud}</td>
                      <td style="text-align:center">${Utils.laporanBadge(p.status)}</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (type === 'achievement') {
      modalTitle = `🎯 Achievement — Detail`;
      const completed = filteredPlans.filter(p => p.status === 'Completed');
      const incomplete = filteredPlans.filter(p => p.status !== 'Completed');

      modalBody = `
        <div class="detail-tabs" style="margin-bottom:var(--space-4)">
          <button class="detail-tab active" data-action="ach-tab" data-tab="completed">✅ Selesai (${completed.length})</button>
          <button class="detail-tab" data-action="ach-tab" data-tab="incomplete">⏳ Belum Selesai (${incomplete.length})</button>
        </div>
        
        <div id="ach-sec-completed">
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>No. Laporan</th>
                  <th>Tanggal Plan</th>
                  <th>Brand / Outlet</th>
                  <th>Lead Auditor</th>
                  <th>Tanggal Selesai</th>
                </tr>
              </thead>
              <tbody>
                ${completed.length === 0 ? `<tr><td colspan="5" class="text-center text-muted" style="padding:24px">Belum ada audit yang selesai</td></tr>` :
                  completed.map(p => {
                    const aud = auditors.find(a => a.id === p.leadAuditor)?.name || p.leadAuditor;
                    return `
                      <tr>
                        <td class="col-bold"><a href="javascript:void(0)" data-action="nav-planning" data-planning-id="${p.id}" style="color:var(--blue-light)">${p.reportNo}</a></td>
                        <td>${Utils.formatDate(p.planningDate)}</td>
                        <td>${Utils.getBrandName(p.brand)} — ${Utils.getOutletName(p.outletCode)}</td>
                        <td>${aud}</td>
                        <td style="font-weight:600;color:var(--green-light)">${p.reportSentDate ? Utils.formatDate(p.reportSentDate) : '-'}</td>
                      </tr>
                    `;
                  }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div id="ach-sec-incomplete" style="display:none">
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>No. Laporan</th>
                  <th>Tanggal Plan</th>
                  <th>Brand / Outlet</th>
                  <th>Lead Auditor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${incomplete.length === 0 ? `<tr><td colspan="5" class="text-center text-muted" style="padding:24px">Semua audit telah selesai!</td></tr>` :
                  incomplete.map(p => {
                    const aud = auditors.find(a => a.id === p.leadAuditor)?.name || p.leadAuditor;
                    return `
                      <tr>
                        <td class="col-bold"><a href="javascript:void(0)" data-action="nav-planning" data-planning-id="${p.id}" style="color:var(--blue-light)">${p.reportNo}</a></td>
                        <td>${Utils.formatDate(p.planningDate)}</td>
                        <td>${Utils.getBrandName(p.brand)} — ${Utils.getOutletName(p.outletCode)}</td>
                        <td>${aud}</td>
                        <td>${Utils.laporanBadge(p.status)}</td>
                      </tr>
                    `;
                  }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (type === 'wbs') {
      modalTitle = `📣 WBS Cases — Detail`;
      modalBody = `
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:var(--space-4)">
          Menampilkan ${wbsFiltered.length} pengaduan WBS sesuai filter aktif.
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>No. Case</th>
                <th>Tanggal Lapor</th>
                <th>Kategori</th>
                <th>Brand / Outlet</th>
                <th>Severity</th>
                <th>Estimasi Kerugian</th>
                <th style="text-align:center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${wbsFiltered.length === 0 ? `<tr><td colspan="7" class="text-center text-muted" style="padding:24px">Tidak ada WBS case</td></tr>` :
                wbsFiltered.map(c => `
                  <tr>
                    <td class="col-bold"><a href="javascript:void(0)" data-action="nav-wbs" data-case-id="${c.id}" style="color:var(--blue-light)">${c.caseNo}</a></td>
                    <td>${Utils.formatDate(c.reportDate)}</td>
                    <td>${Utils.getCatName(c.category)}</td>
                    <td>${Utils.getBrandName(c.brand)} — ${Utils.getOutletName(c.outletCode)}</td>
                    <td>${Utils.severityBadge(c.severity)}</td>
                    <td style="font-weight:600;color:var(--text-muted)">Rp ${Utils.formatIDR(c.estimatedFraud)}</td>
                    <td style="text-align:center">${Utils.statusBadge(c.status)}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (type === 'fds') {
      modalTitle = `🔍 FDS Cases — Detail`;
      modalBody = `
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:var(--space-4)">
          Menampilkan ${fdsFiltered.length} deteksi sistem FDS sesuai filter aktif.
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>No. Case</th>
                <th>Tanggal Deteksi</th>
                <th>Kategori</th>
                <th>Brand / Outlet</th>
                <th>Estimasi Kerugian</th>
                <th style="text-align:center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${fdsFiltered.length === 0 ? `<tr><td colspan="6" class="text-center text-muted" style="padding:24px">Tidak ada FDS case</td></tr>` :
                fdsFiltered.map(c => `
                  <tr>
                    <td class="col-bold"><a href="javascript:void(0)" data-action="nav-fds" data-case-id="${c.id}" style="color:var(--blue-light)">${c.caseNo}</a></td>
                    <td>${Utils.formatDate(c.detectionDate)}</td>
                    <td>${Utils.getCatName(c.category)}</td>
                    <td>${Utils.getBrandName(c.brand)} — ${Utils.getOutletName(c.outletCode)}</td>
                    <td style="font-weight:600;color:var(--text-muted)">Rp ${Utils.formatIDR(c.estimatedFraud)}</td>
                    <td style="text-align:center">${Utils.statusBadge(c.status)}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (type === 'total-loss' || type === 'recovery' || type === 'unrecovered' || type === 'pct-recovery' || type === 'outstanding') {
      modalTitle = `💰 Analisis Keuangan Audit — Detail`;
      modalSize = 'modal-xl';

      modalBody = `
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:var(--space-4)">
          Menampilkan kerugian dan pemulihan per audit planning yang aktif.
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>No. Laporan</th>
                <th>Outlet</th>
                <th style="text-align:right; ${type === 'total-loss' ? 'background:rgba(239,68,68,0.1)' : ''}">Total Loss</th>
                <th style="text-align:right; ${type === 'recovery' ? 'background:rgba(16,185,129,0.1)' : ''}">Recovery</th>
                <th style="text-align:right; ${type === 'unrecovered' ? 'background:rgba(139,92,246,0.1)' : ''}">Unrecovered</th>
                <th style="text-align:right; ${type === 'outstanding' ? 'background:rgba(245,158,11,0.1)' : ''}">Outstanding</th>
                <th style="text-align:center; ${type === 'pct-recovery' ? 'background:rgba(16,185,129,0.1)' : ''}">Recovery Rate</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPlans.length === 0 ? `<tr><td colspan="7" class="text-center text-muted" style="padding:24px">Tidak ada data keuangan</td></tr>` :
                filteredPlans.map(p => {
                  const m = AuditMetrics.getPlanningMetrics(p.id);
                  const rate = m.totalLoss ? Utils.pct(m.totalRecovery, m.totalLoss) : 0;
                  return `
                    <tr>
                      <td class="col-bold"><a href="javascript:void(0)" data-action="nav-planning" data-planning-id="${p.id}" style="color:var(--blue-light)">${p.reportNo}</a></td>
                      <td>${Utils.getBrandName(p.brand)} — ${Utils.getOutletName(p.outletCode)}</td>
                      <td style="text-align:right; font-weight:600; color:var(--red-light); ${type === 'total-loss' ? 'background:rgba(239,68,68,0.05)' : ''}">Rp ${Utils.formatIDR(m.totalLoss)}</td>
                      <td style="text-align:right; font-weight:600; color:var(--green-light); ${type === 'recovery' ? 'background:rgba(16,185,129,0.05)' : ''}">Rp ${Utils.formatIDR(m.totalRecovery)}</td>
                      <td style="text-align:right; font-weight:600; color:var(--purple-light); ${type === 'unrecovered' ? 'background:rgba(139,92,246,0.05)' : ''}">Rp ${Utils.formatIDR(m.totalUnrecovered)}</td>
                      <td style="text-align:right; font-weight:600; color:var(--amber-light); ${type === 'outstanding' ? 'background:rgba(245,158,11,0.05)' : ''}">Rp ${Utils.formatIDR(m.outstandingLoss)}</td>
                      <td style="text-align:center; ${type === 'pct-recovery' ? 'background:rgba(16,185,129,0.05)' : ''}">
                        <span class="badge ${rate >= 70 ? 'badge-green' : 'badge-amber'}">${rate}%</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (type === 'total-aap' || type === 'aap-open' || type === 'aap-overdue') {
      let title = 'Total Agreed Action Plans';
      let list = filteredActions;
      const today = new Date().toISOString().split('T')[0];

      if (type === 'aap-open') {
        title = 'Agreed Action Plans (Open)';
        list = filteredActions.filter(a => a.status === 'Open');
      } else if (type === 'aap-overdue') {
        title = 'Agreed Action Plans (Overdue)';
        list = filteredActions.filter(a => a.status === 'Open' && a.dueDate && a.dueDate < today);
      }

      modalTitle = `📋 ${title} — Detail`;
      modalSize = 'modal-xl';

      modalBody = `
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:var(--space-4)">
          Menampilkan ${list.length} action plan sesuai filter aktif.
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>No. AAP</th>
                <th>Tindakan / Deskripsi</th>
                <th>PIC</th>
                <th>Due Date</th>
                <th style="text-align:right">Target Amount</th>
                <th style="text-align:center">Status</th>
                <th style="text-align:center">Keterlambatan</th>
              </tr>
            </thead>
            <tbody>
              ${list.length === 0 ? `<tr><td colspan="7" class="text-center text-muted" style="padding:24px">Tidak ada action plan</td></tr>` :
                list.map(a => {
                  const p = plannings.find(pl => pl.id === a.planningId);
                  const reportNo = p ? p.reportNo : '';
                  const finding  = results.find(r => r.id === a.resultId);
                  const isAdmin  = finding?.nature === 'Administrative';
                  const overdueDays = AuditMetrics.getDaysOverdue(a, today);
                  let overdueHtml = '<span class="badge badge-green">On Track</span>';
                  if (overdueDays > 0) {
                    overdueHtml = `<span class="badge badge-red">Overdue ${overdueDays} Hari</span>`;
                  } else if (a.status === 'Closed') {
                    overdueHtml = '<span class="text-muted" style="font-size:11px">Selesai</span>';
                  }
                  const amountHtml = isAdmin
                    ? `<span class="text-muted" style="font-size:11px">-</span>`
                    : `Rp ${Utils.formatIDR(a.amount || 0)}`;
                  const natureBadge = isAdmin
                    ? `<span class="badge" style="background:rgba(59,130,246,0.12);color:#3b82f6;font-size:9px;margin-left:4px">ADMIN</span>`
                    : `<span class="badge" style="background:rgba(239,68,68,0.12);color:#ef4444;font-size:9px;margin-left:4px">FRAUD</span>`;

                  return `
                    <tr>
                      <td class="col-bold">
                        <span style="font-size:11px;color:var(--text-muted);display:block">${reportNo}</span>
                        <a href="javascript:void(0)" data-action="nav-planning-actions" data-planning-id="${a.planningId}" style="color:var(--blue-light)">${a.actionNo}</a>
                        ${natureBadge}
                      </td>
                      <td>
                        <div style="font-weight:600">${a.actionTitle}</div>
                        <div style="font-size:11px;color:var(--text-secondary);margin-top:2px">${a.description || '-'}</div>
                      </td>
                      <td>${a.picName || '-'}</td>
                      <td>${Utils.formatDate(a.dueDate)}</td>
                      <td style="text-align:right;font-weight:600">${amountHtml}</td>
                      <td style="text-align:center">
                        <span class="badge ${a.status === 'Closed' ? 'badge-green' : 'badge-amber'}">${a.status}</span>
                      </td>
                      <td style="text-align:center">${overdueHtml}</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    Modal.open(`
      <div class="modal-header">
        <div class="modal-title">${modalTitle}</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">${modalBody}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="modal-close">Tutup</button>
      </div>
    `, modalSize);

    if (window.lucide) lucide.createIcons();
    DashboardPage._wireDrillDownModal();
  },

  _wireDrillDownModal() {
    DashboardPage._wireDrillDownDelegates();
  },

  _wireDrillDownDelegates() {
    if (DashboardPage._drillWired) return;
    DashboardPage._drillWired = true;
    PageLifecycle.delegate('modal-overlay', {
      click: {
        '[data-action="nav-planning"]': (e, target) => {
          Modal.close();
          Router.navigate('cases');
          setTimeout(() => CasesPage?.viewPlanning?.(target.dataset.planningId), 100);
        },
        '[data-action="nav-planning-actions"]': (e, target) => {
          Modal.close();
          Router.navigate('cases');
          setTimeout(() => {
            CasesPage?.viewPlanning?.(target.dataset.planningId);
            setTimeout(() => CasesPage?._switchDetailTab?.('actions'), 100);
          }, 100);
        },
        '[data-action="nav-wbs"]': (e, target) => {
          Modal.close();
          Router.navigate('wbs');
          setTimeout(() => WBSPage?.viewCase?.(target.dataset.caseId), 100);
        },
        '[data-action="nav-fds"]': (e, target) => {
          Modal.close();
          Router.navigate('fds');
          setTimeout(() => FDSPage?.viewCase?.(target.dataset.caseId), 100);
        },
        '[data-action="ach-tab"]': (e, target) => DashboardPage._switchAchTab(target.dataset.tab),
        '[data-action="modal-close"]': () => Modal.close(),
      }
    });
  },

  _switchAchTab(tab) {
    const isCompleted = tab === 'completed';
    document.getElementById('ach-tab-completed')?.classList.toggle('active', isCompleted);
    document.getElementById('ach-tab-incomplete')?.classList.toggle('active', !isCompleted);
    const completedSec = document.getElementById('ach-sec-completed');
    const incompleteSec = document.getElementById('ach-sec-incomplete');
    if (completedSec) completedSec.style.display = isCompleted ? '' : 'none';
    if (incompleteSec) incompleteSec.style.display = !isCompleted ? '' : 'none';
  }
};

window.DashboardPage = DashboardPage;
