"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AUTH_SESSION_KEY } from "@/app/components/AuthGate";
import {
  loadAssignmentSubmissionsFromSupabase,
  loadEvaluationResultsFromSupabase,
  loadPlatformContentFromSupabase,
  loadProfilesFromSupabase,
  loadUsersFromSupabase,
  type AssignmentSubmissionItem,
  type EvaluationResultItem,
  type ProfileRowItem,
  type UserRowPayload,
} from "@/app/lib/supabase-service";
import UploadMaterial from "@/app/components/UploadMaterial";

export default function AdminPage() {
  const [users, setUsers] = useState<UserRowPayload[]>([]);
  const [profiles, setProfiles] = useState<ProfileRowItem[]>([]);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResultItem[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmissionItem[]>([]);
  const [assignments, setAssignments] = useState<Array<{ id: string; title: string; description: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (typeof window === "undefined") return;

      const storedSession = window.localStorage.getItem(AUTH_SESSION_KEY);
      if (!storedSession) {
        setAccessDenied(true);
        setIsLoading(false);
        return;
      }

      try {
        const parsedSession = storedSession ? JSON.parse(storedSession) : null;
        const role = parsedSession?.role;

        if (role !== "guru") {
          setAccessDenied(true);
          setIsLoading(false);
          return;
        }

        const [usersData, profilesData, resultsData, submissionsData, platformContent] = await Promise.all([
          loadUsersFromSupabase(),
          loadProfilesFromSupabase(),
          loadEvaluationResultsFromSupabase(),
          loadAssignmentSubmissionsFromSupabase(),
          loadPlatformContentFromSupabase(),
        ]);

        setUsers(usersData);
        setProfiles(profilesData);
        setEvaluationResults(resultsData);
        setSubmissions(submissionsData);
        setAssignments(platformContent?.assignments ?? []);
      } catch {
        setAccessDenied(true);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">Panel Guru</p>
              <h1 className="mt-2 text-3xl font-black">Admin / Monitoring Supabase</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Halaman ini berfungsi sebagai pusat admin untuk guru agar bisa melihat pengguna, profil, hasil evaluasi, dan jawaban tugas dari database.
              </p>
            </div>
            <Link href="/" className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">
              Kembali ke aplikasi
            </Link>
          </div>
        </div>

        {accessDenied ? (
          <div className="rounded-3xl border border-rose-800 bg-rose-950/40 p-10 text-center text-sm text-rose-200">
            Akses ditolak. Hanya akun guru yang bisa membuka panel admin.
          </div>
        ) : isLoading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center text-sm text-slate-400">
            Memuat data dari Supabase...
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            <UploadMaterial />
            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-sky-400">Pengguna & Profil</p>
                  <h2 className="mt-1 text-xl font-bold">Daftar akun terdaftar</h2>
                </div>
                <span className="rounded-full bg-sky-500/10 px-3 py-1 text-sm font-semibold text-sky-300">
                  {users.length} akun
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                      <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-semibold uppercase text-violet-300">
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-400">Profil pengguna</p>
                  <h2 className="mt-1 text-xl font-bold">Data profile lengkap</h2>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                  {profiles.length} profil
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {profiles.map((profile) => (
                  <div key={profile.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white">{profile.name}</p>
                        <p className="text-xs text-slate-400">{profile.email}</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold uppercase text-emerald-300">
                        {profile.role}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Terakhir diperbarui: {new Date(profile.updated_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Hasil evaluasi moved to dedicated page: /admin/hasil-evaluasi */}

            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-400">Jawaban tugas</p>
                  <h2 className="mt-1 text-xl font-bold">Pengumpulan tugas siswa</h2>
                </div>
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-300">
                  {submissions.length} kiriman
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {submissions.map((submission) => {
                  const assignmentTitle = assignments.find((item) => item.id === submission.assignment_id)?.title ?? submission.assignment_id;
                  const statusLabel = submission.status === "approved" ? "Diterima" : submission.status === "rejected" ? "Ditolak" : "Menunggu";

                  return (
                    <div key={submission.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white">{submission.student_name}</p>
                          <p className="text-xs text-slate-400">Tugas: {assignmentTitle}</p>
                        </div>
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                          {statusLabel}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{new Date(submission.submitted_at).toLocaleString("id-ID")}</p>
                      <pre className="mt-2 max-h-24 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-slate-800/70 p-2 font-mono text-[11px] text-slate-200">
                        {submission.code.slice(0, 220) || "(kosong)"}
                      </pre>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
