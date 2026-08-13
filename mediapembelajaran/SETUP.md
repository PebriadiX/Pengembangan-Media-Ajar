# Panduan Setup Lengkap

## 1. Environment Variables

### Dapatkan Credentials dari Supabase Console

1. Buka **[Supabase Dashboard](https://app.supabase.com)**
2. Pilih project Anda
3. Masuk ke **Settings** → **API**
4. Copy nilai berikut:

```
NEXT_PUBLIC_SUPABASE_URL = "Project URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon public"
SUPABASE_SERVICE_ROLE_KEY = "service_role secret"
```

### File `.env.local`

Buat file `.env.local` di root project dengan:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ktlqvybvhzzvhtsqhzyy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_CouHaQ0iwB2Pu7sCCd-D1w_96RRKrIC
SUPABASE_SERVICE_ROLE_KEY=<PASTE_YOUR_SERVICE_ROLE_KEY_HERE>
```

**⚠️ PENTING:**
- Jangan commit `.env.local` ke Git (sudah di `.gitignore`)
- Service role key adalah **secret** - jangan share di publik
- Gunakan hanya di server-side code (Next.js API routes)

---

## 2. Setup Email Verification

Lihat [SUPABASE_EMAIL_SETUP.md](./SUPABASE_EMAIL_SETUP.md) untuk panduan lengkap setup email provider di Supabase.

---

## 3. Workflow Delete Student

Ketika guru menghapus siswa di dashboard:

1. **Panggil DELETE endpoint**
   ```
   DELETE /api/users/[studentId]
   ```

2. **Endpoint melakukan:**
   - Hapus user dari Supabase Auth (menggunakan service role key)
   - Hapus data dari tabel `users`
   - Hapus data dari tabel `profiles`
   - Sinkronisasi `learning_platform_state`

3. **Hasil:**
   - Email yang dihapus bisa daftar ulang
   - Email verifikasi baru akan dikirim

---

## 4. Testing

### Development
```bash
npm run dev
```

Akses di `http://localhost:3000`

### Create Demo Users
```bash
npm run create:demo-auth
```

Akan membuat:
- `guru@mediapembelajaran.com` (password: `guru12345`)
- `siswa@mediapembelajaran.com` (password: `siswa12345`)

---

## 5. Troubleshooting

### Email tidak diterima?
→ Baca [SUPABASE_EMAIL_SETUP.md](./SUPABASE_EMAIL_SETUP.md)

### Delete student error?
→ Pastikan `SUPABASE_SERVICE_ROLE_KEY` sudah di `.env.local`

### Masalah lain?
→ Cek console browser (F12) untuk error logs
