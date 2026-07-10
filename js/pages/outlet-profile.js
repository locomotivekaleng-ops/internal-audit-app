/* ============================================================
   OUTLET PROFILE PAGE — Detailed outlet view with audit history,
   findings & fraudster info, AAP register, and manager drill-down
   ============================================================ */

const OutletProfilePage = {
  selectedOutletCode: null,
  activeTab: 'history',
  _dropdownEl: null,
  _listenerAttached: false,

  render() {
    if (!Auth.requireAuth()) return;
    if (!OutletProfilePage.selectedOutletCode) {
      const first = DB.get('outlets')[0];
      if (first) OutletProfilePage.selectedOutletCode = first.code;
    }
    Components.renderAppShell(
      'Outlet Profile',
      'Informasi detail dan riwayat audit setiap outlet',
      OutletProfilePage.buildHtml(),
      'outlet-profile'
    );
    OutletProfilePage.afterRender();
  },

  afterRender() {
    PageLifecycle.delegate('page-content', {
      click: {
        '[data-action="op-tab"]': (e, target) => this.setTab(target.dataset.tab),
        '[data-action="op-export"]': () => this.exportCsv(),
        '[data-action="op-manager-history"]': (e, target) => {
          this.showManagerHistory(target.dataset.outletCode, target.dataset.role, target.dataset.managerName);
        },
        '[data-action="op-view-planning"]': (e, target) => this._viewPlanning(target.dataset.planningId),
        '[data-action="op-go-to-outlet"]': (e, target) => this._goToOutlet(target.dataset.outletCode),
        '[data-action="export-drill-down"]': (e, target) => {
          this._exportDrillDown(target.dataset.role, target.dataset.name);
        },
        '[data-action="view-planning-from-outlet"]': (e, target) => {
          Modal.close();
          Router.navigate('cases');
          setTimeout(() => CasesPage.viewPlanning(target.dataset.planningId, 'planning'), 150);
        },
      }
    });
    PageLifecycle.on('profile-outlet-search', 'input', (e) => this._onSearchInput(e.target.value));
    PageLifecycle.on('profile-outlet-search', 'focus', () => this._onSearchFocus());
    PageLifecycle.on('profile-outlet-search', 'blur', () => this._onSearchBlur());
    PageLifecycle.on('combobox-clear-btn', 'click', () => this._clearOutlet());
  },

  buildHtml() {
    const outlets = DB.get('outlets');
    const selectedCode = OutletProfilePage.selectedOutletCode;
    const outlet = outlets.find(o => o.code === selectedCode);

    let html = `<div class="page-header">
      <div class="page-header-left">
        <h2>Outlet Profile</h2>
        <p>Informasi detail dan riwayat audit outlet</p>
      </div>
    </div>`;

    html += `<div class="card" style="padding:var(--space-4) var(--space-5);margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap">
        <label style="font-size:12px;font-weight:600;color:var(--text-muted)">Pilih Outlet:</label>
        <div class="combobox-wrapper" style="min-width:320px">
          <div style="position:relative">
            <input type="text" class="form-control combobox-input" id="profile-outlet-search"
              placeholder="Ketik kode/nama outlet..." autocomplete="off"
              value="${outlet ? Utils.escapeHtml(outlet.code + ' — ' + outlet.name) : ''}" />
            <button class="combobox-clear ${selectedCode ? '' : 'hidden'}" id="combobox-clear-btn" tabindex="-1" type="button"><i data-lucide="x" style="width:14px;height:14px"></i></button>
          </div>
        </div>
      </div>
    </div>`;

    if (!outlet) {
      html += `<div style="text-align:center;padding:60px 20px;border:1.5px dashed var(--border-color);border-radius:var(--radius-lg)">
        <i data-lucide="store" style="width:48px;height:48px;color:var(--text-muted);margin-bottom:var(--space-3)"></i>
        <h3 style="color:var(--text-muted);font-weight:500">Pilih outlet untuk melihat profil</h3>
        <p style="color:var(--text-muted);font-size:12px;margin-top:4px">Gunakan dropdown di atas untuk memilih outlet</p>
      </div>`;
      return html;
    }

    html += OutletProfilePage._buildInfoHeader(outlet);
    html += OutletProfilePage._buildKpiRow(outlet);
    html += OutletProfilePage._buildTabs();
    html += `<div id="profile-tab-content">${OutletProfilePage._buildTabContent(outlet)}</div>`;

    return html;
  },

  _buildInfoHeader(outlet) {
    const roles = [
      { key: 'outletManager', label: 'Outlet Manager' },
      { key: 'multiUnitManager', label: 'Multi Unit Manager' },
      { key: 'areaManager', label: 'Area Manager' },
      { key: 'distrikManager', label: 'Distrik Manager' },
    ];
    return `
      <div class="card" style="margin-bottom:var(--space-4)">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <h3 style="font-size:18px;font-weight:700"><span class="col-mono">${outlet.code}</span> — ${Utils.escapeHtml(outlet.name)}</h3>
              <div style="display:flex;gap:12px;margin-top:4px;font-size:12px;color:var(--text-muted)">
                <span><strong style="color:var(--text-secondary)">Brand:</strong> ${Utils.statusBadge(outlet.brand)}</span>
                <span><strong style="color:var(--text-secondary)">Provinsi:</strong> ${outlet.province}</span>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" data-action="op-export">
              <i data-lucide="download"></i> Export CSV
            </button>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-3);margin-top:var(--space-4);padding-top:var(--space-4);border-top:1px solid var(--border-color)">
            ${roles.map(r => {
              const name = outlet[r.key] || '';
              return `<div>
                <div style="font-size:10px;text-transform:uppercase;color:var(--text-muted);letter-spacing:0.5px;margin-bottom:2px">${r.label}</div>
                <div style="font-size:13px;font-weight:600;color:${name ? 'var(--blue-light)' : 'var(--text-muted)'}">
                  ${name
                    ? `<a href="javascript:void(0)" data-action="op-manager-history" data-outlet-code="${outlet.code}" data-role="${r.key}" data-manager-name="${Utils.escapeHtml(name).replace(/'/g, "\\'")}" style="color:var(--blue-light);text-decoration:none;cursor:pointer;border-bottom:1px dashed rgba(59,130,246,0.3)">${Utils.escapeHtml(name)}</a>`
                    : '-'}
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>`;
  },

  _buildKpiRow(outlet) {
    const pids = DB.get('audit_plannings').filter(p => p.outletCode === outlet.code).map(p => p.id);
    const results = DB.get('audit_results').filter(r => pids.includes(r.planningId));
    const actions = DB.get('audit_actions').filter(a => pids.includes(a.planningId));
    const fraudResults = results.filter(r => r.nature === 'Fraud');
    const totalLoss = results.reduce((s, r) => s + (parseInt(r.totalLoss) || 0), 0);
    const totalRecovery = actions.filter(a => a.status === 'Closed').reduce((s, a) => s + (a.recovery || 0), 0);
    const rr = totalLoss > 0 ? Math.round(totalRecovery / totalLoss * 100) : 0;
    const rrColor = rr > 50 ? 'green' : rr > 0 ? 'amber' : 'gray';

    return `<div class="kpi-grid" style="grid-template-columns:repeat(6,1fr);margin-bottom:var(--space-4)">
      ${Components.kpiCard('Total Audit', pids.length, 'Perencanaan audit', 'clipboard-list', 'blue')}
      ${Components.kpiCard('Temuan', results.length, 'Total temuan audit', 'alert-triangle', results.length > 0 ? 'amber' : 'gray')}
      ${Components.kpiCard('Fraud Case', fraudResults.length, 'Temuan fraud', 'search', fraudResults.length > 0 ? 'red' : 'gray')}
      ${Components.kpiCard('Total Loss', 'Rp ' + Utils.formatIDR(totalLoss), 'Kerugian finansial', 'trending-down', totalLoss > 0 ? 'red' : 'gray')}
      ${Components.kpiCard('Recovery', 'Rp ' + Utils.formatIDR(totalRecovery), 'Telah dipulihkan', 'trending-up', totalRecovery > 0 ? 'green' : 'gray')}
      ${Components.kpiCard('Recovery Rate', rr + '%', 'Persentase pemulihan', 'percent', rrColor)}
    </div>`;
  },

  _buildTabs() {
    const tabs = [
      { id: 'history', label: 'Audit History', icon: 'clipboard-list' },
      { id: 'findings', label: 'Findings & Fraudster', icon: 'alert-triangle' },
      { id: 'aap', label: 'AAP Register', icon: 'check-square' },
    ];
    return `<div class="dept-tabs" style="margin-bottom:var(--space-4)">
      ${tabs.map(t => `
        <div class="dept-tab ${OutletProfilePage.activeTab === t.id ? 'active' : ''}" data-action="op-tab" data-tab="${t.id}" style="display:flex;align-items:center;gap:6px">
          <i data-lucide="${t.icon}" style="width:12px;height:12px"></i>
          <span>${t.label}</span>
        </div>`).join('')}
    </div>`;
  },

  _buildTabContent(outlet) {
    switch (OutletProfilePage.activeTab) {
      case 'history': return OutletProfilePage._buildHistoryTab(outlet);
      case 'findings': return OutletProfilePage._buildFindingsTab(outlet);
      case 'aap': return OutletProfilePage._buildAapTab(outlet);
      default: return '';
    }
  },

  _buildHistoryTab(outlet) {
    const plannings = Utils.sortBy(
      DB.get('audit_plannings').filter(p => p.outletCode === outlet.code),
      'planningDate', 'desc'
    );
    if (!plannings.length) {
      return `<div style="text-align:center;padding:40px;border:1px dashed var(--border-color);border-radius:8px;color:var(--text-muted)">
        <i data-lucide="clipboard-list" style="width:24px;height:24px;margin-bottom:8px;color:var(--text-muted)"></i>
        <p>Belum ada audit planning untuk outlet ini.</p>
      </div>`;
    }
    return `<div class="card">
      <div class="card-body" style="padding:0">
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead><tr>
              <th>No. Laporan</th>
              <th>Tgl Planning</th>
              <th>Trigger</th>
              <th>Lead Auditor</th>
              <th>Findings</th>
              <th>Fraud</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr></thead>
            <tbody>
              ${plannings.map(p => {
                const results = DB.get('audit_results').filter(r => r.planningId === p.id);
                const fraudCount = results.filter(r => r.nature === 'Fraud').length;
                const auditors = DB.get('auditors');
                const lead = auditors.find(a => a.id === p.leadAuditor);
                return `<tr>
                  <td class="col-bold" style="font-size:12px">${p.reportNo}</td>
                  <td style="font-size:12px">${Utils.formatDate(p.planningDate)}</td>
                  <td><span class="badge ${p.trigger === 'WBS' ? 'badge-purple' : p.trigger === 'FDS' ? 'badge-cyan' : 'badge-gray'}">${p.trigger}</span></td>
                  <td style="font-size:12px">${lead ? lead.name : '-'}</td>
                  <td><span class="badge ${results.length > 0 ? 'badge-amber' : 'badge-gray'}">${results.length}</span></td>
                  <td>${fraudCount > 0 ? `<span class="badge badge-red">${fraudCount}</span>` : '<span style="color:var(--text-muted);font-size:12px">-</span>'}</td>
                  <td>${OutletProfilePage._statusBadge(p.status)}</td>
                  <td><button class="btn btn-icon btn-secondary btn-sm" data-action="op-view-planning" data-planning-id="${p.id}" title="Lihat Detail"><i data-lucide="eye"></i></button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  },

  _buildFindingsTab(outlet) {
    const pids = DB.get('audit_plannings').filter(p => p.outletCode === outlet.code).map(p => p.id);
    const results = Utils.sortBy(
      DB.get('audit_results').filter(r => pids.includes(r.planningId)),
      'findingDate', 'desc'
    );
    if (!results.length) {
      return `<div style="text-align:center;padding:40px;border:1px dashed var(--border-color);border-radius:8px;color:var(--text-muted)">
        <i data-lucide="alert-triangle" style="width:24px;height:24px;margin-bottom:8px;color:var(--text-muted)"></i>
        <p>Belum ada temuan audit untuk outlet ini.</p>
      </div>`;
    }
    return `<div class="card">
      <div class="card-body" style="padding:0">
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead><tr>
              <th>No.</th>
              <th>Judul Temuan</th>
              <th>Kategori</th>
              <th>Nature</th>
              <th>Severity</th>
              <th>Total Loss</th>
              <th>Status</th>
              <th>Fraudster</th>
            </tr></thead>
            <tbody>
              ${results.map(r => {
                const fraudInfo = r.nature === 'Fraud' && r.fraudsterName
                  ? `<span style="font-size:11px">${Utils.escapeHtml(r.fraudsterName)}${r.fraudsterPosition ? ' (' + Utils.escapeHtml(r.fraudsterPosition) + ')' : ''}</span>`
                  : '<span style="color:var(--text-muted);font-size:11px">-</span>';
                return `<tr>
                  <td class="col-mono" style="font-size:11px">${r.findingNo}</td>
                  <td style="font-size:12px;max-width:200px">${Utils.escapeHtml(r.findingTitle)}</td>
                  <td style="font-size:12px">${Utils.statusBadge(r.category)}</td>
                  <td>${r.nature === 'Fraud'
                    ? `<span class="badge badge-red">Fraud</span>`
                    : `<span class="badge badge-blue">Administratif</span>`}</td>
                  <td>${Utils.severityBadge(r.severity)}</td>
                  <td style="font-size:12px;font-weight:600">Rp ${Utils.formatIDR(r.totalLoss)}</td>
                  <td><span class="badge ${r.status === 'Closed' ? 'badge-green' : 'badge-amber'}">${r.status || 'Open'}</span></td>
                  <td>${fraudInfo}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  },

  _buildAapTab(outlet) {
    const pids = DB.get('audit_plannings').filter(p => p.outletCode === outlet.code).map(p => p.id);
    const actions = Utils.sortBy(
      DB.get('audit_actions').filter(a => pids.includes(a.planningId)),
      'dueDate', 'asc'
    );
    if (!actions.length) {
      return `<div style="text-align:center;padding:40px;border:1px dashed var(--border-color);border-radius:8px;color:var(--text-muted)">
        <i data-lucide="check-square" style="width:24px;height:24px;margin-bottom:8px;color:var(--text-muted)"></i>
        <p>Belum ada Agreed Action Plan untuk outlet ini.</p>
      </div>`;
    }
    return `<div class="card">
      <div class="card-body" style="padding:0">
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead><tr>
              <th>No. AAP</th>
              <th>Finding</th>
              <th>Tindakan</th>
              <th>PIC</th>
              <th>Target Amount</th>
              <th>Due Date</th>
              <th>Recovery</th>
              <th>Status</th>
            </tr></thead>
            <tbody>
              ${actions.map(a => {
                const isOverdue = a.status === 'Open' && a.dueDate && a.dueDate < new Date().toISOString().split('T')[0];
                const finding = DB.get('audit_results').find(r => r.id === a.resultId);
                return `<tr>
                  <td class="col-mono" style="font-size:11px">${a.actionNo}</td>
                  <td style="font-size:11px;color:var(--text-muted)">${finding ? finding.findingNo : '-'}</td>
                  <td style="font-size:12px;max-width:180px">${Utils.escapeHtml(a.actionTitle)}</td>
                  <td style="font-size:11px">${a.picName}</td>
                  <td style="font-size:11px;font-weight:600">Rp ${Utils.formatIDR(a.amount || 0)}</td>
                  <td style="font-size:11px${isOverdue ? ';color:#ef4444;font-weight:600' : ''}">${Utils.formatDate(a.dueDate)}${isOverdue ? ' ⚠' : ''}</td>
                  <td style="font-size:11px;font-weight:600;color:${a.status === 'Closed' && a.recovery > 0 ? '#10b981' : 'var(--text-muted)'}">
                    ${a.status === 'Closed' ? 'Rp ' + Utils.formatIDR(a.recovery || 0) : '-'}
                  </td>
                  <td><span class="badge ${a.status === 'Closed' ? 'badge-green' : isOverdue ? 'badge-red' : 'badge-amber'}">${a.status}${isOverdue ? ' ⚠' : ''}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  },

  _statusBadge(status) {
    const map = {
      'Plan': 'badge-blue',
      'In Progress': 'badge-amber',
      'Completed': 'badge-green',
      'Cancelled': 'badge-red',
    };
    return `<span class="badge ${map[status] || 'badge-gray'}">${status || '-'}</span>`;
  },

  _viewPlanning(id) {
    if (window.CasesPage && CasesPage.viewPlanning) {
      CasesPage.viewPlanning(id);
    }
  },

  // ---- Searchable Combobox (portal pattern - appended to body) ----
  _getDropdown() {
    if (OutletProfilePage._dropdownEl) return OutletProfilePage._dropdownEl;
    const el = document.createElement('div');
    el.className = 'combobox-dropdown hidden';
    el.id = 'outlet-combobox-dropdown';
    document.body.appendChild(el);
    OutletProfilePage._dropdownEl = el;
    if (!OutletProfilePage._listenerAttached) {
      OutletProfilePage._listenerAttached = true;
      document.addEventListener('mousedown', (e) => {
        const dropdown = OutletProfilePage._dropdownEl;
        if (!dropdown || dropdown.classList.contains('hidden')) return;
        const input = document.getElementById('profile-outlet-search');
        if (input && (input === e.target || input.contains(e.target))) return;
        if (dropdown.contains(e.target)) return;
        dropdown.classList.add('hidden');
      });
    }
    return el;
  },

  _hideDropdown() {
    const el = OutletProfilePage._getDropdown();
    el.classList.add('hidden');
  },

  _positionDropdown() {
    const input = document.getElementById('profile-outlet-search');
    const dropdown = OutletProfilePage._getDropdown();
    if (!input) return;
    const rect = input.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + 4) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.width = rect.width + 'px';
  },

  _onSearchInput(value) {
    const dropdown = OutletProfilePage._getDropdown();
    const q = value.trim();
    if (!q) {
      dropdown.classList.add('hidden');
      return;
    }
    const outlets = DB.get('outlets');
    const lq = q.toLowerCase();
    const filtered = outlets.filter(o =>
      o.code.toLowerCase().includes(lq) ||
      o.name.toLowerCase().includes(lq) ||
      o.brand.toLowerCase().includes(lq)
    );
    OutletProfilePage._positionDropdown();
    dropdown.innerHTML = OutletProfilePage._comboboxItemsHtml(filtered, q);
    dropdown.classList.remove('hidden');
  },

  _onSearchFocus() {
    const input = document.getElementById('profile-outlet-search');
    if (!input) return;
    const dropdown = OutletProfilePage._getDropdown();
    const outlets = DB.get('outlets');
    OutletProfilePage._positionDropdown();
    dropdown.innerHTML = OutletProfilePage._comboboxItemsHtml(outlets, '');
    dropdown.classList.remove('hidden');
  },

  _onSearchBlur() {
    setTimeout(() => {
      OutletProfilePage._hideDropdown();
    }, 180);
  },

  _selectOutletFromCombobox(code) {
    const outlet = DB.get('outlets').find(o => o.code === code);
    if (!outlet) return;
    OutletProfilePage._hideDropdown();
    OutletProfilePage.selectedOutletCode = code;
    OutletProfilePage.render();
  },

  _clearOutlet() {
    OutletProfilePage._hideDropdown();
    OutletProfilePage.selectedOutletCode = null;
    OutletProfilePage.render();
  },

  _comboboxItemsHtml(outlets, query) {
    if (!outlets.length) {
      return `<div class="combobox-empty">Tidak ada outlet ditemukan</div>`;
    }
    const q = query.toLowerCase();
    return outlets.map(o => {
      const label = `${o.code} — ${o.name}`;
      let display = Utils.escapeHtml(label);
      if (q) {
        const idx = label.toLowerCase().indexOf(q);
        if (idx !== -1) {
          const before = Utils.escapeHtml(label.slice(0, idx));
          const match = Utils.escapeHtml(label.slice(idx, idx + q.length));
          const after = Utils.escapeHtml(label.slice(idx + q.length));
          display = before + '<span class="combobox-highlight">' + match + '</span>' + after;
        }
      }
      return `<div class="combobox-item" onmousedown="OutletProfilePage._selectOutletFromCombobox('${o.code}')">
        <span class="combobox-item-label">${display}</span>
        <span class="combobox-item-brand">${o.brand}</span>
      </div>`;
    }).join('');
  },

  setTab(tab) {
    OutletProfilePage.activeTab = tab;
    const outlet = DB.get('outlets').find(o => o.code === OutletProfilePage.selectedOutletCode);
    if (outlet) {
      document.getElementById('profile-tab-content').innerHTML = OutletProfilePage._buildTabContent(outlet);
    }
    OutletProfilePage.afterRender();
    document.querySelectorAll('.dept-tab').forEach((el, i) => {
      const tabs = ['history', 'findings', 'aap'];
      el.classList.toggle('active', tabs[i] === tab);
    });
    if (window.lucide) lucide.createIcons();
  },

  // ---- Drill Down Modal ----
  openDrillDown(role, name) {
    const roleLabel = {
      outletManager: 'Outlet Manager',
      multiUnitManager: 'Multi Unit Manager',
      areaManager: 'Area Manager',
      distrikManager: 'Distrik Manager',
    }[role] || role;

    const outlets = DB.get('outlets').filter(o => o[role] === name);
    if (!outlets.length) {
      Toast.info(`Tidak ada outlet lain yang dikelola oleh ${name}.`, 'Drill Down');
      return;
    }

    const rows = outlets.map(o => {
      const pids = DB.get('audit_plannings').filter(p => p.outletCode === o.code).map(p => p.id);
      const fraudResults = DB.get('audit_results').filter(r => pids.includes(r.planningId) && r.nature === 'Fraud');
      const fraudCount = fraudResults.length;
      const totalLoss = fraudResults.reduce((s, r) => s + (parseInt(r.totalLoss) || 0), 0);
      const uniqueFraudsters = new Set(fraudResults.filter(r => r.fraudsterName).map(r => r.fraudsterName));
      return { outlet: o, fraudCount, totalLoss, fraudsterCount: uniqueFraudsters.size };
    });

    const totalFraudOutlets = rows.filter(r => r.fraudCount > 0).length;
    const totalFraudCases = rows.reduce((s, r) => s + r.fraudCount, 0);

    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="users"></i> Drill Down: ${roleLabel}</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom:var(--space-3)">
          <h4 style="font-size:15px;font-weight:700;color:var(--blue-light)">${Utils.escapeHtml(name)}</h4>
          <p style="font-size:12px;color:var(--text-muted)">
            Mengelola <strong>${outlets.length}</strong> outlet — <strong style="color:${totalFraudOutlets > 0 ? '#ef4444' : 'var(--text-muted)'}">${totalFraudOutlets} outlet</strong> dengan kasus fraud (${totalFraudCases} total temuan fraud)
          </p>
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead><tr>
              <th>Outlet</th>
              <th>Brand</th>
              <th>Province</th>
              <th>Fraud Cases</th>
              <th>Total Loss</th>
              <th>Fraudster Count</th>
            </tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr style="cursor:pointer" data-action="op-go-to-outlet" data-outlet-code="${r.outlet.code}" title="Klik untuk lihat profil outlet">
                  <td class="col-bold"><span class="col-mono">${r.outlet.code}</span> ${Utils.escapeHtml(r.outlet.name)}</td>
                  <td>${Utils.statusBadge(r.outlet.brand)}</td>
                  <td style="font-size:11px">${r.outlet.province}</td>
                  <td>${r.fraudCount > 0 ? `<span class="badge badge-red">${r.fraudCount}</span>` : '<span style="color:var(--text-muted)">0</span>'}</td>
                  <td style="font-size:12px;font-weight:600">Rp ${Utils.formatIDR(r.totalLoss)}</td>
                  <td style="font-size:12px">${r.fraudsterCount > 0 ? r.fraudsterCount : '-'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="export-drill-down" data-role="${role}" data-name="${Utils.escapeHtml(name).replace(/'/g, "\\'")}">
          <i data-lucide="download"></i> Export CSV
        </button>
        <button class="btn btn-secondary" data-action="modal-close">Tutup</button>
      </div>`, 'modal-lg');
    if (window.lucide) lucide.createIcons();
  },

  showManagerHistory(outletCode, role, name) {
    const roleLabel = {
      outletManager: 'Outlet Manager',
      multiUnitManager: 'Multi Unit Manager',
      areaManager: 'Area Manager',
      distrikManager: 'Distrik Manager',
    }[role] || role;

    const outlet = DB.get('outlets').find(o => o.code === outletCode);
    const plannings = DB.get('audit_plannings')
      .filter(p => p.outletCode === outletCode)
      .filter(p => {
        if (role === 'outletManager') return p.outletManager === name;
        if (role === 'multiUnitManager') return p.multiUnitManager === name;
        if (role === 'areaManager') return p.areaManager === name;
        if (role === 'distrikManager') return p.distrikManager === name;
        return false;
      })
      .sort((a, b) => (b.planningDate || '').localeCompare(a.planningDate || ''));

    const title = outlet ? `${name} — ${outletCode} ${outlet.name}` : name;

    let html = '';
    if (plannings.length === 0) {
      html = `<div style="text-align:center;padding:40px;color:var(--text-muted)">
        <i data-lucide="clipboard-list" style="width:36px;height:36px;margin-bottom:var(--space-2)"></i>
        <p style="font-size:13px">Belum ada audit planning yang melibatkan <strong>${Utils.escapeHtml(name)}</strong> sebagai ${roleLabel} di outlet ini.</p>
      </div>`;
    } else {
      html = `
        <div style="margin-bottom:var(--space-3)">
          <p style="font-size:12px;color:var(--text-muted)">Ditemukan <strong>${plannings.length}</strong> audit planning</p>
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead><tr>
              <th>No. Laporan</th>
              <th>Tgl Planning</th>
              <th>Periode Audit</th>
              <th>Trigger</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr></thead>
            <tbody>
              ${plannings.map(p => `
                <tr>
                  <td class="col-bold" style="font-size:12px">${p.reportNo}</td>
                  <td style="font-size:11px">${Utils.formatDate(p.planningDate)}</td>
                  <td style="font-size:11px">${Utils.formatDate(p.auditDateFrom)} — ${Utils.formatDate(p.auditDateTo)}</td>
                  <td><span class="badge ${p.trigger === 'WBS' ? 'badge-purple' : p.trigger === 'FDS' ? 'badge-cyan' : 'badge-gray'}">${p.trigger}</span></td>
                  <td>${Utils.laporanBadge(p.status)}</td>
                  <td>
                    <button class="btn btn-icon btn-secondary btn-sm" data-action="view-planning-from-outlet" data-planning-id="${p.id}" title="Lihat Detail">
                      <i data-lucide="eye"></i>
                    </button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    }

    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="users"></i> History: ${roleLabel}</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <h4 style="font-size:15px;font-weight:700;color:var(--blue-light);margin-bottom:var(--space-3)">${Utils.escapeHtml(title)}</h4>
        ${html}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="modal-close">Tutup</button>
      </div>`, 'modal-lg');
    if (window.lucide) lucide.createIcons();
  },

  _goToOutlet(code) {
    Modal.close();
    OutletProfilePage.selectedOutletCode = code;
    OutletProfilePage.render();
  },

  _exportDrillDown(role, name) {
    const outlets = DB.get('outlets').filter(o => o[role] === name);
    let csv = '\uFEFFOutlet,Brand,Province,Fraud Cases,Total Loss,Fraudster Count\n';
    outlets.forEach(o => {
      const pids = DB.get('audit_plannings').filter(p => p.outletCode === o.code).map(p => p.id);
      const fraudResults = DB.get('audit_results').filter(r => pids.includes(r.planningId) && r.nature === 'Fraud');
      const fc = fraudResults.length;
      const tl = fraudResults.reduce((s, r) => s + (parseInt(r.totalLoss) || 0), 0);
      const fs = new Set(fraudResults.filter(r => r.fraudsterName).map(r => r.fraudsterName)).size;
      csv += `${o.code} - ${o.name},${o.brand},${o.province},${fc},${tl},${fs}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DrillDown_${role}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    Toast.success('CSV exported.');
  },

  // ---- CSV Export ----
  exportCsv() {
    const outlet = DB.get('outlets').find(o => o.code === OutletProfilePage.selectedOutletCode);
    if (!outlet) return;

    let csv = '\uFEFF';
    let filename = '';

    if (OutletProfilePage.activeTab === 'history') {
      csv += 'No. Laporan,Tgl Planning,Trigger,Lead Auditor,Findings,Fraud,Status\n';
      const plannings = DB.get('audit_plannings').filter(p => p.outletCode === outlet.code);
      plannings.forEach(p => {
        const results = DB.get('audit_results').filter(r => r.planningId === p.id);
        const fraudCount = results.filter(r => r.nature === 'Fraud').length;
        const lead = DB.get('auditors').find(a => a.id === p.leadAuditor);
        csv += `${p.reportNo},${p.planningDate},${p.trigger},${lead ? lead.name : '-'},${results.length},${fraudCount},${p.status}\n`;
      });
      filename = `AuditHistory_${outlet.code}_${new Date().toISOString().split('T')[0]}.csv`;

    } else if (OutletProfilePage.activeTab === 'findings') {
      csv += 'No.,Judul Temuan,Kategori,Nature,Severity,Total Loss,Status,Fraudster Name,Fraudster NIK,Fraudster Jabatan\n';
      const pids = DB.get('audit_plannings').filter(p => p.outletCode === outlet.code).map(p => p.id);
      const results = DB.get('audit_results').filter(r => pids.includes(r.planningId));
      results.forEach(r => {
        csv += `${r.findingNo},"${(r.findingTitle || '').replace(/"/g, '""')}",${r.category},${r.nature},${r.severity},${r.totalLoss || 0},${r.status || 'Open'},${r.fraudsterName || ''},${r.fraudsterNik || ''},${r.fraudsterPosition || ''}\n`;
      });
      filename = `Findings_${outlet.code}_${new Date().toISOString().split('T')[0]}.csv`;

    } else if (OutletProfilePage.activeTab === 'aap') {
      csv += 'No. AAP,Finding No.,Tindakan,PIC,Target Amount,Due Date,Recovery,Unrecovered,Status\n';
      const pids = DB.get('audit_plannings').filter(p => p.outletCode === outlet.code).map(p => p.id);
      const actions = DB.get('audit_actions').filter(a => pids.includes(a.planningId));
      actions.forEach(a => {
        const finding = DB.get('audit_results').find(r => r.id === a.resultId);
        csv += `${a.actionNo},${finding ? finding.findingNo : '-'},"${(a.actionTitle || '').replace(/"/g, '""')}",${a.picName},${a.amount || 0},${a.dueDate || ''},${a.recovery || 0},${a.unrecovered || 0},${a.status}\n`;
      });
      filename = `AAP_${outlet.code}_${new Date().toISOString().split('T')[0]}.csv`;
    }

    if (!filename) return;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    Toast.success('CSV exported.');
  },
};

window.OutletProfilePage = OutletProfilePage;
