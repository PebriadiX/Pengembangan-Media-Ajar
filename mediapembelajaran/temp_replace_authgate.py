from pathlib import Path

path = Path(r"c:\Users\PEBRIADI\Media Pembelajaran\mediapembelajaran\app\components\AuthGate.tsx")
text = path.read_text(encoding="utf-8")

start = text.index("  return (")
end = text.rindex("\n    </div>\n  );\n}") + len("\n    </div>\n  );\n}")
new_block = '''  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_18%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.18),_transparent_20%),linear-gradient(180deg,_#050816_0%,_#0b1224_55%,_#111827_100%)] px-4 py-4 sm:px-6 sm:py-6">
      {showLoginSuccess ? (
        <div className="auth-success-overlay pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.32),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.22),_transparent_30%),linear-gradient(135deg,_#020617,_#111827_45%,_#0f172a)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.16)_0%,_transparent_55%)]" />
          <div className="auth-success-card relative z-10 flex items-center justify-center text-white">
            {/* @ts-ignore */}
            <l-tail-chase size="42" speed="1.75" color="#f8fafc" />
          </div>
        </div>
      ) : null}

      <div className="relative flex w-full max-w-[80rem] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_40px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl lg:flex-row lg:gap-0">
        <div className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),_transparent_32%),linear-gradient(180deg,_rgba(15,23,42,0.95),_rgba(15,23,42,0.8))] px-8 py-10 sm:px-10 sm:py-12">
          <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle,_rgba(255,255,255,0.18)_0%,_transparent_55%)] opacity-70" aria-hidden="true" />
          <div className="absolute right-[-3.5rem] top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-sky-500/10 blur-3xl" aria-hidden="true" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.24)] backdrop-blur-xl">
                <img src="/upgrisba-logo.svg" alt="Logo SMK N 2 Padang" className="h-16 w-16 rounded-3xl border border-white/10 bg-white/10 p-3 object-contain" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-sky-300">SMK N 2 Padang</p>
                  <p className="mt-1 text-sm font-semibold text-white">Berilmu, Berkarakter, Berprestasi</p>
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Selamat datang kembali!</h1>
                <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                  Masuk untuk melanjutkan akses ke akun Anda dengan aman dan cepat.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[0_25px_65px_rgba(15,23,42,0.25)] backdrop-blur-xl">
              <p className="text-[10px] uppercase tracking-[0.3em] text-sky-300">Aman • Cepat • Terpercaya</p>
              <div className="mt-4 grid gap-4 text-sm text-slate-300">
                <div>
                  <p className="font-semibold text-white">Akses kelas digital</p>
                  <p className="mt-1 text-xs text-slate-400">Materi interaktif, evaluasi, dan laporan pembelajaran.</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Tampilan modern</p>
                  <p className="mt-1 text-xs text-slate-400">Antarmuka elegan untuk pengalaman belajar yang nyaman.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-slate-950/95 px-8 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="relative z-10 mx-auto max-w-md">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Masuk ke akun Anda</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Gunakan email dan kata sandi untuk melanjutkan</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                  placeholder="siswa@mediapembelajaran.com"
                  required
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">Kata sandi</label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 pr-12 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-white"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M3 3l18 18" strokeLinecap="round" />
                        <path d="M10.6 10.6a2 2 0 102.8 2.8" />
                        <path d="M9.1 5.1A11.2 11.2 0 0112 4.5c4.3 0 7.9 2.6 9.7 6.2a12.3 12.3 0 01-2.2 3.3" />
                        <path d="M6.4 7.9A12.2 12.2 0 002.3 10.7a11.9 11.9 0 004.4 4.8" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M2 12s3.4-6 10-6 10 6 10 6-3.4 6-10 6S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm font-semibold text-sky-400 transition hover:text-white">
                  Lupa password?
                </Link>
              </div>

              {error ? <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p> : null}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:via-indigo-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAuthenticating ? "Memproses..." : "Masuk ke sistem"}
              </button>

              <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-slate-500">
                <div className="h-px flex-1 bg-white/10" />
                <span>atau</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 hover:shadow-lg hover:shadow-sky-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 13.94c-.22-.66-.35-1.36-.35-2.08s.13-1.42.35-2.08V6.94H2.18C1.43 8.27 1 9.82 1 11.5s.43 3.23 1.18 4.56l3.66-2.12z" />
                  <path fill="#EA4335" d="M12 5.08c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.94l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {isGoogleLoading ? "Menghubungkan akun Google..." : "Masuk dengan Google"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400">
              <span>Belum punya akun? </span>
              <Link href="/register" className="font-semibold text-sky-300 transition hover:text-white">
                Daftar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}'''

path.write_text(text[:start] + new_block + text[end:], encoding="utf-8")
print("updated")
