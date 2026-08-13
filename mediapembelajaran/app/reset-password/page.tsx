"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/app/components/AuthShell";
import { supabase } from "@/app/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setError("Konfigurasi Supabase belum tersedia.");
      return;
    }

    const params = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = params.get("access_token");
    const type = params.get("type");

    if (accessToken && type === "recovery") {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: "" }).then(({ error }) => {
        if (error) {
          setError("Link reset password tidak valid atau sudah kadaluarsa.");
        } else {
          setIsReady(true);
        }
      });
    } else {
      setError("Link reset password tidak valid.");
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!password || password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setIsSubmitting(true);

    if (!supabase) {
      setError("Konfigurasi Supabase belum tersedia.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message || "Gagal memperbarui password.");
    } else {
      setMessage("Password berhasil diperbarui. Anda akan diarahkan ke halaman login.");
      setTimeout(() => router.push("/"), 1600);
    }

    setIsSubmitting(false);
  };

  return (
    <AuthShell
      title="Buat password baru"
      subtitle="Tentukan password baru Anda untuk melanjutkan akses ke akun."
      footer={
        <a href="/" className="font-semibold text-indigo-300 transition hover:text-white">
          Kembali ke login
        </a>
      }
    >
      {!isReady ? (
        <p className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">Memvalidasi link reset password...</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300">Password baru</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3.5 py-2.5 pr-10 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                placeholder="Minimal 6 karakter"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-white"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 3l18 18" strokeLinecap="round" />
                    <path d="M10.6 10.6a2 2 0 102.8 2.8" />
                    <path d="M9.1 5.1A11.2 11.2 0 0112 4.5c4.3 0 7.9 2.6 9.7 6.2a12.3 12.3 0 01-2.2 3.3" />
                    <path d="M6.4 7.9A12.2 12.2 0 002.3 10.7a11.9 11.9 0 004.4 4.8" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M2 12s3.4-6 10-6 10 6 10 6-3.4 6-10 6S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300">Konfirmasi password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3.5 py-2.5 pr-10 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                placeholder="Ulangi password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-white"
                aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showConfirmPassword ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 3l18 18" strokeLinecap="round" />
                    <path d="M10.6 10.6a2 2 0 102.8 2.8" />
                    <path d="M9.1 5.1A11.2 11.2 0 0112 4.5c4.3 0 7.9 2.6 9.7 6.2a12.3 12.3 0 01-2.2 3.3" />
                    <path d="M6.4 7.9A12.2 12.2 0 002.3 10.7a11.9 11.9 0 004.4 4.8" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M2 12s3.4-6 10-6 10 6 10 6-3.4 6-10 6S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error ? <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}
          {message ? <p className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Memproses..." : "Simpan password baru"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
