/* ============================================================
   DATA LAYER — localStorage abstraction + schema validation
   ============================================================ */

const DB_PREFIX = 'ia_audit_';

const TABLES = {
  USERS: 'users',
  AUDITORS: 'auditors',
  WBS_CASES: 'wbs_cases',
  FDS_CASES: 'fds_cases',
  AUDIT_PLANNINGS: 'audit_plannings',
  AUDIT_RESULTS: 'audit_results',
  AUDIT_ACTIONS: 'audit_actions',
  OUTLETS: 'outlets',
  BRANDS: 'brands',
  FRAUD_CATEGORIES: 'fraud_categories',
  PROVINCES: 'provinces',
  DEPARTMENTS: 'departments',
};

const SCHEMAS = {
  users: {
    required: ['username', 'password', 'name', 'role'],
    types: { username: 'string', password: 'string', name: 'string', role: 'string' },
  },
  auditors: {
    required: ['name'],
    types: { name: 'string' },
  },
  wbs_cases: {
    required: ['caseNo', 'category', 'brand', 'status'],
    types: { caseNo: 'string', category: 'string', brand: 'string', status: 'string' },
  },
  fds_cases: {
    required: ['caseNo', 'category', 'brand', 'status'],
    types: { caseNo: 'string', category: 'string', brand: 'string', status: 'string' },
  },
  audit_plannings: {
    required: ['reportNo', 'brand', 'outletCode', 'planningDate'],
    types: { reportNo: 'string', brand: 'string', outletCode: 'string', planningDate: 'string' },
  },
  audit_results: {
    required: ['planningId', 'findingNo', 'findingTitle', 'category'],
    types: { planningId: 'string', findingNo: 'string', findingTitle: 'string', category: 'string' },
  },
  audit_actions: {
    required: ['resultId', 'actionNo', 'actionTitle', 'picName', 'dueDate'],
    types: { resultId: 'string', actionNo: 'string', actionTitle: 'string', picName: 'string', dueDate: 'string' },
  },
  outlets: {
    required: ['code', 'name', 'brand'],
    types: { code: 'string', name: 'string', brand: 'string' },
  },
  brands: {
    required: ['id', 'name'],
    types: { id: 'string', name: 'string' },
  },
  fraud_categories: {
    required: ['id', 'name'],
    types: { id: 'string', name: 'string' },
  },
  provinces: {
    required: ['name'],
    types: { name: 'string' },
  },
  departments: {
    required: ['id', 'name'],
    types: { id: 'string', name: 'string' },
  },
};

const DB = {
  TABLES,

  _cache: {},
  _indexes: {},

  clearCache() {
    DB._cache = {};
    DB._indexes = {};
  },

  validate(table, record) {
    const schema = SCHEMAS[table];
    if (!schema) return; // no schema = no validation
    const errors = [];
    for (const field of schema.required) {
      if (record[field] === undefined || record[field] === null || record[field] === '') {
        errors.push(`'${field}' is required`);
      }
    }
    for (const [field, expectedType] of Object.entries(schema.types)) {
      if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
        const actualType = typeof record[field];
        if (actualType !== expectedType) {
          errors.push(`'${field}' must be ${expectedType}, got ${actualType}`);
        }
      }
    }
    if (errors.length) {
      throw new Error(`Validation failed for table '${table}': ${errors.join('; ')}`);
    }
  },

  get(table) {
    if (DB._cache[table]) return DB._cache[table];
    try {
      const raw = localStorage.getItem(DB_PREFIX + table);
      const data = raw ? JSON.parse(raw) : [];
      DB._cache[table] = data;
      return data;
    } catch {
      DB._cache[table] = [];
      return DB._cache[table];
    }
  },

  set(table, data) {
    localStorage.setItem(DB_PREFIX + table, JSON.stringify(data));
    DB._cache[table] = data;
    delete DB._indexes[table];
  },

  find(table, id) {
    if (!DB._indexes[table]) {
      const data = DB.get(table);
      DB._indexes[table] = new Map(data.map(item => [item.id, item]));
    }
    return DB._indexes[table].get(id) || null;
  },

  insert(table, record) {
    if (!record.id) record.id = DB.genId();
    DB.validate(table, record);
    delete DB._indexes[table];
    const data = DB.get(table);
    const id = record.id;
    const now = new Date().toISOString();
    const newRecord = { ...record, id, createdAt: record.createdAt || now, updatedAt: now };
    data.push(newRecord);
    DB.set(table, data);
    return newRecord;
  },

  update(table, id, changes) {
    const existing = DB.find(table, id);
    if (!existing) return null;
    DB.validate(table, { ...existing, ...changes });
    delete DB._indexes[table];
    const data = DB.get(table);
    const idx = data.findIndex(item => item.id === id);
    if (idx === -1) return null;
    data[idx] = { ...data[idx], ...changes, updatedAt: new Date().toISOString() };
    DB.set(table, data);
    return data[idx];
  },

  delete(table, id) {
    delete DB._indexes[table];
    const data = DB.get(table).filter(item => item.id !== id);
    DB.set(table, data);
  },

  genId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  },

  isInitialized() {
    return localStorage.getItem(DB_PREFIX + 'initialized_v7') === 'true';
  },

  markInitialized() {
    localStorage.setItem(DB_PREFIX + 'initialized_v7', 'true');
  },

  reset() {
    DB.clearCache();
    Object.keys(localStorage)
      .filter(k => k.startsWith(DB_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  },
};

window.DB = DB;
window.TABLES = TABLES;
