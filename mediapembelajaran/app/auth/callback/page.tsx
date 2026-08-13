"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AUTH_SESSION_KEY } from "@/app/components/AuthGate";
import { supabase } from "@/app/lib/supabase";
import {
  loadUserProfileFromSupabase,
  syncAuthUserToSupabase,
} from "@/app/lib/supabase-service";

type UserProfile = {
  role?: "guru" | "siswa";
  name?: string;
  email?: string;
};

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const finalizeSession = async () => {
      try {
        const searchParams = new URLSearchParams(
          window.location.search,
        );

        const hashParams = new URLSearchParams(
          window.location.hash.substring(1),
        );

        const code =
          searchParams.get("code") ||
          hashParams.get("code");

        const accessToken =
          hashParams.get("access_token");

        const refreshToken =
          hashParams.get("refresh_token");

        const errorCode =
          searchParams.get("error");

        const errorDescription =
          searchParams.get("error_description");

        /*
         * Jika OAuth mengembalikan error,
         * hentikan proses login.
         */
        if (errorCode) {
          throw new Error(
            errorDescription || errorCode,
          );
        }

        /*
         * Ambil session Supabase.
         */
        let session = null;

        /*
         * Kasus 1:
         * Login menggunakan authorization code.
         */
        if (code) {
          const result =
            await supabase?.auth.exchangeCodeForSession(
              code,
            );

          if (result?.error) {
            throw result.error;
          }

          session = result?.data?.session ?? null;
        }

        /*
         * Kasus 2:
         * Login menggunakan access token + refresh token.
         */
        else if (accessToken && refreshToken) {
          const result =
            await supabase?.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

          if (result?.error) {
            throw result.error;
          }

          session = result?.data?.session ?? null;
        }

        /*
         * Kasus 3:
         * Coba ambil session yang sudah tersimpan.
         */
        else {
          const result =
            await supabase?.auth.getSession();

          if (result?.error) {
            throw result.error;
          }

          session = result?.data?.session ?? null;
        }

        /*
         * Pastikan user berhasil login.
         */
        if (session?.user) {
          const user = session.user;

          /*
           * FIX TYPE ERROR:
           *
           * Hasil loadUserProfileFromSupabase
           * dipastikan memiliki bentuk object profile.
           *
           * "unknown" digunakan terlebih dahulu supaya
           * TypeScript tidak menganggap hasilnya sebagai never.
           */
          const profile =
            (await loadUserProfileFromSupabase(
              user.email ?? "",
            )) as unknown as UserProfile | null;

          /*
           * Role default adalah "siswa".
           */
          const role: "guru" | "siswa" =
            profile?.role === "guru"
              ? "guru"
              : "siswa";

          /*
           * Tentukan nama user.
           *
           * Prioritas:
           * 1. full_name dari metadata Google
           * 2. nama dari profile Supabase
           * 3. bagian sebelum @ dari email
           * 4. "Pengguna"
           */
          const userName = String(
            user.user_metadata?.full_name ||
              profile?.name ||
              user.email?.split("@")[0] ||
              "Pengguna",
          );

          /*
           * Email user.
           */
          const userEmail = String(
            user.email ??
              profile?.email ??
              "",
          );

          /*
           * Sinkronisasi user authentication
           * dengan data user di Supabase.
           */
          await syncAuthUserToSupabase({
            id: String(user.id),
            name: userName,
            email: userEmail,
            role,
          });

          /*
           * Simpan session sederhana ke localStorage
           * agar AuthGate dapat membacanya.
           */
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              AUTH_SESSION_KEY,
              JSON.stringify({
                role,
                name: userName,
                email: userEmail,
              }),
            );

            /*
             * Bersihkan hash OAuth dari URL.
             */
            window.history.replaceState(
              null,
              "",
              window.location.pathname +
                window.location.search,
            );
          }

          /*
           * Login berhasil.
           * Kembali ke halaman utama.
           */
          router.replace("/");
        } else {
          /*
           * Tidak ada session.
           * Kembali ke halaman utama.
           */
          router.replace("/");
        }
      } catch (error) {
        /*
         * Jika proses callback gagal,
         * kembali ke halaman utama.
         *
         * Error dicatat di console agar
         * mudah diperiksa saat development.
         */
        console.error(
          "Auth callback error:",
          error,
        );

        router.replace("/");
      }
    };

    void finalizeSession();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/10 px-6 py-5 text-center backdrop-blur">
        <p className="text-lg font-semibold">
          Menyelesaikan login Google...
        </p>

        <p className="mt-2 text-sm text-slate-300">
          Mohon tunggu sebentar.
        </p>
      </div>
    </main>
  );
}
