"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faBell, faMoon, faRightFromBracket, faSun, faTimes, faUser } from "@fortawesome/free-solid-svg-icons";
import { AuthGate, AUTH_SESSION_KEY } from "@/app/components/AuthGate";
import { AssignmentSection } from "@/app/components/sections/AssignmentSection";
import { DashboardSection } from "@/app/components/sections/DashboardSection";
import { EvaluationSection } from "@/app/components/sections/EvaluationSection";
import { MaterialSection } from "@/app/components/sections/MaterialSection";
import { VideoSection } from "@/app/components/sections/VideoSection";
import {
  slides as initialSlides,
  videos as initialVideos,
  documentMaterials as initialDocumentMaterials,
  assignments as initialAssignments,
  evaluationQuestions as initialEvaluationQuestions,
  type Slide,
  type VideoItem,
  type DocumentMaterial,
  type AssignmentItem,
  type EvaluationQuestion,
} from "@/app/lib/data";

import {
  loadPlatformContentFromSupabase,
  loadPlatformStateFromSupabase,
  savePlatformStateToSupabase,
  syncPlatformContentToSupabase,
  loadRegisteredStudentsFromSupabase,
  loadEvaluationResultsFromSupabase,
  loadAssignmentSubmissionsFromSupabase,
  deleteVideoFromSupabase,
  saveStudentsToSupabase,
  type EvaluationResultItem,
  type AssignmentSubmissionItem,
} from "@/app/lib/supabase-service";

type Role = "siswa" | "guru";
type TabId = "materi" | "video" | "tugas" | "evaluasi" | "dashboard";
type StudentItem = { id: string; name: string; email: string; status: string; progress: number };

