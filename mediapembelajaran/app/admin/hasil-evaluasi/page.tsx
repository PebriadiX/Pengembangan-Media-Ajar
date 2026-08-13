"use client";

import React, { useMemo, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faDownload,
  faEye,
  faArrowDownAZ,
  faArrowUpZA,
  faTrash,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import type { EvaluationResultItem } from "@/app/lib/supabase-service";
import { loadEvaluationResultsFromSupabase } from "@/app/lib/supabase-service";

/**
 * Data contoh.
 *
 * FIX:
 * EvaluationResultItem sekarang membutuhkan properti "answers",
 * sehingga setiap data contoh harus memiliki answers: [].
 */
const sampleData: EvaluationResultItem[] = [
  {
    id: 1,
    student_id: "s1",
    student_name: "Andi S.",
    score: 92,
    submitted_at: "2026-07-26T22:42:54.000Z",
    answers: [],
  },
  {
    id: 2,
    student_id: "s2",
    student_name: "Budi R.",
    score: 78,
    submitted_at: "2026-07-25T22:42:54.000Z",
    answers: [],
  },
  {
    id: 3,
    student_id: "s3",
    student_name: "Citra L.",
    score: 85,
    submitted_at: "2026-07-24T22:42:54.000Z",
    answers: [],
  },
];

const ScoreChart: React.FC<{
  data: EvaluationResultItem[];
  height?: number;
  width?: number;
}> = ({ data, height = 120, width = 560 }) => {
  const points = [...data]
    .sort(
      (a, b) =>
        new Date(a.submitted_at).getTime() -
        new Date(b.submitted_at).getTime(),
    )
    .slice(-20);

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
        Belum ada data grafik
      </div>
    );
  }

  const n = points.length;
  const pad = 12;
  const w = width;
  const h = height;
  const minY = 0;
  const maxY = 100;
  const xStep = n > 1 ? (w - pad * 2) / (n - 1) : 0;

  const xy = points.map((p, i) => {
    const x = pad + i * xStep;
    const y =
      pad +
      (1 - ((p.score ?? 0) - minY) / (maxY - minY)) *
        (h - pad * 2);

    return {
      x,
      y,
      score: p.score ?? 0,
      date: p.submitted_at,
    };
  });

  const pathD = xy
    .map(
      (pt, i) =>
        `${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`,
    )
    .join(" ");

  const areaD = `${pathD} L ${
    pad + (n - 1) * xStep
  } ${h - pad} L ${pad} ${h - pad} Z`;

  const avg = Math.round(
    points.reduce((s, p) => s + (p.score ?? 0), 0) / points.length,
  );

  const passRate = Math.round(
    (points.filter((p) => (p.score ?? 0) >= 75).length /
      points.length) *
      100,
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">
            Skor Per-Submission (terakhir)
          </p>
          <p className="text-lg font-bold">
            Rata-rata {avg}% • Lulus {passRate}%
          </p>
        </div>

        <div className="text-xs text-slate-400">
          Terakhir {points.length} entri
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          width={Math.min(w, 800)}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          className="block"
        >
          <defs>
            <linearGradient
              id="g1"
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#7c3aed"
                stopOpacity="0.65"
              />
              <stop
                offset="100%"
                stopColor="#4f46e5"
                stopOpacity="0.05"
              />
            </linearGradient>

            <linearGradient
              id="gLine"
              x1="0"
              x2="1"
              y1="0"
              y2="0"
            >
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>

          <path d={areaD} fill="url(#g1)" />

          <path
            d={pathD}
            fill="none"
            stroke="url(#gLine)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {xy.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={3.5}
              fill="#fff"
              stroke="#7c3aed"
              strokeWidth={1.5}
            />
          ))}
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <div className="text-xs text-slate-500">Rata-rata</div>
          <div className="text-lg font-bold">{avg}%</div>
        </div>

        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <div className="text-xs text-slate-500">
            Lulus (&gt;=75)
          </div>
          <div className="text-lg font-bold">{passRate}%</div>
        </div>
      </div>
    </div>
  );
};

