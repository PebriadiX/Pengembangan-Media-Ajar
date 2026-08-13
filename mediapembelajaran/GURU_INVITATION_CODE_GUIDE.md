# Panduan: Membuat Kode Akses Guru

Sistem ini menggunakan **Teacher Invitation Codes** untuk memastikan hanya guru yang diizinkan yang bisa mendaftar. Berikut adalah panduan lengkap untuk administrator.

## 📋 Pengenalan

- **Setiap guru** memerlukan kode akses unik untuk mendaftar
- **Setiap kode** hanya bisa digunakan **satu kali**
- **Kode bisa kadaluarsa** (opsional, berdasarkan `expires_at`)
- **Validasi dilakukan di backend** untuk keamanan maksimal

## 🔑 Cara Membuat Kode Akses Guru

### Metode 1: SQL Query di Supabase Console

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Buka **SQL Editor**
4. Jalankan query berikut untuk membuat satu kode:

```sql
INSERT INTO public.invitation_codes (
  id,
  code,
  created_by,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'TEACHER-7K9X-2M4P',
  'admin-id-anda', -- Ganti dengan user ID Anda atau 'admin'
  'active',
  now(),
  now()
);
```

### Metode 2: Membuat Banyak Kode Sekaligus

Gunakan script SQL berikut untuk membuat 5 kode sekaligus dengan format yang konsisten:

```sql
-- Membuat 5 kode akses guru
INSERT INTO public.invitation_codes (
  id,
  code,
  created_by,
  status,
  created_at,
  updated_at
) VALUES
  (gen_random_uuid(), 'GURU-' || upper(substring(md5(random()::text), 1, 4)) || '-' || upper(substring(md5(random()::text), 5, 4)), 'admin', 'active', now(), now()),
  (gen_random_uuid(), 'GURU-' || upper(substring(md5(random()::text), 1, 4)) || '-' || upper(substring(md5(random()::text), 5, 4)), 'admin', 'active', now(), now()),
  (gen_random_uuid(), 'GURU-' || upper(substring(md5(random()::text), 1, 4)) || '-' || upper(substring(md5(random()::text), 5, 4)), 'admin', 'active', now(), now()),
  (gen_random_uuid(), 'GURU-' || upper(substring(md5(random()::text), 1, 4)) || '-' || upper(substring(md5(random()::text), 5, 4)), 'admin', 'active', now(), now()),
  (gen_random_uuid(), 'GURU-' || upper(substring(md5(random()::text), 1, 4)) || '-' || upper(substring(md5(random()::text), 5, 4)), 'admin', 'active', now(), now());
```

### Metode 3: Membuat Kode dengan Tanggal Kadaluarsa

Jika ingin kode hanya berlaku untuk waktu tertentu:

```sql
INSERT INTO public.invitation_codes (
  id,
  code,
  created_by,
  status,
  expires_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'TEACHER-BATCH-001',
  'admin',
  'active',
  now() + interval '30 days',  -- Berlaku 30 hari ke depan
  now(),
  now()
);
```

## ✅ Verifikasi Kode Akses

Untuk melihat semua kode yang sudah dibuat dan statusnya:

```sql
SELECT
  id,
  code,
  status,
  used_by,
  used_at,
  expires_at,
  created_at,
  updated_at
FROM public.invitation_codes
ORDER BY created_at DESC;
```

## 📊 Contoh Hasil

```
id                | code              | status | used_by | used_at | expires_at
------------------+-------------------+--------+---------+---------+----------
550e8400-e29b     | TEACHER-7K9X-2M4P | active | NULL    | NULL    | NULL
550e8400-e29c     | GURU-BATCH-001    | used   | user123 | 2024... | 2025-12...
550e8400-e29d     | GURU-BATCH-002    | active | NULL    | NULL    | NULL
```

## 🔒 Keamanan

- **Backend Validation**: Semua validasi dilakukan di server-side (`/api/auth/validate-teacher-code`)
- **One-Time Use**: Kode otomatis diubah ke status `used` setelah guru berhasil mendaftar
- **Expiry Support**: Anda bisa mengatur kode agar kadaluarsa setelah periode tertentu
- **Audit Trail**: Sistem mencatat siapa yang menggunakan kode dan kapan

## 📝 Langkah-Langkah Registrasi Guru

1. Guru membuka form registrasi dan memilih role **"Guru"**
2. Field **"Kode Akses Guru"** akan muncul
3. Guru memasukkan kode yang Anda berikan
4. Guru klik **"Buat Akun"** untuk validasi kode (tidak langsung signup)
5. Jika kode valid ✓, guru lanjutkan mengisi data lainnya
6. Guru klik **"Buat Akun"** lagi untuk finalisasi registrasi
7. Sistem akan:
   - Membuat akun di Supabase Auth
   - Menyimpan profil guru di database
   - Menandai kode sebagai `used` + simpan user ID yang menggunakannya

## ⚠️ Hal Penting

- **Jangan share kode di public** - kode adalah kredensial untuk registrasi
- **Hanya bagikan ke guru yang resmi** - setiap kode hanya bisa digunakan 1x
- **Pertimbangkan ekspirasi** - kode dengan expiry lebih aman untuk batch tertentu
- **Monitor penggunaan kode** - gunakan query di atas untuk tracking

## 🆘 Troubleshooting

### Kode tidak muncul di UI
- Pastikan browser sudah reload (Ctrl+F5)
- Cek console browser untuk error messages
- Pastikan Anda memilih role "Guru" dulu

### Error "Kode tidak valid"
- Cek kode sudah dibuat di database
- Pastikan status kode adalah `active` (bukan `used` atau expired)
- Cek apakah kode sudah pernah digunakan sebelumnya

### Kode tidak bisa diubah status setelah registrasi
- Log in ke database dan cek apakah `invitation_codes` table ada
- Verifikasi Supabase service role key sudah dikonfigurasi

---

📧 **Pertanyaan?** Hubungi developer atau technical support tim.
