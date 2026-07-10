/* ============================================================
   SEED DATA v3 — Relational Audit Assignment model
   audit_plannings → audit_results → audit_actions
   ============================================================ */

function seedDatabase() {
  if (DB.isInitialized()) {
    // Migration: ensure outlets have manager fields
    const existingOutlets = DB.get('outlets');
    if (existingOutlets && existingOutlets.length && !existingOutlets[0].outletManager) {
      const outletManagerMap = {
        'R241': { outletManager: 'Ahmad Fauzi', multiUnitManager: 'Rina Fitriani', areaManager: 'Hendra Gunawan', distrikManager: 'Bambang Suprapto' },
        'C057': { outletManager: 'Dwi Cahyono', multiUnitManager: 'Rina Fitriani', areaManager: 'Hendra Gunawan', distrikManager: 'Bambang Suprapto' },
        'S025': { outletManager: 'Siti Nurhaliza', multiUnitManager: 'Mega Sari', areaManager: 'Agus Salim', distrikManager: 'Dwi Hartono' },
        'R316': { outletManager: 'M. Ilham', multiUnitManager: 'Mega Sari', areaManager: 'Agus Salim', distrikManager: 'Dwi Hartono' },
        'R201': { outletManager: 'Teguh Prasetyo', multiUnitManager: 'Rina Fitriani', areaManager: 'Hendra Gunawan', distrikManager: 'Bambang Suprapto' },
        'C073': { outletManager: 'Joko Susilo', multiUnitManager: 'Bayu Anggara', areaManager: 'Slamet Riyadi', distrikManager: 'Martha Tilaar' },
        'R105': { outletManager: 'Dian Permata', multiUnitManager: 'Mega Sari', areaManager: 'Agus Salim', distrikManager: 'Dwi Hartono' },
        'C089': { outletManager: 'Rudi Hermawan', multiUnitManager: 'Bayu Anggara', areaManager: 'Slamet Riyadi', distrikManager: 'Martha Tilaar' },
        'R322': { outletManager: 'Yuni Astuti', multiUnitManager: 'Mega Sari', areaManager: 'Agus Salim', distrikManager: 'Dwi Hartono' },
        'C012': { outletManager: 'Fajar Hidayat', multiUnitManager: 'Bayu Anggara', areaManager: 'Slamet Riyadi', distrikManager: 'Martha Tilaar' },
        'H001': { outletManager: 'Wawan Setiawan', multiUnitManager: 'Dedi Kurniawan', areaManager: 'Rudi Hartono', distrikManager: 'Agus Wijaya' },
        'H022': { outletManager: 'Ratna Dewi', multiUnitManager: 'Dedi Kurniawan', areaManager: 'Rudi Hartono', distrikManager: 'Agus Wijaya' },
      };
      const enrichedOutlets = existingOutlets.map(o => ({
        ...o,
        ...(outletManagerMap[o.id] || { outletManager: '', multiUnitManager: '', areaManager: '', distrikManager: '' }),
      }));
      DB.set('outlets', enrichedOutlets);
    }
    // Migration: ensure audit_results have fraudster fields
    const existingResults = DB.get('audit_results');
    if (existingResults && existingResults.length && existingResults[0].fraudsterName === undefined) {
      const enrichedResults = existingResults.map(r => ({
        ...r,
        fraudsterName: r.fraudsterName || '',
        fraudsterNik: r.fraudsterNik || '',
        fraudsterPosition: r.fraudsterPosition || '',
      }));
      DB.set('audit_results', enrichedResults);
    }
    // Migration: ensure departments exist
    if (!DB.get('departments') || !DB.get('departments').length) {
      const depts = [
        { id: 'dept_1',  name: 'Store Audit',           code: 'SA' },
        { id: 'dept_2',  name: 'Corporate Audit',        code: 'CA' },
        { id: 'dept_3',  name: 'Business Process Improvement', code: 'BPI' },
        { id: 'dept_4',  name: 'Operations',             code: 'OPS' },
        { id: 'dept_5',  name: 'Marketing',              code: 'MKT' },
        { id: 'dept_6',  name: 'Finance',                code: 'FIN' },
        { id: 'dept_7',  name: 'Human Resources',        code: 'HR' },
        { id: 'dept_8',  name: 'Information Technology', code: 'IT' },
        { id: 'dept_9',  name: 'Supply Chain',           code: 'SC' },
        { id: 'dept_10', name: 'Legal & Compliance',     code: 'LGL' },
      ];
      DB.set('departments', depts);
    }
    // Migration: none needed for fresh deployment
    // Migration: ensure audit_actions have picDepartment
    const existingActions = DB.get('audit_actions');
    if (existingActions && existingActions.length && existingActions[0].picDepartment === undefined) {
      const enrichedActions = existingActions.map(a => ({
        ...a,
        picDepartment: a.picDepartment || '',
      }));
      DB.set('audit_actions', enrichedActions);
    }
    // Migration: ensure audit_plannings have manager fields
    const existingPlannings = DB.get('audit_plannings');
    if (existingPlannings && existingPlannings.length && existingPlannings[0].outletManager === undefined) {
      const outlets = DB.get('outlets');
      const outletManagerMap = {};
      outlets.forEach(o => {
        outletManagerMap[o.code] = {
          outletManager: o.outletManager || '',
          multiUnitManager: o.multiUnitManager || '',
          areaManager: o.areaManager || '',
          distrikManager: o.distrikManager || '',
        };
      });
      const enrichedPlannings = existingPlannings.map(p => ({
        ...p,
        ...(outletManagerMap[p.outletCode] || { outletManager: '', multiUnitManager: '', areaManager: '', distrikManager: '' }),
      }));
      DB.set('audit_plannings', enrichedPlannings);
    }
    // Migration: seed test users for manager/auditor/division roles
    const existingUsers = DB.get('users') || [];
    const testUsers = [
      { id: 'usr_manager', username: 'manager', password: '123', name: 'Manager', email: 'manager@internalaudit.com', role: 'head', department: 'Store Audit', status: 'active', picDepartment: '', createdAt: '2025-01-01T00:00:00Z' },
      { id: 'usr_auditor', username: 'auditor', password: '123', name: 'Auditor', email: 'auditor@internalaudit.com', role: 'auditor', department: 'Store Audit', status: 'active', picDepartment: '', createdAt: '2025-01-01T00:00:00Z' },
      { id: 'usr_divisi', username: 'divisi', password: '123', name: 'Divisi', email: 'divisi@internalaudit.com', role: 'division', department: 'Operations', status: 'active', picDepartment: '', createdAt: '2025-01-01T00:00:00Z' },
    ];
    let changed = false;
    testUsers.forEach(tu => {
      if (!existingUsers.find(u => u.username === tu.username)) {
        existingUsers.push(tu);
        changed = true;
      }
    });
    if (changed) DB.set('users', existingUsers);
    return;
  }

  // ---- Brands ----
  const brands = [
    { id: 'PHD', name: 'PHD', color: '#3b82f6', description: 'Pizza Hut Delivery' },
    { id: 'PHR', name: 'PHR', color: '#f59e0b', description: 'Pizza Hut Restaurant' },
    { id: 'Hayo', name: 'Hayo', color: '#10b981', description: 'Hayo Brand' },
  ];
  DB.set('brands', brands);

  // ---- Provinces ----
  const provinces = [
    'DKI Jakarta','Jawa Barat','Jawa Tengah','Jawa Timur','Banten',
    'Sumatera Utara','Sumatera Selatan','Sumatera Barat','Riau','Kepulauan Riau',
    'Kalimantan Selatan','Kalimantan Timur','Kalimantan Barat','Kalimantan Tengah',
    'Sulawesi Selatan','Sulawesi Utara','Bali','Nusa Tenggara Barat','DIY Yogyakarta',
    'Aceh', 'Lampung', 'Maluku', 'Papua'
  ].map((name, i) => ({ id: 'prov_' + i, name }));
  DB.set('provinces', provinces);

  // ---- Departments ----
  const departments = [
    { id: 'dept_1',  name: 'Store Audit',           code: 'SA' },
    { id: 'dept_2',  name: 'Corporate Audit',        code: 'CA' },
    { id: 'dept_3',  name: 'Business Process Improvement', code: 'BPI' },
    { id: 'dept_4',  name: 'Operations',             code: 'OPS' },
    { id: 'dept_5',  name: 'Marketing',              code: 'MKT' },
    { id: 'dept_6',  name: 'Finance',                code: 'FIN' },
    { id: 'dept_7',  name: 'Human Resources',        code: 'HR' },
    { id: 'dept_8',  name: 'Information Technology', code: 'IT' },
    { id: 'dept_9',  name: 'Supply Chain',           code: 'SC' },
    { id: 'dept_10', name: 'Legal & Compliance',     code: 'LGL' },
  ];
  DB.set('departments', departments);

  // ---- Fraud Categories (Fraud) ----
  const fraudCategories = [
    // Fraud categories
    { id: 'cat_lp',   name: 'Loyalty Point',        color: '#3b82f6', description: 'Fraud related to customer loyalty points',     nature: 'Fraud' },
    { id: 'cat_sales',name: 'Sales',                 color: '#10b981', description: 'Sales manipulation or misreporting',            nature: 'Fraud' },
    { id: 'cat_cash', name: 'Cash',                  color: '#f59e0b', description: 'Cash misappropriation or theft',               nature: 'Fraud' },
    { id: 'cat_inv',  name: 'Inventory',             color: '#a855f7', description: 'Inventory theft or manipulation',              nature: 'Fraud' },
    { id: 'cat_exp',  name: 'Expenses',              color: '#ef4444', description: 'Expense fraud or manipulation',                nature: 'Fraud' },
    { id: 'cat_cust', name: 'Customer Point',        color: '#06b6d4', description: 'Customer point manipulation',                  nature: 'Fraud' },
    // Administrative categories
    { id: 'cat_adm_sop',   name: 'SOP',                      color: '#64748b', description: 'Ketidakpatuhan terhadap SOP yang berlaku',          nature: 'Administrative' },
    { id: 'cat_adm_doc',   name: 'Dokumentasi',              color: '#94a3b8', description: 'Dokumen tidak lengkap atau tidak valid',              nature: 'Administrative' },
    { id: 'cat_adm_ctrl',  name: 'Kontrol Internal',         color: '#7c3aed', description: 'Kelemahan pada kontrol internal operasional',         nature: 'Administrative' },
    { id: 'cat_adm_rec',   name: 'Rekonsiliasi Minor',       color: '#0ea5e9', description: 'Selisih rekonsiliasi kecil yang bukan indikasi fraud', nature: 'Administrative' },
    { id: 'cat_adm_train', name: 'Training Gap',             color: '#f97316', description: 'Karyawan belum mengikuti pelatihan wajib',            nature: 'Administrative' },
    { id: 'cat_adm_rep',   name: 'Keterlambatan Pelaporan',  color: '#84cc16', description: 'Laporan tidak dikirim tepat waktu sesuai SOP',        nature: 'Administrative' },
  ];
  DB.set('fraud_categories', fraudCategories);

  // ---- Outlets ----
  const outlets = [
    { id: 'R241', code: 'R241', name: 'Depok Dua Tengah',          brand: 'PHR', province: 'Jawa Barat', outletManager: 'Ahmad Fauzi', multiUnitManager: 'Rina Fitriani', areaManager: 'Hendra Gunawan', distrikManager: 'Bambang Suprapto' },
    { id: 'C057', code: 'C057', name: 'Kenjeran Surabaya',         brand: 'PHD', province: 'Jawa Timur', outletManager: 'Dwi Cahyono', multiUnitManager: 'Rina Fitriani', areaManager: 'Hendra Gunawan', distrikManager: 'Bambang Suprapto' },
    { id: 'S025', code: 'S025', name: 'Citra Indah Jonggol',       brand: 'PHR', province: 'Jawa Barat', outletManager: 'Siti Nurhaliza', multiUnitManager: 'Mega Sari', areaManager: 'Agus Salim', distrikManager: 'Dwi Hartono' },
    { id: 'R316', code: 'R316', name: 'Mataram Sriwijaya',         brand: 'PHR', province: 'Sumatera Selatan', outletManager: 'M. Ilham', multiUnitManager: 'Mega Sari', areaManager: 'Agus Salim', distrikManager: 'Dwi Hartono' },
    { id: 'R201', code: 'R201', name: 'Modernland',                brand: 'PHR', province: 'Banten', outletManager: 'Teguh Prasetyo', multiUnitManager: 'Rina Fitriani', areaManager: 'Hendra Gunawan', distrikManager: 'Bambang Suprapto' },
    { id: 'C073', code: 'C073', name: 'Sangatta Kalimantan Timur', brand: 'PHD', province: 'Kalimantan Timur', outletManager: 'Joko Susilo', multiUnitManager: 'Bayu Anggara', areaManager: 'Slamet Riyadi', distrikManager: 'Martha Tilaar' },
    { id: 'R105', code: 'R105', name: 'Cibubur Junction',          brand: 'PHR', province: 'DKI Jakarta', outletManager: 'Dian Permata', multiUnitManager: 'Mega Sari', areaManager: 'Agus Salim', distrikManager: 'Dwi Hartono' },
    { id: 'C089', code: 'C089', name: 'Bekasi Timur',              brand: 'PHD', province: 'Jawa Barat', outletManager: 'Rudi Hermawan', multiUnitManager: 'Bayu Anggara', areaManager: 'Slamet Riyadi', distrikManager: 'Martha Tilaar' },
    { id: 'R322', code: 'R322', name: 'Bandung Supermall',         brand: 'PHR', province: 'Jawa Barat', outletManager: 'Yuni Astuti', multiUnitManager: 'Mega Sari', areaManager: 'Agus Salim', distrikManager: 'Dwi Hartono' },
    { id: 'C012', code: 'C012', name: 'Kelapa Gading',             brand: 'PHD', province: 'DKI Jakarta', outletManager: 'Fajar Hidayat', multiUnitManager: 'Bayu Anggara', areaManager: 'Slamet Riyadi', distrikManager: 'Martha Tilaar' },
    { id: 'H001', code: 'H001', name: 'Hayo Pantai Indah Kapuk',  brand: 'Hayo', province: 'DKI Jakarta', outletManager: 'Wawan Setiawan', multiUnitManager: 'Dedi Kurniawan', areaManager: 'Rudi Hartono', distrikManager: 'Agus Wijaya' },
    { id: 'H022', code: 'H022', name: 'Hayo Sunter',               brand: 'Hayo', province: 'DKI Jakarta', outletManager: 'Ratna Dewi', multiUnitManager: 'Dedi Kurniawan', areaManager: 'Rudi Hartono', distrikManager: 'Agus Wijaya' },
  ];
  DB.set('outlets', outlets);

  // ---- Users ----
  const users = [
    { id: 'usr_superadmin', username: 'admin', password: 'admin123', name: 'Administrator', email: 'admin@internalaudit.com', role: 'superadmin', department: null, status: 'active', picDepartment: '', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'usr_manager', username: 'manager', password: '123', name: 'Manager', email: 'manager@internalaudit.com', role: 'head', department: 'Store Audit', status: 'active', picDepartment: '', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'usr_auditor', username: 'auditor', password: '123', name: 'Auditor', email: 'auditor@internalaudit.com', role: 'auditor', department: 'Store Audit', status: 'active', picDepartment: '', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'usr_divisi', username: 'divisi', password: '123', name: 'Divisi', email: 'divisi@internalaudit.com', role: 'division', department: 'Operations', status: 'active', picDepartment: '', createdAt: '2025-01-01T00:00:00Z' },
  ];
  DB.set('users', users);

  // ---- Auditors ----
  const auditors = [
    { id: 'aud_1',  userId: 'usr_head_sa',  name: 'Budi Santoso',   nik: '1001', title: 'Head of Store Audit',       department: 'Store Audit',                   status: 'active',   joinDate: '2020-03-15', phone: '0812-1111-0001', email: 'budi.santoso@internalaudit.com' },
    { id: 'aud_2',  userId: 'usr_aud1',     name: 'Andi Wijaya',    nik: '1002', title: 'Senior Auditor',            department: 'Store Audit',                   status: 'active',   joinDate: '2021-06-01', phone: '0812-1111-0002', email: 'andi.wijaya@internalaudit.com' },
    { id: 'aud_3',  userId: 'usr_aud2',     name: 'Dewi Lestari',   nik: '1003', title: 'Auditor',                   department: 'Store Audit',                   status: 'active',   joinDate: '2022-01-10', phone: '0812-1111-0003', email: 'dewi.lestari@internalaudit.com' },
    { id: 'aud_4',                          name: 'Hendra Kusuma',  nik: '1004', title: 'Auditor',                   department: 'Store Audit',                   status: 'active',   joinDate: '2022-08-20', phone: '0812-1111-0004', email: 'hendra.kusuma@internalaudit.com' },
    { id: 'aud_5',  userId: 'usr_head_ca',  name: 'Sari Dewi',      nik: '2001', title: 'Head of Corporate Audit',   department: 'Corporate Audit',               status: 'active',   joinDate: '2019-11-01', phone: '0812-2222-0001', email: 'sari.dewi@internalaudit.com' },
    { id: 'aud_6',  userId: 'usr_aud3',     name: 'Fajar Nugroho',  nik: '2002', title: 'Senior Auditor',            department: 'Corporate Audit',               status: 'active',   joinDate: '2020-09-15', phone: '0812-2222-0002', email: 'fajar.nugroho@internalaudit.com' },
    { id: 'aud_7',                          name: 'Rina Puspita',   nik: '2003', title: 'Auditor',                   department: 'Corporate Audit',               status: 'active',   joinDate: '2021-04-01', phone: '0812-2222-0003', email: 'rina.puspita@internalaudit.com' },
    { id: 'aud_8',  userId: 'usr_head_bpi', name: 'Rudi Hermawan',  nik: '3001', title: 'Head of BPI',               department: 'Business Process Improvement',  status: 'active',   joinDate: '2018-07-01', phone: '0812-3333-0001', email: 'rudi.hermawan@internalaudit.com' },
    { id: 'aud_9',                          name: 'Novita Sari',    nik: '3002', title: 'BPI Analyst',               department: 'Business Process Improvement',  status: 'active',   joinDate: '2021-03-01', phone: '0812-3333-0002', email: 'novita.sari@internalaudit.com' },
    { id: 'aud_10',                         name: 'Agus Priyanto',  nik: '3003', title: 'BPI Analyst',               department: 'Business Process Improvement',  status: 'inactive', joinDate: '2020-01-15', phone: '0812-3333-0003', email: 'agus.priyanto@internalaudit.com' },
  ];
  DB.set('auditors', auditors);

  // ---- WBS Cases ----
  const wbsCases = [
    { id: 'wbs_001', caseNo: 'WBS-2025-001', reportDate: '2025-08-05', category: 'Sales Fraud', brand: 'PHR', outletCode: 'R241', outletName: 'Depok Dua Tengah', province: 'Jawa Barat', status: 'Closed', severity: 'High', estimatedFraud: 250000000, description: 'Sales manipulation through void transactions — dilaporkan oleh karyawan anonim', initialIndication: 'Void transaksi melebihi threshold normal selama 3 bulan', assignedTo: 'aud_2', resolvedDate: '2025-09-15', linkedPlanningId: 'pln_001', notes: 'Case resolved with recovery', picDepartment: '', createdAt: '2025-08-05T00:00:00Z' },
    { id: 'wbs_002', caseNo: 'WBS-2025-002', reportDate: '2025-08-12', category: 'Sales Payment Manipulation', brand: 'PHD', outletCode: 'C057', outletName: 'Kenjeran Surabaya', province: 'Jawa Timur', status: 'Closed', severity: 'High', estimatedFraud: 180000000, description: 'Payment manipulation via cashier terminal', initialIndication: 'Cashier terminal override tanpa otorisasi supervisor', assignedTo: 'aud_3', resolvedDate: '2025-10-01', linkedPlanningId: 'pln_002', notes: '', picDepartment: '', createdAt: '2025-08-12T00:00:00Z' },
    { id: 'wbs_003', caseNo: 'WBS-2025-003', reportDate: '2025-11-03', category: 'Inventory Theft', brand: 'PHR', outletCode: 'R105', outletName: 'Cibubur Junction', province: 'DKI Jakarta', status: 'Closed', severity: 'Medium', estimatedFraud: 15000000, description: 'Missing inventory items', initialIndication: 'Selisih stok opname bulanan dengan catatan sistem', assignedTo: 'aud_2', resolvedDate: '2025-12-01', linkedPlanningId: 'pln_003', notes: '', picDepartment: '', createdAt: '2025-11-03T00:00:00Z' },
    { id: 'wbs_004', caseNo: 'WBS-2025-004', reportDate: '2025-12-01', category: 'Cash Deposit Fraud', brand: 'PHD', outletCode: 'C089', outletName: 'Bekasi Timur', province: 'Jawa Barat', status: 'Closed', severity: 'High', estimatedFraud: 320000000, description: 'Cash deposit not recorded', initialIndication: 'Rekonsiliasi harian menunjukkan selisih kas berturut-turut', assignedTo: 'aud_3', resolvedDate: '2026-01-20', linkedPlanningId: 'pln_004', notes: '', picDepartment: '', createdAt: '2025-12-01T00:00:00Z' },
    { id: 'wbs_005', caseNo: 'WBS-2026-001', reportDate: '2026-01-10', category: 'Sales Fraud', brand: 'PHR', outletCode: 'R322', outletName: 'Bandung Supermall', province: 'Jawa Barat', status: 'Closed', severity: 'High', estimatedFraud: 190000000, description: 'Fake promotional discounts', initialIndication: 'Diskon promo diberikan di luar periode promosi yang disetujui', assignedTo: 'aud_2', resolvedDate: '2026-02-28', linkedPlanningId: 'pln_005', notes: '', picDepartment: '', createdAt: '2026-01-10T00:00:00Z' },
    { id: 'wbs_006', caseNo: 'WBS-2026-002', reportDate: '2026-02-08', category: 'Paid Out Manipulation', brand: 'PHD', outletCode: 'C012', outletName: 'Kelapa Gading', province: 'DKI Jakarta', status: 'Closed', severity: 'Medium', estimatedFraud: 45000000, description: 'Unauthorized paid-out transactions', initialIndication: 'Paid-out tidak didukung bukti fisik yang valid', assignedTo: 'aud_3', resolvedDate: '2026-03-15', linkedPlanningId: 'pln_006', notes: '', picDepartment: '', createdAt: '2026-02-08T00:00:00Z' },
    { id: 'wbs_007', caseNo: 'WBS-2026-003', reportDate: '2026-02-20', category: 'Sales Fraud', brand: 'PHR', outletCode: 'R241', outletName: 'Depok Dua Tengah', province: 'Jawa Barat', status: 'On Hold', severity: 'High', estimatedFraud: 380000000, description: 'Suspected repeat fraud — investigation pending', initialIndication: 'Pola void transaksi mirip dengan kasus WBS-2025-001', assignedTo: 'aud_2', resolvedDate: null, linkedPlanningId: null, notes: 'On hold pending HR approval', picDepartment: '', createdAt: '2026-02-20T00:00:00Z' },
    { id: 'wbs_008', caseNo: 'WBS-2026-004', reportDate: '2026-03-05', category: 'Sales Payment Manipulation', brand: 'PHR', outletCode: 'S025', outletName: 'Citra Indah Jonggol', province: 'Jawa Barat', status: 'Investigation', severity: 'Medium', estimatedFraud: 90000000, description: 'Discount manipulation on delivery orders', initialIndication: 'Diskon delivery di atas 30% tanpa approval manajemen', assignedTo: 'aud_3', resolvedDate: null, linkedPlanningId: 'pln_007', notes: '', picDepartment: '', createdAt: '2026-03-05T00:00:00Z' },
    { id: 'wbs_009', caseNo: 'WBS-2026-005', reportDate: '2026-04-01', category: 'Cash Deposit Fraud', brand: 'PHD', outletCode: 'C073', outletName: 'Sangatta Kalimantan Timur', province: 'Kalimantan Timur', status: 'Closed', severity: 'Low', estimatedFraud: 12000000, description: 'Minor cash shortage', initialIndication: 'Laporan kasir harian tidak sesuai dengan setoran bank', assignedTo: 'aud_2', resolvedDate: '2026-04-30', linkedPlanningId: 'pln_008', notes: '', picDepartment: '', createdAt: '2026-04-01T00:00:00Z' },
    { id: 'wbs_010', caseNo: 'WBS-2026-006', reportDate: '2026-04-15', category: 'Paid Out Manipulation', brand: 'PHR', outletCode: 'R316', outletName: 'Mataram Sriwijaya', province: 'Sumatera Selatan', status: 'Closed', severity: 'Medium', estimatedFraud: 35000000, description: 'Fictitious paid-out claims', initialIndication: 'Klaim operasional fiktif untuk utilitas dan kebersihan', assignedTo: 'aud_3', resolvedDate: '2026-05-20', linkedPlanningId: 'pln_009', notes: '', picDepartment: '', createdAt: '2026-04-15T00:00:00Z' },
    { id: 'wbs_011', caseNo: 'WBS-2026-007', reportDate: '2026-05-02', category: 'Sales Fraud', brand: 'PHR', outletCode: 'R201', outletName: 'Modernland', province: 'Banten', status: 'Closed', severity: 'High', estimatedFraud: 210000000, description: 'Unauthorized void of sales transactions', initialIndication: 'Void oleh karyawan yang sama melebihi Rp 5jt/hari', assignedTo: 'aud_2', resolvedDate: '2026-06-01', linkedPlanningId: 'pln_010', notes: '', picDepartment: '', createdAt: '2026-05-02T00:00:00Z' },
    { id: 'wbs_012', caseNo: 'WBS-2026-008', reportDate: '2026-05-18', category: 'Inventory Theft', brand: 'PHD', outletCode: 'C057', outletName: 'Kenjeran Surabaya', province: 'Jawa Timur', status: 'Closed', severity: 'Low', estimatedFraud: 8500000, description: 'Missing high-value ingredients', initialIndication: 'Selisih stock opname untuk bahan premium > 5%', assignedTo: 'aud_4', resolvedDate: '2026-06-10', linkedPlanningId: 'pln_011', notes: '', picDepartment: '', createdAt: '2026-05-18T00:00:00Z' },
  ];
  DB.set('wbs_cases', wbsCases);

  // ---- FDS Cases ----
  const fdsCases = [
    { id: 'fds_001', caseNo: 'FDS-2026-001', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHR', outletCode: 'R316', outletName: 'Mataram Sriwijaya', province: 'Sumatera Selatan', status: 'Planned', estimatedFraud: 5500000, description: 'Anomalous point accumulation pattern detected', assignedTo: 'aud_2', linkedPlanningId: 'pln_012', notes: '' },
    { id: 'fds_002', caseNo: 'FDS-2026-002', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHR', outletCode: 'R201', outletName: 'Modernland', province: 'Banten', status: 'Planned', estimatedFraud: 4200000, description: 'High-frequency point redemption flagged', assignedTo: 'aud_3', linkedPlanningId: null, notes: '' },
    { id: 'fds_003', caseNo: 'FDS-2026-003', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHD', outletCode: 'C073', outletName: 'Sangatta Kalimantan Timur', province: 'Kalimantan Timur', status: 'Planned', estimatedFraud: 3800000, description: 'Bulk point manipulation detected', assignedTo: 'aud_2', linkedPlanningId: null, notes: '' },
    { id: 'fds_004', caseNo: 'FDS-2026-004', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHR', outletCode: 'R105', outletName: 'Cibubur Junction', province: 'DKI Jakarta', status: 'Hold', estimatedFraud: 2900000, description: 'Duplicate point entry detected', assignedTo: 'aud_4', linkedPlanningId: null, notes: 'On hold pending system verification' },
    { id: 'fds_005', caseNo: 'FDS-2026-005', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHD', outletCode: 'C089', outletName: 'Bekasi Timur', province: 'Jawa Barat', status: 'Closed', estimatedFraud: 7200000, description: 'Point abuse confirmed', assignedTo: 'aud_3', linkedPlanningId: 'pln_013', notes: 'Case confirmed and closed' },
    { id: 'fds_006', caseNo: 'FDS-2026-006', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHR', outletCode: 'R322', outletName: 'Bandung Supermall', province: 'Jawa Barat', status: 'Closed', estimatedFraud: 4100000, description: 'Irregular loyalty transactions', assignedTo: 'aud_2', linkedPlanningId: null, notes: '' },
    { id: 'fds_007', caseNo: 'FDS-2026-007', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHR', outletCode: 'R241', outletName: 'Depok Dua Tengah', province: 'Jawa Barat', status: 'Hold', estimatedFraud: 6300000, description: 'Massive point issuance without transaction', assignedTo: 'aud_3', linkedPlanningId: null, notes: '' },
    { id: 'fds_008', caseNo: 'FDS-2026-008', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHD', outletCode: 'C012', outletName: 'Kelapa Gading', province: 'DKI Jakarta', status: 'Hold', estimatedFraud: 3400000, description: 'Suspicious employee-linked point usage', assignedTo: 'aud_4', linkedPlanningId: null, notes: '' },
    { id: 'fds_009', caseNo: 'FDS-2026-009', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHR', outletCode: 'S025', outletName: 'Citra Indah Jonggol', province: 'Jawa Barat', status: 'Hold', estimatedFraud: 2600000, description: 'Auto-generated point entries flagged', assignedTo: 'aud_2', linkedPlanningId: null, notes: '' },
    { id: 'fds_010', caseNo: 'FDS-2026-010', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHD', outletCode: 'C057', outletName: 'Kenjeran Surabaya', province: 'Jawa Timur', status: 'Closed', estimatedFraud: 5900000, description: 'Confirmed point fraud at outlet level', assignedTo: 'aud_3', linkedPlanningId: null, notes: '' },
    { id: 'fds_011', caseNo: 'FDS-2026-011', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHR', outletCode: 'R316', outletName: 'Mataram Sriwijaya', province: 'Sumatera Selatan', status: 'Hold', estimatedFraud: 4800000, description: 'Manager-level point manipulation', assignedTo: 'aud_2', linkedPlanningId: null, notes: '' },
    { id: 'fds_012', caseNo: 'FDS-2026-012', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHR', outletCode: 'H001', outletName: 'Hayo Pantai Indah Kapuk', province: 'DKI Jakarta', status: 'Hold', estimatedFraud: 1900000, description: 'Small-scale point manipulation detected', assignedTo: 'aud_4', linkedPlanningId: null, notes: '' },
    { id: 'fds_013', caseNo: 'FDS-2026-013', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHD', outletCode: 'C089', outletName: 'Bekasi Timur', province: 'Jawa Barat', status: 'Closed', estimatedFraud: 3300000, description: 'Cashier-linked point abuse', assignedTo: 'aud_3', linkedPlanningId: null, notes: '' },
    { id: 'fds_014', caseNo: 'FDS-2026-014', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHR', outletCode: 'R105', outletName: 'Cibubur Junction', province: 'DKI Jakarta', status: 'Hold', estimatedFraud: 2100000, description: 'Irregular point entry pattern', assignedTo: 'aud_2', linkedPlanningId: null, notes: '' },
    { id: 'fds_015', caseNo: 'FDS-2026-015', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHD', outletCode: 'C073', outletName: 'Sangatta Kalimantan Timur', province: 'Kalimantan Timur', status: 'Planned', estimatedFraud: 2800000, description: 'Points added without valid transaction', assignedTo: 'aud_4', linkedPlanningId: null, notes: '' },
    { id: 'fds_016', caseNo: 'FDS-2026-016', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHR', outletCode: 'R201', outletName: 'Modernland', province: 'Banten', status: 'Hold', estimatedFraud: 3600000, description: 'Loyalty app exploitation detected', assignedTo: 'aud_3', linkedPlanningId: null, notes: '' },
    { id: 'fds_017', caseNo: 'FDS-2026-017', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHD', outletCode: 'C012', outletName: 'Kelapa Gading', province: 'DKI Jakarta', status: 'Closed', estimatedFraud: 5100000, description: 'Confirmed customer point abuse', assignedTo: 'aud_2', linkedPlanningId: null, notes: '' },
    { id: 'fds_018', caseNo: 'FDS-2026-018', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHR', outletCode: 'R322', outletName: 'Bandung Supermall', province: 'Jawa Barat', status: 'Hold', estimatedFraud: 2300000, description: 'Suspicious point redemption cluster', assignedTo: 'aud_4', linkedPlanningId: null, notes: '' },
    { id: 'fds_019', caseNo: 'FDS-2026-019', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHR', outletCode: 'H022', outletName: 'Hayo Sunter', province: 'DKI Jakarta', status: 'Hold', estimatedFraud: 1700000, description: 'Low-value point manipulation detected', assignedTo: 'aud_3', linkedPlanningId: null, notes: '' },
    { id: 'fds_020', caseNo: 'FDS-2026-020', detectionDate: '2026-04-01', category: 'Customer Point', brand: 'PHD', outletCode: 'C057', outletName: 'Kenjeran Surabaya', province: 'Jawa Timur', status: 'Hold', estimatedFraud: 4400000, description: 'Cross-outlet point manipulation ring', assignedTo: 'aud_2', linkedPlanningId: null, notes: '' },
  ];
  DB.set('fds_cases', fdsCases);

  /* ============================================================
     STAGE 1: AUDIT PLANNINGS
     1 Nomor Laporan per planning
     ============================================================ */
  const auditPlannings = [
    { id: 'pln_001', reportNo: 'LAP-2025-001', planningDate: '2025-08-10', auditDateFrom: '2025-08-20', auditDateTo: '2025-09-10', trigger: 'WBS', triggerRef: 'wbs_001', outletCode: 'R241', outletName: 'Depok Dua Tengah', brand: 'PHR', province: 'Jawa Barat', department: 'Store Audit', auditType: 'Fieldwork', leadAuditor: 'aud_2', auditorTeam: ['aud_3'], scope: 'Pemeriksaan menyeluruh transaksi void, cash count, dan rekonsiliasi POS selama Q3 2025', status: 'Completed', reportSentDate: '2025-09-20', picDepartment: '', createdAt: '2025-08-10T00:00:00Z', outletManager: 'Ahmad Fauzi', multiUnitManager: 'Rina Fitriani', areaManager: 'Hendra Gunawan', distrikManager: 'Bambang Suprapto' },
    { id: 'pln_002', reportNo: 'LAP-2025-002', planningDate: '2025-08-18', auditDateFrom: '2025-08-25', auditDateTo: '2025-09-28', trigger: 'WBS', triggerRef: 'wbs_002', outletCode: 'C057', outletName: 'Kenjeran Surabaya', brand: 'PHD', province: 'Jawa Timur', department: 'Store Audit', auditType: 'Fieldwork', leadAuditor: 'aud_3', auditorTeam: ['aud_4'], scope: 'Audit transaksi pembayaran dan override cashier terminal periode Agustus 2025', status: 'Completed', reportSentDate: '2025-10-05', picDepartment: '', createdAt: '2025-08-18T00:00:00Z', outletManager: 'Dwi Cahyono', multiUnitManager: 'Rina Fitriani', areaManager: 'Hendra Gunawan', distrikManager: 'Bambang Suprapto' },
    { id: 'pln_003', reportNo: 'LAP-2025-003', planningDate: '2025-11-10', auditDateFrom: '2025-11-15', auditDateTo: '2025-11-30', trigger: 'WBS', triggerRef: 'wbs_003', outletCode: 'R105', outletName: 'Cibubur Junction', brand: 'PHR', province: 'DKI Jakarta', department: 'Store Audit', auditType: 'Monitoring', leadAuditor: 'aud_2', auditorTeam: [], scope: 'Stock opname dan verifikasi fisik seluruh item inventori', status: 'Completed', reportSentDate: '2025-12-05', picDepartment: '', createdAt: '2025-11-10T00:00:00Z', outletManager: 'Dian Permata', multiUnitManager: 'Mega Sari', areaManager: 'Agus Salim', distrikManager: 'Dwi Hartono' },
    { id: 'pln_004', reportNo: 'LAP-2025-004', planningDate: '2025-12-08', auditDateFrom: '2025-12-15', auditDateTo: '2026-01-10', trigger: 'WBS', triggerRef: 'wbs_004', outletCode: 'C089', outletName: 'Bekasi Timur', brand: 'PHD', province: 'Jawa Barat', department: 'Store Audit', auditType: 'Fieldwork', leadAuditor: 'aud_3', auditorTeam: ['aud_2'], scope: 'Audit cash deposit, rekonsiliasi bank, dan prosedur setor harian', status: 'Completed', reportSentDate: '2026-01-20', picDepartment: '', createdAt: '2025-12-08T00:00:00Z', outletManager: 'Rudi Hermawan', multiUnitManager: 'Bayu Anggara', areaManager: 'Slamet Riyadi', distrikManager: 'Martha Tilaar' },
    { id: 'pln_005', reportNo: 'LAP-2026-001', planningDate: '2026-01-15', auditDateFrom: '2026-01-20', auditDateTo: '2026-02-20', trigger: 'WBS', triggerRef: 'wbs_005', outletCode: 'R322', outletName: 'Bandung Supermall', brand: 'PHR', province: 'Jawa Barat', department: 'Store Audit', auditType: 'Fieldwork', leadAuditor: 'aud_2', auditorTeam: ['aud_4'], scope: 'Verifikasi transaksi promo, diskon, dan laporan penjualan harian', status: 'Completed', reportSentDate: '2026-03-01', picDepartment: '', createdAt: '2026-01-15T00:00:00Z', outletManager: 'Yuni Astuti', multiUnitManager: 'Mega Sari', areaManager: 'Agus Salim', distrikManager: 'Dwi Hartono' },
    { id: 'pln_006', reportNo: 'LAP-2026-002', planningDate: '2026-02-12', auditDateFrom: '2026-02-18', auditDateTo: '2026-03-10', trigger: 'WBS', triggerRef: 'wbs_006', outletCode: 'C012', outletName: 'Kelapa Gading', brand: 'PHD', province: 'DKI Jakarta', department: 'Corporate Audit', auditType: 'Fieldwork', leadAuditor: 'aud_6', auditorTeam: ['aud_7'], scope: 'Audit transaksi paid-out dan petty cash management', status: 'Completed', reportSentDate: '2026-03-18', picDepartment: '', createdAt: '2026-02-12T00:00:00Z', outletManager: 'Fajar Hidayat', multiUnitManager: 'Bayu Anggara', areaManager: 'Slamet Riyadi', distrikManager: 'Martha Tilaar' },
    { id: 'pln_007', reportNo: 'LAP-2026-003', planningDate: '2026-03-10', auditDateFrom: '2026-03-17', auditDateTo: '2026-04-15', trigger: 'WBS', triggerRef: 'wbs_008', outletCode: 'S025', outletName: 'Citra Indah Jonggol', brand: 'PHR', province: 'Jawa Barat', department: 'Store Audit', auditType: 'Monitoring', leadAuditor: 'aud_3', auditorTeam: [], scope: 'Monitoring transaksi delivery order dan program diskon', status: 'In Progress', picDepartment: '', createdAt: '2026-03-10T00:00:00Z', outletManager: 'Siti Nurhaliza', multiUnitManager: 'Mega Sari', areaManager: 'Agus Salim', distrikManager: 'Dwi Hartono' },
    { id: 'pln_008', reportNo: 'LAP-2026-004', planningDate: '2026-04-05', auditDateFrom: '2026-04-10', auditDateTo: '2026-04-25', trigger: 'WBS', triggerRef: 'wbs_009', outletCode: 'C073', outletName: 'Sangatta Kalimantan Timur', brand: 'PHD', province: 'Kalimantan Timur', department: 'Store Audit', auditType: 'Monitoring', leadAuditor: 'aud_2', auditorTeam: [], scope: 'Cash count dan verifikasi prosedur setoran kas harian', status: 'Completed', reportSentDate: '2026-05-05', picDepartment: '', createdAt: '2026-04-05T00:00:00Z', outletManager: 'Joko Susilo', multiUnitManager: 'Bayu Anggara', areaManager: 'Slamet Riyadi', distrikManager: 'Martha Tilaar' },
    { id: 'pln_009', reportNo: 'LAP-2026-005', planningDate: '2026-04-20', auditDateFrom: '2026-04-25', auditDateTo: '2026-05-15', trigger: 'WBS', triggerRef: 'wbs_010', outletCode: 'R316', outletName: 'Mataram Sriwijaya', brand: 'PHR', province: 'Sumatera Selatan', department: 'Store Audit', auditType: 'Fieldwork', leadAuditor: 'aud_3', auditorTeam: ['aud_4'], scope: 'Audit petty cash, paid-out, dan pengeluaran operasional', status: 'Completed', reportSentDate: '2026-05-25', picDepartment: '', createdAt: '2026-04-20T00:00:00Z', outletManager: 'M. Ilham', multiUnitManager: 'Mega Sari', areaManager: 'Agus Salim', distrikManager: 'Dwi Hartono' },
    { id: 'pln_010', reportNo: 'LAP-2026-006', planningDate: '2026-05-05', auditDateFrom: '2026-05-10', auditDateTo: '2026-05-28', trigger: 'WBS', triggerRef: 'wbs_011', outletCode: 'R201', outletName: 'Modernland', province: 'Banten', department: 'Store Audit', auditType: 'Fieldwork', leadAuditor: 'aud_2', auditorTeam: ['aud_3'], scope: 'Audit void transaction, otorisasi manajemen, dan laporan POS', status: 'Completed', reportSentDate: '2026-06-10', picDepartment: '', createdAt: '2026-05-05T00:00:00Z', outletManager: 'Teguh Prasetyo', multiUnitManager: 'Rina Fitriani', areaManager: 'Hendra Gunawan', distrikManager: 'Bambang Suprapto' },
    { id: 'pln_011', reportNo: 'LAP-2026-007', planningDate: '2026-05-22', auditDateFrom: '2026-05-28', auditDateTo: '2026-06-10', trigger: 'WBS', triggerRef: 'wbs_012', outletCode: 'C057', outletName: 'Kenjeran Surabaya', brand: 'PHD', province: 'Jawa Timur', department: 'Store Audit', auditType: 'Monitoring', leadAuditor: 'aud_4', auditorTeam: [], scope: 'Stock opname bahan premium dan pemeriksaan alur supply chain', status: 'Completed', reportSentDate: '2026-06-18', picDepartment: '', createdAt: '2026-05-22T00:00:00Z', outletManager: 'Dwi Cahyono', multiUnitManager: 'Rina Fitriani', areaManager: 'Hendra Gunawan', distrikManager: 'Bambang Suprapto' },
    { id: 'pln_012', reportNo: 'LAP-2026-008', planningDate: '2026-04-08', auditDateFrom: '2026-04-15', auditDateTo: '2026-05-05', trigger: 'FDS', triggerRef: 'fds_001', outletCode: 'R316', outletName: 'Mataram Sriwijaya', brand: 'PHR', province: 'Sumatera Selatan', department: 'Store Audit', auditType: 'Monitoring', leadAuditor: 'aud_2', auditorTeam: [], scope: 'Verifikasi pola akumulasi poin pelanggan dan transaksi loyalty yang anomali', status: 'In Progress', picDepartment: '', createdAt: '2026-04-08T00:00:00Z', outletManager: 'M. Ilham', multiUnitManager: 'Mega Sari', areaManager: 'Agus Salim', distrikManager: 'Dwi Hartono' },
    { id: 'pln_013', reportNo: 'LAP-2026-009', planningDate: '2026-03-05', auditDateFrom: '2026-03-10', auditDateTo: '2026-03-25', trigger: 'FDS', triggerRef: 'fds_005', outletCode: 'C089', outletName: 'Bekasi Timur', brand: 'PHD', province: 'Jawa Barat', department: 'Store Audit', auditType: 'Monitoring', leadAuditor: 'aud_4', auditorTeam: [], scope: 'Investigasi penyalahgunaan poin loyalty oleh karyawan', status: 'Completed', reportSentDate: '2026-04-05', picDepartment: '', createdAt: '2026-03-05T00:00:00Z', outletManager: 'Rudi Hermawan', multiUnitManager: 'Bayu Anggara', areaManager: 'Slamet Riyadi', distrikManager: 'Martha Tilaar' },
    { id: 'pln_014', reportNo: 'LAP-2026-010', planningDate: '2026-06-01', auditDateFrom: '2026-06-10', auditDateTo: '2026-06-30', trigger: 'Direct', triggerRef: null, outletCode: 'H001', outletName: 'Hayo Pantai Indah Kapuk', brand: 'Hayo', province: 'DKI Jakarta', department: 'Corporate Audit', auditType: 'Fieldwork', leadAuditor: 'aud_6', auditorTeam: ['aud_7'], scope: 'Audit rutin tahunan — keuangan, operasional, dan kepatuhan SOP', status: 'Plan', picDepartment: '', createdAt: '2026-06-01T00:00:00Z', outletManager: 'Wawan Setiawan', multiUnitManager: 'Dedi Kurniawan', areaManager: 'Rudi Hartono', distrikManager: 'Agus Wijaya' },
  ];
  DB.set('audit_plannings', auditPlannings);

  /* ============================================================
     STAGE 2: AUDIT RESULTS
     Mengacu ke Nomor Laporan (planningId)
     1 planning bisa memiliki beberapa temuan/hasil audit
     ============================================================ */
  const auditResults = [
    // LAP-2025-001 (pln_001) — Depok Dua Tengah
    { id: 'res_001', planningId: 'pln_001', findingNo: 'LAP-2025-001/F1', findingTitle: 'Void Transaksi Tidak Sah', category: 'Sales', findingDate: '2025-08-28', description: 'Ditemukan 47 transaksi void tanpa otorisasi supervisor senilai Rp 120jt. Seluruh void dilakukan oleh cashier ID A-041 pada shift malam.', totalLoss: 120000000, severity: 'High', status: 'Closed', nature: 'Fraud', fraudsterName: 'Ahmad Rizki', fraudsterNik: 'NIK-2021-0041', fraudsterPosition: 'Cashier', picDepartment: '', createdAt: '2025-08-28T00:00:00Z' },
    { id: 'res_002', planningId: 'pln_001', findingNo: 'LAP-2025-001/F2', findingTitle: 'Manipulasi Diskon Manual', category: 'Sales', findingDate: '2025-09-02', description: 'Ditemukan pemberian diskon manual melebihi batas kewenangan (>20%) sebanyak 23 transaksi. Selisih nilai Rp 130jt.', totalLoss: 130000000, severity: 'High', status: 'Closed', nature: 'Fraud', fraudsterName: 'Dian Permata Sari', fraudsterNik: 'NIK-2022-0088', fraudsterPosition: 'Senior Cashier', picDepartment: '', createdAt: '2025-09-02T00:00:00Z' },

    // LAP-2025-002 (pln_002) — Kenjeran Surabaya
    { id: 'res_003', planningId: 'pln_002', findingNo: 'LAP-2025-002/F1', findingTitle: 'Override Cashier Terminal', category: 'Sales', findingDate: '2025-09-05', description: 'Cashier terminal di-override sebanyak 38 kali tanpa otorisasi yang sah. Total nilai transaksi yang dimanipulasi Rp 180jt.', totalLoss: 180000000, severity: 'High', status: 'Closed', nature: 'Fraud', fraudsterName: 'Hendra Wijaya', fraudsterNik: 'NIK-2020-0123', fraudsterPosition: 'Kasir', picDepartment: '', createdAt: '2025-09-05T00:00:00Z' },

    // LAP-2025-003 (pln_003) — Cibubur Junction
    { id: 'res_004', planningId: 'pln_003', findingNo: 'LAP-2025-003/F1', findingTitle: 'Selisih Stock Opname Bahan Baku', category: 'Inventory', findingDate: '2025-11-20', description: 'Selisih fisik vs sistem untuk daging premium sebesar 85kg senilai Rp 15jt.', totalLoss: 15000000, severity: 'Medium', status: 'Closed', nature: 'Fraud', fraudsterName: 'Slamet Riyadi', fraudsterNik: 'NIK-2019-0056', fraudsterPosition: 'Gudang', picDepartment: '', createdAt: '2025-11-20T00:00:00Z' },

    // LAP-2025-004 (pln_004) — Bekasi Timur
    { id: 'res_005', planningId: 'pln_004', findingNo: 'LAP-2025-004/F1', findingTitle: 'Perbedaan Cash Deposit vs Rekening Bank', category: 'Cash', findingDate: '2025-12-22', description: 'Selisih antara catatan kasir harian dan rekening koran bank selama Nov–Des 2025 sebesar Rp 320jt.', totalLoss: 320000000, severity: 'High', status: 'Closed', nature: 'Fraud', fraudsterName: 'Rudi Hartono', fraudsterNik: 'NIK-2018-0099', fraudsterPosition: 'Kasir', picDepartment: '', createdAt: '2025-12-22T00:00:00Z' },

    // LAP-2026-001 (pln_005) — Bandung Supermall
    { id: 'res_006', planningId: 'pln_005', findingNo: 'LAP-2026-001/F1', findingTitle: 'Promo Fiktif pada Transaksi Delivery', category: 'Sales', findingDate: '2026-01-25', description: 'Promo diskon delivery diberikan di luar periode resmi kepada 156 transaksi senilai Rp 190jt.', totalLoss: 190000000, severity: 'High', status: 'Closed', nature: 'Fraud', fraudsterName: 'Yuni Astuti', fraudsterNik: 'NIK-2021-0155', fraudsterPosition: 'Staff Marketing', picDepartment: '', createdAt: '2026-01-25T00:00:00Z' },

    // LAP-2026-002 (pln_006) — Kelapa Gading
    { id: 'res_007', planningId: 'pln_006', findingNo: 'LAP-2026-002/F1', findingTitle: 'Paid-Out Tanpa Bukti Pendukung', category: 'Cash', findingDate: '2026-02-22', description: 'Ditemukan 12 transaksi paid-out senilai total Rp 45jt tidak didukung bukti fisik yang valid (nota, kwitansi resmi).', totalLoss: 45000000, severity: 'Medium', status: 'Closed', nature: 'Fraud', fraudsterName: 'Fajar Hidayat', fraudsterNik: 'NIK-2022-0211', fraudsterPosition: 'Supervisor Shift', picDepartment: '', createdAt: '2026-02-22T00:00:00Z' },

    // LAP-2026-003 (pln_007) — Citra Indah Jonggol (In Progress) — FRAUD finding
    { id: 'res_008', planningId: 'pln_007', findingNo: 'LAP-2026-003/F1', findingTitle: 'Diskon Delivery Melebihi Batas Kewenangan', category: 'Sales', findingDate: '2026-03-25', description: 'Ditemukan 89 transaksi delivery dengan diskon >30% tanpa approval manajemen. Investigasi masih berlangsung.', totalLoss: 90000000, severity: 'Medium', status: 'Open', nature: 'Fraud', fraudsterName: '', fraudsterNik: '', fraudsterPosition: '', picDepartment: '', createdAt: '2026-03-25T00:00:00Z' },
    // LAP-2026-003 (pln_007) — ADMINISTRATIVE findings
    { id: 'res_015', planningId: 'pln_007', findingNo: 'LAP-2026-003/A1', findingTitle: 'SOP Approval Diskon Tidak Dijalankan', category: 'SOP', findingDate: '2026-03-26', description: 'Prosedur persetujuan diskon di atas 20% tidak dilaksanakan secara konsisten. Form otorisasi tidak diisi sebelum transaksi diproses.', totalLoss: 0, severity: 'Medium', status: 'Open', nature: 'Administrative', picDepartment: '', createdAt: '2026-03-26T00:00:00Z' },
    { id: 'res_016', planningId: 'pln_007', findingNo: 'LAP-2026-003/A2', findingTitle: 'Dokumentasi Transaksi Delivery Tidak Lengkap', category: 'Dokumentasi', findingDate: '2026-03-27', description: 'Sebanyak 34 transaksi delivery tidak dilengkapi dengan bukti pengiriman yang ditandatangani pelanggan sesuai SOP.', totalLoss: 0, severity: 'Low', status: 'Open', nature: 'Administrative', picDepartment: '', createdAt: '2026-03-27T00:00:00Z' },

    // LAP-2026-004 (pln_008) — Sangatta
    { id: 'res_009', planningId: 'pln_008', findingNo: 'LAP-2026-004/F1', findingTitle: 'Selisih Kas Harian', category: 'Cash', findingDate: '2026-04-18', description: 'Selisih kas harian pada 5 hari kerja berturut-turut total Rp 12jt. Karyawan terkait sudah mengakui.', totalLoss: 12000000, severity: 'Low', status: 'Closed', nature: 'Fraud', picDepartment: '', createdAt: '2026-04-18T00:00:00Z' },

    // LAP-2026-005 (pln_009) — Mataram Sriwijaya
    { id: 'res_010', planningId: 'pln_009', findingNo: 'LAP-2026-005/F1', findingTitle: 'Klaim Paid-Out Fiktif', category: 'Cash', findingDate: '2026-05-02', description: 'Ditemukan klaim operasional fiktif (utilitas, kebersihan) senilai Rp 35jt dengan tanda tangan palsu.', totalLoss: 35000000, severity: 'Medium', status: 'Closed', nature: 'Fraud', picDepartment: '', createdAt: '2026-05-02T00:00:00Z' },

    // LAP-2026-006 (pln_010) — Modernland
    { id: 'res_011', planningId: 'pln_010', findingNo: 'LAP-2026-006/F1', findingTitle: 'Void Tidak Sah oleh Karyawan Sama', category: 'Sales', findingDate: '2026-05-15', description: 'Karyawan ID M-019 melakukan void senilai Rp 180jt selama periode Maret-Mei 2026 tanpa otorisasi atasan.', totalLoss: 180000000, severity: 'High', status: 'Closed', nature: 'Fraud', picDepartment: '', createdAt: '2026-05-15T00:00:00Z' },
    { id: 'res_012', planningId: 'pln_010', findingNo: 'LAP-2026-006/F2', findingTitle: 'Manipulasi Laporan Shift Malam', category: 'Sales', findingDate: '2026-05-18', description: 'Laporan shift malam menunjukkan perbedaan dengan data POS asli. Selisih Rp 30jt.', totalLoss: 30000000, severity: 'Medium', status: 'Closed', nature: 'Fraud', picDepartment: '', createdAt: '2026-05-18T00:00:00Z' },

    // LAP-2026-007 (pln_011) — Kenjeran Surabaya (2nd audit)
    { id: 'res_013', planningId: 'pln_011', findingNo: 'LAP-2026-007/F1', findingTitle: 'Kehilangan Bahan Premium', category: 'Inventory', findingDate: '2026-06-03', description: 'Selisih stok daging premium (beef dan chicken) antara fisik dan sistem sebesar Rp 8.5jt.', totalLoss: 8500000, severity: 'Low', status: 'Closed', nature: 'Fraud', picDepartment: '', createdAt: '2026-06-03T00:00:00Z' },

    // LAP-2026-009 (pln_013) — Bekasi Timur FDS
    { id: 'res_014', planningId: 'pln_013', findingNo: 'LAP-2026-009/F1', findingTitle: 'Penyalahgunaan Poin Loyalty oleh Karyawan', category: 'Customer Point', findingDate: '2026-03-18', description: 'Karyawan kasir menambahkan poin ke nomor HP pribadi sebanyak 142 kali. Total nilai poin Rp 7.2jt.', totalLoss: 7200000, severity: 'Medium', status: 'Closed', nature: 'Fraud', picDepartment: '', createdAt: '2026-03-18T00:00:00Z' },

    // LAP-2026-010 (pln_014) — Hayo PIK (Direct / Routine Audit) — ADMINISTRATIVE
    { id: 'res_017', planningId: 'pln_014', findingNo: 'LAP-2026-010/A1', findingTitle: 'Laporan Harian Tidak Dikirim Tepat Waktu', category: 'Keterlambatan Pelaporan', findingDate: '2026-06-12', description: 'Laporan operasional harian dikirimkan rata-rata 2 hari terlambat dari SOP (max H+1). Terjadi pada 18 dari 30 hari kerja periode review.', totalLoss: 0, severity: 'Medium', status: 'Open', nature: 'Administrative', picDepartment: '', createdAt: '2026-06-12T00:00:00Z' },
    { id: 'res_018', planningId: 'pln_014', findingNo: 'LAP-2026-010/A2', findingTitle: 'Kontrol Akses CCTV Tidak Memadai', category: 'Kontrol Internal', findingDate: '2026-06-14', description: 'Akses ke ruang rekaman CCTV tidak dibatasi hanya untuk pejabat berwenang. Ditemukan 3 karyawan non-manajerial yang memiliki kunci ruang server.', totalLoss: 0, severity: 'High', status: 'Open', nature: 'Administrative', picDepartment: '', createdAt: '2026-06-14T00:00:00Z' },
  ];
  DB.set('audit_results', auditResults);

  /* ============================================================
     STAGE 3: AUDIT ACTIONS (Agreed Action Plans)
     Mengacu ke resultId
     1 hasil audit bisa menghasilkan beberapa tindakan perbaikan
     ============================================================ */
  const auditActions = [
    // ── Human Resources (5 AAP) ──────────────────────────
    // act_001: HR Manager Outlet → HR
    { id: 'act_001', resultId: 'res_001', planningId: 'pln_001', actionNo: 'AAP-001-1', actionTitle: 'Penonaktifan Akun Cashier Terkait', description: 'Menonaktifkan akun cashier ID A-041 dan melakukan investigasi disiplin sesuai SOP HR.', picName: 'HR Manager Outlet', dueDate: '2025-10-15', completionDate: '2025-10-10', status: 'Closed', recovery: 50000000, picDepartment: 'Human Resources', createdAt: '2025-09-15T00:00:00Z' },
    // act_005: Training Manager → HR
    { id: 'act_005', resultId: 'res_002', planningId: 'pln_001', actionNo: 'AAP-002-2', actionTitle: 'Sosialisasi Ulang SOP Diskon', description: 'Pelaksanaan training SOP diskon kepada seluruh cashier dan supervisor.', picName: 'Training Manager', dueDate: '2025-11-15', completionDate: '2025-11-10', status: 'Closed', recovery: 50000000, picDepartment: 'Human Resources', createdAt: '2025-09-15T00:00:00Z' },
    // act_010: HR & Finance → HR
    { id: 'act_010', resultId: 'res_005', planningId: 'pln_004', actionNo: 'AAP-005-2', actionTitle: 'Recovery Cicilan Karyawan', description: 'Recovery Rp 40jt melalui skema pemotongan gaji 12 bulan.', picName: 'HR & Finance', dueDate: '2027-01-20', completionDate: null, status: 'Open', recovery: 0, picDepartment: 'Human Resources', createdAt: '2026-01-15T00:00:00Z' },
    // act_016: HR & Legal → HR
    { id: 'act_016', resultId: 'res_010', planningId: 'pln_009', actionNo: 'AAP-010-1', actionTitle: 'Sanksi Disiplin dan Proses Hukum', description: 'Proses disiplin dan pelaporan ke pihak berwenang atas tanda tangan palsu.', picName: 'HR & Legal', dueDate: '2026-06-30', completionDate: null, status: 'Open', recovery: 0, picDepartment: 'Human Resources', createdAt: '2026-05-20T00:00:00Z' },
    // act_018: HR & Legal Manager → HR
    { id: 'act_018', resultId: 'res_011', planningId: 'pln_010', actionNo: 'AAP-011-1', actionTitle: 'PHK dan Proses Hukum Pelaku', description: 'Proses PHK dan pelaporan ke kepolisian atas tindak pidana oleh karyawan M-019.', picName: 'HR & Legal Manager', dueDate: '2026-07-01', completionDate: null, status: 'Open', recovery: 0, picDepartment: 'Human Resources', createdAt: '2026-06-01T00:00:00Z' },

    // ── Information Technology (7 AAP) ──────────────────
    // act_004: IT POS Team → IT
    { id: 'act_004', resultId: 'res_002', planningId: 'pln_001', actionNo: 'AAP-002-1', actionTitle: 'Pembatasan Kewenangan Diskon Manual di Sistem', description: 'Update konfigurasi POS untuk batasi diskon manual maksimum 10% tanpa otorisasi manager.', picName: 'IT POS Team', dueDate: '2025-10-30', completionDate: '2025-10-25', status: 'Closed', recovery: 50000000, picDepartment: 'Information Technology', createdAt: '2025-09-15T00:00:00Z' },
    // act_006: IT Security Manager → IT
    { id: 'act_006', resultId: 'res_003', planningId: 'pln_002', actionNo: 'AAP-003-1', actionTitle: 'Audit IT — Review Log Override', description: 'IT Security melakukan review menyeluruh log override cashier terminal.', picName: 'IT Security Manager', dueDate: '2025-10-20', completionDate: '2025-10-15', status: 'Closed', recovery: 70000000, picDepartment: 'Information Technology', createdAt: '2025-09-28T00:00:00Z' },
    // act_007: IT Infrastructure → IT
    { id: 'act_007', resultId: 'res_003', planningId: 'pln_002', actionNo: 'AAP-003-2', actionTitle: 'Ganti Protokol Autentikasi Terminal', description: 'Implementasi two-factor authentication untuk override cashier terminal.', picName: 'IT Infrastructure', dueDate: '2025-12-01', completionDate: '2025-11-25', status: 'Closed', recovery: 80000000, picDepartment: 'Information Technology', createdAt: '2025-09-28T00:00:00Z' },
    // act_011: IT POS Team → IT
    { id: 'act_011', resultId: 'res_006', planningId: 'pln_005', actionNo: 'AAP-006-1', actionTitle: 'Aktivasi Validasi Periode Promo di Sistem', description: 'POS system diupdate agar otomatis memblokir promo di luar periode yang diizinkan.', picName: 'IT POS Team', dueDate: '2026-03-15', completionDate: '2026-03-10', status: 'Closed', recovery: 150000000, picDepartment: 'Information Technology', createdAt: '2026-02-28T00:00:00Z' },
    // act_021: IT Loyalty Team → IT
    { id: 'act_021', resultId: 'res_014', planningId: 'pln_013', actionNo: 'AAP-014-1', actionTitle: 'Blokir Penambahan Poin oleh Karyawan Sendiri', description: 'Update sistem loyalty untuk memblokir penambahan poin ke nomor HP karyawan aktif.', picName: 'IT Loyalty Team', dueDate: '2026-04-30', completionDate: '2026-04-25', status: 'Closed', recovery: 3600000, amount: 7200000, picDepartment: 'Information Technology', createdAt: '2026-03-25T00:00:00Z' },
    // act_024: IT POS Team → IT
    { id: 'act_024', resultId: 'res_015', planningId: 'pln_007', actionNo: 'AAP-015-1', actionTitle: 'Penyusunan Ulang Alur Otorisasi Diskon di POS', description: 'Membuat alur otorisasi berjenjang di POS untuk diskon di atas 20%.', picName: 'IT POS Team', dueDate: '2026-04-10', completionDate: '2026-04-08', status: 'Closed', amount: 0, picDepartment: 'Information Technology', createdAt: '2026-03-28T00:00:00Z' },
    // act_027: IT Dev Team → IT
    { id: 'act_027', resultId: 'res_017', planningId: 'pln_014', actionNo: 'AAP-017-1', actionTitle: 'Setting Auto-Reminder Laporan Store Manager', description: 'Membuat sistem alert otomatis ke email Store Manager jika H+1 belum upload laporan.', picName: 'IT Dev Team', dueDate: '2026-06-20', completionDate: '2026-06-18', status: 'Closed', amount: 0, picDepartment: 'Information Technology', createdAt: '2026-06-15T00:00:00Z' },

    // ── Operations (8 AAP) ──────────────────────────────
    // act_002: Area Manager → Operations
    { id: 'act_002', resultId: 'res_001', planningId: 'pln_001', actionNo: 'AAP-001-2', actionTitle: 'Penerapan Dual Control untuk Void', description: 'Mensyaratkan otorisasi dua supervisor untuk setiap void di atas Rp 500 ribu.', picName: 'Area Manager', dueDate: '2025-11-01', completionDate: '2025-10-28', status: 'Closed', recovery: 50000000, picDepartment: 'Operations', createdAt: '2025-09-15T00:00:00Z' },
    // act_008: Store Manager → Operations
    { id: 'act_008', resultId: 'res_004', planningId: 'pln_003', actionNo: 'AAP-004-1', actionTitle: 'Stock Opname Bulanan Mandatory', description: 'Mewajibkan stock opname fisik setiap bulan dengan laporan yang ditandatangani supervisor.', picName: 'Store Manager', dueDate: '2025-12-15', completionDate: '2025-12-10', status: 'Closed', recovery: 15000000, picDepartment: 'Operations', createdAt: '2025-11-30T00:00:00Z' },
    // act_013: Operations Manager → Operations
    { id: 'act_013', resultId: 'res_007', planningId: 'pln_006', actionNo: 'AAP-007-1', actionTitle: 'Wajib Lampirkan Bukti Asli untuk Paid-Out', description: 'SOP paid-out diperketat: wajib nota asli + tanda tangan vendor. Implementasi di seluruh outlet.', picName: 'Operations Manager', dueDate: '2026-04-01', completionDate: '2026-03-28', status: 'Closed', recovery: 30000000, picDepartment: 'Operations', createdAt: '2026-03-15T00:00:00Z' },
    // act_015: Store Trainer → Operations
    { id: 'act_015', resultId: 'res_009', planningId: 'pln_008', actionNo: 'AAP-009-1', actionTitle: 'Cash Handling Training', description: 'Training ulang prosedur cash handling untuk seluruh cashier.', picName: 'Store Trainer', dueDate: '2026-05-30', completionDate: '2026-05-25', status: 'Closed', recovery: 12000000, picDepartment: 'Operations', createdAt: '2026-04-30T00:00:00Z' },
    // act_020: IT & Operations → Operations (laporan shift adalah proses operasional)
    { id: 'act_020', resultId: 'res_012', planningId: 'pln_010', actionNo: 'AAP-012-1', actionTitle: 'Implementasi Digital Shift Report', description: 'Migrasi laporan shift dari manual ke sistem digital terintegrasi POS.', picName: 'IT & Operations', dueDate: '2026-09-01', completionDate: '2026-06-18', status: 'Closed', recovery: 20000000, picDepartment: 'Operations', createdAt: '2026-06-01T00:00:00Z' },
    // act_023: Store Manager → Operations
    { id: 'act_023', resultId: 'res_013', planningId: 'pln_011', actionNo: 'AAP-013-1', actionTitle: 'Penggantian Stock Hilang oleh Team Outlet', description: 'Pembayaran ganti rugi Rp 8.5jt.', picName: 'Store Manager', dueDate: '2026-06-15', completionDate: '2026-06-12', status: 'Closed', recovery: 8500000, picDepartment: 'Operations', createdAt: '2026-06-05T00:00:00Z' },
    // act_025: Operations Head → Operations
    { id: 'act_025', resultId: 'res_015', planningId: 'pln_007', actionNo: 'AAP-015-2', actionTitle: 'Sosialisasi & Memo Penegasan Prosedur Diskon', description: 'Mengeluarkan memo penegasan kepatuhan SOP diskon kepada seluruh kepala outlet.', picName: 'Operations Head', dueDate: '2026-05-01', completionDate: null, status: 'Open', amount: 0, picDepartment: 'Operations', createdAt: '2026-03-28T00:00:00Z' },
    // act_028: GA & Security Manager → Operations
    { id: 'act_028', resultId: 'res_018', planningId: 'pln_014', actionNo: 'AAP-018-1', actionTitle: 'Penarikan Kunci Ruang Server & Update Akses Log Kartu', description: 'Melakukan penarikan kunci fisik dari personel tidak berwenang dan mengaktifkan log tap kartu RFID.', picName: 'GA & Security Manager', dueDate: '2026-06-25', completionDate: null, status: 'Open', amount: 0, picDepartment: 'Operations', createdAt: '2026-06-15T00:00:00Z' },

    // ── Finance (4 AAP) ─────────────────────────────────
    // act_003: Finance Manager → Finance
    { id: 'act_003', resultId: 'res_001', planningId: 'pln_001', actionNo: 'AAP-001-3', actionTitle: 'Recovery dari Karyawan', description: 'Proses pemotongan gaji dan cicilan untuk recovery kerugian Rp 20jt.', picName: 'Finance Manager', dueDate: '2026-03-01', completionDate: null, status: 'Open', recovery: 0, picDepartment: 'Finance', createdAt: '2025-09-15T00:00:00Z' },
    // act_009: Finance Controller → Finance
    { id: 'act_009', resultId: 'res_005', planningId: 'pln_004', actionNo: 'AAP-005-1', actionTitle: 'Rekonsiliasi Harian Wajib', description: 'Implementasi rekonsiliasi kas harian yang dilaporkan ke Area Manager setiap hari.', picName: 'Finance Controller', dueDate: '2026-02-01', completionDate: '2026-01-25', status: 'Closed', recovery: 280000000, picDepartment: 'Finance', createdAt: '2026-01-15T00:00:00Z' },
    // act_014: Finance & HR → Finance
    { id: 'act_014', resultId: 'res_007', planningId: 'pln_006', actionNo: 'AAP-007-2', actionTitle: 'Recovery Sisa Outstanding', description: 'Recovery Rp 15jt dari karyawan yang terlibat.', picName: 'Finance & HR', dueDate: '2026-09-15', completionDate: null, status: 'Open', recovery: 0, picDepartment: 'Finance', createdAt: '2026-03-15T00:00:00Z' },
    // act_017: Finance & Legal → Finance
    { id: 'act_017', resultId: 'res_010', planningId: 'pln_009', actionNo: 'AAP-010-2', actionTitle: 'Recovery Sisa Kerugian', description: 'Recovery Rp 20jt dari karyawan yang terlibat melalui mekanisme perdata.', picName: 'Finance & Legal', dueDate: '2026-12-31', completionDate: '2026-06-10', status: 'Closed', recovery: 20000000, picDepartment: 'Finance', createdAt: '2026-05-20T00:00:00Z' },

    // ── Marketing (1 AAP) ───────────────────────────────
    // act_022: Loyalty & Fraud Team → Marketing
    { id: 'act_022', resultId: 'res_014', planningId: 'pln_013', actionNo: 'AAP-014-2', actionTitle: 'Audit Bulanan Transaksi Poin', description: 'Implementasi laporan audit otomatis untuk transaksi poin mencurigakan setiap bulan.', picName: 'Loyalty & Fraud Team', dueDate: '2026-05-15', completionDate: '2026-05-12', status: 'Closed', recovery: 3600000, amount: 7200000, picDepartment: 'Marketing', createdAt: '2026-03-25T00:00:00Z' },

    // ── Supply Chain (1 AAP) ────────────────────────────
    // act_026: Logistics Project Team → Supply Chain
    { id: 'act_026', resultId: 'res_016', planningId: 'pln_007', actionNo: 'AAP-016-1', actionTitle: 'Penyediaan Arsip Digital Tanda Terima Delivery', description: 'Implementasi e-signature / foto tanda terima di aplikasi rider delivery.', picName: 'Logistics Project Team', dueDate: '2026-05-15', completionDate: null, status: 'Open', amount: 0, picDepartment: 'Supply Chain', createdAt: '2026-03-28T00:00:00Z' },

    // ── Legal & Compliance (1 AAP) ──────────────────────
    // act_012: Legal & HR → Legal & Compliance
    { id: 'act_012', resultId: 'res_006', planningId: 'pln_005', actionNo: 'AAP-006-2', actionTitle: 'Recovery dari Pelaku', description: 'Penagihan recovery Rp 40jt dari karyawan terkait.', picName: 'Legal & HR', dueDate: '2026-08-01', completionDate: null, status: 'Open', recovery: 0, picDepartment: 'Legal & Compliance', createdAt: '2026-02-28T00:00:00Z' },

    // act_019: Operations & IT → Operations (review sistem adalah ranah operasional)
    { id: 'act_019', resultId: 'res_011', planningId: 'pln_010', actionNo: 'AAP-011-2', actionTitle: 'Review Sistem Otorisasi Void', description: 'Evaluasi menyeluruh sistem otorisasi void di semua outlet dan update kebijakan.', picName: 'Operations & IT', dueDate: '2026-08-01', completionDate: '2026-06-15', status: 'Closed', recovery: 160000000, picDepartment: 'Operations', createdAt: '2026-06-01T00:00:00Z' },
  ];
  DB.set('audit_actions', auditActions);

  Perms.save();
  DB.markInitialized();
  console.log('[Seed v10] Database initialized: departments + division users + AAP picDepartment mapped.');
}

window.seedDatabase = seedDatabase;
