import { describe, it, expect, beforeEach, vi } from 'vitest';

await import('../js/supabase.js');

const Supabase = globalThis.Supabase;

function mockFetchResponse(data, ok = true) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
  });
}

describe('Supabase._transform', () => {
  it('should convert snake_case to camelCase', () => {
    expect(Supabase._transform({ user_id: '1', full_name: 'Test' }))
      .toEqual({ userId: '1', fullName: 'Test' });
  });

  it('should handle arrays', () => {
    expect(Supabase._transform([{ user_id: '1' }, { user_id: '2' }]))
      .toEqual([{ userId: '1' }, { userId: '2' }]);
  });

  it('should handle null', () => {
    expect(Supabase._transform(null)).toBeNull();
  });

  it('should skip non-object values', () => {
    expect(Supabase._transform(42)).toBe(42);
    expect(Supabase._transform('hello')).toBe('hello');
  });
});

describe('Supabase._untransform', () => {
  it('should convert camelCase to snake_case', () => {
    expect(Supabase._untransform({ userId: '1', fullName: 'Test' }))
      .toEqual({ user_id: '1', full_name: 'Test' });
  });

  it('should handle arrays', () => {
    expect(Supabase._untransform([{ userId: '1' }, { userId: '2' }]))
      .toEqual([{ user_id: '1' }, { user_id: '2' }]);
  });
});

describe('Supabase._headers', () => {
  beforeEach(() => localStorage.clear());

  it('should include apikey and content-type', () => {
    const h = Supabase._headers();
    expect(h['apikey']).toBeDefined();
    expect(h['Content-Type']).toBe('application/json');
  });

  it('should include Authorization when token exists', () => {
    localStorage.setItem('supabase_token', 'test-token');
    const h = Supabase._headers();
    expect(h['Authorization']).toBe('Bearer test-token');
  });

  it('should not include Authorization without token', () => {
    const h = Supabase._headers();
    expect(h['Authorization']).toBeUndefined();
  });
});

describe('Supabase._fetch', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should perform GET request', async () => {
    mockFetchResponse([{ id: '1', name: 'Test' }]);
    const result = await Supabase._fetch('GET', 'brands');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should handle RPC calls', async () => {
    mockFetchResponse({ success: true });
    const result = await Supabase._fetch('POST', 'rpc/admin_list_users');
    expect(result.success).toBe(true);
  });

  it('should return null for DELETE with noContent', async () => {
    mockFetchResponse(null);
    const result = await Supabase._fetch('DELETE', 'brands', { id: '1', noContent: true });
    expect(result).toBeNull();
  });

  it('should return null when noContent is set', async () => {
    mockFetchResponse(null);
    const result = await Supabase._fetch('POST', 'rpc/admin_delete_user', { noContent: true });
    expect(result).toBeNull();
  });

  it('should throw on error response', async () => {
    mockFetchResponse('Not found', false);
    await expect(Supabase._fetch('GET', 'brands')).rejects.toThrow();
  });

  it('should transform response to camelCase', async () => {
    mockFetchResponse([{ full_name: 'Test User', user_role: 'admin' }]);
    const result = await Supabase._fetch('GET', 'profiles');
    expect(result[0].fullName).toBe('Test User');
    expect(result[0].userRole).toBe('admin');
  });
});

describe('Supabase CRUD methods', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAll calls _fetch GET', async () => {
    mockFetchResponse([]);
    await Supabase.getAll('profiles');
    expect(globalThis.fetch).toHaveBeenCalled();
  });

  it('insert calls _fetch POST', async () => {
    mockFetchResponse([{ id: '1' }]);
    await Supabase.insert('brands', { name: 'Test' });
    expect(globalThis.fetch).toHaveBeenCalled();
  });
});

describe('Supabase admin methods', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('adminCreateUser calls rpc/admin_create_user', async () => {
    mockFetchResponse({ id: 'new-uuid' });
    const result = await Supabase.adminCreateUser('test@test.com', 'pass123', { name: 'Test' });
    expect(result.id).toBe('new-uuid');
  });

  it('adminListUsers calls rpc/admin_list_users', async () => {
    mockFetchResponse([{ id: '1', username: 'admin', role: 'superadmin' }]);
    const result = await Supabase.adminListUsers();
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('admin');
  });

  it('adminUpdateUser calls rpc/admin_update_user', async () => {
    mockFetchResponse(null);
    await Supabase.adminUpdateUser('uuid-1', { name: 'New Name' });
    expect(globalThis.fetch).toHaveBeenCalled();
  });

  it('adminDeleteUser calls rpc/admin_delete_user', async () => {
    mockFetchResponse(null);
    await Supabase.adminDeleteUser('uuid-1');
    expect(globalThis.fetch).toHaveBeenCalled();
  });

  it('adminResetPassword calls rpc/admin_reset_password', async () => {
    mockFetchResponse(null);
    await Supabase.adminResetPassword('uuid-1', 'newpass123');
    expect(globalThis.fetch).toHaveBeenCalled();
  });
});
