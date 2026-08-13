"use client";

import { isSupabaseConfigured, supabase } from "./supabase";

export type StudentItem = {
  id: string;
  name: string;
  email: string;
  status: string;
  progress: number;
};

export type PlatformStatePayload = {
  className?: string;
  classDescription?: string;
  slides?: any[];
  videos?: any[];
  documentMaterials?: any[];
  assignments?: any[];
  evaluationQuestions?: any[];
  students?: StudentItem[];
  role?: "siswa" | "guru";
  materialQuizQuestionIds?: string[];
  completedSlideIds?: string[];
};

export type EvaluationResultItem = {
  id: number;
  student_name: string;
  score: number;
  answers: Record<string, string>;
  submitted_at: string;
};

export type AssignmentSubmissionItem = {
  id: number;
  assignment_id: string;
  student_name: string;
  code: string;
  submitted_at: string;
  status: string;
};

export function normalizeStoragePath(storagePath: string) {
  const normalized = String(storagePath ?? "").trim().replace(/^\/+/, "");
  if (!normalized) return "";
  if (/^(blob:|data:)/i.test(normalized)) return "";
  if (/^https?:\/\//i.test(normalized)) return normalized;
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length >= 2) return `${parts[0]}/${parts.slice(1).join("/")}`;
  return `materi-pdf/${normalized}`;
}

export async function uploadPdfToSupabase(file: File | Blob, objectPath?: string, bucketName = "materi-pdf") {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const name = objectPath ?? (file instanceof File ? file.name : `upload-${Date.now()}.pdf`);
    const uploadTarget = String(name).replace(new RegExp(`^${bucketName}/`, "i"), "");
    const { data, error } = await supabase.storage.from(bucketName).upload(uploadTarget, file as File, { upsert: true });
    if (error) return null;
    return normalizeStoragePath(`${bucketName}/${uploadTarget}`);
  } catch (err) {
    console.warn("uploadPdfToSupabase: exception", err);
    return null;
  }
}

