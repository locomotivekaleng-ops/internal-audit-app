/* ============================================================
   MASTER DATA PAGE
   ============================================================ */

const MasterPage = {
  activeTab: 'brands',

  render() {
    if (!Auth.requireAuth()) return;
    if (!Auth.isHead()) { Router.navigate('dashboard'); return; }
    Components.renderAppShell(
      'Master Data',
      'Manage brands, categories, outlets, and provinces',
      MasterPage.buildHtml(),
      'master'
    );
    MasterPage._pageWired = false;
    MasterPage.afterRender();
  },

  afterRender() {
    if (!MasterPage._pageWired) {
      MasterPage._pageWired = true;
      PageLifecycle.delegate('page-content', {
        click: {
          '[data-action="master-tab"]': (e, target) => this.setTab(target.dataset.tab),
          '[data-action="master-import"]': () => this.openImportModal(),
          '[data-action="master-add"][data-entity="brand"]': () => this.openBrandModal(null),
          '[data-action="master-add"][data-entity="category"]': () => this.openCatModal(null),
          '[data-action="master-add"][data-entity="outlet"]': () => this.openOutletModal(null),
          '[data-action="master-add"][data-entity="province"]': () => this.openProvinceModal(null),
          '[data-action="master-add"][data-entity="department"]': () => this.openDeptModal(null),
          '[data-action="master-edit"]': (e, target) => {
            const entity = target.dataset.entity;
            const id = target.dataset.entityId;
            if (entity === 'brand') this.openBrandModal(id);
            else if (entity === 'category') this.openCatModal(id);
            else if (entity === 'outlet') this.openOutletModal(id);
            else if (entity === 'province') this.openProvinceModal(id);
            else if (entity === 'department') this.openDeptModal(id);
          },
          '[data-action="master-delete"]': (e, target) => {
            const entity = target.dataset.entity;
            const id = target.dataset.entityId;
            if (entity === 'brand') this.deleteBrand(id);
            else if (entity === 'category') this.deleteCat(id);
            else if (entity === 'outlet') this.deleteOutlet(id);
            else if (entity === 'province') this.deleteProvince(id);
            else if (entity === 'department') this.deleteDept(id);
          },
          '[data-action="master-outlet-profile"]': (e, target) => {
            OutletProfilePage.selectedOutletCode = target.dataset.outletCode;
            Router.navigate('outlet-profile');
          },
        }
      });
    }
    if (!MasterPage._modalWired) {
      MasterPage._modalWired = true;
      PageLifecycle.delegate('modal-overlay', {
        click: {
          '[data-action="save-master"]': (e, target) => {
            const entity = target.dataset.entity;
            const id = target.dataset.editId || '';
            if (entity === 'brand') this.saveBrand(id);
            else if (entity === 'category') this.saveCat(id);
            else if (entity === 'outlet') this.saveOutlet(id);
            else if (entity === 'province') this.saveProvince(id);
            else if (entity === 'department') this.saveDept(id);
          },
          '[data-action="master-process-import"]': () => this.processImport(),
        },
        change: {
          '[data-action="master-file-select"]': (e) => this.handleFileSelect(e),
        }
      });
    }
  },

  buildHtml() {
    const tabs = [
      { id: 'brands',           label: 'Brands',           icon: 'tag' },
      { id: 'fraud_categories', label: 'Fraud Categories', icon: 'alert-triangle' },
      { id: 'outlets',          label: 'Outlets',          icon: 'store' },
      { id: 'provinces',        label: 'Provinces',        icon: 'map-pin' },
      { id: 'departments',      label: 'Departments',      icon: 'building' },
    ];

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h2>Master Data</h2>
          <p>Manage lookup data for the system</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="dept-tabs">
        ${tabs.map(t => `
          <div class="dept-tab ${MasterPage.activeTab === t.id ? 'active' : ''}" data-action="master-tab" data-tab="${t.id}">
            <span>${t.label}</span>
          </div>`).join('')}
      </div>

      <!-- Tab Content -->
      <div id="master-content">
        ${MasterPage.buildTabContent()}
      </div>`;
  },

  buildTabContent() {
    switch (MasterPage.activeTab) {
      case 'brands':           return MasterPage.buildBrandsTab();
      case 'fraud_categories': return MasterPage.buildCategoriesTab();
      case 'outlets':          return MasterPage.buildOutletsTab();
      case 'provinces':        return MasterPage.buildProvincesTab();
      case 'departments':      return MasterPage.buildDepartmentsTab();
      default: return '';
    }
  },

  // ---- BRANDS ----
  buildBrandsTab() {
    const brands = DB.get('brands');
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="tag"></i> Brands</div>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" data-action="master-import"><i data-lucide="upload"></i> Import CSV</button>
            <button class="btn btn-primary btn-sm" data-action="master-add" data-entity="brand"><i data-lucide="plus"></i> Add Brand</button>
          </div>
        </div>
        <div class="card-body" style="padding-top:0">
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead><tr><th>#</th><th>ID</th><th>Brand Name</th><th>Color</th><th>Description</th><th>Actions</th></tr></thead>
              <tbody>
                ${brands.map((b,i) => `<tr>
                  <td class="col-number">${i+1}</td>
                  <td class="col-mono">${b.id}</td>
                  <td class="col-bold">
                    <span style="display:inline-flex;align-items:center;gap:8px">
                      <span style="width:12px;height:12px;border-radius:50%;background:${b.color}"></span>
                      ${b.name}
                    </span>
                  </td>
                  <td><span class="col-mono" style="color:${b.color}">${b.color}</span></td>
                  <td style="font-size:11px;color:var(--text-muted)">${b.description||''}</td>
                  <td><div class="flex gap-2">
                    <button class="btn btn-icon btn-secondary btn-sm" data-action="master-edit" data-entity="brand" data-entity-id="${b.id}"><i data-lucide="pencil"></i></button>
                    <button class="btn btn-icon btn-danger btn-sm" data-action="master-delete" data-entity="brand" data-entity-id="${b.id}"><i data-lucide="trash-2"></i></button>
                  </div></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  },

  openBrandModal(id) {
    const b = id ? DB.find('brands', id) : null;
    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="tag"></i> ${b ? 'Edit' : 'Add'} Brand</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-grid form-grid-2">
          <div class="form-group">
            <label class="form-label required">Brand ID (code)</label>
            <input type="text" class="form-control" id="br-id" value="${Utils.escapeHtml(b?.id||'')}" ${b?'readonly':''} placeholder="e.g. PHD" />
          </div>
          <div class="form-group">
            <label class="form-label required">Brand Name</label>
            <input type="text" class="form-control" id="br-name" value="${Utils.escapeHtml(b?.name||'')}" placeholder="e.g. Pizza Hut Delivery" />
          </div>
          <div class="form-group">
            <label class="form-label required">Color</label>
            <input type="text" class="form-control" id="br-color" value="${b?.color||'#3b82f6'}" placeholder="e.g. #3b82f6" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Description</label>
            <textarea class="form-control" id="br-desc" rows="3" placeholder="Optional description">${Utils.escapeHtml(b?.description||'')}</textarea>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="modal-close">Cancel</button>
        <button class="btn btn-primary" data-action="save-master" data-entity="brand" data-edit-id="${id||''}"><i data-lucide="save"></i> Save</button>
      </div>`, 'modal-sm');
    if (window.lucide) lucide.createIcons();
  },

  saveBrand(id) {
    const data = {
      id:          document.getElementById('br-id').value.trim(),
      name:        document.getElementById('br-name').value.trim(),
      color:       document.getElementById('br-color').value,
      description: document.getElementById('br-desc').value,
    };
    if (!data.id || !data.name) { Toast.error('ID and Name are required.'); return; }
    if (id) {
      const brands = DB.get('brands').map(b => b.id === id ? { ...b, ...data } : b);
      DB.set('brands', brands);
      Toast.success('Brand updated.');
    } else {
      if (DB.get('brands').find(b => b.id === data.id)) { Toast.error('Brand ID already exists.'); return; }
      DB.insert('brands', data);
      Toast.success('Brand added.');
    }
    Modal.close();
    MasterPage.refreshTab();
  },

  _countRefs(table, field, value) {
    return DB.get(table).filter(r => r[field] === value).length;
  },

  deleteBrand(id) {
    const refs = this._countRefs('outlets','brand',id) + this._countRefs('wbs_cases','brand',id)
               + this._countRefs('fds_cases','brand',id) + this._countRefs('audit_plannings','brand',id);
    if (refs > 0) {
      Toast.error(`Tidak dapat menghapus brand: masih digunakan oleh ${refs} data transaksi. Hapus atau ubah referensi terlebih dahulu.`);
      return;
    }
    Modal.confirm('Delete Brand', 'Delete this brand?', () => {
      DB.delete('brands', id);
      Toast.success('Brand deleted.');
      MasterPage.refreshTab();
    });
  },

  // ---- CATEGORIES ----
  buildCategoriesTab() {
    const cats = DB.get('fraud_categories');
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="alert-triangle"></i> Fraud & Admin Categories</div>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" data-action="master-import"><i data-lucide="upload"></i> Import CSV</button>
            <button class="btn btn-primary btn-sm" data-action="master-add" data-entity="category"><i data-lucide="plus"></i> Add Category</button>
          </div>
        </div>
        <div class="card-body" style="padding-top:0">
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead><tr><th>#</th><th>Category Name</th><th>Tipe (Nature)</th><th>Color</th><th>Description</th><th>Actions</th></tr></thead>
              <tbody>
                ${cats.map((c,i) => `<tr>
                  <td class="col-number">${i+1}</td>
                  <td class="col-bold">
                    <span style="display:inline-flex;align-items:center;gap:8px">
                      <span style="width:12px;height:12px;border-radius:4px;background:${c.color}"></span>
                      ${c.name}
                    </span>
                  </td>
                  <td>
                    ${c.nature === 'Administrative'
                      ? `<span class="badge badge-purple" style="background:rgba(59,130,246,0.12);color:#3b82f6">Administratif</span>`
                      : `<span class="badge badge-red" style="background:rgba(239,68,68,0.12);color:#ef4444">Fraud</span>`}
                  </td>
                  <td><span class="col-mono" style="color:${c.color}">${c.color}</span></td>
                  <td style="font-size:11px;color:var(--text-muted)">${c.description||''}</td>
                  <td><div class="flex gap-2">
                    <button class="btn btn-icon btn-secondary btn-sm" data-action="master-edit" data-entity="category" data-entity-id="${c.id}"><i data-lucide="pencil"></i></button>
                    <button class="btn btn-icon btn-danger btn-sm" data-action="master-delete" data-entity="category" data-entity-id="${c.id}"><i data-lucide="trash-2"></i></button>
                  </div></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  },

  openCatModal(id) {
    const c = id ? DB.find('fraud_categories', id) : null;
    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="alert-triangle"></i> ${c ? 'Edit' : 'Add'} Category</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-grid form-grid-2">
          <div class="form-group" style="grid-column:span 2">
            <label class="form-label required">Category Name</label>
            <input type="text" class="form-control" id="cat-name" value="${Utils.escapeHtml(c?.name||'')}" placeholder="e.g. Sales Fraud" />
          </div>
          <div class="form-group" style="grid-column:span 2">
            <label class="form-label required">Tipe Kategori (Nature)</label>
            <select class="form-control" id="cat-nature">
              <option value="Fraud" ${(!c?.nature || c?.nature === 'Fraud') ? 'selected' : ''}>Fraud (Finansial)</option>
              <option value="Administrative" ${c?.nature === 'Administrative' ? 'selected' : ''}>Administrative (Non-Finansial)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Color</label>
            <input type="color" class="form-control" id="cat-color" value="${c?.color||'#3b82f6'}" style="height:42px;padding:4px" />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <input type="text" class="form-control" id="cat-desc" value="${Utils.escapeHtml(c?.description||'')}" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="modal-close">Cancel</button>
        <button class="btn btn-primary" data-action="save-master" data-entity="category" data-edit-id="${id||''}"><i data-lucide="save"></i> Save</button>
      </div>`, 'modal-sm');
    if (window.lucide) lucide.createIcons();
  },

  saveCat(id) {
    const data = {
      name: document.getElementById('cat-name').value.trim(),
      color: document.getElementById('cat-color').value,
      description: document.getElementById('cat-desc').value,
      nature: document.getElementById('cat-nature').value
    };
    if (!data.name) { Toast.error('Name is required.'); return; }
    if (id) {
      DB.update('fraud_categories', id, data);
      Toast.success('Category updated.');
    } else {
      DB.insert('fraud_categories', data);
      Toast.success('Category added.');
    }
    Modal.close();
    MasterPage.refreshTab();
  },

  deleteCat(id) {
    const refs = this._countRefs('wbs_cases','category',id) + this._countRefs('fds_cases','category',id)
               + this._countRefs('audit_results','category',id);
    if (refs > 0) {
      Toast.error(`Tidak dapat menghapus kategori: masih digunakan oleh ${refs} data transaksi. Hapus atau ubah referensi terlebih dahulu.`);
      return;
    }
    Modal.confirm('Delete Category', 'Delete this fraud category?', () => {
      DB.delete('fraud_categories', id);
      Toast.success('Category deleted.');
      MasterPage.refreshTab();
    });
  },

  // ---- OUTLETS ----
  buildOutletsTab() {
    const outlets  = DB.get('outlets');
    const brands   = DB.get('brands');
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="store"></i> Outlets (${outlets.length})</div>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" data-action="master-import"><i data-lucide="upload"></i> Import CSV</button>
            <button class="btn btn-primary btn-sm" data-action="master-add" data-entity="outlet"><i data-lucide="plus"></i> Add Outlet</button>
          </div>
        </div>
        <div class="card-body" style="padding-top:0">
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead><tr><th>#</th><th>Code</th><th>Outlet Name</th><th>Brand</th><th>Province</th><th>Outlet Manager</th><th>Multi Unit Manager</th><th>Area Manager</th><th>Distrik Manager</th><th>Actions</th></tr></thead>
              <tbody>
                  ${outlets.map((o,i) => `<tr>
                    <td class="col-number">${i+1}</td>
                    <td class="col-mono col-bold">${o.code}</td>
                    <td>${o.name}</td>
                    <td>${Utils.statusBadge(o.brand)}</td>
                    <td style="font-size:11px">${o.province}</td>
                    <td style="font-size:11px">${o.outletManager || '-'}</td>
                    <td style="font-size:11px">${o.multiUnitManager || '-'}</td>
                    <td style="font-size:11px">${o.areaManager || '-'}</td>
                    <td style="font-size:11px">${o.distrikManager || '-'}</td>
                    <td><div class="flex gap-2">
                    <button class="btn btn-icon btn-secondary btn-sm" data-action="master-edit" data-entity="outlet" data-entity-id="${o.id}" title="Edit"><i data-lucide="pencil"></i></button>
                    <button class="btn btn-icon btn-primary btn-sm" data-action="master-outlet-profile" data-outlet-code="${o.code}" title="Profile"><i data-lucide="store"></i></button>
                    <button class="btn btn-icon btn-danger btn-sm" data-action="master-delete" data-entity="outlet" data-entity-id="${o.id}" title="Hapus"><i data-lucide="trash-2"></i></button>
                  </div></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  },

  openOutletModal(id) {
    const o = id ? DB.find('outlets', id) : null;
    const brands    = DB.get('brands');
    const provinces = DB.get('provinces');
    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="store"></i> ${o ? 'Edit' : 'Add'} Outlet</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-grid form-grid-2">
          <div class="form-group">
            <label class="form-label required">Outlet Code</label>
            <input type="text" class="form-control" id="ol-code" value="${Utils.escapeHtml(o?.code||'')}" placeholder="e.g. R241" />
          </div>
          <div class="form-group">
            <label class="form-label required">Outlet Name</label>
            <input type="text" class="form-control" id="ol-name" value="${Utils.escapeHtml(o?.name||'')}" />
          </div>
          <div class="form-group">
            <label class="form-label required">Brand</label>
            <select class="form-control" id="ol-brand">
              ${brands.map(b=>`<option value="${b.id}" ${o?.brand===b.id?'selected':''}>${b.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Province</label>
            <select class="form-control" id="ol-prov">
              ${provinces.map(p=>`<option value="${p.id}" ${o?.province===p.id?'selected':''}>${p.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Outlet Manager</label>
            <input type="text" class="form-control" id="ol-outlet-manager" value="${Utils.escapeHtml(o?.outletManager||'')}" placeholder="Nama Outlet Manager" />
          </div>
          <div class="form-group">
            <label class="form-label">Multi Unit Manager</label>
            <input type="text" class="form-control" id="ol-multi-unit-manager" value="${Utils.escapeHtml(o?.multiUnitManager||'')}" placeholder="Nama Multi Unit Manager" />
          </div>
          <div class="form-group">
            <label class="form-label">Area Manager</label>
            <input type="text" class="form-control" id="ol-area-manager" value="${Utils.escapeHtml(o?.areaManager||'')}" placeholder="Nama Area Manager" />
          </div>
          <div class="form-group">
            <label class="form-label">Distrik Manager</label>
            <input type="text" class="form-control" id="ol-distrik-manager" value="${Utils.escapeHtml(o?.distrikManager||'')}" placeholder="Nama Distrik Manager" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="modal-close">Cancel</button>
        <button class="btn btn-primary" data-action="save-master" data-entity="outlet" data-edit-id="${id||''}"><i data-lucide="save"></i> Save</button>
      </div>`, 'modal-lg');
    if (window.lucide) lucide.createIcons();
  },

  saveOutlet(id) {
    const data = {
      code:     document.getElementById('ol-code').value.trim().toUpperCase(),
      name:     document.getElementById('ol-name').value.trim(),
      brand:    document.getElementById('ol-brand').value,
      province: document.getElementById('ol-prov').value,
      outletManager:    document.getElementById('ol-outlet-manager')?.value.trim() || '',
      multiUnitManager: document.getElementById('ol-multi-unit-manager')?.value.trim() || '',
      areaManager:      document.getElementById('ol-area-manager')?.value.trim() || '',
      distrikManager:   document.getElementById('ol-distrik-manager')?.value.trim() || '',
    };
    if (!data.code || !data.name) { Toast.error('Code and Name are required.'); return; }
    if (id) {
      DB.update('outlets', id, data);
      Toast.success('Outlet updated.');
    } else {
      const newOutlet = { ...data, id: data.code };
      if (DB.get('outlets').find(o => o.id === data.code)) { Toast.error('Outlet code already exists.'); return; }
      DB.insert('outlets', newOutlet);
      Toast.success('Outlet added.');
    }
    Modal.close();
    MasterPage.refreshTab();
  },

  deleteOutlet(id) {
    const outlet = DB.find('outlets', id);
    if (!outlet) return;
    const refs = this._countRefs('wbs_cases','outletCode',outlet.code)
               + this._countRefs('fds_cases','outletCode',outlet.code)
               + this._countRefs('audit_plannings','outletCode',outlet.code);
    if (refs > 0) {
      Toast.error(`Tidak dapat menghapus outlet: masih digunakan oleh ${refs} data transaksi. Hapus atau ubah referensi terlebih dahulu.`);
      return;
    }
    Modal.confirm('Delete Outlet', 'Delete this outlet?', () => {
      DB.delete('outlets', id);
      Toast.success('Outlet deleted.');
      MasterPage.refreshTab();
    });
  },

  // ---- PROVINCES ----
  buildProvincesTab() {
    const provinces = DB.get('provinces');
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="map-pin"></i> Provinces (${provinces.length})</div>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" data-action="master-import"><i data-lucide="upload"></i> Import CSV</button>
            <button class="btn btn-primary btn-sm" data-action="master-add" data-entity="province"><i data-lucide="plus"></i> Add Province</button>
          </div>
        </div>
        <div class="card-body" style="padding-top:0">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-3)">
            ${provinces.map(p => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-3) var(--space-4);background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:var(--radius-md)">
                <div style="display:flex;align-items:center;gap:var(--space-2)">
                  <i data-lucide="map-pin" style="width:12px;height:12px;color:var(--blue-primary)"></i>
                  <span style="font-size:12px;font-weight:500">${p.name}</span>
                </div>
                <div class="flex gap-2">
                  <button class="btn btn-icon btn-secondary btn-sm" style="width:24px;height:24px" data-action="master-edit" data-entity="province" data-entity-id="${p.id}"><i data-lucide="pencil" style="width:10px;height:10px"></i></button>
                  <button class="btn btn-icon btn-danger btn-sm" style="width:24px;height:24px" data-action="master-delete" data-entity="province" data-entity-id="${p.id}"><i data-lucide="trash-2" style="width:10px;height:10px"></i></button>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
  },

  openProvinceModal(id) {
    const p = id ? DB.find('provinces', id) : null;
    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="map-pin"></i> ${p ? 'Edit' : 'Add'} Province</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label required">Province Name</label>
          <input type="text" class="form-control" id="pv-name" value="${Utils.escapeHtml(p?.name||'')}" placeholder="e.g. DKI Jakarta" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="modal-close">Cancel</button>
        <button class="btn btn-primary" data-action="save-master" data-entity="province" data-edit-id="${id||''}"><i data-lucide="save"></i> Save</button>
      </div>`, 'modal-sm');
    if (window.lucide) lucide.createIcons();
  },

  saveProvince(id) {
    const name = document.getElementById('pv-name').value.trim();
    if (!name) { Toast.error('Province name is required.'); return; }
    if (id) { DB.update('provinces', id, { name }); Toast.success('Province updated.'); }
    else    { DB.insert('provinces', { name }); Toast.success('Province added.'); }
    Modal.close();
    MasterPage.refreshTab();
  },

  deleteProvince(id) {
    const refs = this._countRefs('outlets','province',id) + this._countRefs('wbs_cases','province',id)
               + this._countRefs('fds_cases','province',id) + this._countRefs('audit_plannings','province',id);
    if (refs > 0) {
      Toast.error(`Tidak dapat menghapus provinsi: masih digunakan oleh ${refs} data transaksi. Hapus atau ubah referensi terlebih dahulu.`);
      return;
    }
    Modal.confirm('Delete Province', 'Delete this province?', () => {
      DB.delete('provinces', id);
      Toast.success('Province deleted.');
      MasterPage.refreshTab();
    });
  },

  // ---- DEPARTMENTS ----
  buildDepartmentsTab() {
    const depts = DB.get('departments');
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="building"></i> Departments (${depts.length})</div>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" data-action="master-import"><i data-lucide="upload"></i> Import CSV</button>
            <button class="btn btn-primary btn-sm" data-action="master-add" data-entity="department"><i data-lucide="plus"></i> Add Department</button>
          </div>
        </div>
        <div class="card-body" style="padding-top:0">
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead><tr><th>#</th><th>Department Name</th><th>Code</th><th>Actions</th></tr></thead>
              <tbody>
                ${depts.map((d,i) => `<tr>
                  <td class="col-number">${i+1}</td>
                  <td class="col-bold">${d.name}</td>
                  <td class="col-mono">${d.code}</td>
                  <td><div class="flex gap-2">
                    <button class="btn btn-icon btn-secondary btn-sm" data-action="master-edit" data-entity="department" data-entity-id="${d.id}"><i data-lucide="pencil"></i></button>
                    <button class="btn btn-icon btn-danger btn-sm" data-action="master-delete" data-entity="department" data-entity-id="${d.id}"><i data-lucide="trash-2"></i></button>
                  </div></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  },

  openDeptModal(id) {
    const d = id ? DB.find('departments', id) : null;
    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="building"></i> ${d ? 'Edit' : 'Add'} Department</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-grid form-grid-2">
          <div class="form-group">
            <label class="form-label required">Department Name</label>
            <input type="text" class="form-control" id="dept-name" value="${Utils.escapeHtml(d?.name||'')}" placeholder="e.g. Operations" />
          </div>
          <div class="form-group">
            <label class="form-label required">Code</label>
            <input type="text" class="form-control" id="dept-code" value="${Utils.escapeHtml(d?.code||'')}" placeholder="e.g. OPS" ${d ? 'readonly' : ''} />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="modal-close">Cancel</button>
        <button class="btn btn-primary" data-action="save-master" data-entity="department" data-edit-id="${id||''}"><i data-lucide="save"></i> Save</button>
      </div>`, 'modal-sm');
    if (window.lucide) lucide.createIcons();
  },

  saveDept(id) {
    const data = {
      name: document.getElementById('dept-name').value.trim(),
      code: document.getElementById('dept-code').value.trim().toUpperCase(),
    };
    if (!data.name || !data.code) { Toast.error('Name and Code are required.'); return; }
    if (id) {
      DB.update('departments', id, data);
      Toast.success('Department updated.');
    } else {
      DB.insert('departments', data);
      Toast.success('Department added.');
    }
    Modal.close();
    MasterPage.refreshTab();
  },

  deleteDept(id) {
    const refs = this._countRefs('users','department',id) + this._countRefs('auditors','department',id)
               + this._countRefs('audit_plannings','department',id) + this._countRefs('audit_actions','picDepartment',id);
    if (refs > 0) {
      Toast.error(`Tidak dapat menghapus departemen: masih digunakan oleh ${refs} data transaksi. Hapus atau ubah referensi terlebih dahulu.`);
      return;
    }
    Modal.confirm('Delete Department', 'Delete this department?', () => {
      DB.delete('departments', id);
      Toast.success('Department deleted.');
      MasterPage.refreshTab();
    });
  },

  setTab(tab) {
    MasterPage.activeTab = tab;
    document.getElementById('master-content').innerHTML = MasterPage.buildTabContent();
    if (window.lucide) lucide.createIcons();
    // Also re-render tabs to update active
    const tabEls = document.querySelectorAll('.dept-tab');
    tabEls.forEach((el, i) => {
      const tabs = ['brands','fraud_categories','outlets','provinces','departments'];
      el.classList.toggle('active', tabs[i] === tab);
    });
  },

  refreshTab() {
    document.getElementById('master-content').innerHTML = MasterPage.buildTabContent();
    if (window.lucide) lucide.createIcons();
  },

  // ---- CSV UPLOAD AND PARSING ----
  openImportModal() {
    const tab = MasterPage.activeTab;
    let templateHeader = '';
    let description = '';
    let sampleData = '';

    if (tab === 'brands') {
      templateHeader = 'id,name,color,description';
      description = 'id (e.g. Hayo), name (Brand name), color (Hex code e.g. #10b981), description';
      sampleData = 'Hayo,Hayo Brand,#10b981,Hayo Brand description\nPHD,Pizza Hut Delivery,#3b82f6,Pizza Hut Delivery';
    } else if (tab === 'fraud_categories') {
      templateHeader = 'name,color,description,nature';
      description = 'name (Category name), color (Hex code e.g. #ef4444), description, nature (Fraud or Administrative)';
      sampleData = 'Loyalty Point,#3b82f6,Loyalty point fraud,Fraud\nSales,#10b981,Sales manipulation,Fraud';
    } else if (tab === 'outlets') {
      templateHeader = 'code,name,brand,province,outletManager,multiUnitManager,areaManager,distrikManager';
      description = 'code (Outlet code e.g. R241), name (Outlet name), brand (e.g. PHR), province (e.g. Jawa Barat), outletManager, multiUnitManager, areaManager, distrikManager';
      sampleData = 'R241,Depok Dua Tengah,PHR,Jawa Barat,Ahmad Fauzi,Rina Fitriani,Hendra Gunawan,Bambang Suprapto\nC057,Kenjeran Surabaya,PHD,Jawa Timur,Dwi Cahyono,Rina Fitriani,Hendra Gunawan,Bambang Suprapto';
    } else if (tab === 'provinces') {
      templateHeader = 'name';
      description = 'name (Province name)';
      sampleData = 'DKI Jakarta\nJawa Barat\nJawa Timur';
    } else if (tab === 'departments') {
      templateHeader = 'name,code';
      description = 'name (Department name), code (e.g. OPS)';
      sampleData = 'Operations,OPS\nMarketing,MKT\nFinance,FIN';
    }

    const csvTemplate = templateHeader + '\n' + sampleData;
    const downloadHref = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvTemplate);

    Modal.open(`
      <div class="modal-header">
        <div class="modal-title"><i data-lucide="upload"></i> Import CSV — ${MasterPage.getTabLabel(tab)}</div>
        <button class="modal-close" data-action="modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom:var(--space-4)">
          <p style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">
            Upload CSV file with columns: <strong style="color:var(--blue-light)">${templateHeader}</strong>
          </p>
          <p style="font-size:11px;color:var(--text-muted)">
            <strong>Fields:</strong> ${description}
          </p>
        </div>
        
        <div style="background:rgba(255,255,255,0.02);border:1.5px dashed var(--border-color);border-radius:var(--radius-lg);padding:var(--space-6);text-align:center;position:relative;margin-bottom:var(--space-4);transition:all 0.2s" id="csv-dropzone">
          <i data-lucide="file-text" style="width:36px;height:36px;color:var(--text-muted);margin:0 auto var(--space-2)"></i>
          <p style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:2px">Drag & drop CSV file here</p>
          <p style="font-size:11px;color:var(--text-muted);margin-bottom:var(--space-2)">or click to browse</p>
          <input type="file" id="csv-file-input" accept=".csv" style="position:absolute;inset:0;opacity:0;cursor:pointer" data-action="master-file-select" />
        </div>
        
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px">
          <a href="${downloadHref}" download="template_${tab}.csv" class="btn btn-secondary btn-sm" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px">
            <i data-lucide="download" style="width:12px;height:12px"></i> Download CSV Template
          </a>
          <span style="color:var(--text-muted)" id="csv-file-name">No file selected</span>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="modal-close">Cancel</button>
        <button class="btn btn-primary" id="import-submit-btn" disabled data-action="master-process-import">
          <i data-lucide="check"></i> Import Data
        </button>
      </div>
    `, 'modal-md');

    if (window.lucide) lucide.createIcons();

    const dropzone = document.getElementById('csv-dropzone');
    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--blue-primary)';
        dropzone.style.background = 'rgba(59,130,246,0.05)';
      });
      ['dragleave', 'drop'].forEach(evt => {
        dropzone.addEventListener(evt, () => {
          dropzone.style.borderColor = 'var(--border-color)';
          dropzone.style.background = 'rgba(255,255,255,0.02)';
        });
      });
    }
  },

  getTabLabel(tab) {
    const map = {
      brands: 'Brands',
      fraud_categories: 'Fraud Categories',
      outlets: 'Outlets',
      provinces: 'Provinces',
      departments: 'Departments'
    };
    return map[tab] || tab;
  },

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('csv-file-name').textContent = file.name;
    document.getElementById('import-submit-btn').removeAttribute('disabled');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      MasterPage.parsedCsvContent = event.target.result;
    };
    reader.readAsText(file);
  },

  parseCSV(text) {
    const lines = text.split(/\r?\n/);
    const result = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const row = [];
      let insideQuote = false;
      let entry = '';
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          row.push(entry.trim());
          entry = '';
        } else {
          entry += char;
        }
      }
      row.push(entry.trim());
      const cleanRow = row.map(v => v.replace(/^"|"$/g, ''));
      result.push(cleanRow);
    }
    return result;
  },

  processImport() {
    const text = MasterPage.parsedCsvContent;
    if (!text) { Toast.error('Invalid CSV content.'); return; }
    
    const rows = MasterPage.parseCSV(text);
    if (rows.length < 2) { Toast.error('CSV missing data rows.'); return; }
    
    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dataRows = rows.slice(1);
    const tab = MasterPage.activeTab;
    
    let countSuccess = 0;
    let countErrors = 0;

    if (tab === 'brands') {
      const idIdx = headers.indexOf('id');
      const nameIdx = headers.indexOf('name');
      const colorIdx = headers.indexOf('color');
      const descIdx = headers.indexOf('description');
      
      if (idIdx === -1 || nameIdx === -1) {
        Toast.error('CSV columns must include "id" and "name"');
        return;
      }

      const brands = DB.get('brands');
      dataRows.forEach(row => {
        if (row.length <= Math.max(idIdx, nameIdx)) { countErrors++; return; }
        const id = row[idIdx]?.trim();
        const name = row[nameIdx]?.trim();
        if (!id || !name) { countErrors++; return; }
        const color = (colorIdx !== -1 && row[colorIdx]) ? row[colorIdx].trim() : '#3b82f6';
        const description = (descIdx !== -1 && row[descIdx]) ? row[descIdx].trim() : '';
        
        const existIdx = brands.findIndex(b => b.id === id);
        const record = { id, name, color, description };
        if (existIdx !== -1) { brands[existIdx] = { ...brands[existIdx], ...record }; }
        else { brands.push(record); }
        countSuccess++;
      });
      DB.set('brands', brands);

    } else if (tab === 'fraud_categories') {
      const nameIdx = headers.indexOf('name');
      const colorIdx = headers.indexOf('color');
      const descIdx = headers.indexOf('description');
      const natureIdx = headers.indexOf('nature');
      
      if (nameIdx === -1) {
        Toast.error('CSV columns must include "name"');
        return;
      }

      const cats = DB.get('fraud_categories');
      dataRows.forEach(row => {
        if (row.length <= nameIdx) { countErrors++; return; }
        const name = row[nameIdx]?.trim();
        if (!name) { countErrors++; return; }
        const color = (colorIdx !== -1 && row[colorIdx]) ? row[colorIdx].trim() : '#3b82f6';
        const description = (descIdx !== -1 && row[descIdx]) ? row[descIdx].trim() : '';
        const nature = (natureIdx !== -1 && row[natureIdx]) ? row[natureIdx].trim() : 'Fraud';
        
        const existIdx = cats.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
        const id = existIdx !== -1 ? cats[existIdx].id : 'cat_' + DB.genId();
        const record = { id, name, color, description, nature };
        if (existIdx !== -1) { cats[existIdx] = { ...cats[existIdx], ...record }; }
        else { cats.push(record); }
        countSuccess++;
      });
      DB.set('fraud_categories', cats);

    } else if (tab === 'outlets') {
      const codeIdx = headers.indexOf('code');
      const nameIdx = headers.indexOf('name');
      const brandIdx = headers.indexOf('brand');
      const provIdx = headers.indexOf('province');
      const omIdx = headers.indexOf('outletmanager');
      const mumIdx = headers.indexOf('multiunitmanager');
      const amIdx = headers.indexOf('areamanager');
      const dmIdx = headers.indexOf('distrikmanager');
      
      if (codeIdx === -1 || nameIdx === -1 || brandIdx === -1 || provIdx === -1) {
        Toast.error('CSV columns must include "code", "name", "brand", "province"');
        return;
      }

      const outlets = DB.get('outlets');
      const validBrands = DB.get('brands').map(b => b.id);
      const validProvs = DB.get('provinces').map(p => p.name);

      dataRows.forEach(row => {
        if (row.length <= Math.max(codeIdx, nameIdx, brandIdx, provIdx)) { countErrors++; return; }
        const code = row[codeIdx]?.trim().toUpperCase();
        const name = row[nameIdx]?.trim();
        const brand = row[brandIdx]?.trim();
        const province = row[provIdx]?.trim();
        if (!code || !name || !brand || !province) { countErrors++; return; }

        if (!validBrands.includes(brand)) {
          DB.insert('brands', { id: brand, name: brand, color: '#3b82f6', description: 'Auto-created via import' });
          validBrands.push(brand);
        }
        if (!validProvs.some(p => p.toLowerCase() === province.toLowerCase())) {
          DB.insert('provinces', { name: province });
          validProvs.push(province);
        }

        const existIdx = outlets.findIndex(o => o.code === code);
        const record = {
          id: code, code, name, brand, province,
          outletManager:    omIdx !== -1 && row[omIdx] ? row[omIdx].trim() : '',
          multiUnitManager: mumIdx !== -1 && row[mumIdx] ? row[mumIdx].trim() : '',
          areaManager:      amIdx !== -1 && row[amIdx] ? row[amIdx].trim() : '',
          distrikManager:   dmIdx !== -1 && row[dmIdx] ? row[dmIdx].trim() : '',
        };
        if (existIdx !== -1) { outlets[existIdx] = { ...outlets[existIdx], ...record }; }
        else { outlets.push(record); }
        countSuccess++;
      });
      DB.set('outlets', outlets);

    } else if (tab === 'provinces') {
      const nameIdx = headers.indexOf('name');
      if (nameIdx === -1) { Toast.error('CSV columns must include "name"'); return; }

      const provinces = DB.get('provinces');
      dataRows.forEach(row => {
        if (row.length <= nameIdx) { countErrors++; return; }
        const name = row[nameIdx]?.trim();
        if (!name) { countErrors++; return; }

        const exist = provinces.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (!exist) {
          provinces.push({ id: 'prov_' + DB.genId(), name });
        }
        countSuccess++;
      });
      DB.set('provinces', provinces);
    } else if (tab === 'departments') {
      const nameIdx = headers.indexOf('name');
      const codeIdx = headers.indexOf('code');
      if (nameIdx === -1 || codeIdx === -1) { Toast.error('CSV columns must include "name" and "code"'); return; }
      const depts = DB.get('departments');
      dataRows.forEach(row => {
        if (row.length <= Math.max(nameIdx, codeIdx)) { countErrors++; return; }
        const name = row[nameIdx]?.trim();
        const code = row[codeIdx]?.trim().toUpperCase();
        if (!name || !code) { countErrors++; return; }
        const exist = depts.find(d => d.code === code);
        const record = { name, code };
        if (exist) { Object.assign(exist, record); }
        else { depts.push({ id: 'dept_' + DB.genId(), ...record }); }
        countSuccess++;
      });
      DB.set('departments', depts);
    }

    Toast.success(`Imported ${countSuccess} records. Errors/skipped: ${countErrors}`);
    Modal.close();
    MasterPage.refreshTab();
  }
};

window.MasterPage = MasterPage;
