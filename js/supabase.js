/* ============================================================
   SUPABASE CLIENT — REST API adapter + Auth helpers
   snake_case ↔ camelCase transform
   ============================================================ */

const SUPABASE_URL = 'https://gflxygiakypzdyimytjx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmbHh5Z2lha3lwemR5aW15dGp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NzI4MjcsImV4cCI6MjEwMDM0ODgyN30.xxREl2ce9qTYVzwg8r6pxivlNS_I_rYJL4xGXT_csc0';
const PK_COLUMN = { brands: 'code', outlets: 'code' };

const Supabase = {
  _transform(val) {
    if (Array.isArray(val)) return val.map(v => Supabase._transform(v));
    if (val && typeof val === 'object' && !(val instanceof Date)) {
      const obj = {};
      for (const [k, v] of Object.entries(val)) {
        const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        obj[camel] = Supabase._transform(v);
      }
      return obj;
    }
    return val;
  },

  _untransform(val) {
    if (Array.isArray(val)) return val.map(v => Supabase._untransform(v));
    if (val && typeof val === 'object' && !(val instanceof Date)) {
      const obj = {};
      for (const [k, v] of Object.entries(val)) {
        const snake = k.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
        obj[snake] = Supabase._untransform(v);
      }
      return obj;
    }
    return val;
  },

  _headers() {
    const h = {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    };
    const token = sessionStorage.getItem('supabase_token');
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
  },

  async _fetch(method, table, opts = {}) {
    const isRpc = table.startsWith('rpc/');
    let url = SUPABASE_URL + '/rest/v1/' + table;
    if (!isRpc) url += '?select=*';
    if (opts.query) url += (isRpc ? '?' : '&') + opts.query;
    if (opts.id && !isRpc) {
      const pk = PK_COLUMN[table] || 'id';
      url = SUPABASE_URL + '/rest/v1/' + table + '?' + pk + '=eq.' + encodeURIComponent(opts.id) + '&select=*';
    }

    let headers = Supabase._headers();
    if (opts.prefer) headers['Prefer'] = opts.prefer;
    let res;
    const doFetch = () => fetch(url, {
      method,
      headers,
      body: opts.body ? JSON.stringify(Supabase._untransform(opts.body)) : undefined,
    });

    res = await doFetch();

    // Auto-refresh token on 401/403
    if ((res.status === 401 || res.status === 403) && !opts._retried) {
      const refreshed = await Supabase._refreshToken();
      if (refreshed) {
        headers = Supabase._headers();
        if (opts.prefer) headers['Prefer'] = opts.prefer;
        opts._retried = true;
        res = await doFetch();
      }
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error('Supabase ' + method + ' /' + table + ': ' + err);
    }
    if (method === 'DELETE' || opts.noContent) return null;
    const json = await res.json();
    return Array.isArray(json) ? json.map(r => Supabase._transform(r)) : Supabase._transform(json);
  },

  async _refreshToken() {
    const refreshToken = localStorage.getItem('supabase_refresh_token');
    if (!refreshToken) return false;
    try {
      const res = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      sessionStorage.setItem('supabase_token', data.access_token);
      if (data.refresh_token) localStorage.setItem('supabase_refresh_token', data.refresh_token);
      return true;
    } catch { return false; }
  },

  getAll(table) { return Supabase._fetch('GET', table); },
  getById(table, id) { return Supabase._fetch('GET', table, { id }); },
  insert(table, record) { return Supabase._fetch('POST', table, { body: record, prefer: 'return=representation' }); },
  update(table, id, changes) { return Supabase._fetch('PATCH', table, { id, body: changes, prefer: 'return=representation' }); },
  delete(table, id) { return Supabase._fetch('DELETE', table, { id, noContent: true }); },

  /* ---- Auth ---- */

  async authLogin(email, password) {
    const res = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.msg || 'Login failed');
    }
    return res.json();
  },

  async authLogout() {
    const token = sessionStorage.getItem('supabase_token');
    if (!token) return;
    await fetch(SUPABASE_URL + '/auth/v1/logout', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + token,
      },
    }).catch(() => {});
  },

  async authGetUser() {
    const token = sessionStorage.getItem('supabase_token');
    if (!token) return null;
    const res = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + token,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Supabase._transform(data);
  },

  /* ---- Admin Auth API (via RPC — no service key needed) ---- */

  async adminCreateUser(email, password, userMetadata = {}) {
    const data = await Supabase._fetch('POST', 'rpc/admin_create_user', {
      body: { email, password, user_metadata: userMetadata },
    });
    return data;
  },

  async adminUpdateUser(id, attrs) {
    await Supabase._fetch('POST', 'rpc/admin_update_user', {
      body: { target_id: id, attrs }, noContent: true,
    });
  },

  async adminDeleteUser(id) {
    await Supabase._fetch('POST', 'rpc/admin_delete_user', {
      body: { target_id: id }, noContent: true,
    });
  },

  async adminListUsers() {
    const data = await Supabase._fetch('POST', 'rpc/admin_list_users');
    return (data || []).map(u => Supabase._transform(u));
  },

  async adminResetPassword(id, newPassword) {
    await Supabase._fetch('POST', 'rpc/admin_reset_password', {
      body: { target_id: id, new_password: newPassword }, noContent: true,
    });
  },
};

window.Supabase = Supabase;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
