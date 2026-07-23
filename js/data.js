/* ============================================================
   DATA LAYER — Supabase adapter with sync cache
   ============================================================ */

const DB_PREFIX = 'ia_audit_';
const PK_MAP = { brands: 'code', outlets: 'code' };
const TABLES = {
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
  PROFILES: 'profiles',
};

const SCHEMAS = {
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
  _pending: {},

  _persist(table) {
    try {
      localStorage.setItem(DB_PREFIX + table, JSON.stringify(DB._cache[table] || []));
    } catch (e) {
      console.warn('[DB] persist error for ' + table + ':', e);
    }
  },

  _loadPersisted(table) {
    try {
      const raw = localStorage.getItem(DB_PREFIX + table);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // ── Retry Queue ──────────────────────────────────────────
  _retryQueue: [],
  _retryTimer: null,

  _loadRetryQueue() {
    try {
      const raw = localStorage.getItem(DB_PREFIX + 'retry_queue');
      DB._retryQueue = raw ? JSON.parse(raw) : [];
    } catch { DB._retryQueue = []; }
  },

  _saveRetryQueue() {
    try {
      localStorage.setItem(DB_PREFIX + 'retry_queue', JSON.stringify(DB._retryQueue));
    } catch {}
  },

  _enqueueRetry(op) {
    DB._loadRetryQueue();
    op.retryCount = op.retryCount || 0;
    op.nextRetry = Date.now() + (op.retryCount < 5 ? Math.pow(2, op.retryCount) * 1000 : 30000);
    DB._retryQueue.push(op);
    DB._saveRetryQueue();
    DB._scheduleRetry();
  },

  _scheduleRetry() {
    if (DB._retryTimer) return;
    const now = Date.now();
    DB._loadRetryQueue();
    const next = DB._retryQueue.reduce((min, op) => op.nextRetry < min ? op.nextRetry : min, Infinity);
    if (!isFinite(next)) return;
    const delay = Math.max(0, next - now);
    DB._retryTimer = setTimeout(() => DB._processRetryQueue(), delay);
  },

  async _processRetryQueue() {
    DB._retryTimer = null;
    DB._loadRetryQueue();
    if (!DB._retryQueue.length) return;
    const pending = [...DB._retryQueue];
    DB._retryQueue = [];
    DB._saveRetryQueue();
    for (const op of pending) {
      try {
        if (op.method === 'insert') {
          await window.Supabase?.insert(op.table, op.data);
        } else if (op.method === 'update') {
          await window.Supabase?.update(op.table, op.id, op.data);
        } else if (op.method === 'delete') {
          await window.Supabase?.delete(op.table, op.id);
        }
      } catch (e) {
        // 409 = duplicate key — drop the retry, record already exists on server
        if (e.message && e.message.includes('23505')) {
          console.warn('[DB] Dropped duplicate retry for', op.table, op.id);
          continue;
        }
        op.retryCount++;
        op.nextRetry = Date.now() + Math.min(Math.pow(2, op.retryCount) * 1000, 30000);
        DB._retryQueue.push(op);
      }
    }
    DB._saveRetryQueue();
    if (DB._retryQueue.length) DB._scheduleRetry();
  },

  clearCache() {
    DB._cache = {};
    DB._indexes = {};
  },

  markInitialized() {
    DB._initialized = true;
  },

  isInitialized() {
    return DB._initialized;
  },

  validate(table, record) {
    const schema = SCHEMAS[table];
    if (!schema) return;
    const errors = [];
    for (const field of schema.required) {
      if (record[field] === undefined || record[field] === null || record[field] === '') {
        errors.push("'" + field + "' is required");
      }
    }
    for (const [field, expectedType] of Object.entries(schema.types)) {
      if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
        const actualType = typeof record[field];
        if (actualType !== expectedType) {
          errors.push("'" + field + "' must be " + expectedType + ", got " + actualType);
        }
      }
    }
    if (errors.length) {
      throw new Error('Validation failed for table \'' + table + '\': ' + errors.join('; '));
    }
  },

  _ensureIndex(table) {
    if (!DB._indexes[table]) {
      const data = DB._cache[table] || [];
      DB._indexes[table] = new Map(data.map(item => [item.id, item]));
    }
  },

  async init() {
    const tables = Object.values(TABLES);
    const results = await Promise.all(tables.map(t =>
      Supabase.getAll(t).catch(() => DB._loadPersisted(t) || [])
    ));
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      let data = results[i];
      if (table === 'brands') {
        data = data.map(r => ({ ...r, id: r.id || r.code }));
      }
      if (table === 'outlets') {
        data = data.map(r => ({ ...r, id: r.id || r.code }));
      }
      // Merge local-only records that failed to sync to server
      const local = DB._loadPersisted(table);
      if (local && local.length > 0) {
        const serverIds = new Set(data.map(r => r.id));
        const unsynced = local.filter(r => !serverIds.has(r.id));
        if (unsynced.length > 0) data = [...data, ...unsynced];
      }
      // Deduplicate audit_results by (planningId, findingNo) — keep first occurrence
      if (table === 'audit_results') {
        const seen = new Set();
        data = data.filter(r => {
          const key = r.planningId + '|' + r.findingNo;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
      DB._cache[table] = data;
      DB._persist(table);
    }
    DB._indexes = {};
    DB._initialized = true;
    // Purge retry entries for audit_results that conflict with existing server records
    DB._loadRetryQueue();
    const resultRecords = DB._cache['audit_results'] || [];
    const seenResult = new Set();
    DB._retryQueue = DB._retryQueue.filter(op => {
      if (op.table === 'audit_results' && op.method === 'insert') {
        const key = op.data.planningId + '|' + op.data.findingNo;
        if (seenResult.has(key)) return false;
        const exists = resultRecords.some(r => r.planningId === op.data.planningId && r.findingNo === op.data.findingNo);
        if (exists) return false;
        seenResult.add(key);
      }
      return true;
    });
    DB._saveRetryQueue();
    await DB._processRetryQueue();
    // Sync any cached records that haven't reached the server yet
    for (const table of tables) {
      try {
        const result = await DB.syncCache(table);
        if (result.failed > 0) {
          console.warn('[DB] syncCache for', table, 'synced:', result.synced, 'failed:', result.failed);
        }
      } catch (e) {
        console.error('[DB] syncCache error for', table, e);
      }
    }
  },

  get(table) {
    if (DB._cache[table]) return DB._cache[table];
    const persisted = DB._loadPersisted(table);
    if (persisted) {
      DB._cache[table] = persisted;
      return persisted;
    }
    return [];
  },

  find(table, id) {
    DB._ensureIndex(table);
    return DB._indexes[table].get(id) || null;
  },

  where(table, field, value) {
    const data = DB.get(table);
    return data.filter(item => item[field] === value);
  },

  genId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  },

  async insert(table, record) {
    if (!record.id) record.id = DB.genId();
    DB.validate(table, record);
    const now = new Date().toISOString();
    const newRecord = { ...record, id: record.id, createdAt: record.createdAt || now, updatedAt: now };
    const { createdAt: _1, updatedAt: _2, ...dbRecord } = newRecord;
    if (PK_MAP[table]) {
      if (dbRecord[PK_MAP[table]] === undefined && dbRecord.id !== undefined) {
        dbRecord[PK_MAP[table]] = dbRecord.id;
      }
      delete dbRecord.id;
    }
    try {
      await window.Supabase.insert(table, dbRecord);
    } catch (e) {
      // Save to cache + retry queue on failure (offline or error)
      DB._addToCache(table, newRecord);
      DB._enqueueRetry({ method: 'insert', table, data: dbRecord, id: newRecord.id });
      throw e;
    }
    DB._addToCache(table, newRecord);
    return newRecord;
  },

  _addToCache(table, record) {
    const data = DB.get(table);
    const idx = data.findIndex(item => item.id === record.id);
    if (idx === -1) {
      data.push(record);
    } else {
      data[idx] = record;
    }
    DB._cache[table] = data;
    delete DB._indexes[table];
    DB._persist(table);
  },

  async update(table, id, changes) {
    const existing = DB.find(table, id);
    if (!existing) return null;
    DB.validate(table, { ...existing, ...changes });
    const { createdAt: _1, updatedAt: _2, ...dbChanges } = changes;
    if (PK_MAP[table]) delete dbChanges.id;
    try {
      await window.Supabase.update(table, id, dbChanges);
    } catch (e) {
      DB._addToCache(table, { ...existing, ...changes, updatedAt: new Date().toISOString() });
      DB._enqueueRetry({ method: 'update', table, id, data: dbChanges });
      throw e;
    }
    const data = DB.get(table);
    const idx = data.findIndex(item => item.id === id);
    if (idx === -1) return null;
    const updated = { ...data[idx], ...changes, updatedAt: new Date().toISOString() };
    data[idx] = updated;
    DB._cache[table] = data;
    delete DB._indexes[table];
    DB._persist(table);
    return updated;
  },

  async delete(table, id) {
    try {
      await window.Supabase.delete(table, id);
    } catch (e) {
      DB._enqueueRetry({ method: 'delete', table, id });
      // Still remove from local cache so UI is responsive
    }
    const data = DB.get(table).filter(item => item.id !== id);
    DB._cache[table] = data;
    delete DB._indexes[table];
    DB._persist(table);
  },

  updateLocal(table, id, changes) {
    const data = DB.get(table);
    const idx = data.findIndex(item => item.id === id);
    if (idx === -1) return null;
    const updated = { ...data[idx], ...changes, updatedAt: new Date().toISOString() };
    data[idx] = updated;
    DB._cache[table] = data;
    delete DB._indexes[table];
    DB._persist(table);
    return updated;
  },

  set(table, data) {
    DB._cache[table] = data;
    delete DB._indexes[table];
    DB._persist(table);
  },

  async syncCache(table) {
    const cached = DB.get(table);
    if (!cached.length) return { synced: 0, failed: 0 };
    let serverIds = [];
    try {
      const serverData = await window.Supabase.getAll(table);
      const pkField = PK_MAP[table] || 'id';
      serverIds = serverData.map(r => r[pkField]).filter(Boolean);
    } catch (e) {
      console.warn('[DB.syncCache] Could not fetch server data for', table, e);
    }
    // Fetch server auditor IDs to validate assignedTo FK before insert
    let serverAuditorIds = [];
    if (table === 'wbs_cases' || table === 'fds_cases') {
      try {
        const auditors = await window.Supabase.getAll('auditors');
        serverAuditorIds = auditors.map(a => a.id).filter(Boolean);
      } catch (e) {
        console.warn('[DB.syncCache] Could not fetch server auditors for FK check', e);
      }
    }
    let synced = 0;
    let failed = 0;
    for (const record of cached) {
      if (serverIds.includes(record.id)) continue;
      const { createdAt: _1, updatedAt: _2, ...dbRecord } = record;
      if (PK_MAP[table]) {
        if (dbRecord[PK_MAP[table]] === undefined && dbRecord.id !== undefined) {
          dbRecord[PK_MAP[table]] = dbRecord.id;
        }
        delete dbRecord.id;
      }
      if (table === 'auditors' && !record.joinDate) {
        dbRecord.joinDate = new Date().toISOString().split('T')[0];
      }
      // Fields per table that have DB-side defaults — safe to remove when empty
      const DEFAULTS = {
        auditors: ['status', 'title', 'nik', 'email', 'phone'],
        wbs_cases: ['status', 'severity', 'description', 'notes', 'picDepartment', 'outletManager', 'multiUnitManager', 'areaManager', 'distrikManager'],
        fds_cases: ['status', 'description', 'notes', 'picDepartment', 'outletManager', 'multiUnitManager', 'areaManager', 'distrikManager'],
        audit_plannings: ['status'],
        audit_results: ['status'],
        audit_actions: ['status', 'notes'],
      };
      const safe = DEFAULTS[table] || [];
      for (const key of Object.keys(dbRecord)) {
        if (dbRecord[key] === '' && safe.includes(key)) {
          delete dbRecord[key];
        }
      }
      // Resolve FK name→ID for known reference fields (old cached records store name instead of ID)
      const REF_TABLES = {
        province: 'provinces',
        department: 'departments',
        picDepartment: 'departments',
        category: 'fraud_categories',
      };
      for (const [field, refTable] of Object.entries(REF_TABLES)) {
        if (dbRecord[field]) {
          const refs = DB.get(refTable);
          const hasId = refs.some(r => r.id === dbRecord[field]);
          if (!hasId) {
            const byName = refs.find(r => r.name === dbRecord[field]);
            if (byName) {
              dbRecord[field] = byName.id;
            } else if (field !== 'category') {
              delete dbRecord[field];
            }
          }
        }
      }
      // Drop assignedTo if the referenced auditor doesn't exist on the server yet
      if (dbRecord.assignedTo && !serverAuditorIds.includes(dbRecord.assignedTo)) {
        delete dbRecord.assignedTo;
      }
      // NOT NULL date fields: fallback to planningDate if empty, then to today
      const today = new Date().toISOString().split('T')[0];
      if (table === 'audit_plannings') {
        if (!dbRecord.planningDate) dbRecord.planningDate = today;
        if (!dbRecord.auditDateFrom) dbRecord.auditDateFrom = dbRecord.planningDate;
        if (!dbRecord.auditDateTo) dbRecord.auditDateTo = dbRecord.planningDate;
      }
      if (table === 'audit_results' && !dbRecord.findingDate) {
        dbRecord.findingDate = today;
      }
      try {
        await window.Supabase.insert(table, dbRecord);
        synced++;
      } catch (e) {
        if (e.message && e.message.includes('23505')) {
          const cached = DB.get(table);
          DB.set(table, cached.filter(r => r.id !== record.id));
          console.warn('[DB.syncCache] Removed duplicate', table, record.id);
        } else {
          failed++;
          console.error('[DB.syncCache] Failed to sync', table, record.id, e.message);
        }
      }
    }
    return { synced, failed };
  },

  getUnsyncedCount() {
    let total = 0;
    const tables = Object.values(TABLES);
    for (const table of tables) {
      const cached = DB.get(table);
      if (!cached.length) continue;
      // We can't easily check server IDs here, so use persisted retry queue as signal
    }
    DB._loadRetryQueue();
    return DB._retryQueue.length;
  },

  async syncNow() {
    DB._loadRetryQueue();
    await DB._processRetryQueue();
    const tables = Object.values(TABLES);
    let totalSynced = 0;
    let totalFailed = 0;
    for (const table of tables) {
      try {
        const result = await DB.syncCache(table);
        totalSynced += result.synced;
        totalFailed += result.failed;
      } catch (e) {
        console.error('[DB.syncNow] error for', table, e);
      }
    }
    return { synced: totalSynced, failed: totalFailed };
  },

  reset() {
    DB.clearCache();
    DB._initialized = false;
    Object.values(TABLES).forEach(t => {
      try { localStorage.removeItem(DB_PREFIX + t); } catch {}
    });
  },
};

window.DB = DB;
window.TABLES = TABLES;
