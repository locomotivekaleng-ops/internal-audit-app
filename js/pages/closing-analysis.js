/* ============================================================
   AGREED ACTION PLAN CLOSING ANALYSIS PAGE
   ============================================================ */

const ClosingAnalysisPage = {
  page: 1,
  perPage: 10,
  filters: {
    dateFrom: '',
    dateTo: '',
    auditor: '',
    trigger: '',
    search: ''
  },
  sortKey: 'completionDate',
  sortDir: 'desc',

  render() {
    if (!Auth.requireAuth()) return;
    Components.renderAppShell(
      'Agreed Action Plan Closing Analysis',
      'Analisis Kecepatan dan Ketepatan Waktu Penutupan Tindakan Perbaikan (AAP)',
      ClosingAnalysisPage.buildHtml(),
      'closing-analysis'
    );
    ClosingAnalysisPage._pageWired = false;
    ClosingAnalysisPage.afterRender();
    ClosingAnalysisPage.renderCharts();
  },

  getClosingDays(action) {
    if (!action.createdAt || !action.completionDate) return 0;
    const start = new Date(action.createdAt);
    const end = Utils.parseLocalDate(action.completionDate);
    const diff = end - start;
    const days = Math.round(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  },

  getFilteredActions() {
    const f = ClosingAnalysisPage.filters;
    const actions = DB.get('audit_actions').filter(a => a.status === 'Closed' && a.completionDate);
    
    return actions.filter(a => {
      const p = DB.find('audit_plannings', a.planningId);
      if (!p) return false;
      
      // Filter search
      if (f.search) {
        const q = f.search.toLowerCase();
        const actionNo = (a.actionNo || '').toLowerCase();
        const title = (a.actionTitle || '').toLowerCase();
        const pic = (a.picName || '').toLowerCase();
        const reportNo = (p.reportNo || '').toLowerCase();
        if (!actionNo.includes(q) && !title.includes(q) && !pic.includes(q) && !reportNo.includes(q)) {
          return false;
        }
      }

      if (f.dateFrom && a.completionDate < f.dateFrom) return false;
      if (f.dateTo && a.completionDate > f.dateTo) return false;
      if (f.trigger && p.trigger !== f.trigger) return false;
      if (f.auditor && p.leadAuditor !== f.auditor) return false;
      return true;
    });
  },

  getSortedActions() {
    const filtered = ClosingAnalysisPage.getFilteredActions();
    const key = ClosingAnalysisPage.sortKey;
    const dir = ClosingAnalysisPage.sortDir;

    filtered.sort((a, b) => {
      let valA, valB;
      if (key === 'daysToClose') {
        valA = ClosingAnalysisPage.getClosingDays(a);
        valB = ClosingAnalysisPage.getClosingDays(b);
      } else {
        valA = a[key] || '';
        valB = b[key] || '';
      }
      return Utils._cmpVal(valA, valB, dir);
    });

    return filtered;
  },

  buildHtml() {
    const f = ClosingAnalysisPage.filters;
    const allClosed = ClosingAnalysisPage.getFilteredActions();

    // ---- Calculate Statistics ----
    const totalClosed = allClosed.length;
    const within90Closed = allClosed.filter(a => ClosingAnalysisPage.getClosingDays(a) < 90).length;
    const within90Rate = totalClosed ? Math.round((within90Closed / totalClosed) * 100) : 0;

    const closingDurations = allClosed.map(a => ClosingAnalysisPage.getClosingDays(a));
    
    // Average
    const avgDays = totalClosed
      ? Math.round(closingDurations.reduce((s, v) => s + v, 0) / totalClosed)
      : 0;

    // Median
    let medianDays = 0;
    if (totalClosed > 0) {
      const sorted = [...closingDurations].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      medianDays = sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    }

    // Min & Max
    const minDays = totalClosed ? Math.min(...closingDurations) : 0;
    const maxDays = totalClosed ? Math.max(...closingDurations) : 0;

    // ---- Per-Auditor Speed Summary ----
    const auditors = DB.get('auditors');
    const plannings = DB.get('audit_plannings');
    const allActions = DB.get('audit_actions').filter(a => a.status === 'Closed' && a.completionDate);

    const auditorSpeedRows = auditors.map(aud => {
      const audPlans = plannings.filter(p => p.leadAuditor === aud.id);
      const audPlanIds = new Set(audPlans.map(p => p.id));
      const audActions = allActions.filter(a => audPlanIds.has(a.planningId));

      if (audActions.length === 0) return null;

      const totalAudClosed = audActions.length;
      const audWithin90 = audActions.filter(a => ClosingAnalysisPage.getClosingDays(a) < 90).length;
      const audWithin90Rate = Math.round((audWithin90 / totalAudClosed) * 100);

      const audDurations = audActions.map(a => ClosingAnalysisPage.getClosingDays(a));
      const audAvgDays = Math.round(audDurations.reduce((s, v) => s + v, 0) / totalAudClosed);

      return {
        name: aud.name,
        total: totalAudClosed,
        onTimeRate: audWithin90Rate, // reuse name to avoid breaking list template
        avgDays: audAvgDays
      };
    }).filter(Boolean).sort((a, b) => a.avgDays - b.avgDays); // fastest first

    // ---- Pagination ----
    const sortedActions = ClosingAnalysisPage.getSortedActions();
    const totalItems = sortedActions.length;
    const totalPages = Math.ceil(totalItems / ClosingAnalysisPage.perPage) || 1;
    if (ClosingAnalysisPage.page > totalPages) ClosingAnalysisPage.page = totalPages;
    
    const startIdx = (ClosingAnalysisPage.page - 1) * ClosingAnalysisPage.perPage;
    const pageItems = sortedActions.slice(startIdx, startIdx + ClosingAnalysisPage.perPage);

    // Dropdown choices
    const auditorOpts = DB.get('auditors').map(a => ({ value: a.id, label: a.name }));
    const triggerOpts = ['WBS', 'FDS', 'Direct'].map(t => ({ value: t, label: t }));

    return `
      <!-- Filter Bar -->
      <div class="card" style="padding:var(--space-4) var(--space-5)">
        <div class="filter-bar">
          <i data-lucide="filter" style="width:15px;height:15px;color:var(--text-muted);flex-shrink:0"></i>
          <input type="text" class="form-control" id="closing-analysis-search" placeholder="Cari No. AAP, PIC, judul..." value="${f.search}" style="min-width:200px" />
          <input type="date" class="form-control" id="ca-date-from" value="${f.dateFrom}" data-filter="dateFrom" title="Tanggal Selesai Mulai" />
          <span style="color:var(--text-muted);font-size:12px">s/d</span>
          <input type="date" class="form-control" id="ca-date-to" value="${f.dateTo}" data-filter="dateTo" title="Tanggal Selesai Sampai" />
          <select class="form-control" data-filter="trigger">
            <option value="">Semua Trigger</option>
            ${triggerOpts.map(o => `<option value="${o.value}" ${f.trigger === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
          <select class="form-control" data-filter="auditor">
            <option value="">Semua Auditor</option>
            ${auditorOpts.map(o => `<option value="${o.value}" ${f.auditor === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
          <button class="btn btn-secondary btn-sm" id="ca-reset-btn">
            <i data-lucide="rotate-ccw"></i> Reset
          </button>
        </div>
      </div>

      <!-- KPI Strip -->
      <div class="kpi-grid" style="grid-template-columns:repeat(5,1fr);margin-bottom:var(--space-5)">
        ${Components.kpiCard('AAP Closed', totalClosed, 'Tindakan yang telah diselesaikan', 'check-square', 'green')}
        ${Components.kpiCard('Closed <90 Hari', within90Rate + '%', `${within90Closed} dari ${totalClosed} selesai <90 hari`, 'clock', within90Rate >= 80 ? 'green' : 'amber')}
        ${Components.kpiCard('Rata-rata Closing', avgDays + ' Hari', 'Rata-rata durasi penyelesaian', 'trending-up', 'blue')}
        ${Components.kpiCard('Median Closing', medianDays + ' Hari', 'Nilai tengah durasi', 'bar-chart-2', 'purple')}
        ${Components.kpiCard('Range Closing', `${minDays} - ${maxDays} Hari`, 'Durasi Tercepat s/d Terlama', 'activity', 'cyan')}
      </div>

      <!-- Analytics Row (Chart & Speed Leaderboard) -->
      <div class="charts-grid" style="grid-template-columns: 1.5fr 1.5fr 1.2fr; gap:var(--space-5); margin-bottom:var(--space-5)">
        <!-- Chart 1: Trend -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i data-lucide="line-chart"></i> Monthly Closing Volume</div>
          </div>
          <div class="card-body">
            <div class="chart-wrapper"><canvas id="chart-closing-trend"></canvas></div>
          </div>
        </div>

        <!-- Chart 2: Distribution -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i data-lucide="bar-chart-2"></i> Closing Duration Distribution</div>
          </div>
          <div class="card-body">
            <div class="chart-wrapper"><canvas id="chart-closing-distribution"></canvas></div>
          </div>
        </div>

        <!-- Leaderboard -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i data-lucide="award"></i> Speed Leaderboard (Per Auditor)</div>
          </div>
          <div class="card-body" style="padding:0">
            <div class="data-table-wrapper" style="border:none;border-radius:0">
              <table class="data-table">
                <thead><tr>
                  <th>Auditor</th>
                  <th style="text-align:center">Total AAP</th>
                  <th style="text-align:center">Avg Days</th>
                  <th style="text-align:center">Selesai <90H %</th>
                </tr></thead>
                <tbody>
                  ${auditorSpeedRows.length === 0 ? `<tr><td colspan="4" class="text-center text-muted" style="padding:20px">Belum ada data tindakan tertutup</td></tr>` :
                    auditorSpeedRows.map((r, i) => `
                    <tr>
                      <td class="col-bold"><span style="color:var(--text-muted);font-size:10px;margin-right:6px">#${i+1}</span> ${Utils.escapeHtml(r.name)}</td>
                      <td style="text-align:center">${r.total}</td>
                      <td style="text-align:center;font-weight:600;color:var(--blue-light)">${r.avgDays} hari</td>
                      <td style="text-align:center"><span class="badge ${r.onTimeRate >= 80 ? 'badge-green' : 'badge-amber'}">${r.onTimeRate}%</span></td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Closing Table -->
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
          <div class="card-title"><i data-lucide="list"></i> Daftar AAP Tertutup</div>
          <span style="font-size:12px;color:var(--text-muted)">Menampilkan ${startIdx + 1} - ${Math.min(startIdx + ClosingAnalysisPage.perPage, totalItems)} dari ${totalItems} baris</span>
        </div>
        <div class="card-body" style="padding:0">
          <div class="data-table-wrapper" style="border:none;border-radius:0">
            ${DataTable.render({
              columns: [
                { key: 'actionNo', label: 'No. AAP' },
                { key: 'reportNo', label: 'Laporan No', sortable: false },
                { key: 'actionTitle', label: 'Tindakan / AAP', sortable: false },
                { key: 'picName', label: 'PIC', sortable: false },
                { key: 'department', label: 'Dept', sortable: false },
                { key: 'completionDate', label: 'Tgl Selesai' },
                { key: 'daysToClose', label: 'Durasi' },
                { key: 'recovery', label: 'Recovery + Unrecovered', sortable: false },
                { key: 'status', label: 'Ketepatan', sortable: false },
                { key: 'aksi', label: 'Aksi', sortable: false },
              ],
              data: pageItems,
              sort: { key: ClosingAnalysisPage.sortKey, dir: ClosingAnalysisPage.sortDir, onChange: 'ClosingAnalysisPage.setSort' },
              emptyMessage: 'Tidak ditemukan AAP yang tertutup dengan kriteria ini.',
              buildRow: (a, index) => {
                const p = DB.find('audit_plannings', a.planningId);
                const reportNo = p ? p.reportNo : '-';
                const closingDays = ClosingAnalysisPage.getClosingDays(a);
                const isOnTime = a.completionDate <= a.dueDate;
                return `<tr>
                  <td class="col-mono" style="cursor:pointer;color:var(--blue-light)" data-action="view-planning" data-planning-id="${a.planningId}" data-tab="actions">${Utils.escapeHtml(a.actionNo)}</td>
                  <td class="col-bold" style="cursor:pointer" data-action="view-planning" data-planning-id="${a.planningId}" data-tab="planning">${Utils.escapeHtml(reportNo)}</td>
                  <td style="max-width:250px">${Utils.escapeHtml(a.actionTitle)}</td>
                  <td>${Utils.escapeHtml(a.picName)}</td>
                  <td style="font-size:11px;color:var(--text-muted)">${Utils.escapeHtml(a.picDepartment) || '-'}</td>
                  <td>${Utils.formatDate(a.completionDate)}</td>
                  <td style="font-weight:600;color:var(--blue-light)">${closingDays} hari</td>
                  <td>
                    <div style="font-size:11px">Rec: <strong style="color:#10b981">Rp ${Utils.formatIDR(a.recovery || 0)}</strong></div>
                    <div style="font-size:11px;color:var(--text-muted)">Unrec: <strong style="color:#a855f7">Rp ${Utils.formatIDR(a.unrecovered || 0)}</strong></div>
                  </td>
                  <td>
                    <span class="badge ${isOnTime ? 'badge-green' : 'badge-red'}">${isOnTime ? 'Tepat Waktu' : 'Terlambat'}</span>
                  </td>
                  <td>
                    <button class="btn btn-icon btn-secondary btn-sm" data-action="view-planning" data-planning-id="${a.planningId}" data-tab="actions" title="Detail"><i data-lucide="eye"></i></button>
                  </td>
                </tr>`;
              },
            })}
          </div>

          <!-- Pagination Footer -->
          ${totalPages > 1 ? `
          <div style="display:flex;justify-content:center;align-items:center;gap:12px;padding:var(--space-4);border-top:1px solid var(--border-color)">
            <button class="btn btn-secondary btn-sm" data-action="prev-page" ${ClosingAnalysisPage.page === 1 ? 'disabled' : ''}>
              <i data-lucide="chevron-left"></i> Previous
            </button>
            <span style="font-size:12px;color:var(--text-secondary)">Halaman <strong>${ClosingAnalysisPage.page}</strong> dari <strong>${totalPages}</strong></span>
            <button class="btn btn-secondary btn-sm" data-action="next-page" ${ClosingAnalysisPage.page === totalPages ? 'disabled' : ''}>
              Next <i data-lucide="chevron-right"></i>
            </button>
          </div>` : ''}
        </div>
      </div>`;
  },

  renderCharts() {
    const allClosed = ClosingAnalysisPage.getFilteredActions();
    const f = ClosingAnalysisPage.filters;

    // Group closed actions by month
    const months = Utils.buildMonthBuckets(allClosed, 'completionDate', f.dateFrom, f.dateTo);
    const trendLabels = months.map(m => m.label);
    const within90Data = months.map(m => m.items.filter(a => ClosingAnalysisPage.getClosingDays(a) < 90).length);
    const over90Data   = months.map(m => m.items.filter(a => ClosingAnalysisPage.getClosingDays(a) >= 90).length);

    Charts.line('chart-closing-trend', trendLabels, [
      {
        label: 'Selesai <90 Hari',
        data: within90Data,
        borderColor: CHART_COLORS.green,
        backgroundColor: CHART_COLORS.green + '20',
        borderWidth: 2,
        fill: false,
        tension: 0.2
      },
      {
        label: 'Selesai >=90 Hari',
        data: over90Data,
        borderColor: CHART_COLORS.red,
        backgroundColor: CHART_COLORS.red + '20',
        borderWidth: 2,
        fill: false,
        tension: 0.2
      }
    ], {
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} AAP`
          }
        }
      },
      scales: {
        y: { ticks: { precision: 0 } }
      }
    });

    // Duration Distribution Bar Chart
    const b0_30 = allClosed.filter(a => {
      const d = ClosingAnalysisPage.getClosingDays(a);
      return d <= 30;
    }).length;
    const b31_60 = allClosed.filter(a => {
      const d = ClosingAnalysisPage.getClosingDays(a);
      return d > 30 && d <= 60;
    }).length;
    const b61_90 = allClosed.filter(a => {
      const d = ClosingAnalysisPage.getClosingDays(a);
      return d > 60 && d <= 90;
    }).length;
    const b90plus = allClosed.filter(a => {
      const d = ClosingAnalysisPage.getClosingDays(a);
      return d > 90;
    }).length;

    Charts.bar('chart-closing-distribution',
      ['0-30 Hari', '31-60 Hari', '61-90 Hari', '>90 Hari'],
      [
        {
          label: 'Jumlah AAP',
          data: [b0_30, b31_60, b61_90, b90plus],
          backgroundColor: CHART_COLORS.blue + 'cc',
          borderRadius: 4
        }
      ], {
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} AAP`
            }
          }
        },
        scales: {
          y: { ticks: { precision: 0 } }
        }
      }
    );
  },

  setSort(col) {
    if (ClosingAnalysisPage.sortKey === col) {
      ClosingAnalysisPage.sortDir = ClosingAnalysisPage.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      ClosingAnalysisPage.sortKey = col;
      ClosingAnalysisPage.sortDir = 'asc';
    }
    ClosingAnalysisPage.refresh();
  },

  afterRender() {
    if (!ClosingAnalysisPage._pageWired) {
      ClosingAnalysisPage._pageWired = true;
      PageLifecycle.delegate('page-content', {
        change: {
          '[data-filter="trigger"]': (e, target) => this.setFilter('trigger', target.value),
          '[data-filter="auditor"]': (e, target) => this.setFilter('auditor', target.value),
        },
        click: {
          '#ca-reset-btn': () => this.resetFilters(),
          '[data-action="prev-page"]': () => this.changePage(this.page - 1),
          '[data-action="next-page"]': () => this.changePage(this.page + 1),
          '[data-action="view-planning"]': (e, target) => {
            CasesPage?.viewPlanning?.(target.dataset.planningId, target.dataset.tab);
          },
          '[data-action="dt-sort"]': (e, target) => this.setSort(target.dataset.key),
        }
      });
    }
    PageLifecycle.on('ca-date-from', 'change', (e) => this.setFilter('dateFrom', e.target.value));
    PageLifecycle.on('ca-date-to', 'change', (e) => this.setFilter('dateTo', e.target.value));
    PageLifecycle.on('closing-analysis-search', 'input', (e) => this.setFilter('search', e.target.value));
  },

  setFilter(key, val) {
    ClosingAnalysisPage.filters[key] = val;
    ClosingAnalysisPage.page = 1;
    ClosingAnalysisPage.refresh();
  },

  resetFilters() {
    ClosingAnalysisPage.filters = { dateFrom: '', dateTo: '', auditor: '', trigger: '', search: '' };
    ClosingAnalysisPage.page = 1;
    ClosingAnalysisPage.refresh();
  },

  changePage(p) {
    ClosingAnalysisPage.page = p;
    ClosingAnalysisPage.refresh();
  },

  refresh() {
    Charts.destroyAll();
    const shellContent = document.getElementById('page-content');
    if (shellContent) {
      Utils.updateElementHtmlAndPreserveFocus('page-content', ClosingAnalysisPage.buildHtml());
      ClosingAnalysisPage.afterRender();
      ClosingAnalysisPage.renderCharts();
      if (window.lucide) lucide.createIcons();
    }
  }
};

window.ClosingAnalysisPage = ClosingAnalysisPage;
