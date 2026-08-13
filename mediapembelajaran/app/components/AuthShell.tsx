import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.22),_transparent_30%),linear-gradient(135deg,_#020617,_#111827_45%,_#0f172a)] px-3 py-2 sm:px-4">
      <div className="w-full max-w-[28rem] animate-[float_5s_ease-in-out_infinite] overflow-hidden rounded-[0.9rem] border border-white/10 bg-slate-900/80 shadow-[0_10px_28px_rgba(2,6,23,0.28)] backdrop-blur-xl">
        <div className="grid gap-0 lg:grid-cols-[1fr]">
          <section className="p-2.5 sm:p-3 lg:p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.35em] text-indigo-300">Akses akun</p>
                <h2 className="mt-0.25 text-sm font-black text-white">{title}</h2>
              </div>
            </div>
            <p className="mt-0.75 text-[10px] leading-4 text-slate-300">{subtitle}</p>
            {children}
            <div className="mt-1.5 border-t border-white/10 pt-1 text-[10px] text-slate-400">{footer}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
