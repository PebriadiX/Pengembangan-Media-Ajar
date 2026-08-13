"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EvaluationQuestion } from "@/app/lib/data";
import { saveEvaluationResult } from "@/app/lib/supabase-service";

type NotificationPayload = {
  title: string;
  message: string;
  category: "tugas" | "evaluasi" | "sistem";
  target: "guru" | "siswa" | "all";
};

type EvaluationSectionProps = {
  questions: EvaluationQuestion[];
  resetKey?: number;
  onNotify?: (payload: NotificationPayload) => void;
  onProgressUpdate?: (delta: number) => void;
};

type SubmitReason = "manual" | "timeout" | "violation";

type SubmitOptions = {
  reason?: SubmitReason;
};

const EXAM_DURATION_SECONDS = 20 * 60;
const MAX_VIOLATIONS = 3;
const VIOLATION_COOLDOWN_MS = 1200;
const OPTION_LABELS = ["A", "B", "C"] as const;

export function EvaluationSection({
  questions,
  resetKey = 0,
  onNotify,
  onProgressUpdate,
}: EvaluationSectionProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [statusMessage, setStatusMessage] = useState("Belum dikirim");
  const [started, setStarted] = useState(false);
  const [examEnded, setExamEnded] = useState(false);
  const [examEndedReason, setExamEndedReason] = useState<string | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [violationAlert, setViolationAlert] = useState<{
    message: string;
    count: number;
  } | null>(null);
  const [showIncompletePopup, setShowIncompletePopup] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(
    EXAM_DURATION_SECONDS
  );
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
    questions[0]?.id ?? null
  );
  const [shouldReenterFullscreen, setShouldReenterFullscreen] =
    useState(false);

  const examPanelRef = useRef<HTMLDivElement | null>(null);

  const lastViolationAtRef = useRef(0);
  const submitAttemptedRef = useRef(false);
  const hasCompletionNotificationFiredRef = useRef(false);
  const isFullscreenActiveRef = useRef(false);
  const isExamActiveRef = useRef(false);

  /*
   * PERBAIKAN UTAMA:
   *
   * Sebelumnya:
   * useRef<(...) => Promise<void>>();
   *
   * Sekarang:
   * useRef<((...) => Promise<void>) | null>(null);
   *
   * useRef wajib mempunyai initial value.
   */
  const handleSubmitRef = useRef<
    ((options?: SubmitOptions) => Promise<void>) | null
  >(null);

  const handleViolationRef = useRef<(reason: string) => void>(() => {});

  const score = useMemo(() => {
    const correctCount = questions.filter(
      (question) => answers[question.id] === question.correctAnswer
    ).length;

    return questions.length
      ? Math.round((correctCount / questions.length) * 100)
      : 0;
  }, [answers, questions]);

  const answeredCount = useMemo(
    () =>
      Object.keys(answers).filter(
        (questionId) => Boolean(answers[questionId])
      ).length,
    [answers]
  );

  const missingCount = useMemo(
    () =>
      questions.reduce(
        (count, question) => (answers[question.id] ? count : count + 1),
        0
      ),
    [questions, answers]
  );

  const progressPercent = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;

  const currentQuestion =
    questions.find((question) => question.id === activeQuestionId) ??
    questions[0] ??
    null;

  const currentIndex = currentQuestion
    ? questions.findIndex((question) => question.id === currentQuestion.id)
    : -1;

  const isExamActive = started && !submitted && !examEnded;

  const correctCount = useMemo(
    () =>
      questions.filter(
        (question) => answers[question.id] === question.correctAnswer
      ).length,
    [answers, questions]
  );

  const getOptionLabel = useCallback((index: number) => {
    return OPTION_LABELS[index] ?? String.fromCharCode(65 + index);
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }, []);

  /*
   * Masuk fullscreen.
   */
  const enterExamFullscreen = useCallback(async () => {
    const target = examPanelRef.current;

    if (!target) {
      return;
    }

    const fullscreenTarget = target as HTMLElement & {
      requestFullscreen?: () => Promise<void>;
    };

    if (!fullscreenTarget.requestFullscreen) {
      setStatusMessage(
        "Browser tidak mendukung fullscreen. Ujian tetap dapat dilanjutkan."
      );
      return;
    }

    try {
      await fullscreenTarget.requestFullscreen();
      setIsFullscreenActive(true);
      isFullscreenActiveRef.current = true;
    } catch {
      setStatusMessage(
        "Browser menolak masuk fullscreen. Izinkan fullscreen untuk melanjutkan ujian."
      );
    }
  }, []);

  /*
   * Submit ujian.
   */
  const handleSubmit = useCallback(
    async (options?: SubmitOptions) => {
      if (submitAttemptedRef.current) {
        return;
      }

      let manualStatus = "";

      if (options?.reason === "manual" && !studentName.trim()) {
        manualStatus =
          "Nama tidak diisi, dikirim sebagai Peserta anonim. ";
      }

      if (manualStatus) {
        setStatusMessage(manualStatus.trim());
      }

      submitAttemptedRef.current = true;

      setSubmitted(true);
      setStarted(false);
      setShowResultsModal(true);
      setExamEnded(true);

      setExamEndedReason(
        options?.reason === "timeout"
          ? "Waktu habis"
          : options?.reason === "violation"
            ? "Pelanggaran ujian"
            : null
      );

      setActiveQuestionId(null);

      /*
       * Keluar fullscreen ketika ujian selesai.
       */
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          // Abaikan error fullscreen.
        }
      }

      const saved = await saveEvaluationResult({
        studentName: studentName.trim() || "Peserta anonim",
        score,
        answers,
      });

      const baseMessage =
        options?.reason === "timeout"
          ? "Waktu habis • "
          : options?.reason === "violation"
            ? "Ujian dihentikan karena pelanggaran • "
            : "Berhasil dikirim ke sistem • ";

      setStatusMessage(
        saved
          ? `${baseMessage}${manualStatus}Skor ${score}%`
          : `${
              manualStatus || baseMessage
            }Jawaban disimpan lokal • Skor ${score}%`
      );
    },
    [answers, score, studentName]
  );

  /*
   * Simpan handleSubmit terbaru ke ref.
   */
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  /*
   * Menangani pelanggaran.
   */
  const handleViolation = useCallback((reason: string) => {
    if (!isExamActiveRef.current) {
      return;
    }

    const now = Date.now();

    if (
      now - lastViolationAtRef.current <
      VIOLATION_COOLDOWN_MS
    ) {
      return;
    }

    lastViolationAtRef.current = now;

    setViolationCount((previousCount) => {
      const nextCount = previousCount + 1;

      if (nextCount >= MAX_VIOLATIONS) {
        setViolationAlert({
          message:
            "Pelanggaran maksimum tercapai. Ujian otomatis selesai.",
          count: nextCount,
        });

        if (handleSubmitRef.current) {
          void handleSubmitRef.current({
            reason: "violation",
          });
        }

        setStatusMessage(
          `Pelanggaran ${nextCount}/${MAX_VIOLATIONS} tercatat. Ujian otomatis selesai.`
        );
      } else {
        const detailMessage =
          reason === "shortcut"
            ? "Aktivitas di luar mode CBT terdeteksi."
            : "Pindah tab atau layar terdeteksi.";

        setViolationAlert({
          message: detailMessage,
          count: nextCount,
        });

        setStatusMessage(
          `${detailMessage} Pelanggaran ${nextCount}/${MAX_VIOLATIONS}.`
        );
      }

      return nextCount;
    });
  }, []);

  /*
   * Simpan handleViolation terbaru ke ref.
   */
  useEffect(() => {
    handleViolationRef.current = handleViolation;
  }, [handleViolation]);

  /*
   * Menyimpan jawaban.
   */
  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [questionId]: answer,
    }));

    setStatusMessage(
      "Jawaban tersimpan. Lanjutkan ke soal berikutnya."
    );
  };

  /*
   * Tombol kirim jawaban.
   */
  const handleKirimJawaban = useCallback(() => {
    if (missingCount > 0) {
      setShowIncompletePopup(true);

      setStatusMessage(
        `Masih ada ${missingCount} jawaban kosong.`
      );

      return;
    }

    void handleSubmit({
      reason: "manual",
    });
  }, [handleSubmit, missingCount]);

  /*
   * Memulai ujian.
   */
  const startExam = async () => {
    if (started) {
      setStatusMessage(
        "Ujian sedang berjalan. Jangan memulai ujian lagi."
      );

      return;
    }

    if (submitted || examEnded) {
      setStatusMessage(
        "Ujian sudah selesai. Tidak bisa memulai kembali."
      );

      return;
    }

    submitAttemptedRef.current = false;
    hasCompletionNotificationFiredRef.current = false;

    setStarted(true);
    setSubmitted(false);
    setExamEnded(false);
    setExamEndedReason(null);
    setViolationCount(0);
    setViolationAlert(null);
    setShowResultsModal(false);
    setTimeRemaining(EXAM_DURATION_SECONDS);
    setActiveQuestionId(questions[0]?.id ?? null);

    setStatusMessage(
      "Ujian dimulai. Fokus pada layar dan kerjakan semua soal dengan teliti."
    );

    /*
     * Fullscreen harus dipanggil dari interaksi user.
     */
    await enterExamFullscreen();
  };

  /*
   * Navigasi soal.
   */
  const goToQuestion = (
    direction: "prev" | "next"
  ) => {
    if (!questions.length) {
      return;
    }

    if (currentIndex < 0) {
      setActiveQuestionId(questions[0]?.id ?? null);
      return;
    }

    const nextIndex =
      direction === "next"
        ? Math.min(
            currentIndex + 1,
            questions.length - 1
          )
        : Math.max(currentIndex - 1, 0);

    setActiveQuestionId(
      questions[nextIndex]?.id ?? null
    );
  };

  /*
   * Reset ketika questions atau resetKey berubah.
   */
  useEffect(() => {
    submitAttemptedRef.current = false;
    hasCompletionNotificationFiredRef.current = false;

    setAnswers({});
    setSubmitted(false);
    setStudentName("");
    setStatusMessage("Belum dikirim");
    setStarted(false);
    setExamEnded(false);
    setExamEndedReason(null);
    setViolationCount(0);
    setViolationAlert(null);
    setShowIncompletePopup(false);
    setShowResultsModal(false);
    setTimeRemaining(EXAM_DURATION_SECONDS);
    setActiveQuestionId(questions[0]?.id ?? null);
    setShouldReenterFullscreen(false);

    lastViolationAtRef.current = 0;
    isExamActiveRef.current = false;
    isFullscreenActiveRef.current = false;
  }, [questions, resetKey]);

  /*
   * Masuk fullscreen kembali setelah pelanggaran.
   */
  useEffect(() => {
    if (!shouldReenterFullscreen || violationAlert) {
      return;
    }

    void enterExamFullscreen();
    setShouldReenterFullscreen(false);
  }, [
    shouldReenterFullscreen,
    violationAlert,
    enterExamFullscreen,
  ]);

  /*
   * Monitoring fullscreen.
   */
  useEffect(() => {
    if (!isExamActive) {
      setIsFullscreenActive(false);
      isFullscreenActiveRef.current = false;

      if (document.fullscreenElement) {
        try {
          void document.exitFullscreen();
        } catch {
          // Abaikan error.
        }
      }

      return;
    }

    let fullscreenCheckTimeout: ReturnType<
      typeof window.setTimeout
    > | null = null;

    const handleFullscreenChange = () => {
      if (fullscreenCheckTimeout) {
        window.clearTimeout(fullscreenCheckTimeout);
      }

      fullscreenCheckTimeout = window.setTimeout(() => {
        const isNowActive =
          document.fullscreenElement ===
          examPanelRef.current;

        if (
          isFullscreenActiveRef.current &&
          !isNowActive &&
          isExamActiveRef.current
        ) {
          handleViolationRef.current("shortcut");
          setShouldReenterFullscreen(true);
        }

        isFullscreenActiveRef.current =
          isNowActive;

        setIsFullscreenActive(isNowActive);

        fullscreenCheckTimeout = null;
      }, 200);
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );

      if (fullscreenCheckTimeout) {
        window.clearTimeout(
          fullscreenCheckTimeout
        );
      }
    };
  }, [isExamActive]);

  /*
   * Notifikasi ketika ujian selesai.
   */
  useEffect(() => {
    if (
      !submitted ||
      !examEnded ||
      hasCompletionNotificationFiredRef.current
    ) {
      return;
    }

    hasCompletionNotificationFiredRef.current = true;

    onProgressUpdate?.(8);

    const participantName =
      studentName.trim() || "Peserta anonim";

    onNotify?.({
      title: "Evaluasi selesai",
      message: `${participantName} telah menyelesaikan evaluasi dengan skor ${score}%.`,
      category: "evaluasi",
      target: "guru",
    });

    onNotify?.({
      title: "Jawaban evaluasi terkirim",
      message: `Jawaban evaluasi Anda telah berhasil dikirim. Skor Anda ${score}%.`,
      category: "evaluasi",
      target: "siswa",
    });
  }, [
    submitted,
    examEnded,
    onProgressUpdate,
    onNotify,
    studentName,
    score,
  ]);

  /*
   * Update progress.
   */
  useEffect(() => {
    isExamActiveRef.current = isExamActive;

    if (!isExamActive) {
      return;
    }

    onProgressUpdate?.(2);
  }, [
    answeredCount,
    onProgressUpdate,
    isExamActive,
  ]);

  /*
   * Deteksi pindah tab, blur, shortcut dan refresh.
   */
  useEffect(() => {
    if (!isExamActive) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleViolationRef.current("visibility");
      }
    };

    const handleWindowBlur = () => {
      if (document.visibilityState === "hidden") {
        handleViolationRef.current("blur");
      }
    };

    const handleBeforeUnload = (
      event: BeforeUnloadEvent
    ) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      const key = event.key.toLowerCase();

      const isBlockedShortcut =
        (event.ctrlKey || event.metaKey) &&
        ["n", "t", "w", "p"].includes(key);

      if (isBlockedShortcut) {
        event.preventDefault();
        handleViolationRef.current("shortcut");
      }

      if (
        event.key === "F11" ||
        event.key === "Tab"
      ) {
        event.preventDefault();
        handleViolationRef.current("shortcut");
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        key === "l"
      ) {
        event.preventDefault();
        handleViolationRef.current("shortcut");
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "blur",
      handleWindowBlur
    );

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "blur",
        handleWindowBlur
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isExamActive]);

  /*
   * Hilangkan popup pelanggaran otomatis.
   */
  useEffect(() => {
    if (!violationAlert) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setViolationAlert(null);
    }, 2400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [violationAlert]);

  /*
   * Timer ujian.
   */
  useEffect(() => {
    if (!isExamActive) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeRemaining((previousTime) => {
        if (previousTime <= 1) {
          window.clearInterval(timer);

          void handleSubmit({
            reason: "timeout",
          });

          return 0;
        }

        return previousTime - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [handleSubmit, isExamActive]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <style>{`
        #cbt-exam-panel:fullscreen {
          background-color: white;
          display: grid;
          grid-template-columns: 1.65fr 0.75fr;
          gap: 1.5rem;
          padding: 1rem;
          overflow: auto;
        }

        #cbt-exam-panel:fullscreen > * {
          border-radius: 2rem;
        }

        @media (max-width: 1024px) {
          #cbt-exam-panel:fullscreen {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* HEADER */}
      <div className="rounded-[2.5rem] border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/50">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-indigo-200">
              CBT MODE UJIAN
            </span>

            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight text-white">
                Ujian Evaluasi Siswa
              </h2>

              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                Ujian berjalan dalam mode fullscreen,
                memantau fokus layar, dan otomatis
                menghentikan sesi ketika pelanggaran
                mencapai batas maksimal.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Jumlah soal
                </p>

                <p className="mt-3 text-2xl font-black text-white">
                  {questions.length} soal
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Durasi
                </p>

                <p className="mt-3 text-2xl font-black text-white">
                  {formatTime(EXAM_DURATION_SECONDS)}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Batas pelanggaran
                </p>

                <p className="mt-3 text-2xl font-black text-white">
                  {MAX_VIOLATIONS} kali
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em] text-white">
                {isExamActive
                  ? "Ujian sedang berjalan"
                  : submitted || examEnded
                    ? "Ujian selesai"
                    : "Siap memulai ujian"}
              </span>

              <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 ring-1 ring-amber-500/20">
                {formatTime(timeRemaining)}
              </span>

              <span className="rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 ring-1 ring-rose-500/20">
                {violationCount}/{MAX_VIOLATIONS} pelanggaran
              </span>

              {isExamActive ? (
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                    isFullscreenActive
                      ? "bg-emerald-500/10 text-emerald-200 ring-emerald-500/20"
                      : "bg-rose-500/10 text-rose-200 ring-rose-500/20"
                  }`}
                >
                  {isFullscreenActive
                    ? "Fullscreen aktif"
                    : "Fullscreen tidak aktif"}
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 text-slate-300 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Aturan CBT
            </p>

            <ul className="mt-4 space-y-2 text-sm leading-6">
              <li>
                • Jangan berpindah tab atau membuka
                aplikasi lain.
              </li>

              <li>
                • Setiap pelanggaran akan dihitung
                secara otomatis.
              </li>

              <li>
                • Waktu ujian berjalan otomatis sampai
                selesai.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* POPUP PELANGGARAN */}
      {violationAlert ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.75rem] border border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-900/40 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                <i className="fa-solid fa-triangle-exclamation text-xl" />
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-rose-500">
                  Peringatan CBT
                </p>

                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Pelanggaran terdeteksi
                </h3>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {violationAlert.message}
            </p>

            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
              Pelanggaran {violationAlert.count}/
              {MAX_VIOLATIONS}
            </div>

            <button
              type="button"
              onClick={() => {
                setViolationAlert(null);
                void enterExamFullscreen();
              }}
              className="mt-5 w-full rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Mengerti
            </button>
          </div>
        </div>
      ) : null}

      {/* HASIL UJIAN */}
      {showResultsModal && (submitted || examEnded) ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-indigo-500">
                  Hasil ujian
                </p>

                <h3 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                  Nilai evaluasi Anda
                </h3>
              </div>

              <div className="rounded-2xl bg-emerald-100 px-3 py-2 text-sm font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {score}%
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-slate-500">
                  Nama
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                  {studentName.trim() ||
                    "Peserta anonim"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-slate-500">
                  Benar
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                  {correctCount}/{questions.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-slate-500">
                  Status
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                  {examEndedReason
                    ? "Sesi dihentikan"
                    : "Selesai"}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300">
              <p className="font-semibold">
                {statusMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowResultsModal(false)
              }
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:opacity-95"
            >
              Tutup hasil
            </button>
          </div>
        </div>
      ) : null}

      {/* POPUP JAWABAN BELUM LENGKAP */}
      {showIncompletePopup ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-700 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25">
                <i className="fa-solid fa-circle-exclamation text-xl" />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-300">
                  Peringatan
                </p>

                <h3 className="mt-1 text-lg font-black text-white">
                  Masih ada jawaban yang kosong
                </h3>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-300">
              Lengkapi semua pilihan jawaban sebelum
              mengirim agar hasil evaluasi dapat diproses
              dengan benar.
            </p>

            <button
              type="button"
              onClick={() =>
                setShowIncompletePopup(false)
              }
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-95"
            >
              Tutup
            </button>
          </div>
        </div>
      ) : null}

      {/* SEBELUM UJIAN */}
      {!started && !submitted && !examEnded ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Sesi belum dimulai
              </p>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Klik tombol mulai ujian untuk memulai
                sesi CBT. Setelah ujian dimulai atau
                selesai, sesi tidak bisa dimulai ulang.
              </p>
            </div>

            <button
              type="button"
              onClick={startExam}
              disabled={!questions.length}
              className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {questions.length
                ? "Mulai Ujian"
                : "Tidak Ada Soal"}
            </button>
          </div>
        </div>
      ) : isExamActive ? (
        /* AREA UJIAN */
        <div
          ref={examPanelRef}
          id="cbt-exam-panel"
          className="grid min-h-[55vh] gap-4 lg:grid-cols-[1.65fr_0.75fr]"
        >
          {/* PANEL SOAL */}
          <div className="flex min-h-0 flex-col rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-indigo-500">
                  Sesi CBT
                </p>

                <h3 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
                  Try Out Evaluasi Mandiri
                </h3>
              </div>

              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {answeredCount}/{questions.length}{" "}
                terjawab
              </div>
            </div>

            {/* PROGRESS */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-300"
                  style={{
                    width: `${progressPercent}%`,
                  }}
                />
              </div>

              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {progressPercent}% selesai
              </span>
            </div>

            {/* NAMA */}
            <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nama peserta
              </label>

              <input
                value={studentName}
                onChange={(event) =>
                  setStudentName(event.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                placeholder="Contoh: Raka Pratama"
              />
            </div>

            {/* SOAL */}
            {currentQuestion ? (
              <div className="mt-4 rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-sm font-extrabold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300">
                    {currentIndex + 1}
                  </span>

                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-indigo-500">
                      Soal {currentIndex + 1}
                    </p>

                    <h4 className="mt-1 text-sm font-extrabold leading-7 text-slate-900 dark:text-white">
                      {currentQuestion.question}
                    </h4>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {currentQuestion.options.map(
                    (option, optionIndex) => {
                      const choiceLabel =
                        getOptionLabel(optionIndex);

                      const isSelected =
                        answers[currentQuestion.id] ===
                        option;

                      return (
                        <label
                          key={`${currentQuestion.id}-${optionIndex}-${option}`}
                          className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                            isSelected
                              ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300"
                              : "border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-800 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10"
                          }`}
                        >
                          <input
                            type="radio"
                            name={currentQuestion.id}
                            value={option}
                            checked={isSelected}
                            onChange={() =>
                              handleAnswer(
                                currentQuestion.id,
                                option
                              )
                            }
                            className="mt-0.5 h-4 w-4 border-slate-300 text-indigo-500"
                          />

                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {choiceLabel}
                          </span>

                          <span className="leading-6">
                            {option}
                          </span>
                        </label>
                      );
                    }
                  )}
                </div>
              </div>
            ) : null}

            {/* NAVIGASI */}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() =>
                  goToQuestion("prev")
                }
                disabled={currentIndex <= 0}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <i className="fa-solid fa-chevron-left mr-2" />
                Sebelumnya
              </button>

              <button
                type="button"
                onClick={() =>
                  goToQuestion("next")
                }
                disabled={
                  currentIndex >= questions.length - 1
                }
                className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Berikutnya
                <i className="fa-solid fa-chevron-right ml-2" />
              </button>
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className="w-full space-y-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 lg:sticky lg:top-4 lg:h-fit lg:max-w-[340px]">
            {/* WAKTU */}
            <div className="rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-amber-500">
                Waktu ujian
              </p>

              <div className="mt-3 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900/50 dark:bg-amber-950/30">
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  Sisa waktu
                </span>

                <span className="text-base font-black text-amber-700 dark:text-amber-300">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>

            {/* NAVIGASI SOAL */}
            <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-indigo-500">
                Navigasi soal
              </p>

              <div className="mt-3 overflow-x-auto">
                <div className="grid min-w-[24rem] grid-cols-[repeat(auto-fit,minmax(2.7rem,1fr))] gap-2">
                  {questions.map(
                    (question, index) => {
                      const isActive =
                        question.id ===
                        activeQuestionId;

                      const answered =
                        Boolean(
                          answers[question.id]
                        );

                      const selectedOptionIndex =
                        question.options.findIndex(
                          (option) =>
                            answers[question.id] ===
                            option
                        );

                      const selectedLabel =
                        selectedOptionIndex >= 0
                          ? getOptionLabel(
                              selectedOptionIndex
                            )
                          : null;

                      return (
                        <button
                          key={`question-nav-${question.id}`}
                          type="button"
                          onClick={() =>
                            setActiveQuestionId(
                              question.id
                            )
                          }
                          className={`rounded-2xl border px-2 py-2 text-sm font-extrabold transition ${
                            isActive
                              ? "border-indigo-400 bg-indigo-50 text-indigo-600 dark:border-indigo-500/50 dark:bg-indigo-500/10 dark:text-indigo-300"
                              : answered
                                ? "border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                          }`}
                        >
                          {selectedLabel ??
                            index + 1}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleKirimJawaban}
                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
              >
                Kirim jawaban
              </button>
            </div>
          </aside>
        </div>
      ) : (
        /* SELESAI */
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Ujian selesai
              </p>

              <h3 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                {examEndedReason
                  ? "Sesi dihentikan"
                  : "Jawaban berhasil dikirim"}
              </h3>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {statusMessage}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
              Skor akhir: {score}%
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
            Sesi ujian telah selesai dan tidak dapat
            dimulai ulang dari awal.
          </div>
        </div>
      )}
    </div>
  );
}
