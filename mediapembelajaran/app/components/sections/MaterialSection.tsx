"use client";

import { useState, useEffect } from "react";
import type { DocumentMaterial, EvaluationQuestion, Slide, SlideAttachment } from "@/app/lib/data";
import { supabase } from "@/app/lib/supabase";

type PackageName = "HTML Dasar" | "CSS" | "JS";

const DEFAULT_PDF_BUCKET = "materi-pdf";
const SUPABASE_PUBLIC_STORAGE_ROOT = (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL)
  ? `${String(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, "")}/storage/v1/object/public`
  : "";

const normalizePathForBucket = (value: string) => {
  const trimmed = String(value ?? "").trim().replace(/^\/+/, "");
  if (!trimmed) return "";
  if (/^(https?:|blob:|data:)/i.test(trimmed)) return trimmed;

  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length >= 2 && parts[0].toLowerCase() === DEFAULT_PDF_BUCKET.toLowerCase()) {
    return `${DEFAULT_PDF_BUCKET}/${parts.slice(1).join("/")}`;
  }

  if (parts.length >= 2) {
    return `${parts[0]}/${parts.slice(1).join("/")}`;
  }

  return `${DEFAULT_PDF_BUCKET}/${trimmed}`;
};

const buildPublicStorageUrl = (bucket: string, objectPath: string) => {
  if (!SUPABASE_PUBLIC_STORAGE_ROOT) return null;
  return `${SUPABASE_PUBLIC_STORAGE_ROOT}/${bucket}/${objectPath}`;
};

type MaterialSectionProps = {
  slides: Slide[];
  documentMaterials: DocumentMaterial[];
  evaluationQuestions?: EvaluationQuestion[];
  materialQuizQuestionIds?: string[];
  activeSlide: number;
  progress: {
    percent: number;
    label: string;
  };
  completedSlideIds: string[];
  onSelectSlide: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onProgressUpdate?: (delta: number) => void;
  onMarkSlideComplete: (slideId: string) => void;
  role?: "siswa" | "guru";
};

const PACKAGE_ORDER: PackageName[] = ["HTML Dasar", "CSS", "JS"];

