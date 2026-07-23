/* ============================================================
   FRAUD TRENDLINE PAGE
   Data source: audit_results (joined via audit_plannings)
   ============================================================ */

const FraudTrendPage = {
  filters: { dateFrom: '2025-01-01', dateTo: '2026-06-30', department: '' },

  render() {
    if (!Auth.requireAuth()) return;
    Components.renderAppShell(
      'Fraud Trendline',
      'Year-to-Date fraud trend analysis',
      FraudTrendPage.buildHtml(),
      'fraud-trend'
    );
    FraudTrendPage._pageWired = false;
    FraudTrendPage.renderCharts();
    FraudTrendPage.afterRender();
  },

  /* ── helpers ─────────────────────────────────────────────── */

  // Return audit_results filtered by findingDate + dept (via planning join)
  getFiltered() {
    const f        = FraudTrendPage.filters;
    const plannings = DB.get('audit_plannings');
    const validPlanIds = new Set(
      plannings
        .filter(p => !f.department || p.department === f.department)
        .map(p => p.id)
    );
    return DB.get('audit_results').filter(r => {
      if (!validPlanIds.has(r.planningId)) return false;
      if (f.dateFrom && r.findingDate < f.dateFrom) return false;
      if (f.dateTo   && r.findingDate > f.dateTo)   return false;
      if (r.nature && r.nature === 'Administrative') return false;
      return true;
    });
  },

  // All fraud results (no date filter, optional dept filter)
  _allFraudResults(deptFilter) {
    const plannings = DB.get('audit_plannings');
    const validPlanIds = new Set(
      plannings
        .filter(p => !deptFilter || p.department === deptFilter)
        .map(p => p.id)
    );
    return DB.get('audit_results').filter(r =>
      validPlanIds.has(r.planningId) &&
      (!r.nature || r.nature !== 'Administrative')
    );
  },

  buildHtml() {
    const f       = FraudTrendPage.filters;
    const cases   = FraudTrendPage.getFiltered();

    // LY = prior year (all fraud results, same dept)
    const curYear  = Utils.parseLocalDate(f.dateTo)?.getFullYear() || new Date().getFullYear();
    const allFraud = FraudTrendPage._allFraudResults(f.department);

    const prevYearCases = allFraud.filter(r => {
      const y = Utils.parseLocalDate(r.findingDate)?.getFullYear() || 0;
      return y === curYear - 1;
    });

    const lossLY  = Utils.sum(prevYearCases, 'totalLoss');
    const lossYTD = Utils.sum(cases, 'totalLoss');
    const pctLoss = lossLY ? Math.round(((lossYTD - lossLY) / lossLY) * 100) : 0;

    // Audit completion KPI
    const plannings      = DB.get('audit_plannings');
    const filteredPlans  = plannings.filter(p => !f.department || p.department === f.department);
    const completedPlans = filteredPlans.filter(p => p.status === 'Completed').length;
    const totalPlans     = filteredPlans.length;
    const achievementPct = totalPlans ? Math.round((completedPlans / totalPlans) * 100) : 0;

    const depts = DB.get('departments');

    // Category table: AP12M vs AP3M
    const cats      = DB.get('fraud_categories');
    const now       = Utils.parseLocalDate(f.dateTo) || new Date();
    const ap12Start = new Date(now); ap12Start.setFullYear(ap12Start.getFullYear() - 1);
    const ap3Start  = new Date(now);
    ap3Start.setMonth(ap3Start.getMonth() - 3);
    if (ap3Start.getDate() !== now.getDate()) {
      ap3Start.setDate(0);
    }
    const ap12Str   = ap12Start.toISOString().split('T')[0];
    const ap3Str    = ap3Start.toISOString().split('T')[0];
    const toStr     = f.dateTo;

    const ap12Cases = allFraud.filter(r => r.findingDate >= ap12Str && r.findingDate <= toStr);
    const ap3Cases  = allFraud.filter(r => r.findingDate >= ap3Str  && r.findingDate <= toStr);

    // Exclude admin categories from fraud table
    const adminCatNames = ['SOP','Dokumentasi','Kontrol Internal','Rekonsiliasi Minor','Training Gap','Keterlambatan Pelaporan'];
    const fraudCats = cats.filter(c => !adminCatNames.includes(c.name));

    const catRows = fraudCats.map(cat => {
      const c12 = ap12Cases.filter(r => r.category === cat.id);
      const c3  = ap3Cases.filter(r =>  r.category === cat.id);
      const loss12 = Utils.sum(c12, 'totalLoss') / 12;
      const loss3  = Utils.sum(c3,  'totalLoss') / 3;
      const cnt12  = c12.length / 12;
      const cnt3   = c3.length  / 3;
      const pctIDR = loss12 ? (((loss3 - loss12) / loss12) * 100).toFixed(1) : '0.0';
      const pctCnt = cnt12  ? (((cnt3  - cnt12)  / cnt12)  * 100).toFixed(1) : '0.0';
      return { name: cat.name, loss12, loss3, cnt12, cnt3, pctIDR, pctCnt };
    }).filter(r => r.loss12 > 0 || r.loss3 > 0);

    return `
      <!-- Filters -->
      <div class="card" style="padding:var(--space-4) var(--space-5)">
        <div class="filter-bar">
          <i data-lucide="filter" style="width:15px;height:15px;color:var(--text-muted)"></i>
          <input type="date" class="form-control" id="ft-date-from" value="${f.dateFrom}" data-filter="dateFrom" />
          <span style="color:var(--text-muted);font-size:12px">to</span>
          <input type="date" class="form-control" id="ft-date-to" value="${f.dateTo}" data-filter="dateTo" />
          <select class="form-control" data-filter="department">
            <option value="">All Departments</option>
            ${depts.map(d=>`<option value="${d.id}" ${f.department===d.id?'selected':''}>${Utils.escapeHtml(d.name)}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Trend Chart -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="trending-up"></i> Fraud Findings YTD Trend</div>
          <div style="font-size:11px;color:var(--text-muted)">${cases.length} temuan fraud dalam periode</div>
        </div>
        <div class="card-body"><div class="chart-wrapper tall"><canvas id="chart-ytd-trend"></canvas></div></div>
      </div>

      <!-- Financial KPIs -->
      <div class="kpi-grid kpi-grid-4">
        ${Components.kpiCard('Total Loss LY', 'Rp ' + Utils.formatIDR(lossLY), 'Prior year total loss (fraud only)', 'calendar', 'blue')}
        ${Components.kpiCard('Total Loss YTD', 'Rp ' + Utils.formatIDR(lossYTD), 'Current period total loss (fraud only)', 'trending-down', 'red')}
        ${Components.kpiCard('% vs Prior Year', (pctLoss >= 0 ? '+' : '') + pctLoss + '%', lossLY > 0 ? (pctLoss < 0 ? '↓ Improvement' : '↑ Worsening') : 'No prior year data', 'percent', pctLoss < 0 ? 'green' : 'red')}
        ${Components.kpiCard('Audit Completion', achievementPct + '%', completedPlans + ' / ' + totalPlans + ' planning selesai', 'target', achievementPct >= 80 ? 'green' : achievementPct >= 50 ? 'amber' : 'red')}
      </div>

      <!-- Category Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="table"></i> Category Performance: AP12M vs AP3M</div>
          <div style="font-size:11px;color:var(--text-muted)">Rolling 12-month vs Rolling 3-month (avg per bulan)</div>
        </div>
        <div class="card-body">
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Category</th>
                  <th>AP12M Loss (avg/mo)</th>
                  <th>AP12M Cases (avg/mo)</th>
                  <th>AP3M Loss (avg/mo)</th>
                  <th>AP3M Cases (avg/mo)</th>
                  <th>AP3M vs AP12M Loss</th>
                  <th>AP3M vs AP12M Cases</th>
                </tr>
              </thead>
              <tbody>
                ${catRows.length === 0
                  ? `<tr><td colspan="8" class="text-center text-muted" style="padding:32px">
                      Tidak ada data temuan fraud dalam periode ini.<br>
                      <small>Pastikan Audit Results sudah diinput di halaman Audit Assignments.</small>
                    </td></tr>`
                  : catRows.map((r, i) => `
                  <tr>
                    <td class="col-number">${i+1}.</td>
                    <td class="col-bold">${Utils.escapeHtml(r.name)}</td>
                    <td class="text-right">${Utils.formatIDRFull(Math.round(r.loss12))}</td>
                    <td class="text-right">${r.cnt12.toFixed(2)}</td>
                    <td class="text-right">${Utils.formatIDRFull(Math.round(r.loss3))}</td>
                    <td class="text-right">${r.cnt3.toFixed(2)}</td>
                    <td class="text-right ${parseFloat(r.pctIDR) < 0 ? 'text-green' : 'text-red'}">${r.pctIDR}%</td>
                    <td class="text-right ${parseFloat(r.pctCnt) < 0 ? 'text-green' : 'text-red'}">${r.pctCnt}%</td>
                  </tr>`).join('')}
              </tbody>
            </table>
            <div style="font-size:11px;color:var(--text-muted);margin-top:8px;line-height:1.5">
              * AP12M = rata-rata per bulan selama 12 bulan sebelum <code>dateTo</code>;
              AP3M = rata-rata per bulan selama 3 bulan sebelum <code>dateTo</code>.
              Kedua metrik menggunakan rolling window dan tidak terpengaruh filter <code>dateFrom</code>.
            </div>
          </div>
        </div>
      </div>`;
  },

  renderCharts() {
    const cases = FraudTrendPage.getFiltered();
    const f = FraudTrendPage.filters;
    const months = Utils.buildMonthBuckets(cases, 'findingDate', f.dateFrom, f.dateTo);
    Charts.combo('chart-ytd-trend',
      months.map(m => m.label),
      months.map(m => Utils.sum(m.items, 'totalLoss')),
      months.map(m => m.items.length),
      'Total Loss (IDR)', 'Jumlah Temuan',
      CHART_COLORS.indigo, CHART_COLORS.green);
  },

  afterRender() {
    if (!FraudTrendPage._pageWired) {
      FraudTrendPage._pageWired = true;
      PageLifecycle.delegate('page-content', {
        change: {
          '[data-filter="department"]': (e, target) => {
            this.setFilter('department', target.value);
          }
        }
      });
    }
    PageLifecycle.on('ft-date-from', 'change', (e) => this.setFilter('dateFrom', e.target.value));
    PageLifecycle.on('ft-date-to', 'change', (e) => this.setFilter('dateTo', e.target.value));
  },

  setFilter(key, val) {
    FraudTrendPage.filters[key] = val;
    Charts.destroyAll();
    document.getElementById('page-content').innerHTML = FraudTrendPage.buildHtml();
    FraudTrendPage.renderCharts();
    FraudTrendPage.afterRender();
    if (window.lucide) lucide.createIcons();
  }
};

window.FraudTrendPage = FraudTrendPage;
