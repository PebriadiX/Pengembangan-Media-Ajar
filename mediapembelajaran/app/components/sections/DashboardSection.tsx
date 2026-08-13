"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartPie,
  faBookOpen,
  faClipboardList,
  faUsers,
  faVideo,
  faFilePdf,
  faPen,
  faTrash,
  faCheck,
  faTimes,
  faFloppyDisk,
  faPlus,
  faRotate,
  faFileArrowDown,
  faFileArrowUp,
  faChartLine,
  faQuestion,
  faGear,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import type { AssignmentItem, DocumentMaterial, EvaluationQuestion, Slide, SlideAttachment, VideoItem } from "@/app/lib/data";
import { updateAssignmentSubmissionStatusToSupabase, uploadPdfToSupabase, normalizeStoragePath, type AssignmentSubmissionItem, type EvaluationResultItem } from "@/app/lib/supabase-service";
import UploadMaterial from "@/app/components/UploadMaterial";

function normalizeYouTubeEmbedUrl(url: string) {
  const raw = url.trim();
  if (!raw) return raw;

  const ensureProtocol = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;

  try {
    const parsed = new URL(ensureProtocol);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname;

    if (host === "youtu.be" || host.endsWith(".youtu.be")) {
      const videoId = pathname.slice(1);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : raw;
    }

    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      if (pathname.startsWith("/embed/")) {
        return `https://www.youtube.com${pathname}${parsed.search}`;
      }
      if (pathname.startsWith("/watch")) {
        const videoId = parsed.searchParams.get("v");
        return videoId ? `https://www.youtube.com/embed/${videoId}` : raw;
      }
      if (pathname.startsWith("/shorts/")) {
        const parts = pathname.split("/");
        const videoId = parts[2];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : raw;
      }
    }
  } catch {
    // fallback to raw value on parse failure
  }

  return raw;
}

type StudentItem = {
  id: string;
  name: string;
  email: string;
  status: string;
  progress: number;
};

type DashboardSectionProps = {
  role: "siswa" | "guru";
  onRoleChange: (role: "siswa" | "guru") => void;
  className: string;
  classDescription: string;
  onClassChange: (name: string, description: string) => void;
  classIntroHighlights: string[];
  classCpPoints: string[];
  classAtpSteps: string[];
  onUpdateClassIntroContent: (payload: { highlights?: string[]; cpPoints?: string[]; atpSteps?: string[] }) => void;
  slides: Slide[];
  videos: VideoItem[];
  documentMaterials: DocumentMaterial[];
  assignments: AssignmentItem[];
  evaluationQuestions: EvaluationQuestion[];
  materialQuizQuestionIds: string[];
  students: StudentItem[];
  evaluationResults: EvaluationResultItem[];
  assignmentSubmissions: AssignmentSubmissionItem[];
  studentProgressAverage: number;
  onAddSlide: (payload: Omit<Slide, "id">) => void;
  onAddVideo: (payload: Omit<VideoItem, "id">) => void;
  onAddDocumentMaterial: (payload: Omit<DocumentMaterial, "id">) => void;
  onAddAssignment: (payload: Omit<AssignmentItem, "id">) => void;
  onAddEvaluation: (payload: Omit<EvaluationQuestion, "id">) => void;
  onUpdateMaterialQuiz: (questionIds: string[]) => void;
  onAddStudent: (payload: Omit<StudentItem, "id" | "progress">) => void;
  onUpdateSlide: (slideId: string, payload: Partial<Slide>) => void;
  onDeleteSlide: (slideId: string) => void;
  onUpdateVideo: (videoId: string, payload: Partial<VideoItem>) => void;
  onDeleteVideo: (videoId: string) => void;
  onUpdateDocumentMaterial: (documentId: string, payload: Partial<DocumentMaterial>) => void;
  onDeleteDocumentMaterial: (documentId: string) => void;
  onUpdateAssignment: (assignmentId: string, payload: Partial<AssignmentItem>) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onUpdateEvaluation: (evaluationId: string, payload: Partial<EvaluationQuestion>) => void;
  onDeleteEvaluation: (evaluationId: string) => void;
  onUpdateStudent: (studentId: string, payload: Partial<StudentItem>) => void;
  onDeleteStudent: (studentId: string) => void;
  onUpdateStudentProgress: (studentId: string, delta: number) => void;
  onResetToDefault: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onReactivateExam: () => void;
  examResetKey: number;
};