export default function Page() {
  const [results, setResults] =
    useState<EvaluationResultItem[]>(sampleData);

  const [mounted, setMounted] = useState(false);

  const [selected, setSelected] =
    useState<EvaluationResultItem | null>(null);

  const [isViewOpen, setIsViewOpen] = useState(false);

  const [editing, setEditing] =
    useState<EvaluationResultItem | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);

  const [toDelete, setToDelete] =
    useState<EvaluationResultItem | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  /**
   * Simpan perubahan ke localStorage.
   */
  useEffect(() => {
    try {
      if (mounted) {
        localStorage.setItem(
          "__eval_results",
          JSON.stringify(results),
        );
      }
    } catch {
      // ignore
    }
  }, [results, mounted]);

  /**
   * Load data dari Supabase setelah client mounted.
   */
  useEffect(() => {
    setMounted(true);

    const loadResults = async () => {
      try {
        const supabaseResults =
          await loadEvaluationResultsFromSupabase();

        if (supabaseResults && supabaseResults.length > 0) {
          setResults(supabaseResults);

          if (typeof window !== "undefined") {
            localStorage.setItem(
              "__eval_results",
              JSON.stringify(supabaseResults),
            );
          }

          return;
        }

        /**
         * Jika Supabase kosong, gunakan localStorage.
         */
        if (typeof window !== "undefined") {
          const stored =
            localStorage.getItem("__eval_results");

          if (stored) {
            setResults(
              JSON.parse(stored) as EvaluationResultItem[],
            );
          }
        }
      } catch {
        /**
         * Jika Supabase gagal, coba localStorage.
         */
        try {
          if (typeof window !== "undefined") {
            const stored =
              localStorage.getItem("__eval_results");

            if (stored) {
              setResults(
                JSON.parse(stored) as EvaluationResultItem[],
              );
            }
          }
        } catch {
          // ignore
        }
      }
    };

    void loadResults();
  }, []);

  const [query, setQuery] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [sortDir, setSortDir] =
    useState<"desc" | "asc">("desc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return results
      .filter(
        (r) =>
          (r.student_name || "")
            .toLowerCase()
            .includes(q) &&
          (r.score ?? 0) >= minScore,
      )
      .sort((a, b) =>
        sortDir === "desc"
          ? (b.score ?? 0) - (a.score ?? 0)
          : (a.score ?? 0) - (b.score ?? 0),
      );
  }, [results, query, minScore, sortDir]);

  const formatDateUTC = (iso?: string) => {
    if (!iso) return "-";

    const d = new Date(iso);

    const pad = (n: number) =>
      n.toString().padStart(2, "0");

    return `${pad(
      d.getUTCDate(),
    )}/${pad(
      d.getUTCMonth() + 1,
    )}/${d.getUTCFullYear()}, ${pad(
      d.getUTCHours(),
    )}:${pad(
      d.getUTCMinutes(),
    )}:${pad(d.getUTCSeconds())}`;
  };

  const exportCSV = () => {
    const csvHeader = "Nama Siswa,Skor,Tanggal";

    const csvRows = filtered.map(
      (r) =>
        `${r.student_name},${r.score},${formatDateUTC(
          r.submitted_at,
        )}`,
    );

    const csv = [csvHeader, ...csvRows].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "hasil-evaluasi.csv";

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  if (!mounted) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-sm text-slate-500">
          Memuat hasil evaluasi…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="rounded-3xl bg-gradient-to-br from-violet-700 to-indigo-700 py-10 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest">
                Hasil Evaluasi
              </p>

              <h1 className="mt-2 text-2xl font-extrabold">
                Ringkasan Hasil & Analitik
              </h1>

              <p className="mt-1 text-sm text-violet-100/90">
                Lihat performa siswa secara detil, filter,
                dan ekspor hasil.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportCSV}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/20"
              >
                <FontAwesomeIcon
                  icon={faDownload}
                  className="mr-2"
                />
                Ekspor CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 font-bold text-white">
              A
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total Hasil
              </p>

              <p className="mt-1 text-xl font-bold">
                {results.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rata-rata Skor
          </p>

          <p className="mt-2 text-2xl font-bold">
            {Math.round(
              results.reduce(
                (s, r) => s + (r.score ?? 0),
                0,
              ) /
                Math.max(1, results.length),
            )}
            %
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Terbaik
          </p>

          <p className="mt-2 text-2xl font-bold">
            {results.length
              ? results.reduce((a, b) =>
                  a.score > b.score ? a : b,
                ).student_name
              : "-"}
          </p>
        </div>
      </div>

      {/* CHART */}
      <div className="mt-6">
        <ScoreChart data={results} />
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex w-full max-w-xl items-center gap-3">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                placeholder="Cari nama siswa..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
              />

              <FontAwesomeIcon
                icon={faSearch}
                className="absolute right-3 top-3 text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={minScore}
                onChange={(e) =>
                  setMinScore(Number(e.target.value))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value={0}>Semua Skor</option>
                <option value={60}>&gt;= 60</option>
                <option value={70}>&gt;= 70</option>
                <option value={80}>&gt;= 80</option>
                <option value={90}>&gt;= 90</option>
              </select>

              <button
                onClick={() =>
                  setSortDir((s) =>
                    s === "desc" ? "asc" : "desc",
                  )
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <FontAwesomeIcon
                  icon={
                    sortDir === "desc"
                      ? faArrowDownAZ
                      : faArrowUpZA
                  }
                />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left text-sm text-slate-500">
                <th className="px-3 py-2">
                  Nama
                </th>

                <th className="px-3 py-2">
                  Skor
                </th>

                <th className="px-3 py-2">
                  Tanggal
                </th>

                <th className="px-3 py-2">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-slate-100 dark:border-slate-800"
                >
                  <td className="px-3 py-3 font-medium text-slate-900">
                    {r.student_name}
                  </td>

                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                        r.score >= 90
                          ? "bg-emerald-100 text-emerald-700"
                          : r.score >= 75
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {r.score}%
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    {formatDateUTC(
                      r.submitted_at,
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelected(r);
                          setIsViewOpen(true);
                        }}
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-xs text-white"
                      >
                        <FontAwesomeIcon
                          icon={faEye}
                        />{" "}
                        Lihat
                      </button>

                      <button
                        onClick={() => {
                          setEditing(r);
                          setIsEditOpen(true);
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => {
                          setToDelete(r);
                          setIsDeleteOpen(true);
                        }}
                        className="rounded-lg bg-rose-600 px-3 py-2 text-xs text-white"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-sm text-slate-500"
                  >
                    Tidak ada hasil sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW MODAL */}
      {isViewOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setIsViewOpen(false);
              setSelected(null);
            }}
          />

          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-gradient-to-br from-white/90 to-slate-50 p-0 shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-lg font-bold">
                  {selected.student_name
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")}
                </div>

                <div>
                  <div className="text-sm font-semibold">
                    Hasil: {selected.student_name}
                  </div>

                  <div className="text-xs opacity-80">
                    Detail hasil dan metadata
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsViewOpen(false);
                  setSelected(null);
                }}
                className="rounded-full bg-white/10 p-2"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="bg-white p-6">
              <p className="text-sm text-slate-600">
                ID Siswa:{" "}
                <span className="font-medium text-slate-800">
                  {selected.student_id}
                </span>
              </p>

              <p className="mt-3 text-sm">
                Skor:{" "}
                <span className="font-semibold text-slate-900">
                  {selected.score}%
                </span>
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Dikirim:{" "}
                {formatDateUTC(
                  selected.submitted_at,
                )}
              </p>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setIsViewOpen(false);
                    setSelected(null);
                  }}
                  className="rounded-md border px-4 py-2"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setIsEditOpen(false);
              setEditing(null);
            }}
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl shadow-2xl">
            <div className="bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  Edit Hasil
                </h2>

                <button
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditing(null);
                  }}
                  className="rounded-full p-2 text-slate-500"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {editing.student_name} — ID{" "}
                {editing.student_id}
              </p>

              <div className="mt-4 grid gap-3">
                <label className="text-sm">
                  Skor
                </label>

                <input
                  min={0}
                  max={100}
                  type="number"
                  value={editing.score ?? 0}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      score: Number(
                        e.target.value,
                      ),
                    })
                  }
                  className="w-full rounded-md border px-3 py-2"
                />

                <label className="text-sm">
                  Tanggal (ISO UTC)
                </label>

                <input
                  type="text"
                  value={editing.submitted_at}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      submitted_at:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditing(null);
                  }}
                  className="rounded-md border px-4 py-2"
                >
                  Batal
                </button>

                <button
                  onClick={() => {
                    if (editing) {
                      setResults((s) =>
                        s.map((it) =>
                          it.id === editing.id
                            ? editing
                            : it,
                        ),
                      );
                    }

                    setIsEditOpen(false);
                    setEditing(null);
                  }}
                  className="rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-white"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteOpen && toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setIsDeleteOpen(false);
              setToDelete(null);
            }}
          />

          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <FontAwesomeIcon icon={faTrash} />
              </div>

              <div>
                <h3 className="text-lg font-semibold">
                  Hapus hasil
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Anda yakin ingin menghapus hasil{" "}
                  <span className="font-semibold">
                    {toDelete.student_name}
                  </span>
                  ? Tindakan ini tidak dapat
                  dibatalkan.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsDeleteOpen(false);
                  setToDelete(null);
                }}
                className="rounded-md border px-4 py-2"
              >
                Batal
              </button>

              <button
                onClick={() => {
                  setResults((s) =>
                    s.filter(
                      (x) => x.id !== toDelete.id,
                    ),
                  );

                  setIsDeleteOpen(false);
                  setToDelete(null);
                }}
                className="rounded-md bg-rose-600 px-4 py-2 text-white"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-6 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/upgrisba-logo.png"
              alt="UPGRISBA Logo"
              className="h-16 w-16 rounded-3xl border border-white/10 bg-white/5 p-2"
            />

            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                @Pendidikan Informatika -
                Universitas PGRI Sumatera Barat
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Menciptakan pengalaman belajar
                profesional dengan desain premium dan
                identitas kampus.
              </p>
            </div>
          </div>

          <div className="text-sm text-slate-500">
            © {new Date().getFullYear()} Pendidikan
            Informatika — Universitas PGRI Sumatera
            Barat
          </div>
        </div>
      </footer>
    </div>
  );
}
