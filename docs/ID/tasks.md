# Tasks Log

## 17 Jul 2026

### Gagal Login user test (`randytest@test.com`)

**Issue**: Login via `/auth/v1/token?grant_type=password` return 400 "Email not confirmed".

**Root cause**: SQL insert langsung ke `auth.users` tidak set kolom berikut dengan benar:

| Kolom | Seharusnya | Awalnya |
|---|---|---|
| `aud` | `'authenticated'` | `null` |
| `role` | `'authenticated'` | `null` |
| `confirmation_token` | `''` | `null` |
| `recovery_token` | `''` | `null` |
| `email_change` | `''` | `null` |
| `email_change_token_new` | `''` | `null` |

**Fix**: Set kolom-kolom tersebut di atas dengan `UPDATE` query.

**Lesson**: GoTrue v2.192.0 lebih ketat dalam validasi — kolom `aud` & `role` wajib `'authenticated'`, dan kolom token wajib empty string bukan `NULL`. Ikuti persis nilai default dari user admin yang dibuat `go_true.sql`.

---

### Security Hardening (17 Jul 2026) — Target: 9/10

**FASE 1 — Critical (all done):**
- ✅ JWT Secret database parameter diubah (GoTrue v2 pakai ES256 asymmetric signing)
- ✅ `admin_delete_user()` — ditambah check `superadmin-only`, cabut dari `anon`
- ✅ `admin_reset_password()` — ditambah check `superadmin-only`, cabut dari `anon`
- ✅ RLS `profiles` — `SELECT` tidak lagi `USING(true)`, diproteksi `authenticated`
- ✅ `net.http_get/post` — dicabut dari `anon` & `authenticated` (cegah SSRF)
- ✅ Schema-level grants — `anon` cuma punya `SELECT` di 4 tabel referensi
- ✅ `.gitignore` dibuat (exclude dump, .env, bin/, dll)
- ✅ `supabase/config.toml` dibuat (password policy, MFA, rate limit, sessions)

**FASE 2 — Hardening (all done):**
- ✅ `handle_new_user()` — role hardcoded `'auditor'`, tidak ambil dari metadata user
- ✅ `handle_new_user()` — tidak bisa self-register dengan role tinggi
- ✅ RLS granular untuk semua tabel via policies existing
- ✅ `go_true.sh` — di-fix pake parameterized query, aman dari SQL injection
- ✅ MFA TOTP enabled
- ✅ Email confirmation diwajibkan
- ✅ Password min 8 karakter, harus uppercase + number + symbol
- ✅ Rate limiting diaktifkan (sign-in/sign-up: 30/5menit per IP)
- ✅ Session timebox: 24 jam, inactivity timeout: 8 jam

**FASE 3 — Excellence:**
- ✅ Audit log (`public.audit_log`) + function `log_audit_event()`
- ✅ `is_superadmin()` helper function
- ⏳ Security headers — perlu konfigurasi di reverse proxy (Kong/nginx) di production
- ⏳ Database backup terenkripsi — proses operational
- ⏳ Penetration test — direkomendasikan sebelum go-live
- ⏳ Secrets management — pindah dari hardcode ke vault/environment variables

**Final Estimated Score: 8.5/10** (dari sebelumnya 2/10)
- Critical vulns: ✅ semua ditutup
- Hardening: ✅ lengkap
- Operational excellence: ⏳ masih ada yg perlu dilakukan operational team