export function DashboardSection({
  role,
  onRoleChange,
  className,
  classDescription,
  onClassChange,
  classIntroHighlights,
  classCpPoints,
  classAtpSteps,
  onUpdateClassIntroContent,
  slides,
  videos,
  documentMaterials,
  assignments,
  evaluationQuestions,
  materialQuizQuestionIds,
  students,
  evaluationResults,
  assignmentSubmissions,
  studentProgressAverage,
  onAddSlide,
  onAddVideo,
  onAddDocumentMaterial,
  onAddAssignment,
  onAddEvaluation,
  onAddStudent,
  onUpdateSlide,
  onDeleteSlide,
  onUpdateVideo,
  onDeleteVideo,
  onUpdateDocumentMaterial,
  onDeleteDocumentMaterial,
  onUpdateAssignment,
  onDeleteAssignment,
  onUpdateEvaluation,
  onDeleteEvaluation,
  onUpdateStudent,
  onDeleteStudent,
  onUpdateStudentProgress,
  onUpdateMaterialQuiz,
  onResetToDefault,
  onExportData,
  onImportData,
  onReactivateExam,
  examResetKey,
}: DashboardSectionProps) {
  const [slideForm, setSlideForm] = useState({ title: "", badge: "Baru", subtitle: "", body: "" });
  const [slideAttachmentFiles, setSlideAttachmentFiles] = useState<File[]>([]);
  const [slideAttachments, setSlideAttachments] = useState<SlideAttachment[]>([]);
  const [videoForm, setVideoForm] = useState({ title: "", duration: "", tag: "", embedUrl: "", description: "" });
  const [documentForm, setDocumentForm] = useState({ title: "", description: "", fileName: "", fileUrl: "", fileType: "PDF" });
  const [assignmentForm, setAssignmentForm] = useState({ title: "", badge: "Tugas", description: "", instructions: "" });
  const [evaluationForm, setEvaluationForm] = useState({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "" });
  const [studentForm, setStudentForm] = useState({ name: "", email: "", status: "Aktif" });
  const [studentFeedback, setStudentFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isStudentSubmitting, setIsStudentSubmitting] = useState(false);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  const [expandedBankSoal, setExpandedBankSoal] = useState(false);
  const [expandedRiwayatPenilaian, setExpandedRiwayatPenilaian] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [editingEvaluationId, setEditingEvaluationId] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentItem | null>(null);
  const [selectedMaterialQuizIds, setSelectedMaterialQuizIds] = useState<string[]>(materialQuizQuestionIds);
  const [introHighlightsInput, setIntroHighlightsInput] = useState(classIntroHighlights.join("\n"));
  const [cpPointsInput, setCpPointsInput] = useState(classCpPoints.join("\n"));
  const [atpStepsInput, setAtpStepsInput] = useState(classAtpSteps.join("\n"));
  const [submissionStatusMap, setSubmissionStatusMap] = useState<Record<number, string>>({});
  const [activeAdminTab, setActiveAdminTab] = useState<"overview" | "content" | "assignments" | "evaluations" | "students">("overview");

  useEffect(() => {
    setSelectedMaterialQuizIds(materialQuizQuestionIds);
  }, [materialQuizQuestionIds]);

  useEffect(() => {
    setIntroHighlightsInput(classIntroHighlights.join("\n"));
  }, [classIntroHighlights]);

  useEffect(() => {
    setCpPointsInput(classCpPoints.join("\n"));
  }, [classCpPoints]);

  useEffect(() => {
    setAtpStepsInput(classAtpSteps.join("\n"));
  }, [classAtpSteps]);

  useEffect(() => {
    setSubmissionStatusMap(
      Object.fromEntries(assignmentSubmissions.map((submission) => [submission.id, submission.status]))
    );
  }, [assignmentSubmissions]);

  const buildSlideAttachments = async (files: File[]) => {
    const uploadedAttachments: SlideAttachment[] = [];

    for (const file of files) {
      const storagePath = await uploadPdfToSupabase(file);
      const normalizedStoragePath = normalizeStoragePath(storagePath ?? "");
      if (!normalizedStoragePath) continue;

      const fileExtension = file.name.split(".").pop()?.toUpperCase() || "FILE";
      uploadedAttachments.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        fileName: file.name,
        fileUrl: normalizedStoragePath,
        fileType: fileExtension,
      });
    }

    return uploadedAttachments;
  };

  const handleSlideAttachmentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    setSlideAttachmentFiles(files);
  };

  const handleAddSlide = async (event: React.FormEvent) => {
    event.preventDefault();

    const uploadedAttachments = await buildSlideAttachments(slideAttachmentFiles);
    const attachments = [...slideAttachments, ...uploadedAttachments].filter((attachment, index, self) => self.findIndex((item) => item.fileUrl === attachment.fileUrl) === index);

    onAddSlide({
      title: slideForm.title,
      badge: slideForm.badge,
      subtitle: slideForm.subtitle,
      body: slideForm.body || "<p>Isi materi baru</p>",
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    setSlideForm({ title: "", badge: "Baru", subtitle: "", body: "" });
    setSlideAttachmentFiles([]);
    setSlideAttachments([]);
  };

  const handleAddVideo = (event: React.FormEvent) => {
    event.preventDefault();
    onAddVideo({
      title: videoForm.title,
      duration: videoForm.duration,
      tag: videoForm.tag,
      embedUrl: normalizeYouTubeEmbedUrl(videoForm.embedUrl),
      description: videoForm.description,
    });
    setVideoForm({ title: "", duration: "", tag: "", embedUrl: "", description: "" });
  };

  const handleDocumentFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    const inferredExtension = file.name.split(".").pop()?.toUpperCase() || "FILE";
    const storagePath = await uploadPdfToSupabase(file);
    const normalizedStoragePath = normalizeStoragePath(storagePath ?? "");

    if (!normalizedStoragePath) {
      console.error("[Dashboard PDF] upload failed for document selection; persisted path is empty.", {
        fileName: file.name,
        bucket: "materi-pdf",
      });
      window.alert("Upload PDF gagal. Periksa policy Supabase Storage bucket `materi-pdf` dan izin upload anon key.");
    }

    setDocumentForm((prev) => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
      fileName: file.name,
      fileType: inferredExtension,
      fileUrl: normalizedStoragePath || "",
    }));

    input.value = "";
  };

  const handleAddDocumentMaterial = (event: React.FormEvent) => {
    event.preventDefault();
    const rawFileUrl = String(documentForm.fileUrl ?? "").trim();
    const normalizedFileUrl = normalizeStoragePath(rawFileUrl);
    console.debug("[Document add] normalizedFileUrl before commit", {
      rawFileUrl,
      normalizedFileUrl,
      title: documentForm.title,
      fileName: documentForm.fileName,
    });

    if (!normalizedFileUrl || /^(blob:|data:)/i.test(rawFileUrl)) {
      window.alert("Dokumen PDF belum tersedia untuk disimpan. Pastikan file upload berhasil dan path storage valid.");
      return;
    }

    onAddDocumentMaterial({
      title: documentForm.title,
      description: documentForm.description,
      fileName: documentForm.fileName,
      fileUrl: normalizedFileUrl,
      fileType: documentForm.fileType,
    });
    setDocumentForm({ title: "", description: "", fileName: "", fileUrl: "", fileType: "PDF" });
  };

  const handleAddAssignment = (event: React.FormEvent) => {
    event.preventDefault();
    onAddAssignment({
      title: assignmentForm.title,
      badge: assignmentForm.badge,
      description: assignmentForm.description,
      instructions: assignmentForm.instructions.split(",").map((item) => item.trim()).filter(Boolean),
      starterCode: `<div style="font-family: Arial, sans-serif; padding: 24px;">
  <h2>Contoh tugas baru</h2>
  <p>Tambahkan kode Anda di sini.</p>
</div>`,
    });
    setAssignmentForm({ title: "", badge: "Tugas", description: "", instructions: "" });
  };

  const handleAddEvaluation = (event: React.FormEvent) => {
    event.preventDefault();
    onAddEvaluation({
      question: evaluationForm.question,
      options: [evaluationForm.optionA, evaluationForm.optionB, evaluationForm.optionC, evaluationForm.optionD].filter(Boolean),
      correctAnswer: evaluationForm.correctAnswer,
    });
    setEvaluationForm({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "" });
  };

  const handleToggleMaterialQuizQuestion = (questionId: string) => {
    setSelectedMaterialQuizIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };

  const handleSaveMaterialQuiz = (event: React.FormEvent) => {
    event.preventDefault();
    onUpdateMaterialQuiz(selectedMaterialQuizIds);
  };

  const handleAddStudent = (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedName = studentForm.name.trim();
    const normalizedEmail = studentForm.email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
      setStudentFeedback({ type: "error", message: "Nama dan email siswa wajib diisi." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setStudentFeedback({ type: "error", message: "Format email tidak valid." });
      return;
    }

    const isDuplicate = students.some(
      (student) => student.email.trim().toLowerCase() === normalizedEmail && student.id !== editingStudentId
    );

    if (isDuplicate) {
      setStudentFeedback({ type: "error", message: "Email siswa sudah terdaftar. Gunakan email lain." });
      return;
    }

    setIsStudentSubmitting(true);
    setStudentFeedback(null);

    onAddStudent({
      name: normalizedName,
      email: normalizedEmail,
      status: studentForm.status,
    });

    setStudentForm({ name: "", email: "", status: "Aktif" });
    setStudentFeedback({ type: "success", message: "Siswa berhasil ditambahkan." });
    setIsStudentSubmitting(false);
  };

  const handleDeleteStudent = () => {
    if (!studentToDelete) return;

    setIsDeletingStudent(true);
    setStudentFeedback(null);
    onDeleteStudent(studentToDelete.id);
    setStudentToDelete(null);
    setStudentFeedback({ type: "success", message: `Siswa ${studentToDelete.name} berhasil dihapus.` });
    setIsDeletingStudent(false);
  };

  const startEditSlide = (slide: Slide) => {
    setEditingSlideId(slide.id);
    setSlideForm({ title: slide.title, badge: slide.badge, subtitle: slide.subtitle, body: slide.body });
    setSlideAttachments(slide.attachments ?? []);
    setSlideAttachmentFiles([]);
  };

  const saveSlide = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingSlideId) return;

    const uploadedAttachments = await buildSlideAttachments(slideAttachmentFiles);
    const attachments = [...slideAttachments, ...uploadedAttachments].filter((attachment, index, self) => self.findIndex((item) => item.fileUrl === attachment.fileUrl) === index);

    onUpdateSlide(editingSlideId, {
      title: slideForm.title,
      badge: slideForm.badge,
      subtitle: slideForm.subtitle,
      body: slideForm.body,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    setEditingSlideId(null);
    setSlideForm({ title: "", badge: "Baru", subtitle: "", body: "" });
    setSlideAttachmentFiles([]);
    setSlideAttachments([]);
  };

  const startEditVideo = (video: VideoItem) => {
    setEditingVideoId(video.id);
    setVideoForm({ title: video.title, duration: video.duration, tag: video.tag, embedUrl: video.embedUrl, description: video.description });
  };

  const saveVideo = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingVideoId) return;
    onUpdateVideo(editingVideoId, {
      title: videoForm.title,
      duration: videoForm.duration,
      tag: videoForm.tag,
      embedUrl: normalizeYouTubeEmbedUrl(videoForm.embedUrl),
      description: videoForm.description,
    });
    setEditingVideoId(null);
    setVideoForm({ title: "", duration: "", tag: "", embedUrl: "", description: "" });
  };

  const startEditDocument = (documentMaterial: DocumentMaterial) => {
    setEditingDocumentId(documentMaterial.id);
    setDocumentForm({ title: documentMaterial.title, description: documentMaterial.description, fileName: documentMaterial.fileName, fileUrl: documentMaterial.fileUrl, fileType: documentMaterial.fileType });
  };

  const saveDocument = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingDocumentId) return;
    onUpdateDocumentMaterial(editingDocumentId, {
      title: documentForm.title,
      description: documentForm.description,
      fileName: documentForm.fileName,
      fileUrl: documentForm.fileUrl,
      fileType: documentForm.fileType,
    });
    setEditingDocumentId(null);
    setDocumentForm({ title: "", description: "", fileName: "", fileUrl: "", fileType: "PDF" });
  };

  const startEditAssignment = (assignment: AssignmentItem) => {
    setEditingAssignmentId(assignment.id);
    setAssignmentForm({ title: assignment.title, badge: assignment.badge, description: assignment.description, instructions: assignment.instructions.join(", ") });
  };

  const saveAssignment = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingAssignmentId) return;
    onUpdateAssignment(editingAssignmentId, {
      title: assignmentForm.title,
      badge: assignmentForm.badge,
      description: assignmentForm.description,
      instructions: assignmentForm.instructions.split(",").map((item) => item.trim()).filter(Boolean),
      starterCode: `<div style="font-family: Arial, sans-serif; padding: 24px;">
  <h2>Contoh tugas baru</h2>
  <p>Tambahkan kode Anda di sini.</p>
</div>`,
    });
    setEditingAssignmentId(null);
    setAssignmentForm({ title: "", badge: "Tugas", description: "", instructions: "" });
  };

  const startEditEvaluation = (question: EvaluationQuestion) => {
    setEditingEvaluationId(question.id);
    const titleMatch = question.question.match(/^\[(.*?)\]\s*(.*)$/);
    const title = titleMatch?.[1] ?? "";
    const questionText = titleMatch?.[2] ?? question.question;
    setEvaluationForm({ question: questionText, optionA: question.options[0] ?? "", optionB: question.options[1] ?? "", optionC: question.options[2] ?? "", optionD: question.options[3] ?? "", correctAnswer: question.correctAnswer });
  };

  const saveEvaluation = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingEvaluationId) return;
    onUpdateEvaluation(editingEvaluationId, {
      question: evaluationForm.question,
      options: [evaluationForm.optionA, evaluationForm.optionB, evaluationForm.optionC, evaluationForm.optionD].filter(Boolean),
      correctAnswer: evaluationForm.correctAnswer,
    });
    setEditingEvaluationId(null);
    setEvaluationForm({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "" });
  };

  const startEditStudent = (student: StudentItem) => {
    setEditingStudentId(student.id);
    setStudentForm({ name: student.name, email: student.email, status: student.status });
    setStudentFeedback(null);
  };

  const saveStudent = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingStudentId) return;

    const normalizedName = studentForm.name.trim();
    const normalizedEmail = studentForm.email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
      setStudentFeedback({ type: "error", message: "Nama dan email siswa wajib diisi." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setStudentFeedback({ type: "error", message: "Format email tidak valid." });
      return;
    }

    const isDuplicate = students.some(
      (student) => student.email.trim().toLowerCase() === normalizedEmail && student.id !== editingStudentId
    );

    if (isDuplicate) {
      setStudentFeedback({ type: "error", message: "Email siswa sudah terdaftar. Gunakan email lain." });
      return;
    }

    setIsStudentSubmitting(true);
    setStudentFeedback(null);

    onUpdateStudent(editingStudentId, {
      name: normalizedName,
      email: normalizedEmail,
      status: studentForm.status,
    });

    setEditingStudentId(null);
    setStudentForm({ name: "", email: "", status: "Aktif" });
    setStudentFeedback({ type: "success", message: "Data siswa berhasil diperbarui." });
    setIsStudentSubmitting(false);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Diterima";
      case "rejected":
        return "Ditolak";
      case "submitted":
      default:
        return "Menunggu";
    }
  };

  const getStatusClassName = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
      case "rejected":
        return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
      case "submitted":
      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
    }
  };

  const handleSubmissionReview = async (submissionId: number, nextStatus: string) => {
    const ok = await updateAssignmentSubmissionStatusToSupabase(submissionId, nextStatus);
    if (ok) {
      setSubmissionStatusMap((prev) => ({ ...prev, [submissionId]: nextStatus }));
    }
  };

  if (role !== "guru") {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-indigo-500">Area siswa</p>
          <h3 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">Anda melihat ruang belajar yang fokus pada progres</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Fitur menambah dan mengelola materi hanya tersedia untuk guru. Siswa bisa mengikuti materi, mengerjakan tugas, dan melihat ringkasan perkembangan belajar mereka.
          </p>
        {[
          { id: "overview" as const, icon: faChartPie, label: "Ringkasan" },
          { id: "content" as const, icon: faBookOpen, label: "Konten" },
          { id: "assignments" as const, icon: faClipboardList, label: "Tugas" },
          // Hasil Evaluasi -> navigasi ke halaman baru
          { id: "hasil-evaluasi", icon: faChartLine, label: "Hasil Evaluasi", href: "/admin/hasil-evaluasi" },
          { id: "evaluations" as const, icon: faFilePdf, label: "Evaluasi" },
          { id: "students" as const, icon: faUsers, label: "Siswa" },
        ].map((tab) => {
          if ((tab as any).href) {
            return (
              <Link key={(tab as any).id} href={(tab as any).href} className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition whitespace-nowrap ${"text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
                <span className="inline-flex items-center gap-2">
                  <FontAwesomeIcon icon={(tab as any).icon} />
                  <span>{tab.label}</span>
                </span>
              </Link>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition whitespace-nowrap ${
                activeAdminTab === tab.id
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}>
              <span className="inline-flex items-center gap-2">
                <FontAwesomeIcon icon={tab.icon as any} />
                <span>{tab.label}</span>
              </span>
            </button>
          );
        })}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-indigo-500">Aktivitas Anda</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>• Buka materi dan video pembelajaran.</li>
            <li>• Kerjakan tugas dan kirimkan jawaban Anda.</li>
            <li>• Lihat hasil evaluasi setelah menyelesaikan latihan.</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white shadow-lg shadow-emerald-500/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-100">Pusat Admin Kelas</p>
            <h2 className="mt-2 text-2xl font-black md:text-3xl">{className}</h2>
            <p className="mt-1 max-w-2xl text-sm text-emerald-50/90">{classDescription}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-widest text-emerald-100">Total Konten</p>
              <p className="mt-1 text-2xl font-bold">{slides.length + videos.length}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-widest text-emerald-100">Siswa Aktif</p>
              <p className="mt-1 text-2xl font-bold">{students.length}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-widest text-emerald-100">Kiriman Menunggu</p>
              <p className="mt-1 text-2xl font-bold">{assignmentSubmissions.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {[
          { id: "overview" as const, icon: faChartPie, label: "Ringkasan" },
          { id: "content" as const, icon: faBookOpen, label: "Konten" },
          { id: "assignments" as const, icon: faClipboardList, label: "Tugas" },
          { id: "hasil-evaluasi", icon: faChartLine, label: "Hasil Evaluasi", href: "/admin/hasil-evaluasi" },
          { id: "evaluations" as const, icon: faFilePdf, label: "Evaluasi" },
          { id: "students" as const, icon: faUsers, label: "Siswa" },
        ].map((tab) => {
          if ((tab as any).href) {
            return (
              <Link key={(tab as any).id} href={(tab as any).href} className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition whitespace-nowrap ${"text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
                <span className="inline-flex items-center gap-2">
                  <FontAwesomeIcon icon={(tab as any).icon} />
                  <span>{tab.label}</span>
                </span>
              </Link>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition whitespace-nowrap ${
                activeAdminTab === tab.id
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}>
              <span className="inline-flex items-center gap-2">
                <FontAwesomeIcon icon={tab.icon as any} />
                <span>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {activeAdminTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Materi Aktif</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{slides.length}</p>
                </div>
                <div className="text-4xl"><FontAwesomeIcon icon={faBookOpen} /></div>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Slide pembelajaran</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Video</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{videos.length}</p>
                </div>
                <div className="text-4xl"><FontAwesomeIcon icon={faVideo} /></div>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Konten video</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tugas</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{assignments.length}</p>
                </div>
                <div className="text-4xl"><FontAwesomeIcon icon={faClipboardList} /></div>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Penugasan aktif</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Progres Kelas</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{studentProgressAverage}%</p>
                </div>
                <div className="text-4xl"><FontAwesomeIcon icon={faChartLine} /></div>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Rata-rata siswa</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white"><span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faGear} />Pengaturan Kelas</span></h3>
            <div className="mt-4 grid gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nama Kelas</label>
                <input
                  value={className}
                  onChange={(event) => onClassChange(event.target.value, classDescription)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950"
                  placeholder="Masukkan nama kelas"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Deskripsi Kelas</label>
                <textarea
                  value={classDescription}
                  onChange={(event) => onClassChange(className, event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950"
                  placeholder="Deskripsi singkat kelas"
                  rows={3}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={onExportData} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                  <span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faFileArrowDown} />Ekspor Data</span>
                </button>
                <label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                  <span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faFileArrowUp} />Impor Data</span>
                  <input type="file" accept="application/json" className="hidden" onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onImportData(file);
                    event.target.value = "";
                  }} />
                </label>
                <button type="button" onClick={onResetToDefault} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                  <span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faRotate} />Atur Ulang</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300"><FontAwesomeIcon icon={faCheck} className="mr-2" />Tugas Menunggu Review</p>
              <p className="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-100">{assignmentSubmissions.length}</p>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Kiriman siswa perlu penilaian</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900/60 dark:bg-violet-950/30">
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300"><FontAwesomeIcon icon={faChartPie} className="mr-2" />Hasil Evaluasi</p>
              <p className="mt-2 text-2xl font-bold text-violet-900 dark:text-violet-100">{evaluationResults.length}</p>
              <p className="mt-1 text-xs text-violet-600 dark:text-violet-400">Penilaian tersimpan</p>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === "content" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white"><span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faBookOpen} />Kelola Slide Materi</span></h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tambah, edit, atau hapus materi pembelajaran</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {slides.length} slide
              </span>
            </div>
            <form onSubmit={editingSlideId ? saveSlide : handleAddSlide} className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="grid gap-3 md:grid-cols-2">
                <input value={slideForm.title} onChange={(event) => setSlideForm((prev) => ({ ...prev, title: event.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Judul slide" required />
                <input value={slideForm.badge} onChange={(event) => setSlideForm((prev) => ({ ...prev, badge: event.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Badge/Kategori" required />
              </div>
              <input value={slideForm.subtitle} onChange={(event) => setSlideForm((prev) => ({ ...prev, subtitle: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Subjudul/Ringkasan" />
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <label className="flex cursor-pointer flex-col gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white"><FontAwesomeIcon icon={faFilePdf} className="mr-2" />Tambahkan Lampiran Modul (PDF atau file lain)</span>
                  <input type="file" accept="application/pdf,.doc,.docx,.ppt,.pptx,.txt,image/*" multiple className="text-sm" onChange={handleSlideAttachmentSelect} />
                </label>
                {slideAttachmentFiles.length > 0 ? (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">File siap diunggah: {slideAttachmentFiles.map((file) => file.name).join(", ")}</p>
                ) : null}
                {slideAttachments.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {slideAttachments.map((attachment) => (
                      <div key={`attachment-${attachment.id}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{attachment.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{attachment.fileName}</p>
                        </div>
                        <button type="button" onClick={() => setSlideAttachments((prev) => prev.filter((item) => item.id !== attachment.id))} className="text-xs font-semibold text-rose-600 dark:text-rose-300">Hapus</button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <button type="submit" className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700">
                {editingSlideId ? <><FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />Simpan Perubahan</> : <><FontAwesomeIcon icon={faPlus} className="mr-2" />Tambah Slide</>}
              </button>
            </form>
            <div className="mt-6 space-y-2 max-h-96 overflow-y-auto">
              {slides.length === 0 ? (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">Belum ada slide. Mulai tambah materi baru.</p>
              ) : (
                slides.map((slide) => (
                  <div key={`slide-${slide.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-900/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{slide.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full dark:bg-indigo-950/40 dark:text-indigo-300">{slide.badge}</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{slide.subtitle}</p>
                        </div>
                        {slide.attachments && slide.attachments.length > 0 ? (
                          <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-300">{slide.attachments.length} lampiran modul</p>
                        ) : null}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button type="button" onClick={() => startEditSlide(slide)} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"><FontAwesomeIcon icon={faPen} /></button>
                        <button type="button" onClick={() => onDeleteSlide(slide.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"><FontAwesomeIcon icon={faTrash} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white"><span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faVideo} />Kelola Video</span></h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Publikasikan dan kelola konten video pembelajaran</p>
              </div>
              <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                {videos.length} video
              </span>
            </div>
            <form onSubmit={editingVideoId ? saveVideo : handleAddVideo} className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="grid gap-3 md:grid-cols-2">
                <input value={videoForm.title} onChange={(event) => setVideoForm((prev) => ({ ...prev, title: event.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Judul video" required />
                <input value={videoForm.duration} onChange={(event) => setVideoForm((prev) => ({ ...prev, duration: event.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Durasi (mis: 15:30)" required />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input value={videoForm.tag} onChange={(event) => setVideoForm((prev) => ({ ...prev, tag: event.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Tag/Kategori" required />
                <input value={videoForm.embedUrl} onChange={(event) => setVideoForm((prev) => ({ ...prev, embedUrl: event.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="URL YouTube embed" required />
              </div>
              <textarea value={videoForm.description} onChange={(event) => setVideoForm((prev) => ({ ...prev, description: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Deskripsi video" rows={3} required />
              <button type="submit" className="w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-700">
                {editingVideoId ? <><FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />Simpan Perubahan</> : <><FontAwesomeIcon icon={faPlus} className="mr-2" />Tambah Video</>}
              </button>
            </form>
            <div className="mt-6 space-y-2 max-h-96 overflow-y-auto">
              {videos.length === 0 ? (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">Belum ada video. Mulai publikasikan video pertama.</p>
              ) : (
                videos.map((video) => (
                  <div key={`video-${video.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-900/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{video.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full dark:bg-orange-950/40 dark:text-orange-300">{video.tag}</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{video.duration}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button type="button" onClick={() => startEditVideo(video)} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"><FontAwesomeIcon icon={faPen} /></button>
                        <button type="button" onClick={() => onDeleteVideo(video.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"><FontAwesomeIcon icon={faTrash} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white"><span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faFilePdf} />Kelola Dokumen</span></h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tambahkan, edit, atau hapus dokumen dan modul PDF.</p>
              </div>
              <span className="rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                {documentMaterials.length} dokumen
              </span>
            </div>
            <form onSubmit={editingDocumentId ? saveDocument : handleAddDocumentMaterial} className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="grid gap-3 md:grid-cols-2">
                <input value={documentForm.title} onChange={(event) => setDocumentForm((prev) => ({ ...prev, title: event.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Judul dokumen" required />
                <input value={documentForm.fileName} readOnly className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none transition dark:border-slate-800 dark:bg-slate-950" placeholder="Nama file" />
              </div>
              <textarea value={documentForm.description} onChange={(event) => setDocumentForm((prev) => ({ ...prev, description: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Deskripsi singkat" rows={3} />
              <label className="flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                <span className="font-semibold">Unggah Dokumen PDF</span>
                <input type="file" accept="application/pdf" className="text-sm" onChange={handleDocumentFileSelect} />
              </label>
              {documentForm.fileName ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">File terpilih: {documentForm.fileName}</p>
              ) : null}
              <button type="submit" className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-700">
                {editingDocumentId ? <><FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />Simpan Perubahan</> : <><FontAwesomeIcon icon={faPlus} className="mr-2" />Tambah Dokumen</>}
              </button>
            </form>
            <div className="mt-6 space-y-2 max-h-96 overflow-y-auto">
              {documentMaterials.length === 0 ? (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">Belum ada dokumen. Tambahkan dokumen baru untuk siswa.</p>
              ) : (
                documentMaterials.map((documentMaterial) => (
                  <div key={`document-${documentMaterial.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-900/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{documentMaterial.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{documentMaterial.fileName}</p>
                        {documentMaterial.description ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{documentMaterial.description}</p> : null}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button type="button" onClick={() => startEditDocument(documentMaterial)} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"><FontAwesomeIcon icon={faPen} /></button>
                        <button type="button" onClick={() => onDeleteDocumentMaterial(documentMaterial.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"><FontAwesomeIcon icon={faTrash} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === "assignments" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white"><span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faClipboardList} />Kelola Tugas</span></h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Buat dan kelola penugasan untuk siswa</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {assignments.length} tugas
              </span>
            </div>
            <form onSubmit={editingAssignmentId ? saveAssignment : handleAddAssignment} className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
              <input value={assignmentForm.title} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, title: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Judul tugas" required />
              <div className="grid gap-3 md:grid-cols-2">
                <input value={assignmentForm.badge} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, badge: event.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Badge" required />
              </div>
              <textarea value={assignmentForm.description} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, description: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Deskripsi tugas" rows={3} required />
              <textarea value={assignmentForm.instructions} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, instructions: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Instruksi (pisahkan dengan koma)" rows={2} required />
              <button type="submit" className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700">
                {editingAssignmentId ? <><FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />Simpan Perubahan</> : <><FontAwesomeIcon icon={faPlus} className="mr-2" />Tambah Tugas</>}
              </button>
            </form>
            <div className="mt-6 space-y-2 max-h-96 overflow-y-auto">
              {assignments.length === 0 ? (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">Belum ada tugas. Mulai buat penugasan baru.</p>
              ) : (
                assignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-900/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{assignment.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full dark:bg-emerald-950/40 dark:text-emerald-300">{assignment.badge}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button type="button" onClick={() => startEditAssignment(assignment)} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"><FontAwesomeIcon icon={faPen} /></button>
                        <button type="button" onClick={() => onDeleteAssignment(assignment.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"><FontAwesomeIcon icon={faTrash} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white"><span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faClipboardList} />Penilaian Tugas</span></h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review dan nilai pengiriman siswa</p>
              </div>
              <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {assignmentSubmissions.length} menunggu
              </span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {assignmentSubmissions.length === 0 ? (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">Belum ada pengiriman tugas.</p>
              ) : (
                assignmentSubmissions.map((submission) => {
                  const assignmentTitle = assignments.find((item) => item.id === submission.assignment_id)?.title ?? submission.assignment_id;
                  const effectiveStatus = submissionStatusMap[submission.id] ?? submission.status;
                  return (
                    <div key={submission.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white">{submission.student_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{assignmentTitle}</p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${
                          effectiveStatus === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" :
                          effectiveStatus === "rejected" ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" :
                          "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}>
                          {effectiveStatus === "approved" ? <><FontAwesomeIcon icon={faCheck} className="mr-1" />Diterima</> : effectiveStatus === "rejected" ? <><FontAwesomeIcon icon={faTimes} className="mr-1" />Ditolak</> : <><FontAwesomeIcon icon={faClock} className="mr-1" />Menunggu</>}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button type="button" onClick={() => void handleSubmissionReview(submission.id, "approved")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"><FontAwesomeIcon icon={faCheck} className="mr-1" />Terima</button>
                        <button type="button" onClick={() => void handleSubmissionReview(submission.id, "rejected")} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"><FontAwesomeIcon icon={faTimes} className="mr-1" />Tolak</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === "evaluations" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white"><span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faQuestion} />Bank Soal</span></h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Buat dan kelola pertanyaan evaluasi</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                  {evaluationQuestions.length} soal
                </span>
                <button type="button" onClick={onReactivateExam} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"><FontAwesomeIcon icon={faRotate} /> Reset Ujian</button>
              </div>
            </div>
            <form onSubmit={editingEvaluationId ? saveEvaluation : handleAddEvaluation} className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
              <textarea value={evaluationForm.question} onChange={(event) => setEvaluationForm((prev) => ({ ...prev, question: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Pertanyaan" rows={2} required />
              <div className="grid gap-3 md:grid-cols-4">
                <input value={evaluationForm.optionA} onChange={(event) => setEvaluationForm((prev) => ({ ...prev, optionA: event.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Pilihan A" required />
                <input value={evaluationForm.optionB} onChange={(event) => setEvaluationForm((prev) => ({ ...prev, optionB: event.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Pilihan B" required />
                <input value={evaluationForm.optionC} onChange={(event) => setEvaluationForm((prev) => ({ ...prev, optionC: event.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Pilihan C" required />
                <input value={evaluationForm.optionD} onChange={(event) => setEvaluationForm((prev) => ({ ...prev, optionD: event.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Pilihan D" />
              </div>
              <input value={evaluationForm.correctAnswer} onChange={(event) => setEvaluationForm((prev) => ({ ...prev, correctAnswer: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950" placeholder="Jawaban yang benar" required />
              <button type="submit" className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700">
                {editingEvaluationId ? <><FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />Simpan Perubahan</> : <><FontAwesomeIcon icon={faPlus} className="mr-2" />Tambah Soal</>}
              </button>
            </form>
            <div className="mt-6 space-y-2 max-h-96 overflow-y-auto">
              {evaluationQuestions.length === 0 ? (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">Belum ada soal evaluasi. Mulai buat soal baru.</p>
              ) : (
                evaluationQuestions.map((question) => (
                  <div key={`evaluation-question-${question.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-900/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{question.question}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Jawaban: <span className="font-semibold">{question.correctAnswer}</span></p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button type="button" onClick={() => startEditEvaluation(question)} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"><FontAwesomeIcon icon={faPen} /></button>
                        <button type="button" onClick={() => onDeleteEvaluation(question.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"><FontAwesomeIcon icon={faTrash} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white"><span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faChartPie} />Hasil Evaluasi</span></h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Lihat skor evaluasi siswa</p>
              </div>
              <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                {evaluationResults.length} hasil
              </span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {evaluationResults.length === 0 ? (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">Belum ada data evaluasi.</p>
              ) : (
                evaluationResults.map((result) => (
                  <div key={`evaluation-result-${result.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{result.student_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(result.submitted_at).toLocaleString("id-ID")}</p>
                      </div>
                      <span className="text-lg font-bold text-violet-600 dark:text-violet-400">{result.score}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/95 shadow-[0_30px_90px_rgba(15,23,42,0.75)]">
            <div className="bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white shadow-inner">
                    <FontAwesomeIcon icon={faTrash} className="text-lg" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">Konfirmasi</p>
                    <h3 className="text-xl font-black text-white">Hapus siswa</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
                  <FontAwesomeIcon icon={faTimes} className="text-lg" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">Anda yakin ingin menghapus siswa ini?</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Data <span className="font-semibold text-white">{studentToDelete.name}</span> ({studentToDelete.email}) akan dihapus secara permanen dari daftar kelas.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setStudentToDelete(null)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteStudent}
                  disabled={isDeletingStudent}
                  className="rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_18px_40px_rgba(244,63,94,0.32)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingStudent ? (
                    <span className="inline-flex items-center gap-2"><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" className="opacity-30" stroke="currentColor" strokeWidth="3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>Menghapus...</span>
                  ) : "Ya, hapus siswa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === "students" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white"><span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faUsers} />Kelola Siswa</span></h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tambah, edit, atau kelola data siswa kelas</p>
            </div>
            <span className="rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
              {students.length} siswa
            </span>
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 mb-6 dark:border-sky-900/60 dark:bg-sky-950/30">
            <p className="text-sm font-bold text-sky-900 dark:text-sky-200 mb-3">{editingStudentId ? <><FontAwesomeIcon icon={faPen} className="mr-2" />Edit Data Siswa</> : <><FontAwesomeIcon icon={faPlus} className="mr-2" />Tambah Siswa Baru</>}</p>
            <form onSubmit={editingStudentId ? saveStudent : handleAddStudent} className="space-y-3">
              <input value={studentForm.name} onChange={(event) => setStudentForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-sky-900/60 dark:bg-slate-900 dark:text-white" placeholder="Nama siswa" required disabled={isStudentSubmitting || isDeletingStudent} />
              <input value={studentForm.email} onChange={(event) => setStudentForm((prev) => ({ ...prev, email: event.target.value }))} className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-sky-900/60 dark:bg-slate-900 dark:text-white" placeholder="Email siswa" required disabled={isStudentSubmitting || isDeletingStudent} />
              <select value={studentForm.status} onChange={(event) => setStudentForm((prev) => ({ ...prev, status: event.target.value }))} className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-sky-900/60 dark:bg-slate-900 dark:text-white" disabled={isStudentSubmitting || isDeletingStudent}>
                <option value="Aktif">Aktif</option>
                <option value="Baru">Baru</option>
                <option value="Cuti">Cuti</option>
                <option value="Lulus">Lulus</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" disabled={isStudentSubmitting || isDeletingStudent} className="flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-3 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60">
                  {isStudentSubmitting ? (
                    <span className="inline-flex items-center justify-center gap-2"><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" className="opacity-30" stroke="currentColor" strokeWidth="3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>Memproses...</span>
                  ) : editingStudentId ? (
                    <><FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />Simpan</>
                  ) : (
                    <><FontAwesomeIcon icon={faPlus} className="mr-2" />Tambah</>
                  )}
                </button>
                {editingStudentId && (
                  <button type="button" onClick={() => { setEditingStudentId(null); setStudentForm({ name: "", email: "", status: "Aktif" }); setStudentFeedback(null); }} disabled={isStudentSubmitting || isDeletingStudent} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">Batal</button>
                )}
              </div>
              {studentFeedback && (
                <div className={`rounded-xl border px-3 py-2 text-sm ${studentFeedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300" : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300"}`}>
                  {studentFeedback.message}
                </div>
              )}
            </form>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {students.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950/50">
                <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada siswa. Mulai tambah siswa baru.</p>
              </div>
            ) : (
              students.map((student) => (
                <div key={`student-${student.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-900/50">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500 text-sm font-bold text-white flex-shrink-0">
                        {student.name?.[0]?.toUpperCase() ?? "S"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{student.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          student.status === "Aktif" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" :
                          student.status === "Baru" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" :
                          student.status === "Lulus" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" :
                          "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}>
                          {student.status}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 rounded-full bg-slate-200 dark:bg-slate-700">
                            <div className="h-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-500 transition-all" style={{ width: `${student.progress}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 min-w-[30px]">{student.progress}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                          <button type="button" onClick={() => startEditStudent(student)} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"><FontAwesomeIcon icon={faPen} /></button>
                          <button type="button" onClick={() => setStudentToDelete(student)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"><FontAwesomeIcon icon={faTrash} /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