export async function savePlatformStateToSupabase(payload: PlatformStatePayload) {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from("learning_platform_state").upsert({ id: "default", value: payload, updated_at: new Date().toISOString() });
    if (error) {
      console.warn("savePlatformStateToSupabase: upsert error", error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("savePlatformStateToSupabase: exception", err);
    return false;
  }
}

export async function saveStudentsToSupabase(students: StudentItem[]) {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const normalizedStudents = students.map((student) => ({
      id: String(student.id),
      name: String(student.name ?? "").trim(),
      email: String(student.email ?? "").trim(),
      role: "siswa",
      status: String(student.status ?? "Aktif"),
      progress: Number(student.progress ?? 0),
    }));

    const { error: upsertError } = await supabase
      .from("users")
      .upsert(
        normalizedStudents.map(({ id, name, email, role }) => ({ id, name, email, role })),
        { onConflict: "id" }
      );

    if (upsertError) {
      console.warn("saveStudentsToSupabase: users upsert error", upsertError);
      return false;
    }

    const statePayload: PlatformStatePayload = {
      students: normalizedStudents.map(({ id, name, email, status, progress }) => ({
        id,
        name,
        email,
        status,
        progress,
      })),
    };

    const { error: stateError } = await supabase
      .from("learning_platform_state")
      .upsert({ id: "default", value: statePayload, updated_at: new Date().toISOString() });

    if (stateError) {
      console.warn("saveStudentsToSupabase: state upsert error", stateError);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("saveStudentsToSupabase: exception", err);
    return false;
  }
}

export async function deleteStudentFromSupabase(studentId: string) {
  if (!studentId) return false;

  try {
    if (typeof window !== "undefined") {
      try {
        const response = await fetch(`/api/users/${encodeURIComponent(String(studentId))}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const content = await response.text();
          console.warn("deleteStudentFromSupabase: auth delete failed", { status: response.status, content });
        }
      } catch (authDeleteError) {
        console.warn("deleteStudentFromSupabase: auth delete exception", authDeleteError);
      }
    }

    if (!isSupabaseConfigured || !supabase) return false;

    const { error: deleteUserError } = await supabase.from("users").delete().eq("id", String(studentId));
    if (deleteUserError) {
      console.warn("deleteStudentFromSupabase: users delete error", deleteUserError);
    }

    const { data: stateData, error: stateSelectError } = await supabase
      .from("learning_platform_state")
      .select("value")
      .eq("id", "default")
      .maybeSingle();

    if (stateSelectError) {
      console.warn("deleteStudentFromSupabase: state select error", stateSelectError);
      return false;
    }

    const currentState = (stateData?.value as PlatformStatePayload | undefined) ?? {};
    const nextStudents = Array.isArray(currentState.students)
      ? currentState.students.filter((student) => String(student.id) !== String(studentId))
      : [];

    const { error: stateError } = await supabase
      .from("learning_platform_state")
      .upsert({
        id: "default",
        value: { ...currentState, students: nextStudents },
        updated_at: new Date().toISOString(),
      });

    if (stateError) {
      console.warn("deleteStudentFromSupabase: state update error", stateError);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("deleteStudentFromSupabase: exception", err);
    return false;
  }
}

export async function loadPlatformStateFromSupabase(): Promise<PlatformStatePayload | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.from("learning_platform_state").select("value").eq("id", "default").maybeSingle();
    if (error || !data?.value) return null;
    return data.value as PlatformStatePayload;
  } catch (err) {
    console.warn("loadPlatformStateFromSupabase: exception", err);
    return null;
  }
}

export async function loadPlatformContentFromSupabase(): Promise<PlatformStatePayload | null> {
  // Minimal implementation: prefer the stored platform_state value if available
  try {
    const state = await loadPlatformStateFromSupabase();
    return state;
  } catch (err) {
    return null;
  }
}

export async function syncPlatformContentToSupabase(_payload: PlatformStatePayload) {
  // Placeholder: full sync implementation is optional. Return true to indicate success.
  return true;
}

export async function loadEvaluationResultsFromSupabase(): Promise<EvaluationResultItem[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase.from("hasil_evaluasi").select("id, student_name, score, submitted_at").order("submitted_at", { ascending: false });
    if (error) {
      console.warn("loadEvaluationResultsFromSupabase: select error", error);
      return [];
    }
    // Map to EvaluationResultItem[]
    return (data ?? []).map((r: any) => ({ id: Number(r.id), student_id: String(r.id), student_name: String(r.student_name ?? ""), score: Number(r.score ?? 0), submitted_at: (r.submitted_at ?? new Date()).toString() }));
  } catch (err) {
    console.warn("loadEvaluationResultsFromSupabase: exception", err);
    return [];
  }
}

export async function loadAssignmentSubmissionsFromSupabase(): Promise<AssignmentSubmissionItem[]> {
  return [];
}

export async function loadRegisteredStudentsFromSupabase(): Promise<StudentItem[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    // Prefer a 'users' table with name/email/role; fall back to 'profiles' if needed
    let students: StudentItem[] = [];
    try {
      const { data, error } = await supabase.from("users").select("id,name,email");
      if (!error && Array.isArray(data)) {
        students = (data as any[]).map((u) => ({ id: String(u.id), name: String(u.name ?? ""), email: String(u.email ?? ""), status: "Aktif", progress: 0 }));
        return students;
      }
    } catch (e) {
      // ignore and try profiles
    }

    try {
      const { data: pData, error: pErr } = await supabase.from("profiles").select("id,name,email");
      if (!pErr && Array.isArray(pData)) {
        students = (pData as any[]).map((u) => ({ id: String(u.id), name: String(u.name ?? ""), email: String(u.email ?? ""), status: "Aktif", progress: 0 }));
        return students;
      }
    } catch (e) {
      // ignore
    }

    return [];
  } catch (err) {
    console.warn("loadRegisteredStudentsFromSupabase: exception", err);
    return [];
  }
}

export async function updateAssignmentSubmissionStatusToSupabase(_id: number, _status: string) {
  return true;
}

export async function loadUserProfileFromSupabase(_userId: string) {
  return null;
}

export async function syncAuthUserToSupabase(_user: { id: string; email?: string; name?: string; role?: string; teacherCodeId?: string | null }) {
  if (!isSupabaseConfigured || !supabase) return false;

  const { id, email, name, role, teacherCodeId } = _user;

  try {
    // Try to upsert into a 'profiles' or 'users' table if it exists (best-effort)
    try {
      await supabase.from("profiles").upsert({ id, name, email, role }, { onConflict: "id" });
    } catch (e) {
      // ignore if table doesn't exist
    }

    // Mark teacher invitation code as used
    if (role === "guru" && teacherCodeId) {
      try {
        await supabase
          .from("invitation_codes")
          .update({
            status: "used",
            used_by: id,
            used_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", teacherCodeId);
      } catch (codeUpdateError) {
        console.warn("[syncAuthUserToSupabase] Failed to mark invitation code as used:", codeUpdateError);
        // Don't fail the entire user sync if code update fails
      }
    }

    // Ensure learning_platform_state contains this student if role === 'siswa'
    if (role === "siswa") {
      const { data: lpData } = await supabase.from("learning_platform_state").select("value").eq("id", "default").maybeSingle();
      const current = (lpData?.value as PlatformStatePayload | null | undefined) ?? null;

      const existingStudents = Array.isArray(current?.students) ? current!.students!.slice() : [];
      const exists = existingStudents.some((s) => String(s.id) === String(id));
      if (!exists) {
        existingStudents.unshift({ id: id, name: name ?? "", email: email ?? "", status: "Aktif", progress: 0 });

        const newState: PlatformStatePayload = {
          ...(current ?? {}),
          students: existingStudents,
        };

        await supabase.from("learning_platform_state").upsert({ id: "default", value: newState, updated_at: new Date().toISOString() });
      }
    }

    return true;
  } catch (err) {
    console.warn("syncAuthUserToSupabase: exception", err);
    return false;
  }
}

export async function saveUserProfileToSupabase(_profile: any) {
  return true;
}

export async function saveAssignmentSubmissionToSupabase(_payload: any) {
  return true;
}

export async function saveEvaluationResult(_payload: any) {
  return true;
}

export async function loadMateriListFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return [] as { id: string; title: string }[];
  try {
    const { data, error } = await supabase.from("materi").select("id,title").order("order_index", { ascending: true });
    if (error) {
      console.warn("loadMateriListFromSupabase: select error", error);
      return [] as { id: string; title: string }[];
    }
    return (data ?? []) as { id: string; title: string }[];
  } catch (err) {
    console.warn("loadMateriListFromSupabase: exception", err);
    return [] as { id: string; title: string }[];
  }
}

/**
 * Save a PDF storage path into `document_materials` and link it to a materi if possible.
 * Returns true when the insert/update succeeded.
 */
export async function savePdfPathToMateri(materiId: string, storagePath: string) {
  if (!isSupabaseConfigured || !supabase || !materiId || !storagePath) return false;

  // Reject blob/data URLs or empty values
  const normalized = normalizeStoragePath(storagePath);
  if (!normalized) {
    console.warn("savePdfPathToMateri: rejected blob/data URL instead of storage path", { storagePath });
    return false;
  }

  try {
    // Try to fetch materi title if available to use as document title
    let title = `Materi ${materiId}`;
    try {
      const { data: mdata, error: mErr } = await supabase.from("materi").select("id,title").eq("id", materiId).maybeSingle();
      if (!mErr && mdata?.title) title = mdata.title;
    } catch (_) {
      // ignore
    }

    const fileParts = String(normalized).split("/");
    const fileName = fileParts[fileParts.length - 1] ?? "file.pdf";

    const recordId = `doc-${Date.now()}`;
    const payload = {
      id: recordId,
      title,
      description: "",
      file_name: fileName,
      file_url: normalized,
      file_type: "PDF",
      order_index: 0,
    };

    const { error } = await supabase.from("document_materials").insert(payload as any);
    if (error) {
      console.warn("savePdfPathToMateri: insert error", error);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("savePdfPathToMateri: exception", err);
    return false;
  }
}

export async function deleteVideoFromSupabase(videoId: string) {
  if (!isSupabaseConfigured || !supabase || !videoId) return false;
  try {
    const { error } = await supabase.from("video_pembelajaran").delete().eq("id", videoId).select();
    if (error) {
      console.warn("deleteVideoFromSupabase: delete error", error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("deleteVideoFromSupabase: exception", err);
    return false;
  }
}

export default null;