export function MaterialSection({
  slides,
  documentMaterials,
  evaluationQuestions = [],
  materialQuizQuestionIds = [],
  activeSlide,
  progress,
  completedSlideIds,
  onSelectSlide,
  onNext,
  onPrev,
  onProgressUpdate,
  onMarkSlideComplete,
  role = "siswa",
}: MaterialSectionProps) {
  type DisplayDocument = {
    id: string;
    title: string;
    description?: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
  };

  const pdfDocuments = documentMaterials.filter((doc) =>
    doc.fileType?.toLowerCase() === "pdf" || doc.fileName.toLowerCase().endsWith(".pdf")
  );
  const currentSlide = slides[activeSlide] ?? null;
  const moduleAttachments: DisplayDocument[] = (currentSlide?.attachments ?? []).map((attachment: SlideAttachment) => ({
    id: attachment.id,
    title: attachment.title,
    description: "Lampiran khusus untuk modul ini",
    fileName: attachment.fileName,
    fileUrl: attachment.fileUrl,
    fileType: attachment.fileType,
  }));
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const availableDocuments: DisplayDocument[] = moduleAttachments.length > 0
    ? moduleAttachments.filter((doc) => doc.fileType?.toLowerCase() === "pdf" || doc.fileName.toLowerCase().endsWith(".pdf"))
    : pdfDocuments.map((doc) => ({ ...doc, description: doc.description }));
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(availableDocuments[0]?.id ?? null);
  const [resolvedPdfUrl, setResolvedPdfUrl] = useState<string | null>(null);
  const [viewerScale, setViewerScale] = useState(1);
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
  const selectedPdf = availableDocuments.find((doc) => doc.id === selectedPdfId) ?? availableDocuments[0] ?? null;
  const filteredQuizQuestions = materialQuizQuestionIds.length > 0
    ? evaluationQuestions.filter((question) => materialQuizQuestionIds.includes(question.id))
    : [];
  const displayedQuizQuestions = filteredQuizQuestions.slice(0, 3);

  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  }, [selectedPdfId, activeSlide, evaluationQuestions.length]);

  const handleQuizAnswer = (questionId: string, option: string) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = (event: React.FormEvent) => {
    event.preventDefault();
    const correctCount = displayedQuizQuestions.filter((question) => quizAnswers[question.id] === question.correctAnswer).length;
    setQuizScore(displayedQuizQuestions.length > 0 ? Math.round((correctCount / displayedQuizQuestions.length) * 100) : 0);
    setQuizSubmitted(true);
  };

  const hasQuizQuestions = displayedQuizQuestions.length > 0;
  const completionLabel = progress.percent >= 100 ? "Semua slide selesai" : progress.percent >= 60 ? "Momentum bagus" : "Lanjutkan fokus belajar";
  const viewerScaleLabel = `${Math.round(viewerScale * 100)}%`;

  const currentSlideCompleted = currentSlide ? completedSlideIds.includes(currentSlide.id) : false;
  const handleSelectPdf = (doc: DisplayDocument) => {
    setViewerScale(1);
    setSelectedPdfId(doc.id);
  };
  const zoomOut = () => setViewerScale((prev) => Math.max(0.7, Number((prev - 0.1).toFixed(2))));
  const zoomIn = () => setViewerScale((prev) => Math.min(1.8, Number((prev + 0.1).toFixed(2))));
  const resetZoom = () => setViewerScale(1);
  const fitWidth = () => setViewerScale(0.95);
  const toggleFullscreen = async () => {
    const viewer = document.getElementById("pdf-viewer-shell");
    if (!viewer) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await viewer.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed for PDF viewer", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreenActive(document.fullscreenElement?.id === "pdf-viewer-shell");
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // When the list of pdf documents changes (e.g. teacher uploads new PDF),
  // show the latest uploaded PDF automatically. This helps teachers see
  // the uploaded file immediately and keeps students focused on the
  // current material (we'll hide the list for students below).
  useEffect(() => {
    if (availableDocuments.length > 0) {
      setSelectedPdfId(availableDocuments[0].id);
    } else {
      setSelectedPdfId(null);
    }
  }, [activeSlide, documentMaterials.length, moduleAttachments.length]);

  // Resolve storage paths (bucket/object) to a usable URL (signed or public)
  useEffect(() => {
    let mounted = true;
    const resolve = async () => {
      if (!selectedPdf) {
        setResolvedPdfUrl(null);
        return;
      }

      const url = selectedPdf.fileUrl ?? "";
      console.debug("[PDF compare] selectedPdf.fileUrl => resolvedPdfUrl", {
        selectedPdfFileUrl: url,
        selectedPdfTitle: selectedPdf.title,
        selectedPdfId: selectedPdf.id,
      });

      const looksLikeHttpUrl = typeof url === "string" && /^(https?:)/i.test(url);
      if (looksLikeHttpUrl) {
        console.debug("[PDF compare] direct http URL accepted", { url });
        setResolvedPdfUrl(url);
        return;
      }

      const looksLikeTemporaryBrowserUrl = typeof url === "string" && /^(blob:|data:)/i.test(url);
      if (looksLikeTemporaryBrowserUrl) {
        console.warn("[PDF compare] rejected temporary browser URL for persisted PDF preview", { url });
        setResolvedPdfUrl(null);
        return;
      }

      if (!supabase) {
        const fallbackUrl = buildPublicStorageUrl(DEFAULT_PDF_BUCKET, url.replace(/^\/+/, ""));
        setResolvedPdfUrl(fallbackUrl ?? url);
        return;
      }

      try {
        const normalizedStoragePath = normalizePathForBucket(url);
        const parts = normalizedStoragePath.split("/").filter(Boolean);
        const bucketFromPath = parts.length >= 2 ? parts[0] : DEFAULT_PDF_BUCKET;
        const objectPath = parts.length >= 2 ? parts.slice(1).join("/") : parts[0] ?? "";

        console.debug("[PDF resolve] input", { rawUrl: url, normalizedStoragePath, bucketFromPath, objectPath });

        const directPublicUrl = buildPublicStorageUrl(bucketFromPath, objectPath);
        if (directPublicUrl) {
          console.debug("[PDF resolve] public storage url built", { bucket: bucketFromPath, objectPath, publicUrl: directPublicUrl });
          if (!mounted) return;
          setResolvedPdfUrl(directPublicUrl);
          return;
        }

        const pub = supabase.storage.from(bucketFromPath).getPublicUrl(objectPath);
        if (pub?.data?.publicUrl) {
          if (!mounted) return;
          console.debug("[PDF resolve] public url success", { bucket: bucketFromPath, objectPath, publicUrl: pub.data.publicUrl });
          setResolvedPdfUrl(pub.data.publicUrl);
          return;
        }

        const { data, error } = await supabase.storage.from(bucketFromPath).createSignedUrl(objectPath, 3600);
        if (!error && data?.signedUrl) {
          if (!mounted) return;
          console.debug("[PDF resolve] signed url success", { bucket: bucketFromPath, objectPath, signedUrl: data.signedUrl });
          setResolvedPdfUrl(data.signedUrl);
          return;
        }

        console.warn("[PDF resolve] no usable URL found", { normalizedStoragePath, bucketFromPath, objectPath });
        if (mounted) setResolvedPdfUrl(normalizedStoragePath);
      } catch (err) {
        console.error("Failed to resolve PDF URL", err);
        if (mounted) setResolvedPdfUrl(url);
      }
    };

    void resolve();
    return () => {
      mounted = false;
    };
  }, [selectedPdf?.fileUrl, selectedPdfId, selectedPdf]);


  const getPackageSlides = (packageName: PackageName) => slides.filter((slide) => slide.badge === packageName);
  const isPackageComplete = (packageName: PackageName) => getPackageSlides(packageName).every((slide) => completedSlideIds.includes(slide.id));
  const isPackageUnlocked = (packageName: PackageName) => {
    if (packageName === "HTML Dasar") return true;
    const currentIndex = PACKAGE_ORDER.indexOf(packageName);
    const previousPackage = PACKAGE_ORDER[currentIndex - 1];
    return previousPackage ? isPackageComplete(previousPackage) : true;
  };
  const isSlideUnlocked = (slide: Slide) => isPackageUnlocked(slide.badge as PackageName);
  const isSlideCompleted = (slide: Slide) => completedSlideIds.includes(slide.id);

  const getSlideChallenge = (slide: Slide) => {
    switch (slide.badge) {
      case "HTML Dasar":
        return {
          question: "Elemen mana yang paling cocok untuk heading utama?",
          options: ["<h1>", "<div>", "<span>", "<p>"],
          correctAnswer: "<h1>",
        };
      case "CSS":
        return {
          question: "Apa fungsi utama CSS?",
          options: ["Mengatur tampilan elemen", "Mengolah database", "Menyimpan file", "Mengirim email"],
          correctAnswer: "Mengatur tampilan elemen",
        };
      case "JS":
        return {
          question: "Apa yang paling tepat untuk menangani klik tombol?",
          options: ["Event listener", "Tag img", "Link CSS", "Input file"],
          correctAnswer: "Event listener",
        };
      default:
        return {
          question: "Tujuan belajar hari ini adalah?",
          options: ["Memahami materi", "Mengabaikan materi", "Menutup aplikasi", "Menghapus file"],
          correctAnswer: "Memahami materi",
        };
    }
  };

  const challenge = currentSlide ? getSlideChallenge(currentSlide) : {
    question: "Tujuan belajar hari ini adalah?",
    options: ["Memahami materi", "Mengabaikan materi", "Menutup aplikasi", "Menghapus file"],
    correctAnswer: "Memahami materi",
  };


  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col gap-6 pb-24">
      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-[1.4rem] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 md:sticky md:top-20 md:max-h-[calc(100vh-5rem)] md:overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Peta Jalan</h2>
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
            {slides.length} slide
          </span>
        </div>

        <div className="space-y-4">
          {PACKAGE_ORDER.map((packageName) => {
            const packageSlides = getPackageSlides(packageName);
            const packageUnlocked = isPackageUnlocked(packageName);
            return (
              <div key={`package-${packageName}`} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Paket {packageName}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {packageName === "HTML Dasar"
                        ? "Struktur halaman dan tag dasar"
                        : packageName === "CSS"
                        ? "Gaya dan layout responsif"
                        : "Interaksi dengan JavaScript"}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                    packageUnlocked
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    {packageUnlocked ? "Terbuka" : "Terkunci"}
                  </span>
                </div>

                <div className="space-y-2">
                  {packageSlides.map((slide) => {
                    const index = slides.findIndex((item) => item.id === slide.id);
                    const unlocked = isPackageUnlocked(packageName);
                    return (
                      <button
                        key={`slide-${slide.id}`}
                        type="button"
                        onClick={() => unlocked && onSelectSlide(index)}
                        disabled={!unlocked}
                        className={`w-full rounded-2xl border px-3 py-3 text-left text-sm transition ${
                          index === activeSlide
                            ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/70 dark:bg-indigo-950/50 dark:text-indigo-300"
                            : unlocked
                            ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                            : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-600"
                        }`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{slide.title}</span>
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                            <span>{slide.badge}</span>
                            {isSlideCompleted(slide) ? (
                              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-white">Selesai</span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {!packageUnlocked ? (
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Selesaikan paket {PACKAGE_ORDER[PACKAGE_ORDER.indexOf(packageName) - 1]} terlebih dahulu untuk membuka paket ini.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </aside>

      <section className="rounded-[1.45rem] border border-slate-200 bg-white/95 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        {role !== "siswa" && (
          <div className="mb-5 grid gap-4 rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-500">Target hari ini</p>
              <h3 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">Selesaikan satu slide dan lanjutkan ke tantangan berikutnya.</h3>
            </div>
            <div className="rounded-2xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white">
              {Math.max(1, slides.length - activeSlide)} bagian tersisa
            </div>
          </div>
        )}

        <div className="mb-5 space-y-4 text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-500">Materi PDF</p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">Akses materi dalam format PDF</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Pilih dokumen PDF di samping untuk melihat isi materi langsung di halaman ini. Klik unduh untuk simpan file secara offline.</p>
          </div>

          {role === "siswa" ? (
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/80">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Progres Belajar</p>
                <div className="mt-3 flex items-end gap-4">
                  <div>
                    <p className="text-3xl font-extrabold text-slate-950 dark:text-white">{progress.percent}%</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{progress.label}</p>
                  </div>
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">Siswa</span>
                </div>
              </div>
              <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Slide Aktif</p>
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{currentSlide?.title ?? "Pilih slide"}</p>
                {currentSlide?.subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{currentSlide.subtitle}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{currentSlide ? currentSlide.badge : "-"}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700 dark:bg-slate-800 dark:text-slate-300">{activeSlide + 1}/{slides.length}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className={`grid gap-6 ${role === "siswa" ? "" : "xl:grid-cols-[1.5fr_0.85fr]"}`}>
          <div className="space-y-6">
            {currentSlide ? (
              <div className="space-y-6">
                <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/80">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Ringkasan Modul</p>
                      <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{currentSlide.title}</h3>
                      {currentSlide.subtitle ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{currentSlide.subtitle}</p> : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={onPrev}
                        disabled={activeSlide === 0}
                        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Sebelumnya
                      </button>
                      <button
                        type="button"
                        onClick={onNext}
                        disabled={activeSlide >= slides.length - 1}
                        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Berikutnya
                      </button>
                      <button
                        type="button"
                        onClick={() => onMarkSlideComplete(currentSlide.id)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${currentSlideCompleted ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                      >
                        {currentSlideCompleted ? "Slide selesai" : "Tandai selesai"}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ) : null}

            {currentSlide?.attachments && currentSlide.attachments.length > 0 ? (
              <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">Lampiran modul</p>
                <ul className="mt-3 space-y-2">
                  {currentSlide.attachments.map((attachment) => (
                    <li key={`attachment-${attachment.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-200 bg-white/80 px-3 py-2 text-sm dark:border-emerald-900/50 dark:bg-slate-900/70">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{attachment.title}</span>
                      <a href={attachment.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Buka file</a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {selectedPdf ? (
              <div className="rounded-[1.4rem] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 px-3 py-2 text-white">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
                    <span>{selectedPdf.fileType || "PDF"}</span>
                    <span className="text-slate-500">•</span>
                    <span>{selectedPdf.fileName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={zoomOut} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-white/10">−</button>
                    <button type="button" onClick={zoomIn} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-white/10">+</button>
                    <button type="button" onClick={resetZoom} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-white/10">100%</button>
                    <button type="button" onClick={fitWidth} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-white/10">Fit width</button>
                    <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">{viewerScaleLabel}</span>
                    <button type="button" onClick={toggleFullscreen} className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-400">
                      Fullscreen
                    </button>
                  </div>
                </div>

                <div id="pdf-viewer-shell" className={`relative overflow-hidden rounded-[1rem] border border-slate-200 bg-slate-950 transition-all duration-300 ${isFullscreenActive ? "h-screen w-screen border-0 rounded-none" : "h-[70vh] w-full"}`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/70 via-slate-900/40 to-slate-950/90" />
                  <div className="relative z-10 flex h-full flex-col">
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/90 px-4 py-3 text-white">
                      <div>
                        <p className="text-xs uppercase tracking-[0.32em] text-slate-400">PDF Premium</p>
                        <h3 className="text-base font-bold">{selectedPdf?.title ?? "Preview PDF"}</h3>
                        <p className="text-xs text-slate-400">{selectedPdf?.fileName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="hidden rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/80 sm:inline-flex">{viewerScaleLabel}</span>
                        <button type="button" onClick={toggleFullscreen} className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/15">
                          {isFullscreenActive ? "Keluar fullscreen" : "Fullscreen"}
                        </button>
                      </div>
                    </div>

                    <div className="relative flex-1 overflow-hidden bg-slate-950">
                      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950/90 to-transparent" />
                      <iframe
                        title={selectedPdf?.title ?? "PDF Viewer"}
                        src={resolvedPdfUrl ?? selectedPdf?.fileUrl}
                        className="h-full w-full border-0 bg-slate-950"
                      />
                      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950/90 to-transparent" />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-slate-300">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Interaktif</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">Mode {isFullscreenActive ? "Immersive" : "Compact"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={zoomOut} className="rounded-full bg-slate-800/90 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-700">-</button>
                        <button type="button" onClick={zoomIn} className="rounded-full bg-slate-800/90 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-700">+</button>
                        <button type="button" onClick={fitWidth} className="rounded-full bg-slate-800/90 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-700">Fit width</button>
                        <button type="button" onClick={resetZoom} className="rounded-full bg-slate-800/90 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-700">Reset</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
                Tidak ada file PDF yang tersedia saat ini. Silakan hubungi guru untuk menambahkan materi PDF.
              </div>
            )}

            {role === "siswa" ? (
              <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-indigo-600 dark:text-indigo-300">Kuis Pemahaman</p>
                    <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">Cek pemahamanmu setelah membaca materi</h3>
                  </div>
                  {quizScore !== null ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Skor: {quizScore}%</span>
                  ) : null}
                </div>

                {hasQuizQuestions ? (
                  <form onSubmit={handleSubmitQuiz} className="space-y-4">
                    {displayedQuizQuestions.map((question, index) => {
                      const selectedOption = quizAnswers[question.id] ?? "";
                      return (
                        <div key={`quiz-question-${question.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="font-semibold text-slate-900 dark:text-white">{index + 1}. {question.question}</p>
                            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Jawaban</span>
                          </div>
                          <div className="grid gap-3">
                            {question.options.map((option) => {
                              const checked = selectedOption === option;
                              const isCorrect = quizSubmitted && option === question.correctAnswer;
                              const isWrongSelection = quizSubmitted && checked && option !== question.correctAnswer;
                              return (
                                <label
                                  key={`option-${question.id}-${option}`}
                                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 transition ${checked ? "border-indigo-500 bg-indigo-50 text-slate-900 dark:border-indigo-400 dark:bg-indigo-950/40" : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"} ${isCorrect ? "ring-2 ring-emerald-400/30" : ""} ${isWrongSelection ? "border-rose-500 bg-rose-50 text-rose-700" : ""}`}
                                >
                                  <input
                                    type="radio"
                                    name={`quiz-${question.id}`}
                                    value={option}
                                    checked={checked}
                                    onChange={() => handleQuizAnswer(question.id, option)}
                                    className="h-4 w-4 accent-indigo-600"
                                  />
                                  <span>{option}</span>
                                </label>
                              );
                            })}
                          </div>
                          {quizSubmitted ? (
                            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Jawaban benar: <span className="text-emerald-700 dark:text-emerald-300">{question.correctAnswer}</span>
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="submit" className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700">
                        Periksa Jawaban
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQuizAnswers({});
                          setQuizSubmitted(false);
                          setQuizScore(null);
                        }}
                        className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                      >
                        Reset Kuis
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-300">
                    Guru belum menambahkan kuis pemahaman. Silakan cek kembali nanti.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {/* Hide the PDF list sidebar for students; teachers still get the full layout. */}
          {role !== "siswa" ? (
            <div className="space-y-6">
              <div className="rounded-[1.8rem] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-[0_16px_45px_-28px_rgba(15,23,42,0.7)] dark:border-slate-800 dark:from-slate-950 dark:to-slate-950">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Daftar PDF Materi</p>
                <div className="mt-4 space-y-3">
                  {availableDocuments.length > 0 ? (
                    availableDocuments.map((doc) => (
                      <button
                        key={`pdf-${doc.id}`}
                        type="button"
                        onClick={() => handleSelectPdf(doc)}
                        className={`w-full rounded-[1.4rem] border px-4 py-4 text-left transition ${
                          selectedPdf?.id === doc.id
                            ? "border-indigo-500 bg-gradient-to-r from-indigo-50 to-white shadow-[0_12px_30px_-20px_rgba(79,70,229,0.9)] dark:border-indigo-400/70 dark:from-indigo-950/50 dark:to-slate-900"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                        }`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{doc.title}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{doc.fileName}</p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            PDF
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Tidak ada file PDF yang tersedia.</p>
                  )}
                </div>
              </div>

            </div>
          ) : null}
        </div>
      </section>
    </div>

      <footer className="relative lg:fixed lg:inset-x-0 lg:bottom-0 z-30 h-auto border-t border-slate-200 bg-white/95 px-6 py-4 text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-100 lg:h-16">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/upgrisba-logo.png" alt="UPGRISBA Logo" className="h-10 w-10 rounded-2xl border border-slate-200/70 bg-slate-100/80 p-2 dark:border-slate-700 dark:bg-slate-900/80" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">@Pendidikan Informatika - Universitas PGRI Sumatera Barat</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pengalaman belajar profesional dengan desain premium kampus.</p>
            </div>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">© {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  );
}
