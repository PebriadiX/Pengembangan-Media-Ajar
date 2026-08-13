"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AUTH_SESSION_KEY } from "@/app/components/AuthGate";
import { loadUserProfileFromSupabase, saveUserProfileToSupabase } from "@/app/lib/supabase-service";

type SessionProfile = {
  name: string;
  email: string;
  role: "guru" | "siswa";
};

type SiswaProfileData = {
  id: string;
  kelas: string;
  kontak: string;
  wali: string;
};

const STORAGE_KEY = "siswa-profile-data-v1";

export default function SiswaProfilePage() {
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<SiswaProfileData>({
    id: "2024-015",
    kelas: "XI Web Development",
    kontak: "+62 812-9988-1122",
    wali: "Ibu Dewi",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadProfileData = async () => {
      try {
        const stored = window.localStorage.getItem(AUTH_SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as SessionProfile;
          setProfile(parsed);

          const supabaseProfile = await loadUserProfileFromSupabase(parsed.email);
          if (supabaseProfile?.profileData) {
            const mergedData = {
              id: (supabaseProfile.profileData.id as string) ?? formData.id,
              kelas: (supabaseProfile.profileData.kelas as string) ?? formData.kelas,
              kontak: (supabaseProfile.profileData.kontak as string) ?? formData.kontak,
              wali: (supabaseProfile.profileData.wali as string) ?? formData.wali,
            };
            setFormData(mergedData);
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedData));
          }
        }
      } catch {
        setProfile(null);
      }

      try {
        const storedProfile = window.localStorage.getItem(STORAGE_KEY);
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile) as SiswaProfileData;
          setFormData(parsed);
        }
      } catch {
        // Ignore invalid local profile data.
      }
    };

    void loadProfileData();
  }, []);

  const currentRole = profile?.role ?? "siswa";
  const displayName = profile?.name ?? "Raka Pratama";
  const displayEmail = profile?.email ?? "siswa@mediapembelajaran.com";

  const [statusMessage, setStatusMessage] = useState("");

  const handleSave = async () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }

    const payload = {
      id: profile?.email ?? "siswa@mediapembelajaran.com",
      role: "siswa" as const,
      name: profile?.name ?? displayName,
      email: profile?.email ?? displayEmail,
      profileData: formData,
    };

    const saved = await saveUserProfileToSupabase(payload);
    setStatusMessage(saved ? "Profil siswa berhasil disimpan ke Supabase." : "Profil siswa disimpan di browser, tetapi Supabase belum siap.");
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-500">Biodata Siswa</p>
            <h1 className="mt-2 text-3xl font-black">Profil peserta didik resmi</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Halaman ini memuat data utama siswa, status belajar, dan capaian yang sedang dicapai.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isEditing ? "Batal" : "Edit Profil"}
            </button>
            <Link href="/profile" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Kembali ke profil
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-600 text-2xl font-black text-white">
                {displayName[0] ?? "S"}
              </div>
              <div>
                <p className="text-xl font-extrabold">{displayName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{displayEmail}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                    {currentRole === "siswa" ? "Peserta Didik" : "Pengguna Terdaftar"}
                  </span>
                  <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-200">
                    Sedang Aktif
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
              <p className="font-semibold text-slate-700 dark:text-slate-300">Foto profil</p>
              <p className="mt-1">Avatar default sedang digunakan. Data profil dapat diperbarui langsung dari tombol edit di atas.</p>
            </div>

            {statusMessage ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                {statusMessage}
              </div>
            ) : null}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {isEditing ? (
                <>
                  <label className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="mb-2 block font-semibold text-slate-700 dark:text-slate-300">NIS / ID</span>
                    <input
                      value={formData.id}
                      onChange={(event) => setFormData((prev) => ({ ...prev, id: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                  <label className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="mb-2 block font-semibold text-slate-700 dark:text-slate-300">Kelas</span>
                    <input
                      value={formData.kelas}
                      onChange={(event) => setFormData((prev) => ({ ...prev, kelas: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                  <label className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="mb-2 block font-semibold text-slate-700 dark:text-slate-300">Kontak</span>
                    <input
                      value={formData.kontak}
                      onChange={(event) => setFormData((prev) => ({ ...prev, kontak: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                  <label className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="mb-2 block font-semibold text-slate-700 dark:text-slate-300">Wali</span>
                    <input
                      value={formData.wali}
                      onChange={(event) => setFormData((prev) => ({ ...prev, wali: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">NIS / ID</p>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">{formData.id}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Kelas</p>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">{formData.kelas}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Kontak</p>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">{formData.kontak}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Wali</p>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">{formData.wali}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <p className="text-sm font-semibold text-emerald-500">Status pembelajaran</p>
              <h2 className="mt-1 text-xl font-extrabold">Kegiatan belajar saat ini</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="font-semibold text-slate-900 dark:text-white">Materi selesai</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">8 materi telah dibuka dan dipelajari.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="font-semibold text-slate-900 dark:text-white">Tugas terkumpul</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">3 dari 4 tugas sudah dikumpulkan.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="font-semibold text-slate-900 dark:text-white">Evaluasi</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Skor evaluasi terakhir 84 poin.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="font-semibold text-slate-900 dark:text-white">Aktivitas terakhir</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Mengakses materi video 15 menit yang lalu.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <p className="font-semibold text-slate-900 dark:text-white">Target belajar</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Mahir Next.js', 'Menyelesaikan tugas', 'Meningkatkan evaluasi', 'Aktif di kelas'].map((goal) => (
                  <span key={goal} className="rounded-full bg-white px-3 py-1 text-sm text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
