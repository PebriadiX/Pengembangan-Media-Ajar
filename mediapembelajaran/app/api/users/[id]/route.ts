import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { success: false, message: "Supabase service role is not configured." },
        { status: 500 }
      );
    }

    const { id } = await context.params;
    const userId = String(id ?? "").trim();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User id is required." },
        { status: 400 }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      console.warn("DELETE /api/users/:id: admin deleteUser error", authDeleteError);
      return NextResponse.json(
        {
          success: false,
          message: authDeleteError.message || "Gagal menghapus akun user dari auth.",
        },
        { status: 500 }
      );
    }

    await adminClient.from("users").delete().eq("id", userId);
    await adminClient.from("profiles").delete().eq("id", userId);

    const { data: stateData, error: stateSelectError } = await adminClient
      .from("learning_platform_state")
      .select("value")
      .eq("id", "default")
      .maybeSingle();

    if (!stateSelectError && stateData?.value) {
      const currentState = stateData.value as { students?: Array<{ id: string }> } | null;
      const nextStudents = Array.isArray(currentState?.students)
        ? currentState.students.filter((student) => String(student.id) !== String(userId))
        : [];

      await adminClient.from("learning_platform_state").upsert({
        id: "default",
        value: {
          ...((currentState ?? {}) as Record<string, unknown>),
          students: nextStudents,
        },
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, deletedUserId: userId });
  } catch (error) {
    console.error("DELETE /api/users/:id: unexpected error", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat menghapus user." },
      { status: 500 }
    );
  }
}