export function LearningPlatform() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("Pengguna");
  const [role, setRole] = useState<Role>("siswa");
  const [activeTab, setActiveTab] = useState<TabId>("materi");
  const [showMaterialIntro, setShowMaterialIntro] = useState(true);
  const [currentView, setCurrentView] = useState<"home" | "app">("home");

  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
  const [documentMaterials, setDocumentMaterials] = useState<DocumentMaterial[]>(initialDocumentMaterials);
  const [assignments, setAssignments] = useState<AssignmentItem[]>(initialAssignments);
  const [evaluationQuestions, setEvaluationQuestions] = useState<EvaluationQuestion[]>(initialEvaluationQuestions);
  const [students, setStudents] = useState<Array<{ id: string; name: string; email: string; status: string; progress: number }>>([]);
  const [materialQuizQuestionIds, setMaterialQuizQuestionIds] = useState<string[]>([]);
  const [completedSlideIds, setCompletedSlideIds] = useState<string[]>([]);
  const [learningScore, setLearningScore] = useState(0);
  const [completedActivities, setCompletedActivities] = useState(0);
  const [className, setClassName] = useState("Kelas Digital Interaktif");
  const [classDescription, setClassDescription] = useState("Memahami konsep dasar, membangun proyek modern, dan memperkuat keterampilan praktis.");
  const [classIntroHighlights, setClassIntroHighlights] = useState<string[]>(["Materi real-world", "Latihan interaktif", "Umpan balik langsung"]);
  const [classCpPoints, setClassCpPoints] = useState<string[]>(["Memahami struktur halaman web", "Menguasai layout responsif", "Menyelesaikan tugas pengembangan mandiri"]);
  const [classAtpSteps, setClassAtpSteps] = useState<string[]>(["Buka ringkasan kelas", "Pelajari video dan slide", "Kerjakan tugas dan evaluasi"]); 
  const [isHydrated, setIsHydrated] = useState(false);
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; category: string; target: string; createdAt: string; read?: boolean }>>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResultItem[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmissionItem[]>([]);
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [darkMode, setDarkMode] = useState(false);

  const handleAuthenticated = (authenticatedRole: Role, authenticatedName: string) => {
    setRole(authenticatedRole);
    setUserName(authenticatedName);
    setIsAuthenticated(true);
    setCurrentView("home");
    setActiveTab(authenticatedRole === "guru" ? "dashboard" : "materi");
  };

  const handleOpenTrack = (tab: TabId) => {
    setCurrentView("app");
    setActiveTab(tab);
    setShowMaterialIntro(tab === "materi");
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
    }
    setIsAuthenticated(false);
    setRole("siswa");
    setUserName("Pengguna");
    setActiveTab("materi");
    setShowMaterialIntro(true);
    setCurrentView("home");
    setShowNotifications(false);
    setShowLogoutConfirm(false);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleStartLearning = () => {
    setCurrentView("app");
    setActiveTab("materi");
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;

    const tabParam = searchParams?.get("tab") as TabId | null;
    if (tabParam && ["materi", "video", "tugas", "evaluasi", "dashboard"].includes(tabParam)) {
      setActiveTab(tabParam);
      setShowMaterialIntro(tabParam === "materi");
    }
  }, [isHydrated, searchParams]);

  const STORAGE_KEY = "media-interaktif-state-v2";
  const NOTIFICATION_STORAGE_KEY = "media-notifications-v1";

  const applyPersistedState = (parsed: any) => {
    if (!parsed) return;
    if (parsed.className !== undefined) setClassName(parsed.className);
    if (parsed.classDescription !== undefined) setClassDescription(parsed.classDescription);
    if (parsed.classIntroHighlights !== undefined) setClassIntroHighlights(parsed.classIntroHighlights);
    if (parsed.classCpPoints !== undefined) setClassCpPoints(parsed.classCpPoints);
    if (parsed.classAtpSteps !== undefined) setClassAtpSteps(parsed.classAtpSteps);
    if (parsed.slides !== undefined) setSlides((s) => mergeSlides(parsed.slides));
    if (parsed.videos !== undefined) setVideos(parsed.videos);
    if (parsed.documentMaterials !== undefined) setDocumentMaterials(parsed.documentMaterials);
    if (parsed.assignments !== undefined) setAssignments(parsed.assignments);
    if (parsed.evaluationQuestions !== undefined) setEvaluationQuestions(normalizeEvaluationQuestions(parsed.evaluationQuestions));
    if (parsed.students !== undefined) setStudents(parsed.students);
    if (parsed.materialQuizQuestionIds !== undefined) setMaterialQuizQuestionIds(parsed.materialQuizQuestionIds);
    if (parsed.completedSlideIds !== undefined) setCompletedSlideIds(parsed.completedSlideIds);
    if (parsed.currentView !== undefined) setCurrentView(parsed.currentView);
    if (parsed.activeTab !== undefined) setActiveTab(parsed.activeTab);
    if (parsed.showMaterialIntro !== undefined) setShowMaterialIntro(parsed.showMaterialIntro);
    if (parsed.role !== undefined) setRole(parsed.role);
    if (parsed.learningScore !== undefined) setLearningScore(parsed.learningScore);
    if (parsed.completedActivities !== undefined) setCompletedActivities(parsed.completedActivities);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadState = async () => {
      try {
        const storedSession = window.localStorage.getItem(AUTH_SESSION_KEY);
        if (storedSession) {
          try {
            const parsed = JSON.parse(storedSession) as { role?: Role; name?: string };
            const resolvedRole: Role = parsed.role === "guru" ? "guru" : "siswa";
            setRole(resolvedRole);
            setUserName(parsed.name ?? "Pengguna");
            setIsAuthenticated(true);
            setActiveTab(resolvedRole === "guru" ? "dashboard" : "materi");
          } catch {
            window.localStorage.removeItem(AUTH_SESSION_KEY);
          }
        }

        const supabaseState = await loadPlatformContentFromSupabase();
        if (supabaseState) {
          applyPersistedState(supabaseState);
        } else {
          const legacyState = await loadPlatformStateFromSupabase();
          if (legacyState) {
            applyPersistedState(legacyState);
          } else {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (stored) {
              try {
                applyPersistedState(JSON.parse(stored));
              } catch {
                window.localStorage.removeItem(STORAGE_KEY);
              }
            }
          }
        }

        const storedNotifications = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
        if (storedNotifications) {
          try {
            const parsed = JSON.parse(storedNotifications);
            if (Array.isArray(parsed)) setNotifications(parsed.slice(0, 20));
          } catch {}
        }

        setIsHydrated(true);
        // Ensure registered students from Supabase are loaded when available
        try {
          const registered = await loadRegisteredStudentsFromSupabase();
          if (Array.isArray(registered) && registered.length > 0) {
            // Only initialize students from auth when the local list is still empty.
            // This preserves guru-managed deletions and edits instead of restoring deleted users.
            setStudents((prev) => (prev.length === 0 ? registered : prev));
          }
        } catch (e) {
          // ignore
        }
      } catch (e) {
        console.warn("LearningPlatform: failed to load persisted state", e);
        setIsHydrated(true);
      }
    };

    void loadState();
  }, []);

  useEffect(() => {
    void (async () => {
      const [results, submissions] = await Promise.all([loadEvaluationResultsFromSupabase(), loadAssignmentSubmissionsFromSupabase()]);
      setEvaluationResults(results);
      setAssignmentSubmissions(submissions);
    })();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !isHydrated) return;

    const payload = {
      className,
      classDescription,
      classIntroHighlights,
      classCpPoints,
      classAtpSteps,
      currentView,
      activeTab,
      showMaterialIntro,
      slides,
      videos,
      documentMaterials,
      assignments,
      evaluationQuestions,
      students,
      role,
      materialQuizQuestionIds,
      completedSlideIds,
    } as const;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}

    void (async () => {
      try {
        await savePlatformStateToSupabase(payload as any);
        await syncPlatformContentToSupabase(payload as any);
      } catch (e) {
        console.warn("LearningPlatform: sync to supabase failed", e);
      }
    })();
  }, [slides, videos, documentMaterials, assignments, evaluationQuestions, students, role, materialQuizQuestionIds, completedSlideIds, isHydrated]);

  const mergeSlides = (savedSlides?: Slide[]) => {
    if (!savedSlides) return initialSlides;
    // When persisted state is present, use exactly the saved slides.
    // This ensures deletions are preserved instead of restoring default slides.
    return savedSlides.map((slide) => {
      const original = initialSlides.find((item) => item.id === slide.id);
      return original ? { ...original, ...slide } : slide;
    });
  };

  const normalizeEvaluationQuestions = (questions?: EvaluationQuestion[]) => {
    if (!questions) return initialEvaluationQuestions;
    return questions;
  };

  const addNotification = (payload: { title: string; message: string; category: string; target: string }) => {
    const n = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString(), read: false, ...payload } as any;
    const newNotifications = [n, ...notifications].slice(0, 20);
    setNotifications(newNotifications);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  };

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications.slice(0, 20)));
    } catch {}
  }, [notifications]);

  const handleAddSlide = (payload: Omit<Slide, "id">) => {
    setSlides((prev) => [{ id: `${Date.now()}`, ...payload }, ...prev]);
    addNotification({ title: "Materi baru", message: `Materi ${payload.title} ditambahkan.`, category: "materi", target: "all" });
  };

  const handleAddVideo = (payload: Omit<VideoItem, "id">) => {
    setVideos((prev) => [{ id: `${Date.now()}`, ...payload }, ...prev]);
    addNotification({ title: "Video baru", message: `Video ${payload.title} dipublikasikan.`, category: "video", target: "all" });
  };

  const handleDeleteVideo = (videoId: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
    void (async () => {
      const ok = await deleteVideoFromSupabase(videoId);
      if (!ok) addNotification({ title: "Hapus video gagal", message: `Gagal menghapus video ${videoId} di server.`, category: "video", target: "guru" });
    })();
  };

  const addSlide = (payload: Omit<Slide, "id">) => {
    setSlides((prev) => [{ id: `slide-${Date.now()}`, ...payload }, ...prev]);
  };

  const updateSlide = (slideId: string, payload: Partial<Slide>) => {
    setSlides((prev) => prev.map((slide) => (slide.id === slideId ? { ...slide, ...payload } : slide)));
  };

  const deleteSlide = (slideId: string) => {
    setSlides((prev) => prev.filter((slide) => slide.id !== slideId));
  };

  const addVideo = (payload: Omit<VideoItem, "id">) => {
    setVideos((prev) => [{ id: `video-${Date.now()}`, ...payload }, ...prev]);
  };

  const updateVideo = (videoId: string, payload: Partial<VideoItem>) => {
    setVideos((prev) => prev.map((video) => (video.id === videoId ? { ...video, ...payload } : video)));
  };

  const addDocumentMaterial = (payload: Omit<DocumentMaterial, "id">) => {
    setDocumentMaterials((prev) => [{ id: `doc-${Date.now()}`, ...payload }, ...prev]);
  };

  const updateDocumentMaterial = (documentId: string, payload: Partial<DocumentMaterial>) => {
    setDocumentMaterials((prev) => prev.map((doc) => (doc.id === documentId ? { ...doc, ...payload } : doc)));
  };

  const deleteDocumentMaterial = (documentId: string) => {
    setDocumentMaterials((prev) => prev.filter((doc) => doc.id !== documentId));
  };

  const addAssignment = (payload: Omit<AssignmentItem, "id">) => {
    setAssignments((prev) => [{ id: `assignment-${Date.now()}`, ...payload }, ...prev]);
  };

  const updateAssignment = (assignmentId: string, payload: Partial<AssignmentItem>) => {
    setAssignments((prev) => prev.map((assignment) => (assignment.id === assignmentId ? { ...assignment, ...payload } : assignment)));
  };

  const deleteAssignment = (assignmentId: string) => {
    setAssignments((prev) => prev.filter((assignment) => assignment.id !== assignmentId));
  };

  const addEvaluationQuestion = (payload: Omit<EvaluationQuestion, "id">) => {
    setEvaluationQuestions((prev) => [{ id: `eval-${Date.now()}`, ...payload }, ...prev]);
  };

  const updateEvaluationQuestion = (evaluationId: string, payload: Partial<EvaluationQuestion>) => {
    setEvaluationQuestions((prev) => prev.map((question) => (question.id === evaluationId ? { ...question, ...payload } : question)));
  };

  const deleteEvaluationQuestion = (evaluationId: string) => {
    setEvaluationQuestions((prev) => prev.filter((question) => question.id !== evaluationId));
  };

  const addStudent = (payload: Omit<StudentItem, "id" | "progress">) => {
    const nextStudents = [{ id: `student-${Date.now()}`, progress: 0, ...payload }, ...students];
    setStudents(nextStudents);
    void saveStudentsToSupabase(nextStudents);
  };

  const updateStudent = (studentId: string, payload: Partial<StudentItem>) => {
    const nextStudents = students.map((student) => (student.id === studentId ? { ...student, ...payload } : student));
    setStudents(nextStudents);
    void saveStudentsToSupabase(nextStudents);
  };

  const deleteStudent = (studentId: string) => {
    const nextStudents = students.filter((student) => student.id !== studentId);
    setStudents(nextStudents);
    void saveStudentsToSupabase(nextStudents);
  };

  const updateStudentProgress = (studentId: string, delta: number) => {
    setStudents((prev) => prev.map((student) => (student.id === studentId ? { ...student, progress: Math.max(0, student.progress + delta) } : student)));
  };

  const updateMaterialQuizQuestionIds = (questionIds: string[]) => {
    setMaterialQuizQuestionIds(questionIds);
  };

  const handleMarkSlideComplete = (slideId: string) => {
    setCompletedSlideIds((prev) => (prev.includes(slideId) ? prev : [...prev, slideId]));
  };

  const onNext = () => {
    setActiveSlide((prev) => Math.min(prev + 1, slides.length - 1));
  };

  const onPrev = () => {
    setActiveSlide((prev) => Math.max(prev - 1, 0));
  };

  const progress = useMemo(() => {
    const completed = completedSlideIds.length;
    return { percent: slides.length > 0 ? Math.round((completed / slides.length) * 100) : 0, label: `${completed} dari ${slides.length} slide selesai` };
  }, [completedSlideIds.length, slides.length]);

  const studentProgressAverage = useMemo(() => {
    if (students.length === 0) return 0;
    return Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length);
  }, [students]);

  if (!isHydrated) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950" />;
  }

  if (!isAuthenticated) return <AuthGate onAuthenticated={handleAuthenticated} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-[2rem] border border-slate-200 bg-white/92 p-4 shadow-2xl shadow-slate-200/30 backdrop-blur transition duration-300 dark:border-slate-800 dark:bg-slate-950/95 dark:shadow-slate-950/40 sm:p-6">
        <div className="flex flex-col gap-6 xl:gap-8">
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-sm shadow-slate-200/20 dark:bg-white/10 dark:text-white">
                <img src="/upgrisba-logo.png" alt="UPGRISBA Logo" className="h-10 w-10 object-contain" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-indigo-600 dark:text-indigo-300">Media Interaktif</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Selamat datang, {role === "guru" ? "Guru" : "Siswa"}</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 lg:order-3 lg:flex-row lg:items-center lg:justify-end">
              <div className="hidden items-center gap-3 lg:flex">
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className="group inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 text-slate-700 shadow-sm transition-all duration-500 ease-in-out hover:-translate-y-0.5 hover:shadow-2xl hover:from-slate-200 hover:via-slate-300 hover:to-slate-200 active:scale-95 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-slate-200 dark:hover:from-slate-800 dark:hover:via-slate-700 dark:hover:to-slate-800"
                  aria-label={darkMode ? "Light mode" : "Dark mode"}
                >
                  <FontAwesomeIcon icon={darkMode ? faSun : faMoon} className="h-5 w-5 transition-transform duration-500 ease-in-out group-hover:rotate-12" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotifications((prev) => !prev)}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-lg active:scale-95 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                  aria-label="Notifikasi"
                >
                  <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </button>
                <Link
                  href="/profile"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-lg active:scale-95 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                  aria-label="Profil pengguna"
                >
                  <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
                </Link>
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-lg active:scale-95 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                  aria-label="Keluar"
                >
                  <FontAwesomeIcon icon={faRightFromBracket} className="h-5 w-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900 lg:hidden"
                aria-label="Buka menu aksi"
                aria-expanded={isMobileMenuOpen}
              >
                <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="h-5 w-5 transition-transform duration-300" />
              </button>
            </div>

            {role !== "guru" ? (
              <div className="order-3 flex justify-center lg:absolute lg:left-1/2 lg:top-1/2 lg:inline-flex lg:-translate-x-1/2 lg:-translate-y-1/2 lg:items-center">
                <div className="flex min-w-0 flex-wrap justify-center items-center gap-2 overflow-x-auto py-2 sm:gap-3 lg:py-0">
                  {[
                    { id: "materi", label: "Materi", icon: "fa-book-open" },
                    { id: "video", label: "Video", icon: "fa-video" },
                    { id: "tugas", label: "Tugas", icon: "fa-clipboard-list" },
                    { id: "evaluasi", label: "Evaluasi", icon: "fa-chart-line" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleOpenTrack(tab.id as TabId)}
                      className={`inline-flex h-11 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition duration-300 ease-out ${activeTab === tab.id ? "border-transparent bg-blue-600 text-white shadow-lg shadow-blue-500/15" : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:bg-slate-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"}`}
                    >
                      <i className={`fa-solid ${tab.icon} mr-2 text-base`} aria-hidden="true" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {isMobileMenuOpen ? (
            <div className="mt-4 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-200/20 backdrop-blur-xl transition duration-300 ease-out dark:border-slate-800 dark:bg-slate-950/95 dark:shadow-slate-950/40 lg:hidden">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    toggleDarkMode();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-100 to-white px-4 py-4 text-left text-sm font-semibold text-slate-900 shadow-sm transition duration-300 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 dark:text-slate-100 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-3xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/10">
                      <FontAwesomeIcon icon={darkMode ? faSun : faMoon} className="h-5 w-5" />
                    </span>
                    Dark mode
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{darkMode ? "Aktif" : "Mati"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications((prev) => !prev);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-100 to-white px-4 py-4 text-left text-sm font-semibold text-slate-900 shadow-sm transition duration-300 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 dark:text-slate-100 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-3xl bg-amber-500 text-white shadow-lg shadow-amber-500/10">
                      <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
                    </span>
                    Notifikasi
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{unreadCount > 0 ? `${unreadCount} baru` : "Tidak ada"}</span>
                </button>

                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex w-full items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-100 to-white px-4 py-4 text-left text-sm font-semibold text-slate-900 shadow-sm transition duration-300 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 dark:text-slate-100 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-lg shadow-slate-900/10">
                      <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
                    </span>
                    Profil saya
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Buka</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    confirmLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-100 to-white px-4 py-4 text-left text-sm font-semibold text-slate-900 shadow-sm transition duration-300 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 dark:text-slate-100 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-3xl bg-rose-500 text-white shadow-lg shadow-rose-500/10">
                      <FontAwesomeIcon icon={faRightFromBracket} className="h-5 w-5" />
                    </span>
                    Keluar
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Logout</span>
                </button>
              </div>
            </div>
          ) : showNotifications && (
            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/20 dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/40">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifikasi</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Semua notifikasi terbaru Anda.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    Tandai semua dibaca
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    Tutup
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                    Belum ada notifikasi.
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{notification.title}</p>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{notification.message}</p>
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{notification.category}</span>
                      </div>
                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(notification.createdAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm animate-modal-overlay"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-50 p-6 shadow-2xl shadow-slate-950/30 dark:border-slate-700 dark:bg-slate-950 animate-modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Konfirmasi Logout</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">Yakin ingin keluar?</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                aria-label="Tutup konfirmasi logout"
              >
                ✕
              </button>
            </div>
            <p className="mb-6 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Kamu akan keluar dari sesi ini dan harus masuk kembali untuk melanjutkan. Pastikan semua pekerjaan tersimpan.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition duration-300 ease-out hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/20 transition duration-300 ease-out hover:brightness-110 active:scale-95"
              >
                Keluar Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1400px] space-y-8">
        {role === "guru" ? (
          <DashboardSection
            role={role}
            onRoleChange={setRole}
            className={className}
            classDescription={classDescription}
            onClassChange={(name, description) => {
              setClassName(name);
              setClassDescription(description);
            }}
            classIntroHighlights={classIntroHighlights}
            classCpPoints={classCpPoints}
            classAtpSteps={classAtpSteps}
            onUpdateClassIntroContent={(payload) => {
              if (payload.highlights !== undefined) setClassIntroHighlights(payload.highlights);
              if (payload.cpPoints !== undefined) setClassCpPoints(payload.cpPoints);
              if (payload.atpSteps !== undefined) setClassAtpSteps(payload.atpSteps);
            }}
            slides={slides}
            videos={videos}
            documentMaterials={documentMaterials}
            assignments={assignments}
            evaluationQuestions={evaluationQuestions}
            students={students}
            evaluationResults={evaluationResults}
            assignmentSubmissions={assignmentSubmissions}
            studentProgressAverage={studentProgressAverage}
            onAddSlide={addSlide}
            onAddVideo={addVideo}
            onAddDocumentMaterial={addDocumentMaterial}
            onAddAssignment={addAssignment}
            onAddEvaluation={addEvaluationQuestion}
            onUpdateMaterialQuiz={updateMaterialQuizQuestionIds}
            onAddStudent={addStudent}
            onUpdateSlide={updateSlide}
            onDeleteSlide={deleteSlide}
            onUpdateVideo={updateVideo}
            onDeleteVideo={handleDeleteVideo}
            onUpdateDocumentMaterial={updateDocumentMaterial}
            onDeleteDocumentMaterial={deleteDocumentMaterial}
            onUpdateAssignment={updateAssignment}
            onDeleteAssignment={deleteAssignment}
            onUpdateEvaluation={updateEvaluationQuestion}
            onDeleteEvaluation={deleteEvaluationQuestion}
            onUpdateStudent={updateStudent}
            onDeleteStudent={deleteStudent}
            onUpdateStudentProgress={updateStudentProgress}
            materialQuizQuestionIds={materialQuizQuestionIds}
            onResetToDefault={() => {
              setSlides(initialSlides);
              setVideos(initialVideos);
              setDocumentMaterials(initialDocumentMaterials);
              setAssignments(initialAssignments);
              setEvaluationQuestions(initialEvaluationQuestions);
              setStudents([]);
              setMaterialQuizQuestionIds([]);
            }}
            onExportData={() => {
              const payload = { slides, videos, documentMaterials, assignments, evaluationQuestions, students, materialQuizQuestionIds };
              const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "platform-export.json";
              link.click();
              URL.revokeObjectURL(url);
            }}
            onImportData={(file) => {
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const imported = JSON.parse(reader.result as string);
                  if (imported.slides) setSlides(imported.slides);
                  if (imported.videos) setVideos(imported.videos);
                  if (imported.documentMaterials) setDocumentMaterials(imported.documentMaterials);
                  if (imported.assignments) setAssignments(imported.assignments);
                  if (imported.evaluationQuestions) setEvaluationQuestions(imported.evaluationQuestions);
                  if (imported.students) setStudents(imported.students);
                  if (imported.materialQuizQuestionIds) setMaterialQuizQuestionIds(imported.materialQuizQuestionIds);
                } catch (error) {
                  console.error("import failed", error);
                }
              };
              reader.readAsText(file);
            }}
            onReactivateExam={() => {
              setEvaluationQuestions((prev) => prev.map((question) => ({ ...question })));
            }}
            examResetKey={0}
          />
        ) : currentView === "home" ? (
          <div className="space-y-8 pb-12">
            <section className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl shadow-slate-950/40 dark:border-slate-700 sm:p-8">
              <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div className="space-y-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Selamat datang di kelas</p>
                  <h1 className="text-4xl font-black leading-tight md:text-5xl">{className}</h1>
                  <p className="max-w-2xl text-slate-200 text-lg leading-relaxed">{classDescription}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur">
                      <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Durasi & Target</p>
                      <p className="mt-3 text-3xl font-bold">Cepat, jelas, profesional</p>
                      <p className="mt-2 text-sm text-slate-300">Pelajari materi, tonton video penjelasan, lalu tingkatkan hasil evaluasi Anda.</p>
                    </div>
                    <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur">
                      <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Progres kelas</p>
                      <p className="mt-3 text-3xl font-bold">{students.length > 0 ? `${Math.round(studentProgressAverage)}%` : "Belum aktif"}</p>
                      <p className="mt-2 text-sm text-slate-300">Rata-rata capaian siswa saat ini.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 rounded-[2rem] border border-cyan-500/20 bg-slate-950/80 p-5 shadow-2xl shadow-cyan-500/5 sm:p-6 lg:sticky lg:top-24">
                  <div className="flex items-center justify-between rounded-3xl bg-slate-900/90 p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Status</p>
                      <p className="mt-2 text-xl font-black">Siswa</p>
                    </div>
                    <div className="h-12 w-12 rounded-3xl bg-cyan-500/15 text-cyan-200 flex items-center justify-center text-xl font-black">S</div>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-300">
                      <p className="font-semibold text-slate-100">CP Utama</p>
                      <p className="mt-2 text-slate-300">Apa yang akan dicapai dalam pembelajaran ini.</p>
                    </div>
                    <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-300">
                      <p className="font-semibold text-slate-100">ATP Utama</p>
                      <p className="mt-2 text-slate-300">Langkah logis untuk memulai dan menyelesaikan kelas.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/10 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Fokus Pembelajaran</p>
                <h2 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">Capaian Pembelajaran (CP)</h2>
                <div className="mt-5 space-y-3">
                  {classCpPoints.map((point) => (
                    <div key={point} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                      {point}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/10 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Highlights</p>
                <h2 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">Kenapa kelas ini?</h2>
                <div className="mt-5 space-y-3">
                  {classIntroHighlights.map((highlight) => (
                    <div key={highlight} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                      {highlight}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/10 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">Langkah Awal</p>
                <h2 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">ATP Kelas</h2>
                <div className="mt-5 space-y-3">
                  {classAtpSteps.map((step, index) => (
                    <div key={step} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                      <span className="font-semibold">{index + 1}.</span> {step}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/10 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Rangkuman interaktif</p>
                  <h2 className="mt-3 text-3xl font-black text-slate-900 dark:text-white">Selami kelas dengan percaya diri</h2>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Mulai dengan ringkasan materi, lanjutkan dengan video pembelajaran, kemudian kerjakan tugas dan evaluasi secara terstruktur.</p>
                </div>
                <button
                  type="button"
                  onClick={handleStartLearning}
                  className="inline-flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 text-base font-bold text-white shadow-xl shadow-cyan-500/20 transition hover:scale-[1.01] hover:brightness-110 sm:w-auto"
                >
                  Mulai Pembelajaran
                </button>
              </div>
            </section>
          </div>
        ) : (
          <>
            {activeTab === "materi" && (
              <MaterialSection
                slides={slides}
                documentMaterials={documentMaterials}
                evaluationQuestions={evaluationQuestions}
                materialQuizQuestionIds={materialQuizQuestionIds}
                role={role}
                activeSlide={activeSlide}
                progress={progress}
                completedSlideIds={completedSlideIds}
                onSelectSlide={(index) => setActiveSlide(index)}
                onNext={onNext}
                onPrev={onPrev}
                onProgressUpdate={(delta) => setLearningScore((p) => p + delta)}
                onMarkSlideComplete={handleMarkSlideComplete}
              />
            )}

            {activeTab === "video" && <VideoSection videos={videos} onProgressUpdate={() => {}} />}
            {activeTab === "tugas" && <AssignmentSection assignments={assignments} onNotify={() => {}} onProgressUpdate={() => {}} />}
            {activeTab === "evaluasi" && <EvaluationSection questions={evaluationQuestions} resetKey={0} onNotify={() => {}} onProgressUpdate={() => {}} />}
          </>
        )}
      </main>
    </div>
  );
}
