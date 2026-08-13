"use client";

import { useEffect, useMemo, useState } from "react";
import type { AssignmentItem } from "@/app/lib/data";
import { saveAssignmentSubmissionToSupabase } from "@/app/lib/supabase-service";

type NotificationPayload = {
  title: string;
  message: string;
  category: "tugas" | "evaluasi" | "sistem";
  target: "guru" | "siswa" | "all";
};

type AssignmentSectionProps = {
  assignments: AssignmentItem[];
  onNotify?: (payload: NotificationPayload) => void;
  onProgressUpdate?: (delta: number) => void;
};

export function AssignmentSection({ assignments, onNotify, onProgressUpdate }: AssignmentSectionProps) {
  const [codeDrafts, setCodeDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(assignments.map((assignment) => [assignment.id, assignment.starterCode]))
  );
  const [submittedCodes, setSubmittedCodes] = useState<Record<string, string>>({});
  const [statusMessages, setStatusMessages] = useState<Record<string, string>>({});
  const [submissionHistory, setSubmissionHistory] = useState<Record<string, Array<{ code: string; submittedAt: string }>>>({});
  const [expandedAssignments, setExpandedAssignments] = useState<Record<string, boolean>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem("assignment-code-snapshots");
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, unknown>;
        const normalizedSubmittedCodes: Record<string, string> = {};
        const normalizedHistory: Record<string, Array<{ code: string; submittedAt: string }>> = {};

        Object.entries(parsed).forEach(([assignmentId, value]) => {
          if (typeof value === "string") {
            normalizedSubmittedCodes[assignmentId] = value;
            normalizedHistory[assignmentId] = [
              {
                code: value,
                submittedAt: "Disimpan dari sesi sebelumnya",
              },
            ];
            return;
          }

          if (Array.isArray(value)) {
            const entries = value
              .filter((item): item is { code: string; submittedAt?: string } => Boolean(item) && typeof item === "object" && "code" in item && typeof (item as { code?: unknown }).code === "string")
              .map((item) => ({
                code: item.code,
                submittedAt: item.submittedAt ?? "Disimpan dari sesi sebelumnya",
              }));

            if (entries.length > 0) {
              normalizedSubmittedCodes[assignmentId] = entries[entries.length - 1].code;
              normalizedHistory[assignmentId] = entries;
            }
            return;
          }

          if (value && typeof value === "object" && "code" in value && typeof (value as { code?: unknown }).code === "string") {
            const candidate = value as { code: string; submittedAt?: string };
            normalizedSubmittedCodes[assignmentId] = candidate.code;
            normalizedHistory[assignmentId] = [
              {
                code: candidate.code,
                submittedAt: candidate.submittedAt ?? "Disimpan dari sesi sebelumnya",
              },
            ];
          }
        });

        setSubmittedCodes(normalizedSubmittedCodes);
        setSubmissionHistory(normalizedHistory);
      }
    } catch {
      // Ignore invalid local storage data.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const payload = Object.fromEntries(
      Object.entries(submissionHistory).map(([assignmentId, entries]) => [assignmentId, entries])
    );

    window.localStorage.setItem("assignment-code-snapshots", JSON.stringify(payload));
  }, [submissionHistory]);

  const previewMarkup = useMemo(() => {
    return (code: string) => `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>body{margin:0;padding:0;background:#fff;}</style>
  </head>
  <body>${code}</body>
</html>`;
  }, []);

  const handleRun = (assignmentId: string) => {
    const nextCode = codeDrafts[assignmentId] ?? "";
    onProgressUpdate?.(1);
    setSubmittedCodes((prev) => ({ ...prev, [assignmentId]: nextCode }));
    setStatusMessages((prev) => ({ ...prev, [assignmentId]: "Preview diperbarui." }));
  };

  const handleSubmit = async (assignmentId: string) => {
    const nextCode = codeDrafts[assignmentId] ?? "";
    const submittedAt = new Date().toISOString();
    const studentName =
      (typeof window !== "undefined" && window.localStorage.getItem("media-login-session-v1"))
        ? JSON.parse(window.localStorage.getItem("media-login-session-v1") ?? "{}").name ?? "Pengguna"
        : "Pengguna";

    setSubmittedCodes((prev) => ({ ...prev, [assignmentId]: nextCode }));
    setSubmissionHistory((prev) => ({
      ...prev,
      [assignmentId]: [
        ...(prev[assignmentId] ?? []),
        {
          code: nextCode,
          submittedAt: new Date(submittedAt).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ],
    }));

    await saveAssignmentSubmissionToSupabase({
      assignmentId,
      studentName,
      code: nextCode,
      submittedAt,
      status: "submitted",
    });

    const assignmentTitle = assignments.find((item) => item.id === assignmentId)?.title ?? "tugas";
    onNotify?.({
      title: "Tugas baru masuk",
      message: `${studentName} mengirim hasil tugas untuk "${assignmentTitle}".`,
      category: "tugas",
      target: "guru",
    });
    onNotify?.({
      title: "Tugas berhasil dikirim",
      message: `Jawaban Anda untuk "${assignmentTitle}" telah diterima dan sedang menunggu tinjauan guru.`,
      category: "tugas",
      target: "siswa",
    });

    onProgressUpdate?.(6);
    setStatusMessages((prev) => ({ ...prev, [assignmentId]: "Hasil tugas berhasil dikirim dan siap dipantau." }));
  };

  const handleReset = (assignmentId: string) => {
    const starterCode = assignments.find((item) => item.id === assignmentId)?.starterCode ?? "";
    setCodeDrafts((prev) => ({ ...prev, [assignmentId]: starterCode }));
    setSubmittedCodes((prev) => ({ ...prev, [assignmentId]: starterCode }));
    setSubmissionHistory((prev) => ({
      ...prev,
      [assignmentId]: [
        ...(prev[assignmentId] ?? []),
        {
          code: starterCode,
          submittedAt: "Dikembalikan ke contoh awal",
        },
      ],
    }));
    setStatusMessages((prev) => ({ ...prev, [assignmentId]: "Kode dikembalikan ke contoh awal." }));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {assignments.map((assignment) => {
        const currentCode = codeDrafts[assignment.id] ?? assignment.starterCode;
        const previewCode = submittedCodes[assignment.id] ?? assignment.starterCode;
        const statusMessage = statusMessages[assignment.id];
        const lastSubmission = submissionHistory[assignment.id]?.[submissionHistory[assignment.id].length - 1];
        const hasHistory = (submissionHistory[assignment.id]?.length ?? 0) > 0;
        const isExpanded = expandedAssignments[assignment.id] ?? false;

        return (
          <article
            key={assignment.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                {assignment.badge}
              </span>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Live Coding</span>
            </div>

            <h3 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">{assignment.title}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{assignment.description}</p>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950/70">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Instruksi</p>
                <button
                  type="button"
                  onClick={() => setShowHints((prev) => ({ ...prev, [assignment.id]: !prev[assignment.id] }))}
                  className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400"
                >
                  {showHints[assignment.id] ? "Sembunyikan petunjuk" : "Buka petunjuk"}
                </button>
              </div>
              <ul className="mt-2 space-y-1 text-slate-500 dark:text-slate-400">
                {assignment.instructions.map((instruction, instructionIndex) => (
                  <li key={`${assignment.id}-${instructionIndex}-${instruction}`} className="flex gap-2">
                    <span>•</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
              {showHints[assignment.id] ? (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                  Tip: coba tambahkan elemen interaktif seperti tombol hover, kartu status, atau warna yang berubah saat diklik untuk membuat hasil tugas terasa lebih hidup.
                </div>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Editor kode
                </label>
                <textarea
                  value={currentCode}
                  onChange={(event) =>
                    setCodeDrafts((prev) => ({ ...prev, [assignment.id]: event.target.value }))
                  }
                  spellCheck={false}
                  className="min-h-[220px] w-full rounded-2xl border border-slate-200 bg-slate-950 p-3 font-mono text-sm text-slate-100 outline-none dark:border-slate-700"
                />
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleRun(assignment.id)}
                    className="w-full rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:w-auto"
                  >
                    Jalankan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(assignment.id)}
                    className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
                  >
                    Kirim Hasil
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReset(assignment.id)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Reset
                  </button>
                </div>
                {statusMessage ? (
                  <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {statusMessage}
                  </p>
                ) : null}

                {lastSubmission ? (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-300">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Terakhir dikirim
                      </p>
                      {hasHistory ? (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedAssignments((prev) => ({ ...prev, [assignment.id]: !prev[assignment.id] }))
                          }
                          className="text-[11px] font-semibold text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400"
                        >
                          {isExpanded ? "Sembunyikan" : "Lihat semua"}
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {lastSubmission.submittedAt}
                    </p>
                    <pre className="mt-2 max-h-20 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] text-slate-700 dark:text-slate-200">
                      {lastSubmission.code.slice(0, 220) || "(kosong)"}
                    </pre>
                    {isExpanded && hasHistory ? (
                      <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                        {submissionHistory[assignment.id]?.map((entry, index) => (
                          <div key={`${assignment.id}-${index}`} className="rounded-xl bg-slate-50 p-2 dark:bg-slate-900/70">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                              {entry.submittedAt}
                            </p>
                            <pre className="mt-1 max-h-16 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[10px] text-slate-700 dark:text-slate-200">
                              {entry.code.slice(0, 180) || "(kosong)"}
                            </pre>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Hasil Preview
                  </label>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Live result</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner dark:border-slate-700 dark:bg-slate-950">
                  <iframe
                    title={`Preview ${assignment.title}`}
                    sandbox="allow-scripts"
                    srcDoc={previewMarkup(previewCode)}
                    className="h-[260px] w-full"
                  />
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
