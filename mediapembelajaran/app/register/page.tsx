"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { syncAuthUserToSupabase } from "@/app/lib/supabase-service";

type Role = "siswa" | "guru";

const getInboxUrl = (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return "https://mail.google.com/mail/u/0/#inbox";
  }

  const domain = normalizedEmail.split("@")[1]?.toLowerCase() ?? "";

  if (domain === "gmail.com" || domain === "googlemail.com") {
    return `https://mail.google.com/mail/u/0/?authuser=${encodeURIComponent(normalizedEmail)}#inbox`;
  }

  const inboxMap: Record<string, string> = {
    "outlook.com": "https://outlook.live.com/mail/0/inbox",
    "hotmail.com": "https://outlook.live.com/mail/0/inbox",
    "live.com": "https://outlook.live.com/mail/0/inbox",
    "msn.com": "https://outlook.live.com/mail/0/inbox",
    "yahoo.com": "https://mail.yahoo.com/d/folders/1",
    "yahoo.co.id": "https://mail.yahoo.com/d/folders/1",
    "icloud.com": "https://www.icloud.com/mail",
    "me.com": "https://www.icloud.com/mail",
    "mac.com": "https://www.icloud.com/mail",
  };

  return inboxMap[domain] ?? "https://mail.google.com/mail/u/0/#inbox";
};

