# Cara Mendapatkan SUPABASE_SERVICE_ROLE_KEY

## Langkah-Langkah

### 1. Buka Supabase Dashboard
```
https://app.supabase.com
```

### 2. Login dengan akun Anda
- Masukkan email dan password
- Klik "Sign in"

### 3. Pilih Project
- Cari project dengan nama: **`ktlqvybvhzzvhtsqhzyy`**
- Klik untuk membuka project

### 4. Buka Settings → API
Di sidebar sebelah kiri:
```
Settings (ikon gear) → API
```

### 5. Temukan Service Role Secret
Di halaman API, Anda akan melihat beberapa section:

```
PROJECT REFERENCE
ktlqvybvhzzvhtsqhzyy

PROJECT URL
https://ktlqvybvhzzvhtsqhzyy.supabase.co

ANON PUBLIC
sb_publishable_CouHaQ0iwB2Pu7sCCd-D1w_96RRKrIC

SERVICE ROLE SECRET  ← CARI YANG INI
sb_... (klik untuk show/copy)
```

### 6. Copy Service Role Secret
- Klik pada text **SERVICE ROLE SECRET** atau ikon copy
- Value ini akan ter-copy ke clipboard
- Contoh format: `sb_` diikuti string panjang

### 7. Paste ke .env.local
Di file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ktlqvybvhzzvhtsqhzyy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_CouHaQ0iwB2Pu7sCCd-D1w_96RRKrIC
SUPABASE_SERVICE_ROLE_KEY=<PASTE_VALUE_YANG_DICOPY_DISINI>
```

---

## ⚠️ PENTING

**JANGAN PERNAH:**
- Share service role key di public
- Commit ke git (sudah di .gitignore)
- Post di forum/discord/github issue
- Gunakan di client-side code

**BOLEH:**
- Gunakan di server-side code (Next.js API routes)
- Gunakan di scripts backend
- Simpan di .env.local (local development)

---

## Jika Tidak Bisa Copy

Jika tombol copy tidak muncul atau value ter-hide:

### Opsi 1: Regenerate Key
1. Di halaman API → SERVICE ROLE SECRET
2. Klik ikon **refresh** (regenerate)
3. Confirm bahwa ingin generate key baru
4. Copy key yang baru

### Opsi 2: Lihat di URL Parameter
1. Beberapa Supabase versi lama: cek URL di browser
2. Lihat di Settings → API → scroll down

---

## Setelah Setup Selesai

Jalankan test:

```bash
# 1. Restart development server
npm run dev

# 2. Test delete student di dashboard
# Guru → Dashboard → Kelola Siswa → Delete siswa

# 3. Cek console browser (F12)
# Harus muncul success message
```

Jika masih error, cek console untuk pesan error detail.
