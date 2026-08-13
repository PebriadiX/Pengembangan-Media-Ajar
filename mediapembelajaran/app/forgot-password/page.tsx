"use client";

import { useState } from "react";
import { AuthShell } from "@/app/components/AuthShell";
import { supabase } from "@/app/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    if (!supabase) {
      setError("Konfigurasi Supabase belum tersedia.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message || "Gagal mengirim link reset password.");
    } else {
      setMessage("Link reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam.");
      setEmail("");
    }

    setIsSubmitting(false);
  };

  return (
    <AuthShell
      title="Lupa password"
      subtitle="Masukkan alamat email akun Anda, lalu kami akan mengirimkan tautan untuk mengatur ulang kata sandi."
      footer={
        <div className="flex items-center justify-between gap-3 text-[11px] sm:text-sm">
          <a href="/" className="font-semibold text-indigo-300 transition hover:text-white">
            Kembali ke login
          </a>
          <a href="/register" className="font-semibold text-indigo-300 transition hover:text-white">
            Buat akun baru
          </a>
        </div>
      }
    >
      <div className="mt-3 rounded-[1rem] border border-white/10 bg-white/5 p-3.5 shadow-inner shadow-black/20">
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-2">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm text-indigo-200">
            ✉
          </div>
          <div>
            <p className="text-[11px] font-semibold text-white">Reset kata sandi aman</p>
            <p className="mt-0.5 text-[10px] leading-4 text-slate-300">
              Kami akan mengirimkan tautan ke email Anda dalam hitungan menit.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-300">Alamat email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
              placeholder="nama@email.com"
              required
            />
          </div>

          {error ? <p className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}
          {message ? <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Mengirim link..." : "Kirim link reset password"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
