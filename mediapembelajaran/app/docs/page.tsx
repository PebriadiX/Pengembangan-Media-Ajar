import Link from "next/link";

const featurePoints = [
  "Autentikasi sederhana untuk role guru dan siswa",
  "Modul materi, video, tugas, dan evaluasi dalam satu platform",
  "Dashboard admin untuk mengelola konten kelas",
  "Sinkronisasi data lokal dan cloud dengan Supabase",
  "Notifikasi, mode fullscreen, export/import data, dan tema terang/gelap",
];

const technicalPoints = [
  "Frontend: Next.js App Router + React + TypeScript",
  "Styling: Tailwind CSS",
  "Data: localStorage dan Supabase",
  "Arsitektur: komponen terpisah per modul dan service layer untuk data",
];

export default function DocumentationPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">Dokumentasi proyek</p>
            <h1 className="mt-2 text-2xl font-black text-slate-900">Media Pembelajaran</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Platform pembelajaran interaktif yang dirancang untuk menunjang proses belajar dengan modul materi, video, tugas, evaluasi, dan dashboard guru.
            </p>
          </div>
          <Link href="/" className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20">
            Kembali ke aplikasi
          </Link>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <section className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-lg font-extrabold text-slate-900">Tujuan sistem</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Menyediakan ruang belajar digital yang memudahkan guru mengelola konten dan siswa mengakses materi secara terstruktur.
            </p>
          </section>

          <section className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-lg font-extrabold text-slate-900">Fitur utama</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
              {featurePoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-6 rounded-[1.25rem] border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-extrabold text-slate-900">Arsitektur teknis</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
            {technicalPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-[1.25rem] border border-slate-200 bg-indigo-50 p-4 text-slate-700">
          <h2 className="text-lg font-extrabold text-slate-900">Panduan demo sidang</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
            <li>Masuk sebagai guru untuk menampilkan dashboard admin dan fitur manajemen konten kelas.</li>
            <li>Masuk sebagai siswa untuk menampilkan alur belajar materi, video, tugas, dan evaluasi.</li>
            <li>Jelaskan bahwa data bisa tersimpan lokal dan juga disinkronkan ke Supabase.</li>
            <li>Tekankan bahwa sistem ini dapat dikembangkan lebih lanjut menjadi platform pembelajaran yang lebih luas.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}
