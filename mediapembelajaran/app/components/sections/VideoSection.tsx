"use client";

import { useState } from "react";
import type { VideoItem } from "@/app/lib/data";

function getYouTubeEmbedUrl(rawUrl: string) {
  const url = rawUrl.trim();
  if (!url) return url;

  const withProtocol = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

  try {
    const parsed = new URL(withProtocol);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname;

    if (host.includes("youtu.be")) {
      const videoId = pathname.slice(1);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    if (host.includes("youtube.com")) {
      if (pathname.startsWith("/embed/")) {
        return `https://www.youtube.com${pathname}`;
      }
      if (pathname.startsWith("/watch")) {
        const videoId = parsed.searchParams.get("v");
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
      }
      if (pathname.startsWith("/shorts/")) {
        const segments = pathname.split("/");
        const videoId = segments[2];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
      }
    }
  } catch {
    return url;
  }

  return url;
}

type VideoSectionProps = {
  videos: VideoItem[];
  onProgressUpdate?: (delta: number) => void;
};

export function VideoSection({ videos, onProgressUpdate }: VideoSectionProps) {
  const [watchedVideoIds, setWatchedVideoIds] = useState<string[]>([]);
  const [notesByVideo, setNotesByVideo] = useState<Record<string, string>>({});
  const [statusByVideo, setStatusByVideo] = useState<Record<string, string>>({});

  const handleToggleWatched = (videoId: string) => {
    setWatchedVideoIds((prev) => {
      const isWatched = prev.includes(videoId);
      onProgressUpdate?.(isWatched ? 0 : 4);
      const next = isWatched ? prev.filter((id) => id !== videoId) : [...prev, videoId];
      setStatusByVideo((statusPrev) => ({
        ...statusPrev,
        [videoId]: isWatched ? "Status diperbarui: belum ditandai selesai." : "Status diperbarui: video ditandai selesai.",
      }));
      return next;
    });
  };

  const handleSaveNote = (videoId: string) => {
    onProgressUpdate?.(2);
    setStatusByVideo((prev) => ({
      ...prev,
      [videoId]: "Catatan pribadi berhasil disimpan untuk video ini.",
    }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold text-indigo-500">Galeri video pembelajaran</p>
        <h2 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          Materi praktikal dari mentor ahli
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Semua video dapat dipindahkan ke tabel Supabase nanti sebagai sumber data utama.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {videos.map((video) => (
          <article
            key={`video-${video.id}`}
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="aspect-video bg-slate-100 dark:bg-slate-800">
              <iframe
                src={getYouTubeEmbedUrl(video.embedUrl)}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-orange-600 dark:bg-orange-950/40 dark:text-orange-300">
                  {video.tag}
                </span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {video.duration}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-extrabold text-slate-900 dark:text-white">{video.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{video.description}</p>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleWatched(video.id)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${watchedVideoIds.includes(video.id) ? "bg-emerald-600 text-white" : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200"}`}
                  >
                    {watchedVideoIds.includes(video.id) ? "✓ Sudah ditonton" : "Tandai ditonton"}
                  </button>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {watchedVideoIds.includes(video.id) ? "Siap lanjut" : "Belum selesai"}
                  </span>
                </div>

                <textarea
                  value={notesByVideo[video.id] ?? ""}
                  onChange={(event) => setNotesByVideo((prev) => ({ ...prev, [video.id]: event.target.value }))}
                  rows={2}
                  placeholder="Catatan singkat untuk video ini..."
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveNote(video.id)}
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Simpan catatan
                  </button>
                  {statusByVideo[video.id] ? (
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{statusByVideo[video.id]}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