export default function RegisterPage() {
  const router = useRouter();

  // =========================
  // STATE
  // =========================
  const [role, setRole] = useState<Role>("siswa");
  const [teacherCode, setTeacherCode] = useState("");
  const [validatedTeacherCodeId, setValidatedTeacherCodeId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showInboxPopup, setShowInboxPopup] = useState(false);
  const [inboxUrl, setInboxUrl] = useState("https://mail.google.com/mail/u/0/#inbox");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [verificationState, setVerificationState] = useState<"pending" | "resent" | "error">("pending");
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mencegah spam request register
  const [cooldown, setCooldown] = useState(0);

  // =========================
  // COOLDOWN TIMER
  // =========================
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  // =========================
  // CLEAR MESSAGE
  // =========================
  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // =========================
  // ERROR HANDLER
  // =========================
  const getFriendlyErrorMessage = (message?: string) => {
    const errorMessage = (message || "").toLowerCase();

    if (
      errorMessage.includes("rate limit") ||
      errorMessage.includes("email rate limit") ||
      errorMessage.includes("too many requests")
    ) {
      return "Terlalu banyak percobaan pendaftaran dalam waktu singkat. Silakan tunggu beberapa menit sebelum mencoba lagi.";
    }

    if (
      errorMessage.includes("already registered") ||
      errorMessage.includes("user already registered")
    ) {
      return "Email tersebut sudah terdaftar. Silakan masuk menggunakan akun Anda.";
    }

    if (
      errorMessage.includes("invalid email") ||
      errorMessage.includes("invalid email address")
    ) {
      return "Format email tidak valid. Silakan masukkan alamat email yang benar.";
    }

    if (
      errorMessage.includes("password") &&
      errorMessage.includes("characters")
    ) {
      return "Password harus memiliki minimal 6 karakter.";
    }

    if (errorMessage.includes("signup is disabled")) {
      return "Pendaftaran akun sedang dinonaktifkan. Silakan hubungi administrator.";
    }

    if (errorMessage.includes("email not confirmed")) {
      return "Email belum diverifikasi. Silakan cek inbox email Anda.";
    }

    if (errorMessage.includes("weak password")) {
      return "Password terlalu lemah. Gunakan password yang lebih kuat.";
    }

    return message || "Gagal membuat akun. Silakan coba lagi.";
  };

  // =========================
  // REGISTER
  // =========================
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    // Cegah double submit
    if (isSubmitting) return;

    // Cegah spam ketika cooldown
    if (cooldown > 0) {
      setError(
        `Silakan tunggu ${cooldown} detik sebelum mencoba kembali.`
      );
      return;
    }

    setError("");
    setSuccess("");

    // =========================
    // NORMALISASI DATA
    // =========================
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // =========================
    // VALIDASI FIELD
    // =========================
    if (
      !trimmedName ||
      !normalizedEmail ||
      !password ||
      !confirmPassword
    ) {
      setError("Semua field wajib diisi.");
      return;
    }

    // =========================
    // VALIDASI NAMA
    // =========================
    if (trimmedName.length < 2) {
      setError("Nama lengkap minimal 2 karakter.");
      return;
    }

    // =========================
    // VALIDASI EMAIL
    // =========================
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      setError("Format email tidak valid.");
      return;
    }

    // =========================
    // VALIDASI PASSWORD
    // =========================
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    // =========================
    // VALIDASI KONFIRMASI
    // =========================
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    // =========================
    // VALIDASI KODE GURU (JIKA GURU)
    // =========================
    if (role === "guru") {
      if (!teacherCode.trim()) {
        setError("Kode akses guru wajib diisi.");
        return;
      }

      // Jika belum divalidasi, lakukan validasi
      if (!validatedTeacherCodeId) {
        setIsSubmitting(true);

        try {
          const validateResponse = await fetch("/api/auth/validate-teacher-code", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: teacherCode.trim().toUpperCase(),
            }),
          });

          const validateData = await validateResponse.json();

          if (!validateResponse.ok || !validateData.success) {
            setError(
              validateData.message || "Kode akses guru tidak valid atau sudah digunakan."
            );
            setCooldown(10);
            setIsSubmitting(false);
            return;
          }

          // Kode valid, simpan ID untuk digunakan nanti
          setValidatedTeacherCodeId(validateData.codeId);
          setSuccess("✓ Kode akses guru valid! Silakan lanjutkan pendaftaran.");
        } catch (validationError) {
          console.error("[Register] Gagal validasi kode guru:", validationError);
          setError("Gagal memvalidasi kode akses guru. Silakan coba lagi.");
          setCooldown(10);
          setIsSubmitting(false);
          return;
        }

        setIsSubmitting(false);
        return; // Tunggu user klik submit lagi setelah validasi berhasil
      }
    }

    // =========================
    // CEK SUPABASE
    // =========================
    if (!supabase) {
      setError(
        "Konfigurasi Supabase belum tersedia. Periksa environment variable Anda."
      );

      return;
    }

    setIsSubmitting(true);

    try {
      console.log("[Register] Memulai registrasi");

      // =========================
      // CREATE USER SUPABASE AUTH
      // =========================
      console.log("[Register] Attempting signUp for:", normalizedEmail);
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: trimmedName,
              role,
              teacher_code_id: role === "guru" ? validatedTeacherCodeId : null,
            },
          },
        });

      // =========================
      // ERROR SUPABASE
      // =========================
      if (signUpError) {
        console.error(
          "[Register] Supabase signUp error:",
          JSON.stringify(signUpError, null, 2)
        );

        setError(
          getFriendlyErrorMessage(signUpError.message)
        );

        // Beri jeda agar user tidak spam request
        setCooldown(30);

        return;
      }

      console.log("[Register] SignUp successful:", {
        userId: data.user?.id,
        email: data.user?.email,
        needsConfirmation: !data.session,
        userMetadata: data.user?.user_metadata,
      });

      // =========================
      // USER TIDAK DITEMUKAN
      // =========================
      if (!data.user) {
        setError(
          "Akun gagal dibuat. Silakan coba kembali."
        );

        setCooldown(30);

        return;
      }

      const userId = data.user.id;

      console.log("[Register] User berhasil dibuat:", {
        userId,
        email: normalizedEmail,
        role,
      });

      // =========================
      // SYNC KE DATABASE APLIKASI
      // =========================
      try {
        await syncAuthUserToSupabase({
          id: userId,
          name: trimmedName,
          email: normalizedEmail,
          role,
          teacherCodeId: role === "guru" ? validatedTeacherCodeId : null,
        });

        console.log(
          "[Register] Data user berhasil disinkronisasi."
        );
      } catch (syncError) {
        console.error(
          "[Register] Gagal sinkronisasi user:",
          syncError
        );

        // Jangan gagalkan akun Auth
        // hanya karena database profile gagal sync.
      }

      // =========================
      // RESET FORM
      // =========================
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setTeacherCode("");
      setValidatedTeacherCodeId(null);

      // =========================
      // SUCCESS + INBOX POPUP
      // =========================
      const resolvedInboxUrl = getInboxUrl(normalizedEmail);
      setInboxUrl(resolvedInboxUrl);
      setRegisteredEmail(normalizedEmail);
      setVerificationState("pending");
      setShowInboxPopup(true);
      setSuccess(
        "Akun berhasil dibuat! Silakan buka inbox email Anda untuk melakukan verifikasi sebelum login."
      );

      // Cooldown
      setCooldown(30);
    } catch (unexpectedError) {
      console.error(
        "[Register] Unexpected error:",
        unexpectedError
      );

      setError(
        "Terjadi kesalahan saat membuat akun. Silakan coba beberapa saat lagi."
      );

      setCooldown(30);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================
  // LOGIN
  // =========================
  const handleBackToLogin = () => {
    router.push("/");
  };

  const openInbox = () => {
    if (typeof window !== "undefined") {
      window.open(inboxUrl, "_blank", "noopener,noreferrer");
    }
    setShowInboxPopup(false);
  };

  const handleResendVerificationEmail = async () => {
    if (!registeredEmail) return;

    setIsResendingEmail(true);
    setVerificationState("pending");

    try {
      if (!supabase) {
        throw new Error("Supabase belum dikonfigurasi");
      }

      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: registeredEmail,
      });

      if (resendError) {
        throw resendError;
      }

      setVerificationState("resent");
      setSuccess("Email verifikasi baru sudah dikirim. Silakan cek inbox Anda.");
    } catch (resendFailure) {
      console.error("[Register] Gagal kirim ulang email verifikasi:", resendFailure);
      setVerificationState("error");
      setError("Gagal mengirim ulang email verifikasi. Silakan coba beberapa saat lagi.");
    } finally {
      setIsResendingEmail(false);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white">

      {/* =========================================
          BACKGROUND
      ========================================== */}

      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 10% 10%, rgba(14,165,233,0.20), transparent 25%), radial-gradient(circle at 90% 90%, rgba(139,92,246,0.20), transparent 28%), linear-gradient(135deg, #020617 0%, #0b1224 48%, #111827 100%)",
        }}
      />

      <div
        className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl"
        aria-hidden="true"
      />

      {/* GRID */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* =========================================
          MAIN CONTAINER
      ========================================== */}

      {showInboxPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-slate-900/95 p-6 shadow-[0_30px_90px_rgba(2,6,23,0.8)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12.5V8.5A2.5 2.5 0 0 1 6.5 6H17.5A2.5 2.5 0 0 1 20 8.5V12.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 12.5L9.5 16.2C10.7 17 12.3 17 13.5 16.2L20 12.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 6V13" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <button
                type="button"
                onClick={() => setShowInboxPopup(false)}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/10"
              >
                Tutup
              </button>
            </div>

            <h3 className="mt-5 text-2xl font-black text-white">Verifikasi email Anda</h3>

            <div className="mt-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-xs text-sky-100">
              {verificationState === "pending" && "Status: menunggu konfirmasi email"}
              {verificationState === "resent" && "Status: email verifikasi baru berhasil dikirim"}
              {verificationState === "error" && "Status: gagal mengirim ulang email verifikasi"}
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Pendaftaran berhasil dibuat. Klik tombol di bawah ini untuk membuka inbox email yang Anda daftarkan. Jika browser Anda belum masuk ke akun email tersebut, sistem akan meminta Anda masuk terlebih dahulu.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={openInbox}
                className="rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-4 py-3 text-sm font-bold text-white shadow-[0_16px_40px_rgba(59,130,246,0.25)] transition hover:brightness-110"
              >
                Lihat email verifikasi
              </button>

              <button
                type="button"
                onClick={handleResendVerificationEmail}
                disabled={isResendingEmail}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResendingEmail ? "Mengirim..." : "Kirim ulang email"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
            >
              Nanti
            </button>
          </div>
        </div>
      ) : null}

      <div className="relative flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-8">

        <div className="relative flex min-h-[720px] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:flex-row">

          {/* =========================================
              LEFT PANEL
          ========================================== */}

          <section className="relative flex w-full flex-col justify-center overflow-hidden px-8 py-12 sm:px-12 lg:w-1/2 lg:px-16">

            <div
              className="absolute inset-0"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(circle at 25% 15%, rgba(59,130,246,0.18), transparent 32%), radial-gradient(circle at 85% 80%, rgba(168,85,247,0.16), transparent 35%), linear-gradient(180deg, rgba(15,23,42,0.75), rgba(15,23,42,0.55))",
              }}
            />

            {/* Divider */}
            <div
              className="absolute right-0 top-10 hidden h-[calc(100%-80px)] w-px bg-gradient-to-b from-transparent via-white/10 to-transparent lg:block"
              aria-hidden="true"
            />

            <div className="relative z-10 flex flex-col items-center text-center">

              {/* =========================================
                  LOGO SMK N 2 PADANG
              ========================================== */}

              <div className="mb-7 flex h-40 w-40 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:h-48 sm:w-48">

                <img
                  src="/smkn2padang.png"
                  alt="Logo SMK N 2 Padang"
                  className="h-full w-full object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.35)]"
                />

              </div>

              {/* LABEL */}
              <div className="mb-4 flex items-center gap-2">

                <span className="h-px w-8 bg-sky-400/70" />

                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-sky-300">
                  SMK N 2 PADANG
                </p>

                <span className="h-px w-8 bg-violet-400/70" />

              </div>

              {/* TITLE */}
              <h1 className="max-w-lg text-4xl font-black tracking-tight text-white sm:text-5xl">
                Buat akun baru
              </h1>

              {/* DESCRIPTION */}
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-300 sm:text-base">
                Daftar sebagai siswa atau guru untuk mengakses
                materi, tugas, dan evaluasi pembelajaran secara
                interaktif.
              </p>

              {/* SLOGAN */}
              <div className="mt-8 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 backdrop-blur-md">

                <p className="text-xs font-medium tracking-wide text-slate-300">
                  Berilmu • Berkarakter • Berprestasi
                </p>

              </div>

              {/* SECURITY */}
              <div className="mt-10 flex items-center gap-3 text-xs text-slate-400">

                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-400/20 bg-sky-400/10 text-sky-300">

                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      d="M12 3l7 3v5c0 4.7-3 8-7 10-4-2-7-5.3-7-10V6l7-3Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <path
                      d="M9.5 12l1.7 1.7 3.6-4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                </div>

                <span>
                  Aman • Cepat • Terpercaya
                </span>

              </div>

            </div>

          </section>

          {/* =========================================
              RIGHT PANEL
          ========================================== */}

          <section className="relative flex w-full items-center bg-slate-950/55 px-6 py-10 sm:px-10 lg:w-1/2 lg:px-14">

            <div className="mx-auto w-full max-w-xl">

              {/* HEADER */}

              <div className="mb-7">

                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-slate-400">
                  Pendaftaran
                </p>

                <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Mulai perjalanan belajar Anda
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Lengkapi data berikut untuk membuat akun.
                </p>

              </div>

              {/* =========================================
                  ROLE SELECTOR
              ========================================== */}

              <div className="grid gap-3 sm:grid-cols-2">

                {(["siswa", "guru"] as const).map(
                  (entry) => {
                    const isActive = role === entry;

                    return (
                      <button
                        key={entry}
                        type="button"
                        onClick={() => {
                          setRole(entry);
                          setTeacherCode("");
                          setValidatedTeacherCodeId(null);
                          clearMessages();
                        }}
                        disabled={isSubmitting}
                        className={`group rounded-2xl border px-4 py-4 text-left transition-all duration-300 ${
                          isActive
                            ? "border-sky-400/70 bg-sky-500/10 shadow-[0_10px_35px_rgba(14,165,233,0.12)]"
                            : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >

                        <div className="flex items-center gap-3">

                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                              isActive
                                ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
                                : "border-white/10 bg-white/5 text-slate-400"
                            }`}
                          >

                            {entry === "guru" ? (
                              <svg
                                viewBox="0 0 24 24"
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                              >
                                <path
                                  d="M3 10h18M5 10v8m4-8v8m6-8v8m4-8v8M3 20h18M4 7l8-4 8 4v3H4V7Z"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : (
                              <svg
                                viewBox="0 0 24 24"
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                              >
                                <path
                                  d="M3 6.5 12 3l9 3.5L12 10 3 6.5Z"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />

                                <path
                                  d="M6 8.2V13c0 2 2.7 3.5 6 3.5s6-1.5 6-3.5V8.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />

                                <path
                                  d="M21 7v6"
                                  strokeLinecap="round"
                                />
                              </svg>
                            )}

                          </div>

                          <div>

                            <p className="text-sm font-bold text-white">
                              {entry === "guru"
                                ? "Guru"
                                : "Siswa"}
                            </p>

                            <p className="mt-1 text-[11px] leading-4 text-slate-400">
                              {entry === "guru"
                                ? "Mengelola materi dan evaluasi"
                                : "Mengikuti pembelajaran interaktif"}
                            </p>

                          </div>

                        </div>

                      </button>
                    );
                  }
                )}

              </div>

              {/* =========================================
                  FORM
              ========================================== */}

              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-4"
                noValidate
              >

                {/* TEACHER CODE (ONLY FOR GURU) */}

                {role === "guru" && (
                  <div>
                    <label
                      htmlFor="teacherCode"
                      className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-sky-300"
                    >
                      Kode Akses Guru
                    </label>

                    <div className="relative">
                      <input
                        id="teacherCode"
                        type="text"
                        value={teacherCode}
                        onChange={(event) => {
                          setTeacherCode(event.target.value.toUpperCase());
                          setValidatedTeacherCodeId(null); // Reset validasi saat user ubah kode
                          clearMessages();
                        }}
                        className="w-full rounded-2xl border border-sky-400/30 bg-sky-500/[0.05] px-4 py-3 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-400/60 focus:bg-sky-500/10 focus:ring-4 focus:ring-sky-400/20"
                        placeholder="Contoh: TEACHER-7K9X-2M4P"
                        autoComplete="off"
                        required
                        disabled={isSubmitting}
                      />

                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                        {validatedTeacherCodeId ? (
                          <div className="text-emerald-400">
                            <svg
                              viewBox="0 0 24 24"
                              className="h-5 w-5"
                              fill="currentColor"
                            >
                              <path d="m9 16.2-3.5-3.5a.75.75 0 0 0-1.06 1.06l4.03 4.03a.75.75 0 0 0 1.06 0l9.5-9.5a.75.75 0 1 0-1.06-1.06L9 16.2Z" />
                            </svg>
                          </div>
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4 text-sky-500"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          >
                            <path d="M12 3c-2.9 0-5.4 1.7-6.7 4.2a8 8 0 0 0 13.4 0C17.4 4.7 14.9 3 12 3Z" />
                            <circle cx="12" cy="14" r="6" />
                            <path d="M12 11v6" strokeLinecap="round" />
                          </svg>
                        )}
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] text-sky-200/70">
                      {validatedTeacherCodeId
                        ? "✓ Kode akses guru telah divalidasi"
                        : "Masukkan kode akses yang diberikan oleh administrator"}
                    </p>

                    {role === "guru" && !validatedTeacherCodeId && teacherCode && (
                      <div className="mt-2 rounded-xl border border-sky-400/20 bg-sky-500/[0.06] px-3 py-2">
                        <p className="text-[10px] text-sky-200">
                          💡 <strong>Tip:</strong> Klik tombol &quot;Buat Akun&quot; untuk memvalidasi kode akses guru Anda. Anda harus memvalidasi kode terlebih dahulu sebelum akun dapat dibuat.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* NAMA */}

                <div>

                  <label
                    htmlFor="name"
                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-300"
                  >
                    Nama lengkap
                  </label>

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      clearMessages();
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-400/60 focus:bg-white/[0.055] focus:ring-4 focus:ring-sky-400/10"
                    placeholder="Contoh: Raka Pratama"
                    autoComplete="name"
                    required
                    disabled={isSubmitting}
                  />

                </div>

                {/* EMAIL */}

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-300"
                  >
                    Email
                  </label>

                  <div className="relative">

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        clearMessages();
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-400/60 focus:bg-white/[0.055] focus:ring-4 focus:ring-sky-400/10"
                      placeholder="nama@email.com"
                      autoComplete="email"
                      required
                      disabled={isSubmitting}
                    />

                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">

                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="2"
                        />

                        <path d="m3 7 9 6 9-6" />
                      </svg>

                    </div>

                  </div>

                </div>

                {/* PASSWORD */}

                <div>

                  <label
                    htmlFor="password"
                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-300"
                  >
                    Password
                  </label>

                  <div className="relative">

                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        clearMessages();
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-400/60 focus:bg-white/[0.055] focus:ring-4 focus:ring-sky-400/10"
                      placeholder="Minimal 6 karakter"
                      autoComplete="new-password"
                      required
                      disabled={isSubmitting}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) => !value
                        )
                      }
                      disabled={isSubmitting}
                      className="absolute inset-y-0 right-3 flex items-center px-2 text-slate-500 transition hover:text-white disabled:cursor-not-allowed"
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                    >

                      {showPassword ? (
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          <path
                            d="M3 3l18 18"
                            strokeLinecap="round"
                          />

                          <path d="M10.6 10.6a2 2 0 1 0 2.8 2.8" />

                          <path
                            d="M9.1 5.1A11.2 11.2 0 0 1 12 4.5c4.3 0 7.9 2.6 9.7 6.2a12.3 12.3 0 0 1-2.2 3.3"
                            strokeLinecap="round"
                          />

                          <path
                            d="M6.4 7.9A12.2 12.2 0 0 0 2.3 10.7a11.9 11.9 0 0 0 4.4 4.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          <path d="M2 12s3.4-6 10-6 10 6 10 6-3.4 6-10 6S2 12 2 12Z" />

                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                          />
                        </svg>
                      )}

                    </button>

                  </div>

                  <p className="mt-2 text-[11px] text-slate-500">
                    Gunakan minimal 6 karakter.
                  </p>

                </div>

                {/* KONFIRMASI PASSWORD */}

                <div>

                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-300"
                  >
                    Konfirmasi password
                  </label>

                  <div className="relative">

                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(
                          event.target.value
                        );
                        clearMessages();
                      }}
                      className={`w-full rounded-2xl border px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:ring-4 ${
                        confirmPassword &&
                        password !== confirmPassword
                          ? "border-rose-400/50 bg-rose-500/[0.04] focus:border-rose-400/60 focus:ring-rose-400/10"
                          : confirmPassword &&
                              password === confirmPassword
                            ? "border-emerald-400/40 bg-emerald-500/[0.04] focus:border-emerald-400/60 focus:ring-emerald-400/10"
                            : "border-white/10 bg-white/[0.035] focus:border-sky-400/60 focus:bg-white/[0.055] focus:ring-sky-400/10"
                      }`}
                      placeholder="Ulangi password"
                      autoComplete="new-password"
                      required
                      disabled={isSubmitting}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (value) => !value
                        )
                      }
                      disabled={isSubmitting}
                      className="absolute inset-y-0 right-3 flex items-center px-2 text-slate-500 transition hover:text-white disabled:cursor-not-allowed"
                      aria-label={
                        showConfirmPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                    >

                      {showConfirmPassword ? (
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          <path
                            d="M3 3l18 18"
                            strokeLinecap="round"
                          />

                          <path d="M10.6 10.6a2 2 0 1 0 2.8 2.8" />

                          <path
                            d="M9.1 5.1A11.2 11.2 0 0 1 12 4.5c4.3 0 7.9 2.6 9.7 6.2a12.3 12.3 0 0 1-2.2 3.3"
                            strokeLinecap="round"
                          />

                          <path
                            d="M6.4 7.9A12.2 12.2 0 0 0 2.3 10.7a11.9 11.9 0 0 0 4.4 4.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          <path d="M2 12s3.4-6 10-6 10 6 10 6-3.4 6-10 6S2 12 2 12Z" />

                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                          />
                        </svg>
                      )}

                    </button>

                  </div>

                  {/* PASSWORD MATCH */}

                  {confirmPassword &&
                  password !== confirmPassword ? (
                    <p className="mt-2 text-xs text-rose-300">
                      Password belum cocok.
                    </p>
                  ) : confirmPassword &&
                    password === confirmPassword ? (
                    <p className="mt-2 text-xs text-emerald-300">
                      ✓ Password cocok.
                    </p>
                  ) : null}

                </div>

                {/* =========================================
                    ERROR
                ========================================== */}

                {error ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/[0.08] px-4 py-3">

                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">

                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path
                          d="M12 8v5"
                          strokeLinecap="round"
                        />

                        <path
                          d="M12 16.5v.1"
                          strokeLinecap="round"
                        />

                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                        />
                      </svg>

                    </div>

                    <p className="text-sm leading-6 text-rose-200">
                      {error}
                    </p>

                  </div>
                ) : null}

                {/* =========================================
                    SUCCESS
                ========================================== */}

                {success ? (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.08] p-4">

                    <div className="flex items-start gap-3">

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">

                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="m5 12 4 4L19 6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>

                      </div>

                      <div>

                        <p className="text-sm font-semibold text-emerald-200">
                          Pendaftaran berhasil!
                        </p>

                        <p className="mt-1 text-xs leading-5 text-emerald-100/70">
                          {success}
                        </p>

                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="mt-4 w-full rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15"
                    >
                      Masuk ke halaman login
                    </button>

                  </div>
                ) : null}

                {/* =========================================
                    SUBMIT BUTTON
                ========================================== */}

                {!success ? (
                  <button
                    type="submit"
                    disabled={
                      isSubmitting || cooldown > 0
                    }
                    className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-4 py-3.5 text-sm font-bold text-white shadow-[0_15px_40px_rgba(59,130,246,0.20)] transition-all duration-300 hover:-translate-y-0.5 hover:from-sky-400 hover:via-indigo-400 hover:to-violet-400 hover:shadow-[0_20px_50px_rgba(99,102,241,0.30)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
                  >

                    <span className="relative z-10 flex items-center justify-center gap-2">

                      {isSubmitting ? (
                        <>
                          <svg
                            className="h-4 w-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="9"
                              className="opacity-30"
                              stroke="currentColor"
                              strokeWidth="3"
                            />

                            <path
                              d="M21 12a9 9 0 0 0-9-9"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          </svg>

                          Membuat akun...
                        </>
                      ) : cooldown > 0 ? (
                        <>
                          Tunggu {cooldown} detik...
                        </>
                      ) : (
                        <>
                          Buat akun

                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4 transition-transform group-hover:translate-x-1"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              d="M5 12h14"
                              strokeLinecap="round"
                            />

                            <path
                              d="m13 6 6 6-6 6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </>
                      )}

                    </span>

                  </button>
                ) : null}

              </form>

              {/* =========================================
                  LOGIN LINK
              ========================================== */}

              <div className="mt-6 text-center text-sm text-slate-400">

                <span>
                  Sudah punya akun?{" "}
                </span>

                <Link
                  href="/"
                  className="font-bold text-sky-300 transition hover:text-white"
                >
                  Masuk sekarang
                </Link>

              </div>

              {/* =========================================
                  FOOTER
              ========================================== */}

              <div className="mt-8 text-center">

                <p className="text-[10px] tracking-wide text-slate-600">
                  © {new Date().getFullYear()} SMK N 2 Padang
                </p>

              </div>

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}