-- ============================================================
-- Seed Data -- Audit Assignment App
-- ============================================================

-- -- Brands ---------------------------------------------------------------
INSERT INTO brands (code, name, color, description) VALUES
  ('PHD', 'PHD', '#3b82f6', 'Pizza Hut Delivery'),
  ('PHR', 'PHR', '#f59e0b', 'Pizza Hut Restaurant'),
  ('Hayo', 'Hayo', '#10b981', 'Hayo Brand');

-- -- Provinces -------------------------------------------------------------
INSERT INTO provinces (id, name) VALUES
  ('prov_0', 'DKI Jakarta'),
  ('prov_1', 'Jawa Barat'),
  ('prov_2', 'Jawa Tengah'),
  ('prov_3', 'Jawa Timur'),
  ('prov_4', 'Banten'),
  ('prov_5', 'Sumatera Utara'),
  ('prov_6', 'Sumatera Selatan'),
  ('prov_7', 'Sumatera Barat'),
  ('prov_8', 'Riau'),
  ('prov_9', 'Kepulauan Riau'),
  ('prov_10', 'Kalimantan Selatan'),
  ('prov_11', 'Kalimantan Timur'),
  ('prov_12', 'Kalimantan Barat'),
  ('prov_13', 'Kalimantan Tengah'),
  ('prov_14', 'Sulawesi Selatan'),
  ('prov_15', 'Sulawesi Utara'),
  ('prov_16', 'Bali'),
  ('prov_17', 'Nusa Tenggara Barat'),
  ('prov_18', 'DIY Yogyakarta'),
  ('prov_19', 'Aceh'),
  ('prov_20', 'Lampung'),
  ('prov_21', 'Maluku'),
  ('prov_22', 'Papua');

-- -- Departments -----------------------------------------------------------
INSERT INTO departments (id, name, code) VALUES
  ('dept_1', 'Store Audit', 'SA'),
  ('dept_2', 'Corporate Audit', 'CA'),
  ('dept_3', 'Business Process Improvement', 'BPI'),
  ('dept_4', 'Operations', 'OPS'),
  ('dept_5', 'Marketing', 'MKT'),
  ('dept_6', 'Finance', 'FIN'),
  ('dept_7', 'Human Resources', 'HR'),
  ('dept_8', 'Information Technology', 'IT'),
  ('dept_9', 'Supply Chain', 'SC'),
  ('dept_10', 'Legal & Compliance', 'LGL');

-- -- Fraud Categories ------------------------------------------------------
INSERT INTO fraud_categories (id, name, color, description, nature) VALUES
  ('cat_lp', 'Loyalty Point', '#3b82f6', 'Fraud related to customer loyalty points', 'Fraud'),
  ('cat_sales', 'Sales', '#10b981', 'Sales manipulation or misreporting', 'Fraud'),
  ('cat_cash', 'Cash', '#f59e0b', 'Cash misappropriation or theft', 'Fraud'),
  ('cat_inv', 'Inventory', '#a855f7', 'Inventory theft or manipulation', 'Fraud'),
  ('cat_exp', 'Expenses', '#ef4444', 'Expense fraud or manipulation', 'Fraud'),
  ('cat_cust', 'Customer Point', '#06b6d4', 'Customer point manipulation', 'Fraud'),
  ('cat_sales_payment', 'Sales Payment Manipulation', '#0891b2', 'Sales payment manipulation in cashier terminal', 'Fraud'),
  ('cat_paid_out', 'Paid Out Manipulation', '#7c3aed', 'Paid-out / petty cash manipulation', 'Fraud'),
  ('cat_adm_sop', 'SOP', '#64748b', 'Ketidakpatuhan terhadap SOP yang berlaku', 'Administrative'),
  ('cat_adm_doc', 'Dokumentasi', '#94a3b8', 'Dokumen tidak lengkap atau tidak valid', 'Administrative'),
  ('cat_adm_ctrl', 'Kontrol Internal', '#7c3aed', 'Kelemahan pada kontrol internal operasional', 'Administrative'),
  ('cat_adm_rec', 'Rekonsiliasi Minor', '#0ea5e9', 'Selisih rekonsiliasi kecil yang bukan indikasi fraud', 'Administrative'),
  ('cat_adm_train', 'Training Gap', '#f97316', 'Karyawan belum mengikuti pelatihan wajib', 'Administrative'),
  ('cat_adm_rep', 'Keterlambatan Pelaporan', '#84cc16', 'Laporan tidak dikirim tepat waktu sesuai SOP', 'Administrative');

