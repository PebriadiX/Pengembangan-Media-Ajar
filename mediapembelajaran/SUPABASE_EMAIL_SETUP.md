# Setup Email Verification di Supabase

## Masalah
Ketika user mendaftar, email konfirmasi dari Supabase **belum dikirim**. Ini terjadi karena email provider belum dikonfigurasi di Supabase project.

---

## Solusi: Setup Email Provider di Supabase Console

### Pilihan 1: Menggunakan Supabase Built-in Email (Development/Testing)

1. Buka **[Supabase Dashboard](https://app.supabase.com)**
2. Pilih project: `ktlqvybvhzzvhtsqhzyy`
3. Masuk ke **Authentication** → **Providers**
4. Cari bagian **Email** dan pastikan **Email provider** sudah dipilih

**Untuk development/testing**, Supabase menyediakan built-in email yang mengirim ke email real. Namun, ada batasan:
- Hanya untuk development
- Email dikirim dengan delay
- Jika tidak menerima, cek folder Spam

### Pilihan 2: Setup SendGrid untuk Production (Recommended)

1. Daftar akun di **[SendGrid](https://sendgrid.com)**
2. Buat API Key baru di SendGrid dashboard
3. Di Supabase Console → **Authentication** → **Email**
4. Pilih **SendGrid** sebagai email provider
5. Masukkan SendGrid API Key
6. Atur sender email dan template

### Pilihan 3: Setup Email Domain (Recommended untuk Production)

Jika ingin menggunakan custom domain email:

1. Di Supabase Console → **Authentication** → **Email**
2. Pilih **SMTP** atau domain provider Anda
3. Masukkan konfigurasi SMTP
4. Test dengan mengirim email verifikasi ke akun test

---

## Cara Mengecek Status Email

### 1. Cek Console Log (Browser DevTools)

Saat user mendaftar, buka **F12** → **Console** dan perhatikan log:

```
[Register] Attempting signUp for: user@example.com
[Register] SignUp successful: {
  userId: "xxx-xxx-xxx",
  email: "user@example.com",
  needsConfirmation: true,
  userMetadata: {...}
}
```

**Jika `needsConfirmation: true`** = Email seharusnya dikirim

### 2. Cek Supabase Logs

1. Buka **Supabase Console** → Project Anda
2. Masuk ke **Logs** → **Auth**
3. Cari event `user.signed_up` untuk user yang baru mendaftar
4. Lihat apakah ada error email sending

### 3. Cek Inbox Email

- Buka email yang didaftarkan
- **Cek folder Spam/Promotions**
- Email dari Supabase biasanya terlihat seperti: `noreply@...supabase.co`

---

## Konfigurasi Email Template di Supabase

Setelah email provider aktif, setup template email:

1. **Supabase Console** → **Authentication** → **Email Templates**
2. Edit template **Confirm signup** untuk customize pesan
3. Template default sudah berisi link verifikasi otomatis

---

## Testing Email Flow

### Langkah 1: Register User Baru
```
1. Buka http://localhost:3000/register
2. Isi form dengan email test (contoh: testuser@gmail.com)
3. Klik tombol Register
4. Buka Console Browser untuk lihat log
```

### Langkah 2: Cek Email
```
1. Buka inbox email yang didaftarkan
2. Tunggu ~1-2 menit untuk email sampai
3. Cari email dengan subject "Confirm your signup"
4. Klik link verifikasi di email
```

### Langkah 3: Verifikasi Berhasil
```
Setelah klik link di email:
- Redirect ke halaman success
- User bisa login
- Status email = verified
```

---

## Jika Email Masih Tidak Diterima

### Cek 1: Supabase Auth Settings
- **Supabase Console** → **Authentication** → **Policies**
- Pastikan **Require email confirmation** = **ON**

### Cek 2: Email Provider Status
- Buka **Supabase Console** → **Authentication** → **Email**
- Lihat status provider (Active/Inactive)
- Jika inactive, klik **Activate**

### Cek 3: Sender Email
- Pastikan sender email sudah diverifikasi di provider
- Jika pakai domain sendiri, setup SPF/DKIM records

### Cek 4: Rate Limiting
- Supabase memiliki rate limit untuk email
- Jangan spam register request dalam waktu singkat
- Tunggu minimal 1 menit antar pendaftaran

### Cek 5: Log Error Supabase
```sql
-- Query di Supabase SQL Editor untuk lihat error:
SELECT 
  user_id, 
  email, 
  created_at, 
  confirmation_sent_at, 
  email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Workflow Setelah Email Setup Berhasil

### Skenario: Guru Hapus Siswa → Siswa Daftar Ulang

1. **Guru hapus siswa di dashboard**
   - Sistem calls `/api/users/[id]` dengan DELETE
   - Auth user dihapus dari Supabase Auth
   - Data siswa dihapus dari tabel `users`

2. **Siswa register ulang dengan email yang sama**
   - Supabase auth.signUp() tidak menemukan user lama (sudah dihapus)
   - User baru dibuat, status email = unconfirmed
   - **Email verifikasi dikirim**

3. **Siswa cek inbox dan verify email**
   - Email dari Supabase masuk dengan link verifikasi
   - Klik link → email terverifikasi
   - User bisa login

---

## Debugging Tips

### Enable Development Mode
```typescript
// Di supabase.ts untuk melihat log detail
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    debug: true,  // Enable debug logging
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

### Test dengan Email Lokal (Development)
Jika tidak ingin setup provider production:
1. Gunakan **Supabase Emulator** (SupabaseCLI)
2. Email dikirim ke terminal stdout
3. Ideal untuk development/testing

---

## Referensi
- [Supabase Auth Email Setup](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [SendGrid Integration](https://supabase.com/docs/guides/auth/auth-smtp?platform=web#set-up-email)
