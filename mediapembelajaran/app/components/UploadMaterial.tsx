"use client";

import { useState } from "react";
import { uploadPdfToSupabase, savePdfPathToMateri, loadMateriListFromSupabase } from "@/app/lib/supabase-service";
import { useEffect } from "react";

export default function UploadMaterial() {
  const [file, setFile] = useState<File | null>(null);
  const [materiId, setMateriId] = useState("");
  const [materiList, setMateriList] = useState<Array<{ id: string; title: string }>>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setStatus("Pilih file PDF terlebih dahulu.");
    if (!materiId) return setStatus("Masukkan ID materi yang ingin dihubungkan.");

    setIsUploading(true);
    setStatus("Mengunggah... Harap tunggu.");

    try {
      const storagePath = await uploadPdfToSupabase(file, undefined, "materi-pdf");
      if (!storagePath) {
        const rlsHint = "Periksa policy bucket `materi-pdf` di Supabase Storage; error RLS/insert biasanya terjadi bila anon key belum diizinkan upload.";
        console.error("[UploadMaterial] PDF upload rejected by Supabase Storage (likely RLS policy).", {
          bucket: "materi-pdf",
          fileName: file.name,
        });
        setStatus(`Gagal mengunggah file ke storage. ${rlsHint}`);
        setIsUploading(false);
        return;
      }

      const saved = await savePdfPathToMateri(materiId, storagePath);
      if (!saved) {
        setStatus("File terunggah, tetapi gagal menyimpan path ke tabel materi.");
        setIsUploading(false);
        return;
      }

      setStatus("Berhasil: file diunggah dan path tersimpan di tabel materi.");
    } catch (err) {
      console.error(err);
      setStatus("Terjadi kesalahan saat mengunggah.");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const list = await loadMateriListFromSupabase();
      if (!mounted) return;
      setMateriList(list);
      if (list.length > 0 && !materiId) setMateriId(list[0].id);
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
      <h3 className="text-lg font-bold">Upload PDF Materi</h3>
      <p className="mt-1 text-sm text-slate-400">Pilih file PDF, masukkan `id` materi dari tabel `materi`, lalu unggah. Sistem akan menyimpan file ke Supabase Storage dan menyimpan path ke tabel.</p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <label className="text-sm text-slate-300">File PDF</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />

        <label className="text-sm text-slate-300">Pilih Materi</label>
        {materiList.length > 0 ? (
          <select value={materiId} onChange={(e) => setMateriId(e.target.value)} className="rounded-2xl bg-slate-800/60 px-3 py-2 text-sm text-slate-200">
            {materiList.map((m) => (
              <option key={m.id} value={m.id}>{m.title} — {m.id}</option>
            ))}
          </select>
        ) : (
          <input value={materiId} onChange={(e) => setMateriId(e.target.value)} placeholder="masukkan id materi" className="rounded-2xl bg-slate-800/60 px-3 py-2 text-sm text-slate-200" />
        )}

        <div className="flex items-center gap-2">
          <button disabled={isUploading} className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {isUploading ? "Mengunggah..." : "Unggah PDF"}
          </button>
          <span className="text-sm text-slate-400">{status}</span>
        </div>
      </form>
    </div>
  );
}