-- -- Outlets ---------------------------------------------------------------
INSERT INTO outlets (code, name, brand, province, outlet_manager, multi_unit_manager, area_manager, distrik_manager) VALUES
  ('R241', 'Depok Dua Tengah', 'PHR', 'prov_1', 'Ahmad Fauzi', 'Rina Fitriani', 'Hendra Gunawan', 'Bambang Suprapto'),
  ('C057', 'Kenjeran Surabaya', 'PHD', 'prov_3', 'Dwi Cahyono', 'Rina Fitriani', 'Hendra Gunawan', 'Bambang Suprapto'),
  ('S025', 'Citra Indah Jonggol', 'PHR', 'prov_1', 'Siti Nurhaliza', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('R316', 'Mataram Sriwijaya', 'PHR', 'prov_6', 'M. Ilham', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('R201', 'Modernland', 'PHR', 'prov_4', 'Teguh Prasetyo', 'Rina Fitriani', 'Hendra Gunawan', 'Bambang Suprapto'),
  ('C073', 'Sangatta Kalimantan Timur', 'PHD', 'prov_11', 'Joko Susilo', 'Bayu Anggara', 'Slamet Riyadi', 'Martha Tilaar'),
  ('R105', 'Cibubur Junction', 'PHR', 'prov_0', 'Dian Permata', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('C089', 'Bekasi Timur', 'PHD', 'prov_1', 'Rudi Hermawan', 'Bayu Anggara', 'Slamet Riyadi', 'Martha Tilaar'),
  ('R322', 'Bandung Supermall', 'PHR', 'prov_1', 'Yuni Astuti', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('C012', 'Kelapa Gading', 'PHD', 'prov_0', 'Fajar Hidayat', 'Bayu Anggara', 'Slamet Riyadi', 'Martha Tilaar'),
  ('H001', 'Hayo Pantai Indah Kapuk', 'Hayo', 'prov_0', 'Wawan Setiawan', 'Dedi Kurniawan', 'Rudi Hartono', 'Agus Wijaya'),
  ('H022', 'Hayo Sunter', 'Hayo', 'prov_0', 'Ratna Dewi', 'Dedi Kurniawan', 'Rudi Hartono', 'Agus Wijaya');

-- -- Auditors --------------------------------------------------------------
INSERT INTO auditors (id, user_id, name, nik, title, department, status, join_date, phone, email) VALUES
  ('aud_1', NULL, 'Budi Santoso', '1001', 'Head of Store Audit', 'dept_1', 'active', '2020-03-15', '0812-1111-0001', 'budi.santoso@internalaudit.com'),
  ('aud_2', NULL, 'Andi Wijaya', '1002', 'Senior Auditor', 'dept_1', 'active', '2021-06-01', '0812-1111-0002', 'andi.wijaya@internalaudit.com'),
  ('aud_3', NULL, 'Dewi Lestari', '1003', 'Auditor', 'dept_1', 'active', '2022-01-10', '0812-1111-0003', 'dewi.lestari@internalaudit.com'),
  ('aud_4', NULL, 'Hendra Kusuma', '1004', 'Auditor', 'dept_1', 'active', '2022-08-20', '0812-1111-0004', 'hendra.kusuma@internalaudit.com'),
  ('aud_5', NULL, 'Sari Dewi', '2001', 'Head of Corporate Audit', 'dept_2', 'active', '2019-11-01', '0812-2222-0001', 'sari.dewi@internalaudit.com'),
  ('aud_6', NULL, 'Fajar Nugroho', '2002', 'Senior Auditor', 'dept_2', 'active', '2020-09-15', '0812-2222-0002', 'fajar.nugroho@internalaudit.com'),
  ('aud_7', NULL, 'Rina Puspita', '2003', 'Auditor', 'dept_2', 'active', '2021-04-01', '0812-2222-0003', 'rina.puspita@internalaudit.com'),
  ('aud_8', NULL, 'Rudi Hermawan', '3001', 'Head of BPI', 'dept_3', 'active', '2018-07-01', '0812-3333-0001', 'rudi.hermawan@internalaudit.com'),
  ('aud_9', NULL, 'Novita Sari', '3002', 'BPI Analyst', 'dept_3', 'active', '2021-03-01', '0812-3333-0002', 'novita.sari@internalaudit.com'),
  ('aud_10', NULL, 'Agus Priyanto', '3003', 'BPI Analyst', 'dept_3', 'inactive', '2020-01-15', '0812-3333-0003', 'agus.priyanto@internalaudit.com');

-- -- Audit Plannings -------------------------------------------------------
INSERT INTO audit_plannings (id, report_no, planning_date, audit_date_from, audit_date_to, trigger, trigger_ref, outlet_code, brand, province, department, audit_type, lead_auditor, auditor_team, scope, status, report_sent_date, pic_department, outlet_manager, multi_unit_manager, area_manager, distrik_manager) VALUES
  ('pln_001', 'LAP-08-2025-001', '2025-08-10', '2025-08-20', '2025-09-10', 'WBS', 'wbs_001', 'R241', 'PHR', 'prov_1', 'dept_1', 'Fieldwork', 'aud_2', '["aud_3"]', 'Pemeriksaan menyeluruh transaksi void, cash count, dan rekonsiliasi POS selama Q3 2025', 'Completed', '2025-09-20', '', 'Ahmad Fauzi', 'Rina Fitriani', 'Hendra Gunawan', 'Bambang Suprapto'),
  ('pln_002', 'LAP-08-2025-002', '2025-08-18', '2025-08-25', '2025-09-28', 'WBS', 'wbs_002', 'C057', 'PHD', 'prov_3', 'dept_1', 'Fieldwork', 'aud_3', '["aud_4"]', 'Audit transaksi pembayaran dan override cashier terminal periode Agustus 2025', 'Completed', '2025-10-05', '', 'Dwi Cahyono', 'Rina Fitriani', 'Hendra Gunawan', 'Bambang Suprapto'),
  ('pln_003', 'LAP-11-2025-003', '2025-11-10', '2025-11-15', '2025-11-30', 'WBS', 'wbs_003', 'R105', 'PHR', 'prov_0', 'dept_1', 'Monitoring', 'aud_2', '[]', 'Stock opname dan verifikasi fisik seluruh item inventori', 'Completed', '2025-12-05', '', 'Dian Permata', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('pln_004', 'LAP-12-2025-004', '2025-12-08', '2025-12-15', '2026-01-10', 'WBS', 'wbs_004', 'C089', 'PHD', 'prov_1', 'dept_1', 'Fieldwork', 'aud_3', '["aud_2"]', 'Audit cash deposit, rekonsiliasi bank, dan prosedur setor harian', 'Completed', '2026-01-20', '', 'Rudi Hermawan', 'Bayu Anggara', 'Slamet Riyadi', 'Martha Tilaar'),
  ('pln_005', 'LAP-01-2026-001', '2026-01-15', '2026-01-20', '2026-02-20', 'WBS', 'wbs_005', 'R322', 'PHR', 'prov_1', 'dept_1', 'Fieldwork', 'aud_2', '["aud_4"]', 'Verifikasi transaksi promo, diskon, dan laporan penjualan harian', 'Completed', '2026-03-01', '', 'Yuni Astuti', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('pln_006', 'LAP-02-2026-002', '2026-02-12', '2026-02-18', '2026-03-10', 'WBS', 'wbs_006', 'C012', 'PHD', 'prov_0', 'dept_2', 'Fieldwork', 'aud_6', '["aud_7"]', 'Audit transaksi paid-out dan petty cash management', 'Completed', '2026-03-18', '', 'Fajar Hidayat', 'Bayu Anggara', 'Slamet Riyadi', 'Martha Tilaar'),
  ('pln_007', 'LAP-03-2026-003', '2026-03-10', '2026-03-17', '2026-04-15', 'WBS', 'wbs_008', 'S025', 'PHR', 'prov_1', 'dept_1', 'Monitoring', 'aud_3', '[]', 'Monitoring transaksi delivery order dan program diskon', 'Completed', '2026-05-01', '', 'Siti Nurhaliza', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('pln_008', 'LAP-04-2026-004', '2026-04-05', '2026-04-10', '2026-04-25', 'WBS', 'wbs_009', 'C073', 'PHD', 'prov_11', 'dept_1', 'Monitoring', 'aud_2', '[]', 'Cash count dan verifikasi prosedur setoran kas harian', 'Completed', '2026-05-05', '', 'Joko Susilo', 'Bayu Anggara', 'Slamet Riyadi', 'Martha Tilaar'),
  ('pln_009', 'LAP-04-2026-005', '2026-04-20', '2026-04-25', '2026-05-15', 'WBS', 'wbs_010', 'R316', 'PHR', 'prov_6', 'dept_1', 'Fieldwork', 'aud_3', '["aud_4"]', 'Audit petty cash, paid-out, dan pengeluaran operasional', 'Completed', '2026-05-25', '', 'M. Ilham', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('pln_010', 'LAP-05-2026-006', '2026-05-05', '2026-05-10', '2026-05-28', 'WBS', 'wbs_011', 'R201', 'PHR', 'prov_4', 'dept_1', 'Fieldwork', 'aud_2', '["aud_3"]', 'Audit void transaction, otorisasi manajemen, dan laporan POS', 'Completed', '2026-06-10', '', 'Teguh Prasetyo', 'Rina Fitriani', 'Hendra Gunawan', 'Bambang Suprapto'),
  ('pln_011', 'LAP-05-2026-007', '2026-05-22', '2026-05-28', '2026-06-10', 'WBS', 'wbs_012', 'C057', 'PHD', 'prov_3', 'dept_1', 'Monitoring', 'aud_4', '[]', 'Stock opname bahan premium dan pemeriksaan alur supply chain', 'Completed', '2026-06-18', '', 'Dwi Cahyono', 'Rina Fitriani', 'Hendra Gunawan', 'Bambang Suprapto'),
  ('pln_012', 'LAP-04-2026-008', '2026-04-08', '2026-04-15', '2026-05-05', 'FDS', 'fds_001', 'R316', 'PHR', 'prov_6', 'dept_1', 'Monitoring', 'aud_2', '[]', 'Verifikasi pola akumulasi poin pelanggan dan transaksi loyalty yang anomali', 'Completed', '2026-05-20', '', 'M. Ilham', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('pln_013', 'LAP-03-2026-009', '2026-03-05', '2026-03-10', '2026-03-25', 'FDS', 'fds_005', 'C089', 'PHD', 'prov_1', 'dept_1', 'Monitoring', 'aud_4', '[]', 'Investigasi penyalahgunaan poin loyalty oleh karyawan', 'Completed', '2026-04-05', '', 'Rudi Hermawan', 'Bayu Anggara', 'Slamet Riyadi', 'Martha Tilaar'),
  ('pln_014', 'LAP-06-2026-010', '2026-06-01', '2026-06-10', '2026-06-30', 'Direct', NULL, 'H001', 'Hayo', 'prov_0', 'dept_2', 'Fieldwork', 'aud_6', '["aud_7"]', 'Audit rutin tahunan keuangan, operasional, dan kepatuhan SOP', 'Completed', '2026-07-10', '', 'Wawan Setiawan', 'Dedi Kurniawan', 'Rudi Hartono', 'Agus Wijaya');

-- -- WBS Cases -------------------------------------------------------------
INSERT INTO wbs_cases (id, case_no, report_date, category, brand, outlet_code, province, status, severity, estimated_fraud, description, initial_indication, assigned_to, resolved_date, linked_planning_id, notes, pic_department, outlet_manager, multi_unit_manager, area_manager, distrik_manager) VALUES
  ('wbs_001', 'WBS-08-2025-001', '2025-08-05', 'cat_sales', 'PHR', 'R241', 'prov_1', 'Closed', 'High', '250000000', 'Sales manipulation through void transactions -- dilaporkan oleh karyawan anonim', 'Void transaksi melebihi threshold normal selama 3 bulan', 'aud_2', '2025-09-15', 'pln_001', 'Case resolved with recovery', '', 'Ahmad Fauzi', 'Rina Fitriani', 'Hendra Gunawan', 'Bambang Suprapto'),
  ('wbs_002', 'WBS-08-2025-002', '2025-08-12', 'cat_sales_payment', 'PHD', 'C057', 'prov_3', 'Closed', 'High', '180000000', 'Payment manipulation via cashier terminal', 'Cashier terminal override tanpa otorisasi supervisor', 'aud_3', '2025-10-01', 'pln_002', '', '', 'Dwi Cahyono', 'Rina Fitriani', 'Hendra Gunawan', 'Bambang Suprapto'),
  ('wbs_003', 'WBS-11-2025-003', '2025-11-03', 'cat_inv', 'PHR', 'R105', 'prov_0', 'Closed', 'Medium', '15000000', 'Missing inventory items', 'Selisih stok opname bulanan dengan catatan sistem', 'aud_2', '2025-12-01', 'pln_003', '', '', 'Dian Permata', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('wbs_004', 'WBS-12-2025-004', '2025-12-01', 'cat_cash', 'PHD', 'C089', 'prov_1', 'Closed', 'High', '320000000', 'Cash deposit not recorded', 'Rekonsiliasi harian menunjukkan selisih kas berturut-turut', 'aud_3', '2026-01-20', 'pln_004', '', '', 'Rudi Hermawan', 'Bayu Anggara', 'Slamet Riyadi', 'Martha Tilaar'),
  ('wbs_005', 'WBS-01-2026-001', '2026-01-10', 'cat_sales', 'PHR', 'R322', 'prov_1', 'Closed', 'High', '190000000', 'Fake promotional discounts', 'Diskon promo diberikan di luar periode promosi yang disetujui', 'aud_2', '2026-02-28', 'pln_005', '', '', 'Yuni Astuti', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('wbs_006', 'WBS-02-2026-002', '2026-02-08', 'cat_paid_out', 'PHD', 'C012', 'prov_0', 'Closed', 'Medium', '45000000', 'Unauthorized paid-out transactions', 'Paid-out tidak didukung bukti fisik yang valid', 'aud_3', '2026-03-15', 'pln_006', '', '', 'Fajar Hidayat', 'Bayu Anggara', 'Slamet Riyadi', 'Martha Tilaar'),
  ('wbs_007', 'WBS-02-2026-003', '2026-02-20', 'cat_sales', 'PHR', 'R241', 'prov_1', 'Investigation', 'High', '380000000', 'Suspected repeat fraud -- investigation ongoing', 'Pola void transaksi mirip dengan kasus WBS-2025-001', 'aud_2', NULL, NULL, 'HR approval obtained, investigation in progress', '', 'Ahmad Fauzi', 'Rina Fitriani', 'Hendra Gunawan', 'Bambang Suprapto'),
  ('wbs_008', 'WBS-03-2026-004', '2026-03-05', 'cat_sales_payment', 'PHR', 'S025', 'prov_1', 'Closed', 'Medium', '90000000', 'Discount manipulation on delivery orders', 'Diskon delivery di atas 30% tanpa approval manajemen', 'aud_3', '2026-05-15', 'pln_007', 'Case resolved with partial recovery', '', 'Siti Nurhaliza', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('wbs_009', 'WBS-04-2026-005', '2026-04-01', 'cat_cash', 'PHD', 'C073', 'prov_11', 'Closed', 'Low', '12000000', 'Minor cash shortage', 'Laporan kasir harian tidak sesuai dengan setoran bank', 'aud_2', '2026-04-30', 'pln_008', '', '', 'Joko Susilo', 'Bayu Anggara', 'Slamet Riyadi', 'Martha Tilaar'),
  ('wbs_010', 'WBS-04-2026-006', '2026-04-15', 'cat_paid_out', 'PHR', 'R316', 'prov_6', 'Closed', 'Medium', '35000000', 'Fictitious paid-out claims', 'Klaim operasional fiktif untuk utilitas dan kebersihan', 'aud_3', '2026-05-20', 'pln_009', '', '', 'M. Ilham', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('wbs_011', 'WBS-05-2026-007', '2026-05-02', 'cat_sales', 'PHR', 'R201', 'prov_4', 'Closed', 'High', '210000000', 'Unauthorized void of sales transactions', 'Void oleh karyawan yang sama melebihi Rp 5jt/hari', 'aud_2', '2026-06-01', 'pln_010', '', '', 'Teguh Prasetyo', 'Rina Fitriani', 'Hendra Gunawan', 'Bambang Suprapto'),
  ('wbs_012', 'WBS-05-2026-008', '2026-05-18', 'cat_inv', 'PHD', 'C057', 'prov_3', 'Closed', 'Low', '8500000', 'Missing high-value ingredients', 'Selisih stock opname untuk bahan premium > 5%', 'aud_4', '2026-06-10', 'pln_011', '', '', 'Dwi Cahyono', 'Rina Fitriani', 'Hendra Gunawan', 'Bambang Suprapto');

-- -- FDS Cases -------------------------------------------------------------
INSERT INTO fds_cases (id, case_no, detection_date, category, brand, outlet_code, province, status, estimated_fraud, description, assigned_to, linked_planning_id, notes, pic_department, outlet_manager, multi_unit_manager, area_manager, distrik_manager) VALUES
  ('fds_001', 'FDS-03-2026-001', '2026-03-15', 'cat_cust', 'PHR', 'R316', 'prov_6', 'Closed', '5500000', 'Anomalous point accumulation pattern detected', 'aud_2', 'pln_012', 'Audit completed, no fraud confirmed', '', 'M. Ilham', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('fds_002', 'FDS-03-2026-002', '2026-03-20', 'cat_cust', 'PHR', 'R201', 'prov_4', 'Investigation', '4200000', 'High-frequency point redemption flagged', 'aud_3', NULL, '', '', 'Teguh Prasetyo', 'Rina Fitriani', 'Hendra Gunawan', 'Bambang Suprapto'),
  ('fds_003', 'FDS-03-2026-003', '2026-03-25', 'cat_cust', 'PHD', 'C073', 'prov_11', 'Investigation', '3800000', 'Bulk point manipulation detected', 'aud_2', NULL, '', '', 'Joko Susilo', 'Bayu Anggara', 'Slamet Riyadi', 'Martha Tilaar'),
  ('fds_004', 'FDS-04-2026-004', '2026-04-01', 'cat_cust', 'PHR', 'R105', 'prov_0', 'Hold', '2900000', 'Duplicate point entry detected', 'aud_4', NULL, 'On hold pending system verification', '', 'Dian Permata', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('fds_005', 'FDS-04-2026-005', '2026-04-01', 'cat_cust', 'PHD', 'C089', 'prov_1', 'Closed', '7200000', 'Point abuse confirmed', 'aud_3', 'pln_013', 'Case confirmed and closed', '', 'Rudi Hermawan', 'Bayu Anggara', 'Slamet Riyadi', 'Martha Tilaar'),
  ('fds_006', 'FDS-04-2026-006', '2026-04-05', 'cat_cust', 'PHR', 'R322', 'prov_1', 'Closed', '4100000', 'Irregular loyalty transactions', 'aud_2', NULL, '', '', 'Yuni Astuti', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('fds_007', 'FDS-04-2026-007', '2026-04-10', 'cat_cust', 'PHR', 'R241', 'prov_1', 'Investigation', '6300000', 'Massive point issuance without transaction', 'aud_3', NULL, 'Investigating employee involvement', '', 'Ahmad Fauzi', 'Rina Fitriani', 'Hendra Gunawan', 'Bambang Suprapto'),
  ('fds_008', 'FDS-04-2026-008', '2026-04-10', 'cat_cust', 'PHD', 'C012', 'prov_0', 'Investigation', '3400000', 'Suspicious employee-linked point usage', 'aud_4', NULL, '', '', 'Fajar Hidayat', 'Bayu Anggara', 'Slamet Riyadi', 'Martha Tilaar'),
  ('fds_009', 'FDS-04-2026-009', '2026-04-15', 'cat_cust', 'PHR', 'S025', 'prov_1', 'Hold', '2600000', 'Auto-generated point entries flagged', 'aud_2', NULL, '', '', 'Siti Nurhaliza', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('fds_010', 'FDS-04-2026-010', '2026-04-15', 'cat_cust', 'PHD', 'C057', 'prov_3', 'Closed', '5900000', 'Confirmed point fraud at outlet level', 'aud_3', NULL, '', '', 'Dwi Cahyono', 'Rina Fitriani', 'Hendra Gunawan', 'Bambang Suprapto'),
  ('fds_011', 'FDS-04-2026-011', '2026-04-20', 'cat_cust', 'PHR', 'R316', 'prov_6', 'Investigation', '4800000', 'Manager-level point manipulation', 'aud_2', NULL, '', '', 'M. Ilham', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('fds_012', 'FDS-04-2026-012', '2026-04-25', 'cat_cust', 'PHR', 'H001', 'prov_0', 'Planned', '1900000', 'Small-scale point manipulation detected', 'aud_4', NULL, '', '', 'Wawan Setiawan', 'Dedi Kurniawan', 'Rudi Hartono', 'Agus Wijaya'),
  ('fds_013', 'FDS-05-2026-013', '2026-05-01', 'cat_cust', 'PHD', 'C089', 'prov_1', 'Closed', '3300000', 'Cashier-linked point abuse', 'aud_3', NULL, '', '', 'Rudi Hermawan', 'Bayu Anggara', 'Slamet Riyadi', 'Martha Tilaar'),
  ('fds_014', 'FDS-05-2026-014', '2026-05-05', 'cat_cust', 'PHR', 'R105', 'prov_0', 'Planned', '2100000', 'Irregular point entry pattern', 'aud_2', NULL, '', '', 'Dian Permata', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('fds_015', 'FDS-05-2026-015', '2026-05-10', 'cat_cust', 'PHD', 'C073', 'prov_11', 'Planned', '2800000', 'Points added without valid transaction', 'aud_4', NULL, '', '', 'Joko Susilo', 'Bayu Anggara', 'Slamet Riyadi', 'Martha Tilaar'),
  ('fds_016', 'FDS-05-2026-016', '2026-05-15', 'cat_cust', 'PHR', 'R201', 'prov_4', 'Planned', '3600000', 'Loyalty app exploitation detected', 'aud_3', NULL, '', '', 'Teguh Prasetyo', 'Rina Fitriani', 'Hendra Gunawan', 'Bambang Suprapto'),
  ('fds_017', 'FDS-05-2026-017', '2026-05-20', 'cat_cust', 'PHD', 'C012', 'prov_0', 'Closed', '5100000', 'Confirmed customer point abuse', 'aud_2', NULL, '', '', 'Fajar Hidayat', 'Bayu Anggara', 'Slamet Riyadi', 'Martha Tilaar'),
  ('fds_018', 'FDS-05-2026-018', '2026-05-25', 'cat_cust', 'PHR', 'R322', 'prov_1', 'Planned', '2300000', 'Suspicious point redemption cluster', 'aud_4', NULL, '', '', 'Yuni Astuti', 'Mega Sari', 'Agus Salim', 'Dwi Hartono'),
  ('fds_019', 'FDS-06-2026-019', '2026-06-01', 'cat_cust', 'PHR', 'H022', 'prov_0', 'Planned', '1700000', 'Low-value point manipulation detected', 'aud_3', NULL, '', '', 'Ratna Dewi', 'Dedi Kurniawan', 'Rudi Hartono', 'Agus Wijaya'),
  ('fds_020', 'FDS-06-2026-020', '2026-06-05', 'cat_cust', 'PHD', 'C057', 'prov_3', 'Hold', '4400000', 'Cross-outlet point manipulation ring', 'aud_2', NULL, '', '', 'Dwi Cahyono', 'Rina Fitriani', 'Hendra Gunawan', 'Bambang Suprapto');

-- -- Audit Results ---------------------------------------------------------
INSERT INTO audit_results (id, planning_id, finding_no, finding_title, category, finding_date, description, total_loss, severity, status, nature, fraudster_name, fraudster_nik, fraudster_position, pic_department) VALUES
  ('res_001', 'pln_001', 'LAP-08-2025-001/F1', 'Void Transaksi Tidak Sah', 'cat_sales', '2025-08-28', 'Ditemukan 47 transaksi void tanpa otorisasi supervisor senilai Rp 120jt. Seluruh void dilakukan oleh cashier ID A-041 pada shift malam.', '120000000', 'High', 'Closed', 'Fraud', 'Ahmad Rizki', 'NIK-2021-0041', 'Cashier', ''),
  ('res_002', 'pln_001', 'LAP-08-2025-001/F2', 'Manipulasi Diskon Manual', 'cat_sales', '2025-09-02', 'Ditemukan pemberian diskon manual melebihi batas kewenangan (>20%) sebanyak 23 transaksi. Selisih nilai Rp 130jt.', '130000000', 'High', 'Closed', 'Fraud', 'Dian Permata Sari', 'NIK-2022-0088', 'Senior Cashier', ''),
  ('res_003', 'pln_002', 'LAP-08-2025-002/F1', 'Override Cashier Terminal', 'cat_sales', '2025-09-05', 'Cashier terminal di-override sebanyak 38 kali tanpa otorisasi yang sah. Total nilai transaksi yang dimanipulasi Rp 180jt.', '180000000', 'High', 'Closed', 'Fraud', 'Hendra Wijaya', 'NIK-2020-0123', 'Kasir', ''),
  ('res_004', 'pln_003', 'LAP-11-2025-003/F1', 'Selisih Stock Opname Bahan Baku', 'cat_inv', '2025-11-20', 'Selisih fisik vs sistem untuk daging premium sebesar 85kg senilai Rp 15jt.', '15000000', 'Medium', 'Closed', 'Fraud', 'Slamet Riyadi', 'NIK-2019-0056', 'Gudang', ''),
  ('res_005', 'pln_004', 'LAP-12-2025-004/F1', 'Perbedaan Cash Deposit vs Rekening Bank', 'cat_cash', '2025-12-22', 'Selisih antara catatan kasir harian dan rekening koran bank selama Nov--Des 2025 sebesar Rp 320jt.', '320000000', 'High', 'Closed', 'Fraud', 'Rudi Hartono', 'NIK-2018-0099', 'Kasir', ''),
  ('res_006', 'pln_005', 'LAP-01-2026-001/F1', 'Promo Fiktif pada Transaksi Delivery', 'cat_sales', '2026-01-25', 'Promo diskon delivery diberikan di luar periode resmi kepada 156 transaksi senilai Rp 190jt.', '190000000', 'High', 'Closed', 'Fraud', 'Yuni Astuti', 'NIK-2021-0155', 'Staff Marketing', ''),
  ('res_007', 'pln_006', 'LAP-02-2026-002/F1', 'Paid-Out Tanpa Bukti Pendukung', 'cat_cash', '2026-02-22', 'Ditemukan 12 transaksi paid-out senilai total Rp 45jt tidak didukung bukti fisik yang valid (nota, kwitansi resmi).', '45000000', 'Medium', 'Closed', 'Fraud', 'Fajar Hidayat', 'NIK-2022-0211', 'Supervisor Shift', ''),
  ('res_008', 'pln_007', 'LAP-03-2026-003/F1', 'Diskon Delivery Melebihi Batas Kewenangan', 'cat_sales', '2026-03-25', 'Ditemukan 89 transaksi delivery dengan diskon >30% tanpa approval manajemen. Investigasi masih berlangsung.', '90000000', 'Medium', 'Open', 'Fraud', '', '', '', ''),
  ('res_009', 'pln_008', 'LAP-04-2026-004/F1', 'Selisih Kas Harian', 'cat_cash', '2026-04-18', 'Selisih kas harian pada 5 hari kerja berturut-turut total Rp 12jt. Karyawan terkait sudah mengakui.', '12000000', 'Low', 'Closed', 'Fraud', '', '', '', ''),
  ('res_010', 'pln_009', 'LAP-04-2026-005/F1', 'Klaim Paid-Out Fiktif', 'cat_cash', '2026-05-02', 'Ditemukan klaim operasional fiktif (utilitas, kebersihan) senilai Rp 35jt dengan tanda tangan palsu.', '35000000', 'Medium', 'Closed', 'Fraud', '', '', '', ''),
  ('res_011', 'pln_010', 'LAP-05-2026-006/F1', 'Void Tidak Sah oleh Karyawan Sama', 'cat_sales', '2026-05-15', 'Karyawan ID M-019 melakukan void senilai Rp 180jt selama periode Maret-Mei 2026 tanpa otorisasi atasan.', '180000000', 'High', 'Closed', 'Fraud', '', '', '', ''),
  ('res_012', 'pln_010', 'LAP-05-2026-006/F2', 'Manipulasi Laporan Shift Malam', 'cat_sales', '2026-05-18', 'Laporan shift malam menunjukkan perbedaan dengan data POS asli. Selisih Rp 30jt.', '30000000', 'Medium', 'Closed', 'Fraud', '', '', '', ''),
  ('res_013', 'pln_011', 'LAP-05-2026-007/F1', 'Kehilangan Bahan Premium', 'cat_inv', '2026-06-03', 'Selisih stok daging premium (beef dan chicken) antara fisik dan sistem sebesar Rp 8.5jt.', '8500000', 'Low', 'Closed', 'Fraud', '', '', '', ''),
  ('res_014', 'pln_013', 'LAP-03-2026-009/F1', 'Penyalahgunaan Poin Loyalty oleh Karyawan', 'cat_cust', '2026-03-18', 'Karyawan kasir menambahkan poin ke nomor HP pribadi sebanyak 142 kali. Total nilai poin Rp 7.2jt.', '7200000', 'Medium', 'Closed', 'Fraud', '', '', '', ''),
  ('res_015', 'pln_007', 'LAP-03-2026-003/A1', 'SOP Approval Diskon Tidak Dijalankan', 'cat_adm_sop', '2026-03-26', 'Prosedur persetujuan diskon di atas 20% tidak dilaksanakan secara konsisten. Form otorisasi tidak diisi sebelum transaksi diproses.', '0', 'Medium', 'Open', 'Administrative', '', '', '', ''),
  ('res_016', 'pln_007', 'LAP-03-2026-003/A2', 'Dokumentasi Transaksi Delivery Tidak Lengkap', 'cat_adm_doc', '2026-03-27', 'Sebanyak 34 transaksi delivery tidak dilengkapi dengan bukti pengiriman yang ditandatangani pelanggan sesuai SOP.', '0', 'Low', 'Open', 'Administrative', '', '', '', ''),
  ('res_017', 'pln_014', 'LAP-06-2026-010/A1', 'Laporan Harian Tidak Dikirim Tepat Waktu', 'cat_adm_rep', '2026-06-12', 'Laporan operasional harian dikirimkan rata-rata 2 hari terlambat dari SOP (max H+1). Terjadi pada 18 dari 30 hari kerja periode review.', '0', 'Medium', 'Open', 'Administrative', '', '', '', ''),
  ('res_018', 'pln_014', 'LAP-06-2026-010/A2', 'Kontrol Akses CCTV Tidak Memadai', 'cat_adm_ctrl', '2026-06-14', 'Akses ke ruang rekaman CCTV tidak dibatasi hanya untuk pejabat berwenang. Ditemukan 3 karyawan non-manajerial yang memiliki kunci ruang server.', '0', 'High', 'Open', 'Administrative', '', '', '', '');

-- -- Audit Actions (with planning_id) ---------------------------------------
INSERT INTO audit_actions (id, result_id, planning_id, action_no, action_title, pic_name, pic_department, due_date, status, priority, notes, completed_at, completion_date) VALUES
  ('act_001', 'res_001', 'pln_001', 'LAP-08-2025-001/F1/A1', 'Rekrut Kasir Tambahan', 'Siti Rahayu', 'Human Resources', '2026-01-30', 'Closed', 'High', '', '2026-01-20', '2026-01-20'),
  ('act_002', 'res_001', 'pln_001', 'LAP-08-2025-001/F1/A2', 'Rotasi Kasir Shift Malam', 'Manager Outlet R241', 'Store Audit', '2025-10-30', 'Closed', 'Medium', '', '2025-10-15', '2025-10-15'),
  ('act_003', 'res_001', 'pln_001', 'LAP-08-2025-001/F1/A3', 'Audit Pramusim Tahunan', 'Andi Wijaya', 'Store Audit', '2025-12-31', 'Closed', 'Medium', '', '2026-01-05', '2026-01-05'),
  ('act_004', 'res_002', 'pln_001', 'LAP-08-2025-001/F2/A1', 'Batasan Diskon di Sistem POS', 'Tim IT', 'Information Technology', '2025-11-30', 'Closed', 'High', '', '2025-11-20', '2025-11-20'),
  ('act_005', 'res_002', 'pln_001', 'LAP-08-2025-001/F2/A2', 'Refund/Potong Gaji', 'Manager HR', 'Human Resources', '2025-12-15', 'Closed', 'High', '', '2025-12-01', '2025-12-01'),
  ('act_006', 'res_003', 'pln_002', 'LAP-08-2025-002/F1/A1', 'Implementasi Dual Authentication', 'Project Manager IT', 'Information Technology', '2026-03-31', 'Open', 'High', 'Menunggu vendor menyelesaikan integrasi', NULL, NULL),
  ('act_007', 'res_003', 'pln_002', 'LAP-08-2025-002/F1/A2', 'Sosialisasi SOP Terminal', 'Dewi Lestari', 'Store Audit', '2025-11-30', 'Closed', 'Medium', '', '2025-11-25', '2025-11-25'),
  ('act_008', 'res_004', 'pln_003', 'LAP-11-2025-003/F1/A1', 'Stock Opname Digital', 'Kepala Gudang', 'Operations', '2026-06-30', 'Open', 'Medium', '', NULL, NULL),
  ('act_009', 'res_004', 'pln_003', 'LAP-11-2025-003/F1/A2', 'Penambahan CCTV Area Gudang', 'Manager Outlet R105', 'Operations', '2026-02-28', 'Closed', 'Medium', '', '2026-02-20', '2026-02-20'),
  ('act_010', 'res_005', 'pln_004', 'LAP-12-2025-004/F1/A1', 'Cash Opname Harian', 'Kasie Operasional', 'Store Audit', '2026-02-15', 'Closed', 'High', '', '2026-02-10', '2026-02-10'),
  ('act_011', 'res_006', 'pln_005', 'LAP-01-2026-001/F1/A1', 'Kontrol Promo Delivery', 'Marketing Manager', 'Marketing', '2026-04-30', 'Closed', 'High', '', '2026-04-28', '2026-04-28'),
  ('act_012', 'res_006', 'pln_005', 'LAP-01-2026-001/F1/A2', 'Monitoring Real-time Promo', 'Tim IT', 'Information Technology', '2026-03-31', 'Closed', 'Medium', '', '2026-03-28', '2026-03-28'),
  ('act_013', 'res_007', 'pln_006', 'LAP-02-2026-002/F1/A1', 'Prosedur Paid-Out Baru', 'Supervisor Shift', 'Operations', '2026-05-31', 'Closed', 'High', '', '2026-05-25', '2026-05-25'),
  ('act_014', 'res_007', 'pln_006', 'LAP-02-2026-002/F1/A2', 'Verifikasi Acak Kwitansi', 'Tim Audit', 'Store Audit', '2026-06-30', 'Closed', 'Medium', '', '2026-06-25', '2026-06-25'),
  ('act_015', 'res_008', 'pln_007', 'LAP-03-2026-003/F1/A1', 'Audit Diskon Delivery', 'Tim Audit', 'Store Audit', '2026-05-15', 'Open', 'High', 'Menunggu data konfirmasi dari pelanggan', NULL, NULL),
  ('act_016', 'res_008', 'pln_007', 'LAP-03-2026-003/F1/A2', 'Sistem Approval Otomatis', 'Project Manager IT', 'Information Technology', '2026-07-31', 'Open', 'High', 'Dalam tahap analisa kebutuhan sistem', NULL, NULL),
  ('act_017', 'res_009', 'pln_008', 'LAP-04-2026-004/F1/A1', 'Pelatihan Cash Handling', 'Trainer', 'Human Resources', '2026-05-31', 'Closed', 'Low', '', '2026-05-20', '2026-05-20'),
  ('act_018', 'res_010', 'pln_009', 'LAP-04-2026-005/F1/A1', 'Audit Paid-Out Periodik', 'Kasie Audit', 'Store Audit', '2026-11-30', 'Open', 'Medium', '', NULL, NULL),
  ('act_019', 'res_011', 'pln_010', 'LAP-05-2026-006/F1/A1', 'Rekrut Kasir Tambahan', 'Siti Rahayu', 'Human Resources', '2026-07-31', 'Open', 'High', 'Dalam proses rekrutmen', NULL, NULL),
  ('act_020', 'res_011', 'pln_010', 'LAP-05-2026-006/F1/A2', 'Rotasi Kasir Tahunan', 'Manager HR', 'Human Resources', '2026-12-31', 'Open', 'Medium', 'Dalam pembahasan dengan manajemen', NULL, NULL),
  ('act_021', 'res_012', 'pln_010', 'LAP-05-2026-006/F2/A1', 'Verifikasi Laporan Shift', 'Supervisor Shift R201', 'Store Audit', '2026-06-30', 'Open', 'Medium', '', NULL, NULL),
  ('act_022', 'res_013', 'pln_011', 'LAP-05-2026-007/F1/A1', 'Stock Opname Digital', 'Kepala Gudang', 'Operations', '2026-08-31', 'Open', 'Low', 'Menunggu hasil tender vendor', NULL, NULL),
  ('act_023', 'res_014', 'pln_013', 'LAP-03-2026-009/F1/A1', 'Sanksi Disiplin', 'Manager HR', 'Human Resources', '2026-04-15', 'Closed', 'High', '', '2026-04-05', '2026-04-05'),
  ('act_024', 'res_014', 'pln_013', 'LAP-03-2026-009/F1/A2', 'Log Aktivitas Poin', 'Product Manager App', 'Information Technology', '2026-08-31', 'Open', 'Medium', '', NULL, NULL),
  ('act_025', 'res_015', 'pln_007', 'LAP-03-2026-003/A1/A1', 'Sosialisasi SOP Diskon', 'Supervisor Shift', 'Operations', '2026-04-30', 'Closed', 'Medium', '', '2026-04-25', '2026-04-25'),
  ('act_026', 'res_015', 'pln_007', 'LAP-03-2026-003/A1/A2', 'Checklist Approval Harian', 'Area Manager', 'Operations', '2026-05-01', 'Open', 'Low', '', NULL, NULL),
  ('act_027', 'res_017', 'pln_014', 'LAP-06-2026-010/A1/A1', 'Pengaturan Ulang Template Laporan', 'Tim Operasional', 'Operations', '2026-07-15', 'Open', 'Medium', '', NULL, NULL),
  ('act_028', 'res_018', 'pln_014', 'LAP-06-2026-010/A2/A1', 'Pembatasan Akses Ruang CCTV', 'Manager IT', 'Information Technology', '2026-08-01', 'Open', 'High', '', NULL, NULL);

-- ============================================================
-- Bootstrap admin user in auth.users for local development
-- Password: admin123
-- ============================================================
DO $$
DECLARE
  _uid UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@internal-audit.app') THEN
    _uid := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      instance_id, aud, role,
      confirmation_token, email_change, phone_change, phone_change_token,
      email_change_token_current, reauthentication_token, recovery_token,
      email_change_token_new)
    VALUES (_uid, 'admin@internal-audit.app',
      extensions.crypt('admin123', extensions.gen_salt('bf')), now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('username', 'admin', 'email_verified', true, 'role', 'superadmin'),
      now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      '', '', '', '', '', '', '', '');
    INSERT INTO auth.identities (provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at)
    VALUES (_uid, _uid,
      jsonb_build_object('sub', _uid::text, 'email', 'admin@internal-audit.app'),
      'email', now(), now(), now());
    UPDATE public.profiles SET role = 'superadmin' WHERE id = _uid;
  END IF;
END $$;
