/* ============================================================
   REPORTS STUDIO — Modern report workspace
   ============================================================ */

const ReportsPage = {

  // ─── State ───
  _colSelectorOpen: false,
  _previewFull: false,
  previewPage: 1,
  previewPageSize: 15,
  activeCategory: 'audit',
  activeReport: null,
  filters: {
    search: '', dateFrom: '', dateTo: '', brand: '', department: '', auditor: '', trigger: '',
  },
  _columnState: {},
  _numericCols: new Set(['totalLoss','target','recovery','unrecovered','outstanding','count','daysOverdue','daysToClose','jmlPlanning','jmlTemuan','jmlOutlet','fraud','admin','age']),

  // ─── Category definitions ───
  categories: [
    { id: 'audit',    icon: 'search-check',  label: 'Audit Reports' },
    { id: 'followup', icon: 'check-circle',  label: 'Follow-up / AAP Reports' },
    { id: 'fraud',    icon: 'alert-triangle',label: 'Fraud Reports' },
    { id: 'summary',  icon: 'bar-chart-3',   label: 'Summary Reports' },
  ],

  // ─── Template definitions ───
  templates: {
    // -- Audit --
    'audit-planning': {
      id: 'audit-planning', category: 'audit',
      title: 'Audit Planning', icon: 'clipboard-list',
      description: 'Daftar seluruh audit planning dengan informasi manajer outlet',
      defaultColumns: ['no','reportNo','planningDate','trigger','brand','outlet','leadAuditor','status'],
      allColumns: [
        { key:'no', label:'#' }, { key:'reportNo', label:'No. Laporan' },
        { key:'planningDate', label:'Tgl Planning' }, { key:'trigger', label:'Trigger' },
        { key:'triggerRef', label:'Ref Trigger' }, { key:'brand', label:'Brand' },
        { key:'outlet', label:'Outlet' }, { key:'province', label:'Provinsi' },
        { key:'outletManager', label:'Outlet Manager' },
        { key:'multiUnitManager', label:'Multi Unit Mgr' },
        { key:'areaManager', label:'Area Manager' },
        { key:'distrikManager', label:'Distrik Manager' },
        { key:'department', label:'Departemen' }, { key:'auditType', label:'Tipe Audit' },
        { key:'leadAuditor', label:'Lead Auditor' },
        { key:'auditDateFrom', label:'Tgl Mulai' },
        { key:'auditDateTo', label:'Tgl Selesai' },
        { key:'scope', label:'Scope' }, { key:'status', label:'Status' },
      ],
      getKPIs(d) {
        const total = d.plannings.length;
        const done = d.plannings.filter(p => p.status === 'Completed').length;
        const ip = d.plannings.filter(p => p.status === 'In Progress').length;
        const pct = total ? Math.round(done/total*100) : 0;
        return [
          { label:'Total Planning', value:total, color:'blue' },
          { label:'Completed', value:done, color:'green' },
          { label:'In Progress', value:ip, color:'amber' },
          { label:'Achievement', value:pct+'%', color:'cyan' },
        ];
      },
      fetchRows(d, self) {
        const planMap = Object.fromEntries(d.plannings.map(p => [p.id, p]));
        let list = self._applySearch(d.plannings, ['reportNo','outletCode','brand','department','leadAuditor']);
        return list.map((p,i) => ({
          no: i+1, reportNo: p.reportNo, planningDate: p.planningDate,
          trigger: p.trigger||'', triggerRef: p.triggerRef||'',
          brand: p.brand, outlet: p.outletCode+' '+ (Utils.getOutletName(p.outletCode)||''),
          province: Utils.getProvName(p.province)||'', outletManager: p.outletManager||'',
          multiUnitManager: p.multiUnitManager||'', areaManager: p.areaManager||'',
          distrikManager: p.distrikManager||'', department: Utils.getDeptName(p.department)||'',
          auditType: p.auditType||'', leadAuditor: self._resolveAuditor(p.leadAuditor),
          auditDateFrom: p.auditDateFrom||'', auditDateTo: p.auditDateTo||'',
          scope: p.scope||'', status: p.status||'',
        }));
      },
      exportCSV() { ReportsPage._exportPlanning(); },
    },

    'audit-findings': {
      id: 'audit-findings', category: 'audit',
      title: 'Audit Findings', icon: 'alert-triangle',
      description: 'Detail semua temuan audit termasuk informasi fraudster',
      defaultColumns: ['no','reportNo','findingNo','findingTitle','findingDate','category','nature','severity','totalLoss','status'],
      allColumns: [
        { key:'no', label:'#' }, { key:'reportNo', label:'No. Laporan' },
        { key:'findingNo', label:'No. Temuan' }, { key:'findingTitle', label:'Judul Temuan' },
        { key:'findingDate', label:'Tgl Temuan' }, { key:'category', label:'Kategori' },
        { key:'nature', label:'Nature' }, { key:'severity', label:'Severity' },
        { key:'totalLoss', label:'Total Loss' }, { key:'description', label:'Deskripsi' },
        { key:'status', label:'Status' },
        { key:'fraudsterName', label:'Fraudster' }, { key:'fraudsterNik', label:'Fraudster NIK' },
        { key:'fraudsterPosition', label:'Fraudster Jabatan' },
      ],
      getKPIs(d) {
        const r = d.results;
        return [
          { label:'Total Temuan', value:r.length, color:'blue' },
          { label:'Fraud', value:r.filter(x=>x.nature==='Fraud').length, color:'red' },
          { label:'Administrative', value:r.filter(x=>x.nature==='Administrative').length, color:'amber' },
          { label:'Total Loss', value:Utils.formatIDR(r.reduce((s,x)=>s+(x.totalLoss||0),0)), color:'purple' },
        ];
      },
      fetchRows(d, self) {
        const planMap = Object.fromEntries(d.plannings.map(p => [p.id, p]));
        let list = self._applySearch(d.results, ['findingNo','findingTitle','fraudsterName','fraudsterNik','category']);
        return list.map((r,i) => {
          const p = planMap[r.planningId]||{};
          return {
            no: i+1, reportNo: p.reportNo||'', findingNo: r.findingNo,
            findingTitle: r.findingTitle, findingDate: r.findingDate||'',
            category: Utils.getCatName(r.category), nature: r.nature, severity: r.severity,
            totalLoss: Number(r.totalLoss||0).toLocaleString('en-US'), description: r.description||'',
            status: r.status||'', fraudsterName: r.fraudsterName||'',
            fraudsterNik: r.fraudsterNik||'', fraudsterPosition: r.fraudsterPosition||'',
          };
        });
      },
      exportCSV() { ReportsPage._exportFindings(); },
    },

    // -- Follow-up / AAP --
    'aap-register': {
      id: 'aap-register', category: 'followup',
      title: 'AAP Register', icon: 'check-square',
      description: 'Daftar Agreed Action Plans dengan PIC, due date, dan recovery',
      defaultColumns: ['no','reportNo','findingNo','actionNo','actionTitle','picName','dueDate','target','recovery','unrecovered','outstanding','status'],
      allColumns: [
        { key:'no', label:'#' }, { key:'reportNo', label:'No. Laporan' },
        { key:'findingNo', label:'No. Temuan' }, { key:'actionNo', label:'No. AAP' },
        { key:'actionTitle', label:'Judul AAP' }, { key:'picName', label:'PIC' },
        { key:'picDepartment', label:'Departemen' }, { key:'dueDate', label:'Due Date' },
        { key:'target', label:'Target' }, { key:'recovery', label:'Recovery' },
        { key:'unrecovered', label:'Unrecovered' }, { key:'outstanding', label:'Outstanding' },
        { key:'status', label:'Status' }, { key:'completedDate', label:'Tgl Selesai' },
      ],
      getKPIs(d) {
        const a = d.actions;
        const open = a.filter(x=>x.status==='Open').length;
        const closed = a.filter(x=>x.status==='Closed').length;
        const totTarget = a.reduce((s,x)=>s+(AuditMetrics.getActionMetrics(x).amount||0),0);
        const totRec = a.filter(x=>x.status==='Closed').reduce((s,x)=>s+(x.recovery||0),0);
        return [
          { label:'Total AAP', value:a.length, color:'blue' },
          { label:'Open', value:open, color:'amber' },
          { label:'Closed', value:closed, color:'green' },
          { label:'Recovery', value:Utils.formatIDR(totRec), color:'cyan' },
        ];
      },
      fetchRows(d, self) {
        const planMap = Object.fromEntries(d.plannings.map(p=>[p.id,p]));
        const resMap = Object.fromEntries(d.results.map(r=>[r.id,r]));
        let list = self._applySearch(d.actions, ['actionNo','actionTitle','picName']);
        return list.map((a,i) => {
          const r = resMap[a.resultId]||{};
          const p = planMap[r.planningId]||{};
          const m = AuditMetrics.getActionMetrics(a);
          return {
            no: i+1, reportNo: p.reportNo||'', findingNo: r.findingNo||'',
            actionNo: a.actionNo, actionTitle: a.actionTitle,
            picName: a.picName||'', picDepartment: a.picDepartment||'',
            dueDate: a.dueDate||'', target: Number(m.amount||0).toLocaleString('en-US'), recovery: Number(m.recovery||0).toLocaleString('en-US'),
            unrecovered: Number(m.unrecovered||0).toLocaleString('en-US'), outstanding: Number(m.outstanding||0).toLocaleString('en-US'),
            status: a.status||'', completedDate: a.completedDate||'',
          };
        });
      },
      exportCSV() { ReportsPage._exportAAP(); },
    },

    'open-aap': {
      id: 'open-aap', category: 'followup',
      title: 'Open AAP', icon: 'clock',
      description: 'AAP yang masih berstatus Open dan perlu ditindaklanjuti',
      defaultColumns: ['no','reportNo','actionNo','actionTitle','picName','dueDate','target','outstanding','overdue'],
      allColumns: [
        { key:'no', label:'#' }, { key:'reportNo', label:'No. Laporan' },
        { key:'findingNo', label:'No. Temuan' }, { key:'actionNo', label:'No. AAP' },
        { key:'actionTitle', label:'Judul AAP' }, { key:'picName', label:'PIC' },
        { key:'picDepartment', label:'Departemen' }, { key:'dueDate', label:'Due Date' },
        { key:'target', label:'Target' }, { key:'outstanding', label:'Outstanding' },
        { key:'status', label:'Status' }, { key:'age', label:'Aging' },
      ],
      getKPIs(d) {
        const openActions = d.actions.filter(a=>a.status==='Open');
        const totTarget = openActions.reduce((s,a)=>s+(AuditMetrics.getActionMetrics(a).amount||0),0);
        const totOut = openActions.reduce((s,a)=>s+(AuditMetrics.getActionMetrics(a).outstanding||0),0);
        const overdue = openActions.filter(a=>AuditMetrics.getDaysOverdue(a)>0).length;
        return [
          { label:'Open AAP', value:openActions.length, color:'amber' },
          { label:'Total Target', value:Utils.formatIDR(totTarget), color:'blue' },
          { label:'Outstanding', value:Utils.formatIDR(totOut), color:'red' },
          { label:'Overdue', value:overdue, color:'red' },
        ];
      },
      fetchRows(d, self) {
        const planMap = Object.fromEntries(d.plannings.map(p=>[p.id,p]));
        const resMap = Object.fromEntries(d.results.map(r=>[r.id,r]));
        const today = new Date().toISOString().split('T')[0];
        let list = d.actions.filter(a=>a.status==='Open');
        list = self._applySearch(list, ['actionNo','actionTitle','picName']);
        return list.map((a,i) => {
          const r = resMap[a.resultId]||{};
          const p = planMap[r.planningId]||{};
          const m = AuditMetrics.getActionMetrics(a);
          const overdue = a.dueDate && a.dueDate < today ? 'Ya' : 'Tidak';
          const age = AuditMetrics.getAgingBucket(a);
          return {
            no: i+1, reportNo: p.reportNo||'', findingNo: r.findingNo||'',
            actionNo: a.actionNo, actionTitle: a.actionTitle,
            picName: a.picName||'', picDepartment: a.picDepartment||'',
            dueDate: a.dueDate||'', target: Number(m.amount||0).toLocaleString('en-US'), outstanding: Number(m.outstanding||0).toLocaleString('en-US'),
            status: a.status||'', age,
          };
        });
      },
      exportCSV() {
        const data = ReportsPage._filteredData();
        const rows = ReportsPage.templates['open-aap'].fetchRows(data, ReportsPage);
        const allCols = ReportsPage.templates['open-aap'].allColumns.filter(c=>c.key!=='no');
        ReportsPage._downloadCSV('Open_AAP', allCols.map(c=>c.label), rows.map(r=>allCols.map(c=>r[c.key])));
      },
    },

    'overdue-aap': {
      id: 'overdue-aap', category: 'followup',
      title: 'Overdue AAP', icon: 'alert-triangle',
      description: 'AAP yang melewati due date dan belum diselesaikan',
      defaultColumns: ['no','reportNo','actionNo','actionTitle','picName','dueDate','target','outstanding','daysOverdue'],
      allColumns: [
        { key:'no', label:'#' }, { key:'reportNo', label:'No. Laporan' },
        { key:'findingNo', label:'No. Temuan' }, { key:'actionNo', label:'No. AAP' },
        { key:'actionTitle', label:'Judul AAP' }, { key:'picName', label:'PIC' },
        { key:'picDepartment', label:'Departemen' }, { key:'dueDate', label:'Due Date' },
        { key:'target', label:'Target' }, { key:'outstanding', label:'Outstanding' },
        { key:'daysOverdue', label:'Hari Terlambat' },
      ],
      getKPIs(d) {
        const today = new Date();
        const overdue = d.actions.filter(a=>a.status==='Open' && a.dueDate && a.dueDate < today.toISOString().split('T')[0]);
        const totTarget = overdue.reduce((s,a)=>s+(AuditMetrics.getActionMetrics(a).amount||0),0);
        const totOut = overdue.reduce((s,a)=>s+(AuditMetrics.getActionMetrics(a).outstanding||0),0);
        const avgDays = overdue.length ? Math.round(overdue.reduce((s,a)=>s+AuditMetrics.getDaysOverdue(a),0)/overdue.length) : 0;
        return [
          { label:'Overdue AAP', value:overdue.length, color:'red' },
          { label:'Total Target', value:Utils.formatIDR(totTarget), color:'blue' },
          { label:'Outstanding', value:Utils.formatIDR(totOut), color:'red' },
          { label:'Rata-rata', value:avgDays+' hari', color:'amber' },
        ];
      },
      fetchRows(d, self) {
        const planMap = Object.fromEntries(d.plannings.map(p=>[p.id,p]));
        const resMap = Object.fromEntries(d.results.map(r=>[r.id,r]));
        const today = new Date().toISOString().split('T')[0];
        let list = d.actions.filter(a=>a.status==='Open' && a.dueDate && a.dueDate < today);
        list = self._applySearch(list, ['actionNo','actionTitle','picName']);
        return list.map((a,i) => {
          const r = resMap[a.resultId]||{};
          const p = planMap[r.planningId]||{};
          const m = AuditMetrics.getActionMetrics(a);
          return {
            no: i+1, reportNo: p.reportNo||'', findingNo: r.findingNo||'',
            actionNo: a.actionNo, actionTitle: a.actionTitle,
            picName: a.picName||'', picDepartment: a.picDepartment||'',
            dueDate: a.dueDate||'', target: Number(m.amount||0).toLocaleString('en-US'), outstanding: Number(m.outstanding||0).toLocaleString('en-US'),
            daysOverdue: AuditMetrics.getDaysOverdue(a),
          };
        });
      },
      exportCSV() {
        const data = ReportsPage._filteredData();
        const rows = ReportsPage.templates['overdue-aap'].fetchRows(data, ReportsPage);
        const allCols = ReportsPage.templates['overdue-aap'].allColumns.filter(c=>c.key!=='no');
        ReportsPage._downloadCSV('Overdue_AAP', allCols.map(c=>c.label), rows.map(r=>allCols.map(c=>r[c.key])));
      },
    },

    'aap-closing-time': {
      id: 'aap-closing-time', category: 'followup',
      title: 'AAP Closing Time', icon: 'timer',
      description: 'Waktu penyelesaian AAP dari due date hingga closed',
      defaultColumns: ['no','actionNo','actionTitle','picName','dueDate','completedDate','daysToClose','status'],
      allColumns: [
        { key:'no', label:'#' }, { key:'actionNo', label:'No. AAP' },
        { key:'actionTitle', label:'Judul AAP' }, { key:'picName', label:'PIC' },
        { key:'picDepartment', label:'Departemen' }, { key:'dueDate', label:'Due Date' },
        { key:'completedDate', label:'Tgl Selesai' }, { key:'daysToClose', label:'Hari' },
        { key:'status', label:'Status' },
      ],
      getKPIs(d) {
        const closed = d.actions.filter(a=>a.status==='Closed');
        const avgDays = closed.length ? Math.round(closed.reduce((s,a)=>s+AuditMetrics.getDaysOverdue(a),0)/closed.length) : 0;
        const onTime = closed.filter(a=>!a.dueDate || AuditMetrics.getDaysOverdue(a)<=0).length;
        return [
          { label:'Closed AAP', value:closed.length, color:'green' },
          { label:'Open', value:d.actions.filter(a=>a.status==='Open').length, color:'amber' },
          { label:'Rata-rata', value:avgDays+' hari', color:'blue' },
          { label:'Tepat Waktu', value:onTime, color:'cyan' },
        ];
      },
      fetchRows(d, self) {
        const planMap = Object.fromEntries(d.plannings.map(p=>[p.id,p]));
        const resMap = Object.fromEntries(d.results.map(r=>[r.id,r]));
        let list = d.actions.filter(a=>a.status==='Closed');
        list = self._applySearch(list, ['actionNo','actionTitle','picName']);
        return list.map((a,i) => {
          const r = resMap[a.resultId]||{};
          const p = planMap[r.planningId]||{};
          const days = AuditMetrics.getDaysOverdue(a);
          return {
            no: i+1, actionNo: a.actionNo, actionTitle: a.actionTitle,
            picName: a.picName||'', picDepartment: a.picDepartment||'',
            dueDate: a.dueDate||'', completedDate: a.completedDate||'',
            daysToClose: days < 0 ? 0 : days,
            status: a.status||'',
          };
        });
      },
      exportCSV() {
        const data = ReportsPage._filteredData();
        const rows = ReportsPage.templates['aap-closing-time'].fetchRows(data, ReportsPage);
        const allCols = ReportsPage.templates['aap-closing-time'].allColumns.filter(c=>c.key!=='no');
        ReportsPage._downloadCSV('AAP_Closing_Time', allCols.map(c=>c.label), rows.map(r=>allCols.map(c=>r[c.key])));
      },
    },

    // -- Fraud --
    'fraudster-register': {
      id: 'fraudster-register', category: 'fraud',
      title: 'Fraudster Register', icon: 'user-x',
      description: 'Konsolidasi data fraudster (nama, NIK, jabatan) per temuan Fraud',
      defaultColumns: ['no','fraudsterName','fraudsterNik','fraudsterPosition','findingNo','reportNo','outlet','brand','totalLoss','status'],
      allColumns: [
        { key:'no', label:'#' }, { key:'fraudsterName', label:'Nama Fraudster' },
        { key:'fraudsterNik', label:'NIK' }, { key:'fraudsterPosition', label:'Jabatan' },
        { key:'findingNo', label:'No. Temuan' }, { key:'reportNo', label:'No. Laporan' },
        { key:'outlet', label:'Outlet' }, { key:'brand', label:'Brand' },
        { key:'category', label:'Kategori' }, { key:'totalLoss', label:'Total Loss' },
        { key:'status', label:'Status Temuan' },
      ],
      getKPIs(d) {
        const f = d.fraudsterResults;
        const uniqueFraudsters = new Set(f.map(r=>r.fraudsterNik)).size;
        return [
          { label:'Total Fraudster', value:uniqueFraudsters || f.length, color:'red' },
          { label:'Kasus Fraud', value:d.fraudResults.length, color:'amber' },
          { label:'Total Loss', value:Utils.formatIDR(f.reduce((s,r)=>s+(r.totalLoss||0),0)), color:'purple' },
          { label:'Unique Cases', value:f.length, color:'blue' },
        ];
      },
      fetchRows(d, self) {
        const planMap = Object.fromEntries(d.plannings.map(p=>[p.id,p]));
        let list = self._applySearch(d.fraudsterResults, ['fraudsterName','fraudsterNik','fraudsterPosition','findingNo']);
        return list.map((r,i) => {
          const p = planMap[r.planningId]||{};
          return {
            no: i+1, fraudsterName: r.fraudsterName, fraudsterNik: r.fraudsterNik||'',
            fraudsterPosition: r.fraudsterPosition||'', findingNo: r.findingNo,
            reportNo: p.reportNo||'', outlet: (p.outletCode||'')+' '+(Utils.getOutletName(p.outletCode)||''),
            brand: (Utils.getBrandName(p.brand)||''), category: Utils.getCatName(r.category), totalLoss: Number(r.totalLoss||0).toLocaleString('en-US'),
            status: r.status||'',
          };
        });
      },
      exportCSV() { ReportsPage._exportFraudster(); },
    },

    'fraud-trend': {
      id: 'fraud-trend', category: 'fraud',
      title: 'Fraud Trend', icon: 'trending-up',
      description: 'Rekap kasus Fraud per bulan dan kategori',
      defaultColumns: ['no','year','month','category','count','totalLoss'],
      allColumns: [
        { key:'no', label:'#' }, { key:'year', label:'Tahun' },
        { key:'month', label:'Bulan' }, { key:'category', label:'Kategori Fraud' },
        { key:'count', label:'Jml Kasus' }, { key:'totalLoss', label:'Total Loss' },
      ],
      getKPIs(d) {
        const f = d.fraudResults;
        const catSet = new Set(f.map(r=>r.category));
        const totalLoss = f.reduce((s,r)=>s+(r.totalLoss||0),0);
        return [
          { label:'Total Kasus', value:f.length, color:'red' },
          { label:'Kategori', value:catSet.size, color:'blue' },
          { label:'Total Loss', value:Utils.formatIDR(totalLoss), color:'purple' },
          { label:'Periode', value:new Set(f.map(r=>{const d2=Utils.parseLocalDate(r.findingDate); return d2?`${d2.getFullYear()}-${d2.getMonth()+1}`:''})).size+' bln', color:'cyan' },
        ];
      },
      fetchRows(d, self) {
        const groups = {};
        d.fraudResults.forEach(r => {
          const d2 = Utils.parseLocalDate(r.findingDate);
          const key = `${d2.getFullYear()}|${d2.getMonth()+1}|${r.category}`;
          if (!groups[key]) groups[key] = { year: d2.getFullYear(), month: d2.getMonth()+1, category: Utils.getCatName(r.category)||'-', count: 0, loss: 0 };
          groups[key].count++;
          groups[key].loss += r.totalLoss||0;
        });
        const sorted = Object.values(groups).sort((a,b)=>a.year-b.year||a.month-b.month||Utils.getCatName(a.category).localeCompare(Utils.getCatName(b.category)));
        return sorted.map((g,i) => ({ no: i+1, year: g.year, month: g.month, category: g.category, count: g.count, totalLoss: Number(g.loss).toLocaleString('en-US') }));
      },
      exportCSV() { ReportsPage._exportTrendFraud(); },
    },

    // -- Summary --
    'rekap-outlet': {
      id: 'rekap-outlet', category: 'summary',
      title: 'Rekap per Outlet', icon: 'store',
      description: 'Ringkasan audit, temuan, dan recovery per outlet',
      defaultColumns: ['no','outlet','brand','province','jmlPlanning','jmlTemuan','fraud','admin','totalLoss','recovery','outstanding'],
      allColumns: [
        { key:'no', label:'#' }, { key:'outlet', label:'Outlet' },
        { key:'brand', label:'Brand' }, { key:'province', label:'Provinsi' },
        { key:'jmlPlanning', label:'Jml Planning' }, { key:'jmlTemuan', label:'Jml Temuan' },
        { key:'fraud', label:'Fraud' }, { key:'admin', label:'Administratif' },
        { key:'totalLoss', label:'Total Loss' }, { key:'recovery', label:'Recovery' },
        { key:'outstanding', label:'Outstanding' },
      ],
      getKPIs(d) {
        const outlets = [...new Map(d.plannings.map(p=>[p.outletCode,p])).values()];
        const totalLoss = d.results.reduce((s,r)=>s+(r.totalLoss||0),0);
        const totalRec = d.actions.filter(a=>a.status==='Closed').reduce((s,a)=>s+(a.recovery||0),0);
        return [
          { label:'Outlet', value:outlets.length, color:'blue' },
          { label:'Total Planning', value:d.plannings.length, color:'cyan' },
          { label:'Total Loss', value:Utils.formatIDR(totalLoss), color:'red' },
          { label:'Recovery', value:Utils.formatIDR(totalRec), color:'green' },
        ];
      },
      fetchRows(d, self) {
        const planMap = Object.fromEntries(d.plannings.map(p=>[p.id,p]));
        const outlets = [...new Map(d.plannings.map(p=>[p.outletCode,p])).values()];
        return outlets.map((o,i) => {
          const outletPlans = d.plannings.filter(p=>p.outletCode===o.outletCode);
          const outletPlanIds = outletPlans.map(p=>p.id);
          const outletResults = d.results.filter(r=>outletPlanIds.includes(r.planningId));
          const totalLoss = outletResults.reduce((s,r)=>s+(r.totalLoss||0),0);
          const fraud = outletResults.filter(r=>r.nature==='Fraud').length;
          const admin = outletResults.filter(r=>r.nature==='Administrative').length;
          const oResultIds = outletResults.map(r=>r.id);
          const oActions = DB.get('audit_actions').filter(a=>oResultIds.includes(a.resultId));
          const recovery = oActions.filter(a=>a.status==='Closed').reduce((s,a)=>s+(a.recovery||0),0);
          return {
            no: i+1, outlet: (o.outletCode||'')+' '+(Utils.getOutletName(o.outletCode)||''),
            brand: Utils.getBrandName(o.brand)||'', province: Utils.getProvName(o.province)||'',
            jmlPlanning: outletPlans.length, jmlTemuan: outletResults.length,
            fraud, admin,
            totalLoss: Number(totalLoss).toLocaleString('en-US'),
            recovery: Number(recovery).toLocaleString('en-US'),
            outstanding: Number(Math.max(0,totalLoss-recovery)).toLocaleString('en-US'),
          };
        });
      },
      exportCSV() { ReportsPage._exportRekapOutlet(); },
    },

    'rekap-brand': {
      id: 'rekap-brand', category: 'summary',
      title: 'Rekap per Brand', icon: 'tag',
      description: 'Ringkasan audit, temuan, dan recovery per brand',
      defaultColumns: ['no','brand','jmlOutlet','jmlPlanning','jmlTemuan','totalLoss','recovery','outstanding'],
      allColumns: [
        { key:'no', label:'#' }, { key:'brand', label:'Brand' },
        { key:'jmlOutlet', label:'Jml Outlet' }, { key:'jmlPlanning', label:'Jml Planning' },
        { key:'jmlTemuan', label:'Jml Temuan' }, { key:'totalLoss', label:'Total Loss' },
        { key:'recovery', label:'Recovery' }, { key:'outstanding', label:'Outstanding' },
      ],
      getKPIs(d) {
        const brands = new Set(d.plannings.map(p=>p.brand));
        const totalLoss = d.results.reduce((s,r)=>s+(r.totalLoss||0),0);
        const totalRec = d.actions.filter(a=>a.status==='Closed').reduce((s,a)=>s+(a.recovery||0),0);
        return [
          { label:'Brand', value:brands.size, color:'blue' },
          { label:'Total Planning', value:d.plannings.length, color:'cyan' },
          { label:'Total Loss', value:Utils.formatIDR(totalLoss), color:'red' },
          { label:'Recovery', value:Utils.formatIDR(totalRec), color:'green' },
        ];
      },
      fetchRows(d, self) {
        const brands = [...new Set(d.plannings.map(p=>p.brand))];
        return brands.map((b,i) => {
          const brandPlans = d.plannings.filter(p=>p.brand===b);
          const brandPlanIds = brandPlans.map(p=>p.id);
          const brandResults = d.results.filter(r=>brandPlanIds.includes(r.planningId));
          const uniqueOutlets = new Set(brandPlans.map(p=>p.outletCode));
          const totalLoss = brandResults.reduce((s,r)=>s+(r.totalLoss||0),0);
          const bResultIds = brandResults.map(r=>r.id);
          const bActions = DB.get('audit_actions').filter(a=>bResultIds.includes(a.resultId));
          const recovery = bActions.filter(a=>a.status==='Closed').reduce((s,a)=>s+(a.recovery||0),0);
          return {
            no: i+1, brand: b, jmlOutlet: uniqueOutlets.size,
            jmlPlanning: brandPlans.length, jmlTemuan: brandResults.length,
            totalLoss: Number(totalLoss).toLocaleString('en-US'),
            recovery: Number(recovery).toLocaleString('en-US'),
            outstanding: Number(Math.max(0,totalLoss-recovery)).toLocaleString('en-US'),
          };
        });
      },
      exportCSV() { ReportsPage._exportRekapBrand(); },
    },

    'dashboard-kpi': {
      id: 'dashboard-kpi', category: 'summary',
      title: 'Dashboard KPI', icon: 'layout-dashboard',
      description: 'Nilai KPI utama berdasarkan data yang sudah difilter',
      defaultColumns: ['no','kpi','value'],
      allColumns: [
        { key:'no', label:'#' }, { key:'kpi', label:'KPI' }, { key:'value', label:'Nilai' },
      ],
      getKPIs(d) {
        const totalPl = d.plannings.length;
        const completed = d.plannings.filter(p=>p.status==='Completed').length;
        const totalFindings = d.results.length;
        const totalLoss = d.results.reduce((s,r)=>s+(r.totalLoss||0),0);
        const totalRec = d.actions.filter(a=>a.status==='Closed').reduce((s,a)=>s+(a.recovery||0),0);
        return [
          { label:'Plannings', value:totalPl, color:'blue' },
          { label:'Completed', value:completed, color:'green' },
          { label:'Temuan', value:totalFindings, color:'amber' },
          { label:'Loss', value:Utils.formatIDR(totalLoss), color:'red' },
        ];
      },
      fetchRows(d) {
        const totalPl = d.plannings.length;
        const completed = d.plannings.filter(p=>p.status==='Completed').length;
        const ip = d.plannings.filter(p=>p.status==='In Progress').length;
        const ach = totalPl ? Math.round(completed/totalPl*100) : 0;
        const totalFindings = d.results.length;
        const fraud = d.results.filter(r=>r.nature==='Fraud').length;
        const admin = d.results.filter(r=>r.nature==='Administrative').length;
        const totalLoss = d.results.reduce((s,r)=>s+(r.totalLoss||0),0);
        const totalRec = d.actions.filter(a=>a.status==='Closed').reduce((s,a)=>s+(a.recovery||0),0);
        const outstanding = Math.max(0,totalLoss-totalRec);
        const openAAP = d.actions.filter(a=>a.status==='Open').length;
        return [
          { no:1, kpi:'Total Plannings', value:totalPl },
          { no:2, kpi:'Completed Plannings', value:completed },
          { no:3, kpi:'In Progress Plannings', value:ip },
          { no:4, kpi:'Achievement (%)', value:ach },
          { no:5, kpi:'Total Findings', value:totalFindings },
          { no:6, kpi:'Fraud Findings', value:fraud },
          { no:7, kpi:'Administrative Findings', value:admin },
          { no:8, kpi:'Total Loss (Rp)', value:Number(totalLoss).toLocaleString('en-US') },
          { no:9, kpi:'Total Recovery (Rp)', value:Number(totalRec).toLocaleString('en-US') },
          { no:10, kpi:'Outstanding (Rp)', value:Number(outstanding).toLocaleString('en-US') },
          { no:11, kpi:'Open AAP', value:openAAP },
        ];
      },
      exportCSV() { ReportsPage._exportDashboardKPI(); },
    },

    'wbs-fds-conversion': {
      id: 'wbs-fds-conversion', category: 'summary',
      title: 'WBS/FDS Conversion', icon: 'git-merge',
      description: 'Kasus WBS/FDS yang telah dikonversi menjadi Audit Planning',
      defaultColumns: ['no','caseNo','date','type','outlet','brand','caseStatus','planningNo','planningDate','planningStatus'],
      allColumns: [
        { key:'no', label:'#' }, { key:'caseNo', label:'No. Kasus' },
        { key:'date', label:'Tgl Laporan' }, { key:'type', label:'Jenis' },
        { key:'outlet', label:'Outlet' }, { key:'brand', label:'Brand' },
        { key:'category', label:'Kategori' }, { key:'caseStatus', label:'Status Kasus' },
        { key:'planningNo', label:'No. Planning' }, { key:'planningDate', label:'Tgl Planning' },
        { key:'planningStatus', label:'Status Planning' },
      ],
      getKPIs(d) {
        const wbsCases = (DB.get('wbs_cases')||[]).filter(c=>c.linkedPlanningId);
        const fdsCases = (DB.get('fds_cases')||[]).filter(c=>c.linkedPlanningId);
        const total = wbsCases.length + fdsCases.length;
        const open = [...wbsCases,...fdsCases].filter(c=>c.status!=='Closed').length;
        return [
          { label:'Total Converted', value:total, color:'blue' },
          { label:'WBS', value:wbsCases.length, color:'amber' },
          { label:'FDS', value:fdsCases.length, color:'cyan' },
          { label:'Open Cases', value:open, color:'red' },
        ];
      },
      fetchRows(d, self) {
        const wbsCases = (DB.get('wbs_cases')||[]).filter(c=>c.linkedPlanningId);
        const fdsCases = (DB.get('fds_cases')||[]).filter(c=>c.linkedPlanningId);
        const plannings = DB.get('audit_plannings')||[];
        const planMap = Object.fromEntries(plannings.map(p=>[p.id,p]));
        const rows = [];

        wbsCases.forEach((c,i) => {
          const p = planMap[c.linkedPlanningId]||{};
          rows.push({
            no: i+1, caseNo: c.caseNo, date: c.reportDate||'', type: 'WBS',
            outlet: (c.outletCode||'')+' '+(Utils.getOutletName(c.outletCode)||''),
            brand: Utils.getBrandName(c.brand)||'', category: Utils.getCatName(c.category)||'',
            caseStatus: c.status||'', planningNo: p.reportNo||'',
            planningDate: p.planningDate||'', planningStatus: p.status||'',
          });
        });
        fdsCases.forEach((c,i) => {
          const p = planMap[c.linkedPlanningId]||{};
          rows.push({
            no: rows.length+1, caseNo: c.caseNo, date: c.detectionDate||'', type: 'FDS',
            outlet: (c.outletCode||'')+' '+(Utils.getOutletName(c.outletCode)||''),
            brand: Utils.getBrandName(c.brand)||'', category: Utils.getCatName(c.category)||'',
            caseStatus: c.status||'', planningNo: p.reportNo||'',
            planningDate: p.planningDate||'', planningStatus: p.status||'',
          });
        });
        rows.sort((a,b)=>a.date.localeCompare(b.date)||a.caseNo.localeCompare(b.caseNo));
        rows.forEach((r,i)=>r.no=i+1);
        return self._applySearch(rows, ['caseNo','type','outlet','brand','category','planningNo']);
      },
      exportCSV() {
        const data = ReportsPage._filteredData();
        const rows = ReportsPage.templates['wbs-fds-conversion'].fetchRows(data, ReportsPage);
        const allCols = ReportsPage.templates['wbs-fds-conversion'].allColumns.filter(c=>c.key!=='no');
        ReportsPage._downloadCSV('WBS_FDS_Conversion', allCols.map(c=>c.label), rows.map(r=>allCols.map(c=>r[c.key])));
      },
    },
  },

  // ─── Render ───
  render() {
    if (!Auth.requireAuth()) return;
    Components.renderAppShell(
      'Reports Studio',
      'Buat, pratinjau, dan ekspor laporan audit',
      ReportsPage._buildHtml(),
      'reports'
    );
    ReportsPage._pageWired = false;
    ReportsPage.afterRender();
  },

  afterRender() {
    if (!ReportsPage._pageWired) {
      ReportsPage._pageWired = true;
      PageLifecycle.delegate('page-content', {
        change: {
          '[data-filter="brand"]': (e, target) => this._setFilter('brand', target.value),
          '[data-filter="department"]': (e, target) => this._setFilter('department', target.value),
          '[data-filter="auditor"]': (e, target) => this._setFilter('auditor', target.value),
          '[data-filter="trigger"]': (e, target) => this._setFilter('trigger', target.value),
        },
        click: {
          '[data-action="rp-toggle-cat"]': (e, target) => this._toggleCategory(target.dataset.catId),
          '[data-action="rp-set-report"]': (e, target) => this._setReport(target.dataset.reportId),
          '[data-action="rp-reset-filters"]': () => this._resetFilters(),
          '[data-action="rp-apply-filters"]': () => this.render(),
          '[data-action="rp-toggle-column-selector"]': () => this._toggleColumnSelector(),
          '[data-action="rp-toggle-preview-full"]': () => this._togglePreviewFull(),
          '[data-action="rp-download"]': () => this._downloadCurrent(),
          '[data-action="rp-print"]': () => this._printReport(),
          '[data-action="rp-clear-filter"]': (e, target) => this._clearFilter(target.dataset.filterKey),
          '[data-action="rp-reset-columns"]': () => this._resetColumns(),
          '[data-action="rp-done-columns"]': () => this._toggleColumnSelector(),
          '[data-action="rp-go-to-page"]': (e, target) => this._goToPage(Number(target.dataset.page)),
          '[data-action="rp-stop-propagation"]': (e) => e.stopPropagation(),
          '[data-action="rp-toggle-column"]': (e, target) => this._toggleColumn(target.dataset.columnKey),
        }
      });
    }
    PageLifecycle.on('rp-search', 'input', (e) => this._setFilter('search', e.target.value));
    PageLifecycle.on('rp-date-from', 'change', (e) => this._setFilter('dateFrom', e.target.value));
    PageLifecycle.on('rp-date-to', 'change', (e) => this._setFilter('dateTo', e.target.value));
  },

  _buildHtml() {
    return `
      <div class="reports-studio">
        ${ReportsPage._buildSidebar()}
        <div class="reports-main">
          ${ReportsPage._buildToolbar()}
          <div class="reports-workspace">
            ${ReportsPage.activeReport ? ReportsPage._buildReportView() : ReportsPage._buildEmptyState()}
          </div>
        </div>
      </div>`;
  },

  // ─── Sidebar ───
  _buildSidebar() {
    const cats = {};
    Object.values(ReportsPage.templates).forEach(t => {
      if (!cats[t.category]) cats[t.category] = [];
      cats[t.category].push(t);
    });

    return `
      <aside class="reports-sidebar">
        <div class="reports-sidebar-header">
          <i data-lucide="file-text" style="width:14px;height:14px"></i>
          <span>Report Library</span>
        </div>
        <nav class="reports-sidebar-nav">
          ${ReportsPage.categories.map(cat => {
            const items = cats[cat.id] || [];
            const isOpen = ReportsPage.activeCategory === cat.id;
            return `
              <div class="reports-category ${isOpen ? 'expanded' : ''}">
                <div class="reports-category-header" data-action="rp-toggle-cat" data-cat-id="${cat.id}">
                  <i data-lucide="${cat.icon}" style="width:13px;height:13px"></i>
                  <span>${cat.label}</span>
                  <span class="reports-category-count">${items.length}</span>
                  <i data-lucide="chevron-down" class="reports-cat-chevron"></i>
                </div>
                <div class="reports-category-items" style="display:${isOpen ? 'block' : 'none'}">
                  ${items.map(t => `
                    <div class="reports-item ${ReportsPage.activeReport === t.id ? 'active' : ''}"
                         data-action="rp-set-report" data-report-id="${t.id}">
                      <i data-lucide="${t.icon}" style="width:13px;height:13px"></i>
                      <span>${t.title}</span>
                    </div>`).join('')}
                </div>
              </div>`;
          }).join('')}
        </nav>
      </aside>`;
  },

  // ─── Toolbar ───
  _buildToolbar() {
    const f = ReportsPage.filters;
    const brands = DB.get('brands');
    const plannings = DB.get('audit_plannings') || [];
    const depts = [...new Set(plannings.map(p => p.department).filter(Boolean))].sort();
    const triggers = [...new Set(plannings.map(p => p.trigger).filter(Boolean))].sort();
    const auditorIds = [...new Set(plannings.map(p => p.leadAuditor).filter(Boolean))];
    const auditors = auditorIds.map(id => {
      const a = DB.find('auditors', id);
      return { id, name: a ? a.name : id };
    }).sort((a,b) => a.name.localeCompare(b.name));
    const hasFilters = Object.values(f).some(v => v !== '');

    return `
      <div class="reports-toolbar">
        <div class="reports-toolbar-row">
          <div class="search-input-wrapper" style="flex:0 0 200px">
            <i data-lucide="search"></i>
            <input type="text" class="form-control search-input" id="rp-search" placeholder="Cari laporan..."
              value="${Utils.escapeHtml(f.search)}" />
          </div>
          <input type="date" class="form-control" id="rp-date-from" value="${f.dateFrom}" title="Dari" />
          <span style="color:var(--text-muted);font-size:11px">—</span>
          <input type="date" class="form-control" id="rp-date-to" value="${f.dateTo}" title="Sampai" />
          <select class="form-control" data-filter="brand">
            <option value="">Semua Brand</option>
            ${brands.map(b => `<option value="${b.id}" ${f.brand===b.id?'selected':''}>${b.name}</option>`).join('')}
          </select>
          <select class="form-control" data-filter="department">
            <option value="">Semua Dept</option>
            ${depts.map(d => `<option value="${d}" ${f.department===d?'selected':''}>${Utils.getDeptName(d)}</option>`).join('')}
          </select>
          <select class="form-control" data-filter="auditor">
            <option value="">Semua Auditor</option>
            ${auditors.map(a => `<option value="${a.id}" ${f.auditor===a.id?'selected':''}>${a.name}</option>`).join('')}
          </select>
          <select class="form-control" data-filter="trigger">
            <option value="">Semua Trigger</option>
            ${triggers.map(t => `<option value="${t}" ${f.trigger===t?'selected':''}>${t}</option>`).join('')}
          </select>
          <button class="btn btn-secondary btn-sm" data-action="rp-reset-filters" title="Reset Filter">
            <i data-lucide="rotate-ccw"></i>
          </button>
          ${hasFilters ? `<button class="btn btn-primary btn-sm" data-action="rp-apply-filters"><i data-lucide="check"></i> Terapkan</button>` : ''}
        </div>
      </div>`;
  },

  // ─── Empty state ───
  _buildEmptyState() {
    return `
      <div class="reports-empty-state">
        <i data-lucide="file-search" style="width:48px;height:48px;opacity:0.3"></i>
        <h3>Pilih Laporan</h3>
        <p>Pilih laporan dari panel sebelah kiri untuk melihat pratinjau dan melakukan ekspor data.</p>
      </div>`;
  },

  // ─── Report View ───
  _buildReportView() {
    const tpl = ReportsPage.templates[ReportsPage.activeReport];
    if (!tpl) return ReportsPage._buildEmptyState();
    const data = ReportsPage._filteredData();
    const rows = tpl.fetchRows(data, ReportsPage);
    const session = Auth.getSession();
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
    const cols = ReportsPage._getColumns(ReportsPage.activeReport);
    const totalPages = Math.ceil(rows.length / ReportsPage.previewPageSize);
    const page = ReportsPage._previewFull ? 1 : ReportsPage.previewPage;
    const pageRows = ReportsPage._previewFull ? rows : rows.slice((page-1)*ReportsPage.previewPageSize, page*ReportsPage.previewPageSize);

    return `
      <div class="report-view">
        <div class="report-view-header">
          <div>
            <h3><i data-lucide="${tpl.icon}" style="width:16px;height:16px;color:var(--blue-light)"></i> ${tpl.title}</h3>
            <p class="report-view-desc">${tpl.description}</p>
          </div>
          <div class="report-view-meta">
            <span><i data-lucide="calendar" style="width:12px;height:12px"></i> ${dateStr}</span>
            <span><i data-lucide="user" style="width:12px;height:12px"></i> ${session?.name || '-'}</span>
          </div>
        </div>

        ${ReportsPage._buildFilterChips()}

        <div class="report-kpi-strip">
          ${tpl.getKPIs(data).map(k => `
            <div class="report-kpi-item ${k.color}">
              <div class="report-kpi-label">${k.label}</div>
              <div class="report-kpi-value">${k.value}</div>
            </div>`).join('')}
        </div>

        <div class="report-actions">
          <div class="report-actions-left">
            <span class="report-record-count">${rows.length} records</span>
          </div>
          <div class="report-actions-right">
            <div class="report-column-selector-wrapper">
              <button class="btn btn-secondary btn-sm" data-action="rp-toggle-column-selector">
                <i data-lucide="columns"></i> Columns
              </button>
              ${ReportsPage._colSelectorOpen ? ReportsPage._buildColumnSelector(tpl) : ''}
            </div>
            <button class="btn btn-secondary btn-sm" data-action="rp-toggle-preview-full">
              <i data-lucide="${ReportsPage._previewFull ? 'compass' : 'eye'}"></i>
              ${ReportsPage._previewFull ? 'Paginate' : 'Preview Full'}
            </button>
            <button class="btn btn-primary btn-sm" data-action="rp-download">
              <i data-lucide="download"></i> CSV
            </button>
            <button class="btn btn-secondary btn-sm" data-action="rp-print">
              <i data-lucide="printer"></i> Print
            </button>
          </div>
        </div>

        <div class="report-table-container">
          <table class="data-table">
            <thead>
              <tr>${cols.map(c => `<th>${c.label}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${pageRows.length ? pageRows.map(r => `
                <tr>${cols.map(c => {
                  const val = r[c.key];
                  const display = val === undefined || val === null || val === '' ? '-' : String(val);
                  const numCls = ReportsPage._numericCols.has(c.key) ? ' class="text-right"' : '';
                  return `<td${numCls}>${Utils.escapeHtml(display)}</td>`;
                }).join('')}</tr>`).join('')
                : `<tr><td colspan="${cols.length}" style="text-align:center;padding:40px;color:var(--text-muted)">Tidak ada data</td></tr>`}
            </tbody>
          </table>
        </div>

        ${!ReportsPage._previewFull && totalPages > 1 ? ReportsPage._buildPagination(page, totalPages, rows.length) : ''}
      </div>`;
  },

  // ─── Filter chips ───
  _buildFilterChips() {
    const f = ReportsPage.filters;
    const brands = Object.fromEntries(DB.get('brands').map(b => [b.id, b.name]));
    const chips = [];
    if (f.search) chips.push({ key:'search', label:`Cari: "${f.search.length > 30 ? f.search.slice(0,30)+'...' : f.search}"` });
    if (f.dateFrom) chips.push({ key:'dateFrom', label:`Dari: ${f.dateFrom}` });
    if (f.dateTo) chips.push({ key:'dateTo', label:`Sampai: ${f.dateTo}` });
    if (f.brand) chips.push({ key:'brand', label:`Brand: ${Utils.getBrandName(f.brand)||f.brand}` });
    if (f.department) chips.push({ key:'department', label:`Dept: ${Utils.getDeptName(f.department)}` });
    if (f.auditor) {
      const a = DB.find('auditors', f.auditor);
      chips.push({ key:'auditor', label:`Auditor: ${a?a.name:f.auditor}` });
    }
    if (f.trigger) chips.push({ key:'trigger', label:`Trigger: ${f.trigger}` });
    if (!chips.length) return '';
    return `
      <div class="report-filter-chips">
        <span class="report-filter-chips-label">Filter aktif:</span>
        ${chips.map(c => `
          <span class="report-filter-chip">
            ${Utils.escapeHtml(c.label)}
            <i data-lucide="x" style="width:12px;height:12px;cursor:pointer" data-action="rp-clear-filter" data-filter-key="${c.key}"></i>
          </span>`).join('')}
      </div>`;
  },

  // ─── Column Selector ───
  _buildColumnSelector(tpl) {
    const current = ReportsPage._columnState[ReportsPage.activeReport] || tpl.defaultColumns;
    return `
      <div class="column-selector-dropdown" data-action="rp-stop-propagation">
        <div class="column-selector-header">Pilih Kolom</div>
        <div class="column-selector-list">
          ${tpl.allColumns.map(c => `
            <label class="column-selector-item">
              <input type="checkbox" ${current.includes(c.key)?'checked':''}
                data-action="rp-toggle-column" data-column-key="${c.key}" />
              <span>${c.label}</span>
            </label>`).join('')}
        </div>
        <div class="column-selector-footer">
          <button class="btn btn-secondary btn-sm" data-action="rp-reset-columns">Reset</button>
          <button class="btn btn-primary btn-sm" data-action="rp-done-columns">Done</button>
        </div>
      </div>`;
  },

  // ─── Data ───
  _filteredCache: null,
  _lastFilterHash: '',

  _filteredData() {
    const hash = JSON.stringify(ReportsPage.filters);
    if (ReportsPage._lastFilterHash === hash && ReportsPage._filteredCache) {
      return ReportsPage._filteredCache;
    }

    let plannings = DB.get('audit_plannings') || [];
    const f = ReportsPage.filters;

    if (f.dateFrom) plannings = plannings.filter(p => p.planningDate >= f.dateFrom);
    if (f.dateTo) plannings = plannings.filter(p => p.planningDate <= f.dateTo);
    if (f.brand) plannings = plannings.filter(p => p.brand === f.brand);
    if (f.department) plannings = plannings.filter(p => p.department === f.department);
    if (f.auditor) plannings = plannings.filter(p => p.leadAuditor === f.auditor);
    if (f.trigger) plannings = plannings.filter(p => p.trigger === f.trigger);

    const planningIds = plannings.map(p => p.id);
    let results = (DB.get('audit_results') || []).filter(r => planningIds.includes(r.planningId));
    const resultIds = results.map(r => r.id);
    const actions = (DB.get('audit_actions') || []).filter(a => resultIds.includes(a.resultId));
    const fraudResults = results.filter(r => r.nature === 'Fraud');
    const fraudsterResults = fraudResults.filter(r => r.fraudsterName);

    ReportsPage._filteredCache = { plannings, results, actions, fraudResults, fraudsterResults };
    ReportsPage._lastFilterHash = hash;
    return ReportsPage._filteredCache;
  },

  _applySearch(list, fields) {
    const q = ReportsPage.filters.search.toLowerCase().trim();
    if (!q) return list;
    return list.filter(item => fields.some(f => {
      const val = typeof f === 'function' ? f(item) : item[f];
      return val && String(val).toLowerCase().includes(q);
    }));
  },

  _resolveAuditor(auditorId) {
    if (!auditorId) return '-';
    const a = DB.find('auditors', auditorId);
    return a ? a.name : auditorId;
  },

  _getColumns(reportId) {
    const tpl = ReportsPage.templates[reportId];
    if (!tpl) return [];
    const saved = ReportsPage._columnState[reportId];
    if (saved) return tpl.allColumns.filter(c => saved.includes(c.key));
    return tpl.allColumns.filter(c => tpl.defaultColumns.includes(c.key));
  },

  // ─── Events ───
  _setFilter(key, value) {
    ReportsPage.filters[key] = value;
    ReportsPage._filteredCache = null;
    ReportsPage.render();
  },

  _clearFilter(key) {
    ReportsPage.filters[key] = '';
    ReportsPage._filteredCache = null;
    ReportsPage.render();
  },

  _resetFilters() {
    ReportsPage.filters = { search:'', dateFrom:'', dateTo:'', brand:'', department:'', auditor:'', trigger:'' };
    ReportsPage._filteredCache = null;
    ReportsPage.render();
  },

  _toggleCategory(id) {
    ReportsPage.activeCategory = ReportsPage.activeCategory === id ? null : id;
    ReportsPage.render();
  },

  _setReport(id) {
    ReportsPage.activeReport = id;
    ReportsPage.previewPage = 1;
    ReportsPage._previewFull = false;
    ReportsPage._colSelectorOpen = false;
    ReportsPage.render();
  },

  _toggleColumn(key) {
    const reportId = ReportsPage.activeReport;
    const tpl = ReportsPage.templates[reportId];
    const current = [...(ReportsPage._columnState[reportId] || tpl.defaultColumns)];
    if (current.includes(key)) {
      ReportsPage._columnState[reportId] = current.filter(k => k !== key);
    } else {
      ReportsPage._columnState[reportId] = [...current, key];
    }
    ReportsPage.render();
  },

  _resetColumns() {
    delete ReportsPage._columnState[ReportsPage.activeReport];
    ReportsPage.render();
  },

  _toggleColumnSelector() {
    ReportsPage._colSelectorOpen = !ReportsPage._colSelectorOpen;
    ReportsPage.render();
  },

  _togglePreviewFull() {
    ReportsPage._previewFull = !ReportsPage._previewFull;
    ReportsPage.previewPage = 1;
    ReportsPage.render();
  },

  _goToPage(page) {
    ReportsPage.previewPage = page;
    ReportsPage.render();
  },

  _buildPagination(current, total, totalItems) {
    const start = (current - 1) * ReportsPage.previewPageSize + 1;
    const end = Math.min(current * ReportsPage.previewPageSize, totalItems);
    let pages = '';
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
        pages += `<button class="page-btn ${i === current ? 'active' : ''}" 
          data-action="rp-go-to-page" data-page="${i}">${i}</button>`;
      } else if (i === current - 2 || i === current + 2) {
        pages += `<span style="color:var(--text-muted);padding:0 4px">…</span>`;
      }
    }
    return `
      <div class="pagination">
        <span>${start}–${end} of ${totalItems} records</span>
        <div class="pagination-controls">
          <button class="page-btn" data-action="rp-go-to-page" data-page="${Math.max(1, current-1)}" ${current <= 1 ? 'disabled' : ''}>
            <i data-lucide="chevron-left" style="width:12px;height:12px"></i>
          </button>
          ${pages}
          <button class="page-btn" data-action="rp-go-to-page" data-page="${Math.min(total, current+1)}" ${current >= total ? 'disabled' : ''}>
            <i data-lucide="chevron-right" style="width:12px;height:12px"></i>
          </button>
        </div>
      </div>`;
  },

  // ─── CSV Download ───
  _downloadCurrent() {
    const tpl = ReportsPage.templates[ReportsPage.activeReport];
    if (!tpl) return;
    // Use the template's export, or fallback to inline export with all columns
    if (tpl.exportCSV) {
      tpl.exportCSV();
    } else {
      const data = ReportsPage._filteredData();
      const rows = tpl.fetchRows(data, ReportsPage);
      const cols = tpl.allColumns.filter(c => c.key !== 'no');
      ReportsPage._downloadCSV(tpl.title.replace(/\s+/g,'_'), cols.map(c=>c.label), rows.map(r=>cols.map(c=>r[c.key])));
    }
  },

  _downloadCSV(filename, headers, rows) {
    const BOM = '\uFEFF';
    const csvRows = [headers, ...rows];
    const csv = csvRows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(BOM + csv);
    a.download = filename.replace(/\s+/g, '_') + '_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
  },

  // ─── Print ───
  _printReport() {
    window.print();
  },

  // ─── Legacy Export Methods (kept for template references) ───
  _exportPlanning() {
    const data = ReportsPage._filteredData();
    const list = ReportsPage._applySearch(data.plannings, ['reportNo','outletCode','brand','department','leadAuditor']);
    const headers = ['No. Laporan','Tgl Planning','Trigger','Ref Trigger','Brand','Outlet','Provinsi',
      'Outlet Manager','Multi Unit Manager','Area Manager','Distrik Manager',
      'Departemen','Tipe Audit','Lead Auditor','Tgl Mulai','Tgl Selesai','Scope','Status'];
    const rows = list.map(p => [
      p.reportNo, p.planningDate, p.trigger||'', p.triggerRef||'',
      p.brand, `${p.outletCode} ${Utils.getOutletName(p.outletCode)||''}`, Utils.getProvName(p.province)||'',
      p.outletManager||'', p.multiUnitManager||'', p.areaManager||'', p.distrikManager||'',
      Utils.getDeptName(p.department)||'', p.auditType||'', ReportsPage._resolveAuditor(p.leadAuditor),
      p.auditDateFrom||'', p.auditDateTo||'', p.scope||'', p.status||'',
    ]);
    ReportsPage._downloadCSV('Perencanaan_Audit', headers, rows);
  },

  _exportFindings() {
    const data = ReportsPage._filteredData();
    const planMap = Object.fromEntries(data.plannings.map(p => [p.id, p]));
    let list = ReportsPage._applySearch(data.results, ['findingNo','findingTitle','fraudsterName','fraudsterNik','category']);
    const headers = ['No. Laporan','No. Temuan','Judul Temuan','Tgl Temuan','Kategori','Nature',
      'Severity','Total Loss','Deskripsi','Status','Fraudster Name','Fraudster NIK','Fraudster Jabatan'];
    const rows = list.map(r => {
      const p = planMap[r.planningId]||{};
      return [p.reportNo||'', r.findingNo, r.findingTitle, r.findingDate||'', Utils.getCatName(r.category),
        r.nature, r.severity, r.totalLoss||0, r.description||'', r.status||'',
        r.fraudsterName||'', r.fraudsterNik||'', r.fraudsterPosition||''];
    });
    ReportsPage._downloadCSV('Temuan_Audit', headers, rows);
  },

  _exportFraudster() {
    const data = ReportsPage._filteredData();
    const planMap = Object.fromEntries(data.plannings.map(p=>[p.id,p]));
    let list = ReportsPage._applySearch(data.fraudsterResults, ['fraudsterName','fraudsterNik','fraudsterPosition','findingNo']);
    const headers = ['Nama Fraudster','NIK','Jabatan','No. Temuan','No. Laporan','Outlet','Brand','Kategori','Total Loss','Status Temuan'];
    const rows = list.map(r => {
      const p = planMap[r.planningId]||{};
      return [r.fraudsterName, r.fraudsterNik||'', r.fraudsterPosition||'', r.findingNo, p.reportNo||'',
        `${p.outletCode||''} ${Utils.getOutletName(p.outletCode)||''}`, Utils.getBrandName(p.brand)||'', Utils.getCatName(r.category), r.totalLoss||0, r.status||''];
    });
    ReportsPage._downloadCSV('Data_Fraudster', headers, rows);
  },

  _exportAAP() {
    const data = ReportsPage._filteredData();
    const planMap = Object.fromEntries(data.plannings.map(p=>[p.id,p]));
    const resultMap = Object.fromEntries(data.results.map(r=>[r.id,r]));
    let list = ReportsPage._applySearch(data.actions, ['actionNo','actionTitle','picName']);
    const headers = ['No. Laporan','No. Temuan','No. AAP','Judul AAP','PIC','Departemen','Due Date',
      'Target Amount','Recovery','Unrecovered','Outstanding','Status','Tgl Selesai'];
    const rows = list.map(a => {
      const r = resultMap[a.resultId]||{};
      const p = planMap[r.planningId]||{};
      const m = AuditMetrics.getActionMetrics(a);
      return [p.reportNo||'', r.findingNo||'', a.actionNo, a.actionTitle, a.picName||'', a.picDepartment||'',
        a.dueDate||'', m.amount||0, m.recovery||0, m.unrecovered||0, m.outstanding||0, a.status||'', a.completedDate||''];
    });
    ReportsPage._downloadCSV('AAP_Register', headers, rows);
  },

  _exportRekapOutlet() {
    const data = ReportsPage._filteredData();
    const outlets = [...new Map(data.plannings.map(p=>[p.outletCode,p])).values()];
    const headers = ['Outlet','Brand','Provinsi','Jml Planning','Jml Temuan','Fraud','Administratif','Total Loss','Total Recovery','Outstanding'];
    const rows = outlets.map(o => {
      const outletPlans = data.plannings.filter(p=>p.outletCode===o.outletCode);
      const outletPlanIds = outletPlans.map(p=>p.id);
      const outletResults = data.results.filter(r=>outletPlanIds.includes(r.planningId));
      const totalLoss = outletResults.reduce((s,r)=>s+(r.totalLoss||0),0);
      const fraud = outletResults.filter(r=>r.nature==='Fraud').length;
      const admin = outletResults.filter(r=>r.nature==='Administrative').length;
      const oResultIds = outletResults.map(r=>r.id);
      const oActions = DB.get('audit_actions').filter(a=>oResultIds.includes(a.resultId));
      const recovery = oActions.filter(a=>a.status==='Closed').reduce((s,a)=>s+(a.recovery||0),0);
      return [`${o.outletCode} ${Utils.getOutletName(o.outletCode)||''}`, Utils.getBrandName(o.brand)||'', Utils.getProvName(o.province)||'',
        outletPlans.length, outletResults.length, fraud, admin, totalLoss, recovery, Math.max(0,totalLoss-recovery)];
    });
    ReportsPage._downloadCSV('Rekap_per_Outlet', headers, rows);
  },

  _exportRekapBrand() {
    const data = ReportsPage._filteredData();
    const brands = [...new Set(data.plannings.map(p=>p.brand))];
    const headers = ['Brand','Jml Outlet','Jml Planning','Jml Temuan','Total Loss','Total Recovery','Outstanding'];
    const rows = brands.map(b => {
      const brandPlans = data.plannings.filter(p=>p.brand===b);
      const brandPlanIds = brandPlans.map(p=>p.id);
      const brandResults = data.results.filter(r=>brandPlanIds.includes(r.planningId));
      const uniqueOutlets = new Set(brandPlans.map(p=>p.outletCode));
      const totalLoss = brandResults.reduce((s,r)=>s+(r.totalLoss||0),0);
      const bResultIds = brandResults.map(r=>r.id);
      const bActions = DB.get('audit_actions').filter(a=>bResultIds.includes(a.resultId));
      const recovery = bActions.filter(a=>a.status==='Closed').reduce((s,a)=>s+(a.recovery||0),0);
      return [b, uniqueOutlets.size, brandPlans.length, brandResults.length, totalLoss, recovery, Math.max(0,totalLoss-recovery)];
    });
    ReportsPage._downloadCSV('Rekap_per_Brand', headers, rows);
  },

  _exportTrendFraud() {
    const data = ReportsPage._filteredData();
    const groups = {};
    data.fraudResults.forEach(r => {
      const d = Utils.parseLocalDate(r.findingDate);
      const key = d ? `${d.getFullYear()}|${d.getMonth()+1}|${r.category}` : '';
      if (!groups[key]) groups[key] = { year:d.getFullYear(), month:d.getMonth()+1, category:Utils.getCatName(r.category), count:0, loss:0 };
      groups[key].count++;
      groups[key].loss += r.totalLoss||0;
    });
    const sorted = Object.values(groups).sort((a,b)=>a.year-b.year||a.month-b.month||a.category.localeCompare(b.category));
    const headers = ['Tahun','Bulan','Kategori Fraud','Jml Kasus','Total Loss'];
    const rows = sorted.map(g => [g.year, g.month, g.category, g.count, g.loss]);
    ReportsPage._downloadCSV('Trend_Fraud_Tahunan', headers, rows);
  },

  _exportDashboardKPI() {
    const data = ReportsPage._filteredData();
    const totalPl = data.plannings.length;
    const completed = data.plannings.filter(p=>p.status==='Completed').length;
    const ip = data.plannings.filter(p=>p.status==='In Progress').length;
    const ach = totalPl ? Math.round(completed/totalPl*100) : 0;
    const totalFindings = data.results.length;
    const fraud = data.results.filter(r=>r.nature==='Fraud').length;
    const admin = data.results.filter(r=>r.nature==='Administrative').length;
    const totalLoss = data.results.reduce((s,r)=>s+(r.totalLoss||0),0);
    const totalRec = data.actions.filter(a=>a.status==='Closed').reduce((s,a)=>s+(a.recovery||0),0);
    const outstanding = Math.max(0,totalLoss-totalRec);
    const openAAP = data.actions.filter(a=>a.status==='Open').length;
    const headers = ['KPI','Nilai'];
    const rows = [
      ['Total Plannings', totalPl],['Completed Plannings', completed],['In Progress Plannings', ip],
      ['Achievement (%)', ach],['Total Findings', totalFindings],['Fraud Findings', fraud],
      ['Administrative Findings', admin],['Total Loss (Rp)', totalLoss],['Total Recovery (Rp)', totalRec],
      ['Outstanding (Rp)', outstanding],['Open AAP', openAAP],
    ];
    ReportsPage._downloadCSV('Dashboard_KPIs', headers, rows);
  },
};

window.ReportsPage = ReportsPage;
