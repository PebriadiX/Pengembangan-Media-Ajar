"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AUTH_SESSION_KEY } from "@/app/components/AuthGate";
import { supabase } from "@/app/lib/supabase";
import { loadUserProfileFromSupabase, syncAuthUserToSupabase } from "@/app/lib/supabase-service";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const finalizeSession = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const code = searchParams.get("code") || hashParams.get("code");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const errorCode = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (errorCode) {
          throw new Error(errorDescription || errorCode);
        }

        let session = null;

        if (code) {
          const { data, error } = await supabase?.auth.exchangeCodeForSession(code) ?? { data: { session: null }, error: null };
          session = data.session;
          if (error) {
            throw error;
          }
        } else if (accessToken && refreshToken) {
          const { data, error } = await supabase?.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }) ?? { data: { session: null }, error: null };
          session = data.session;
          if (error) {
            throw error;
          }
        } else {
          const { data, error } = await supabase?.auth.getSession() ?? { data: { session: null }, error: null };
          session = data.session;
          if (error) {
            throw error;
          }
        }

        if (session?.user) {
          const user = session.user;
          const profile = await loadUserProfileFromSupabase(user.email ?? "");
          const role = (profile?.role as "guru" | "siswa" | undefined) ?? "siswa";
          const userName = String(user.user_metadata?.full_name || profile?.name || user.email?.split("@")[0] || "Pengguna");
          const userEmail = String(user.email ?? profile?.email ?? "");

          await syncAuthUserToSupabase({
            id: String(user.id),
            name: userName,
            email: userEmail,
            role,
          });

          if (typeof window !== "undefined") {
            window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
              role,
              name: userName,
              email: userEmail,
            }));
            window.location.hash = "";
          }

          router.replace("/");
        } else {
          router.replace("/");
        }
      } catch {
        router.replace("/");
      }
    };

    void finalizeSession();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/10 px-6 py-5 text-center backdrop-blur">
        <p className="text-lg font-semibold">Menyelesaikan login Google...</p>
        <p className="mt-2 text-sm text-slate-300">Mohon tunggu sebentar.</p>
      </div>
    </main>
  );
}
