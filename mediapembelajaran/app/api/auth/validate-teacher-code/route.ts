import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Kode akses tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { success: false, message: "Konfigurasi server tidak lengkap." },
        { status: 500 }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Cari kode akses guru yang valid
    const { data: invitationData, error: queryError } = await adminClient
      .from("invitation_codes")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .eq("status", "active")
      .maybeSingle();

    if (queryError) {
      console.error("[Validate Teacher Code] Query error:", queryError);
      return NextResponse.json(
        { success: false, message: "Terjadi kesalahan saat validasi kode." },
        { status: 500 }
      );
    }

    // Kode tidak ditemukan atau sudah digunakan
    if (!invitationData) {
      return NextResponse.json(
        { success: false, message: "Kode akses guru tidak valid atau sudah digunakan." },
        { status: 403 }
      );
    }

    // Cek apakah kode sudah expired
    if (invitationData.expires_at) {
      const expiryDate = new Date(invitationData.expires_at);
      if (expiryDate < new Date()) {
        return NextResponse.json(
          { success: false, message: "Kode akses guru sudah kadaluarsa." },
          { status: 403 }
        );
      }
    }

    // Kode valid
    return NextResponse.json(
      {
        success: true,
        message: "Kode akses guru valid.",
        codeId: invitationData.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Validate Teacher Code] Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat memvalidasi kode." },
      { status: 500 }
    );
  }
}
