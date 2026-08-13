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

type GuruProfileData = {
  id: string;
  bidang: string;
  kontak: string;
  alamat: string;
};

const STORAGE_KEY = "guru-profile-data-v1";

export default function GuruProfilePage() {
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<GuruProfileData>({
    id: "2024-001",
    bidang: "Pengembangan Web & UI",
    kontak: "+62 812-3456-7890",
    alamat: "Bandung, Jawa Barat",
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
              bidang: (supabaseProfile.profileData.bidang as string) ?? formData.bidang,
              kontak: (supabaseProfile.profileData.kontak as string) ?? formData.kontak,
              alamat: (supabaseProfile.profileData.alamat as string) ?? formData.alamat,
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
          const parsed = JSON.parse(storedProfile) as GuruProfileData;
          setFormData(parsed);
        }
      } catch {
        // Ignore invalid local profile data.
      }
    };

    void loadProfileData();
  }, []);

  const currentRole = profile?.role ?? "guru";
  const displayName = profile?.name ?? "Bu Sari";
  const displayEmail = profile?.email ?? "guru@mediapembelajaran.com";

  const [statusMessage, setStatusMessage] = useState("");

  const handleSave = async () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }

    const payload = {
      id: profile?.email ?? "guru@mediapembelajaran.com",
      role: "guru" as const,
      name: profile?.name ?? displayName,
      email: profile?.email ?? displayEmail,
      profileData: formData,
    };

    const saved = await saveUserProfileToSupabase(payload);
    setStatusMessage(saved ? "Profil guru berhasil disimpan ke Supabase." : "Profil guru disimpan di browser, tetapi Supabase belum siap.");
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-500">Biodata Guru</p>
            <h1 className="mt-2 text-3xl font-black">Profil pengajar resmi</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Halaman ini menampilkan identitas pengajar, tanggung jawab, dan fokus pembelajaran yang dibina.
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
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-2xl font-black text-white">
                {displayName[0] ?? "G"}
              </div>
              <div>
                <p className="text-xl font-extrabold">{displayName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{displayEmail}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                    {currentRole === "guru" ? "Guru Pengampu" : "Pengguna Terdaftar"}
                  </span>
                  <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                    Aktif Online
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
              <p className="font-semibold text-slate-700 dark:text-slate-300">Foto profil</p>
              <p className="mt-1">Avatar default sedang digunakan. Anda dapat mengubah data profil di bawah ini untuk menyesuaikan identitas akun.</p>
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
                    <span className="mb-2 block font-semibold text-slate-700 dark:text-slate-300">ID</span>
                    <input
                      value={formData.id}
                      onChange={(event) => setFormData((prev) => ({ ...prev, id: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                  <label className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="mb-2 block font-semibold text-slate-700 dark:text-slate-300">Bidang</span>
                    <input
                      value={formData.bidang}
                      onChange={(event) => setFormData((prev) => ({ ...prev, bidang: event.target.value }))}
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
                    <span className="mb-2 block font-semibold text-slate-700 dark:text-slate-300">Alamat</span>
                    <input
                      value={formData.alamat}
                      onChange={(event) => setFormData((prev) => ({ ...prev, alamat: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">NIP / ID</p>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">{formData.id}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Bidang</p>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">{formData.bidang}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Kontak</p>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">{formData.kontak}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Alamat</p>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">{formData.alamat}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <p className="text-sm font-semibold text-indigo-500">Tanggung jawab utama</p>
              <h2 className="mt-1 text-xl font-extrabold">Peran aktif dalam kelas</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="font-semibold text-slate-900 dark:text-white">Mengajar materi</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Menyusun dan menyampaikan slide, video, dan tugas pembelajaran.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="font-semibold text-slate-900 dark:text-white">Mengevaluasi siswa</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Melihat hasil penilaian dan memantau perkembangan belajar peserta didik.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="font-semibold text-slate-900 dark:text-white">Mengelola kelas</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Menjaga kegiatan kelas tetap teratur, terarah, dan interaktif.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="font-semibold text-slate-900 dark:text-white">Memberi dukungan</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Membantu siswa memahami materi dan mengatasi hambatan belajar.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <p className="font-semibold text-slate-900 dark:text-white">Keahlian utama</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Next.js', 'UI/UX', 'Tailwind', 'Evaluasi Belajar', 'Kelas Interaktif'].map((skill) => (
                  <span key={skill} className="rounded-full bg-white px-3 py-1 text-sm text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                    {skill}
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
